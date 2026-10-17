// CETI Capabilities · 01 · stitch60 — "Give every note a label." LONGFORM-60 (one minute, problem first). KH 1.0.0 + series layer.
// FELT: the whale pastes a draft and a decision into one huge card; a pod quotes the draft (✕), twice.
// WHY: the heap spills along the line; every note looks the same; look-alike pairs keep arriving and the pod keeps grabbing the draft.
// MOVE: tabs colour in (draft · decided · rule); a socketed brief hangs over the line; decided snaps, a draft is refused at the joint,
//       rule snaps, receipts climb; the name "atoms" arrives last. CASE: three real prompts (41 · 26 · 41 atoms) with a shared core.
// LIMIT: a wrong date tabbed "decided" fits and gets its receipt. PAYOFF (draft-stays-out): the FELT framing, now with a small brief:
//       the decision snaps in, the draft bounces off and floats aside, the pod answers ✓. drawFrame(ctx, t) is a pure function of t.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, win, EASE, ramp, mix, rgba, text } = KH;
const W = 1920, H = 1080, BPM = 128, B = 60 / BPM, BAR = 4 * B, b = n => n * B, bar = k => (k - 1) * BAR, DUR = 60.3;

// ---------- palette (Wada 166 + CETI; rust is the one alarm) ----------
const PINK = WD.grenadinePink, YEL = WD.naplesYellow, GRN = WD.deepSlateGreen;
const INK = C.navy, SOFT = C.slate, BG = mix(C.paper, PINK, 0.06), ATOM = mix(C.paper, KH.NEUTRALS.white, 0.5), CARD = mix(C.paper, KH.NEUTRALS.white, 0.6);
const ACC = mix(PINK, INK, 0.66), REF = C.rust, LINES = mix(C.paper, C.slate, 0.5), DASH = mix(C.paper, C.slate, 0.62), GREYTAB = mix(C.paper, C.slate, 0.38);
const TYPE = [YEL, GRN, PINK], TYPE_EDGE = [mix(YEL, INK, 0.45), INK, mix(PINK, INK, 0.35)], TABX = [-36, 0, 36];   // draft · decided · rule
const POD = mix(C.mist, C.paper, 0.25), OKC = GRN;
const G = EASE.glaser, Wm = EASE.warm, Rs = EASE.rest, Co = EASE.collect;

// ---------- acts on the 32-bar grid ----------
const ACTS = { felt: { in: 0, out: bar(6) }, why: { in: bar(6), out: bar(11) }, move: { in: bar(11), out: bar(17) }, case: { in: bar(17), out: bar(23) },
  limit: { in: bar(23), out: bar(26) }, payoff: { in: bar(26), out: bar(30) }, belief: { in: bar(30), out: bar(32) }, lockup: { in: bar(32), out: DUR } };

// ---------- world layout ----------
const LINE_Y = 200, LC_Y = 160, LC_S = 1, SX = i => (i - 7.5) * 124;
const BIG = { x: 40, y: 30, w: 250, h: 330 }, ANS = { x: 380, y: 40, w: 210, h: 130 }, PODP = { x: 380, y: -175 }, TALLY = { x: 380, y: -272 };
const ROOT = { x: 0, y: -330 }, SY = -90, SOCK = [{ x: -300, ty: 2 }, { x: 0, ty: 1 }, { x: 300, ty: 1 }];
const BR = { x: 40, y: 75, w: 220, h: 240 }, BSOCK = { x: 40, y: 112, s: 0.86 };
const LSOCK = { x: 0, y: -60 };

// ---------- timeline ----------
const FLICK_A = b(1), LAND_A = b(2), FLICK_B = b(2), LAND_B = b(3), POD_ARR = b(4), ANS1 = b(6), X1 = b(7);
const FLICK_C = b(12), LAND_C = b(13), ANS2 = b(14), X2 = b(14.5), STARE = bar(5);
const TITLE_IN = b(21), TITLE_OUT = b(26), SPILL = b(26), PAIRS = [b(29), b(31), b(32), b(32.5)], PAIR_SLOTS = [[7, 8], [10, 11], [2, 3], [12, 13]], FREEZE = bar(10);
const TAB_T = [bar(11), bar(11) + B, bar(11) + 2 * B], TREE_ON = bar(12), NOTCH = [b(44.5), b(45), b(45.5)];
const SNAP_D = bar(13), TICK_D = b(49), NUDGE = b(52.5), REFUSE = b(53), SNAP_R = bar(15), SNAP_F = b(57), TICKS = b(58), ROOT_TICK = b(59), SETTLE = bar(16);
const CASE0 = bar(17), BLOCK_T = [bar(17) + B, bar(17), bar(17) + 2 * B], CARD_T = b(67), SPINE = bar(19), REVIEW = bar(20), CASE_OUT = 40.55;
const L_SNAP = b(89), L_TICK = b(90), NOT_T = bar(25);
const PAY0 = bar(26), P_FLICK1 = b(101), P_SNAP = b(102), P_TICK = b(103), P_FLICK2 = b(103), P_BUMP = b(104), POD2_ARR = b(106), P_ANS = bar(28), P_OK = b(109), P_SPARK = b(110), P_LEAVE = bar(29);
const SPOUT = b(116.5), LOCK = bar(32);

// ---------- helpers ----------
function keyed(K, t) { if (t <= K[0][0]) return K[0].slice(1, 5); for (let k = 1; k < K.length; k++) { if (t <= K[k][0]) { const p = K[k - 1], q = K[k], e = q[5] || Wm, u = q[0] === p[0] ? 1 : e(clamp((t - p[0]) / (q[0] - p[0])));
    return [lerp(p[1], q[1], u), lerp(p[2], q[2], u), lerp(p[3], q[3], u), lerp(p[4], q[4], u)]; } } return K[K.length - 1].slice(1, 5); }
function hermite(P, t) { const n = P.length; if (t <= P[0].t) return P[0].v; if (t >= P[n - 1].t) return P[n - 1].v;
  let i = 0; while (P[i + 1].t < t) i++; const p1 = P[i], p2 = P[i + 1], h = p2.t - p1.t, u = (t - p1.t) / h;
  const tan = k => { const a = P[Math.max(0, k - 1)], c = P[Math.min(n - 1, k + 1)]; return P[k].hold ? P[k].v.map(() => 0) : P[k].v.map((_, j) => (c.v[j] - a.v[j]) / (c.t - a.t)); };
  const m1 = tan(i), m2 = tan(i + 1), u2 = u * u, u3 = u2 * u, A = 2 * u3 - 3 * u2 + 1, Bh = u3 - 2 * u2 + u, Cc = -2 * u3 + 3 * u2, D = u3 - u2;
  return p1.v.map((v, j) => A * v + Bh * h * m1[j] + Cc * p2.v[j] + D * h * m2[j]); }
const mk = arr => arr.map(([t, ...v]) => { const hold = v[v.length - 1] === 'h'; if (hold) v.pop(); return { t, v, hold }; });
const R0 = KH.rng(1660), ROWW = Array.from({ length: 40 }, () => 0.45 + 0.5 * R0());

// ---------- whale ----------
const WK = mk([[0, -330, -40, 'h'], [7.5, -330, -40, 'h'], [8.15, -285, -72, 'h'], [10.4, -285, -72, 'h'], [11.95, -480, -250, 'h'],
  [22.0, -480, -250, 'h'], [22.9, -250, -425], [23.5, 300, -420], [23.95, 580, -120], [24.35, 440, 40, 'h'], [NUDGE - 0.06, 440, 40, 'h'], [NUDGE + 0.1, 402, 40], [REFUSE, 410, 40],
  [25.15, 475, 46, 'h'], [25.6, 475, 46, 'h'], [26.6, 450, -330, 'h'], [30.2, 450, -330, 'h'], [31.0, 300, -500, 'h'], [39.7, 300, -500, 'h'], [40.45, -150, -300], [41.0, -560, -60, 'h'],
  [41.25, -560, -60, 'h'], [L_SNAP, -150, -60, 'h'], [45.9, -150, -60, 'h'], [46.7, -330, -40, 'h'], [DUR, -330, -40, 'h']]);
