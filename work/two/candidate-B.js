/* candidate-B.js — two.js "storyboard theatre" layer (v9). Stage machinery for the MESSAGING:
 * transition direction = beat relation; diagram draws on with `say`; odometer counter with a visible
 * "moves because"; one travelling spotlight; end-card lock-up. Each module = f(t, beat, palette, seed);
 * scene rebuilt from t, two.update() manual (G06); palette-locked (G01); mulberry32; no-op without Two. */
(function (root) { 'use strict';
var LW = 480, LH = 300;
var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/two.js/0.8.17/two.min.js';
var MONO = '"Space Mono", ui-monospace, monospace';
var SANS = '"DM Sans", system-ui, sans-serif';
var SERIF = '"Fraunces", Georgia, serif';
var S = { two: null, ready: false, loading: false, cbs: [], reduced: false, disposed: false, cdn: CDN };

// ---- helpers ----
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function hex2(h) {
  h = String(h || '#000').replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  var n = parseInt(h.slice(0, 6), 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(h, a) { var c = hex2(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + clamp(a, 0, 1).toFixed(3) + ')'; }
function rng(seed) { // mulberry32
  var a = (seed >>> 0) || 1;
  return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function glaser(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 5); } // = cubic-bezier(.22,1,.36,1), the engine's Glaser ease
function overshoot(x) { if (x <= 0) return 0; if (x >= 1) return 1; var c = 1.70158, y = x - 1; return 1 + (c + 1) * y * y * y + c * y * y; } // Glaser pop
function ramp(t, a, b) { return clamp((t - a) / Math.max(1e-6, b - a), 0, 1); }
function pal(p) { p = p || {}; return { paper: p.paper || '#FBF3E6', ink: p.ink || '#1A1F2E', a: p.a || '#ebd3a2', h: p.h || '#ae5224', c: p.c || p.ink || '#064f6e' }; }
function TX(two, s, x, y, size, fill, o) { o = o || {}; return two.makeText(String(s), x, y, { family: o.f || MONO, size: size, weight: o.w || 700, style: o.s || 'normal', fill: fill, alignment: o.al || 'center', baseline: 'middle' }); }
function SK(p, col, lw, end) { p.noFill(); p.stroke = col; p.linewidth = lw; p.cap = p.join = 'round'; if (end != null) p.ending = end; return p; }
function wordIndex(words, phrase) { // word index where a plant/return phrase starts, else last
  var cl = function (w) { return String(w).toLowerCase().replace(/[^a-z0-9]/g, ''); }, w0 = cl(String(phrase || '').split(/\s+/)[0]);
  for (var i = 0; w0 && i < words.length; i++) if (cl(words[i]) === w0) return i;
  return words.length - 1;
}

// ---- env: all a module may read, derived from (t, beat, palette, seed) ----
function beatAt(beats, t) {
  if (!beats || !beats.length) return null;
  for (var i = 0; i < beats.length; i++) if (t >= beats[i].tStartSec && t < beats[i].tEndSec) return beats[i];
  return beats[t < beats[0].tStartSec ? 0 : beats.length - 1];
}
function env(t, beat, palette, seed, P) {
  P = P || {}; t = Number(t) || 0;
  var sheet = P.sheet || null, beats = (sheet && sheet.beats) || P.beats || null;
  if (!beat) beat = beatAt(beats, t); if (!beat) return null;
  var t0 = Number(beat.tStartSec) || 0, t1 = Number(beat.tEndSec); if (!(t1 > t0)) t1 = t0 + (Number(P.beatLen) || 1.5);
  var reduced = P.reduced != null ? !!P.reduced : S.reduced;
  var tl = reduced ? t1 - 1e-3 : clamp(t, t0, t1); // G16: reduced ⇒ settled final frame
  var idx = beat.index != null ? beat.index : (beats ? beats.indexOf(beat) : 0);
  var prev = P.prevBeat || (beats && idx > 0 ? beats[idx - 1] : null);
  var sd = ((Number(seed == null ? 7 : seed) * 1000003) + idx * 7919) >>> 0;
  var e = { t: tl, t0: t0, t1: t1, len: t1 - t0, beat: beat, prev: prev, idx: idx, beats: beats, P: pal(palette), seed: sd, rnd: rng(sd), reduced: reduced,
    title: P.title || (sheet && sheet.title) || '', isLast: beats ? idx === beats.length - 1 : beat.grammar === 'landing' };
  e.say = sayTiming(e);
  return e;
}

// ---- draw-on timing law: `say` lands word by word (~3.3 w/s) after the transition settles;
// at(i) = instant word i is shown; an element supporting word i finishes drawing EXACTLY at at(i).
function sayTiming(e) {
  var say = String(e.beat.say || e.beat.label || '').trim(), words = say ? say.split(/\s+/) : [], n = Math.max(1, words.length);
  var start = e.t0 + Math.min(0.35, e.len * 0.12), span = Math.min(e.len * 0.64, n * 0.30);
  var at = function (i) { return start + (clamp(i, 0, n - 1) + 1) / n * span; };
  var D = clamp(span / n * 1.6, 0.18, 0.5); // draw-on duration
  return { say: say, words: words, n: n, start: start, end: start + span, at: at, D: D, shown: function (t) { return clamp(Math.floor((t - start) / span * n + 1e-6), 0, n); } };
}

// ---- transition semantics: cause→effect wipes left→right, contrast splits, zoom-in irises from
// the focus, callback = the hook's mask reversed, landing closes the iris on the lock-up.
function relation(b, hookBeat) {
  if (b.transition) return b.transition;
  var g = b.grammar || b.role || '', cam = String(b.cameraMove || '');
  if (g === 'hook') return 'wipe';
  if (g === 'breather') return 'cut';
  if (g === 'landing') return 'iris-close';
  if (g === 'callback' || b.returns) return reverse(hookBeat ? relation(hookBeat, null) : 'wipe');
  if (/push/.test(cam) || g === 'claim') return 'iris';
  return b.hinge === 'BUT' ? 'split' : 'wipe';
}
function reverse(k) { return { wipe: 'wipe-back', 'wipe-back': 'wipe', split: 'split-back', 'split-back': 'split', iris: 'iris-back', 'iris-back': 'iris' }[k] || 'wipe-back'; }
function focusOf(e, b, atEnd) { // the one hot spot, stage px
  b = b || e.beat; var f = b.focus, d = b.diagram, cp = b.characterPose;
  if (f) return { x: f.x * LW, y: f.y * LH, r: (f.r || 0.22) * LW };
  if (d && d.nodes && d.nodes.length) { var w = atEnd ? 1e9 : e.say.shown(e.t), pick = d.nodes[0]; d.nodes.forEach(function (nd) { if ((nd.word || 0) < w) pick = nd; }); return { x: pick.x * LW, y: pick.y * LH, r: 0.2 * LW }; }
  if (cp) return { x: cp.x * LW, y: cp.y * LH, r: 0.24 * LW * (cp.scale || 1) };
  return { x: LW / 2, y: LH * 0.5, r: 0.26 * LW };
}
function curtain(two, e, x, y, w, h) { var r = two.makeRectangle(x + w / 2, y + h / 2, Math.max(0, w), Math.max(0, h)); r.fill = e.P.paper; r.noStroke(); return r; }
function edgeLine(two, e, x1, y1, x2, y2) { return SK(two.makeLine(x1, y1, x2, y2), e.P.c, 2); }
function transition(two, e) {
  var hook = e.beats ? e.beats[0] : null, kind = relation(e.beat, hook), dur = Math.min(0.38, e.len * 0.24);
  var k = kind === 'iris-close' ? ramp(e.t, e.t1 - dur * 1.6, e.t1 - 0.02) : 1 - glaser(ramp(e.t, e.t0, e.t0 + dur)); // curtain remaining
  if (e.reduced || kind === 'cut' || k <= 0.001) return kind;
  var f = focusOf(e, null, true), big = 1.3 * Math.max(LW, LH);
  if (kind === 'wipe') { curtain(two, e, LW * (1 - k), 0, LW * k, LH); edgeLine(two, e, LW * (1 - k), 0, LW * (1 - k), LH); }
  else if (kind === 'wipe-back') { curtain(two, e, 0, 0, LW * k, LH); edgeLine(two, e, LW * k, 0, LW * k, LH); }
  else if (kind === 'split' || kind === 'split-back') {
    var s = kind === 'split' ? 1 : -1, dx = LW * (1 - k) * s; // halves exit opposite ways: contrast
    curtain(two, e, -dx, 0, LW, LH / 2); curtain(two, e, dx, LH / 2, LW, LH / 2);
    edgeLine(two, e, 0, LH / 2, LW, LH / 2);
  } else if (kind === 'iris' || kind === 'iris-close') {
    var r = Math.max(0.5, (1 - k) * big);
    SK(two.makeCircle(f.x, f.y, r + big / 2), e.P.paper, big); SK(two.makeCircle(f.x, f.y, r), e.P.c, 2);
  } else if (kind === 'iris-back') { // hook iris reversed: disc shrinks, plant revealed last
    var disc = two.makeCircle(f.x, f.y, Math.max(0.5, k * big * 0.6)); disc.fill = e.P.paper; disc.stroke = e.P.c; disc.linewidth = 2;
  }
  return kind;
}

// ---- diagram grammar: nodes/arrows/brackets/underlines, drawn on in reading order ----
function diagramOf(e) {
  var b = e.beat, d = b.diagram; if (d && d.nodes) return d;
  var W = e.say.words, last = Math.max(0, W.length - 1), g = b.grammar || b.role;
  var claim = (b.claimId && e.beats) ? e.beats.filter(function (x) { return x.id === b.claimId; })[0] : null;
  var N = function (id, x, label, shape, word) { return { id: id, x: x, y: 0.8, label: label, shape: shape, word: word }; }, E = function (from, to, kind, word) { return { from: from, to: to, kind: kind, word: word }; };
  if (g === 'hook' && b.plant) return { nodes: [N('p', 0.5, b.plant, 'pill', wordIndex(W, b.plant))], edges: [E('p', null, 'underline', last)] };
  if (b.returns) return { nodes: [N('r', 0.5, b.returns, 'pill', wordIndex(W, b.returns))], edges: [E('r', null, 'bracket', last)] };
  if (claim) return { nodes: [N('c', 0.24, claim.plant || claim.label || 'claim', 'pill', 0), N('b', 0.76, b.label || 'proof', 'pill', last)], edges: [E('c', 'b', 'arrow', last)] };
  if (e.prev && g !== 'breather' && g !== 'landing') return { nodes: [N('a', 0.24, e.prev.label || 'before', 'dot', 0), N('b', 0.76, b.label || '', 'pill', last)], edges: [E('a', 'b', 'arrow', Math.max(0, last - 1)), E('b', null, 'underline', last)] };
  return { nodes: [], edges: [] };
}
function nodeBox(nd, label) { var w = Math.max(22, label.length * 6.4 + 16), h = 18; return { x: nd.x * LW, y: nd.y * LH, w: nd.shape === 'dot' ? 10 : w, h: nd.shape === 'dot' ? 10 : h }; }
function diagram(two, e) {
  var d = diagramOf(e), T = e.say, byId = {}, P = e.P, order = [];
  (d.nodes || []).forEach(function (nd) { byId[nd.id] = nd; order.push({ k: 'node', o: nd, w: nd.word || 0, x: nd.x }); });
  (d.edges || []).forEach(function ed(eg) { order.push({ k: 'edge', o: eg, w: eg.word || 0, x: (byId[eg.from] || { x: 0 }).x }); });
  order.sort(function (p, q) { return p.w - q.w || p.x - q.x; }); // by supported word, then left→right
  order.forEach(function (it) {
    var tw = T.at(it.w), p = ramp(e.t, tw - T.D, tw), g;
    if (p <= 0) return;
    if (it.k === 'node') {
      var nd = it.o, lab = String(nd.label || ''), bx = nodeBox(nd, lab), sc = overshoot(p);
      g = two.makeGroup(); g.translation.set(bx.x, bx.y); g.scale = Math.max(0.001, sc);
      var shape = nd.shape === 'dot' ? two.makeCircle(0, 0, 5) : two.makeRoundedRectangle(0, 0, bx.w, bx.h, 9);
      shape.fill = nd.shape === 'dot' ? P.h : rgba(P.a, 0.92); shape.stroke = P.c; shape.linewidth = 1.4; g.add(shape);
      if (nd.shape !== 'dot') g.add(TX(two, lab, 0, 0.5, 8.5, P.ink));
      else g.add(TX(two, lab, 0, 13, 7.5, P.ink));
    } else {
      var eg = it.o, A = byId[eg.from], B = byId[eg.to], ba = A ? nodeBox(A, String(A.label || '')) : null, bb = B ? nodeBox(B, String(B.label || '')) : null, k = glaser(p), path;
      if (eg.kind === 'arrow' && ba && bb) {
        var dir = bb.x > ba.x ? 1 : -1, x1 = ba.x + dir * (ba.w / 2 + 4), x2 = bb.x - dir * (bb.w / 2 + 4), y1 = ba.y, y2 = bb.y, mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 12;
        path = SK(two.makePath(x1, y1, mx, my, x2, y2, true), P.c, 2, k); path.curved = true;
        if (k > 0.85) { // head arrives exactly as the word lands
          var hs = 7 * overshoot(ramp(k, 0.85, 1)), ang = Math.atan2(y2 - my, x2 - mx), hx = x1 + (x2 - x1) * k, hy = y1 + (y2 - y1) * k;
          var head = two.makePath(hx, hy, hx - hs * Math.cos(ang - 0.55), hy - hs * Math.sin(ang - 0.55), hx - hs * Math.cos(ang + 0.55), hy - hs * Math.sin(ang + 0.55), false); head.fill = P.h; head.stroke = P.c; head.linewidth = 1.2; head.join = 'round';
        }
        if (eg.label) TX(two, eg.label, mx, my - 7, 7, rgba(P.ink, 0.75 * k));
      } else if (eg.kind === 'underline' && ba) {
        var ux = ba.x - ba.w / 2, uy = ba.y + ba.h / 2 + 5, pts = [], segs = 6, i;
        for (i = 0; i <= segs; i++) pts.push(ux + ba.w * i / segs, uy + (e.rnd() - 0.5) * 1.6); // seeded wobble
        SK(two.makePath.apply(two, pts.concat([true])), P.h, 2.2, k);
      } else if (eg.kind === 'bracket' && ba) {
        var L = ba.x - ba.w / 2 - 6, R = ba.x + ba.w / 2 + 6, Tp = ba.y - ba.h / 2 - 5, Bt = ba.y + ba.h / 2 + 5;
        SK(two.makePath(L + 6, Tp, L, Tp, L, Bt, L + 6, Bt, true), P.c, 1.6, k); SK(two.makePath(R - 6, Tp, R, Tp, R, Bt, R - 6, Bt, true), P.c, 1.6, k);
      }
    }
  });
  return d;
}

// ---- counter: eased value, odometer digits, visible G11 "moves because" tag ----
function counter(two, e) {
  var c = e.beat.counter; if (!c) return null;
  var T = e.say, w = c.word == null ? T.n - 1 : c.word, tw = T.at(w), k = glaser(ramp(e.t, tw - Math.max(0.5, T.D * 2), tw));
  var from = Number(c.from) || 0, to = Number(c.to) || 0, dec = c.decimals || 0, v = from + (to - from) * k, P = e.P;
  if (k <= 0) return null;
  var cx = (c.x == null ? 0.5 : c.x) * LW, cy = (c.y == null ? 0.3 : c.y) * LH, H = 26, CW = 15, str = Math.abs(v).toFixed(dec), ndig = str.replace('.', '').length, width = str.length * CW;
  var unit = c.unit ? String(c.unit) : '', x0 = cx - (width + (unit ? unit.length * 6 + 4 : 0)) / 2, col = 0, i;
  var box = two.makeRoundedRectangle(cx, cy, width + (unit ? unit.length * 6 + 10 : 10), H + 8, 6); box.fill = rgba(P.a, 0.85); box.stroke = P.c; box.linewidth = 1.2;
  for (i = 0; i < str.length; i++) {
    var ch = str[i], x = x0 + i * CW + CW / 2;
    if (ch === '.') { TX(two, '.', x, cy + 6, 16, P.ink); continue; }
    var powIdx = ndig - 1 - col, scale = Math.pow(10, powIdx - dec), colVal = (Math.abs(v) / scale) % 10, d = Math.floor(colVal + 1e-9);
    var roll = powIdx === 0 ? (colVal - d) : ramp((Math.abs(v) % scale) / scale, 0.85, 1); // higher columns flip as lower ones wrap
    var g = two.makeGroup(); g.mask = new root.Two.Rectangle(x, cy, CW, H);
    g.add(TX(two, d, x, cy - roll * H, 16, P.ink), TX(two, (d + 1) % 10, x, cy + (1 - roll) * H, 16, P.ink)); col++;
  }
  if (v < 0) TX(two, '−', x0 - 8, cy, 16, P.ink);
  if (unit) TX(two, unit, x0 + width + 4, cy + 1, 9, P.c, { al: 'left' });
  if (c.label) TX(two, c.label, cx, cy - H / 2 - 12, 9, P.ink, { f: SANS, w: 600 });
  var why = 'moves because: ' + String(c.because || e.beat.because || (e.beat.hinge === 'BUT' ? 'but the picture changed' : 'so the picture changed'));
  TX(two, '↳ ' + why, cx, cy + H / 2 + 12, 7, rgba(P.ink, k * 1.1), { w: 400 });
  return v;
}

// ---- attention: ONE spotlight, dim the rest, travels between beats ----
function spotlight(two, e) {
  var P = e.P, g = e.beat.grammar || e.beat.role, cur = focusOf(e), prevF = e.prev ? focusOf(e, e.prev, true) : cur;
  var m = glaser(ramp(e.t, e.t0, e.t0 + Math.min(0.4, e.len * 0.3)));
  var fx = prevF.x + (cur.x - prevF.x) * m, fy = prevF.y + (cur.y - prevF.y) * m, fr = prevF.r + (cur.r - prevF.r) * m;
  var dim = e.beat.dim != null ? e.beat.dim : (g === 'breather' ? 0.08 : g === 'landing' ? 0.0 : 0.22);
  if (dim <= 0.001) return { x: fx, y: fy, r: fr };
  var rect = two.makeRectangle(LW / 2, LH / 2, LW, LH); rect.noStroke();
  var grad = two.makeRadialGradient(fx - LW / 2, fy - LH / 2, fr * 1.9, new root.Two.Stop(0, rgba(P.ink, 0)), new root.Two.Stop(0.52, rgba(P.ink, 0)), new root.Two.Stop(1, rgba(P.ink, dim)));
  grad.units = 'userSpaceOnUse'; rect.fill = grad;
  SK(two.makeCircle(fx, fy, fr), rgba(P.h, 0.55), 1).dashes = [3, 5];
  return { x: fx, y: fy, r: fr };
}

// ---- end-card lock-up: title + claim + callback mark, Glaser overshoot ----
function endcard(two, e) {
  if (!e.isLast && e.beat.grammar !== 'landing') return false;
  var P = e.P, u0 = e.t0 + e.len * 0.42, s = e.len * 0.12, hookB = e.beats ? e.beats[0] : null, claimB = e.beats ? (e.beats.filter(function (b) { return b.grammar === 'claim'; })[0] || e.beats[1]) : null;
  var title = e.title || e.beat.say || '', claim = String((claimB && claimB.say) || ''), mark = String((hookB && hookB.plant) || e.beat.returns || '');
  var k1 = overshoot(ramp(e.t, u0, u0 + s)), k2 = overshoot(ramp(e.t, u0 + s * 0.8, u0 + s * 1.8)), k3 = overshoot(ramp(e.t, u0 + s * 1.6, u0 + s * 2.6)), cx = LW / 2, cy = LH * 0.46;
  if (k1 <= 0) return false;
  var plate = two.makeRoundedRectangle(cx, cy + 8, 300 * Math.max(0.001, k1), 112, 10); plate.fill = rgba(P.paper, 0.94); plate.stroke = P.c; plate.linewidth = 1.4;
  TX(two, title, cx, cy - 22 + (1 - k1) * 24, 19, rgba(P.ink, k1), { f: SERIF, w: 600, s: 'italic' });
  SK(two.makeLine(cx - 120 * k1, cy, cx + 120 * k1, cy), P.h, 2);
  if (k2 > 0) TX(two, claim, cx, cy + 18 + (1 - k2) * 10, 10, rgba(P.ink, 0.85 * k2), { f: SANS, w: 600 });
  if (k3 > 0 && mark) { // callback mark: the plant, ringed
    var g = two.makeGroup(); g.translation.set(cx, cy + 44); g.scale = Math.max(0.001, k3);
    var mx = -mark.length * 2.6 - 10, dot = two.makeCircle(mx, 0, 4); dot.fill = P.h; dot.noStroke(); g.add(dot, SK(two.makeCircle(mx, 0, 7), P.c, 1.2));
    g.add(TX(two, mark, 4, 0.5, 8.5, P.ink));
  }
  return true;
}

// ---- loader / lifecycle ----
function isAvailable() { return !S.disposed && typeof root.Two === 'function' && !!root.document && typeof root.document.createElement === 'function'; }
function ensureTwo() {
  if (S.two) return S.two;
  if (!isAvailable()) return null;
  try {
    var cv = root.document.createElement('canvas'); cv.width = LW; cv.height = LH;
    S.two = new root.Two({ type: root.Two.Types.canvas, domElement: cv, width: LW, height: LH, ratio: 1, autostart: false });
    return S.two;
  } catch (_e) { S.two = null; return null; }
}
function fire(ok) { S.ready = ok; S.loading = false; var cbs = S.cbs; S.cbs = []; cbs.forEach(function (cb) { try { cb(ok); } catch (_e) {} }); }
function init(opts) {
  opts = opts || {}; S.disposed = false;
  if (opts.reduced != null) S.reduced = !!opts.reduced;
  else { try { S.reduced = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (_e) { S.reduced = false; } }
  if (typeof opts.cdn === 'string') S.cdn = opts.cdn;
  if (typeof opts.onReady === 'function') S.cbs.push(opts.onReady);
  if (typeof root.Two !== 'function' && typeof opts.inline === 'function') { try { var T = opts.inline(); if (typeof T === 'function') root.Two = T; } catch (_e) {} } // Standalone inline hook
  if (typeof root.Two === 'function') { fire(true); return true; }
  if (opts.cdn === false || !root.document || !root.document.head) { fire(false); return false; }
  if (S.loading) return false;
  try {
    S.loading = true; var sc = root.document.createElement('script'); sc.async = true; sc.src = S.cdn;
    sc.onload = function () { fire(typeof root.Two === 'function'); }; sc.onerror = function () { fire(false); };
    root.document.head.appendChild(sc);
  } catch (_e) { fire(false); }
  return false;
}
function onReady(cb) { if (typeof cb !== 'function') return; if (S.ready) cb(true); else S.cbs.push(cb); }
function dispose() { try { if (S.two) { S.two.clear(); S.two.release(); } } catch (_e) {} S.two = null; S.ready = S.loading = false; S.cbs = []; S.disposed = true; }

// ---- renderFrame = f(t). z-order: spotlight → diagram → counter → endcard → transition ----
function renderFrame(ctx2d, t, beat, palette, seed, P) {
  if (!ctx2d || !isAvailable()) return false;
  var two = ensureTwo(); if (!two) return false;
  var e = env(t, beat, palette, seed, P); if (!e) return false;
  try {
    two.clear();
    var out = { focus: spotlight(two, e), diagram: diagram(two, e), counter: counter(two, e), endcard: endcard(two, e), transition: transition(two, e), say: e.say.words.slice(0, e.say.shown(e.t)).join(' ') };
    two.update(); // manual, never play() (G06)
    ctx2d.save(); ctx2d.globalCompositeOperation = 'source-over'; ctx2d.globalAlpha = 1;
    ctx2d.drawImage(two.renderer.domElement, 0, 0, LW, LH); ctx2d.restore();
    return out;
  } catch (_e) { try { two.clear(); } catch (_e2) {} return false; }
}

root.TWO_LAYER_B = {
  id: 'two-layer-B', cdn: CDN, LW: LW, LH: LH,
  init: init, onReady: onReady, isAvailable: isAvailable, dispose: dispose, renderFrame: renderFrame,
  modules: { transition: transition, diagram: diagram, counter: counter, spotlight: spotlight, endcard: endcard, relation: relation, reverse: reverse, sayTiming: sayTiming, diagramOf: diagramOf, focusOf: focusOf, env: env, beatAt: beatAt },
  ease: { glaser: glaser, overshoot: overshoot }
};
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
