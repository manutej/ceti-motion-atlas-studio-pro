// node work/two/selftest-merged.js [path/to/two.min.js]   (default: vendor/two.min.js)
// Mock-DOM node test for studio-two-renderer.js (TWO_LAYER v9): no-Two no-op, G06 seek-history determinism, two passes,
// every module per grammar role, palette audit, one spotlight per frame, reduced-motion settled frame, idempotent dispose.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..', '..');
const SRC = fs.readFileSync(path.join(ROOT, 'studio-two-renderer.js'), 'utf8');
const twoPath = process.argv[2] || path.join(ROOT, 'vendor', 'two.min.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

// ---- mock 2D context that records an op trace (name + args) ----
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
  const sb = { console, Math, Date, JSON, Array, Object, String, Number, Boolean, RegExp, Map, Set, Promise, Uint8Array, Float32Array, Error, TypeError, Symbol, parseInt, parseFloat, isNaN, isFinite, setTimeout, clearTimeout, devicePixelRatio: 1,
    performance: { now: () => 0 }, requestAnimationFrame: () => 1, cancelAnimationFrame: () => {}, navigator: { userAgent: 'node' }, matchMedia: () => ({ matches: false }) };
  if (withDoc) sb.document = { head: { appendChild: () => {} }, body: {}, createElement: (t) => t === 'canvas' ? mkCanvas() : { style: {}, setAttribute() {}, appendChild() {} }, createElementNS: () => ({ style: {}, setAttribute() {}, appendChild() {} }), getElementById: () => null, addEventListener() {} };
  sb.window = sb; sb.globalThis = sb; sb.self = sb; return vm.createContext(sb);
}
const PAL = { paper: '#fbf3e6', ink: '#064f6e', a: '#ebd3a2', h: '#ae5224', b: '#635a3a', c: '#064f6e' };
const P = { paper: '#fbf3e6', ink: '#064f6e', a: '#ebd3a2', h: '#ae5224', b: '#635a3a', c: '#064f6e', sw: ['#ebd3a2', '#ae5224', '#635a3a', '#064f6e'] };
const sheet = { title: 'What an MCP server is', beats: [
  { id: 'b1', index: 0, grammar: 'hook', role: 'hook', hinge: 'THEREFORE', say: 'Your AI is smart, but it cannot touch your files.', plant: 'locked drawer', tStartSec: 0, tEndSec: 1.5, cameraMove: '#camera/static-wide', characterPose: { x: 0.3, y: 0.5, scale: 1, rung: 1 } },
  { id: 'b2', index: 1, grammar: 'claim', role: 'threshold', hinge: 'BUT', say: 'An MCP server is a plug adapter for tools.', label: 'The Adapter', tStartSec: 1.5, tEndSec: 3, cameraMove: 'push-in', counter: { from: 0, to: 128, unit: 'tools', label: 'tools reachable', word: 7, because: 'one adapter reaches every drawer' }, characterPose: { x: 0.5, y: 0.5, rung: 2 } },
  { id: 'b3', index: 2, grammar: 'proof', claimId: 'b2', role: 'escalation', hinge: 'THEREFORE', say: 'The server lists what it can do.', label: 'The Menu', tStartSec: 3, tEndSec: 4.5, cameraMove: 'pan-follow', characterPose: { x: 0.6, y: 0.45, rung: 3 } },
  { id: 'b4', index: 3, grammar: 'proof', role: 'turn', hinge: 'BUT', say: 'Each tool answers in plain text.', label: 'Plain Text', tStartSec: 4.5, tEndSec: 6, cameraMove: 'dutch-tilt', characterPose: { x: 0.4, y: 0.5, rung: 4 } },
  { id: 'b5', index: 4, grammar: 'breather', role: 'breather', hinge: 'THEREFORE', say: 'That is the whole trick.', label: 'Breather Hold', tStartSec: 6, tEndSec: 7.5, cameraMove: 'breather-hold', characterPose: { x: 0.5, y: 0.5, rung: 5 } },
  { id: 'b6', index: 5, grammar: 'callback', role: 'climax', hinge: 'BUT', returns: 'locked drawer', say: 'Same adapter, any drawer: calendar, database, your inbox.', label: 'Every Drawer', tStartSec: 7.5, tEndSec: 9, cameraMove: 'kick-shake', characterPose: { x: 0.55, y: 0.5, rung: 1 } },
  { id: 'b7', index: 6, grammar: 'claim', role: 'filter', hinge: 'THEREFORE', say: 'One adapter, every tool.', label: 'The Claim', tStartSec: 9, tEndSec: 10.5, cameraMove: 'tracking-drift', characterPose: { x: 0.5, y: 0.5, rung: 2 } },
  { id: 'b8', index: 7, grammar: 'landing', role: 'callback', hinge: 'THEREFORE', say: 'MCP: one plug, every tool.', label: 'Calm Callback', tStartSec: 10.5, tEndSec: 12, cameraMove: 'pull-back', characterPose: { x: 0.5, y: 0.5, rung: 1 } } ] };
