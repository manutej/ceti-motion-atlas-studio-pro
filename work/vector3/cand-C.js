/* cand-C SCENE (vector r3) - "A robot finds one adapter that opens every drawer." Lens: noun continuity; each noun owns
 * one box (slot ring keyed by the noun), so cuts read as one set. Pure data from show; draws only via TWO_LAYER.renderFrame. */
(function (root) {
  'use strict';
  var VERSION = 'vector3-C.1.0';
  var STOP = {};
  ('the and into from with that this then than them they their there here still hold holds wide open empty space back ' +
   'first frame echoing echo beat appears appear slide slides turns turn reads reading grow grows growing keeps keep past ' +
   'side floats float taps tap opens sprouts flips fans hammers calm pull pulls small each plugs plug reaches reaching ' +
   'shows show smooth straight labeled leans corner ground between').split(' ').forEach(function (w) { STOP[w] = 1; });
  var COUNT = { two: 2, three: 3, four: 4, five: 5, six: 6 };
  var STACKW = { potholes: 1, detours: 1, pages: 1, cards: 1 };
  var ACTOR = { robot: 1, character: 1 };
  var SALT = 'C3543';
  var HOME = [0.15, 0.31];
  var RING = [[0.45, 0.31], [0.74, 0.31], [0.15, 0.64], [0.38, 0.64], [0.61, 0.64], [0.84, 0.64]];
  var FX = 0.025, FY = 0.02;
  var TB = { x: 0.08, y: 0.76, w: 0.84, h: 0.16 }, TBB = { x: 0.3, y: 0.42, w: 0.4, h: 0.12 };
  var SHOWS = typeof WeakMap === 'function' ? new WeakMap() : null;

  function r4(v) { return Math.round(v * 1e4) / 1e4; }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''); }
  function norm(w) { w = String(w).toLowerCase(); return w.length > 4 && w.charAt(w.length - 1) === 's' ? w.slice(0, -1) : w; }
  function hsh(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } h ^= h >>> 16; h = Math.imul(h, 2246822507) >>> 0; h ^= h >>> 13; return h >>> 0; }
  function hit(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
  function ctr(b) { return { x: r4(b.x + b.w / 2), y: r4(b.y + b.h / 2) }; }
  function rect(c, w, h) { return { x: r4(c[0] - w / 2), y: r4(c[1] - h / 2), w: w, h: h }; }
  function words3(s) { return String(s).split(/\s+/).slice(0, 3).join(' '); }

  function terms(show) {
    var s = String(show || '').toLowerCase(), out = [], seen = {}, re = /'([^']+)'|[a-z]+/g, m;
    while ((m = re.exec(s))) {
      var t = m[1] != null ? m[1].trim() : m[0];
      if ((m[1] != null || (t.length >= 4 && !STOP[t])) && !seen[t]) { seen[t] = 1; out.push(t); }
    }
    return out;
  }

  // groups: term runs joined by space/hyphen; a count word just before joins the span
  function groups(show) {
    var low = show.toLowerCase(), re = /'([^']+)'|[a-z]+/g, m, toks = [], out = [], cur = null;
    while ((m = re.exec(low))) toks.push({ w: m[1] != null ? m[1].trim() : m[0], s: m.index, e: m.index + m[0].length, q: m[1] != null });
    toks.forEach(function (t, i) {
      var term = t.q || (t.w.length >= 4 && !STOP[t.w] && !COUNT[t.w]);
      if (!term) { cur = null; return; }
      if (cur && !t.q && !cur.q && /^[\s-]+$/.test(low.slice(cur.e, t.s))) { cur.words.push(t.w); cur.e = t.e; return; }
      cur = { s: t.s, e: t.e, words: [t.w], q: t.q, i: i, n: 0 }; out.push(cur);
    });
    out.forEach(function (g) {
      for (var k = g.i - 1; k >= Math.max(0, g.i - 2); k--) {
        var t = toks[k]; if (/[.;:,]/.test(low.slice(t.e, g.s))) break;
        if (COUNT[t.w] && !t.q) { g.n = COUNT[t.w]; g.s = t.s; break; }
      }
      var ws = g.q ? g.words[0].split(/[^a-z]+/) : g.words, last = ws[ws.length - 1];
      g.key = ws.some(function (w) { return ACTOR[w]; }) ? 'actor' : (!g.q && ws.length > 1 && STACKW[last] ? norm(ws[0]) : norm(last));
      g.stack = !g.q && !!STACKW[last];
      g.text = g.q ? g.words[0] : show.slice(g.s, g.e).replace(/^\S+\s+(?=\S)/, function (p) { return COUNT[p.trim().toLowerCase()] ? '' : p; });
    });
    return out;
  }

  function fromBeat(beat, tokens, seed) {
    beat = beat || {};
    var show = String(beat.show || ''), low = show.toLowerCase(), g = beat.grammar || 'hook';
    var tb = beat.textBox ? { x: beat.textBox.x, y: beat.textBox.y, w: beat.textBox.w, h: beat.textBox.h } : (g === 'breather' ? TBB : TB);
    var t0 = Number(beat.tStartSec) || 0, t1 = Number(beat.tEndSec) > t0 ? Number(beat.tEndSec) : t0 + 1.5;
    var say = String(beat.say || '').replace(/\s+/g, ' ').trim(), nw = say ? say.split(' ').length : 0;
    var L = [], G = groups(show), ph = beat.plant || beat.returns, plantG = {}, plantDone = false;
    var mk = function (kind, role, label, key, s, e, x) { var p = { kind: kind, role: role, label: label, key: key, s: s, e: e }; for (var k in x || {}) p[k] = x[k]; L.push(p); return p; };

    if (beat.scene && beat.scene.primitives) {
      beat.scene.primitives.forEach(function (q) { var p = mk(q.kind, q.role || 'ink', q.label, q.label || q.kind, 0, 0, { box: q.box, from: q.from, n: q.n, to: q.to, word: q.word }); p.fixed = true; });
    } else {
      if (ph) {
        var pw = {}; String(ph).toLowerCase().split(/[^a-z]+/).forEach(function (w) { if (w.length >= 3) pw[norm(w)] = 1; });
        G.forEach(function (x, i) { if ((x.q ? x.words[0].split(/[^a-z]+/) : x.words).some(function (w) { return pw[norm(w)]; })) plantG[i] = 1; });
      }
      var pIdx = Object.keys(plantG).map(Number), pKey = null, ps = 1e9, pe = -1;
      pIdx.forEach(function (i) { ps = Math.min(ps, G[i].s); pe = Math.max(pe, G[i].e); if (!pKey && !G[i].q) pKey = G[i].key; });
      if (pIdx.length && !pKey) pKey = G[pIdx[0]].key;
      var counterOn = g !== 'breather' && /\b(grow|grows|growing|past|more|less)\b/.test(low) && (/\bbars\b/.test(low) || G.some(function (x) { return x.n; }));
      if (counterOn && !pIdx.length && G.length) {
        mk('counter', 'contrast', G[0].text, G[0].key, G[0].s, G[G.length - 1].e);
      } else {
        for (var i = 0; i < G.length; i++) {
          var x = G[i], nx = G[i + 1], sep = low.slice(x.e, nx ? nx.s : low.length), p = null, m;
          if (plantG[i]) { if (!plantDone) { p = mk('card', 'highlight', words3(ph), pKey, ps, pe); plantDone = true; } }
          else if (nx && nx.q && !plantG[i + 1] && /^\s+(reads|reading)\s+$/.test(sep)) { p = mk('card', 'ink', words3(nx.words[0]), x.key, x.s, nx.e); i++; }
          else if (nx && !nx.q && !plantG[i + 1] && /^\s+of\s+([a-z]+\s+)?$/.test(sep)) { p = mk('card', 'ink', words3(x.text), x.key, x.s, nx.e); i++; }
          else if (x.stack) {
            var e = x.e; while (G[i + 1] && G[i + 1].stack && /^\s*,\s*(and\s+)?$/.test(low.slice(e, G[i + 1].s))) { e = G[i + 1].e; i++; }
            p = mk('stack', 'accent', words3(x.text.split(/[\s,]+/).pop()), x.key, x.s, e, { n: Math.max(2, Math.min(6, x.n || 3)) });
          } else p = mk(x.q ? 'pill' : 'card', x.q ? 'accent' : 'ink', words3(x.text), x.key, x.s, x.e);
          nx = G[i + 1]; sep = low.slice(x.e, nx ? nx.s : low.length);
          var src = p || L.filter(function (q) { return q.key === x.key; })[0];
          if ((m = /\S[^.;:]*?\binto\s+(two|three|four|five|six)\b/.exec(sep)))
            mk('stack', 'accent', norm(x.key) + 's', x.key, x.e + m.index, x.e + m.index + m[0].length, { n: COUNT[m[1]], anchor: true });
          else if ((m = /^\s+(?:[a-z]+\s+)?into\s+(each|every|all)\b/.exec(sep))) {
            var st = L.filter(function (q) { return q.kind === 'stack'; }).pop();
            if (st && src) mk('arrow', 'ink', null, null, x.s, x.e + m[0].length, { toP: st, tail: src });
          } else if (nx && src && !/[.;:]/.test(sep) && (m = /\b(into|out of)\b/.exec(sep))) {
            var out = m[1] === 'out of', ix = L.length;
            var q2 = mk(nx.stack ? 'stack' : (nx.q ? 'pill' : 'card'), nx.q || nx.stack ? 'accent' : 'ink', words3(nx.text), nx.key, nx.s, nx.e, nx.stack ? { n: Math.max(2, Math.min(6, nx.n || 3)) } : null); i++;
            var a = mk('arrow', 'ink', null, null, Math.min(x.s, nx.s), Math.max(x.e, nx.e), { toP: out ? src : q2, tail: out ? q2 : src });
            if (!out) { L.splice(L.indexOf(a), 1); L.splice(ix, 0, a); }
            var rest = low.slice(nx.e), cm = /^\s*:\s*/.exec(rest), tgt = out ? src : q2;
            if (cm && tgt.kind === 'stack') {
              var list = [], k2 = i + 1, pos = nx.e + cm[0].length;
              while (G[k2] && /^\s*,?\s*(and\s+)?$/.test(low.slice(pos, G[k2].s))) { list.push(G[k2]); pos = G[k2].e; k2++; }
              if (list.length >= 2) {
                L.splice(L.indexOf(tgt), 1);
                var pills = list.map(function (y) { return mk('pill', 'accent', words3(y.text), y.key, y.s, y.e); });
                a.toP = pills[0]; i = k2 - 1;
              }
            }
          }
        }
      }
      for (var j = L.length - 1; j > 0; j--) {
        var d = L[j]; if (d.kind !== 'card' && d.kind !== 'pill') continue;
        var f = L.slice(0, j).filter(function (q) { return q.key === d.key && (q.kind === 'card' || q.kind === 'pill'); })[0];
        if (f) { f.s = Math.min(f.s, d.s); f.e = Math.max(f.e, d.e); L.splice(j, 1); }
      }
      var bt = /\bbetween\s+(?:the\s+)?([a-z]+)\s+and\s+(?:the\s+)?([a-z]+)/.exec(low);
      if (bt) {
        var kk = [bt[1], bt[2]].map(function (w) { return ACTOR[w] ? 'actor' : norm(w); });
        L = L.filter(function (q) { return kk.indexOf(q.key) >= 0; }).concat(L.filter(function (q) { return kk.indexOf(q.key) < 0; }));
      }
      if (g === 'breather') {
        L = L.filter(function (q) { return q.kind !== 'arrow' && q.kind !== 'path'; });
        if (L.length > 2) { var s0 = Math.min.apply(null, L.map(function (q) { return q.s; })); L = L.slice(-2); L[0].s = Math.min(L[0].s, s0); }
      }
    }

    // one box per noun; actor pinned home; in-beat collisions probe forward
    var used = {}, slotOf = {};
    var slot = function (key) {
      if (key === 'actor') return HOME;
      if (slotOf[key]) return slotOf[key];
      var h = hsh(key + SALT) % RING.length; while (used[h]) h = (h + 1) % RING.length;
      used[h] = 1; return (slotOf[key] = RING[h]);
    };
    L.forEach(function (p) {
      if (p.box) return;
      if (p.kind === 'card' || p.kind === 'counter') p.box = rect(slot(p.key), 0.18, 0.1);
      else if (p.kind === 'pill') p.box = rect(slot(p.key), 0.12, 0.08);
      else if (p.kind === 'stack') {
        var c = slot(p.key), bx = c[0] + (p.anchor ? FX : 0), by = c[1] - (p.anchor ? FY : 0), n = p.n;
        p.box = { x: r4(bx - 0.06), y: r4(by - FY * (n - 1) - 0.04), w: r4(0.12 + FX * (n - 1)), h: r4(0.08 + FY * (n - 1)) };
      }
    });
    L.forEach(function (p) {
      if (p.box || !p.tail || !p.toP) return;
      var a = ctr(p.tail.box), b = ctr(p.toP.box);
      p.box = { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: r4(Math.max(Math.abs(a.x - b.x), 0.02)), h: r4(Math.max(Math.abs(a.y - b.y), 0.02)) };
    });

    var id = function (p) { return 'b' + (beat.index | 0) + '_' + slug(p.label || p.kind); }, ids = {};
    var prims = [], m1 = L.length;
    L.forEach(function (p, i) {
      var o = { kind: p.kind, id: id(p), role: p.role, box: p.box };
      if (ids[o.id]) return; ids[o.id] = 1;
      if (p.label != null) o.label = p.label;
      o.from = p.fixed ? String(p.from || '') : show.slice(p.s, p.e);
      o.word = p.fixed && p.word != null ? p.word : (nw && m1 > 1 ? Math.round(i * (nw - 1) / (m1 - 1)) : 0);
      if (!nw) o.at = r4(t0 + 0.35 * (t1 - t0));
      if (p.kind === 'stack') o.n = p.n;
      if (p.to) o.to = p.to; else if (p.toP) o.to = id(p.toP);
      prims.push(o);
    });

    var cp = beat.characterPose || { x: 0.5, y: 0.5, rot: 0, scale: 1, rung: 1 }, sc = cp.scale || 1;
    var pose = { x: cp.x != null ? cp.x : 0.5, y: cp.y != null ? cp.y : 0.5, rot: cp.rot || 0, scale: sc, rung: cp.rung || 1 };
    var cb = { x: r4(pose.x - 0.12 * sc), y: r4(pose.y - 0.12 * sc), w: r4(0.24 * sc), h: r4(0.24 * sc) };
    if (hit(cb, tb)) { var up = tb.y - cb.h - 0.01; cb.y = r4(up >= 0 ? up : Math.min(1 - cb.h, tb.y + tb.h + 0.01)); }
    cb.x = r4(Math.max(0, Math.min(1 - cb.w, cb.x)));
    var character = { visible: !!beat.character, pose: pose, box: cb };

    var top = null; prims.forEach(function (p) { if (!top || p.word >= top.word) top = p; });
    var hs = top ? ctr(top.box) : ctr(cb);
    var scene = { primitives: prims, character: character, hotspot: { x: hs.x, y: hs.y }, textBox: { x: tb.x, y: tb.y, w: tb.w, h: tb.h } };
    if (SHOWS) SHOWS.set(scene, show);
    return scene;
  }

  function coverage(scene, show) {
    var s = show != null ? show : (SHOWS && SHOWS.get(scene)) || '', hay = [], ok = [], bad = [];
    (scene.primitives || []).forEach(function (p) { hay.push(String(p.label || '').toLowerCase(), String(p.from || '').toLowerCase()); });
    terms(s).forEach(function (t) {
      var m = hay.some(function (h) { return h.indexOf(t) >= 0; }) || ((t === 'robot' || t === 'character') && scene.character && scene.character.visible === true);
      (m ? ok : bad).push(t);
    });
    return { showTermsMatched: ok, unmatched: bad };
  }

  function toDiagram(scene) {
    var nodes = [], edges = [], tip = {}, at = {}, prev = null;
    (scene.primitives || []).forEach(function (p) {
      var c = ctr(p.box), k = p.kind;
      if (k === 'card' || k === 'pill' || k === 'bracket') {
        nodes.push({ id: p.id, x: c.x, y: c.y, label: p.label || '', shape: 'pill', word: p.word }); tip[p.id] = p.id; at[p.id] = c;
        if (k === 'bracket') edges.push({ from: p.id, kind: 'bracket', word: p.word });
      } else if (k === 'stack') {
        var n = p.n || 3, bx = p.box.x + 0.06, by = p.box.y + p.box.h - 0.04;
        for (var i = 0; i < n; i++) nodes.push({ id: p.id + '_' + i, x: r4(bx + FX * i), y: r4(by - FY * i), label: i === n - 1 ? (p.label || '') : '', shape: 'pill', word: p.word });
        tip[p.id] = p.id + '_' + (n - 1); at[p.id] = { x: r4(bx + FX * (n - 1)), y: r4(by - FY * (n - 1)) };
      } else if ((k === 'arrow' || k === 'path') && prev && tip[p.to]) {
        var a = tip[prev.id], b = tip[p.to];
        if (k === 'arrow') edges.push({ from: a, to: b, kind: 'arrow', word: p.word });
        else {
          var A = at[prev.id], B = at[p.to], chain = [a];
          for (var d = 0; d < 2; d++) { var f = (d + 1) / 3, did = p.id + '_d' + d; nodes.push({ id: did, x: r4(A.x + (B.x - A.x) * f), y: r4(A.y + (B.y - A.y) * f), label: '', shape: 'dot', word: p.word }); chain.push(did); }
          chain.push(b); for (var j = 1; j < chain.length; j++) edges.push({ from: chain[j - 1], to: chain[j], kind: 'arrow', word: p.word });
        }
      }
      if (tip[p.id]) prev = p;
    });
    return { nodes: nodes, edges: edges };
  }

  function counterOf(p, beat) {
    var say = String(beat.say || ''), nums = say.match(/\d+(?:\.\d+)?/g) || [], u = /\d+\s+([a-z]+)/i.exec(say), c = ctr(p.box);
    var cw = /\b(two|three|four|five|six)\b/.exec(String(beat.show || '').toLowerCase());
    return { from: nums.length > 1 ? Number(nums[0]) : 0, to: nums.length ? Number(nums[nums.length - 1]) : (cw ? COUNT[cw[1]] : 1), unit: u ? u[1] : '', x: c.x, y: c.y, word: p.word };
  }

  function render(ctx, scene, t, pass, opts) {
    var TL = root.TWO_LAYER;
    if (!TL || typeof TL.renderFrame !== 'function' || typeof TL.isAvailable !== 'function' || !TL.isAvailable() || !scene) return false;
    var o = opts || {}, beat = o.beat || {}, ct;
    (scene.primitives || []).forEach(function (p) { if (p.kind === 'counter' && !ct) ct = counterOf(p, beat); });
    var b2 = Object.assign({}, beat, { diagram: toDiagram(scene), focus: { x: scene.hotspot.x, y: scene.hotspot.y, r: 0.2 }, counter: ct });
    return TL.renderFrame(ctx, t, b2, o.palette, o.seed, o.P, { pass: pass, sheet: o.sheet, reduced: o.reduced, captionsCovered: o.captionsCovered });
  }

  var API = { fromBeat: fromBeat, render: render, coverage: coverage, terms: terms, toDiagram: toDiagram, VERSION: VERSION };
  root.SCENE_C = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
