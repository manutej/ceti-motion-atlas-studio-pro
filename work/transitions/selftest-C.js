#!/usr/bin/env node
// selftest-C — checks every predicate in work/transitions/CONTRACT.md §self-test against cand-C.js.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { spawnSync } = require('child_process');

const HERE = __dirname;
const REPO = path.resolve(HERE, '..', '..');
const SRC_PATH = path.join(HERE, 'cand-C.js');
const TOK_PATH = path.join(REPO, 'work', 'tokens.resolved.json');
const BOARD_MD = path.join(REPO, 'work', 'wording', 'storyboard-grammar.md');
const RUNNER = path.join(REPO, 'skills', 'motion-soup', 'scripts', 'soup-runner.mjs');

const SRC = fs.readFileSync(SRC_PATH, 'utf8');
const tokens = JSON.parse(fs.readFileSync(TOK_PATH, 'utf8'));

function load(src) {
  const sandbox = { module: { exports: {} }, console };
  sandbox.window = sandbox; sandbox.globalThis = sandbox;
  vm.runInNewContext(src, sandbox, { filename: 'cand-C.vm.js' });
  return sandbox.module.exports;
}

function boards() {
  const md = fs.readFileSync(BOARD_MD, 'utf8');
  const out = [];
  const re = /```json\n([\s\S]*?)\n```/g;
  let m;
  while ((m = re.exec(md))) {
    try { const j = JSON.parse(m[1]); if (j && Array.isArray(j.beats) && j.beats.some((b) => b.grammar)) out.push(j); } catch (e) { /* skip non-board json */ }
  }
  return out;
}

const results = [];
function check(id, name, fn) {
  try { fn(); results.push([id, name, true, '']); }
  catch (e) { results.push([id, name, false, e.message]); }
}

