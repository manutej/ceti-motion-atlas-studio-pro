#!/usr/bin/env node
// selftest-merged — superset of selftest-A/B/C predicates that survived the merge + CONTRACT + lane tie-breaks.
// Usage: node selftest-merged.js [module.js]   (default soup.js; exit 0 only if every predicate holds)
//        node selftest-merged.js --score       (score cand-A/B/C/soup on the same predicates; always exit 0)
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const { spawnSync } = require('child_process');

const HERE = __dirname, ROOT = path.resolve(HERE, '..', '..');
const TOK_PATH = path.join(ROOT, 'work', 'tokens.resolved.json');
const RUNNER = path.join(ROOT, 'skills', 'motion-soup', 'scripts', 'soup-runner.mjs');
const tokens = JSON.parse(fs.readFileSync(TOK_PATH, 'utf8'));
const md = fs.readFileSync(path.join(ROOT, 'work', 'wording', 'storyboard-grammar.md'), 'utf8');
const BOARDS = [...md.matchAll(/```json\s*\n([\s\S]*?)\n```/g)]
  .map((m) => { try { return JSON.parse(m[1]); } catch (e) { return null; } })
  .filter((b) => b && Array.isArray(b.beats) && b.beats.some((x) => x.grammar));

const KINDS6 = ['cut', 'wipe', 'split', 'iris', 'iris-back', 'wipe-back'];
const REV = { cut: 'cut', wipe: 'wipe-back', 'wipe-back': 'wipe', iris: 'iris-back', 'iris-back': 'iris', split: 'split' };
const BECAUSE = ['attention', 'continuity', 'change', 'character'];
const FOCI = [{ x: 1 / 2, y: 1 / 2 }, { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 1 / 3, y: 2 / 3 }, { x: 0.3, y: 0.6 }];
const SIZES = [[1920, 1080], [640, 360], [320, 180]];
const US = Array.from({ length: 11 }, (_, i) => i / 10);
const EPS = 1e-9;
const eq = (a, b) => { try { assert.deepStrictEqual(a, b); return true; } catch (e) { return false; } };

function load(src, file, withWindow) {
  const sb = { module: { exports: {} }, console };
  sb.globalThis = sb; if (withWindow) sb.window = sb;
  vm.runInNewContext(src, sb, { filename: file });
  return { api: sb.module.exports, sb };
}
// neutral adapter so single candidates can be scored on helper-based predicates (soup needs none)
function adapt(T) {
  const S = Object.assign({}, T);
  if (!S.normalize) S.normalize = T.layout || ((b) => T.schedule(b, tokens).beats);
  if (!S.plan) S.plan = (b, tok) => T.schedule(b, tok).transitions;
  if (!S.KINDS) S.KINDS = KINDS6;
  return S;
}
function ctxOf(T, b, seed) { return { beats: T.normalize(b), seed }; }

