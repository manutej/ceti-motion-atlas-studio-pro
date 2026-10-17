// CETI Capabilities · 01 · stitch — "Context is composed." Kinetic Hydrography 1.0.0 + series layer.
// Typed context atoms ride the line into a socketed tree. A match snaps, a mismatch is refused at the seam,
// two disjoint branches fill in parallel, every seam gets a receipt, and the tree folds into one sealed brief
// that an AI pod carries away. drawFrame(ctx, t) is a pure function of t.
// v2: bigger atoms/tabs/notches, a z≈2 push-in on the refusal, a messier heap, a tighter ending over the tree's ghost.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, win, EASE, ramp, mix, rgba, text } = KH;
const W = 1920, H = 1080, BPM = 128, B = 60 / BPM, b = n => n * B, DUR = 24.95;

// ---------- palette (Wada 166 + CETI) ----------
const PINK = WD.grenadinePink, YEL = WD.naplesYellow, GRN = WD.deepSlateGreen;
const INK = C.navy, SOFT = C.slate, BG = mix(C.paper, PINK, 0.06), ATOM = mix(C.paper, KH.NEUTRALS.white, 0.5), CARD = mix(C.paper, KH.NEUTRALS.white, 0.6);
const ACC = mix(PINK, INK, 0.66), REF = C.rust, REFINK = mix(C.rust, INK, 0.15), LINES = mix(C.paper, C.slate, 0.5), DASH = mix(C.paper, C.slate, 0.62);
const TYPE = [PINK, GRN, YEL], TYPE_EDGE = [mix(PINK, INK, 0.35), INK, mix(YEL, INK, 0.45)], TABX = [-36, 0, 36];   // claim · evidence · rule
const FUT = mix(C.paper, C.slate, 0.9);
const G = EASE.glaser, Wm = EASE.warm, Rs = EASE.rest;

// ---------- the tree (world units; atoms 124×76 with 46×24 tabs, sockets 136×90 with 52×26 notches) ----------
const ROOT = { x: 0, y: -260 }, INNER = { L: -465, C: 0, R: 465 }, IY = -100, LY = 100, LINE_Y = 350, ON = 312;
const SOCK = [{ id: 'L1', x: -600, ty: 2, par: 'L' }, { id: 'L2', x: -330, ty: 1, par: 'L' }, { id: 'CL', x: -100, ty: 0, par: 'C' },
  { id: 'CR', x: 100, ty: 1, par: 'C' }, { id: 'R1', x: 330, ty: 2, par: 'R' }, { id: 'R2', x: 600, ty: 0, par: 'R' }];
const SK = Object.fromEntries(SOCK.map((s, i) => [s.id, i]));

// ---------- timeline (beats at 128 BPM) ----------
const TREE_ON = b(12.5), NOTCH_T = [b(14), b(14.5), b(15)], REFUSE = b(19);
const F0 = b(32), CARD_T = F0 + 0.95, CARD_FULL = b(34.5), SEAL = b(35.5), ARR = b(37), GRAB = 18.05, GO = [18.3, 19.05];
const LEAF_TICK = { L1: b(28.5), R2: b(28.5), L2: b(29), R1: b(29), CL: b(29.5), CR: b(29.5) }, INNER_TICK = b(30), ROOT_TICK = b(31);
const INNER_FILL = { C: b(21.5) + 0.4, L: b(28), R: b(28) }, PULSE = { C: [b(21.5) + 0.1, b(21.5) + 0.4], L: [b(27), b(28)], R: [b(27), b(28)] };
const GHOST = [18.45, 19.3];