const ROLES = ['hook', 'claim', 'proof', 'breather', 'callback', 'landing'];

// ---- 0. static predicates (G31 file-text) ----
ok(!/Math\.random|Date\.now|performance\.now|requestAnimationFrame|two\.play\(/.test(SRC), 'G31 text: no Math.random / Date.now / performance.now / requestAnimationFrame / two.play(');
ok(/autostart:\s*false/.test(SRC) && /Two\.Types\.canvas/.test(SRC) && /two\.update\(\)/.test(SRC), 'G31 text: offscreen Two.Types.canvas, autostart:false, manual two.update()');
ok(/VERSION\s*=\s*'9\.0\.0'/.test(SRC) && Buffer.byteLength(SRC) <= 36 * 1024, 'VERSION 9.0.0 · size ' + Buffer.byteLength(SRC) + ' B ≤ 36864 B');
ok(/module\.exports\s*=\s*API/.test(SRC) && /root\.TWO_LAYER\s*=\s*API/.test(SRC), 'exposes window.TWO_LAYER + CommonJS');

// ---- 1. no Two → every entry point is a silent no-op with zero ctx ops ----
{
  const sb = sandbox(true); vm.runInContext(SRC, sb, { filename: 'studio-two-renderer.js' });
  const L = sb.TWO_LAYER; ok(L && L.VERSION === '9.0.0' && ['init', 'load', 'renderFrame', 'modules', 'isAvailable', 'audit', 'dispose'].every(k => k in L), 'API surface { init, load, renderFrame, modules, isAvailable, audit, dispose, VERSION }');
  ok(L.isAvailable() === false, 'isAvailable() → false without Two');
  let threw = false, r1, r2, r3; const ctx = ops();
  try { r1 = L.init({ cdn: false }); r2 = L.renderFrame(ctx, 2.1, sheet.beats[1], PAL, 7, P, { sheet, pass: 'back' }); L.renderFrame(ctx, 2.1, sheet.beats[1], PAL, 7, P, { sheet, pass: 'front' }); r3 = L.renderFrame(null, 0); L.dispose(); L.dispose(); } catch (e) { threw = true; console.log('  threw:', e && e.stack); }
  ok(!threw, 'init/renderFrame/dispose never throw without Two');
  ok(r1 === false && r2 === false && r3 === false && ctx.getOps() === 0, 'no-Two no-op: renderFrame → false, ZERO ctx ops (G06 mock-ctx safe)');
  const sb2 = sandbox(false); vm.runInContext(SRC, sb2, { filename: 'studio-two-renderer.js' }); let t2 = false;
  try { sb2.TWO_LAYER.init(); sb2.TWO_LAYER.renderFrame(ops(), 1, null, null, 1, null, { sheet }); } catch (e) { t2 = true; }
  ok(!t2 && sb2.TWO_LAYER.isAvailable() === false, 'no document, no Two → still no-op, no throw');
  // pure scene / audit work without Two at all
  const a = L.audit(2.1, sheet.beats[1], PAL, 7, P, { sheet });
  ok(a.ok && a.offPalette.length === 0 && a.count > 20, 'audit() without Two → [] off-palette (' + a.count + ' items)');
  const rel = sheet.beats.map(b => L.modules.relation(b, sheet.beats[0]));
  ok(rel.join(',') === 'wipe,iris,wipe,split,cut,wipe-back,iris,iris-close', 'transition semantics: ' + rel.join(' → '));
  const st = L.modules.sayTiming(L.modules.env(2.0, null, PAL, 7, P, { sheet }));
  ok(st.n === 9 && st.at(8) > st.at(0) && st.at(8) <= 3, 'say timing law: 9 words land in order inside beat 2 (last at ' + st.at(8).toFixed(2) + 's)');
  // palette lock negative: an off-palette colour sneaked into the scene must be flagged
  const scn = L.modules.scene(2.1, sheet.beats[1], PAL, 7, P, { sheet }); scn.items[0].fill = '#ff00ff';
  const bad = (() => { const okc = scn.C.allowed; let n = 0; scn.items.forEach(d => { [d.fill, d.stroke].forEach(c => { if (c && c[0] === '#' && okc.indexOf(c.toLowerCase()) < 0) n++; }); }); return n; })();
  ok(bad === 1, 'palette lock negative: injected #ff00ff is detectable (' + bad + ' off-palette)');
}

// ---- 2. with two.js ----
if (!fs.existsSync(twoPath)) { console.log('FAIL two.js not found at ' + twoPath); fails++; }
else {
  const sb = sandbox(true); vm.runInContext(fs.readFileSync(twoPath, 'utf8'), sb, { filename: 'two.min.js' }); vm.runInContext(SRC, sb, { filename: 'studio-two-renderer.js' });
  const L = sb.TWO_LAYER; ok(typeof sb.Two === 'function' && L.isAvailable(), 'Two loaded (' + sb.Two.Version + ') → isAvailable() true');
  ok(L.init({ cdn: false }) === true, 'init({cdn:false}) → true with Two present');
  const stage = () => made[made.length - 1]._ctx;
  const frame = (t, opts, beat) => { const c = ops(); const r = L.renderFrame(c, t, beat === undefined ? null : beat, PAL, 7, P, Object.assign({ sheet }, opts || {})); return { r, c }; };
  // both passes render and composite exactly one drawImage each
  const fb = frame(2.1, { pass: 'back' }), ff = frame(2.1, { pass: 'front' });
  ok(fb.r && fb.r.pass === 'back' && ff.r && ff.r.pass === 'front' && fb.c.getOps() > 0 && ff.c.getOps() > 0 && /drawImage/.test(fb.c.trace()) && /drawImage/.test(ff.c.trace()), 'both passes render and composite (back ' + fb.c.getOps() + ' ops, front ' + ff.c.getOps() + ' ops)');
  const st0 = stage(); ok(st0 && st0.getOps() > 100, 'two.js canvas renderer drew into the offscreen stage (' + st0.getOps() + ' ops)');
  // G06: identical stage op-trace for the same (t, seed, beat) after different seek histories
  const traceAt = (t, hist, pass) => { hist.forEach(h => frame(h, { pass })); const n0 = st0.getOps(); frame(t, { pass }); return st0.trace().split('\n').slice(n0).join('\n'); };
  const A1 = traceAt(3.7, [5.5, 0.2], 'all'), A2 = traceAt(3.7, [9.0, 11.9, 1.1], 'all'), A3 = traceAt(3.7, [], 'all'), B1 = traceAt(8.2, [], 'all');
  ok(A1.length > 200 && A1 === A2 && A2 === A3, 'G06: same (t,seed,beat) ⇒ identical stage op-trace after 3 different seek histories (' + A1.split('\n').length + ' ops)');
  ok(B1 !== A1, 'G06: a different t gives a different trace');
  const S1 = (() => { const n0 = st0.getOps(); L.renderFrame(ops(), 3.7, null, PAL, 8, P, { sheet }); return st0.trace().split('\n').slice(n0).join('\n'); })();
  ok(S1 !== A1, 'G06: a different seed gives a different trace');
  const Fb1 = traceAt(3.7, [7.7], 'back'), Fb2 = traceAt(3.7, [0.1, 11.2], 'back');
  ok(Fb1 === Fb2 && Fb1 !== A1, 'G06 per pass: back-pass trace is seek-independent and differs from the full trace');
  // every module runs for each of the 6 grammar roles, with and without an explicit beat, in both passes, never throwing
  let threw = null, counts = {};
  try {
    ROLES.forEach(role => { const b = sheet.beats.find(x => x.grammar === role); ['back', 'front'].forEach(pass => { for (let k = 0; k <= 4; k++) { const t = b.tStartSec + (b.tEndSec - b.tStartSec) * k / 4 - (k === 4 ? 0.01 : 0); const r = L.renderFrame(ops(), t, b, PAL, 7, P, { sheet, pass }); if (!r) throw new Error('renderFrame false for ' + role + '/' + pass + ' t=' + t); } });
      const r2 = L.renderFrame(ops(), b.tStartSec + 0.9, null, PAL, 7, P, { sheet, pass: 'all' }); counts[role] = { tr: r2.transition, say: r2.say, ec: r2.endcard, cnt: r2.counter, dg: (r2.diagram.nodes || []).length }; });
    // synthesized 12 s grid (no sheet, no beat) and a bare beat without sheet
    for (let t = 0; t < 12; t += 0.5) { if (!L.renderFrame(ops(), t, null, PAL, 7, P, { pass: 'all' })) throw new Error('synth grid false at ' + t); }
    if (!L.renderFrame(ops(), 2, { say: 'Hello world', grammar: 'claim' }, PAL, 3, null, { pass: 'front' })) throw new Error('bare beat false');
  } catch (e) { threw = e; console.log('  threw:', e.stack); }
  ok(!threw, 'every module runs for hook/claim/proof/breather/callback/landing × {back,front} × 5 phases, plus the synthesized grid, without throwing');
  ok(counts.landing.ec === true && typeof counts.claim.cnt === 'number' && counts.proof.dg >= 2 && counts.callback.tr === 'wipe-back', 'module coverage: end-card on landing, counter on claim, diagram on proof (' + counts.proof.dg + ' nodes), callback = wipe-back');
  // audit: [] off-palette for every role; exactly one spotlight per frame
  const audits = ROLES.map(role => { const b = sheet.beats.find(x => x.grammar === role); return L.audit(b.tStartSec + 0.7, b, PAL, 7, P, { sheet }); });
  ok(audits.every(a => a.ok && a.offPalette.length === 0), 'audit() returns [] off-palette for all 6 roles (' + audits.map(a => a.count).join(',') + ' items)');
  ok(audits.every(a => a.spotlights === 1), 'exactly ONE spotlight per frame for every role');
  const sp = L.modules.scene(2.1, sheet.beats[1], PAL, 7, P, { sheet }).items.filter(d => d.k === 'spot').length; ok(sp === 1, 'scene() carries exactly one spot item (' + sp + ')');
  // kinetic type brightness is governed by the spotlight dim (one hot spot)
  const ky = L.modules.scene(2.9, sheet.beats[1], PAL, 7, P, { sheet }).items.filter(d => d.id.indexOf('ty') === 0 && d.k === 'text');
  ok(ky.length > 10 && ky.every(d => d.op <= 1 - 0.22 + 1e-9), 'kinetic say letters are dimmed by the spotlight (max op ' + Math.max(...ky.map(d => d.op)).toFixed(3) + ' ≤ 0.78)');
  // text metrics: ctx.measureText is used when available, 6.4 px/char only as fallback
  const mzCtx = L.modules.measurer(ops()), mzNone = L.modules.measurer(null);
  ok(mzCtx('adapter', 8.5) === 49 && Math.abs(mzNone('adapter', 8.5) - 44.8) < 1e-9, 'text metrics: measureText when available (49), 6.4 px/char fallback (44.8)');
  // counter rolls and the MovementOk tag is on screen
  const c1 = frame(2.95, {}, sheet.beats[1]).r, cw = L.modules.scene(2.95, sheet.beats[1], PAL, 7, P, { sheet }).items.find(d => d.id === 'ctw');
  ok(typeof c1.counter === 'number' && c1.counter > 120 && cw && /moves because: one adapter/.test(cw.v), 'counter rolls to ' + c1.counter.toFixed(0) + ' with visible MovementOk tag');
  // reduced motion → settled frame, identical to the beat's final instant
  const red = frame(1.6, { reduced: true }, sheet.beats[1]).r;
  ok(red && red.say.split(' ').length === 9 && red.transition === 'iris', 'G16 reduced-motion → settled final frame (full say line, no curtain)');
  const n0 = st0.getOps(); frame(1.6, { reduced: true }, sheet.beats[1]); const R1 = st0.trace().split('\n').slice(n0).join('\n');
  const n1 = st0.getOps(); frame(2.6, { reduced: true }, sheet.beats[1]); const R2 = st0.trace().split('\n').slice(n1).join('\n');
  ok(R1 === R2, 'reduced-motion frame is the same at any t inside the beat');
  // 12 s sweep with every pass never throws
  let sweep = true; for (let t = 0; t < 12; t += 0.37) { const r = frame(t, { pass: 'back' }).r, f2 = frame(t, { pass: 'front' }).r; if (!r || !f2) sweep = false; }
  ok(sweep, 'renderFrame over 12 s (back + front) never fails');
  // dispose idempotent
  L.dispose(); L.dispose(); const after = ops();
  ok(L.isAvailable() === false && L.renderFrame(after, 1, null, PAL, 1, P, { sheet }) === false && after.getOps() === 0, 'dispose() idempotent → subsequent renderFrame no-op, zero ctx ops');
  ok(L.init({ cdn: false }) === true && L.renderFrame(ops(), 1, null, PAL, 1, P, { sheet }) !== false, 'init() after dispose() revives the layer');
  // load(): resolves true immediately when Two is present; false with cdn:false and no Two
  const sbN = sandbox(true); vm.runInContext(SRC, sbN, { filename: 'studio-two-renderer.js' });
  Promise.all([L.load(), sbN.TWO_LAYER.load({ cdn: false })]).then(([a, b]) => {
    ok(a === true && b === false, 'load() → true with Two, false with {cdn:false} and no Two');
    // inline hook: Standalone hands over the constructor
    const sbI = sandbox(true); vm.runInContext(SRC, sbI, { filename: 'studio-two-renderer.js' });
    const got = sbI.TWO_LAYER.init({ cdn: false, inline: () => sb.Two });
    ok(got === true && sbI.TWO_LAYER.isAvailable(), 'init({inline}) adopts the inlined Two constructor (Standalone path)');
    console.log(fails ? ('\n' + fails + ' FAIL') : '\nALL PASS'); process.exit(fails ? 1 : 0);
  });
}
