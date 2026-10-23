// node work/vector3/selftest-merged.js: SCENE soup, contract+A/B/C+soup predicates; exit 0 iff all hold
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..'), CAND = process.env.SCENE_SRC || path.join(__dirname, 'soup.js'), SRC = fs.readFileSync(CAND, 'utf8');
const RSRC = fs.readFileSync(path.join(ROOT, 'studio-two-renderer.js'), 'utf8'), TWO = fs.readFileSync(path.join(ROOT, 'vendor', 'two.min.js'), 'utf8');
const tokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'work', 'tokens.resolved.json'), 'utf8'));
let fails = 0, total = 0; const ok = (c, m) => { total++; if (!c) { fails++; console.log('FAIL ' + m); } return !!c; };
const J = (o) => JSON.parse(JSON.stringify(o)), eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const dsb = { console, Math, JSON, Date, Object, Array, Number, String, setTimeout, clearTimeout, setInterval, clearInterval,
document: { getElementById: () => null, addEventListener: () => {}, createElement: () => ({ style: {}, getContext: () => null }) } };
dsb.window = dsb; dsb.globalThis = dsb; vm.createContext(dsb);
['geome-wada.js', 'studio-motion-engine.js', 'vendor/sfx-kit.js', 'studio-music-engine.js', 'studio-canvas-oauth.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), dsb, { filename: f }));
const BOARDS = ['v9-mcp-server', 'v9-planning-fallacy'].map(k => ({ k, sheet: J(dsb.STUDIO_CANVAS_OAUTH.buildStoryboardSheet({ boardKey: k, charId: 'ceti-whale', palId: 343 })) }));

const ops = () => {
const trace = []; const rec = (name) => (...a) => { trace.push(name + '(' + a.map(v => typeof v === 'number' ? +v.toFixed(3) : (v && v.tagName) ? 'EL' : String(v)).join(',') + ')'); };
const g = () => ({ addColorStop: rec('stop') });
const c = { canvas: { width: 480, height: 300 }, getOps: () => trace.length, trace: () => trace.join('\n'), seg: (i) => trace.slice(i).join('\n'), measureText: (s) => ({ width: String(s || '').length * 7 }),
createRadialGradient: g, createLinearGradient: g, globalAlpha: 1, globalCompositeOperation: 'source-over', textAlign: 'left', textBaseline: 'alphabetic' };
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
function harness(src, withTwo) {
const sb = sandbox(true);
if (withTwo) vm.runInContext(TWO, sb, { filename: 'two.min.js' });
vm.runInContext(RSRC, sb, { filename: 'studio-two-renderer.js' }); vm.runInContext(src, sb, { filename: 'soup.js' });
const TL = sb.TWO_LAYER, orig = TL.renderFrame; let lastB2 = null;
TL.renderFrame = function (ctx, t, b, ...r) { lastB2 = b; return orig.call(TL, ctx, t, b, ...r); }; // spy only: captures b2
return { sb, S: sb.SCENE, TL, b2: () => lastB2 };
}
const tc = tokens.color, PAL = { paper: tc.paper, ink: tc.ink, a: tc.accent, h: tc.highlight, b: tc.extra.tint, c: tc.contrast };
const P = Object.assign({ sw: [PAL.a, PAL.h, PAL.b, PAL.c] }, PAL);
const inF = (b) => b.x >= 0 && b.y >= 0 && b.x + b.w <= 1 + 1e-9 && b.y + b.h <= 1 + 1e-9;
const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (p, b) => p.x >= b.x - 1e-9 && p.x <= b.x + b.w + 1e-9 && p.y >= b.y - 1e-9 && p.y <= b.y + b.h + 1e-9;

function charPred(S) {
let good = true;
for (const { sheet } of BOARDS) for (const b of sheet.beats) {
if (S.fromBeat(J(b), tokens, 7).character.visible !== false) good = false;
const c = S.fromBeat(Object.assign(J(b), { character: 'ceti-whale' }), tokens, 7).character;
if (!(c.visible === true && inF(c.box) && !hit(c.box, b.textBox))) good = false;
}
return good;
}

const H = harness(SRC, true), S = H.S;
ok(H.TL.isAvailable(), 'harness');
ok(typeof S.VERSION === 'string' && S.VERSION.length > 0, '9 VERSION');
for (const { k, sheet } of BOARDS) {
const scenes = sheet.beats.map(b => S.fromBeat(J(b), tokens, 7)), counts = scenes.map(s => s.primitives.length);
const bi = sheet.beats.findIndex(b => b.grammar === 'breather');
sheet.beats.forEach((b, i) => {
const sc = scenes[i], tag = k + '#' + b.index + ' ', show = b.show.toLowerCase(), pr = sc.primitives;
ok(S.coverage(sc).unmatched.length === 0, tag + '1 G38 unmatched=' + S.coverage(sc).unmatched);
ok(pr.length >= 1 && pr.every(p => show.indexOf(String(p.from).toLowerCase()) >= 0), tag + '1 from');
ok(Object.keys(sc).sort().join() === 'character,hotspot,primitives,textBox', tag + 'keys');
const FIELDS = 'kind,id,role,box,label,from,word,at,n,to'.split(',');
ok(pr.every(p => Object.keys(p).every(f => FIELDS.includes(f)) && p.role in tokens.color && p.id.indexOf('b' + b.index + '_') === 0 && p.from.length > 0), tag + 'B shape');
ok(S.coverage(sc).showTermsMatched.length === S.terms(b.show).length, tag + 'C terms');
const own = pr.filter(p => p.kind !== 'arrow' && p.kind !== 'path' && p.kind !== 'mask');
ok(S.coverage({ primitives: own, character: sc.character }, b.show).unmatched.length === 0, tag + 'G38 strict (' + S.coverage({ primitives: own, character: sc.character }, b.show).unmatched + ')');
ok(S.coverage(J(sc)).unmatched.length === 0 && eq(S.coverage(J(sc), b.show), S.coverage(sc)), tag + 'clone coverage');
const mk = pr.filter(p => p.kind === 'mask')[0], mw = Math.max(...pr.map(p => p.word));
ok(!mk || (mk.word === mw && eq(sc.hotspot, { x: +(mk.box.x + mk.box.w / 2).toFixed(4), y: +(mk.box.y + mk.box.h / 2).toFixed(4) })), tag + 'B mask');
const lastN = own.filter(p => p.word === Math.max(...own.map(q => q.word))).pop();
ok(own.length < 2 || !/^(robot|character)$/.test(lastN.label || ''), tag + 'film: last noun != character');
const dg = S.toDiagram(sc); let prv = null; const tails = {};
pr.forEach(p => { if (p.kind === 'arrow') tails[p.id] = prv; if (['card', 'pill', 'stack', 'bracket'].includes(p.kind)) prv = p; });
ok(pr.filter(p => p.kind === 'arrow').every(a => { const t = tails[a.id], hd = t && (t.kind === 'stack' ? t.id + '_' + (t.n - 1) : t.id); return dg.edges.some(e => e.from === hd && e.kind === 'arrow'); }), tag + 'E1 arrow tail');
const cnt = /\b(two|three|four|five|six)\s+([a-z]+s)\b/.exec(show.replace(/'[^']*'/g, '')), N = { two: 2, three: 3, four: 4, five: 5, six: 6 };
ok(!cnt || own.filter(p => (p.label + ' ' + p.from).indexOf(cnt[2]) >= 0 || p.kind === 'counter' || /second|first/.test(p.label)).reduce((s, p) => s + (p.kind === 'stack' ? p.n : 1), 0) >= N[cnt[1]], tag + 'G38 literal: "' + (cnt ? cnt[0] : '-') + '" draws that many marks');
ok(eq(sc.textBox, b.textBox), tag + '3 tb eq');
ok(pr.every(p => !hit(p.box, b.textBox) && inF(p.box)), tag + '3 tb clear');
const hs = sc.hotspot, boxes = pr.map(p => p.box).concat(sc.character.visible ? [sc.character.box] : []);
ok(hs && hs.x >= 0 && hs.x <= 1 && hs.y >= 0 && hs.y <= 1 && boxes.some(bx => inside(hs, bx)), tag + '4 hotspot');
ok(pr.filter(p => p.kind === 'mask').length <= 1 && pr.filter(p => p.kind === 'counter').length <= 1, tag + '4 mask/counter');
const opts = { beat: J(b), palette: PAL, seed: 7, P, sheet };
const ctx = ops(), mf = S.render(ctx, sc, b.tMidSec, 'front', opts), b2 = H.b2();
const au = H.TL.audit(b.tMidSec, b2, PAL, 7, P, { sheet });
ok(au.spotlights === 1 && au.offPalette.length === 0, tag + '4 audit (' + au.spotlights + ',' + au.offPalette.length + ')');
const nd = mf && mf.diagram && mf.diagram.nodes;
ok(nd && nd.length === S.toDiagram(sc).nodes.length && nd.every(n => n.id.indexOf('b' + b.index + '_') === 0), tag + '6 own diagram');
const mb = S.render(ctx, sc, b.tMidSec, 'back', opts);
ok(mb && mb.pass === 'back' && mf && mf.pass === 'front', tag + '6 passes');
ok(eq(S.fromBeat(J(b), tokens, 7), sc) && eq(S.fromBeat(J(b), tokens, 1), sc) && eq(S.fromBeat(J(b), tokens, 99), sc), tag + '7 determinism');
const off = () => made.filter(c => c._ctx).map(c => c._ctx);
const tr = (t, red) => { const cs = off(), at = cs.map(c => c.getOps()); const hc = ops(); S.render(hc, sc, t, 'front', Object.assign({}, opts, { reduced: red })); return hc.trace() + '|' + cs.map((c, j) => c.seg(at[j])).join('#'); };
const ta = tr(b.tMidSec, false); tr(b.tStartSec, false); tr(b.tEndSec - 1e-3, false);
ok(ta === tr(b.tMidSec, false), tag + '7 seek');
const r0 = tr(b.tStartSec, true);
ok(r0 === tr(b.tMidSec, true) && r0 === tr(b.tEndSec - 1e-3, true), tag + '7 reduced');
});
sheet.beats.forEach((b, i) => { if (/\bbetween\b/.test(b.show) && b.grammar !== 'breather') ok(scenes[i].primitives.some(p => p.kind === 'arrow' && /between/.test(p.from)), k + '#' + b.index + ' between'); });
const hl = scenes.map(s => s.primitives.filter(p => p.role === 'highlight' && p.kind === 'card')[0]).filter(Boolean);
ok(hl.length >= 2 && hl.every(p => eq(p.box, hl[0].box)), k + ' hook box reused (' + hl.length + ')');
const ctrs = {}; let cont = true;
scenes.forEach(s => s.primitives.forEach(p => { const m = /(drawer|adapter|sign|robot|character)$/.exec(p.label || ''); if (!m || p.kind === 'stack' || / · /.test(p.label)) return; const c = JSON.stringify([+(p.box.x + p.box.w / 2).toFixed(3), +(p.box.y + p.box.h / 2).toFixed(3)]); if (ctrs[m[1]] && ctrs[m[1]] !== c) cont = false; ctrs[m[1]] = c; }));
ok(cont, k + ' C continuity');
const bp = scenes[bi].primitives;
ok(bi >= 0 && bp.length <= 2 && !bp.some(p => p.kind === 'arrow' || p.kind === 'path') && counts.every(c => c >= bp.length), k + ' 2 breather (' + counts + ')');
}
ok(charPred(S), '5 character');
const N = harness(SRC, false), nctx = ops(), b0 = BOARDS[0].sheet.beats[0], nsc = N.S.fromBeat(J(b0), tokens, 7);
ok(N.S.render(nctx, nsc, 1, 'front', { beat: J(b0), palette: PAL, seed: 7, P }) === false && nctx.getOps() === 0 && nsc.primitives.length >= 1, '8 no Two');
{ const sb = sandbox(true); vm.runInContext(SRC, sb); const c0 = ops(); ok(sb.SCENE.render(c0, nsc, 1, 'front', {}) === false && c0.getOps() === 0, 'B 8 no TL'); }
ok(!/Math\.random|Date\.now|performance\.now|requestAnimationFrame|two\.play\(|makeRectangle|makeText|makePath|fillStyle|font/.test(SRC), '9 forbidden');
ok(Buffer.byteLength(SRC) <= 16384, '9 size <= 16 KB (' + Buffer.byteLength(SRC) + ')');
let lit = 0; try { cp.execFileSync('node', [path.join(ROOT, 'skills/motion-soup/scripts/soup-runner.mjs'), 'check-literals', CAND, '--tokens', path.join(ROOT, 'work/tokens.resolved.json')], { cwd: ROOT, stdio: 'pipe' }); } catch (e) { lit = e.status || 1; }
ok(lit === 0, '9 literals');
const EXPR = 'visible: !!beat.character';
ok(SRC.split(EXPR).length === 2, '10 site once');
const M = harness(SRC.replace(EXPR, 'visible: true'), true), caught = !charPred(M.S);
ok(caught, '10 MUT caught');

const G38N = 'if (f0) join(f0, d, null);', G38M = harness(SRC.replace(G38N, 'if (f0) P.splice(P.indexOf(d), 1);'), true).S;
ok(SRC.split(G38N).length === 2 && BOARDS.some(({ sheet }) => sheet.beats.some(b => G38M.coverage(G38M.fromBeat(J(b), tokens, 7)).unmatched.length > 0)), 'G38 MUT caught');
console.log((fails ? 'FAIL ' : 'PASS ') + (total - fails) + '/' + total + ' predicates' + (caught ? ' · mutation caught' : ''));
process.exit(fails ? 1 : 0);