// ---- predicate bodies (reused by the mutation test) ----
function p1(T, B) {
  for (const b of B) for (const t of T.schedule(b, tokens).transitions) {
    assert.ok(typeof t.semantic === 'string' && t.semantic.trim().length > 0, 'empty semantic');
    const n = t.semantic.trim().split(/\s+/).length;
    assert.ok(n <= 14, `semantic has ${n} words: ${t.semantic}`);
    assert.ok(T.KINDS.includes(t.kind), 'bad kind ' + t.kind);
    assert.ok(['attention', 'continuity', 'change', 'character'].includes(t.because), 'bad because ' + t.because);
  }
}
function p2(T, B) {
  const rev = { wipe: 'wipe-back', 'wipe-back': 'wipe', iris: 'iris-back', 'iris-back': 'iris', cut: 'cut', split: 'split' };
  assert.strictEqual(T.table.breather, 'cut', 'table.breather must be cut');
  assert.strictEqual(T.table.callback, rev[T.table.hook], 'table.callback must reverse hook');
  assert.ok(['iris-back', 'cut'].includes(T.table.landing), 'table.landing');
  let seen = { breather: 0, callback: 0, landing: 0 };
  for (const b of B) for (const t of T.schedule(b, tokens).transitions) {
    if (t.relation === 'breather') { seen.breather++; assert.strictEqual(t.kind, 'cut', 'breather → ' + t.kind); }
    if (t.relation === 'callback') { seen.callback++; assert.strictEqual(t.kind, rev[T.table.hook], 'callback → ' + t.kind); }
    if (t.relation === 'landing') { seen.landing++; assert.ok(['iris-back', 'cut'].includes(t.kind), 'landing → ' + t.kind); }
  }
  assert.ok(seen.breather && seen.callback && seen.landing, 'boards must exercise breather, callback, landing: ' + JSON.stringify(seen));
}
function p3(T) {
  const W = 320, H = 180;
  for (const k of T.KINDS) {
    let last = -1;
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      const a = T.mask(k, u, { x: 0.3, y: 0.6 }, W, H);
      const b = T.mask(k, u, { x: 0.3, y: 0.6 }, W, H);
      assert.deepStrictEqual(a, b, `mask ${k} @${u} not repeatable`);
      assert.ok(Array.isArray(a) && a.length && a[a.length - 1][0] === 'Z', `mask ${k} @${u} not closed`);
      const c = T.coverage(k, u, W, H);
      assert.ok(c >= 0 && c <= 1, `coverage ${k} out of range`);
      assert.ok(c + 1e-9 >= last, `coverage ${k} not monotone at u=${u}: ${c} < ${last}`);
      last = c;
    }
    assert.ok(T.coverage(k, 0, W, H) <= 0.01 || k === 'iris-back', `${k} starts covered`);
    assert.ok(T.coverage(k, 1, W, H) >= 0.99, `${k} ends uncovered`);
  }
}
function p4(T, B) {
  for (const b of B) {
    const { beats, transitions } = T.schedule(b, tokens);
    transitions.forEach((t, i) => {
      const from = beats[i], to = beats[i + 1];
      assert.ok(t.t1 >= t.t0, 'negative window');
      assert.ok(t.t1 - t.t0 <= Math.min(from.dur, to.dur) + 1e-9, `window ${i} longer than shorter beat`);
      assert.ok(Math.abs((t.t0 + t.t1) / 2 - to.start) < 1e-9, `window ${i} not centred on toBeat.start`);
      if (i > 0) assert.ok(transitions[i - 1].t1 <= t.t0 + 1e-9, `windows ${i - 1}/${i} overlap`);
      if (t.focus) assert.ok(t.focus.x >= 0 && t.focus.x <= 1 && t.focus.y >= 0 && t.focus.y <= 1, 'focus out of [0,1]²');
      if (t.kind === 'cut') assert.ok(!t.focus, 'cut must not introduce a focus');
    });
  }
}
function p5(src) {
  const bad = new RegExp(['Math\\.' + 'random', 'Date\\.' + 'now', 'performance\\.' + 'now', 'request' + 'AnimationFrame'].join('|'));
  assert.ok(!bad.test(src), 'forbidden token in source: ' + (src.match(bad) || [])[0]);
  assert.ok(!/cubic-bezier|steps\(/i.test(src), 'easing literal in source');
  const famNames = Object.values(tokens.type || {}).map((v) => String(v).split(',')[0].replace(/['"]/g, '').trim()).filter(Boolean);
  for (const f of famNames) assert.ok(!src.includes(f), 'font literal in source: ' + f);
  assert.ok(!/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(src), 'colour literal in source');
  const tempoVals = new Set([...(tokens.tempo.range || []), ...Object.values(tokens.tempo.byFeel || {})].map(String));
  const nums = (src.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '').match(/(?<![\w.])\d+(?:\.\d+)?(?![\w.])/g) || []);
  for (const n of nums) assert.ok(!tempoVals.has(n), 'tempo/bpm literal in source: ' + n);
  const r = spawnSync(process.execPath, [RUNNER, 'check-literals', SRC_PATH, '--tokens', TOK_PATH], { cwd: REPO, encoding: 'utf8' });
  assert.strictEqual(r.status, 0, 'check-literals exit ' + r.status + ' ' + (r.stdout || '') + (r.stderr || ''));
}
function p6(T, B) {
  for (const b of B) {
    const { beats } = T.schedule(b, tokens);
    for (let i = 1; i < beats.length; i++) {
      const a = T.transitionFor(beats[i - 1], beats[i], tokens);
      const c = T.transitionFor(JSON.parse(JSON.stringify(beats[i - 1])), JSON.parse(JSON.stringify(beats[i])), JSON.parse(JSON.stringify(tokens)));
      assert.deepStrictEqual(a, c, 'transitionFor not deterministic at ' + i);
    }
    assert.deepStrictEqual(T.schedule(b, tokens), T.schedule(b, tokens), 'schedule not deterministic');
  }
  // G31: two.js layer is a no-op without Two
  assert.strictEqual(T.twoLayer(null, 'wipe', 0.5), null, 'twoLayer must no-op without Two');
}

const T = load(SRC);
const B = boards();
check(0, 'two example boards load', () => assert.strictEqual(B.length, 2, 'boards found: ' + B.length));
check(1, 'semantic non-empty, ≤14 words, because ∈ enum', () => p1(T, B));
check(2, 'breather→cut, callback=reverse(hook), landing→iris-back|cut', () => p2(T, B));
check(3, 'mask repeatable ×11 u; coverage monotone', () => p3(T));
check(4, 'window ≤ shorter beat; no overlap; one hot spot', () => p4(T, B));
check(5, 'no forbidden tokens / literals; check-literals exit 0', () => p5(SRC));
check(6, 'same input twice → deep-equal; G31 no-op', () => p6(T, B));
check(7, 'negative mutation (breather → wipe) is caught by predicate 2', () => {
  const needle = "breather: 'cut',";
  assert.ok(SRC.includes(needle), 'mutation anchor missing');
  const M = load(SRC.replace(needle, "breather: 'wipe',"));
  let caught = false;
  try { p2(M, B); } catch (e) { caught = true; }
  assert.ok(caught, 'mutated copy still passes predicate 2');
  p2(T, B); // original restored / untouched
});

let ok = true;
for (const [id, name, pass, msg] of results) {
  console.log(`${pass ? 'PASS' : 'FAIL'} P${id} ${name}${pass ? '' : ' — ' + msg}`);
  if (!pass) ok = false;
}
for (const b of B) for (const t of T.schedule(b, tokens).transitions) {
  console.log(`  ${b.id} ${t.relation.padEnd(13)} ${t.kind.padEnd(9)} [${t.t0.toFixed(2)},${t.t1.toFixed(2)}] ${t.because.padEnd(10)} ${t.semantic}`);
}
process.exit(ok ? 0 : 1);
