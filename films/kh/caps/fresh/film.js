// CETI Capabilities 08 · fresh v5 — "Fresh eyes find what you missed." Kinetic Hydrography 1.0.0 + series layer. 30-s house format.
// The work is a REPORT: seven numbered pages, page 4 missing. The whale (you) checks it twice and its eye fills in the page it
// meant to write; the customer finds the hole. Fix: three different AI checkers who didn't write it hunt for mistakes; every
// complaint must point at the problem ("page 4 is missing" points at the hole; "feels off" points at nothing and is crossed
// out). Someone else adds the page; the checkers check again and it holds. Limit (one beat): pages 2 and 3 get swapped, the
// checkers turn identical and all tick it. Ending: one different checker points at it, someone else fixes it, the poke holds.
// drawFrame(ctx, t) is a pure function of t. v4 is kept as film-v4.js.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, win, EASE, ramp, mix, rgba, text } = KH;
const W = 1920, H = 1080, BPM = 124, B = 60 / BPM, DUR = 30.0;
const INK = C.navy, SOFT = C.slate, GREN = WD.grenadinePink, NAP = WD.naplesYellow, DSG = WD.deepSlateGreen;
const BG = mix(C.paper, NAP, 0.06);                                     // what SERIES.ground paints with tint: Naples Yellow
let ACC = GREN; for (let k = 0; k <= 1; k += 0.04) { ACC = mix(GREN, INK, k); if (KH.contrast(ACC, BG) >= 4.6 && KH.contrast(ACC, C.paper) >= 4.6) break; }
const ALARM = mix(GREN, INK, 0.12), OK = mix(DSG, C.paper, 0.15), EDGE = mix(C.paper, C.slate, 0.45), LINES = mix(C.paper, C.slate, 0.28);
const COL = { A: NAP, B: mix(GREN, C.paper, 0.45), C: mix(C.sage, C.paper, 0.2), cust: mix(C.driftwood, C.paper, 0.35), fix: mix(DSG, C.paper, 0.6),
  fix2: mix(DSG, C.paper, 0.6), F: mix(GREN, NAP, 0.55) };
const ALIKE = mix(WD.lightGlaucousBlue, C.slate, 0.25);                 // the look-alike helpers take the maker's own colour

// ---------- the report: seven page slots, page 4 missing; pages 2 and 3 get swapped only in the limit beat ----------
const SLOT = i => -690 + 230 * i, PW = 160, PH = 212, HY = -380, PODS = 140, NOSE = 70;
const T_SET4 = 17.85, SWAP1 = [22.9, 23.3], SWAP2 = [26.7, 27.05];
function pagePos(n, t) {                                                 // returns {x, y, a} or null
  if (n === 4) { if (t < 17.15) return null; if (t < T_SET4) { const f = podPos('fix', t); return { x: f.x, y: f.y + NOSE + PH / 2 + 4, a: 1 }; } return { x: SLOT(3), y: 0, a: 1 }; }
  if (n === 2 || n === 3) { const k1 = ramp(t, SWAP1[0], SWAP1[1], EASE.warm), k2 = ramp(t, SWAP2[0], SWAP2[1], EASE.warm), sw = k1 - k2, arc = Math.sin(Math.PI * (t < SWAP2[0] ? k1 : k2));
    const home = n === 2 ? 1 : 2, other = n === 2 ? 2 : 1; return { x: lerp(SLOT(home), SLOT(other), sw), y: n === 2 ? -110 * arc : 40 * arc, a: 1 }; }
  return { x: SLOT(n - 1), y: 0, a: 1 };
}

