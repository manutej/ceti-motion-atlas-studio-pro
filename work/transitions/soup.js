/* TRANS soup — lane `transitions`, round 2. Merge of cand-A, cand-B, cand-C (provenance: MERGE-NOTES.md).
 * Masks open/close on the incoming beat's single hot spot (B); cut windows carry C's hold length;
 * other windows are one beat of the incoming feel (A, B). Pure: f(beats, tokens, seed). No clocks,
 * no randomness, no frame loop, no stored state. Tokens are read by role only.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.TRANS = api;
  else if (root) root.TRANS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var VERSION = 'soup-r2-ABC';
  var SECONDS_PER_MINUTE = 60;   // unit conversion bpm -> seconds per beat (A, B); not a tempo value
  var THIRD = 1 / 3, HALF = 1 / 2;
  var ARC = 48;                  // iris polygon sides (geometry, not timing)
  var CHEVRON = THIRD / 2;       // wipe leading-edge depth, fraction of width (B)
  var BISECT = 32;               // bezier inversion steps; used only when tokens.motion supplies a curve
  var MAX_WORDS = 14;
  var KINDS = ['cut', 'wipe', 'split', 'iris', 'iris-back', 'wipe-back'];
  var REVERSE = { cut: 'cut', wipe: 'wipe-back', 'wipe-back': 'wipe', iris: 'iris-back', 'iris-back': 'iris', split: 'split' };

  // relation -> kind (ledger E2: direction encodes relation; callback = the hook's mask reversed)
  var table = {
    hook: 'wipe',
    'cause→effect': 'wipe',
    contrast: 'split',
    'zoom-in': 'iris',
    breather: 'cut',
    callback: null,
    landing: 'iris-back'
  };
  table.callback = REVERSE[table.hook];

  // Q3 relation -> because (A = bestSingle; landing provisional, see openContradictions)
  var BECAUSE = {
    hook: 'attention', 'zoom-in': 'attention', 'cause→effect': 'continuity', callback: 'continuity',
    contrast: 'change', breather: 'character', landing: 'change'
  };

  // Q9 sentence per relation ({A} outgoing, {B} incoming, {M} motif), clipped to 14 words (B)
  var TEMPLATE = {
    hook: '{B} opens the question; the reveal starts from its hot spot.',
    'cause→effect': '{A} leads to {B}; the reveal runs forward into its focus.',
    contrast: '{B} answers {A} by contrast; the frame splits at the difference.',
    'zoom-in': '{B} looks closer at {A}; the iris opens on its detail.',
    breather: '{A} settles into {B}; a hard cut lets the eye rest.',
    callback: '{B} returns to the planted {M}; the opening mask runs backwards.',
    landing: '{B} lands what {A} began; the iris closes onto one point.'
  };

  // grammar -> feel role when a beat names none (B; provisional, see openContradictions)
  var FEEL_BY_GRAMMAR = { hook: 'saul', claim: 'glaser', proof: 'beat', breather: 'rest', callback: 'rostrum', landing: 'slow' };

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function num(v) { return typeof v === 'number' && isFinite(v); }
  function unit(u) { return clamp(num(+u) ? +u : 0, 0, 1); }
  function hash(s) {             // FNV-1a 32-bit, deterministic seed mixing (B)
    var h = 2166136261 >>> 0; s = String(s);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function clipWords(s) { return String(s).trim().split(/\s+/).filter(Boolean).slice(0, MAX_WORDS).join(' '); }
  function nameOf(b) { return (b && (b.label || b.grammar || b.id)) || 'the beat'; }

  // ---------- relation inference (CONTRACT §Relation inference + lane tie-breaks) ----------
  var BUT = /^\s*but\b/i, ZOOM = /\bzoom|push[- ]in/i;
  function butOf(b) { return BUT.test(b.say || '') || /^but$/i.test(String(b.hinge || '')); }
  function camText(b) { return [b.show, b.cameraMove, b.visualAction].filter(Boolean).join(' '); }
  function relationOf(a, b) {
    if (!a) return 'hook';                                   // A: entry before beat 1
    b = b || {};
    if (b.grammar === 'breather') return 'breather';
    if (b.grammar === 'landing') return 'landing';
    if (b.grammar === 'callback' || b.returns) return 'callback';
    if ((a.grammar === 'proof' && b.grammar === 'proof' && a.claimId !== b.claimId) || butOf(b)) return 'contrast';
    if (ZOOM.test(camText(b))) return 'zoom-in';             // below breather/callback/landing, above default
    return 'cause→effect';
  }

  // ---------- focus: the single hot spot of a beat (B) ----------
  var CUES = [
    [/\bleft\b/, 'x', THIRD],
    [/\bright\b/, 'x', 2 * THIRD],
    [/\b(between|centre|center|middle|adapter)\b/, 'x', HALF],
    [/\b(bubble|thought|sky|above|top)\b/, 'y', THIRD],
    [/\b(ground|floor|corner|bottom|drawer)\b/, 'y', 2 * THIRD]
  ];
  var GX = { hook: THIRD, claim: HALF, proof: 2 * THIRD, breather: HALF, callback: HALF, landing: HALF };
  function cueFocus(b, seed) {
    var g = b.grammar, x = num(GX[g]) ? GX[g] : HALF, y = HALF, gotX = false, gotY = false;
    if (g === 'proof' && (hash(String(seed == null ? '' : seed) + '|' + b.id) & 1)) x = THIRD;
    var t = String(b.show || '').toLowerCase();
    for (var i = 0; i < CUES.length; i++) {
      var c = CUES[i];
      if (!c[0].test(t)) continue;
      if (c[1] === 'x' && !gotX) { x = c[2]; gotX = true; }
      if (c[1] === 'y' && !gotY) { y = c[2]; gotY = true; }
    }
    return { x: x, y: y };
  }
  function beatsOf(ctx) { return (ctx && ((ctx.board && ctx.board.beats) || ctx.beats)) || null; }
  function focusOf(b, ctx, depth) {
    b = b || {}; depth = depth || 0;
    if (b.focus && num(b.focus.x) && num(b.focus.y)) return { x: clamp(b.focus.x, 0, 1), y: clamp(b.focus.y, 0, 1) };
    var beats = beatsOf(ctx), i;
    if (beats && depth < 2) {
      if (b.returns) for (i = 0; i < beats.length; i++) if (beats[i].plant === b.returns && beats[i].id !== b.id) return focusOf(beats[i], ctx, depth + 1);
      if (b.grammar === 'landing') for (i = 0; i < beats.length; i++) if (beats[i].grammar === 'hook' && beats[i].id !== b.id) return focusOf(beats[i], ctx, depth + 1);
    }
    return cueFocus(b, ctx && ctx.seed);
  }

  // ---------- tokens: feel, tempo, ease ----------
  function feelsOf(tokens) { return (tokens && tokens.motion && tokens.motion.feels) || {}; }
  function feelOf(b, tokens) {
    var feels = feelsOf(tokens), want = (b && b.feel) || FEEL_BY_GRAMMAR[b && b.grammar];
    if (want && Object.prototype.hasOwnProperty.call(feels, want)) return want;
    var keys = Object.keys(feels);
    return keys.length ? keys[0] : null;
  }
  function tempoOf(tokens) {
    var t = (tokens && tokens.tempo) || {}, r = t.range || [];
    var lo = num(r[0]) ? r[0] : null, hi = num(r[r.length - 1]) ? r[r.length - 1] : lo;
    return { lo: lo, hi: hi, by: t.byFeel || {} };
  }
  function bpmOf(feel, tokens) {
    var T = tempoOf(tokens), v = num(T.by[feel]) ? T.by[feel] : T.lo;
    if (!num(v)) return null;
    return (num(T.lo) && num(T.hi)) ? clamp(v, T.lo, T.hi) : v;
  }
  // C: hold ratio in (0,1] = slowest tempo / this feel's tempo; applied to `cut` only
  function holdRatio(feel, tokens) {
    var T = tempoOf(tokens), bpm = bpmOf(feel, tokens);
    if (!num(T.lo) || !num(bpm) || bpm <= 0) return 1;
    return Math.min(1, T.lo / bpm);
  }
  function relationWeight(rel, tokens) {
    if (rel === 'breather' || rel === 'landing' || rel === 'callback' || rel === 'zoom-in') return 1;
    var T = tempoOf(tokens);
    return (num(T.lo) && num(T.hi) && T.hi > 0) ? T.lo / T.hi : 1;
  }
  // ease only from tokens.motion.feels[feel].ease|bezier; monotone 4-tuples only (CONTRACT: coverage monotone)
  function ease(feel, u, tokens) {
    u = unit(u);
    var f = feelsOf(tokens)[feel], e = f && (f.ease || f.bezier);
    if (!Array.isArray(e) || e.length !== 4 || !e.every(num)) return u;
    var x1 = e[0], y1 = e[1], x2 = e[2], y2 = e[3];
    if (!(x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1 && y1 >= 0 && y1 <= y2 && y2 <= 1)) return u;
    function bz(p1, p2, t) { var s = 1 - t; return 3 * s * s * t * p1 + 3 * s * t * t * p2 + t * t * t; }
    var lo = 0, hi = 1;
    for (var i = 0; i < BISECT; i++) { var mid = (lo + hi) * HALF; if (bz(x1, x2, mid) < u) lo = mid; else hi = mid; }
    return clamp(bz(y1, y2, (lo + hi) * HALF), 0, 1);
  }

  function durFor(kind, rel, a, b, tokens) {
    var lim = Math.min(num(a.dur) ? a.dur : Infinity, num(b.dur) ? b.dur : Infinity), feel = feelOf(b, tokens), d;
    if (lim === Infinity) lim = 0;
    if (kind === 'cut') d = lim * holdRatio(feel, tokens) * relationWeight(rel, tokens);
    else {
      var bpm = bpmOf(feel, tokens);
      d = num(bpm) && bpm > 0 ? SECONDS_PER_MINUTE / bpm : lim;
      if (num(a.dur)) d = Math.min(d, a.dur);
      if (num(b.dur)) d = Math.min(d, b.dur);
    }
    return num(d) && d > 0 ? d : 0;
  }

  function semanticFor(rel, a, b) {
    var s = TEMPLATE[rel] || TEMPLATE['cause→effect'];
    return clipWords(s.replace('{A}', nameOf(a)).replace('{B}', nameOf(b)).replace('{M}', (b && b.returns) || 'motif'));
  }

  // ---------- API: transitionFor ----------
  function transitionFor(fromBeat, toBeat, tokens, ctx) {
    var rel = relationOf(fromBeat, toBeat), a = fromBeat || {}, b = toBeat || {}, kind = table[rel];
    var d = durFor(kind, rel, a, b, tokens), s = num(b.start) ? b.start : 0;
    var out = {
      kind: kind,
      semantic: semanticFor(rel, a, b),
      t0: s - d * HALF,
      t1: s + d * HALF,
      relation: rel,
      because: BECAUSE[rel],
      feel: feelOf(b, tokens),
      from: a.id, to: b.id
    };
    if (kind !== 'cut') out.focus = focusOf(b, ctx);   // one hot spot; a cut opens nothing
    return out;
  }

  // board -> beats with start/dur filled (uniform split of totalDurationSec when absent)
  function normalize(board) {
    var beats = (board && board.beats) || [], n = beats.length, total = board && board.totalDurationSec, acc = 0;
    return beats.map(function (b) {
      var dur = num(b.dur) && b.dur >= 0 ? b.dur : (num(total) && n ? total / n : 0);
      var start = num(b.start) ? b.start : acc;
      acc = start + dur;
      var o = {}; for (var k in b) if (Object.prototype.hasOwnProperty.call(b, k)) o[k] = b[k];
      o.start = start; o.dur = dur;
      return o;
    });
  }
  function plan(board, tokens, seed) {
    var beats = normalize(board), ctx = { beats: beats, seed: seed }, out = [];
    for (var i = 1; i < beats.length; i++) out.push(transitionFor(beats[i - 1], beats[i], tokens, ctx));
    return out;
  }
  function schedule(board, tokens, seed) { return { beats: normalize(board), transitions: plan(board, tokens, seed) }; }

  // ---------- geometry (B) ----------
  function poly(pts) {
    var c = [];
    for (var i = 0; i < pts.length; i++) c.push([i ? 'L' : 'M', pts[i][0], pts[i][1]]);
    c.push(['Z']);
    return c;
  }
  function seedPt(fx, fy) { return [['M', fx, fy], ['Z']]; }   // zero-area origin: the mask is born at the focus
  function rectPts(w, h, x0, x1) { return [[x0, 0], [x1, 0], [x1, h], [x0, h]]; }
  function circlePts(cx, cy, r) {
    var R = r / Math.cos(Math.PI / ARC), pts = [];
    for (var i = 0; i < ARC; i++) { var t = (2 * Math.PI * i) / ARC; pts.push([cx + R * Math.cos(t), cy + R * Math.sin(t)]); }
    return pts;
  }
  function clipEdge(pts, inside, cross) {
    var out = [];
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i], q = pts[(i + 1) % pts.length], pi = inside(p), qi = inside(q);
      if (pi) out.push(p);
      if (pi !== qi) out.push(cross(p, q));
    }
    return out;
  }
  function clipRect(pts, w, h) {
    function lx(x) { return function (p, q) { var t = (x - p[0]) / (q[0] - p[0]); return [x, p[1] + t * (q[1] - p[1])]; }; }
    function ly(y) { return function (p, q) { var t = (y - p[1]) / (q[1] - p[1]); return [p[0] + t * (q[0] - p[0]), y]; }; }
    pts = clipEdge(pts, function (p) { return p[0] >= 0; }, lx(0));
    pts = clipEdge(pts, function (p) { return p[0] <= w; }, lx(w));
    pts = clipEdge(pts, function (p) { return p[1] >= 0; }, ly(0));
    pts = clipEdge(pts, function (p) { return p[1] <= h; }, ly(h));
    return pts;
  }
  function reach(fx, fy, w, h) {
    return Math.max(Math.hypot(fx, fy), Math.hypot(w - fx, fy), Math.hypot(fx, h - fy), Math.hypot(w - fx, h - fy));
  }

  // ---------- API: mask (closed form in u) ----------
  function mask(kind, u, focus, w, h) {
    u = unit(u); w = num(+w) && +w > 0 ? +w : 1; h = num(+h) && +h > 0 ? +h : 1;
    var f = focus || {}, fx = clamp(num(f.x) ? f.x : HALF, 0, 1) * w, fy = clamp(num(f.y) ? f.y : HALF, 0, 1) * h;
    switch (kind) {
      case 'cut':          // flips at u = 1/2, i.e. exactly at toBeat.start inside C's hold window
        return u >= HALF ? poly(rectPts(w, h, 0, w)) : seedPt(fx, fy);
      case 'wipe':
      case 'wipe-back': {  // L->R (A, E2) with a chevron tip riding the focus row (B)
        var d = w * CHEVRON, tip = clamp((w + d) * u, 0, w), cx = clamp((w + d) * u - d, 0, w);
        if (tip <= 0) return seedPt(fx, fy);
        var pts = [[0, 0], [cx, 0], [tip, fy], [cx, h], [0, h]];
        if (kind === 'wipe-back') pts = pts.map(function (p) { return [w - p[0], p[1]]; });
        return poly(pts);
      }
      case 'split':
        if (u <= 0) return seedPt(fx, fy);
        return poly(rectPts(w, h, fx * (1 - u), fx + (w - fx) * u));
      case 'iris':
        if (u <= 0) return seedPt(fx, fy);
        return poly(clipRect(circlePts(fx, fy, reach(fx, fy, w, h) * u), w, h));
      case 'iris-back': {
        var r = reach(fx, fy, w, h) * (1 - u), outer = poly(rectPts(w, h, 0, w));
        if (r <= 0) return outer;
        return outer.concat(poly(clipRect(circlePts(fx, fy, r), w, h).reverse()));
      }
      default:
        throw new Error('TRANS.mask: unknown kind ' + kind);
    }
  }

  function subpaths(cmds) {
    var subs = [], cur = null;
    for (var i = 0; i < cmds.length; i++) {
      var c = cmds[i];
      if (c[0] === 'M') { cur = [[c[1], c[2]]]; subs.push(cur); }
      else if (c[0] === 'L' && cur) cur.push([c[1], c[2]]);
    }
    return subs;
  }
  function area(pts) {
    var s = 0;
    for (var i = 0; i < pts.length; i++) { var p = pts[i], q = pts[(i + 1) % pts.length]; s += p[0] * q[1] - q[0] * p[1]; }
    return Math.abs(s) * HALF;
  }
  // exact shoelace area; first subpath is the reveal, later subpaths are holes (B)
  function coverage(kind, u, w, h, focus) {
    w = num(+w) && +w > 0 ? +w : 1; h = num(+h) && +h > 0 ? +h : 1;
    var subs = subpaths(mask(kind, u, focus, w, h)), a = 0;
    for (var i = 0; i < subs.length; i++) a += (i ? -1 : 1) * area(subs[i]);
    return clamp(a / (w * h), 0, 1);
  }

  function progress(tr, t, tokens) {
    if (!tr) return 0;
    if (!(tr.t1 > tr.t0)) return t >= tr.t0 ? 1 : 0;
    return ease(tr.feel, (t - tr.t0) / (tr.t1 - tr.t0), tokens);
  }
  function maskAt(tr, t, w, h, tokens) { return mask(tr.kind, progress(tr, t, tokens), tr.focus, w, h); }
  function active(transitions, t) {
    for (var i = 0; i < (transitions || []).length; i++) { var tr = transitions[i]; if (t >= tr.t0 && t <= tr.t1) return tr; }
    return null;
  }
  function toPathD(cmds) {
    return cmds.map(function (c) { return c[0] === 'Z' ? 'Z' : c[0] + c[1].toFixed(2) + ' ' + c[2].toFixed(2); }).join(' ');
  }

  // ---------- G31: two.js layers, strict no-op (null) without Two ----------
  function twoLib() { return (typeof Two !== 'undefined') ? Two : ((root && root.Two) || null); } // eslint-disable-line no-undef
  function anchorsOf(T, cmds) {
    var out = [];
    for (var i = 0; i < cmds.length; i++) {
      var c = cmds[i]; if (c[0] === 'Z') continue;
      var an = new T.Anchor(c[1], c[2]);
      if (T.Commands) an.command = c[0] === 'M' ? T.Commands.move : T.Commands.line;
      out.push(an);
    }
    return out;
  }
  // drawTwo(two, cmds)                          -> adds a path (B form)
  // drawTwo(two, group, tr, t, tokens, w, h)    -> sets group.mask, fill = tokens.color.paper (A form)
  function drawTwo(two, x, tr, t, tokens, w, h) {
    var T = twoLib();
    if (!T || !two || typeof T.Anchor !== 'function') return null;
    var p, anchors;
    if (Array.isArray(x)) {
      if (typeof two.add !== 'function' || typeof T.Path !== 'function') return null;
      anchors = anchorsOf(T, x); if (!anchors.length) return null;
      p = new T.Path(anchors, true, false, true);
      if (typeof p.noStroke === 'function') p.noStroke();
      two.add(p);
      return p;
    }
    if (typeof two.makePath !== 'function' || !x || !tr) return null;
    anchors = anchorsOf(T, maskAt(tr, t, w, h, tokens)); if (!anchors.length) return null;
    p = two.makePath(anchors, false);
    var paper = tokens && tokens.color && tokens.color.paper;
    if (paper) p.fill = paper;
    if (typeof p.noStroke === 'function') p.noStroke();
    x.mask = p;
    return p;
  }
  // twoLayer(two, kind, u, focus) -> path sized to the two instance (C form)
  function twoLayer(two, kind, u, focus) {
    var T = twoLib();
    if (!T || !two || typeof two.makePath !== 'function' || typeof T.Anchor !== 'function') return null;
    var anchors = anchorsOf(T, mask(kind, u, focus, two.width, two.height));
    if (!anchors.length) return null;
    var p = two.makePath(anchors, false);
    if (typeof p.noStroke === 'function') p.noStroke();
    return p;
  }

  return Object.freeze({
    VERSION: VERSION, KINDS: KINDS.slice(),
    REVERSE: Object.freeze(REVERSE), reverse: REVERSE,
    table: Object.freeze(table),
    BECAUSE: Object.freeze(BECAUSE), because: BECAUSE,
    TEMPLATE: Object.freeze(TEMPLATE), semantics: TEMPLATE,
    transitionFor: transitionFor, relationOf: relationOf, focusOf: focusOf,
    normalize: normalize, layout: normalize, plan: plan, schedule: schedule,
    mask: mask, coverage: coverage, ease: ease, progress: progress, maskAt: maskAt,
    active: active, toPathD: toPathD, drawTwo: drawTwo, twoLayer: twoLayer
  });
});