const base = t => { const v = hermite(WK, t); return { x: v[0], y: v[1] }; };
const bvel = t => { const a = base(t - 1 / 240), c = base(t + 1 / 240); return { x: (c.x - a.x) * 120, y: (c.y - a.y) * 120 }; };
const wpos = t => { const p = base(t), v = bvel(t), still = clamp(1 - Math.hypot(v.x, v.y) / 260); return { x: p.x, y: p.y + Math.sin(t * 2.4) * 5 * still }; };
const wvel = t => { const a = wpos(t - 1 / 240), c = wpos(t + 1 / 240); return { x: (c.x - a.x) * 120, y: (c.y - a.y) * 120 }; };
function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
    a += (sp < 40 ? 0 : clamp(Math.atan2(v.y, Math.abs(v.x)), -0.9, 0.9) * clamp(sp / 320)) * w; s += w; } return a / s; }
const LEFT = [[10.45, 11.95], [23.95, 41.1], [45.85, 46.75]];
const facing = t => LEFT.some(([a, c]) => t > a && t < c) ? -1 : 1;

// ---------- camera ----------
const CK = mk([[0, 0, 10, 1.6], [3.0, 40, 10, 1.6], [9.375, 40, 10, 1.6, 'h'], [SPILL, 40, 10, 1.6, 'h'], [13.6, 0, 0, 1.2, 'h'], [18.5, 0, 0, 1.2, 'h'], [20.3, 0, -60, 1.3, 'h'],
  [24.0, 0, -60, 1.3, 'h'], [24.7, 240, -40, 1.6, 'h'], [25.85, 240, -40, 1.6, 'h'], [26.9, 0, -60, 1.3, 'h'], [CASE0, 0, -60, 1.3, 'h'], [30.9, 0, -100, 1.05, 'h'],
  [40.3, 30, -100, 1.05, 'h'], [41.1, 0, -70, 1.3, 'h'], [43.125, 0, -70, 1.3, 'h'], [44.7, 0, -60, 1.72, 'h'], [45.9, 0, -60, 1.72, 'h'], [46.75, 40, 10, 1.6, 'h'], [DUR, 40, 10, 1.6, 'h']]);
function cam(t) { const v = hermite(CK, t); return { x: v[0], y: v[1], z: v[2], ax: 960, ay: 540 }; }

// ---------- READ (kind + size for the LONGFORM gates) ----------
const EP = { no: '01', short: 'Stitch', title: 'Give every note a <i>label</i>.', accent: ACC };
const SRC = 'https://app.notion.com/p/3fbd50cfaf9381048ffaecd94c9f8264';
const CAPS = [
  { id: 'felt1', in: ANS1, out: 5.45, fi: 0.3, fo: 0.3, text: 'It quoted our old draft as final.' },
  { id: 'felt2', in: X2, out: 9.2, fi: 0.3, fo: 0.3, text: 'Same answer, same mistake, again.' },
  { id: 'why', in: bar(8), out: 16.5, fi: 0.3, fo: 0.3, text: 'Each note shows up looking the same.' },
  { id: 'hint', in: FREEZE, out: 19.2, fi: 0.3, fo: 0.25, text: 'Label each note by what it is.' },
  { id: 'move1', in: TREE_ON, out: 23.9, fi: 0.3, fo: 0.3, text: 'Label it: draft, decided, or rule.' },
  { id: 'move2', in: bar(14), out: 27.85, fi: 0.25, fo: 0.3, text: 'A draft cannot fill a decision slot.' },
  { id: 'move3', in: SETTLE, out: 31.3, fi: 0.3, fo: 0.3, text: 'Labelled cards that fit slots: atoms.', html: 'Labelled cards that fit slots: <i>atoms</i>.' },
  { id: 'case1', in: bar(18), out: 35.25, fi: 0.3, fo: 0.3, text: 'Three real prompts, built this way.' },
  { id: 'case2', in: REVIEW, out: 39.9, fi: 0.3, fo: 0.3, text: 'The shared ones get a human check next.' },
  { id: 'limit1', in: bar(23), out: 44.7, fi: 0.3, fo: 0.3, text: 'A wrong date marked decided still fits.' },
  { id: 'not', in: NOT_T, out: 47.15, fi: 0.3, fo: 0.3, text: 'Labels catch mix-ups, not wrong facts.' },
  { id: 'end', in: bar(30), out: 58.0, fi: 0.35, fo: 0.3, text: 'Say what each piece is before you send.' },
].map(r => ({ ...r, kind: 'caption', size: 38 }));
const LAB = [
  { id: 'l-draft', in: TAB_T[0] + 0.05, out: 19.95, fi: 0.12, fo: 0.15, text: 'draft' },
  { id: 'l-decided', in: TAB_T[1] + 0.05, out: 20.42, fi: 0.12, fo: 0.15, text: 'decided' },
  { id: 'l-rule', in: TAB_T[2] + 0.05, out: 20.77, fi: 0.12, fo: 0.15, text: 'rule' },
  { id: 'brief', in: b(45), out: 29.9, fi: 0.3, fo: 0.3, text: 'brief' },
  { id: 'brief3', in: 41.0, out: 46.2, fi: 0.3, fo: 0.3, text: 'brief' },
  { id: 'brief2', in: PAY0 - 0.35, out: DUR, fi: 0.35, fo: 0, text: 'brief' },
].map(r => ({ ...r, kind: 'label', size: 24 }));
const CARDR = { id: 'card', in: CARD_T, out: CASE_OUT, fi: 0.4, fo: 0.35, kind: 'card', size: 46, src: SRC,
  text: 'Real run · Context Atoms · 16 Oct 2026 · 3 prompts · 41, 26 and 41 atoms · Engine check: GREEN · 9 shared, still draft' };
