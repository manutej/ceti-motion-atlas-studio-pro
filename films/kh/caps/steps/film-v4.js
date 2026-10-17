// CETI Capabilities 10 · steps v4 — "Five small checks, not one." Kinetic Hydrography 1.0.0 + series layer. 30-s house format.
// Problem first: one big blurry question ("Is this email a scam?") puts one lamp into a wobbling maybe over a real bill.
// The move: the whale splits the big question into five small yes/no checks, each its own small gate with a lamp.
// A fake bill lights two clear yeses and one clear no, and the one no stops it. Real numbers sit only on a sourced card;
// the honest limit (a plain two-line rule scored nearly as well) is drawn as a third bar on the same card.
// Ending (five steady lamps): the real bill passes all five, every lamp stays lit, and it lands in your inbox.
// drawFrame(ctx, t) is a pure function of t.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, win, EASE, ramp, mix, rgba, text } = KH;
const W = 1920, H = 1080, BPM = 132, B = 60 / BPM, DUR = 29.85;
const INK = C.navy, SOFT = C.slate, SY = WD.sulpherYellow, OS = WD.ochraceousSalmon, PRU = WD.paleRawUmber, SLC = WD.slateColor, RUST = C.rust;
const BG = mix(C.paper, OS, 0.06);                          // what SERIES.ground paints with tint: ochraceous salmon
let ACC = OS; for (let k = 0; k <= 1; k += 0.05) { ACC = mix(OS, INK, k); if (KH.contrast(ACC, BG) >= 4.6 && KH.contrast(ACC, C.paper) >= 4.6) break; }
const LIT = mix(SY, OS, 0.45), LITRING = mix(PRU, INK, 0.15), YES = SLC, NO = RUST, OFFRING = mix(C.paper, C.slate, 0.45);
const WALL = mix(C.paper, C.slate, 0.16), HATCH = mix(C.paper, C.slate, 0.34), TRACK = mix(C.paper, C.slate, 0.5), CHIPB = mix(C.paper, C.slate, 0.4);

// ---------- geometry ----------
const GX = [-520, -260, 0, 260, 520], OA = 50, ENV_W = 130, ENV_H = 80, TRAYX = 740, TRAY_HW = 100, LINE_END = 640;
const QL = [['Known', 'sender?'], ['Real', 'link?'], ['Expected', 'bill?'], ['Usual', 'amount?'], ['No', 'rush?']], QS = QL.map(q => q.join(' '));
const BIG = { hw: 36, HH: 150, r: 54, chipW: 470, chipF: 44, lh: 0 }, SMALL = { hw: 22, HH: 112, r: 40, chipW: 190, chipF: 36, lh: 40 };   // small chips: two lines
const gateGeo = (s) => { const lampY = -s.HH - s.r - 12, base = lampY - s.r - (s.lh ? 24 : 34); return { ...s, lampY, base, top: base - s.chipF * 1.05 - s.lh, h: s.chipF * 1.5 + s.lh }; };
const GB = gateGeo(BIG), GS = gateGeo(SMALL);
const lerpGeo = (m) => { const o = {}; for (const k of ['hw', 'HH', 'r', 'chipW', 'chipF', 'lampY', 'base', 'top', 'h']) o[k] = lerp(GB[k], GS[k], m); return o; };

// ---------- timing (132 BPM grid) ----------
const T0 = 5.15, T_NUDGE = 8.2, T_SPLIT = 8.25, T_LAND = 9.35, T_Q = 9.15;
const splitM = (i, t) => ramp(t, T_SPLIT + 0.05 * Math.abs(i - 2), T_LAND + 0.05 * Math.abs(i - 2), EASE.warm);
const V = 260 / B;                                           // envelope speed: one check per beat (572 px/s)
const CK0 = 10.95, tA0 = CK0 - (GX[0] + 1000) / V;          // the fake bill: centre at gate 1 at CK0
const STOPX = GX[2] - GS.hw - ENV_W / 2 - 4, T_STOP = tA0 + (STOPX + 1000) / V;
const CHECK = [{ g: 0, t: CK0, ok: true }, { g: 1, t: CK0 + B, ok: true }, { g: 2, t: T_STOP, ok: false }];
const T_HELD = 13.55, T_RESET = 14.1;
const PY0 = 21.95, tR0 = PY0 - (GX[0] + 1000) / V;           // the real bill: centre at gate 1 at PY0
const PAY = GX.map((x, g) => ({ g, t: tR0 + (x + 1000) / V, ok: true }));
const T_TRAY = tR0 + (TRAYX - 40 + 1000) / V, T_TICK = T_TRAY + 0.08;
const T_CARD = 14.75, BAR = [[15.05, 15.8], [16.0, 16.8], [17.2, 18.0]], T_CARD_OUT = 21.3;
const T_LOCK = 27.65;

