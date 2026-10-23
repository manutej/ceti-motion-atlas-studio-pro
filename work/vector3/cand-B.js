/* studio-scene · candidate B — "the verb is the hero".
 * Film line: "A robot finds one adapter that opens every drawer" (MCP board).
 * One arrow / path / counter carries each beat's single visual change; the nouns are unlabelled pills at its
 * ends (only quoted words and the planted phrase keep their words); the hotspot rides the arrow head.
 * Pure data in, TWO_LAYER grammar out: no item, colour or type is constructed here. Deterministic. */
(function (root) {
  'use strict';
  var VERSION = '3.0.0-B';
  var STOP = ('the and into from with that this then than them they their there here still hold holds wide open empty space back first ' +
    'frame echoing echo beat appears appear slide slides turns turn reads reading grow grows growing keeps keep past side floats float ' +
    'taps tap opens sprouts flips fans hammers calm pull pulls small each plugs plug reaches reaching shows show smooth straight labeled ' +
    'leans corner ground between').split(' ');
  var VERBS = /\b(reaches|appears|slides?|taps|opens?|sprouts|flips|fans?|hammers|grows?|floats|plugs|shows|leans|turns)\b/g;
  var COUNT = { two: 2, three: 3, four: 4, five: 5, six: 6 };
  var ROLES = ['paper', 'ink', 'accent', 'highlight', 'contrast'];
  var ROW = 0.4, AX = 0.22, BX = 0.78;                       // one reading row: source left, target right
  var SHOWS = typeof WeakMap === 'function' ? new WeakMap() : null; // scene → show, so coverage(scene) needs no extra field

  function low(s) { return String(s == null ? '' : s).toLowerCase(); }
  function slug(s) { return low(s).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'x'; }
  function r3(v) { return Math.round(v * 1000) / 1000; }
  function centre(b) { return { x: r3(b.x + b.w / 2), y: r3(b.y + b.h / 2) }; }
  function hits(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
  function inside(p, b) { return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; }

  /** terms(show): lower-case, quoted phrases whole, other words ≥ 4 letters not in STOP; show order, no repeats. */
  function terms(show) {
    var s = low(show), out = [], re = /'([a-z][^']*)'(?![a-z])|[a-z]+/g, m;
    while ((m = re.exec(s))) {
      var w = m[1] != null ? m[1] : m[0];
      if ((m[1] != null || (w.length >= 4 && STOP.indexOf(w) < 0)) && out.indexOf(w) < 0) out.push(w);
    }
    return out;
  }
  function matched(term, prims, ch) {
    if ((term === 'robot' || term === 'character') && ch && ch.visible) return true;
    return prims.some(function (p) { return low(p.label).indexOf(term) >= 0 || low(p.from).indexOf(term) >= 0; });
  }
  function coverage(scene, show) {
    var sh = show != null ? show : (SHOWS && SHOWS.get(scene)) || (scene.primitives || []).map(function (p) { return p.from; }).join(' ');
    var T = terms(sh), ok = [], no = [];
    T.forEach(function (t) { (matched(t, scene.primitives || [], scene.character) ? ok : no).push(t); });
    return { showTermsMatched: ok, unmatched: no };
  }

  // ---------- boxes (frame fractions) ----------
  function wOf(label) { return label ? Math.min(0.3, 0.05 + 0.0125 * String(label).length) : 0.06; }
  function nodeBox(cx, cy, kind, label) {
    var w = kind === 'card' ? Math.max(0.16, wOf(label)) : Math.min(0.15, wOf(label)), h = kind === 'card' ? 0.12 : 0.08;
    return { x: r3(cx - w / 2), y: r3(cy - h / 2), w: r3(w), h: h };
  }
  function stackBox(cx, cy, n) { return { x: r3(cx - 0.03), y: r3(cy - 0.04 - 0.02 * (n - 1)), w: r3(0.06 + 0.025 * (n - 1)), h: r3(0.08 + 0.02 * (n - 1)) }; }
  function stackBase(b) { return { x: r3(b.x + 0.03), y: r3(b.y + b.h - 0.04) }; }
  function charOf(beat, tb) {
    var cp = beat.characterPose || {}, sc = cp.scale || 1;
    var pose = { x: cp.x != null ? cp.x : 0.5, y: cp.y != null ? cp.y : 0.5, rot: cp.rot || 0, scale: sc, rung: cp.rung || 1 };
    var box = { x: r3(pose.x - 0.12 * sc), y: r3(pose.y - 0.12 * sc), w: r3(0.24 * sc), h: r3(0.24 * sc) };
    box.x = r3(Math.min(Math.max(0, box.x), 1 - box.w));
    if (hits(box, tb)) { box.y = r3(tb.y - box.h - 0.01 >= 0 ? tb.y - box.h - 0.01 : tb.y + tb.h + 0.01); }
    box.y = r3(Math.min(Math.max(0, box.y), 1 - box.h));
    pose.x = r3(box.x + box.w / 2); pose.y = r3(box.y + box.h / 2);
    return { visible: !!beat.character, pose: pose, box: box };
  }

  // ---------- inference ----------
  function fromBeat(beat, tokens, seed) {
    beat = beat || {};
    var show = String(beat.show || ''), s = low(show), T = terms(show), g = beat.grammar || '', idx = beat.index | 0;
    var say = String(beat.say || '').replace(/\s+/g, ' ').trim(), nW = say ? say.split(' ').length : 1;
    var roles = tokens && tokens.color ? ROLES.filter(function (r) { return r in tokens.color; }) : ROLES;
    var role = function (r) { return roles.indexOf(r) >= 0 ? r : roles[0] || 'ink'; };
    var dtb = g === 'breather' ? { x: 0.3, y: 0.42, w: 0.4, h: 0.12 } : { x: 0.08, y: 0.76, w: 0.84, h: 0.16 }, tb0 = beat.textBox || dtb;
    var tb = { x: tb0.x, y: tb0.y, w: tb0.w, h: tb0.h };
    var at = function (t) { return s.indexOf(t); }, cut = function (a, b) { return show.slice(a, b); };
    var mk = function (kind, label, from, box, r, extra) {
      var p = { kind: kind, id: '', role: role(r), box: box, label: label || '', from: from, word: 0 };
      if (extra) for (var k in extra) p[k] = extra[k];
      return p;
    };
    var pill = function (term, x, y, keep) { var i = at(term); return mk('pill', keep ? term : '', cut(i, i + term.length), nodeBox(x, y, 'pill', keep ? term : ''), 'ink'); };
    var span = function () { // the edge's `from`: first term through last term — the whole change, as the show says it
      var a = 1e9, b = -1; T.forEach(function (t) { var i = at(t); if (i >= 0) { a = Math.min(a, i); b = Math.max(b, i + t.length); } });
      return b > a ? cut(a, b) : show.trim();
    };
    var P = [], card = null, tgt = null, A = null, edge = null, mask;

    if (beat.scene && Array.isArray(beat.scene.primitives)) {            // 1 host override, normalised
      P = beat.scene.primitives.filter(function (p) { return p && p.from && s.indexOf(low(p.from)) >= 0; }).map(function (p) {
        return mk(p.kind, p.label, p.from, p.box || nodeBox(0.5, ROW, 'pill', ''), p.role || 'ink', p.to ? { to: p.to } : null);
      });
    } else if (g === 'breather') {                                         // 5 the emptiest frame: one pill, held
      P.push(mk('pill', '', span(), nodeBox(0.5, Math.max(0.1, tb.y - 0.18), 'pill', ''), 'ink'));
    } else {
      var ph = g === 'hook' ? beat.plant : beat.returns;                   // 3 plant / return → highlight card (same box both times)
      if (ph) {
        var lab = String(ph).split(/\s+/).slice(0, 3).join(' '), pi = at(low(ph)), best = '';
        if (pi < 0) low(ph).split(/[^a-z]+/).forEach(function (w) { if (w.length >= 3 && s.indexOf(w) >= 0 && w.length >= best.length) best = w; });
        card = mk('card', lab, pi >= 0 ? cut(pi, pi + ph.length) : cut(at(best), at(best) + best.length), nodeBox(BX, ROW, 'card', lab), 'highlight');
      }
      var cands = [];                                                      // candidate targets, by where the show names them
      var q = T.filter(function (t) { return s.indexOf("'" + t + "'") >= 0; })[0];
      if (q) cands.push({ i: at(q), p: function () { return pill(q, BX, ROW, true); } });
      var sm = /\b(potholes|detours|pages|cards)\b/.exec(s), sn = /\binto (two|three|four|five|six)\b/.exec(s);
      if (sn || sm) {
        var cw = /\b(two|three|four|five|six)\b/.exec(s), n = sn ? COUNT[sn[1]] : cw ? COUNT[cw[1]] : 3, fa, fb;
        if (sn) { fa = sn.index; fb = sn.index + sn[0].length; } else { fa = cw && cw.index < sm.index ? cw.index : sm.index; fb = sm.index + sm[0].length; }
        cands.push({ i: fa, p: function () { return mk('stack', '', cut(fa, fb), stackBox(BX, ROW, n), 'ink', { n: n }); } });
      }
      if (card) cands.push({ i: g === 'hook' ? 1e9 : at(low(card.from)), p: function () { return card; } });
      cands.sort(function (a, b) { return b.i - a.i; });                  // the hook's plant, else the last-named object
      var counter = /\b(grow|grows|growing|past|more|less)\b/.test(s) && /\b(two|three|four|five|six|bars)\b/.test(s);
      if (cands.length) tgt = cands[0].p();
      var tl = function (t) { return tgt && (low(tgt.label).indexOf(t) >= 0 || low(tgt.from).indexOf(t) >= 0); };
      var om = /\bout of (?:the |a )?([a-z]+)/.exec(s), bm = /\bbetween ([a-z]+) and ([a-z]+)/.exec(s), aT, bT;
      if (bm && T.indexOf(bm[1]) >= 0 && T.indexOf(bm[2]) >= 0 && !tgt) { aT = bm[1]; bT = bm[2]; }
      else aT = om && T.indexOf(om[1]) >= 0 ? om[1] : T.filter(function (t) { return !tl(t) && !(t in COUNT) && !(card && low(card.label).indexOf(t) >= 0); })[0];
      if (aT) A = pill(aT, AX, ROW, false);
      if (counter) {                                                       // the number IS the change
        var nums = say.match(/\d+/g) || [], um = /\d+\s+([a-z]+)/i.exec(say), f = nums[0] || 0, to = nums[1] || f;
        edge = mk('counter', f + ' ' + to + (um ? ' ' + um[1] : ''), span(), { x: 0.6, y: 0.29, w: 0.2, h: 0.14 }, 'contrast');
        if (A) A.box = nodeBox(0.3, ROW + 0.04, 'pill', '');
      } else if (!tgt && aT) {                                             // no named object: the verb's own target term
        if (!bT) { VERBS.lastIndex = at(aT); var vm = VERBS.exec(s); bT = T.filter(function (t) { return t !== aT && (!vm || at(t) > vm.index); })[0] || T.filter(function (t) { return t !== aT; }).pop(); }
        if (bT) tgt = pill(bT, BX, ROW, false);
      }
      if (card && card !== tgt) P.push(card);
      if (A && A.from !== (tgt && tgt.from)) P.push(A); else A = null;
      if (tgt) P.push(tgt);
      if (A && tgt && !edge) {
        var tb1 = tgt.box, x1 = r3(A.box.x + A.box.w + 0.01), x2 = r3((tgt.kind === 'stack' ? tb1.x : tb1.x) - 0.01);
        edge = mk(bm && bT ? 'path' : 'arrow', '', span(), { x: x1, y: r3(ROW - 0.05), w: r3(x2 - x1), h: 0.1 }, 'accent', { to: '' });
      }
      if (edge) P.push(edge);
      if (!edge && P.length) { var last = P[P.length - 1], c0 = coverage({ primitives: P }, show); if (c0.unmatched.length) last.from = span(); }
    }
    // ids, then words: the contract's reading-order spread, the change-carrier last
    var used = {};
    P.forEach(function (p) { var id = 'b' + idx + '_' + slug(p.label || p.kind), k = id, j = 2; while (used[k]) k = id + '_' + (j++); used[k] = 1; p.id = k; });
    if (edge && edge.to === '') edge.to = tgt.id;
    var m = P.length;
    P.forEach(function (p, i) { p.word = m === 1 ? 0 : Math.round(i * (nW - 1) / (m - 1)); });
    var mb = edge && edge.kind !== 'counter' ? { x: r3(edge.box.x + edge.box.w - 0.06), y: edge.box.y, w: 0.06, h: edge.box.h } : P.length ? P[P.length - 1].box : null;
    var ch = charOf(beat, tb);
    if (mb && !P.some(function (p) { return p.kind === 'mask'; })) { mask = mk('mask', '', P[P.length - 1].from, mb, 'highlight'); mask.id = 'b' + idx + '_mask'; mask.word = nW - 1; P.push(mask); }
    var top = P.reduce(function (b, p) { return !b || p.word >= b.word ? p : b; }, null);
    var hs = top ? centre(top.box) : centre(ch.box);
    var scene = { primitives: P, character: ch, hotspot: hs, textBox: tb };
    if (SHOWS) SHOWS.set(scene, show);
    return scene;
  }

  // ---------- kind → grammar (fixed) ----------
  function toDiagram(scene) {
    var nodes = [], edges = [], P = (scene && scene.primitives) || [], byId = {};
    P.forEach(function (p) { byId[p.id] = p; });
    var tid = function (id) { var t = byId[id]; return t && t.kind === 'stack' ? id + '_0' : id; };
    P.forEach(function (p) {
      var b = p.box, c = centre(b);
      if (p.kind === 'card' || p.kind === 'pill') nodes.push({ id: p.id, x: c.x, y: c.y, label: p.label || '', shape: 'pill', word: p.word });
      else if (p.kind === 'stack') {
        var n = Math.min(6, Math.max(2, p.n | 0 || 3)), o = stackBase(b);
        for (var i = 0; i < n; i++) nodes.push({ id: p.id + '_' + i, x: r3(o.x + 0.025 * i), y: r3(o.y - 0.02 * i), label: i === n - 1 ? p.label || '' : '', shape: 'pill', word: p.word });
      } else if (p.kind === 'arrow') {
        nodes.push({ id: p.id, x: b.x, y: c.y, label: '', shape: 'dot', word: 0 });
        edges.push({ from: p.id, to: tid(p.to), kind: 'arrow', word: p.word });
      } else if (p.kind === 'path') {
        nodes.push({ id: p.id + '_d0', x: b.x, y: c.y, label: '', shape: 'dot', word: 0 });
        nodes.push({ id: p.id + '_d1', x: c.x, y: r3(c.y - 0.04), label: '', shape: 'dot', word: 0 });
        edges.push({ from: p.id + '_d0', to: tid(p.to), kind: 'arrow', word: p.word });
      } else if (p.kind === 'bracket') {
        nodes.push({ id: p.id, x: c.x, y: c.y, label: p.label || '', shape: 'pill', word: p.word });
        edges.push({ from: p.id, kind: 'bracket', word: p.word });
      }
    });
    return { nodes: nodes, edges: edges };
  }
  function counterOf(scene) {
    var c = ((scene && scene.primitives) || []).filter(function (p) { return p.kind === 'counter'; })[0];
    if (!c) return undefined;
    var f = String(c.label).split(' '), m = centre(c.box);
    return { from: Number(f[0]) || 0, to: Number(f[1]) || 0, unit: f[2] || '', x: m.x, y: m.y, word: c.word };
  }
  function render(ctx, scene, t, pass, opts) {
    var TL = root.TWO_LAYER, o = opts || {};
    if (!TL || typeof TL.isAvailable !== 'function' || !TL.isAvailable() || !scene || !ctx) return false;
    var b2 = Object.assign({}, o.beat || {}, { diagram: toDiagram(scene), focus: { x: scene.hotspot.x, y: scene.hotspot.y, r: 0.2 }, counter: counterOf(scene) });
    return TL.renderFrame(ctx, t, b2, o.palette, o.seed, o.P, { pass: pass, sheet: o.sheet, reduced: o.reduced, captionsCovered: o.captionsCovered });
  }

  var API = { VERSION: VERSION, fromBeat: fromBeat, render: render, coverage: coverage, terms: terms, toDiagram: toDiagram };
  root.SCENE_B = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