// ---------- atoms: keys [t, x, y, rot, ease-into-this-key] ----------
const tl = i => b(9) + i * b(0.5);          // drop from the heap onto the line, one per half-beat
const PILE = [[-330, 15, 0.72], [-415, 95, -0.55], [-480, -10, 0.28], [-560, 80, -0.9], [-610, 10, 0.5], [-440, 40, -0.2]];
const ATOMS = [
  { ty: 0, sock: 'CL', snap: b(16.5), slide: [[6.9, -300], [7.45, -100, Wm]], keys: [[7.53, -100, ON, 0], [b(16.5), -100, LY, 0, G]] },
  { ty: 0, sock: 'R2', snap: b(25.5), slide: [[7.8, -440], [8.55, 100, Wm]], keys: [[8.71, 100, ON, 0], [REFUSE, 100, 193, 0, G], [REFUSE + 0.14, 100, 193, 0], [9.36, 100, ON, 0, Rs], [9.4, 100, ON, 0],
      [10.0, 600, ON, 0, G], [b(25.5) - 0.2, 600, ON, 0], [b(25.5), 600, LY, 0, G]] },
  { ty: 1, sock: 'CR', snap: b(21.5), slide: [[7.9, -580], [8.55, -300, Wm]], keys: [[9.38, -300, ON, 0], [9.72, 100, ON, 0, G], [b(21.5) - 0.2, 100, ON, 0], [b(21.5), 100, LY, 0, G]] },
  { ty: 2, sock: 'L1', snap: b(25.5), slide: [[7.9, -1000], [8.55, -720, Wm]], keys: [[11.3, -720, ON, 0], [11.7, -600, ON, 0, Wm], [b(25.5) - 0.2, -600, ON, 0], [b(25.5), -600, LY, 0, G]] },
  { ty: 1, sock: 'L2', snap: b(26.5), slide: [[7.9, -860], [8.55, -580, Wm]], keys: [[11.3, -580, ON, 0], [11.9, -330, ON, 0, Wm], [b(26.5) - 0.2, -330, ON, 0], [b(26.5), -330, LY, 0, G]] },
  { ty: 2, sock: 'R1', snap: b(26.5), slide: [[7.9, -720], [8.55, -440, Wm]], keys: [[11.3, -440, ON, 0], [11.95, 330, ON, 0, Wm], [b(26.5) - 0.2, 330, ON, 0], [b(26.5), 330, LY, 0, G]] },
];
const QX = [-300, -440, -580, -1000, -860, -720], DROP = [0, 1, 2, 5, 4, 3];   // atom i lands at QX[i]; DROP = its turn in the drop order
ATOMS.forEach((a, i) => { const p = PILE[DROP[i]], td = tl(DROP[i]);
  a.drop = td; a.lines = [0.5 + 0.35 * ((i * 37) % 10) / 10, 0.35 + 0.4 * ((i * 53) % 10) / 10];
  a.all = [[0, p[0], p[1], p[2]], [td, p[0], p[1], p[2]], [td + 0.45, QX[i], ON, 0, G], ...a.slide.map(([t, x, e]) => [t, x, ON, 0, e]), ...a.keys]; });
SOCK.forEach(s => { s.snap = ATOMS.find(a => a.sock === s.id).snap; });

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
const FLICK = [b(16.25), REFUSE - 0.14, b(21.25), b(25.5) - 0.12, b(26.5) - 0.12];
const WK = mk([[0, -1500, -40], [1.6, -1250, -40], [2.5, -860, 40], [3.3, -520, 85], [3.95, -260, -70], [4.6, -430, -100], [5.2, -640, -80], [5.7, -800, 180], [6.4, -380, 198, 'h'],
  [7.25, -370, 196], [7.62, -245, 194], [8.0, -255, 198], [8.5, -75, 200], [8.77, -52, 195], [9.1, -105, 188], [9.6, -78, 198], [9.96, -52, 194], [10.5, -58, 200],
  [11.2, 0, 206, 'h'], [15.2, 0, 206, 'h'], [16.1, -380, -255, 'h'], [18.7, -380, -250, 'h'], [19.8, 0, -410, 'h'], [DUR, 10, -412, 'h']]);
const base = t => { const v = hermite(WK, t); return { x: v[0], y: v[1] }; };
const bvel = t => { const a = base(t - 1 / 240), c = base(t + 1 / 240); return { x: (c.x - a.x) * 120, y: (c.y - a.y) * 120 }; };
const wpos = t => { const p = base(t), v = bvel(t), still = clamp(1 - Math.hypot(v.x, v.y) / 260); return { x: p.x, y: p.y + Math.sin(t * 2.4) * 5 * still * ramp(t, 6.2, 6.8, Rs) }; };
const wvel = t => { const a = wpos(t - 1 / 240), c = wpos(t + 1 / 240); return { x: (c.x - a.x) * 120, y: (c.y - a.y) * 120 }; };
function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
    a += (sp < 40 ? 0 : clamp(Math.atan2(v.y, Math.abs(v.x)), -0.9, 0.9) * clamp(sp / 320)) * w; s += w; } return a / s; }
const facing = t => (t > 3.97 && t < 5.65) ? -1 : 1;   // only the sweep over the heap faces left

