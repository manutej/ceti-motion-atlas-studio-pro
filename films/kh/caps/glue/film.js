// CETI Capabilities · 03 · glue — "Memory that agrees." Kinetic Hydrography 1.0.0 + series layer. (v2: phone-scale)
// Sheaf memory as a lens: five notes (wave segments), each with its own local view. Every overlap is read both ways;
// one seam disagrees (terracotta step), the whale reconciles it (teal), the pieces fuse into one wave that closes into a ring.
// drawFrame(ctx, t) is a pure function of t; randomness only via KH.rng at load time.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, smoothstep, win, EASE, ramp, rng, mix, rgba, text } = KH;
const W = 1920, H = 1080, B = 60 / 120, DUR = 24, beat = n => n * B;

// ---------- colour (Wada 207 + CETI) ----------
const TINT = WD.glaucousGreen, GROUND = mix(C.paper, TINT, 0.06), INK = C.navy, SOFT = C.slate;
const TEAL = mix(WD.glaucousGreen, C.navy, 0.45), TEALG = WD.glaucousGreen, TERRA = WD.sudanBrown, BLACK = WD.black;
const NOTE = mix(C.slate, C.navy, 0.35), KNOB = C.paper;
let ka = 0.3; while (KH.contrast(mix(WD.glaucousGreen, C.navy, ka), GROUND) < 4.6 && ka < 1) ka += 0.02;
const ACCENT = mix(WD.glaucousGreen, C.navy, ka);                         // the title's accent word, teal mixed toward navy
let kf = 0.4; while (KH.contrast(mix(GROUND, C.slate, kf), GROUND) < 4.6 && kf < 1) kf += 0.02;
const FUT = mix(GROUND, C.slate, kf);                                       // rail words not active
const EP = { no: '03', accent: ACCENT, title: 'Memory that <i>agrees</i>.', short: 'Sheaf memory' };

// ---------- the wave: one shared shape, periodic over its length so it can close into a ring ----------
const L = 1600, OV = 34, TAU = Math.PI * 2, R0 = L / TAU;
const g = x => 80 * Math.sin(TAU * 2 * x / L + 0.5) + 16 * Math.sin(TAU * 5 * x / L + 1.1);
const XC = [0, 1, 2, 3, 4].map(i => -640 + 320 * i), SEAM = [-480, -160, 160, 480], BAD = 3, UP = 42, DN = 42;
const segL = i => i === 0 ? -800 : XC[i] - 160 - OV, segR = i => i === 4 ? 800 : XC[i] + 160 + OV;

// ---------- time keys (120 BPM) ----------
const SETTLE = [5.5, 5.0, 4.5, 4.0, 3.5];                              // the whale sweeps right → left; each note settles as it passes
const OVA = [0, 1, 2, 3].map(j => SETTLE[j] + 0.1);                     // an overlap appears once both neighbours sit in the row
const ARR = [6.5, 7.5, 8.5, 9.5], VER = ARR.map(a => a + 0.25);        // compare: whale lands, then the verdict
const GL0 = 11.4, SNAP = beat(25), FUSE0 = beat(27), FUSE1 = beat(29), BEND0 = 14.5, CLOSE = beat(32), LAP0 = 16.3, LAP1 = 18.9;
const glue = t => ramp(t, SNAP - 0.05, SNAP + 0.4, EASE.glaser);

// discord: note 4's right end sits high, note 5's left end sits low (an ~84 px step); both move to meet — neither overwrites
function endOff(i, x, t) { let o = 0;
  if (i === BAD) o -= UP * smoothstep(XC[BAD] + 20, segR(BAD), x);
  if (i === BAD + 1) o += DN * (1 - smoothstep(segL(BAD + 1), XC[BAD + 1] - 20, x));
  return o * (1 - glue(t)); }
const rowY = (i, x, t) => g(x) + endOff(i, x, t);

