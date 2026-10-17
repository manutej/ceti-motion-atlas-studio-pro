// CETI Capabilities · 01 · stitch — "Context is composed." Kinetic Hydrography 1.0.0 + series layer.
// Typed context atoms ride the line into a socketed tree. A match snaps, a mismatch is refused at the seam,
// two disjoint branches fill in parallel, every seam gets a receipt, and the tree folds into one sealed brief
// that an AI pod carries away. drawFrame(ctx, t) is a pure function of t.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, win, EASE, ramp, mix, rgba, text } = KH;
const W = 1920, H = 1080, BPM = 128, B = 60 / BPM, b = n => n * B, DUR = 25.75;

// ---------- palette (Wada 166 + CETI) ----------
const PINK = WD.grenadinePink, YEL = WD.naplesYellow, GRN = WD.deepSlateGreen;
const INK = C.navy, SOFT = C.slate, BG = mix(C.paper, PINK, 0.06), ATOM = mix(C.paper, KH.NEUTRALS.white, 0.5), CARD = mix(C.paper, KH.NEUTRALS.white, 0.6);
const ACC = mix(PINK, INK, 0.66), REF = C.rust, REFINK = mix(C.rust, INK, 0.15), LINES = mix(C.paper, C.slate, 0.5), DASH = mix(C.paper, C.slate, 0.62);
const TYPE = [PINK, GRN, YEL], TYPE_EDGE = [mix(PINK, INK, 0.35), INK, mix(YEL, INK, 0.45)], TABX = [-30, 0, 30];   // claim · evidence · rule
const NOTCH_T = [b(16), b(16.5), b(17)];
const FUT = mix(C.paper, C.slate, 0.9);

// ---------- the tree ----------
const ROOT = { x: 0, y: -260 }, INNER = { L: -465, C: 0, R: 465 }, IY = -80, LY = 100, LINE_Y = 332, ON_LINE = 300;
const SOCK = [{ id: 'L1', x: -600, ty: 2, par: 'L' }, { id: 'L2', x: -330, ty: 1, par: 'L' }, { id: 'CL', x: -90, ty: 0, par: 'C' },
  { id: 'CR', x: 90, ty: 1, par: 'C' }, { id: 'R1', x: 330, ty: 2, par: 'R' }, { id: 'R2', x: 600, ty: 0, par: 'R' }];
const SK = Object.fromEntries(SOCK.map((s, i) => [s.id, i]));
const TREE_ON = b(14), F0 = b(36), CARD_T = F0 + 0.95, CARD_FULL = b(39), SEAL = b(40);
const REFUSE = b(21);

// ---------- atoms: keys [t, x, y, rot, ease-into-this-key] ----------
const tl = i => b(10) + i * b(0.5);          // drop from the heap onto the line, one per half-beat
const G = EASE.glaser, Wm = EASE.warm, Rs = EASE.rest;
const PILE = [[-330, 40, 0.42], [-370, 95, -0.35], [-450, 20, 0.2], [-500, 90, -0.55], [-560, 30, 0.3], [-610, 85, 0.62]];
const ATOMS = [
  { ty: 0, sock: 'CL', snap: b(18.5), keys: [[8.47, -90, ON_LINE, 0], [b(18.5), -90, LY, 0, G]], slide: [[7.75, -300], [8.4, -90, Wm]] },
  { ty: 0, sock: 'R2', snap: b(27), keys: [[9.66, 90, ON_LINE, 0], [REFUSE, 90, 176, 0, G], [REFUSE + 0.12, 90, 176, 0], [10.24, 90, ON_LINE, 0, Rs], [10.28, 90, ON_LINE, 0], [10.9, 600, ON_LINE, 0, G],
      [b(27) - 0.2, 600, ON_LINE, 0], [b(27), 600, LY, 0, G]], slide: [[8.75, -430], [9.55, 90, Wm]] },
  { ty: 1, sock: 'CR', snap: b(23), keys: [[10.25, -300, ON_LINE, 0], [10.56, 90, ON_LINE, 0, G], [b(23) - 0.2, 90, ON_LINE, 0], [b(23), 90, LY, 0, G]], slide: [[8.85, -560], [9.5, -300, Wm]] },
  { ty: 2, sock: 'L1', snap: b(27), keys: [[11.8, -690, ON_LINE, 0], [12.3, -600, ON_LINE, 0, Wm], [b(27) - 0.2, -600, ON_LINE, 0], [b(27), -600, LY, 0, G]], slide: [[8.85, -950], [9.5, -690, Wm]] },
  { ty: 1, sock: 'L2', snap: b(28), keys: [[11.8, -560, ON_LINE, 0], [12.4, -330, ON_LINE, 0, Wm], [b(28) - 0.2, -330, ON_LINE, 0], [b(28), -330, LY, 0, G]], slide: [[8.85, -820], [9.5, -560, Wm]] },
  { ty: 2, sock: 'R1', snap: b(28), keys: [[11.8, -430, ON_LINE, 0], [12.45, 330, ON_LINE, 0, Wm], [b(28) - 0.2, 330, ON_LINE, 0], [b(28), 330, LY, 0, G]], slide: [[8.85, -690], [9.5, -430, Wm]] },
];
// heap order on the line: atom i lands at QX[i]
const QX = [-300, -430, -560, -950, -820, -690], DROP = [0, 1, 2, 5, 4, 3];   // atoms 3,4,5 land last (leftmost first … see DROP)
ATOMS.forEach((a, i) => { const p = PILE[DROP[i]], td = tl(DROP[i]);
  a.pile = p; a.drop = td; a.lines = [0.5 + 0.35 * ((i * 37) % 10) / 10, 0.35 + 0.4 * ((i * 53) % 10) / 10];
  a.all = [[0, p[0], p[1], p[2]], [td, p[0], p[1], p[2]], [td + 0.45, QX[i], ON_LINE, 0, G], ...a.slide.map(([t, x, e]) => [t, x, ON_LINE, 0, e]), ...a.keys]; });