// ---------- helpers (pods): keys [t, x, y]; eased between keys ----------
const KEYS = {
  A: [[0, 0, -1100], [7.95, 0, -1100], [8.55, 0, HY], [16.95, 0, HY], [17.35, -150, -560], [18.55, -150, -560], [18.95, 0, HY], [22.9, 0, HY], [23.4, -460, HY], [24.9, -460, HY], [25.4, 200, -1300]],
  B: [[0, 690, -1100], [8.1, 690, -1100], [8.7, 690, HY], [22.9, 690, HY], [23.4, 0, HY], [25.0, 0, HY], [25.5, 500, -1300]],
  C: [[0, 230, -1100], [8.25, 230, -1100], [8.85, 230, HY], [22.9, 230, HY], [23.4, -230, HY], [24.95, -230, HY], [25.45, 350, -1300]],
  cust: [[0, 1500, -230], [2.05, 1500, -230], [2.55, 880, -230], [4.7, 880, -230], [5.4, 1550, -230]],
  fix: [[0, 0, -1300], [17.1, 0, -1300], [17.75, 0, -PH / 2 - NOSE - 4], [18.2, 0, -PH / 2 - NOSE - 4], [18.8, 150, -1300]],
  fix2: [[0, -230, -1300], [26.0, -230, -1300], [26.45, -230, HY], [27.1, -230, HY], [27.55, -60, -1300]],
  F: [[0, -460, -1300], [25.15, -460, -1300], [25.6, -460, HY], [DUR + 1, -460, HY]],
};
function keyed(P, t) { const n = P.length; if (t <= P[0][0]) return { x: P[0][1], y: P[0][2] }; if (t >= P[n - 1][0]) return { x: P[n - 1][1], y: P[n - 1][2] };
  let i = 0; while (P[i + 1][0] < t) i++; const a = P[i], b = P[i + 1], k = EASE.warm((t - a[0]) / (b[0] - a[0])); return { x: lerp(a[1], b[1], k), y: lerp(a[2], b[2], k) }; }
// pokes: the checker darts nose-first at a page. 'slot' = nothing there: the nose goes into the hole. 'page' = it bounces.
const POKES = [
  { p: 'A', t: 10.4, at: 'slot', says: 'missing' }, { p: 'B', t: 10.85, at: 'page', says: 'vague' }, { p: 'C', t: 11.3, at: 'page' },
  { p: 'A', t: 19.35, at: 'page', holds: true }, { p: 'C', t: 20.15, at: 'page', holds: true }, { p: 'B', t: 20.95, at: 'page', holds: true },
  { p: 'A', t: 23.7, at: 'page', agree: true }, { p: 'C', t: 23.95, at: 'page', agree: true }, { p: 'B', t: 24.2, at: 'page', agree: true },
  { p: 'F', t: 25.75, at: 'page', says: 'order' }, { p: 'F', t: 27.35, at: 'page', holds: true, final: true },
];
const CONTACT = { page: -PH / 2 - NOSE - 2, slot: -40 };
function podPos(p, t) { const q = keyed(KEYS[p], t); let y = q.y;
  for (const k of POKES) if (k.p === p) { const d = ramp(t, k.t - 0.15, k.t, EASE.glaser) * (1 - ramp(t, k.t + 0.1, k.t + 0.45, EASE.warm)); if (d > 0) y = lerp(y, CONTACT[k.at], d); }
  return { x: q.x, y: y + (p === 'cust' ? 0 : 7 * Math.sin(t * 2.1 + p.charCodeAt(0))) }; }
const T_ALIKE = [22.9, 23.4];
function podDir(p, t) { return p === 'cust' ? Math.PI : Math.PI / 2; }
function podCol(p, t) { return 'ABC'.includes(p) ? mix(COL[p], ALIKE, ramp(t, T_ALIKE[0], T_ALIKE[1], EASE.warm)) : COL[p]; }

// ---------- the whale ("you"): Hermite through keys ----------
const WS = 0.8;
const K = [[0, -480, -330], [6.0, -480, -330], [7.4, -780, -470], [24.9, -780, -470], [25.6, -750, -470], [DUR + 1, -750, -470]];
function herm(P, t) { const n = P.length; if (t <= P[0][0]) return { x: P[0][1], y: P[0][2] }; if (t >= P[n - 1][0]) return { x: P[n - 1][1], y: P[n - 1][2] };
  let i = 0; while (P[i + 1][0] < t) i++; const p1 = P[i], p2 = P[i + 1], u = (t - p1[0]) / (p2[0] - p1[0]), A2 = 2 * u * u * u - 3 * u * u + 1, C2 = 1 - A2;
  return { x: A2 * p1[1] + C2 * p2[1], y: A2 * p1[2] + C2 * p2[2] }; }