// the mess: each note's own local view (seeded)
const MESS = []; { const R = rng(2071), DY = [-175, 150, -55, 185, -150];
  for (let i = 0; i < 5; i++) MESS.push({ dx: (R() - 0.5) * 120, dy: DY[i] + (R() - 0.5) * 30, rot: (R() - 0.5) * 0.45, amp: 30 + R() * 45, lam: 220 + R() * 220, ph: R() * TAU, bp: R() * TAU }); }
function notePt(i, x, t) {
  const s = ramp(t, SETTLE[i] - 0.12, SETTLE[i] + 0.36, EASE.glaser), m = MESS[i], u = x - XC[i];
  const ly = m.amp * Math.sin(TAU * u / m.lam + m.ph), cs = Math.cos(m.rot), sn = Math.sin(m.rot);
  const mx = XC[i] + m.dx + 18 * Math.sin(t * 0.7 + m.bp) + u * cs - ly * sn, my = m.dy + 12 * Math.sin(t * 1.3 + m.bp) + u * sn + ly * cs;
  return { x: lerp(mx, x, s), y: lerp(my, rowY(i, x, t), s) }; }

// ---------- the whale's path: Hermite through keys; 'stop' keys have zero tangent (a perch) ----------
const P = j => g(SEAM[j]) - 150, PB = g(SEAM[BAD]) - UP - 135;
const KEYS = [[0, 1500, -260, 1], [1.5, 1400, -260], [2.6, 1020, -300], [3.1, 830, -240], [3.5, 640, -215], [4.0, 320, -228], [4.5, 0, -215], [5.0, -320, -228], [5.5, -640, -215],
  [5.95, -620, -310], [ARR[0], SEAM[0], P(0), 1],
  [ARR[0] + 0.4, SEAM[0], P(0), 1], [ARR[0] + 0.7, -320, Math.min(P(0), P(1)) - 70], [ARR[1], SEAM[1], P(1), 1],
  [ARR[1] + 0.4, SEAM[1], P(1), 1], [ARR[1] + 0.7, 0, Math.min(P(1), P(2)) - 70], [ARR[2], SEAM[2], P(2), 1],
  [ARR[2] + 0.4, SEAM[2], P(2), 1], [ARR[2] + 0.7, 320, Math.min(P(2), PB) - 70], [ARR[3], SEAM[3], PB, 1],
  [13.4, SEAM[3], PB, 1], [14.0, 300, -300], [14.7, 0, -R0, 1], [DUR, 0, -R0, 1]];
const PK = KEYS.map(([t, x, y, s]) => ({ t, x, y, s: !!s }));
function herm(t) { const Q = PK, n = Q.length; if (t <= Q[0].t) return { x: Q[0].x, y: Q[0].y }; if (t >= Q[n - 1].t) return { x: Q[n - 1].x, y: Q[n - 1].y };
  let i = 0; while (Q[i + 1].t < t) i++; const p1 = Q[i], p2 = Q[i + 1], h = p2.t - p1.t, u = (t - p1.t) / h;
  const tan = k => { if (Q[k].s) return { x: 0, y: 0 }; const a = Q[Math.max(0, k - 1)], b = Q[Math.min(n - 1, k + 1)]; return { x: (b.x - a.x) / (b.t - a.t), y: (b.y - a.y) / (b.t - a.t) }; };
  const m1 = tan(i), m2 = tan(i + 1), u2 = u * u, u3 = u2 * u, a = 2 * u3 - 3 * u2 + 1, b = u3 - 2 * u2 + u, c = -2 * u3 + 3 * u2, d = u3 - u2;
  return { x: a * p1.x + b * h * m1.x + c * p2.x + d * h * m2.x, y: a * p1.y + b * h * m1.y + c * p2.y + d * h * m2.y }; }
