/* cand-B — TRANS lane, round 2.
 * Lens: the mask follows the focus point. Every transition opens or closes around the
 * single hot spot of the INCOMING beat, so the eye never jumps.
 * Pure: output = f(t, seed, tokens). No clocks, no randomness, no accumulated state.
 * Tokens are read by role only (tokens.motion.feels.<name>, tokens.tempo.byFeel/range).
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TRANS_B = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function (root) {
  'use strict';

  var VERSION = 'cand-B/2.0.0';
  var SEC_PER_MIN = 60;          // unit conversion bpm -> seconds per beat (not a tempo)
  var THIRD = 1 / 3, HALF = 1 / 2;
  var ARC = 64;                  // iris polygon segment count (geometry, not timing)
  var CHEVRON = THIRD / 2;       // wipe leading-edge depth as a fraction of width
  var KINDS = ['cut', 'wipe', 'split', 'iris', 'iris-back', 'wipe-back'];
  var REVERSE = { cut: 'cut', wipe: 'wipe-back', 'wipe-back': 'wipe', iris: 'iris-back', 'iris-back': 'iris', split: 'split' };

  // relation -> kind (ledger E2: direction encodes relation)
  var table = {
    hook: 'wipe',
    'cause→effect': 'wipe',
    contrast: 'split',
    'zoom-in': 'iris',
    breather: 'cut',
    callback: null,
    landing: 'iris-back'
  };
  table.callback = REVERSE[table.hook];   // callback = the hook's mask reversed

  // Q3: relation -> because
  var BECAUSE = {
    hook: 'attention',
    'zoom-in': 'attention',
    'cause→effect': 'continuity',
    callback: 'continuity',
    contrast: 'change',
    breather: 'character',
    landing: 'character'
  };

  // Q9: sentence template per relation ({A}=outgoing, {B}=incoming, {M}=motif); <= 14 words
  var TEMPLATE = {
    hook: '{B} opens the question; the reveal starts from its hot spot.',
    'cause→effect': '{A} leads to {B}; the reveal runs forward into its focus.',
    contrast: '{B} answers {A} by contrast; the frame splits at the difference.',
    'zoom-in': '{B} looks closer at {A}; the iris opens on its detail.',
    breather: '{A} settles into {B}; a hard cut lets the eye rest.',
    callback: '{B} returns to the planted {M}; the opening mask runs backwards.',
    landing: '{B} lands what {A} began; the iris closes onto one point.'
  };
  var MAX_WORDS = 14;

  // grammar -> default feel role (used only when a beat names no feel)
  var FEEL_BY_GRAMMAR = { hook: 'saul', claim: 'glaser', proof: 'beat', breather: 'rest', callback: 'rostrum', landing: 'slow' };

  // ---------- small pure helpers ----------
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function num(v) { return typeof v === 'number' && isFinite(v); }
  function unit(u) { return clamp(num(+u) ? +u : 0, 0, 1); }
  function hash(s) {             // FNV-1a 32-bit, deterministic seed mixing
    var h = 2166136261 >>> 0; s = String(s);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function words(s) { return String(s).trim().split(/\s+/).filter(Boolean); }
  function clipWords(s) { var w = words(s); return w.length > MAX_WORDS ? w.slice(0, MAX_WORDS).join(' ') : w.join(' '); }
  function nameOf(b) { return (b && (b.label || b.grammar || b.id)) || 'the beat'; }

  // ---------- relation inference ----------
  function camText(b) { return [b.show, b.cameraMove, b.visualAction].filter(Boolean).join(' ').toLowerCase(); }
  function startsWithBut(b) { return /^\s*but\b/i.test((b && b.say) || ''); }
  function relationOf(a, b) {
    a = a || {}; b = b || {};
    if (b.grammar === 'breather') return 'breather';
    if (b.grammar === 'landing') return 'landing';
    if (b.grammar === 'callback' || b.returns) return 'callback';
    if (a.grammar === 'hook' && b.grammar === 'claim' && startsWithBut(b)) return 'contrast';
    if (a.grammar === 'proof' && b.grammar === 'proof' && a.claimId !== b.claimId) return 'contrast';
    if (/\bzoom|push-in|push in/.test(camText(b))) return 'zoom-in';
    if (startsWithBut(b)) return 'contrast';
    return 'cause→effect';
  }

  // ---------- focus: the single hot spot of a beat ----------
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
    var beats = beatsOf(ctx);
    if (beats && depth < 2) {
      if (b.returns) {          // callback: re-open on the planted motif's hot spot
        for (var i = 0; i < beats.length; i++) if (beats[i].plant === b.returns && beats[i].id !== b.id) return focusOf(beats[i], ctx, depth + 1);
      }
      if (b.grammar === 'landing') {   // landing: close onto the hook's hot spot (echo beat 1)
        for (var j = 0; j < beats.length; j++) if (beats[j].grammar === 'hook' && beats[j].id !== b.id) return focusOf(beats[j], ctx, depth + 1);
      }
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
  function bpmOf(feel, tokens) {
    var tempo = (tokens && tokens.tempo) || {}, range = tempo.range || [], by = tempo.byFeel || {};
    var lo = num(range[0]) ? range[0] : null, hi = num(range[1]) ? range[1] : lo;
    var v = num(by[feel]) ? by[feel] : lo;
    if (!num(v)) return null;
    return (num(lo) && num(hi)) ? clamp(v, lo, hi) : v;
  }
  // Ease comes only from tokens.motion.feels[feel].ease (Bezier control 4-tuple, monotone only).
  // An empty feel means linear: no easing constant ever lives in this file.
  function ease(feel, u, tokens) {
    u = unit(u);
    var f = feelsOf(tokens)[feel], e = f && (f.ease || f.bezier);
    if (!Array.isArray(e) || e.length !== 4 || !e.every(num)) return u;
    var x1 = e[0], y1 = e[1], x2 = e[2], y2 = e[3];
    if (!(x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1 && y1 >= 0 && y1 <= y2 && y2 <= 1)) return u;
    function bz(p1, p2, t) { var s = 1 - t; return 3 * s * s * t * p1 + 3 * s * t * t * p2 + t * t * t; }
    var lo = 0, hi = 1;
    for (var i = 0; i < 32; i++) { var mid = (lo + hi) / 2; if (bz(x1, x2, mid) < u) lo = mid; else hi = mid; }
    return clamp(bz(y1, y2, (lo + hi) / 2), 0, 1);
  }

  function durFor(kind, a, b, tokens) {
    if (kind === 'cut') return 0;
    var bpm = bpmOf(feelOf(b, tokens), tokens);
    var d = num(bpm) && bpm > 0 ? SEC_PER_MIN / bpm : Math.min(a.dur, b.dur);
    if (num(a.dur)) d = Math.min(d, a.dur);
    if (num(b.dur)) d = Math.min(d, b.dur);
    return num(d) && d > 0 ? d : 0;
  }

  function semanticFor(rel, a, b) {
    var s = TEMPLATE[rel] || TEMPLATE['cause→effect'];
    s = s.replace('{A}', nameOf(a)).replace('{B}', nameOf(b)).replace('{M}', (b && b.returns) || 'motif');
    return clipWords(s);
  }

  // ---------- API: transitionFor ----------
  function transitionFor(fromBeat, toBeat, tokens, ctx) {
    var a = fromBeat || {}, b = toBeat || {};
    var rel = relationOf(a, b), kind = table[rel];
    var d = durFor(kind, a, b, tokens), s = num(b.start) ? b.start : 0;
    return {
      kind: kind,
      semantic: semanticFor(rel, a, b),
      t0: s - d / 2,
      t1: s + d / 2,
      focus: focusOf(b, ctx),         // exactly one hot spot: the incoming beat's
      relation: rel,
      because: BECAUSE[rel],
      feel: feelOf(b, tokens),
      from: a.id, to: b.id
    };
  }

  // board -> beats with start/dur filled (uniform split of totalDurationSec when absent)
  function normalize(board) {
    var beats = (board && board.beats) || [], n = beats.length, total = board && board.totalDurationSec, acc = 0;
    return beats.map(function (b) {
      var dur = num(b.dur) ? b.dur : (num(total) && n ? total / n : NaN);
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

  // ---------- geometry ----------
  function poly(pts) {
    var c = [];
    for (var i = 0; i < pts.length; i++) c.push([i ? 'L' : 'M', pts[i][0], pts[i][1]]);
    c.push(['Z']);
    return c;
  }
  function seed(fx, fy) { return [['M', fx, fy], ['Z']]; }   // zero-area origin: the mask is born at the focus
  function rectPts(w, h, x0, x1) { return [[x0, 0], [x1, 0], [x1, h], [x0, h]]; }
  function circlePts(cx, cy, r) {
    var R = r / Math.cos(Math.PI / ARC), pts = [];   // circumscribed: at full reach the polygon covers the frame
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
    function lerpX(x) { return function (p, q) { var t = (x - p[0]) / (q[0] - p[0]); return [x, p[1] + t * (q[1] - p[1])]; }; }
    function lerpY(y) { return function (p, q) { var t = (y - p[1]) / (q[1] - p[1]); return [p[0] + t * (q[0] - p[0]), y]; }; }
    pts = clipEdge(pts, function (p) { return p[0] >= 0; }, lerpX(0));
    pts = clipEdge(pts, function (p) { return p[0] <= w; }, lerpX(w));
    pts = clipEdge(pts, function (p) { return p[1] >= 0; }, lerpY(0));
    pts = clipEdge(pts, function (p) { return p[1] <= h; }, lerpY(h));
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
      case 'cut':
        return u > 0 ? poly(rectPts(w, h, 0, w)) : seed(fx, fy);
      case 'wipe':
      case 'wipe-back': {   // chevron edge whose tip rides the focus row
        var d = w * CHEVRON, tip = clamp((w + d) * u, 0, w), cx = clamp((w + d) * u - d, 0, w);
        if (tip <= 0) return seed(fx, fy);
        var pts = [[0, 0], [cx, 0], [tip, fy], [cx, h], [0, h]];
        if (kind === 'wipe-back') pts = pts.map(function (p) { return [w - p[0], p[1]]; });
        return poly(pts);
      }
      case 'split': {       // seam opens through the focus column
        if (u <= 0) return seed(fx, fy);
        return poly(rectPts(w, h, fx * (1 - u), fx + (w - fx) * u));
      }
      case 'iris': {        // opens from the focus
        if (u <= 0) return seed(fx, fy);
        return poly(clipRect(circlePts(fx, fy, reach(fx, fy, w, h) * u), w, h));
      }
      case 'iris-back': {   // closes onto the focus: the outgoing shrinks into the hot spot
        var r = reach(fx, fy, w, h) * (1 - u), outer = poly(rectPts(w, h, 0, w));
        if (r <= 0) return outer;
        return outer.concat(poly(clipRect(circlePts(fx, fy, r), w, h).reverse()));
      }
      default:
        throw new Error('TRANS_B.mask: unknown kind ' + kind);
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
    return Math.abs(s) / 2;
  }
  // first subpath is the reveal; later subpaths are holes
  function coverage(kind, u, w, h, focus) {
    w = num(+w) && +w > 0 ? +w : 1; h = num(+h) && +h > 0 ? +h : 1;
    var subs = subpaths(mask(kind, u, focus, w, h)), a = 0;
    for (var i = 0; i < subs.length; i++) a += (i ? -1 : 1) * area(subs[i]);
    return clamp(a / (w * h), 0, 1);
  }

  // f(t): progress of a transition at storyboard time t, eased by the incoming feel's token
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

  // G31: two.js layer — strict no-op (returns null) when Two is absent
  function drawTwo(two, cmds) {
    var T = (typeof Two !== 'undefined') ? Two : (root && root.Two); // eslint-disable-line no-undef
    if (!T || !two || typeof two.add !== 'function' || !Array.isArray(cmds) || typeof T.Anchor !== 'function' || typeof T.Path !== 'function') return null;
    var anchors = [];
    for (var i = 0; i < cmds.length; i++) {
      var c = cmds[i]; if (c[0] === 'Z') continue;
      var an = new T.Anchor(c[1], c[2]);
      if (T.Commands) an.command = c[0] === 'M' ? T.Commands.move : T.Commands.line;
      anchors.push(an);
    }
    if (!anchors.length) return null;
    var p = new T.Path(anchors, true, false, true);
    if (typeof p.noStroke === 'function') p.noStroke();
    two.add(p);
    return p;
  }

  return Object.freeze({
    VERSION: VERSION,
    KINDS: KINDS.slice(),
    REVERSE: Object.freeze(REVERSE),
    table: Object.freeze(table),
    BECAUSE: Object.freeze(BECAUSE),
    TEMPLATE: Object.freeze(TEMPLATE),
    transitionFor: transitionFor,
    relationOf: relationOf,
    focusOf: focusOf,
    normalize: normalize,
    plan: plan,
    mask: mask,
    coverage: coverage,
    ease: ease,
    progress: progress,
    maskAt: maskAt,
    active: active,
    toPathD: toPathD,
    drawTwo: drawTwo
  });
});
