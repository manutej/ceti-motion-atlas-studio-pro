#!/usr/bin/env node
// brief-check.mjs — machine checks for the motion-brief skill. No dependencies. Node >= 18.
//
//   node skills/motion-brief/scripts/brief-check.mjs <BRIEF.md> <beats.json> [--bible <file>] [--tokens <file>] [--ready]
//   node skills/motion-brief/scripts/brief-check.mjs --hash <character-bible.json>     prints sha256:<hex> of the canonical JSON
//   node skills/motion-brief/scripts/brief-check.mjs --selftest                       base example passes; every mutation is caught
//
// Prints one PASS / FAIL / OPEN / SKIP line per check; exits 1 on any FAIL, 2 on bad usage.
// --ready: an OPEN line in sections 4-7 fails (motion-soup's FS gates cannot run on an open bible, board, text plan or ladder).
// The bible path defaults to the `bible:` line in section 4 (relative to the BRIEF's folder); the tokens path defaults to the
// bible's `tokens` field, then work/tokens.resolved.json. The thresholds below are the film spec's own rules
// (docs/rsi/FILM-SPEC-9.md, work/wording/clarity-gate.md); no colour, font, tempo or beat length lives in this file.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const RULE = { hookMaxS: 2, gapMinS: 3, gapMaxS: 5, sayMaxWords: 12, gradeMax: 8, loglineMaxWords: 30, beatsMin: 6, beatsMax: 8, lockCount: 3, expressionsMax: 6 };
const SECTIONS = ['Film in one line.', 'References.', 'Tools & keys.', 'Character bible.', 'Beat sheet.', 'Text on screen.', 'Workflow gates.', 'Critique loop.', 'Deliverables.'];
const LADDER = ['plan', 'rig', 'stills', 'animatic', 'full', 'polish', 'audio', 'render'];
const DELIVERABLES = ['final mp4', 'loop check', 'poster frame', 'contact sheet', 'readme'];
// Fixer lanes: the bare names in skills/motion-soup/references/lanes.md. §8 "who fixes" may name only these.
const LANES = ['music', 'vector', 'wording', 'transitions', 'typography', 'data-viz'];
const ROLES = ['hook', 'claim', 'proof', 'breather', 'callback', 'landing'];
const INTERNAL_RX = /\bG\d\d\b|\brung ?\d|\be_[a-z]+\b|[δρ⊕]|Wada No\.? ?\d|cohomology|sheaf|pushout|PKCE/i;
const COLOR_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])|(?:rgba?|hsla?|oklch|oklab)\(\s*[\d.%\s,/deg-]+\)/;
const OPEN_RX = /^\s*(?:[-*]\s*)?OPEN\b/;
const PLACEHOLDER_RX = /<[^<>\n]{1,80}>/;

// ---------- helpers ----------
const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean);
function syllables(word) {
  let w = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length > 2 && /e$/.test(w) && !/le$/.test(w)) w = w.slice(0, -1);
  const m = w.match(/[aeiouy]+/g);
  return Math.max(1, m ? m.length : 0);
}
function readingGrade(text) {   // Flesch-Kincaid grade, vowel-group syllables (same heuristic as the engine's G33 · P8)
  const str = String(text || '').trim();
  const ws = str.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w));
  if (!ws.length) return 0;
  const sentences = Math.max(1, (str.match(/[.!?]+(\s|$)/g) || []).length);
  const syl = ws.reduce((n, w) => n + Math.max(1, syllables(w)), 0);
  return Number((0.39 * ws.length / sentences + 11.8 * syl / ws.length - 15.59).toFixed(2));
}
function canonical(v) {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === 'object') return Object.keys(v).sort().reduce((o, k) => { o[k] = canonical(v[k]); return o; }, {});
  return v;
}
const bibleHash = (bible) => 'sha256:' + crypto.createHash('sha256').update(JSON.stringify(canonical(bible))).digest('hex');
const clone = (x) => JSON.parse(JSON.stringify(x));

