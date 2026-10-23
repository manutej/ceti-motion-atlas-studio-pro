/*! studio-two-renderer.js — TWO_LAYER v9.0.0 (CETI Motion Atlas Studio Pro; model-soup merge of candidates A + B)
 *  two.js layer composited into MA.render in TWO passes: back (inside the camera save, before pr.draw) = parallax,
 *  ribbons, cutouts; front (after ctx.restore, before the viewfinder) = spotlight, diagram, counter, kinetic `say`,
 *  end-card, transition. Laws: every module is f(t, beat, palette, seed); the scene is plain data rebuilt from t each
 *  call and applied to an offscreen Two.Types.canvas (autostart:false, manual update()); colours only via the Wada
 *  palette lock; mulberry32 is the only randomness; no `Two` ⇒ silent no-op (zero ctx ops); reduced motion ⇒ settled
 *  frame; ONE hot spot per frame (the spotlight governs the kinetic type's brightness).
 *  API: window.TWO_LAYER = { init, load, renderFrame, modules, isAvailable, audit, dispose, VERSION } (+ CommonJS). */
(function (root) {
  'use strict';
  var VERSION = '9.0.0', LW = 480, LH = 300, TAU = Math.PI * 2, CYCLE = 12;
  var CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/two.js/0.8.17/two.min.js';
  var MONO = '"JetBrains Mono","Space Mono",ui-monospace,Menlo,monospace';
  var SANS = '"DM Sans",system-ui,sans-serif', SERIF = '"Fraunces",Georgia,serif';
  var SAY_PX = 14; // body size at 1x (index.html body font-size), the floor for any `say` caption (D3)
  var GRAMMAR = ['hook', 'claim', 'proof', 'proof', 'breather', 'callback', 'claim', 'landing']; // G32 order for the synthesized grid
  var S = { two: null, ready: false, loading: false, cbs: [], disposed: false, cdn: CDN_URL, reduced: false, covered: false, alpha: 1 };

  // ---------- pure math (closed-form) ----------
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function ramp(t, a, b) { return clamp((t - a) / Math.max(1e-6, b - a), 0, 1); }
  function mulberry(seed) { // mulberry32 — a fresh stream per (module, beat) so frames never share state
    var a = (seed >>> 0) || 1;
    return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function hashStr(s) { var h = 2166136261; s = String(s || ''); for (var i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
  function glaser(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 5); }           // ≈ cubic-bezier(.22,1,.36,1), the engine's Glaser ease
  function rest(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function pop(x) { if (x <= 0) return 0; if (x >= 1) return 1; var c = 1.70158, y = x - 1; return 1 + (c + 1) * y * y * y + c * y * y; } // Glaser overshoot pop
  function swash(s) { s = clamp(s, 0, 1); return 1 - Math.exp(-5.5 * s) * Math.cos(4.2 * s); } // ceremonial overshoot leg, settles to 1
  function hexOk(h) { return typeof h === 'string' && /^#[0-9a-f]{6}$/i.test(h); }
  function col(h, a) { // the only colour constructor: a palette hex, optionally with alpha
    if (a == null || a >= 1) return h;
    var n = parseInt(h.slice(1), 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + clamp(a, 0, 1).toFixed(3) + ')';
  }
  function toHex(c) { // rgba(...) → #hex so audit() can check membership
    if (!c || typeof c !== 'string') return null;
    if (c[0] === '#') return c.toLowerCase();
    var m = /^rgba?\((\d+),(\d+),(\d+)/.exec(c.replace(/\s/g, ''));
    return m ? '#' + ((1 << 24) + (+m[1] << 16) + (+m[2] << 8) + +m[3]).toString(16).slice(1) : c;
  }

  // ---------- palette lock (G01): the only colour source a module may touch ----------
  function lockPalette(P, pal) {
    var src = (P && hexOk(P.ink) && hexOk(P.paper)) ? P : (pal || {});
    var sw = (src.swHex || src.sw || []).map(function (s) { return Array.isArray(s) ? s[0] : s; });
    var C = {
      paper: hexOk(src.paper) ? src.paper : '#fbf3e6', ink: hexOk(src.ink) ? src.ink : '#1a1f2e',
      a: hexOk(src.a) ? src.a : (sw[0] || '#ebd3a2'), h: hexOk(src.h) ? src.h : (sw[1] || '#ae5224'),
      b: hexOk(src.b) ? src.b : (sw[2] || '#6b7a8f'), c: hexOk(src.c) ? src.c : (sw[3] || '#064f6e')
    };
    C.allowed = [C.paper, C.ink, C.a, C.h, C.b, C.c].map(function (x) { return x.toLowerCase(); });
    C.focus = function (role) { return role === 'accentFocal' ? C.h : role === 'supportWash' ? C.a : C.b; };
    return C;
  }

  // camera vocab tag (`#camera/push-in` or `push-in`) → [dx, dy, zoom] the parallax planes follow
  var CAMS = { 'static-wide': [0, 0, 0], 'pan-follow': [1, 0, 0], pan: [1, 0, 0], 'push-in': [0, 0, 1], push: [0, 0, 1],
    'dutch-tilt': [0.3, 0, 0.2], 'tracking-drift': [-0.5, 0.5, 0.4], 'breather-hold': [0, 0, -0.3],
    'kick-shake': [0, -0.8, 0.9], 'pull-back': [0.4, 0, -0.5], pull: [0.4, 0, -0.5] };
  var INTENSITY = { hook: 0.7, claim: 0.85, proof: 0.75, breather: 0.3, callback: 0.8, landing: 0.55,
    threshold: 0.6, escalation: 0.8, turn: 0.85, filter: 0.6, climax: 1 };
  function camTag(s) { return String(s || 'static-wide').replace(/^#?camera\//, ''); }

  // ---------- env: everything a module may read, derived from (t, beat, palette, seed) ----------
  function beatAt(beats, t) {
    if (!beats || !beats.length) return null;
    for (var i = 0; i < beats.length; i++) if (t >= beats[i].tStartSec && t < beats[i].tEndSec) return beats[i];
    return beats[t < beats[0].tStartSec ? 0 : beats.length - 1];
  }
  function synthBeat(T) { // no beat and no sheet: the 12 s studio clock split into 8 grammar slots
    var w = ((T % CYCLE) + CYCLE) % CYCLE, idx = Math.min(7, Math.floor(w / (CYCLE / 8)));
    return { index: idx, grammar: GRAMMAR[idx], role: GRAMMAR[idx], tStartSec: idx * CYCLE / 8, tEndSec: (idx + 1) * CYCLE / 8, hinge: idx % 2 ? 'BUT' : 'THEREFORE' };
  }
  function sayTiming(e) { // draw-on timing law: `say` lands word by word (~3.3 w/s); at(i) = instant word i shows
    var say = String(e.beat.say || e.beat.label || '').replace(/\s+/g, ' ').trim(), words = say ? say.split(' ') : [], n = Math.max(1, words.length);
    // D3 (EVAL-v9): the whole line has landed by 35% of the beat, so a card sampled at tMid shows the full sentence
    var start = e.t0 + Math.min(0.35, e.len * 0.08), span = Math.max(0.05, Math.min(e.len * 0.35 - (start - e.t0), n * 0.30));
    var at0 = function (i) { return start + (clamp(i, 0, n - 1) + 1) / n * span; }, M = root.MUSIC;
    // v9.2 grammar `snap` (beat | 8th | 16th | true = 16th | none): each reveal lands on the nearest MUSIC.gridTimes() time
    var sn = e.beat.snap === true ? '16th' : e.beat.snap, G = sn && sn !== 'none' && M && M.gridTimes ? M.gridTimes({ beatSec: M.tempoFor(e.feel || 'beat').beatSec, totalSec: e.t1 + 1 }, sn) : null;
    var at = !G ? at0 : function (i) { var x = at0(i); return clamp(G.reduce(function (b, g) { return Math.abs(g - x) < Math.abs(b - x) ? g : b; }, G[0]), e.t0, e.t1); };
    return { say: say, words: words, n: n, start: start, end: start + span, at: at, D: clamp(span / n * 1.6, 0.18, 0.5),
      shown: function (t) { return clamp(Math.floor((t - start) / span * n + 1e-6), 0, n); } };
  }
  function env(T, beat, palette, seed, P, o) {
    o = o || {}; T = Number(T) || 0;
    var sheet = o.sheet || null, beats = (sheet && sheet.beats) || o.beats || null;
    if (!beat) beat = beatAt(beats, T) || synthBeat(T);
    var t0 = Number(beat.tStartSec) || 0, t1 = Number(beat.tEndSec); if (!(t1 > t0)) t1 = t0 + CYCLE / 8;
    var len = t1 - t0, reduced = o.reduced != null ? !!o.reduced : (o.reducedMotion != null ? !!o.reducedMotion : S.reduced);
    var local = (((T - t0) % CYCLE) + CYCLE) % CYCLE;                   // wrap onto the 12 s studio clock
    var tl = reduced ? t1 - 1e-3 : t0 + Math.min(local, len);          // G16: reduced motion ⇒ settled final frame
    var idx = beat.index != null ? beat.index | 0 : (beats ? beats.indexOf(beat) : 0);
    var C = lockPalette(P, palette), g = beat.grammar || beat.role || 'hook', pose = beat.characterPose || {};
    var sd = (((Number(seed == null ? 7 : seed) | 0) * 1000003 + idx * 7919) ^ hashStr(C.ink + C.a + C.h)) >>> 0;
    var e = { t: tl, t0: t0, t1: t1, len: len, s: reduced ? 1 : clamp((tl - t0) / len, 0, 1), idx: idx, beat: beat, beats: beats,
      prev: o.prevBeat || (beats && idx > 0 ? beats[idx - 1] : null), g: g, hinge: beat.hinge === 'BUT' ? 'BUT' : 'THEREFORE',
      cam: camTag(beat.cameraMove), focusRole: beat.wadaFocusRole || 'secondaryStructure', intensity: INTENSITY[g] != null ? INTENSITY[g] : 0.65,
      pose: { x: pose.x != null ? pose.x : 0.5, y: pose.y != null ? pose.y : 0.5, rot: pose.rot || 0, scale: pose.scale || 1, rung: clamp(pose.rung || 1, 1, 5) },
      C: C, seed: sd, rnd: mulberry(sd), reduced: reduced, covered: o.captionsCovered != null ? !!o.captionsCovered : S.covered,
      title: o.title || (sheet && sheet.title) || '', isLast: beats ? idx === beats.length - 1 : g === 'landing' };
    e.feel = sheet && sheet.feelKey; e.say = sayTiming(e);
    return e;
  }

  // ---------- item constructors (pure data; the applier below is the only code touching two.js) ----------
  function path(out, id, pass, pts, p) { p = p || {}; out.push({ k: 'path', id: id, pass: pass, pts: pts, closed: !!p.closed, curved: !!p.curved, fill: p.fill || null, stroke: p.stroke || null, lw: p.lw || 0, op: p.op == null ? 1 : p.op, b: p.b || 0, e: p.e == null ? 1 : p.e }); }
  function text(out, id, pass, v, x, y, size, fill, p) { p = p || {}; out.push({ k: 'text', id: id, pass: pass, v: String(v), x: x, y: y, size: size, fill: fill, stroke: p.stroke || null, lw: p.lw || 0, op: p.op == null ? 1 : p.op, weight: p.w || 700, family: p.f || MONO, style: p.s || 'normal', align: p.al || 'center' }); }
  function shape(out, k, id, pass, x, y, w, h, p) { p = p || {}; out.push({ k: k, id: id, pass: pass, x: x, y: y, w: w, h: h, r: p.r || 0, fill: p.fill || null, stroke: p.stroke || null, lw: p.lw || 0, op: p.op == null ? 1 : p.op, dash: p.dash || null }); }
  function circle(out, id, pass, x, y, r, p) { shape(out, 'circle', id, pass, x, y, 0, 0, p); out[out.length - 1].r = r; }

  // ---------- (A1) flow-field ribbons: ink pours in from the hinge side, overshoots +14 %, snaps, tail releases ----------
  function ribbons(e, C, out) {
    var n = e.g === 'breather' ? 1 : 3, rnd = mulberry(e.seed ^ 0x5151), dir = e.hinge === 'BUT' ? -1 : 1;
    var px = e.pose.x * LW, py = e.pose.y * LH, ex = px - dir * (150 + 60 * e.intensity), ey = py + (e.idx % 2 ? 42 : -42);
    var cols = [C.focus(e.focusRole), C.b, C.a], M = 22, k = glaser(e.s / 0.7), bg = 0.55 * rest((e.s - 0.5) / 0.5);
    for (var i = 0; i < n; i++) {
      var off = (i - (n - 1) / 2) * 11, amp = 16 + 22 * rnd(), ph = rnd() * TAU, pts = [];
      for (var j = 0; j <= M; j++) {
        var u = j / M, w = u < 0.8 ? swash(u / 0.8 * 0.55) / swash(0.55) : 1 + 0.14 * Math.sin((u - 0.8) / 0.2 * Math.PI); // approach, then the overshoot leg
        var field = Math.sin(u * TAU * 1.5 + ph) * amp * (1 - u) + Math.cos(u * TAU * 0.5 + e.idx) * 6;                 // closed-form flow field
        pts.push([lerp(ex, px, w), lerp(ey, py, w) + off + field]);
      }
      path(out, 'rib' + i, 'back', pts, { curved: true, stroke: cols[i % 3], lw: 2.2 + 2.4 * e.intensity - i * 0.5, op: (0.55 + 0.35 * e.intensity) * (1 - 0.18 * i), b: bg, e: k });
    }
  }

  // ---------- (A2) Saul Bass cutouts: silhouette breathes between the beat's rung and rung+1 (5-rung ladder) ----------
  function rungShape(r, N, q) { // polar silhouettes with identical vertex counts ⇒ rungs interpolate vertex-for-vertex
    var pts = [];
    for (var j = 0; j < N; j++) {
      var a = j / N * TAU, c = Math.cos(a), s = Math.sin(a), x, y;
      if (r <= 1) { var rr = 1 / Math.pow(Math.pow(Math.abs(c), 2.6) + Math.pow(Math.abs(s / 0.42), 2.6), 1 / 2.6), fl = c < -0.55 ? 1 + 0.6 * Math.abs(s) * Math.pow(-c, 3) : 1; x = rr * c * (1 + 0.08 * q); y = rr * s * fl; }
      else if (r === 2) { x = c; y = 0.36 * s * (1.15 + 0.55 * c); }                     // teardrop
      else if (r === 3) { x = 0.92 * c; y = 0.42 * s * Math.sqrt(Math.abs(c)); }                     // vesica lens
      else if (r === 4) { var d = Math.pow(Math.pow(Math.abs(c), 6) + Math.pow(Math.abs(s), 6), 1 / 6); x = c / d * 0.9; y = s / d * 0.22; } // bar
      else { x = 0.3 * c; y = 0.3 * s; }                     // signal dot
      pts.push([x, y]);
    }
    return pts;
  }
  function cutouts(e, C, out) {
    var N = 28, q = mulberry(e.seed ^ 0xC0DE)(), r0 = e.pose.rung, r1 = Math.min(5, r0 + 1), dir = e.hinge === 'BUT' ? -1 : 1;
    var m = e.g === 'breather' ? 0.25 * (0.5 - 0.5 * Math.cos(TAU * e.s)) : rest(0.5 - 0.5 * Math.cos(TAU * e.s)); // rung → rung+1 → rung
    var A = rungShape(r0, N, q), Z = rungShape(r1, N, q), px = e.pose.x * LW - dir * 38, py = e.pose.y * LH + 12, cr = Math.cos(e.pose.rot), sr = Math.sin(e.pose.rot);
    [[70, 0.16 + 0.1 * e.intensity, C.b], [96, 0.07 + 0.05 * e.intensity, C.focus(e.focusRole)]].forEach(function (L, li) {
      var sc = L[0] * e.pose.scale, pts = [], lag = li * 16 * dir;
      for (var j = 0; j < N; j++) { var x = lerp(A[j][0], Z[j][0], m) * sc, y = lerp(A[j][1], Z[j][1], m) * sc * 0.85; pts.push([px - lag + x * cr - y * sr, py + x * sr + y * cr]); }
      path(out, 'cut' + li, 'back', pts, { closed: true, curved: r1 < 4, fill: L[2], op: L[1] });
    });
  }

  // ---------- (A4) depth parallax: 3 planes of Wada shapes drift and zoom by the `#camera/` tag ----------
  function parallax(e, C, out) {
    var rnd = mulberry(e.seed ^ 0xA7A7), cam = CAMS[e.cam] || [0, 0, 0], s = rest(e.s);
    [[0.35, C.a, 5], [0.65, C.b, 4], [1.35, C.focus(e.focusRole), 3]].forEach(function (pl, pi) {
      var depth = pl[0], count = e.g === 'breather' ? Math.max(2, pl[2] - 2) : pl[2];
      var dx = cam[0] * depth * 26 * s, dy = cam[1] * depth * 18 * s, zz = 1 + cam[2] * (depth - 1) * 0.12 * s;
      for (var i = 0; i < count; i++) {
        var kind = rnd(), x = 30 + rnd() * (LW - 60), yv = 30 + rnd() * (LH - 60), r = 6 + rnd() * 22 * depth, ang = rnd() * TAU; // fixed draw order per frame
        var cx = LW / 2 + (x - LW / 2) * zz + dx, cy = LH / 2 + (yv - LH / 2) * zz + dy, op = (pi < 2 ? 0.1 + 0.12 * depth : 0.08) * (0.6 + 0.4 * e.intensity);
        if (kind < 0.5) circle(out, 'px' + pi + '_' + i, 'back', cx, cy, r * zz, { fill: pl[1], op: op });
        else { var len = r * 3; path(out, 'px' + pi + '_' + i, 'back', [[cx - Math.cos(ang) * len, cy - Math.sin(ang) * len], [cx + Math.cos(ang) * len, cy + Math.sin(ang) * len]], { stroke: pl[1], lw: 2 + depth * 2, op: op }); }
      }
    });
  }

  // ---------- (B1) transition semantics: cause→effect wipes left→right, contrast splits, zoom-in irises from the
  // focus, breather cuts, callback = the hook's mask reversed, landing closes the iris on the lock-up ----------
  function relation(b, hookBeat) {
    if (b.transition) return b.transition;
    var g = b.grammar || b.role || '', cam = camTag(b.cameraMove);
    if (g === 'hook') return 'wipe';
    if (g === 'breather') return 'cut';
    if (g === 'landing') return 'iris-close';
    if (g === 'callback' || b.returns) return reverse(hookBeat ? relation(hookBeat, null) : 'wipe');
    if (/push/.test(cam) || g === 'claim') return 'iris';
    return b.hinge === 'BUT' ? 'split' : 'wipe';
  }
  function reverse(k) { return { wipe: 'wipe-back', 'wipe-back': 'wipe', split: 'split-back', 'split-back': 'split', iris: 'iris-back', 'iris-back': 'iris' }[k] || 'wipe-back'; }
  function focusOf(e, b, atEnd) { // THE hot spot of a beat, stage px
    b = b || e.beat; var f = b.focus, d = b.diagram, cp = b.characterPose;
    if (f) return { x: f.x * LW, y: f.y * LH, r: (f.r || 0.22) * LW };
    if (d && d.nodes && d.nodes.length) { var w = atEnd ? 1e9 : e.say.shown(e.t), pick = d.nodes[0]; d.nodes.forEach(function (nd) { if ((nd.word || 0) < w) pick = nd; }); return { x: pick.x * LW, y: pick.y * LH, r: 0.2 * LW }; }
    if (cp) return { x: (cp.x != null ? cp.x : 0.5) * LW, y: (cp.y != null ? cp.y : 0.5) * LH, r: 0.24 * LW * (cp.scale || 1) };
    return { x: LW / 2, y: LH / 2, r: 0.26 * LW };
  }
  function curtain(out, id, C, x, y, w, h) { shape(out, 'rect', id, 'front', x + w / 2, y + h / 2, Math.max(0, w), Math.max(0, h), { fill: C.paper }); }
  function edge(out, id, C, x1, y1, x2, y2) { path(out, id, 'front', [[x1, y1], [x2, y2]], { stroke: C.c, lw: 2 }); }
  function transition(e, C, out) {
    var kind = relation(e.beat, e.beats ? e.beats[0] : null), dur = Math.min(0.38, e.len * 0.24);
    var k = kind === 'iris-close' ? ramp(e.t, e.t1 - dur * 1.6, e.t1 - 0.02) : 1 - glaser(ramp(e.t, e.t0, e.t0 + dur)); // curtain remaining
    if (e.reduced || kind === 'cut' || k <= 0.001) return kind;
    var f = focusOf(e, null, true), big = 1.3 * Math.max(LW, LH);
    if (kind === 'wipe') { curtain(out, 'tr0', C, LW * (1 - k), 0, LW * k, LH); edge(out, 'tr1', C, LW * (1 - k), 0, LW * (1 - k), LH); }
    else if (kind === 'wipe-back') { curtain(out, 'tr0', C, 0, 0, LW * k, LH); edge(out, 'tr1', C, LW * k, 0, LW * k, LH); }
    else if (kind === 'split' || kind === 'split-back') { // halves exit opposite ways: the two sides disagree
      var dx = LW * (1 - k) * (kind === 'split' ? 1 : -1);
      curtain(out, 'tr0', C, -dx, 0, LW, LH / 2); curtain(out, 'tr1', C, dx, LH / 2, LW, LH / 2); edge(out, 'tr2', C, 0, LH / 2, LW, LH / 2);
    } else if (kind === 'iris' || kind === 'iris-close') {
      var r = Math.max(0.5, (1 - k) * big);
      circle(out, 'tr0', 'front', f.x, f.y, r + big / 2, { stroke: C.paper, lw: big }); circle(out, 'tr1', 'front', f.x, f.y, r, { stroke: C.c, lw: 2 });
    } else if (kind === 'iris-back') circle(out, 'tr0', 'front', f.x, f.y, Math.max(0.5, k * big * 0.6), { fill: C.paper, stroke: C.c, lw: 2 }); // plant revealed last
    return kind;
  }

  // ---------- (B2) diagram grammar: nodes/arrows/brackets/underlines drawn on in reading order; each element
  // finishes EXACTLY as the `say` word it supports lands (the arrow head pops with the word) ----------
  function wordIndex(words, phrase) {
    var cl = function (w) { return String(w).toLowerCase().replace(/[^a-z0-9]/g, ''); }, w0 = cl(String(phrase || '').split(/\s+/)[0]);
    for (var i = 0; w0 && i < words.length; i++) if (cl(words[i]) === w0) return i;
    return words.length - 1;
  }
  function diagramOf(e) {
    var b = e.beat, d = b.diagram; if (d && d.nodes) return d;
    var W = e.say.words, last = Math.max(0, W.length - 1), g = e.g;
    var claim = (b.claimId && e.beats) ? e.beats.filter(function (x) { return x.id === b.claimId; })[0] : null;
    var N = function (id, x, label, sh, word) { return { id: id, x: x, y: 0.8, label: label, shape: sh, word: word }; }, E = function (from, to, kind, word) { return { from: from, to: to, kind: kind, word: word }; };
    if (g === 'hook' && b.plant) return { nodes: [N('p', 0.5, b.plant, 'pill', wordIndex(W, b.plant))], edges: [E('p', null, 'underline', last)] };
    if (b.returns) return { nodes: [N('r', 0.5, b.returns, 'pill', wordIndex(W, b.returns))], edges: [E('r', null, 'bracket', last)] };
    if (claim) return { nodes: [N('c', 0.24, claim.plant || claim.label || 'claim', 'pill', 0), N('b', 0.76, b.label || 'proof', 'pill', last)], edges: [E('c', 'b', 'arrow', last)] };
    if (e.prev && g !== 'breather' && g !== 'landing') return { nodes: [N('a', 0.24, e.prev.label || 'before', 'dot', 0), N('b', 0.76, b.label || '', 'pill', last)], edges: [E('a', 'b', 'arrow', Math.max(0, last - 1)), E('b', null, 'underline', last)] };
    return { nodes: [], edges: [] };
  }
  function diagram(e, C, out, mz) {
    var d = diagramOf(e), T = e.say, byId = {}, order = [], n = 0;
    var box = function (nd) { var lab = String(nd.label || ''), dot = nd.shape === 'dot'; return { x: nd.x * LW, y: nd.y * LH, w: dot ? 10 : Math.max(22, mz(lab, 8.5) + 16), h: dot ? 10 : 18, lab: lab }; };
    (d.nodes || []).forEach(function (nd) { byId[nd.id] = nd; order.push({ k: 'node', o: nd, w: nd.word || 0, x: nd.x }); });
    (d.edges || []).forEach(function (eg) { order.push({ k: 'edge', o: eg, w: eg.word || 0, x: (byId[eg.from] || { x: 0 }).x }); });
    order.sort(function (p, q) { return p.w - q.w || p.x - q.x; }); // by supported word, then left→right
    order.forEach(function (it) {
      var tw = T.at(it.w), p = ramp(e.t, tw - T.D, tw), id = 'dg' + (n++);
      if (p <= 0) return;
      if (it.k === 'node') {
        var nd = it.o, bx = box(nd), sc = Math.max(0.001, pop(p));
        if (nd.shape === 'dot') { circle(out, id, 'front', bx.x, bx.y, 5 * sc, { fill: C.h, stroke: C.c, lw: 1.4 }); text(out, id + 't', 'front', bx.lab, bx.x, bx.y + 13 * sc, 7.5 * sc, C.ink); }
        else { shape(out, 'rrect', id, 'front', bx.x, bx.y, bx.w * sc, bx.h * sc, { r: 9 * sc, fill: col(C.a, 0.92), stroke: C.c, lw: 1.4 }); text(out, id + 't', 'front', bx.lab, bx.x, bx.y + 0.5, 8.5 * sc, C.ink); }
        return;
      }
      var eg = it.o, A = byId[eg.from], B = byId[eg.to], ba = A ? box(A) : null, bb = B ? box(B) : null, k = glaser(p);
      if (eg.kind === 'arrow' && ba && bb) {
        var dir = bb.x > ba.x ? 1 : -1, x1 = ba.x + dir * (ba.w / 2 + 4), x2 = bb.x - dir * (bb.w / 2 + 4), y1 = ba.y, y2 = bb.y, mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 12;
        path(out, id, 'front', [[x1, y1], [mx, my], [x2, y2]], { curved: true, stroke: C.c, lw: 2, e: k });
        if (k > 0.85) { // head arrives exactly as the word lands
          var hs = 7 * pop(ramp(k, 0.85, 1)), ang = Math.atan2(y2 - my, x2 - mx), hx = lerp(x1, x2, k), hy = lerp(y1, y2, k);
          path(out, id + 'h', 'front', [[hx, hy], [hx - hs * Math.cos(ang - 0.55), hy - hs * Math.sin(ang - 0.55)], [hx - hs * Math.cos(ang + 0.55), hy - hs * Math.sin(ang + 0.55)]], { closed: true, fill: C.h, stroke: C.c, lw: 1.2 });
        }
        if (eg.label) text(out, id + 'l', 'front', eg.label, mx, my - 7, 7, col(C.ink, 0.75 * k));
      } else if (eg.kind === 'underline' && ba) {
        var ux = ba.x - ba.w / 2, uy = ba.y + ba.h / 2 + 5, pts = [];
        for (var i = 0; i <= 6; i++) pts.push([ux + ba.w * i / 6, uy + (e.rnd() - 0.5) * 1.6]); // seeded wobble
        path(out, id, 'front', pts, { stroke: C.h, lw: 2.2, e: k });
      } else if (eg.kind === 'bracket' && ba) {
        var L = ba.x - ba.w / 2 - 6, R = ba.x + ba.w / 2 + 6, Tp = ba.y - ba.h / 2 - 5, Bt = ba.y + ba.h / 2 + 5;
        path(out, id, 'front', [[L + 6, Tp], [L, Tp], [L, Bt], [L + 6, Bt]], { stroke: C.c, lw: 1.6, e: k }); path(out, id + 'r', 'front', [[R - 6, Tp], [R, Tp], [R, Bt], [R - 6, Bt]], { stroke: C.c, lw: 1.6, e: k });
      }
    });
    return d;
  }

  // ---------- (B3) rolling counter: eased value, odometer digits, visible G11 "moves because" (MovementOk) tag ----------
  function counter(e, C, out, mz) {
    var c = e.beat.counter; if (!c) return null;
    var T = e.say, w = c.word == null ? T.n - 1 : c.word, tw = T.at(w), k = glaser(ramp(e.t, tw - Math.max(0.5, T.D * 2), tw));
    if (k <= 0) return null;
    var from = Number(c.from) || 0, to = Number(c.to) || 0, dec = c.decimals || 0, v = from + (to - from) * k;
    var cx = (c.x == null ? 0.5 : c.x) * LW, cy = (c.y == null ? 0.3 : c.y) * LH, H = 26, CW = 15, str = Math.abs(v).toFixed(dec), ndig = str.replace('.', '').length, width = str.length * CW;
    var unit = c.unit ? String(c.unit) : '', uw = unit ? mz(unit, 9) + 4 : 0, x0 = cx - (width + uw) / 2, colI = 0;
    shape(out, 'rrect', 'ct', 'front', cx, cy, width + uw + 10, H + 8, { r: 6, fill: col(C.a, 0.85), stroke: C.c, lw: 1.2 });
    for (var i = 0; i < str.length; i++) {
      var ch = str[i], x = x0 + i * CW + CW / 2;
      if (ch === '.') { text(out, 'ct.' + i, 'front', '.', x, cy + 6, 16, C.ink); continue; }
      var powIdx = ndig - 1 - colI, scale = Math.pow(10, powIdx - dec), colVal = (Math.abs(v) / scale) % 10, d = Math.floor(colVal + 1e-9);
      var roll = powIdx === 0 ? (colVal - d) : ramp((Math.abs(v) % scale) / scale, 0.85, 1); // higher columns flip as lower ones wrap
      var kids = []; text(kids, 'ctd' + i, 'front', d, x, cy - roll * H, 16, C.ink); text(kids, 'ctn' + i, 'front', (d + 1) % 10, x, cy + (1 - roll) * H, 16, C.ink);
      out.push({ k: 'clip', id: 'ctc' + i, pass: 'front', x: x, y: cy, w: CW, h: H, kids: kids }); colI++;
    }
    if (v < 0) text(out, 'ct-', 'front', '−', x0 - 8, cy, 16, C.ink);
    if (unit) text(out, 'ctu', 'front', unit, x0 + width + 4, cy + 1, 9, C.c, { al: 'left' });
    if (c.label) text(out, 'ctl', 'front', c.label, cx, cy - H / 2 - 12, 9, C.ink, { f: SANS, w: 600 });
    var why = 'moves because: ' + String(c.because || e.beat.because || (e.hinge === 'BUT' ? 'but the picture changed' : 'so the picture changed'));
    text(out, 'ctw', 'front', '↳ ' + why, cx, cy + H / 2 + 12, 7, col(C.ink, Math.min(1, k * 1.1)), { w: 400 });
    return v;
  }

  // ---------- (B4) attention: ONE spotlight per frame, dims the rest, travels from the previous beat's focus ----------
  function spotlight(e, C, out) {
    var cur = focusOf(e), pf = e.prev ? focusOf(e, e.prev, true) : cur, m = glaser(ramp(e.t, e.t0, e.t0 + Math.min(0.4, e.len * 0.3)));
    var f = { x: lerp(pf.x, cur.x, m), y: lerp(pf.y, cur.y, m), r: lerp(pf.r, cur.r, m), dim: e.beat.dim != null ? e.beat.dim : (e.g === 'breather' ? 0.08 : e.g === 'landing' ? 0 : 0.22) };
    out.push({ k: 'spot', id: 'sp', pass: 'front', x: f.x, y: f.y, r: f.r * 1.9, ink: C.ink, dim: f.dim }); // exactly one per frame (dim 0 ⇒ invisible)
    if (f.dim > 0.001) circle(out, 'spr', 'front', f.x, f.y, f.r, { stroke: col(C.h, 0.55), lw: 1, dash: [3, 5] });
    return f;
  }

  // ---------- (A3 × B) kinetic typography: the `say` line draws on letter by letter, each word completing exactly at
  // at(word) (the diagram's clock), tracking tightening 11→7.4 px on the Glaser curve; the spotlight governs its
  // brightness (one hot spot per frame); hidden when captions are covered (G11) ----------
  function kinetic(e, C, out, focus, mz) {
    // D3 (EVAL-v9): sentence case in the body face at the body size (index.html body = 14 px at 1x), wrapped onto a
    // paper plate; words land one by one on at(word) so the diagram clock is unchanged.
    if (e.covered || !e.say.say) return;
    mz = mz || fallbackMeasure;
    var T = e.say, size = SAY_PX, maxW = LW - 56, gap = mz(' ', size, SANS), lines = [[]], lw = [0], dimK = 1 - (focus ? focus.dim : 0);
    T.words.forEach(function (w, wi) {
      var ww = mz(w, size, SANS), k = lines.length - 1, add = (lines[k].length ? gap : 0) + ww;
      if (lines[k].length && lw[k] + add > maxW) { lines.push([]); lw.push(0); k++; add = ww; }
      lines[k].push({ w: w, wi: wi, x: lw[k] + (lines[k].length ? gap : 0), ww: ww }); lw[k] += add;
    });
    var lh = size * 1.3, x0 = 24, yLast = LH - 26, y0 = yLast - (lines.length - 1) * lh, bw = Math.max.apply(null, lw) + 20, bh = lines.length * lh + 10;
    var plateK = glaser(ramp(e.t, T.start - 0.12, T.start + 0.08));
    shape(out, 'rrect', 'typlate', 'front', x0 - 10 + bw / 2, y0 - size * 0.5 - 5 + bh / 2, bw, bh, { r: 6, fill: col(C.paper, 0.9), op: plateK * dimK });
    lines.forEach(function (ln, li) {
      ln.forEach(function (it) {
        var k = glaser(ramp(e.t, T.at(it.wi) - T.D, T.at(it.wi)));
        if (k > 0) text(out, 'ty' + it.wi, 'front', it.w, x0 + it.x, y0 + li * lh + (1 - k) * 6, size, col(C.ink, k), { al: 'left', f: SANS, w: 600, op: (0.25 + 0.75 * k) * dimK });
      });
    });
    path(out, 'tyrule', 'front', [[x0, yLast + size * 0.6], [x0 + lw[lines.length - 1], yLast + size * 0.6]], { stroke: C.focus(e.focusRole), lw: 1.6, op: 0.9 * dimK, e: glaser(ramp(e.t, T.start, T.end)) });
  }

  // ---------- (B5) end-card lock-up: title + claim + callback mark, Glaser overshoot ----------
  function endcard(e, C, out, mz) {
    if (!e.isLast && e.g !== 'landing') return false;
    var u0 = e.t0 + e.len * 0.42, s = e.len * 0.12, hookB = e.beats ? e.beats[0] : null, claimB = e.beats ? (e.beats.filter(function (b) { return b.grammar === 'claim'; })[0] || e.beats[1]) : null;
    var title = e.title || e.say.say, claim = String((claimB && claimB.say) || ''), mark = String((hookB && hookB.plant) || e.beat.returns || '');
    var k1 = pop(ramp(e.t, u0, u0 + s)), k2 = pop(ramp(e.t, u0 + s * 0.8, u0 + s * 1.8)), k3 = pop(ramp(e.t, u0 + s * 1.6, u0 + s * 2.6)), cx = LW / 2, cy = LH * 0.46;
    if (k1 <= 0) return false;
    shape(out, 'rrect', 'ec', 'front', cx, cy + 8, 300 * Math.max(0.001, k1), 112, { r: 10, fill: col(C.paper, 0.94), stroke: C.c, lw: 1.4 });
    text(out, 'ect', 'front', title, cx, cy - 22 + (1 - k1) * 24, 19, col(C.ink, k1), { f: SERIF, w: 600, s: 'italic' });
    path(out, 'ecr', 'front', [[cx - 120 * k1, cy], [cx + 120 * k1, cy]], { stroke: C.h, lw: 2 });
    if (k2 > 0) text(out, 'ecc', 'front', claim, cx, cy + 18 + (1 - k2) * 10, 10, col(C.ink, 0.85 * k2), { f: SANS, w: 600 });
    if (k3 > 0 && mark) { // callback mark: the plant, ringed
      var sc = Math.max(0.001, k3), mx = cx - (mz(mark, 8.5) / 2 + 10) * sc, my = cy + 44;
      circle(out, 'ecd', 'front', mx, my, 4 * sc, { fill: C.h }); circle(out, 'ecg', 'front', mx, my, 7 * sc, { stroke: C.c, lw: 1.2 });
      text(out, 'ecm', 'front', mark, cx + 4 * sc, my + 0.5, 8.5 * sc, C.ink);
    }
    return true;
  }

  // ---------- scene = pure data. z-order back: parallax → cutouts → ribbons; front: spotlight → diagram →
  // counter → kinetic say → end-card → transition curtain ----------
  function fallbackMeasure(s, size) { return String(s).length * 6.4 * (size / 8.5); } // B's 6.4 px/char, only when no ctx can measure
  function measurer(ctx) {
    if (!ctx || typeof ctx.measureText !== 'function') return fallbackMeasure;
    return function (s, size, fam) { try { ctx.font = '700 ' + size + 'px ' + (fam || MONO); var w = ctx.measureText(String(s)).width; return w >= 0 && isFinite(w) ? w : fallbackMeasure(s, size); } catch (_e) { return fallbackMeasure(s, size); } };
  }
  function scene(T, beat, palette, seed, P, opts, mz) {
    var e = env(T, beat, palette, seed, P, opts), C = e.C, out = []; mz = mz || fallbackMeasure;
    parallax(e, C, out); cutouts(e, C, out); ribbons(e, C, out);
    var focus = spotlight(e, C, out), dg = diagram(e, C, out, mz), cv = counter(e, C, out, mz);
    kinetic(e, C, out, focus, mz); var ec = endcard(e, C, out, mz), tr = transition(e, C, out);
    return { e: e, C: C, items: out, meta: { focus: focus, spotlights: 1, diagram: dg, counter: cv, endcard: ec, transition: tr, say: e.say.words.slice(0, e.say.shown(e.t)).join(' ') } };
  }
  function audit(T, beat, palette, seed, P, opts) { // G31 hook: every fill/stroke/gradient must come from the Wada combination
    var sc = scene(T, beat, palette, seed, P, opts), bad = [], ok = sc.C.allowed;
    var chk = function (d) { [d.fill, d.stroke, d.ink].forEach(function (c) { var h = toHex(c); if (h && ok.indexOf(h) < 0) bad.push(d.id + ':' + c); }); (d.kids || []).forEach(chk); };
    sc.items.forEach(chk);
    return { ok: bad.length === 0, offPalette: bad, count: sc.items.length, spotlights: sc.items.filter(function (d) { return d.k === 'spot'; }).length };
  }

  // ---------- two.js applier: offscreen canvas stage, rebuilt from the scene on every call ----------
  function isAvailable() { var Two = root.Two; return !S.disposed && typeof Two === 'function' && !!(Two.Types && Two.Types.canvas) && !!root.document && typeof root.document.createElement === 'function'; }
  function ensure() {
    if (S.two) return S.two;
    if (!isAvailable()) return null;
    try {
      var cv = root.document.createElement('canvas'); cv.width = LW; cv.height = LH;
      S.two = new root.Two({ type: root.Two.Types.canvas, domElement: cv, width: LW, height: LH, ratio: 1, autostart: false });
    } catch (_e) { S.two = null; }
    return S.two;
  }
  function build(two, d) {
    var o, Two = root.Two;
    if (d.k === 'circle') { o = two.makeCircle(d.x, d.y, Math.max(0.01, d.r)); }
    else if (d.k === 'rect') { o = two.makeRectangle(d.x, d.y, d.w, d.h); }
    else if (d.k === 'rrect') { o = two.makeRoundedRectangle(d.x, d.y, Math.max(0.01, d.w), Math.max(0.01, d.h), d.r); }
    else if (d.k === 'text') { o = two.makeText(d.v, d.x, d.y, { family: d.family, size: Math.max(0.5, d.size), weight: d.weight, style: d.style, alignment: d.align, baseline: 'middle' }); }
    else if (d.k === 'spot') {
      o = two.makeRectangle(LW / 2, LH / 2, LW, LH); o.noStroke();
      var g = two.makeRadialGradient(d.x - LW / 2, d.y - LH / 2, d.r, new Two.Stop(0, col(d.ink, 0)), new Two.Stop(0.52, col(d.ink, 0)), new Two.Stop(1, col(d.ink, d.dim)));
      g.units = 'userSpaceOnUse'; o.fill = g; return o;
    } else if (d.k === 'clip') {
      o = two.makeGroup(); o.mask = new Two.Rectangle(d.x, d.y, d.w, d.h);
      d.kids.forEach(function (kd) { o.add(build(two, kd)); }); return o;
    } else { var flat = []; d.pts.forEach(function (p) { flat.push(p[0], p[1]); }); flat.push(!d.closed); o = two.makePath.apply(two, flat); o.curved = !!d.curved; o.automatic = true; o.beginning = d.b || 0; o.ending = d.e; }
    if (d.fill) o.fill = d.fill; else o.noFill();
    if (d.stroke) { o.stroke = d.stroke; o.linewidth = d.lw || 1; } else o.noStroke();
    if (d.k !== 'text') { o.cap = 'round'; o.join = 'round'; if (d.dash) o.dashes = d.dash; }
    else if (d.stroke) o.linewidth = d.lw;
    o.opacity = d.op;
    return o;
  }

  /** renderFrame(ctx2d, T, beat, palette, seed, P, opts?) — P = engine prep(pal) {paper,ink,a,h,b,c}; opts = {pass:'back'|'front'|'all',
   *  sheet?, prevBeat?, reduced?, captionsCovered?, alpha?, title?}. Returns false when nothing was composited, else the scene meta. */
  function renderFrame(ctx, T, beat, palette, seed, P, opts) {
    if (!ctx || typeof ctx.drawImage !== 'function') return false;
    var two = ensure(); if (!two) return false;
    var o = opts || {}, pass = o.pass || 'all';
    try {
      var sc = scene(T, beat, palette, seed, P, o, measurer(two.renderer && two.renderer.ctx));
      two.clear();
      for (var i = 0; i < sc.items.length; i++) if (pass === 'all' || sc.items[i].pass === pass) build(two, sc.items[i]);
      two.update(); // manual update: the stage is a function of t, never a running loop (G06)
      ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = o.alpha != null ? clamp(o.alpha, 0, 1) : S.alpha;
      ctx.drawImage(two.renderer.domElement, 0, 0, LW, LH); ctx.restore();
      sc.meta.pass = pass; return sc.meta;
    } catch (_e) { try { two.clear(); } catch (_e2) { /* ignore */ } return false; }
  }

  // ---------- lifecycle: init({inline}) hook for the zero-dependency Standalone, cdn loader for the modular build ----------
  function fire(ok) { S.ready = ok; S.loading = false; var cbs = S.cbs; S.cbs = []; cbs.forEach(function (cb) { try { cb(ok); } catch (_e) { /* ignore */ } }); }
  function adopt(inline) { // inline: a function returning Two (or defining window.Two), or the two.min.js source text
    if (typeof root.Two === 'function') return true;
    try { if (typeof inline === 'function') { var T = inline(); if (typeof T === 'function') root.Two = T; } else if (typeof inline === 'string' && inline.length) (new Function(inline))(); } catch (_e) { /* ignore */ }
    return typeof root.Two === 'function';
  }
  function init(opts) {
    opts = opts || {}; S.disposed = false;
    if (opts.reduced != null || opts.reducedMotion != null) S.reduced = !!(opts.reduced != null ? opts.reduced : opts.reducedMotion);
    else { try { S.reduced = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (_e) { S.reduced = false; } }
    if (opts.captionsCovered != null) S.covered = !!opts.captionsCovered;
    if (opts.alpha != null) S.alpha = clamp(Number(opts.alpha), 0, 1);
    if (typeof opts.cdn === 'string') S.cdn = opts.cdn;
    if (typeof opts.onReady === 'function') S.cbs.push(opts.onReady);
    adopt(opts.inline != null ? opts.inline : root.__TWO_INLINE_SRC);
    if (isAvailable()) { fire(true); return !!ensure(); }
    if (opts.cdn === false || !root.document || !root.document.head) { fire(false); return false; }
    if (S.loading) return false;
    try {
      S.loading = true; var sc = root.document.createElement('script'); sc.async = true; sc.src = S.cdn;
      sc.onload = function () { fire(isAvailable()); }; sc.onerror = function () { fire(false); };
      root.document.head.appendChild(sc);
    } catch (_e) { fire(false); }
    return false;
  }
  function load(o) { // Promise<boolean>; resolves true once `Two` is usable, false when the layer stays a silent no-op
    o = o || {};
    return new Promise(function (res) {
      if (isAvailable() || adopt(o.inline != null ? o.inline : root.__TWO_INLINE_SRC)) { S.disposed = false; return res(isAvailable()); }
      if (o.cdn === false || !root.document || typeof root.document.createElement !== 'function') return res(false);
      S.cbs.push(res); if (!init({ cdn: o.cdn })) { if (!S.loading) res(false); }
    });
  }
  function onReady(cb) { if (typeof cb !== 'function') return; if (S.ready) cb(true); else S.cbs.push(cb); }
  function dispose() { // idempotent: releases the stage; the layer is a no-op until init()/load() runs again
    try { if (S.two) { S.two.clear(); if (S.two.release) S.two.release(); } } catch (_e) { /* ignore */ }
    S.two = null; S.ready = S.loading = false; S.cbs = []; S.disposed = true;
  }

  var API = {
    VERSION: VERSION, CDN_URL: CDN_URL, LW: LW, LH: LH,
    init: init, load: load, onReady: onReady, renderFrame: renderFrame, isAvailable: isAvailable, audit: audit, dispose: dispose,
    modules: { ribbons: ribbons, cutouts: cutouts, parallax: parallax, kinetic: kinetic, transition: transition, diagram: diagram, counter: counter, spotlight: spotlight, endcard: endcard,
      scene: scene, env: env, sayTiming: sayTiming, relation: relation, reverse: reverse, focusOf: focusOf, diagramOf: diagramOf, beatAt: beatAt, rungShape: rungShape, paletteLock: lockPalette, measurer: measurer },
    ease: { glaser: glaser, pop: pop, swash: swash, rest: rest }
  };
  root.TWO_LAYER = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
