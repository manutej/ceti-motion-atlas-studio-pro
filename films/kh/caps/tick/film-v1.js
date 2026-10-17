// CETI Capabilities 06 · tick — "Every step gets a tick." Kinetic Hydrography 1.0.0 + series layer. 25–30-s house format.
// Source: storyboards/c06/sb-06-03.json (jev-tape), cut to 30 s for a lay audience.
// The work is a refund in three steps (find order · pay refund · send email). The helper (the whale) does the steps;
// the customer is a coin jar. A crash after paying makes the retry pay again (two coins). The move: each finished step
// gets a tick in a box; after a crash the helper skips the ticked steps, so the refund is paid once.
// Limit: a wrong step (the coin misses the jar) gets a tick too. Ending: one coin after the crash.
// drawFrame(ctx, t) is a pure function of t. Every event below is a fixed time; nothing is carried between frames.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, win, EASE, ramp, mix, rgba, text } = KH;
const W = 1920, H = 1080, BPM = 128, DUR = 28.65;
const INK = C.navy, SOFT = C.slate, TYR = WD.darkTyrianBlue, RAW = WD.rawSienna, ECRU = WD.ecru, CIN = WD.vinaceousCinnamon, RUST = C.rust;
const BG = mix(C.paper, TYR, 0.06);                         // what SERIES.ground paints with tint: Dark Tyrian Blue
let ACC = TYR; for (let k = 0; k <= 1; k += 0.05) { ACC = mix(TYR, INK, k); if (KH.contrast(ACC, BG) >= 4.6 && KH.contrast(ACC, C.paper) >= 4.6) break; }
const TICK = mix(TYR, C.paper, 0.05), LINE = mix(C.paper, C.slate, 0.55), CARDLN = mix(C.paper, C.slate, 0.7), COINRIM = mix(RAW, INK, 0.35);

// ---------- layout (world units; camera z 1 = 1 px) ----------
const START = -680, SX = [-420, -60, 300], PERCH = -228, JX = 640, JTOP = -62, JBOT = 150, BOXY = 200, BOX = 92, CW = 224, CH = 240;
const LABEL = ['Find order', 'Pay refund', 'Send email'], BREAKX = 120;
const SLOT = [[598, 108], [682, 108]], STRAY = [500, 310];

// ---------- the story, as fixed events ----------
const WORK = [0.4, 1.0, 1.65, 3.6, 4.15, 9.15, 9.75, 10.4, 13.1, 15.8, 16.4, 17.05, 21.6, 22.2, 22.85, 25.5];
const WORKS = [0, 1, 2, 0, 1, 0, 1, 2, 2, 0, 1, 2, 0, 1, 2, 2];
const TICKS = [
  { s: 0, t: 9.3, gone: 14.9 }, { s: 1, t: 9.95, gone: 14.9 }, { s: 2, t: 13.25, gone: 14.9 },           // MOVE
  { s: 0, t: 15.95, gone: 20.95 }, { s: 1, t: 16.6, gone: 20.95 }, { s: 2, t: 17.2, gone: 20.95 },      // LIMIT
  { s: 0, t: 21.75 }, { s: 1, t: 22.4 }, { s: 2, t: 25.65 }];                                          // PAYOFF
const COINS = [{ t: 1.05, slot: 0, gone: 6.6 }, { t: 4.2, slot: 1, gone: 6.6 }, { t: 9.8, slot: 0, gone: 14.9 },
  { t: 16.45, wrong: true, gone: 20.95 }, { t: 22.25, slot: 0, lift: 25.85 }];
const FLY = 0.5;
const CRASH = [{ t: 1.95, heal: 3.1, id: 'crashA' }, { t: 10.65, heal: 11.75, id: 'crashB' }, { t: 23.1, heal: 24.2, id: 'crashE' }];
const ANS = [{ t: 4.75, ok: false, hold: 6.6 }, { t: 13.45, ok: true, hold: 14.9 }, { t: 17.35, ok: false, hold: 20.95 }, { t: 25.85, ok: true, hold: DUR + 1 }];
const READS = [[11.75, 0], [11.95, 1], [24.2, 0], [24.4, 1]], SKIPS = [[12.1, 13.05], [24.5, 25.45]];

