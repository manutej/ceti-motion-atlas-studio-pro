/* TRANS candidate A — reading-order wipes.
 * Lens: every mask travels the way the eye reads the relation.
 *   cause→effect  wipe       left → right (cause is read first)
 *   contrast      split      opens at a seam, both sides read at once
 *   zoom-in       iris       opens on the one hot spot
 *   breather      cut        nothing moves, nothing new to read
 *   callback      reverse of the hook's mask (reading runs back to the plant)
 *   landing       iris-back  closes on the one hot spot
 * Output is f(beats, tokens). No clocks, no randomness, no frame loop, no stored state.
 * Colours, fonts, tempo and easing are read from the tokens object at call time (roles only).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.TRANS_A = api;
  else if (root) root.TRANS_A = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var VERSION = 'A-r2-reading-order';
  var SECONDS_PER_MINUTE = 60;
  var HALF = 1 / 2;
  var CIRCLE_SIDES = 48;      // polygon resolution of the iris (geometry, not easing)
  var GRID = 50;              // coverage sampling grid (geometry, not easing)
  var BISECT_STEPS = 24;      // only used when tokens.motion supplies a bezier
  var MAX_WORDS = 14;

  var REVERSE = { wipe: 'wipe-back', 'wipe-back': 'wipe', iris: 'iris-back', 'iris-back': 'iris', cut: 'cut', split: 'split' };

  var HOOK_KIND = 'wipe'; // the hook enters in reading order, left → right
  var table = {
    hook: HOOK_KIND,
    'cause→effect': 'wipe',
    contrast: 'split',
    'zoom-in': 'iris',
    breather: 'cut',
    callback: REVERSE[HOOK_KIND],
    landing: 'iris-back'
  };

  // Q3: relation → because (attention | continuity | change | character)
  var BECAUSE = {
    hook: 'attention',
    'cause→effect': 'continuity',
    contrast: 'change',
    'zoom-in': 'attention',
    breather: 'character',
    callback: 'continuity',
    landing: 'change'
  };

  // Q9: sentence template per relation ({A} = from label, {B} = to label, {M} = motif)
  var SEMANTIC = {
    hook: '{B} opens the question; the reveal reads left to right.',
    'cause→effect': 'Because {A}, therefore {B}: read left to right, cause first.',
    contrast: '{A} against {B}: the frame splits so both sides compare.',
    'zoom-in': 'From {A} into {B}: the iris narrows onto one detail.',
    breather: 'After {A}, a pause: hard cut, nothing new to read.',
    callback: '{B} returns to {M}: the hook’s wipe runs backward.',
    landing: '{B} closes the argument: the iris shuts on one point.'
  };

  function label(b) { return (b && (b.label || b.id)) || 'the frame'; }

  function startsWithBut(s) { return typeof s === 'string' && /^\s*but\b/i.test(s); }
  function mentionsZoom(s) { return typeof s === 'string' && /\b(zoom|push-in|push in)\b/i.test(s); }

  // Relation inference (CONTRACT order; specific grammars first).
  function relationOf(fromBeat, toBeat) {
    if (!fromBeat) return 'hook';
    var g = toBeat && toBeat.grammar, fg = fromBeat.grammar;
    if (g === 'breather') return 'breather';
    if (g === 'landing') return 'landing';
    if (g === 'callback' && toBeat.returns) return 'callback';
    if (mentionsZoom(toBeat.show)) return 'zoom-in';
    if (fg === 'hook' && g === 'claim') return startsWithBut(toBeat.say) ? 'contrast' : 'cause→effect';
    if (fg === 'proof' && g === 'proof') return (fromBeat.claimId !== toBeat.claimId) ? 'contrast' : 'cause→effect';
    if (startsWithBut(toBeat.say)) return 'contrast';
    return 'cause→effect';
  }

  function trimWords(s) {
    var w = String(s).trim().split(/\s+/).filter(Boolean);
    return w.slice(0, MAX_WORDS).join(' ');
  }

  function semanticFor(rel, fromBeat, toBeat) {
    var motif = (toBeat && toBeat.returns) || (fromBeat && fromBeat.plant) || 'the opening';
    return trimWords(SEMANTIC[rel].replace('{A}', label(fromBeat)).replace('{B}', label(toBeat)).replace('{M}', motif));
  }

  // Duration: one musical beat of the incoming feel, read from tokens.tempo.
  function bpmFor(rel, toBeat, tokens) {
    var tempo = (tokens && tokens.tempo) || {};
    var by = tempo.byFeel || {};
    if (toBeat && toBeat.feel && typeof by[toBeat.feel] === 'number') return by[toBeat.feel];
    var range = tempo.range || [];
    var slow = range[0], fast = range[range.length - 1];
    var unhurried = rel === 'landing' || rel === 'callback' || rel === 'zoom-in' || rel === 'hook';
    var v = unhurried ? slow : fast;
    return typeof v === 'number' && v > 0 ? v : null;
  }

  function focusFor(kind, toBeat) {
    var f = toBeat && toBeat.focus;
    var fx = f && typeof f.x === 'number' ? clamp01(f.x) : HALF;
    var fy = f && typeof f.y === 'number' ? clamp01(f.y) : HALF;
    if (kind === 'wipe') return { x: 0, y: fy };          // leading edge starts at the reading origin
    if (kind === 'wipe-back') return { x: 1, y: fy };     // reverse reading: from the right margin
    if (kind === 'cut') return undefined;                 // no mask, no focus
    return { x: fx, y: fy };                              // split seam / iris centre: the single hot spot
  }

  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

  function transitionFor(fromBeat, toBeat, tokens) {
    var rel = relationOf(fromBeat, toBeat);
    var kind = table[rel];
    var start = (toBeat && typeof toBeat.start === 'number') ? toBeat.start : 0;
    var dur = 0;
    if (kind !== 'cut') {
      var bpm = bpmFor(rel, toBeat, tokens);
      dur = bpm ? SECONDS_PER_MINUTE / bpm : 0;
      var lim = [fromBeat && fromBeat.dur, toBeat && toBeat.dur].filter(function (d) { return typeof d === 'number' && d >= 0; });
      if (lim.length) dur = Math.min(dur, Math.min.apply(null, lim));
    }
    var out = {
      kind: kind,
      semantic: semanticFor(rel, fromBeat, toBeat),
      t0: start - dur * HALF,
      t1: start + dur * HALF,
      relation: rel,
      because: BECAUSE[rel],
      feel: (toBeat && toBeat.feel) || null
    };
    var focus = focusFor(kind, toBeat);
    if (focus) out.focus = focus;
    return out;
  }

  // Board helpers: fill start/dur deterministically when the board gives only totalDurationSec.
  function layout(board) {
    var beats = (board && board.beats) || [];
    var n = beats.length || 1;
    var each = (board && typeof board.totalDurationSec === 'number') ? board.totalDurationSec / n : 0;
    var t = 0;
    return beats.map(function (b) {
      var c = {}; for (var k in b) if (Object.prototype.hasOwnProperty.call(b, k)) c[k] = b[k];
      if (typeof c.dur !== 'number') c.dur = each;
      if (typeof c.start !== 'number') c.start = t;
      t = c.start + c.dur;
      return c;
    });
  }

  function plan(board, tokens) {
    var beats = layout(board), out = [];
    for (var i = 1; i < beats.length; i++) out.push(transitionFor(beats[i - 1], beats[i], tokens));
    return out;
  }

  // ---------- masks: closed form in u; the region of the INCOMING beat that is visible ----------
  function rect(x0, y0, x1, y1) { return [['M', x0, y0], ['L', x1, y0], ['L', x1, y1], ['L', x0, y1], ['Z']]; }

  function irisRadius(fx, fy, w, h) {
    var dx = Math.max(fx * w, (1 - fx) * w), dy = Math.max(fy * h, (1 - fy) * h);
    return Math.sqrt(dx * dx + dy * dy) / Math.cos(Math.PI / CIRCLE_SIDES); // circumscribed: covers corners at full size
  }

  function circlePts(cx, cy, r, reverse) {
    var pts = [];
    for (var i = 0; i < CIRCLE_SIDES; i++) {
      var k = reverse ? (CIRCLE_SIDES - i) % CIRCLE_SIDES : i;
      var a = -Math.PI * HALF + (2 * Math.PI * k) / CIRCLE_SIDES; // vertex 0 = top of circle
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return pts;
  }

  function mask(kind, u, focus, w, h) {
    u = clamp01(typeof u === 'number' && u === u ? u : 0);
    var f = focus || { x: HALF, y: HALF };
    var fx = clamp01(f.x), fy = clamp01(f.y);
    if (kind === 'cut') return u > 0 ? rect(0, 0, w, h) : rect(0, 0, 0, 0);
    if (kind === 'wipe') return rect(0, 0, u * w, h);
    if (kind === 'wipe-back') return rect((1 - u) * w, 0, w, h);
    if (kind === 'split') return rect(fx * (1 - u) * w, 0, (fx + (1 - fx) * u) * w, h);
    var cx = fx * w, cy = fy * h, R = irisRadius(fx, fy, w, h), cmds = [], pts, i;
    if (kind === 'iris') {
      pts = circlePts(cx, cy, u * R, false);
      cmds.push(['M', pts[0][0], pts[0][1]]);
      for (i = 1; i < pts.length; i++) cmds.push(['L', pts[i][0], pts[i][1]]);
      cmds.push(['Z']);
      return cmds;
    }
    if (kind === 'iris-back') {
      // frame minus a closing circle, as one keyhole contour (even-odd): reveal grows as the circle shuts
      pts = circlePts(cx, cy, (1 - u) * R, true);
      cmds.push(['M', cx, 0], ['L', w, 0], ['L', w, h], ['L', 0, h], ['L', 0, 0], ['L', cx, 0]);
      for (i = 0; i < pts.length; i++) cmds.push(['L', pts[i][0], pts[i][1]]);
      cmds.push(['L', pts[0][0], pts[0][1]], ['L', cx, 0], ['Z']);
      return cmds;
    }
    throw new Error('TRANS_A.mask: unknown kind ' + kind);
  }

  function inside(cmds, px, py) {
    var poly = [], i, j, c = false;
    for (i = 0; i < cmds.length; i++) if (cmds[i][0] !== 'Z') poly.push([cmds[i][1], cmds[i][2]]);
    for (i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }

  // Area revealed in [0,1]; nested masks ⇒ monotone. Exact for rects, grid-sampled for the iris.
  function coverage(kind, u, w, h) {
    u = clamp01(u);
    if (kind === 'cut') return u > 0 ? 1 : 0;
    if (kind === 'wipe' || kind === 'wipe-back' || kind === 'split') return u;
    var cmds = mask(kind, u, { x: HALF, y: HALF }, w, h), hit = 0;
    for (var gy = 0; gy < GRID; gy++) for (var gx = 0; gx < GRID; gx++) {
      if (inside(cmds, ((gx + HALF) / GRID) * w, ((gy + HALF) / GRID) * h)) hit++;
    }
    return hit / (GRID * GRID);
  }

  // ---------- progress: u from storyboard time; easing only if tokens.motion supplies a curve ----------
  function bezierAt(p, x) {
    var lo = 0, hi = 1, s = x;
    for (var i = 0; i < BISECT_STEPS; i++) {
      s = (lo + hi) * HALF;
      var bx = 3 * (1 - s) * (1 - s) * s * p[0] + 3 * (1 - s) * s * s * p[2] + s * s * s;
      if (bx < x) lo = s; else hi = s;
    }
    return 3 * (1 - s) * (1 - s) * s * p[1] + 3 * (1 - s) * s * s * p[3] + s * s * s;
  }

  function progress(tr, t, tokens) {
    if (!tr) return 0;
    if (tr.t1 <= tr.t0) return t >= tr.t0 ? 1 : 0;
    var u = clamp01((t - tr.t0) / (tr.t1 - tr.t0));
    var feels = tokens && tokens.motion && tokens.motion.feels;
    var spec = feels && tr.feel ? feels[tr.feel] : null;
    var p = spec && (spec.bezier || spec.ease);
    if (Array.isArray(p) && p.length === 4 && p.every(function (v) { return typeof v === 'number'; })) return clamp01(bezierAt(p, u));
    return u; // linear: tokens carry no curve for this feel
  }

  // ---------- two.js layer: applies the mask to the incoming group; strict no-op without Two ----------
  function drawTwo(two, group, tr, t, tokens, w, h) {
    var TwoLib = (typeof Two !== 'undefined') ? Two : null; // eslint-disable-line no-undef
    if (!TwoLib || !two || typeof two.makePath !== 'function' || !group || !tr) return null;
    var u = progress(tr, t, tokens);
    var cmds = mask(tr.kind, u, tr.focus, w, h);
    var anchors = [];
    for (var i = 0; i < cmds.length; i++) if (cmds[i][0] !== 'Z') anchors.push(new TwoLib.Anchor(cmds[i][1], cmds[i][2]));
    var path = two.makePath(anchors, false);
    var paper = tokens && tokens.color && tokens.color.paper;
    if (paper) path.fill = paper;
    path.noStroke && path.noStroke();      // a transition never draws a second focus
    group.mask = path;
    return path;
  }

  return {
    VERSION: VERSION,
    table: table,
    because: BECAUSE,
    semantics: SEMANTIC,
    reverse: REVERSE,
    relationOf: relationOf,
    transitionFor: transitionFor,
    layout: layout,
    plan: plan,
    mask: mask,
    coverage: coverage,
    progress: progress,
    drawTwo: drawTwo
  };
});