const PERCH = [[ARR[0], ARR[0] + 0.4], [ARR[1], ARR[1] + 0.4], [ARR[2], ARR[2] + 0.4], [ARR[3], 13.4], [14.7, LAP0], [LAP1, DUR]];
const stillAt = t => PERCH.reduce((m, [a, b]) => Math.max(m, smoothstep(a, a + 0.3, t) * (1 - smoothstep(b - 0.15, b, t))), 0);
// one lap inside the ring after it closes (an ellipse through the centre)
function lap(t) { const u = EASE.rest(clamp((t - LAP0) / (LAP1 - LAP0))), a = TAU * u; return { x: 125 * Math.sin(a), y: -70 * (1 - Math.cos(a)) }; }
const wpos = t => { const p = herm(t), q = lap(t); return { x: p.x + q.x, y: p.y + q.y + Math.sin(t * 2.4) * 5 * stillAt(t) }; };
const wvel = t => { const a = wpos(t - 1 / 240), b = wpos(t + 1 / 240); return { x: (b.x - a.x) * 120, y: (b.y - a.y) * 120 }; };
function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
    a += (sp < 40 ? 0 : clamp(Math.atan2(v.y, Math.abs(v.x)), -0.75, 0.75) * clamp(sp / 300)) * w; s += w; } return a / s; }
// facing: moving → the way you go; perched → the way you will go next (turn on landing, never mid-hop)
const FT = []; { const n = DUR * 120, V = []; for (let i = 0; i <= n; i++) V.push(wvel(i / 120).x);
  let f = 1; for (let i = n; i >= 0; i--) { if (Math.abs(V[i]) > 40) f = Math.sign(V[i]); FT[i] = f; } }
const faceRaw = t => FT[clamp(Math.round(t * 120), 0, FT.length - 1)];
function facing(t) { let s = 0, n = 0; for (let k = -7; k <= 7; k++) { s += faceRaw(t + k / 120); n++; } return s / n; }

// ---------- camera: line fills the width; push in on the discord seam through the glue; ease out for the ring ----------
const CB = { x: 0, y: -55, z: 1.1 }, CP = { x: SEAM[BAD], y: g(SEAM[BAD]) - 75, z: 1.62 }, CR = { x: 0, y: -R0 + 85, z: 1.1 };
function cam(t) { const k0 = ramp(t, 0, 4.0, EASE.rest), kin = ramp(t, 9.7, 10.9, EASE.rest), kout = ramp(t, 12.95, 14.6, EASE.rest), kr = ramp(t, 13.4, 15.6, EASE.rest);
  const pk = kin * (1 - kout), lerp3 = (a, b, c) => lerp(lerp(a, b, pk), c, kr);
  const zb = lerp(1.17, CB.z, k0) + 0.02 * Math.sin(t * 0.9) * ramp(t, 16, 18);
  return { x: lerp3(CB.x + 12 * Math.sin(t * 0.23), CP.x, CR.x), y: lerp3(CB.y, CP.y, CR.y), z: lerp3(zb, CP.z, zb), ax: 960, ay: 540 }; }

