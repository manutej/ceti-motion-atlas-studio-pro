// CETI Capabilities 04 · conserve60 — the one-minute, problem-first cut of "Change everything but the laws."
// LONGFORM-60 (32 bars @124 BPM). Kinetic Hydrography 1.0.0 + series layer. Wada 84 (Seashell Pink = content,
// Deep Slate Green = law), copper = the one alarm. The wiki is a line with dots (pages) joined by threads (links).
// FELT: a link goes nowhere, an AI follows it too. WHY: every saved edit moves a dot and snaps a thread.
// MOVE: three pins hold the dots; content bends freely; a bad edit is stopped at the save gate and fixed.
// CASE: the real merge (Memory graph map). LIMIT: the citation audit lets 13 of 60 through. PAYOFF: the link lands.
// drawFrame(ctx, t) is a pure function of t.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, smoothstep, win, EASE, ramp, rng, mix, rgba, text } = KH;
const W = 1920, H = 1080, BPM = 124, B = 60 / BPM, BAR = 4 * B, DUR = +(32 * BAR + 0.3).toFixed(3);
const bar = n => (n - 1) * BAR;
const PINK = WD.seashellPink, DSG = WD.deepSlateGreen, INK = C.navy, SOFT = C.slate, COP = C.copper, MIST = C.mist;
const GROUND = mix(C.paper, PINK, 0.06), RULE = mix(C.paper, C.slate, 0.35), INACT = mix(SOFT, GROUND, 0.09), VEILED = mix(GROUND, PINK, 0.25);
const XL = -800, SEG = 400, PINX = [-400, 0, 400], LABX = [1000, 1400], AMP = 1.4, LIFT = 36, TAPLIFT = 72;
const EP = { no: '04', title: 'Change everything but the <i>pins</i>.', accent: DSG, short: 'Conserve' };
const SRC = 'https://app.notion.com/p/3f3d50cfaf93813b8cfce21490365024';   // Memory graph map
const lin = u => u;

// ---------- acts on the 32-bar grid ----------
const ACTS = { felt: { in: 0, out: bar(6) }, why: { in: bar(6), out: bar(11) }, move: { in: bar(11), out: bar(17) }, case: { in: bar(17), out: bar(23) },
  limit: { in: bar(23), out: bar(26) }, payoff: { in: bar(26), out: bar(30) }, belief: { in: bar(30), out: bar(32) }, lockup: { in: bar(32), out: DUR } };

// ---------- key times (every event on a beat or half-beat) ----------
const BUMP = bar(1) + 2 * B, FLUT = bar(2), POD_IN = bar(3), POD_X = bar(3) + B, POD_PULSE = bar(4), POD_OUT = bar(5);
const HINGE = bar(6), TITLE_IN = bar(6) + 2 * B, TITLE_OUT = bar(7) + 3.5 * B, PULL = bar(7);
const ED = [bar(8), bar(8) + 2 * B, bar(8) + 3 * B, bar(8) + 3.5 * B], LOOK = bar(9), HOMES = bar(10);
const TAP = [bar(11), bar(11) + B, bar(11) + 2 * B], LABEL_T = bar(11) + 3 * B, STRIP_T = bar(12);
const FE = [bar(13), bar(13) + 1.5 * B, bar(13) + 3 * B], TUG0 = bar(14) + 2 * B, REP = TUG0 + 3 * B, LAST = bar(16);
const SLIDE = bar(17), DOCK = bar(18), CARD_T = bar(18) + B, LAB = [bar(20), bar(20) + 2 * B];
const PUSH = bar(23), GRID_T = bar(23) + 2 * B, PASS_T = bar(24) + B, NOT_T = bar(25), PAN = bar(25) + 1.1 * B;
const FOLLOW = bar(26), LAND = bar(27), POD2_IN = bar(27) + B, POD_OK = bar(28), POD2_OUT = bar(29), SH0 = bar(29) + B, SH1 = SH0 + 1.5 * B, SH2 = SH1 + 1.0;
const BELIEF = bar(30), LOCK = bar(32);

// ---------- content: per-segment sine modes [a, b, c] (px, + is down) ----------
const K = {
  S0: [[-30, 0, 0], [35, 0, 0], [-25, 15, 0], [20, 0, 0]],
  G1: [[20, 0, 0], [-30, 0, 0], [30, 0, 0], [-15, 0, 0]], G2: [[-10, 20, 0], [25, 0, 0], [-35, 0, 0], [30, 0, 0]],
  A: [[60, 0, 0], [-70, 30, 0], [40, 0, 0], [-50, 20, 0]], Bk: [[-50, 30, 0], [45, 0, 0], [-70, 0, 20], [60, 0, 0]],
  Ck: [[40, 0, -20], [-60, 40, 0], [55, 0, 0], [-40, 30, 0]], Dw: [[-45, 0, 0], [30, -20, 0], [-30, 0, 0], [50, 0, 0]],
  D: [[110, 0, 0], [10, -40, 0], [-45, 0, 25], [-55, 0, 0]], E: [[-50, 0, 0], [70, 0, 0], [40, 0, 0], [-60, 30, 0]],
  F: [[-35, 0, 0], [75, 0, 0], [-40, 0, 0], [35, 0, 0]], G: [[60, 0, 0], [-50, 30, 0], [70, 0, 0], [-45, 0, 0]],
  CALM: [[22, 0, 0], [-22, 0, 0], [22, 0, 0], [-22, 0, 0]],
};
const LK = [[50, 0, 0], [-55, 25, 0]];   // the lab's line (segments 4 and 5, x 800..1600)
const EDITS = [{ t: -1, K: K.S0 }, { t: ED[0], K: K.A, d: 0.5 }, { t: ED[1], K: K.Bk, d: 0.45 }, { t: ED[2], K: K.Ck, d: 0.22 }, { t: ED[3], K: K.Dw, d: 0.2 },
  { t: FE[0], K: K.D }, { t: FE[1], K: K.E }, { t: FE[2], K: K.F }, { t: LAST, K: K.G }, { t: SLIDE + 0.6, K: K.CALM, d: 1.4, e: EASE.rest }];
// before the pins exist, edits drag the dots (pages) off their homes: [sx, dy] per dot
const FREE = [{ t: -1, v: [[0, 0], [60, 48], [0, 0]] }, { t: ED[0], v: [[0, 0], [60, 48], [-60, -45]], d: 0.5 },
  { t: ED[1], v: [[50, 52], [60, 48], [-60, -45]], d: 0.45 }, { t: ED[2], v: [[50, 52], [-55, 72], [-60, -45]], d: 0.22 }, { t: ED[3], v: [[35, 40], [-45, 64], [-75, -30]], d: 0.2 }];
const pinned = (i, t) => ramp(t, TAP[i], TAP[i] + 0.3, EASE.glaser);
function morph(list, t, key) { let i = 0; while (i + 1 < list.length && list[i + 1].t <= t) i++;
  const e = list[i]; if (i === 0) return e[key]; const p = list[i - 1][key], k = (e.e || EASE.glaser)(clamp((t - e.t) / (e.d || 0.6)));
  return e[key].map((row, j) => row.map((v, m) => lerp(p[j][m], v, k))); }
const TUGPX = 58;
const tug = t => TUGPX * EASE.warm(clamp((t - TUG0 - 0.04) / 0.75)) * (1 - ramp(t, REP, REP + 0.36, EASE.glaser));
const shakeEnv = t => ramp(t, SH0, SH0 + 0.22, EASE.glaser) * (1 - ramp(t, SH1, SH2, EASE.rest)), OM = 2 * Math.PI * 2 / B;
const hat = dx => Math.abs(dx) < SEG ? (1 + Math.cos(Math.PI * dx / SEG)) / 2 : 0;
const modes = (s, u) => AMP * (s[0] * Math.sin(Math.PI * u) + s[1] * Math.sin(2 * Math.PI * u) + s[2] * Math.sin(3 * Math.PI * u));
const SHK = [[58, 0, 0], [190, 50, 0], [200, 0, 60], [170, 70, 0], [120, 0, 0], [90, 30, 0]];
const shakeY = (j, u, t) => { const se = shakeEnv(t); if (se <= 0) return 0; const p = OM * (t - SH0), s = SHK[j];
  return se * (s[0] * Math.sin(p - 1.1 * j) * Math.sin(Math.PI * u) + s[1] * Math.sin(2 * p + 0.4 * j) * Math.sin(2 * Math.PI * u) + s[2] * Math.sin(1.5 * p) * Math.sin(3 * Math.PI * u)); };