// ---------- camera ----------
const CK = mk([[0, -430, 60, 1.0], [2.2, -430, 50, 1.12], [3.2, -440, 50, 1.22], [4.1, -380, 70, 1.18], [5.0, -260, 80, 1.08], [6.2, -110, 60, 1.06], [7.1, 0, 60, 1.12], [8.0, 0, 85, 1.3],
  [8.65, 0, 110, 2.0, 'h'], [10.45, 0, 110, 2.0, 'h'], [11.2, 0, 45, 1.1, 'h'], [13.0, 0, 45, 1.1, 'h'], [14.5, 0, 20, 1.1], [15.4, 0, -90, 1.14], [16.4, 0, -90, 1.22, 'h'],
  [17.6, 10, -105, 1.16], [18.9, 0, -70, 1.02], [DUR, 0, -80, 1.08, 'h']]);
function cam(t) { const v = hermite(CK, t); return { x: v[0], y: v[1], z: v[2], ax: 960, ay: 540 }; }

// ---------- READ ----------
const STA = [
  { id: 's1', word: 'Atoms', gloss: 'small typed parts', in: b(9), out: b(13.5) - 0.05 },
  { id: 's2', word: 'Types', gloss: 'each socket has a colour', in: b(13.5), out: b(18) - 0.05 },
  { id: 's3', word: 'Seams', gloss: 'checks live at joints', in: b(18), out: b(24) - 0.05 },
  { id: 's4', word: 'Parallel', gloss: 'separate parts run together', in: b(24), out: b(28) - 0.05 },
  { id: 's5', word: 'Certificate', gloss: 'a receipt for every joint', in: b(28), out: b(32) - 0.03 },
].map(s => ({ ...s, fi: 0.25, fo: 0.2, text: s.gloss }));
const LOCK = DUR - 2.2;
const CAPS = [
  { id: 'c1', in: 2.45, out: 4.22, fi: 0.3, fo: 0.25, text: 'A heap of context.', html: 'A heap of <i>context</i>.' },
  { id: 'not', in: 18.85, out: 20.52, fi: 0.25, fo: 0.2, text: 'Consistency is not correctness.', html: 'Consistency is not <i>correctness</i>.' },
  { id: 'end', in: 20.5, out: LOCK, fi: 0.3, fo: 0.25, text: 'Small typed parts, checked at every seam.', html: 'Small typed parts, checked at every <i>seam</i>.' },
];
const LAB = [
  { id: 'claim', in: 8.0, out: 10.6, fi: 0.2, fo: 0.25, text: 'claim' },
  { id: 'evidence', in: 8.1, out: 9.85, fi: 0.2, fo: 0.15, text: 'evidence' },
  { id: 'refused', in: REFUSE + 0.02, out: 10.7, fi: 0.12, fo: 0.25, text: 'refused · claim ≠ evidence' },
  { id: 'brief', in: TREE_ON, out: F0 + 0.6, fi: 0.3, fo: 0.3, text: 'brief' },
  { id: 'cardhead', in: CARD_FULL - 0.1, out: GRAB, fi: 0.3, fo: 0, text: 'BRIEF · LITTLE WHALE FILM' },
  { id: 'cardfoot', in: CARD_FULL - 0.1, out: GRAB, fi: 0.3, fo: 0, text: 'Context Atoms · 41 atoms · GREEN' },
];
const EP = { no: '01', short: 'Stitch', title: 'Context is <i>composed</i>.', accent: ACC };
const READ = [
  { id: 'eyebrow', in: 0.25, out: 2.5, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 01' },
  { id: 'title', in: 0.25, out: 2.5, fi: 0.4, fo: 0.45, text: 'Context is composed.' },
  { id: 'rail', in: b(9), out: b(32) - 0.1, fi: 0.3, fo: 0.3, text: 'Atoms · Types · Seams · Parallel · Certificate' },
  ...STA, ...CAPS, ...LAB,
  { id: 'lockup', in: LOCK, out: DUR, fi: 0.45, fo: 0, text: 'CETI · Capabilities · 01 · Stitch' },
];
const R = id => READ.find(r => r.id === id), la = (t, id) => { const r = R(id); return win(t, r.in, r.out, r.fi, r.fo); };

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
  rr(c, tx - 23, -60, 46, 26, 6); c.fillStyle = TYPE[at.ty]; c.fill(); c.strokeStyle = INK; c.lineWidth = 4.2; c.stroke();
  rr(c, -62, -38, 124, 76, 10); c.fillStyle = ATOM; c.fill(); c.stroke();
  c.fillStyle = TYPE[at.ty]; c.fillRect(tx - 21, -39.5, 42, 5);
  const lb = o.label || 0;
  if (lb < 1) { c.save(); c.globalAlpha *= 1 - lb; c.strokeStyle = LINES; c.lineWidth = 6; c.lineCap = 'round';
    at.lines.forEach((w, k) => { c.beginPath(); c.moveTo(-44, -8 + k * 20); c.lineTo(-44 + 88 * w, -8 + k * 20); c.stroke(); }); c.restore(); }
  c.restore();
  if (lb > 0) text(c, o.labelText, X, Y + 7 * s, { f: 'mono', size: Math.round(17 * s), col: INK, a: a * lb, align: 'center', track: 0.12 });
  if ((o.flash || 0) > 0) { c.save(); c.globalAlpha *= o.flash * a; c.strokeStyle = TYPE_EDGE[at.ty]; c.lineWidth = 4.5; rr(c, X - 72 * s, Y - 48 * s, 144 * s, 96 * s, 14); c.stroke(); c.restore(); }
}
function drawSocket(c, X, Y, s, ty, o) {
  c.save(); c.globalAlpha *= o.a; c.translate(X, Y); c.scale(s, s); const tx = TABX[ty], nk = o.notch;
  c.lineWidth = 4; c.setLineDash([10, 8]); c.strokeStyle = o.refuse > 0 ? mix(DASH, REF, o.refuse) : DASH;
  rr(c, -68, -45, 136, 90, 12); c.fillStyle = rgba(C.paper, 0.6); c.fill(); c.stroke();
  c.setLineDash([]);
  rr(c, tx - 26, -69, 52, 26, 7); c.fillStyle = nk > 0 ? mix(BG, TYPE[ty], 0.3 + 0.6 * nk) : rgba(C.paper, 0); c.fill();
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
  c.fillStyle = st.fill > 0 ? mix(C.paper, INK, st.fill) : C.paper; c.strokeStyle = st.refuse > 0 ? mix(SOFT, REF, st.refuse) : SOFT; c.lineWidth = 3 * z;
  c.beginPath(); c.arc(X, Y, r, 0, Math.PI * 2); c.fill(); c.stroke();
  if (st.refuse > 0) { const q = st.refuse; c.strokeStyle = REF; c.lineWidth = 5 * z; c.lineCap = 'round'; const e = 17 * z;
    c.globalAlpha *= q; c.beginPath(); c.moveTo(X - e, Y - e); c.lineTo(X + e, Y + e); c.moveTo(X + e, Y - e); c.lineTo(X - e, Y + e); c.stroke(); }
  c.restore(); }