// ---------- READ (captions, card, station words) ----------
const STATIONS = [['Stalk', 2.6, 4.4], ['Overlap', 4.4, 6.4], ['Compare', 6.4, 9.7], ['Discord', 9.7, 12.4], ['Glue', 12.4, 14.3], ['Section', 14.3, 18.6]];
const CAPS = [
  { id: 'c1', in: 2.3, out: 4.6, fi: 0.3, fo: 0.3, text: 'Five notes. Each keeps its own view.' },
  { id: 'c3', in: 4.75, out: 8.9, fi: 0.3, fo: 0.3, text: 'Where two notes overlap, read both ends.' },
  { id: 'c4', in: 9.8, out: 12.0, fi: 0.3, fo: 0.3, text: 'One seam disagrees. Show it.' },
  { id: 'c5', in: 12.05, out: 14.2, fi: 0.3, fo: 0.3, text: 'Reconcile it, and every overlap agrees.' },
  { id: 'c6', in: 14.3, out: 16.3, fi: 0.3, fo: 0.3, text: 'One consistent whole.' },
  { id: 'not', in: 16.4, out: 18.7, fi: 0.3, fo: 0.3, text: 'Glued is not the same as true.' },
  { id: 'end', in: 18.8, out: DUR - 2.2, fi: 0.3, fo: 0.3, text: 'Check each note against its neighbours. Show disagreements; never overwrite them.', size: 34 },
];
const CARD = { id: 'card', in: 9.9, out: 13.25, fi: 0.3, fo: 0.3, text: 'Real case · film check 18 vs 20 captions 6 text, 3 timing mismatches' };
const READ = [{ id: 'eyebrow', in: 0.25, out: 2.5, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 03' }, { id: 'title', in: 0.25, out: 2.5, fi: 0.4, fo: 0.45, text: 'Memory that agrees.' }, ...CAPS, CARD,
  ...STATIONS.map(([w, a, b]) => ({ id: 'st-' + w, in: a, out: b, fi: 0.15, fo: 0.15, text: w }))];

// ---------- drawing helpers ----------
function strokePts(c, pts, col, lw, a = 1) { if (pts.length < 2) return; c.save(); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); pts.forEach(([x, y], k) => k ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.restore(); }
function chevron(c, x, y, dir, s, col, a) { c.save(); c.globalAlpha *= a; c.fillStyle = col; c.beginPath(); c.moveTo(x + dir * s, y); c.lineTo(x - dir * s * 0.6, y - s * 0.8); c.lineTo(x - dir * s * 0.6, y + s * 0.8); c.closePath(); c.fill(); c.restore(); }
// the fused line: arc length u ∈ [-L/2, L/2] bent at uniform curvature kap (length preserved), wave offset along the normal
function linePt(u, kap, amp) { let bx = u, by = 0, nx = 0, ny = 1;
  if (kap > 1e-7) { bx = Math.sin(kap * u) / kap; by = -(1 - Math.cos(kap * u)) / kap; nx = Math.sin(kap * u); ny = Math.cos(kap * u); }
  const o = g(u) * amp; return [bx + nx * o, by + ny * o]; }

function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
  S.ground(c, t, cm, { tint: TINT });

  const G = glue(t), fz = ramp(t, FUSE0, FUSE1, EASE.warm), fuseFade = 1 - ramp(t, FUSE1 - 0.2, FUSE1 + 0.35, EASE.rest);
  const zipL = lerp(SEAM[BAD], -800 - OV - 20, fz), zipR = lerp(SEAM[BAD], 800 + OV + 20, ramp(t, FUSE0, FUSE0 + 0.45, EASE.warm));
  const fusing = t >= FUSE0;

  // ---------- overlap bands (under the notes) ----------
  for (let j = 0; j < 4; j++) { const ap = ramp(t, OVA[j], OVA[j] + 0.3, EASE.glaser) * fuseFade; if (ap <= 0.001) continue;
    const sx = SEAM[j], yc = g(sx), bad = j === BAD, ver = ramp(t, VER[j], VER[j] + 0.2, EASE.glaser), ok = bad ? ramp(t, SNAP, SNAP + 0.3, EASE.glaser) : ver;
    const hgt = 230 * ap, x0 = X(sx - OV), x1 = X(sx + OV), y0 = Y(yc - hgt / 2), y1 = Y(yc + hgt / 2);
    c.fillStyle = rgba(C.slate, 0.1 * ap); c.fillRect(x0, y0, x1 - x0, y1 - y0);
    if (ok > 0) { c.fillStyle = rgba(TEALG, 0.6 * ok * ap); c.fillRect(x0, y0, x1 - x0, y1 - y0); }
    if (bad && ver > 0) { const pulse = 0.5 + 0.5 * Math.cos(TAU * (t - VER[j]) / B); c.fillStyle = rgba(TERRA, (0.2 + 0.1 * pulse) * ver * (1 - ok) * ap); c.fillRect(x0, y0, x1 - x0, y1 - y0); }
    c.save(); c.strokeStyle = rgba(C.slate, 0.55 * ap); c.lineWidth = 1.6; c.setLineDash([4, 6]); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.moveTo(x1, y0); c.lineTo(x1, y1); c.stroke(); c.restore(); }

  // ---------- discord glow (local, never full frame) ----------
  { const v = ramp(t, VER[BAD], VER[BAD] + 0.25, EASE.glaser) * (1 - ramp(t, SNAP, SNAP + 0.4, EASE.rest)); if (v > 0) {
      const sx = SEAM[BAD], ym = (rowY(BAD, sx, t) + rowY(BAD + 1, sx, t)) / 2, pulse = 0.5 + 0.5 * Math.cos(TAU * (t - VER[BAD]) / B), R = (110 + 14 * pulse) * z;
      const gr = c.createRadialGradient(X(sx), Y(ym), 0, X(sx), Y(ym), R); gr.addColorStop(0, rgba(TERRA, 0.38 * v)); gr.addColorStop(1, rgba(TERRA, 0));
      c.fillStyle = gr; c.beginPath(); c.arc(X(sx), Y(ym), R, 0, TAU); c.fill(); } }

  // ---------- the notes ----------
  const segA = i => ramp(t, 2.35 + 0.08 * (4 - i), 2.95 + 0.08 * (4 - i), EASE.warm);
  c.save();
  if (fusing) { c.beginPath(); c.rect(0, 0, X(zipL), H); c.rect(X(zipR), 0, W - X(zipR), H); c.clip(); }
  if (fuseFade > 0) for (let i = 0; i < 5; i++) { const a = segA(i); if (a <= 0) continue; const pts = [];
    for (let x = segL(i); x <= segR(i) + 0.01; x += 6) { const p = notePt(i, x, t); pts.push([X(p.x), Y(p.y)]); }
    strokePts(c, pts, NOTE, 6 * z, a);
    for (const [px, py] of [pts[0], pts[pts.length - 1]]) { c.save(); c.globalAlpha = a; c.fillStyle = KNOB; c.strokeStyle = NOTE; c.lineWidth = 4 * z; c.beginPath(); c.arc(px, py, 10 * z, 0, TAU); c.fill(); c.stroke(); c.restore(); } }
  c.restore();

  // ---------- compare: chevrons read each end, then the verdict; the bad seam shows a terracotta gap bracket ----------
  for (let j = 0; j < 4; j++) { const ar = ARR[j], k = ramp(t, ar, ar + 0.25, EASE.glaser); if (k <= 0 || !(t < FUSE1)) continue;
    const sx = SEAM[j], bad = j === BAD, ver = ramp(t, VER[j], VER[j] + 0.2, EASE.glaser), yl = rowY(j, sx, t), yr = rowY(j + 1, sx, t);
    const ok = bad ? ramp(t, SNAP, SNAP + 0.25, EASE.glaser) : ver, chev = k * (1 - (bad ? ok : ver)) * (1 - ramp(t, FUSE0, FUSE0 + 0.3)), d = lerp(80, 30, k);
    if (bad && ver > 0 && ok < 1) { const ba = ver * (1 - ok), bx = X(sx + OV + 26); c.save(); c.globalAlpha = ba; c.strokeStyle = TERRA; c.lineCap = 'round'; c.lineJoin = 'round';
      c.lineWidth = 5 * z; c.beginPath(); c.moveTo(X(sx), Y(yl)); c.lineTo(X(sx), Y(yr)); c.stroke();
      c.lineWidth = 5; c.beginPath(); c.moveTo(bx - 16, Y(yl)); c.lineTo(bx, Y(yl)); c.lineTo(bx, Y(yr)); c.lineTo(bx - 16, Y(yr)); c.stroke();
      c.beginPath(); c.moveTo(bx, Y((yl + yr) / 2)); c.lineTo(bx + 14, Y((yl + yr) / 2)); c.stroke(); c.restore(); }
    if (chev > 0) { chevron(c, X(sx - d), Y(rowY(j, sx - d, t)) - 30 * z, 1, 18 * z, BLACK, chev); chevron(c, X(sx + d), Y(rowY(j + 1, sx + d, t)) + 30 * z, -1, 18 * z, BLACK, chev);
      c.save(); c.globalAlpha = chev; c.fillStyle = BLACK; c.beginPath(); c.arc(X(sx), Y(yl), 6 * z, 0, TAU); c.arc(X(sx), Y(yr), 6 * z, 0, TAU); c.fill(); c.restore(); }
    if (ok > 0) { const r = (22 + (bad ? 10 * Math.exp(-(t - SNAP) * 4) : 0)) * z; c.save(); c.globalAlpha = ok * fuseFade; c.strokeStyle = TEAL; c.lineWidth = 5 * z; c.beginPath(); c.arc(X(sx), Y(yl), r * (0.6 + 0.4 * ok), 0, TAU); c.stroke(); c.restore(); }
    if (bad && t > SNAP && t < SNAP + 0.9) { const u = (t - SNAP) / 0.9, r = lerp(24, 150, EASE.glaser(u)) * z; c.save(); c.globalAlpha = 0.6 * (1 - u); c.strokeStyle = TEAL; c.lineWidth = 4 * z; c.beginPath(); c.arc(X(sx), Y(yl), r, 0, TAU); c.stroke(); c.restore(); } }

  // ---------- the section: one line, fused outward from the glued seam, smoothed, then bent into a clean ring ----------
  if (fusing) { const Kb = ramp(t, BEND0, CLOSE, EASE.rest), kap = TAU / L * Kb, amp = 1 - ramp(t, FUSE1 - 0.3, BEND0 + 0.75, EASE.rest);
    const pts = []; for (let u = -800; u <= 800.01; u += 6) { const [x, y] = linePt(u, kap, amp); pts.push([X(x), Y(y)]); }
    c.save(); if (t < FUSE1 + 0.05) { c.beginPath(); c.rect(X(zipL), 0, X(zipR) - X(zipL), H); c.clip(); }
    const closeGlow = t > CLOSE ? Math.exp(-(t - CLOSE) * 2.2) : 0;
    strokePts(c, pts, TEALG, (20 + 12 * closeGlow) * z, 0.75);
    strokePts(c, pts, TEAL, 7 * z, 1); c.restore();
    if (t < FUSE1 + 0.1) for (const zx of [zipL, zipR]) { if (zx < -800 || zx > 800) continue; const gr = c.createRadialGradient(X(zx), Y(g(zx)), 0, X(zx), Y(g(zx)), 40 * z);
      gr.addColorStop(0, rgba(TEALG, 0.95)); gr.addColorStop(1, rgba(TEALG, 0)); c.fillStyle = gr; c.beginPath(); c.arc(X(zx), Y(g(zx)), 40 * z, 0, TAU); c.fill(); }
    // closing: a ripple, then a teal pulse that keeps travelling round the ring (the whole agrees, end to end)
    if (t > CLOSE && t < CLOSE + 1.2) { const u = (t - CLOSE) / 1.2; c.save(); c.globalAlpha = 0.55 * (1 - u); c.strokeStyle = TEAL; c.lineWidth = 3 * z;
      c.beginPath(); c.arc(X(0), Y(-R0), (R0 + 24 + 80 * EASE.glaser(u)) * z, 0, TAU); c.stroke(); c.restore(); }
    const pa = ramp(t, CLOSE, CLOSE + 0.4); if (pa > 0) { const th = -Math.PI / 2 + TAU * (t - CLOSE) / 2.0, cx = X(0), cy = Y(-R0), r = R0 * z;
      c.save(); c.lineCap = 'round'; for (let k = 0; k < 14; k++) { const a0 = th - k * 0.05; c.strokeStyle = rgba(TEALG, pa * 0.95 * (1 - k / 14)); c.lineWidth = (22 - k) * z;
        c.beginPath(); c.arc(cx, cy, r, a0 - 0.05, a0); c.stroke(); }
      c.globalAlpha = pa; c.fillStyle = TEAL; c.beginPath(); c.arc(cx + Math.cos(th) * r, cy + Math.sin(th) * r, 9 * z, 0, TAU); c.fill(); c.restore(); } }

  // ---------- the whale ----------
  { const p = wpos(t), f = facing(t), ang = heading(t), v = wvel(t), sp = Math.hypot(v.x, v.y), still = sp < 60;
    let blink = 0; for (const b of [3.0, 6.0, 11.0, 15.2, 19.6, 22.9]) blink = Math.max(blink, 1 - Math.abs(t - b) / 0.07);
    const focus = Math.max(win(t, ARR[0] - 0.1, ARR[3] + 0.2, 0.25, 0.15), win(t, GL0 - 0.3, SNAP, 0.3, 0.1), 0.6 * win(t, 16.6, 18.6, 0.4, 0.4) * 0);
    const surprise = win(t, VER[BAD], VER[BAD] + 0.8, 0.08, 0.3), spark = win(t, SNAP, SNAP + 1.3, 0.1, 0.4);
    const delight = (t > SNAP + 0.02 && t < 13.4) || t > CLOSE + 0.05 ? 1 : 0;
    let squash = 0; for (const ta of [...ARR, 14.7]) squash += 0.05 * Math.sin(Math.PI * clamp((t - ta) / 0.28));
    squash += 0.1 * Math.sin(Math.PI * clamp((t - SNAP + 0.06) / 0.3));
    const spray = win(t, CLOSE, CLOSE + 0.9, 0.12, 0.35);
    c.save(); c.translate(X(p.x), Y(p.y)); c.scale(Math.abs(f) < 0.08 ? 0.08 * Math.sign(f || 1) : f, 1);
    KH.drawWhale(c, { x: 0, y: 0, ang: f < 0 ? -ang : ang, scale: 0.62 * z, L: 1, tail: Math.sin(t * (still ? 3 : 10)) * (still ? 0.12 : 0.3), fin: Math.sin(t * (still ? 3 : 10) + 1.3) * 0.3 + (t > GL0 && t < SNAP ? 0.25 * Math.sin(t * 9) : 0),
      blink, focus: delight ? 0 : focus, eye: 1 + 0.3 * surprise, spark, sparkColor: TEAL, sparkScale: 1.4, delight, blush: 0.5, mouth: delight ? 0.4 : 0.12 * surprise, squash, spray, sprayColor: TEAL });
    c.restore(); }

  // ---------- real case card (framed, screen-fixed, top left while the camera is pushed in on the right) ----------
  { const a = win(t, CARD.in, CARD.out, CARD.fi, CARD.fo); if (a > 0) { const x0 = 160, y0 = 190, w = 470, h = 172, dy = (1 - EASE.defer(clamp((t - CARD.in) / CARD.fi))) * 10;
      c.save(); c.globalAlpha = a; c.fillStyle = C.paper; c.strokeStyle = mix(C.paper, C.slate, 0.45); c.lineWidth = 1.5; c.beginPath(); c.roundRect(x0, y0 + dy, w, h, 10); c.fill(); c.stroke();
      c.fillStyle = TERRA; c.fillRect(x0, y0 + dy + 16, 7, h - 32); c.restore();
      text(c, 'Real case · film check', x0 + 34, y0 + dy + 44, { f: 'mono', size: 18, col: SOFT, a });
      text(c, '18 vs 20 captions', x0 + 34, y0 + dy + 98, { f: 'sans', size: 40, col: INK, a });
      text(c, '6 text, 3 timing mismatches', x0 + 34, y0 + dy + 142, { f: 'sans', size: 27, col: INK, a }); } }

  // ---------- chrome: station rail (top left) and the seam counter (top right) ----------
  { const ra = ramp(t, 2.4, 2.9) * (1 - ramp(t, 18.5, 19.0)); if (ra > 0) { let x = 160;
      for (let s = 0; s < STATIONS.length; s++) { const [w, a, b] = STATIONS[s], on = win(t, a, b, 0.15, 0.15);
        const tw = text(c, w, x, 116, { f: on > 0.5 ? 'monoB' : 'mono', size: 19, col: on > 0.5 ? INK : FUT, a: ra });
        if (on > 0) { c.save(); c.globalAlpha = ra * on; c.fillStyle = w === 'Discord' ? TERRA : TEAL; c.fillRect(x, 130, tw * EASE.glaser(clamp((t - a) / 0.3)), 5); c.restore(); }
        x += tw + (s < STATIONS.length - 1 ? text(c, '·', x + tw + 14, 116, { f: 'mono', size: 19, col: FUT, a: ra, track: 0 }) + 28 : 0); } } }
  { const sa = ramp(t, ARR[0], ARR[0] + 0.3) * (1 - ramp(t, 18.5, 19.0)); if (sa > 0) {
      const agree = VER.filter((v, j) => j !== BAD && t >= v).length + (t >= SNAP ? 1 : 0), disc = t >= VER[BAD] && t < SNAP ? 1 : 0;
      const tw = text(c, `discord ${disc}`, 1760, 116, { f: disc ? 'monoB' : 'mono', size: 19, col: INK, a: sa, align: 'right' });
      if (disc) { c.save(); c.globalAlpha = sa; c.fillStyle = TERRA; c.fillRect(1760 - tw, 130, tw, 5); c.restore(); }
      text(c, `agree ${agree} / 4  ·  `, 1760 - tw, 116, { f: 'mono', size: 19, col: INK, a: sa, align: 'right' }); } }

  // ---------- opening, captions, lockup ----------
  S.open(c, t, EP);
  for (const r of CAPS) S.caption(c, t, r, { size: r.size });
  S.lockup(c, t, DUR - 2.2, EP);
  const fb = 1 - ramp(t, 0, 0.35); if (fb > 0) { c.fillStyle = rgba(GROUND, fb); c.fillRect(0, 0, W, H); }
  c.restore();
}