// ---------- the whale (the helper): Hermite through keys, zero tangents = settles at each key ----------
const WS = 0.95, px = s => SX[s] - 20, P = (t, x) => [t, x, PERCH];
const K = [P(0, START), P(0.35, px(0)), P(0.6, px(0)), P(0.95, px(1)), P(1.25, px(1)), P(1.6, px(2)), P(1.95, px(2)), P(2.95, START), P(3.2, START),
  P(3.55, px(0)), P(3.75, px(0)), P(4.1, px(1)), P(6.6, px(1)), P(7.6, START), P(8.75, START),
  P(9.1, px(0)), P(9.35, px(0)), P(9.7, px(1)), P(10.0, px(1)), P(10.35, px(2)), P(10.65, px(2)), P(11.65, START), P(12.1, START), P(13.05, px(2)),
  P(14.4, px(2)), P(15.4, START), P(15.75, px(0)), P(16.0, px(0)), P(16.35, px(1)), P(16.65, px(1)), P(17.0, px(2)), P(20.0, px(2)), P(21.2, START),
  P(21.55, px(0)), P(21.8, px(0)), P(22.15, px(1)), P(22.45, px(1)), P(22.8, px(2)), P(23.1, px(2)), P(24.1, START), P(24.5, START), P(25.45, px(2)), P(DUR + 1, px(2))];
function herm(Q, t) { const n = Q.length; if (t <= Q[0][0]) return { x: Q[0][1], y: Q[0][2] }; if (t >= Q[n - 1][0]) return { x: Q[n - 1][1], y: Q[n - 1][2] };
  let i = 0; while (Q[i + 1][0] < t) i++; const a = Q[i], b = Q[i + 1], u = (t - a[0]) / (b[0] - a[0]), h = 2 * u * u * u - 3 * u * u + 1;
  return { x: h * a[1] + (1 - h) * b[1], y: h * a[2] + (1 - h) * b[2] }; }
// knocked back by a crash: a small lift on the way back (it is thrown, not swimming)
const knock = t => { let y = 0; for (const k of CRASH) { const u = (t - k.t) / 1.0; if (u > 0 && u < 1) y -= 46 * Math.sin(Math.PI * u); } return y; };
function wworld(t) { const p = herm(K, t), q = herm(K, t + 0.01), sp = Math.hypot(q.x - p.x, q.y - p.y) * 100, still = 1 - clamp(sp / 150);
  let dip = 0; for (const s of WORK) { const d = t - s; if (d > 0 && d < 0.3) dip = Math.max(dip, 12 * Math.sin(Math.PI * d / 0.3)); }
  return { x: p.x, y: p.y + knock(t) + (Math.sin(t * 2.4) * 2.5 + dip) * still }; }
const wvel = t => { const a = wworld(t - 1 / 240), c = wworld(t + 1 / 240); return { x: (c.x - a.x) * 120, y: (c.y - a.y) * 120 }; };
function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
    a += (sp < 40 ? 0 : clamp(Math.atan2(v.y, Math.abs(v.x)), -0.6, 0.6) * clamp(sp / 300)) * w; s += w; }
  let tumble = 0; for (const k of CRASH) { const u = (t - k.t) / 1.0; if (u > 0 && u < 1) tumble -= 0.55 * Math.sin(Math.PI * u); }   // tipped back while thrown
  return a / s + tumble; }
const wpos = t => wworld(t);

// ---------- camera: close on the pain, pull back under the title, push to the one coin, push to the wrong tick, close again ----------
function cam(t) {
  let z = 1.15, x = -45, y = -12; const L = (k, Z, X, Y) => { z = lerp(z, Z, k); x = lerp(x, X, k); y = lerp(y, Y, k); };
  L(ramp(t, 6.3, 7.6, EASE.rest), 1.1, -45, -12);
  L(ramp(t, 13.1, 14.0, EASE.warm), 1.35, 380, 40); L(ramp(t, 14.25, 15.15, EASE.warm), 1.1, -45, -12);
  L(ramp(t, 17.4, 18.3, EASE.warm), 1.35, 220, 120); L(ramp(t, 20.6, 21.6, EASE.warm), 1.15, -45, -12);
  return { x, y, z: z + 0.03 * ramp(t, 25.9, DUR, EASE.rest), ax: 960, ay: 540 }; }

