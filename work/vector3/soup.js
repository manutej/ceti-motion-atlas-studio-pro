/* SCENE soup (vector r3) - film line: "A robot finds one adapter that opens every drawer". UNION A labelled nouns + verb arrows, B verb-head hotspot, C noun->box ring + merges. Draws only via TWO_LAYER.renderFrame. */
((root) => {
'use strict';
var VERSION = '3.0.0-soup';
var STOP = {};
('the and into from with that this then than them they their there here still hold holds wide open empty space back first frame ' +
'echoing echo beat appears appear slide slides turns turn reads reading grow grows growing keeps keep past side floats float taps tap ' +
'opens sprouts flips fans hammers calm pull pulls small each plugs plug reaches reaching shows show smooth straight labeled leans corner ground between')
.split(' ').forEach((w) => { STOP[w] = 1; });
var MOTION = /^(reaches|slide|slides|taps|floats|plugs|opens|turns|grow|grows|growing|sprouts|fan|fans|hammers|flips)$/;
var COUNT = { two: 2, three: 3, four: 4, five: 5, six: 6 };
var STACKN = /^(potholes|detours|pages|cards)$/, ACTOR = /\b(robot|character)\b/;
var SALT = 'C3543', HOME = [0.15, 0.31];
var RING = [[0.45, 0.31], [0.74, 0.31], [0.15, 0.64], [0.38, 0.64], [0.61, 0.64], [0.84, 0.64]];
var SHOWS = typeof WeakMap === 'function' ? new WeakMap() : null, CLONES = typeof Map === 'function' ? new Map() : null;

function r4(v) { return Math.round(v * 1e4) / 1e4; }
function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'x'; }
function norm(w) { w = String(w).toLowerCase(); return w.length > 4 && w.charAt(w.length - 1) === 's' ? w.slice(0, -1) : w; }
function hsh(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } h ^= h >>> 16; h = Math.imul(h, 2246822507) >>> 0; h ^= h >>> 13; return h >>> 0; }
function hits(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
function centre(b) { return { x: r4(b.x + b.w / 2), y: r4(b.y + b.h / 2) }; }
function quoted(low) { var out = [], re = /'([^']+)'/g, m; while ((m = re.exec(low))) out.push({ q: m[1], pos: m.index + 1, end: m.index + 1 + m[1].length }); return out; }
function words(low, Q) {
var out = [], re = /[a-z]+/g, m;
while ((m = re.exec(low))) { var p = m.index; if (!Q.some((q) => p >= q.pos && p < q.end)) out.push({ w: m[0], pos: p, end: p + m[0].length }); }
return out;
}
function isTerm(w) { return w.length >= 4 && !STOP[w]; }
function keyOf(ws) { ws = ws.filter((w) => !COUNT[w]); return ws.some((w) => ACTOR.test(w)) ? 'actor' : norm(ws[ws.length - 1] || 'x'); }

