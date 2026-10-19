/* MUSIC_A — "harmonic bed first" adaptive score (Candidate A, v9 soup). Pure planner + WebAudio lookahead
   scheduler; seeded PRNG only. Under Node (no AudioContext) plan()/scoreForBeat() work, schedule() is a no-op. */
(function (root) {
  'use strict';
  var TAU = Math.PI * 2;
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function mulberry32(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function midiHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // ---- colour → OKLCH
  function hexToRgb(hex) { var h = String(hex || '#888888').replace('#', ''); if (h.length === 3) h = h.replace(/./g, function (c) { return c + c; }); var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); }
  function hexToOklch(hex) {
    var c = hexToRgb(hex), r = c[0], g = c[1], b = c[2];
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    var A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    var B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    var H = Math.atan2(B, A) * 180 / Math.PI; if (H < 0) H += 360;
    return { L: L, C: Math.sqrt(A * A + B * B), H: H };
  }

  // ---- palette → key/mode
  var MODES = {
    ionian:     { name: 'Ionian (major)',  iv: [0, 2, 4, 5, 7, 9, 11] },
    lydian:     { name: 'Lydian',          iv: [0, 2, 4, 6, 7, 9, 11] },
    mixolydian: { name: 'Mixolydian',      iv: [0, 2, 4, 5, 7, 9, 10] },
    dorian:     { name: 'Dorian',          iv: [0, 2, 3, 5, 7, 9, 10] },
    aeolian:    { name: 'Aeolian (minor)', iv: [0, 2, 3, 5, 7, 8, 10] }
  };
  // root table = MA.computeWadaHarmonicChord (C3..C4 by wadaIdx % 8)
  var ROOT_MIDI = [48, 50, 52, 53, 55, 57, 59, 60];
  var ROOT_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];
  function paletteFamily(pal) {
    var p = pal || {};
    var hexes = [p.h || (p.sw && p.sw[1] && (p.sw[1][0] || p.sw[1])), p.a || (p.sw && p.sw[0] && (p.sw[0][0] || p.sw[0])), p.b || (p.sw && p.sw[2] && (p.sw[2][0] || p.sw[2]))].filter(Boolean);
    if (!hexes.length) hexes = ['#ae5224', '#ebd3a2'];
    var lch = hexes.map(hexToOklch);
    var H = lch[0].H, L = lch.reduce(function (s, x) { return s + x.L; }, 0) / lch.length, C = lch.reduce(function (s, x) { return s + x.C; }, 0) / lch.length;
    var fam, mode;
    if (L > 0.80 && C < 0.09)            { fam = 'luminous';  mode = 'lydian'; }
    else if (H >= 30 && H < 110)         { fam = 'ochre';     mode = 'mixolydian'; }
    else if (H >= 110 && H < 170)        { fam = 'green';     mode = L > 0.7 ? 'lydian' : 'dorian'; }
    else if (H >= 170 && H < 225)        { fam = 'teal';      mode = 'dorian'; }
    else if (H >= 225 && H < 290)        { fam = 'deep-sea';  mode = L < 0.55 ? 'aeolian' : 'dorian'; }
    else if (H >= 290 && H < 335)        { fam = 'violet';    mode = L < 0.6 ? 'aeolian' : 'lydian'; }
    else                                 { fam = 'rose';      mode = L < 0.45 ? 'aeolian' : 'ionian'; }
    return { family: fam, mode: mode, hue: Math.round(H), L: Number(L.toFixed(3)), C: Number(C.toFixed(3)) };
  }
  function keyFor(pal) {
    var idx = Number(String((pal && (pal.wadaIndex || pal.id)) || 343).replace(/\D+/g, '')) || 343;
    var fam = paletteFamily(pal);
    var rm = ROOT_MIDI[idx % 8];
    return { root: ROOT_NAMES[idx % 8] + '3', rootMidi: rm, rootHz: Number(midiHz(rm).toFixed(2)), mode: fam.mode, modeName: MODES[fam.mode].name, scale: MODES[fam.mode].iv, family: fam.family, hue: fam.hue, L: fam.L, C: fam.C };
  }

  // ---- feel → tempo
  var TEMPO = { rest: 60, slow: 64, held: 72, glaser: 84, rostrum: 88, saul: 92, beat: 120, spring: 104 };
  function tempoFor(feel) { var k = feel && feel.id ? feel.id : (typeof feel === 'string' ? feel : 'glaser'); return { bpm: TEMPO[k] || 84, feel: k }; }

  // ---- role → harmony / dynamics arc
  var ROLE_SEQ = ['hook', 'threshold', 'escalation', 'turn', 'filter', 'breather', 'climax', 'callback'];
  var ROLES = {
    hook:       { prog: [1, 4],    dyn: [0.55, 0.72], density: 0.35, register: 'mid',  accent: 0.4, mood: 'curious-rise',   sfx: 'WHOOSH' },
    threshold:  { prog: [6, 4],    dyn: [0.62, 0.66], density: 0.45, register: 'mid',  accent: 0.5, mood: 'crossing',       sfx: 'CLICK' },
    escalation: { prog: [2, 5],    dyn: [0.68, 0.82], density: 0.6,  register: 'high', accent: 0.6, mood: 'lift',           sfx: 'BOING' },
    turn:       { prog: [6, 3],    dyn: [0.74, 0.64], density: 0.5,  register: 'mid',  accent: 0.7, mood: 'pivot',          sfx: 'WHOOSH' },
    filter:     { prog: [4, 5],    dyn: [0.6, 0.7],   density: 0.4,  register: 'mid',  accent: 0.45, mood: 'sift',          sfx: 'CLICK' },
    breather:   { prog: [1],       dyn: [0.3, 0.28],  density: 0,    register: 'low',  accent: 0.1, mood: 'pad-only-hold',  sfx: null },
    climax:     { prog: [5, 1],    dyn: [0.9, 1.0],   density: 0.8,  register: 'high', accent: 1.0, mood: 'peak',           sfx: 'THUD' },
    callback:   { prog: [4, 1],    dyn: [0.5, 0.42],  density: 0.3,  register: 'mid',  accent: 0.3, mood: 'resolve-tonic',  sfx: 'BOOP' }
  };
  function roleOf(beat, i, n) {
    if (beat && beat.role && ROLES[beat.role]) return beat.role;
    if (beat && beat.cameraMove === 'breather-hold') return 'breather';
    return ROLE_SEQ[Math.min(7, Math.floor((i / Math.max(1, n)) * 8))];
  }
  function triad(key, deg, seventh, add9) {
    var sc = key.scale, d = (deg - 1) % 7, notes = [0, 2, 4].map(function (k) { var j = d + k; return key.rootMidi + sc[j % 7] + 12 * Math.floor(j / 7); });
    if (seventh) { var j7 = d + 6; notes.push(key.rootMidi + sc[j7 % 7] + 12 * Math.floor(j7 / 7)); }
    if (add9) { var j9 = d + 8; notes.push(key.rootMidi + sc[j9 % 7] + 12 * Math.floor(j9 / 7)); }
    if ((notes[2] - notes[0]) === 6) notes[2] += 1; // no diminished triads in the bed
    var q = (notes[1] - notes[0]) === 4 ? 'maj' : (notes[1] - notes[0]) === 3 ? ((notes[2] - notes[0]) === 6 ? 'dim' : 'min') : 'sus';
    return { degree: deg, quality: q + (seventh ? '7' : '') + (add9 ? 'add9' : ''), notes: notes, root: notes[0] };
  }

  function scoreForBeat(beat, palette, feel, seedOrKey) {
    var key = (seedOrKey && seedOrKey.scale) ? seedOrKey : keyFor(palette);
    var bpm = tempoFor(feel).bpm, bar = 240 / bpm;
    var t0 = Number(beat.tStartSec) || 0, t1 = Number(beat.tEndSec) || (t0 + 4);
    var i = Number(beat.index) || 0, R = ROLES[roleOf(beat, i, 8)];
    var role = roleOf(beat, i, 8);
    var seg = (t1 - t0) / R.prog.length, chords = R.prog.map(function (deg, k) {
      var c = triad(key, deg, role === 'climax' || role === 'callback', role === 'breather');
      c.t = Number((t0 + k * seg).toFixed(3)); c.dur = Number(seg.toFixed(3)); return c;
    });
    return { beatIndex: i, id: beat.id || ('beat-' + (i + 1)), tStart: t0, tEnd: t1, role: role, hinge: beat.hinge || null, mood: R.mood, chordProgression: chords, dynamics: { from: R.dyn[0], to: R.dyn[1] }, density: R.density, register: R.register, accent: R.accent, barSec: Number(bar.toFixed(3)), sfxCue: R.sfx };
  }

  function plan(storyboard, palette, seed) {
    var sb = storyboard || {}, beats = sb.beats || [];
    var seedN = (typeof seed === 'number') ? seed : hashStr(seed != null ? seed : (sb.id || 'ceti'));
    var rng = mulberry32(seedN);
    var key = keyFor(palette), feel = sb.feelKey || sb.feel || 'glaser', T = tempoFor(feel);
    var total = Number(sb.totalDurationSec) || (beats.length ? Number(beats[beats.length - 1].tEndSec) : 12) || 12;
    var cues = beats.map(function (b, i) { var bb = Object.assign({ index: i }, b); if (bb.role == null) bb.role = roleOf(bb, i, beats.length); return scoreForBeat(bb, palette, feel, key); });
    var eighth = 30 / T.bpm;
    // motif: seeded 8-cell contour, re-voiced per beat register
    var contour = []; for (var k = 0; k < 8; k++) contour.push(Math.floor(rng() * 5) - 2);
    var rhythm = []; for (k = 0; k < 8; k++) rhythm.push(rng());
    var motif = [];
    cues.forEach(function (c) {
      if (c.density <= 0) return;
      var base = c.register === 'high' ? 19 : c.register === 'mid' ? 12 : 7;
      var n = 0;
      for (var t = c.tStart; t < c.tEnd - 0.05; t += eighth, n++) {
        var cell = n % 8; if (rhythm[cell] > c.density) continue;
        var ch = c.chordProgression[Math.min(c.chordProgression.length - 1, Math.floor((t - c.tStart) / (c.tEnd - c.tStart) * c.chordProgression.length))];
        var deg = (ch.degree - 1 + contour[cell] + 7) % 7, m = key.rootMidi + base + key.scale[deg];
        var vel = 0.35 + 0.45 * (c.dynamics.from + (c.dynamics.to - c.dynamics.from) * ((t - c.tStart) / (c.tEnd - c.tStart)));
        motif.push({ t: Number(t.toFixed(3)), midi: m, dur: Number((eighth * (rhythm[(cell + 3) % 8] > 0.5 ? 1.8 : 0.9)).toFixed(3)), vel: Number(vel.toFixed(2)), beat: c.beatIndex });
      }
    });
    var sfx = [];
    cues.forEach(function (c, i) {
      var b = beats[i] || {};
      if (Array.isArray(b.sfx)) { b.sfx.forEach(function (e) { sfx.push({ t: Number(e[0] != null ? e[0] : e.t), name: String(e[1] || e.name).toUpperCase(), gain: Number(e[2] != null ? e[2] : (e.gain != null ? e.gain : 0.5)), beat: i }); }); return; }
      if (c.role === 'climax') sfx.push({ t: c.tStart, name: 'CHORD', gain: 0.6, beat: i }, { t: Number((c.tStart + 0.12).toFixed(3)), name: 'THUD', gain: 0.5, beat: i });
      else if (c.sfxCue) sfx.push({ t: c.tStart, name: c.sfxCue, gain: c.role === 'hook' ? 0.35 : 0.45, beat: i });
      if (b.cameraMove === 'kick-shake' && c.role !== 'climax') sfx.push({ t: Number((c.tStart + 0.1).toFixed(3)), name: 'THUD', gain: 0.45, beat: i });
    });
    sfx.sort(function (a, b) { return a.t - b.t; });
    var bars = []; for (var bt = 0, bi = 0; bt < total; bt += 240 / T.bpm, bi++) bars.push({ bar: bi, t: Number(bt.toFixed(3)) });
    return { version: 'MUSIC_A/1', seed: seedN, bpm: T.bpm, feel: T.feel, key: key, totalSec: total, loopSec: total, bars: bars, cues: cues, motif: motif, sfx: sfx, duck: { dB: -6, attackMs: 10, holdMs: 250, releaseMs: 120 }, targetLUFS: -14 };
  }

  // ======================= WebAudio runtime =======================
  var Ctx = (typeof root.AudioContext === 'function' && root.AudioContext) || (typeof root.webkitAudioContext === 'function' && root.webkitAudioContext) || null;
  var S = { ctx: null, plan: null, pos: 0, playing: false, startCtx: 0, startPos: 0, timer: null, live: [], cursor: 0, noise: null, click: null, gesture: false };
  var mix = { master: null, comp: null, music: null, duck: null, sfx: null, pad: null, bass: null, pluck: null };
  var LOOK = 0.15, TICK = 30;

  function buildMix(ctx) {
    if (mix.master && mix._ctx === ctx) return;
    mix._ctx = ctx;
    mix.master = ctx.createGain(); mix.master.gain.value = 0.9;
    mix.comp = ctx.createDynamicsCompressor();
    try { mix.comp.threshold.value = -18; mix.comp.knee.value = 12; mix.comp.ratio.value = 3; mix.comp.attack.value = 0.01; mix.comp.release.value = 0.25; } catch (_e) {}
    mix.duck = ctx.createGain(); mix.duck.gain.value = 1;
    mix.music = ctx.createGain(); mix.music.gain.value = 0.36; // ≈ −14 LUFS bed
    mix.sfx = ctx.createGain(); mix.sfx.gain.value = 0.8;
    mix.pad = ctx.createGain(); mix.pad.gain.value = 0.5;
    mix.bass = ctx.createGain(); mix.bass.gain.value = 0.55;
    mix.pluck = ctx.createGain(); mix.pluck.gain.value = 0.45;
    mix.pad.connect(mix.music); mix.bass.connect(mix.music); mix.pluck.connect(mix.music);
    mix.music.connect(mix.duck); mix.duck.connect(mix.comp); mix.sfx.connect(mix.comp);
    mix.comp.connect(mix.master); mix.master.connect(ctx.destination);
    var sr = ctx.sampleRate || 44100, r1 = mulberry32(0xC0FFEE);
    S.noise = ctx.createBuffer(1, sr, sr); var d = S.noise.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = r1() * 2 - 1;
    S.click = ctx.createBuffer(1, Math.max(8, Math.round(sr * 0.002)), sr); var c = S.click.getChannelData(0); for (i = 0; i < c.length; i++) c[i] = (r1() * 2 - 1) * (1 - i / c.length);
  }
  function ctxTime(t) { return S.startCtx + (t - S.startPos); }
  function position() { return S.playing && S.ctx ? S.startPos + (S.ctx.currentTime - S.startCtx) : S.pos; }
  function track(nodes, stopAt) { S.live.push({ n: nodes, stop: stopAt }); }
  function killAll() {
    var now = S.ctx ? S.ctx.currentTime : 0;
    S.live.forEach(function (h) { h.n.forEach(function (n) { try { if (n.stop) n.stop(now); } catch (_e) {} try { n.disconnect(); } catch (_e2) {} }); });
    S.live = [];
    if (mix.duck && mix.duck.gain.cancelScheduledValues) { mix.duck.gain.cancelScheduledValues(now); mix.duck.gain.setValueAtTime(1, now); }
  }
  function gc() { var now = S.ctx.currentTime; S.live = S.live.filter(function (h) { return h.stop > now; }); }

  // ---- voices
  function env(g, at, a, peak, sus, rel, end) {
    g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(peak, at + a);
    if (sus != null) g.gain.setValueAtTime(sus, Math.max(at + a, end - rel));
    g.gain.exponentialRampToValueAtTime(0.0001, end + 0.01);
  }
  function padChord(ch, at, end, dyn, skipAttack) {
    var ctx = S.ctx, lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.7;
    lp.frequency.setValueAtTime(500 + 1300 * dyn, at);
    var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.11; lg.gain.value = 120 + 100 * dyn; lfo.connect(lg); lg.connect(lp.frequency);
    var g = ctx.createGain(); lp.connect(g); g.connect(mix.pad);
    var a = skipAttack ? 0.08 : Math.min(1.2, (end - at) * 0.3);
    env(g, at, a, 0.12 * (0.5 + dyn), 0.12 * (0.5 + dyn) * 0.85, 0.6, end);
    var nodes = [lfo, g, lp];
    ch.notes.forEach(function (m, i) {
      [-6, 6].forEach(function (cents) { var o = ctx.createOscillator(); o.type = 'sawtooth'; o.detune.value = cents; o.frequency.value = midiHz(m + 12); var og = ctx.createGain(); og.gain.value = 0.07 / (i + 1); o.connect(og); og.connect(lp); o.start(at); o.stop(end + 0.7); nodes.push(o); });
      var tr = ctx.createOscillator(); tr.type = 'triangle'; tr.frequency.value = midiHz(m); var tg = ctx.createGain(); tg.gain.value = 0.11 / (i + 1); tr.connect(tg); tg.connect(lp); tr.start(at); tr.stop(end + 0.7); nodes.push(tr);
    });
    lfo.start(at); lfo.stop(end + 0.7); track(nodes, end + 0.8);
  }
  function subBass(ch, at, end, dyn) {
    var ctx = S.ctx, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = midiHz(ch.root - 24);
    o.connect(g); g.connect(mix.bass); env(g, at, 0.25, 0.5 * (0.4 + 0.6 * dyn), 0.4 * (0.4 + 0.6 * dyn), 0.3, end);
    o.start(at); o.stop(end + 0.4); track([o, g], end + 0.5);
  }
  function pluck(n, at) {
    var ctx = S.ctx, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = midiHz(n.midi); f.type = 'lowpass'; f.Q.value = 2;
    f.frequency.setValueAtTime(600 + 2600 * n.vel, at); f.frequency.exponentialRampToValueAtTime(300, at + n.dur);
    g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(0.25 * n.vel, at + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, at + n.dur);
    o.connect(f); f.connect(g); g.connect(mix.pluck); o.start(at); o.stop(at + n.dur + 0.05); track([o, f, g], at + n.dur + 0.1);
  }

  // ---- SFX bus
  function noiseSrc(at, dur) { var s = S.ctx.createBufferSource(); s.buffer = S.noise; s.loop = true; s.start(at); s.stop(at + dur + 0.05); return s; }
  var SFX = {
    WHOOSH: function (at, gain) { var ctx = S.ctx, s = noiseSrc(at, 0.4), bp = ctx.createBiquadFilter(), g = ctx.createGain(); bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(300, at); bp.frequency.exponentialRampToValueAtTime(3000, at + 0.14); bp.frequency.exponentialRampToValueAtTime(700, at + 0.38);
      g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(0.9 * gain, at + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.4);
      s.connect(bp); bp.connect(g); g.connect(mix.sfx); track([s, bp, g], at + 0.5); },
    THUD: function (at, gain) { var ctx = S.ctx, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(120, at); o.frequency.exponentialRampToValueAtTime(40, at + 0.18);
      g.gain.setValueAtTime(gain, at); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.32); o.connect(g); g.connect(mix.sfx); o.start(at); o.stop(at + 0.35);
      var n = noiseSrc(at, 0.05), lp = ctx.createBiquadFilter(), ng = ctx.createGain(); lp.type = 'lowpass'; lp.frequency.value = 400;
      ng.gain.setValueAtTime(0.5 * gain, at); ng.gain.exponentialRampToValueAtTime(0.0001, at + 0.045); n.connect(lp); lp.connect(ng); ng.connect(mix.sfx); track([o, g, n, lp, ng], at + 0.4); },
    CLICK: function (at, gain) { var s = S.ctx.createBufferSource(), g = S.ctx.createGain(); s.buffer = S.click; g.gain.value = 0.7 * gain; s.connect(g); g.connect(mix.sfx); s.start(at); track([s, g], at + 0.02); },
    BOOP: function (at, gain) { var ctx = S.ctx, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(520, at); o.frequency.exponentialRampToValueAtTime(780, at + 0.06); o.frequency.setValueAtTime(780, at + 0.12);
      g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(0.6 * gain, at + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
      o.connect(g); g.connect(mix.sfx); o.start(at); o.stop(at + 0.22); track([o, g], at + 0.25); },
    BOING: function (at, gain) { var ctx = S.ctx, c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
      c.type = 'triangle'; c.frequency.setValueAtTime(330, at); c.frequency.exponentialRampToValueAtTime(180, at + 0.5);
      m.type = 'sine'; m.frequency.setValueAtTime(28, at); m.frequency.exponentialRampToValueAtTime(9, at + 0.6);
      mg.gain.setValueAtTime(240, at); mg.gain.exponentialRampToValueAtTime(8, at + 0.6); m.connect(mg); mg.connect(c.frequency);
      g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(0.5 * gain, at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.65);
      c.connect(g); g.connect(mix.sfx); c.start(at); m.start(at); c.stop(at + 0.7); m.stop(at + 0.7); track([c, m, mg, g], at + 0.75); },
    CHORD: function (at, gain) { // G24 Orpheum stab (MA.computeWadaHarmonicChord voicing) on the SFX bus
      var ctx = S.ctx, MA = root.MA, voices = null;
      try { if (MA && MA.computeWadaHarmonicChord) voices = MA.computeWadaHarmonicChord(S.pal, null, 1, position()).voices; } catch (_e) {}
      if (!voices) voices = (S.plan ? triad(S.plan.key, 1, true).notes : [60, 64, 67, 71]).map(function (m, i) { return { freqHz: midiHz(m), waveform: i % 2 ? 'triangle' : 'sine', gain: 0.18 / Math.sqrt(i + 1), active: true }; });
      var nodes = [];
      voices.forEach(function (v, i) { if (!v.active || v.gain <= 0) return; var o = ctx.createOscillator(), g = ctx.createGain(); o.type = v.waveform; o.frequency.setValueAtTime(v.freqHz, at);
        var st = at + i * 0.05; g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(v.gain * gain * 2, st + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, at + 1.35);
        o.connect(g); g.connect(mix.sfx); o.start(st); o.stop(at + 1.4); nodes.push(o, g); });
      track(nodes, at + 1.5); }
  };
  // Duck law: at SFX onset music bus 0→−6 dB (×0.501) in 10 ms, hold 250 ms, release 120 ms; retrigger re-arms.
  function duckAt(at, ms) {
    var g = mix.duck.gain, hold = (ms || 250) / 1000;
    g.cancelScheduledValues(at); g.setValueAtTime(1, at); g.linearRampToValueAtTime(0.501, at + 0.01);
    g.setValueAtTime(0.501, at + hold); g.linearRampToValueAtTime(1, at + hold + 0.12);
  }
  function fireSfx(name, at, gain) { var f = SFX[String(name).toUpperCase()]; if (!f || !S.ctx) return false; f(at, gain == null ? 0.5 : gain); duckAt(at, 250); return true; }

  // ---- lookahead scheduler (Chris Wilson pattern)
  function buildEvents(p) {
    var ev = [];
    p.cues.forEach(function (c) { c.chordProgression.forEach(function (ch, k) { var d = c.dynamics.from + (c.dynamics.to - c.dynamics.from) * (k / Math.max(1, c.chordProgression.length - 1)); ev.push({ t: ch.t, end: ch.t + ch.dur, type: 'pad', ch: ch, dyn: d }); if (c.role !== 'breather') ev.push({ t: ch.t, end: ch.t + ch.dur, type: 'bass', ch: ch, dyn: d }); }); });
    p.motif.forEach(function (n) { ev.push({ t: n.t, end: n.t + n.dur, type: 'pluck', n: n }); });
    p.sfx.forEach(function (s) { ev.push({ t: s.t, end: s.t + 0.5, type: 'sfx', s: s }); });
    ev.sort(function (a, b) { return a.t - b.t; });
    return ev;
  }
  function dispatch(e, pos) {
    var at = ctxTime(e.t), mid = e.t < pos, start = mid ? S.ctx.currentTime + 0.005 : at;
    if (e.type === 'pad') padChord(e.ch, start, ctxTime(e.end), e.dyn, mid);
    else if (e.type === 'bass') subBass(e.ch, start, ctxTime(e.end), e.dyn);
    else if (e.type === 'pluck') { if (!mid) pluck(e.n, at); }
    else if (e.type === 'sfx') { if (!mid) fireSfx(e.s.name, at, e.s.gain); }
  }
  function tick() {
    if (!S.playing || !S.ctx || !S.events) return;
    var pos = position(), horizon = pos + LOOK;
    while (S.cursor < S.events.length && S.events[S.cursor].t < horizon) { dispatch(S.events[S.cursor], pos); S.cursor++; }
    gc();
    if (S.plan && pos >= S.plan.loopSec) { seek(0); }
  }
  function rescheduleFrom(t) {
    killAll(); S.cursor = 0;
    if (!S.events) return;
    var pos = t;
    for (var i = 0; i < S.events.length; i++) { var e = S.events[i]; if (e.t >= pos) { S.cursor = i; break; } if (e.end > pos + 0.02 && (e.type === 'pad' || e.type === 'bass')) dispatch(e, pos); S.cursor = i + 1; }
  }

  function ensureCtx(ctx) {
    if (ctx) S.ctx = ctx; else if (!S.ctx && Ctx) S.ctx = new Ctx();
    if (!S.ctx) return null;
    buildMix(S.ctx); return S.ctx;
  }
  function schedule(ctx, p, t0) {
    S.plan = p; S.pos = Number(t0) || 0; S.events = buildEvents(p);
    if (!ensureCtx(ctx)) return { live: false, events: S.events.length, note: 'no AudioContext: planner-only' };
    if (S.playing) { S.startCtx = S.ctx.currentTime; S.startPos = S.pos; rescheduleFrom(S.pos); }
    return { live: true, events: S.events.length, bpm: p.bpm, key: p.key.root + ' ' + p.key.modeName };
  }
  function play() {
    if (!ensureCtx()) return false;
    if (S.ctx.state === 'suspended' && S.ctx.resume) { try { S.ctx.resume(); } catch (_e) {} }
    S.gesture = true;
    if (S.playing) return true;
    S.playing = true; S.startCtx = S.ctx.currentTime + 0.02; S.startPos = S.pos;
    rescheduleFrom(S.pos);
    if (!S.timer && typeof setInterval === 'function') { S.timer = setInterval(tick, TICK); if (S.timer && S.timer.unref) S.timer.unref(); }
    return true;
  }
  function pause() { S.pos = position(); S.playing = false; killAll(); if (S.timer) { clearInterval(S.timer); S.timer = null; } return S.pos; }
  function seek(t) {
    t = clamp(Number(t) || 0, 0, S.plan ? S.plan.loopSec : 1e9);
    if (S.playing && S.ctx) { S.startCtx = S.ctx.currentTime + 0.01; S.startPos = t; S.pos = t; rescheduleFrom(t); }
    else { S.pos = t; }
    return t;
  }
  function duck(ms) { if (!S.ctx || !mix.duck) return false; duckAt(S.ctx.currentTime, ms || 250); return true; }
  function sfx(name, at, gain) { if (!ensureCtx()) return false; var when = at == null ? S.ctx.currentTime : (S.playing ? ctxTime(at) : S.ctx.currentTime); return fireSfx(name, when, gain); }
  function sync(t, playing) { // hook for MotionAtlasStudioApp.tick()
    if (playing && !S.playing) { S.pos = t; play(); }
    else if (!playing && S.playing) pause();
    else if (S.playing && Math.abs(position() - t) > 0.12) seek(t);
  }
  function dispose() { pause(); S.events = null; S.plan = null; if (mix.master) { try { mix.master.disconnect(); } catch (_e) {} } Object.keys(mix).forEach(function (k) { mix[k] = null; }); S.ctx = null; }
  function setPalette(pal) { S.pal = pal; }
  function installGesture() {
    if (!root.document || !root.document.addEventListener) return;
    var once = function () { if (S.ctx && S.ctx.state === 'suspended' && S.ctx.resume) { try { S.ctx.resume(); } catch (_e) {} } S.gesture = true; };
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { root.document.addEventListener(ev, once, { once: true, passive: true }); });
  }
  installGesture();

  var API = { plan: plan, scoreForBeat: scoreForBeat, keyFor: keyFor, paletteFamily: paletteFamily, tempoFor: tempoFor, schedule: schedule, seek: seek, play: play, pause: pause, duck: duck, sfx: sfx, sync: sync, setPalette: setPalette, mix: mix, dispose: dispose, position: position, MODES: MODES, ROLES: ROLES, TEMPO: TEMPO, live: !!Ctx, _tick: tick };
  root.MUSIC_A = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
