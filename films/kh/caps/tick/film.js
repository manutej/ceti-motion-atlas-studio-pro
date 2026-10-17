// CETI Capabilities 06 · tick — "Every step gets a tick." Kinetic Hydrography 1.0.0 + series layer. 25–30-s house format.
// Source: storyboards/c06/sb-06-03.json (jev-tape), cut to 30 s for a lay audience.
// The work is a refund in three steps (find order · pay refund · send email). The helper (the whale) does the steps;
// the customer is a coin jar. A crash after paying makes the retry pay again (two coins). The move: each finished step
// gets a tick in a box; after a crash the helper skips the ticked steps, so the refund is paid once.
// Limit: the ticked email step went to the wrong name (To: Bob; the customer is Ana). A tick means done, not right. Ending: one coin after the crash.
// drawFrame(ctx, t) is a pure function of t. Every event below is a fixed time; nothing is carried between frames.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, win, EASE, ramp, mix, rgba, text } = KH;
const W = 1920, H = 1080, BPM = 128, DUR = 29.35;
const INK = C.navy, SOFT = C.slate, TYR = WD.darkTyrianBlue, RAW = WD.rawSienna, ECRU = WD.ecru, CIN = WD.vinaceousCinnamon, RUST = C.rust;
const BG = mix(C.paper, TYR, 0.06);                         // what SERIES.ground paints with tint: Dark Tyrian Blue
let ACC = TYR; for (let k = 0; k <= 1; k += 0.05) { ACC = mix(TYR, INK, k); if (KH.contrast(ACC, BG) >= 4.6 && KH.contrast(ACC, C.paper) >= 4.6) break; }
const TICK = mix(TYR, C.paper, 0.05), LINE = mix(C.paper, C.slate, 0.55), CARDLN = mix(C.paper, C.slate, 0.7), COINRIM = mix(RAW, INK, 0.35);

// ---------- layout (world units; camera z 1 = 1 px) ----------
const START = -680, SX = [-420, -60, 300], PERCH = -228, JX = 640, JTOP = -62, JBOT = 150, BOXY = 200, BOX = 92, CW = 224, CH = 240;
const LABEL = ['Find order', 'Pay refund', 'Send email'], BREAKX = 120;
const SLOT = [[598, 108], [682, 108]];
const ENV = { up: 19.0, ring: 19.6 };                     // LIMIT: the sent email lifts out of its card, addressed to the wrong name

// ---------- the story, as fixed events ----------
const WORK = [0.4, 1.0, 1.65, 3.6, 4.15, 10.3, 10.9, 11.55, 14.25, 22.3, 22.9, 23.55, 26.2];
const WORKS = [0, 1, 2, 0, 1, 0, 1, 2, 2, 0, 1, 2, 2];
const TICKS = [
  { s: 0, t: 10.45, gone: 21.0 }, { s: 1, t: 11.1, gone: 21.0 }, { s: 2, t: 14.4, gone: 21.0 },           // MOVE (tick 3 is the one the limit looks at)
  { s: 0, t: 22.45 }, { s: 1, t: 23.1 }, { s: 2, t: 26.35 }];                                          // PAYOFF
const COINS = [{ t: 1.05, slot: 0, gone: 6.6 }, { t: 4.2, slot: 1, gone: 6.6 }, { t: 10.95, slot: 0, gone: 21.0 }, { t: 22.95, slot: 0, lift: 26.55 }];
const FLY = 0.5;
const CRASH = [{ t: 1.95, heal: 3.1, id: 'crashA' }, { t: 11.8, heal: 12.9, id: 'crashB' }, { t: 23.8, heal: 24.9, id: 'crashE' }];
const ANS = [{ t: 4.75, ok: false, hold: 6.6 }, { t: 14.6, ok: true, hold: 18.55 }, { t: 26.55, ok: true, hold: DUR + 1 }];
const READS = [[12.9, 0], [13.1, 1], [24.9, 0], [25.1, 1], [ENV.ring + 0.1, 2]], SKIPS = [[13.25, 14.2], [25.2, 26.15]];

