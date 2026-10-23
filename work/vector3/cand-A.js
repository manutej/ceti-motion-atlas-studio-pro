/* SCENE_A (lane vector r3, cand A, lens: labelled props) — film line: "A robot finds one adapter that opens every drawer".
 * Every terms(show) noun is its own labelled card/pill; arrows only on motion verbs; draws only via TWO_LAYER.renderFrame. */
(function (root) {
  'use strict';
  var VERSION = '3.0.0-A';
  var STOP = {};
  ('the and into from with that this then than them they their there here still hold holds wide open empty space back first frame ' +
    'echoing echo beat appears appear slide slides turns turn reads reading grow grows growing keeps keep past side floats float taps tap ' +
    'opens sprouts flips fans hammers calm pull pulls small each plugs plug reaches reaching shows show smooth straight labeled leans corner ground between')
    .split(' ').forEach(function (w) { STOP[w] = 1; });
  var MOTION = /^(reaches|slide|slides|taps|floats|plugs|opens|turns|grow|grows|growing|sprouts|fan|fans|hammers|flips)$/;
  var COUNT = { two: 2, three: 3, four: 4, five: 5, six: 6 };
  var STACKN = /^(potholes|detours|pages|cards)$/;
  var ANCHOR = { x: 0.06, y: 0.08, w: 0.24, h: 0.1 };          // plant / returns card: the callback reuses the hook's box
  var SHOWS = typeof WeakMap === 'function' ? new WeakMap() : null;

  function r4(v) { return Math.round(v * 1e4) / 1e4; }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'x'; }
  function quoted(low) { var out = [], re = /'([^']+)'/g, m; while ((m = re.exec(low))) out.push({ q: m[1], pos: m.index + 1, end: m.index + 1 + m[1].length }); return out; }
  function words(low, Q) {
    var out = [], re = /[a-z]+/g, m;
    while ((m = re.exec(low))) { var p = m.index, inQ = Q.some(function (q) { return p >= q.pos && p < q.end; }); if (!inQ) out.push({ w: m[0], pos: p, end: p + m[0].length }); }
    return out;
  }
  function isTerm(w) { return w.length >= 4 && !STOP[w]; }

  function terms(show) {
    var low = String(show || '').toLowerCase(), Q = quoted(low), all = [], seen = {};
    Q.forEach(function (q) { all.push({ t: q.q, pos: q.pos }); });
    words(low, Q).forEach(function (o) { if (isTerm(o.w)) all.push({ t: o.w, pos: o.pos }); });
    all.sort(function (a, b) { return a.pos - b.pos; });
    return all.filter(function (o) { if (seen[o.t]) return false; seen[o.t] = 1; return true; }).map(function (o) { return o.t; });
  }
  function covers(prims, t) { return prims.some(function (p) { return String(p.label || '').toLowerCase().indexOf(t) >= 0 || String(p.from || '').toLowerCase().indexOf(t) >= 0; }); }

  // ---------- inference: show -> labelled props (internal fields pos/end/src stripped before return) ----------
  function infer(beat, low) {
    var Q = quoted(low), W = words(low, Q), P = [], breather = beat.grammar === 'breather';
    Q.forEach(function (q) { P.push({ kind: 'pill', role: 'accent', label: q.q, from: q.q, pos: q.pos, end: q.end }); });
    var ph = beat.returns || (beat.grammar === 'hook' ? beat.plant : null);
    if (ph) {
      var pl = String(ph).toLowerCase(), f = low.indexOf(pl) >= 0 ? pl : null;
      if (!f) pl.split(/[^a-z]+/).forEach(function (tk) { if (tk && low.indexOf(tk) >= 0 && (!f || tk.length >= f.length)) f = tk; });
      if (f) P.push({ kind: 'card', role: 'highlight', label: pl, from: f, pos: low.indexOf(f), end: low.indexOf(f) + f.length, anchor: true });
    }
    // counter: grow|past|more|less + a number word or `bars`
    if (/\b(grow|grows|growing|past|more|less)\b/.test(low)) {
      var cm = /\bbars\b/.exec(low) || /\b(two|three|four|five|six|\d+)\b/.exec(low);
      if (cm) P.push({ kind: 'counter', role: 'contrast', label: cm[0], from: cm[0], pos: cm.index, end: cm.index + cm[0].length });
    }
    // lens: "<noun> into <count>" -> a labelled stack of that many (the one adapter, every drawer)
    W.forEach(function (o, i) {
      var c = W[i + 1];
      if (o.w !== 'into' || !c || !COUNT[c.w]) return;
      var head = null; for (var j = i - 1; j >= 0; j--) if (isTerm(W[j].w)) { head = W[j].w; break; }
      if (head) P.push({ kind: 'stack', role: 'ink', n: COUNT[c.w], label: c.w + ' ' + head + (/s$/.test(head) ? '' : 's'), from: low.slice(o.pos, c.end), pos: o.pos, end: c.end });
    });
    // phrases: adjacent terms (space only between) form one noun label, <= 3 words
    var phrases = [], cur = null;
    W.forEach(function (o, i) {
      if (!isTerm(o.w)) { cur = null; return; }
      if (cur && /^ +$/.test(low.slice(cur.end, o.pos)) && cur.ws.length < 3) { cur.ws.push(o.w); cur.end = o.end; }
      else { cur = { ws: [o.w], pos: o.pos, end: o.end, i: i }; phrases.push(cur); }
    });
    var isStack = function (p) { return p.ws.some(function (w) { return STACKN.test(w); }); };
    phrases.filter(isStack).forEach(function (p) { // stacks first: their count word ("three cards") is covered by the stack
      if (p.ws.every(function (w) { return covers(P, w); })) return;
      var n = 3, from = low.slice(p.pos, p.end);
      for (var k = p.i - 1; k >= 0 && k >= p.i - 2; k--) if (COUNT[W[k].w]) { n = COUNT[W[k].w]; from = low.slice(W[k].pos, p.end); break; }
      P.push({ kind: 'stack', role: 'ink', n: n, label: p.ws.join(' '), from: from, pos: low.indexOf(from), end: p.end });
    });
    phrases.forEach(function (p) {
      var label = p.ws.join(' ');
      if (isStack(p) || p.ws.every(function (w) { return covers(P, w); })) return;
      P.push({ kind: p.ws.length > 1 || label.length >= 7 ? 'card' : 'pill', role: 'ink', label: label, from: low.slice(p.pos, p.end), pos: p.pos, end: p.end });
    });
    P.sort(function (a, b) { return a.pos - b.pos; });
    if (breather) { // the emptiest frame: at most 2 props, no arrows, every term still labelled
      if (P.length > 2) {
        var h = Math.ceil(P.length / 2), A = P.slice(0, h), B = P.slice(h);
        P = [A, B].map(function (g) {
          if (g.length === 1) return g[0];
          var s = g[0].pos, e = g[g.length - 1].end;
          return { kind: 'card', role: 'ink', label: g.map(function (x) { return x.label; }).join(' · '), from: low.slice(s, e), pos: s, end: e };
        });
      }
      return P;
    }
    // arrows: one per motion verb, source -> object, unique pairs, max 2
    var nodes = P.filter(function (p) { return p.kind !== 'counter'; }), pairs = {}, arrows = [];
    W.forEach(function (o) {
      if (!MOTION.test(o.w) || arrows.length >= 2) return;
      var before = nodes.filter(function (p) { return p.pos < o.pos; }), after = nodes.filter(function (p) { return p.pos > o.pos; });
      var src = before[before.length - 1], dst = after[0];
      if (/^\s*out of\b/.test(low.slice(o.end))) { src = after[0]; dst = before[before.length - 1]; }
      if (src && !dst) dst = nodes.filter(function (p) { return p !== src; }).pop();
      if (!src || !dst || src === dst || pairs[src.pos + ':' + dst.pos] || pairs[dst.pos + ':' + src.pos]) return;
      pairs[src.pos + ':' + dst.pos] = 1;
      arrows.push({ kind: 'arrow', role: 'contrast', from: o.w, src: src, dst: dst });
    });
    arrows.forEach(function (a) { // arrow sits right after its source (source = nearest preceding node)
      var i = P.indexOf(a.src) + 1; while (P[i] && P[i].kind === 'arrow') i++;
      P.splice(i, 0, a);
    });
    return P;
  }

  // ---------- layout: anchor card top-left, the rest in 1-2 rows above the text box ----------
  var SIZE = { card: [0.18, 0.1], pill: [0.12, 0.08], stack: [0.12, 0.08], counter: [0.2, 0.12], bracket: [0.12, 0.08], mask: [0.16, 0.16], path: [0.12, 0.08] };
  function layout(P, breather) {
    var L = P.filter(function (p) { return p.kind !== 'arrow' && !p.anchor; }), rows = breather || L.length <= 3 ? 1 : 2, per = Math.max(1, Math.ceil(L.length / rows));
    L.forEach(function (p, i) {
      var r = Math.floor(i / per), j = i % per, inRow = Math.min(per, L.length - r * per), sz = SIZE[p.kind] || SIZE.card;
      var cx = 0.08 + 0.84 * (j + 0.5) / inRow, cy = breather ? 0.26 : rows === 1 ? 0.4 : (r ? 0.56 : 0.32), w = sz[0], h = sz[1];
      if (p.kind === 'stack') { var fx = 0.025 * (p.n - 1), fy = 0.02 * (p.n - 1); p.box = { x: r4(cx - (w + fx) / 2), y: r4(cy - (h + fy) / 2), w: r4(w + fx), h: r4(h + fy) }; }
      else p.box = { x: r4(cx - w / 2), y: r4(cy - h / 2), w: w, h: h };
    });
    P.forEach(function (p) { if (p.anchor) p.box = { x: ANCHOR.x, y: ANCHOR.y, w: ANCHOR.w, h: ANCHOR.h }; });
  }
  function centre(b) { return { x: r4(b.x + b.w / 2), y: r4(b.y + b.h / 2) }; }
  function hits(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }

  function textBoxOf(beat) {
    var t = beat.textBox;
    if (t && typeof t === 'object') return JSON.parse(JSON.stringify(t));
    return beat.grammar === 'breather' ? { x: 0.3, y: 0.42, w: 0.4, h: 0.12 } : { x: 0.08, y: 0.76, w: 0.84, h: 0.16 };
  }
  function characterOf(beat, tb) {
    var cp = beat.characterPose || {}, s = cp.scale || 1;
    var pose = { x: cp.x != null ? cp.x : 0.5, y: cp.y != null ? cp.y : 0.5, rot: cp.rot || 0, scale: s, rung: cp.rung || 1 };
    var box = { x: r4(pose.x - 0.12 * s), y: r4(pose.y - 0.12 * s), w: r4(0.24 * s), h: r4(0.24 * s) };
    box.x = r4(Math.min(Math.max(box.x, 0), 1 - box.w)); box.y = r4(Math.min(Math.max(box.y, 0), 1 - box.h));
    if (hits(box, tb)) { var up = tb.y - box.h - 0.01; box.y = r4(up >= 0 ? up : Math.min(1 - box.h, tb.y + tb.h + 0.01)); }
    return { visible: !!beat.character, pose: pose, box: box };
  }

  /** fromBeat(beat, tokens, seed) -> { primitives, character, hotspot, textBox }  (seed unused: no jitter) */
  function fromBeat(beat, tokens, seed) {
    beat = beat || {};
    var show = String(beat.show || ''), low = show.toLowerCase(), idx = beat.index | 0, tb = textBoxOf(beat), P;
    var ov = beat.scene && Array.isArray(beat.scene.primitives) ? beat.scene.primitives : null;
    if (ov) P = ov.filter(function (p) { return p && p.from && low.indexOf(String(p.from).toLowerCase()) >= 0; }).map(function (p) { return JSON.parse(JSON.stringify(p)); });
    else { P = infer(beat, low); layout(P, beat.grammar === 'breather'); }
    var ids = {};
    P.forEach(function (p) { var b = 'b' + idx + '_' + slug(p.label || p.kind), id = b, k = 2; while (ids[id]) id = b + '_' + k++; ids[id] = 1; if (!ov || !p.id) p.id = id; });
    P.forEach(function (p) {
      if (p.kind !== 'arrow' || ov) return;
      var a = centre(p.src.box), b = centre(p.dst.box);
      p.to = p.dst.id; p.box = { x: r4(Math.min(a.x, b.x)), y: r4(Math.min(a.y, b.y)), w: r4(Math.max(0.02, Math.abs(a.x - b.x))), h: r4(Math.max(0.02, Math.abs(a.y - b.y))) };
    });
    var say = String(beat.say || '').replace(/\s+/g, ' ').trim(), nw = say ? say.split(' ').length : 1, m = P.length;
    var t0 = Number(beat.tStartSec) || 0, t1 = Number(beat.tEndSec); if (!(t1 > t0)) t1 = t0 + 1.5;
    var prims = P.map(function (p, i) {
      var o = { kind: p.kind, id: p.id, role: p.role || 'ink', box: p.box || { x: 0.42, y: 0.3, w: 0.16, h: 0.1 } };
      if (p.label != null && p.kind !== 'arrow') o.label = String(p.label);
      o.from = String(p.from);
      o.word = ov && p.word != null ? p.word | 0 : (m === 1 ? 0 : Math.round(i * (nw - 1) / (m - 1)));
      if (!say) o.at = r4(t0 + 0.35 * (t1 - t0)); else if (ov && p.at != null && p.at >= t0 && p.at < t1) o.at = p.at;
      if (p.kind === 'stack') o.n = Math.min(6, Math.max(2, p.n | 0 || 3));
      if (p.to) o.to = String(p.to);
      return o;
    });
    var character = characterOf(beat, tb), last = null;
    prims.forEach(function (p) { if (!last || p.word >= last.word) last = p; });
    var hotspot = last ? centre(last.box) : centre(character.box);
    var sc = { primitives: prims, character: character, hotspot: hotspot, textBox: tb };
    if (SHOWS) SHOWS.set(sc, show);
    return sc;
  }

  /** coverage(scene[, show]) -> { showTermsMatched, unmatched } — show remembered for scenes made by fromBeat */
  function coverage(scene, show) {
    var s = show != null ? show : (SHOWS && scene && SHOWS.get(scene));
    if (s == null) return { showTermsMatched: [], unmatched: ['(show unknown)'] };
    var P = (scene && scene.primitives) || [], vis = !!(scene.character && scene.character.visible), M = [], U = [];
    terms(s).forEach(function (t) { ((vis && /^(robot|character)$/.test(t)) || covers(P, t) ? M : U).push(t); });
    return { showTermsMatched: M, unmatched: U };
  }

  /** toDiagram(scene) -> { nodes, edges } (contract kind -> grammar map) */
  function toDiagram(scene) {
    var P = (scene && scene.primitives) || [], nodes = [], edges = [], head = {}, src = {}, prev = null;
    P.forEach(function (p) {
      var c = centre(p.box);
      if (p.kind === 'card' || p.kind === 'pill') { nodes.push({ id: p.id, x: c.x, y: c.y, label: p.label || '', shape: 'pill', word: p.word }); head[p.id] = p.id; }
      else if (p.kind === 'stack') {
        var n = Math.min(6, Math.max(2, p.n || 3)), bx = p.box.x + (p.box.w - 0.025 * (n - 1)) / 2, by = p.box.y + p.box.h - (p.box.h - 0.02 * (n - 1)) / 2;
        for (var i = 0; i < n; i++) nodes.push({ id: p.id + '_' + i, x: r4(bx + 0.025 * i), y: r4(by - 0.02 * i), label: i === n - 1 ? p.label || '' : '', shape: 'pill', word: p.word });
        head[p.id] = p.id + '_' + (n - 1);
      } else if (p.kind === 'bracket') { nodes.push({ id: p.id, x: c.x, y: c.y, label: p.label || '', shape: 'pill', word: p.word }); edges.push({ from: p.id, kind: 'bracket', word: p.word }); head[p.id] = p.id; }
      if (p.kind !== 'arrow' && p.kind !== 'path' && p.kind !== 'counter' && p.kind !== 'mask') prev = p;
      if ((p.kind === 'arrow' || p.kind === 'path') && prev) src[p.id] = prev.id;
    });
    P.forEach(function (p) {
      var s = src[p.id] && head[src[p.id]], t = p.to && head[p.to];
      if (!s || !t) return;
      if (p.kind === 'arrow') { edges.push({ from: s, to: t, kind: 'arrow', word: p.word }); return; }
      var A = nodes.filter(function (q) { return q.id === s; })[0], B = nodes.filter(function (q) { return q.id === t; })[0], chain = [s];
      for (var i = 1; i <= 2; i++) { var id = p.id + '_d' + (i - 1); nodes.push({ id: id, x: r4(A.x + (B.x - A.x) * i / 3), y: r4(A.y + (B.y - A.y) * i / 3), label: '', shape: 'dot', word: p.word }); chain.push(id); }
      chain.push(t);
      for (var j = 0; j < chain.length - 1; j++) edges.push({ from: chain[j], to: chain[j + 1], kind: 'arrow', word: p.word });
    });
    return { nodes: nodes, edges: edges };
  }

  function counterOf(p, beat) {
    var say = String(beat.say || ''), nums = say.match(/\d+(\.\d+)?/g) || [], um = /\d+(?:\.\d+)?\s+([a-z]+)/i.exec(say), c = centre(p.box);
    return { from: nums.length > 1 ? Number(nums[0]) : 0, to: nums.length ? Number(nums[nums.length - 1]) : (p.n || 1), unit: um ? um[1] : '', x: c.x, y: c.y, word: p.word };
  }

  /** render(ctx2d, scene, t, pass, opts) -> false | TWO_LAYER meta. Only path: TWO_LAYER.renderFrame with b2. */
  function render(ctx, scene, t, pass, opts) {
    var TL = root.TWO_LAYER;
    if (!TL || typeof TL.isAvailable !== 'function' || !TL.isAvailable() || !scene || !scene.primitives) return false;
    var o = opts || {}, beat = o.beat || {}, cp = scene.primitives.filter(function (p) { return p.kind === 'counter'; })[0];
    var b2 = Object.assign({}, beat, { diagram: toDiagram(scene), focus: { x: scene.hotspot.x, y: scene.hotspot.y, r: 0.2 }, counter: cp ? counterOf(cp, beat) : undefined });
    return TL.renderFrame(ctx, t, b2, o.palette, o.seed, o.P, { pass: pass, sheet: o.sheet, reduced: o.reduced, captionsCovered: o.captionsCovered });
  }

  var API = { VERSION: VERSION, fromBeat: fromBeat, render: render, coverage: coverage, terms: terms, toDiagram: toDiagram };
  root.SCENE_A = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
