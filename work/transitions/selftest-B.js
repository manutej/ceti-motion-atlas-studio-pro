#!/usr/bin/env node
// selftest-B — checks every predicate of CONTRACT.md §self-test against cand-B.js. No deps.
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert'), vm = require('vm'), cp = require('child_process');

const HERE = __dirname, ROOT = path.resolve(HERE, '..', '..');
const SRC_PATH = path.join(HERE, 'cand-B.js');
const TOK_PATH = path.join(ROOT, 'work', 'tokens.resolved.json');
const src = fs.readFileSync(SRC_PATH, 'utf8');
const tokens = JSON.parse(fs.readFileSync(TOK_PATH, 'utf8'));
const md = fs.readFileSync(path.join(ROOT, 'work', 'wording', 'storyboard-grammar.md'), 'utf8');
const boards = [...md.matchAll(/```json\s*\n([\s\S]*?)\n```/g)]
  .map((m) => { try { return JSON.parse(m[1]); } catch (e) { return null; } })
  .filter((b) => b && Array.isArray(b.beats) && b.beats.some((x) => x.grammar));

const api = require(SRC_PATH);
const fails = [];
const check = (id, list) => { if (list.length) fails.push(...list.map((m) => `${id}: ${m}`)); else console.log(`ok  ${id}`); };
const EPS = 1e-9;
const REV = { cut: 'cut', wipe: 'wipe-back', 'wipe-back': 'wipe', iris: 'iris-back', 'iris-back': 'iris', split: 'split' };
const FOCI = [{ x: 0.5, y: 0.5 }, { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 1 / 3, y: 2 / 3 }];
const US = Array.from({ length: 11 }, (_, i) => i / 10);

function loadCopy(code) {   // isolated realm; used for the negative mutation
  const ctx = { module: { exports: {} } };
  vm.runInNewContext(code, ctx, { filename: 'cand-B.mutant.js' });
  return ctx.module.exports;
}

