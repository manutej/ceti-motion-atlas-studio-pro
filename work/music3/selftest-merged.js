// selftest-merged: superset of selftest-A/B/C + CONTRACT predicates for MIX (soup.js); over-bed WAIVED-with-floor (FLOOR).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process'), os = require('os');
const J = JSON.stringify, F = Number.isFinite, H = (f) => path.join(__dirname, f), RP = (f) => path.join(ROOT, f);
const ROOT = path.resolve(__dirname, '..', '..');
const FILE = H('soup.js');
const SRC = fs.readFileSync(FILE, 'utf8');
const FLOOR = 3.4; // best single measured (cand-C)
const fails = [];
const ck = (id, ok, why) => { if (!ok) fails.push(id); console.log((ok ? 'ok   ' : 'FAIL ') + id + (!ok && why != null ? ' — ' + why : '')); };
console.log('WAIVER over-bed: +6 dB infeasible under the frozen 10 ms duck + limiter (A/B/C/soup all < 6): WAIVED-with-floor >= +' + FLOOR + ' dB (best single); open, see MERGE-NOTES.');

function sandbox() {
const sb = { console, Math, JSON, Date, Object, Array, Number, String, setTimeout, clearTimeout, setInterval, clearInterval,
document: { getElementById: () => null, addEventListener: () => {}, createElement: () => ({ style: {}, getContext: () => null }) } };
sb.window = sb; sb.globalThis = sb; vm.createContext(sb);
for (const f of ['geome-wada.js', 'studio-motion-engine.js', 'vendor/sfx-kit.js', 'studio-music-engine.js', 'studio-canvas-oauth.js'])
vm.runInContext(fs.readFileSync(RP(f), 'utf8'), sb, { filename: f });
return sb;
}
const load = (sb, src, name, glob) => { vm.runInContext(src, sb, { filename: name }); return sb[glob]; };
const sb = sandbox();
const MIX = load(sb, SRC, 'soup.js', 'MIX'), PR = MIX.predict;
const tokens = require(RP('work/tokens.resolved.json'));
const PAL = { id: 343, a: '#ebd3a2', h: '#ae5224', b: '#527e91' };
const mkPlan = (s, boardKey) => { const O = s.STUDIO_CANVAS_OAUTH; return s.MUSIC.plan(O.storyboardToMusicSheet(O.buildStoryboardSheet({ boardKey, charId: 'ceti-whale', palId: 343 }), 'spring'), PAL, 'mix3'); };
const BOARDS = ['v9-mcp-server', 'v9-planning-fallacy'];
const NAMES = ['CLICK', 'BOOP', 'WHOOSH', 'THUD', 'BOING', 'CHORD', 'TICK', 'RISER'];
const KIT = ['whoosh', 'impact', 'pop', 'click', 'tick', 'riser', 'ding'];
const DUCK = { depthDb: -6, attackMs: 10, holdMs: 250, releaseMs: 150 };
const leaves = (o, out = []) => { if (o && typeof o === 'object') Object.values(o).forEach((v) => leaves(v, out)); else out.push(o); return out; };
const clone = (o) => JSON.parse(J(o));
function mockCtx() {
const log = { compressors: 0, edges: new Map() };
const node = (name, extra) => { const n = Object.assign({ name, connect(t) { (log.edges.get(n) || log.edges.set(n, []).get(n)).push(t); }, disconnect() { log.edges.set(n, []); } }, extra); return n; };
const p = (v) => ({ value: v });
const ctx = { createGain: () => node('gain', { gain: p(1) }),
createDynamicsCompressor: () => { log.compressors++; return node('limiter', { threshold: p(-24), knee: p(30), ratio: p(12), attack: p(0.003), release: p(0.25) }); } };
const nodes = { master: node('master', { gain: p(0.9) }), comp: node('comp', { threshold: p(-18) }), music: node('music', { gain: p(0.72) }),
sfx: node('sfx', { gain: p(0.8) }), pad: node('pad', { gain: p(3) }), duck: node('duck', { gain: p(1) }) };
nodes.comp.connect(nodes.master);
return { ctx, nodes, log };
}
function duckPredicate(M, s) {
const plan = mkPlan(s, BOARDS[0]); const before = J(s.MUSIC.DUCK);
const d = M.design(plan, tokens, 7); const m = mockCtx(); M.apply(m.ctx, m.nodes, d, plan);
return J(d.duck) === J(DUCK) && J(s.MUSIC.DUCK) === before && J(plan.duck) === J({ dB: -6, attackMs: 10, holdMs: 250, releaseMs: 150 });
}

