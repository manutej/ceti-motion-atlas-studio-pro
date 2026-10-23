#!/usr/bin/env node
// selftest-A — checks CONTRACT.md §self-test predicates 1-7 against cand-A.js. No deps. Exit 0 only if all hold.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const HERE = __dirname;
const REPO = path.resolve(HERE, '..', '..');
const SRC_PATH = path.join(HERE, 'cand-A.js');
const TOK_PATH = path.join(REPO, 'work', 'tokens.resolved.json');
const BOARD_MD = path.join(REPO, 'work', 'wording', 'storyboard-grammar.md');
const RUNNER = path.join(REPO, 'skills', 'motion-soup', 'scripts', 'soup-runner.mjs');

const SRC = fs.readFileSync(SRC_PATH, 'utf8');
const tokens = JSON.parse(fs.readFileSync(TOK_PATH, 'utf8'));
const W = 1920, H = 1080, EPS = 1e-9;
const KINDS = ['cut', 'wipe', 'split', 'iris', 'iris-back', 'wipe-back'];
const US = Array.from({ length: 11 }, (_, i) => i / 10);

function load(src) {
  const sandbox = { module: { exports: {} }, console };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(src, sandbox, { filename: 'cand-A.js' });
  return sandbox.module.exports;
}

function boards() {
  const md = fs.readFileSync(BOARD_MD, 'utf8');
  const out = [];
  const re = /```json\s*\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(md))) {
    try { const j = JSON.parse(m[1]); if (j && Array.isArray(j.beats) && j.beats.some(b => b.grammar)) out.push(j); } catch (_) { /* skip non-board json */ }
  }
  return out;
}

function deepEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// ---------- predicates (each takes an API instance, returns [ok, detail]) ----------
const P = {};
const BOARDS = boards();

P[1] = (T) => {
  for (const b of BOARDS) for (const tr of T.plan(b, tokens)) {
    const n = String(tr.semantic || '').trim().split(/\s+/).filter(Boolean).length;
    if (!tr.semantic || n === 0 || n > 14) return [false, `${b.id}: semantic "${tr.semantic}" (${n} words)`];
  }
  return [true, `${BOARDS.length} boards`];
};

P[2] = (T) => {
  const REV = { wipe: 'wipe-back', 'wipe-back': 'wipe', iris: 'iris-back', 'iris-back': 'iris', cut: 'cut' };
  const hookKind = T.table.hook;
  if (!(hookKind in REV)) return [false, `hook kind ${hookKind} has no reverse`];
  let seen = { breather: 0, callback: 0, landing: 0 };
  for (const b of BOARDS) {
    const beats = T.layout(b);
    for (let i = 1; i < beats.length; i++) {
      const tr = T.transitionFor(beats[i - 1], beats[i], tokens);
      const g = beats[i].grammar;
      if (g === 'breather') { seen.breather++; if (tr.kind !== 'cut') return [false, `${b.id}/${beats[i].id}: breather → ${tr.kind}`]; }
      if (tr.relation === 'callback') { seen.callback++; if (tr.kind !== REV[hookKind]) return [false, `callback ${tr.kind} ≠ reverse(${hookKind})`]; }
      if (g === 'landing') { seen.landing++; if (tr.kind !== 'iris-back' && tr.kind !== 'cut') return [false, `landing → ${tr.kind}`]; }
    }
  }
  if (T.table.breather !== 'cut') return [false, `table.breather = ${T.table.breather}`];
  if (T.table.callback !== REV[hookKind]) return [false, `table.callback = ${T.table.callback}`];
  if (!(T.table.landing === 'iris-back' || T.table.landing === 'cut')) return [false, `table.landing = ${T.table.landing}`];
  if (!seen.breather || !seen.callback || !seen.landing) return [false, `coverage of relations ${JSON.stringify(seen)}`];
  return [true, JSON.stringify(seen)];
};

P[3] = (T) => {
  const focus = { x: 1 / 2, y: 1 / 2 };
  for (const k of KINDS) {
    let prev = -Infinity;
    for (const u of US) {
      const a = T.mask(k, u, focus, W, H), b = T.mask(k, u, focus, W, H);
      if (!deepEqual(a, b)) return [false, `mask(${k},${u}) not repeatable`];
      if (!Array.isArray(a) || a[0][0] !== 'M' || a[a.length - 1][0] !== 'Z') return [false, `mask(${k},${u}) malformed`];
      const c = T.coverage(k, u, W, H);
      if (!(c >= 0 && c <= 1)) return [false, `coverage(${k},${u}) = ${c}`];
      if (c + EPS < prev) return [false, `coverage(${k}) drops at u=${u}: ${prev} → ${c}`];
      prev = c;
    }
    if (T.coverage(k, 0, W, H) > EPS || T.coverage(k, 1, W, H) < 1 - EPS) return [false, `coverage(${k}) not 0→1`];
  }
  return [true, `${KINDS.length} kinds × ${US.length} u`];
};

P[4] = (T) => {
  for (const b of BOARDS) {
    const beats = T.layout(b);
    const trs = [];
    for (let i = 1; i < beats.length; i++) {
      const tr = T.transitionFor(beats[i - 1], beats[i], tokens);
      const shorter = Math.min(beats[i - 1].dur, beats[i].dur);
      if (tr.t1 - tr.t0 > shorter + EPS) return [false, `${b.id}/${beats[i].id}: ${tr.t1 - tr.t0} > ${shorter}`];
      if (tr.t1 < tr.t0) return [false, `${b.id}/${beats[i].id}: t1 < t0`];
      trs.push(tr);
    }
    for (let i = 1; i < trs.length; i++) if (trs[i].t0 < trs[i - 1].t1 - EPS) return [false, `${b.id}: overlap at #${i}`];
  }
  return [true, 'durations bounded, no overlap'];
};

