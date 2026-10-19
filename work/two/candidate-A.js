/*! TWO_LAYER_A — "living vector atmosphere" (CETI Motion Atlas Studio Pro v9, model-soup candidate A)
 *  Deterministic two.js layer: offscreen Two.Types.canvas, autostart:false, manual two.update(),
 *  composited into MA.render before the grain pass. Every module is a pure function of
 *  (t, beat, palette, seed). No unseeded randomness, no wall-clock reads. No-op when `Two` is undefined.
 *  API: window.TWO_LAYER_A = { init, renderFrame, modules, isAvailable, dispose, load, audit, CDN_URL } */
(function (root) {
  'use strict';
  var LW = 480, LH = 300, TAU = Math.PI * 2, CYCLE = 12;
  var MONO = '"JetBrains Mono","IBM Plex Mono",ui-monospace,Menlo,monospace';
  var CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/two.js/0.8.17/two.min.js';
  var cfg = { reducedMotion: false, captionsCovered: false, alpha: 1 };

  // ---------- pure math (closed-form; nothing simulated, nothing stateful) ----------
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function mulberry(seed) { // seeded PRNG; a fresh stream per (module, beat) so frames never share state
    var a = (seed >>> 0) || 1;
    return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function hashStr(s) { var h = 2166136261; s = String(s || ''); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function bez(x1, y1, x2, y2) {
    return function (x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      var t = x;
      for (var i = 0; i < 8; i++) {
        var bx = 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t - x;
        var d = 3 * x1 * (1 - t) * (1 - t) + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
        if (Math.abs(d) < 1e-6) break;
        t = clamp(t - bx / d, 0, 1);
      }
      return 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t;
    };
  }
  var glaser = bez(0.22, 1, 0.36, 1), rest = bez(0.4, 0, 0.6, 1);
  // Glaser ceremonial overshoot, closed form: 0 at s=0, peaks ~1.12, settles to 1 by s=1.
  function overshoot(s) { s = clamp(s, 0, 1); return 1 - Math.exp(-5.5 * s) * Math.cos(4.2 * s); }
  function smooth(s) { s = clamp(s, 0, 1); return s * s * (3 - 2 * s); }
  function hexOk(h) { return typeof h === 'string' && /^#[0-9a-f]{6}$/i.test(h); }
  function rgba(h, a) { if (!hexOk(h)) return h; var n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + clamp(a, 0, 1).toFixed(3) + ')'; }

  // ---------- (5) palette lock: the only colour source any module may touch (G01) ----------
  function lockPalette(P, pal) {
    var src = (P && hexOk(P.ink) && hexOk(P.paper)) ? P : (pal || {});
    var sw = (src.swHex || src.sw || []).map(function (s) { return Array.isArray(s) ? s[0] : s; });
    var C = {
      paper: hexOk(src.paper) ? src.paper : '#f4ecdc', ink: hexOk(src.ink) ? src.ink : '#1a1f2e',
      a: hexOk(src.a) ? src.a : (sw[0] || '#ebd3a2'), h: hexOk(src.h) ? src.h : (sw[1] || '#ae5224'),
      b: hexOk(src.b) ? src.b : (sw[2] || '#6b7a8f'), c: hexOk(src.c) ? src.c : (sw[3] || '#1a1f2e')
    };
    C.allowed = [C.paper, C.ink, C.a, C.h, C.b, C.c].map(function (x) { return x.toLowerCase(); });
    C.focus = function (role) { return role === 'accentFocal' ? C.h : role === 'supportWash' ? C.a : C.b; };
    return C;
  }

  // camera vocab tag -> [dx, dy, zoom] drift the parallax planes follow
  var CAMS = { 'static-wide': [0, 0, 0], 'pan-follow': [1, 0, 0], 'pan': [1, 0, 0], 'push-in': [0, 0, 1], 'push': [0, 0, 1],
    'dutch-tilt': [0.3, 0, 0.2], 'tracking-drift': [-0.5, 0.5, 0.4], 'breather-hold': [0, 0, -0.3],
    'kick-shake': [0, -0.8, 0.9], 'pull-back': [0.4, 0, -0.5], 'pull': [0.4, 0, -0.5] };
  var INTENSITY = { hook: 0.7, threshold: 0.6, escalation: 0.8, turn: 0.85, filter: 0.6, breather: 0.3, climax: 1, callback: 0.55 };

  // ---------- beat normaliser: storyboard beat (or synthesized 12 s grid) -> local progress s ----------
  function normBeat(beat, T, reduced) {
    var b = beat || {}, idx, t0, t1;
    T = Number(T) || 0;
    if (typeof b.tStartSec === 'number') { idx = b.index | 0; t0 = b.tStartSec; t1 = typeof b.tEndSec === 'number' ? b.tEndSec : t0 + CYCLE / 8; }
    else { var w = ((T % CYCLE) + CYCLE) % CYCLE; idx = Math.min(7, Math.floor(w / (CYCLE / 8))); t0 = idx * CYCLE / 8; t1 = t0 + CYCLE / 8; }
    var dur = Math.max(0.05, t1 - t0);
    var local = (((T - t0) % CYCLE) + CYCLE) % CYCLE;       // wrap onto the 12 s studio clock
    var s = reduced ? 1 : clamp(local / dur, 0, 1);         // G16: reduced motion -> resolution frame
    var pose = b.characterPose || {};
    var say = String(b.say || b.label || '').replace(/\s+/g, ' ').trim().slice(0, 48);
    return {
      idx: idx, s: s, role: b.role || 'hook', hinge: b.hinge === 'BUT' ? 'BUT' : 'THEREFORE',
      cam: b.cameraMove || 'static-wide', focusRole: b.wadaFocusRole || 'secondaryStructure',
      intensity: INTENSITY[b.role] != null ? INTENSITY[b.role] : 0.65, say: say,
      pose: { x: pose.x != null ? pose.x : 0.5, y: pose.y != null ? pose.y : 0.5, rot: pose.rot || 0, scale: pose.scale || 1, rung: clamp(pose.rung || 1, 1, 5) }
    };
  }

  // ---------- (1) flow-field ribbons: ink pours along the trajectory, overshoots, snaps, tail releases ----------
  function ribbons(B, C, seed) {
    var out = [], n = B.role === 'breather' ? 1 : 3, rnd = mulberry(seed ^ 0x5151 ^ (B.idx * 977));
    var px = B.pose.x * LW, py = B.pose.y * LH, dir = B.hinge === 'BUT' ? -1 : 1;
    var ex = px - dir * (150 + 60 * B.intensity), ey = py + (B.idx % 2 ? 42 : -42);
    var cols = [C.focus(B.focusRole), C.b, C.a], M = 22;
    var e = glaser(clamp(B.s / 0.7, 0, 1)), bg = 0.55 * rest(clamp((B.s - 0.5) / 0.5, 0, 1));
    for (var i = 0; i < n; i++) {
      var off = (i - (n - 1) / 2) * 11, amp = 16 + 22 * rnd(), ph = rnd() * TAU, pts = [];
      for (var j = 0; j <= M; j++) {
        var u = j / M;
        var w = u < 0.8 ? overshoot(u / 0.8 * 0.55) / overshoot(0.55) : 1 + 0.14 * Math.sin((u - 0.8) / 0.2 * Math.PI); // approach, then +14% overshoot leg
        var field = Math.sin(u * TAU * 1.5 + ph) * amp * (1 - u) + Math.cos(u * TAU * 0.5 + B.idx) * 6;        // closed-form flow field
        pts.push([lerp(ex, px, w), lerp(ey, py, w) + off + field]);
      }
      out.push({ k: 'path', id: 'rib' + i, pts: pts, closed: false, curved: true, stroke: cols[i % 3], fill: null,
        lw: 2.2 + 2.4 * B.intensity - i * 0.5, op: (0.55 + 0.35 * B.intensity) * (1 - 0.18 * i), b: bg, e: e, pass: i === 0 ? 'front' : 'back' });
    }
    return out;
  }

  // ---------- (2) Saul Bass cutouts: silhouette breathes between reduction rungs (5-rung ladder aware) ----------
  function rungShape(r, N, q) { // polar silhouettes with identical vertex counts so rungs interpolate vertex-for-vertex
    var pts = [];
    for (var j = 0; j < N; j++) {
      var a = j / N * TAU, c = Math.cos(a), s = Math.sin(a), x, y;
      if (r <= 1) { var rr = 1 / Math.pow(Math.pow(Math.abs(c), 2.6) + Math.pow(Math.abs(s / 0.42), 2.6), 1 / 2.6); var fl = c < -0.55 ? 1 + 0.6 * Math.abs(s) * Math.pow(-c, 3) : 1; x = rr * c * (1 + 0.08 * q); y = rr * s * fl; }
      else if (r === 2) { x = c; y = 0.36 * s * (1.15 + 0.55 * c); }                       // teardrop
      else if (r === 3) { x = 0.92 * c; y = 0.42 * s * Math.sqrt(Math.abs(c)) ; }             // vesica lens
      else if (r === 4) { x = c / Math.pow(Math.pow(Math.abs(c), 6) + Math.pow(Math.abs(s), 6), 1 / 6) * 0.9; y = s / Math.pow(Math.pow(Math.abs(c), 6) + Math.pow(Math.abs(s), 6), 1 / 6) * 0.22; } // bar
      else { x = 0.3 * c; y = 0.3 * s; }                                                        // signal dot
      pts.push([x, y]);
    }
    return pts;
  }
  function cutouts(B, C, seed) {
    var N = 28, q = mulberry(seed ^ 0xC0DE)(), r0 = B.pose.rung, r1 = Math.min(5, r0 + 1);
    var m = B.role === 'breather' ? 0.25 * (0.5 - 0.5 * Math.cos(TAU * B.s)) : smooth(0.5 - 0.5 * Math.cos(TAU * B.s)); // rung -> rung+1 -> rung
    var A = rungShape(r0, N, q), Z = rungShape(r1, N, q), dir = B.hinge === 'BUT' ? -1 : 1;
    var px = B.pose.x * LW - dir * 38, py = B.pose.y * LH + 12, rot = B.pose.rot, out = [];
    [[70 * B.pose.scale, 0.16 + 0.1 * B.intensity, C.b, 'cut0'], [96 * B.pose.scale, 0.07 + 0.05 * B.intensity, C.focus(B.focusRole), 'cut1']].forEach(function (L, li) {
      var sc = L[0], pts = [], cr = Math.cos(rot), sr = Math.sin(rot), lag = li * 16 * dir;
      for (var j = 0; j < N; j++) { var x = lerp(A[j][0], Z[j][0], m) * sc, y = lerp(A[j][1], Z[j][1], m) * sc * 0.85; pts.push([px - lag + x * cr - y * sr, py + x * sr + y * cr]); }
      out.push({ k: 'path', id: L[3], pts: pts, closed: true, curved: r1 < 4, fill: L[2], stroke: null, lw: 0, op: L[1], b: 0, e: 1, pass: 'back' });
    });
    return out;
  }

  // ---------- (3) kinetic typography: the beat's `say` line draws on letter by letter, tracking tightens ----------
  function kinetic(B, C, seed, hide) {
    if (hide || !B.say) return [];
    var str = B.say.toUpperCase(), n = str.length, out = [], x0 = 18, y = LH - 22;
    var sp = lerp(11, 7.4, glaser(clamp(B.s / 0.6, 0, 1)));
    for (var i = 0; i < n; i++) {
      if (str[i] === ' ') continue;
      var li = glaser(clamp((B.s * 1.8 - i * 0.045) / 0.35, 0, 1));
      out.push({ k: 'text', id: 'ty' + i, v: str[i], x: x0 + i * sp, y: y + (1 - li) * 9, size: 11, weight: 700,
        fill: C.ink, fillOp: li, stroke: C.ink, lw: (1 - li) * 1.4, op: 0.25 + 0.75 * li, pass: 'front' });
    }
    out.push({ k: 'path', id: 'tyrule', pts: [[x0, y + 8], [x0 + n * sp, y + 8]], closed: false, curved: false, fill: null, stroke: C.focus(B.focusRole),
      lw: 1.6, op: 0.9, b: 0, e: glaser(clamp((B.s - 0.1) / 0.7, 0, 1)), pass: 'front' });
    return out;
  }

  // ---------- (4) depth parallax: 3 planes of Wada shapes drift with the camera vocab tag ----------
  function parallax(B, C, seed) {
    var out = [], rnd = mulberry(seed ^ 0xA7A7 ^ (B.idx * 31)), cam = CAMS[B.cam] || [0, 0, 0], s = smooth(B.s);
    [[0.35, 'back', C.a, 5], [0.65, 'back', C.b, 4], [1.35, 'front', C.focus(B.focusRole), 3]].forEach(function (pl, pi) {
      var depth = pl[0], count = B.role === 'breather' ? Math.max(2, pl[3] - 2) : pl[3];
      var dx = cam[0] * depth * 26 * s, dy = cam[1] * depth * 18 * s, zz = 1 + cam[2] * (depth - 1) * 0.12 * s;
      for (var i = 0; i < count; i++) {
        var kind = rnd(), x = 30 + rnd() * (LW - 60), yv = 30 + rnd() * (LH - 60), r = 6 + rnd() * 22 * depth, ang = rnd() * TAU; // fixed draw order per frame
        var cx = LW / 2 + (x - LW / 2) * zz + dx, cy = LH / 2 + (yv - LH / 2) * zz + dy;
        var op = (pl[1] === 'back' ? 0.1 + 0.12 * depth : 0.08) * (0.6 + 0.4 * B.intensity);
        if (kind < 0.5) out.push({ k: 'circle', id: 'px' + pi + '_' + i, x: cx, y: cy, r: r * zz, fill: pl[2], op: op, pass: pl[1] });
        else { var len = r * 3; out.push({ k: 'path', id: 'px' + pi + '_' + i, pts: [[cx - Math.cos(ang) * len, cy - Math.sin(ang) * len], [cx + Math.cos(ang) * len, cy + Math.sin(ang) * len]],
          closed: false, curved: false, fill: null, stroke: pl[2], lw: 2 + depth * 2, op: op, b: 0, e: 1, pass: pl[1] }); }
      }
    });
    return out;
  }

  // scene = pure data; the applier below is the only place that touches two.js
  function scene(T, beat, palette, seed, P, opts) {
    var o = opts || {}, B = normBeat(beat, T, o.reducedMotion != null ? o.reducedMotion : cfg.reducedMotion), C = lockPalette(P, palette);
    var sd = ((seed | 0) ^ hashStr(C.ink + C.a + C.h)) >>> 0;
    var items = [].concat(parallax(B, C, sd), cutouts(B, C, sd), ribbons(B, C, sd), kinetic(B, C, sd, o.captionsCovered != null ? o.captionsCovered : cfg.captionsCovered));
    return { B: B, C: C, items: items };
  }
  function audit(T, beat, palette, seed, P, opts) { // G30 hook: every fill/stroke must come from the Wada combination
    var S = scene(T, beat, palette, seed, P, opts), bad = [];
    S.items.forEach(function (d) { [d.fill, d.stroke].forEach(function (c) { if (c && S.C.allowed.indexOf(String(c).toLowerCase()) < 0) bad.push(d.id + ':' + c); }); });
    return { ok: bad.length === 0, offPalette: bad, count: S.items.length };
  }

  // ---------- two.js applier (retained objects, every property re-set from the scene each frame) ----------
  var two = null, pool = {}, gBack = null, gFront = null;
  function isAvailable() {
    var Two = root.Two;
    return typeof Two === 'function' && !!(Two.Types && Two.Types.canvas) && typeof document !== 'undefined' && !!document && typeof document.createElement === 'function';
  }
  function ensure() {
    if (two) return true;
    if (!isAvailable()) return false;
    try {
      two = new root.Two({ type: root.Two.Types.canvas, width: LW, height: LH, autostart: false, ratio: 1 });
      try { two.renderer.setSize(LW, LH, 1); } catch (_e) { /* older builds */ }
      gBack = two.makeGroup(); gFront = two.makeGroup();
    } catch (_e2) { two = null; return false; }
    return true;
  }
  function obtain(d) {
    var sig = d.k + (d.k === 'path' ? ':' + d.pts.length : ''), e = pool[d.id];
    if (e && e.sig === sig) return e.obj;
    if (e) { try { e.obj.remove(); } catch (_e) { /* ignore */ } }
    var obj;
    if (d.k === 'circle') obj = two.makeCircle(0, 0, 1);
    else if (d.k === 'text') obj = two.makeText('', 0, 0, { family: MONO, alignment: 'left', baseline: 'middle' });
    else { var flat = []; d.pts.forEach(function (p) { flat.push(p[0], p[1]); }); flat.push(!d.closed); obj = two.makePath.apply(two, flat); }
    (d.pass === 'back' ? gBack : gFront).add(obj);
    pool[d.id] = { sig: sig, obj: obj };
    return obj;
  }
  function apply(d) {
    var o = obtain(d), pos = o.position || o.translation;
    o.visible = true; o.opacity = d.op;
    if (d.k === 'circle') { pos.set(d.x, d.y); o.radius = d.r; o.fill = d.fill; o.noStroke(); return; }
    if (d.k === 'text') { pos.set(d.x, d.y); o.value = d.v; o.size = d.size; o.weight = d.weight; o.fill = rgba(d.fill, d.fillOp == null ? 1 : d.fillOp); o.stroke = d.stroke; o.linewidth = d.lw; return; }
    var vs = o.vertices;
    for (var i = 0; i < d.pts.length; i++) { vs[i].x = d.pts[i][0]; vs[i].y = d.pts[i][1]; }
    o.closed = !!d.closed; o.curved = !!d.curved; o.automatic = true;
    if (d.fill) o.fill = d.fill; else o.noFill();
    if (d.stroke) o.stroke = d.stroke; else o.noStroke();
    o.linewidth = d.lw || 0; o.beginning = d.b || 0; o.ending = d.e == null ? 1 : d.e; o.cap = 'round'; o.join = 'round';
  }

  /** renderFrame(ctx2d, T, beat, palette, seed, P, opts?) — opts.pass: 'back' | 'front' | 'all' (default). Returns true if composited. */
  function renderFrame(ctx, T, beat, palette, seed, P, opts) {
    if (!ctx || typeof ctx.drawImage !== 'function' || !ensure()) return false;
    var o = opts || {}, pass = o.pass || 'all', S = scene(T, beat, palette, seed, P, o), touched = {};
    for (var i = 0; i < S.items.length; i++) { apply(S.items[i]); touched[S.items[i].id] = 1; }
    for (var k in pool) if (!touched[k]) pool[k].obj.visible = false;
    gBack.visible = pass !== 'front'; gFront.visible = pass !== 'back';
    two.update();
    ctx.save(); ctx.globalAlpha = o.alpha != null ? o.alpha : cfg.alpha; ctx.drawImage(two.renderer.domElement, 0, 0, LW, LH); ctx.restore();
    return true;
  }
  function init(opts) {
    opts = opts || {};
    if (opts.reducedMotion != null) cfg.reducedMotion = !!opts.reducedMotion;
    else { try { cfg.reducedMotion = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (_e) { cfg.reducedMotion = false; } }
    if (opts.captionsCovered != null) cfg.captionsCovered = !!opts.captionsCovered;
    if (opts.alpha != null) cfg.alpha = clamp(Number(opts.alpha), 0, 1);
    return ensure();
  }
  function dispose() { if (two) { try { two.clear(); } catch (_e) { /* ignore */ } } two = null; pool = {}; gBack = gFront = null; }

  /** load({cdn?, inline?}) -> Promise<boolean>. Standalone bundle sets window.__TWO_INLINE_SRC (two.min.js source) via build-package.mjs;
   *  modular build injects the cdnjs script tag; on any failure the layer stays a silent no-op. */
  function load(o) {
    o = o || {};
    return new Promise(function (res) {
      if (isAvailable()) return res(true);
      var inline = o.inline != null ? o.inline : root.__TWO_INLINE_SRC;
      if (typeof inline === 'function') { try { inline(); } catch (_e) { /* ignore */ } if (isAvailable()) return res(true); }
      else if (typeof inline === 'string' && inline.length) { try { (new Function(inline))(); } catch (_e2) { /* ignore */ } return res(isAvailable()); }
      if (o.cdn === false || typeof document === 'undefined' || !document.createElement) return res(false);
      var s = document.createElement('script'); s.src = o.cdn || CDN_URL; s.async = true;
      s.onload = function () { res(isAvailable()); }; s.onerror = function () { res(false); };
      var host = document.head || document.body || document.documentElement; if (!host || !host.appendChild) return res(false);
      host.appendChild(s);
    });
  }

  root.TWO_LAYER_A = {
    init: init, renderFrame: renderFrame, isAvailable: isAvailable, dispose: dispose, load: load, audit: audit, CDN_URL: CDN_URL,
    modules: { ribbons: ribbons, cutouts: cutouts, kinetic: kinetic, parallax: parallax, paletteLock: lockPalette, scene: scene, normBeat: normBeat, rungShape: rungShape, overshoot: overshoot, glaser: glaser }
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
