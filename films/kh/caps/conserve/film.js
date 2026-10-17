// CETI Capabilities 04 · conserve — "Change everything but the laws." Kinetic Hydrography 1.0.0 + series layer.
// One line over the chart. Content (Seashell Pink) bends freely; three pins (Deep Slate Green, the laws) never move.
// Content is a sum of sine modes on each 400 px segment, so once the pins are in, every shape passes through them.
// drawFrame(ctx, t) is a pure function of t.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, smoothstep, win, EASE, ramp, mix, rgba, text } = KH;
const W = 1920, H = 1080, BPM = 124, B = 60 / BPM, DUR = 28, beat = n => n * B;
const PINK = WD.seashellPink, DSG = WD.deepSlateGreen, INK = C.navy, SOFT = C.slate, COP = C.copper;
const GROUND = mix(C.paper, PINK, 0.06), OVERCOL = mix(COP, INK, 0.45), RULE = mix(C.paper, C.slate, 0.35);
const XL = -800, SEG = 400, PINX = [-400, 0, 400], LIFT = 36, TAPLIFT = 72, AMP = 1.25;
const LABELS = ['No broken links', 'One page per thing', 'Every claim sourced'];
const EP = { no: '04', title: 'Change everything but the <i>laws</i>.', accent: DSG, short: 'Conserve' };
const lin = u => u;

// ---------- content: per-segment sine modes [a, b, c] (px, + is down) ----------
const K = {
  S0: [[-20, 0, 0], [25, 0, 0], [-20, 0, 0], [15, 0, 0]],
  A: [[60, 0, 0], [-70, 30, 0], [40, 0, 0], [-50, 20, 0]],
  B: [[-50, 30, 0], [45, 0, 0], [-70, 0, 20], [60, 0, 0]],
  C: [[40, 0, -20], [-60, 40, 0], [55, 0, 0], [-40, 30, 0]],
  D: [[-60, 0, 0], [50, -40, 0], [-45, 0, 25], [55, 0, 0]],
  E: [[50, 0, 0], [-40, 0, 25], [40, 0, 0], [-60, 30, 0]],
  F: [[-35, 0, 0], [-25, 0, 0], [45, 0, 0], [35, 0, 0]],
  G: [[-40, 20, 0], [60, 0, 0], [-70, 0, 25], [50, -25, 0]],
  FL: [[8, 0, 0], [-8, 0, 0], [8, 0, 0], [-8, 0, 0]],
  HH: [[-28, 0, 0], [28, 0, 0], [-28, 0, 0], [28, 0, 0]],
};
// the whale lands, then the line gives under its weight (morph starts on the landing)
const L = { a: beat(6), b: beat(7.5), c: beat(9), d: beat(15.5), e: beat(17.5), f: beat(20.5), g: beat(29) };
const EDITS = [{ t: -1, K: K.S0 }, { t: L.a, K: K.A }, { t: L.b, K: K.B }, { t: L.c, K: K.C }, { t: L.d, K: K.D }, { t: L.e, K: K.E }, { t: L.f, K: K.F },
  { t: L.g, K: K.G }, { t: 16.2, K: K.FL, d: 0.6 }, { t: beat(39.5) + 0.02, K: K.HH, d: 0.95, e: EASE.rest }];
// before the laws exist, every edit also drags the three dots off their homes: [sx, d] per dot
const FREE = [{ t: -1, v: [[0, 0], [0, 0], [0, 0]] }, { t: L.a, v: [[-30, 35], [25, -30], [-20, 25]] }, { t: L.b, v: [[-55, -25], [55, 40], [-35, -35]] }, { t: L.c, v: [[-80, 45], [75, -50], [-55, -20]] }];
const TAP = [beat(11.5), beat(12.5), beat(13.5)];
const pinned = (i, t) => ramp(t, TAP[i], TAP[i] + 0.3, EASE.glaser);
function morph(list, t, key) { let i = 0; while (i + 1 < list.length && list[i + 1].t <= t) i++;
  const e = list[i]; if (i === 0) return e[key]; const p = list[i - 1][key], k = (e.e || EASE.glaser)(clamp((t - e.t) / (e.d || 0.6)));
  return e[key].map((row, j) => row.map((v, m) => lerp(p[j][m], v, k))); }