const NODS = [1.95, T_SET4, 19.4, 20.2, 21.0, 21.9, 27.43];
function wworld(t) { const p = herm(K, t), q = herm(K, t + 0.01), sp = Math.hypot(q.x - p.x, q.y - p.y) * 100, still = 1 - clamp(sp / 150);
  let dip = 0; for (const s of NODS) { const d = t - s; if (d > 0 && d < 0.35) dip = Math.max(dip, 6 * Math.sin(Math.PI * d / 0.35)); }
  return { x: p.x, y: p.y + (Math.sin(t * 2.4) * 2.5 + dip) * still }; }
const wvel = t => { const a = wworld(t - 1 / 240), c = wworld(t + 1 / 240); return { x: (c.x - a.x) * 120, y: (c.y - a.y) * 120 }; };
function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
    a += (sp < 40 ? 0 : clamp(Math.atan2(v.y, Math.abs(v.x)), -0.8, 0.8) * clamp(sp / 300)) * w; s += w; } return a / s; }
const wpos = t => wworld(t);

// ---------- the gaze: your eye sweeps the report twice; over the hole it sees the page you meant ----------
function lensX(t) { if (t < 0.35 || t > 1.9) return null; return t < 1.15 ? lerp(SLOT(0), SLOT(6), EASE.rest(clamp((t - 0.35) / 0.8))) : lerp(SLOT(6), SLOT(0), EASE.rest(clamp((t - 1.2) / 0.65))); }
function meant(t) { const lx = lensX(t); let m = lx == null ? 0 : clamp(1 - Math.abs(lx - SLOT(3)) / 200); m = Math.max(m, win(t, 1.85, 2.7, 0.1, 0.25)); return m; }

// ---------- camera ----------
function cam(t) {
  const pull = ramp(t, 4.4, 6.8, EASE.rest), push = ramp(t, 11.85, 12.55, EASE.warm), rel = ramp(t, 16.7, 17.5, EASE.warm), pay = ramp(t, 24.9, 25.6, EASE.warm), end = ramp(t, 27.6, DUR, EASE.rest);
  let z = lerp(1.05, 1.0, pull), x = lerp(80, 0, pull), y = -60;
  z = lerp(z, 1.12, push); x = lerp(x, -40, push); y = lerp(y, -170, push); z = lerp(z, 1.0, rel); x = lerp(x, 0, rel); y = lerp(y, -60, rel);
  z = lerp(z, 1.05, pay); x = lerp(x, 0, pay); y = lerp(y, -120, pay);
  return { x, y, z: z + 0.025 * end, ax: 960, ay: 600 }; }

