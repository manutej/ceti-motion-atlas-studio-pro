// node work/vector3/selftest-C.js [--dump]  — SCENE_C contract predicates 1-10 on both v9 boards (no deps).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const R = path.resolve(__dirname, '..', '..'), CAND = path.join(__dirname, 'cand-C.js'), SRC = fs.readFileSync(CAND, 'utf8');
const RSRC = fs.readFileSync(path.join(R, 'studio-two-renderer.js'), 'utf8'), TWO = fs.readFileSync(path.join(R, 'vendor', 'two.min.js'), 'utf8');
let fails = 0, total = 0; const ok = (c, m) => { total++; if (!c) { fails++; console.log('FAIL ' + m); } };
const J = JSON.stringify, hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (p, b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;

// ---- fixture: both boards via the data sandbox (work/music3/CONTRACT.md §Self-test) ----
const dsb = { console, Math, JSON, Date, Object, Array, Number, String, setTimeout, clearTimeout, setInterval, clearInterval,
  document: { getElementById: () => null, addEventListener: () => {}, createElement: () => ({ style: {}, getContext: () => null }) } };
dsb.window = dsb; dsb.globalThis = dsb; vm.createContext(dsb);
['geome-wada.js', 'studio-motion-engine.js', 'vendor/sfx-kit.js', 'studio-music-engine.js', 'studio-canvas-oauth.js']
  .forEach(f => vm.runInContext(fs.readFileSync(path.join(R, f), 'utf8'), dsb, { filename: f }));
const BOARDS = {};
['v9-mcp-server', 'v9-planning-fallacy'].forEach(k => { BOARDS[k] = JSON.parse(J(dsb.STUDIO_CANVAS_OAUTH.buildStoryboardSheet({ boardKey: k, charId: 'ceti-whale', palId: 343 }))); });
const tokens = JSON.parse(fs.readFileSync(path.join(R, 'work', 'tokens.resolved.json'), 'utf8'));

// ---- render harness (work/two/selftest-merged.js:1-28) ----
const ops = () => {
  const trace = []; const rec = (name) => (...a) => { trace.push(name + '(' + a.map(v => typeof v === 'number' ? +v.toFixed(3) : (v && v.tagName) ? 'EL' : String(v)).join(',') + ')'); };
  const g = () => ({ addColorStop: rec('stop') });
  const c = { canvas: { width: 480, height: 300 }, getOps: () => trace.length, trace: () => trace.join('\n'), measureText: (s) => ({ width: String(s || '').length * 7 }),
    createRadialGradient: g, createLinearGradient: g, fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1, globalCompositeOperation: 'source-over', textAlign: 'left', textBaseline: 'alphabetic' };
  ['save', 'restore', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo', 'arc', 'arcTo', 'ellipse', 'rect', 'fill', 'stroke', 'clip', 'fillRect', 'strokeRect', 'clearRect', 'fillText', 'strokeText', 'translate', 'rotate', 'scale', 'setTransform', 'transform', 'drawImage', 'setLineDash'].forEach(n => { c[n] = rec(n); });
  return c;
};
let made = []; function mkCanvas() { const c = { width: 480, height: 300, style: {}, tagName: 'CANVAS', nodeType: 1, getContext: () => (c._ctx = c._ctx || ops()) }; made.push(c); return c; }
function sandbox(withDoc) {
  const sb = { console, Math, Date, JSON, Array, Object, String, Number, Boolean, RegExp, Map, Set, Promise, Uint8Array, Float32Array, Error, TypeError, Symbol, parseInt, parseFloat, isNaN, isFinite, setTimeout, clearTimeout, devicePixelRatio: 1,
    performance: { now: () => 0 }, requestAnimationFrame: () => 1, cancelAnimationFrame: () => {}, navigator: { userAgent: 'node' }, matchMedia: () => ({ matches: false }) };
  if (withDoc) sb.document = { head: { appendChild: () => {} }, body: {}, createElement: (t) => t === 'canvas' ? mkCanvas() : { style: {}, setAttribute() {}, appendChild() {} }, createElementNS: () => ({ style: {}, setAttribute() {}, appendChild() {} }), getElementById: () => null, addEventListener() {} };
  sb.window = sb; sb.globalThis = sb; sb.self = sb; return vm.createContext(sb);
}
const PAL = { paper: '#fbf3e6', ink: '#064f6e', a: '#ebd3a2', h: '#ae5224', b: '#635a3a', c: '#064f6e' };
const P = { paper: '#fbf3e6', ink: '#064f6e', a: '#ebd3a2', h: '#ae5224', b: '#635a3a', c: '#064f6e', sw: ['#ebd3a2', '#ae5224', '#635a3a', '#064f6e'] };
function load(withTwo, src) { made = []; const sb = sandbox(true); if (withTwo) vm.runInContext(TWO, sb); vm.runInContext(RSRC, sb); vm.runInContext(src || SRC, sb); return sb; }

// ---- predicate 5 as a function (re-used by the negative mutation) ----
function charOK(S) {
  return Object.values(BOARDS).every(sh => sh.beats.every(b => {
    if (S.fromBeat(b, tokens, 7).character.visible !== false) return false;
    const c = Object.assign({}, b, { character: 'ceti-whale' }), ch = S.fromBeat(c, tokens, 7).character, x = ch.box;
    return ch.visible === true && x.x >= 0 && x.y >= 0 && x.x + x.w <= 1 && x.y + x.h <= 1 && !hit(x, b.textBox);
  }));
}

const sb = load(true), S = sb.SCENE_C, TL = sb.TWO_LAYER;
let captured = null; const rf = TL.renderFrame; TL.renderFrame = function (ctx, t, b2) { captured = b2; return rf.apply(this, arguments); };
const stage = () => made.filter(c => c._ctx).pop();
function frame(sc, b, sh, t, extra) {
  const st = stage(), n0 = st ? st._ctx.trace().length : 0;
  const meta = S.render(ops(), sc, t, 'front', Object.assign({ beat: b, palette: PAL, seed: 7, P, sheet: sh }, extra || {}));
  const st2 = stage(); return { meta, trace: st2 ? st2._ctx.trace().slice(st2 === st ? n0 : 0) : '' };
}

for (const [key, sh] of Object.entries(BOARDS)) {
  const scenes = sh.beats.map(b => S.fromBeat(b, tokens, 7));
  if (process.argv.includes('--dump')) scenes.forEach((s, i) => console.log(key, i, J(s.primitives.map(p => [p.kind, p.label, p.from, p.word, p.box.x, p.box.y])), J(s.hotspot)));
  const counts = scenes.map(s => s.primitives.length);
  sh.beats.forEach((b, i) => {
    const sc = scenes[i], tag = key + '#' + i, pr = sc.primitives, cov = S.coverage(sc);
    // 1 G38 show = drawn
    ok(cov.unmatched.length === 0 && cov.showTermsMatched.length === S.terms(b.show).length, tag + ' G38 unmatched=' + J(cov.unmatched));
    ok(pr.length >= 1 && pr.every(p => b.show.toLowerCase().indexOf(String(p.from).toLowerCase()) >= 0 && p.from.length > 0), tag + ' from ⊂ show');
    // 2 breather
    if (b.grammar === 'breather') ok(pr.length <= 2 && !pr.some(p => p.kind === 'arrow' || p.kind === 'path') && pr.length === Math.min(...counts), tag + ' breather minimal');
    // 3 text box
    ok(pr.every(p => !hit(p.box, b.textBox)) && J(sc.textBox) === J(b.textBox), tag + ' textBox clear');
    // 4 one hotspot
    const h = sc.hotspot, boxes = pr.map(p => p.box).concat(sc.character.visible ? [sc.character.box] : []);
    ok(h.x >= 0 && h.x <= 1 && h.y >= 0 && h.y <= 1 && boxes.some(x => inside(h, x)), tag + ' hotspot inside a box');
    ok(pr.filter(p => p.kind === 'mask').length <= 1 && pr.filter(p => p.kind === 'counter').length <= 1, tag + ' ≤1 mask/counter');
    const f = frame(sc, b, sh, b.tMidSec), au = TL.audit(b.tMidSec, captured, PAL, 7, P, { sheet: sh });
    ok(au.spotlights === 1 && au.offPalette.length === 0, tag + ' audit spot=' + au.spotlights + ' off=' + au.offPalette.length);
    // 6 drift + passes
    const dn = S.toDiagram(sc).nodes;
    ok(f.meta && f.meta.pass === 'front' && f.meta.diagram.nodes.length === dn.length && f.meta.diagram.nodes.every(n => n.id.indexOf('b' + b.index + '_') === 0), tag + ' front meta = own scene');
    const bk = S.render(ops(), sc, b.tMidSec, 'back', { beat: b, palette: PAL, seed: 7, P, sheet: sh });
    ok(bk && bk.pass === 'back', tag + ' back pass');
    // 7 determinism + reduced motion
    ok(J(S.fromBeat(b, tokens, 7)) === J(sc) && J(S.fromBeat(b, tokens, 11)) === J(sc), tag + ' fromBeat deep-equal (repeat, seed)');
    const t = b.tMidSec, a1 = frame(sc, b, sh, t).trace; frame(sc, b, sh, b.tStartSec); frame(sc, b, sh, b.tEndSec - 0.01);
    ok(a1.length > 0 && frame(sc, b, sh, t).trace === a1, tag + ' seek-history determinism');
    const rd = [b.tStartSec, b.tMidSec, b.tEndSec - 1e-3].map(x => frame(sc, b, sh, x, { reduced: true }).trace);
    ok(rd[0] === rd[1] && rd[1] === rd[2], tag + ' reduced ⇒ settled');
  });
}
// 5 character
ok(charOK(S), 'character hidden on boards; visible + clear when beat.character set');
// 8 without Two
const nb = load(false), nctx = ops(), b0 = BOARDS['v9-mcp-server'].beats[0], sc0 = nb.SCENE_C.fromBeat(b0, tokens, 7);
ok(nb.SCENE_C.render(nctx, sc0, 1, 'front', { beat: b0, palette: PAL, seed: 7, P }) === false && nctx.getOps() === 0 && sc0.primitives.length > 0, 'no Two ⇒ false, 0 ops, fromBeat pure');
// 9 text
ok(!/Math\.random|Date\.now|performance\.now|requestAnimationFrame|two\.play\(|makeRectangle|makeText|makePath|fillStyle|font/.test(SRC), 'forbidden tokens absent');
ok(Buffer.byteLength(SRC) <= 16384 && typeof S.VERSION === 'string' && S.VERSION.length > 0, 'size ≤ 16 KB + VERSION (' + Buffer.byteLength(SRC) + ' B)');
const cl = cp.spawnSync(process.execPath, ['skills/motion-soup/scripts/soup-runner.mjs', 'check-literals', path.relative(R, CAND), '--tokens', 'work/tokens.resolved.json'], { cwd: R, encoding: 'utf8' });
ok(cl.status === 0, 'check-literals exit ' + cl.status);
// 10 negative mutation on a copy: predicate 5 must FAIL
const NEEDLE = 'visible: !!beat.character', occ = SRC.split(NEEDLE).length - 1;
ok(occ === 1, 'mutation needle occurs once (' + occ + ')');
const mut = load(false, SRC.replace(NEEDLE, 'visible: true')), caught = !charOK(mut.SCENE_C);
ok(caught, 'negative mutation caught');
console.log((fails ? 'FAIL' : 'PASS') + ' selftest-C ' + (total - fails) + '/' + total + (caught ? ' · mutation caught' : ''));
process.exit(fails ? 1 : 0);
