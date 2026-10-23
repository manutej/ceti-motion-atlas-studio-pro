// node work/vector3/selftest-B.js — contract predicates 1-10 for work/vector3/cand-B.js on both v9 boards. No deps.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..'), CAND = path.join(__dirname, 'cand-B.js'), SRC = fs.readFileSync(CAND, 'utf8');
const tokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'work', 'tokens.resolved.json'), 'utf8'));
let fails = 0, total = 0; const ok = (c, m) => { total++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const hits = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inBox = (p, b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;

// ---- fixture: both boards via the data sandbox (work/music3/CONTRACT.md §Self-test) ----
const dsb = { console, Math, JSON, Date, Object, Array, Number, String, setTimeout, clearTimeout, setInterval, clearInterval,
  document: { getElementById: () => null, addEventListener: () => {}, createElement: () => ({ style: {}, getContext: () => null }) } };
dsb.window = dsb; dsb.globalThis = dsb; vm.createContext(dsb);
['geome-wada.js', 'studio-motion-engine.js', 'vendor/sfx-kit.js', 'studio-music-engine.js', 'studio-canvas-oauth.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), dsb, { filename: f }));
const BOARDS = ['v9-mcp-server', 'v9-planning-fallacy'].map(k => ({ k, sheet: JSON.parse(JSON.stringify(dsb.STUDIO_CANVAS_OAUTH.buildStoryboardSheet({ boardKey: k, charId: 'ceti-whale', palId: 343 }))) }));

// ---- render harness = work/two/selftest-merged.js:1-28 ----
const ops = () => {
  const trace = []; const rec = (name) => (...a) => { trace.push(name + '(' + a.map(v => typeof v === 'number' ? +v.toFixed(3) : (v && v.tagName) ? 'EL' : String(v)).join(',') + ')'); };
  const g = () => ({ addColorStop: rec('stop') });
  const c = { canvas: { width: 480, height: 300 }, getOps: () => trace.length, trace: () => trace.join('\n'), measureText: (s) => ({ width: String(s || '').length * 7 }),
    createRadialGradient: g, createLinearGradient: g, fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1, globalCompositeOperation: 'source-over', font: '12px x', textAlign: 'left', textBaseline: 'alphabetic' };
  ['save', 'restore', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo', 'arc', 'arcTo', 'ellipse', 'rect', 'fill', 'stroke', 'clip', 'fillRect', 'strokeRect', 'clearRect', 'fillText', 'strokeText', 'translate', 'rotate', 'scale', 'setTransform', 'transform', 'drawImage', 'setLineDash'].forEach(n => { c[n] = rec(n); });
  return c;
};
const made = []; function mkCanvas() { const c = { width: 480, height: 300, style: {}, tagName: 'CANVAS', nodeType: 1, getContext: () => (c._ctx = c._ctx || ops()) }; made.push(c); return c; }
function sandbox(withDoc) {
  const sb = { console, Math, Date, JSON, Array, Object, String, Number, Boolean, RegExp, Map, Set, WeakMap, Promise, Uint8Array, Float32Array, Error, TypeError, Symbol, parseInt, parseFloat, isNaN, isFinite, setTimeout, clearTimeout, devicePixelRatio: 1,
    performance: { now: () => 0 }, requestAnimationFrame: () => 1, cancelAnimationFrame: () => {}, navigator: { userAgent: 'node' }, matchMedia: () => ({ matches: false }) };
  if (withDoc) sb.document = { head: { appendChild: () => {} }, body: {}, createElement: (t) => t === 'canvas' ? mkCanvas() : { style: {}, setAttribute() {}, appendChild() {} }, createElementNS: () => ({ style: {}, setAttribute() {}, appendChild() {} }), getElementById: () => null, addEventListener() {} };
  sb.window = sb; sb.globalThis = sb; sb.self = sb; return vm.createContext(sb);
}
const PAL = { paper: '#fbf3e6', ink: '#064f6e', a: '#ebd3a2', h: '#ae5224', b: '#635a3a', c: '#064f6e' };
const P = { paper: '#fbf3e6', ink: '#064f6e', a: '#ebd3a2', h: '#ae5224', b: '#635a3a', c: '#064f6e', sw: ['#ebd3a2', '#ae5224', '#635a3a', '#064f6e'] };
const load = (src, withTwo, withRenderer) => {
  const sb = sandbox(true);
  if (withTwo) vm.runInContext(fs.readFileSync(path.join(ROOT, 'vendor', 'two.min.js'), 'utf8'), sb, { filename: 'two.min.js' });
  if (withRenderer) vm.runInContext(fs.readFileSync(path.join(ROOT, 'studio-two-renderer.js'), 'utf8'), sb, { filename: 'studio-two-renderer.js' });
  vm.runInContext(src, sb, { filename: 'cand-B.js' }); return sb;
};

// ---- predicate 5 as a function (re-used by the negative mutation) ----
function charOk(S) {
  return BOARDS.every(({ sheet }) => sheet.beats.every(b => {
    if (S.fromBeat(b, tokens, 7).character.visible !== false) return false;
    const c = S.fromBeat(Object.assign({}, b, { character: 'ceti-whale' }), tokens, 7).character, x = c.box;
    return c.visible === true && x.x >= 0 && x.y >= 0 && x.x + x.w <= 1 && x.y + x.h <= 1 && !hits(x, b.textBox);
  }));
}

const S = require(CAND), KEYS = ['kind', 'id', 'role', 'box', 'label', 'from', 'word', 'at', 'n', 'to'];
const rows = [];
for (const { k, sheet } of BOARDS) {
  const scenes = sheet.beats.map(b => S.fromBeat(b, tokens, 7));
  let g38 = true, fromOk = true, shape = true, tbOk = true, hsOk = true, one = true;
  sheet.beats.forEach((b, i) => {
    const sc = scenes[i], cv = S.coverage(sc);
    rows.push(`| ${k.slice(3, 6)} ${b.index} ${b.grammar} | ${sc.primitives.map(p => p.kind).join(' ')} | ${cv.showTermsMatched.join(', ')} | ${cv.unmatched.join(', ') || '—'} |`);
    if (cv.unmatched.length || !sc.primitives.length) g38 = false;
    if (!sc.primitives.every(p => String(b.show).toLowerCase().indexOf(String(p.from).toLowerCase()) >= 0 && p.from !== '')) fromOk = false;
    if (!eq(Object.keys(sc).sort(), ['character', 'hotspot', 'primitives', 'textBox']) || !sc.primitives.every(p => Object.keys(p).every(x => KEYS.includes(x)) && Object.keys(tokens.color).includes(p.role) && p.id.indexOf('b' + b.index + '_') === 0)) shape = false;
    if (sc.primitives.some(p => hits(p.box, b.textBox)) || !eq(sc.textBox, b.textBox)) tbOk = false;
    const h = sc.hotspot, boxes = sc.primitives.map(p => p.box).concat(sc.character.visible ? [sc.character.box] : []);
    if (!(h.x >= 0 && h.x <= 1 && h.y >= 0 && h.y <= 1 && boxes.some(x => inBox(h, x)))) hsOk = false;
    const mk = sc.primitives.filter(p => p.kind === 'mask'), top = Math.max(...sc.primitives.map(p => p.word));
    if (mk.length > 1 || sc.primitives.filter(p => p.kind === 'counter').length > 1 || (mk[0] && (mk[0].word !== top || !inBox(h, mk[0].box)))) one = false;
  });
  ok(g38, `[${k}] P1 G38 show = drawn: unmatched = 0 on all ${sheet.beats.length} beats, ≥ 1 primitive`);
  ok(fromOk, `[${k}] P1 every primitive.from is a substring of beat.show`);
  ok(shape, `[${k}] API shape: scene keys exact, primitive fields ⊆ contract, role ∈ tokens.color, id prefix b<index>_`);
  const bi = sheet.beats.findIndex(b => b.grammar === 'breather'), br = scenes[bi].primitives, mn = Math.min(...scenes.map(s => s.primitives.length));
  ok(br.length <= 2 && !br.some(p => p.kind === 'arrow' || p.kind === 'path') && br.length === mn, `[${k}] P2 breather ≤ 2 primitives (${br.length}), no arrow/path, fewest of board (min ${mn})`);
  ok(tbOk, `[${k}] P3 textBox clear of every primitive box; scene.textBox deep-equals beat.textBox`);
  ok(hsOk && one, `[${k}] P4 one hotspot in [0,1]² inside a box; ≤ 1 mask (= last to land), ≤ 1 counter`);
  ok(sheet.beats.every(b => eq(S.fromBeat(b, tokens, 7), S.fromBeat(b, tokens, 7)) && eq(S.fromBeat(b, tokens, 7), S.fromBeat(b, tokens, 99))), `[${k}] P7 fromBeat deep-equal on repeat and across seeds`);
}
ok(charOk(S), 'P5 character hidden on every beat; with beat.character it is visible, in frame, clear of textBox');

// ---- render predicates (4 audit, 6 drift + passes, 7 seek + reduced) ----
{
  const sb = load(SRC, true, true), L = sb.TWO_LAYER, SB = sb.SCENE_B; L.init({ cdn: false });
  let last = null; const real = L.renderFrame; L.renderFrame = function (c, t, b2) { last = b2; return real.apply(this, arguments); };
  const stage = () => made[made.length - 1]._ctx;
  let audit = true, drift = true, passes = true, seek = true, red = true;
  for (const { k, sheet } of BOARDS) for (const b of sheet.beats) {
    const sc = SB.fromBeat(b, tokens, 7), O = (x) => Object.assign({ beat: b, palette: PAL, seed: 7, P, sheet }, x || {});
    const mf = SB.render(ops(), sc, b.tMidSec, 'front', O()), mb = SB.render(ops(), sc, b.tMidSec, 'back', O());
    if (!mf || !mb || mf.pass !== 'front' || mb.pass !== 'back') passes = false;
    const nd = (mf && mf.diagram && mf.diagram.nodes) || [];
    if (!nd.length || !nd.every(n => n.id.indexOf('b' + b.index + '_') === 0) || nd.length !== SB.toDiagram(sc).nodes.length) drift = false;
    SB.render(ops(), sc, b.tMidSec, 'front', O()); const a = L.audit(b.tMidSec, last, PAL, 7, P, { sheet });
    if (a.spotlights !== 1 || a.offPalette.length !== 0) { audit = false; console.log('  audit', k, b.index, a.spotlights, a.offPalette.slice(0, 3)); }
    const tr = (t, hist, x) => { hist.forEach(h => SB.render(ops(), sc, h, 'all', O(x))); const st = stage(), n0 = st.getOps(); SB.render(ops(), sc, t, 'all', O(x)); return stage().trace().split('\n').slice(n0).join('\n'); };
    const t = b.tStartSec + (b.tEndSec - b.tStartSec) * 0.6, A1 = tr(t, []), A2 = tr(t, [b.tStartSec + 0.1, b.tEndSec - 0.2]);
    if (!(A1.length > 100 && A1 === A2)) seek = false;
    const R = [b.tStartSec, b.tMidSec, b.tEndSec - 1e-3].map(x => tr(x, [], { reduced: true }));
    if (!(R[0].length > 100 && R[0] === R[1] && R[1] === R[2])) red = false;
  }
  ok(audit, 'P4 TWO_LAYER.audit(tMid, b2): spotlights === 1, offPalette = [] on all 15 beats');
  ok(drift, 'P6 front meta diagram.nodes all carry b<index>_ and count === toDiagram(scene).nodes.length');
  ok(passes, 'P6 render back → pass back, front → pass front (meta)');
  ok(seek, 'P7 op-trace at t identical after seeks to two other t');
  ok(red, 'P7 reduced: identical trace at tStart, tMid, tEnd − 1e-3');
}
// ---- predicate 8: without Two (and without TWO_LAYER) ----
{
  const b = BOARDS[0].sheet.beats[1];
  const s1 = load(SRC, false, true), s2 = load(SRC, false, false), c1 = ops(), c2 = ops();
  const sc = s1.SCENE_B.fromBeat(b, tokens, 7);
  const r1 = s1.SCENE_B.render(c1, sc, 2.5, 'front', { beat: b, palette: PAL, seed: 7, P }), r2 = s2.SCENE_B.render(c2, sc, 2.5, 'front', { beat: b, palette: PAL, seed: 7, P });
  ok(r1 === false && r2 === false && c1.getOps() === 0 && c2.getOps() === 0 && sc.primitives.length > 0, 'P8 no Two / no TWO_LAYER: render → false, 0 ctx ops; fromBeat still pure');
}
// ---- predicate 9: text ----
const FORBID = /Math\.random|Date\.now|performance\.now|requestAnimationFrame|two\.play\(|makeRectangle|makeText|makePath|fillStyle|font/;
ok(!FORBID.test(SRC), 'P9 forbidden-token regex: none');
ok(Buffer.byteLength(SRC) <= 16384 && typeof S.VERSION === 'string' && S.VERSION.length > 0, `P9 size ${Buffer.byteLength(SRC)} B ≤ 16 KB, VERSION ${S.VERSION}`);
const cl = cp.spawnSync(process.execPath, [path.join(ROOT, 'skills/motion-soup/scripts/soup-runner.mjs'), 'check-literals', CAND, '--tokens', path.join(ROOT, 'work/tokens.resolved.json')], { cwd: ROOT, encoding: 'utf8' });
ok(cl.status === 0, 'P9 check-literals exit ' + cl.status);
// ---- predicate 10: negative mutation ----
{
  const NEEDLE = 'visible: !!beat.character';
  const once = SRC.split(NEEDLE).length === 2, mut = SRC.replace(NEEDLE, 'visible: true');
  const ms = load(mut, false, false).SCENE_B; let caught = false;
  try { caught = !charOk(ms); } catch (e) { caught = true; }
  ok(once && caught, 'P10 mutation "visible: true" on a copy → P5 FAILS (caught)');
}
if (process.env.ROWS) console.log(rows.join('\n'));
console.log(`\n${total - fails}/${total} passed`);
process.exit(fails ? 1 : 0);