// ---------- text (every word on screen is in READ) ----------
const T0 = 6.2, T_LOCK = 26.45;
const cap = (id, inn, out, text) => ({ id, kind: 'caption', in: inn, out, fi: 0.25, fo: 0.2, text });
const lab = (id, inn, out, text, o = {}) => ({ id, kind: 'label', in: inn, out, fi: 0.15, fo: 0.2, text, ...o });
const READ = [
  cap('what', 0.15, 2.1, 'A helper refunds a customer $20.'),
  cap('crash', 2.15, 4.25, 'The computer crashed before the last step.'),
  cap('twice', 4.3, 6.25, 'The retry sent the refund twice.'),
  { id: 'eyebrow', kind: 'label', in: T0 + 0.25, out: T0 + 2.47, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 06' },
  { id: 'title', kind: 'title', in: T0 + 0.25, out: T0 + 2.47, fi: 0.4, fo: 0.45, text: 'Every step gets a tick.' },
  cap('tick', 8.75, 10.75, 'Each finished step gets a tick.'),
  cap('skip', 10.8, 12.9, 'After a crash, skip the ticked steps.'),
  { id: 'cardTop', kind: 'label', in: 13.45, out: 17.05, fi: 0.3, fo: 0.3, text: 'Our own test' },
  { id: 'card', kind: 'card', card: true, in: 13.45, out: 17.05, fi: 0.3, fo: 0.3, text: 'Crashed on purpose: nothing done twice.', src: 'https://github.com/manutej/jev-tape' },
  { id: 'cardSrc', kind: 'label', in: 13.45, out: 17.05, fi: 0.3, fo: 0.3, text: 'Source: our own crash-test notes' },
  cap('limit', 17.1, 19.23, 'A wrong step gets a tick too.'),
  cap('notthis', 19.28, 21.28, 'A tick says done, not right.'),
  cap('belief', 24.4, T_LOCK - 0.05, 'Tick each step. Pay just once.'),
  { id: 'lockup', kind: 'label', in: T_LOCK, out: DUR, fi: 0.45, fo: 0, text: 'CETI · Capabilities · 06 · Tick' },
  // labels on the picture
  lab('who', 0.1, 1.9, 'Helper'),
  lab('cust', 0, DUR, 'Customer', { fi: 0 }),
  ...LABEL.map((s, i) => lab('st' + i, 0, DUR, s, { fi: 0 })),
  ...CRASH.map(k => lab(k.id, k.t, k.t + 1.1, 'Crash!', { fi: 0.08 })),
  lab('paidA1', 1.55, 4.72, 'Paid $20'), lab('paidA2', 4.72, 6.6, 'Paid $40', { fi: 0.08 }),
  lab('paidB', 10.3, 14.9, 'Paid $20'), lab('paidD', 17.35, 20.95, 'Paid $0'), lab('paidE', 22.75, DUR, 'Paid $20', { fo: 0 }),
];
const RD = id => READ.find(r => r.id === id), RA = (t, id) => { const r = RD(id); return win(t, r.in, r.out, r.fi, r.fo); };
// O1 · wide audience: what the lay jury should be able to say back from the contact sheet alone
const INTENT = {
  problem: 'A helper refunding a customer $20 crashed after paying but before the last step; the retry started over from the beginning and paid the $20 again ($40).',
  move: 'Each finished step gets a tick in a box. After a crash the helper skips the ticked steps and carries on from the first empty box, so the refund is paid once.',
  belief: 'Tick each step. Pay just once. (A tick says done, not right: a wrong step gets a tick too.)' };
const TERMS = [{ term: 'tick', pictured_at: 9.3 }];

// ---------- drawing helpers ----------
function coin(c, x, y, r, a = 1, glow = 0) { if (a <= 0) return; c.save(); c.globalAlpha *= a;
  if (glow > 0.02) { c.fillStyle = rgba(RAW, 0.25 * glow); c.beginPath(); c.arc(x, y, r * 1.6, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = RAW; c.strokeStyle = COINRIM; c.lineWidth = Math.max(4, r * 0.14); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.stroke();
  c.lineWidth = Math.max(2.5, r * 0.07); c.beginPath(); c.arc(x, y, r * 0.66, 0, Math.PI * 2); c.stroke();
  c.fillStyle = rgba(C.paper, 0.35); c.beginPath(); c.arc(x - r * 0.32, y - r * 0.32, r * 0.2, 0, Math.PI * 2); c.fill(); c.restore(); }
function icon(c, s, x, y, k, a) { c.save(); c.globalAlpha *= a; c.strokeStyle = INK; c.lineWidth = 4.5 * k; c.lineCap = 'round'; c.lineJoin = 'round';
  if (s === 0) { // a receipt with lines and a zigzag foot
    c.fillStyle = C.paper; c.beginPath(); c.moveTo(x - 26 * k, y - 34 * k); c.lineTo(x + 26 * k, y - 34 * k); c.lineTo(x + 26 * k, y + 30 * k);
    for (let i = 0; i < 4; i++) { c.lineTo(x + (19.5 - 13 * i) * k, y + 36 * k); c.lineTo(x + (13 - 13 * i) * k, y + 30 * k); } c.closePath(); c.fill(); c.stroke();
    c.lineWidth = 3.5 * k; c.beginPath(); for (const yy of [-20, -8, 4, 16]) { c.moveTo(x - 15 * k, y + yy * k); c.lineTo(x + (yy === 16 ? 2 : 15) * k, y + yy * k); } c.stroke(); }
  else if (s === 1) coin(c, x, y, 30 * k);
  else { // an envelope
    c.fillStyle = C.paper; c.beginPath(); c.rect(x - 36 * k, y - 24 * k, 72 * k, 48 * k); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x - 36 * k, y - 24 * k); c.lineTo(x, y + 4 * k); c.lineTo(x + 36 * k, y - 24 * k); c.stroke(); }
  c.restore(); }
function tickMark(c, x, y, s, p, a, col = TICK) { if (p <= 0 || a <= 0) return; const pts = [[-0.62, 0.02], [-0.18, 0.46], [0.66, -0.52]];
  const l1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), l2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]), d = p * (l1 + l2);
  c.save(); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = s * 0.16; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
  c.moveTo(x + pts[0][0] * s, y + pts[0][1] * s);
  if (d <= l1) { const u = d / l1; c.lineTo(x + lerp(pts[0][0], pts[1][0], u) * s, y + lerp(pts[0][1], pts[1][1], u) * s); }
  else { const u = (d - l1) / l2; c.lineTo(x + pts[1][0] * s, y + pts[1][1] * s); c.lineTo(x + lerp(pts[1][0], pts[2][0], u) * s, y + lerp(pts[1][1], pts[2][1], u) * s); }
  c.stroke(); c.restore(); }