// the tug: a heavy hop drags the middle pin off its home; repair snaps it back
const TUG0 = L.f + 0.04, REP = beat(25), TUGPX = 58, BUDGET = 0.3;
const tug = t => TUGPX * EASE.warm(clamp((t - TUG0) / 0.75)) * (1 - ramp(t, REP, REP + 0.36, EASE.glaser));
const drift = t => tug(t) / TUGPX * 0.82;
const OVER0 = (() => { for (let t = TUG0; t < REP; t += 1 / 240) if (drift(t) > BUDGET) return t; return TUG0; })();
// the shake: every segment swings as a standing wave, two cycles per beat; nodes stay put
const SH0 = beat(35), SH1 = beat(39.5), SH2 = SH1 + 1.0, OM = 2 * Math.PI * 2 / B;
const shakeEnv = t => ramp(t, SH0, SH0 + 0.22, EASE.glaser) * (1 - ramp(t, SH1, SH2, EASE.rest));
const hat = dx => Math.abs(dx) < SEG ? (1 + Math.cos(Math.PI * dx / SEG)) / 2 : 0;
function lineFn(t) {
  const KK = morph(EDITS, t, 'K'), FV = morph(FREE, t, 'v'), F = FV.map((v, i) => { const k = 1 - pinned(i, t); return [v[0] * k, v[1] * k]; });
  const tg = tug(t), se = shakeEnv(t), p = OM * (t - SH0);
  const f = x => { const j = clamp(Math.floor((x - XL) / SEG), 0, 3), u = clamp((x - XL - j * SEG) / SEG), s = KK[j];
    const s1 = Math.sin(Math.PI * u), s2 = Math.sin(2 * Math.PI * u), s3 = Math.sin(3 * Math.PI * u);
    let y = AMP * (s[0] * s1 + s[1] * s2 + s[2] * s3);
    for (let i = 0; i < 3; i++) if (F[i][1]) y += F[i][1] * hat(x - PINX[i]);
    if (tg) y += tg * hat(x - PINX[1]);
    if (se > 0) y += se * (j === 0 ? 58 * Math.sin(p) * s1 : j === 1 ? 140 * Math.sin(p - 1.1) * s1 + 40 * Math.sin(2 * p + 0.4) * s2
      : j === 2 ? 150 * Math.sin(p - 2.2) * s1 + 50 * Math.sin(1.5 * p) * s3 : 120 * Math.sin(p - 3.3) * s1 + 60 * Math.sin(2 * p + 1) * s2);
    return y; };
  f.dots = F.map((v, i) => { const x = PINX[i] + v[0]; return { x, y: f(x) }; }); return f; }
const lineY = (x, t) => lineFn(t)(x);

