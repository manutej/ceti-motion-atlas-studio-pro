// node work/two/selftest-B.js [path/to/two.js]
// 1) no Two → every entry point is a no-op and never throws   2) with Two (optional) → frames render, deterministic, pure in t
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = fs.readFileSync(path.join(__dirname, 'candidate-B.js'), 'utf8');
const ops = () => { let n = 0; const noop = () => { n++; }; const g = () => ({ addColorStop: noop });
  return { canvas: { width: 480, height: 300 }, getOps: () => n, save: noop, restore: noop, beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, bezierCurveTo: noop, quadraticCurveTo: noop, arc: noop, arcTo: noop, ellipse: noop, rect: noop, fill: noop, stroke: noop, clip: noop, fillRect: noop, strokeRect: noop, clearRect: noop, fillText: noop, strokeText: noop, translate: noop, rotate: noop, scale: noop, setTransform: noop, transform: noop, drawImage: noop, setLineDash: noop, measureText: (s) => ({ width: String(s || '').length * 7 }), createRadialGradient: g, createLinearGradient: g, fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1, globalCompositeOperation: 'source-over', font: '12px x', textAlign: 'left', textBaseline: 'alphabetic' }; };
const made = []; function mkCanvas() { const c = { width: 480, height: 300, style: {}, tagName: 'CANVAS', nodeType: 1, getContext: () => (c._ctx = c._ctx || ops()) }; made.push(c); return c; }
function sandbox(withDoc) {
  const sb = { console, Math, Date, JSON, Array, Object, String, Number, Boolean, RegExp, Map, Set, Promise, Uint8Array, Float32Array, Error, TypeError, Symbol, parseInt, parseFloat, isNaN, isFinite, setTimeout, clearTimeout, devicePixelRatio: 1,
    performance: { now: () => 0 }, requestAnimationFrame: () => 1, cancelAnimationFrame: () => {}, navigator: { userAgent: 'node' }, matchMedia: () => ({ matches: false }) };
  if (withDoc) sb.document = { head: { appendChild: () => {} }, body: {}, createElement: (t) => t === 'canvas' ? mkCanvas() : { style: {}, setAttribute() {}, appendChild() {} }, createElementNS: () => ({ style: {}, setAttribute() {}, appendChild() {} }), getElementById: () => null, addEventListener() {} };
  sb.window = sb; sb.globalThis = sb; sb.self = sb; return vm.createContext(sb);
}
const sheet = { title: 'What an MCP server is', beats: [
  { id: 'beat-1', index: 0, grammar: 'hook', role: 'hook', hinge: 'THEREFORE', say: 'Your AI is smart, but it cannot touch your files.', plant: 'locked drawer', tStartSec: 0, tEndSec: 2, cameraMove: 'static-wide', characterPose: { x: 0.3, y: 0.5, scale: 1 } },
  { id: 'beat-2', index: 1, grammar: 'claim', role: 'threshold', hinge: 'BUT', say: 'An MCP server is a plug adapter for tools.', label: 'The Adapter', tStartSec: 2, tEndSec: 4, cameraMove: 'push-in', counter: { from: 0, to: 128, unit: 'tools', label: 'tools reachable', word: 7, because: 'one adapter reaches every drawer' } },
  { id: 'beat-3', index: 2, grammar: 'proof', claimId: 'beat-2', role: 'escalation', hinge: 'THEREFORE', say: 'The server lists what it can do.', label: 'The Menu', tStartSec: 4, tEndSec: 6, cameraMove: 'pan-follow' },
  { id: 'beat-4', index: 3, grammar: 'breather', role: 'breather', hinge: 'THEREFORE', say: 'That is the whole trick.', label: 'Breather Hold', tStartSec: 6, tEndSec: 8, cameraMove: 'breather-hold' },
  { id: 'beat-5', index: 4, grammar: 'callback', role: 'climax', hinge: 'BUT', returns: 'locked drawer', say: 'Same adapter, any drawer: calendar, database, your inbox.', label: 'Every Drawer', tStartSec: 8, tEndSec: 10, cameraMove: 'kick-shake' },
  { id: 'beat-6', index: 5, grammar: 'landing', role: 'callback', hinge: 'THEREFORE', say: 'MCP: one plug, every tool.', label: 'Calm Callback', tStartSec: 10, tEndSec: 12, cameraMove: 'pull-back' } ] };
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