function parseBrief(text) {
  const out = {}; let cur = null;
  for (const line of String(text).split('\n')) {
    const h = line.match(/^##\s+(\d)\.\s+(.+?)\s*$/);
    if (h) { cur = Number(h[1]); out[cur] = { title: h[2], lines: [] }; continue; }
    if (/^#{1,2}\s/.test(line)) { cur = null; continue; }   // any other top heading (title, "defaults taken") closes the section
    if (cur != null) out[cur].lines.push(line);
  }
  return out;
}
function replaceSection(text, n, body) {
  const lines = text.split('\n'); const i = lines.findIndex((l) => new RegExp('^##\\s+' + n + '\\.\\s').test(l));
  let j = i + 1; while (j < lines.length && !/^#{1,2}\s/.test(lines[j])) j++;
  return [...lines.slice(0, i + 1), body, ...lines.slice(j)].join('\n');
}

// ---------- brief checks (S1-S9, BIBLE-*) ----------
function checkBrief(ctx, ready) {
  const R = []; const add = (id, ok, detail, kind) => R.push({ id, ok, detail, kind: kind || (ok ? 'PASS' : 'FAIL') });
  const S = parseBrief(ctx.briefText);
  SECTIONS.forEach((title, k) => {
    const n = k + 1, id = 'S' + n, sec = S[n];
    if (!sec) return add(id, false, `section "## ${n}. ${title}" missing`);
    if (sec.title !== title) return add(id, false, `heading is "${sec.title}", spec says "${title}"`);
    const body = sec.lines.filter((l) => l.trim());
    const opens = body.filter((l) => OPEN_RX.test(l));
    const content = body.filter((l) => !OPEN_RX.test(l));
    if (opens.length) {
      opens.forEach((l) => add(id, !(ready && n >= 4 && n <= 7), l.trim().replace(OPEN_RX, '').replace(/^[:\s—-]+/, ''), ready && n >= 4 && n <= 7 ? 'FAIL' : 'OPEN'));
      return;
    }
    if (!content.length) return add(id, false, 'blank and not marked OPEN');
    const ph = content.find((l) => PLACEHOLDER_RX.test(l));
    if (ph) return add(id, false, `unfilled slot: ${ph.trim().slice(0, 60)}`);
    const txt = content.join('\n'); const low = txt.toLowerCase();
    if (n === 1) { const w = words(txt.replace(/[*_`>]/g, '')).length; return add(id, w <= RULE.loglineMaxWords, `logline ${w} words (≤ ${RULE.loglineMaxWords})`); }
    if (n === 5) return add(id, /beats\.json/.test(txt), 'beat sheet exports to beats.json');
    if (n === 6) return add(id, /huge/.test(low) && /subtitle/.test(low) && /composition rule:\s*\S/.test(low), 'huge / subtitle / composition rule present');
    if (n === 7) {   // one line must read exactly plan → rig → stills → animatic → full → polish → audio → render
      const stage = (seg, i) => { const w = seg.trim().toLowerCase().split(/\s+/); return (i ? w[0] : w[w.length - 1]).replace(/[^a-z]/g, ''); };
      const ladders = content.filter((l) => l.includes('→')).map((l) => l.split('→').map(stage));
      const ok = ladders.some((s) => s.join(' ') === LADDER.join(' '));
      return add(id, ok, ok ? 'ladder ' + LADDER.join('→') : `no line reads ${LADDER.join(' → ')} (found: ${ladders.map((s) => s.join('→')).join(' | ') || 'none'})`); }
    if (n === 8) {
      const exitOk = /(≥|>=)\s*8|\b8\+/.test(txt);
      const who = (txt.match(/who fixes[^:\n]*:\s*(.+)/i) || [])[1];
      const lanes = !who || /^default\b/i.test(who.trim()) ? [] : who.split(/[,;·]/).map((p) => p.split(/\s*(?:→|->|=)\s*/)).filter((kv) => kv.length > 1)
        .map((kv) => kv[kv.length - 1].trim().toLowerCase().replace(/\s+lane$/, ''));
      const bad = [...new Set(lanes.filter((l) => !LANES.includes(l)))];
      if (!exitOk) return add(id, false, 'exit rule missing: every axis ≥ 8');
      return add(id, !bad.length, bad.length ? `who fixes names lane(s) outside the catalog: ${bad.join(', ')} (lanes: ${LANES.join('|')})` : `exit rule ≥ 8 · who fixes → ${[...new Set(lanes)].join(', ') || 'default'}`);
    }
    if (n === 9) { const miss = DELIVERABLES.filter((d) => !low.includes(d)); return add(id, !miss.length, miss.length ? 'missing: ' + miss.join(', ') : 'five deliverables listed'); }
    add(id, true, `${content.length} line(s)`);
  });

  // character bible
  const s4 = (S[4] ? S[4].lines.join('\n') : '');
  if (S[4] && S[4].lines.some((l) => OPEN_RX.test(l)) && !ctx.bible) { add('BIBLE', !ready, 'bible open: identity lock not yet set', ready ? 'FAIL' : 'SKIP'); return R; }
  const B = ctx.bible;
  if (!B) { add('BIBLE', false, `bible not found (${ctx.biblePath || 'no "bible:" line in section 4'})`); return R; }
  const chars = Array.isArray(B.characters) ? B.characters : [];
  const shape = []; const literal = COLOR_RE.test(JSON.stringify(B));
  if (!chars.length) shape.push('no characters');
  chars.forEach((c, i) => {
    const who = c.name || 'character ' + (i + 1);
    if (!c.proportions || !Object.keys(c.proportions).length) shape.push(who + ': proportions empty');
    const pal = c.palette || {};
    if (!Object.keys(pal).length) shape.push(who + ': palette empty');
    Object.entries(pal).forEach(([part, role]) => { if (!/^color\.[a-z][\w-]*$/.test(String(role))) shape.push(`${who}.palette.${part} is not a token role`); });
    const ex = Array.isArray(c.expressions) ? c.expressions : [];
    if (!ex.length || ex.length > RULE.expressionsMax) shape.push(`${who}: ${ex.length} expressions (1-${RULE.expressionsMax})`);
    ex.forEach((e) => { if (!ROLES.includes(e.trigger)) shape.push(`${who}: expression "${e.name}" trigger "${e.trigger}" is not a beat grammar role`);
      else if (ctx.board && !(ctx.board.beats || []).some((b) => b.grammar === e.trigger)) shape.push(`${who}: no "${e.trigger}" beat for expression "${e.name}"`); });
    const lock = Array.isArray(c.identityLock) ? c.identityLock.filter((x) => String(x).trim()) : [];
    if (lock.length !== RULE.lockCount) shape.push(`${who}: identity lock has ${lock.length} invariants (exactly ${RULE.lockCount})`);
  });
  if (literal) shape.push('a colour literal sits in the bible (roles only)');
  add('BIBLE-shape', !shape.length, shape.length ? shape.join('; ') : `${chars.length} character(s), roles only, ${RULE.lockCount}-line identity lock each`);
  if (ctx.tokens) {
    const T = ctx.tokens; const miss = [];
    chars.forEach((c) => Object.values(c.palette || {}).forEach((role) => { const r = String(role).replace(/^color\./, ''); if (!(T.color && (T.color[r] || (T.color.extra && T.color.extra[r])))) miss.push(role); }));
    add('BIBLE-roles', !miss.length, miss.length ? 'roles not in resolved tokens: ' + [...new Set(miss)].join(', ') : 'every palette role resolves in ' + ctx.tokensPath);
  } else add('BIBLE-roles', true, 'no tokens file; run soup-runner resolve-tokens, then re-check', 'SKIP');
  const want = (s4.match(/bible hash:\s*`?(sha256:[0-9a-f]{64})/i) || [])[1]; const got = bibleHash(B);
  add('BIBLE-hash', want === got, want ? (want === got ? got.slice(0, 19) + '… matches' : `section 4 says ${want.slice(0, 19)}…, bible is ${got.slice(0, 19)}…`) : 'no "bible hash: sha256:…" line in section 4');
  return R;
}

// ---------- beat checks (B-*) ----------
function checkBeats(board) {
  const R = []; const add = (id, ok, detail) => R.push({ id, ok, detail, kind: ok ? 'PASS' : 'FAIL' });
  const beats = (board && Array.isArray(board.beats)) ? board.beats : [];
  // timing
  let t = 0; const tErr = []; const pays = [];
  const tl = beats.map((b, i) => {
    const dur = Number(b.dur); if (!(dur > 0)) tErr.push(`beat ${i + 1} has no dur`);
    const start = typeof b.start === 'number' ? b.start : t;
    if (Math.abs(start - t) > 1e-6) tErr.push(`beat ${i + 1} starts at ${start}, previous ends at ${t}`);
    if (typeof b.payoff !== 'boolean') tErr.push(`beat ${i + 1} payoff is not true|false`);
    const end = start + (dur > 0 ? dur : 0); t = end;
    if (b.payoff === true) pays.push(Number((start + (typeof b.payoffAt === 'number' ? b.payoffAt : dur)).toFixed(3)));
    return { start, end };
  });
  const total = Number(board && board.totalDurationSec) || t;
  if (Math.abs(total - t) > 1e-6) tErr.push(`beats sum to ${t} s, totalDurationSec is ${total}`);
  add('B-timing', beats.length >= RULE.beatsMin && beats.length <= RULE.beatsMax && !tErr.length, `${beats.length} beats (${RULE.beatsMin}-${RULE.beatsMax}), ${t} s` + (tErr.length ? ' · ' + tErr.join('; ') : ''));
  // roles
  const g = beats.map((b) => b.grammar); const rErr = [];
  g.forEach((x, i) => { if (!ROLES.includes(x)) rErr.push(`beat ${i + 1} grammar "${x}"`); });
  if (g[0] !== 'hook' || g.filter((x) => x === 'hook').length !== 1) rErr.push('exactly one hook, first');
  if (g[g.length - 1] !== 'landing' || g.filter((x) => x === 'landing').length !== 1) rErr.push('exactly one landing, last');
  if (g.filter((x) => x === 'callback').length > 1) rErr.push('at most one callback');
  add('B-roles', !rErr.length, rErr.length ? rErr.join('; ') : g.join('→'));
  // hook in the first 2 s
  const hookEnd = tl[0] ? tl[0].end : Infinity;
  add('B-hook', g[0] === 'hook' && (hookEnd <= RULE.hookMaxS || (pays.length && pays[0] <= RULE.hookMaxS)), `hook ends ${hookEnd} s, first payoff ${pays[0] ?? 'none'} s (≤ ${RULE.hookMaxS})`);
  // payoff every 3-5 s
  const gaps = pays.slice(1).map((p, i) => Number((p - pays[i]).toFixed(2))); const tail = pays.length ? Number((total - pays[pays.length - 1]).toFixed(2)) : total;
  add('B-cadence', pays.length >= 2 && gaps.every((x) => x >= RULE.gapMinS && x <= RULE.gapMaxS) && tail <= RULE.gapMaxS,
    `payoffs at ${pays.join('/')} s · gaps ${gaps.join('/')} s (${RULE.gapMinS}-${RULE.gapMaxS}) · tail ${tail} s`);
  // exactly one breather, not first, second or last, no payoff
  const br = g.map((x, i) => (x === 'breather' ? i : -1)).filter((i) => i >= 0);
  add('B-breather', br.length === 1 && ![0, 1, beats.length - 1].includes(br[0]) && beats[br[0]].payoff !== true,
    `${br.length} breather(s) at beat ${br.map((i) => i + 1).join(',') || '-'} (exactly 1; not 1st, 2nd or last; no payoff)`);
  // every claim followed by a proof; every proof cites an earlier claim
  const cpErr = [];
  beats.forEach((b, i) => { if (b.grammar !== 'proof') return; const c = beats.findIndex((x) => x.id === b.claimId);
    if (!b.claimId) cpErr.push(`proof beat ${i + 1} has no claimId`); else if (c < 0 || c >= i || beats[c].grammar !== 'claim') cpErr.push(`proof beat ${i + 1} claimId "${b.claimId}" is not an earlier claim`); });
  beats.forEach((b, i) => { if (b.grammar === 'claim' && !beats.some((x, j) => j > i && x.grammar === 'proof' && x.claimId === b.id)) cpErr.push(`claim beat ${i + 1} has no proof after it`); });
  add('B-claim-proof', !cpErr.length && g.includes('claim'), cpErr.length ? cpErr.join('; ') : `${g.filter((x) => x === 'claim').length} claim(s), ${g.filter((x) => x === 'proof').length} proof(s), all paired`);
  // plant / returns pairs
  const plants = beats.filter((b) => b.plant).map((b) => b.plant); const pErr = [];
  if (!beats[0] || !beats[0].plant) pErr.push('hook sets no plant');
  plants.forEach((p) => { if (!beats.some((b) => (b.grammar === 'callback' || b.grammar === 'landing') && b.returns === p)) pErr.push(`plant "${p}" never returns`); });
  beats.forEach((b, i) => { if (b.returns && !plants.includes(b.returns)) pErr.push(`beat ${i + 1} returns "${b.returns}", which was never planted`); });
  add('B-plant', !pErr.length, pErr.length ? pErr.join('; ') : plants.map((p) => `"${p}" planted and returned`).join(', '));
  // say ≤ 12 words; reading grade ≤ 8; no internal names
  const long = beats.map((b, i) => [i + 1, words(b.say).length]).filter(([, n]) => n > RULE.sayMaxWords);
  add('B-say', !long.length && beats.every((b) => words(b.say).length > 0), long.length ? long.map(([i, n]) => `beat ${i}: ${n} words`).join('; ') : `max ${Math.max(0, ...beats.map((b) => words(b.say).length))} words (≤ ${RULE.sayMaxWords})`);
  const grades = beats.map((b) => readingGrade(`${b.say || ''} ${b.show || ''}`)); const hi = grades.map((x, i) => [i + 1, x]).filter(([, x]) => x > RULE.gradeMax);
  add('B-grade', !hi.length, hi.length ? hi.map(([i, x]) => `beat ${i}: grade ${x}`).join('; ') : `max grade ${Math.max(...grades)} (≤ ${RULE.gradeMax})`);
  const names = beats.map((b, i) => [i + 1, ['say', 'show', 'because'].find((f) => INTERNAL_RX.test(String(b[f] || '')))]).filter(([, f]) => f);
  add('B-names', !names.length, names.length ? names.map(([i, f]) => `beat ${i}.${f}`).join('; ') : 'no internal names in viewer copy');
  // a text box reserved on every beat with on-screen words
  const boxOk = (x) => x && ['x', 'y', 'w', 'h'].every((k) => typeof x[k] === 'number' && x[k] >= 0 && x[k] <= 1) && x.w > 0 && x.h > 0 && x.x + x.w <= 1 + 1e-9 && x.y + x.h <= 1 + 1e-9;
  const noBox = beats.map((b, i) => [i + 1, String(b.say || b.onScreen || '').trim() && !boxOk(b.textBox)]).filter(([, bad]) => bad).map(([i]) => i);
  add('B-textbox', !noBox.length, noBox.length ? `beat(s) ${noBox.join(',')} show words but reserve no textBox` : `${beats.filter((b) => boxOk(b.textBox)).length}/${beats.length} beats reserve a text box`);
  return R;
}

const runAll = (ctx, ready) => [...checkBrief(ctx, ready), ...checkBeats(ctx.board)];

function loadCtx(briefPath, beatsPath, opt) {
  const briefText = fs.readFileSync(briefPath, 'utf8'); const briefDir = path.dirname(path.resolve(briefPath));
  const board = JSON.parse(fs.readFileSync(beatsPath, 'utf8'));
  const s4 = (parseBrief(briefText)[4] || { lines: [] }).lines.join('\n');
  const rel = opt.bible || (s4.match(/bible:\s*`?([^\s`]+\.json)/) || [])[1];
  const biblePath = rel ? (fs.existsSync(path.resolve(briefDir, rel)) ? path.resolve(briefDir, rel) : path.resolve(rel)) : null;
  const bible = biblePath && fs.existsSync(biblePath) ? JSON.parse(fs.readFileSync(biblePath, 'utf8')) : null;
  const tCand = [opt.tokens, bible && bible.tokens, 'work/tokens.resolved.json'].filter(Boolean).map((p) => path.resolve(p));
  const tokensPath = tCand.find((p) => fs.existsSync(p)) || null;
  const tokens = tokensPath ? JSON.parse(fs.readFileSync(tokensPath, 'utf8')) : null;
  return { briefText, briefDir, board, bible, biblePath, tokens, tokensPath: tokensPath && path.relative(process.cwd(), tokensPath) };
}

function print(R) { for (const r of R) console.log(`${r.kind.padEnd(4)} ${r.id.padEnd(13)} ${r.detail}`); }

// ---------- selftest ----------
function selftest() {
  const ex = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'examples');
  const base = loadCtx(path.join(ex, 'BRIEF.md'), path.join(ex, 'beats.json'), {});
  const R0 = runAll(base, true); const baseFails = R0.filter((r) => r.kind === 'FAIL');
  console.log(`base example (--ready): ${R0.length} checks, ${baseFails.length} FAIL`); baseFails.forEach((r) => console.log('  FAIL ' + r.id + ' ' + r.detail));
  const beatMut = (f) => (c) => { f(c.board.beats, c.board); };
  const MUT = [
    ['MUT-hook-3.1s', 'B-hook', beatMut((b, B) => { b[0].dur = 3.1; B.totalDurationSec += 1.1; })],
    ['MUT-two-breathers', 'B-breather', beatMut((b) => { b[2].grammar = 'breather'; b[2].payoff = false; delete b[2].claimId; })],
    ['MUT-proof-no-claim', 'B-claim-proof', beatMut((b) => { delete b[2].claimId; })],
    ['MUT-breather-2nd', 'B-breather', beatMut((b) => { b[1].grammar = 'breather'; b[4].grammar = 'claim'; })],
    ['MUT-payoff-gap-6.5s', 'B-cadence', beatMut((b) => { b[2].payoff = false; })],
    ['MUT-say-13-words', 'B-say', beatMut((b) => { b[1].say = 'An MCP server is a small plug that fits any tool you own.'; })],
    ['MUT-grade', 'B-grade', beatMut((b) => { b[2].say = 'Heterogeneous orchestration necessitates interoperability'; })],
    ['MUT-no-textbox', 'B-textbox', beatMut((b) => { delete b[3].textBox; })],
    ['MUT-return-mismatch', 'B-plant', beatMut((b) => { b[5].returns = 'open drawer'; })],
    ['MUT-internal-name', 'B-names', beatMut((b) => { b[2].say = 'The G18 sheaf lists tools.'; })],
    ['MUT-section-6-blank', 'S6', (c) => { c.briefText = replaceSection(c.briefText, 6, ''); }],
    ['MUT-section-2-slot', 'S2', (c) => { c.briefText = replaceSection(c.briefText, 2, '- source video: <url or path | none>'); }],
    ['MUT-ladder-skip', 'S7', (c) => { c.briefText = c.briefText.replace(/→\s*animatic\s*/, ''); }],
    ['MUT-s8-lane-off-catalog', 'S8', (c) => { c.briefText = c.briefText.replace(/polish → vector/, 'polish → integrator'); }],
    ['MUT-bible-drift', 'BIBLE-hash', (c) => { c.bible.characters[0].identityLock[0] += ' (now taller)'; }],
    ['MUT-bible-literal', 'BIBLE-shape', (c) => { c.bible.characters[0].palette.body = '#' + 'c0ffee'; }],
    ['MUT-bible-open-ready', 'S4', (c) => { c.briefText = replaceSection(c.briefText, 4, '- OPEN: who is on screen?'); c.bible = null; }],
  ];
  let missed = 0;
  for (const [name, id, mutate] of MUT) {
    const c = { ...base, board: clone(base.board), bible: base.bible && clone(base.bible) }; mutate(c);
    const hit = runAll(c, true).filter((r) => r.id === id && r.kind === 'FAIL');
    if (hit.length) console.log(`CAUGHT ${name.padEnd(22)} ${id}: ${hit[0].detail}`); else { missed++; console.log(`MISSED ${name.padEnd(22)} expected ${id} to FAIL`); }
  }
  const ok = !baseFails.length && !missed;
  console.log(ok ? `PASS selftest: base clean, ${MUT.length}/${MUT.length} mutations caught` : `FAIL selftest: ${baseFails.length} base failure(s), ${missed} mutation(s) missed`);
  process.exit(ok ? 0 : 1);
}

// ---------- cli ----------
const argv = process.argv.slice(2); const opt = {}; const pos = [];
for (let i = 0; i < argv.length; i++) { const a = argv[i];
  if (a === '--selftest' || a === '--ready') opt[a.slice(2)] = true;
  else if (a === '--hash' || a === '--bible' || a === '--tokens') opt[a.slice(2)] = argv[++i];
  else pos.push(a); }
if (opt.selftest) selftest();
else if (opt.hash) console.log(bibleHash(JSON.parse(fs.readFileSync(opt.hash, 'utf8'))));
else {
  if (pos.length !== 2) { console.error('usage: brief-check.mjs <BRIEF.md> <beats.json> [--bible f] [--tokens f] [--ready] | --hash <bible.json> | --selftest'); process.exit(2); }
  const R = runAll(loadCtx(pos[0], pos[1], opt), !!opt.ready); print(R);
  const f = R.filter((r) => r.kind === 'FAIL').length, o = R.filter((r) => r.kind === 'OPEN').length;
  console.log(f ? `FAIL ${f} check(s) failed${o ? `, ${o} OPEN` : ''}` : `PASS all checks${o ? ` · ${o} OPEN line(s): add each to the ledger as kind "open"` : ''}`);
  process.exit(f ? 1 : 0);
}