P[5] = (T, src) => {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const forbidden = new RegExp(['Math\\.random', 'Date\\.now', 'performance\\.now', 'requestAnimationFrame'].join('|'));
  const hit = src.match(forbidden);
  if (hit) return [false, `forbidden token ${hit[0]}`];
  const easing = code.match(/cubic-bezier|\b\d*\.\d+\b/);
  if (easing) return [false, `numeric easing/decimal literal ${easing[0]}`];
  const colour = code.match(/#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?|oklch)\(/);
  if (colour) return [false, `colour literal ${colour[0]}`];
  const font = code.match(/Fraunces|DM Sans|Space Mono|Georgia|sans-serif|monospace/);
  if (font) return [false, `font literal ${font[0]}`];
  const r = spawnSync(process.execPath, [RUNNER, 'check-literals', SRC_PATH, '--tokens', TOK_PATH], { encoding: 'utf8' });
  if (r.status !== 0) return [false, `check-literals exit ${r.status}: ${(r.stdout || '') + (r.stderr || '')}`.trim()];
  return [true, 'clean; check-literals exit 0'];
};

P[6] = (T) => {
  for (const b of BOARDS) {
    const beats = T.layout(b);
    for (let i = 1; i < beats.length; i++) {
      const x = T.transitionFor(beats[i - 1], beats[i], tokens), y = T.transitionFor(beats[i - 1], beats[i], tokens);
      if (!deepEqual(x, y)) return [false, `${b.id}/${beats[i].id} not deterministic`];
    }
    if (!deepEqual(T.plan(b, tokens), load(SRC).plan(b, tokens))) return [false, `${b.id}: fresh instance differs`];
  }
  return [true, 'deep-equal across calls and instances'];
};

// extra (avoid G31): two.js layer is a no-op without Two
function twoNoop(T) {
  const tr = T.transitionFor(null, { id: 'x', start: 1, dur: 2 }, tokens);
  const r = T.drawTwo(null, {}, tr, 1, tokens, W, H);
  return [r === null, `drawTwo without Two → ${r}`];
}

// ---------- run ----------
let fail = 0;
function report(name, [ok, detail]) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name} — ${detail}`); if (!ok) fail++; }

if (BOARDS.length < 2) { console.log(`FAIL boards — found ${BOARDS.length}, need 2`); process.exit(1); }
const T = load(SRC);
for (const k of [1, 2, 3, 4, 5, 6]) {
  let res;
  try { res = P[k](T, SRC); } catch (e) { res = [false, 'threw ' + e.message]; }
  report(`P${k}`, res);
}
report('G31 two-noop', twoNoop(T));

// P7 negative mutation: breather → wipe must make P2 fail.
(function () {
  const needle = "breather: 'cut',";
  if (SRC.split(needle).length !== 2) return report('P7', [false, 'mutation anchor not found exactly once']);
  const mutated = load(SRC.replace(needle, "breather: 'wipe',"));
  let r; try { r = P[2](mutated); } catch (e) { r = [false, 'threw']; }
  report('P7', [r[0] === false, `mutant P2 → ${r[0] ? 'PASS (bad: mutation survived)' : 'FAIL as expected: ' + r[1]}`]);
})();

// determinism of the selftest itself: same input twice
const again = load(SRC);
report('same-input-twice', [deepEqual(BOARDS.map(b => T.plan(b, tokens)), BOARDS.map(b => again.plan(b, tokens))), 'plans deep-equal']);

console.log(fail ? `selftest-A: ${fail} failing` : 'selftest-A: all predicates hold');
process.exit(fail ? 1 : 0);
