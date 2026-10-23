// selftest-A — contract predicates 1-8 for work/music3/cand-A.js (node, no deps). Exit 0 only if all hold.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process'), assert = require('assert');
const ROOT = path.resolve(__dirname, '..', '..');
const CAND = path.join(__dirname, 'cand-A.js');
const fails = [];
const ok = (id, cond, msg) => { if (!cond) fails.push(id + ': ' + msg); return !!cond; };

function sandbox() {
  const sb = { console, Math, JSON, Date, Object, Array, Number, String, setTimeout, clearTimeout, setInterval, clearInterval,
    document: { getElementById: () => null, addEventListener: () => {}, createElement: () => ({ style: {}, getContext: () => null }) } };
  sb.window = sb; sb.globalThis = sb; vm.createContext(sb);
  for (const f of ['geome-wada.js', 'studio-motion-engine.js', 'vendor/sfx-kit.js', 'studio-music-engine.js', 'studio-canvas-oauth.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  return sb;
}
function loadMix(sb, file) { vm.runInContext(fs.readFileSync(file, 'utf8'), sb, { filename: file }); return sb.MIX_A; }
function plans(sb) {
  const O = sb.STUDIO_CANVAS_OAUTH;
  return ['v9-mcp-server', 'v9-planning-fallacy'].map((boardKey) => {
    const sheet = O.storyboardToMusicSheet(O.buildStoryboardSheet({ boardKey, charId: 'ceti-whale', palId: 343 }), 'spring');
    return { boardKey, plan: sb.MUSIC.plan(sheet, { id: 343, a: '#ebd3a2', h: '#ae5224', b: '#527e91' }, 'mix3') };
  });
}
const tokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'work/tokens.resolved.json'), 'utf8'));
const deq = (a, b) => { try { assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b))); return true; } catch (_e) { return false; } };
const leaves = (o, out = []) => { for (const v of Object.values(o)) (v && typeof v === 'object') ? leaves(v, out) : out.push(v); return out; };
const DUCK_LAW = { depthDb: -6, attackMs: 10, holdMs: 250, releaseMs: 150 };
const KITS = ['whoosh', 'impact', 'pop', 'click', 'tick', 'riser', 'ding'];
const NAMES = ['CLICK', 'BOOP', 'WHOOSH', 'THUD', 'BOING', 'CHORD', 'TICK', 'RISER'];

function mockCtx() {
  const log = { comps: 0, connects: [], disconnects: [] };
  const param = (v) => ({ value: v });
  const node = (kind) => ({ kind, connect(n) { log.connects.push([this.kind, n && n.kind]); }, disconnect(n) { log.disconnects.push([this.kind, n && n.kind]); } });
  const ctx = { log,
    createGain() { const n = node('gain'); n.gain = param(1); return n; },
    createDynamicsCompressor() { log.comps++; const n = node('limiter'); Object.assign(n, { threshold: param(0), knee: param(0), ratio: param(1), attack: param(0), release: param(0) }); return n; } };
  const mk = (k) => { const n = ctx.createGain(); n.kind = k; return n; };
  const nodes = { master: mk('master'), music: mk('music'), sfx: mk('sfx'), pad: mk('pad'), duck: mk('duck') };
  nodes.comp = node('comp'); log.comps = 0;
  return { ctx, nodes };
}

// predicate 4 alone (used by the negative mutation)
function pred4(MIX, sb, plan) {
  const before = JSON.stringify(sb.MUSIC.DUCK);
  const d = MIX.design(plan, tokens, 7);
  const m = mockCtx(); MIX.apply(m.ctx, m.nodes, d, JSON.parse(JSON.stringify(plan)));
  return deq(d.duck, DUCK_LAW) && JSON.stringify(sb.MUSIC.DUCK) === before && JSON.stringify(sb.MUSIC.DUCK) === JSON.stringify({ dB: -6, attackMs: 10, holdMs: 250, releaseMs: 150 });
}