// ---------- text ----------
const T0 = 4.4, T_LOCK = 27.8;
const cap = (id, inn, out, text) => ({ id, kind: 'caption', in: inn, out, fi: 0.25, fo: 0.2, text });
const lab = (id, inn, out, text, o = {}) => ({ id, kind: 'label', in: inn, out, fi: 0.2, fo: 0.2, text, ...o });
const SRC = 'https://app.notion.com/p/3f2d50cfaf93811dafbdfac6f43bd8a9';
const READ = [
  lab('pages', 0, DUR, '1 2 3 5 6 7', { fi: 0, fo: 0 }),
  lab('you', 0.3, 4.4, 'you'), lab('report', 0.3, 4.4, 'your report'), lab('cust', 2.3, 4.5, 'the customer'),
  cap('felt1', 0.25, 2.3, 'I checked my report twice.'),
  cap('felt2', 2.4, 4.4, 'The customer found a missing page.'),
  { id: 'eyebrow', kind: 'label', in: T0 + 0.25, out: T0 + 3.6, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 08' },
  { id: 'title', kind: 'title', in: T0 + 0.25, out: T0 + 3.6, fi: 0.4, fo: 0.45, text: 'Fresh <i>eyes</i> find what you missed.' },
  lab('fresh', 8.4, 10.3, '3 different AI checkers'),
  lab('legend1', 8.55, 10.35, 'different colours'), lab('legend2', 8.55, 10.35, '= different kinds of checker'),
  cap('ask', 8.05, 10.25, 'Ask someone who didn\'t write the report.'),
  cap('hunt', 10.3, 12.0, 'They hunt for mistakes.'),
  lab('missing', 10.55, 16.95, 'page 4 is missing'), lab('vague', 11.0, 16.2, 'feels off'),
  cap('point', 12.05, 14.2, 'Each complaint must point at the problem.'),
  { ...cap('strike', 14.25, 17.2, 'No pointing? The complaint is crossed out.'), fi: 0.2 },
  lab('else', 17.3, 18.9, 'someone else'),
  { ...cap('fix', 17.22, 19.15, 'Someone else adds the missing page.'), fi: 0.2 },
  { id: 'card', kind: 'card', card: true, in: 19.15, out: 22.85, fi: 0.08, fo: 0.1, text: '57 problems found. Each one pointed at.', src: SRC },
  lab('cardl1', 19.15, 22.85, 'True story · our own review notes', { fi: 0.08, fo: 0.1, card: true, src: SRC }),
  { ...cap('limit', 22.95, 24.9, 'Checkers that think alike miss alike.'), fi: 0.2 },
  lab('order', 25.75, 27.3, 'pages out of order', { fi: 0.1 }),
  cap('belief', 24.95, T_LOCK - 0.05, 'Never let the maker be the judge.'),
  { id: 'lockup', kind: 'label', in: T_LOCK, out: DUR, fi: 0.45, fo: 0, text: 'CETI · Capabilities · 08 · Fresh' },
];
const RD = id => READ.find(r => r.id === id), RA = (t, id) => { const r = RD(id); return win(t, r.in, r.out, r.fi, r.fo); };
const INTENT = {
  problem: 'You checked your own report twice and still missed a missing page; the customer found it, because the maker sees what they meant to write.',
  move: 'Ask AI checkers that did not write the report to hunt for mistakes; every complaint must point at the actual problem or it is crossed out, and someone else makes the fix.',
  belief: 'Never let the maker be the judge of their own work; and use checkers that think differently, because checkers that think alike miss alike.',
};
const TERMS = [];

// ---------- drawing helpers ----------
function drawPage(c, X, Y, x, y, n, z, o = {}) {
  const w = PW * z, h = PH * z, sx = X(x) - w / 2, sy = Y(y) - h / 2;
  c.save(); c.globalAlpha *= o.a ?? 1;
  if (o.ghost) { c.setLineDash([10 * z, 8 * z]); c.strokeStyle = SOFT; c.lineWidth = 3 * z; c.beginPath(); c.roundRect(sx, sy, w, h, 8 * z); c.stroke(); c.setLineDash([]); }
  else { c.fillStyle = C.paper; c.strokeStyle = EDGE; c.lineWidth = Math.max(3, 3.5 * z); c.beginPath(); c.roundRect(sx, sy, w, h, 8 * z); c.fill(); c.stroke();
    c.strokeStyle = LINES; c.lineWidth = 4 * z; c.beginPath(); for (const fy of [0.66, 0.76, 0.86]) { c.moveTo(sx + 0.18 * w, sy + fy * h); c.lineTo(sx + (fy > 0.8 ? 0.6 : 0.82) * w, sy + fy * h); } c.stroke(); }
  c.restore();
  text(c, String(n), X(x), Y(y) + 6 * z, { f: 'sans', size: 64 * z, col: o.ghost ? SOFT : INK, a: o.a ?? 1, align: 'center' });
}
function pod(c, X, Y, z, p, t, a = 1) { const q = podPos(p, t), dir = podDir(p, t);
  c.save(); c.globalAlpha *= a; c.translate(X(q.x), Y(q.y)); c.rotate(dir); if (Math.cos(dir) < -0.01) c.scale(1, -1); KH.drawPod(c, 0, 0, 0, PODS * z, podCol(p, t)); c.restore(); }
function mark(c, x, y, R, ok, a, pop = 1) { if (a <= 0.01) return; const m = R * 0.42 * pop, r = R * pop;
  c.save(); c.globalAlpha *= a; c.fillStyle = C.paper; c.strokeStyle = ok ? OK : ALARM; c.lineWidth = 4; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.stroke();
  c.lineWidth = R * 0.17; c.lineCap = 'round'; c.beginPath();
  if (ok) { c.moveTo(x - m, y + 1); c.lineTo(x - m * 0.25, y + m * 0.8); c.lineTo(x + m * 1.05, y - m * 0.9); } else { c.moveTo(x - m, y - m); c.lineTo(x + m, y + m); c.moveTo(x + m, y - m); c.lineTo(x - m, y + m); }
  c.stroke(); c.restore(); }
function tickAt(c, x, y, s, a) { if (a <= 0.01) return; c.save(); c.globalAlpha *= a; c.strokeStyle = OK; c.lineWidth = s * 0.28; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(x - s, y); c.lineTo(x - s * 0.25, y + s * 0.8); c.lineTo(x + s * 1.05, y - s * 0.9); c.stroke(); c.restore(); }
function outline(c, x0, y0, x1, y1, z, a, prog = 1) { if (a <= 0.01) return; c.save(); c.globalAlpha *= a; c.strokeStyle = ALARM; c.lineWidth = 6 * z; c.setLineDash([16 * z, 10 * z]);
  c.lineDashOffset = 0; c.beginPath(); c.roundRect(x0, y0, x1 - x0, y1 - y0, 12 * z); c.stroke(); c.restore(); }
function sayChip(c, s, x, y, a, o = {}) { if (a <= 0.01) return; S.chip(c, s, x, y, { f: 'sans', size: o.size ?? 38, col: INK, a, align: 'center', pad: 16, border: o.border ?? ALARM }); }
function leader(c, x0, y0, x1, y1, a, z) { if (a <= 0.01) return; c.save(); c.globalAlpha *= a; c.strokeStyle = ALARM; c.lineWidth = 4 * z; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.fillStyle = ALARM; c.beginPath(); c.arc(x1, y1, 7 * z, 0, Math.PI * 2); c.fill(); c.restore(); }

function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay;
  S.ground(c, t, cm, { tint: NAP });
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.lineCap = 'round'; c.lineJoin = 'round';

  // the gaze lens (your eye sweeping the report) and the dotted line from your eye to it
  const lx = lensX(t);
  if (lx != null) { const w = win(t, 0.35, 1.9, 0.12, 0.15), p = wworld(t), ex = X(p.x + 70 * WS), ey = Y(p.y - 14 * WS);
    c.save(); c.globalAlpha = w; c.fillStyle = rgba(mix(NAP, GREN, 0.25), 0.55); c.beginPath(); c.roundRect(X(lx - 120), Y(-PH / 2 - 26), 240 * z, (PH + 52) * z, 18 * z); c.fill();
    c.strokeStyle = rgba(SOFT, 0.7); c.lineWidth = 3; c.setLineDash([3, 9]); c.beginPath(); c.moveTo(ex, ey); c.lineTo(X(lx), Y(-PH / 2 - 26)); c.stroke(); c.restore(); }

  // the report: pages (page 4 arrives with the fixer)
  const bump = n => { let d = 0; for (const k of POKES) if (k.at === 'page') { const q = podPos(k.p, k.t); const pg = pagePos(n, k.t); if (pg && Math.abs(pg.x - q.x) < 90) { const e = t - k.t; if (e > 0 && e < 0.4) d = Math.max(d, 8 * Math.sin(Math.PI * e / 0.4)); } } return d; };
  // the page you meant: a ghost "4" fills the hole while your eye passes over it
  const gm = meant(t); if (gm > 0.01) drawPage(c, X, Y, SLOT(3), 0, 4, z, { ghost: true, a: 0.75 * gm });
  for (const n of [1, 3, 2, 5, 6, 7, 4]) { const pg = pagePos(n, t); if (!pg) continue; drawPage(c, X, Y, pg.x, pg.y + bump(n), n, z); }
  // page 4 just set: a soft olive glow
  { const g = win(t, T_SET4, T_SET4 + 1.4, 0.05, 0.8); if (g > 0.01) { c.save(); c.globalAlpha = g * 0.5; c.strokeStyle = OK; c.lineWidth = 10 * z; c.beginPath(); c.roundRect(X(SLOT(3) - PW / 2 - 8), Y(-PH / 2 - 8), (PW + 16) * z, (PH + 16) * z, 12 * z); c.stroke(); c.restore(); } }

  // the hole, pointed at: by the customer (felt) and by helper A (move)
  const holeA = Math.max(win(t, 2.65, 4.6, 0.12, 0.3), win(t, 10.5, 17.55, 0.12, 0.3));
  outline(c, X(SLOT(3) - PW / 2 - 10), Y(-PH / 2 - 10), X(SLOT(3) + PW / 2 + 10), Y(PH / 2 + 10), z, holeA);
  // the swapped pages, pulsing faintly once the look-alike helpers face away; outlined when the different helper points
  { const pulse = win(t, 23.4, 25.1, 0.4, 0.3) * (0.35 + 0.25 * Math.sin((t - 23.4) * 5)), pt = win(t, 25.75, 26.8, 0.1, 0.15);
    const a = Math.max(pulse, pt); outline(c, X(SLOT(1) - PW / 2 - 10), Y(-PH / 2 - 10), X(SLOT(2) + PW / 2 + 10), Y(PH / 2 + 10), z, a); }

  // recheck: each held poke leaves a green tick under its page
  for (const k of POKES) if (k.holds && !k.final) { const q = podPos(k.p, k.t), a = win(t, k.t + 0.08, 22.9, 0.15, 0.4); tickAt(c, X(q.x), Y(PH / 2 + 46), 24 * z, a); }

  // helpers
  for (const p of ['cust', 'A', 'B', 'C', 'fix', 'fix2', 'F']) pod(c, X, Y, z, p, t);

  // what each helper says (a chip above it); the complaint with a pointer is kept, the one without is crossed out
  { const qa = podPos('A', t), qb = podPos('B', t), qf = podPos('F', t);
    const am = RA(t, 'missing'); if (am > 0.01) { const cx = X(qa.x), cy = Y(HY - 190); leader(c, cx, cy + 30, X(SLOT(3)), Y(-PH / 2 - 14), am, z); sayChip(c, 'page 4 is missing', cx, cy + 12, am); }
    const av = RA(t, 'vague'); if (av > 0.01) { const cx = X(qb.x) - 30, cy = Y(HY - 190) + 12; sayChip(c, 'feels off', cx, cy, av);
      const s = ramp(t, 14.55, 14.85, EASE.glaser); if (s > 0) { c.save(); c.globalAlpha = av; c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(cx - 100, cy - 10); c.lineTo(cx - 100 + 200 * s, cy - 10 - 20 * s); c.stroke(); c.restore(); } }
    const ao = RA(t, 'order'); if (ao > 0.01) { const cx = X(qf.x) - 40 * z, cy = Y(HY - 190) + 12; sayChip(c, 'pages out of order', cx, cy, ao); leader(c, cx + 60, cy + 22, X(SLOT(1) + 115), Y(-PH / 2 - 14), ao * (1 - ramp(t, 26.65, 26.75)), z); }
    // the customer's ✕ (felt)
    const qc = podPos('cust', t); mark(c, X(qc.x), Y(qc.y - 150), 44 * z, false, win(t, 2.65, 4.7, 0.08, 0.3), 1 + 0.18 * Math.exp(-Math.max(0, t - 2.65) * 8));
    // A's ✕ (the complaint with evidence) and B's ✕ (no pointer)
    // the look-alikes all agree: ✓ ✓ ✓ while the swap sits there
    for (const k of POKES) if (k.agree) { const q = podPos(k.p, t), e = k.t + 0.08; mark(c, X(q.x) + 20 * z, Y(q.y - 150), 40 * z, true, win(t, e, 24.95, 0.1, 0.3), 1 + 0.15 * Math.exp(-Math.max(0, t - e) * 8)); }
    // the different helper's final ✓ (holds to the end)
    mark(c, X(qf.x), Y(qf.y - 160), 46 * z, true, win(t, 27.43, DUR + 1, 0.08, 0.1), 1 + 0.2 * Math.exp(-Math.max(0, t - 27.43) * 8)); }

  // the little whale (you)
  { const p = wworld(t), ang = heading(t), v = wvel(t), sp = Math.hypot(v.x, v.y), moving = clamp(sp / 400);
    let blink = 0; for (const k of [3.4, 9.2, 13.4, 20.6, 23.0, 29.0]) blink = Math.max(blink, 1 - Math.abs(t - k) / 0.07);
    let squash = 0; for (const k of [1.95]) { const d = t - k; if (d >= 0 && d < 0.32) squash = Math.max(squash, 0.1 * (1 - EASE.glaser(d / 0.32))); }
    const focus = Math.max(win(t, 0.3, 1.9, 0.15, 0.15), win(t, 10.2, 15.0, 0.3, 0.3) * 0.5, win(t, 23.4, 24.9, 0.3, 0.3) * 0.6);
    const eye = 1 + 0.38 * win(t, 2.65, 4.0, 0.06, 0.4) + 0.25 * win(t, 10.45, 11.2, 0.06, 0.3) + 0.25 * win(t, 25.75, 26.4, 0.06, 0.3);
    const spark = Math.max(win(t, T_SET4, T_SET4 + 0.9, 0.12, 0.4), win(t, 27.43, 28.9, 0.12, 0.5));
    const delight = (t > T_SET4 && t < T_SET4 + 0.9) || t > 27.45 ? 1 : 0;
    c.save(); c.translate(X(p.x), Y(p.y));
    KH.drawWhale(c, { x: 0, y: 0, ang, scale: WS * z, L: 1, tail: Math.sin(t * (moving > 0.3 ? 11 : 3)) * lerp(0.12, 0.34, moving), fin: Math.sin(t * 6 + 1.3) * lerp(0.15, 0.3, moving),
      blink, squash, focus: delight ? 0 : focus, eye, spark, sparkColor: OK, delight, blush: 0.6, mouth: delight ? 0.4 : 0.35 * win(t, 2.7, 3.8, 0.06, 0.3), sw: 3.2 });
    c.restore();
    // your own ✓ on your own report (felt): you approved it yourself
    mark(c, X(p.x + 160), Y(p.y - 80), 40 * z, true, win(t, 1.95, 2.75, 0.08, 0.25) * (1 - 0.4 * win(t, 2.6, 3, 0.1, 0.1)), 1 + 0.2 * Math.exp(-Math.max(0, t - 1.95) * 8)); }

  // names of the actors (felt) and of the helpers (move)
  { const p = wworld(t); sayChip(c, 'you', X(p.x), Y(p.y - 115), RA(t, 'you'), { border: EDGE, size: 36 });
    sayChip(c, 'your report', X(SLOT(5)), Y(-PH / 2 - 40), RA(t, 'report'), { border: EDGE, size: 36 });
    const q = podPos('cust', t); sayChip(c, 'the customer', X(q.x) - 30, Y(q.y + 140), RA(t, 'cust'), { border: EDGE, size: 36 });
    { const f = podPos('fix', t); sayChip(c, 'someone else', X(f.x) + 210 * z, Y(f.y) + 10, RA(t, 'else'), { border: EDGE, size: 36 }); }
    sayChip(c, '3 different AI checkers', X(300), Y(HY - 235), RA(t, 'fresh'), { border: EDGE, size: 36 });
    // the legend: three colour dots, then "different colours = different kinds of checker"
    const lg = RA(t, 'legend1'); if (lg > 0.01) { const str = 'different colours ' + RD('legend2').text, x0 = X(300), y0 = Y(HY - 235) + 62;
      c.save(); c.font = `30px ${KH.FONTS.sans}`; const w = c.measureText(str).width; c.restore(); const tot = w + 108, lx = x0 - tot / 2;
      c.save(); c.globalAlpha = lg; c.fillStyle = C.paper; c.strokeStyle = EDGE; c.lineWidth = 1.2; c.beginPath(); c.roundRect(lx - 14, y0 - 34, tot + 28, 46, 6); c.fill(); c.stroke();
      ['A', 'B', 'C'].forEach((p, i) => { c.fillStyle = COL[p]; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(lx + 14 + i * 32, y0 - 11, 11, 0, Math.PI * 2); c.fill(); c.stroke(); }); c.restore();
      text(c, str, lx + 108, y0, { f: 'sans', size: 30, col: INK, a: lg }); } }

  // the title hinge: the scene goes still under a paper veil
  const veil = win(t, 4.45, T0 + 3.65, 0.35, 0.4); if (veil > 0) { c.fillStyle = rgba(C.paper, 0.6 * veil); c.fillRect(0, 0, W, H); }

  // the real-example card: it stands alone in the caption's place (bottom centre, clean paper)
  const ka = RA(t, 'card'); if (ka > 0) { const dy = (1 - EASE.defer(ramp(t, 19.15, 19.5))) * 8, big = RD('card').text, l1 = RD('cardl1').text;
    c.save(); c.font = `60px ${KH.FONTS.disp}`; const wd = c.measureText(big).width + 160; c.restore();
    c.save(); c.globalAlpha = ka; c.fillStyle = C.paper; c.strokeStyle = EDGE; c.lineWidth = 1.5;
    c.beginPath(); c.roundRect(960 - wd / 2, 856 + dy, wd, 176, 10); c.fill(); c.stroke(); c.fillStyle = OK; c.fillRect(960 - wd / 2, 856 + dy, 7, 176); c.restore();
    text(c, l1, 960, 906 + dy, { f: 'sans', size: 32, col: SOFT, a: ka, align: 'center' });
    text(c, big, 960, 990 + dy, { f: 'disp', size: 60, col: INK, a: ka, align: 'center' }); }

  for (const r of READ) if (r.kind === 'caption') S.caption(c, t, r, { size: 40 });
  S.open(c, t - T0, { no: '08', title: 'Fresh <i>eyes</i> find what you missed.', accent: ACC }, { out: 3.6 });
  S.lockup(c, t, T_LOCK, { no: '08', short: 'Fresh' });
  c.restore();
}

