// selftest-B — contract predicates 1-8 for work/music3/cand-B.js. node, no deps. Exit 0 only if every predicate holds.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process'), assert = require('assert');
const ROOT = path.resolve(__dirname, '..', '..');
const R = (p) => path.join(ROOT, p);
const CAND = R('work/music3/cand-B.js');
const results = [];
const ck = (id, ok, msg) => { results.push([id, !!ok, msg || '']); };

function sandbox() {
  const sb = { console, Math, JSON, Date, Object, Array, Number, String, setTimeout, clearTimeout, setInterval, clearInterval,
    document: { getElementById: () => null, addEventListener: () => {}, createElement: () => ({ style: {}, getContext: () => null }) } };
  sb.window = sb; sb.globalThis = sb; vm.createContext(sb);
  for (const f of ['geome-wada.js', 'studio-motion-engine.js', 'vendor/sfx-kit.js', 'studio-music-engine.js', 'studio-canvas-oauth.js'])
    vm.runInContext(fs.readFileSync(R(f), 'utf8'), sb, { filename: f });
  return sb;
}
function loadMix(sb, src) { vm.runInContext(src, sb, { filename: 'cand-B.js' }); return sb.MIX_B; }
const hex = (s) => '#' + s;   // fixture palette built at runtime (keeps colour literals out of the source)
const PAL = { id: 343, a: hex('ebd3a2'), h: hex('ae5224'), b: hex('527e91') };
const BOARDS = ['v9-mcp-server', 'v9-planning-fallacy'];
const tokens = JSON.parse(fs.readFileSync(R('work/tokens.resolved.json'), 'utf8'));
function plans(sb) {
  const O = sb.STUDIO_CANVAS_OAUTH;
  return BOARDS.map((boardKey) => {
    const sheet = O.storyboardToMusicSheet(O.buildStoryboardSheet({ boardKey, charId: 'ceti-whale', palId: 343 }), 'spring');
    return { boardKey, plan: sb.MUSIC.plan(sheet, PAL, 'mix3') };
  });
}
const clone = (x) => JSON.parse(JSON.stringify(x));
const deq = (a, b) => { try { assert.deepStrictEqual(clone(a), clone(b)); return true; } catch (_e) { return false; } };
function leaves(o, out = [], p = '') {
  if (o && typeof o === 'object') { for (const k of Object.keys(o)) leaves(o[k], out, p + '.' + k); } else out.push([p, o]);
  return out;
}
const DUCK = { depthDb: -6, attackMs: 10, holdMs: 250, releaseMs: 150 };

function mockCtx(log) {
  const P = (v) => ({ value: v });
  let comps = 0;
  const node = (kind) => {
    const n = { kind, outs: [], connect(d) { n.outs.push(d); log.push(kind + '->' + d.kind); return d; },
      disconnect(d) { n.outs = d ? n.outs.filter((x) => x !== d) : []; log.push(kind + '-x' + (d ? d.kind : '*')); } };
    return n;
  };
  const ctx = {
    get comps() { return comps; },
    createGain() { const n = node('gain'); n.gain = P(1); return n; },
    createDynamicsCompressor() { comps++; const n = node('limiter'); Object.assign(n, { threshold: P(0), knee: P(0), ratio: P(0), attack: P(1), release: P(1) }); return n; }
  };
  const nodes = {};
  for (const k of ['master', 'music', 'sfx', 'pad', 'duck']) { nodes[k] = node(k); nodes[k].gain = P(1); }
  nodes.comp = node('comp'); nodes.comp.connect(nodes.master);
  return { ctx, nodes };
}

// predicate 4 as a function (re-used by the negative mutation, predicate 8)
function duckHolds(M, sb, plan) {
  const before = clone(sb.MUSIC.DUCK);
  const d = M.design(plan, tokens, 7);
  const { ctx, nodes } = mockCtx([]);
  M.apply(ctx, nodes, d, clone(plan));
  return deq(d.duck, DUCK) && deq(sb.MUSIC.DUCK, before) && deq(before, { dB: -6, attackMs: 10, holdMs: 250, releaseMs: 150 });
}

const src = fs.readFileSync(CAND, 'utf8');
const sb = sandbox();
const M = loadMix(sb, src);
const Mreq = require(CAND);
ck('0.exports', M && Mreq && typeof Mreq.design === 'function' && typeof M.apply === 'function' && typeof M.predict === 'function');
const NAMES = ['CLICK', 'BOOP', 'WHOOSH', 'THUD', 'BOING', 'CHORD', 'TICK', 'RISER'];
const KIT = ['whoosh', 'impact', 'pop', 'click', 'tick', 'riser', 'ding'];
const preds = {};