function elbow(c, X, Y, x0, y0, x1, y1) { const m = (y0 + y1) / 2; c.beginPath(); c.moveTo(X(x0), Y(y0)); c.lineTo(X(x0), Y(m)); c.lineTo(X(x1), Y(m)); c.lineTo(X(x1), Y(y1)); c.stroke(); }

// ---------- the tree + atoms at state time t (GA: alpha multiplier; ghost: the closing echo, no labels or motion marks) ----------
function drawTree(c, X, Y, z, t, W0, GA, ghost) {
  const aRoot = ramp(t, TREE_ON, TREE_ON + 0.3), aIn = ramp(t, TREE_ON + 0.15, TREE_ON + 0.5), aLeaf = ramp(t, TREE_ON + 0.3, TREE_ON + 0.75);
  const treeA = 1 - ramp(t, F0 + 0.8, F0 + 0.95);
  if (aRoot > 0 && t < CARD_T + 0.05) {
    c.save(); c.lineWidth = 4.2 * z; c.lineCap = 'round'; c.lineJoin = 'round';
    for (const par of ['L', 'C', 'R']) { const I = innerAt(par, t);
      c.strokeStyle = rgba(INK, 0.75 * aIn * treeA * GA); elbow(c, X, Y, ROOT.x, ROOT.y + 32 * lerp(1, 0.5, k2(t)), I.x, I.y - 18);
      SOCK.forEach((s, i) => { if (s.par !== par) return; const P = sockAt(i, t); c.strokeStyle = rgba(INK, 0.6 * aLeaf * treeA * GA); elbow(c, X, Y, I.x, I.y + 18, P.x, P.y - 69 * P.s); }); }
    c.restore();
    if (!ghost) for (const par of ['L', 'C', 'R']) { const [p0, p1] = PULSE[par]; if (t < p0 || t > p1 + 0.1) continue; const u = EASE.warm(clamp((t - p0) / (p1 - p0)));
      SOCK.forEach(s => { if (s.par !== par) return; const I = { x: INNER[par], y: IY + 18 }, sx = s.x, sy = LY - 69, m = (sy + I.y) / 2;
        const L1 = sy - m, L2 = Math.abs(sx - I.x), L3 = m - I.y, d = u * (L1 + L2 + L3); let px, py;
        if (d < L1) { px = sx; py = sy - d; } else if (d < L1 + L2) { px = lerp(sx, I.x, (d - L1) / L2); py = m; } else { px = I.x; py = m - (d - L1 - L2); }
        c.fillStyle = rgba(ACC, 1 - ramp(t, p1, p1 + 0.1)); c.beginPath(); c.arc(X(px), Y(py), 9 * z, 0, Math.PI * 2); c.fill(); }); }
    for (const par of ['L', 'C', 'R']) { const I = innerAt(par, t), s = lerp(1, 0.5, k2(t));
      c.save(); c.globalAlpha = aIn * treeA * GA; rr(c, X(I.x) - 20 * z * s, Y(I.y) - 18 * z * s, 40 * z * s, 36 * z * s, 8 * z * s); c.fillStyle = ATOM; c.fill(); c.strokeStyle = INK; c.lineWidth = 4.2 * z; c.stroke(); c.restore();
      if (k2(t) < 0.5) { c.save(); c.globalAlpha = aIn * treeA * GA * (1 - k2(t) * 2);
        seamDot(c, X(I.x), Y(I.y - 50), z, { fill: ramp(t, INNER_FILL[par], INNER_FILL[par] + 0.15), tick: ramp(t, INNER_TICK, INNER_TICK + 0.4, EASE.rest), refuse: 0 }); c.restore(); } }
    SOCK.forEach((s, i) => { const P = sockAt(i, t), filled = t >= s.snap, flashR = s.id === 'CR' ? win(t, REFUSE, REFUSE + 1.1, 0.04, 0.4) : 0;
      if (!filled || t < s.snap + 0.3) drawSocket(c, X(P.x), Y(P.y), z * P.s, s.ty, { a: aLeaf * treeA * GA * (filled ? 1 - ramp(t, s.snap, s.snap + 0.3) : 1), notch: ramp(t, NOTCH_T[s.ty], NOTCH_T[s.ty] + 0.3), refuse: flashR });
      if (filled && !ghost) { const u = clamp((t - s.snap) / 0.45); if (u < 1) { c.strokeStyle = rgba(INK, 0.55 * (1 - u)); c.lineWidth = 4.5 * z; rr(c, X(P.x) - (76 + 22 * u) * z, Y(P.y) - (52 + 22 * u) * z, (152 + 44 * u) * z, (104 + 44 * u) * z, 14 * z); c.stroke(); } }
      if (k1(t) < 0.4) { c.save(); c.globalAlpha = aLeaf * treeA * GA * (1 - k1(t) * 2.5);
        seamDot(c, X(P.x), Y(P.y - 95), z, { fill: ramp(t, s.snap, s.snap + 0.12), tick: ramp(t, LEAF_TICK[s.id], LEAF_TICK[s.id] + 0.4, EASE.rest), refuse: flashR }); c.restore(); } });
    const rA = aRoot * GA * (1 - ramp(t, CARD_T - 0.05, CARD_T + 0.05));
    c.save(); c.globalAlpha = rA; rr(c, X(ROOT.x) - 85 * z, Y(ROOT.y) - 32 * z, 170 * z, 64 * z, 10 * z); c.fillStyle = ATOM; c.fill(); c.strokeStyle = INK; c.lineWidth = 4.4 * z; c.stroke(); c.restore();
    if (!ghost) text(c, 'brief', X(ROOT.x), Y(ROOT.y) + 7 * z, { f: 'mono', size: Math.round(19 * z), col: INK, a: la(t, 'brief'), align: 'center' });
    if (t > ROOT_TICK) { c.save(); c.globalAlpha = rA; seamDot(c, X(ROOT.x + 85), Y(ROOT.y - 32), z * 1.4, { fill: 1, tick: ramp(t, ROOT_TICK, ROOT_TICK + 0.45, EASE.rest), refuse: 0 }); c.restore(); }
    if (!ghost) { const ev = la(t, 'evidence'); if (ev > 0) text(c, 'evidence', X(100), Y(LY) + 9 * z, { f: 'mono', size: Math.round(14 * z), col: SOFT, a: ev, align: 'center', track: 0.1 }); }
  }
  ATOMS.forEach((at, i) => {
    let [, x, y, r] = keyed(at.all, t), sc = 1, a = ramp(t, 2.3, 2.7) * GA;
    if (t < at.drop) { x += Math.sin(t * 0.9 + i * 1.7) * 7; y += Math.cos(t * 0.8 + i) * 6; r += Math.sin(t * 0.7 + i) * 0.06;
      const dx = x - W0.x, dy = y - W0.y, d = Math.hypot(dx, dy); if (d < 240 && d > 1) { const push = 70 * Math.exp(-d / 90); x += dx / d * push; y += dy / d * push; r += push * 0.005; } }
    if (i === 1 && t > REFUSE && t < REFUSE + 0.45) { const u = t - REFUSE; r += 0.1 * Math.sin(u * 55) * Math.exp(-u * 8); x += 8 * Math.sin(u * 55) * Math.exp(-u * 8); }
    if (t >= at.snap) { const P = sockAt(SK[at.sock], t); x = P.x; y = P.y; sc = P.s; a *= 1 - ramp(t, F0 + 0.8, F0 + 0.95); }
    const land = at.drop + 0.45, flash = ghost ? 0 : t > land ? Math.exp(-(t - land) * 5) * (t < land + 1 ? 1 : 0) : 0, snapF = ghost ? 0 : t > at.snap ? Math.exp(-(t - at.snap) * 6) : 0;
    const lift = t < at.snap && t > at.snap - 0.2 ? 1 : 0;
    drawAtom(c, X(x), Y(y), z * sc * (1 + 0.06 * snapF) * (1 + 0.04 * lift), r, a, at, { flash: Math.max(flash, snapF), label: i === 1 && !ghost ? la(t, 'claim') : 0, labelText: 'claim' });
  });
}