// ---------- the whale (the helper): Hermite through keys, zero tangents = settles at each key ----------
const WS = 0.95, px = s => SX[s] - 20, P = (t, x) => [t, x, PERCH];
const K = [P(0, START), P(0.35, px(0)), P(0.6, px(0)), P(0.95, px(1)), P(1.25, px(1)), P(1.6, px(2)), P(1.95, px(2)), P(2.95, START), P(3.2, START),
  P(3.55, px(0)), P(3.75, px(0)), P(4.1, px(1)), P(6.6, px(1)), P(7.6, START), P(9.9, START),
  P(10.25, px(0)), P(10.5, px(0)), P(10.85, px(1)), P(11.15, px(1)), P(11.5, px(2)), P(11.8, px(2)), P(12.8, START), P(13.25, START), P(14.2, px(2)),
  P(16.0, px(2)), P(16.7, px(1)), P(21.9, px(1)),
  P(22.25, px(0)), P(22.5, px(0)), P(22.85, px(1)), P(23.15, px(1)), P(23.5, px(2)), P(23.8, px(2)), P(24.8, START), P(25.2, START), P(26.15, px(2)), P(DUR + 1, px(2))];
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

// ---------- camera: close on the pain, pull back under the title, push to the one coin, push to the wrong-name email, close again ----------
function cam(t) {
  let z = 1.15, x = -45, y = -12; const L = (k, Z, X, Y) => { z = lerp(z, Z, k); x = lerp(x, X, k); y = lerp(y, Y, k); };
  L(ramp(t, 6.3, 7.6, EASE.rest), 1.1, -45, -12);
  L(ramp(t, 14.25, 15.15, EASE.warm), 1.35, 380, 40); L(ramp(t, 15.4, 16.3, EASE.warm), 1.1, -45, -12);
  L(ramp(t, 16.3, 18.6, EASE.rest), 1.14, -20, -12);                                       // slow drift under the card
  L(ramp(t, 18.6, 19.5, EASE.warm), 1.4, 330, -20); L(ramp(t, 20.9, 21.8, EASE.warm), 1.15, -45, -12);
  return { x, y, z: z + 0.03 * ramp(t, 26.6, DUR, EASE.rest), ax: 960, ay: 540 }; }