// ---------- the whale: Hermite through keys (zero tangents = it settles at each key) ----------
const WS = 1.0, REACH = 118 * WS;
const NUDGE = [-(BIG.chipW / 2) - REACH - 8, GB.top + GB.h / 2];
const K = [[0, -470, -250], [1.6, -470, -250], [3.0, -400, -285], [4.6, -455, -235], [7.45, -470, -250], [T_NUDGE, ...NUDGE], [8.4, ...NUDGE], [9.2, -300, -470], [9.5, -280, -440], [10.6, -280, -440], [11.55, -60, -440],
  [14.0, -60, -440], [15.25, 700, -400], [DUR + 1, 700, -400]];
function herm(P, t) { const n = P.length; if (t <= P[0][0]) return { x: P[0][1], y: P[0][2] }; if (t >= P[n - 1][0]) return { x: P[n - 1][1], y: P[n - 1][2] };
  let i = 0; while (P[i + 1][0] < t) i++; const p1 = P[i], p2 = P[i + 1], u = (t - p1[0]) / (p2[0] - p1[0]), A2 = 2 * u * u * u - 3 * u * u + 1, C2 = 1 - A2;
  return { x: A2 * p1[1] + C2 * p2[1], y: A2 * p1[2] + C2 * p2[2] }; }
const NODS = [1.3, T_NUDGE, CK0, CK0 + B, 17.6, ...PAY.map(p => p.t)];
function wworld(t) { const p = herm(K, t), q = herm(K, t + 0.01), sp = Math.hypot(q.x - p.x, q.y - p.y) * 100, still = 1 - clamp(sp / 150);
  let dip = 0; for (const s of NODS) { const d = t - s; if (d > 0 && d < 0.35) dip = Math.max(dip, 6 * Math.sin(Math.PI * d / 0.35)); }
  return { x: p.x, y: p.y + (Math.sin(t * 2.4) * 3 + dip) * still }; }
const wvel = t => { const a = wworld(t - 1 / 240), c = wworld(t + 1 / 240); return { x: (c.x - a.x) * 120, y: (c.y - a.y) * 120 }; };
function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
    a += (sp < 40 ? 0 : clamp(Math.atan2(v.y, Math.abs(v.x)), -0.8, 0.8) * clamp(sp / 300)) * w; s += w; } return a / s; }
const TURNS = [[15.45, -1], [23.75, 1]];                    // turns only while still: look back at the card, then at the inbox
function facing(t) { let f = 1; for (const [a, to] of TURNS) f = lerp(f, to, ramp(t, a, a + 0.25, EASE.warm)); return f; }
const wpos = t => wworld(t);

// ---------- camera: close on the maybe, pull back under the title, one push-in on the clear no, release, slow drift at the end ----------
function cam(t) {
  // FELT: close on the one big gate. ROW: the five small gates and the inbox. PUSH: on the clear no. CASE: pulled down under the card.
  const F = { z: 1.4, x: 0, y: -70, ay: 520 }, ROW = { z: 1.2, x: 110, y: 0, ay: 680 }, PUSH = { z: 1.38, x: -70, y: -40, ay: 680 }, CASE = { z: 1.05, x: 110, y: -80, ay: 680 };
  const L = (a, b, k) => ({ z: lerp(a.z, b.z, k), x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), ay: lerp(a.ay, b.ay, k) });
  let s = L(F, ROW, ramp(t, 5.23, 7.5, EASE.rest)); s = L(s, PUSH, ramp(t, 11.6, 12.35, EASE.warm)); s = L(s, CASE, ramp(t, 13.7, 14.8, EASE.warm)); s = L(s, ROW, ramp(t, 20.95, 21.85, EASE.warm));
  const end = ramp(t, 24.3, DUR, EASE.rest);
  return { x: s.x, y: s.y - 20 * end, z: s.z + 0.04 * end, ax: 960, ay: s.ay }; }

