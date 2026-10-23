#!/usr/bin/env node
// soup-runner.mjs — orchestrator helper for the motion-soup skill. No dependencies. Node >= 18.
//
//   node skills/motion-soup/scripts/soup-runner.mjs resolve-tokens <source>... [--out work/tokens.resolved.json] [--strict]
//   node skills/motion-soup/scripts/soup-runner.mjs check-literals <dir|file>... [--tokens work/tokens.resolved.json] [--ignore <substr>]...
//   node skills/motion-soup/scripts/soup-runner.mjs diversity <file>... [--min 0.35]
//   node skills/motion-soup/scripts/soup-runner.mjs ledger add '<json>' | @file.json | -   [--ledger work/soup-ledger.jsonl]
//   node skills/motion-soup/scripts/soup-runner.mjs report [--ledger work/soup-ledger.jsonl] [--round N]
//
// Token sources (later sources override earlier ones for the same role):
//   css:<file>            --paper/--ink/--accent/--highlight/--contrast (+aliases), --font-display/--font-body/--font-mono,
//                         --type-scale, --feel-<name>, --tempo-min/--tempo-max. Any other --* colour goes to color.extra.
//   json:<file>           brand JSON already shaped like the contract ({color:{...}, type:{...}, motion:{...}, tempo:{...}}).
//   wada:<id>[@<file>]    a Sanzo Wada combination resolved through the host's palette engine (default file: geome-wada.js).
//   cjs:<file>#<export>   a CommonJS export: an object of feelName -> bpm becomes tempo.range + motion.feels.
//
// The skill itself carries no colour, font, easing or tempo defaults. Everything here is read from the host at run time.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROLES = {
  color: ['paper', 'ink', 'accent', 'highlight', 'contrast'],
  type: ['display', 'body', 'mono'],
};
const ALIASES = {
  paper: ['paper', 'bg', 'background', 'surface', 'canvas'],
  ink: ['ink', 'fg', 'text', 'foreground'],
  accent: ['accent', 'primary', 'brand'],
  highlight: ['highlight', 'secondary', 'hot'],
  contrast: ['contrast', 'tertiary', 'disc'],
};
const DEFAULT_OUT = 'work/tokens.resolved.json';
const DEFAULT_LEDGER = 'work/soup-ledger.jsonl';
// Hex literals, plus rgb()/hsl()/oklch() calls whose arguments are literal numbers (a call on variables is computed, not hardcoded).
const COLOR_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])|(?:rgba?|hsla?|oklch|oklab)\(\s*[\d.%\s,/deg-]+\)/g;

const die = (m) => { console.error('soup-runner: ' + m); process.exit(2); };
const readText = (p) => fs.readFileSync(p, 'utf8');
const args = process.argv.slice(2);
const cmd = args.shift();
const flags = {}; const pos = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('--')) { const k = a.slice(2); const v = (i + 1 < args.length && !args[i + 1].startsWith('--')) ? args[++i] : true; (flags[k] ??= []).push(v); }
  else pos.push(a);
}
const flag = (k, d) => (flags[k] ? flags[k][flags[k].length - 1] : d);