// ---------- text (every word on screen is in READ) ----------
const T0 = 6.2, T_OUT = 3.6, T_LOCK = 27.15;              // title holds >= 2.5 s fully visible
const cap = (id, inn, out, text) => ({ id, kind: 'caption', in: inn, out, fi: 0.25, fo: 0.2, text });
const lab = (id, inn, out, text, o = {}) => ({ id, kind: 'label', in: inn, out, fi: 0.15, fo: 0.2, text, ...o });
const CARD = [14.7, 18.8];
const READ = [
  cap('what', 0.15, 2.1, 'The job: refund a customer $20.'),
  cap('crash', 2.15, 4.25, 'The computer crashed before the last step.'),
  cap('twice', 4.3, 6.25, 'Starting again sent the refund twice.'),
  { id: 'eyebrow', kind: 'label', in: T0 + 0.25, out: T0 + T_OUT, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 06' },
  { id: 'title', kind: 'title', in: T0 + 0.25, out: T0 + T_OUT, fi: 0.4, fo: 0.45, text: 'Every step gets a tick.' },
  cap('tick', 9.9, 11.9, 'Each finished step gets a tick.'),
  cap('skip', 11.95, 14.05, 'After a crash, skip the ticked steps.'),
  { id: 'card1', kind: 'card', card: true, in: CARD[0], out: CARD[1], fi: 0.3, fo: 0.3, text: 'True story: we crashed it on purpose.', src: 'https://github.com/manutej/jev-tape' },
  { id: 'card2', kind: 'card', card: true, in: CARD[0], out: CARD[1], fi: 0.3, fo: 0.3, text: 'Each step happened once.', src: 'https://github.com/manutej/jev-tape' },
  { id: 'cardSrc', kind: 'label', in: CARD[0], out: CARD[1], fi: 0.3, fo: 0.3, text: 'Source: our own tests' },
  cap('limit', 18.85, 20.85, 'A tick means done. Not right.'),
  cap('belief', 25.1, T_LOCK - 0.05, 'Tick each step. Pay just once.'),
  { id: 'lockup', kind: 'label', in: T_LOCK, out: DUR, fi: 0.45, fo: 0, text: 'CETI · Capabilities · 06 · Tick' },
  // labels on the picture
  lab('who', 0.1, 1.9, 'Your AI helper'),
  lab('cust', 0, DUR, 'Customer: Ana', { fi: 0 }),
  ...LABEL.map((s, i) => lab('st' + i, 0, DUR, s, { fi: 0 })),
  ...CRASH.map(k => lab(k.id, k.t, k.t + 1.1, 'Crash!', { fi: 0.08 })),
  lab('to', ENV.up + 0.3, 21.0, 'To: Bob'),
  lab('paidA1', 1.55, 4.72, 'Paid $20'), lab('paidA2', 4.72, 6.6, 'Paid $40', { fi: 0.08 }),
  lab('paidB', 11.45, 21.0, 'Paid $20'), lab('paidE', 23.45, DUR, 'Paid $20', { fo: 0 }),
];
const RD = id => READ.find(r => r.id === id), RA = (t, id) => { const r = RD(id); return win(t, r.in, r.out, r.fi, r.fo); };
// O1 · wide audience: what the lay jury should be able to say back from the contact sheet alone
const INTENT = {
  problem: 'Your AI helper is refunding a customer $20. The computer crashed after paying but before the last step (send email); starting again from the beginning paid the $20 again ($40).',
  move: 'Each finished step gets a tick in a box. After a crash the helper skips the ticked steps and carries on from the first empty box, so the refund is paid once.',
  belief: 'Tick each step. Pay just once. And also: a tick means done, not right (the ticked email can still go to the wrong name).' };
const TERMS = [{ term: 'tick', pictured_at: 10.45 }];

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
    c.lineWidth = 5 * z; c.beginPath(); for (const [dx, dy] of [[-40, -40], [44, -30], [-46, 30], [40, 44]]) { c.moveTo(X(BREAKX + dx * 0.5), Y(dy * 0.5)); c.lineTo(X(BREAKX + dx), Y(dy)); } c.stroke(); c.restore(); };
  // the "Crash!" chip sits in clear paper above the gap, left of the bolt, with a short rust leader to it (drawn after the whale)
  const crashChip = () => { if (!cr) return; const a = RA(t, cr.id); if (a <= 0.01) return; const cx = X(BREAKX - 80), cy = Y(-150);
    c.save(); c.globalAlpha = a; c.strokeStyle = RUST; c.lineWidth = 4; c.beginPath(); c.moveTo(cx + 62, cy + 10); c.lineTo(X(BREAKX - 14), Y(-84)); c.stroke(); c.restore();
    label(c, t, cr.id, cx, cy, 34, { f: 'monoB', border: RUST }); };

  // ---- the tick strip (appears with the move) and its boxes ----
  const strip = ramp(t, 9.2, 9.8, EASE.warm) * (t < 9.2 ? 0 : 1);
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

  // ---- LIMIT: the sent email lifts out of its card. Its step is ticked, and it is addressed to the wrong name ----
  { const a = win(t, ENV.up, 21.3, 0.1, 0.3); if (a > 0) { const u = ramp(t, ENV.up, ENV.up + 0.55, EASE.glaser), ex = SX[2], ey = lerp(-37, -262, u), k = lerp(1.3, 2.3, u);
      icon(c, 2, X(ex), Y(ey), k * z, a);
      label(c, t, 'to', X(ex), Y(ey + 34), 34, { f: 'monoB' });
      const r = win(t, ENV.ring, 21.3, 0.12, 0.3); if (r > 0.01) { c.save(); c.globalAlpha = r * a; c.strokeStyle = RUST; c.lineWidth = 5 * z; c.beginPath(); c.ellipse(X(ex), Y(ey + 22), 118 * z, 46 * z, 0, 0, Math.PI * 2); c.stroke(); c.restore(); } } }

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
    for (const id of ['paidA1', 'paidA2', 'paidB', 'paidE']) label(c, t, id, jx, Y(BOXY + 14), 30, { f: 'monoB', border: id === 'paidA2' ? RUST : null }); }

  // ---- coins: fly from the "Pay refund" card into the jar. Money only ever means the refund. ----
  for (const k of COINS) { if (t < k.t) continue; const a = k.gone ? 1 - ramp(t, k.gone, k.gone + 0.35, EASE.rest) : 1; if (a <= 0) continue;
    const u = ramp(t, k.t, k.t + FLY, EASE.warm), from = [SX[1], -37], to = SLOT[k.slot];
    let x = lerp(from[0], to[0], u), y = lerp(from[1], to[1], u) - 300 * Math.sin(Math.PI * u);
    let glow = 0; if (k.lift) { const l = ramp(t, k.lift, k.lift + 0.5, EASE.glaser); y -= 26 * l; glow = l * (0.7 + 0.3 * Math.sin(t * 4)); }
    const land = u >= 1 ? 1 - 0.12 * Math.exp(-(t - k.t - FLY) * 10) : 1;
    c.save(); c.translate(X(x), Y(y)); c.scale(1 / land, land); coin(c, 0, 0, 38 * z, a, glow); c.restore(); }

  // ---- the skip: a dotted trail over the ticked steps ----
  for (const [s0, s1] of SKIPS) { const a = win(t, s0, s1 + 0.9, 0.1, 0.5); if (a <= 0) continue; const xh = Math.min(wworld(Math.min(t, s1)).x, px(2)) - 60;
    c.save(); c.globalAlpha = a; c.strokeStyle = TICK; c.lineWidth = 5 * z; c.setLineDash([2, 16 * z]); c.beginPath(); c.moveTo(X(START + 60), Y(PERCH + 40)); c.lineTo(X(Math.max(START + 60, xh)), Y(PERCH + 40)); c.stroke(); c.restore(); }

  // ---- the little whale: the helper ----
  { const p = wworld(t), ang = heading(t), v = wvel(t), sp = Math.hypot(v.x, v.y), moving = clamp(sp / 400);
    let blink = 0; for (const k of [2.9, 5.6, 8.0, 13.0, 16.6, 19.4, 25.0, 28.1]) blink = Math.max(blink, 1 - Math.abs(t - k) / 0.07);
    let squash = 0; for (const k of WORK) { const d = t - k; if (d >= 0 && d < 0.3) squash = Math.max(squash, 0.1 * (1 - EASE.glaser(d / 0.3))); }
    const daze = Math.max(...CRASH.map(k => win(t, k.t, k.t + 1.3, 0.05, 0.3)));
    const focus = Math.max(win(t, 12.85, 14.25, 0.15, 0.2), win(t, 24.85, 26.2, 0.15, 0.2));
    const eye = 1 + 0.4 * win(t, 4.7, 6.2, 0.06, 0.4) + 0.25 * daze;
    const delight = (t > 14.6 && t < 15.8) || t > 26.6 ? 1 : 0, spark = Math.max(win(t, 14.6, 15.5, 0.12, 0.4), win(t, 26.6, 27.9, 0.12, 0.5));
    c.save(); c.translate(X(p.x), Y(p.y));
    KH.drawWhale(c, { x: 0, y: 0, ang, scale: WS * z, L: 1, tail: Math.sin(t * (moving > 0.3 ? 11 : 3)) * lerp(0.12, 0.34, moving), fin: Math.sin(t * 6 + 1.3) * lerp(0.15, 0.3, moving),
      blink, squash, focus: delight ? 0 : focus, eye, spark, sparkColor: RAW, delight, blush: 0.6, mouth: delight ? 0.4 : 0.4 * win(t, 4.8, 6.0, 0.06, 0.3) + 0.3 * daze, sw: 3.2 });
    c.restore();
    label(c, t, 'who', X(p.x + 10), Y(p.y - 100), 28, { f: 'monoB' }); }
  crashChip();

  // ---- the title hinge: the scene goes still under a paper veil ----
  const veil = win(t, T0, T0 + T_OUT + 0.1, 0.35, 0.4); if (veil > 0) { c.fillStyle = rgba(C.paper, 0.94 * veil); c.fillRect(0, 0, W, H); }

  // ---- the true-story card (bottom centre, clean paper, two plain lines at 44 px, up 3.5 s) ----
  const ka = RA(t, 'card1'); if (ka > 0) { const dy = (1 - EASE.defer(ramp(t, CARD[0], CARD[0] + 0.35))) * 8, y0 = 834;
    c.save(); c.font = `44px ${KH.FONTS.sans}`; const w1 = Math.max(c.measureText(RD('card1').text).width, c.measureText(RD('card2').text).width); c.restore(); const x0 = 960 - w1 / 2;
    c.save(); c.globalAlpha = ka; c.fillStyle = C.paper; c.strokeStyle = mix(C.paper, C.slate, 0.4); c.lineWidth = 1.2;
    c.beginPath(); c.roundRect(x0 - 34, y0 + dy, w1 + 68, 214, 8); c.fill(); c.stroke(); c.fillStyle = TYR; c.fillRect(x0 - 34, y0 + dy, 7, 214); c.restore();
    text(c, RD('card1').text, x0, y0 + 62 + dy, { f: 'sans', size: 44, col: INK, a: ka });
    text(c, RD('card2').text, x0, y0 + 122 + dy, { f: 'sans', size: 44, col: INK, a: ka });
    text(c, RD('cardSrc').text, x0, y0 + 180 + dy, { f: 'sans', size: 30, col: SOFT, a: ka }); }

  for (const r of READ) if (r.kind === 'caption') S.caption(c, t, r, { size: 42 });
  { const ta = S.open(c, t - T0, { no: '06', title: 'Every step gets a <i>tick</i>.', accent: ACC }, { out: T_OUT });   // full-weight title: overstroke the light display face
    if (ta > 0.01) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); text(c, 'Every step gets a <i>tick</i>.', 960, 560, { f: 'disp', size: 92, col: INK, accent: ACC, a: ta, align: 'center', stroke: 1.6 }); c.restore(); } }
  S.lockup(c, t, T_LOCK, { no: '06', short: 'Tick' });
  c.restore();
}

