/*
 * studio-music-engine.js - CETI Motion Atlas Studio Pro | v9.0.0 "Fable Soup"
 * Adaptive procedural score: WebAudio only, no audio files, seeded + t-driven.
 * Soup of candidates A (harmonic bed, OKLCH key, dynamics arc, seek re-entry) and B (archetype
 * leitmotif, FM-bell plant/return, Karplus-Strong pluck, pulse, 16th-quantized SFX). See work/music/MERGE-NOTES.md.
 *
 *   plan(sheet, palette, seed)             pure planner - runs under Node, no AudioContext
 *   scoreForBeat(beat, pal, feel, seed, o) one cue (chords, motif, bell, pulse, dynamics)
 *   schedule(ctx, plan, t0, opts)          lookahead scheduler; {live:false} without a ctx
 *   seek(t) | play() | pause() | sync(t, playing) | sfx(name, t, gain) | duck(ms) | mix
 *   setPalette(pal) | setEnabled(bool) | dispose() | keyFor(pal) | tempoFor(feel)
 *
 * Load after studio-motion-engine.js (MA.computeWadaHarmonicChord feeds the G24 CHORD stab), before studio-ui.js.
 * Hooks: tick() -> sync(_T, playing); scrub -> seek(T); sheet/palette/feel change -> schedule(null, plan(sheet, pal), T).
 * Determinism: mulberry32 seeded by FNV-1a only; no unseeded randomness, no wall clock.
 */