// ---------- frame ----------
function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
  S.ground(c, t, cm, { tint: PINK });
  const W0 = wpos(t);

  // ---------- the line ----------
  const lineA = ramp(t, 3.0, 3.4) * (1 - ramp(t, 18.4, 19.2, Rs));
  if (lineA > 0) { const tip = lerp(-1400, 1100, ramp(t, 3.0, 4.6, EASE.warm)); c.strokeStyle = rgba(INK, 0.85 * lineA); c.lineWidth = 4.4 * z; c.lineCap = 'round';
    c.beginPath(); c.moveTo(X(-1400), Y(LINE_Y)); c.lineTo(X(tip), Y(LINE_Y)); c.stroke();
    c.strokeStyle = rgba(INK, 0.35 * lineA); c.lineWidth = 2.4 * z; c.beginPath(); for (let x = -1380; x < tip; x += 60) { c.moveTo(X(x), Y(LINE_Y)); c.lineTo(X(x), Y(LINE_Y + 10)); } c.stroke(); }

  // ---------- the tree's ghost under the closing captions: every seam still carries its receipt ----------
  const gh = ramp(t, GHOST[0], GHOST[1], Rs);
  if (gh > 0) drawTree(c, X, Y, z, F0 - 0.02, W0, 0.3 * gh, true);

  // ---------- parallel hulls ----------
  const hull = win(t, b(24) + 0.1, b(28) + 0.2, 0.35, 0.4);
  if (hull > 0) { c.save(); c.strokeStyle = rgba(ACC, 0.6 * hull); c.lineWidth = 4 * z; c.setLineDash([10 * z, 9 * z]);
    for (const [x0, x1] of [[-705, -225], [225, 705]]) { rr(c, X(x0), Y(-150), (x1 - x0) * z, 320 * z, 22 * z); c.stroke(); }
    c.restore();
    c.save(); c.strokeStyle = rgba(ACC, 0.8 * hull); c.lineWidth = 4.4 * z; c.beginPath(); for (const dx of [-210, 210]) for (const o of [-8, 8]) { c.moveTo(X(dx + o), Y(-140)); c.lineTo(X(dx + o), Y(-70)); } c.stroke(); c.restore(); }

  if (t < CARD_T + 0.1) drawTree(c, X, Y, z, t, W0, 1, false);
  // the refusal chip, above-right of the seam
  const rf = la(t, 'refused'); if (rf > 0) S.chip(c, 'refused · claim ≠ evidence', X(125), Y(-55), { f: 'mono', size: 24, col: REFINK, a: rf, pad: 14, track: 0.12 });

  // ---------- the brief card ----------
  const cardIn = ramp(t, CARD_T - 0.05, CARD_FULL, EASE.glaser);
  if (cardIn > 0 && t < GO[1] + 0.2) {
    const grab = ramp(t, GRAB, GRAB + 0.3, EASE.glaser);
    const cx0 = lerp(ROOT.x, 0, cardIn), cy0 = lerp(ROOT.y, -60, cardIn), w0 = lerp(170, 460, cardIn), h0 = lerp(64, 280, cardIn);
    const pod = podAt(t), cx = lerp(cx0, pod.x, grab), cy = lerp(cy0, pod.y + 64, grab), s = lerp(1, 0.28, grab), sx = X(cx), sy = Y(cy);
    c.save(); c.translate(sx, sy); c.scale(z * s, z * s); c.translate(-sx, -sy);
    const L = sx - w0 / 2, T = sy - h0 / 2;
    TYPE.forEach((col, k) => { rr(c, L + 26 + k * 56, T - 18, 48, 24, 6); c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = 4; c.stroke(); });
    rr(c, L, T, w0, h0, 14); c.fillStyle = CARD; c.fill(); c.strokeStyle = INK; c.lineWidth = 4.4; c.stroke();
    const inA = ramp(t, CARD_FULL - 0.15, CARD_FULL + 0.2);
    if (inA > 0) { c.save(); c.globalAlpha *= inA;
      [0, 2, 1, 1, 2, 0, 1].forEach((ty, k) => { const ry = T + 72 + k * 22; c.fillStyle = TYPE[ty]; rr(c, L + 26, ry - 7, 14, 14, 3); c.fill(); c.strokeStyle = TYPE_EDGE[ty]; c.lineWidth = 1.5; c.stroke();
        c.strokeStyle = LINES; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(L + 54, ry); c.lineTo(L + 54 + (150 + ((k * 71) % 9) * 22), ry); c.stroke(); });
      c.strokeStyle = rgba(INK, 0.3); c.lineWidth = 1.2; c.beginPath(); c.moveTo(L + 22, T + h0 - 58); c.lineTo(L + w0 - 22, T + h0 - 58); c.stroke(); c.restore(); }
    text(c, 'BRIEF · LITTLE WHALE FILM', L + 26, T + 42, { f: 'mono', size: 15, col: SOFT, a: la(t, 'cardhead') });
    text(c, 'Context Atoms · 41 atoms · GREEN', L + 26, T + h0 - 24, { f: 'mono', size: 15, col: INK, a: la(t, 'cardfoot'), track: 0.16 });
    const st = ramp(t, SEAL - 0.08, SEAL + 0.5, EASE.rest);
    if (st > 0) { c.save(); c.globalAlpha *= clamp(st * 3); seamDot(c, L + w0 - 44, T + 44, 2.4 * lerp(1.25, 1, EASE.glaser(clamp(st * 2))), { fill: 1, tick: st, refuse: 0 }); c.restore(); }
    c.restore();
  }
  { const p = podAt(t); if (p.a > 0) { const flip = Math.cos(p.ang) < 0; c.save(); c.translate(X(p.x), Y(p.y)); let ang = p.ang; if (flip) { c.scale(-1, 1); ang = Math.PI - p.ang; }
      KH.drawPod(c, 0, 0, ang, 100 * z, PINK, { alpha: p.a, ink: INK, glow: win(t, SEAL, SEAL + 1.2, 0.2, 0.6) * 0.7 }); c.restore(); } }

  // ---------- the whale ----------
  { const f = facing(t), ang = heading(t), v = wvel(t), still = Math.hypot(v.x, v.y) < 80;
    let blink = 0; for (const bt of [6.6, REFUSE + 0.12, 13.9, 17.9, 23.4]) blink = Math.max(blink, 1 - Math.abs(t - bt) / 0.08);
    let sq = 0; for (const ft of FLICK) sq += 0.09 * win(t, ft - 0.06, ft + 0.3, 0.06, 0.22);
    sq -= 0.08 * win(t, REFUSE + 0.05, REFUSE + 0.45, 0.06, 0.3); sq += 0.1 * win(t, b(21.5) - 0.02, b(21.5) + 0.3, 0.04, 0.24);   // recoil at the refusal, a happy squash on the evidence snap
    const surprise = win(t, REFUSE + 0.02, REFUSE + 0.6, 0.05, 0.2);
    const focus = win(t, 6.8, 15.0, 0.3, 0.3) * (1 - surprise), spark = win(t, SEAL, SEAL + 1.2, 0.1, 0.45);
    const delight = t > SEAL + 0.3 ? 1 : 0, flickT = FLICK.reduce((m, ft) => Math.max(m, win(t, ft - 0.08, ft + 0.25, 0.06, 0.2)), 0);
    c.save(); c.translate(X(W0.x), Y(W0.y)); if (f < 0) c.scale(-1, 1);
    KH.drawWhale(c, { x: 0, y: 0, ang: f < 0 ? -ang : ang, scale: 0.55 * Math.max(z, 0.85), L: 1, tail: Math.sin(t * (still ? 3 : 11)) * (still ? 0.12 : 0.34) + flickT * 0.45,
      fin: Math.sin(t * (still ? 3 : 11) + 1.3) * 0.3 - flickT * 0.4, blink, focus, spark, sparkColor: mix(PINK, INK, 0.2), sparkScale: 1.3, eye: surprise > 0.2 ? 1.3 : 1,
      delight, blush: 0.6, mouth: delight ? 0.4 : 0, squash: sq, spray: win(t, 19.95, 20.9, 0.12, 0.4), sprayColor: mix(PINK, INK, 0.25) });
    c.restore(); }

  // ---------- text ----------
  S.open(c, t, EP, { out: 2.5 });
  const railA = la(t, 'rail');
  if (railA > 0) { const words = STA.map(s => s.word), sz = 20, gap = 22;
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

// pod: in from the right, hovers over the card, takes it, leaves top right just before the "not this" caption
function podAt(t) { const go = ramp(t, GO[0], GO[1], EASE.collect);
  if (t < SEAL - 0.05 || t > GO[1] + 0.15) return { a: 0, x: 0, y: 0, ang: 0 };
  const u = ramp(t, SEAL, ARR, EASE.glaser), hx = 40, hy = -330 + Math.sin(t * 3) * 6 * ramp(t, ARR - 0.2, ARR + 0.3);
  const x = lerp(lerp(1250, hx, u), 1550, go), y = lerp(lerp(-560, hy, u), -800, go);
  const ang = go > 0.02 ? Math.atan2(-470, 1510) : lerp(Math.atan2(230, -1210), Math.PI, u);
  return { a: ramp(t, SEAL - 0.05, SEAL + 0.15), x, y, ang }; }

function cues() { return { bpm: BPM, dur: DUR, title: 0.25, heap: 2.3, through: 3.3, line: 3.0, drops: ATOMS.map(a => a.drop + 0.45).sort((p, q) => p - q), tree: TREE_ON, notches: NOTCH_T,
  flicks: FLICK, snaps: [...new Set(ATOMS.map(a => a.snap))].sort((p, q) => p - q), snapTypes: ATOMS.map(a => [a.snap, a.ty, SOCK[SK[a.sock]].x]), refuse: REFUSE, pairs: [b(25.5), b(26.5)], pulses: [PULSE.C[1], PULSE.L[1]],
  ticks: [...new Set(Object.values(LEAF_TICK))].sort((p, q) => p - q), innerTick: INNER_TICK, rootTick: ROOT_TICK, fold: F0, card: CARD_T, seal: SEAL, podArrive: ARR, grab: GRAB, leave: GO[0],
  ghost: GHOST[0], spout: 19.95, notThis: R('not').in, end: R('end').in, lockup: LOCK }; }
const CONTRAST = [['title', INK, BG], ['title accent', ACC, BG], ['eyebrow', SOFT, BG], ['rail active on chip', INK, C.paper], ['rail past on chip', SOFT, C.paper], ['rail future on chip', FUT, C.paper], ['station gloss on chip', INK, C.paper],
  ['caption on chip', INK, C.paper], ['caption accent on chip', ACC, C.paper], ['claim label on atom', INK, ATOM], ['evidence label in socket', SOFT, mix(BG, C.paper, 0.6)], ['evidence label on ground', SOFT, BG],
  ['refused chip', REFINK, C.paper], ['brief label on root', INK, ATOM], ['card header', SOFT, CARD], ['card number line', INK, CARD], ['lockup', SOFT, BG]];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, DUR, W, H, fps: 60, wpos, heading, cam, shutter: t => (t > GO[0] && t < GO[1] + 0.2) || (t > 4.1 && t < 6.0) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
