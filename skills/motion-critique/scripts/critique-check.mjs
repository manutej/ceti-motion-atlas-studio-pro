#!/usr/bin/env node
// critique-check.mjs — validate one stills-critic output (work/critique-r{K}-p{P}.json) and decide the loop exit.
//
//   node skills/motion-critique/scripts/critique-check.mjs <critique.json> [--brief work/BRIEF.md] [--root .] [--no-fs]
//   node skills/motion-critique/scripts/critique-check.mjs --axes-from work/BRIEF.md     # print axes + who-fixes map
//   node skills/motion-critique/scripts/critique-check.mjs --selftest
//
// Exit 0 = valid AND every axis >= 8 (loop exits) · 2 = valid, repeat (fixes routed) · 1 = invalid (re-spawn the critic).
// Axes and lanes come from the brief §8 ("axes scored 1–10:" and "who fixes:"); "default" selects DEFAULT_AXES /
// DEFAULT_FIXERS. Without --brief, axes are taken from the row itself and any lane token is accepted.
import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_AXES = ['hook', 'cadence', 'readability', 'identity', 'music fit', 'polish'];
export const DEFAULT_FIXERS = { hook: 'transitions', cadence: 'wording', readability: 'typography', identity: 'vector', 'music fit': 'music', polish: 'vector' };
const EXIT_AT = 8;
const VAGUE = /^(make it better|improve( it)?|fix( it)?|polish( it)?|tweak( it)?|better|tbd|todo)\.?$/i;

// §8 "who fixes": one `axis → lane` per comma-separated item (lanes are motion-soup/references/lanes.md's bare names).
// Tolerated: a trailing " lane" word (stripped), and a group `a, b → lane` (every axis before the arrow gets the lane).
export function parseWhoFixes(raw) {
  const fixers = {}, dangling = []; let pending = [];
  for (const part of String(raw).split(/[,;·]/).map((x) => x.trim()).filter(Boolean)) {
    const kv = part.split(/\s*(?:→|->|=)\s*/);
    if (kv.length === 1) { pending.push(kv[0].toLowerCase()); continue; }
    const lane = kv[kv.length - 1].trim().toLowerCase().replace(/\s+lane$/, '');
    for (const a of [...pending, kv[0].trim().toLowerCase()]) if (a && lane) fixers[a] = lane;
    pending = [];
  }
  dangling.push(...pending);
  return { fixers, dangling };
}