function run(file, label) {
  const sb = sandbox(), MIX = loadMix(sb, file), P = plans(sb), report = {};
  ok('api', MIX && ['design', 'apply', 'predict'].every((k) => typeof MIX[k] === 'function') && MIX.TARGETS && MIX.BASE && typeof MIX.VERSION === 'string', 'API shape');
  const T = MIX.TARGETS;
  for (const { boardKey, plan } of P) {
    const d = MIX.design(plan, tokens, 7), d2 = MIX.design(plan, tokens, 7);
    // 1
    ok('p1 ' + boardKey, deq(d, d2), 'design not deterministic');
    ok('p1 ' + boardKey, leaves(d).every((v) => typeof v === 'number' && isFinite(v)), 'non-finite leaf');
    const gains = [d.masterGain, d.busGains.music, d.busGains.sfx, d.breatherFloorGain, ...NAMES.map((n) => d.perCueGain[n]), ...KITS.map((k) => d.perCueGain.kit[k])];
    ok('p1 ' + boardKey, gains.every((g) => isFinite(g) && g > 0), 'gain <= 0 or missing');
    ok('p1 ' + boardKey, NAMES.every((n) => n in d.perCueGain) && KITS.every((k) => k in d.perCueGain.kit), 'perCueGain keys');
    // 2
    const pr = MIX.predict(d, plan);
    report[boardKey] = { lufs: pr.lufsProxy, tp: pr.truePeakProxy, overBedMin: pr.sfxOverBedMinDb, breather: pr.breatherFloorDb, seam: pr.seamDb, cues: pr.perCue.length };
    ok('p2 ' + boardKey, Math.abs(pr.lufsProxy - T.lufs) <= 1.5, 'lufs ' + pr.lufsProxy);
    ok('p2 ' + boardKey, pr.truePeakProxy <= -1.5, 'tp ' + pr.truePeakProxy);
    ok('p2 ' + boardKey, pr.perCue.length > 0 && pr.perCue.every((c) => c.overBedDb >= 6), 'over-bed ' + pr.sfxOverBedMinDb);
    ok('p2 ' + boardKey, MIX.predict(d, MIX.BASE.cues.length ? { sfx: MIX.BASE.cues } : plan).perCue.every((c) => c.overBedDb >= 6), 'measured cues incl. CLICK@0.865');
    ok('p2 ' + boardKey, pr.breatherFloorDb >= -30 && pr.seamDb >= -20, 'breather ' + pr.breatherFloorDb + ' seam ' + pr.seamDb);
    // 3
    const L = d.limiter;
    ok('p3 ' + boardKey, L.threshold <= -3 && L.knee <= 1 && L.ratio >= 12 && L.release > 0 && L.release <= 0.25, 'limiter params');
    const pc = JSON.parse(JSON.stringify(plan)), t0 = pc.sfx.map((x) => x.t);
    const m = mockCtx(), r1 = MIX.apply(m.ctx, m.nodes, d, pc);
    ok('p3 ' + boardKey, r1.applied && pc.sfx.every((x) => isFinite(x.gain) && x.gain > 0 && x.gain <= 1), 'rewritten gains out of (0,1]');
    ok('p3 ' + boardKey, deq(pc.sfx.map((x) => x.t), t0), 'sfx times moved');
    const ts = pc.sfx.map((x) => x.t).sort((a, b) => a - b);
    ok('p3 ' + boardKey, ts.every((t, i) => i === 0 || (t - ts[i - 1]) * 1000 >= 120 - 1e-6), 'sfx < 120 ms apart');
    // 4
    ok('p4 ' + boardKey, pred4(MIX, sb, plan), 'duck law');
    // 5
    const r2 = MIX.apply(m.ctx, m.nodes, d, pc);
    ok('p5 ' + boardKey, m.ctx.log.comps === 1 && r2.applied && r2.limiterInserted, 'compressor count ' + m.ctx.log.comps);
    const cn = m.ctx.log.connects.map((c) => c.join('>'));
    ok('p5 ' + boardKey, cn.includes('comp>limiter') && cn.includes('limiter>master') && m.ctx.log.disconnects.some((x) => x[0] === 'comp'), 'graph comp>limiter>master');
    ok('p5 ' + boardKey, m.nodes.limiter.attack.value === 0 && m.nodes.limiter.threshold.value === L.threshold, 'limiter configured');
    ok('p5 ' + boardKey, m.nodes.master.gain.value === d.masterGain && m.nodes.pad.gain.value === MIX.BASE.pad * d.breatherFloorGain, 'bus values');
    ok('p5 ' + boardKey, MIX.apply(null, m.nodes, d, pc).applied === false && MIX.apply(m.ctx, null, d, pc).applied === false, 'null guards');
    const evG = pc.events.filter((e) => e.type === 'sfx').map((e) => e.gain), sfG = pc.sfx.map((x) => x.gain);
    ok('p5 ' + boardKey, deq(evG.slice().sort(), sfG.slice().sort()), 'events gains != sfx gains');
  }
  // 5b: kit wrap is installed once and multiplies
  const K = sb.SFX_KIT;
  ok('p5 kit', K && K.play.__mix === true, 'kit play not wrapped');
  return { MIX, sb, P, report };
}