function shapeY(KK, F, x) { const j = clamp(Math.floor((x - XL) / SEG), 0, 3), u = clamp((x - XL - j * SEG) / SEG); let y = modes(KK[j], u);
  for (let i = 0; i < 3; i++) if (F[i][1]) y += F[i][1] * hat(x - PINX[i] - F[i][0] * 0); return y; }
function lineFn(t) {
  const KK = morph(EDITS, t, 'K'), FV = morph(FREE, t, 'v'), F = FV.map((v, i) => { const k = 1 - pinned(i, t); return [v[0] * k, v[1] * k]; });
  const tg = tug(t);
  const f = x => { const j = clamp(Math.floor((x - XL) / SEG), 0, 3), u = clamp((x - XL - j * SEG) / SEG); let y = modes(KK[j], u);
    for (let i = 0; i < 3; i++) if (F[i][1]) y += F[i][1] * hat(x - PINX[i]);
    if (tg) y += tg * hat(x - PINX[1]); return y + shakeY(j, u, t); };
  f.dots = F.map((v, i) => { const x = PINX[i] + v[0]; return { x, y: f(x) }; }); f.F = F; f.K = KK; return f; }
const lineY = (x, t) => lineFn(t)(x);
// the lab's line slides in from the right and docks at x = 800
const labDX = t => 1000 * (1 - ramp(t, SLIDE + 0.25, DOCK, EASE.warm)), labA = t => ramp(t, SLIDE + 0.2, SLIDE + 0.9, EASE.rest);
const labY = (x, t) => { const j = clamp(Math.floor((x - 800) / SEG), 0, 1), u = clamp((x - 800 - j * SEG) / SEG); return modes(LK[j], u) + shakeY(4 + j, u, t); };
const labDot = (i, t) => ({ x: LABX[i] + labDX(t), y: labY(LABX[i], t) });
const HOMEB = { x: 0, y: -14 };

// ---------- threads (links): start on one dot, land on another ----------
// snap: when an edit moves the target dot and the thread is left in the air; re: when the pin brings the dot home
const TH = [{ s: 0, e: 1, h: 170, snap: -1, re: TAP[1], W: HOMEB }, { s: 1, e: 2, h: 150, snap: ED[0], re: TAP[2] },
  { s: 2, e: 0, h: 330, snap: ED[1], re: TAP[0] }, { s: 2, e: 1, h: 250, snap: ED[2], re: TAP[1] }];
const dotTop = (lf, i) => ({ x: lf.dots[i].x, y: lf.dots[i].y - 14 });
TH.forEach(th => { if (!th.W) th.W = dotTop(lineFn(th.snap - 1e-3), th.e); });
function thread(i, t, lf) {
  const th = TH[i], Sp = dotTop(lf, th.s), Ed = dotTop(lf, th.e);
  let k = 0, Wp = th.W;
  if (t >= th.snap) k = ramp(t, th.snap, th.snap + 0.35, EASE.glaser) * (1 - ramp(t, th.re, th.re + 0.35, EASE.glaser));
  if (th.e === 1) { const kt = ramp(t, TUG0 + 0.25, TUG0 + 0.55, EASE.glaser) * (1 - ramp(t, REP, REP + 0.36, EASE.glaser)); if (kt > k) { k = kt; Wp = HOMEB; } }
  const E = { x: lerp(Ed.x, Wp.x, k), y: lerp(Ed.y, Wp.y, k) };
  return { S: Sp, E, Cc: { x: (Sp.x + E.x) / 2, y: Math.min(Sp.y, E.y) - 2 * th.h }, umax: 1 - 0.16 * k, k };
}
const qpt = (g, u) => { const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u; return { x: a * g.S.x + b * g.Cc.x + c * g.E.x, y: a * g.S.y + b * g.Cc.y + c * g.E.y }; };
const qtan = (g, u) => ({ x: 2 * (1 - u) * (g.Cc.x - g.S.x) + 2 * u * (g.E.x - g.Cc.x), y: 2 * (1 - u) * (g.Cc.y - g.S.y) + 2 * u * (g.E.y - g.Cc.y) });
const LTH = [{ from: 0, to: 2, h: 160, t: DOCK + 0.35 }, { from: 1, to: 1, h: 300, t: DOCK + 0.6 }];   // the lab's new links land on C and B
const flut = t => (0.55 + 1.1 * win(t, FLUT, FLUT + 1.6, 0.1, 0.9)) * (1 - win(t, HOMES - 0.3, TAP[0] + 0.2, 0.35, 0.05));

// ---------- the whale: thread follows, flights (eased arcs), rides (perched on the line), hovers ----------
const PLAN = [
  { a: -1, b: BUMP, thread: 0, u0: 0.0, u1: 0.71, e: lin },
  { a: BUMP, b: BUMP + 0.4, to: { dx: -24, dy: -14 }, H: 0, keep: 1 },
  { a: BUMP + 0.4, b: 3.0, hover: true, looks: [[FLUT, -1], [FLUT + 0.75, 1]] },
  { a: 3.0, b: 3.7, to: { x: -150, y: -262 }, H: 0, keep: 1 },
  { a: 3.7, b: PULL + 0.15, hover: true, face: 1 },
  { a: PULL + 0.15, b: 13.3, to: { x: -620, y: -300 }, H: 0 },
  { a: 13.3, b: 18.45, hover: true, face: 1 },
  { a: 18.45, b: TAP[0], to: { x: PINX[0], y: -TAPLIFT }, H: 40 },
  { a: TAP[0], b: TAP[1], to: { x: PINX[1], y: -TAPLIFT }, H: 55, e: lin, sq0: 0.08 },
  { a: TAP[1], b: TAP[2], to: { x: PINX[2], y: -TAPLIFT }, H: 55, e: lin, sq0: 0.08 },
  { a: TAP[2], b: 21.8, hover: true, sq0: 0.08 },
  { a: 21.8, b: FE[0], to: { ride: -560 }, H: 110 },
  { a: FE[0], b: FE[0] + 0.18, ride: -560, sq: 0.12 },
  { a: FE[0] + 0.18, b: FE[1], to: { ride: -200 }, H: 80 },
  { a: FE[1], b: FE[1] + 0.18, ride: -200, sq: 0.12 },
  { a: FE[1] + 0.18, b: FE[2], to: { ride: 120 }, H: 80 },
  { a: FE[2], b: TUG0 - 0.7, ride: 120, sq: 0.12 },
  { a: TUG0 - 0.7, b: TUG0, to: { ride: -130 }, H: 140 },
  { a: TUG0, b: REP, ride: -130, sq: 0.22 },
  { a: REP, b: REP + 0.72, to: { x: -130, y: -170 }, H: 0 },
  { a: REP + 0.72, b: LAST - 0.75, hover: true },
  { a: LAST - 0.75, b: LAST, to: { ride: -560 }, H: 40 },
  { a: LAST, b: 30.6, ride: -560, sq: 0.12 },
  { a: 30.6, b: 32.7, to: { x: 560, y: -250 }, H: 30 },
  { a: 32.7, b: 35.4, hover: true, face: 1 },
  { a: 35.4, b: LAB[0], to: { lab: 0 }, H: 40 },
  { a: LAB[0], b: LAB[0] + 0.45, hover: true },
  { a: LAB[0] + 0.45, b: LAB[1], to: { lab: 1 }, H: 50 },
  { a: LAB[1], b: 38.5, hover: true },
  { a: 38.5, b: 41.7, to: { thread0: 0.22 }, H: 70 },
  { a: 41.7, b: FOLLOW, hover: true, looks: [[41.7, -1], [PAN + 0.4, 1]] },
  { a: FOLLOW, b: LAND - 0.5, thread: 0, u0: 0.22, u1: 0.8, e: lin },
  { a: LAND - 0.5, b: LAND, to: { x: 0, y: -96 }, H: 0, e: EASE.defer },
  { a: LAND, b: DUR + 1, hover: true, face: 1, breathe: 1 },
];
const T1OFF = -30;
function evalSeg(s, t) {
  if (s.thread != null) { const g = thread(s.thread, t, lineFn(t)), u = lerp(s.u0, s.u1, (s.e || lin)(clamp((t - s.a) / (s.b - s.a)))), p = qpt(g, u); return { x: p.x, y: p.y + T1OFF }; }
  if (s.ride != null) return { x: s.ride, y: lineY(s.ride, t) - LIFT };
  if (s.hover) { const k = smoothstep(s.a, s.a + 0.5, t) * (1 - smoothstep(s.b - 0.5, s.b, t)), amp = s.breathe ? 3 : 5;
    return { x: s.hp.x, y: s.hp.y + amp * k * Math.sin((t - s.a) * 2.6) }; }
  const u = (s.e || EASE.rest)(clamp((t - s.a) / (s.b - s.a)));
  return { x: lerp(s.from.x, s.to.x, u), y: lerp(s.from.y, s.to.y, u) - s.H * Math.sin(Math.PI * u) };
}
{ let face = 1;
  PLAN.forEach((s, i) => {
    if (s.hover) s.hp = evalSeg(PLAN[i - 1], s.a);
    if (s.to) { s.from = evalSeg(PLAN[i - 1], s.a);
      if (s.to.ride != null) s.to = { x: s.to.ride, y: lineY(s.to.ride, s.b) - LIFT };
      else if (s.to.lab != null) { const d = labDot(s.to.lab, s.b); s.to = { x: d.x, y: d.y - 96 }; }
      else if (s.to.thread0 != null) { const p = qpt(thread(0, s.b, lineFn(s.b)), s.to.thread0); s.to = { x: p.x, y: p.y + T1OFF }; }
      else if (s.to.dx != null) s.to = { x: s.from.x + s.to.dx, y: s.from.y + s.to.dy };
      if (!s.keep && Math.abs(s.to.x - s.from.x) > 20) face = Math.sign(s.to.x - s.from.x); }
    if (s.thread != null) face = 1;
    if (s.face) face = s.face; s.fc = face; }); }