// ---------- the whale's path: rides (perched on the line), flights (eased arcs) and hovers ----------
const PLAN = [
  { a: 1.8, b: L.a, to: { ride: -560 }, from: { x: -1300, y: -230 }, H: 30 },
  { a: L.a, b: L.a + 0.18, ride: -560, sq: 0.12 },
  { a: L.a + 0.18, b: L.b, to: { ride: -200 }, H: 80 },
  { a: L.b, b: L.b + 0.18, ride: -200, sq: 0.12 },
  { a: L.b + 0.18, b: L.c, to: { ride: 180 }, H: 80 },
  { a: L.c, b: 4.6, ride: 180, sq: 0.12 },
  { a: 4.6, b: TAP[0], to: { x: PINX[0], y: -TAPLIFT }, H: 70 },
  { a: TAP[0], b: TAP[1], to: { x: PINX[1], y: -TAPLIFT }, H: 55, e: lin, sq0: 0.08 },
  { a: TAP[1], b: TAP[2], to: { x: PINX[2], y: -TAPLIFT }, H: 55, e: lin, sq0: 0.08 },
  { a: TAP[2], b: L.d, to: { ride: 600 }, H: 110, sq0: 0.08 },
  { a: L.d, b: L.d + 0.24, ride: 600, sq: 0.12 },
  { a: L.d + 0.24, b: L.e, to: { ride: 200 }, H: 80 },
  { a: L.e, b: L.f - 0.7, ride: 200, sq: 0.12 },
  { a: L.f - 0.7, b: L.f, to: { ride: 110 }, H: 140 },
  { a: L.f, b: REP, ride: 110, sq: 0.22 },
  { a: REP, b: REP + 0.72, to: { x: 110, y: -170 }, H: 0 },
  { a: REP + 0.72, b: 13.3, hover: { x: 110, y: -170 } },
  { a: 13.3, b: L.g, to: { ride: -220 }, H: 40 },
  { a: L.g, b: 15.25, ride: -220, sq: 0.12 },
  { a: 15.25, b: 16.3, to: { x: -760, y: -150 }, H: 30 },
  { a: 16.3, b: 16.5, hover: { x: -760, y: -150 } },
  { a: 16.5, b: SH0, to: { ride: -600 }, H: 0, e: EASE.collect },
  { a: SH0, b: DUR + 1, ride: -600, sq: 0.2 },
];
function evalSeg(s, t) {
  if (s.ride != null) { const y = lineY(s.ride, t) - LIFT, br = smoothstep(SH2, SH2 + 0.7, t) * 2 * Math.sin(t * 2); return { x: s.ride, y: y + br }; }
  if (s.hover) return { x: s.hover.x, y: s.hover.y + 5 * Math.sin((t - s.a) * 2.6) };
  const u = (s.e || EASE.rest)(clamp((t - s.a) / (s.b - s.a)));
  return { x: lerp(s.from.x, s.to.x, u), y: lerp(s.from.y, s.to.y, u) - s.H * Math.sin(Math.PI * u) };
}
{ let face = 1;
  PLAN.forEach((s, i) => { if (s.to) { if (!s.from) s.from = evalSeg(PLAN[i - 1], s.a); s.to = s.to.ride != null ? { x: s.to.ride, y: lineY(s.to.ride, s.b) - LIFT } : s.to;
      if (Math.abs(s.to.x - s.from.x) > 20) face = Math.sign(s.to.x - s.from.x); } s.face = face; }); }
const segAt = t => { let i = 0; while (i + 1 < PLAN.length && PLAN[i + 1].a <= t) i++; return PLAN[i]; };
const wpos = t => { const s = segAt(t); return evalSeg(s, clamp(t, s.a, s.b)); };
const wvel = t => { const a = wpos(t - 1 / 240), b = wpos(t + 1 / 240); return { x: (b.x - a.x) * 120, y: (b.y - a.y) * 120 }; };
const facing = t => segAt(t).face;
const shakeMask = t => win(t, SH0 - 0.1, SH2, 0.1, 0.4);
function heading(t) { let a = 0, s = 0;
  for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9; a += clamp(Math.atan2(v.y, Math.abs(v.x) + 300), -0.7, 0.7) * clamp(Math.abs(v.x) / 150) * w; s += w; }
  const hs = 0.16 * Math.sin(OM * (t - SH0) + 0.6) * shakeEnv(t), m = shakeMask(t); return lerp(a / s, hs, m); }
const LANDS = PLAN.filter(s => s.sq).map(s => [s.a, s.sq]).concat(PLAN.filter(s => s.sq0).map(s => [s.a, s.sq0]));
const squash = t => LANDS.reduce((q, [a, w]) => q + (t >= a ? w * Math.exp(-(t - a) * 10) : 0), 0);