SOCK.forEach((s, i) => { const a = ATOMS.find(a => a.sock === s.id); s.snap = a.snap; });

function keyed(K, t) { if (t <= K[0][0]) return K[0]; for (let k = 1; k < K.length; k++) { if (t <= K[k][0]) { const p = K[k - 1], q = K[k], e = q[4] || Wm, u = q[0] === p[0] ? 1 : e(clamp((t - p[0]) / (q[0] - p[0])));
    return [t, lerp(p[1], q[1], u), lerp(p[2], q[2], u), lerp(p[3], q[3], u)]; } } return K[K.length - 1]; }

// ---------- Hermite through keys (hold keys get zero tangents) ----------
function hermite(P, t) { const n = P.length; if (t <= P[0].t) return P[0].v; if (t >= P[n - 1].t) return P[n - 1].v;
  let i = 0; while (P[i + 1].t < t) i++; const p1 = P[i], p2 = P[i + 1], h = p2.t - p1.t, u = (t - p1.t) / h;
  const tan = k => { const a = P[Math.max(0, k - 1)], c = P[Math.min(n - 1, k + 1)]; return P[k].hold ? P[k].v.map(() => 0) : P[k].v.map((_, j) => (c.v[j] - a.v[j]) / (c.t - a.t)); };
  const m1 = tan(i), m2 = tan(i + 1), u2 = u * u, u3 = u2 * u, A = 2 * u3 - 3 * u2 + 1, Bh = u3 - 2 * u2 + u, Cc = -2 * u3 + 3 * u2, D = u3 - u2;
  return p1.v.map((v, j) => A * v + Bh * h * m1[j] + Cc * p2.v[j] + D * h * m2[j]); }
const mk = arr => arr.map(([t, ...v]) => { const hold = v[v.length - 1] === 'h'; if (hold) v.pop(); return { t, v, hold }; });

// ---------- whale ----------
const FLICK = [b(18.25), REFUSE - 0.14, b(22.75), b(27) - 0.12, b(28) - 0.12];
const WK = mk([[0, -1500, -40], [1.8, -1250, -40], [3.0, -820, 40], [3.9, -480, 90], [4.55, -250, -50], [5.3, -430, -80], [6.0, -640, -60], [6.5, -720, 40], [7.3, -360, 203, 'h'],
  [8.2, -330, 200], [8.55, -215, 198], [8.95, -225, 202], [9.4, -60, 205], [9.72, -40, 199], [10.05, -95, 190], [10.45, -72, 203], [10.66, -48, 199], [11.2, -45, 205],
  [12.0, 0, 210, 'h'], [14.5, 0, 210, 'h'], [15.0, 205, 40], [15.5, 120, -300], [15.95, 0, -410, 'h'], [16.9, 0, -410, 'h'], [17.8, -380, -255, 'h'], [20.5, -380, -250, 'h'], [21.9, 0, -175, 'h'], [DUR, 10, -185, 'h']]);
const base = t => { const v = hermite(WK, t); return { x: v[0], y: v[1] }; };
const bvel = t => { const a = base(t - 1 / 240), c = base(t + 1 / 240); return { x: (c.x - a.x) * 120, y: (c.y - a.y) * 120 }; };
const wpos = t => { const p = base(t), v = bvel(t), still = clamp(1 - Math.hypot(v.x, v.y) / 260); return { x: p.x, y: p.y + Math.sin(t * 2.4) * 5 * still * smoothIn(t) }; };
function smoothIn(t) { return ramp(t, 6.8, 7.4, Rs); }
const wvel = t => { const a = wpos(t - 1 / 240), c = wpos(t + 1 / 240); return { x: (c.x - a.x) * 120, y: (c.y - a.y) * 120 }; };
function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
    a += (sp < 40 ? 0 : clamp(Math.atan2(v.y, Math.abs(v.x)), -0.9, 0.9) * clamp(sp / 320)) * w; s += w; } return a / s; }
const facing = t => (t > 4.62 && t < 6.45) ? -1 : 1;   // explicit: only the sweep over the heap faces left

// ---------- camera ----------
const CK = mk([[0, -430, 70, 1.0], [2.4, -360, 60, 1.02], [4.6, -270, 60, 1.05], [6.4, -130, 50, 1.06], [7.6, -20, 50, 1.1], [9.0, 0, 90, 1.18], [9.9, 0, 130, 1.3, 'h'], [11.1, 10, 130, 1.3, 'h'],
  [12.3, 0, 40, 1.1, 'h'], [14.4, 0, 30, 1.1, 'h'], [15.7, 0, -30, 1.1], [17.3, 0, -105, 1.12], [18.6, 0, -90, 1.22, 'h'], [19.8, 10, -110, 1.16], [21.0, 20, -140, 1.1], [22.4, 0, -160, 1.08], [DUR, 0, -170, 1.14, 'h']]);