const segAt = t => { let i = 0; while (i + 1 < PLAN.length && PLAN[i + 1].a <= t) i++; return PLAN[i]; };
const wpos = t => { const s = segAt(t); return evalSeg(s, clamp(t, s.a, s.b)); };
const wvel = t => { const a = wpos(t - 1 / 240), b = wpos(t + 1 / 240); return { x: (b.x - a.x) * 120, y: (b.y - a.y) * 120 }; };
const facing = t => { const s = segAt(t); let f = s.fc; if (s.looks) for (const [lt, lf] of s.looks) if (t >= lt) f = lf; return f; };
function heading(t) { let a = 0, s = 0;
  for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9; a += clamp(Math.atan2(v.y, Math.abs(v.x) + 300), -0.7, 0.7) * clamp(Math.abs(v.x) / 150) * w; s += w; }
  return a / s; }
const LANDS = PLAN.filter(s => s.sq).map(s => [s.a, s.sq]).concat(PLAN.filter(s => s.sq0).map(s => [s.a, s.sq0]),
  [[BUMP, 0.18], [LAND, 0.14], ...ED.map(e => [e, 0.05])]);
const squash = t => LANDS.reduce((q, [a, w]) => q + (t >= a ? w * Math.exp(-(t - a) * 10) : 0), 0);

// ---------- the pod (an AI helper): follows the same link, answers ✕; in the payoff it answers ✓ ----------
const POD1 = { x: -130, y: -70 }, POD2 = { x: -180, y: -22 }, PODS = { x: -880, y: -40 };
function podState(t) {
  const fly = (a, b, p, q, Hh, e) => { const u = e(clamp((t - a) / (b - a))); return { x: lerp(p.x, q.x, u), y: lerp(p.y, q.y, u) - Hh * Math.sin(Math.PI * u) }; };
  if (t >= 3.0 && t < POD_OUT + 1.6) {
    const p = t < POD_IN ? fly(3.0, POD_IN, PODS, POD1, 40, EASE.rest) : t < POD_OUT ? { x: POD1.x, y: POD1.y + 3 * Math.sin((t - POD_IN) * 2.2) * smoothstep(POD_IN, POD_IN + 0.5, t) }
      : fly(POD_OUT, POD_OUT + 1.5, POD1, { x: 560, y: -540 }, 0, EASE.collect);
    return { ...p, chip: 'x', ca: ramp(t, POD_X, POD_X + 0.3, EASE.glaser), a: 1 }; }
  if (t >= POD2_IN - 0.4 && t < POD2_OUT + 1.6) {
    const p = t < POD2_IN + 1.1 ? fly(POD2_IN - 0.4, POD2_IN + 1.1, PODS, POD2, 40, EASE.rest) : t < POD2_OUT ? { x: POD2.x, y: POD2.y + 3 * Math.sin((t - POD2_IN) * 2.2) * smoothstep(POD2_IN + 1.1, POD2_IN + 1.6, t) }
      : fly(POD2_OUT, POD2_OUT + 1.5, POD2, { x: 620, y: -600 }, 0, EASE.collect);
    return { ...p, chip: 'v', ca: ramp(t, POD_OK, POD_OK + 0.3, EASE.glaser), a: 1 }; }
  return null; }
const podAng = t => { const a = podState(t - 0.02), b = podState(t + 0.02); if (!a || !b) return 0; const dx = b.x - a.x, dy = b.y - a.y;
  return Math.hypot(dx, dy) < 0.3 ? 0 : clamp(Math.atan2(dy, Math.abs(dx) + 4) * Math.sign(dx || 1), -0.6, 0.6); };

// ---------- checks: the whale sounds, a ring runs out, each target flashes as it is reached ----------
const RING_V = 1700;
const pinTargets = t => { const lf = lineFn(t); return PINX.map((x, i) => ({ id: 'p' + i, x, y: lf(x) })); };
const labTargets = (t, ids) => ids.map(i => ({ id: 'l' + i, ...labDot(i, t) }));
const CHECK_DEF = [[FE[0] + 0.3, 'pins'], [FE[1] + 0.3, 'pins'], [FE[2] + 0.3, 'pins'], [TUG0 + 0.3, 'pins'], [REP + 0.45, 'pins'], [LAST + 0.3, 'pins'],
  [DOCK + 0.3, 'all'], [LAB[0] + 0.2, 'l0'], [LAB[1] + 0.2, 'l1'], [PASS_T, 'p0'], [LAND + 0.25, 'pins']];
const CHECKS = CHECK_DEF.map(([tc, what]) => {
  const o = wpos(tc), tg = what === 'pins' ? pinTargets(tc) : what === 'all' ? pinTargets(tc).concat(labTargets(tc, [0, 1])) : what === 'p0' ? pinTargets(tc).slice(0, 1) : labTargets(tc, [+what[1]]);
  const hits = tg.map(p => { const th = tc + Math.hypot(p.x - o.x, p.y - o.y) / RING_V; return { ...p, t: th, bad: p.id === 'p1' && tug(th) > 20 }; });
  return { t: tc, o, hits, end: Math.max(...hits.map(h => h.t)) };
});
const PANEL_IN = 22.4, PANEL_OUT = 40.6;
const ENTRIES = [];
for (const ck of CHECKS) { if (ck.t < PANEL_IN || ck.t > PANEL_OUT - 0.6) continue; const bad = ck.hits.find(h => h.bad); ENTRIES.push(bad ? { t: bad.t + 0.05, fire: true } : { t: ck.end + 0.08, fire: false }); }
for (let k = 0; k < 8; k++) ENTRIES.push({ t: DOCK + 0.55 + (k + 1) * B / 2, fire: false, quiet: true });
ENTRIES.sort((a, b) => a.t - b.t);
const FIRE_T = ENTRIES.find(e => e.fire).t, GATE_SHUT = FIRE_T - 0.03, GATE_OPEN = CHECKS[4].end + 0.05;