// ---------- checks: the whale sounds, a ring runs out, each pin flashes as it is reached ----------
const RING_V = 1700;
const CHECKS = [L.d + 0.3, L.e + 0.3, beat(21.5), beat(26), L.g + 0.3, beat(36), beat(37), beat(38), beat(39), beat(41.75)].map(tc => {
  const o = wpos(tc), lf = lineFn(tc);
  const hits = PINX.map((px, i) => { const py = lf(px), th = tc + Math.hypot(px - o.x, py - o.y) / RING_V; return { i, t: th, bad: i === 1 && drift(th) > BUDGET }; });
  return { t: tc, o, hits, end: Math.max(...hits.map(h => h.t)) };
});
const ENTRIES = [];
for (const ck of CHECKS) { const bad = ck.hits.find(h => h.bad); ENTRIES.push(bad ? { t: bad.t + 0.05, fire: true } : { t: ck.end + 0.08, fire: false }); }
ENTRIES.sort((a, b) => a.t - b.t);
const FIRE_T = ENTRIES.find(e => e.fire).t;

// ---------- camera ----------
function cam(t) {
  const push = ramp(t, 10.9, 12.0, EASE.rest) * (1 - ramp(t, 15.0, 16.4, EASE.rest)), park = ramp(t, 17.8, 19.0, EASE.rest);
  const z = 0.94 + 0.06 * ramp(t, 1.5, 5.0, EASE.rest) + 0.12 * push - 0.04 * ramp(t, 17.6, 19.0, EASE.rest);
  let fx = 0, s = 0; for (let k = 0; k <= 6; k++) { const w = 1 - k / 7; fx += wpos(t - k * 0.08).x * w; s += w; } fx /= s;
  const x = lerp(lerp(clamp(fx, -700, 700) * 0.08 * ramp(t, 1.8, 3.4, EASE.rest), 0, push), 0, park);
  return { x, y: 25 * push, z, ax: 960, ay: 575 };
}

// ---------- READ table ----------
const ST = [
  ['Change', 'Content moves freely.', 2.55, 5.45], ['Conserve', 'What must not change.', 5.6, 8.25], ['Measure', 'Count it every edit.', 8.4, 10.75],
  ['Budget', 'How much wobble allowed.', 10.9, 13.65], ['Repair', 'Fix before commit.', 13.8, 16.05], ['Ledger', 'Every fire written down.', 16.2, 19.05]];