function cam(t) { const v = hermite(CK, t); return { x: v[0], y: v[1], z: v[2], ax: 960, ay: 540 }; }

// ---------- READ ----------
const STA = [
  { id: 's1', word: 'Atoms', gloss: 'small typed parts', in: b(10), out: b(15) - 0.05 },
  { id: 's2', word: 'Types', gloss: 'each socket has a colour', in: b(15), out: b(20) - 0.05 },
  { id: 's3', word: 'Seams', gloss: 'checks live at joints', in: b(20), out: b(25) - 0.05 },
  { id: 's4', word: 'Parallel', gloss: 'separate parts run together', in: b(25), out: b(31) - 0.05 },
  { id: 's5', word: 'Certificate', gloss: 'a receipt for every joint', in: b(31), out: b(36) - 0.1 },
].map(s => ({ ...s, fi: 0.25, fo: 0.2, text: s.gloss }));
const CAPS = [
  { id: 'c1', in: 2.5, out: 4.55, fi: 0.3, fo: 0.25, text: 'A heap of context.', html: 'A heap of <i>context</i>.' },
  { id: 'not', in: 19.4, out: 21.15, fi: 0.25, fo: 0.2, text: 'Consistency is not correctness.', html: 'Consistency is not <i>correctness</i>.' },
  { id: 'end', in: 21.2, out: DUR - 2.3, fi: 0.3, fo: 0.25, text: 'Small typed parts, checked at every seam.', html: 'Small typed parts, checked at every <i>seam</i>.' },
];
const LAB = [
  { id: 'claim', in: 8.9, out: 11.5, fi: 0.2, fo: 0.25, text: 'claim' },
  { id: 'evidence', in: 9.0, out: 10.55, fi: 0.2, fo: 0.15, text: 'evidence' },
  { id: 'refused', in: REFUSE + 0.02, out: 11.25, fi: 0.12, fo: 0.25, text: 'refused' },
  { id: 'brief', in: TREE_ON, out: F0 + 0.6, fi: 0.3, fo: 0.3, text: 'brief' },
  { id: 'cardhead', in: CARD_FULL - 0.1, out: 20.15, fi: 0.3, fo: 0, text: 'BRIEF · LITTLE WHALE FILM' },
  { id: 'cardfoot', in: CARD_FULL - 0.1, out: 20.15, fi: 0.3, fo: 0, text: 'Context Atoms · 41 atoms · GREEN' },
];
const EP = { no: '01', short: 'Stitch', title: 'Context is <i>composed</i>.', accent: ACC };
const LOCK = DUR - 2.3;
const READ = [
  { id: 'eyebrow', in: 0.25, out: 2.5, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 01' },
  { id: 'title', in: 0.25, out: 2.5, fi: 0.4, fo: 0.45, text: 'Context is composed.' },
  { id: 'rail', in: b(10), out: b(36) - 0.1, fi: 0.3, fo: 0.3, text: 'Atoms · Types · Seams · Parallel · Certificate' },
  ...STA, ...CAPS, ...LAB,
  { id: 'lockup', in: LOCK, out: DUR, fi: 0.6, fo: 0, text: 'CETI · Capabilities · 01 · Stitch' },
];
const R = id => READ.find(r => r.id === id), la = (t, id) => { const r = R(id); return win(t, r.in, r.out, r.fi, r.fo); };

// ---------- seams ----------
const LEAF_TICK = { L1: b(31.5), R2: b(31.5), L2: b(32), R1: b(32), CL: b(32.5), CR: b(32.5) }, INNER_TICK = b(33), ROOT_TICK = b(34);
const INNER_FILL = { C: b(23) + 0.4, L: b(29.5), R: b(29.5) }, PULSE = { C: [b(23) + 0.1, b(23) + 0.4], L: [b(28.5), b(29.5)], R: [b(28.5), b(29.5)] };

// fold: where a socket / inner joint is at time t
const k1 = t => ramp(t, F0, F0 + 0.5, EASE.collect), k2 = t => ramp(t, F0 + 0.42, F0 + 0.94, EASE.collect);
function innerAt(par, t) { const k = k2(t); return { x: lerp(INNER[par], ROOT.x, k), y: lerp(IY, ROOT.y, k) }; }
function sockAt(i, t) { const s = SOCK[i], I = { x: INNER[s.par], y: IY }, a = k1(t), c = k2(t);
  const x1 = lerp(s.x, I.x, a), y1 = lerp(LY, I.y, a); return { x: lerp(x1, ROOT.x, c), y: lerp(y1, ROOT.y, c), s: lerp(1, 0.5, a) * lerp(1, 0.45, c) }; }

// ---------- drawing helpers ----------
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function drawAtom(c, X, Y, s, rot, a, at, o = {}) {
  if (a <= 0.003) return; c.save(); c.globalAlpha *= a; c.translate(X, Y); c.rotate(rot); c.scale(s, s);
  const tx = TABX[at.ty]; c.lineJoin = 'round';
  rr(c, tx - 17, -45, 34, 18, 4); c.fillStyle = TYPE[at.ty]; c.fill(); c.strokeStyle = INK; c.lineWidth = 4.2; c.stroke();
  rr(c, -52, -32, 104, 64, 8); c.fillStyle = ATOM; c.fill(); c.stroke();
  c.fillStyle = TYPE[at.ty]; c.fillRect(tx - 15.5, -33, 31, 4);
  const lb = o.label || 0;
  if (lb < 1) { c.globalAlpha *= 1 - lb; c.strokeStyle = LINES; c.lineWidth = 5; c.lineCap = 'round';
    at.lines.forEach((w, k) => { c.beginPath(); c.moveTo(-36, -8 + k * 18); c.lineTo(-36 + 72 * w, -8 + k * 18); c.stroke(); }); c.globalAlpha /= (1 - lb) || 1; }
  c.restore();
  if (lb > 0) text(c, o.labelText, X, Y + 6 * s, { f: 'mono', size: Math.round(15 * s), col: INK, a: a * lb, align: 'center', track: 0.12 });
  if ((o.flash || 0) > 0) { c.save(); c.globalAlpha = o.flash * a; c.strokeStyle = TYPE_EDGE[at.ty]; c.lineWidth = 4.5; rr(c, X - 60 * s, Y - 40 * s, 120 * s, 80 * s, 12); c.stroke(); c.restore(); }
}
function drawSocket(c, X, Y, s, ty, o) {
  c.save(); c.globalAlpha *= o.a; c.translate(X, Y); c.scale(s, s); const tx = TABX[ty], nk = o.notch;
  c.lineWidth = 4; c.setLineDash(o.solid > 0.5 ? [] : [9, 8]); c.strokeStyle = o.refuse > 0 ? mix(DASH, REF, o.refuse) : (o.solid > 0.5 ? INK : DASH);
  rr(c, -58, -38, 116, 76, 10); c.fillStyle = rgba(C.paper, 0.6); c.fill(); c.stroke();
  c.setLineDash([]);
  rr(c, tx - 20, -54, 40, 18, 5); c.fillStyle = nk > 0 ? mix(BG, TYPE[ty], 0.25 + 0.55 * nk) : rgba(C.paper, 0); c.fill();
  c.strokeStyle = nk > 0 ? mix(DASH, TYPE_EDGE[ty], nk) : DASH; c.lineWidth = 4; c.stroke();
  c.restore(); }
function seamDot(c, X, Y, z, st) { // st: fill 0..1, tick 0..1, refuse 0..1
  const r = 9 * z; c.save();
  if (st.tick > 0) { const sc = lerp(1.5, 1, EASE.glaser(clamp(st.tick * 1.6))), R2 = 20 * z * sc;
    c.fillStyle = C.paper; c.beginPath(); c.arc(X, Y, R2, 0, Math.PI * 2); c.fill(); c.strokeStyle = GRN; c.lineWidth = 4 * z; c.stroke();
    const d = clamp(st.tick * 1.3); c.strokeStyle = INK; c.lineWidth = 4.2 * z; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
    const p0 = [X - 9 * z, Y + 1 * z], p1 = [X - 2.5 * z, Y + 7.5 * z], p2 = [X + 10 * z, Y - 7.5 * z];
    c.moveTo(...p0); if (d < 0.4) c.lineTo(lerp(p0[0], p1[0], d / 0.4), lerp(p0[1], p1[1], d / 0.4)); else { c.lineTo(...p1); c.lineTo(lerp(p1[0], p2[0], (d - 0.4) / 0.6), lerp(p1[1], p2[1], (d - 0.4) / 0.6)); } c.stroke();
    if (st.tick < 0.7) { c.strokeStyle = rgba(GRN, 0.6 * (1 - st.tick / 0.7)); c.lineWidth = 3 * z; c.beginPath(); c.arc(X, Y, R2 + 22 * z * st.tick, 0, Math.PI * 2); c.stroke(); }
    c.restore(); return; }
  c.fillStyle = st.fill > 0 ? mix(C.paper, INK, st.fill) : C.paper; c.strokeStyle = st.refuse > 0 ? mix(SOFT, REF, st.refuse) : SOFT; c.lineWidth = 2 * z;
  c.beginPath(); c.arc(X, Y, r, 0, Math.PI * 2); c.fill(); c.stroke();
  if (st.refuse > 0) { const q = st.refuse; c.strokeStyle = REF; c.lineWidth = 5 * z; c.lineCap = 'round'; const e = 17 * z;
    c.globalAlpha = q; c.beginPath(); c.moveTo(X - e, Y - e); c.lineTo(X + e, Y + e); c.moveTo(X + e, Y - e); c.lineTo(X - e, Y + e); c.stroke();
    c.globalAlpha = 1; }
  c.restore(); }
function elbow(c, X, Y, x0, y0, x1, y1) { const m = (y0 + y1) / 2; c.beginPath(); c.moveTo(X(x0), Y(y0)); c.lineTo(X(x0), Y(m)); c.lineTo(X(x1), Y(m)); c.lineTo(X(x1), Y(y1)); c.stroke(); }

// ---------- frame ----------
function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
  S.ground(c, t, cm, { tint: PINK });
  const W0 = wpos(t);

  // ---------- the line ----------
  const lineA = ramp(t, 3.0, 3.4) * (1 - ramp(t, 20.8, 21.8, Rs));
  if (lineA > 0) { const tip = lerp(-1400, 1100, ramp(t, 3.0, 4.7, EASE.warm)); c.strokeStyle = rgba(INK, 0.85 * lineA); c.lineWidth = 4.4 * z; c.lineCap = 'round';
    c.beginPath(); c.moveTo(X(-1400), Y(LINE_Y)); c.lineTo(X(tip), Y(LINE_Y)); c.stroke();
    c.strokeStyle = rgba(INK, 0.35 * lineA); c.lineWidth = 2.4 * z; c.beginPath(); for (let x = -1380; x < tip; x += 60) { c.moveTo(X(x), Y(LINE_Y)); c.lineTo(X(x), Y(LINE_Y + 9)); } c.stroke(); }

  // ---------- parallel hulls ----------
  const hull = win(t, b(25) + 0.1, b(31) - 0.1, 0.35, 0.4);
  if (hull > 0) { c.save(); c.strokeStyle = rgba(ACC, 0.6 * hull); c.lineWidth = 4 * z; c.setLineDash([10 * z, 9 * z]);
    for (const [x0, x1] of [[-700, -230], [230, 700]]) { rr(c, X(x0), Y(-122), (x1 - x0) * z, 286 * z, 22 * z); c.stroke(); }
    c.restore();
    // the two branches share nothing: a small '‖' between them, drawn as marks
    c.save(); c.strokeStyle = rgba(ACC, 0.8 * hull); c.lineWidth = 4.4 * z; c.beginPath(); for (const dx of [-215, 215]) for (const o of [-8, 8]) { c.moveTo(X(dx + o), Y(-112)); c.lineTo(X(dx + o), Y(-50)); } c.stroke(); c.restore(); }

  // ---------- the tree ----------
  const aRoot = ramp(t, TREE_ON, TREE_ON + 0.3), aIn = ramp(t, TREE_ON + 0.15, TREE_ON + 0.5), aLeaf = ramp(t, TREE_ON + 0.3, TREE_ON + 0.75);
  const treeA = 1 - ramp(t, F0 + 0.8, F0 + 0.95);
  if (aRoot > 0 && t < CARD_T + 0.05) {
    c.save(); c.lineWidth = 4.2 * z; c.lineCap = 'round'; c.lineJoin = 'round';
    for (const par of ['L', 'C', 'R']) { const I = innerAt(par, t);
      c.strokeStyle = rgba(INK, 0.75 * aIn * treeA); elbow(c, X, Y, ROOT.x, ROOT.y + 32 * lerp(1, 0.5, k2(t)), I.x, I.y - 18);
      SOCK.forEach((s, i) => { if (s.par !== par) return; const P = sockAt(i, t); c.strokeStyle = rgba(INK, 0.6 * aLeaf * treeA); elbow(c, X, Y, I.x, I.y + 18, P.x, P.y - 54 * P.s); }); }
    c.restore();
    // pulses climbing the stalks
    for (const par of ['L', 'C', 'R']) { const [p0, p1] = PULSE[par]; if (t < p0 || t > p1 + 0.1) continue; const u = EASE.warm(clamp((t - p0) / (p1 - p0)));
      SOCK.forEach((s, i) => { if (s.par !== par) return; const I = { x: INNER[par], y: IY + 18 }, sx = s.x, sy = LY - 54, m = (sy + I.y) / 2;
        const L1 = sy - m, L2 = Math.abs(sx - I.x), L3 = m - I.y, Ltot = L1 + L2 + L3, d = u * Ltot; let px, py;
        if (d < L1) { px = sx; py = sy - d; } else if (d < L1 + L2) { px = lerp(sx, I.x, (d - L1) / L2); py = m; } else { px = I.x; py = m - (d - L1 - L2); }
        c.fillStyle = rgba(ACC, 1 - ramp(t, p1, p1 + 0.1)); c.beginPath(); c.arc(X(px), Y(py), 6 * z, 0, Math.PI * 2); c.fill(); }); }
    // inner joints
    for (const par of ['L', 'C', 'R']) { const I = innerAt(par, t), s = lerp(1, 0.5, k2(t));
      c.save(); c.globalAlpha = aIn * treeA; rr(c, X(I.x) - 20 * z * s, Y(I.y) - 18 * z * s, 40 * z * s, 36 * z * s, 8 * z * s); c.fillStyle = ATOM; c.fill(); c.strokeStyle = INK; c.lineWidth = 4.2 * z; c.stroke(); c.restore();
      if (k2(t) < 0.5) { c.save(); c.globalAlpha = aIn * treeA * (1 - k2(t) * 2);
        seamDot(c, X(I.x), Y(I.y - 48), z, { fill: ramp(t, INNER_FILL[par], INNER_FILL[par] + 0.15), tick: ramp(t, INNER_TICK, INNER_TICK + 0.4, EASE.rest), refuse: 0 }); c.restore(); } }
    // sockets + leaf seams
    SOCK.forEach((s, i) => { const P = sockAt(i, t), filled = t >= s.snap, flashR = s.id === 'CR' ? win(t, REFUSE, REFUSE + 0.75, 0.04, 0.4) : 0;
      if (!filled || t < s.snap + 0.3) drawSocket(c, X(P.x), Y(P.y), z * P.s, s.ty, { a: aLeaf * treeA * (filled ? 1 - ramp(t, s.snap, s.snap + 0.3) : 1), notch: ramp(t, NOTCH_T[s.ty], NOTCH_T[s.ty] + 0.3), solid: 0, refuse: flashR });
      if (filled) { const u = clamp((t - s.snap) / 0.45); if (u < 1) { c.strokeStyle = rgba(INK, 0.55 * (1 - u)); c.lineWidth = 4.5 * z; rr(c, X(P.x) - (64 + 22 * u) * z, Y(P.y) - (44 + 22 * u) * z, (128 + 44 * u) * z, (88 + 44 * u) * z, 14 * z); c.stroke(); } }
      if (k1(t) < 0.4) { c.save(); c.globalAlpha = aLeaf * treeA * (1 - k1(t) * 2.5);
        seamDot(c, X(P.x), Y(P.y - 76), z, { fill: ramp(t, s.snap, s.snap + 0.12), tick: ramp(t, LEAF_TICK[s.id], LEAF_TICK[s.id] + 0.4, EASE.rest), refuse: flashR }); c.restore(); } });
    // root
    const rs = lerp(1, 1, 0), rA = aRoot * (1 - ramp(t, CARD_T - 0.05, CARD_T + 0.05));
    c.save(); c.globalAlpha = rA; rr(c, X(ROOT.x) - 85 * z * rs, Y(ROOT.y) - 32 * z, 170 * z, 64 * z, 10 * z); c.fillStyle = ATOM; c.fill(); c.strokeStyle = INK; c.lineWidth = 4.4 * z; c.stroke(); c.restore();
    text(c, 'brief', X(ROOT.x), Y(ROOT.y) + 7 * z, { f: 'mono', size: Math.round(19 * z), col: INK, a: la(t, 'brief'), align: 'center' });
    if (t > ROOT_TICK) { c.save(); c.globalAlpha = rA; seamDot(c, X(ROOT.x + 85), Y(ROOT.y - 32), z * 1.4, { fill: 1, tick: ramp(t, ROOT_TICK, ROOT_TICK + 0.45, EASE.rest), refuse: 0 }); c.restore(); }
    // 'evidence' label inside the evidence socket, while the claim tries it
    const ev = la(t, 'evidence'); if (ev > 0) text(c, 'evidence', X(90), Y(LY) + 8 * z, { f: 'mono', size: Math.round(14 * z), col: SOFT, a: ev, align: 'center', track: 0.1 });
  }

  // ---------- atoms ----------
  ATOMS.forEach((at, i) => {
    let [, x, y, r] = keyed(at.all, t), sc = 1, a = ramp(t, 2.0, 2.5);
    if (t < at.drop) { x += Math.sin(t * 0.9 + i * 1.7) * 6; y += Math.cos(t * 0.8 + i) * 5; r += Math.sin(t * 0.7 + i) * 0.05;
      const dx = x - W0.x, dy = y - W0.y, d = Math.hypot(dx, dy); if (d < 200 && d > 1) { const push = 40 * Math.exp(-d / 80); x += dx / d * push; y += dy / d * push; r += push * 0.004; } }
    if (i === 1 && t > REFUSE && t < REFUSE + 0.4) { const u = t - REFUSE; r += 0.09 * Math.sin(u * 55) * Math.exp(-u * 9); x += 6 * Math.sin(u * 55) * Math.exp(-u * 9); }
    if (t >= at.snap) { const P = sockAt(SK[at.sock], t); x = P.x; y = P.y; sc = P.s; a *= 1 - ramp(t, F0 + 0.8, F0 + 0.95); }
    const land = at.drop + 0.45, flash = t > land ? Math.exp(-(t - land) * 5) * (t < land + 1 ? 1 : 0) : 0, snapF = t > at.snap ? Math.exp(-(t - at.snap) * 6) : 0;
    const lift = t < at.snap && t > at.snap - 0.2 ? 1 : 0;
    drawAtom(c, X(x), Y(y), z * sc * (1 + 0.06 * snapF) * (1 + 0.04 * lift), r, a, at, { flash: Math.max(flash, snapF), label: i === 1 ? la(t, 'claim') : 0, labelText: 'claim' });
  });
  // the refusal chip, beside the seam
  const rf = la(t, 'refused'); if (rf > 0) S.chip(c, 'refused', X(132), Y(LY - 76) + 6 * z, { f: 'mono', size: 18, col: REFINK, a: rf, pad: 10 });

  // ---------- the brief card ----------
  const cardIn = ramp(t, CARD_T - 0.05, CARD_FULL, EASE.glaser);
  if (cardIn > 0 && t < 22) {
    const grab = ramp(t, 20.15, 20.5, EASE.glaser);
    const cx0 = lerp(ROOT.x, 0, cardIn), cy0 = lerp(ROOT.y, -60, cardIn), w0 = lerp(170, 460, cardIn), h0 = lerp(64, 280, cardIn);
    const pod = podAt(t), cx = lerp(cx0, pod.x, grab), cy = lerp(cy0, pod.y + 64, grab), s = lerp(1, 0.28, grab);
    const w = w0 * s, h = h0 * s, sx = X(cx), sy = Y(cy);
    c.save(); c.translate(sx, sy); c.scale(z * s, z * s); c.translate(-sx, -sy);
    const L = sx - w0 / 2, T = sy - h0 / 2;
    // folder tabs, one per type
    TYPE.forEach((col, k) => { rr(c, L + 26 + k * 52, T - 15, 44, 20, 5); c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = 4; c.stroke(); });
    rr(c, L, T, w0, h0, 14); c.fillStyle = CARD; c.fill(); c.strokeStyle = INK; c.lineWidth = 4.4; c.stroke();
    const inA = ramp(t, CARD_FULL - 0.15, CARD_FULL + 0.2);
    if (inA > 0) { c.save(); c.globalAlpha *= inA;
      // rows: composed atoms, stacked
      const rows = [0, 2, 1, 1, 2, 0, 1]; rows.forEach((ty, k) => { const ry = T + 72 + k * 22; c.fillStyle = TYPE[ty]; rr(c, L + 26, ry - 7, 14, 14, 3); c.fill(); c.strokeStyle = TYPE_EDGE[ty]; c.lineWidth = 1.5; c.stroke();
        c.strokeStyle = LINES; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(L + 54, ry); c.lineTo(L + 54 + (150 + ((k * 71) % 9) * 22), ry); c.stroke(); });
      c.strokeStyle = rgba(INK, 0.3); c.lineWidth = 1.2; c.beginPath(); c.moveTo(L + 22, T + h0 - 58); c.lineTo(L + w0 - 22, T + h0 - 58); c.stroke(); c.restore(); }
    text(c, 'BRIEF · LITTLE WHALE FILM', L + 26, T + 42, { f: 'mono', size: 14, col: SOFT, a: la(t, 'cardhead') });
    text(c, 'Context Atoms · 41 atoms · GREEN', L + 26, T + h0 - 24, { f: 'mono', size: 15, col: INK, a: la(t, 'cardfoot'), track: 0.16 });
    // receipt stamp
    const st = ramp(t, SEAL - 0.08, SEAL + 0.5, EASE.rest);
    if (st > 0) { const px = L + w0 - 44, py = T + 44; c.save(); c.globalAlpha *= clamp(st * 3); seamDot(c, px, py, 2.4 * lerp(1.25, 1, EASE.glaser(clamp(st * 2))), { fill: 1, tick: st, refuse: 0 }); c.restore(); }
    c.restore();
    // pod (drawn after the card so it carries it)
  }
  { const p = podAt(t); if (p.a > 0) { const ang0 = p.ang, flip = Math.cos(ang0) < 0; c.save(); c.translate(X(p.x), Y(p.y)); let ang = ang0; if (flip) { c.scale(-1, 1); ang = Math.PI - ang0; }
      KH.drawPod(c, 0, 0, ang, 96 * z, PINK, { alpha: p.a, ink: INK, glow: win(t, SEAL, SEAL + 1.2, 0.2, 0.6) * 0.7 }); c.restore(); } }

  // ---------- the whale ----------
  { const f = facing(t), ang = heading(t), v = wvel(t), still = Math.hypot(v.x, v.y) < 80;
    let blink = 0; for (const bt of [6.9, REFUSE + 0.1, 14.2, 19.7, 23.9]) blink = Math.max(blink, 1 - Math.abs(t - bt) / 0.08);
    let sq = 0; for (const ft of FLICK) sq += 0.09 * win(t, ft - 0.06, ft + 0.3, 0.06, 0.22); sq -= 0.07 * win(t, REFUSE + 0.05, REFUSE + 0.45, 0.06, 0.3);
    const focus = win(t, 7.6, 14.6, 0.3, 0.3) * (1 - win(t, REFUSE + 0.05, REFUSE + 0.6, 0.05, 0.2)), spark = Math.max(win(t, ROOT_TICK - 0.05, ROOT_TICK + 1.0, 0.1, 0.4), win(t, SEAL, SEAL + 1.2, 0.1, 0.45));
    const delight = t > SEAL + 0.3 ? 1 : 0, flickT = FLICK.reduce((m, ft) => Math.max(m, win(t, ft - 0.08, ft + 0.25, 0.06, 0.2)), 0);
    c.save(); c.translate(X(W0.x), Y(W0.y)); if (f < 0) c.scale(-1, 1);
    KH.drawWhale(c, { x: 0, y: 0, ang: f < 0 ? -ang : ang, scale: 0.55 * Math.max(z, 0.85), L: 1, tail: Math.sin(t * (still ? 3 : 11)) * (still ? 0.12 : 0.34) + flickT * 0.45,
      fin: Math.sin(t * (still ? 3 : 11) + 1.3) * 0.3 - flickT * 0.4, blink, focus, spark, sparkColor: mix(PINK, INK, 0.2), sparkScale: 1.3, eye: win(t, REFUSE + 0.02, REFUSE + 0.5, 0.05, 0.2) > 0.2 ? 1.25 : 1,
      delight, blush: 0.6, mouth: delight ? 0.4 : 0, squash: sq, spray: win(t, 22.0, 23.0, 0.12, 0.4), sprayColor: mix(PINK, INK, 0.25) });
    c.restore(); }

  // ---------- text ----------
  S.open(c, t, EP, { out: 2.5 });
  // station rail (mono, active word in ink with an accent underline) and its gloss
  const railA = la(t, 'rail');
  if (railA > 0) { const words = STA.map(s => s.word), sz = 20, gap = 30;
    const meas = w => { c.save(); c.globalAlpha = 0; const k = text(c, w, 0, -100, { f: 'monoB', size: sz, col: INK }); c.restore(); return k; };
    const wds = words.map(meas), total = wds.reduce((a, w) => a + w, 0) + gap * (words.length - 1); let x = 160;
    c.save(); c.globalAlpha = railA; c.fillStyle = C.paper; rr(c, 142, 98, total + 36, 48, 8); c.fill(); c.restore();
    words.forEach((w, k) => { const s = STA[k], on = win(t, s.in, s.out, 0.12, 0.12), past = t >= s.out - 0.1, wd = wds[k];
      text(c, w, x, 128, { f: on > 0.5 ? 'monoB' : 'mono', size: sz, col: on > 0.02 ? mix(SOFT, INK, on) : past ? SOFT : FUT, a: railA });
      if (on > 0) { c.save(); c.globalAlpha = railA * on; c.fillStyle = ACC; c.fillRect(x, 137, wd * EASE.glaser(clamp((t - s.in) / 0.3)), 4); c.restore(); }
      if (k < words.length - 1) text(c, '·', x + wd + gap / 2, 128, { f: 'mono', size: sz, col: FUT, a: railA, track: 0, align: 'center' });
      x += wd + gap; }); }
  for (const s of STA) { const a = win(t, s.in, s.out, s.fi, s.fo); if (a <= 0) continue; const dy = (1 - EASE.defer(clamp((t - s.in) / s.fi))) * 8;
    S.chip(c, s.gloss, 160, 206 + dy, { f: 'sans', size: 40, col: INK, a, pad: 16 }); }
  for (const r of CAPS) S.caption(c, t, r, { accent: ACC });
  S.lockup(c, t, LOCK, EP);
  const fb = 1 - ramp(t, 0, 0.3); if (fb > 0) { c.fillStyle = rgba(BG, fb); c.fillRect(0, 0, W, H); }
  c.restore();
}

