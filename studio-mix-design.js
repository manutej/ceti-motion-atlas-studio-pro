/* MIX (round 3 soup, lane music): "A robot finds one adapter that opens every drawer."
 * Union by measured value: A's limiter law + master makeup-cancel (TP), C's per-cue solved gains, C's -3.5 threshold and
 * least pad lift (over-bed, lufs), B/contract breather-by-pad. predict() models the limiter's makeup gain and the SFX-only
 * limiter cap (E1 intersection 2), calibrated on the three measured probes. Pure except apply(); static values only.
 */
(function (root) {
  'use strict';
  var VERSION = 'mix-soup/3.0.0';
  // Measured anchors (v9.2 report + engine L134/L348-354; cal = fit on cand-A/B/C probe reports, MCP board) and the
  // merged design law: exempt from the literal scan.
  var BASE = {
    master: 0.9, music: 0.72, sfx: 0.8, pad: 3, padShare: 0.5,
    sfxGain: { WHOOSH: 0.45, THUD: 0.5, CLICK: 0.4, BOOP: 0.45, BOING: 0.45, CHORD: 0.6, TICK: 0.4, RISER: 0.5 },
    lufs: -18.45, tp: -2.08, breather: -31.3, seam: -16.8,
    cues: [
      { t: 0.865, name: 'CLICK', over_bed_dB: -3.1 }, { t: 2.308, name: 'BOOP', over_bed_dB: 4.2 },
      { t: 3.75, name: 'WHOOSH', over_bed_dB: 0.0 }, { t: 4.1, name: 'CLICK', over_bed_dB: 0.2 },
      { t: 5.913, name: 'THUD', over_bed_dB: 4.8 }, { t: 10.529, name: 'BOING', over_bed_dB: 2.4 },
      { t: 13.2, name: 'CLICK', over_bed_dB: 2.4 }
    ],
    kitMap: { WHOOSH: 'whoosh', THUD: 'impact', CLICK: 'click', BOOP: 'pop', BOING: 'pop', CHORD: 'ding', TICK: 'tick', RISER: 'riser' },
    kitOnly: ['TICK', 'RISER'],
    duck: { depthDb: -6, attackMs: 10, holdMs: 250, releaseMs: 150 },
    law: { threshold: -3.5, knee: 0, ratio: 20, release: 0.1, attack: 0, overshoot: 1.5, tpGuard: 0.05,
      margin: 0.5, lufsMargin: 0.4, breatherMargin: 1, gainCap: 1 },
    cal: { makeupExp: 0.6, lufsBias: -0.38, seamBias: -0.4, padLoud: 0.196, padPeak: 0.318, musicLoud: 0.534, musicPeak: 0.77,
      cap: [
        { t: 0.865, name: 'CLICK', sfx: 0.22, bed: -8.82 }, { t: 2.308, name: 'BOOP', sfx: 0.12, bed: -10.22 },
        { t: 3.75, name: 'WHOOSH', sfx: -1.18, bed: -9.82 }, { t: 4.1, name: 'CLICK', sfx: 0.32, bed: -10.32 },
        { t: 5.913, name: 'THUD', sfx: 0.32, bed: -9.62 }, { t: 10.529, name: 'BOING', sfx: 0.22, bed: -8.82 },
        { t: 13.2, name: 'CLICK', sfx: 0.42, bed: -11.52 }
      ] }
  };
  var TARGETS = { lufs: -16, lufsTol: 1.5, tpMax: -1.5, overBedMin: 6, breatherMin: -30, seamMin: -20, holeMs: 100 };
  var MS = 1000;
  var NAMES = ['CLICK', 'BOOP', 'WHOOSH', 'THUD', 'BOING', 'CHORD', 'TICK', 'RISER'];
  var KIT_KEYS = ['whoosh', 'impact', 'pop', 'click', 'tick', 'riser', 'ding'];

  function dB(x) { return 20 * Math.log10(x); }
  function amp(d) { return Math.pow(10, d / 20); }
  function fin(x) { return typeof x === 'number' && isFinite(x); }
  function up(n) { return String(n == null ? '' : n).toUpperCase(); }
  function kitMap() { var K = root.SFX_KIT; return (K && K.MAP) || BASE.kitMap; }
  function copy(o) { var r = {}; Object.keys(o).forEach(function (k) { r[k] = o[k]; }); return r; }
  // WebAudio compressor automatic makeup gain (spec: (1/fullRangeGain)^0.6), knee ignored
  function makeup(lim) { return BASE.cal.makeupExp * -lim.threshold * (1 - 1 / lim.ratio); }

  function worstOf(name) {
    var all = Infinity, own = Infinity;
    BASE.cues.forEach(function (c) { all = Math.min(all, c.over_bed_dB); if (c.name === name) own = Math.min(own, c.over_bed_dB); });
    return fin(own) ? own : all;
  }
  // contract-law anchor: same name within holeMs, else the worst measured instance (uncovered cues inherit the worst)
  function lawOver(name, t) {
    var hit = null;
    BASE.cues.forEach(function (c) { if (hit === null && c.name === name && fin(t) && Math.abs(c.t - t) * MS <= TARGETS.holeMs) hit = c.over_bed_dB; });
    return hit === null ? worstOf(name) : hit;
  }
  // limiter-cap anchor: same name within holeMs, else the worst measured cue of the board (E1 intersection 4)
  function capAnchor(name, t) {
    var hit = null, worst = null;
    BASE.cal.cap.forEach(function (c) {
      if (!worst || c.sfx - c.bed < worst.sfx - worst.bed) worst = c;
      if (hit === null && c.name === name && fin(t) && Math.abs(c.t - t) * MS <= TARGETS.holeMs) hit = c;
    });
    return hit || worst;
  }

  function design(plan, tokens, seed) {
    var L = BASE.law, C = BASE.cal;
    var lim = { threshold: L.threshold, knee: L.knee, ratio: L.ratio, release: L.release };
    var K = makeup(lim);
    // A: makeup-cancel. Master trims the limiter's makeup so ceiling + overshoot sits tpGuard under tpMax.
    var Mabs = TARGETS.tpMax - L.tpGuard - L.overshoot - L.threshold - K;
    var masterGain = amp(Mabs), m = Mabs - dB(BASE.master), sfxBus = BASE.sfx;
    // C: least pad lift that lands the calibrated lufsProxy lufsMargin inside the lower edge.
    // Contract: breather by breatherFloorGain first. B's music-down/pad-up swap is not taken (costs over-bed, measured).
    var aim = TARGETS.lufs - TARGETS.lufsTol + L.lufsMargin;
    var pL = (aim - BASE.lufs - C.lufsBias - K - m) / C.padLoud;
    var pB = TARGETS.breatherMin + L.breatherMargin - BASE.breather - K - m;
    var p = Math.max(pL, pB);
    // C: per cue, worst measured instance lands at overBedMin + margin under the contract law; plan gain to cap, rest to kit
    var bedLaw = m + p * BASE.padShare, need = {}, pcgDb = {}, kitDb = {};
    KIT_KEYS.forEach(function (k) { kitDb[k] = 0; });
    NAMES.forEach(function (n) {
      need[n] = TARGETS.overBedMin + L.margin + bedLaw - worstOf(n) - m - dB(sfxBus / BASE.sfx);
      var key = BASE.kitMap[n];
      if (BASE.kitOnly.indexOf(n) >= 0) { pcgDb[n] = 0; kitDb[key] = Math.max(kitDb[key], need[n]); return; }
      var cap = dB(L.gainCap / BASE.sfxGain[n]);
      kitDb[key] = Math.max(kitDb[key], need[n] - Math.min(need[n], cap));
    });
    NAMES.forEach(function (n) { if (BASE.kitOnly.indexOf(n) < 0) pcgDb[n] = need[n] - kitDb[BASE.kitMap[n]]; });
    var perCueGain = {}, kit = {};
    NAMES.forEach(function (n) { perCueGain[n] = Math.min(L.gainCap, BASE.sfxGain[n] * amp(pcgDb[n])); });
    KIT_KEYS.forEach(function (k) { kit[k] = amp(kitDb[k]); });
    perCueGain.kit = kit;
    return {
      masterGain: masterGain,
      limiter: lim,
      busGains: { music: BASE.music, sfx: sfxBus },
      perCueGain: perCueGain,
      breatherFloorGain: amp(p),
      duck: copy(BASE.duck)
    };
  }

  // Upgraded prediction law: the contract law, plus (a) limiter makeup K on every bed term, (b) SFX peaks capped at the
  // limiter output ceiling (threshold + K + master), (c) loudness/peak shares of pad and music calibrated on the probes.
  function predict(d, plan) {
    var C = BASE.cal, lim = d.limiter, K = makeup(lim);
    var m = dB(d.masterGain / BASE.master), u = dB(d.busGains.music / BASE.music), s = dB(d.busGains.sfx / BASE.sfx), p = dB(d.breatherFloorGain);
    var bedLaw = m + u + p * BASE.padShare;
    var loud = K + m + C.musicLoud * u + C.padLoud * p;
    var ceil = lim.threshold + K + dB(d.masterGain);
    var bedPk = K + m + C.musicPeak * u + C.padPeak * p;
    var map = kitMap(), pcg = d.perCueGain || {}, kit = pcg.kit || {};
    function fx(n) {
      var g = fin(pcg[n]) ? pcg[n] : BASE.sfxGain[n], km = fin(kit[map[n]]) ? kit[map[n]] : 1;
      return m + s + dB(g / BASE.sfxGain[n]) + dB(km);
    }
    var maxFx = -Infinity;
    NAMES.forEach(function (n) { maxFx = Math.max(maxFx, fx(n)); });
    var src = plan && plan.sfx && plan.sfx.length ? plan.sfx : BASE.cues;
    var perCue = src.filter(function (c) { return BASE.sfxGain[up(c.name)] != null; }).map(function (c) {
      var n = up(c.name), a = capAnchor(n, c.t);
      var law = lawOver(n, c.t) + fx(n) - bedLaw, capped = ceil + a.sfx - (a.bed + bedPk);
      return { name: n, t: c.t, overBedDb: Math.min(law, capped) };
    });
    var minOver = Infinity;
    perCue.forEach(function (c) { minOver = Math.min(minOver, c.overBedDb); });
    return {
      lufsProxy: BASE.lufs + C.lufsBias + loud,
      truePeakProxy: Math.min(BASE.tp + K + Math.max(bedLaw, maxFx), ceil + BASE.law.overshoot),
      sfxOverBedMinDb: minOver,
      perCue: perCue,
      breatherFloorDb: BASE.breather + K + m + u + p,
      seamDb: BASE.seam + C.seamBias + loud
    };
  }

  // the only impure code: static values on MUSIC.mix, ONE limiter comp -> limiter -> master, plan gains, kit wrap
  var live = null;
  function setVal(node, field, v) { if (node && node[field] && fin(v)) node[field].value = v; }
  function cueGain(d, name, own) {
    var g = d.perCueGain[up(name)];
    g = fin(g) && g > 0 ? g : own;
    return fin(g) && g > 0 ? Math.min(BASE.law.gainCap, g) : own;
  }
  function wrapKit() {
    var K = root.SFX_KIT;
    if (!K || typeof K.play !== 'function' || K.play.__mix) return;
    var orig = K.play;
    var w = function (c, bus, cue, at, gain) {
      var kit = live && live.perCueGain && live.perCueGain.kit, key = (K.MAP || BASE.kitMap)[up(cue)];
      var mul = kit && fin(kit[key]) && kit[key] > 0 ? kit[key] : 1;
      return orig.call(K, c, bus, cue, at, gain * mul);
    };
    w.__mix = true;
    K.play = w;
  }

  function apply(ctx, nodes, d, plan) {
    if (!ctx || !nodes || !d) return { applied: false, limiterInserted: false };
    try {
      setVal(nodes.master, 'gain', d.masterGain);
      setVal(nodes.music, 'gain', d.busGains.music);
      setVal(nodes.sfx, 'gain', d.busGains.sfx);
      setVal(nodes.pad, 'gain', BASE.pad * d.breatherFloorGain);
      // one limiter; re-insert only when the engine rebuilt its graph (new ctx or comp); a 2nd call reconfigures
      var inserted = false;
      var stale = nodes.limiter && (nodes.__mixCtx !== ctx || nodes.__mixComp !== nodes.comp);
      if ((!nodes.limiter || stale) && nodes.comp && nodes.master && ctx.createDynamicsCompressor) {
        var lim = ctx.createDynamicsCompressor();
        nodes.comp.disconnect();
        nodes.comp.connect(lim);
        lim.connect(nodes.master);
        nodes.limiter = lim; nodes.__mixCtx = ctx; nodes.__mixComp = nodes.comp; inserted = true;
      }
      var lm = nodes.limiter;
      setVal(lm, 'threshold', d.limiter.threshold); setVal(lm, 'knee', d.limiter.knee); setVal(lm, 'ratio', d.limiter.ratio);
      setVal(lm, 'attack', BASE.law.attack); setVal(lm, 'release', d.limiter.release);
      if (plan) {
        (plan.sfx || []).forEach(function (x) { x.gain = cueGain(d, x.name, x.gain); });
        (plan.events || []).forEach(function (e) { if (e && e.type === 'sfx') e.gain = cueGain(d, e.name, e.gain); });
      }
      live = d;
      wrapKit();
      return { applied: true, limiterInserted: inserted };
    } catch (_e) {
      return { applied: false, limiterInserted: false };
    }
  }

  var API = { VERSION: VERSION, BASE: BASE, TARGETS: TARGETS, design: design, apply: apply, predict: predict };
  root.MIX = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