const main = run(CAND, 'cand-A');
// 6: text predicates
const src = fs.readFileSync(CAND, 'utf8');
ok('p6', !/Math\.random|Date\.now|performance\.now|requestAnimationFrame|setValueAtTime|RampToValueAtTime|cancelScheduledValues/.test(src), 'forbidden token');
ok('p6', Buffer.byteLength(src) <= 14 * 1024, 'size ' + Buffer.byteLength(src));
ok('p6', /VERSION = '[^']+'/.test(src), 'VERSION string');
const body = src.replace(/\/\*EXEMPT-BEGIN[\s\S]*?\/\*EXEMPT-END\*\//, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/'[^'\n]*'/g, "''");
const nums = (body.match(/(?<![\w.])\d+(?:\.\d+)?(?![\w.])/g) || []).filter((n) => !['0', '1', '2', '10', '20', '1000', '0.355'].includes(n));
ok('p6', nums.length === 0, 'numeric literals outside exempt block: ' + nums.join(','));
ok('p6', !/#[0-9a-f]{3,8}\b|rgba?\(|\bbpm\b|serif|sans-serif|monospace/i.test(body), 'colour/font/bpm literal');
let litExit = 1;
try { cp.execFileSync('node', ['skills/motion-soup/scripts/soup-runner.mjs', 'check-literals', 'work/music3/cand-A.js', '--tokens', 'work/tokens.resolved.json'], { cwd: ROOT, stdio: 'pipe' }); litExit = 0; } catch (e) { litExit = e.status; }
ok('p6', litExit === 0, 'check-literals exit ' + litExit);
// 7: measured probe (only with PW_MODULE)
if (process.env.PW_MODULE) {
  const rp = path.join(__dirname, 'cand-A-audio-report.json');
  if (!fs.existsSync(rp)) ok('p7', false, 'run the probe first (cand-A-audio-report.json missing)');
  else {
    const v = JSON.parse(fs.readFileSync(rp, 'utf8')).v92, pr = main.MIX.predict(main.MIX.design(main.P[0].plan, tokens, 7), main.P[0].plan);
    ok('p7', Math.abs(v.lufs_i_proxy + 16) <= 1.5 && v.true_peak_dBTP_proxy < -1.5 && v.sfx_over_bed_min_dB >= 6 && v.sfx_pairs_under_120ms === 0 && v.holes_inside.length === 0 && v.seam_min_dBFS >= -20 && v.breather_floor_dBFS >= -30, 'probe thresholds');
    for (const [k, m] of [['lufsProxy', v.lufs_i_proxy], ['truePeakProxy', v.true_peak_dBTP_proxy], ['sfxOverBedMinDb', v.sfx_over_bed_min_dB], ['breatherFloorDb', v.breather_floor_dBFS], ['seamDb', v.seam_min_dBFS]])
      ok('p7', Math.abs(pr[k] - m) <= 1.5, k + ' predicted ' + pr[k].toFixed(2) + ' measured ' + m);
  }
} else console.log('SKIP probe');
// 8: negative mutation on a copy -> predicate 4 must FAIL
const mutPath = path.join(__dirname, '.mut-A.js');
const mutated = src.replace('depthDb: -6,', 'depthDb: -5,');
fs.writeFileSync(mutPath, mutated);
let caught = false;
try { const sb = sandbox(), M = loadMix(sb, mutPath); caught = mutated !== src && !pred4(M, sb, plans(sb)[0].plan); } finally { fs.unlinkSync(mutPath); }
ok('p8', caught, 'mutation depthDb -5 not caught');

console.log(JSON.stringify({ predicted: main.report, mutation: { caught }, literalsExit: litExit }, null, 1));
if (fails.length) { console.log('FAIL\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('PASS all predicates'); process.exit(0);