// ---------- text ----------
const cap = (id, inn, out, text) => ({ id, kind: 'caption', in: inn, out, fi: 0.25, fo: 0.2, text });
const lab = (id, inn, out, text, o = {}) => ({ id, kind: 'label', in: inn, out, fi: 0.3, fo: 0.3, text, ...o });
const READ = [
  lab('qbig', 0.3, T_NUDGE + 0.2, 'Is this email a scam?', { fo: 0.15 }),
  lab('env1', 0.4, 6.8, 'Real bill'),
  lab('you', 0.5, 5.2, 'you'),
  lab('checker', 0.5, 5.2, 'the AI checker'),
  cap('felt1', 0.25, 2.75, 'We asked one big question.'),
  cap('felt2', 2.80, 5.30, 'Is this real? It says: maybe.'),
  { id: 'eyebrow', kind: 'label', in: T0 + 0.25, out: T0 + 2.47, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 10' },
  { id: 'title', kind: 'title', in: T0 + 0.25, out: T0 + 2.47, fi: 0.4, fo: 0.45, text: 'Five small <i>checks</i>, not one.' },
  cap('split', 7.75, 10.2, 'Split the question into five small checks.'),
  ...QS.map((q, i) => lab('q' + i, T_Q, DUR, q, { fi: 0.4, fo: 0 })),
  lab('example', 9.5, T_LOCK, 'Example checks', { fo: 0.5 }),
  lab('inbox', 7.8, DUR, 'Your inbox', { fo: 0 }),
  lab('env2', 10.05, 14.25, 'Fake bill', { fi: 0.2, fo: 0.4 }),
  cap('clear', 10.25, 12.5, 'Each check is a clear yes or no.'),
  cap('stop', 12.55, 14.5, 'One clear no stops the fake.'),
  { id: 'cardH', kind: 'label', card: true, in: T_CARD, out: T_CARD_OUT, fi: 0.3, fo: 0.3, text: 'Real test' },
  { id: 'cardM', kind: 'card', card: true, in: T_CARD, out: T_CARD_OUT, fi: 0.3, fo: 0.3, text: 'Right answers, scam emails' },
  { id: 'cardA', kind: 'card', card: true, in: BAR[0][0], out: T_CARD_OUT, fi: 0.3, fo: 0.3, text: 'One big question 62.6%' },
  { id: 'cardB', kind: 'card', card: true, in: BAR[1][0], out: T_CARD_OUT, fi: 0.3, fo: 0.3, text: 'Five small questions 95.1%' },
  { id: 'src', kind: 'label', card: true, in: T_CARD, out: T_CARD_OUT, fi: 0.3, fo: 0.3, text: 'Source: our own tests', src: 'https://github.com/manutej/JEV-works' },
  { id: 'cardC', kind: 'card', card: true, in: BAR[2][0], out: T_CARD_OUT, fi: 0.3, fo: 0.3, text: 'A simple fixed rule 91.8%' },
  cap('notmagic', 17.45, 19.0, 'Not magic.'),
  cap('limit', 19.05, 21.3, 'A simple rule did nearly as well.'),
  lab('env3', 21.15, DUR, 'Real bill', { fo: 0 }),
  cap('pay', 23.0, 25.3, 'Five clear lamps. The real bill gets through.'),
  cap('belief', 24.42, T_LOCK, 'Split the question until each answer is clear.'),
  { id: 'lockup', kind: 'label', in: T_LOCK, out: DUR, fi: 0.45, fo: 0, text: 'CETI · Capabilities · 10 · Steps' },
];
const RD = id => READ.find(r => r.id === id), RA = (t, id) => { const r = RD(id); return win(t, r.in, r.out, r.fi, r.fo); };
const INTENT = {
  problem: 'Asking the AI checker one big question ("Is this email a scam?") about a real bill gives only a wobbly maybe: no clear yes, no clear no.',
  move: 'Split the big question into five small yes/no checks (known sender? real link? expected bill? usual amount? no rush?); each lamp gives a clear yes or no, and one clear no stops a fake.',
  belief: 'Split the question until each answer is clear. Not magic: a simple fixed rule did nearly as well (91.8% vs 95.1%).',
};
const TERMS = [];

// ---------- drawing helpers ----------
function chipRect(c, x, y, w, h, a, z) { c.save(); c.globalAlpha *= a; c.fillStyle = C.paper; c.strokeStyle = CHIPB; c.lineWidth = 1.5;
  c.beginPath(); c.roundRect(x, y, w, h, 7 * z); c.fill(); c.stroke(); c.restore(); }
function envelope(c, X, Y, z, label, a, stamp, rot = 0) {
  if (a <= 0.01) return; const w = ENV_W * z, h = ENV_H * z;
  c.save(); c.globalAlpha *= a; c.translate(X, Y); c.rotate(rot);
  c.fillStyle = C.paper; c.strokeStyle = INK; c.lineWidth = Math.max(3.5, 4 * z); c.lineJoin = 'round';
  c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 6 * z); c.fill(); c.stroke();
  c.lineWidth = Math.max(2.5, 3 * z); c.beginPath(); c.moveTo(-w / 2 + 4 * z, -h / 2 + 4 * z); c.lineTo(0, -h * 0.08); c.lineTo(w / 2 - 4 * z, -h / 2 + 4 * z); c.stroke();
  c.restore();
  c.save(); c.translate(X, Y); c.rotate(rot); text(c, label, 0, h * 0.36, { f: 'sans', size: 27 * z, col: INK, a, align: 'center' }); c.restore();
  if (stamp > 0.01) { const s = 1 + 0.4 * (1 - stamp), cx = X + w * 0.36, cy = Y - h * 0.42, R = 30 * z * s;
    c.save(); c.globalAlpha *= a * clamp(stamp * 2); c.fillStyle = C.paper; c.strokeStyle = NO; c.lineWidth = 5 * z; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill(); c.stroke();
    const m = R * 0.42; c.beginPath(); c.moveTo(cx - m, cy - m); c.lineTo(cx + m, cy + m); c.moveTo(cx + m, cy - m); c.lineTo(cx - m, cy + m); c.stroke(); c.restore(); }
}
function tickMark(c, cx, cy, m, col, lw) { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - m, cy + 1); c.lineTo(cx - m * 0.25, cy + m * 0.8); c.lineTo(cx + m * 1.05, cy - m * 0.9); c.stroke(); }
function crossMark(c, cx, cy, m, col, lw) { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - m, cy - m); c.lineTo(cx + m, cy + m); c.moveTo(cx + m, cy - m); c.lineTo(cx - m, cy + m); c.stroke(); }
// a lamp: state 'off' | 'yes' | 'no', with a pop at the moment it lights
function lamp(c, x, y, R, state, since, t, z, breathe = 0) {
  const pop = state === 'off' ? 1 : 1 + 0.22 * Math.exp(-(t - since) * 9), r = R * pop;
  if (state === 'yes') { const halo = 0.35 + 0.25 * Math.exp(-(t - since) * 3) + 0.12 * breathe;
    c.fillStyle = rgba(OS, halo); c.beginPath(); c.arc(x, y, r * 1.45, 0, Math.PI * 2); c.fill(); }
  if (state !== 'off') { const ring = Math.exp(-(t - since) * 4); if (ring > 0.02) { c.strokeStyle = rgba(state === 'yes' ? OS : NO, 0.6 * ring); c.lineWidth = 4 * z;
      c.beginPath(); c.arc(x, y, r * (1.2 + 0.8 * (1 - ring)), 0, Math.PI * 2); c.stroke(); } }
  c.fillStyle = state === 'yes' ? LIT : state === 'no' ? mix(C.paper, NO, 0.16) : C.paper;
  c.strokeStyle = state === 'yes' ? LITRING : state === 'no' ? NO : OFFRING; c.lineWidth = Math.max(4, 5 * z);
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.stroke();
  if (state === 'yes') tickMark(c, x, y, r * 0.42, YES, Math.max(5, r * 0.17));
  if (state === 'no') crossMark(c, x, y, r * 0.38, NO, Math.max(5, r * 0.17));
}
// the big lamp in a wobbling maybe: yes and no both half-there, smeared and jittering
function mushLamp(c, x, y, R, t, z, a) {
  if (a <= 0.01) return; const w = 0.5 + 0.5 * Math.sin(t * 7.3) * Math.cos(t * 2.9 + 0.7), jx = 7 * z * Math.sin(t * 23.1), jy = 5 * z * Math.cos(t * 17.7);
  c.save(); c.globalAlpha *= a;
  for (const [dx, dy, al] of [[-jx, -jy, 0.35], [jx * 0.6, jy * 0.6, 0.35]]) { c.strokeStyle = rgba(mix(OFFRING, LITRING, w), al); c.lineWidth = 6 * z; c.beginPath(); c.arc(x + dx, y + dy, R * 1.08, 0, Math.PI * 2); c.stroke(); }
  c.fillStyle = mix(C.paper, LIT, 0.3 + 0.45 * w); c.strokeStyle = mix(OFFRING, LITRING, w); c.lineWidth = 5 * z; c.beginPath(); c.arc(x + jx * 0.3, y + jy * 0.3, R, 0, Math.PI * 2); c.fill(); c.stroke();
  // a question mark (drawn as a mark, not text): neither yes nor no
  const qx = x + jx * 0.5, qy = y + jy * 0.5; c.strokeStyle = YES; c.lineWidth = R * 0.15; c.lineCap = 'round';
  c.beginPath(); c.arc(qx, qy - R * 0.2, R * 0.26, Math.PI * 1.02, Math.PI * 2.42); c.lineTo(qx, qy + R * 0.16); c.stroke();
  c.fillStyle = YES; c.beginPath(); c.arc(qx, qy + R * 0.44, R * 0.09, 0, Math.PI * 2); c.fill();
  c.restore(); }
