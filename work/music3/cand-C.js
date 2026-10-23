/* MIX_C (round 3, lane music, candidate C): "A robot finds one adapter that opens every drawer."
 * Lens: per-cue sculpting. Each perCueGain (and kit.*) is solved from BASE.cues[].over_bed_dB so the worst
 * measured instance of every cue lands at overBedMin + margin over the ducked bed; master and the sfx bus stay
 * at their measured anchors, the music bus carries only the loudness gap. Pure except apply(); static values only.
 */
(function (root) {
  'use strict';
  var VERSION = 'mix3-C';
  // Measured anchors (v9.2 audio report + engine L134/L348-354) and the lane's design law: exempt from the literal scan.
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
    law: { margin: 0.5, breatherMargin: 1, overshoot: 1.5, tpGuard: 0.5, knee: 0, ratio: 20, release: 0.1, gainCap: 1 }
  };
  var TARGETS = { lufs: -16, lufsTol: 1.5, tpMax: -1.5, overBedMin: 6, breatherMin: -30, seamMin: -20, holeMs: 100 };
  var NAMES = ['CLICK', 'BOOP', 'WHOOSH', 'THUD', 'BOING', 'CHORD', 'TICK', 'RISER'];
  var KIT_KEYS = ['whoosh', 'impact', 'pop', 'click', 'tick', 'riser', 'ding'];

  function dB(x) { return 20 * Math.log10(x); }
  function amp(d) { return Math.pow(10, d / 20); }
  function fin(x) { return typeof x === 'number' && isFinite(x); }
  function kitMap() { var K = root.SFX_KIT; return (K && K.MAP) || BASE.kitMap; }
  function copy(o) { var r = {}; Object.keys(o).forEach(function (k) { r[k] = o[k]; }); return r; }

  // worst measured over-bed per cue name; an unmeasured name inherits the worst cue of the whole board
  function worstOf(name) {
    var all = Infinity, own = Infinity;
    BASE.cues.forEach(function (c) { all = Math.min(all, c.over_bed_dB); if (c.name === name) own = Math.min(own, c.over_bed_dB); });
    return fin(own) ? own : all;
  }
  // measured over-bed for one plan cue: same name, nearest time; unmeasured name -> worst cue of the board
  function baseOver(name, t) {
    var best = null, dist = Infinity;
    BASE.cues.forEach(function (c) { var d = Math.abs(c.t - (fin(t) ? t : c.t)); if (c.name === name && d < dist) { dist = d; best = c; } });
    return best ? best.over_bed_dB : worstOf(name);
  }

  function design(plan, tokens, seed) {
    var L = BASE.law;
    // 1. bed: the least lift that lands loudness inside the window (every bed dB is an over-bed dB lost under the
    //    limiter ceiling), carried by the sustained pad (breatherFloorGain) first; the music bus only takes a remainder
    var bedElse = TARGETS.lufs - TARGETS.lufsTol + L.margin - BASE.lufs;
    var needBr = TARGETS.breatherMin + L.breatherMargin - BASE.breather;
    var p = Math.max(bedElse / BASE.padShare, needBr);
    var u = bedElse - BASE.padShare * p;
    var masterGain = BASE.master, sfxBus = BASE.sfx;
    // 2. per cue: lift = target over-bed - worst measured + bed lift; fill the plan gain to its cap, rest to the kit key
    var need = {}, pcgDb = {}, kitDb = {};
    KIT_KEYS.forEach(function (k) { kitDb[k] = 0; });
    NAMES.forEach(function (n) {
      need[n] = TARGETS.overBedMin + L.margin + bedElse - worstOf(n) - dB(masterGain / BASE.master) - dB(sfxBus / BASE.sfx);
      var key = BASE.kitMap[n];
      if (BASE.kitOnly.indexOf(n) >= 0) { pcgDb[n] = 0; kitDb[key] = Math.max(kitDb[key], need[n]); return; }
      var cap = dB(L.gainCap / BASE.sfxGain[n]);
      kitDb[key] = Math.max(kitDb[key], need[n] - Math.min(need[n], cap));
    });
    // 3. shared kit keys (pop: BOOP + BOING): the plan gain absorbs the difference so each cue lands exactly on target
    NAMES.forEach(function (n) { if (BASE.kitOnly.indexOf(n) < 0) pcgDb[n] = need[n] - kitDb[BASE.kitMap[n]]; });
    var perCueGain = {}, kit = {};
    NAMES.forEach(function (n) { perCueGain[n] = Math.min(L.gainCap, BASE.sfxGain[n] * amp(pcgDb[n])); });
    KIT_KEYS.forEach(function (k) { kit[k] = amp(kitDb[k]); });
    perCueGain.kit = kit;
    return {
      masterGain: masterGain,
      limiter: { threshold: TARGETS.tpMax - L.overshoot - L.tpGuard, knee: L.knee, ratio: L.ratio, release: L.release },
      busGains: { music: BASE.music * amp(u), sfx: sfxBus },
      perCueGain: perCueGain,
      breatherFloorGain: amp(p),
      duck: copy(BASE.duck)
    };
  }

  function predict(d, plan) {
    var m = dB(d.masterGain / BASE.master), u = dB(d.busGains.music / BASE.music), s = dB(d.busGains.sfx / BASE.sfx), p = dB(d.breatherFloorGain);
    var bedElse = m + u + p * BASE.padShare, bedBr = m + u + p;
    var map = kitMap(), pcg = d.perCueGain || {}, kit = pcg.kit || {};
    function fx(n) {
      var g = fin(pcg[n]) ? pcg[n] : BASE.sfxGain[n], km = fin(kit[map[n]]) ? kit[map[n]] : 1;
      return m + s + dB(g / BASE.sfxGain[n]) + dB(km);
    }
    var maxFx = -Infinity;
    NAMES.forEach(function (n) { maxFx = Math.max(maxFx, fx(n)); });
    var src = plan && plan.sfx && plan.sfx.length ? plan.sfx : BASE.cues;
    var perCue = src.filter(function (c) { return BASE.sfxGain[String(c.name).toUpperCase()] != null; }).map(function (c) {
      var n = String(c.name).toUpperCase();
      return { name: n, t: c.t, overBedDb: baseOver(n, c.t) + fx(n) - bedElse };
    });
    var minOver = Infinity;
    perCue.forEach(function (c) { minOver = Math.min(minOver, c.overBedDb); });
    return {
      lufsProxy: BASE.lufs + bedElse,
      truePeakProxy: Math.min(BASE.tp + Math.max(bedElse, maxFx), d.limiter.threshold + BASE.law.overshoot),
      sfxOverBedMinDb: minOver,
      perCue: perCue,
      breatherFloorDb: BASE.breather + bedBr,
      seamDb: BASE.seam + bedElse
    };
  }

  var current = null;
  function setVal(node, field, v) { if (node && node[field] && fin(v)) node[field].value = v; }
  function cueGain(d, name, own) {
    var g = d.perCueGain[String(name).toUpperCase()];
    g = fin(g) && g > 0 ? g : own;
    return fin(g) && g > 0 ? Math.min(BASE.law.gainCap, g) : own;
  }
  function wrapKit() {
    var K = root.SFX_KIT;
    if (!K || typeof K.play !== 'function' || K.play.__mix) return;
    var orig = K.play;
    var w = function (c, bus, cue, at, gain) {
      var kit = current && current.perCueGain && current.perCueGain.kit, key = (K.MAP || BASE.kitMap)[String(cue).toUpperCase()];
      var mul = kit && fin(kit[key]) ? kit[key] : 1;
      return orig.call(K, c, bus, cue, at, gain * mul);
    };
    w.__mix = true;
    K.play = w;
  }

  function apply(ctx, nodes, d, plan) {
    if (!ctx || !nodes || !d) return { applied: false, limiterInserted: false };
    try {
      var L = BASE.law;
      setVal(nodes.master, 'gain', d.masterGain);
      setVal(nodes.music, 'gain', d.busGains.music);
      setVal(nodes.sfx, 'gain', d.busGains.sfx);
      setVal(nodes.pad, 'gain', BASE.pad * d.breatherFloorGain);
      // one limiter between comp and master; re-insert only when the engine rebuilt its graph (new ctx or comp)
      var stale = nodes.limiter && (nodes.__mixCtx !== ctx || nodes.__mixComp !== nodes.comp);
      if ((!nodes.limiter || stale) && nodes.comp && nodes.master && ctx.createDynamicsCompressor) {
        var lim = ctx.createDynamicsCompressor();
        nodes.comp.disconnect();
        nodes.comp.connect(lim);
        lim.connect(nodes.master);
        nodes.limiter = lim; nodes.__mixCtx = ctx; nodes.__mixComp = nodes.comp;
      }
      var lm = nodes.limiter;
      setVal(lm, 'threshold', d.limiter.threshold); setVal(lm, 'knee', d.limiter.knee); setVal(lm, 'ratio', d.limiter.ratio);
      setVal(lm, 'attack', 0); setVal(lm, 'release', d.limiter.release);
      if (plan) {
        (plan.sfx || []).forEach(function (x) { x.gain = cueGain(d, x.name, x.gain); });
        (plan.events || []).forEach(function (e) { if (e.type === 'sfx') e.gain = cueGain(d, e.name, e.gain); });
      }
      current = d;
      wrapKit();
      return { applied: true, limiterInserted: !!nodes.limiter };
    } catch (_e) {
      return { applied: false, limiterInserted: false };
    }
  }

  var API = { VERSION: VERSION, BASE: BASE, TARGETS: TARGETS, design: design, apply: apply, predict: predict };
  root.MIX_C = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