function terms(show) {
var low = String(show || '').toLowerCase(), Q = quoted(low), all = [], seen = {};
Q.forEach((q) => { all.push({ t: q.q, pos: q.pos }); });
words(low, Q).forEach((o) => { if (isTerm(o.w)) all.push({ t: o.w, pos: o.pos }); });
all.sort((a, b) => a.pos - b.pos);
return all.filter((o) => { if (seen[o.t]) return false; seen[o.t] = 1; return true; }).map((o) => o.t);
}
function covers(prims, t) { return prims.some((p) => (String(p.label || '') + '\n' + p.from).toLowerCase().indexOf(t) >= 0); }
function noun(p) { return p.kind === 'card' || p.kind === 'pill'; }
function infer(beat, low) {
var Q = quoted(low), W = words(low, Q), P = [], breather = beat.grammar === 'breather';
var mk = (o, s, e) => { o.from = low.slice(s, e); o.pos = s; o.end = e; P.push(o); return o; };
Q.forEach((q) => { mk({ kind: 'pill', role: 'accent', label: q.q, key: keyOf(q.q.split(/[^a-z]+/)) }, q.pos, q.end); });
var ph = beat.returns || (beat.grammar === 'hook' ? beat.plant : null);
if (ph) {
var pl = String(ph).toLowerCase(), f = low.indexOf(pl) >= 0 ? pl : null;
if (!f) pl.split(/[^a-z]+/).forEach((tk) => { if (tk && low.indexOf(tk) >= 0 && (!f || tk.length >= f.length)) f = tk; });
if (f) mk({ kind: 'card', role: 'highlight', label: pl, key: keyOf(pl.split(/[^a-z]+/)) }, low.indexOf(f), low.indexOf(f) + f.length);
}
if (/\b(grow|grows|growing|past|more|less)\b/.test(low)) {
var cm = /\bbars\b/.exec(low) || /\b(two|three|four|five|six|\d+)\b/.exec(low);
if (cm) mk({ kind: 'counter', role: 'contrast', label: cm[0], key: norm(cm[0]) }, cm.index, cm.index + cm[0].length);
}
W.forEach((o, i) => {
var c = W[i + 1], head = null;
if (o.w !== 'into' || !c || !COUNT[c.w]) return;
for (var j = i - 1; j >= 0; j--) if (isTerm(W[j].w)) { head = W[j].w; break; }
if (head) mk({ kind: 'stack', role: 'ink', n: COUNT[c.w], label: c.w + ' ' + head + (/s$/.test(head) ? '' : 's'), key: norm(head), anchor: 1 }, o.pos, c.end);
});
var phrases = [], cur = null;
W.forEach((o, i) => {
if (!isTerm(o.w)) { cur = null; return; }
if (cur && /^[ -]+$/.test(low.slice(cur.end, o.pos)) && cur.ws.length < 3) { cur.ws.push(o.w); cur.end = o.end; }
else { cur = { ws: [o.w], pos: o.pos, end: o.end, i: i }; phrases.push(cur); }
});
var isStack = (p) => { return p.ws.some((w) => STACKN.test(w)); };
phrases.filter(isStack).forEach((p) => {
if (p.ws.every((w) => covers(P, w))) return;
var n = 3, s = p.pos;
for (var k = p.i - 1; k >= 0 && k >= p.i - 2; k--) if (COUNT[W[k].w]) { n = COUNT[W[k].w]; s = W[k].pos; break; }
mk({ kind: 'stack', role: 'ink', n: n, label: p.ws.join(' '), key: norm(p.ws[0]) }, s, p.end);
});
phrases.forEach((p) => {
var label = p.ws.join(' ');
if (isStack(p) || p.ws.every((w) => covers(P, w))) return;
mk({ kind: p.ws.length > 1 || label.length >= 7 ? 'card' : 'pill', role: 'ink', label: label, key: keyOf(p.ws) }, p.pos, p.end);
});
var byPos = () => { P.sort((a, b) => a.pos - b.pos); };
var join = (a, b, lab) => { a.from = low.slice(Math.min(a.pos, b.pos), Math.max(a.end, b.end)); a.pos = Math.min(a.pos, b.pos); a.end = Math.max(a.end, b.end); if (b.role === 'highlight') { a.role = b.role; a.label = b.label; a.kind = 'card'; } if (lab != null) a.label = lab; P.splice(P.indexOf(b), 1); };
byPos();
for (var i = P.length - 1; i > 0; i--) {
var a = P[i - 1], b = P[i], sep = low.slice(a.end, b.pos);
if (a.kind === 'stack' && b.kind === 'stack' && !a.anchor && /^\s*,\s*(and\s+)?$/.test(sep)) join(a, b, a.label + ', ' + b.label);
else if (noun(a) && b.kind === 'pill' && b.role === 'accent' && /^\s+(reads|reading)\s+'$/.test(sep)) join(a, b, a.role === 'highlight' ? a.label : b.label);
else if (noun(a) && noun(b) && /^\s+of\s+([a-z]+\s+)?$/.test(sep)) join(a, b, null);
}
for (var j2 = P.length - 1; j2 > 0; j2--) {
var d = P[j2]; if (!noun(d)) continue;
var f0 = P.slice(0, j2).filter((q) => noun(q) && q.key === d.key)[0];
if (f0) join(f0, d, null);
}
byPos();
var bm = /\bbetween (?:the )?([a-z]+) and (?:the )?([a-z]+)/.exec(low), ref = [], arrows = [], pairs = {};
if (bm && !breather) ref = [bm[1], bm[2]].map((w) => { var k = ACTOR.test(w) ? 'actor' : norm(w); return P.filter((q) => noun(q) && q.key === k)[0]; });
var first = ref.length && ref[0] && ref[1] ? ref : P.filter((q) => q.key === 'actor');
P = first.concat(P.filter((q) => first.indexOf(q) < 0));
if (breather) {
if (P.length > 2) {
var h = Math.ceil(P.length / 2);
P = [P.slice(0, h), P.slice(h)].map((g) => {
if (g.length === 1) return g[0];
var s = g[0].pos, e = g[g.length - 1].end;
return { kind: 'card', role: 'ink', label: g.map((x) => x.label).join(' · '), from: low.slice(s, e), pos: s, end: e, key: g[0].key };
});
}
var cw = P.length === 1 && /\b(two|three|four|five|six) ([a-z]+s)\b/.exec(low);
if (cw && P[0].label === cw[2]) { P[0].kind = 'stack'; P[0].n = COUNT[cw[1]]; P[0].from = cw[0]; P[0].key = norm(cw[2]); }
return P;
}
var nodes = P.filter((p) => p.kind !== 'counter').slice().sort((a, b) => a.pos - b.pos);
var add = (src, dst, from) => {
if (!src || !dst || src === dst || pairs[src.pos + ':' + dst.pos] || pairs[dst.pos + ':' + src.pos] || arrows.length >= 2) return;
pairs[src.pos + ':' + dst.pos] = 1; arrows.push({ kind: 'arrow', role: 'contrast', from: from, src: src, dst: dst });
};
if (ref.length && ref[0] && ref[1]) add(ref[0], ref[1], bm[0]);
W.forEach((o) => {
if (!MOTION.test(o.w)) return;
var before = nodes.filter((p) => p.pos < o.pos), after = nodes.filter((p) => p.pos > o.pos);
var src = before[before.length - 1], dst = after[0];
if (/^\s*out of\b/.test(low.slice(o.end))) { src = after[0]; dst = before[before.length - 1]; }
if (src && !dst) dst = nodes.filter((p) => p !== src).pop();
add(src, dst, o.w);
});
var cl = /:\s*/.exec(low), list = cl ? P.filter((q) => noun(q) && q.pos > cl.index) : [];
P.filter((q) => q.kind === 'stack' && !q.anchor && cl && q.pos < cl.index && list.length >= 2).forEach((st) => {
arrows.forEach((a) => { if (a.dst === st) a.dst = list[0]; if (a.src === st) a.src = list[0]; });
list[0].from = low.slice(st.pos, list[0].end); P.splice(P.indexOf(st), 1);
});
arrows.forEach((a) => { var k = P.indexOf(a.src) + 1; while (P[k] && P[k].kind === 'arrow') k++; P.splice(k, 0, a); });
return P;
}
function layout(P) {
var used = {}, slotOf = {};
var slot = (key) => {
if (key === 'actor') return HOME;
if (slotOf[key]) return slotOf[key];
var h = hsh(key + SALT) % RING.length; while (used[h]) h = (h + 1) % RING.length;
used[h] = 1; return (slotOf[key] = RING[h]);
};
var rect = (c, w, h) => { return { x: r4(c[0] - w / 2), y: r4(c[1] - h / 2), w: w, h: h }; };
P.forEach((p) => {
if (p.kind === 'arrow') return;
var c = slot(p.key), b;
if (p.kind === 'stack') {
var n = p.n, bx = c[0] + (p.anchor ? 0.025 : 0), by = c[1] - (p.anchor ? 0.02 : 0);
b = { x: r4(bx - 0.06), y: r4(by - 0.02 * (n - 1) - 0.04), w: r4(0.12 + 0.025 * (n - 1)), h: r4(0.08 + 0.02 * (n - 1)) };
} else b = p.kind === 'pill' ? rect(c, 0.12, 0.08) : rect(c, 0.18, 0.1);
b.x = r4(Math.min(Math.max(b.x, 0), 1 - b.w)); b.y = r4(Math.min(Math.max(b.y, 0), 1 - b.h));
p.box = b;
});
}

function characterOf(beat, tb) {
var cp = beat.characterPose || {}, s = cp.scale || 1;
var pose = { x: cp.x != null ? cp.x : 0.5, y: cp.y != null ? cp.y : 0.5, rot: cp.rot || 0, scale: s, rung: cp.rung || 1 };
var box = { x: r4(pose.x - 0.12 * s), y: r4(pose.y - 0.12 * s), w: r4(0.24 * s), h: r4(0.24 * s) };
box.x = r4(Math.min(Math.max(box.x, 0), 1 - box.w)); box.y = r4(Math.min(Math.max(box.y, 0), 1 - box.h));
if (hits(box, tb)) { var up = tb.y - box.h - 0.01; box.y = r4(up >= 0 ? up : Math.min(1 - box.h, tb.y + tb.h + 0.01)); }
return { visible: !!beat.character, pose: pose, box: box };
}
function fromBeat(beat, tokens, seed) {
beat = beat || {};
var show = String(beat.show || ''), low = show.toLowerCase(), idx = beat.index | 0, br = beat.grammar === 'breather', P;
var t = beat.textBox, tb = t && typeof t === 'object' ? { x: t.x, y: t.y, w: t.w, h: t.h } : br ? { x: 0.3, y: 0.42, w: 0.4, h: 0.12 } : { x: 0.08, y: 0.76, w: 0.84, h: 0.16 };
var ov = beat.scene && Array.isArray(beat.scene.primitives) ? beat.scene.primitives : null;
if (ov) P = ov.filter((p) => p && p.from && low.indexOf(String(p.from).toLowerCase()) >= 0).map((p) => JSON.parse(JSON.stringify(p)));
else { P = infer(beat, low); layout(P); }
var ids = {};
P.forEach((p) => { var b = 'b' + idx + '_' + slug(p.label || p.kind), id = b, k = 2; while (ids[id]) id = b + '_' + k++; ids[id] = 1; if (!ov || !p.id) p.id = id; });
P.forEach((p) => {
if (p.kind !== 'arrow' || ov) return;
var a = centre(p.src.box), b = centre(p.dst.box);
p.to = p.dst.id; p.box = { x: r4(Math.min(a.x, b.x)), y: r4(Math.min(a.y, b.y)), w: r4(Math.max(0.02, Math.abs(a.x - b.x))), h: r4(Math.max(0.02, Math.abs(a.y - b.y))) };
});
var say = String(beat.say || '').replace(/\s+/g, ' ').trim(), nw = say ? say.split(' ').length : 1, m = P.length;
var t0 = Number(beat.tStartSec) || 0, t1 = Number(beat.tEndSec); if (!(t1 > t0)) t1 = t0 + 1.5;
var prims = P.map((p, i) => {
var o = { kind: p.kind, id: p.id, role: p.role || 'ink', box: p.box || { x: 0.42, y: 0.3, w: 0.16, h: 0.1 } };
if (p.label != null && p.kind !== 'arrow') o.label = String(p.label);
o.from = String(p.from);
o.word = ov && p.word != null ? p.word | 0 : (m === 1 ? 0 : Math.round(i * (nw - 1) / (m - 1)));
if (!say) o.at = r4(t0 + 0.35 * (t1 - t0)); else if (ov && p.at != null && p.at >= t0 && p.at < t1) o.at = p.at;
if (p.kind === 'stack') o.n = Math.min(6, Math.max(2, p.n | 0 || 3));
if (p.to) o.to = String(p.to);
return o;
});
var last = null;
prims.forEach((p) => { if (!last || p.word >= last.word) last = p; });
if (last && last.kind === 'arrow' && !br && !prims.some((p) => p.kind === 'mask')) {
var tg = prims.filter((p) => p.id === last.to)[0];
if (tg) { last = { kind: 'mask', id: 'b' + idx + '_mask', role: 'highlight', box: JSON.parse(JSON.stringify(tg.box)), from: last.from, word: Math.max(last.word, nw - 1) }; prims.push(last); }
}
var character = characterOf(beat, tb);
var sc = { primitives: prims, character: character, hotspot: last ? centre(last.box) : centre(character.box), textBox: tb };
if (SHOWS) SHOWS.set(sc, show);
if (CLONES) { if (CLONES.size > 512) CLONES.clear(); CLONES.set(JSON.stringify(prims), show); }
return sc;
}
function coverage(scene, show) {
var P = (scene && scene.primitives) || [], s = show != null ? show : (SHOWS && scene && SHOWS.get(scene));
if (s == null && CLONES) s = CLONES.get(JSON.stringify(P));
if (s == null) return { showTermsMatched: [], unmatched: ['(show unknown)'] };
var vis = !!(scene.character && scene.character.visible), M = [], U = [];
terms(s).forEach((t) => { ((vis && /^(robot|character)$/.test(t)) || covers(P, t) ? M : U).push(t); });
return { showTermsMatched: M, unmatched: U };
}
function toDiagram(scene) {
var P = (scene && scene.primitives) || [], nodes = [], edges = [], head = {}, src = {}, prev = null;
P.forEach((p) => {
var c = centre(p.box);
if (p.kind === 'card' || p.kind === 'pill' || p.kind === 'bracket') {
nodes.push({ id: p.id, x: c.x, y: c.y, label: p.label || '', shape: 'pill', word: p.word }); head[p.id] = p.id;
if (p.kind === 'bracket') edges.push({ from: p.id, kind: 'bracket', word: p.word });
} else if (p.kind === 'stack') {
var n = Math.min(6, Math.max(2, p.n || 3)), bx = p.box.x + 0.06, by = p.box.y + p.box.h - 0.04;
for (var i = 0; i < n; i++) nodes.push({ id: p.id + '_' + i, x: r4(bx + 0.025 * i), y: r4(by - 0.02 * i), label: i === n - 1 ? p.label || '' : '', shape: 'pill', word: p.word });
head[p.id] = p.id + '_' + (n - 1);
}
if (head[p.id]) prev = p;
if ((p.kind === 'arrow' || p.kind === 'path') && prev) src[p.id] = prev.id;
});
P.forEach((p) => {
var s = src[p.id] && head[src[p.id]], t = p.to && head[p.to];
if (!s || !t) return;
if (p.kind === 'arrow') { edges.push({ from: s, to: t, kind: 'arrow', word: p.word }); return; }
var A = nodes.filter((q) => q.id === s)[0], B = nodes.filter((q) => q.id === t)[0], chain = [s];
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
function render(ctx, scene, t, pass, opts) {
var TL = root.TWO_LAYER;
if (!TL || typeof TL.isAvailable !== 'function' || !TL.isAvailable() || !scene || !scene.primitives) return false;
var o = opts || {}, beat = o.beat || {}, cp = scene.primitives.filter((p) => p.kind === 'counter')[0];
var b2 = Object.assign({}, beat, { diagram: toDiagram(scene), focus: { x: scene.hotspot.x, y: scene.hotspot.y, r: 0.2 }, counter: cp ? counterOf(cp, beat) : undefined });
return TL.renderFrame(ctx, t, b2, o.palette, o.seed, o.P, { pass: pass, sheet: o.sheet, reduced: o.reduced, captionsCovered: o.captionsCovered });
}

var API = { VERSION: VERSION, fromBeat: fromBeat, render: render, coverage: coverage, terms: terms, toDiagram: toDiagram };
root.SCENE = API;
if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