// a gate: a wall with one opening on the line (hatched above and below)
function gateWall(c, X0, Y, z, g, shut) {
  const hw = Math.max(g.hw * z, 16), top = Y(-g.HH), bot = Y(g.HH), st = Y(-OA), sb = Y(OA);
  c.fillStyle = WALL; c.fillRect(X0 - hw, top, 2 * hw, st - top); c.fillRect(X0 - hw, sb, 2 * hw, bot - sb);
  c.save(); c.beginPath(); c.rect(X0 - hw, top, 2 * hw, st - top); c.rect(X0 - hw, sb, 2 * hw, bot - sb); c.clip(); c.strokeStyle = HATCH; c.lineWidth = 1.5; c.beginPath();
  for (let y = top - 2 * hw; y < bot + 2 * hw; y += 13) { c.moveTo(X0 - hw, y); c.lineTo(X0 + hw, y - 2 * hw); } c.stroke(); c.restore();
  c.fillStyle = mix(C.paper, OS, 0.14); c.fillRect(X0 - hw, st, 2 * hw, sb - st);
  if (shut > 0.02) { c.fillStyle = rgba(NO, 0.18 * shut); c.fillRect(X0 - hw, st, 2 * hw, sb - st); }
}
function gateFront(c, X0, Y, z, g, shut, lit) {
  const hw = Math.max(g.hw * z, 16), top = Y(-g.HH), bot = Y(g.HH), st = Y(-OA), sb = Y(OA), lw = Math.max(7, 8 * Math.min(z, 1.2));
  c.strokeStyle = mix(INK, LITRING, lit * 0.5); c.lineWidth = lw; c.beginPath();
  c.moveTo(X0 - hw, st); c.lineTo(X0 - hw, top); c.moveTo(X0 + hw, st); c.lineTo(X0 + hw, top); c.moveTo(X0 - hw, sb); c.lineTo(X0 - hw, bot); c.moveTo(X0 + hw, sb); c.lineTo(X0 + hw, bot);
  c.moveTo(X0 - hw, st); c.lineTo(X0 + hw, st); c.moveTo(X0 - hw, sb); c.lineTo(X0 + hw, sb); c.stroke();
  c.lineWidth = lw * 1.2; c.beginPath(); c.moveTo(X0 - hw - 14 * z, top); c.lineTo(X0 + hw + 14 * z, top); c.moveTo(X0 - hw - 10 * z, bot); c.lineTo(X0 + hw + 10 * z, bot); c.stroke();
  if (shut > 0.01) { c.strokeStyle = NO; c.lineWidth = lw * 1.4; c.beginPath(); c.moveTo(X0 - hw, st); c.lineTo(X0 - hw, lerp(st, sb, shut)); c.stroke(); }
}
// lamp state of small gate g at time t
function lampOf(g, t) { let st = 'off', since = 0, a = 1;
  if (t < T_RESET + 0.5) for (const e of CHECK) if (e.g === g && t >= e.t) { st = e.ok ? 'yes' : 'no'; since = e.t; a = 1 - ramp(t, T_RESET, T_RESET + 0.5, EASE.rest); }
  for (const e of PAY) if (e.g === g && t >= e.t) { st = 'yes'; since = e.t; a = 1; }
  return { st, since, a }; }