function cues() { const laps = []; for (let x = CLOSE + 2.0; x < DUR; x += 2.0) laps.push(+x.toFixed(3));
  return { bpm: 120, dur: DUR, title: 0.3, enter: 1.5, settle: SETTLE, overlap: OVA, arrive: ARR, verdict: VER, bad: BAD, glue0: GL0, snap: SNAP, pushIn: 9.7, pushOut: 12.95,
  fuse0: FUSE0, fuse1: FUSE1, bend0: BEND0, close: CLOSE, lap0: LAP0, lap1: LAP1, pulseLaps: laps, notThis: CAPS[5].in, end: CAPS[6].in, lockup: DUR - 2.2, card: CARD.in,
  stations: STATIONS.map(s => s[1]), captions: CAPS.map(r => r.in) }; }
const CONTRAST = [['caption ink on paper chip', INK, C.paper], ['open eyebrow slate on ground', SOFT, GROUND], ['open title ink on ground', INK, GROUND], ['title accent (teal→navy) on ground', ACCENT, GROUND],
  ['rail active ink on ground', INK, GROUND], ['rail inactive on ground', FUT, GROUND], ['counter ink on ground', INK, GROUND],
  ['card eyebrow slate on paper', SOFT, C.paper], ['card body ink on paper', INK, C.paper], ['lockup slate on ground', SOFT, GROUND]];
const shutter = t => (t > 1.3 && t < 6.6) || (t > 13.3 && t < 15.0) || (t > LAP0 && t < LAP1) ? [3, 0.6] : [2, 0.5];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, DUR, W, H, fps: 60, shutter, wpos, heading, cam };
})(typeof window !== 'undefined' ? window : globalThis);