for (const { boardKey, plan } of plans(sb)) {
  const tag = boardKey.replace('v9-', '');
  // 1
  const d1 = M.design(plan, tokens, 7), d2 = M.design(plan, tokens, 7);
  const L = leaves(d1);
  const gains = [d1.masterGain, d1.busGains.music, d1.busGains.sfx, d1.breatherFloorGain]
    .concat(NAMES.map((n) => d1.perCueGain[n]), KIT.map((k) => d1.perCueGain.kit[k]));
  ck('1.deterministic/' + tag, deq(d1, d2) && deq(M.design(clone(plan), null, 7), d1));
  ck('1.finite/' + tag, L.every(([, v]) => Number.isFinite(v)), L.filter(([, v]) => !Number.isFinite(v)).map(([p]) => p).join(','));
  ck('1.gains>0+names/' + tag, gains.every((g) => Number.isFinite(g) && g > 0) && NAMES.every((n) => n in d1.perCueGain) && KIT.every((k) => k in d1.perCueGain.kit));
  // 2
  const p = M.predict(d1, plan); preds[tag] = p;
  ck('2.lufs/' + tag, Math.abs(p.lufsProxy - M.TARGETS.lufs) <= 1.5, p.lufsProxy.toFixed(2));
  ck('2.truePeak/' + tag, p.truePeakProxy <= -1.5, p.truePeakProxy.toFixed(2));
  ck('2.overBed/' + tag, p.perCue.length === plan.sfx.length && p.perCue.every((c) => c.overBedDb >= 6), p.sfxOverBedMinDb.toFixed(2));
  ck('2.breather/' + tag, p.breatherFloorDb >= -30, p.breatherFloorDb.toFixed(2));
  ck('2.seam/' + tag, p.seamDb >= -20, p.seamDb.toFixed(2));
  // 3
  const lim = d1.limiter;
  ck('3.limiter/' + tag, lim.threshold <= -3 && lim.knee <= 1 && lim.ratio >= 12 && lim.release > 0 && lim.release <= 0.25);
  const pl = clone(plan), times = pl.sfx.map((s) => s.t);
  const { ctx, nodes } = mockCtx([]);
  M.apply(ctx, nodes, d1, pl);
  ck('3.gains(0,1]/' + tag, pl.sfx.every((s) => Number.isFinite(s.gain) && s.gain > 0 && s.gain <= 1));
  const ts = pl.sfx.map((s) => s.t).sort((a, b) => a - b);
  ck('3.spacing+times/' + tag, deq(pl.sfx.map((s) => s.t), times) && ts.every((t, i) => i === 0 || (t - ts[i - 1]) * 1000 >= 120 - 1e-6));
  // 4
  ck('4.duck/' + tag, duckHolds(M, sb, plan));
  // 5
  const log = [], mk = mockCtx(log), pl5 = clone(plan);
  const kitSeen = []; sb.SFX_KIT.play = function (c, dst, name, at, k) { kitSeen.push(k); return null; };
  const a1 = M.apply(mk.ctx, mk.nodes, d1, pl5), a2 = M.apply(mk.ctx, mk.nodes, d1, pl5);
  const lm = mk.nodes.limiter;
  ck('5.oneLimiter/' + tag, mk.ctx.comps === 1 && a1.applied && a1.limiterInserted && a2.applied && !a2.limiterInserted);
  ck('5.graph/' + tag, lm && mk.nodes.comp.outs.length === 1 && mk.nodes.comp.outs[0] === lm && lm.outs.length === 1 && lm.outs[0] === mk.nodes.master
    && lm.threshold.value === d1.limiter.threshold && lm.attack.value === 0 && mk.nodes.pad.gain.value === M.BASE.pad * d1.breatherFloorGain
    && mk.nodes.music.gain.value === d1.busGains.music && mk.nodes.sfx.gain.value === d1.busGains.sfx && mk.nodes.master.gain.value === d1.masterGain);
  ck('5.null/' + tag, M.apply(null, mk.nodes, d1, pl5).applied === false && M.apply(mk.ctx, null, d1, pl5).applied === false);
  const evs = pl5.events.filter((e) => e.type === 'sfx');
  ck('5.eventsEqSfx/' + tag, evs.length > 0 && evs.every((e) => { const s = pl5.sfx.find((x) => x.t === e.t && String(x.name).toUpperCase() === String(e.name).toUpperCase()); return s && s.gain === e.gain; }));
  sb.SFX_KIT.play('CLICK', null, 'CLICK', 0, 0.5);
  sb.SFX_KIT.play(null, null, 'CLICK', 0, 0.5);
  ck('5.kitWrapOnce/' + tag, sb.SFX_KIT.play.__mix === true && Math.abs(kitSeen[kitSeen.length - 1] - 0.5 * d1.perCueGain.kit.click) < 1e-12);
}

