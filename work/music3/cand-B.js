// MIX_B — round-3 music lane, candidate B. Film line: "A robot finds one adapter that opens every drawer" (MCP board).
// Lens: bed-to-SFX ratio. The music bus goes down, the SFX bus goes up, the master stays nearly flat, the limiter is light
// (ratio 12, threshold -3). Loudness is recovered by the pad (breatherFloorGain x pad share), not by level: contrast between buses.
// Pure design + one impure apply(). Static gain values only; the duck stays the engine's.
(function (root) {
  'use strict';
  var VERSION = 'mix-B.3.0';

  // Measured anchors (v9.2 audio report + engine L134 / L348-354). Exempt from the literal scan.
  var BASE = {
    master: 0.9, music: 0.72, sfx: 0.8, pad: 3, padShare: 0.5,
    sfxGain: { WHOOSH: 0.45, THUD: 0.5, CLICK: 0.4, BOOP: 0.45, BOING: 0.45, CHORD: 0.6, TICK: 0.4, RISER: 0.5 },
    lufs: -18.45, tp: -2.08, breather: -31.3, seam: -16.8,
    cues: [
      { t: 0.865, name: 'CLICK', over_bed_dB: -3.1 }, { t: 2.308, name: 'BOOP', over_bed_dB: 4.2 },
      { t: 3.75, name: 'WHOOSH', over_bed_dB: 0.0 }, { t: 4.1, name: 'CLICK', over_bed_dB: 0.2 },
      { t: 5.913, name: 'THUD', over_bed_dB: 4.8 }, { t: 10.529, name: 'BOING', over_bed_dB: 2.4 },
      { t: 13.2, name: 'CLICK', over_bed_dB: 2.4 }
    ]
  };
  // Targets (INTEGRATION-PLAN-v9.2 step 3). Exempt from the literal scan.
  var TARGETS = { lufs: -16, lufsTol: 1.5, tpMax: -1.5, overBedMin: 6, breatherMin: -30, seamMin: -20, holeMs: 100 };

  // The lens: the only free knobs of candidate B (dB relative to BASE; limiter absolute). Everything else is solved.
  var LENS = {
    masterDb: -0.3,          // nearly flat
    musicDb: -2.2,           // bed bus down: cuts the bed peaks the SFX must clear
    sfxDb: 3.5,              // SFX bus up: the contrast lever
    marginDb: 1,             // solve every cue name to overBedMin + margin at its worst instance
    limiter: { threshold: -3, knee: 1, ratio: 12, release: 0.1 }
  };

  var NAMES = ['CLICK', 'BOOP', 'WHOOSH', 'THUD', 'BOING', 'CHORD', 'TICK', 'RISER'];
  var KIT_ONLY = { TICK: true, RISER: true };
  var KIT_KEYS = ['whoosh', 'impact', 'pop', 'click', 'tick', 'riser', 'ding'];
  var KIT_MAP = { WHOOSH: 'whoosh', THUD: 'impact', CLICK: 'click', BOOP: 'pop', BOING: 'pop', CHORD: 'ding', TICK: 'tick', RISER: 'riser' };

  function dB(x) { return 20 * Math.log10(x); }
  function lin(d) { return Math.pow(10, d / 20); }
  function fin(x) { return typeof x === 'number' && isFinite(x); }
  function up(n) { return String(n == null ? '' : n).toUpperCase(); }
  function kitMap() { var K = root && root.SFX_KIT; return (K && K.MAP) || KIT_MAP; }
  function sfxList(plan) { return (plan && Array.isArray(plan.sfx)) ? plan.sfx : []; }

  // Measured over-bed anchor for plan cue i: BASE.cues[i] when the name matches (the contract's index law),
  // else the worst measured instance of that name, else the worst measured cue overall (conservative).
  function baseOver(name, i) {
    var c = BASE.cues[i], worst = Infinity, all = Infinity;
    if (c && c.name === name) return c.over_bed_dB;
    BASE.cues.forEach(function (b) { all = Math.min(all, b.over_bed_dB); if (b.name === name) worst = Math.min(worst, b.over_bed_dB); });
    return fin(worst) ? worst : all;
  }

  function bedDb(d, inBreather) {
    var share = inBreather ? 1 : BASE.padShare;
    return dB(d.masterGain / BASE.master) + dB(d.busGains.music / BASE.music) + dB(d.breatherFloorGain) * share;
  }
  function fxDb(d, name) {
    var k = d.perCueGain.kit[kitMap()[name]], g = d.perCueGain[name], b = BASE.sfxGain[name];
    var cue = (fin(g) && fin(b)) ? dB(g / b) : 0;
    return dB(d.masterGain / BASE.master) + dB(d.busGains.sfx / BASE.sfx) + cue + (fin(k) ? dB(k) : 0);
  }

  // ---- design: pure, deterministic. seed has no stochastic role (no randomness anywhere). ----
  function design(plan, tokens, seed) {
    var masterGain = BASE.master * lin(LENS.masterDb);
    var music = BASE.music * lin(LENS.musicDb);
    var sfx = BASE.sfx * lin(LENS.sfxDb);
    var dm = dB(masterGain / BASE.master), dmu = dB(music / BASE.music), ds = dB(sfx / BASE.sfx);
    // Loudness recovered by the pad: bed(elsewhere) must lift BASE.lufs onto TARGETS.lufs.
    var bedE = TARGETS.lufs - BASE.lufs;
    var breatherFloorGain = lin((bedE - dm - dmu) / BASE.padShare);
    var bedElse = dm + dmu + dB(breatherFloorGain) * BASE.padShare;
    // Required fx per name: worst instance in this plan reaches overBedMin + margin.
    var need = {};
    sfxList(plan).forEach(function (s, i) {
      var n = up(s.name); if (!BASE.sfxGain[n]) return;
      var r = TARGETS.overBedMin + LENS.marginDb - baseOver(n, i) + bedElse;
      need[n] = fin(need[n]) ? Math.max(need[n], r) : r;
    });
    var per = {}, kit = {}, MAP = kitMap();
    KIT_KEYS.forEach(function (k) { kit[k] = 1; });
    NAMES.forEach(function (n) {
      var b = BASE.sfxGain[n];
      if (!fin(need[n])) { per[n] = b; return; }
      var rest = need[n] - dm - ds, g = KIT_ONLY[n] ? b : Math.min(1, Math.max(b, b * lin(rest)));
      per[n] = g;
      var rem = rest - dB(g / b), key = MAP[n];
      if (rem > 0 && key) kit[key] = Math.max(kit[key], lin(rem));
    });
    per.kit = kit;
    return {
      masterGain: masterGain,
      limiter: { threshold: LENS.limiter.threshold, knee: LENS.limiter.knee, ratio: LENS.limiter.ratio, release: LENS.limiter.release },
      busGains: { music: music, sfx: sfx },
      perCueGain: per,
      breatherFloorGain: breatherFloorGain,
      duck: { depthDb: -6, attackMs: 10, holdMs: 250, releaseMs: 150 }
    };
  }

  // ---- predict: the contract's prediction law, nothing else ----
  function predict(d, plan) {
    var bedE = bedDb(d, false), bedB = bedDb(d, true), maxFx = -Infinity;
    var perCue = sfxList(plan).map(function (s, i) {
      var n = up(s.name), fx = fxDb(d, n); maxFx = Math.max(maxFx, fx);
      return { name: n, t: s.t, overBedDb: baseOver(n, i) + fx - bedE };
    });
    var loud = Math.max(bedE, bedB, fin(maxFx) ? maxFx : bedE);
    return {
      lufsProxy: BASE.lufs + bedE,
      truePeakProxy: Math.min(BASE.tp + loud, d.limiter.threshold + overshoot()),
      sfxOverBedMinDb: perCue.reduce(function (m, c) { return Math.min(m, c.overBedDb); }, Infinity),
      perCue: perCue,
      breatherFloorDb: BASE.breather + bedB,
      seamDb: BASE.seam + bedE
    };
  }
  // WebAudio compressor without lookahead overshoots by about the LUFS tolerance (1.5 dB): the contract's TP ceiling.
  function overshoot() { return TARGETS.lufsTol; }

  // ---- apply: the only impure code ----
  function setV(p, v) { if (p && typeof p === 'object' && 'value' in p) p.value = v; }
  function resolveGain(d, name, own) {
    var g = d.perCueGain[up(name)];
    var v = fin(g) ? g : own;
    if (!(fin(v) && v > 0)) return own;
    return Math.min(1, v);
  }
  function wrapKit(d) {
    var K = root && root.SFX_KIT;
    if (!K || typeof K.play !== 'function') return;
    if (K.play.__mix) { K.play.__mixKit = d.perCueGain.kit; return; }
    var orig = K.play;
    var w = function (ctx, dest, name, at, k) {
      var key = (K.MAP || KIT_MAP)[up(name)], m = w.__mixKit && w.__mixKit[key];
      return orig.call(this, ctx, dest, name, at, fin(m) && fin(k) ? k * m : k);
    };
    w.__mix = true; w.__mixKit = d.perCueGain.kit; K.play = w;
  }
  function apply(ctx, nodes, d, plan) {
    if (!ctx || !nodes || !d) return { applied: false, limiterInserted: false };
    try {
      if (nodes.master) setV(nodes.master.gain, d.masterGain);
      if (nodes.music) setV(nodes.music.gain, d.busGains.music);
      if (nodes.sfx) setV(nodes.sfx.gain, d.busGains.sfx);
      if (nodes.pad) setV(nodes.pad.gain, BASE.pad * d.breatherFloorGain);
      var inserted = false, L = nodes.limiter;
      var fresh = !(L && nodes.__mixComp === nodes.comp && nodes.__mixMaster === nodes.master);
      if (fresh && nodes.comp && nodes.master && typeof ctx.createDynamicsCompressor === 'function') {
        L = ctx.createDynamicsCompressor();
        try { nodes.comp.disconnect(nodes.master); } catch (_e) { nodes.comp.disconnect(); }
        nodes.comp.connect(L); L.connect(nodes.master);
        nodes.limiter = L; nodes.__mixComp = nodes.comp; nodes.__mixMaster = nodes.master; inserted = true;
      }
      if (nodes.limiter && nodes.__mixComp === nodes.comp) {
        setV(nodes.limiter.threshold, d.limiter.threshold); setV(nodes.limiter.knee, d.limiter.knee);
        setV(nodes.limiter.ratio, d.limiter.ratio); setV(nodes.limiter.release, d.limiter.release);
        setV(nodes.limiter.attack, 0);
      }
      if (plan) {
        sfxList(plan).forEach(function (s) { s.gain = resolveGain(d, s.name, s.gain); });
        (Array.isArray(plan.events) ? plan.events : []).forEach(function (e) {
          if (e && e.type === 'sfx') e.gain = resolveGain(d, e.name, e.gain);
        });
        wrapKit(d);
      }
      return { applied: true, limiterInserted: inserted };
    } catch (_e) {
      return { applied: false, limiterInserted: false };
    }
  }

  var API = { design: design, apply: apply, predict: predict, TARGETS: TARGETS, BASE: BASE, VERSION: VERSION };
  if (root) root.MIX_B = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