(function (root) {
  'use strict';
  var VERSION = '9.0.0';

  // ---- contract constants ----
  var DUCK = { dB: -6, attackMs: 10, holdMs: 250, releaseMs: 150 };   // duck law (typed contract)
  var LOOK = 0.2, TICK = 40;   // lookahead horizon (s), scheduler tick (ms)
  var TAIL = 1.5, QUANT = 0.06; // landing tail (s); SFX snap to 16ths only within 60 ms
  var PLUCK_CAP = { notes: 12, sec: 12, feels: ['beat'] }; // <= 12 pluck notes / 12 s on 'beat'

  // ---- small utilities ----
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function r3(x) { return Math.round(x * 1000) / 1000; }
  function midiHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  var NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  function mname(m) { return NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1); }
  function hashStr(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry32(seed) {
    var a = (seed >>> 0) || 1;
    return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function prng(seedStr) { return mulberry32(hashStr(seedStr)); }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length) % arr.length]; }

  // ---- colour -> OKLCH (candidate A) ----
  function hexToOklch(hex) {
    var h = String(hex || '#888888').replace('#', ''); if (h.length === 3) h = h.replace(/./g, function (c) { return c + c; });
    var n = parseInt(h, 16) || 0, c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    var r = c[0], g = c[1], b = c[2];
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    var A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    var B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    var H = Math.atan2(B, A) * 180 / Math.PI; if (H < 0) H += 360;
    return { L: L, C: Math.sqrt(A * A + B * B), H: H };
  }

  // ---- palette -> key / mode ----
  var MODES = {
    ionian: { name: 'Ionian (major)', iv: [0, 2, 4, 5, 7, 9, 11] }, lydian: { name: 'Lydian', iv: [0, 2, 4, 6, 7, 9, 11] },
    mixolydian: { name: 'Mixolydian', iv: [0, 2, 4, 5, 7, 9, 10] }, dorian: { name: 'Dorian', iv: [0, 2, 3, 5, 7, 9, 10] },
    aeolian: { name: 'Aeolian (minor)', iv: [0, 2, 3, 5, 7, 8, 10] }
  };
  // Root table shared with MA.computeWadaHarmonicChord (C3..C4 by wadaIdx % 8) so stab and bed share a tonic.
  var ROOT_MIDI = [48, 50, 52, 53, 55, 57, 59, 60];
  var ROOT_NAMES = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'];
  function swatch(p, k, i) { return p[k] || (p.sw && p.sw[i] && (Array.isArray(p.sw[i]) ? p.sw[i][0] : p.sw[i])); }
  function paletteFamily(pal) {
    var p = pal || {};
    var hexes = [swatch(p, 'h', 1), swatch(p, 'a', 0), swatch(p, 'b', 2)].filter(Boolean);
    if (!hexes.length) hexes = ['#ae5224', '#ebd3a2'];
    var lch = hexes.map(hexToOklch);
    function avg(k) { return lch.reduce(function (s, x) { return s + x[k]; }, 0) / lch.length; }
    var H = lch[0].H, L = avg('L'), C = avg('C');
    var fam, mode;
    if (L > 0.80 && C < 0.09) { fam = 'luminous'; mode = 'lydian'; }
    else if (H >= 30 && H < 110) { fam = 'ochre'; mode = 'mixolydian'; }
    else if (H >= 110 && H < 170) { fam = 'green'; mode = L > 0.7 ? 'lydian' : 'dorian'; }
    else if (H >= 170 && H < 225) { fam = 'teal'; mode = 'dorian'; }
    else if (H >= 225 && H < 290) { fam = 'deep-sea'; mode = L < 0.55 ? 'aeolian' : 'dorian'; }
    else if (H >= 290 && H < 335) { fam = 'violet'; mode = L < 0.6 ? 'aeolian' : 'lydian'; }
    else { fam = 'rose'; mode = L < 0.45 ? 'aeolian' : 'ionian'; }
    return { family: fam, mode: mode, hue: Math.round(H), L: Number(L.toFixed(3)), C: Number(C.toFixed(3)) };
  }
  function keyFor(pal, idxOverride) {
    var idx = idxOverride != null ? Number(idxOverride) : (Number(String((pal && (pal.wadaIndex || pal.id)) || 343).replace(/\D+/g, '')) || 343);
    var fam = paletteFamily(pal), rm = ROOT_MIDI[idx % 8];
    return { root: ROOT_NAMES[idx % 8], rootMidi: rm, rootHz: Number(midiHz(rm).toFixed(2)), wadaIdx: idx,
      mode: fam.mode, modeName: MODES[fam.mode].name, scale: MODES[fam.mode].iv.slice(),
      family: fam.family, hue: fam.hue, L: fam.L, C: fam.C };
  }

  // ---- feel -> tempo (A's table, snapped to B's fps grids) ----
  var TEMPO = { rest: 60, slow: 64, held: 72, glaser: 84, rostrum: 88, saul: 92, beat: 120, spring: 104 };
  var FPS_GRID = { saul: 8, held: 12, rostrum: 10 };   // stepped feels: beat length = whole frames
  function tempoFor(feel) {
    var k = feel && feel.id ? feel.id : (TEMPO[feel] ? feel : 'glaser'), bpm = TEMPO[k], beatSec = 60 / bpm, fps = FPS_GRID[k] || 0, frames = 0;
    if (fps) { frames = Math.max(1, Math.round(beatSec * fps)); beatSec = frames / fps; bpm = Number((60 / beatSec).toFixed(3)); }
    return { feel: k, bpm: bpm, beatSec: beatSec, fps: fps, framesPerBeat: frames };
  }

  // ---- archetype leitmotif signatures (candidate B) ----
  // iv = interval steps (semitones), rh = rhythm cell (beats)
  var SIG = {
    cetacean: { iv: [7, 5, -2, 12, -7], rh: [2, 2, 1, 3] }, avian: { iv: [4, 3, 5, 2, -12], rh: [1, 1, 1, 2] },
    submersible: { iv: [-2, -3, 2, -5, 0], rh: [2, 2, 4, 2] }, geometric: { iv: [5, 5, -10, 5, 2], rh: [1, 1, 2, 2] },
    instrument: { iv: [2, 2, 3, -2, 2], rh: [1, 1, 1, 1] }, calligraphic: { iv: [1, 2, -1, -2, 3], rh: [1, 0.5, 0.5, 2] },
    mythic: { iv: [6, 1, 4, -11, 7], rh: [3, 1, 2, 2] }, botanical: { iv: [3, 2, 2, 3, -10], rh: [1, 2, 1, 2] }
  };
  var ARCH_RX = [[/falcon|bird|owl|avian/i, 'avian'], [/sub|diver/i, 'submersible'], [/geo|poly/i, 'geometric'], [/horn|string|instr/i, 'instrument'],
    [/ink|brush|calli/i, 'calligraphic'], [/myth|dragon|serpent/i, 'mythic'], [/leaf|fern|bot|vine/i, 'botanical']];
  function guessArch(id) { id = String(id || ''); for (var i = 0; i < ARCH_RX.length; i++) if (ARCH_RX[i][0].test(id)) return ARCH_RX[i][1]; return 'cetacean'; }
  function archetypeOf(sb) {
    if (sb && SIG[sb.archetype]) return sb.archetype;
    var charId = (sb && sb.charId) || 'ceti-whale', F = root.STUDIO_CHARACTER_FOUNDRY;
    var spec = F && F.CHARACTERS && F.CHARACTERS[charId];
    return (spec && SIG[spec.archetype]) ? spec.archetype : guessArch(charId);
  }

  // ---- role table: A's harmony/dynamics + B's transform/pulse/bell ----
  var ROLE_SEQ = ['hook', 'threshold', 'escalation', 'turn', 'filter', 'breather', 'climax', 'callback'];
  // Columns: prog (scale degrees) | dyn from->to | density | reg (semitones) | accent | mood | motif transform | pulse | bell | default SFX
  var ROLE_COLS = ['prog', 'dyn', 'density', 'reg', 'accent', 'mood', 'transform', 'pulse', 'bell', 'sfx'];
  var ROLE_ROWS = {
    hook:       [[1, 4], [0.55, 0.72], 0.35, 0,   0.4,  'curious-rise',  'state',     'basic',  'plant',  'WHOOSH'],
    threshold:  [[6, 4], [0.62, 0.66], 0.45, 0,   0.5,  'crossing',      'transpose', 'basic',  null,     'CLICK'],
    escalation: [[2, 5], [0.68, 0.82], 0.6,  0,   0.6,  'lift',          'invert',    'drive',  null,     'BOING'],
    turn:       [[6, 3], [0.74, 0.64], 0.5,  -12, 0.7,  'pivot',         'invert',    'basic',  null,     'WHOOSH'],
    filter:     [[4, 5], [0.6, 0.7],   0.4,  12,  0.45, 'sift',          'fragment',  'sparse', null,     'CLICK'],
    breather:   [[1],    [0.3, 0.28],  0,    12,  0.1,  'pad-only-hold', 'rest',      'off',    'echo',   null],
    climax:     [[5, 1], [0.9, 1.0],   0.8,  12,  1.0,  'peak',          'octave',    'drive',  null,     'THUD'],
    callback:   [[4, 1], [0.5, 0.42],  0.3,  0,   0.3,  'resolve-tonic', 'augment',   'tail',   'return', 'CHORD']
  };
  var ROLES = {};
  Object.keys(ROLE_ROWS).forEach(function (r) { ROLES[r] = {}; ROLE_COLS.forEach(function (c, i) { ROLES[r][c] = ROLE_ROWS[r][i]; }); });
  var PULSE_FEEL = { beat: 1, spring: 0.9, saul: 0.9, glaser: 0.7, rostrum: 0.7, held: 0.6, rest: 0.45, slow: 0.45 };
  var SFX_GAIN = { WHOOSH: 0.45, THUD: 0.5, CLICK: 0.4, BOOP: 0.45, BOING: 0.45, CHORD: 0.6 };
  var SFX_LEN = { WHOOSH: 0.4, THUD: 0.35, CLICK: 0.02, BOOP: 0.22, BOING: 0.7, CHORD: 1.4 };

  function roleOf(beat, i, n) {
    var r = String((beat && beat.role) || '').toLowerCase();
    if (ROLES[r]) return r;
    if (beat && beat.cameraMove === 'breather-hold') return 'breather';
    return ROLE_SEQ[Math.min(7, Math.floor((i / Math.max(1, n)) * 8))];
  }

  // ---- harmony: A's progressions, B's least-motion voicing ----
  function triad(key, deg, seventh, add9) {
    var sc = key.scale, d = (deg - 1) % 7;
    function tone(j) { return key.rootMidi + sc[j % 7] + 12 * Math.floor(j / 7); }
    var notes = [tone(d), tone(d + 2), tone(d + 4)];
    if ((notes[2] - notes[0]) === 6) notes[2] += 1;       // no diminished triads in the bed
    var third = notes[1] - notes[0], q = third === 4 ? 'maj' : third === 3 ? 'min' : 'sus';
    if (seventh) notes.push(tone(d + 6));
    if (add9) notes.push(tone(d + 8));
    return { degree: deg, quality: q + (seventh ? '7' : '') + (add9 ? 'add9' : ''), notes: notes, root: notes[0], rootPc: ((notes[0] - key.rootMidi) % 12 + 12) % 12 };
  }
  // Least-motion closed voicing of pitch classes inside [lo, hi] (B), octave base anchored to a true C.
  function voiceLead(pcs, prev, lo, hi) {
    var best = null, bd = 1e9, oct0 = 12 * Math.floor(lo / 12);
    for (var inv = 0; inv < 3; inv++) for (var oct = 0; oct <= 2; oct++) {
      var v = [];
      for (var k = 0; k < 3; k++) { var m = oct0 + 12 * oct + pcs[(k + inv) % 3]; while (m < lo) m += 12; while (m > hi) m -= 12; v.push(m); }
      v.sort(function (a, b) { return a - b; });
      var cost = prev ? v.reduce(function (s, m, i) { return s + Math.abs(m - prev[i]); }, 0) : Math.abs(v[0] - (lo + 7));
      if (cost < bd) { bd = cost; best = v; }
    }
    return best;
  }
  function voiceChord(ch, key, prev) {
    var pcs = ch.notes.slice(0, 3).map(function (m) { return ((m % 12) + 12) % 12; });
    var v = voiceLead(pcs, prev, key.rootMidi - 5, key.rootMidi + 14);
    ch.notes.slice(3).forEach(function (ext) { var m = ((ext % 12) + 12) % 12 + 12 * Math.floor(v[v.length - 1] / 12); if (m <= v[v.length - 1]) m += 12; v.push(m); });
    return v;
  }

  // ---- leitmotif derivation + transforms (candidate B) ----
  function snapToScale(rel, scale) {
    var pc = ((rel % 12) + 12) % 12, best = 0, bd = 99;
    for (var i = 0; i < scale.length; i++) { var d = Math.min(Math.abs(scale[i] - pc), 12 - Math.abs(scale[i] - pc)); if (d < bd) { bd = d; best = scale[i]; } }
    var out = rel - pc + best; if (best - pc > 6) out -= 12; if (pc - best > 6) out += 12; return out;
  }
  function deriveBase(palette, feel, seed, archetype, palIdx) {
    var arch = SIG[archetype] ? archetype : 'cetacean', sig = SIG[arch];
    var key = keyFor(palette, palIdx), T = tempoFor(feel);
    var r = prng('motif|' + seed + '|' + arch + '|' + key.wadaIdx);
    var n = 4 + Math.floor(r() * 5), rel = [0], durs = [pick(r, sig.rh)], cur = 0;
    for (var i = 1; i < n; i++) { var step = pick(r, sig.iv); if (Math.abs(cur + step) > 14) step = -step; cur = clamp(cur + step, -14, 14); rel.push(cur); durs.push(pick(r, sig.rh)); }
    if (n >= 6 && rel[n - 1] !== 0 && Math.abs(rel[n - 1]) < 5) rel[n - 1] = 0;   // long motifs close on the tonic
    var phrase = rel.slice(0, Math.min(4, n)).map(function (x) { return key.rootMidi + 24 + snapToScale(x, key.scale); });
    return { seed: String(seed), archetype: arch, signature: sig.iv.slice(), key: key, tempo: T, bpm: T.bpm, beatSec: T.beatSec, feel: T.feel,
      motif: { rel: rel, durs: durs, n: n }, phrase: phrase };
  }
  function transformMotif(base, tr) {
    var rel = base.motif.rel.slice(), durs = base.motif.durs.slice(), f = 1;
    if (tr === 'invert') rel = rel.map(function (x) { return -x; });
    if (tr === 'octave') rel = rel.map(function (x) { return x + 12; });
    if (tr === 'fragment') { var k = Math.ceil(rel.length / 2); rel = rel.slice(0, k); durs = durs.slice(0, k); f = 0.5; }
    if (tr === 'augment') { f = 2; rel.push(0); durs.push(2); }
    return { rel: rel, durs: durs, f: f };
  }
  function quantize(t, beatSec) {
    var g = beatSec / 4, q = Math.round(t / g) * g;
    return Math.abs(q - t) <= QUANT ? { t: r3(q), q: true } : { t: r3(t), q: false };
  }

  // ---- scoreForBeat: one cue ----
  function scoreForBeat(beat, palette, feel, seed, opts) {
    var o = opts || {}, b = beat || {}, i = Number(b.index) || 0;
    var base = o.base || deriveBase(palette, feel, seed != null ? seed : (b.id || 'ceti'), o.archetype || b.archetype || 'cetacean', o.palIdx);
    var key = base.key, bs = base.beatSec, role = roleOf(b, i, o.count || 8), R = ROLES[role];
    var t0 = Number(b.tStartSec) || 0, t1 = Number(b.tEndSec) || (t0 + 4 * bs), L = Math.max(0.3, t1 - t0);
    function dynAt(t) { return R.dyn[0] + (R.dyn[1] - R.dyn[0]) * clamp((t - t0) / L, 0, 1); }
    // chords: A's progression per role (7ths on climax/callback, add9 on breather), B's least-motion voicing
    var prev = o.prevVoicing || null, seg = L / R.prog.length;
    var chords = R.prog.map(function (deg, k) {
      var c = triad(key, deg, role === 'climax' || role === 'callback', role === 'breather');
      c.voicing = voiceChord(c, key, prev); prev = c.voicing.slice(0, 3);
      c.t = r3(t0 + k * seg); c.dur = r3(seg + (role === 'callback' && k === R.prog.length - 1 ? TAIL : 0)); c.dyn = r3(dynAt(c.t));
      return c;
    });
    function chordAt(t) { return chords[Math.min(chords.length - 1, Math.floor((t - t0) / seg))]; }
    // motif: B's transform, fitted to the beat span, snapped to A's mode, velocity rides A's dynamics
    var tm = transformMotif(base, R.transform), notes = [];
    if (R.transform !== 'rest') {
      var span = L / bs, tot = tm.durs.reduce(function (s, d) { return s + d; }, 0), minD = Math.min.apply(null, tm.durs);
      var f = tm.f * Math.pow(2, Math.floor(Math.log(span * 0.92 / tot) / Math.LN2));
      if (f * minD < 0.25) f = 0.25 / minD;
      if (R.transform === 'augment') f = Math.max(f, tm.f * 0.5);
      var limit = R.transform === 'augment' ? span + TAIL / bs : span * 0.98, pos = 0;
      var chromatic = R.transform === 'transpose' || R.transform === 'invert' || R.transform === 'fragment';
      for (var k = 0; k < tm.rel.length; k++) {
        var start = Math.round(pos * 4) / 4, d = tm.durs[k] * f; if (start >= limit) break;
        var t = r3(t0 + start * bs), ch = chordAt(t), off = chromatic ? ch.rootPc : 0;
        var midi = key.rootMidi + 12 + R.reg + snapToScale(off + tm.rel[k], key.scale);
        var vel = clamp((k === 0 ? R.accent : 0.55) * (0.6 + 0.4 * dynAt(t)) + 0.15, 0.2, 1);
        notes.push({ t: t, midi: midi, name: mname(midi), dur: r3(d * bs), vel: r3(vel) });
        pos += d;
      }
    }
    // bell: plant (hook, mid-beat) / echo (breather, 3 notes) / return (callback, beat start) - identical phrase
    var bells = [], bellAt = R.bell === 'plant' ? t0 + L * 0.5 : R.bell === 'return' ? t0 : R.bell === 'echo' ? t0 + L * 0.25 : -1;
    if (bellAt >= 0) (R.bell === 'echo' ? base.phrase.slice(0, 3) : base.phrase).forEach(function (m, k) { bells.push({ t: r3(bellAt + k * bs * 0.25), midi: m, dur: 1.2, tag: R.bell }); });
    // pulse: B's kick/hat grid, off in breather, softened by feel
    var pulse = [], pf = PULSE_FEEL[base.feel] || 0.7;
    if (R.pulse !== 'off') {
      var hatDiv = R.density >= 0.8 ? 4 : R.density >= 0.6 ? 2 : R.pulse === 'basic' ? 2 : 0;
      for (var q = Math.ceil(t0 / bs - 1e-6); q <= Math.floor((t1 - 1e-6) / bs); q++) {
        var tq = r3(q * bs), half = (tq - t0) < L * 0.5;
        var kick = R.pulse === 'drive' || (R.pulse === 'basic' && q % 2 === 0) || (R.pulse === 'sparse' && q % 4 === 0) || (R.pulse === 'tail' && half && q % 2 === 0);
        if (kick) pulse.push({ t: tq, type: 'kick', vel: r3(R.accent * pf * 0.8 + 0.2 * pf) });
        for (var h = 1; h < hatDiv; h++) if (R.pulse !== 'tail' || half) pulse.push({ t: r3(tq + h * bs / hatDiv), type: 'hat', vel: r3(0.5 * pf) });
      }
    }
    return { beatIndex: i, id: b.id || ('beat-' + (i + 1)), tStart: t0, tEnd: t1, role: role, hinge: b.hinge || null, mood: R.mood,
      chordProgression: chords, dynamics: { from: R.dyn[0], to: R.dyn[1] }, density: R.density, register: R.reg,
      accent: R.accent, transform: R.transform, motif: notes, bell: bells, pulse: pulse, sfxCue: R.sfx, tail: role === 'callback' ? TAIL : 0 };
  }

  // Pluck density cap (A's open risk): on 'beat' feel <= 12 notes / 12 s, budget shared by density*length, evenly thinned.
  function capPlucks(cues, total, feel) {
    if (PLUCK_CAP.feels.indexOf(feel) < 0) return false;
    var budget = Math.max(1, Math.floor(total * PLUCK_CAP.notes / PLUCK_CAP.sec)), used = 0, capped = false;
    var weight = cues.reduce(function (s, c) { return s + (c.motif.length ? c.density * (c.tEnd - c.tStart) : 0); }, 0) || 1;
    cues.forEach(function (c) {
      if (!c.motif.length) return;
      var quota = Math.min(Math.max(1, Math.floor(budget * c.density * (c.tEnd - c.tStart) / weight)), Math.max(1, budget - used));
      if (c.motif.length > quota) {
        capped = true; var keep = [];
        for (var k = 0; k < quota; k++) keep.push(c.motif[quota === 1 ? 0 : Math.round(k * (c.motif.length - 1) / (quota - 1))]);
        c.motif = keep;
      }
      used += c.motif.length;
    });
    return capped;
  }
  // SFX cues: A's role defaults + B's storyboard grammar (hinge, camera); explicit beat.sfx overrides; sheet.sfxCues appended.
  function deriveSfx(cues, beats, sb, bs) {
    var sfx = [];
    function add(t, name, gain, bi) { name = String(name || 'CLICK').toUpperCase(); sfx.push({ t: r3(t), name: name, gain: gain != null ? Number(gain) : (SFX_GAIN[name] || 0.45), beat: bi }); }
    function addCue(e, bi) { add(e[0] != null ? e[0] : e.t, e[1] || e.name, e[2] != null ? e[2] : e.gain, bi); }
    cues.forEach(function (c, i) {
      var b = beats[i] || {}, t0 = c.tStart, mid = Number(b.tMidSec) || (t0 + (c.tEnd - t0) / 2), cam = String(b.cameraMove || '');
      if (Array.isArray(b.sfx)) { b.sfx.forEach(function (e) { addCue(e, i); }); return; }
      if (c.role === 'breather') return;                                   // music thins, nothing pops
      if (c.role === 'climax') add(t0, 'THUD', null, i);
      else if (c.role === 'callback') add(t0, 'CHORD', null, i);          // G24 stab
      else if (c.role === 'hook') add(t0, 'WHOOSH', 0.35, i);
      else if (b.hinge === 'BUT' || b.hinge === 'THEREFORE') add(t0, b.hinge === 'BUT' ? 'BOOP' : 'CLICK', null, i);
      else if (c.sfxCue) add(t0, c.sfxCue, null, i);
      if (/push-in|pull-back/.test(cam) && c.role !== 'hook') add(t0 + 0.1, 'WHOOSH', null, i);
      if (/dutch-tilt/.test(cam)) add(mid, 'BOING', null, i);
      if (/kick-shake/.test(cam) && c.role !== 'climax') add(t0 + 0.1, 'THUD', null, i);
    });
    (sb.sfxCues || []).forEach(function (e) { addCue(e, -1); });
    sfx.forEach(function (s) { var q = quantize(s.t, bs); s.tRaw = s.t; s.t = q.t; s.quantized = q.q; });
    sfx.sort(function (a, b) { return a.t - b.t; });
    return sfx.filter(function (s, i) { return !(i > 0 && sfx[i - 1].name === s.name && s.t - sfx[i - 1].t < 0.1); });
  }
  // Flat time-sorted event list for the scheduler (pads first at equal t).
  function flatten(cues, sfx) {
    var ev = [], push = function (t, dur, o) { o.t = t; o.end = r3(t + dur); ev.push(o); };
    cues.forEach(function (c, i) {
      c.chordProgression.forEach(function (ch) {
        push(ch.t, ch.dur, { type: 'pad', midis: ch.voicing, dyn: ch.dyn, beat: i });
        if (c.role !== 'breather') push(ch.t, ch.dur, { type: 'bass', root: ch.root, dyn: ch.dyn, beat: i });
      });
      c.motif.forEach(function (n) { push(n.t, n.dur, { type: 'pluck', midi: n.midi, vel: n.vel, dur: n.dur, beat: i }); });
      c.bell.forEach(function (n) { push(n.t, n.dur, { type: 'bell', midi: n.midi, dur: n.dur, tag: n.tag, beat: i }); });
      c.pulse.forEach(function (p) { push(p.t, 0.25, { type: p.type, vel: p.vel, beat: i }); });
    });
    sfx.forEach(function (s) { push(s.t, SFX_LEN[s.name] || 0.3, { type: 'sfx', name: s.name, gain: s.gain, beat: s.beat }); });
    return ev.sort(function (a, b) { return a.t - b.t || ((b.type === 'pad') - (a.type === 'pad')); });
  }

  // ---- plan: the whole score, pure ----
  function plan(storyboard, palette, seed) {
    var sb = storyboard || {}, beats = sb.beats || [], pal = palette || {};
    var arch = archetypeOf(sb), charId = sb.charId || 'ceti-whale';
    var sd = String(seed != null ? seed : (sb.id || 'sb') + '|' + charId + '|' + (pal.id || sb.palId || 0));
    var feel = sb.feelKey || sb.feel || 'glaser';
    var base = deriveBase(pal, feel, sd, arch, pal.id == null && sb.palId != null ? sb.palId : null);
    var key = base.key, bs = base.beatSec, cues = [], prev = null;
    beats.forEach(function (b, i) {
      var cue = scoreForBeat(Object.assign({ index: i }, b), pal, feel, sd, { base: base, count: beats.length, prevVoicing: prev });
      prev = cue.chordProgression[cue.chordProgression.length - 1].voicing.slice(0, 3);
      cues.push(cue);
    });
    var total = Number(sb.totalDurationSec) || (cues.length ? cues[cues.length - 1].tEnd : 12) || 12;
    var capped = capPlucks(cues, total, base.feel);
    var sfx = deriveSfx(cues, beats, sb, bs), cb = { plantT: -1, returnT: -1, phrase: base.phrase.slice() };
    cues.forEach(function (c) { c.bell.forEach(function (n) { if (n.tag === 'plant' && cb.plantT < 0) cb.plantT = n.t; if (n.tag === 'return' && cb.returnT < 0) cb.returnT = n.t; }); });
    return { version: 'MUSIC/' + VERSION, seed: sd, archetype: arch, signature: base.signature, feel: base.feel,
      bpm: base.bpm, beatSec: r3(bs), grid: { fps: base.tempo.fps, framesPerBeat: base.tempo.framesPerBeat }, key: key,
      totalSec: total, loopSec: total, tailSec: TAIL, endSec: r3(total + TAIL), cues: cues,
      motif: { rel: base.motif.rel, durs: base.motif.durs, names: base.motif.rel.map(function (x) { return mname(key.rootMidi + 12 + snapToScale(x, key.scale)); }) },
      phrase: base.phrase, callback: cb, sfx: sfx, events: flatten(cues, sfx), duck: DUCK, targetLUFS: -14,
      pluckCap: { applied: capped, notes: PLUCK_CAP.notes, sec: PLUCK_CAP.sec } };
  }

  // ==== WebAudio runtime ====
  var Ctx = (typeof root.AudioContext === 'function' && root.AudioContext) || (typeof root.webkitAudioContext === 'function' && root.webkitAudioContext) || null;
  var S = { ctx: null, plan: null, events: null, pos: 0, playing: false, startCtx: 0, startPos: 0, timer: null, live: [], cursor: 0,
    noise: null, click: null, ks: {}, pal: null, enabled: true, loop: true, onend: null };
  var mix = { master: null, comp: null, music: null, duck: null, sfx: null, pad: null, bass: null, pluck: null, pulse: null, bell: null, _ctx: null };

  // Graph: pad/bass/pluck/pulse/bell -> music(0.36 ~ -14 LUFS) -> duck -> comp(-18 dB 3:1) <- sfx(0.8) -> master -> out. SFX bypass the duck.
  function buildMix(ctx) {
    if (mix.master && mix._ctx === ctx) return;
    mix._ctx = ctx;
    mix.master = ctx.createGain(); mix.master.gain.value = 0.9;
    mix.comp = ctx.createDynamicsCompressor ? ctx.createDynamicsCompressor() : ctx.createGain();
    try { mix.comp.threshold.value = -18; mix.comp.knee.value = 12; mix.comp.ratio.value = 3; mix.comp.attack.value = 0.01; mix.comp.release.value = 0.25; } catch (_e) {}
    mix.duck = ctx.createGain(); mix.duck.gain.value = 1;
    mix.music = ctx.createGain(); mix.music.gain.value = 0.36;
    mix.sfx = ctx.createGain(); mix.sfx.gain.value = 0.8;
    ['pad', 'bass', 'pluck', 'pulse', 'bell'].forEach(function (k, i) { mix[k] = ctx.createGain(); mix[k].gain.value = [0.5, 0.55, 0.5, 0.3, 0.4][i]; mix[k].connect(mix.music); });
    mix.music.connect(mix.duck); mix.duck.connect(mix.comp); mix.sfx.connect(mix.comp);
    mix.comp.connect(mix.master); mix.master.connect(ctx.destination);
    var sr = ctx.sampleRate || 44100, r1 = mulberry32(0xC0FFEE);
    S.noise = ctx.createBuffer(1, sr, sr); var d = S.noise.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = r1() * 2 - 1;
    S.click = ctx.createBuffer(1, Math.max(8, Math.round(sr * 0.002)), sr); var c = S.click.getChannelData(0); for (i = 0; i < c.length; i++) c[i] = (r1() * 2 - 1) * (1 - i / c.length);
    S.ks = {};
  }
  // Karplus-Strong string buffer per MIDI note (seeded excitation, 1.4 s), cached.
  function ksBuf(ctx, midi) {
    if (S.ks[midi]) return S.ks[midi];
    var sr = ctx.sampleRate || 44100, N = Math.max(2, Math.round(sr / midiHz(midi))), len = Math.floor(sr * 1.4);
    var b = ctx.createBuffer(1, len, sr), d = b.getChannelData(0), r = prng('ks' + midi), ring = new Float32Array(N), decay = Math.pow(0.001, N / (sr * 1.1)), lp = 0;
    for (var i = 0; i < N; i++) { lp = 0.5 * lp + 0.5 * (r() * 2 - 1); ring[i] = lp; }
    for (var n = 0, p = 0; n < len; n++) { var a = ring[p], q = ring[(p + 1) % N]; ring[p] = 0.5 * (a + q) * decay; d[n] = a; p = (p + 1) % N; }
    S.ks[midi] = b; return b;
  }
  function ctxTime(t) { return S.startCtx + (t - S.startPos); }
  function position() { return S.playing && S.ctx ? S.startPos + (S.ctx.currentTime - S.startCtx) : S.pos; }
  function track(nodes, stopAt) { S.live.push({ n: nodes, stop: stopAt }); }
  function killAll() {
    var now = S.ctx ? S.ctx.currentTime : 0;
    S.live.forEach(function (h) { h.n.forEach(function (n) { try { if (n.stop) n.stop(now); } catch (_e) {} try { n.disconnect(); } catch (_e2) {} }); });
    S.live = [];
    if (mix.duck) { try { mix.duck.gain.cancelScheduledValues(now); mix.duck.gain.setValueAtTime(1, now); } catch (_e3) {} }
  }
  function gc() { var now = S.ctx.currentTime; S.live = S.live.filter(function (h) { return h.stop > now; }); }
  // ---- node helpers: osc(type, hz, at, stop) | gain(v) | filt(type, hz, Q) | noise(at, dur) | chain(a, b, ...) -> nodes[] ----
  function osc(type, hz, at, stop) { var o = S.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(hz, at); o.start(at); o.stop(stop); return o; }
  function gain(v) { var g = S.ctx.createGain(); g.gain.value = v; return g; }
  function filt(type, hz, Q) { var f = S.ctx.createBiquadFilter(); f.type = type; f.frequency.value = hz; f.Q.value = Q || 1; return f; }
  function noise(at, dur) { var s = S.ctx.createBufferSource(); s.buffer = S.noise; s.loop = true; s.start(at); s.stop(at + dur + 0.05); return s; }
  function chain() { for (var i = 0; i + 1 < arguments.length; i++) arguments[i].connect(arguments[i + 1]); return Array.prototype.slice.call(arguments, 0, -1); }
  function ramp(p, at, hz0, hz1, dt) { p.setValueAtTime(hz0, at); p.exponentialRampToValueAtTime(hz1, at + dt); }
  // Envelopes: adsr for sustaining bed voices; hit = fast attack + exponential decay for one-shots.
  function adsr(g, at, a, peak, sus, rel, end) {
    g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(peak, at + a);
    g.gain.setValueAtTime(sus, Math.max(at + a, end - rel)); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.01);
  }
  function hit(g, at, peak, a, dur) { g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), at + a); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); }

  // ---- voices ----
  var INST = {
    // A's bed: detuned saw pair + triangle per voice through a slow-LFO lowpass whose cutoff rides the dynamics arc
    pad: function (e, at, end, mid) {
      var dyn = e.dyn, lp = filt('lowpass', 500 + 1300 * dyn, 0.7), g = gain(0), lfo = osc('sine', 0.11, at, end + 0.7), lg = gain(120 + 100 * dyn);
      lfo.connect(lg); lg.connect(lp.frequency); var nodes = chain(lp, g, mix.pad).concat([lfo, lg]);
      adsr(g, at, mid ? 0.08 : Math.min(1.2, (end - at) * 0.3), 0.12 * (0.5 + dyn), 0.12 * (0.5 + dyn) * 0.85, 0.6, end);
      e.midis.forEach(function (m, i) {
        [-6, 6].forEach(function (cents) { var o = osc('sawtooth', midiHz(m + 12), at, end + 0.7); o.detune.value = cents; nodes = nodes.concat(chain(o, gain(0.07 / (i + 1)), lp)); });
        nodes = nodes.concat(chain(osc('triangle', midiHz(m), at, end + 0.7), gain(0.11 / (i + 1)), lp));
      });
      track(nodes, end + 0.8);
    },
    bass: function (e, at, end) {
      var g = gain(0), nodes = chain(osc('sine', midiHz(e.root - 24), at, end + 0.4), g, mix.bass);
      adsr(g, at, 0.25, 0.5 * (0.4 + 0.6 * e.dyn), 0.4 * (0.4 + 0.6 * e.dyn), 0.3, end); track(nodes, end + 0.5);
    },
    pluck: function (e, at) {   // B's Karplus-Strong string
      var s = S.ctx.createBufferSource(); s.buffer = ksBuf(S.ctx, e.midi); s.start(at); s.stop(at + 1.45);
      track(chain(s, gain(0.5 * e.vel), mix.pluck), at + 1.5);
    },
    bell: function (e, at) {    // B's 2-op FM bell (3.5:1); plant and return share this exact recipe
      var f = midiHz(e.midi), c = osc('sine', f, at, at + e.dur + 0.05), m = osc('sine', f * 3.5, at, at + e.dur + 0.05), mg = gain(0), g = gain(0);
      ramp(mg.gain, at, f * 1.6, f * 0.05, e.dur * 0.6); m.connect(mg); mg.connect(c.frequency);
      hit(g, at, 0.4, 0.004, e.dur); track(chain(c, g, mix.bell).concat([m, mg]), at + e.dur + 0.1);
    },
    kick: function (e, at) {
      var o = osc('sine', 150, at, at + 0.25), g = gain(0); ramp(o.frequency, at, 150, 42, 0.1);
      hit(g, at, 0.55 * e.vel, 0.003, 0.22); track(chain(o, g, mix.pulse), at + 0.3);
    },
    hat: function (e, at) {
      var g = gain(0); hit(g, at, 0.18 * e.vel, 0.002, 0.05);
      track(chain(noise(at, 0.06), filt('highpass', 7000), g, mix.pulse), at + 0.1);
    }
  };

  // ---- SFX bus (synthesized, bypasses the duck) ----
  var SFX = {
    WHOOSH: function (at, k) { var bp = filt('bandpass', 300, 1.2), g = gain(0); ramp(bp.frequency, at, 300, 3000, 0.14); bp.frequency.exponentialRampToValueAtTime(700, at + 0.38);
      hit(g, at, 0.9 * k, 0.1, 0.4); track(chain(noise(at, 0.4), bp, g, mix.sfx), at + 0.5); },
    THUD: function (at, k) { var o = osc('sine', 120, at, at + 0.35), g = gain(0), ng = gain(0); ramp(o.frequency, at, 120, 40, 0.18);
      hit(g, at, k, 0.001, 0.32); hit(ng, at, 0.5 * k, 0.001, 0.045);
      track(chain(o, g, mix.sfx).concat(chain(noise(at, 0.05), filt('lowpass', 400), ng, mix.sfx)), at + 0.4); },
    CLICK: function (at, k) { var s = S.ctx.createBufferSource(); s.buffer = S.click; s.start(at); track(chain(s, gain(0.7 * k), mix.sfx), at + 0.02); },
    BOOP: function (at, k) { var o = osc('sine', 520, at, at + 0.22), g = gain(0); ramp(o.frequency, at, 520, 780, 0.06);
      hit(g, at, 0.6 * k, 0.008, 0.2); track(chain(o, g, mix.sfx), at + 0.25); },
    BOING: function (at, k) { var c = osc('triangle', 330, at, at + 0.7), m = osc('sine', 28, at, at + 0.7), mg = gain(0), g = gain(0);
      ramp(c.frequency, at, 330, 180, 0.5); ramp(m.frequency, at, 28, 9, 0.6); ramp(mg.gain, at, 240, 8, 0.6); m.connect(mg); mg.connect(c.frequency);
      hit(g, at, 0.5 * k, 0.01, 0.65); track(chain(c, g, mix.sfx).concat([m, mg]), at + 0.75); },
    // G24 Orpheum stab: MA.computeWadaHarmonicChord voicing when the engine is loaded, else a 4-voice I7 in the plan's key
    CHORD: function (at, k) {
      var MA = root.MA, voices = null, nodes = [];
      try { if (MA && MA.computeWadaHarmonicChord) voices = MA.computeWadaHarmonicChord(S.pal, null, 1, position()).voices; } catch (_e) {}
      if (!voices) voices = (S.plan ? triad(S.plan.key, 1, true).notes : [60, 64, 67, 71]).map(function (m, i) { return { freqHz: midiHz(m), waveform: i % 2 ? 'triangle' : 'sine', gain: 0.18 / Math.sqrt(i + 1), active: true }; });
      voices.forEach(function (v, i) {
        if (!v.active || !(v.gain > 0)) return;
        var st = at + i * 0.05, g = gain(0); g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(v.gain * k * 2, st + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, at + 1.35);
        nodes = nodes.concat(chain(osc(v.waveform || 'sine', v.freqHz, st, at + 1.4), g, mix.sfx));
      });
      track(nodes, at + 1.5);
    }
  };
  // Duck law (contract): music bus 1 -> -6 dB in 10 ms, hold 250 ms, release 150 ms. A retrigger cancels the pending release and re-arms.
  function duckAt(at, holdMs) {
    var g = mix.duck.gain, lo = Math.pow(10, DUCK.dB / 20), a = DUCK.attackMs / 1000, hold = (holdMs == null ? DUCK.holdMs : holdMs) / 1000, rel = DUCK.releaseMs / 1000;
    g.cancelScheduledValues(at); g.setValueAtTime(1, at); g.linearRampToValueAtTime(lo, at + a);
    g.setValueAtTime(lo, at + a + hold); g.linearRampToValueAtTime(1, at + a + hold + rel);
  }
  function fireSfx(name, at, k) {
    var f = SFX[String(name).toUpperCase()]; if (!f || !S.ctx || !mix.sfx) return false;
    f(at, k == null ? (SFX_GAIN[String(name).toUpperCase()] || 0.5) : k); duckAt(at); return true;
  }

  // ---- lookahead scheduler ----
  function dispatch(e, pos) {
    var at = ctxTime(e.t), mid = e.t < pos, start = mid ? S.ctx.currentTime + 0.005 : at;
    try {
      if (e.type === 'pad') INST.pad(e, start, ctxTime(e.end), mid);
      else if (e.type === 'bass') INST.bass(e, start, ctxTime(e.end));
      else if (mid) return;                                  // one-shots are never replayed mid-flight
      else if (e.type === 'sfx') fireSfx(e.name, at, e.gain);
      else if (INST[e.type]) INST[e.type](e, at);
    } catch (_err) {}
  }
  function tick() {
    if (!S.playing || !S.ctx || !S.events) return;
    var pos = position(), horizon = pos + LOOK;
    while (S.cursor < S.events.length && S.events[S.cursor].t < horizon) { dispatch(S.events[S.cursor], pos); S.cursor++; }
    gc();
    if (S.plan && pos >= S.plan.loopSec) { if (S.loop) seek(0); else { pause(); S.pos = 0; if (S.onend) S.onend(); } }
  }
  // Rebase at t: kill live nodes, reset the cursor, re-enter still-sustaining pad/bass events (80 ms attack).
  function rescheduleFrom(t) {
    killAll(); S.cursor = 0;
    if (!S.events) return;
    for (var i = 0; i < S.events.length; i++) {
      var e = S.events[i];
      if (e.t >= t) { S.cursor = i; break; }
      if (e.end > t + 0.02 && (e.type === 'pad' || e.type === 'bass')) dispatch(e, t);
      S.cursor = i + 1;
    }
  }
  function ensureCtx(ctx) {
    if (ctx) S.ctx = ctx; else if (!S.ctx && Ctx) S.ctx = new Ctx();
    if (!S.ctx) return null;
    buildMix(S.ctx); installGesture(); return S.ctx;
  }
  function resumeCtx() { if (S.ctx && S.ctx.state === 'suspended' && S.ctx.resume) { try { S.ctx.resume(); } catch (_e) {} } }
  function installGesture() {
    if (S._g) return; S._g = true;
    var tgt = (root.document && root.document.addEventListener) ? root.document : (typeof root.addEventListener === 'function' ? root : null);
    if (!tgt) return;
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { tgt.addEventListener(ev, resumeCtx, { passive: true }); });
  }

  // ---- public runtime API ----
  function schedule(ctx, p, t0, opts) {
    var o = opts || {};
    S.plan = p; S.pos = Number(t0) || 0; S.events = p && p.events ? p.events.slice() : [];
    S.loop = o.loop !== false; S.onend = o.onend || null;
    if (!ensureCtx(ctx)) return { live: false, events: S.events.length, note: 'no AudioContext: planner-only' };
    if (S.playing) { S.startCtx = S.ctx.currentTime; S.startPos = S.pos; rescheduleFrom(S.pos); }
    return { live: true, events: S.events.length, bpm: p.bpm, key: p.key.root + ' ' + p.key.modeName, mix: mix };
  }
  function play() {
    if (!S.enabled || !ensureCtx()) return false;
    resumeCtx();
    if (S.playing) return true;
    S.playing = true; S.startCtx = S.ctx.currentTime + 0.02; S.startPos = S.pos;
    rescheduleFrom(S.pos);
    if (!S.timer && typeof setInterval === 'function') { S.timer = setInterval(tick, TICK); if (S.timer && S.timer.unref) S.timer.unref(); }
    return true;
  }
  function pause() { S.pos = position(); S.playing = false; killAll(); if (S.timer) { clearInterval(S.timer); S.timer = null; } return S.pos; }
  function seek(t) {   // idempotent: cancel + reschedule from t
    t = clamp(Number(t) || 0, 0, S.plan ? S.plan.loopSec : 1e9);
    if (S.playing && S.ctx) { S.startCtx = S.ctx.currentTime + 0.01; S.startPos = t; S.pos = t; rescheduleFrom(t); }
    else S.pos = t;
    return t;
  }
  function sync(t, playing) {   // hook for MotionAtlasStudioApp.tick()
    if (!S.enabled) { if (S.playing) pause(); S.pos = Number(t) || 0; return; }
    if (playing && !S.playing) { S.pos = Number(t) || 0; play(); }
    else if (!playing && S.playing) pause();
    else if (S.playing && Math.abs(position() - t) > 0.12) seek(t);
  }
  function duck(ms) { if (!S.ctx || !mix.duck) return false; duckAt(S.ctx.currentTime, ms); return true; }
  // sfx(name, t, gain): t on the plan timeline (quantized to 16ths within 60 ms when a plan is loaded); null => now
  function sfx(name, at, gain) {
    if (!S.enabled || !ensureCtx()) return null;
    var nm = String(name || 'CLICK').toUpperCase(), q = (at != null && S.plan) ? quantize(Number(at), S.plan.beatSec) : { t: at, q: false };
    var when = at == null ? S.ctx.currentTime : (S.playing ? Math.max(S.ctx.currentTime, ctxTime(q.t)) : S.ctx.currentTime);
    return fireSfx(nm, when, gain) ? { name: nm, t: q.t, quantized: q.q } : null;
  }
  function setPalette(pal) { S.pal = pal; }
  function setEnabled(on) { S.enabled = !!on; if (!S.enabled && S.playing) pause(); return S.enabled; }
  function dispose() {
    pause(); S.events = S.plan = S.noise = S.click = S.ctx = null; S.ks = {};
    if (mix.master) { try { mix.master.disconnect(); } catch (_e) {} }
    Object.keys(mix).forEach(function (k) { mix[k] = null; });
  }

  var API = {
    VERSION: VERSION, plan: plan, scoreForBeat: scoreForBeat, keyFor: keyFor, tempoFor: tempoFor, paletteFamily: paletteFamily,
    archetypeOf: archetypeOf, schedule: schedule, seek: seek, play: play, pause: pause, duck: duck, sfx: sfx, sync: sync, mix: mix,
    dispose: dispose, setPalette: setPalette, setEnabled: setEnabled, position: position,
    get enabled() { return S.enabled; },
    get state() { return { playing: S.playing, t: position(), cursor: S.cursor, live: S.live.length }; },
    MODES: MODES, ROLES: ROLES, TEMPO: TEMPO, FPS_GRID: FPS_GRID, SIG: SIG, DUCK: DUCK, PLUCK_CAP: PLUCK_CAP, _quantize: quantize, _tick: tick, live: !!Ctx
  };
  root.MUSIC = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