function fakeX(t) { const f = -1000 + V * (t - tA0), G = STOPX, s = 40; return f < G - s ? f : G - s * Math.exp(-(f - (G - s)) / s); }
function realX(t) { const f = -1000 + V * (t - tR0), G = TRAYX, s = 70; return f < G - s ? f : G - s * Math.exp(-(f - (G - s)) / s); }

function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay;
  S.ground(c, t, cm, { tint: OS });
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.lineCap = 'round'; c.lineJoin = 'round';

  // the line, ending at your inbox
  c.strokeStyle = TRACK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(X(-1600), Y(0)); c.lineTo(X(LINE_END), Y(0)); c.stroke();
  { const ta = ramp(t, 7.5, 8.1, EASE.warm); if (ta > 0) { const x0 = X(TRAYX - TRAY_HW), x1 = X(TRAYX + TRAY_HW), y0 = Y(-70), y1 = Y(76);
      c.save(); c.globalAlpha = ta; c.fillStyle = mix(C.paper, SY, 0.6); c.fillRect(x0, Y(-10), x1 - x0, y1 - Y(-10));
      c.strokeStyle = INK; c.lineWidth = Math.max(6, 7 * z); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.lineTo(x1, y1); c.lineTo(x1, y0); c.stroke(); c.restore(); } }

  // gates: one big one before the split, five small ones after
  const before = t < T_SPLIT, gates = before ? [{ x: 0, g: GB, i: -1 }] : GX.map((gx, i) => { const m = splitM(i, t); return { x: lerp(0, gx, m), g: lerpGeo(m), i, m }; });
  const shutOf = i => i === 2 ? ramp(t, T_STOP - 0.06, T_STOP + 0.12, EASE.glaser) * (1 - ramp(t, T_HELD + 0.4, T_HELD + 0.7, EASE.warm)) : 0;
  for (const G of gates) gateWall(c, X(G.x), Y, z, G.g, shutOf(G.i));

  // the envelopes
  { const a1 = 1 - ramp(t, 6.2, 6.8, EASE.rest); if (a1 > 0 && t > 0.3) { const x = lerp(-820, 0, ramp(t, 0.35, 1.3, EASE.warm)); envelope(c, X(x), Y(0), z, 'Real bill', a1 * clamp((t - 0.3) / 0.15), 0, 0.03 * Math.sin(t * 9) * win(t, 1.3, 5.3, 0.3, 0.3)); } }
  if (t > tA0 && t < T_HELD + 0.8) { const x = fakeX(t), held = ramp(t, T_HELD, T_HELD + 0.7, EASE.collect), shake = t > T_STOP ? 5 * Math.sin((t - T_STOP) * 40) * Math.exp(-(t - T_STOP) * 7) : 0;
    envelope(c, X(x + shake), Y(held * 40), z, 'Fake bill', (1 - held) * clamp((t - tA0) / 0.1), ramp(t, T_STOP + 0.05, T_STOP + 0.3, EASE.glaser)); }
  if (t > tR0) { const x = realX(t); envelope(c, X(x), Y(lerp(0, 8, ramp(t, T_TRAY - 0.1, T_TRAY + 0.3, EASE.warm))), z, 'Real bill', clamp((t - tR0) / 0.1), 0); }

  // gate fronts, lamps, question chips
  for (const G of gates) {
    const X0 = X(G.x), g = G.g; let lit = 0;
    gateFront(c, X0, Y, z, g, shutOf(G.i), 0);
    if (G.i < 0) { // the big gate: lamp in a wobbling maybe, the big question
      const R = g.r * z, ly = Y(g.lampY), aMush = 1 - ramp(t, T_NUDGE + 0.05, T_SPLIT + 0.1, EASE.rest);
      lamp(c, X0, ly, R, 'off', 0, t, z); mushLamp(c, X0, ly, R, t, z, aMush * ramp(t, 1.05, 1.4, EASE.warm));
      const cx = X0 - g.chipW / 2 * z, cy = Y(g.top); chipRect(c, cx, cy, g.chipW * z, g.h * z, 1, z);
      text(c, 'Is this email a scam?', X0, Y(g.base), { f: 'sans', size: g.chipF * z, col: INK, a: 1 - ramp(t, T_NUDGE, T_NUDGE + 0.1), align: 'center' });
      const fl = win(t, 7.65, 8.4, 0.3, 0.05); if (fl > 0.01) { c.save(); c.strokeStyle = rgba(SOFT, 0.8 * fl); c.lineWidth = 2.5; c.setLineDash([7, 6]); c.beginPath();
        for (let k = 1; k < 5; k++) { const fx = cx + g.chipW * z * k / 5; c.moveTo(fx, cy - 10 * z); c.lineTo(fx, cy + g.h * z + 10 * z); } c.stroke(); c.restore(); }
    } else {
      const L = lampOf(G.i, t), R = g.r * z, ly = Y(g.lampY), breathe = t > 23 ? 0.5 + 0.5 * Math.sin(t * 2.6 + G.i * 0.9) : 0;
      if (L.a < 1 && L.st !== 'off') { lamp(c, X0, ly, R, 'off', 0, t, z); c.save(); c.globalAlpha = L.a; lamp(c, X0, ly, R, L.st, L.since, t, z, breathe); c.restore(); }
      else lamp(c, X0, ly, R, L.st, L.since, t, z, breathe);
      // the chip: a slice of the big chip flying to its own gate, growing into a small chip with one question
      const m = G.m, sx = -GB.chipW / 2 + GB.chipW * G.i / 5, cw = lerp(GB.chipW / 5, g.chipW, m), cxw = lerp(sx, G.x - g.chipW / 2, m), cyw = lerp(GB.top, GS.top, m), chh = lerp(GB.h, GS.h, m);
      chipRect(c, X(cxw), Y(cyw), cw * z, chh * z, 1, z);
      const qa = RA(t, 'q' + G.i); if (qa > 0) QL[G.i].forEach((w, k) => text(c, w, X0, Y(GS.base - GS.lh * (1 - k)), { f: 'sans', size: GS.chipF * z, col: INK, a: qa, align: 'center' }));
    }
  }
  // actor labels (once): you, the checker, your inbox, and the honesty label under the row
  { const ca = RA(t, 'checker'); if (ca > 0) S.chip(c, 'the AI checker', X(GB.hw + 34), Y(118), { f: 'sans', size: 26 * z, col: SOFT, a: ca, pad: 10 });
    const ia = RA(t, 'inbox'); if (ia > 0) S.chip(c, 'Your inbox', X(TRAYX), Y(128), { f: 'sans', size: 30 * z, col: SOFT, a: ia, align: 'center', pad: 10 });
    const hide = Math.max(win(t, 11.5, 14.6, 0.35, 0.4), win(t, 17.0, 21.6, 0.35, 0.4));
    const ea = RA(t, 'example') * (1 - hide) * (1 - ramp(t, T_LOCK - 0.5, T_LOCK, EASE.rest)); if (ea > 0) text(c, 'Example checks', X(0), Y(178), { f: 'mono', size: 26 * z, col: SOFT, a: ea, align: 'center' }); }
  // your inbox answers ✓ when the real bill lands
  if (t >= T_TICK) { const a = ramp(t, T_TICK, T_TICK + 0.12), pop = 1 + 0.2 * Math.exp(-(t - T_TICK) * 8), cx = X(TRAYX), cy = Y(-150), R = 46 * z * pop;
    c.save(); c.globalAlpha = a; c.fillStyle = rgba(OS, 0.35); c.beginPath(); c.arc(cx, cy, R * 1.45, 0, Math.PI * 2); c.fill();
    c.fillStyle = C.paper; c.strokeStyle = LITRING; c.lineWidth = 5 * z; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill(); c.stroke(); tickMark(c, cx, cy, R * 0.42, YES, 8 * z); c.restore(); }

  // the real-test card (top centre, clean paper round it): two bars, then the honest third bar
  const ka = RA(t, 'cardH'); if (ka > 0) { const x0 = 350, y0 = 22 + (1 - EASE.defer(ramp(t, T_CARD, T_CARD + 0.35))) * 8, wd = 1040, ht = 400, bx = x0 + 500, bw = 380;
    c.save(); c.globalAlpha = ka; c.fillStyle = C.paper; c.strokeStyle = CHIPB; c.lineWidth = 1.2; c.beginPath(); c.roundRect(x0, y0, wd, ht, 8); c.fill(); c.stroke();
    c.fillStyle = OS; c.fillRect(x0, y0, 6, ht); c.restore();
    text(c, 'Real test', x0 + 40, y0 + 44, { f: 'mono', size: 24, col: SOFT, a: ka });
    text(c, 'Right answers, scam emails', x0 + 40, y0 + 96, { f: 'sans', size: 38, col: INK, a: RA(t, 'cardM') });
    const rows = [['cardA', 'One big question', 62.6, OFFRING, BAR[0]], ['cardB', 'Five small questions', 95.1, OS, BAR[1]], ['cardC', 'A simple fixed rule', 91.8, mix(PRU, C.paper, 0.2), BAR[2]]];
    rows.forEach(([id, label, v, col, [b0, b1]], k) => { const ra = RA(t, id); if (ra <= 0) return; const by = y0 + 172 + k * 68, p = ramp(t, b0 + 0.1, b1, EASE.warm), lx = x0 + 40 + (k === 2 ? 92 : 0);
      if (k === 2) { // a tiny two-line rule card, so "a simple fixed rule" is a thing you can see
        const rx = x0 + 40, ry = by - 44, pop = 1 + 0.15 * Math.exp(-(t - b0) * 8); c.save(); c.globalAlpha = ra; c.translate(rx + 38, ry + 27); c.scale(pop, pop);
        c.fillStyle = C.paper; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.roundRect(-38, -27, 76, 54, 5); c.fill(); c.stroke();
        c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-26, -9); c.lineTo(24, -9); c.moveTo(-26, 9); c.lineTo(8, 9); c.stroke(); c.restore(); }
      text(c, label, lx, by, { f: 'sans', size: 36, col: INK, a: ra });
      c.save(); c.globalAlpha = ra; c.fillStyle = mix(C.paper, C.slate, 0.1); c.fillRect(bx, by - 30, bw, 34); c.fillStyle = col; c.fillRect(bx, by - 30, bw * v / 100 * p, 34); c.restore();
      text(c, v.toFixed(1) + '%', bx + bw * v / 100 * p + 14, by + 2, { f: 'disp', size: 48, col: INK, a: ra * ramp(t, b1 - 0.25, b1, EASE.warm) }); });
    text(c, 'Source: our own tests', x0 + 40, y0 + ht - 26, { f: 'sans', size: 30, col: SOFT, a: RA(t, 'src') }); }

  // the little whale ("you")
  { const p = wworld(t), ang = heading(t), v = wvel(t), sp = Math.hypot(v.x, v.y), moving = clamp(sp / 400), f = facing(t);
    let blink = 0; for (const k of [1.9, 4.4, 10.0, 13.2, 16.4, 20.2, 25.9, 28.6]) blink = Math.max(blink, 1 - Math.abs(t - k) / 0.07);
    let squash = 0; for (const k of [T_NUDGE, T_STOP]) { const d = t - k; if (d >= 0 && d < 0.32) squash = Math.max(squash, 0.13 * (1 - EASE.glaser(d / 0.32))); }
    const focus = Math.max(win(t, 1.4, 5.0, 0.3, 0.3) * 0.7, win(t, 10.7, 11.7, 0.2, 0.15), win(t, 17.2, 20.9, 0.3, 0.3) * 0.7, win(t, 21.9, 23.9, 0.2, 0.2) * 0.5);
    const eye = 1 + 0.35 * win(t, T_STOP, T_STOP + 0.9, 0.06, 0.4);
    const delight = t > T_TICK + 0.05 ? 1 : (t > T_LAND && t < T_LAND + 0.8 ? 1 : 0), spark = Math.max(win(t, T_TICK, T_TICK + 1.3, 0.12, 0.5), win(t, T_STOP + 0.4, T_STOP + 1.2, 0.1, 0.3) * 0.0);
    c.save(); c.translate(X(p.x), Y(p.y)); c.scale(f, 1);
    KH.drawWhale(c, { x: 0, y: 0, ang, scale: WS * z, L: 1, tail: Math.sin(t * (moving > 0.3 ? 11 : 3)) * lerp(0.12, 0.34, moving), fin: Math.sin(t * 6 + 1.3) * lerp(0.15, 0.3, moving),
      blink, squash, focus: delight ? 0 : focus, eye, spark, sparkColor: OS, delight, blush: 0.6, mouth: delight ? 0.4 : 0.3 * win(t, 2.9, 4.6, 0.1, 0.3), sw: 3.2 });
    c.restore();
    const ya = RA(t, 'you'); if (ya > 0) S.chip(c, 'you', X(p.x), Y(p.y + 100), { f: 'sans', size: 26 * z, col: SOFT, a: ya, align: 'center', pad: 10 }); }

  // the title hinge: the scene goes still under a paper veil
  const veil = win(t, T0 + 0.08, T0 + 2.55, 0.35, 0.4); if (veil > 0) { c.fillStyle = rgba(C.paper, 0.9 * veil); c.fillRect(0, 0, W, H); }

  for (const r of READ) if (r.kind === 'caption') S.caption(c, t, r, { size: 40 });
  S.open(c, t - T0, { no: '10', title: 'Five small <i>checks</i>, not one.', accent: ACC }, { out: 2.47 });
  S.lockup(c, t, T_LOCK, { no: '10', short: 'Steps' });
  c.restore();
}