// ---------- the citation audit grid (60 ticks: 47 faithful, 13 not) ----------
const AUD = (() => { const R = rng(4760), idx = Array.from({ length: 60 }, (_, i) => i); for (let i = 59; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  const bad = new Set(idx.slice(0, 13)), order = Array.from({ length: 60 }, (_, i) => i).map(i => ({ i, r: R() })).sort((a, b) => a.r - b.r).map(o => o.i);
  return Array.from({ length: 60 }, (_, i) => ({ i, bad: bad.has(i), t: GRID_T + 0.42 + 0.75 * order.indexOf(i) / 59 })); })();

// ---------- camera: eased keys ----------
const CAMK = [[0, -170, -80, 1.6], [HINGE, -150, -88, 1.6], [PULL, -150, -88, 1.6], [13.7, 0, -70, 1.0], [18.3, 0, -70, 1.0], [19.3, 0, -40, 1.2],
  [TUG0 - 0.25, 0, -40, 1.2], [TUG0 + 0.4, -60, -30, 1.32], [REP + 0.8, -60, -30, 1.32], [LAST + 0.1, 0, -40, 1.2], [SLIDE, 0, -40, 1.2], [SLIDE + 1.85, 420, -40, 0.7],
  [PUSH, 450, -40, 0.7], [PUSH + 1.45, -400, 40, 1.5], [PAN, -400, 40, 1.5], [FOLLOW, -170, -80, 1.6], [POD2_OUT + 0.2, -170, -80, 1.6], [BELIEF - 0.05, 0, -60, 1.2], [DUR + 1, 0, -60, 1.2]];
function cam(t) { let i = 0; while (i + 2 < CAMK.length && CAMK[i + 1][0] <= t) i++; const [a, x0, y0, z0] = CAMK[i], [b, x1, y1, z1] = CAMK[i + 1], u = EASE.rest(clamp((t - a) / (b - a)));
  const z = lerp(z0, z1, u), s = t < HINGE ? 1 : 0; let fx = 0; if (s) { const p = wpos(t); fx = clamp(p.x + 110, -80, 80) * 0.12; }
  return { x: lerp(x0, x1, u) + fx, y: lerp(y0, y1, u), z, ax: 960, ay: 575 }; }

// ---------- READ table ----------
const cap = (id, a, b, text, o = {}) => ({ id, in: a, out: b, fi: o.fi ?? 0.3, fo: o.fo ?? 0.3, text, kind: 'caption', size: 38, ...o });
const CAPS = [
  cap('felt1', bar(1) + 2 * B, POD_IN - 0.12, 'I followed the link. It went nowhere.'),
  cap('felt2', bar(3) + 2 * B, bar(5) + 2 * B, 'The AI followed it too. Wrong answer.'),
  cap('why', ED[0], bar(9) + 3 * B, 'Edits get saved. No one checks the rest.'),
  cap('hint', HOMES, TAP[0] + B, 'Name what must stay true. Check every edit.', { fi: 0.25, fo: 0.25 }),
  cap('move1', FE[0], TUG0 - 0.12, 'Edit freely. These three laws never move.'),
  cap('move2', TUG0, LAST - 0.08, 'Breaks a link? Stopped and fixed before saving.'),
  cap('move3', LAST, SLIDE - 0.02, 'Every check written down.'),
  cap('case1', SLIDE, bar(19) - 0.1, 'Real run: two wikis merged into one.'),
  cap('case2', LAB[0], bar(22) - 0.2, 'Nearly every new fact named its source.'),
  cap('limit1', GRID_T + B, NOT_T - 0.15, 'A source can still say something else.', { fi: 0.25, fo: 0.25 }),
  cap('notthis', NOT_T, FOLLOW + 0.46, 'Checked means no known breaks. Not proven true.', { fi: 0.25, fo: 0.25 }),
  cap('belief', BELIEF, LOCK - 0.2, 'Pick three things your wiki must keep.'),
];
const LABR = { id: 'label', in: LABEL_T, out: FE[0] - 0.25, fi: 0.3, fo: 0.3, text: 'Links must land.', kind: 'label', size: 26 };
const STRIP = { id: 'strip', in: STRIP_T, out: SLIDE - 0.1, fi: 0.35, fo: 0.35, text: 'Pin. Check. Fix.', kind: 'label', size: 24 };
const CELLS = [['548', 'entities'], ['2,933', 'links'], ['0', 'laws broken'], ['0.988', 'sourced']];
const CARDR = { id: 'card', in: CARD_T, out: bar(22) - 0.3, fi: 0.4, fo: 0.4, kind: 'card', size: 56, src: SRC,
  text: 'Real run · Memory graph map · ' + CELLS.map(c => c.join(' ')).join(' · ') };
const AUDR = { id: 'audit', in: bar(24), out: PAN - 0.05, fi: 0.3, fo: 0.3, kind: 'card', size: 28, src: SRC, text: 'Atlas citation audit · 47 of 60 faithful' };
const READ = [
  { id: 'eyebrow', in: TITLE_IN, out: TITLE_OUT, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 04', kind: 'title', size: 15, src: 'films/kh/caps/SERIES.md' },
  { id: 'title', in: TITLE_IN, out: TITLE_OUT, fi: 0.4, fo: 0.45, text: 'Change everything but the pins.', kind: 'title', size: 92 },
  ...CAPS, LABR, STRIP, CARDR, AUDR,
  { id: 'lockup', in: LOCK, out: DUR, fi: 0.45, fo: 0, text: 'CETI · Capabilities · 04 · Conserve', kind: 'card', size: 15, src: 'films/kh/caps/SERIES.md' },
].sort((a, b) => a.in - b.in);
const RD = id => READ.find(r => r.id === id), ra = (t, id) => { const r = RD(id); return win(t, r.in, r.out, r.fi, r.fo); };
const TERMS = [{ term: 'laws', symbol: 'pin', pictured_at: TAP[0], named_at: FE[0] },
  { term: 'citation audit', symbol: 'grid of 60 ticks', pictured_at: GRID_T, named_at: bar(24) }];
const JARGON = ['law', 'laws', 'invariant', 'conserved', 'conservation', 'drift', 'ledger', 'provenance', 'noether', 'citation', 'audit', 'entities', 'sourced', 'gate', 'budget'];
const SOLUTION_HINT = 'Name what must stay true. Check every edit.', ENDING = 'link-lands';

// ---------- drawing helpers ----------
function drawPin(c, sx, sy, z, p, o = {}) {
  c.save(); c.lineWidth = 4 * z; c.strokeStyle = DSG;
  if (p < 1) { c.globalAlpha = (o.a ?? 1) * (1 - p); c.fillStyle = GROUND; c.beginPath(); c.arc(sx, sy, 13 * z, 0, Math.PI * 2); c.fill(); c.stroke(); }
  if (p > 0) { const g = EASE.glaser(p), R = lerp(58, 28, g) * z;
    c.globalAlpha = (o.a ?? 1) * p * (o.ring ?? 0.7); c.lineWidth = 2.4 * z; c.strokeStyle = o.ringCol || DSG; c.beginPath(); c.arc(sx, sy, R, 0, Math.PI * 2); c.stroke();
    c.beginPath(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; c.moveTo(sx + Math.cos(a) * (R + 4 * z), sy + Math.sin(a) * (R + 4 * z)); c.lineTo(sx + Math.cos(a) * (R + 13 * z), sy + Math.sin(a) * (R + 13 * z)); } c.stroke();
    c.globalAlpha = (o.a ?? 1) * p; c.fillStyle = DSG; c.beginPath(); c.arc(sx, sy, 16 * z * (0.6 + 0.4 * g), 0, Math.PI * 2); c.fill();
    c.fillStyle = C.paper; c.beginPath(); c.arc(sx, sy, 5 * z, 0, Math.PI * 2); c.fill(); }
  c.restore(); }
function drawThread(c, g, X, Y, z, t, o = {}) {
  const n = 44, um = g.umax * (o.draw ?? 1), k = g.k, fl = k * flut(t);
  c.save(); c.globalAlpha = o.a ?? 1; c.strokeStyle = o.col || rgba(INK, 0.72); c.lineWidth = (o.w || 2.6) * z; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); let last = null, tan = null;
  for (let j = 0; j <= n; j++) { const u = um * j / n, p = qpt(g, u), d = qtan(g, u), L = Math.hypot(d.x, d.y) || 1, nx = -d.y / L, ny = d.x / L;
    const wob = fl * 7 * smoothstep(0.45, 1, u / Math.max(um, 1e-3)) * Math.sin(u * 15 - t * 8.5);
    const x = X(p.x + nx * wob), y = Y(p.y + ny * wob); j ? c.lineTo(x, y) : c.moveTo(x, y); last = { x, y }; tan = { x: d.x / L, y: d.y / L }; }
  c.stroke();
  if (k > 0.05) { // a loose, curled end
    const r = 7 * z * k, cx = last.x - tan.y * r, cy = last.y + tan.x * r, a0 = Math.atan2(last.y - cy, last.x - cx);
    c.beginPath(); c.arc(cx, cy, r, a0, a0 + 4.2 * k); c.stroke(); }
  if ((o.draw ?? 1) > 0.98 && k < 0.5) { const s = 10 * z, a = 1 - 2 * k, ang = Math.atan2(tan.y, tan.x);
    c.globalAlpha = (o.a ?? 1) * a; c.beginPath(); c.moveTo(last.x - Math.cos(ang - 0.5) * s, last.y - Math.sin(ang - 0.5) * s); c.lineTo(last.x, last.y);
    c.lineTo(last.x - Math.cos(ang + 0.5) * s, last.y - Math.sin(ang + 0.5) * s); c.stroke(); }
  c.restore(); }
function iconChip(c, kind, x, y, z, a) { if (a <= 0.001) return; const s = 23 * Math.max(z, 0.8);
  c.save(); c.globalAlpha = a; c.fillStyle = C.paper; c.strokeStyle = RULE; c.lineWidth = 1.4; c.beginPath(); c.roundRect(x - s, y - s, 2 * s, 2 * s, 7); c.fill(); c.stroke();
  c.strokeStyle = DSG; c.fillStyle = DSG; c.lineWidth = 2.6; c.lineCap = 'round'; c.lineJoin = 'round'; const q = s / 23;
  if (kind === 'page') { c.beginPath(); c.moveTo(x - 9 * q, y - 13 * q); c.lineTo(x + 4 * q, y - 13 * q); c.lineTo(x + 10 * q, y - 7 * q); c.lineTo(x + 10 * q, y + 13 * q); c.lineTo(x - 9 * q, y + 13 * q); c.closePath(); c.stroke();
    c.lineWidth = 1.8; c.beginPath(); for (const yy of [-2, 4, 9]) { c.moveTo(x - 5 * q, y + yy * q); c.lineTo(x + 6 * q, y + yy * q); } c.stroke(); }
  else if (kind === 'source') { c.lineWidth = 4; c.beginPath(); c.moveTo(x, y - 12 * q); c.lineTo(x, y + 9 * q); c.stroke(); c.beginPath(); c.arc(x, y - 14 * q, 0.1, 0, 7); c.stroke();
    c.beginPath(); c.arc(x, y + 9 * q, 4 * q, 0, Math.PI * 2); c.fill(); }
  else { c.beginPath(); c.moveTo(x - 12 * q, y + 4 * q); c.quadraticCurveTo(x - 4 * q, y - 16 * q, x + 6 * q, y - 2 * q); c.stroke();
    c.beginPath(); c.arc(x + 8 * q, y + 7 * q, 5 * q, 0, Math.PI * 2); c.stroke(); }
  c.restore(); }
function podChip(c, kind, x, y, z, a) { if (a <= 0.001) return; const r = 21 * z * (0.7 + 0.3 * a);
  c.save(); c.globalAlpha = a; c.fillStyle = C.paper; c.strokeStyle = RULE; c.lineWidth = 1.4; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.stroke();
  c.lineCap = 'round'; c.lineWidth = 4.2 * z; const q = r / 21;
  if (kind === 'x') { c.strokeStyle = COP; c.beginPath(); c.moveTo(x - 8 * q, y - 8 * q); c.lineTo(x + 8 * q, y + 8 * q); c.moveTo(x + 8 * q, y - 8 * q); c.lineTo(x - 8 * q, y + 8 * q); c.stroke(); }
  else { c.strokeStyle = DSG; c.beginPath(); c.moveTo(x - 9 * q, y + 1 * q); c.lineTo(x - 3 * q, y + 8 * q); c.lineTo(x + 10 * q, y - 8 * q); c.stroke(); }
  c.restore(); }

// the save gate and its written record: no words; a gate glyph and a row of ticks
function panel(c, t) {
  const a = ramp(t, PANEL_IN, PANEL_IN + 0.6, EASE.warm) * (1 - ramp(t, PANEL_OUT - 0.5, PANEL_OUT, EASE.rest)); if (a <= 0.001) return;
  const X0 = 1296, Y0 = 52, PW = 568, PH = 150, shut = ramp(t, GATE_SHUT, GATE_SHUT + 0.22, EASE.glaser) * (1 - ramp(t, GATE_OPEN, GATE_OPEN + 0.3, EASE.glaser));
  const hl = win(t, LAST, LAST + 1.8, 0.3, 0.4);
  c.save(); c.globalAlpha = a; c.fillStyle = C.paper; c.beginPath(); c.roundRect(X0, Y0, PW, PH, 12); c.fill();
  c.strokeStyle = shut > 0.01 ? mix(RULE, COP, shut) : RULE; c.lineWidth = 1.6 + 2.4 * shut; c.stroke();
  // gate: two posts, a lintel, and a bar that drops across when an edit is stopped
  const gx0 = X0 + 40, gx1 = X0 + 104, gy0 = Y0 + 30, gy1 = Y0 + 122;
  let glow = 0; for (const e of ENTRIES) if (!e.fire && !e.quiet) glow = Math.max(glow, win(t, e.t - 0.12, e.t + 0.5, 0.08, 0.4));
  if (glow > 0) { c.fillStyle = rgba(mix(C.paper, DSG, 0.25), glow); c.fillRect(gx0 + 4, gy0 + 4, gx1 - gx0 - 8, gy1 - gy0 - 4); }
  c.strokeStyle = DSG; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(gx0, gy1); c.lineTo(gx0, gy0); c.lineTo(gx1, gy0); c.lineTo(gx1, gy1); c.stroke();
  const ang = lerp(-Math.PI / 2, 0, shut), px = gx0 + 2, py = Y0 + 82; c.strokeStyle = shut > 0.05 ? COP : mix(DSG, C.paper, 0.35); c.lineWidth = 8;
  c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(ang) * 64, py + Math.sin(ang) * 64); c.stroke();
  // the record: one tick per check (the stopped one in copper)
  const tx0 = X0 + 156, base = Y0 + 112;
  c.strokeStyle = rgba(RULE, 1); c.lineWidth = 1.4; c.beginPath(); c.moveTo(tx0 - 10, base + 8); c.lineTo(X0 + PW - 24, base + 8); c.stroke();
  ENTRIES.forEach((e, i) => { if (t < e.t) return; const k = ramp(t, e.t, e.t + 0.25, EASE.glaser), x = tx0 + i * 21;
    c.lineCap = 'round'; c.strokeStyle = e.fire ? COP : INK; c.lineWidth = e.fire ? 8 : 6; c.beginPath(); c.moveTo(x, base); c.lineTo(x, base - (e.quiet ? 34 : 44) * k); c.stroke();
    if (e.fire) { c.fillStyle = COP; c.beginPath(); c.arc(x, base - 44 * k - 11, 7 * k, 0, Math.PI * 2); c.fill();
      if (hl > 0) { c.globalAlpha = a * hl; c.lineWidth = 4; c.beginPath(); c.arc(x, base - 28, 34 + 3 * Math.sin(t * 6), 0, Math.PI * 2); c.stroke(); c.globalAlpha = a; } } });
  c.restore(); }