// pod: in from the right, hovers over the card, takes it, leaves top right
function podAt(t) { const tin = SEAL, arr = b(41.5), go = ramp(t, 20.42, 21.35, EASE.collect);
  if (t < tin - 0.05 || t > 21.5) return { a: 0, x: 0, y: 0, ang: 0 };
  const u = ramp(t, tin, arr, EASE.glaser), hx = 40, hy = -330 + Math.sin(t * 3) * 6 * ramp(t, arr - 0.2, arr + 0.3);
  const x = lerp(lerp(1250, hx, u), 1550, go), y = lerp(lerp(-560, hy, u), -800, go);
  const ang = go > 0.02 ? Math.atan2(-470, 1510) : lerp(Math.atan2(230, -1210), Math.PI, u);
  return { a: ramp(t, tin - 0.05, tin + 0.15), x, y, ang }; }

function cues() { return { bpm: BPM, dur: DUR, title: 0.25, heap: 2.0, through: 3.9, line: 3.0, drops: ATOMS.map(a => a.drop + 0.45).sort((p, q) => p - q), tree: TREE_ON, notches: NOTCH_T,
  flicks: FLICK, snaps: [...new Set(ATOMS.map(a => a.snap))].sort((p, q) => p - q), snapTypes: ATOMS.map(a => [a.snap, a.ty, SOCK[SK[a.sock]].x]), refuse: REFUSE, pairs: [b(27), b(28)], pulses: [PULSE.C[1], PULSE.L[1]],
  ticks: [...new Set(Object.values(LEAF_TICK))].sort((p, q) => p - q), innerTick: INNER_TICK, rootTick: ROOT_TICK, fold: F0, card: CARD_T, seal: SEAL, podArrive: b(41.5), grab: 20.15, leave: 20.42,
  notThis: R('not').in, end: R('end').in, lockup: LOCK }; }
const CONTRAST = [['title', INK, BG], ['title accent', ACC, BG], ['eyebrow', SOFT, BG], ['rail active on chip', INK, C.paper], ['rail past on chip', SOFT, C.paper], ['rail future on chip', FUT, C.paper], ['station gloss on chip', INK, C.paper],
  ['caption on chip', INK, C.paper], ['caption accent on chip', ACC, C.paper], ['claim label on atom', INK, ATOM], ['evidence label in socket', SOFT, mix(BG, C.paper, 0.6)], ['evidence label on ground', SOFT, BG],
  ['refused chip', REFINK, C.paper], ['brief label on root', INK, ATOM], ['card header', SOFT, CARD], ['card number line', INK, CARD], ['lockup', SOFT, BG]];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, DUR, W, H, fps: 60, wpos, heading, cam, shutter: t => (t > 20.3 && t < 21.5) || (t > 4.6 && t < 6.6) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