const label = (c, t, id, x, y, size, o = {}) => { const a = RA(t, id); if (a > 0.01) S.chip(c, READ.find(r => r.id === id).text, x, y, { f: o.f || 'mono', size, col: INK, a: a * (o.a ?? 1), align: 'center', pad: 10, track: 0.08, border: o.border }); };

function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay;
  S.ground(c, t, cm, { tint: TYR });
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.lineCap = 'round'; c.lineJoin = 'round';

  // ---- the line (the job, left to right), broken while a crash lasts ----
  let brk = 0, cr = null; for (const k of CRASH) if (t >= k.t && t < k.heal + 0.3) { cr = k; brk = ramp(t, k.t, k.t + 0.12, EASE.glaser) * (1 - ramp(t, k.heal, k.heal + 0.3, EASE.warm)); }
  c.strokeStyle = LINE; c.lineWidth = Math.max(5, 5 * z);
  const g = 34 * brk; c.beginPath(); c.moveTo(X(START - 60), Y(0)); c.lineTo(X(BREAKX - g), Y(0)); c.moveTo(X(BREAKX + g), Y(0)); c.lineTo(X(JX - 80), Y(0)); c.stroke();
  const bolt = () => { if (brk <= 0.02) return; const a = brk; c.save(); c.globalAlpha = a; c.strokeStyle = RUST; c.lineWidth = 7 * z; c.beginPath();      // the snap: a jagged bolt across the gap
    const zz = [[-16, -86], [12, -50], [-12, -18], [14, 12], [-8, 40]]; zz.forEach(([dx, dy], i) => i ? c.lineTo(X(BREAKX + dx), Y(dy)) : c.moveTo(X(BREAKX + dx), Y(dy))); c.stroke();
    c.lineWidth = 5 * z; c.beginPath(); for (const [dx, dy] of [[-40, -40], [44, -30], [-46, 30], [40, 44]]) { c.moveTo(X(BREAKX + dx * 0.5), Y(dy * 0.5)); c.lineTo(X(BREAKX + dx), Y(dy)); } c.stroke(); c.restore();
    label(c, t, cr.id, X(BREAKX), Y(96), 40, { f: 'monoB', border: RUST }); };

  // ---- the tick strip (appears with the move) and its boxes ----
  const strip = ramp(t, 7.9, 8.5, EASE.warm) * (t < 7.9 ? 0 : 1);
  if (strip > 0.01) { const x0 = X(SX[0] - 140), x1 = X(SX[2] + 140), y0 = Y(BOXY - 64), y1 = Y(BOXY + 64);
    c.save(); c.globalAlpha = strip; c.fillStyle = C.paper; c.strokeStyle = mix(C.paper, C.slate, 0.4); c.lineWidth = 2; c.beginPath(); c.roundRect(x0, y0, (x1 - x0) * strip, y1 - y0, 10 * z); c.fill(); c.stroke(); c.restore();
    SX.forEach((sx, s) => { const ba = clamp((strip - 0.3 - 0.2 * s) / 0.3); if (ba <= 0) return; const b = BOX * z;
      let ring = 0; for (const [rt, rs] of READS) if (rs === s && t >= rt) ring = Math.max(ring, win(t, rt, rt + 0.7, 0.05, 0.5));
      c.save(); c.globalAlpha = ba; c.fillStyle = C.paper; c.strokeStyle = mix(INK, TICK, ring); c.lineWidth = Math.max(4, 4.5 * z) + 3 * ring; c.beginPath(); c.roundRect(X(sx) - b / 2, Y(BOXY) - b / 2, b, b, 8 * z); c.fill(); c.stroke();
      if (ring > 0.02) { c.strokeStyle = rgba(TYR, 0.45 * ring); c.lineWidth = 6 * z; c.beginPath(); c.roundRect(X(sx) - b / 2 - 14 * z * (1 + ring * 0.3), Y(BOXY) - b / 2 - 14 * z * (1 + ring * 0.3), b + 28 * z * (1 + ring * 0.3), b + 28 * z * (1 + ring * 0.3), 14 * z); c.stroke(); }
      c.restore(); });
    for (const k of TICKS) { if (t < k.t) continue; const p = ramp(t, k.t, k.t + 0.22, EASE.glaser), a = k.gone ? 1 - ramp(t, k.gone, k.gone + 0.3, EASE.rest) : 1,
      pop = 1 + 0.25 * Math.exp(-(t - k.t) * 9) * (t > k.t + 0.22 ? 1 : 0);
      tickMark(c, X(SX[k.s]), Y(BOXY), BOX * 0.62 * z * pop, p, a * strip); } }

  // ---- the three step cards on the line ----
  SX.forEach((sx, s) => { let work = 0; WORK.forEach((w, i) => { if (WORKS[i] === s) work = Math.max(work, win(t, w - 0.05, w + 0.55, 0.06, 0.3)); });
    let shake = 0; for (const k of CRASH) if (s === 2) { const d = t - k.t; if (d > 0 && d < 0.6) shake = 0.07 * Math.sin(d * 46) * Math.exp(-d * 6); }
    const w = CW * z, h = CH * z, cx = X(sx), cy = Y(-5);
    c.save(); c.translate(cx, cy + h / 2); c.rotate(shake); c.translate(-cx, -cy - h / 2);
    if (work > 0.02) { c.fillStyle = rgba(CIN, 0.35 * work); c.beginPath(); c.roundRect(cx - w / 2 - 14 * z, cy - h / 2 - 14 * z, w + 28 * z, h + 28 * z, 16 * z); c.fill(); }
    c.fillStyle = mix(C.paper, ECRU, 0.12 + 0.25 * work); c.strokeStyle = mix(CARDLN, INK, 0.4 + 0.6 * work); c.lineWidth = Math.max(4, 4.5 * z);
    c.beginPath(); c.roundRect(cx - w / 2, cy - h / 2, w, h, 12 * z); c.fill(); c.stroke();
    icon(c, s, cx, cy - 32 * z, 1.3 * z * (1 + 0.08 * work), 1);
    text(c, LABEL[s], cx, cy + 86 * z, { f: 'monoB', size: Math.max(26, 26 * z), col: INK, align: 'center', track: 0.02 });
    c.restore(); });
  bolt();

  // ---- the customer: a coin jar at the end of the line ----
  { const jx = X(JX), jt = Y(JTOP), jb = Y(JBOT), hw = 96 * z;
    let ans = null; for (const e of ANS) if (t >= e.t) ans = e;
    const shake = ans && !ans.ok ? 5 * Math.sin((t - ans.t) * 42) * Math.exp(-(t - ans.t) * 7) * z : 0;
    c.save(); c.translate(shake, 0);
    c.fillStyle = rgba(mix(C.paper, C.mist, 0.5), 0.55); c.strokeStyle = INK; c.lineWidth = Math.max(4.5, 5 * z);
    c.beginPath(); c.moveTo(jx - hw + 8 * z, jt + 12 * z); c.lineTo(jx - hw, jt + 34 * z); c.lineTo(jx - hw, jb - 16 * z); c.quadraticCurveTo(jx - hw, jb, jx - hw + 16 * z, jb);
    c.lineTo(jx + hw - 16 * z, jb); c.quadraticCurveTo(jx + hw, jb, jx + hw, jb - 16 * z); c.lineTo(jx + hw, jt + 34 * z); c.lineTo(jx + hw - 8 * z, jt + 12 * z); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = mix(C.paper, ECRU, 0.5); c.beginPath(); c.roundRect(jx - hw + 2 * z, jt - 6 * z, 2 * hw - 4 * z, 18 * z, 4 * z); c.fill(); c.stroke();   // the rim
    c.strokeStyle = rgba(C.paper, 0.8); c.lineWidth = 5 * z; c.beginPath(); c.moveTo(jx + hw - 20 * z, jt + 44 * z); c.lineTo(jx + hw - 20 * z, jb - 40 * z); c.stroke();   // glass glint
    c.restore();
    label(c, t, 'cust', jx, Y(JTOP - 40), 28, { f: 'monoB' });
    // the answer over the jar: ✓ paid once, ✕ wrong
    if (ans) { const a = win(t, ans.t, ans.hold, 0.08, 0.3), pop = 1 + 0.18 * Math.exp(-(t - ans.t) * 8);
      if (a > 0) { const cx = jx, cy = Y(JTOP - 150), R = 52 * z * pop, m = 19 * z * pop, col = ans.ok ? TICK : RUST;
        c.save(); c.globalAlpha = a; c.fillStyle = C.paper; c.strokeStyle = col; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill(); c.stroke();
        c.lineWidth = 9 * z; c.beginPath();
        if (ans.ok) { c.moveTo(cx - m, cy + 1); c.lineTo(cx - m * 0.25, cy + m * 0.8); c.lineTo(cx + m * 1.05, cy - m * 0.9); }
        else { c.moveTo(cx - m, cy - m); c.lineTo(cx + m, cy + m); c.moveTo(cx + m, cy - m); c.lineTo(cx - m, cy + m); }
        c.stroke(); c.restore(); } }
    for (const id of ['paidA1', 'paidA2', 'paidB', 'paidD', 'paidE']) label(c, t, id, jx, Y(BOXY + 14), 30, { f: 'monoB', border: id === 'paidA2' || id === 'paidD' ? RUST : null }); }

  // ---- coins: fly from the "Pay refund" card into the jar (or, once, onto the floor) ----
  for (const k of COINS) { if (t < k.t) continue; const a = k.gone ? 1 - ramp(t, k.gone, k.gone + 0.35, EASE.rest) : 1; if (a <= 0) continue;
    const u = ramp(t, k.t, k.t + FLY, EASE.warm), from = [SX[1], -37], to = k.wrong ? STRAY : SLOT[k.slot];
    let x = lerp(from[0], to[0], u), y = lerp(from[1], to[1], u) - (k.wrong ? 150 : 300) * Math.sin(Math.PI * u);
    let glow = 0; if (k.lift) { const l = ramp(t, k.lift, k.lift + 0.5, EASE.glaser); y -= 26 * l; glow = l * (0.7 + 0.3 * Math.sin(t * 4)); }
    if (k.wrong && t > k.t + FLY) { const r = win(t, k.t + FLY, k.gone, 0.1, 0.3); c.strokeStyle = rgba(RUST, 0.6 * r); c.lineWidth = 5 * z; c.beginPath(); c.arc(X(x), Y(y), 62 * z, 0, Math.PI * 2); c.stroke(); }
    const land = u >= 1 ? 1 - 0.12 * Math.exp(-(t - k.t - FLY) * 10) : 1;
    c.save(); c.translate(X(x), Y(y)); c.scale(1 / land, land); coin(c, 0, 0, 38 * z, a, glow); c.restore(); }

  // ---- the skip: a dotted trail over the ticked steps ----
  for (const [s0, s1] of SKIPS) { const a = win(t, s0, s1 + 0.9, 0.1, 0.5); if (a <= 0) continue; const xh = Math.min(wworld(Math.min(t, s1)).x, px(2)) - 60;
    c.save(); c.globalAlpha = a; c.strokeStyle = TICK; c.lineWidth = 5 * z; c.setLineDash([2, 16 * z]); c.beginPath(); c.moveTo(X(START + 60), Y(PERCH + 40)); c.lineTo(X(Math.max(START + 60, xh)), Y(PERCH + 40)); c.stroke(); c.restore(); }

  // ---- the little whale: the helper ----
  { const p = wworld(t), ang = heading(t), v = wvel(t), sp = Math.hypot(v.x, v.y), moving = clamp(sp / 400);
    let blink = 0; for (const k of [2.9, 5.6, 8.0, 12.0, 15.5, 19.4, 24.3, 27.4]) blink = Math.max(blink, 1 - Math.abs(t - k) / 0.07);
    let squash = 0; for (const k of WORK) { const d = t - k; if (d >= 0 && d < 0.3) squash = Math.max(squash, 0.1 * (1 - EASE.glaser(d / 0.3))); }
    const daze = Math.max(...CRASH.map(k => win(t, k.t, k.t + 1.3, 0.05, 0.3)));
    const focus = Math.max(win(t, 11.7, 13.1, 0.15, 0.2), win(t, 24.15, 25.5, 0.15, 0.2), win(t, 17.6, 20.5, 0.4, 0.4) * 0.5);
    const eye = 1 + 0.4 * win(t, 4.7, 6.2, 0.06, 0.4) + 0.25 * daze;
    const delight = (t > 13.45 && t < 14.6) || t > 25.9 ? 1 : 0, spark = Math.max(win(t, 13.45, 14.4, 0.12, 0.4), win(t, 25.9, 27.2, 0.12, 0.5));
    c.save(); c.translate(X(p.x), Y(p.y));
    KH.drawWhale(c, { x: 0, y: 0, ang, scale: WS * z, L: 1, tail: Math.sin(t * (moving > 0.3 ? 11 : 3)) * lerp(0.12, 0.34, moving), fin: Math.sin(t * 6 + 1.3) * lerp(0.15, 0.3, moving),
      blink, squash, focus: delight ? 0 : focus, eye, spark, sparkColor: RAW, delight, blush: 0.6, mouth: delight ? 0.4 : 0.4 * win(t, 4.8, 6.0, 0.06, 0.3) + 0.3 * daze, sw: 3.2 });
    c.restore();
    label(c, t, 'who', X(p.x + 10), Y(p.y - 100), 28, { f: 'monoB' }); }

  // ---- the title hinge: the scene goes still under a paper veil ----
  const veil = win(t, T0, T0 + 2.55, 0.35, 0.4); if (veil > 0) { c.fillStyle = rgba(C.paper, 0.9 * veil); c.fillRect(0, 0, W, H); }

  // ---- the real-test card (top left, clean paper) ----
  const ka = RA(t, 'card'); if (ka > 0) { const dy = (1 - EASE.defer(ramp(t, 13.45, 13.8))) * 8, y0 = 862;
    c.save(); c.font = `52px ${KH.FONTS.disp}`; const w1 = c.measureText(RD('card').text).width; c.restore(); const x0 = 960 - w1 / 2;
    c.save(); c.globalAlpha = ka; c.fillStyle = C.paper; c.strokeStyle = mix(C.paper, C.slate, 0.4); c.lineWidth = 1.2;
    c.beginPath(); c.roundRect(x0 - 30, y0 + dy, w1 + 60, 196, 8); c.fill(); c.stroke(); c.fillStyle = TYR; c.fillRect(x0 - 30, y0 + dy, 6, 196); c.restore();
    text(c, RD('cardTop').text, x0, y0 + 46 + dy, { f: 'mono', size: 26, col: SOFT, a: ka });
    text(c, RD('card').text, x0, y0 + 114 + dy, { f: 'disp', size: 52, col: INK, a: ka });
    text(c, RD('cardSrc').text, x0, y0 + 164 + dy, { f: 'sans', size: 28, col: SOFT, a: ka }); }

  for (const r of READ) if (r.kind === 'caption') S.caption(c, t, r, { size: 42 });
  S.open(c, t - T0, { no: '06', title: 'Every step gets a <i>tick</i>.', accent: ACC }, { out: 2.47 });
  S.lockup(c, t, T_LOCK, { no: '06', short: 'Tick' });
  c.restore();
}