// ---------- colour normalisation ----------
function normColor(s) {
  s = String(s).trim().toLowerCase().replace(/\s+/g, '');
  let m = s.match(/^#([0-9a-f]{3,4})$/);
  if (m) { const h = m[1].split('').map((c) => c + c).join(''); return '#' + h.slice(0, 6) + (h.length === 8 && h.slice(6) !== 'ff' ? h.slice(6) : ''); }
  m = s.match(/^#([0-9a-f]{8})$/);
  if (m) return '#' + (m[1].slice(6) === 'ff' ? m[1].slice(0, 6) : m[1]);
  m = s.match(/^rgba?\((\d+),(\d+),(\d+)(?:,([0-9.]+))?\)$/);
  if (m) {
    const hex = [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
    const a = m[4] === undefined ? 1 : Number(m[4]);
    return a >= 1 ? '#' + hex : `rgba(${m[1]},${m[2]},${m[3]},${a})`;
  }
  return s;
}
const isColor = (v) => /^#[0-9a-f]{3,8}$|^(rgba?|hsla?|oklch|oklab)\(/i.test(String(v).trim());

// ---------- token sources ----------
function parseCssVars(text) {
  const out = {}; const re = /--([a-zA-Z0-9_-]+)\s*:\s*([^;}]+)[;}]/g; let m;
  while ((m = re.exec(text))) out[m[1]] = m[2].trim();
  return out;
}
function fromCss(file, T) {
  const vars = parseCssVars(readText(file));
  for (const [name, val] of Object.entries(vars)) {
    const n = name.toLowerCase();
    let role = null;
    for (const [r, al] of Object.entries(ALIASES)) if (al.includes(n)) role = r;
    if (role) { T.color[role] = normColor(val); continue; }
    if (/^font-(display|body|mono)$/.test(n)) { T.type[n.slice(5)] = val; continue; }
    if (n === 'type-scale') { T.type.scale = val.split(',').map((x) => x.trim()).filter(Boolean); continue; }
    if (n.startsWith('feel-')) { T.motion.feels[n.slice(5)] = val; continue; }
    if (n === 'tempo-min') { T.tempo.range[0] = Number(val); continue; }
    if (n === 'tempo-max') { T.tempo.range[1] = Number(val); continue; }
    if (isColor(val)) T.color.extra[n] = normColor(val);
  }
}
function fromJson(file, T) {
  const j = JSON.parse(readText(file));
  for (const k of ['color', 'type', 'motion', 'tempo']) if (j[k]) {
    for (const [a, b] of Object.entries(j[k])) {
      if (k === 'color' && a === 'extra') Object.assign(T.color.extra, b);
      else if (k === 'motion' && a === 'feels') Object.assign(T.motion.feels, b);
      else T[k][a] = (k === 'color' && typeof b === 'string') ? normColor(b) : b;
    }
  }
}
function fromWada(spec, T) {
  const [id, file = 'geome-wada.js'] = spec.split('@');
  const src = readText(file);
  // The palette engine registers on window; evaluate it in a tiny sandbox so we read it through the host, not a copy.
  const g = {}; g.window = g; g.globalThis = g; g.self = g;
  new Function('global', 'window', src)(g, g);
  const list = g.GEOME_WADA_LIST || (g.GEOME_WADA && Object.values(g.GEOME_WADA)) || [];
  const key = /^wada:/.test(id) ? id : 'wada:' + id;
  const p = list.find((x) => x.id === key);
  if (!p) die(`wada entry ${key} not found in ${file}`);
  const map = { paper: p.bg, ink: p.ink, accent: p.accent, highlight: p.fA, contrast: p.fB };
  for (const [r, v] of Object.entries(map)) if (v) T.color[r] = normColor(v);
  if (p.tint) T.color.extra.tint = normColor(p.tint);
  if (p.disc) T.color.extra.disc = normColor(p.disc);
  T.palette = { id: p.id, label: p.label, ground: p.ground, size: p.size };
}
function fromCjs(spec, T) {
  const [file, exp] = spec.split('#');
  const req = createRequire(path.resolve(process.cwd(), 'package.json'));
  const mod = req(path.resolve(file));
  const v = exp ? mod[exp] : mod;
  if (!v || typeof v !== 'object') die(`cjs export ${exp || '(module)'} of ${file} is not an object`);
  const nums = Object.entries(v).filter(([, n]) => typeof n === 'number');
  if (nums.length && nums.length === Object.keys(v).length) {
    for (const [feel, bpm] of nums) { T.motion.feels[feel] ??= {}; T.tempo.byFeel[feel] = bpm; }
    const vals = nums.map(([, n]) => n);
    T.tempo.range = [Math.min(...vals), Math.max(...vals)];
  } else fromJsonObject(v, T);
}
function fromJsonObject(j, T) { const tmp = path.join(process.cwd(), '.soup-tmp.json'); fs.writeFileSync(tmp, JSON.stringify(j)); try { fromJson(tmp, T); } finally { fs.unlinkSync(tmp); } }

function resolveTokens(sources) {
  const T = { source: sources, resolvedAt: new Date().toISOString(), color: { extra: {} }, type: {}, motion: { feels: {} }, tempo: { range: [null, null], byFeel: {} }, literals: [], missing: [] };
  for (const s of sources) {
    const i = s.indexOf(':'); const kind = s.slice(0, i), rest = s.slice(i + 1);
    if (kind === 'css') fromCss(rest, T);
    else if (kind === 'json') fromJson(rest, T);
    else if (kind === 'wada') fromWada(rest, T);
    else if (kind === 'cjs') fromCjs(rest, T);
    else die(`unknown source kind "${kind}" (use css: json: wada: cjs:)`);
  }
  for (const r of ROLES.color) if (!T.color[r]) T.missing.push('color.' + r);
  for (const r of ROLES.type) if (!T.type[r]) T.missing.push('type.' + r);
  if (!T.type.scale) T.missing.push('type.scale');
  if (!Object.keys(T.motion.feels).length) T.missing.push('motion.feels');
  if (T.tempo.range[0] == null || T.tempo.range[1] == null) T.missing.push('tempo.range');
  const lits = new Set();
  for (const [k, v] of Object.entries(T.color)) { if (k === 'extra') for (const x of Object.values(v)) lits.add(x); else lits.add(v); }
  T.literals = [...lits].sort();
  return T;
}

// ---------- check-literals ----------
function walk(p, acc, ignore) {
  if (ignore.some((s) => p.includes(s))) return acc;
  const st = fs.statSync(p);
  if (st.isDirectory()) { for (const f of fs.readdirSync(p)) walk(path.join(p, f), acc, ignore); }
  else if (/\.(m?js|cjs|json|md|html|css|svg|ts|tsx)$/.test(p)) acc.push(p);
  return acc;
}
function checkLiterals(targets) {
  const tokPath = flag('tokens', DEFAULT_OUT);
  if (!fs.existsSync(tokPath)) die(`tokens file ${tokPath} missing — run resolve-tokens first`);
  const T = JSON.parse(readText(tokPath));
  const allowed = new Set(T.literals.map(normColor));
  const ignore = (flags.ignore || []).concat(['node_modules', 'vendor', 'tokens.resolved.json']);
  const files = targets.flatMap((t) => walk(path.resolve(t), [], ignore));
  const bad = []; let scanned = 0, hits = 0;
  for (const f of files) {
    const lines = readText(f).split('\n'); scanned++;
    lines.forEach((line, i) => {
      for (const m of line.match(COLOR_RE) || []) {
        hits++;
        if (!allowed.has(normColor(m))) bad.push(`${path.relative(process.cwd(), f)}:${i + 1}: ${m}`);
      }
    });
  }
  console.log(`check-literals: ${scanned} files, ${hits} colour literals, ${allowed.size} allowed from ${tokPath}`);
  for (const b of bad) console.log('  FAIL ' + b);
  console.log(bad.length ? `FAIL ${bad.length} literal(s) not in tokens` : 'PASS all colour literals come from tokens');
  process.exit(bad.length ? 1 : 0);
}

// ---------- diversity (tell-apart floor) ----------
function shingles(text) {
  const words = text.toLowerCase().replace(/[^a-z0-9_\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
  const s = new Set(); for (let i = 0; i + 2 < words.length; i++) s.add(words.slice(i, i + 3).join(' ')); return s;
}
function diversity(files) {
  const min = Number(flag('min', 0.35));
  if (files.length < 2) die('diversity needs >= 2 files');
  const sets = files.map((f) => shingles(readText(f)));
  let worst = 1, pair = '';
  for (let i = 0; i < files.length; i++) for (let j = i + 1; j < files.length; j++) {
    const a = sets[i], b = sets[j]; let inter = 0; for (const x of a) if (b.has(x)) inter++;
    const d = 1 - inter / (a.size + b.size - inter || 1);
    console.log(`  ${path.basename(files[i])} vs ${path.basename(files[j])}: distance ${d.toFixed(3)}`);
    if (d < worst) { worst = d; pair = `${path.basename(files[i])} / ${path.basename(files[j])}`; }
  }
  console.log(worst >= min ? `PASS diversity min ${worst.toFixed(3)} >= ${min}` : `FAIL diversity min ${worst.toFixed(3)} < ${min} (${pair}) — request one more candidate with a forced different approach`);
  process.exit(worst >= min ? 0 : 1);
}

// ---------- ledger ----------
function ledgerAdd(raw) {
  const ledger = flag('ledger', DEFAULT_LEDGER);
  if (!raw) die('ledger add needs a JSON argument, @file or -');
  let text = raw === '-' ? fs.readFileSync(0, 'utf8') : raw.startsWith('@') ? readText(raw.slice(1)) : raw;
  const row = JSON.parse(text);
  row.ts ??= new Date().toISOString();
  fs.mkdirSync(path.dirname(ledger), { recursive: true });
  fs.appendFileSync(ledger, JSON.stringify(row) + '\n');
  console.log(`ledger: +1 row -> ${ledger} (round=${row.round ?? '?'} lane=${row.lane ?? '-'} kind=${row.kind ?? '-'})`);
}
function readLedger() {
  const ledger = flag('ledger', DEFAULT_LEDGER);
  if (!fs.existsSync(ledger)) return [];
  return readText(ledger).split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}
function report() {
  const rows = readLedger();
  if (!rows.length) { console.log('report: ledger empty'); return; }
  const roundSel = flag('round', null);
  const rounds = [...new Set(rows.map((r) => r.round ?? 0))].sort((a, b) => a - b);
  for (const R of rounds) {
    if (roundSel != null && String(R) !== String(roundSel)) continue;
    const rr = rows.filter((r) => (r.round ?? 0) === R);
    const lanes = [...new Set(rr.map((r) => r.lane).filter(Boolean))];
    const gates = rr.filter((r) => r.kind === 'gate');
    const pass = gates.filter((g) => g.pass).length;
    const verdict = rr.find((r) => r.kind === 'verdict');
    const mins = rr.filter((r) => typeof r.minutes === 'number').reduce((a, r) => a + r.minutes, 0);
    console.log(`\n== round ${R} == lanes: ${lanes.join(', ') || '-'} | rows ${rr.length} | gates ${pass}/${gates.length} | agent-minutes ${mins || '?'} | verdict: ${verdict ? verdict.result : 'open'}`);
    for (const lane of lanes) {
      const c = rr.filter((r) => r.lane === lane && r.kind === 'candidate');
      const s = rr.find((r) => r.lane === lane && r.kind === 'soup');
      const crit = rr.find((r) => r.lane === lane && r.kind === 'critic');
      console.log(`  ${lane.padEnd(10)} candidates ${c.length}${c.length ? ' (' + c.map((x) => (x.id || '?') + (x.selftest ? ':' + x.selftest : '')).join(', ') + ')' : ''}` +
        `${s ? ` | soup: ${s.result || '?'}${s.bestSingle ? ' best=' + s.bestSingle : ''}` : ''}${crit ? ` | critic firstFlag=${crit.firstFlag || '?'} wow=${crit.wow ?? '?'}` : ''}`);
    }
    for (const g of gates.filter((g) => !g.pass)) console.log(`  FAIL ${g.gate || g.id}: ${g.detail || ''}`);
    const open = rr.filter((r) => r.kind === 'open');
    for (const o of open) console.log(`  OPEN ${o.text}`);
  }
}

// ---------- main ----------
switch (cmd) {
  case 'resolve-tokens': {
    if (!pos.length) die('resolve-tokens needs at least one source');
    const T = resolveTokens(pos);
    const out = flag('out', DEFAULT_OUT);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(T, null, 2) + '\n');
    console.log(`tokens -> ${out}`);
    console.log(`  color: ${ROLES.color.map((r) => r + '=' + (T.color[r] || '∅')).join(' ')}${Object.keys(T.color.extra).length ? ' extra=' + Object.keys(T.color.extra).join(',') : ''}`);
    console.log(`  type:  ${ROLES.type.map((r) => r + '=' + (T.type[r] ? '"' + T.type[r].split(',')[0] + '…"' : '∅')).join(' ')} scale=${T.type.scale ? T.type.scale.length + ' steps' : '∅'}`);
    console.log(`  motion.feels: ${Object.keys(T.motion.feels).join(',') || '∅'}`);
    console.log(`  tempo.range: ${T.tempo.range.join('–')} | literals: ${T.literals.length} | missing: ${T.missing.join(',') || 'none'}`);
    if (T.missing.length && flag('strict')) { console.log('FAIL --strict: missing roles'); process.exit(1); }
    break;
  }
  case 'check-literals': checkLiterals(pos.length ? pos : ['work']); break;
  case 'diversity': diversity(pos); break;
  case 'ledger': { const sub = pos.shift(); if (sub === 'add') ledgerAdd(pos[0]); else die('ledger subcommand: add'); break; }
  case 'report': report(); break;
  default:
    console.log(readText(new URL(import.meta.url)).split('\n').slice(1, 17).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
    process.exit(cmd ? 2 : 0);
}