// --- 1. no Two -------------------------------------------------------------
{
  const sb = sandbox(true); vm.runInContext(SRC, sb, { filename: 'candidate-B.js' });
  const L = sb.TWO_LAYER_B; ok(!!L && typeof L.renderFrame === 'function', 'IIFE exposes window.TWO_LAYER_B');
  ok(L.isAvailable() === false, 'isAvailable() → false without Two');
  let threw = false, r1, r2, r3; const ctx = ops();
  try { r1 = L.init({ cdn: false }); r2 = L.renderFrame(ctx, 3.1, sheet.beats[1], { paper: '#FBF3E6', ink: '#064f6e', a: '#ebd3a2', h: '#ae5224', b: '#635a3a', c: '#064f6e' }, 7, { sheet }); r3 = L.renderFrame(null, 0); L.onReady(() => {}); L.dispose(); L.dispose(); } catch (e) { threw = true; console.log('  threw:', e && e.message); }
  ok(!threw, 'init/renderFrame/dispose never throw without Two');
  ok(r1 === false && r2 === false && r3 === false && ctx.getOps() === 0, 'no-op: renderFrame → false, zero ctx ops (G06 mock-ctx safe)');
  const sb2 = sandbox(false); vm.runInContext(SRC, sb2, { filename: 'candidate-B.js' }); let t2 = false;
  try { sb2.TWO_LAYER_B.init(); sb2.TWO_LAYER_B.renderFrame(ops(), 1, null, null, 1, { sheet }); } catch (e) { t2 = true; }
  ok(!t2 && sb2.TWO_LAYER_B.isAvailable() === false, 'no document, no Two → still no-op, no throw');
  const pure = vm.runInContext('TWO_LAYER_B.modules.sayTiming(TWO_LAYER_B.modules.env(2.8, null, null, 7, {sheet: ' + JSON.stringify(sheet) + '}))', sb);
  ok(pure.n === 9 && pure.at(8) > pure.at(0) && pure.at(8) <= 4, 'say timing law: 9 words land in order inside beat 2 (last at ' + pure.at(8).toFixed(2) + 's)');
  const rel = vm.runInContext('(function(m,b){return b.map(function(x){return m.relation(x,b[0])});})(TWO_LAYER_B.modules,' + JSON.stringify(sheet.beats) + ')', sb);
  ok(rel.join(',') === 'wipe,iris,wipe,cut,wipe-back,iris-close', 'transition semantics: ' + rel.join(' → '));
  ok(!/Math\.random|Date\.now|performance\.now/.test(SRC), 'seeded PRNG only (no Math.random / Date.now / performance.now)');
  ok(Buffer.byteLength(SRC) <= 20 * 1024, 'size ' + Buffer.byteLength(SRC) + ' B ≤ 20480 B');
}
// --- 2. with Two (optional) --------------------------------------------------
const twoPath = process.argv[2];
if (twoPath && fs.existsSync(twoPath)) {
  const sb = sandbox(true); vm.runInContext(fs.readFileSync(twoPath, 'utf8'), sb, { filename: 'two.js' }); vm.runInContext(SRC, sb, { filename: 'candidate-B.js' });
  const L = sb.TWO_LAYER_B; ok(typeof sb.Two === 'function' && L.isAvailable(), 'Two loaded (' + sb.Two.Version + ') → isAvailable() true');
  let threw = false, frames = []; const pal = { paper: '#FBF3E6', ink: '#064f6e', a: '#ebd3a2', h: '#ae5224', b: '#635a3a', c: '#064f6e' };
  try { L.init({ cdn: false }); for (let t = 0; t < 12; t += 0.37) { const c = ops(); const r = L.renderFrame(c, t, null, pal, 7, { sheet }); frames.push({ t: +t.toFixed(2), ops: c.getOps(), tr: r && r.transition, say: r && r.say, cnt: r && r.counter }); } } catch (e) { threw = true; console.log('  threw:', e.stack); }
  ok(!threw, 'renderFrame over 12 s never throws');
  ok(frames.every(f => f.ops > 0 && f.tr), 'every frame returns a result and composites into ctx: ' + frames.map(f => f.ops).join(','));
  const inner = made[made.length - 1]._ctx; ok(inner && inner.getOps() > 500, 'two.js canvas renderer drew into the offscreen stage (' + (inner ? inner.getOps() : 0) + ' ops over the run)');
  const o1 = inner.getOps(); L.renderFrame(ops(), 5.2, null, pal, 7, { sheet }); const d1 = inner.getOps() - o1; L.renderFrame(ops(), 5.2, null, pal, 7, { sheet }); const d2 = inner.getOps() - o1 - d1; L.renderFrame(ops(), 9.1, null, pal, 7, { sheet }); const d3 = inner.getOps() - o1 - d1 - d2;
  ok(d1 === d2 && d1 > 20 && d3 !== d1, 'G06: same t,seed → identical stage ops (' + d1 + '=' + d2 + '); different t → different (' + d3 + ')');
  const f3 = frames.filter(f => f.t >= 2 && f.t < 4); ok(f3.some(f => typeof f.cnt === 'number') && f3[f3.length - 1].cnt > 100, 'counter rolls 0→128 in beat 2 (' + f3.map(f => f.cnt == null ? '-' : f.cnt.toFixed(0)).join(' ') + ')');
  const red = ops(); const rr = L.renderFrame(red, 2.05, null, pal, 7, { sheet, reduced: true }); ok(rr && rr.say.split(' ').length === 9, 'G16 reduced-motion → settled final frame (full say line)');
  console.log('  frames:', frames.map(f => f.t + ':' + f.tr).join(' '));
  L.dispose(); ok(L.isAvailable() === false && L.renderFrame(ops(), 1, null, pal, 1, { sheet }) === false, 'dispose() → subsequent renderFrame no-op');
} else console.log('SKIP with-Two run (pass a path to two.js to enable)');
console.log(fails ? ('\n' + fails + ' FAIL') : '\nALL PASS'); process.exit(fails ? 1 : 0);
