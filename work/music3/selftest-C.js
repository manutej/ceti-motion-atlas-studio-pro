// selftest-C: node work/music3/selftest-C.js — exit 0 only if every CONTRACT predicate holds for MIX_C.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process'), assert = require('assert');
const ROOT = path.resolve(__dirname, '..', '..');
const CAND = path.join(__dirname, 'cand-C.js');
const SRC = fs.readFileSync(CAND, 'utf8');
const fails = [];
const ck = (id, ok, why) => { if (!ok) fails.push(id + (why ? ': ' + why : '')); console.log((ok ? 'ok   ' : 'FAIL ') + id + (why && !ok ? ' — ' + why : '')); };

function sandbox() {
  const sb = { console, Math, JSON, Date, Object, Array, Number, String, setTimeout, clearTimeout, setInterval, clearInterval,
    document: { getElementById: () => null, addEventListener: () => {}, createElement: () => ({ style: {}, getContext: () => null }) } };
  sb.window = sb; sb.globalThis = sb; vm.createContext(sb);
  for (const f of ['geome-wada.js', 'studio-motion-engine.js', 'vendor/sfx-kit.js', 'studio-music-engine.js', 'studio-canvas-oauth.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  return sb;
}
function loadMix(sb, src) { vm.runInContext(src, sb, { filename: 'cand-C.js' }); return sb.MIX_C; }
const sb = sandbox();
const MIX = loadMix(sb, SRC);
const tokens = require(path.join(ROOT, 'work/tokens.resolved.json'));
const PAL = { id: 343, a: '#ebd3a2', h: '#ae5224', b: '#527e91' };
function mkPlan(s, boardKey) {
  const O = s.STUDIO_CANVAS_OAUTH;
  const sheet = O.storyboardToMusicSheet(O.buildStoryboardSheet({ boardKey, charId: 'ceti-whale', palId: 343 }), 'spring');
  return s.MUSIC.plan(sheet, PAL, 'mix3');
}
const BOARDS = ['v9-mcp-server', 'v9-planning-fallacy'];
const NAMES = ['CLICK', 'BOOP', 'WHOOSH', 'THUD', 'BOING', 'CHORD', 'TICK', 'RISER'];
const KIT = ['whoosh', 'impact', 'pop', 'click', 'tick', 'riser', 'ding'];
const DUCK = { depthDb: -6, attackMs: 10, holdMs: 250, releaseMs: 150 };
const leaves = (o, out = []) => { if (o && typeof o === 'object') Object.values(o).forEach((v) => leaves(v, out)); else out.push(o); return out; };

// mock WebAudio graph: edges logged per node
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
  const plan = mkPlan(s, BOARDS[0]); const before = JSON.stringify(s.MUSIC.DUCK);
  const d = M.design(plan, tokens, 7); const m = mockCtx(); M.apply(m.ctx, m.nodes, d, plan);
  return JSON.stringify(d.duck) === JSON.stringify(DUCK) && JSON.stringify(s.MUSIC.DUCK) === before && JSON.stringify(plan.duck) === JSON.stringify({ dB: -6, attackMs: 10, holdMs: 250, releaseMs: 150 });
}

const report = {};
for (const board of BOARDS) {
  const plan = mkPlan(sb, board);
  // 1. determinism + shape
  const d = MIX.design(plan, tokens, 7), d2 = MIX.design(plan, tokens, 7);
  let same = true; try { assert.deepStrictEqual(d, d2); } catch (_e) { same = false; }
  ck(`1 ${board} deep-equal`, same);
  ck(`1 ${board} leaves finite`, leaves(d).every((x) => typeof x === 'number' && Number.isFinite(x)));
  const gains = [d.masterGain, d.busGains.music, d.busGains.sfx, d.breatherFloorGain, ...NAMES.map((n) => d.perCueGain[n]), ...KIT.map((k) => d.perCueGain.kit[k])];
  ck(`1 ${board} gains > 0 and complete`, gains.every((g) => Number.isFinite(g) && g > 0));
  ck(`1 ${board} shape`, JSON.stringify(Object.keys(d).sort()) === JSON.stringify(['breatherFloorGain', 'busGains', 'duck', 'limiter', 'masterGain', 'perCueGain']));
  // 2. predict
  const P = MIX.predict(d, plan), T = MIX.TARGETS;
  ck(`2 ${board} lufs`, Math.abs(P.lufsProxy - T.lufs) <= T.lufsTol, P.lufsProxy);
  ck(`2 ${board} truePeak`, P.truePeakProxy <= T.tpMax, P.truePeakProxy);
  ck(`2 ${board} every cue over bed`, P.perCue.length > 0 && P.perCue.every((c) => c.overBedDb >= T.overBedMin), JSON.stringify(P.perCue));
  ck(`2 ${board} perCue covers plan.sfx`, P.perCue.length === plan.sfx.length);
  ck(`2 ${board} breather`, P.breatherFloorDb >= T.breatherMin, P.breatherFloorDb);
  ck(`2 ${board} seam`, P.seamDb >= T.seamMin, P.seamDb);
  ck(`2 ${board} predict deterministic`, JSON.stringify(P) === JSON.stringify(MIX.predict(d, plan)));
  // 3. limiter + rewritten gains + unchanged times
  const L = d.limiter;
  ck(`3 ${board} limiter`, L.threshold <= -3 && L.knee <= 1 && L.ratio >= 12 && L.release > 0 && L.release <= 0.25, JSON.stringify(L));
  const times = plan.sfx.map((x) => x.t);
  const m = mockCtx(); const r = MIX.apply(m.ctx, m.nodes, d, plan);
  ck(`3 ${board} sfx gains in (0,1]`, r.applied && plan.sfx.every((x) => x.gain > 0 && x.gain <= 1));
  ck(`3 ${board} times unchanged`, JSON.stringify(plan.sfx.map((x) => x.t)) === JSON.stringify(times));
  const ts = times.slice().sort((a, b) => a - b);
  ck(`3 ${board} spacing >= 120 ms`, ts.every((t, i) => i === 0 || (t - ts[i - 1]) * 1000 >= 120 - 1e-6));
  // 5. graph
  const r2 = MIX.apply(m.ctx, m.nodes, d, plan);
  const out = (n) => (m.log.edges.get(n) || []);
  ck(`5 ${board} one compressor over two calls`, m.log.compressors === 1 && r2.applied);
  ck(`5 ${board} comp -> limiter -> master`, out(m.nodes.comp).length === 1 && out(m.nodes.comp)[0] === m.nodes.limiter && out(m.nodes.limiter).length === 1 && out(m.nodes.limiter)[0] === m.nodes.master);
  ck(`5 ${board} limiter attack 0 + params`, m.nodes.limiter.attack.value === 0 && m.nodes.limiter.threshold.value === L.threshold);
  ck(`5 ${board} bus values`, m.nodes.master.gain.value === d.masterGain && m.nodes.music.gain.value === d.busGains.music && m.nodes.sfx.gain.value === d.busGains.sfx && m.nodes.pad.gain.value === MIX.BASE.pad * d.breatherFloorGain);
  const ev = plan.events.filter((e) => e.type === 'sfx');
  ck(`5 ${board} events sfx gains == plan.sfx gains`, ev.length === plan.sfx.length && ev.every((e, i) => e.gain === plan.sfx[i].gain));
  ck(`5 ${board} null ctx/nodes`, MIX.apply(null, m.nodes, d, plan).applied === false && MIX.apply(m.ctx, null, d, plan).applied === false);
  report[board] = { cues: P.perCue.map((c) => `${c.name}@${c.t}:${c.overBedDb.toFixed(2)}`).join(' '), lufs: P.lufsProxy, tp: P.truePeakProxy, min: P.sfxOverBedMinDb, br: P.breatherFloorDb, seam: P.seamDb };
}
// kit wrap: multiplies by kit[MAP[NAME]] exactly once after two applies
{
  const K = sb.SFX_KIT; let seen = null; const orig = K.play; K.play = function (c, b, cue, at, g) { seen = g; return null; };
  const plan = mkPlan(sb, BOARDS[0]); const d = MIX.design(plan, tokens, 7); const m = mockCtx();
  MIX.apply(m.ctx, m.nodes, d, plan); MIX.apply(m.ctx, m.nodes, d, plan);
  sb.SFX_KIT.play({}, {}, 'click', 0, 0.5);
  ck('5 kit wrap once', sb.SFX_KIT.play.__mix === true && Math.abs(seen - 0.5 * d.perCueGain.kit[K.MAP.CLICK]) < 1e-12, seen);
  K.play = orig;
}
// 4. duck frozen
ck('4 duck frozen', duckPredicate(MIX, sb));
// 6. text predicates
ck('6 forbidden tokens', !/Math\.random|Date\.now|performance\.now|requestAnimationFrame|setValueAtTime|RampToValueAtTime|cancelScheduledValues/.test(SRC));
ck('6 size <= 14 KB', Buffer.byteLength(SRC) <= 14 * 1024, Buffer.byteLength(SRC));
ck('6 VERSION string', typeof MIX.VERSION === 'string' && MIX.VERSION.length > 0);
{ // numeric literals outside BASE / TARGETS (unit constants 20, 10 and structural 0, 1 allowed)
  const cut = (s, head) => { const i = s.indexOf(head); if (i < 0) return s; let j = s.indexOf('{', i), dep = 0, k = j; for (; k < s.length; k++) { if (s[k] === '{') dep++; else if (s[k] === '}' && --dep === 0) break; } return s.slice(0, i) + s.slice(k + 1); };
  let body = cut(cut(SRC, 'var BASE = {'), 'var TARGETS = {').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/'[^'\n]*'/g, "''");
  const nums = (body.match(/(?<![\w$.])\d+(\.\d+)?(e-?\d+)?(?![\w$])/g) || []).filter((n) => !['0', '1', '10', '20', '1000', '0.355'].includes(n));
  ck('6 numeric literals exempt-only', nums.length === 0, nums.join(','));
}
{
  const r = cp.spawnSync(process.execPath, [path.join(ROOT, 'skills/motion-soup/scripts/soup-runner.mjs'), 'check-literals', CAND, '--tokens', path.join(ROOT, 'work/tokens.resolved.json')], { cwd: ROOT, encoding: 'utf8' });
  ck('6 check-literals exit 0', r.status === 0, (r.stdout || '') + (r.stderr || ''));
}
// 8. negative mutation on a copy: predicate 4 must FAIL
{
  const mut = SRC.replace('depthDb: -6,', 'depthDb: -5,');
  let caught = false;
  if (mut !== SRC) { const s2 = sandbox(); caught = !duckPredicate(loadMix(s2, mut), s2); }
  ck('8 mutation caught', caught);
}
// 7. measured probe (only when PW_MODULE is set)
if (!process.env.PW_MODULE) console.log('SKIP probe');
else {
  const rp = path.join(__dirname, 'cand-C-audio-report.json');
  if (!fs.existsSync(rp)) ck('7 probe report exists', false, rp);
  else {
    const v = JSON.parse(fs.readFileSync(rp, 'utf8')).v92;
    const plan = JSON.parse(fs.readFileSync(path.join(__dirname, 'cand-C-plan.json'), 'utf8'));
    const P = MIX.predict(MIX.design(plan, null, 7), plan);
    ck('7 thresholds', Math.abs(v.lufs_i_proxy + 16) <= 1.5 && v.true_peak_dBTP_proxy < -1.5 && v.sfx_over_bed.every((o) => o.over_bed_dB >= 6) && v.seam_min_dBFS >= -20 && v.breather_floor_dBFS >= -30 && v.holes_inside.length === 0);
    const pairs = [[P.lufsProxy, v.lufs_i_proxy], [P.truePeakProxy, v.true_peak_dBTP_proxy], [P.sfxOverBedMinDb, v.sfx_over_bed_min_dB], [P.breatherFloorDb, v.breather_floor_dBFS], [P.seamDb, v.seam_min_dBFS]];
    ck('7 predict within 1.5 dB of measured', pairs.every(([a, b]) => Math.abs(a - b) <= 1.5), JSON.stringify(pairs));
  }
}
console.log(JSON.stringify(report, null, 1));
console.log(fails.length ? `FAIL ${fails.length}` : 'PASS all predicates');
process.exit(fails.length ? 1 : 0);