const READ = [
  { id: 'eyebrow', in: TITLE_IN, out: TITLE_OUT, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 01', kind: 'title', size: 15 },
  { id: 'title', in: TITLE_IN, out: TITLE_OUT, fi: 0.4, fo: 0.45, text: 'Give every note a label.', kind: 'title', size: 92 },
  ...CAPS, ...LAB, CARDR,
  { id: 'lockup', in: LOCK, out: DUR, fi: 0.45, fo: 0, text: 'CETI · Capabilities · 01 · Stitch', kind: 'title', size: 15 },
];
const RD = id => READ.find(r => r.id === id), la = (t, id) => { const r = RD(id); return win(t, r.in, r.out, r.fi, r.fo); };
const TERMS = [{ term: 'atoms', symbol: 'atom (card with a coloured tab)', pictured_at: TAB_T[0], named_at: SETTLE }];
const JARGON = ['atom', 'atoms', 'typed', 'seam', 'seams', 'socket', 'slot', 'brief', 'composed', 'context', 'operad', 'spine', 'certificate', 'receipt'];

// ---------- line cards (16 slots) ----------
const TY = [1, 2, 0, 1, 0, 2, 1, 0, 1, 2, 0, 1, 0, 1, 0, 1];   // pairs (2,3) (7,8) (10,11) (12,13) are draft+decided look-alikes
const SPILLED = [0, 1, 4, 5, 6, 9, 14, 15], EX = { 10: 'X', 8: 'D', 5: 'R', 11: 'F' };
const LINESW = TY.map((_, i) => [0.5 + 0.35 * ((i * 37) % 10) / 10, 0.35 + 0.4 * ((i * 53) % 10) / 10]);
const EXK = {   // [t, x, y, s, rot, ease]
  X: [[TAB_T[0], SX(10), LC_Y, LC_S, 0], [TAB_T[0] + 0.3, 300, 40, 1, 0, G], [NUDGE, 300, 40, 1, 0], [REFUSE, 300, -50, 1, 0, G], [REFUSE + 0.3, 300, -50, 1, 0], [25.7, SX(10), LC_Y, LC_S, 0, Co]],
  D: [[TAB_T[1], SX(8), LC_Y, LC_S, 0], [TAB_T[1] + 0.3, 0, 40, 1, 0, G], [SNAP_D - 0.47, 0, 40, 1, 0], [SNAP_D, 0, SY, 1, 0, G]],
  R: [[TAB_T[2], SX(5), LC_Y, LC_S, 0], [TAB_T[2] + 0.3, -300, 40, 1, 0, G], [SNAP_R - 0.47, -300, 40, 1, 0], [SNAP_R, -300, SY, 1, 0, G]],
  F: [[SNAP_F - 0.47, SX(11), LC_Y, LC_S, 0], [SNAP_F, 300, SY, 1, 0, G]],
};
const EXSTART = { X: TAB_T[0], D: TAB_T[1], R: TAB_T[2], F: SNAP_F - 0.47 };
function lineCard(i, t) {
  let x = SX(i), y = LC_Y, s = LC_S, r = 0, a = 0;
  const si = SPILLED.indexOf(i);
  if (si >= 0) { const t0 = SPILL + si * 0.07, u = ramp(t, t0, t0 + 0.85, Wm); if (t < t0) return null;
    x = lerp(BIG.x, SX(i), u); y = lerp(BIG.y - 40, LC_Y, u) - Math.sin(u * Math.PI) * 90; s = lerp(0.45, LC_S, u); r = (1 - u) * (si % 2 ? 0.4 : -0.4); a = ramp(t, t0, t0 + 0.2); }
  else { const pk = PAIR_SLOTS.findIndex(p => p.includes(i)), land = PAIRS[pk]; if (t < land - 0.4) return null;
    const u = ramp(t, land - 0.38, land, Co); y = lerp(-680, LC_Y, u); r = (1 - u) * (i % 2 ? 0.25 : -0.25); a = ramp(t, land - 0.4, land - 0.25); }
  const ex = EX[i]; if (ex && t >= EXSTART[ex]) { const k = keyed(EXK[ex], t); x = k[0]; y = k[1]; s = k[2]; r = k[3]; }
  return { x, y, s, r, a };
}
const tabK = (i, t) => Math.max(0.28 * win(t, FREEZE, CASE0 + 1, 0.5, 0.1), ramp(t, TAB_T[TY[i]], TAB_T[TY[i]] + 0.3, Rs));

// ---------- drawing helpers ----------
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function drawCard(c, X, Y, s, rot, a, o) {   // o: ty, tab 0..1, lines, label, labelA, flash, smudge, dashed
  if (a <= 0.003) return; c.save(); c.globalAlpha *= a; c.translate(X, Y); c.rotate(rot); c.scale(s, s);
  const tx = o.ty == null ? 0 : TABX[o.ty], tcol = o.ty == null ? GREYTAB : mix(GREYTAB, TYPE[o.ty], o.tab || 0); c.lineJoin = 'round';
  rr(c, tx - 23, -60, 46, 26, 6); c.fillStyle = tcol; c.fill(); c.strokeStyle = INK; c.lineWidth = 4.2; c.stroke();
  rr(c, -62, -38, 124, 76, 10); c.fillStyle = ATOM; c.fill(); c.stroke();
  c.fillStyle = tcol; c.fillRect(tx - 21, -39.5, 42, 5);
  const lb = o.labelA || 0;
  if (lb < 1) { c.save(); c.globalAlpha *= 1 - lb; c.strokeStyle = LINES; c.lineWidth = 6; c.lineCap = 'round';
    o.lines.forEach((w, k) => { c.beginPath(); c.moveTo(-44, -8 + k * 20); c.lineTo(-44 + 88 * w, -8 + k * 20); c.stroke(); });
    if (o.smudge > 0) { c.globalAlpha *= o.smudge; c.strokeStyle = REF; c.lineWidth = 5; c.beginPath(); c.moveTo(-46, -6);
      for (let k = 0; k <= 12; k++) c.lineTo(-46 + k * 7.5, -8 + (k % 2 ? -7 : 7) * (0.6 + 0.4 * Math.sin(k * 1.7))); c.stroke();
      c.fillStyle = rgba(REF, 0.35); c.beginPath(); c.ellipse(-4, -8, 50, 11, -0.05, 0, Math.PI * 2); c.fill(); }
    c.restore(); }
  if ((o.flash || 0) > 0) { c.save(); c.globalAlpha *= o.flash; c.strokeStyle = o.ty == null ? INK : TYPE_EDGE[o.ty]; c.lineWidth = 4.5; rr(c, -72, -48, 144, 96, 14); c.stroke(); c.restore(); }
  c.restore();
  if (lb > 0) text(c, o.label, X, Y + 8 * s * o.z, { f: 'mono', size: Math.max(24, Math.round(20 * s * o.z)), col: INK, a: a * lb, align: 'center', track: 0.04 });
}
function drawSocket(c, X, Y, s, ty, o) {
  c.save(); c.globalAlpha *= o.a; c.translate(X, Y); c.scale(s, s); const tx = TABX[ty], nk = o.notch;
  c.lineWidth = 4; c.setLineDash([10, 8]); c.strokeStyle = o.refuse > 0 ? mix(DASH, REF, o.refuse) : o.glow > 0 ? mix(DASH, OKC, o.glow) : DASH;
  if (o.glow > 0) c.lineWidth = 4 + 2 * o.glow;
  rr(c, -68, -45, 136, 90, 12); c.fillStyle = rgba(C.paper, 0.6); c.fill(); c.stroke();
  c.setLineDash([]);
  rr(c, tx - 26, -69, 52, 26, 7); c.fillStyle = nk > 0 ? mix(BG, TYPE[ty], 0.3 + 0.6 * nk) : rgba(C.paper, 0); c.fill();
  c.strokeStyle = nk > 0 ? mix(DASH, TYPE_EDGE[ty], nk) : DASH; c.lineWidth = 4; c.stroke();
  c.restore(); }
function seamDot(c, X, Y, z, st) {
  const r = 9 * z; c.save();
  if (st.tick > 0) { const sc = lerp(1.5, 1, EASE.glaser(clamp(st.tick * 1.6))), R2 = 20 * z * sc;
    c.fillStyle = C.paper; c.beginPath(); c.arc(X, Y, R2, 0, Math.PI * 2); c.fill(); c.strokeStyle = GRN; c.lineWidth = 4 * z; c.stroke();
    tickMark(c, X, Y, z, clamp(st.tick * 1.3), INK);
    if (st.tick < 0.7) { c.strokeStyle = rgba(GRN, 0.6 * (1 - st.tick / 0.7)); c.lineWidth = 3 * z; c.beginPath(); c.arc(X, Y, R2 + 22 * z * st.tick, 0, Math.PI * 2); c.stroke(); }
    c.restore(); return; }
  c.fillStyle = st.fill > 0 ? mix(C.paper, INK, st.fill) : C.paper; c.strokeStyle = st.refuse > 0 ? mix(SOFT, REF, st.refuse) : SOFT; c.lineWidth = 3 * z;
  c.beginPath(); c.arc(X, Y, r, 0, Math.PI * 2); c.fill(); c.stroke();
  if (st.refuse > 0) crossMark(c, X, Y, 17 * z, 5 * z, st.refuse);
  c.restore(); }
function tickMark(c, X, Y, z, d, col) { c.save(); c.strokeStyle = col; c.lineWidth = 4.2 * z; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
  const p0 = [X - 9 * z, Y + 1 * z], p1 = [X - 2.5 * z, Y + 7.5 * z], p2 = [X + 10 * z, Y - 7.5 * z];
  c.moveTo(...p0); if (d < 0.4) c.lineTo(lerp(p0[0], p1[0], d / 0.4), lerp(p0[1], p1[1], d / 0.4)); else { c.lineTo(...p1); c.lineTo(lerp(p1[0], p2[0], (d - 0.4) / 0.6), lerp(p1[1], p2[1], (d - 0.4) / 0.6)); } c.stroke(); c.restore(); }
function crossMark(c, X, Y, e, lw, a) { c.save(); c.globalAlpha *= a; c.strokeStyle = REF; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.moveTo(X - e, Y - e); c.lineTo(X + e, Y + e); c.moveTo(X + e, Y - e); c.lineTo(X - e, Y + e); c.stroke(); c.restore(); }
function elbow(c, X, Y, x0, y0, x1, y1) { const m = (y0 + y1) / 2; c.beginPath(); c.moveTo(X(x0), Y(y0)); c.lineTo(X(x0), Y(m)); c.lineTo(X(x1), Y(m)); c.lineTo(X(x1), Y(y1)); c.stroke(); }
function rowsCard(c, X, Y, z, rect, a, rows, hl) {   // a big paper card full of grey rows; hl: row → [alpha, colour]
  if (a <= 0.003) return; const L = X(rect.x - rect.w / 2), T = Y(rect.y - rect.h / 2);
  c.save(); c.globalAlpha *= a; rr(c, L, T, rect.w * z, rect.h * z, 12 * z); c.fillStyle = CARD; c.fill(); c.strokeStyle = INK; c.lineWidth = 4.4 * z; c.stroke();
  c.lineCap = 'round';
  for (let k = 0; k < rows; k++) { const ry = T + (34 + k * 27) * z, w = (rect.w - 60) * ROWW[k]; const h = hl && hl[k];
    c.strokeStyle = h ? mix(LINES, h[1], h[0]) : LINES; c.lineWidth = 6 * z; c.beginPath(); c.moveTo(L + 26 * z, ry); c.lineTo(L + (26 + w) * z, ry); c.stroke(); }
  c.restore(); }
const rowY = (rect, k) => rect.y - rect.h / 2 + 34 + k * 27;
function tally(c, X, Y, z, n, ok, a) {   // a paper chip with ✕ marks (or one ✓)
  if (a <= 0.003) return; const m = ok ? 1 : Math.max(1, Math.ceil(n)), w = (36 * m + 24) * z, h = 50 * z;
  c.save(); c.globalAlpha *= a; rr(c, X - w / 2, Y - h / 2, w, h, 10 * z); c.fillStyle = C.paper; c.fill(); c.strokeStyle = rgba(INK, 0.35); c.lineWidth = 2 * z; c.stroke(); c.restore();
  if (ok) { c.save(); c.globalAlpha *= a; tickMark(c, X, Y, z * 1.25, clamp(ok), OKC); c.restore(); return; }
  for (let k = 0; k < m; k++) { const f = clamp(n - k); if (f <= 0) continue; const cx = X - w / 2 + (12 + 18 + 36 * k) * z, sc = lerp(1.6, 1, EASE.glaser(f));
    c.save(); c.globalAlpha *= a; crossMark(c, cx, Y, 11 * z * sc, 4.5 * z, clamp(f * 3)); c.restore(); } }
function answer(c, X, Y, z, a, circ, col, link) {   // the pod's answer card: three rows, one circled, a thread to its source
  if (a <= 0.003) return; const rect = ANS; rowsCard(c, X, Y, z, { ...rect, h: rect.h }, a, 3, null);
  if (circ > 0) { const ry = rowY(rect, 1), cx = rect.x - rect.w / 2 + 26 + (rect.w - 60) * ROWW[1] / 2;
    c.save(); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = 4.5 * z; c.beginPath();
    const ex = (rect.w - 60) * ROWW[1] / 2 + 20, n = Math.round(48 * clamp(circ * 1.4)); c.lineCap = 'round';
    for (let k = 0; k <= n; k++) { const th = -Math.PI * 0.9 + k / 48 * Math.PI * 2.1, px = X(cx + Math.cos(th) * ex), py = Y(ry + Math.sin(th) * 19); k ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
    if (link && circ > 0.4) { const u = clamp((circ - 0.4) / 0.6), x0 = rect.x - rect.w / 2, x1 = link.x, y1 = link.y;
      c.setLineDash([9 * z, 8 * z]); c.lineWidth = 3.2 * z; c.beginPath(); c.moveTo(X(x0), Y(ry));
      const mx = lerp(x0, x1, 0.5), my = Math.min(ry, y1) - 70; const steps = 24;
      for (let k = 1; k <= steps * u; k++) { const s = k / steps, ix = (1 - s) * (1 - s) * x0 + 2 * (1 - s) * s * mx + s * s * x1, iy = (1 - s) * (1 - s) * ry + 2 * (1 - s) * s * my + s * s * y1; c.lineTo(X(ix), Y(iy)); }
      c.stroke(); c.setLineDash([]); if (u > 0.95) { c.fillStyle = col; c.beginPath(); c.arc(X(x1), Y(y1), 7 * z, 0, Math.PI * 2); c.fill(); } }
    c.restore(); } }
function pod(c, X, Y, z, p, glow) { if (p.a <= 0) return; const flip = Math.cos(p.ang) < 0; c.save(); c.translate(X(p.x), Y(p.y)); let ang = p.ang; if (flip) { c.scale(-1, 1); ang = Math.PI - p.ang; }
  KH.drawPod(c, 0, 0, ang, 92 * z, POD, { alpha: p.a, ink: INK, glow }); c.restore(); }

// ---------- pod paths ----------
function podFelt(t) {   // FELT (and the WHY wide shot): in from the right, reads, parks; leaves before the freeze
  if (t < 0.9 || t > 16.7) return { a: 0, x: 0, y: 0, ang: 0 };
  const u = ramp(t, 0.9, POD_ARR, G), w = ramp(t, SPILL, 13.4, Rs), go = ramp(t, 15.75, 16.6, Co);
  let x = lerp(1050, PODP.x, u), y = lerp(-420, PODP.y, u) + Math.sin(t * 2.6) * 5 * u; x = lerp(x, 260, w); y = lerp(y, -235, w); x = lerp(x, 1400, go); y = lerp(y, -800, go);
  const ang = go > 0.02 ? Math.atan2(-460, 760) : lerp(Math.atan2(255, -670), Math.PI, u);
  return { a: ramp(t, 0.9, 1.1), x, y, ang }; }
function podPay(t) {
  if (t < 48.7 || t > P_LEAVE + 1.0) return { a: 0, x: 0, y: 0, ang: 0 };
  const u = ramp(t, 48.75, POD2_ARR, G), go = ramp(t, P_LEAVE, P_LEAVE + 0.9, Co);
  const x = lerp(lerp(1050, PODP.x, u), 1150, go), y = lerp(lerp(-420, PODP.y, u) + Math.sin(t * 2.6) * 5 * u, -720, go);
  const ang = go > 0.02 ? Math.atan2(-545, 770) : lerp(Math.atan2(255, -670), Math.PI, u);
  return { a: ramp(t, 48.7, 48.9), x, y, ang }; }

// ---------- FELT / PAYOFF loose cards (world keys [t, x, y, s, rot]) ----------
const FELTC = [
  { ty: null, k: [[0, -190, -120, 1, -0.06], [FLICK_A, -190, -120, 1, -0.06], [LAND_A, 40, -70, 0.5, 0.2, Wm]], land: LAND_A, appear: 0 },
  { ty: null, k: [[0, -185, -18, 1, 0.05], [FLICK_B, -185, -18, 1, 0.05], [LAND_B, 40, -40, 0.5, -0.2, Wm]], land: LAND_B, appear: 0 },
  { ty: null, k: [[4.2, -190, -460, 1, 0.3], [5.2, -190, -80, 1, -0.04, Rs], [FLICK_C, -190, -80, 1, -0.04], [LAND_C, 40, -100, 0.5, 0.15, Wm]], land: LAND_C, appear: 4.2 },
];
const ARC = 90;
const PAYC = {
  D: [[45.9, -190, -120, 1, -0.06], [P_FLICK1, -190, -120, 1, -0.06], [P_FLICK1 + 0.28, -150, 112, 0.85, 0, Wm], [P_SNAP, BSOCK.x, BSOCK.y, 0.8, 0, G]],
  X: [[45.9, -185, -18, 1, 0.05], [P_FLICK2, -185, -18, 1, 0.05], [P_BUMP, -125, 40, 1, 0.12, G], [P_BUMP + 0.25, -132, 40, 1, 0.06], [49.75, -175, -205, 0.9, -0.12, Wm]],
};

// ---------- CASE blocks ----------
const BLK = [{ x: -600, n: 41 }, { x: 0, n: 26 }, { x: 600, n: 41 }], R1 = KH.rng(41), BTY = Array.from({ length: 41 }, () => Math.floor(R1() * 3));
function drawBlock(c, X, Y, z, bk, t0, t, A) {
  const a = ramp(t, t0, t0 + 0.4) * A; if (a <= 0.003) return; const gx = bk.x - 4 * 44, gy = -380;
  c.save(); c.globalAlpha *= a;
  c.strokeStyle = rgba(INK, 0.7); c.lineWidth = 3.6 * z; c.lineCap = 'round'; c.beginPath(); c.moveTo(X(bk.x), Y(-440)); c.lineTo(X(bk.x), Y(gy - 28)); c.stroke();
  rr(c, X(bk.x) - 60 * z, Y(-484), 120 * z, 44 * z, 8 * z); c.fillStyle = ATOM; c.fill(); c.strokeStyle = INK; c.lineWidth = 3.6 * z; c.stroke();
  const spineOn = ramp(t, SPINE, SPINE + 0.5), beat = Math.floor((t - CARD_T) / B), rows = Math.ceil(bk.n / 9);
  for (let i = 0; i < bk.n; i++) { const col = i % 9, row = Math.floor(i / 9), x = gx + col * 44, y = gy + row * 38, ap = ramp(t, t0 + 0.05 + i * 0.012, t0 + 0.3 + i * 0.012);
    if (ap <= 0) continue; const ty = BTY[(i + bk.n) % 41], lit = (t > CARD_T && t < CASE_OUT - 0.3 && beat % rows === row) ? Math.exp(-((t - CARD_T) - beat * B) * 6) : 0;
    c.save(); c.globalAlpha *= ap;
    rr(c, X(x - 8), Y(y - 18), 16 * z, 7 * z, 2 * z); c.fillStyle = mix(BG, TYPE[ty], 0.75); c.fill();
    rr(c, X(x - 17), Y(y - 11), 34 * z, 22 * z, 3 * z); c.fillStyle = ATOM; c.fill(); c.strokeStyle = rgba(INK, 0.55 + 0.45 * lit); c.lineWidth = (1.8 + 1.6 * lit) * z; c.stroke();
    c.restore(); }
  if (spineOn > 0) { c.save(); c.globalAlpha *= spineOn; c.strokeStyle = ACC; c.lineWidth = (3.4 + 3 * win(t, REVIEW, REVIEW + 0.9, 0.12, 0.6)) * z; c.setLineDash([8 * z, 7 * z]); c.lineDashOffset = -ramp(t, REVIEW, REVIEW + 0.9, Wm) * 30 * z; rr(c, X(gx - 26), Y(gy - 28), (8 * 44 + 52) * z, 50 * z, 8 * z); c.stroke(); c.restore(); }
  c.restore(); }

// ---------- frame ----------
function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
  S.ground(c, t, cm, { tint: PINK });
  const W0 = wpos(t);

  // ---------- the line (the work), always present ----------
  { c.strokeStyle = rgba(INK, 0.85); c.lineWidth = 4.4 * z; c.lineCap = 'round'; c.beginPath(); c.moveTo(X(-1400), Y(LINE_Y)); c.lineTo(X(1400), Y(LINE_Y)); c.stroke();
    c.strokeStyle = rgba(INK, 0.3); c.lineWidth = 2.2 * z; c.beginPath(); for (let x = -1380; x < 1400; x += 60) { c.moveTo(X(x), Y(LINE_Y)); c.lineTo(X(x), Y(LINE_Y + 10)); } c.stroke(); }

  // ================= FELT: one huge pasted card =================
  const bigA = 1 - ramp(t, SPILL + 0.2, SPILL + 0.8);
  if (bigA > 0) { const g1 = (q) => t > q ? Math.exp(-(t - q) * 3) : 0, hl = {};
    hl[3] = [g1(LAND_A) * 0.9, INK]; hl[4] = [g1(LAND_A) * 0.9, INK]; hl[6] = [g1(LAND_B) * 0.9, INK]; hl[7] = [g1(LAND_B) * 0.9, INK]; hl[0] = [g1(LAND_C) * 0.9, INK]; hl[1] = [g1(LAND_C) * 0.9, INK];
    const swell = 1 + 0.03 * (g1(LAND_A) + g1(LAND_B) + g1(LAND_C)) * 0.6, rect = { ...BIG, w: BIG.w * swell, h: BIG.h * swell, y: BIG.y - (BIG.h * (swell - 1)) / 2 };
    rowsCard(c, X, Y, z, rect, bigA, 11, hl);
    // the pod reads: a scan line
    for (const [r0, r1] of [[POD_ARR, ANS1], [LAND_C, ANS2]]) { const u = (t - r0) / (r1 - r0); if (u < 0 || u > 1) continue;
      const yy = lerp(BIG.y - BIG.h / 2 + 20, BIG.y + BIG.h / 2 - 20, u); c.save(); c.strokeStyle = rgba(ACC, 0.7 * Math.sin(Math.PI * u)); c.lineWidth = 4 * z; c.beginPath(); c.moveTo(X(BIG.x - BIG.w / 2 + 12), Y(yy)); c.lineTo(X(BIG.x + BIG.w / 2 - 12), Y(yy)); c.stroke(); c.restore(); } }
  FELTC.forEach((fc, i) => { if (t < fc.appear || t > fc.land + 0.05) return; const [x, y, s, r] = keyed(fc.k, t), fl = t > fc.k[1][0] ? Math.sin(Math.PI * ramp(t, fc.k[fc.k.length - 2][0], fc.land, (u) => u)) : 0;
    const bob = t < fc.k[fc.k.length - 2][0] ? 1 : 0; drawCard(c, X(x), Y(y - fl * ARC + bob * Math.sin(t * 1.3 + i * 2) * 5), z * s, r + bob * Math.sin(t * 0.9 + i) * 0.03, ramp(t, fc.appear, fc.appear + 0.3) * (1 - ramp(t, fc.land - 0.12, fc.land)), { lines: LINESW[i + 3], z }); });
  // answers: ✕ twice (FELT), ✓ once (PAYOFF)
  { const a1 = win(t, ANS1, 11.9, 0.25, 0.45) * (1 - win(t, 5.35, LAND_C + 0.3, 0.25, 0.01)) , a2 = win(t, ANS2, 12.2, 0.25, 0.45);
    const pop = q => lerp(0.9, 1, EASE.glaser(clamp((t - q) / 0.3)));
    const link = { x: BIG.x + BIG.w / 2 - 20, y: rowY(BIG, 3) + 13 };
    if (t < ANS2) { if (a1 > 0) { c.save(); const s = pop(ANS1); c.translate(X(ANS.x), Y(ANS.y)); c.scale(s, s); c.translate(-X(ANS.x), -Y(ANS.y)); answer(c, X, Y, z, a1, ramp(t, X1, X1 + 0.5, Rs), REF, link); c.restore(); } }
    else if (a2 > 0) { c.save(); const s = pop(ANS2); c.translate(X(ANS.x), Y(ANS.y)); c.scale(s, s); c.translate(-X(ANS.x), -Y(ANS.y)); answer(c, X, Y, z, a2, ramp(t, X2, X2 + 0.5, Rs), REF, link); c.restore(); }
    const pa = ramp(t, POD2_ARR - 0.1, P_ANS, (u) => u) > 0 ? win(t, P_ANS, P_LEAVE + 0.5, 0.25, 0.35) : 0;
    if (pa > 0) { const go = ramp(t, P_LEAVE, P_LEAVE + 0.5, Co), s = pop(P_ANS) * (1 - 0.6 * go); c.save(); c.translate(X(ANS.x), Y(ANS.y)); c.scale(s, s); c.translate(-X(ANS.x), -Y(ANS.y));
      answer(c, X, Y, z, pa, ramp(t, P_OK, P_OK + 0.5, Rs), OKC, { x: BSOCK.x + 50, y: BSOCK.y }); c.restore(); } }

  // ================= WHY + MOVE: cards on the line, the socket tree =================
  const caseFade = 1 - ramp(t, CASE0, CASE0 + 0.5);
  // the tree (MOVE)
  const treeA = ramp(t, TREE_ON, TREE_ON + 0.35) * caseFade;
  if (treeA > 0) {
    const aLeaf = ramp(t, TREE_ON + 0.15, TREE_ON + 0.6) * caseFade;
    c.save(); c.lineWidth = 4.2 * z; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = rgba(INK, 0.7 * aLeaf);
    SOCK.forEach(s => elbow(c, X, Y, ROOT.x, ROOT.y + 32, s.x, SY - 69)); c.restore();
    const snaps = [SNAP_R, SNAP_D, SNAP_F], seamT = [TICKS, TICK_D, TICKS];
    SOCK.forEach((s, i) => { const filled = t >= snaps[i], ref = i === 2 ? win(t, REFUSE, REFUSE + 1.1, 0.04, 0.4) : 0;
      if (!filled || t < snaps[i] + 0.3) drawSocket(c, X(s.x), Y(SY), z, s.ty, { a: aLeaf * (filled ? 1 - ramp(t, snaps[i], snaps[i] + 0.3) : 1), notch: ramp(t, NOTCH[i], NOTCH[i] + 0.3), refuse: ref });
      if (filled) { const u = clamp((t - snaps[i]) / 0.45); if (u < 1) { c.strokeStyle = rgba(INK, 0.55 * (1 - u) * aLeaf); c.lineWidth = 4.5 * z; rr(c, X(s.x) - (76 + 22 * u) * z, Y(SY) - (52 + 22 * u) * z, (152 + 44 * u) * z, (104 + 44 * u) * z, 14 * z); c.stroke(); } }
      c.save(); c.globalAlpha = aLeaf; seamDot(c, X(s.x), Y(SY - 116), z, { fill: ramp(t, snaps[i], snaps[i] + 0.12), tick: ramp(t, seamT[i], seamT[i] + 0.4, Rs), refuse: ref }); c.restore(); });
    // receipts climbing: pulses up the stalks between the seam ticks and the root tick
    if (t > TICKS && t < ROOT_TICK + 0.1) { const u = Wm(clamp((t - TICKS) / (ROOT_TICK - TICKS))); SOCK.forEach(s => { const m = (SY - 69 + ROOT.y + 32) / 2, L1 = Math.abs(SY - 140 - m), L2 = Math.abs(s.x), L3 = Math.abs(m - ROOT.y - 32), d = u * (L1 + L2 + L3);
      let px, py; if (d < L1) { px = s.x; py = SY - 140 - d; } else if (d < L1 + L2) { px = lerp(s.x, 0, (d - L1) / Math.max(1, L2)); py = m; } else { px = 0; py = m - (d - L1 - L2); }
      c.fillStyle = rgba(ACC, treeA * (1 - ramp(t, ROOT_TICK, ROOT_TICK + 0.1))); c.beginPath(); c.arc(X(px), Y(py), 8 * z, 0, Math.PI * 2); c.fill(); }); }
    c.save(); c.globalAlpha = treeA; rr(c, X(ROOT.x) - 85 * z, Y(ROOT.y) - 32 * z, 170 * z, 64 * z, 10 * z); c.fillStyle = ATOM; c.fill(); c.strokeStyle = INK; c.lineWidth = 4.4 * z; c.stroke(); c.restore();
    text(c, 'brief', X(ROOT.x), Y(ROOT.y) + 8 * z, { f: 'mono', size: Math.round(22 * z), col: INK, a: la(t, 'brief'), align: 'center', track: 0.12 });
    if (t > ROOT_TICK) { c.save(); c.globalAlpha = treeA; seamDot(c, X(ROOT.x + 85), Y(ROOT.y - 32), z * 1.3, { fill: 1, tick: ramp(t, ROOT_TICK, ROOT_TICK + 0.45, Rs), refuse: 0 }); c.restore(); }
  }
  // the cards on the line (spilled from the big card, then look-alike pairs)
  if (t > SPILL && caseFade > 0) {
    const order = TY.map((_, i) => i).sort((p, q) => (EX[p] ? 1 : 0) - (EX[q] ? 1 : 0));
    for (const i of order) { const L = lineCard(i, t); if (!L) continue;
      const pk = PAIR_SLOTS.findIndex(p => p.includes(i)), land = pk >= 0 ? PAIRS[pk] : SPILL + 0.9 + SPILLED.indexOf(i) * 0.07;
      const flash = t > land && t < land + 0.8 ? Math.exp(-(t - land) * 6) : 0;
      let x = L.x, y = L.y, r = L.r;
      if (pk >= 0 && i === PAIR_SLOTS[pk][0]) { const gl = win(t, PAIRS[pk] + 0.08, FREEZE, 0.12, 0.5); y -= 28 * gl; r -= 0.08 * gl; }
      if (EX[i] === 'X' && t > REFUSE && t < REFUSE + 0.45) { const u = t - REFUSE; r += 0.1 * Math.sin(u * 55) * Math.exp(-u * 8); x += 8 * Math.sin(u * 55) * Math.exp(-u * 8); }
      const ex = EX[i], snapT = ex === 'D' ? SNAP_D : ex === 'R' ? SNAP_R : ex === 'F' ? SNAP_F : 0, snapF = snapT && t > snapT ? Math.exp(-(t - snapT) * 6) : 0;
      const lab = ex === 'X' ? ['draft', la(t, 'l-draft')] : ex === 'D' ? ['decided', la(t, 'l-decided')] : ex === 'R' ? ['rule', la(t, 'l-rule')] : ['', 0];
      drawCard(c, X(x), Y(y), z * L.s * (1 + 0.06 * snapF), r, L.a * caseFade, { ty: TY[i], tab: tabK(i, t), lines: LINESW[i], flash: Math.max(flash, snapF), label: lab[0], labelA: lab[1], z });
      // WHY: the pod grabs the wrong (draft) card of each look-alike pair
      if (pk >= 0 && i === PAIR_SLOTS[pk][0]) { const g = PAIRS[pk] + 0.08, xa = win(t, g, FREEZE + 0.4, 0.06, 0.4);
        if (xa > 0) { crossMark(c, X(x + 40), Y(y - 44), 20 * z * lerp(1.5, 1, G(clamp((t - g) / 0.25))), 5 * z, xa); }
        const th = win(t, g - 0.02, g + 0.3, 0.04, 0.15), p = podFelt(t);
        if (th > 0 && p.a > 0) { c.save(); c.strokeStyle = rgba(REF, 0.8 * th); c.lineWidth = 3 * z; c.setLineDash([8 * z, 7 * z]); c.beginPath(); c.moveTo(X(p.x - 30), Y(p.y + 20)); c.lineTo(X(x + 20), Y(y - 40)); c.stroke(); c.restore(); } } }
  }

  // ================= CASE: three real prompts =================
  const caseA = 1 - ramp(t, CASE_OUT - 0.35, CASE_OUT);
  if (t > CASE0 && caseA > 0) {
    const sp = ramp(t, SPINE, SPINE + 0.6, Wm);
    if (sp > 0) { c.save(); c.globalAlpha = caseA * 0.9; c.strokeStyle = ACC; c.lineWidth = 3 * z; c.setLineDash([10 * z, 9 * z]); c.beginPath(); c.moveTo(X(-800), Y(-380)); c.lineTo(X(lerp(-800, 800, sp)), Y(-380)); c.stroke(); c.restore(); }
    BLK.forEach((bk, k) => drawBlock(c, X, Y, z, bk, BLOCK_T[k], t, caseA));
    // the spine is still draft: a hollow ring waits beside it (review next), not a tick
    // the real-run card
    const ca = la(t, 'card');
    if (ca > 0) { const cw = 820, ch = 230, cx = 0, cy = 75, L = X(cx - cw / 2), T = Y(cy - ch / 2);
      c.save(); c.globalAlpha = ca; rr(c, L, T, cw * z, ch * z, 14 * z); c.fillStyle = CARD; c.fill(); c.strokeStyle = INK; c.lineWidth = 4 * z; c.stroke(); c.restore();
      text(c, 'Real run · Context Atoms · 16 Oct 2026', L + 34 * z, T + 50 * z, { f: 'mono', size: Math.round(20 * z), col: SOFT, a: ca, track: 0.12 });
      text(c, '3 prompts · 41, 26 and 41 atoms', L + 34 * z, T + 118 * z, { f: 'sans', size: Math.round(46 * z), col: INK, a: ca });
      text(c, 'Engine check: GREEN · 9 shared, still draft', L + 34 * z, T + 180 * z, { f: 'sans', size: Math.round(34 * z), col: INK, a: ca }); }
  }

  // ================= LIMIT: a wrong date tabbed "decided" fits =================
  const limA = ramp(t, 40.85, 41.25) * (1 - ramp(t, 46.25, 46.75));
  if (limA > 0) {
    c.save(); c.globalAlpha = limA; c.lineWidth = 4.2 * z; c.lineCap = 'round'; c.strokeStyle = rgba(INK, 0.7); c.beginPath(); c.moveTo(X(LSOCK.x), Y(-298)); c.lineTo(X(LSOCK.x), Y(LSOCK.y - 69)); c.stroke();
    rr(c, X(0) - 85 * z, Y(-330) - 32 * z, 170 * z, 64 * z, 10 * z); c.fillStyle = ATOM; c.fill(); c.strokeStyle = INK; c.lineWidth = 4.4 * z; c.stroke(); c.restore();
    text(c, 'brief', X(0), Y(-330) + 8 * z, { f: 'mono', size: Math.round(22 * z), col: INK, a: la(t, 'brief3') * limA, align: 'center', track: 0.12 });
    const filled = t >= L_SNAP;
    if (!filled || t < L_SNAP + 0.3) drawSocket(c, X(LSOCK.x), Y(LSOCK.y), z, 1, { a: limA * (filled ? 1 - ramp(t, L_SNAP, L_SNAP + 0.3) : 1), notch: 1, refuse: 0 });
    c.save(); c.globalAlpha = limA; seamDot(c, X(LSOCK.x + 95), Y(LSOCK.y - 60), z, { fill: ramp(t, L_SNAP, L_SNAP + 0.12), tick: ramp(t, L_TICK, L_TICK + 0.4, Rs), refuse: 0 }); c.restore();
    const [x, y, s, r] = keyed([[41.25, -400, -60, 1, 0], [L_SNAP, LSOCK.x, LSOCK.y, 1, 0, G]], t), snapF = t > L_SNAP ? Math.exp(-(t - L_SNAP) * 6) : 0;
    drawCard(c, X(x), Y(y), z * s * (1 + 0.06 * snapF), r, limA, { ty: 1, tab: 1, lines: [0.82, 0.55], smudge: 1, flash: snapF, z });
  }

  // ================= PAYOFF: the small brief; the draft stays out =================
  const payA = ramp(t, PAY0 - 0.45, PAY0);
  if (payA > 0) {
    const L = X(BR.x - BR.w / 2), T = Y(BR.y - BR.h / 2);
    c.save(); c.globalAlpha = payA; rr(c, L, T, BR.w * z, BR.h * z, 12 * z); c.fillStyle = CARD; c.fill(); c.strokeStyle = INK; c.lineWidth = 4.4 * z; c.stroke();
    // a rule row already in place
    const ry = BR.y - BR.h / 2 + 76; rr(c, X(BR.x - 84), Y(ry - 9), 18 * z, 18 * z, 3 * z); c.fillStyle = PINK; c.fill(); c.strokeStyle = TYPE_EDGE[2]; c.lineWidth = 1.6 * z; c.stroke();
    c.strokeStyle = LINES; c.lineWidth = 6 * z; c.lineCap = 'round'; c.beginPath(); c.moveTo(X(BR.x - 54), Y(ry)); c.lineTo(X(BR.x + 70), Y(ry)); c.stroke(); c.restore();
    text(c, 'brief', L + 22 * z, T + 40 * z, { f: 'mono', size: Math.round(22 * z), col: INK, a: la(t, 'brief2'), track: 0.12 });
    const filled = t >= P_SNAP, glow = win(t, POD2_ARR - 0.2, P_ANS + 0.4, 0.3, 0.4);
    if (!filled || t < P_SNAP + 0.3) drawSocket(c, X(BSOCK.x), Y(BSOCK.y), z * BSOCK.s, 1, { a: payA * (filled ? 1 - ramp(t, P_SNAP, P_SNAP + 0.3) : 1), notch: 1, refuse: 0 });
    if (filled && glow > 0) { c.save(); c.strokeStyle = rgba(OKC, 0.9 * glow); c.lineWidth = 5 * z; rr(c, X(BSOCK.x) - 66 * z, Y(BSOCK.y) - 50 * z, 132 * z, 100 * z, 12 * z); c.stroke(); c.restore(); }
    c.save(); c.globalAlpha = payA; seamDot(c, X(BR.x + BR.w / 2 - 26), Y(BR.y - BR.h / 2 + 30), z * 0.9, { fill: ramp(t, P_SNAP, P_SNAP + 0.12), tick: ramp(t, P_TICK, P_TICK + 0.4, Rs), refuse: 0 }); c.restore();
    // the two look-alikes, now tabbed
    for (const [key, ty, ln] of [['D', 1, LINESW[3]], ['X', 0, LINESW[4]]]) { const K = PAYC[key]; if (t < K[0][0]) continue;
      let [x, y, s, r] = keyed(K, t); const fl = key === 'X' && t > K[1][0] && t < K[2][0] ? Math.sin(Math.PI * clamp((t - K[1][0]) / (K[2][0] - K[1][0]))) : 0; y -= fl * 70;
      const idle = key === 'X' ? ramp(t, 49.75, 50.3) : 0, pre = t < K[1][0] ? 1 : 0; y += (idle + pre) * Math.sin(t * 1.3 + (key === 'X' ? 2 : 0)) * 6; r += (idle + pre) * Math.sin(t * 0.9) * 0.03;
      if (key === 'X' && t > P_BUMP && t < P_BUMP + 0.45) { const u = t - P_BUMP; x += 7 * Math.sin(u * 55) * Math.exp(-u * 8); }
      const snapF = key === 'D' && t > P_SNAP ? Math.exp(-(t - P_SNAP) * 6) : 0;
      drawCard(c, X(x), Y(y), z * s * (1 + 0.06 * snapF), r, ramp(t, 45.9, 46.5), { ty, tab: 1, lines: ln, flash: snapF, z }); }
  }

  // ---------- pods ----------
  { const pf = podFelt(t), pp = podPay(t);
    pod(c, X, Y, z, pf, 0); pod(c, X, Y, z, pp, win(t, P_OK, P_LEAVE, 0.2, 0.4) * 0.7);
    if (pf.a > 0) { const n = ramp(t, X1, X1 + 0.3) + ramp(t, X2, X2 + 0.3) + PAIRS.reduce((m, q) => m + ramp(t, q + 0.08, q + 0.35), 0);
      if (n > 0) tally(c, X(pf.x), Y(pf.y - 97), z * Math.min(1, z / 1.6 + 0.3), n, 0, pf.a * win(t, X1, 16.6, 0.15, 0.4)); }
    if (pp.a > 0 && t > P_OK) tally(c, X(pp.x), Y(pp.y - 97), z, 0, ramp(t, P_OK, P_OK + 0.4), pp.a); }

  // ---------- the whale ----------
  { const f = facing(t), ang = heading(t), v = wvel(t), still = Math.hypot(v.x, v.y) < 80;
    let blink = 0; for (const bt of [2.2, 8.9, 14.0, 21.4, REFUSE + 0.12, 33.0, 38.0, 44.0, 53.5, 56.8]) blink = Math.max(blink, 1 - Math.abs(t - bt) / 0.08);
    const FLICK = [FLICK_A, FLICK_B, FLICK_C, NUDGE, P_FLICK1, P_FLICK2];
    let sq = 0; for (const ft of FLICK) sq += 0.09 * win(t, ft - 0.06, ft + 0.3, 0.06, 0.22);
    sq -= 0.08 * win(t, REFUSE + 0.05, REFUSE + 0.45, 0.06, 0.3); sq += 0.08 * win(t, L_SNAP - 0.1, L_SNAP + 0.25, 0.05, 0.2);
    const surprise = win(t, REFUSE + 0.02, REFUSE + 0.6, 0.05, 0.2) + win(t, X1, X1 + 0.6, 0.05, 0.25);
    const focus = Math.max(win(t, STARE, 10.6, 0.3, 0.3), win(t, 22.4, 27.8, 0.3, 0.3), win(t, 43.3, 46.4, 0.4, 0.3)) * (1 - clamp(surprise));
    const spark = win(t, P_SPARK, P_SPARK + 1.3, 0.1, 0.45), delight = t > P_OK + 0.2 ? 1 : 0;
    const flickT = FLICK.reduce((m, ft) => Math.max(m, win(t, ft - 0.08, ft + 0.25, 0.06, 0.2)), 0);
    c.save(); c.translate(X(W0.x), Y(W0.y)); if (f < 0) c.scale(-1, 1);
    KH.drawWhale(c, { x: 0, y: 0, ang: f < 0 ? -ang : ang, scale: 0.55 * Math.max(z, 0.85), L: 1, tail: Math.sin(t * (still ? 3 : 11)) * (still ? 0.12 : 0.34) + flickT * 0.45,
      fin: Math.sin(t * (still ? 3 : 11) + 1.3) * 0.3 - flickT * 0.4, blink, focus, spark, sparkColor: mix(PINK, INK, 0.2), sparkScale: 1.3, eye: surprise > 0.2 ? 1.3 : 1,
      delight, blush: 0.6, mouth: delight ? 0.4 : 0, squash: sq, spray: win(t, SPOUT, SPOUT + 1.0, 0.12, 0.45), sprayColor: mix(PINK, INK, 0.25) });
    c.restore(); }

  // ---------- the hinge: a paper wash, then the title ----------
  const wash = win(t, TITLE_IN - 0.25, TITLE_OUT + 0.15, 0.4, 0.55) * 0.93;
  if (wash > 0) { c.fillStyle = rgba(BG, wash); c.fillRect(0, 0, W, H); }
  S.open(c, t - TITLE_IN + 0.25, EP, { out: TITLE_OUT - TITLE_IN + 0.25 });
  for (const r of CAPS) S.caption(c, t, r, { accent: ACC });
  S.lockup(c, t, LOCK, EP);
  const fb = 1 - ramp(t, 0, 0.3); if (fb > 0) { c.fillStyle = rgba(BG, fb); c.fillRect(0, 0, W, H); }
  c.restore();
}

// ---------- cues: every sound has a picture; tags feed the LONGFORM gates ----------
function cues() {
  const E = [];
  const e = (t, kind, tags = [], o = {}) => E.push({ t: +t.toFixed(4), kind, tags, ...o });
  e(FLICK_A, 'flick', ['focus'], { x: -190 }); e(LAND_A, 'paste', [], { x: 40 }); e(FLICK_B, 'flick', [], { x: -190 }); e(LAND_B, 'paste', [], { x: 40 });
  e(POD_ARR, 'podIn', [], { x: 380 }); e(ANS1, 'answer', [], { x: 380 }); e(X1, 'sour', ['consequence', 'focus'], { n: 1 });
  e(5.0, 'drift', [], { x: -190 }); e(FLICK_C, 'flick', [], { x: -190 }); e(LAND_C, 'paste', [], { x: 40 }); e(ANS2, 'answer', [], { x: 380 }); e(X2, 'sour', ['consequence', 'focus'], { n: 2 });
  e(STARE, 'stare', ['focus']);
  e(TITLE_IN, 'title', ['hinge']); e(SPILL, 'spill', ['focus']);
  PAIRS.forEach((p, k) => e(p, 'motif', k === 0 || k === 2 ? ['focus'] : [], { k, x: SX(PAIR_SLOTS[k][0]) }));
  e(15.75, 'podOut', []); e(FREEZE, 'chime', ['focus']);
  TAB_T.forEach((q, ty) => e(q, 'tab', ty === 0 ? ['mech', 'focus'] : ['mech'], { ty }));
  e(TREE_ON, 'tree', ['mech', 'focus']); NOTCH.forEach((q, k) => e(q, 'notch', [], { ty: SOCK[k].ty, x: SOCK[k].x }));
  e(SNAP_D, 'snap', ['mech', 'focus'], { ty: 1, x: 0 }); e(TICK_D, 'tick', ['mech'], { k: 0 });
  e(22.9, 'swim', []); e(NUDGE, 'flick', []); e(REFUSE, 'refuse', ['mech', 'focus'], { x: 280 });
  e(SNAP_R, 'snap', ['mech', 'focus'], { ty: 2, x: -280 }); e(SNAP_F, 'snap', ['mech'], { ty: 1, x: 280 }); e(TICKS, 'tick', ['mech'], { k: 1 }); e(ROOT_TICK, 'rootTick', ['mech', 'focus']);
  e(SETTLE, 'held', ['mech', 'focus']);
  BLOCK_T.forEach((q, k) => e(q, 'block', k === 1 ? ['focus'] : [], { x: BLK[k].x }));
  for (let q = CARD_T; q < CASE_OUT - 0.3; q += B) e(q, 'pulse', []);
  e(CARD_T, 'card', ['focus']); e(SPINE, 'spine', ['focus']); e(REVIEW, 'two', ['focus']);
  e(L_SNAP, 'limitSnap', ['limit', 'focus'], { x: 0 }); e(L_TICK, 'tick', ['limit'], { k: 2 }); e(43.125, 'push', ['limit']); e(NOT_T, 'room', ['limit']);
  e(PAY0, 'callback', ['callback', 'focus']); e(P_FLICK1, 'flick', []); e(P_SNAP, 'snap', ['focus'], { ty: 1, x: 40 }); e(P_TICK, 'tick', [], { k: 3 }); e(P_FLICK2, 'flick', []);
  e(P_BUMP, 'bump', ['focus'], { x: -125 }); e(48.75, 'podIn', [], { x: 380 }); e(P_ANS, 'answer', [], { x: 380 }); e(P_OK, 'resolve', ['focus']); e(P_SPARK, 'spark', []); e(P_LEAVE, 'leave', ['focus']);
  e(bar(30), 'belief', []); e(SPOUT, 'spout', []); e(LOCK, 'lockup', []);
  E.sort((p, q) => p.t - q.t);
  return { bpm: BPM, dur: DUR, acts: ACTS, ev: E };
}
const CONTRAST = [['title', INK, BG], ['title accent', ACC, BG], ['eyebrow', SOFT, BG], ['caption on chip', INK, C.paper], ['caption accent on chip', ACC, C.paper],
  ['card label on atom', INK, ATOM], ['brief label on root', INK, ATOM], ['brief label on card', INK, CARD], ['case card header', SOFT, CARD], ['case card numbers', INK, CARD], ['lockup', SOFT, BG]];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, DUR, W, H, fps: 60, wpos, heading, cam, ACTS, TERMS, JARGON, BPM,
  SOLUTION_HINT: 'Label each note by what it is.', ENDING: 'draft-stays-out',
  shutter: t => (t > 22.0 && t < 24.4) || (t > 40.0 && t < 41.1) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