// ---- predicates (each returns a list of failure strings) ----
function p1(A) {
  const out = [];
  for (const b of boards) for (const tr of A.plan(b, tokens, 0)) {
    const n = String(tr.semantic || '').trim().split(/\s+/).filter(Boolean).length;
    if (!n || n > 14) out.push(`${b.id} ${tr.from}->${tr.to} semantic has ${n} words`);
  }
  if (!boards.length) out.push('no example boards found');
  return out;
}
function p2(A) {
  const out = []; let seen = { breather: 0, callback: 0, landing: 0 };
  for (const b of boards) {
    const beats = A.normalize(b), trs = A.plan(b, tokens, 0);
    trs.forEach((tr, i) => {
      const to = beats[i + 1];
      if (to.grammar === 'breather') { seen.breather++; if (tr.kind !== 'cut') out.push(`${b.id} breather ${to.id} kind=${tr.kind}`); }
      if (tr.relation === 'callback') { seen.callback++; const want = REV[A.table.hook]; if (tr.kind !== want) out.push(`${b.id} callback ${to.id} kind=${tr.kind} want ${want}`); }
      if (to.grammar === 'landing') { seen.landing++; if (tr.kind !== 'iris-back' && tr.kind !== 'cut') out.push(`${b.id} landing ${to.id} kind=${tr.kind}`); }
    });
  }
  if (REV[A.table.callback] !== A.table.hook) out.push(`table.callback ${A.table.callback} is not reverse of hook ${A.table.hook}`);
  if (A.table.breather !== 'cut') out.push(`table.breather=${A.table.breather}`);
  for (const k of Object.keys(seen)) if (!seen[k]) out.push(`vacuous: no ${k} transition on boards`);
  return out;
}
function p3(A) {
  const out = [];
  for (const kind of A.KINDS) for (const f of FOCI) {
    let prev = -Infinity;
    for (const u of US) {
      const m1 = A.mask(kind, u, f, 640, 360), m2 = A.mask(kind, u, f, 640, 360);
      try { assert.deepStrictEqual(m1, m2); } catch (e) { out.push(`mask ${kind} u=${u} not repeatable`); }
      if (!Array.isArray(m1) || !m1.length || m1[0][0] !== 'M') out.push(`mask ${kind} u=${u} malformed`);
      const c = A.coverage(kind, u, 640, 360, f);
      if (!(c >= 0 && c <= 1)) out.push(`coverage ${kind} u=${u} out of [0,1]: ${c}`);
      if (c + EPS < prev) out.push(`coverage ${kind} not monotone at u=${u} (${prev} -> ${c})`);
      prev = c;
    }
    if (A.coverage(kind, 0, 640, 360, f) > EPS) out.push(`coverage ${kind} u=0 not 0`);
    if (A.coverage(kind, 1, 640, 360, f) < 1 - 1e-6) out.push(`coverage ${kind} u=1 not 1`);
    const cDefault = A.coverage(kind, 0.5, 640, 360);
    if (!(cDefault >= 0 && cDefault <= 1)) out.push(`coverage ${kind} 4-arg form broken`);
  }
  return out;
}
function p4(A) {
  const out = [];
  for (const b of boards) {
    const beats = A.normalize(b), trs = A.plan(b, tokens, 0);
    trs.forEach((tr, i) => {
      const lim = Math.min(beats[i].dur, beats[i + 1].dur);
      if (!(tr.t1 - tr.t0 <= lim + EPS)) out.push(`${b.id} ${tr.to} span ${tr.t1 - tr.t0} > ${lim}`);
      if (!(tr.t1 >= tr.t0)) out.push(`${b.id} ${tr.to} t1<t0`);
      if (Math.abs((tr.t0 + tr.t1) / 2 - beats[i + 1].start) > EPS) out.push(`${b.id} ${tr.to} not centred on toBeat.start`);
      if (i && trs[i - 1].t1 > tr.t0 + EPS) out.push(`${b.id} ${trs[i - 1].to}/${tr.to} overlap`);
    });
  }
  return out;
}
function p5(code) {
  const out = [];
  const forbidden = new RegExp(['Math\\.random', 'Date\\.now', 'performance\\.now', 'requestAnimationFrame'].join('|'));
  if (forbidden.test(code)) out.push(`forbidden token: ${code.match(forbidden)[0]}`);
  if (/cubic-bezier|\[\s*-?\d*\.\d+\s*,\s*-?\d*\.\d+\s*,\s*-?\d*\.\d+\s*,\s*-?\d*\.\d+\s*\]/.test(code)) out.push('numeric easing constant in source');
  if (/\b\d{2,3}\s*bpm\b|tempo\s*[:=]\s*\d/i.test(code)) out.push('bpm literal in source');
  const fonts = new RegExp(['Fraunces', 'DM Sans', 'Space Mono', 'Georgia', 'monospace'].join('|'));
  if (fonts.test(code)) out.push('font literal in source');
  try {
    cp.execFileSync(process.execPath, [path.join(ROOT, 'skills', 'motion-soup', 'scripts', 'soup-runner.mjs'), 'check-literals', SRC_PATH, '--tokens', TOK_PATH], { cwd: ROOT, stdio: 'pipe' });
  } catch (e) { out.push(`check-literals exit ${e.status}: ${String(e.stdout || '').trim()}`); }
  return out;
}
function p6(A) {
  const out = [];
  for (const b of boards) {
    const beats = A.normalize(b), ctx = { beats, seed: 7 };
    for (let i = 1; i < beats.length; i++) {
      try { assert.deepStrictEqual(A.transitionFor(beats[i - 1], beats[i], tokens, ctx), A.transitionFor(beats[i - 1], beats[i], tokens, ctx)); }
      catch (e) { out.push(`${b.id} transitionFor ${beats[i].id} not deterministic`); }
    }
    try { assert.deepStrictEqual(A.plan(b, tokens, 7), A.plan(b, tokens, 7)); } catch (e) { out.push(`${b.id} plan not deterministic`); }
    const trs = A.plan(b, tokens, 7);
    for (const tr of trs) for (const u of US) {
      const t = tr.t0 + (tr.t1 - tr.t0) * u;
      try { assert.deepStrictEqual(A.maskAt(tr, t, 320, 180, tokens), A.maskAt(tr, t, 320, 180, tokens)); } catch (e) { out.push(`maskAt not deterministic`); }
    }
  }
  return out;
}
// lens + G31 (not in the contract list, but the candidate's own claims)
function lens(A) {
  const out = [];
  for (const b of boards) {
    const beats = A.normalize(b), trs = A.plan(b, tokens, 0), ctx = { beats, seed: 0 };
    const hook = beats.find((x) => x.grammar === 'hook');
    trs.forEach((tr, i) => {
      const f = tr.focus;
      if (!f || Object.keys(f).sort().join() !== 'x,y' || !(f.x >= 0 && f.x <= 1 && f.y >= 0 && f.y <= 1)) out.push(`${b.id} ${tr.to} focus not one point in [0,1]^2`);
      try { assert.deepStrictEqual(f, A.focusOf(beats[i + 1], ctx)); } catch (e) { out.push(`${b.id} ${tr.to} focus is not the incoming beat's hot spot`); }
      const to = beats[i + 1];
      if (to.grammar === 'landing' && hook) { try { assert.deepStrictEqual(f, A.focusOf(hook, ctx)); } catch (e) { out.push(`${b.id} landing does not close on the hook focus`); } }
      if (to.returns) { const p = beats.find((x) => x.plant === to.returns); if (p && to.grammar !== 'landing') { try { assert.deepStrictEqual(f, A.focusOf(p, ctx)); } catch (e) { out.push(`${b.id} callback not on planted focus`); } } }
      if (!['attention', 'continuity', 'change', 'character'].includes(tr.because)) out.push(`${b.id} ${tr.to} because=${tr.because}`);
    });
  }
  const P = (o) => Object.assign({ id: 'x', start: 4, dur: 2, say: 'x' }, o);
  if (A.transitionFor(P({ grammar: 'proof', claimId: 'a' }), P({ grammar: 'proof', claimId: 'b', id: 'y' }), tokens).kind !== 'split') out.push('proof→proof different claim is not split');
  if (A.transitionFor(P({ grammar: 'hook' }), P({ grammar: 'claim', say: 'But not so.' }), tokens).kind !== 'split') out.push('hook→claim "But" is not split');
  if (A.drawTwo(null, A.mask('iris', 0.5)) !== null) out.push('G31 drawTwo(null) not a no-op');
  if (A.drawTwo({ add() { throw new Error('touched'); } }, A.mask('iris', 0.5)) !== null) out.push('G31 drawTwo without Two not a no-op');
  if (fs.statSync(SRC_PATH).size > 18 * 1024) out.push('cand-B.js over 18 KB');
  return out;
}

