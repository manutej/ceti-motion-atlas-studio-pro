/* cand-C — lane `transitions`, lens: cuts only, meaning carried by hold length.
 * Masks are the minimum the ratified ledger allows; the relation is told by how long
 * the window holds, derived from the landing beat's feel via tokens.tempo (ratios only,
 * so no tempo value is ever written here). Output = f(beats, tokens). Pure, stateless. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TRANS_C = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';

  var VERSION = 'C-2.0.0';
  var KINDS = ['cut', 'wipe', 'split', 'iris', 'iris-back', 'wipe-back'];
  var REVERSE = { cut: 'cut', wipe: 'wipe-back', 'wipe-back': 'wipe', iris: 'iris-back', 'iris-back': 'iris', split: 'split' };

  // Relation -> kind. Ledger E2: direction encodes relation. Lens: the hook opens on a cut,
  // so its callback (the hook's mask reversed) is also a cut; holds carry the rhyme.
  var table = {
    hook: 'cut',
    'cause→effect': 'wipe',
    contrast: 'split',
    'zoom-in': 'iris',
    breather: 'cut',
    callback: null,
    landing: 'iris-back'
  };
  table.callback = REVERSE[table.hook];

  // Q3: relation -> because
  var BECAUSE = {
    'cause→effect': 'continuity',
    callback: 'continuity',
    contrast: 'change',
    'zoom-in': 'attention',
    breather: 'attention',
    landing: 'character'
  };

  // grammar -> feel role (used only when a beat carries no feel of its own)
  var GRAMMAR_FEEL = { hook: 'saul', claim: 'glaser', proof: 'rostrum', breather: 'rest', callback: 'beat', landing: 'held' };

  function words(s) { return String(s).trim().split(/\s+/).filter(Boolean); }
  function clampWords(s, n) { var w = words(s); return w.slice(0, n).join(' '); }
  function label(b) { return (b && (b.label || b.id)) || 'the beat'; }

  function feelOf(beat, tokens) {
    var feels = (tokens && tokens.motion && tokens.motion.feels) || {};
    if (beat && beat.feel && Object.prototype.hasOwnProperty.call(feels, beat.feel)) return beat.feel;
    var g = beat && GRAMMAR_FEEL[beat.grammar];
    if (g && Object.prototype.hasOwnProperty.call(feels, g)) return g;
    var keys = Object.keys(feels).sort();
    return keys.length ? keys[0] : null;
  }

  // hold ratio in (0,1]: slowest tempo in range / this feel's tempo. Slow feel -> long hold.
  function holdRatio(feel, tokens) {
    var t = (tokens && tokens.tempo) || {};
    var range = t.range || [1, 1];
    var by = t.byFeel || {};
    var bpm = (feel && by[feel]) || (range[0] + range[1]) / 2;
    return Math.min(1, range[0] / bpm);
  }
  function snapRatio(tokens) {
    var range = (tokens && tokens.tempo && tokens.tempo.range) || [1, 1];
    return range[0] / range[1];
  }

  function mentionsZoom(b) {
    var s = ((b && b.show) || '') + ' ' + ((b && b.visualAction) || '');
    return /\bzoom|push[- ]in/i.test(s);
  }

  function relationOf(from, to) {
    if (!to) return 'cause→effect';
    if (to.grammar === 'breather') return 'breather';
    if (to.grammar === 'landing') return 'landing';
    if (to.grammar === 'callback' || (to.returns && to.grammar !== 'landing')) return 'callback';
    if (mentionsZoom(to)) return 'zoom-in';
    var fg = from && from.grammar;
    if (fg === 'hook' && to.grammar === 'claim') return /^\s*but\b/i.test(to.say || '') ? 'contrast' : 'cause→effect';
    if (fg === 'proof' && to.grammar === 'proof') return (from.claimId !== to.claimId) ? 'contrast' : 'cause→effect';
    return to.hinge === 'BUT' ? 'contrast' : 'cause→effect';
  }

  // Q9: one sentence template per relation, <= 14 words, names the relation.
  var SEMANTIC = {
    'cause→effect': function (a, b) { return label(a) + ' therefore ' + label(b) + ': the wipe carries cause into effect.'; },
    contrast: function (a, b) { return label(a) + ' against ' + label(b) + ': the split holds both sides apart.'; },
    'zoom-in': function (a, b) { return label(a) + ' narrows to ' + label(b) + ': the iris pulls one point close.'; },
    breather: function (a, b) { return label(a) + ' settles into ' + label(b) + ': a plain cut, the long hold rests.'; },
    callback: function (a, b) { return label(b) + ' returns ' + (b.returns || 'the hook') + ': the hook reversed, same hold.'; },
    landing: function (a, b) { return label(a) + ' resolves in ' + label(b) + ': the iris closes on the answer.'; }
  };

  // weight of the window per relation: long holds where the story breathes or ends.
  function relationWeight(rel, tokens) {
    if (rel === 'breather' || rel === 'landing' || rel === 'callback' || rel === 'zoom-in') return 1;
    return snapRatio(tokens);
  }

  function transitionFor(fromBeat, toBeat, tokens) {
    var rel = relationOf(fromBeat, toBeat);
    var kind = table[rel];
    var feel = feelOf(toBeat, tokens);
    var shorter = Math.min(Number(fromBeat && fromBeat.dur) || 0, Number(toBeat && toBeat.dur) || 0);
    var dur = shorter * holdRatio(feel, tokens) * relationWeight(rel, tokens);
    var start = Number(toBeat && toBeat.start) || 0;
    var out = {
      kind: kind,
      semantic: clampWords(SEMANTIC[rel](fromBeat || {}, toBeat || {}), 14),
      t0: start - dur / 2,
      t1: start + dur / 2,
      relation: rel,
      because: BECAUSE[rel],
      feel: feel
    };
    // one hot spot: only masks with a centre carry focus; a cut never adds one.
    if (kind === 'iris' || kind === 'iris-back' || kind === 'split') {
      var f = toBeat && toBeat.focus;
      out.focus = (f && isFinite(f.x) && isFinite(f.y)) ? { x: clamp01(f.x), y: clamp01(f.y) } : { x: 0.5, y: 0.5 };
    }
    return out;
  }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  // normalise a board: start/dur from totalDurationSec when absent; return beats + transitions.
  function schedule(board, tokens) {
    var beats = (board && board.beats) || [];
    var n = beats.length || 1;
    var even = (Number(board && board.totalDurationSec) || n) / n;
    var t = 0;
    var norm = beats.map(function (b) {
      var c = {};
      for (var k in b) if (Object.prototype.hasOwnProperty.call(b, k)) c[k] = b[k];
      c.dur = isFinite(b.dur) && b.dur > 0 ? b.dur : even;
      c.start = isFinite(b.start) ? b.start : t;
      t = c.start + c.dur;
      return c;
    });
    var trans = [];
    for (var i = 1; i < norm.length; i++) trans.push(transitionFor(norm[i - 1], norm[i], tokens));
    return { beats: norm, transitions: trans };
  }

  // ---- masks: closed form in u, no accumulated state ----
  var SEG = 24;
  function rect(x0, y0, x1, y1) { return [['M', x0, y0], ['L', x1, y0], ['L', x1, y1], ['L', x0, y1], ['Z']]; }
  function circle(cx, cy, r, ccw) {
    var p = [];
    for (var i = 0; i < SEG; i++) {
      var a = (ccw ? -1 : 1) * (i / SEG) * Math.PI * 2;
      p.push([i === 0 ? 'M' : 'L', cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    p.push(['Z']);
    return p;
  }
  function farCorner(cx, cy, w, h) {
    var dx = Math.max(cx, w - cx), dy = Math.max(cy, h - cy);
    // polygon inscribed radius shrinks by cos(pi/SEG); grow so u=1 fully covers.
    return Math.sqrt(dx * dx + dy * dy) / Math.cos(Math.PI / SEG);
  }

  function mask(kind, u, focus, w, h) {
    u = clamp01(Number(u) || 0);
    w = Number(w) || 1; h = Number(h) || 1;
    var fx = focus && isFinite(focus.x) ? clamp01(focus.x) : 0.5;
    var fy = focus && isFinite(focus.y) ? clamp01(focus.y) : 0.5;
    var cx = fx * w, cy = fy * h;
    switch (kind) {
      case 'wipe': return rect(0, 0, u * w, h);
      case 'wipe-back': return rect(w - u * w, 0, w, h);
      case 'split': return rect(cx - u * cx, 0, cx + u * (w - cx), h);
      case 'iris': return circle(cx, cy, u * farCorner(cx, cy, w, h), false);
      case 'iris-back':
        if (u >= 1) return rect(0, 0, w, h);
        return rect(0, 0, w, h).concat(circle(cx, cy, (1 - u) * farCorner(cx, cy, w, h), true));
      case 'cut':
      default:
        return u < 0.5 ? [['M', 0, 0], ['Z']] : rect(0, 0, w, h);
    }
  }

  // even-odd point test over all subpaths
  function inside(path, px, py) {
    var c = false, start = null, prev = null;
    function edge(a, b) {
      if ((a[1] > py) !== (b[1] > py) && px < (b[0] - a[0]) * (py - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    for (var i = 0; i < path.length; i++) {
      var cmd = path[i];
      if (cmd[0] === 'M') { if (prev && start) edge(prev, start); start = [cmd[1], cmd[2]]; prev = start; }
      else if (cmd[0] === 'L') { var p = [cmd[1], cmd[2]]; edge(prev, p); prev = p; }
      else if (cmd[0] === 'Z') { if (prev && start) edge(prev, start); prev = null; start = null; }
    }
    return c;
  }

  var GRID = 48;
  function coverage(kind, u, w, h) {
    w = Number(w) || 1; h = Number(h) || 1;
    var path = mask(kind, u, { x: 0.5, y: 0.5 }, w, h);
    var hit = 0;
    for (var j = 0; j < GRID; j++) for (var i = 0; i < GRID; i++) {
      if (inside(path, (i + 0.5) * w / GRID, (j + 0.5) * h / GRID)) hit++;
    }
    return hit / (GRID * GRID);
  }

  // G31: optional two.js layer — a strict no-op (returns null) when Two is absent.
  function twoLayer(two, kind, u, focus) {
    var G = typeof Two !== 'undefined' ? Two : null; // eslint-disable-line no-undef
    if (!G || !two || typeof two.makePath !== 'function') return null;
    var pts = mask(kind, u, focus, two.width, two.height)
      .filter(function (c) { return c[0] !== 'Z'; })
      .map(function (c) { return new G.Anchor(c[1], c[2]); });
    if (!pts.length) return null;
    var p = two.makePath(pts, false);
    p.noStroke();
    return p;
  }

  return {
    VERSION: VERSION, KINDS: KINDS, table: table, because: BECAUSE,
    transitionFor: transitionFor, relationOf: relationOf, schedule: schedule,
    mask: mask, coverage: coverage, reverse: REVERSE, twoLayer: twoLayer
  };
});