function cues() {
  return { bpm: BPM, dur: DUR, envIn: 0.35, mush: 1.1, mushEnd: T_NUDGE, veil: T0 + 0.08, title: T0 + 0.25, unveil: T0 + 2.15,
    folds: 7.65, nudge: T_NUDGE, tear: T_SPLIT, land: GX.map((_, i) => T_LAND + 0.05 * Math.abs(i - 2)), questions: T_Q,
    fakeIn: tA0, check: CHECK.map(e => ({ t: e.t, g: e.g, ok: e.ok })), held: T_HELD, reset: T_RESET,
    card: T_CARD, bars: BAR.map(b => b[1]), limit: BAR[2][0], whaleMove: [7.45, 9.5, 14.0],
    pay: PAY.map(e => ({ t: e.t, g: e.g })), tray: T_TRAY, tick: T_TICK, belief: RD('belief').in, lockup: T_LOCK,
    tags: { consequence: [2.8], focus: [1.1, CK0, T_STOP, T_CARD, BAR[2][0], T_TICK], mech: [T_NUDGE, T_SPLIT, ...CHECK.map(e => e.t)], limit: [BAR[2][0]], hinge: [T0], callback: PAY.map(e => e.t) } }; }
const CONTRAST = [['captions / chips / card / question text (ink on paper)', INK, C.paper], ['title (ink on chart ground)', INK, BG], ['title accent on ground', ACC, BG],
  ['title accent on veiled ground (paper)', ACC, C.paper], ['eyebrow / lockup / example label (slate on ground)', SOFT, BG], ['actor chips + card header + source (slate on paper)', SOFT, C.paper],
  ['envelope label (ink on envelope paper)', INK, C.paper]];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, INTENT, TERMS, DUR, W, H, fps: 60, wpos, heading, cam,
  shutter: t => (t > 8.1 && t < 9.6) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