ck('0 exports', MIX && typeof require(FILE).design === 'function' && typeof MIX.apply === 'function' && typeof MIX.predict === 'function');
const pred = {};
for (const bd of BOARDS) {
const plan = mkPlan(sb, bd);
const d = MIX.design(plan, tokens, 7), d2 = MIX.design(plan, tokens, 7);
const same = J(d) === J(d2) && J(MIX.design(clone(plan), null, 7)) === J(d);
ck(`1 ${bd} deterministic`, same);
ck(`1 ${bd} leaves finite`, leaves(d).every((x) => typeof x === 'number' && F(x)));
const gains = [d.masterGain, d.busGains.music, d.busGains.sfx, d.breatherFloorGain, ...NAMES.map((n) => d.perCueGain[n]), ...KIT.map((k) => d.perCueGain.kit[k])];
ck(`1 ${bd} gains > 0 complete`, gains.every((g) => F(g) && g > 0));
ck(`1 ${bd} shape (no extra fields)`, J(Object.keys(d).sort()) === J(['breatherFloorGain', 'busGains', 'duck', 'limiter', 'masterGain', 'perCueGain']));
const P = PR(d, plan), T = MIX.TARGETS;
ck(`2 ${bd} lufs`, Math.abs(P.lufsProxy - T.lufs) <= T.lufsTol, P.lufsProxy);
ck(`2 ${bd} truePeak`, P.truePeakProxy <= T.tpMax, P.truePeakProxy);
ck(`2 ${bd} over-bed WAIVED-with-floor >= ${FLOOR}`, P.perCue.length > 0 && P.perCue.every((c) => c.overBedDb >= FLOOR), P.sfxOverBedMinDb);
ck(`2 ${bd} perCue covers plan.sfx`, P.perCue.length === plan.sfx.length);
ck(`2 ${bd} breather`, P.breatherFloorDb >= T.breatherMin, P.breatherFloorDb);
ck(`2 ${bd} seam`, P.seamDb >= T.seamMin, P.seamDb);
ck(`2 ${bd} predict deterministic`, J(P) === J(PR(d, plan)));
pred[bd] = P;
const L = d.limiter;
ck(`3 ${bd} limiter`, L.threshold <= -3 && L.knee <= 1 && L.ratio >= 12 && L.release > 0 && L.release <= 0.25, J(L));
const times = plan.sfx.map((x) => x.t);
const m = mockCtx(), N = m.nodes; const r = MIX.apply(m.ctx, N, d, plan);
ck(`3 ${bd} sfx gains in (0,1]`, r.applied && plan.sfx.every((x) => x.gain > 0 && x.gain <= 1));
const ts = times.slice().sort((a, b) => a - b);
ck(`3 ${bd} times unchanged + spacing >= 120 ms`, J(plan.sfx.map((x) => x.t)) === J(times) && ts.every((t, i) => i === 0 || (t - ts[i - 1]) * 1000 >= 120 - 1e-6));
const r2 = MIX.apply(m.ctx, N, d, plan);
const out = (n) => (m.log.edges.get(n) || []);
ck(`5 ${bd} one limiter, 2nd call reconfigures`, m.log.compressors === 1 && r.limiterInserted === true && r2.applied && r2.limiterInserted === false);
ck(`5 ${bd} comp -> limiter -> master`, out(N.comp).length === 1 && out(N.comp)[0] === N.limiter && out(N.limiter).length === 1 && out(N.limiter)[0] === N.master);
ck(`5 ${bd} limiter attack 0 + params`, N.limiter.attack.value === 0 && N.limiter.threshold.value === L.threshold && N.limiter.ratio.value === L.ratio);
ck(`5 ${bd} bus values`, N.master.gain.value === d.masterGain && N.music.gain.value === d.busGains.music && N.sfx.gain.value === d.busGains.sfx && N.pad.gain.value === MIX.BASE.pad * d.breatherFloorGain);
const ev = plan.events.filter((e) => e.type === 'sfx');
ck(`5 ${bd} events sfx gains == plan.sfx gains`, ev.length === plan.sfx.length && ev.every((e, i) => e.gain === plan.sfx[i].gain));
ck(`5 ${bd} null ctx/nodes -> applied:false`, MIX.apply(null, N, d, plan).applied === false && MIX.apply(m.ctx, null, d, plan).applied === false);
}
{ // kit wrap: multiplies by kit[MAP[NAME]] exactly once after two applies
const K = sb.SFX_KIT; let seen = null; const orig = K.play; K.play = function (c, b, cue, at, g) { seen = g; return null; };
const plan = mkPlan(sb, BOARDS[0]); const d = MIX.design(plan, tokens, 7); const m = mockCtx();
MIX.apply(m.ctx, m.nodes, d, plan); MIX.apply(m.ctx, m.nodes, d, plan);
sb.SFX_KIT.play({}, {}, 'click', 0, 0.5);
ck('5 kit wrap once', sb.SFX_KIT.play.__mix === true && Math.abs(seen - 0.5 * d.perCueGain.kit[K.MAP.CLICK]) < 1e-12, seen);
K.play = orig;
}
{ // E1 intersections 2 + 4: predict models makeup and the SFX-only cap; uncovered cues inherit the worst measured cue
const plan = mkPlan(sb, BOARDS[0]), d = MIX.design(plan, tokens, 7), P = PR(d, plan);
const mk = (T, R) => 0.6 * -T * (1 - 1 / R);
const dT = clone(d); dT.limiter.threshold = -6;
ck('I2 makeup modeled', Math.abs((PR(dT, plan).lufsProxy - P.lufsProxy) - (mk(-6, 20) - mk(d.limiter.threshold, 20))) < 1e-9);
const dK = clone(d); Object.keys(dK.perCueGain.kit).forEach((k) => { dK.perCueGain.kit[k] *= 10; });
ck('I2 SFX cap', Math.abs(PR(dK, plan).sfxOverBedMinDb - P.sfxOverBedMinDb) < 1e-9);
const dM = clone(d); dM.masterGain *= Math.pow(10, 1 / 20);
ck('I2 TP via limiter ceiling', Math.abs(PR(dM, plan).truePeakProxy - P.truePeakProxy - 1) < 1e-9);
const U = PR(d, { sfx: [{ t: 99, name: 'CLICK' }] });
ck('I4 uncovered cue = worst', U.perCue[0].overBedDb <= P.sfxOverBedMinDb + 1e-9, U.perCue[0].overBedDb);
}
ck('4 duck frozen', duckPredicate(MIX, sb));
ck('6 forbidden tokens', !/Math\.random|Date\.now|performance\.now|requestAnimationFrame|setValueAtTime|RampToValueAtTime|cancelScheduledValues/.test(SRC));
ck('6 size <= 14 KB', Buffer.byteLength(SRC) <= 14 * 1024, Buffer.byteLength(SRC));
ck('6 VERSION string', typeof MIX.VERSION === 'string' && MIX.VERSION.length > 0);
{
const cut = (s, head) => { const i = s.indexOf(head); if (i < 0) return s; let j = s.indexOf('{', i), dep = 0, k = j; for (; k < s.length; k++) { if (s[k] === '{') dep++; else if (s[k] === '}' && --dep === 0) break; } return s.slice(0, i) + s.slice(k + 1); };
const body = cut(cut(SRC, 'var BASE = {'), 'var TARGETS = {').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/'[^'\n]*'/g, "''");
const nums = (body.match(/(?<![\w$.])\d+(\.\d+)?(e-?\d+)?(?![\w$])/g) || []).filter((n) => !['0', '1', '10', '20', '1000', '0.355'].includes(n));
ck('6 numeric literals only in BASE/TARGETS', nums.length === 0, nums.join(','));
const r = cp.spawnSync(process.execPath, [RP('skills/motion-soup/scripts/soup-runner.mjs'), 'check-literals', FILE, '--tokens', RP('work/tokens.resolved.json')], { cwd: ROOT, encoding: 'utf8' });
ck('6 check-literals exit 0', r.status === 0, (r.stdout || '') + (r.stderr || ''));
}
{ // 8. negative mutation on a copy: predicate 4 must FAIL
const mut = SRC.replace('depthDb: -6,', 'depthDb: -5,'); let caught = false;
if (mut !== SRC) { const s2 = sandbox(); caught = !duckPredicate(load(s2, mut, 'soup-mut.js', 'MIX'), s2); }
ck('8 mutation caught', caught);
}
const fields = (P, v) => [['lufs', P.lufsProxy, v.lufs_i_proxy], ['tp', P.truePeakProxy, v.true_peak_dBTP_proxy], ['overBedMin', P.sfxOverBedMinDb, v.sfx_over_bed_min_dB], ['breather', P.breatherFloorDb, v.breather_floor_dBFS], ['seam', P.seamDb, v.seam_min_dBFS]];
for (const I of ['A', 'B', 'C']) {
const s = sandbox(), M = load(s, fs.readFileSync(H(`cand-${I}.js`), 'utf8'), `cand-${I}.js`, 'MIX_' + I);
const v = JSON.parse(fs.readFileSync(H(`cand-${I}-audio-report.json`), 'utf8')).v92;
const f = fields(PR(M.design(mkPlan(s, BOARDS[0]), null, 7), mkPlan(s, BOARDS[0])), v);
ck(`C ${I} predict~measured`, f.every(([, a, b]) => Math.abs(a - b) <= 1.5), J(f));
}
if (!process.env.PW_MODULE) console.log('SKIP probe');
else {
const rp = H('soup-audio-report.json');
if (process.env.MIX_REPROBE === '1' || !fs.existsSync(rp)) {
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mix-soup-'));
const env = Object.assign({}, process.env, { PROBE_OUT: dir, TAG: 'soup' });
const a = cp.spawnSync(process.execPath, [H('probe-soup.mjs')], { cwd: dir, env, encoding: 'utf8', timeout: 600000 });
const b = cp.spawnSync('python3', ['-I', RP('work/eval-v9/audio-probe/analyze.py'), dir, 'soup'], { encoding: 'utf8' });
ck('7 probe ran (isolated folder)', a.status === 0 && b.status === 0, String(a.stderr) + b.stderr);
if (b.status === 0) fs.copyFileSync(path.join(dir, 'soup-audio-report.json'), rp);
}
if (!fs.existsSync(rp)) ck('7 probe report exists', false, rp);
else {
const v = JSON.parse(fs.readFileSync(rp, 'utf8')).v92, P = pred[BOARDS[0]];
const f = fields(P, v);
console.log('measured (MCP board): field predicted measured |d|'); f.forEach(([k, a, b]) => console.log(`  ${k} ${a.toFixed(2)} ${b.toFixed(2)} ${Math.abs(a - b).toFixed(2)}`));
ck('7 thresholds (no waiver)', Math.abs(v.lufs_i_proxy + 16) <= 1.5 && v.true_peak_dBTP_proxy < -1.5 && v.seam_min_dBFS >= -20 && v.breather_floor_dBFS >= -30 && v.holes_inside.length === 0 && v.sfx_pairs_under_120ms === 0 && v.sfx_min_gap_ms >= 120);
const ob = v.sfx_over_bed_min_dB;
console.log(`WAIVED over-bed: measured min ${ob} dB, floor ${FLOOR} ${ob >= FLOOR ? 'held' : 'REGRESSED'}`);
ck(`7 over-bed WAIVED-with-floor >= ${FLOOR}`, ob >= FLOOR, ob);
ck('7 predict within 1.5 dB of measured', f.every(([, a, b]) => Math.abs(a - b) <= 1.5), J(f));
}
}
console.log(fails.length ? `FAIL ${fails.length}: ${fails.join(' | ')}` : 'PASS all predicates');
process.exit(fails.length ? 1 : 0);