const STATIONS = ST.map(([w, g, a, b], i) => ({ id: 's' + (i + 1), in: a, out: b, fi: 0.35, fo: 0.3, text: `${w}. ${g}`, word: w, gloss: g, n: i + 1 }));
const LAB1 = PINX.map((_, i) => ({ id: 'lab' + i, in: TAP[i] + 0.12, out: 16.3, fi: 0.3, fo: 0.3, text: LABELS[i] }));
const LAB2 = PINX.map((_, i) => ({ id: 'labB' + i, in: 22.65, out: 25.5, fi: 0.4, fo: 0.3, text: LABELS[i] }));
const EXAMPLE = { id: 'example', in: 16.75, out: 19.1, fi: 0.3, fo: 0.3, text: 'A real run · memory graph merge 548 entities · exact 0 · drift 0.0 · prov. 0.988' };
const OVERR = { id: 'over', in: OVER0, out: REP + 0.3, fi: 0.12, fo: 0.2, text: 'over' };
const NOT = { id: 'not', in: 22.35, out: 25.3, fi: 0.35, fo: 0.3, text: 'Noether-inspired — we choose the laws; no theorem is applied.' };
const END = { id: 'end', in: 25.35, out: DUR, fi: 0.35, fo: 0, text: 'Name what must never change. Check it on every edit.' };
const READ = [
  { id: 'eyebrow', in: 0.25, out: 2.5, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 04' },
  { id: 'title', in: 0.25, out: 2.5, fi: 0.4, fo: 0.45, text: 'Change everything but the laws.' },
  ...STATIONS, ...LAB1, OVERR, EXAMPLE, ...LAB2, NOT, END];

// ---------- drawing ----------
function drawPin(c, sx, sy, z, p, o = {}) {
  c.save(); c.lineWidth = 3 * z; c.strokeStyle = DSG;
  if (p < 1) { c.globalAlpha = (o.a ?? 1) * (1 - p); c.fillStyle = GROUND; c.beginPath(); c.arc(sx, sy, 10 * z, 0, Math.PI * 2); c.fill(); c.stroke(); }
  if (p > 0) { const g = EASE.glaser(p), R = lerp(44, 22, g) * z;
    c.globalAlpha = (o.a ?? 1) * p * (o.ring ?? 0.6); c.lineWidth = 1.6 * z; c.strokeStyle = o.ringCol || DSG; c.beginPath(); c.arc(sx, sy, R, 0, Math.PI * 2); c.stroke();
    c.beginPath(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; c.moveTo(sx + Math.cos(a) * (R + 3 * z), sy + Math.sin(a) * (R + 3 * z)); c.lineTo(sx + Math.cos(a) * (R + 11 * z), sy + Math.sin(a) * (R + 11 * z)); } c.stroke();
    c.globalAlpha = (o.a ?? 1) * p; c.fillStyle = DSG; c.beginPath(); c.arc(sx, sy, 11.5 * z * (0.6 + 0.4 * g), 0, Math.PI * 2); c.fill();
    c.fillStyle = C.paper; c.beginPath(); c.arc(sx, sy, 3.6 * z, 0, Math.PI * 2); c.fill(); }
  c.restore(); }

function panel(c, t) {
  const a = ramp(t, 8.3, 8.9, EASE.warm) * (1 - ramp(t, 25.3, 25.8, EASE.rest)); if (a <= 0.001) return;
  const X0 = 1372, Y0 = 72, PW = 400, PH = 166, bx = 1494, bw = 170, ba = ramp(t, 11.0, 11.5, EASE.glaser), dr = drift(t), over = dr > BUDGET;
  c.save(); c.globalAlpha = a; c.fillStyle = C.paper; c.beginPath(); c.roundRect(X0, Y0, PW, PH, 8); c.fill();
  const hl = win(t, 16.3, 19.0, 0.3, 0.4); c.strokeStyle = mix(RULE, INK, 0.5 * hl); c.lineWidth = 1.2 + hl; c.stroke(); c.restore();
  text(c, 'Drift', 1398, 113, { f: 'mono', size: 15, col: SOFT, a });
  c.save(); c.globalAlpha = a; c.fillStyle = mix(C.paper, C.slate, 0.14); c.fillRect(bx, 101, bw, 10);
  if (ba > 0) { c.fillStyle = rgba(mix(C.paper, DSG, 0.22), ba); c.fillRect(bx, 101, bw * BUDGET * ba, 10);
    c.strokeStyle = rgba(DSG, ba); c.lineWidth = 2; c.beginPath(); c.moveTo(bx + bw * BUDGET, 95); c.lineTo(bx + bw * BUDGET, 117); c.stroke(); }
  if (dr > 0.002) { c.fillStyle = over ? COP : DSG; c.fillRect(bx, 101, bw * dr, 10); }
  c.restore();
  if (ba > 0) text(c, 'budget', bx + bw * BUDGET, 136, { f: 'mono', size: 11, col: SOFT, a: a * ba, align: 'center', track: 0.12 });
  const zero = 1 - smoothstep(0.004, 0.03, dr), ov = win(t, OVERR.in, OVERR.out, OVERR.fi, OVERR.fo);
  if (zero > 0) text(c, '0.0', 1748, 115, { f: 'monoB', size: 21, col: INK, a: a * zero, align: 'right', track: 0.04 });
  if (ov > 0) text(c, 'over', 1748, 115, { f: 'monoB', size: 19, col: OVERCOL, a: a * ov, align: 'right', track: 0.08 });
  text(c, 'Ledger', 1398, 172, { f: 'mono', size: 15, col: SOFT, a });
  let n = 0, fires = 0;
  ENTRIES.forEach((e, i) => { if (t < e.t) return; n++; if (e.fire) fires++; const k = ramp(t, e.t, e.t + 0.25, EASE.glaser), x = bx + 8 + i * 17;
    c.save(); c.globalAlpha = a; c.lineCap = 'round'; c.strokeStyle = e.fire ? COP : INK; c.lineWidth = e.fire ? 4 : 3;
    c.beginPath(); c.moveTo(x, 176); c.lineTo(x, 176 - 22 * k); c.stroke();
    if (e.fire) { c.fillStyle = COP; c.beginPath(); c.arc(x, 176 - 22 * k - 6, 3.6 * k, 0, Math.PI * 2); c.fill();
      if (hl > 0) { c.globalAlpha = a * hl; c.lineWidth = 2; c.beginPath(); c.arc(x, 163, 18 + 2 * Math.sin(t * 6), 0, Math.PI * 2); c.stroke(); } }
    c.restore(); });
  text(c, `checks ${String(n).padStart(2, '0')} · fires ${fires}`, 1398, 216, { f: 'mono', size: 14, col: INK, a, track: 0.12 });
}

function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
  S.ground(c, t, cm, { tint: PINK });
  const lf = lineFn(t), dl = ramp(t, 1.9, 2.9, EASE.warm), xEnd = XL + 1600 * dl;
  if (dl > 0) {
    const pts = []; for (let x = XL; x <= xEnd + 0.01; x += 8) pts.push([X(x), Y(lf(x))]);
    if (pts.length < 2) pts.push([X(xEnd), Y(lf(xEnd))]);
    // baseline: the axis the laws sit on
    c.strokeStyle = rgba(DSG, 0.28); c.lineWidth = 1.4; c.setLineDash([3, 9]); c.beginPath(); c.moveTo(X(XL), Y(0)); c.lineTo(X(xEnd), Y(0)); c.stroke(); c.setLineDash([]);
    // content: seashell pink between the line and the axis
    c.fillStyle = PINK; c.beginPath(); c.moveTo(pts[0][0], Y(0)); pts.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(pts[pts.length - 1][0], Y(0)); c.closePath(); c.fill();
    // leaders to the pin labels
    for (let i = 0; i < 3; i++) { const la = Math.max(win(t, LAB1[i].in, LAB1[i].out, 0.3, 0.3), win(t, LAB2[i].in, LAB2[i].out, 0.4, 0.3)); if (la <= 0) continue;
      c.strokeStyle = rgba(C.slate, 0.45 * la); c.lineWidth = 1.2; c.setLineDash([2, 5]); c.beginPath(); c.moveTo(X(PINX[i]), Y(lf(PINX[i])) + 30 * z); c.lineTo(X(PINX[i]), Y(0) + 186 * z); c.stroke(); c.setLineDash([]); }
    c.strokeStyle = DSG; c.lineWidth = 4.5 * Math.max(z, 0.9); c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath(); pts.forEach(([x, y], j) => j ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    for (const ex of [XL, -XL]) if (ex <= xEnd) { c.lineWidth = 2.4; c.beginPath(); c.moveTo(X(ex), Y(0) - 12 * z); c.lineTo(X(ex), Y(0) + 12 * z); c.stroke(); }
  }
  // drift: a ghost of the home position and a copper line to where the pin was dragged
  const tg = tug(t);
  if (tg > 0.5) { const hx = X(0), hy = Y(0), px = Y(lf(0)), k = clamp(tg / 12);
    c.save(); c.globalAlpha = k; c.strokeStyle = DSG; c.lineWidth = 1.6; c.setLineDash([3, 5]); c.beginPath(); c.arc(hx, hy, 15 * z, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = COP; c.lineWidth = 3; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(hx, hy + 15 * z); c.lineTo(hx, px - 14 * z); c.stroke(); c.restore(); }
  // sounding rings and pin flashes
  for (const ck of CHECKS) { const r = (t - ck.t) * RING_V; if (r < 0 || t > ck.end + 0.5) continue; const ox = X(ck.o.x), oy = Y(ck.o.y), fade = clamp(1 - (t - ck.t) / (ck.end - ck.t + 0.5));
    c.strokeStyle = rgba(INK, 0.38 * fade); c.lineWidth = 1.8; c.beginPath(); c.arc(ox, oy, r * z, 0, Math.PI * 2); c.stroke();
    if (r > 50) { c.strokeStyle = rgba(INK, 0.16 * fade); c.beginPath(); c.arc(ox, oy, (r - 50) * z, 0, Math.PI * 2); c.stroke(); }
    for (const h of ck.hits) { const u = (t - h.t) / (h.bad ? 0.7 : 0.4); if (u < 0 || u > 1) continue;
      c.strokeStyle = rgba(h.bad ? COP : DSG, (1 - u) * 0.9); c.lineWidth = h.bad ? 3.5 : 2.6; c.beginPath(); c.arc(X(PINX[h.i]), Y(lf(PINX[h.i])), (24 + (h.bad ? 40 : 24) * EASE.glaser(u)) * z, 0, Math.PI * 2); c.stroke(); } }
  // dots → pins
  for (let i = 0; i < 3; i++) { const d = lf.dots[i], show = smoothstep(PINX[i] - 40, PINX[i] + 40, xEnd); if (show <= 0) continue;
    const bad = i === 1 && drift(t) > BUDGET;
    drawPin(c, X(d.x), Y(d.y), Math.max(z, 0.9), pinned(i, t), { a: show, ring: 0.6 + 0.4 * shakeMask(t), ringCol: bad ? COP : DSG }); }
  // pin labels
  for (let i = 0; i < 3; i++) { const la = Math.max(win(t, LAB1[i].in, LAB1[i].out, 0.3, 0.3), win(t, LAB2[i].in, LAB2[i].out, 0.4, 0.3)); if (la <= 0) continue;
    S.chip(c, LABELS[i], X(PINX[i]), Y(0) + 210 * z + (1 - EASE.defer(clamp(la))) * 8, { f: 'mono', size: 14, col: INK, a: la, align: 'center', pad: 10, border: RULE, track: 0.16 }); }

  // ---------- the whale ----------
  { const p = wpos(t), f = facing(t), ang = heading(t), v = wvel(t), sp = Math.hypot(v.x, v.y), still = sp < 60;
    let blink = 0; for (const b of [4.25, 9.3, 15.2, 18.1, 24.4, 26.6]) blink = Math.max(blink, 1 - Math.abs(t - b) / 0.07);
    const focus = Math.max(win(t, 5.5, 7.7, 0.2, 0.3), win(t, 8.8, 10.4, 0.2, 0.3), win(t, 13.7, 15.4, 0.2, 0.3));
    const alarm = win(t, OVER0, REP, 0.12, 0.2), delight = t > 22.62 ? 1 : 0, spark = win(t, 22.55, 23.8, 0.12, 0.45), sk = shakeMask(t);
    const tf = still ? 3 : 11;
    c.save(); c.translate(X(p.x), Y(p.y)); if (f < 0) c.scale(-1, 1);
    KH.drawWhale(c, { x: 0, y: 0, ang, scale: 0.5 * Math.max(z, 0.9), L: 1, tail: Math.sin(t * tf) * (still ? 0.12 : 0.34) * (1 - sk) + Math.sin(OM * (t - SH0)) * 0.3 * sk,
      fin: Math.sin(t * tf + 1.3) * 0.3, blink, focus: focus * (1 - alarm), eye: 1 + 0.25 * alarm + 0.2 * spark, delight, blush: 0.55,
      mouth: delight ? 0.4 : 0.35 * sk + 0.3 * alarm, spark, sparkColor: COP, sparkScale: 1.3, squash: squash(t) });
    c.restore(); }

  panel(c, t);
  // framed real example
  { const a = win(t, EXAMPLE.in, EXAMPLE.out, EXAMPLE.fi, EXAMPLE.fo); if (a > 0) { const y0 = 772 + (1 - EASE.defer(clamp(a))) * 8;
      c.save(); c.globalAlpha = a; c.fillStyle = C.paper; c.beginPath(); c.roundRect(960 - 380, y0 - 34, 760, 92, 8); c.fill(); c.strokeStyle = RULE; c.lineWidth = 1.2; c.stroke(); c.restore();
      text(c, 'A real run · memory graph merge', 960, y0, { f: 'mono', size: 13, col: SOFT, a, align: 'center' });
      text(c, '548 entities · exact 0 · drift 0.0 · prov. 0.988', 960, y0 + 38, { f: 'monoB', size: 19, col: INK, a, align: 'center', track: 0.06 }); } }
  // station words
  for (const s of STATIONS) { const o = win(t, s.in, s.out, s.fi, s.fo); if (o <= 0) continue; const dy = (1 - EASE.defer(clamp((t - s.in) / s.fi))) * 12;
    text(c, `0${s.n} / 06`, 162, 112 + dy, { f: 'mono', size: 14, col: SOFT, a: o });
    text(c, `<i>${s.word}.</i>`, 158, 196 + dy, { f: 'disp', size: 84, col: INK, accent: DSG, a: o });
    text(c, s.gloss, 162, 248 + dy, { f: 'sans', size: 30, col: SOFT, a: o }); }
  S.open(c, t, EP, { out: 2.5 });
  S.caption(c, t, NOT); S.caption(c, t, END);
  S.lockup(c, t, DUR - 2.2, EP);
  const fb = 1 - ramp(t, 0, 0.35); if (fb > 0) { c.fillStyle = rgba(GROUND, fb); c.fillRect(0, 0, W, H); }
  c.restore();
}

function cues() { return { bpm: BPM, dur: DUR, title: 0.25, draw: 1.9, stations: STATIONS.map(s => s.in), loose: [L.a, L.b, L.c], taps: TAP,
  edits: [L.d, L.e, L.g], tugLand: L.f, over: OVER0, repair: REP, flatten: 18.9, dive: SH0, shakeEnd: SH1, still: SH2, beats: Array.from({ length: 80 }, (_, i) => beat(i)).filter(x => x < DUR),
  checks: CHECKS.map(k => k.t), hits: CHECKS.flatMap(k => k.hits.map(h => [h.t, h.i, h.bad ? 1 : 0])), ledger: ENTRIES.map(e => [e.t, e.fire ? 1 : 0]), fire: FIRE_T,
  example: EXAMPLE.in, notThis: NOT.in, end: END.in, lockup: DUR - 2.2 }; }
const CONTRAST = [['title', INK, GROUND], ['title accent', DSG, GROUND], ['eyebrow', SOFT, GROUND], ['station word', DSG, GROUND], ['station gloss', SOFT, GROUND], ['station index', SOFT, GROUND],
  ['pin labels (chip)', INK, C.paper], ['panel labels', SOFT, C.paper], ['drift readout', INK, C.paper], ['over budget', OVERCOL, C.paper], ['ledger counts', INK, C.paper],
  ['example', INK, C.paper], ['example eyebrow', SOFT, C.paper], ['caption', INK, C.paper], ['lockup', SOFT, GROUND]];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, DUR, W, H, fps: 60, wpos, heading, cam, shutter: t => (t > SH0 - 0.1 && t < SH2) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