export function parseBrief(text) {
  const m = text.match(/^##\s*8\.[^\n]*\n([\s\S]*?)(?=^##\s|(?![\s\S]))/m);
  if (!m) return { error: 'brief has no "## 8." critique-loop section' };
  const sec = m[1], line = (re) => { const x = sec.match(re); return x ? x[1].trim() : null; };
  const axesRaw = line(/axes[^:\n]*:\s*(.+)/i), whoRaw = line(/who fixes[^:\n]*:\s*(.+)/i);
  if (!axesRaw || /^<.*>$/.test(axesRaw)) return { error: '§8 axes line is blank — ask the owner (film-brief.md §8)' };
  const isDefault = (s) => /^default\b/i.test(s);
  const axes = isDefault(axesRaw) ? DEFAULT_AXES.slice() : axesRaw.replace(/\(.*?\)/g, '').split(/[,;·]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
  let fixers = {};
  if (!whoRaw || isDefault(whoRaw) || /^<.*>$/.test(whoRaw)) fixers = Object.fromEntries(axes.map((a) => [a, DEFAULT_FIXERS[a]]).filter(([, l]) => l));
  else fixers = parseWhoFixes(whoRaw).fixers;
  const unmapped = axes.filter((a) => !fixers[a]);
  return { axes, fixers, lanes: [...new Set(Object.values(fixers))], ...(unmapped.length ? { warn: `no fixer lane for: ${unmapped.join(', ')}` } : {}) };
}

export function check(row, { axes, lanes, root = '.', fsCheck = true } = {}) {
  const errs = [];
  if (!row || typeof row !== 'object' || Array.isArray(row)) return { valid: false, errs: ['not a JSON object'] };
  if (row.kind !== 'critique') errs.push('kind must be "critique"');
  for (const k of ['round', 'pass']) if (!Number.isInteger(row[k]) || row[k] < 1) errs.push(`${k} must be a positive integer`);
  const stills = Array.isArray(row.stills) ? row.stills : [];
  if (!stills.length) errs.push('stills must list the stills read');
  if (fsCheck) for (const s of stills) if (!fs.existsSync(path.resolve(root, s))) errs.push(`still not found: ${s}`);
  const scores = row.scores && typeof row.scores === 'object' && !Array.isArray(row.scores) ? row.scores : null;
  if (!scores) errs.push('scores must be an object axis → 1..10');
  const want = axes || (scores ? Object.keys(scores) : []);
  if (scores) {
    for (const a of want) if (!(a in scores)) errs.push(`axis "${a}" (brief §8) has no score`);
    if (axes) for (const a of Object.keys(scores)) if (!axes.includes(a)) errs.push(`axis "${a}" is not in brief §8`);
    for (const [a, s] of Object.entries(scores)) if (!Number.isInteger(s) || s < 1 || s > 10) errs.push(`score ${a}=${s} is not an integer 1..10`);
  }
  const w3 = Array.isArray(row.worst3) ? row.worst3 : [];
  if (w3.length !== 3) errs.push(`worst3 must name exactly 3 problems (has ${w3.length})`);
  const names = stills.map((s) => path.basename(s));
  w3.forEach((w, i) => { if (typeof w !== 'string' || !names.some((n) => w.includes(n))) errs.push(`worst3[${i}] names no still by filename`); });
  const low = scores ? Object.entries(scores).filter(([, s]) => Number.isInteger(s) && s < EXIT_AT).sort((a, b) => a[1] - b[1]) : [];
  for (const [a, s] of low) if (!w3.some((w) => typeof w === 'string' && w.toLowerCase().includes(a.toLowerCase()))) errs.push(`axis "${a}" scored ${s} < ${EXIT_AT} but is not named in worst3`);
  const fixes = Array.isArray(row.fixes) ? row.fixes : [];
  if (fixes.length !== w3.length) errs.push(`fixes must have one entry per worst3 item (${fixes.length} vs ${w3.length})`);
  const routes = [];
  fixes.forEach((f, i) => {
    const m = typeof f === 'string' && f.match(/^\s*([a-z][a-z0-9-]*)(?:\s+lane)?\s*:\s*(.+)$/i);
    if (!m) return errs.push(`fixes[${i}] is not "<lane>: <change>"`);
    const lane = m[1].toLowerCase(), change = m[2].trim();
    if (lanes && lanes.length && !lanes.includes(lane)) errs.push(`fixes[${i}] lane "${lane}" is not a §8 fixer lane (${lanes.join('|')})`);
    if (VAGUE.test(change) || change.split(/\s+/).length < 3) errs.push(`fixes[${i}] change is too vague: "${change}"`);
    routes.push({ lane, change, problem: w3[i] });
  });
  const vals = scores ? Object.values(scores).filter(Number.isInteger) : [];
  const minScore = vals.length ? Math.min(...vals) : null;
  const valid = !errs.length;
  return { valid, errs, exit: valid && low.length === 0, minScore, low: low.map(([a, s]) => `${a} ${s}`), routes };
}

function selftest() {
  const base = { round: 1, kind: 'critique', pass: 1, stills: ['work/stills/r1/p1/1.00s.png', 'work/stills/r1/p1/5.45s.png'],
    scores: { hook: 8, cadence: 7, readability: 9 },
    worst3: ['5.45s.png: cadence — payoff lands under the caption (§5)', '1.00s.png: hook mark is a cut, not a reveal (§5)', '5.45s.png: breather reads as a stall (§5)'],
    fixes: ['wording: lengthen breather beat by one second', 'transitions: iris reveal on the hook mark', 'vector: lift spotlight above the text box'], minutes: 5 };
  const opts = { axes: ['hook', 'cadence', 'readability'], lanes: ['wording', 'transitions', 'vector'], fsCheck: false };
  const clone = () => JSON.parse(JSON.stringify(base));
  const results = [];
  const ok = (label, cond) => { results.push(`${cond ? 'ok  ' : 'FAIL'} ${label}`); return cond; };
  let good = true;
  const r0 = check(base, opts); good &= ok('valid row accepted, repeat decided (cadence 7)', r0.valid && !r0.exit && r0.routes.length === 3);
  const allEight = clone(); allEight.scores.cadence = 8; const r1 = check(allEight, opts); good &= ok('all >= 8 → exit', r1.valid && r1.exit);
  const MUT = [
    ['worst3 has 2 items', (r) => { r.worst3.pop(); r.fixes.pop(); }],
    ['fix without "<lane>:" prefix', (r) => { r.fixes[0] = 'lengthen the breather'; }],
    ['score < 8 missing from worst3', (r) => { r.scores.readability = 6; }],
    ['non-integer score 7.5', (r) => { r.scores.cadence = 7.5; }],
    ['score 11 out of range', (r) => { r.scores.hook = 11; }],
    ['worst3 item names no still', (r) => { r.worst3[1] = 'hook mark is a cut (§5)'; }],
    ['fix lane not in §8 map', (r) => { r.fixes[2] = 'lighting: add a rim light to the whale'; }],
    ['brief axis without a score', (r) => { delete r.scores.readability; }],
    ['vague fix', (r) => { r.fixes[1] = 'transitions: make it better'; }],
    ['fixes count != worst3 count', (r) => { r.fixes.push('vector: extra change here'); }],
  ];
  for (const [label, mutate] of MUT) { const r = clone(); mutate(r); const res = check(r, opts); good &= ok(`mutation caught: ${label} → ${res.errs[0] || 'NOT CAUGHT'}`, !res.valid); }
  const b1 = parseBrief('## 8. Critique loop.\n- axes scored 1–10: default\n- who fixes: default\n## 9. x\n');
  good &= ok('brief "default" → 6 default axes + fixers', b1.axes && b1.axes.length === 6 && b1.fixers.hook === 'transitions');
  const b2 = parseBrief('## 8. Critique loop.\n- axes scored 1–10: hook, legibility\n- who fixes: hook → transitions, legibility → typography\n');
  good &= ok('brief custom axes parsed, defaults not applied', b2.axes.join() === 'hook,legibility' && b2.lanes.join() === 'transitions,typography');
  const b3 = parseBrief('## 8. Critique loop.\n- axes scored 1–10: hook, cadence, readability\n- who fixes: hook, cadence → wording lane · readability → typography\n');
  good &= ok('group "hook, cadence → wording lane" maps both axes, " lane" stripped', b3.fixers.hook === 'wording' && b3.fixers.cadence === 'wording' && !b3.warn);
  const lr = check({ ...clone(), fixes: ['wording lane: lengthen breather beat by one second', ...base.fixes.slice(1)] }, opts);
  good &= ok('fix line "wording lane: …" accepted as lane wording', lr.valid && lr.routes[0].lane === 'wording');
  good &= ok('blank §8 axes refused', !!parseBrief('## 8. Critique loop.\n- axes scored 1–10: <≤ 6 axes>\n').error);
  console.log(results.join('\n')); console.log(good ? `PASS selftest (${MUT.length} mutations caught)` : 'FAIL selftest');
  process.exit(good ? 0 : 1);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const argv = process.argv.slice(2), flag = (k) => { const i = argv.indexOf('--' + k); return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true) : null; };
  if (argv.includes('--selftest')) selftest();
  if (flag('axes-from')) { const b = parseBrief(fs.readFileSync(flag('axes-from'), 'utf8')); console.log(JSON.stringify(b, null, 1)); process.exit(b.error ? 1 : 0); }
  const file = argv.find((a) => !a.startsWith('--') && a !== flag('brief') && a !== flag('root'));
  if (!file) { console.error('usage: critique-check.mjs <critique.json> [--brief work/BRIEF.md] [--root .] [--no-fs] | --selftest | --axes-from <brief>'); process.exit(1); }
  let row; try { row = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.error('critique-check: ' + e.message); process.exit(1); }
  let brief = {};
  if (flag('brief')) { brief = parseBrief(fs.readFileSync(flag('brief'), 'utf8')); if (brief.error) { console.error('critique-check: ' + brief.error); process.exit(1); } }
  const res = check(row, { axes: brief.axes, lanes: brief.lanes, root: flag('root') || '.', fsCheck: !argv.includes('--no-fs') });
  console.log(JSON.stringify({ file, ...res, decision: !res.valid ? 'invalid: re-spawn the critic' : res.exit ? 'exit: every axis >= 8' : 'repeat: route fixes' }, null, 1));
  process.exit(!res.valid ? 1 : res.exit ? 0 : 2);
}