function cues() {
  return { bpm: BPM, dur: DUR, title: T0 + 0.25, veil: T0, unveil: T0 + T_OUT - 0.3, strip: 9.2,
    work: WORK.map((t, i) => ({ t, s: WORKS[i] })), tick: TICKS.map(k => ({ t: k.t, s: k.s })), coinOut: COINS.map(k => ({ t: k.t, wrong: false })),
    coinIn: COINS.map((k, i) => ({ t: k.t + FLY, wrong: false, second: i === 1 })), crash: CRASH.map(k => k.t), heal: CRASH.map(k => k.heal),
    read: READS.slice(0, 4).map(r => r[0]), skip: SKIPS.map(s => s[0]), answer: ANS.map(a => ({ t: a.t, ok: a.ok })), lift: 26.55, push: [14.25, 18.6],
    envelope: ENV.up, wrongName: ENV.ring, tickHolds: ENV.ring + 0.1,
    card: CARD[0], limit: RD('limit').in, notThis: RD('limit').in, belief: RD('belief').in, lockup: T_LOCK,
    tags: { consequence: [1.95, 4.65], focus: [4.75, 12.9, 14.6, ENV.ring], mech: [10.45, 11.1, 11.8, 13.25, 14.4], limit: [ENV.up, ENV.ring], callback: [23.8, 26.55] } }; }
const CONTRAST = [['captions / labels / card main (ink on paper chip)', INK, C.paper], ['title (ink on chart ground)', INK, BG], ['title accent on ground', ACC, BG],
  ['title accent on veiled ground (paper)', ACC, C.paper], ['eyebrow / lockup (slate on ground)', SOFT, BG], ['card label + source (slate on paper)', SOFT, C.paper],
  ['step-card label (ink on card paper, worst case while working)', INK, mix(C.paper, ECRU, 0.37)]];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, DUR, W, H, fps: 60, wpos, heading, cam, INTENT, TERMS,
  shutter: t => CRASH.some(k => t > k.t && t < k.t + 1.0) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