// 6
const forbidden = /Math\.random|Date\.now|performance\.now|requestAnimationFrame|setValueAtTime|RampToValueAtTime|cancelScheduledValues/;
ck('6.forbidden', !forbidden.test(src));
const lit = cp.spawnSync(process.execPath, [R('skills/motion-soup/scripts/soup-runner.mjs'), 'check-literals', CAND, '--tokens', R('work/tokens.resolved.json')], { cwd: ROOT, encoding: 'utf8' });
ck('6.check-literals', lit.status === 0, 'exit ' + lit.status);
ck('6.size', Buffer.byteLength(src) <= 14 * 1024, Buffer.byteLength(src) + ' B');
ck('6.version', typeof M.VERSION === 'string' && M.VERSION.length > 0, M.VERSION);

// 7 (measured probe, only when PW_MODULE is set)
if (process.env.PW_MODULE) {
  const probe = R('work/music3/probe-B.mjs');
  let a = fs.readFileSync(R('work/eval-v9/audio-probe/audio.mjs'), 'utf8').split('\n');
  const iSel = a.findIndex((l) => l.includes('#sb-story-select'));
  a.splice(iSel + 1, 0, "await page.addScriptTag({ path: 'work/music3/cand-B.js' });");
  // gap: audio.mjs reloads the page between renders, so the tag is re-added at the top of render() as well
  a = a.join('\n').replace('async function render(mode) {', "async function render(mode) {\n  if (!(await page.evaluate(() => !!window.MIX_B))) await page.addScriptTag({ path: 'work/music3/cand-B.js' });").replace('const info = MUSIC.schedule(ctx, plan, 0);', 'const info = MUSIC.schedule(ctx, plan, 0); MIX_B.apply(ctx, MUSIC.mix, MIX_B.design(plan, null, 7), plan);');
  fs.writeFileSync(probe, a);
  const env = Object.assign({}, process.env, { PROBE_OUT: 'work/music3', TAG: 'cand-B', STUDIO_URL: process.env.STUDIO_URL || require('url').pathToFileURL(R('index.html')).href });
  const r1 = cp.spawnSync(process.execPath, [probe], { cwd: ROOT, env, encoding: 'utf8', timeout: 600000 });
  const r2 = r1.status === 0 ? cp.spawnSync('python3', ['-I', R('work/eval-v9/audio-probe/analyze.py'), 'work/music3', 'cand-B'], { cwd: ROOT, encoding: 'utf8' }) : r1;
  ck('7.probe-ran', r1.status === 0 && r2.status === 0, (r1.stderr || '').slice(-300) + (r2.stderr || '').slice(-300));
  const rp = R('work/music3/cand-B-audio-report.json');
  if (fs.existsSync(rp) && r2.status === 0) {
    const v = JSON.parse(fs.readFileSync(rp, 'utf8')).v92, p = preds['mcp-server'];
    console.log('measured', JSON.stringify({ lufs: v.lufs_i_proxy, tp: v.true_peak_dBTP_proxy, overBedMin: v.sfx_over_bed_min_dB, breather: v.breather_floor_dBFS, seam: v.seam_min_dBFS, gap: v.sfx_min_gap_ms, holes: v.holes_inside.length }));
    ck('7.thresholds', Math.abs(v.lufs_i_proxy + 16) <= 1.5 && v.true_peak_dBTP_proxy < -1.5 && v.sfx_over_bed.every((o) => o.over_bed_dB >= 6)
      && v.sfx_pairs_under_120ms === 0 && v.sfx_min_gap_ms >= 120 && v.holes_inside.length === 0 && v.seam_min_dBFS >= -20 && v.breather_floor_dBFS >= -30);
    const near = (x, y) => Math.abs(x - y) <= 1.5;
    ck('7.predict~measured', near(p.lufsProxy, v.lufs_i_proxy) && near(p.truePeakProxy, v.true_peak_dBTP_proxy) && near(p.sfxOverBedMinDb, v.sfx_over_bed_min_dB)
      && near(p.breatherFloorDb, v.breather_floor_dBFS) && near(p.seamDb, v.seam_min_dBFS));
  }
} else console.log('SKIP probe');

// 8 negative mutation on a copy: the duck predicate must catch it
let caught = false;
const mut = src.replace('depthDb: -6,', 'depthDb: -5,');
if (mut !== src) { const sb2 = sandbox(); const M2 = loadMix(sb2, mut); caught = !duckHolds(M2, sb2, plans(sb2)[0].plan); }
ck('8.mutation-caught', caught);

for (const [id, ok, msg] of results) console.log((ok ? 'PASS ' : 'FAIL ') + id + (msg ? '  ' + msg : ''));
const p = preds['mcp-server'];
if (p) console.log('predict(mcp)', JSON.stringify({ lufs: +p.lufsProxy.toFixed(2), tp: +p.truePeakProxy.toFixed(2), overBedMin: +p.sfxOverBedMinDb.toFixed(2), breather: +p.breatherFloorDb.toFixed(2), seam: +p.seamDb.toFixed(2) }));
const bad = results.filter((r) => !r[1]).length;
console.log(bad ? `FAIL ${bad} predicate(s)` : `PASS all ${results.length} predicates`);
process.exit(bad ? 1 : 0);