check('P1 semantic ≤14 words', p1(api));
check('P2 breather/callback/landing kinds', p2(api));
check('P3 mask repeatable, coverage monotone', p3(api));
check('P4 spans fit beats, no overlap', p4(api));
check('P5 forbidden tokens / literals', p5(src));
check('P6 same input → deep-equal', p6(api));
check('LENS one focus = incoming hot spot; G31', lens(api));

// P7 negative mutation: breather → wipe must make P2 fail
const NEEDLE = "breather: 'cut'";
const mutated = src.replace(NEEDLE, "breather: 'wipe'");
const p7 = [];
if (mutated === src) p7.push('mutation needle not found');
else {
  let mutFails = [];
  try { mutFails = p2(loadCopy(mutated)); } catch (e) { mutFails = ['mutant threw: ' + e.message]; }
  if (!mutFails.length) p7.push('mutant (breather→wipe) passed P2 — predicate is blind');
  else console.log(`    mutant caught by P2: ${mutFails[0]}`);
  if (p2(loadCopy(src)).length) p7.push('unpatched copy fails P2 in vm realm');
}
check('P7 negative mutation caught', p7);

if (fails.length) { for (const f of fails) console.log('FAIL ' + f); process.exit(1); }
console.log(`selftest-B: all predicates hold (${boards.length} boards, ${api.VERSION})`);
process.exit(0);