// ---------- predicates: (T, src, file) -> list of failure strings ----------
const P = {};
P.R0_boards = () => (BOARDS.length === 2 ? [] : [`found ${BOARDS.length} boards, need 2`]);
P.P1_semantic = (T) => {   // CONTRACT 1 (A, B, C)
  const o = [];
  for (const b of BOARDS) for (const tr of T.plan(b, tokens, 0)) {
    const n = String(tr.semantic || '').trim().split(/\s+/).filter(Boolean).length;
    if (!n || n > 14) o.push(`${b.id} ${tr.to}: ${n} words`);
  }
  return o;
};
P.P1b_kind_because = (T) => {   // C P1 + B lens
  const o = [];
  for (const b of BOARDS) for (const tr of T.plan(b, tokens, 0)) {
    if (!KINDS6.includes(tr.kind)) o.push(`kind ${tr.kind}`);
    if (!BECAUSE.includes(tr.because)) o.push(`because ${tr.because}`);
  }
  return o;
};
P.P2_kinds = (T) => {   // CONTRACT 2 (A, B, C) + non-vacuous
  const o = [], seen = { breather: 0, callback: 0, landing: 0 };
  if (T.table.breather !== 'cut') o.push(`table.breather=${T.table.breather}`);
  if (T.table.callback !== REV[T.table.hook]) o.push(`table.callback ${T.table.callback} != reverse(${T.table.hook})`);
  if (!['iris-back', 'cut'].includes(T.table.landing)) o.push(`table.landing=${T.table.landing}`);
  for (const b of BOARDS) {
    const beats = T.normalize(b), trs = T.plan(b, tokens, 0);
    trs.forEach((tr, i) => {
      const g = beats[i + 1].grammar;
      if (g === 'breather') { seen.breather++; if (tr.kind !== 'cut') o.push(`${b.id} breather → ${tr.kind}`); }
      if (tr.relation === 'callback') { seen.callback++; if (tr.kind !== REV[T.table.hook]) o.push(`${b.id} callback → ${tr.kind}`); }
      if (g === 'landing') { seen.landing++; if (!['iris-back', 'cut'].includes(tr.kind)) o.push(`${b.id} landing → ${tr.kind}`); }
    });
  }
  for (const k of Object.keys(seen)) if (!seen[k]) o.push(`vacuous: no ${k}`);
  return o;
};
P.P3a_mask_repeatable = (T) => {   // CONTRACT 3 (A, B, C): 11 u × foci × sizes, well-formed
  const o = [];
  for (const k of KINDS6) for (const f of FOCI) for (const [w, h] of SIZES) for (const u of US) {
    const a = T.mask(k, u, f, w, h), c = T.mask(k, u, f, w, h);
    if (!eq(a, c)) o.push(`mask ${k} u=${u} not repeatable`);
    if (!Array.isArray(a) || !a.length || a[0][0] !== 'M' || a[a.length - 1][0] !== 'Z') o.push(`mask ${k} u=${u} malformed`);
  }
  return o.slice(0, 5);
};
P.P3b_coverage = (T) => {   // CONTRACT 3: monotone, 0→1 (A strict 4-arg; B 5-arg with focus)
  const o = [];
  for (const k of KINDS6) for (const [w, h] of SIZES) {
    let prev = -Infinity;
    for (const u of US) {
      const c = T.coverage(k, u, w, h);
      if (!(c >= 0 && c <= 1)) o.push(`${k} u=${u} out of range`);
      if (c + EPS < prev) o.push(`${k} drops at u=${u}`);
      prev = c;
    }
    if (T.coverage(k, 0, w, h) > EPS || T.coverage(k, 1, w, h) < 1 - EPS) o.push(`${k} not 0→1 (4-arg)`);
    for (const f of FOCI) {
      let pv = -Infinity;
      for (const u of US) { const c = T.coverage(k, u, w, h, f); if (c + EPS < pv) o.push(`${k} focus ${f.x},${f.y} drops`); pv = c; }
      if (T.coverage(k, 0, w, h, f) > 1e-6 || T.coverage(k, 1, w, h, f) < 1 - 1e-6) o.push(`${k} focus ${f.x},${f.y} not 0→1`);
    }
  }
  return o.slice(0, 5);
};
P.P4_timing = (T) => {   // CONTRACT 4 (A, B, C) + centring (B, C) + focus range / cut has no focus (C)
  const o = [];
  for (const b of BOARDS) {
    const beats = T.normalize(b), trs = T.plan(b, tokens, 0);
    trs.forEach((tr, i) => {
      const lim = Math.min(beats[i].dur, beats[i + 1].dur);
      if (!(tr.t1 >= tr.t0)) o.push(`${b.id} ${i} t1<t0`);
      if (!(tr.t1 - tr.t0 <= lim + EPS)) o.push(`${b.id} ${i} span > shorter beat`);
      if (Math.abs((tr.t0 + tr.t1) / 2 - beats[i + 1].start) > EPS) o.push(`${b.id} ${i} not centred on toBeat.start`);
      if (i && trs[i - 1].t1 > tr.t0 + EPS) o.push(`${b.id} ${i - 1}/${i} overlap`);
      if (tr.focus && !(tr.focus.x >= 0 && tr.focus.x <= 1 && tr.focus.y >= 0 && tr.focus.y <= 1)) o.push(`${b.id} ${i} focus out of [0,1]²`);
      if (tr.kind === 'cut' && tr.focus) o.push(`${b.id} ${i} cut introduces a focus`);
    });
  }
  return o;
};
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
P.P5a_forbidden = (T, src) => {   // CONTRACT 5 (A, B, C)
  const m = src.match(/Math\.random|Date\.now|performance\.now|requestAnimationFrame/);
  return m ? [`forbidden token ${m[0]}`] : [];
};
P.P5b_easing_bpm = (T, src) => {   // B, C
  const o = [];
  if (/cubic-bezier|steps\(|\[\s*-?\d*\.\d+\s*,\s*-?\d*\.\d+\s*,\s*-?\d*\.\d+\s*,\s*-?\d*\.\d+\s*\]/i.test(src)) o.push('numeric easing constant');
  if (/\b\d{2,3}\s*bpm\b|tempo\s*[:=]\s*\d/i.test(src)) o.push('bpm literal');
  return o;
};
P.P5c_no_decimal_literal = (T, src) => {   // A
  const m = strip(src).match(/\b\d*\.\d+\b/);
  return m ? [`decimal literal ${m[0]}`] : [];
};
P.P5d_colour_font = (T, src) => {   // A, B, C
  const o = [], code = strip(src);
  const c = code.match(/#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?|oklch)\(/); if (c) o.push(`colour literal ${c[0]}`);
  const fams = Object.values(tokens.type || {}).map((v) => String(v).split(',')[0].replace(/['"]/g, '').trim()).filter(Boolean);
  for (const f of fams.concat(['Georgia', 'sans-serif', 'monospace'])) if (src.includes(f)) o.push(`font literal ${f}`);
  return o;
};
P.P5e_tempo_literal = (T, src) => {   // C, narrowed by CONTRACT §5: one declared seconds-per-minute unit constant is exempt
  const vals = new Set([...(tokens.tempo.range || []), ...Object.values(tokens.tempo.byFeel || {})].map(String));
  const code = strip(src).replace(/\b(SECONDS_PER_MINUTE|SEC_PER_MIN)\s*=\s*60\b/, '$1 = UNIT');
  const nums = code.match(/(?<![\w.])\d+(?:\.\d+)?(?![\w.])/g) || [];
  return nums.filter((n) => vals.has(n)).map((n) => `tempo-valued literal ${n}`);
};
P.P5f_check_literals = (T, src, file) => {   // CONTRACT 5 (A, B, C)
  const r = spawnSync(process.execPath, [RUNNER, 'check-literals', file, '--tokens', TOK_PATH], { cwd: ROOT, encoding: 'utf8' });
  return r.status === 0 ? [] : [`check-literals exit ${r.status}`];
};
P.P6a_determinism = (T, src, file) => {   // CONTRACT 6 (A, B, C): twice, JSON-cloned, fresh instance
  const o = [], fresh = adapt(load(src, file).api);
  for (const b of BOARDS) {
    const beats = T.normalize(b), ctx = { beats, seed: 7 };
    for (let i = 1; i < beats.length; i++) {
      if (!eq(T.transitionFor(beats[i - 1], beats[i], tokens, ctx), T.transitionFor(beats[i - 1], beats[i], tokens, ctx))) o.push(`${b.id} ${i} twice`);
      const cl = (x) => JSON.parse(JSON.stringify(x));
      if (!eq(T.transitionFor(beats[i - 1], beats[i], tokens), T.transitionFor(cl(beats[i - 1]), cl(beats[i]), cl(tokens)))) o.push(`${b.id} ${i} cloned`);
    }
    if (!eq(T.plan(b, tokens, 7), T.plan(b, tokens, 7))) o.push(`${b.id} plan twice`);
    if (JSON.stringify(T.plan(b, tokens, 7)) !== JSON.stringify(fresh.plan(b, tokens, 7))) o.push(`${b.id} fresh instance differs`);
  }
  return o;
};
P.P6b_maskAt = (T) => {   // B: maskAt(tr, t) deterministic over the window
  const o = [];
  for (const b of BOARDS) for (const tr of T.plan(b, tokens, 7)) for (const u of US) {
    const t = tr.t0 + (tr.t1 - tr.t0) * u;
    if (!eq(T.maskAt(tr, t, 320, 180, tokens), T.maskAt(tr, t, 320, 180, tokens))) o.push('maskAt not deterministic');
  }
  return o.slice(0, 3);
};
P.LENS1_focus = (T) => {   // B lens, narrowed to non-cut (CONTRACT §API focus? = where the mask opens/closes)
  const o = [];
  for (const b of BOARDS) {
    const beats = T.normalize(b), trs = T.plan(b, tokens, 0), ctx = ctxOf(T, b, 0);
    const hook = beats.find((x) => x.grammar === 'hook');
    trs.forEach((tr, i) => {
      if (tr.kind === 'cut') return;
      const f = tr.focus, to = beats[i + 1];
      if (!f || Object.keys(f).sort().join() !== 'x,y') { o.push(`${b.id} ${to.id} not one point`); return; }
      if (!eq(f, T.focusOf(to, ctx))) o.push(`${b.id} ${to.id} focus ≠ incoming hot spot`);
      if (to.grammar === 'landing' && hook && !eq(f, T.focusOf(hook, ctx))) o.push(`${b.id} landing not on hook focus`);
      const p = to.returns && beats.find((x) => x.plant === to.returns);
      if (p && to.grammar !== 'landing' && !eq(f, T.focusOf(p, ctx))) o.push(`${b.id} callback not on planted focus`);
    });
  }
  return o;
};
const B_ = (o) => Object.assign({ id: 'x', start: 4, dur: 2, say: 'x' }, o);
P.LENS2_contrast = (T) => {   // B synthetic cases
  const o = [];
  if (T.transitionFor(B_({ grammar: 'proof', claimId: 'a' }), B_({ grammar: 'proof', claimId: 'b', id: 'y' }), tokens).kind !== 'split') o.push('proof→proof different claim not split');
  if (T.transitionFor(B_({ grammar: 'hook' }), B_({ grammar: 'claim', say: 'But not so.' }), tokens).kind !== 'split') o.push('hook→claim "But" not split');
  return o;
};
P.REL_tiebreak = (T) => {   // lane tie-break (contract): hinge → contrast; zoom below breather/callback/landing, above default; hook entry (A)
  const o = [], r = (a, b) => T.transitionFor(B_(a), B_(b), tokens).relation;
  if (r({ grammar: 'hook' }, { grammar: 'claim', hinge: 'BUT' }) !== 'contrast') o.push('hinge BUT not contrast');
  if (r({ grammar: 'claim' }, { grammar: 'proof', show: 'Zoom to the gauge.' }) !== 'zoom-in') o.push('show zoom not zoom-in');
  if (r({ grammar: 'hook' }, { grammar: 'claim', cameraMove: 'push-in' }) !== 'zoom-in') o.push('cameraMove push-in not zoom-in');
  if (r({ grammar: 'proof', claimId: 'a' }, { grammar: 'proof', claimId: 'a', cameraMove: 'push-in' }) !== 'zoom-in') o.push('zoom not above cause→effect default');
  if (r({ grammar: 'proof' }, { grammar: 'breather', cameraMove: 'push-in' }) !== 'breather') o.push('zoom above breather');
  if (r({ grammar: 'proof' }, { grammar: 'landing', cameraMove: 'push-in' }) !== 'landing') o.push('zoom above landing');
  if (r({ grammar: 'proof' }, { grammar: 'callback', returns: 'm', cameraMove: 'push-in' }) !== 'callback') o.push('zoom above callback');
  if (T.transitionFor(B_({ grammar: 'claim' }), B_({ grammar: 'claim', show: 'zoom' }), tokens).kind !== 'iris') o.push('zoom-in kind not iris');
  if (T.transitionFor(null, B_({ grammar: 'hook' }), tokens).relation !== 'hook') o.push('transitionFor(null, beat) not hook');
  return o;
};
P.HOLD_timing = (T) => {   // lane tie-break: C hold length for `cut` only; one beat of the incoming feel otherwise (A, B)
  const o = [], by = tokens.tempo.byFeel, lo = tokens.tempo.range[0];
  for (const b of BOARDS) {
    const beats = T.normalize(b);
    T.plan(b, tokens, 0).forEach((tr, i) => {
      const lim = Math.min(beats[i].dur, beats[i + 1].dur), bpm = by[tr.feel], span = tr.t1 - tr.t0;
      if (typeof bpm !== 'number') { o.push(`${b.id} ${i} feel ${tr.feel} has no tempo`); return; }
      const want = tr.kind === 'cut' ? lim * Math.min(1, lo / bpm) : Math.min(60 / bpm, lim);
      if (Math.abs(span - want) > 1e-6) o.push(`${b.id} ${i} ${tr.kind} span ${span.toFixed(3)} ≠ ${want.toFixed(3)}`);
    });
  }
  return o.slice(0, 4);
};
P.G31_two_noop = (T) => {   // A, B, C forms
  const o = [];
  if (typeof T.drawTwo !== 'function' || T.drawTwo(null, T.mask('iris', 1 / 2)) !== null) o.push('drawTwo(null, cmds)');
  else if (T.drawTwo({ add() { throw new Error('touched'); } }, T.mask('iris', 1 / 2)) !== null) o.push('drawTwo touched two');
  else if (T.drawTwo(null, {}, T.transitionFor(null, { id: 'x', start: 1, dur: 2 }, tokens), 1, tokens, 1920, 1080) !== null) o.push('drawTwo A-form');
  if (typeof T.twoLayer !== 'function' || T.twoLayer(null, 'wipe', 1 / 2) !== null) o.push('twoLayer(null)');
  return o;
};
P.SIZE_18KB = (T, src, file) => (fs.statSync(file).size <= 18 * 1024 ? [] : ['over 18 KB']);
P.API_contract = (T, src, file) => {   // CONTRACT §API surface + global name
  const o = [], { sb } = load(src, file, true), g = Object.keys(sb).find((k) => /^TRANS(_[A-Z])?$/.test(k));
  if (!g) o.push('no window.TRANS'); else if (path.basename(file) === 'soup.js' && g !== 'TRANS') o.push(`soup exposes ${g}`);
  for (const k of ['transitionFor', 'mask', 'coverage']) if (typeof T[k] !== 'function') o.push(`missing ${k}`);
  for (const k of ['hook', 'cause→effect', 'contrast', 'zoom-in', 'breather', 'callback', 'landing']) if (!KINDS6.includes(T.table[k])) o.push(`table.${k}`);
  if (typeof T.VERSION !== 'string') o.push('VERSION');
  return o;
};
P.E2_direction = (T) => {   // ledger E2: direction encodes relation; one hot spot per frame
  const o = [], t = T.table;
  const want = { 'cause→effect': 'wipe', contrast: 'split', 'zoom-in': 'iris', breather: 'cut', landing: 'iris-back' };
  for (const k of Object.keys(want)) if (t[k] !== want[k]) o.push(`${k}=${t[k]}`);
  if (t.callback === t.breather) o.push('callback collapses onto breather (no direction)');
  const xs = (c) => c.filter((x) => x[0] !== 'Z').map((x) => x[1]);
  if (Math.min(...xs(T.mask('wipe', 1 / 4, null, 100, 100))) !== 0) o.push('wipe not anchored left (L→R)');
  if (Math.max(...xs(T.mask('wipe-back', 1 / 4, null, 100, 100))) !== 100) o.push('wipe-back not anchored right');
  for (const b of BOARDS) for (const tr of T.plan(b, tokens, 0)) if (tr.focus && (Array.isArray(tr.focus) || typeof tr.focus.x !== 'number')) o.push('focus not a single point');
  return o;
};
P.SAME_twice = (T, src, file) => {   // A: plans deep-equal across two fresh loads
  const x = adapt(load(src, file).api), y = adapt(load(src, file).api);
  return JSON.stringify(BOARDS.map((b) => x.plan(b, tokens, 0))) === JSON.stringify(BOARDS.map((b) => y.plan(b, tokens, 0))) ? [] : ['plans differ'];
};
P.P7_mutation = (T, src, file) => {   // CONTRACT 7: breather → wipe must fail P2; unpatched copy passes
  const needle = "breather: 'cut',";
  if (src.split(needle).length !== 2) return ['mutation anchor not found exactly once'];
  let mf; try { mf = P.P2_kinds(adapt(load(src.replace(needle, "breather: 'wipe',"), file + '.mutant').api)); } catch (e) { mf = ['threw']; }
  const o = [];
  if (!mf.length) o.push('mutant (breather→wipe) passed P2');
  if (P.P2_kinds(adapt(load(src, file).api)).length) o.push('unpatched copy fails P2');
  return o;
};

function run(file, quiet) {
  const src = fs.readFileSync(file, 'utf8'), T = adapt(load(src, file).api), res = {};
  for (const [id, fn] of Object.entries(P)) {
    let f; try { f = fn(T, src, file); } catch (e) { f = ['lacks/threw: ' + e.message]; }
    res[id] = f;
    if (!quiet) console.log(`${f.length ? 'FAIL' : 'PASS'} ${id}${f.length ? ' — ' + f.slice(0, 3).join('; ') : ''}`);
  }
  return res;
}

if (process.argv.includes('--score')) {
  for (const n of ['cand-A.js', 'cand-B.js', 'cand-C.js', 'soup.js']) {
    const r = run(path.join(HERE, n), true), ids = Object.keys(r), failed = ids.filter((k) => r[k].length);
    console.log(`${n}: ${ids.length - failed.length}/${ids.length}  fails: ${failed.join(', ') || '-'}`);
  }
  process.exit(0);
}
const file = path.resolve(process.argv[2] || path.join(HERE, 'soup.js'));
const r = run(file), n = Object.keys(r).length, ok = Object.values(r).filter((f) => !f.length).length;
console.log(`selftest-merged: ${ok}/${n} predicates hold (${path.basename(file)})`);
process.exit(ok === n ? 0 : 1);