function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay, zz = Math.max(z, 0.9);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
  S.ground(c, t, cm, { tint: PINK });
  const lf = lineFn(t);

  // ghosts of past saves, stacked behind the line (WHY)
  { const ga = win(t, PULL - 0.1, HOMES + 0.3, 0.8, 0.6); if (ga > 0) {
      const gl = [{ K: K.G1, F: [[0, 0], [20, 30], [0, 0]], t: -2 }, { K: K.G2, F: [[0, 0], [40, 40], [0, 0]], t: -1 }, { K: K.S0, F: FREE[0].v, t: ED[0] }, { K: K.A, F: FREE[1].v, t: ED[1] }, { K: K.Bk, F: FREE[2].v, t: ED[2] }, { K: K.Ck, F: FREE[3].v, t: ED[3] }];
      const vis = gl.filter(g => t >= g.t); vis.forEach((g, n) => { const age = vis.length - n, a = ga * ramp(t, g.t, g.t + 0.3) * (0.34 - 0.04 * age);
        c.strokeStyle = rgba(SOFT, Math.max(a, 0)); c.lineWidth = 1.8; c.beginPath();
        for (let x = XL; x <= -XL; x += 12) { const px = X(x), py = Y(shapeY(g.K, g.F, x) - 11 * age); x === XL ? c.moveTo(px, py) : c.lineTo(px, py); } c.stroke(); }); } }

  // the lab's line (CASE onward)
  const la = labA(t), ldx = labDX(t), docked = ramp(t, DOCK - 0.1, DOCK + 0.3);
  if (la > 0.001) { const pts = []; for (let x = 800; x <= 1600; x += 10) pts.push([X(x + ldx), Y(labY(x, t))]);
    c.save(); c.globalAlpha = la; c.fillStyle = PINK; c.beginPath(); c.moveTo(pts[0][0], Y(0)); pts.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(pts[pts.length - 1][0], Y(0)); c.closePath(); c.fill();
    c.strokeStyle = rgba(DSG, 0.3); c.lineWidth = 1.6; c.setLineDash([3, 9]); c.beginPath(); c.moveTo(X(800 + ldx), Y(0)); c.lineTo(X(1600 + ldx), Y(0)); c.stroke(); c.setLineDash([]);
    c.strokeStyle = DSG; c.lineWidth = 5 * zz; c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath(); pts.forEach(([x, y], j) => j ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    c.lineWidth = 4; c.globalAlpha = la * (1 - docked); c.beginPath(); c.moveTo(X(800 + ldx), Y(0) - 14 * z); c.lineTo(X(800 + ldx), Y(0) + 14 * z); c.stroke();
    c.globalAlpha = la; c.beginPath(); c.moveTo(X(1600 + ldx), Y(0) - 14 * z); c.lineTo(X(1600 + ldx), Y(0) + 14 * z); c.stroke(); c.restore(); }

  // the main line
  { const pts = []; for (let x = XL; x <= -XL + 0.01; x += 8) pts.push([X(x), Y(lf(x))]);
    c.strokeStyle = rgba(DSG, 0.3); c.lineWidth = 1.6; c.setLineDash([3, 9]); c.beginPath(); c.moveTo(X(XL), Y(0)); c.lineTo(X(-XL), Y(0)); c.stroke(); c.setLineDash([]);
    c.fillStyle = PINK; c.beginPath(); c.moveTo(pts[0][0], Y(0)); pts.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(pts[pts.length - 1][0], Y(0)); c.closePath(); c.fill();
    for (let i = 0; i < 3; i++) { const ia = ramp(t, TAP[i] + 0.1, TAP[i] + 0.5, EASE.warm); if (ia <= 0) continue;
      c.strokeStyle = rgba(C.slate, 0.4 * ia); c.lineWidth = 1.6; c.setLineDash([2, 5]); c.beginPath(); c.moveTo(X(PINX[i]), Y(lf(PINX[i])) + 40 * z); c.lineTo(X(PINX[i]), Y(118) - 26 * zz); c.stroke(); c.setLineDash([]); }
    c.strokeStyle = DSG; c.lineWidth = 5 * zz; c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath(); pts.forEach(([x, y], j) => j ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    c.lineWidth = 4; c.beginPath(); c.moveTo(X(XL), Y(0) - 14 * z); c.lineTo(X(XL), Y(0) + 14 * z); c.stroke();
    c.save(); c.globalAlpha = 1 - docked; c.beginPath(); c.moveTo(X(-XL), Y(0) - 14 * z); c.lineTo(X(-XL), Y(0) + 14 * z); c.stroke(); c.restore(); }

  // where the dots should be (end of WHY): soft dashed homes
  { const ha = win(t, HOMES, TAP[2] + 0.3, 0.45, 0.3); if (ha > 0) for (let i = 0; i < 3; i++) { const hk = 1 - pinned(i, t); if (hk <= 0) continue;
      c.save(); c.globalAlpha = ha * hk; c.strokeStyle = DSG; c.lineWidth = 2.6; c.setLineDash([5, 6]); c.beginPath(); c.arc(X(PINX[i]), Y(0), (17 + 3 * Math.sin(t * 3 + i)) * z, 0, Math.PI * 2); c.stroke();
      c.setLineDash([]); c.globalAlpha = ha * hk * 0.18; c.fillStyle = DSG; c.beginPath(); c.arc(X(PINX[i]), Y(0), 30 * z, 0, Math.PI * 2); c.fill(); c.restore(); } }
  // the tug: a ghost of the home and a copper line to where the pin was dragged
  { const tg = tug(t); if (tg > 0.5) { const hx = X(0), hy = Y(0), py = Y(lf(0)), k = clamp(tg / 12);
      c.save(); c.globalAlpha = k; c.strokeStyle = DSG; c.lineWidth = 2.4; c.setLineDash([4, 5]); c.beginPath(); c.arc(hx, hy, 18 * z, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = COP; c.lineWidth = 4; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(hx, hy + 18 * z); c.lineTo(hx, Math.max(hy + 18 * z, py - 18 * z)); c.stroke(); c.restore(); } }

  // threads (links)
  const landGlow = win(t, LAND - 0.15, LAND + 1.4, 0.1, 0.8);
  for (let i = 0; i < 4; i++) { const g = thread(i, t, lf), re = win(t, TH[i].re + 0.1, TH[i].re + 0.9, 0.08, 0.6);
    drawThread(c, g, X, Y, z, t); if (re > 0) drawThread(c, g, X, Y, z, t, { col: rgba(DSG, 0.85 * re), w: 4.4 });
    if (i === 0 && landGlow > 0) drawThread(c, g, X, Y, z, t, { col: rgba(DSG, 0.9 * landGlow), w: 5 }); }
  for (const L of LTH) { const d = ramp(t, L.t, L.t + 0.7, EASE.warm); if (d <= 0) continue; const S0 = labDot(L.from, t), E0 = dotTop(lf, L.to), Sp = { x: S0.x, y: S0.y - 14 };
    const g = { S: Sp, E: E0, Cc: { x: (Sp.x + E0.x) / 2, y: Math.min(Sp.y, E0.y) - 2 * L.h }, umax: 1, k: 0 }; drawThread(c, g, X, Y, z, t, { draw: d }); }

  // sounding rings and flashes
  for (const ck of CHECKS) { const r = (t - ck.t) * RING_V; if (r < 0 || t > ck.end + 0.5) continue; const ox = X(ck.o.x), oy = Y(ck.o.y), fade = clamp(1 - (t - ck.t) / (ck.end - ck.t + 0.5));
    c.strokeStyle = rgba(INK, 0.4 * fade); c.lineWidth = 2.4; c.beginPath(); c.arc(ox, oy, r * z, 0, Math.PI * 2); c.stroke();
    if (r > 50) { c.strokeStyle = rgba(INK, 0.16 * fade); c.lineWidth = 1.6; c.beginPath(); c.arc(ox, oy, (r - 50) * z, 0, Math.PI * 2); c.stroke(); }
    for (const h of ck.hits) { const u = (t - h.t) / (h.bad ? 0.7 : 0.45); if (u < 0 || u > 1) continue; const hp = h.id[0] === 'p' ? { x: PINX[+h.id[1]], y: lf(PINX[+h.id[1]]) } : labDot(+h.id[1], t);
      c.strokeStyle = rgba(h.bad ? COP : DSG, (1 - u) * 0.9); c.lineWidth = h.bad ? 5 : 4; c.beginPath(); c.arc(X(hp.x), Y(hp.y), (30 + (h.bad ? 46 : 28) * EASE.glaser(u)) * z, 0, Math.PI * 2); c.stroke(); } }

  // dots → pins
  const sh = win(t, SH0 - 0.1, SH2, 0.1, 0.4);
  for (let i = 0; i < 3; i++) { const d = lf.dots[i], bad = i === 1 && tug(t) > 20; drawPin(c, X(d.x), Y(d.y), zz, pinned(i, t), { ring: 0.7 + 0.3 * sh, ringCol: bad ? COP : DSG }); }
  if (la > 0.001) for (let i = 0; i < 2; i++) { const d = labDot(i, t), pu = win(t, LAB[i] + 0.15, LAB[i] + 1.3, 0.12, 0.6);
    c.save(); c.globalAlpha = la; c.lineWidth = 4 * zz; c.strokeStyle = DSG; c.fillStyle = GROUND; c.beginPath(); c.arc(X(d.x), Y(d.y), 13 * zz, 0, Math.PI * 2); c.fill(); c.stroke();
    // its source tick, on a stalk above the dot
    const sx = X(d.x) + 24 * zz, sy = Y(d.y) - 30 * zz; c.lineCap = 'round'; c.lineWidth = (4 + 3 * pu) * zz; c.beginPath(); c.moveTo(sx, sy - 13 * zz); c.lineTo(sx, sy + 6 * zz); c.stroke();
    c.fillStyle = DSG; c.beginPath(); c.arc(sx, sy + 9 * zz, (4 + 2 * pu) * zz, 0, Math.PI * 2); c.fill();
    if (pu > 0) { c.globalAlpha = la * pu * 0.8; c.lineWidth = 2.4; c.beginPath(); c.arc(sx, sy - 2 * zz, 24 * zz, 0, Math.PI * 2); c.stroke(); }
    c.restore(); }

  // what each pin keeps: icons under the pins (source · link · page); the link pin is labelled once
  { const gridK = ramp(t, GRID_T, GRID_T + 0.4, EASE.glaser) * (1 - ramp(t, PAN - 0.4, PAN, EASE.rest));
    ['source', 'link', 'page'].forEach((kind, i) => { const ia = ramp(t, TAP[i] + 0.1, TAP[i] + 0.5, EASE.warm) * (i === 0 ? 1 - Math.min(1, gridK * 3) : 1); iconChip(c, kind, X(PINX[i]), Y(118), z, ia); });
    const lab = ra(t, 'label'); if (lab > 0) S.chip(c, LABR.text, X(0), Y(118) + 62 * zz + (1 - EASE.defer(clamp(lab))) * 8, { f: 'sans', size: 26, col: INK, a: lab, align: 'center', pad: 16, border: RULE });
    // LIMIT: the source tick opens into the atlas citation audit (60 ticks)
    if (gridK > 0.001) { const cx = X(PINX[0]), top = Y(118) - 23 * zz, wF = 520, hF = 236, w = lerp(46, wF, gridK), h = lerp(46, hF, gridK);
      c.save(); c.fillStyle = C.paper; c.strokeStyle = RULE; c.lineWidth = 1.8; c.beginPath(); c.roundRect(cx - w / 2, top, w, h, 10); c.fill(); c.stroke(); c.restore();
      const ta = ramp(gridK, 0.7, 1, lin); if (ta > 0) { const gx = cx - wF / 2 + 34, gy = top + 34;
        for (const q of AUD) { const k = ramp(t, q.t, q.t + 0.18, EASE.glaser); const col = q.i % 10, row = Math.floor(q.i / 10), x = gx + col * 25, y = gy + row * 22;
          c.save(); c.globalAlpha = ta; c.lineCap = 'round'; c.lineWidth = 4.5; c.strokeStyle = k > 0.01 ? (q.bad ? COP : DSG) : mix(C.paper, C.slate, 0.25);
          c.beginPath(); c.moveTo(x, y + 14); c.lineTo(x, y + 14 - 14 * Math.max(k, 0.35)); c.stroke(); c.restore(); }
        const aa = ra(t, 'audit'); if (aa > 0) { text(c, 'Atlas citation audit', gx + 264, gy + 20, { f: 'sans', size: 24, col: SOFT, a: aa });
          text(c, '47 of 60', gx + 264, gy + 70, { f: 'monoB', size: 34, col: INK, a: aa, track: 0.02 }); text(c, 'faithful', gx + 264, gy + 106, { f: 'sans', size: 24, col: SOFT, a: aa }); } } } }

  // the pod
  { const p = podState(t); if (p) { const ang = podAng(t); c.save(); c.translate(X(p.x), Y(p.y)); c.rotate(ang); KH.drawPod(c, 0, 0, 0, 54 * zz, MIST, { ink: INK }); c.restore();
      const pulse = p.chip === 'x' ? win(t, POD_PULSE, POD_PULSE + 0.9, 0.08, 0.7) : 0;
      podChip(c, p.chip, X(p.x), Y(p.y) - 56 * zz, zz, p.ca);
      if (pulse > 0) { c.save(); c.strokeStyle = rgba(COP, 0.8 * pulse); c.lineWidth = 3; c.beginPath(); c.arc(X(p.x), Y(p.y) - 56 * zz, (26 + 16 * (1 - pulse)) * zz, 0, Math.PI * 2); c.stroke(); c.restore(); } } }

  // the whale
  { const p = wpos(t), f = facing(t), ang = heading(t), v = wvel(t), sp = Math.hypot(v.x, v.y), still = sp < 60;
    let blink = 0; for (const b of [2.6, 6.4, 12.2, 16.3, 21.0, 34.0, 39.5, 47.6, 57.3, 59.2]) blink = Math.max(blink, 1 - Math.abs(t - b) / 0.07);
    const focus = Math.max(win(t, POD_X - 0.2, POD_OUT + 0.9, 0.2, 0.3), win(t, ED[0] - 0.2, HOMES, 0.2, 0.3), win(t, 18.6, TAP[2] + 0.4, 0.2, 0.3), win(t, GRID_T, NOT_T, 0.2, 0.3));
    const alarm = win(t, TUG0 + 0.3, REP, 0.12, 0.2), shock = win(t, BUMP, BUMP + 0.9, 0.05, 0.4), delight = t > POD_OK + 0.05 ? 1 : 0, spark = win(t, POD_OK + 0.1, POD_OK + 1.35, 0.12, 0.45);
    const tf = still ? 3 : 11;
    c.save(); c.translate(X(p.x), Y(p.y)); if (f < 0) c.scale(-1, 1);
    KH.drawWhale(c, { x: 0, y: 0, ang, scale: 0.54 * zz, L: 1, tail: Math.sin(t * tf) * (still ? 0.12 : 0.34), fin: Math.sin(t * tf + 1.3) * 0.3, blink,
      focus: focus * (1 - alarm), eye: 1 + 0.25 * alarm + 0.3 * shock + 0.2 * spark, delight, blush: 0.55, mouth: delight ? 0.4 : 0.3 * alarm + 0.25 * shock,
      spark, sparkColor: DSG, sparkScale: 1.3, spray: 0.9 * win(t, POD_OK + 0.15, POD_OK + 1.6, 0.15, 0.6), squash: squash(t) });
    c.restore(); }

  // title over a paper veil (the hinge)
  { const va = 0.8 * win(t, TITLE_IN - 0.25, TITLE_OUT + 0.1, 0.5, 0.55); if (va > 0) { c.fillStyle = rgba(GROUND, va); c.fillRect(0, 0, W, H); }
    S.open(c, t - (TITLE_IN - 0.25), EP, { out: 0.25 + (TITLE_OUT - TITLE_IN) }); }

  panel(c, t);
  // the three-verb strip
  { const sa = ra(t, 'strip'); if (sa > 0) { const words = ['Pin', 'Check', 'Fix'], spans = [[STRIP_T, FE[0]], [FE[0], TUG0], [TUG0, LAST]]; let x = 156;
      words.forEach((w, i) => { const act = Math.max(win(t, spans[i][0], spans[i][1], 0.25, 0.25), t > LAST ? 1 : 0), wpx = w.length * 19.2;
        if (act < 1) text(c, w, x, 112, { f: 'mono', size: 24, col: INACT, a: sa * (1 - act) });
        if (act > 0) { text(c, w, x, 112, { f: 'monoB', size: 24, col: INK, a: sa * act });
          c.save(); c.globalAlpha = sa * act; c.fillStyle = DSG; c.fillRect(x, 126, wpx * EASE.glaser(act) - 4, 5); c.restore(); }
        x += wpx + 26; if (i < 2) { text(c, '·', x - 2, 112, { f: 'mono', size: 24, col: INACT, a: sa }); x += 34; } }); } }
  // the real run card
  { const a = ra(t, 'card'); if (a > 0) { const y0 = 836 + (1 - EASE.defer(clamp(a))) * 10, cw = 240, x0 = 960 - 2 * cw + 100;
      c.save(); c.globalAlpha = a; c.fillStyle = C.paper; c.beginPath(); c.roundRect(x0 - 236, y0 - 84, 4 * cw + 262, 158, 12); c.fill(); c.strokeStyle = RULE; c.lineWidth = 1.8; c.stroke();
      c.beginPath(); for (let k = 0; k < 4; k++) { c.moveTo(x0 + k * cw, y0 - 58); c.lineTo(x0 + k * cw, y0 + 50); } c.stroke(); c.restore();
      text(c, 'Real run', x0 - 212, y0 - 10, { f: 'mono', size: 22, col: SOFT, a, track: 0.12 });
      text(c, 'Memory graph map', x0 - 212, y0 + 26, { f: 'sans', size: 24, col: SOFT, a });
      CELLS.forEach(([v, l], k) => { text(c, v, x0 + k * cw + cw / 2, y0 + 4, { f: 'monoB', size: 56, col: INK, a, align: 'center', track: 0.0 });
        text(c, l, x0 + k * cw + cw / 2, y0 + 46, { f: 'sans', size: 24, col: SOFT, a, align: 'center' }); }); } }
  for (const r of CAPS) S.caption(c, t, r);
  S.lockup(c, t, LOCK, EP);
  const fb = 1 - ramp(t, 0, 0.35); if (fb > 0) { c.fillStyle = rgba(GROUND, fb); c.fillRect(0, 0, W, H); }
  c.restore();
}

// ---------- cues: every sound and every gate tag sits on an event ----------
function cues() {
  const E = [], e = (t, k, tags = [], o = {}) => E.push({ t: +t.toFixed(4), k, tags, ...o });
  e(BUMP, 'bump', ['consequence', 'focus']); e(FLUT, 'flutter', ['consequence']); e(POD_IN, 'podIn', ['consequence', 'focus']); e(POD_X, 'podX', ['consequence']);
  e(POD_PULSE, 'pulseX', []); e(POD_OUT, 'podOut', ['focus']);
  e(HINGE, 'hinge', ['hinge']); e(TITLE_IN, 'title', []); e(PULL, 'pull', ['focus']);
  ED.forEach((x, i) => e(x, 'edit', i === 0 ? ['focus'] : [], { i })); e(LOOK, 'look', ['focus']); e(HOMES, 'homes', ['focus']);
  TAP.forEach((x, i) => e(x, 'tap', ['mech', 'focus'], { i })); e(LABEL_T, 'label', ['mech']); e(STRIP_T, 'strip', ['mech']);
  FE.forEach((x, i) => e(x, 'pedit', ['mech'], { i })); e(TUG0, 'tug', ['mech', 'focus']); e(FIRE_T, 'stop', ['mech']); e(REP, 'repair', ['mech', 'focus']); e(LAST, 'pedit', ['mech'], { i: 3 });
  CHECKS.forEach(ck => { e(ck.t, 'check', []); ck.hits.forEach(h => e(h.t, 'hit', [], { bad: h.bad ? 1 : 0, id: h.id })); });
  ENTRIES.forEach(en => e(en.t, 'ledger', [], { fire: en.fire ? 1 : 0, quiet: en.quiet ? 1 : 0 }));
  e(GATE_OPEN, 'gateOpen', ['mech']);
  e(SLIDE, 'slide', ['focus']); e(DOCK, 'dock', ['focus']); e(CARD_T, 'card', []); LAB.forEach((x, i) => e(x, 'labDot', ['focus'], { i }));
  for (let q = SLIDE; q < bar(22) + 1e-6; q += B) e(q, 'pulse', []);
  e(PUSH, 'push', []); e(GRID_T, 'grid', ['limit', 'focus']); AUD.forEach(q => e(q.t, 'auditTick', q.bad ? ['limit'] : [], { bad: q.bad ? 1 : 0 }));
  e(PASS_T, 'pinsCalm', ['limit']); e(NOT_T, 'notThis', ['limit']);
  e(FOLLOW, 'follow', ['callback', 'focus']); e(LAND, 'land', ['focus']); e(POD2_IN, 'podIn2', []); e(POD_OK, 'podOk', ['focus']); e(POD2_OUT, 'podOut2', ['focus']);
  e(SH0, 'shake', []); e(SH1, 'shakeEnd', []); e(SH2, 'still', []); e(BELIEF, 'belief', []); e(LOCK, 'lockup', []);
  E.sort((p, q) => p.t - q.t);
  return { bpm: BPM, dur: DUR, acts: ACTS, ev: E };
}
const CONTRAST = [['title', INK, GROUND], ['title on veil', INK, VEILED], ['title accent', DSG, GROUND], ['eyebrow', SOFT, GROUND],
  ['strip active', INK, GROUND], ['strip inactive', INACT, GROUND], ['caption (chip)', INK, C.paper], ['label (chip)', INK, C.paper],
  ['card values', INK, C.paper], ['card labels', SOFT, C.paper], ['audit labels', SOFT, C.paper], ['audit count', INK, C.paper], ['lockup', SOFT, GROUND]];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, DUR, W, H, fps: 60, wpos, heading, cam, ACTS, TERMS, JARGON, BPM, SOLUTION_HINT, ENDING,
  shutter: t => (t > SH0 - 0.1 && t < SH2) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