function cues() {
  return { bpm: BPM, dur: DUR, title: T0 + 0.25, veil: T0, unveil: T0 + 2.15, strip: 7.9,
    work: WORK.map((t, i) => ({ t, s: WORKS[i] })), tick: TICKS.map(k => ({ t: k.t, s: k.s })), coinOut: COINS.map(k => ({ t: k.t, wrong: !!k.wrong })),
    coinIn: COINS.map((k, i) => ({ t: k.t + FLY, wrong: !!k.wrong, second: i === 1 })), crash: CRASH.map(k => k.t), heal: CRASH.map(k => k.heal),
    read: READS.map(r => r[0]), skip: SKIPS.map(s => s[0]), answer: ANS.map(a => ({ t: a.t, ok: a.ok })), lift: 25.85, push: [13.1, 17.4],
    card: RD('card').in, limit: RD('limit').in, notThis: RD('notthis').in, belief: RD('belief').in, lockup: T_LOCK,
    tags: { consequence: [1.95, 4.65], focus: [4.75, 11.75, 13.45, 17.35, 24.2], mech: [9.3, 9.95, 10.65, 12.1, 13.25], limit: [16.6, 17.35], callback: [23.1, 25.85] } }; }
const CONTRAST = [['captions / labels / card main (ink on paper chip)', INK, C.paper], ['title (ink on chart ground)', INK, BG], ['title accent on ground', ACC, BG],
  ['title accent on veiled ground (paper)', ACC, C.paper], ['eyebrow / lockup (slate on ground)', SOFT, BG], ['card label + source (slate on paper)', SOFT, C.paper],
  ['step-card label (ink on card paper, worst case while working)', INK, mix(C.paper, ECRU, 0.37)]];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, DUR, W, H, fps: 60, wpos, heading, cam, INTENT, TERMS,
  shutter: t => CRASH.some(k => t > k.t && t < k.t + 1.0) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
