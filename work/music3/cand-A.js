// MIX_A — round 3 lane `music`, candidate A. Film line: "A robot finds one adapter that opens every drawer" (MCP board).
// Lens: headroom lives in the limiter. Buses stay at BASE; loudness comes from masterGain (+ the pad's breather floor);
// one hard limiter (attack 0, knee 0, ratio 20) is the only peak control; per-cue gains lift only cues measured under +6 dB.
// Pure except apply(). Deterministic: no clocks, no randomness, no scheduled automation.
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MIX_A = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function (root) {
  'use strict';
  var VERSION = 'mix-A/3.0.0';
  /*EXEMPT-BEGIN measured anchors (v9.2 audio report + engine L134/L348-354) and contract targets */
  var BASE = Object.freeze({
    master: 0.9, music: 0.72, sfx: 0.8, pad: 3, padShare: 0.5,
    sfxGain: Object.freeze({ WHOOSH: 0.45, THUD: 0.5, CLICK: 0.4, BOOP: 0.45, BOING: 0.45, CHORD: 0.6, TICK: 0.4, RISER: 0.5 }),
    lufs: -18.45, tp: -2.08, breather: -31.3, seam: -16.8,
    lim: Object.freeze({ overshoot: 1.5, makeupExp: 0.6, ratio: 20, knee: 0, release: 0.1, attack: 0 }),
    cues: Object.freeze([
      { t: 0.865, name: 'CLICK', over_bed_dB: -3.1 }, { t: 2.308, name: 'BOOP', over_bed_dB: 4.2 },
      { t: 3.75, name: 'WHOOSH', over_bed_dB: 0.0 }, { t: 4.1, name: 'CLICK', over_bed_dB: 0.2 },
      { t: 5.913, name: 'THUD', over_bed_dB: 4.8 }, { t: 10.529, name: 'BOING', over_bed_dB: 2.4 },
      { t: 13.2, name: 'CLICK', over_bed_dB: 2.4 }
    ])
  });
  var TARGETS = Object.freeze({ lufs: -16, lufsTol: 1.5, tpMax: -1.5, overBedMin: 6, breatherMin: -30, seamMin: -20, holeMs: 100 });
  var DUCK = Object.freeze({ depthDb: -6, attackMs: 10, holdMs: 250, releaseMs: 150 });   // frozen: the engine's duck law
  /*EXEMPT-END*/
  var MS = 1000;                                  // unit constant: ms per s
  var NAMES = ['CLICK', 'BOOP', 'WHOOSH', 'THUD', 'BOING', 'CHORD', 'TICK', 'RISER'];
  var KIT_ONLY = { TICK: true, RISER: true };     // synth returns null: their gain lives in perCueGain.kit only
  var KIT_KEYS = ['whoosh', 'impact', 'pop', 'click', 'tick', 'riser', 'ding'];
  var MAP_FALLBACK = { WHOOSH: 'whoosh', THUD: 'impact', CLICK: 'click', BOOP: 'pop', BOING: 'pop', CHORD: 'ding', TICK: 'tick', RISER: 'riser' };

  function dB(x) { return 20 * Math.log10(x); }
  function lin(d) { return Math.pow(10, d / 20); }
  function fin(x) { return typeof x === 'number' && isFinite(x); }
  function kitMap() { var K = root && root.SFX_KIT; return (K && K.MAP) || MAP_FALLBACK; }
  function up(n) { return String(n == null ? '' : n).toUpperCase(); }

  // worst measured over-bed for a name; unmeasured names inherit the worst cue of the board (conservative)
  function worstAll() { return BASE.cues.reduce(function (m, c) { return Math.min(m, c.over_bed_dB); }, Infinity); }
  function worstFor(name) {
    var w = Infinity;
    BASE.cues.forEach(function (c) { if (c.name === name) w = Math.min(w, c.over_bed_dB); });
    return fin(w) ? w : worstAll();
  }
  function baseFor(name, t) {
    var tol = TARGETS.holeMs / MS, hit = null;
    BASE.cues.forEach(function (c) { if (hit === null && c.name === name && fin(t) && Math.abs(c.t - t) <= tol) hit = c.over_bed_dB; });
    return hit === null ? worstFor(name) : hit;
  }

  // Headroom lives in the limiter. The limiter sits BEFORE master (comp -> limiter -> master) and a WebAudio compressor adds
  // automatic makeup gain K = makeupExp * |threshold| * (1 - 1/ratio) (spec: (1/fullRangeGain)^0.6). masterGain trims half of K:
  // the other half is the limiter's share of the loudness, and the output ceiling stays near threshold + K/2 (< tpMax, measured).
  // The rest of the bed lift is the pad (breatherFloorGain): sustained, low crest, so it lifts lufs and the breather, not the peaks.
  function threshold() { return TARGETS.tpMax - BASE.lim.overshoot; }
  function makeup() { var T = threshold(); return BASE.lim.makeupExp * -T * (1 - 1 / BASE.lim.ratio); }
  function levels() {
    var K = makeup(), E = TARGETS.lufs - BASE.lufs;                      // bed lift elsewhere (predict law)
    var M = -K / 2;                                                        // master trim (dB): half the limiter's makeup
    var B = TARGETS.breatherMin + TARGETS.lufsTol - BASE.breather;         // breather lift wanted (one tolerance of margin)
    var P = Math.max((E - M) / BASE.padShare, B - M);                       // pad lift (dB) = breather floor gain: the bed's loudness
    return { M: M, P: P };
  }

  function design(plan, tokens, seed) {
    var L = levels(), map = kitMap(), pcg = {}, kit = {};
    KIT_KEYS.forEach(function (k) { kit[k] = 1; });
    NAMES.forEach(function (n) {
      var w = worstFor(n), g0 = BASE.sfxGain[n];
      var need = TARGETS.overBedMin + TARGETS.lufsTol - w + L.P * BASE.padShare;   // lift so fx - bed >= min + tolerance
      if (w >= TARGETS.overBedMin || need <= 0) { pcg[n] = g0; return; }           // lens: only cues under +6 dB are lifted
      var g = KIT_ONLY[n] ? g0 : Math.min(1, g0 * lin(need));
      pcg[n] = g;
      var rest = need - dB(g / g0), k = map[n];
      if (k && rest > 0) kit[k] = Math.max(kit[k] || 1, lin(rest));
    });
    pcg.kit = kit;
    return {
      masterGain: BASE.master * lin(L.M),
      limiter: { threshold: threshold(), knee: BASE.lim.knee, ratio: BASE.lim.ratio, release: BASE.lim.release },
      busGains: { music: BASE.music, sfx: BASE.sfx },
      perCueGain: pcg,
      breatherFloorGain: lin(L.P),
      duck: { depthDb: DUCK.depthDb, attackMs: DUCK.attackMs, holdMs: DUCK.holdMs, releaseMs: DUCK.releaseMs }
    };
  }

  function bedDb(d, inBreather) {
    var share = inBreather ? 1 : BASE.padShare;
    return dB(d.masterGain / BASE.master) + dB(d.busGains.music / BASE.music) + dB(d.breatherFloorGain) * share;
  }
  function fxDb(d, name) {
    var n = up(name), g = d.perCueGain[n], g0 = BASE.sfxGain[n], k = d.perCueGain.kit[kitMap()[n]];
    var cue = fin(g) && fin(g0) ? dB(g / g0) : 0;
    return dB(d.masterGain / BASE.master) + dB(d.busGains.sfx / BASE.sfx) + cue + (fin(k) ? dB(k) : 0);
  }

  function predict(d, plan) {
    var bedE = bedDb(d, false), bedB = bedDb(d, true);
    var src = plan && Array.isArray(plan.sfx) && plan.sfx.length ? plan.sfx : BASE.cues;
    var perCue = src.map(function (s) {
      var n = up(s.name);
      return { name: n, t: s.t, overBedDb: baseFor(n, s.t) + fxDb(d, n) - bedE };
    });
    var maxFx = NAMES.reduce(function (m, n) { return Math.max(m, fxDb(d, n)); }, -Infinity);
    return {
      lufsProxy: BASE.lufs + bedE,
      truePeakProxy: Math.min(BASE.tp + Math.max(bedE, maxFx), d.limiter.threshold + BASE.lim.overshoot),
      sfxOverBedMinDb: perCue.reduce(function (m, c) { return Math.min(m, c.overBedDb); }, Infinity),
      perCue: perCue,
      breatherFloorDb: BASE.breather + bedB,
      seamDb: BASE.seam + bedE
    };
  }

  // the only impure code: static values on the engine's mix, one limiter comp -> limiter -> master, plan gains, kit wrap
  var live = null;
  function setV(p, v) { if (p && typeof p === 'object' && 'value' in p) p.value = v; }
  function apply(ctx, nodes, d, plan) {
    if (!ctx || !nodes || !d || !nodes.master || !nodes.comp) return { applied: false, limiterInserted: false };
    try {
      setV(nodes.master.gain, d.masterGain);
      if (nodes.music) setV(nodes.music.gain, d.busGains.music);
      if (nodes.sfx) setV(nodes.sfx.gain, d.busGains.sfx);
      if (nodes.pad) setV(nodes.pad.gain, BASE.pad * d.breatherFloorGain);
      var inserted = false;
      if (!nodes.limiter || nodes.__mixCtx !== ctx) {
        if (typeof ctx.createDynamicsCompressor !== 'function') return { applied: false, limiterInserted: false };
        var lim = ctx.createDynamicsCompressor();
        try { nodes.comp.disconnect(nodes.master); } catch (_e) { try { nodes.comp.disconnect(); } catch (_f) {} }
        nodes.comp.connect(lim); lim.connect(nodes.master);
        nodes.limiter = lim; nodes.__mixCtx = ctx; inserted = true;
      }
      var L = nodes.limiter;
      setV(L.threshold, d.limiter.threshold); setV(L.knee, d.limiter.knee); setV(L.ratio, d.limiter.ratio);
      setV(L.attack, BASE.lim.attack); setV(L.release, d.limiter.release);
      if (plan) {
        var gainOf = function (x) {
          var n = up(x.name), g = d.perCueGain[n];
          var v = fin(g) ? g : x.gain;
          return fin(v) && v > 0 ? Math.min(1, v) : x.gain;
        };
        (plan.sfx || []).forEach(function (x) { x.gain = gainOf(x); });
        (plan.events || []).forEach(function (e) { if (e && e.type === 'sfx') e.gain = gainOf(e); });
      }
      live = d;
      var K = root && root.SFX_KIT;
      if (K && typeof K.play === 'function' && !K.play.__mix) {
        var orig = K.play;
        var wrapped = function (c, bus, cue, at, gain) {
          var k = live && live.perCueGain.kit[(K.MAP || MAP_FALLBACK)[up(cue)]];
          return orig.call(this, c, bus, cue, at, gain * (fin(k) && k > 0 ? k : 1));
        };
        wrapped.__mix = true; K.play = wrapped;
      }
      return { applied: true, limiterInserted: inserted || !!nodes.limiter };
    } catch (_e) { return { applied: false, limiterInserted: !!(nodes && nodes.limiter) }; }
  }

  return { design: design, apply: apply, predict: predict, TARGETS: TARGETS, BASE: BASE, VERSION: VERSION };
});