function cues() {
  return { bpm: BPM, dur: DUR, gaze: [0.35, 1.2], ghost: [1.0, 1.75], selfTick: 1.95, custIn: 2.05, custX: 2.65, title: T0 + 0.25, veil: 4.45, unveil: T0 + 3.3,
    podsIn: [8.55, 8.7, 8.85], pokes: POKES.map(k => ({ t: k.t, at: k.at, holds: !!k.holds, agree: !!k.agree, says: k.says || null, final: !!k.final })),
    claim: [10.55, 11.0, 25.75], push: 11.85, strike: 14.55, release: 16.7, fixIn: 17.1, set: T_SET4, card: RD('card').in,
    alike: T_ALIKE[0], swap: [SWAP1[0], SWAP2[0]], agree: POKES.filter(k => k.agree).map(k => k.t), payoff: 24.9, belief: RD('belief').in, final: 27.35, lockup: T_LOCK,
    tags: { consequence: [2.65], focus: [2.65, 10.4, 14.55, T_SET4, 25.75, 27.35], mech: [10.4, 10.85, 14.55, T_SET4, 19.35], limit: [22.9, 23.7], callback: [25.75] } }; }
const CONTRAST = [['captions / labels / complaint chips (ink on paper chip)', INK, C.paper], ['page numbers (ink on paper page)', INK, C.paper],
  ['ghost page number (slate on paper)', SOFT, C.paper], ['title (ink on chart ground)', INK, BG], ['title accent on ground', ACC, BG],
  ['title accent on veiled ground (paper)', ACC, C.paper], ['eyebrow / lockup (slate on ground)', SOFT, BG], ['card label + source (slate on paper)', SOFT, C.paper], ['card main + explainer (ink on paper)', INK, C.paper]];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, INTENT, TERMS, DUR, W, H, fps: 60, wpos, heading, cam,
  shutter: t => (t > 6.0 && t < 7.4) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
