// CETI Capabilities · 03 · glue — "Memory that agrees." Kinetic Hydrography 1.0.0 + series layer.
// Sheaf memory as a lens: five notes (wave segments), each with its own local view. Every overlap is read both ways;
// one seam disagrees (terracotta), the whale reconciles it (teal), the pieces fuse into one wave that closes into a ring.
// drawFrame(ctx, t) is a pure function of t; randomness only via KH.rng at load time.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, smoothstep, win, EASE, ramp, rng, mix, rgba, text } = KH;
const W = 1920, H = 1080, B = 60 / 120, DUR = 27, beat = n => n * B;

// ---------- colour (Wada 207 + CETI) ----------
const TINT = WD.glaucousGreen, GROUND = mix(C.paper, TINT, 0.06), INK = C.navy, SOFT = C.slate;
const TEAL = mix(WD.glaucousGreen, C.navy, 0.45), TEALG = WD.glaucousGreen, TERRA = WD.sudanBrown, BLACK = WD.black;
const NOTE = mix(C.slate, C.navy, 0.35), KNOB = C.paper;
let ka = 0.3; while (KH.contrast(mix(WD.glaucousGreen, C.navy, ka), GROUND) < 4.6 && ka < 1) ka += 0.02;
const ACCENT = mix(WD.glaucousGreen, C.navy, ka);                         // the title's accent word, teal mixed toward navy
let kf = 0.4; while (KH.contrast(mix(GROUND, C.slate, kf), GROUND) < 4.6 && kf < 1) kf += 0.02;
const FUT = mix(GROUND, C.slate, kf);                                       // rail words not yet reached
const EP = { no: '03', accent: ACCENT, title: 'Memory that <i>agrees</i>.', short: 'Sheaf memory' };

// ---------- the wave: one shared shape, periodic over its length so it can close into a ring ----------
const L = 1600, OV = 34, TAU = Math.PI * 2;
const g = (x, ph = 0) => 40 * Math.sin(TAU * 2 * (x - ph) / L + 0.5) + 8 * Math.sin(TAU * 5 * (x - ph) / L + 1.1);
const XC = [0, 1, 2, 3, 4].map(i => -640 + 320 * i), SEAM = [-480, -160, 160, 480], BAD = 2;
const segL = i => i === 0 ? -800 : XC[i] - 160 - OV, segR = i => i === 4 ? 800 : XC[i] + 160 + OV;

// ---------- time keys ----------
const SETTLE = [0, 1, 2, 3, 4].map(i => beat(8 + i));                 // 4.0 … 6.0, as the whale passes each note
const ARR = [8.5, 9.5, 10.5, 11.5], VER = ARR.map(a => a + 0.25);      // compare: whale lands, then the verdict
const BACK = 12.6, GL0 = 13.7, SNAP = beat(30), FUSE0 = beat(34), FUSE1 = beat(36), BEND0 = 18.7, CLOSE = 20.6;
const glue = t => 0.6 * ramp(t, GL0, SNAP - 0.25, EASE.rest) + 0.4 * ramp(t, SNAP - 0.22, SNAP, EASE.glaser);

// discord: note 3's right end sits high, note 4's left end sits low; both move to meet (neither overwrites the other)
function endOff(i, x, t) { let o = 0;
  if (i === 2) o -= 52 * smoothstep(XC[2] + 30, segR(2), x);
  if (i === 3) o += 40 * (1 - smoothstep(segL(3), XC[3] - 30, x));
  return o * (1 - glue(t)); }

// the mess: each note's own local view (seeded)
const MESS = []; { const R = rng(2071), DY = [-150, 135, -40, 175, -120];
  for (let i = 0; i < 5; i++) MESS.push({ dx: (R() - 0.5) * 120, dy: DY[i] + (R() - 0.5) * 30, rot: (R() - 0.5) * 0.5, amp: 18 + R() * 34, lam: 190 + R() * 220, ph: R() * TAU, bp: R() * TAU }); }
function notePt(i, x, t) {
  const s = ramp(t, SETTLE[i] - 0.12, SETTLE[i] + 0.36, EASE.glaser), m = MESS[i], u = x - XC[i];
  const ly = m.amp * Math.sin(TAU * u / m.lam + m.ph), cs = Math.cos(m.rot), sn = Math.sin(m.rot);
  const mx = XC[i] + m.dx + 18 * Math.sin(t * 0.7 + m.bp) + u * cs - ly * sn, my = m.dy + 10 * Math.sin(t * 1.3 + m.bp) + u * sn + ly * cs;
  return { x: lerp(mx, x, s), y: lerp(my, g(x) + endOff(i, x, t), s) }; }
const rowY = (i, x, t) => g(x) + endOff(i, x, t);

// ---------- the whale's path: Hermite through keys; 'stop' keys have zero tangent (a perch) ----------
const P = j => g(SEAM[j]) - 128;
const P3b = g(SEAM[BAD]) - 52 - 104;
const KEYS = [[0, -1400, -230, 1], [1.3, -1300, -230], [2.6, -930, -290], [3.5, -760, -205], [4.0, -640, -178], [4.5, -320, -186], [5.0, 0, -178], [5.5, 320, -186], [6.0, 640, -178],
  [6.6, 790, -290], [7.4, 260, -385], [8.1, -330, -300], [8.5, -480, P(0), 1],
  [8.95, -480, P(0), 1], [9.22, -320, Math.min(P(0), P(1)) - 70], [9.5, -160, P(1), 1],
  [9.95, -160, P(1), 1], [10.22, 0, Math.min(P(1), P(2)) - 70], [10.5, 160, P(2), 1],
  [10.95, 160, P(2), 1], [11.22, 320, Math.min(P(2), P(3)) - 70], [11.5, 480, P(3), 1],
  [12.0, 480, P(3), 1], [12.3, 320, Math.min(P(3), P3b) - 80], [BACK, 160, P3b, 1],
  [17.1, 160, P3b, 1], [17.9, 70, -232], [18.6, 0, -255, 1], [DUR, 0, -255, 1]];
const PK = KEYS.map(([t, x, y, s]) => ({ t, x, y, s: !!s }));
function herm(t) { const Q = PK, n = Q.length; if (t <= Q[0].t) return { x: Q[0].x, y: Q[0].y }; if (t >= Q[n - 1].t) return { x: Q[n - 1].x, y: Q[n - 1].y };
  let i = 0; while (Q[i + 1].t < t) i++; const p1 = Q[i], p2 = Q[i + 1], h = p2.t - p1.t, u = (t - p1.t) / h;
  const tan = k => { if (Q[k].s) return { x: 0, y: 0 }; const a = Q[Math.max(0, k - 1)], b = Q[Math.min(n - 1, k + 1)]; return { x: (b.x - a.x) / (b.t - a.t), y: (b.y - a.y) / (b.t - a.t) }; };
  const m1 = tan(i), m2 = tan(i + 1), u2 = u * u, u3 = u2 * u, a = 2 * u3 - 3 * u2 + 1, b = u3 - 2 * u2 + u, c = -2 * u3 + 3 * u2, d = u3 - u2;
  return { x: a * p1.x + b * h * m1.x + c * p2.x + d * h * m2.x, y: a * p1.y + b * h * m1.y + c * p2.y + d * h * m2.y }; }
const PERCH = [[8.5, 8.95], [9.5, 9.95], [10.5, 10.95], [11.5, 12.0], [BACK, 17.1], [18.6, DUR]];
const stillAt = t => PERCH.reduce((m, [a, b]) => Math.max(m, smoothstep(a, a + 0.3, t) * (1 - smoothstep(b - 0.15, b, t))), 0);
const wpos = t => { const p = herm(t); return { x: p.x, y: p.y + Math.sin(t * 2.4) * 5 * stillAt(t) }; };
const wvel = t => { const a = wpos(t - 1 / 240), b = wpos(t + 1 / 240); return { x: (b.x - a.x) * 120, y: (b.y - a.y) * 120 }; };
function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
    a += (sp < 40 ? 0 : clamp(Math.atan2(v.y, Math.abs(v.x)), -0.8, 0.8) * clamp(sp / 300)) * w; s += w; } return a / s; }
// facing: last clear horizontal direction (precomputed table, so it is still a pure function of t), turned smoothly
// moving: face the way you go; perched: face the way you will go next (turn on landing, never mid-hop)
const FT = []; { const n = DUR * 120, V = []; for (let i = 0; i <= n; i++) V.push(wvel(i / 120).x);
  let f = 1; for (let i = n; i >= 0; i--) { if (Math.abs(V[i]) > 40) f = Math.sign(V[i]); FT[i] = f; } f = FT[0];
  for (let i = 0; i <= n; i++) { if (Math.abs(V[i]) > 40) FT[i] = Math.sign(V[i]); } }
const faceRaw = t => FT[clamp(Math.round(t * 120), 0, FT.length - 1)];
function facing(t) { let s = 0, n = 0; for (let k = -6; k <= 6; k++) { s += faceRaw(t + k / 120); n++; } return lerp(s / n, 1, ramp(t, 18.9, 19.35, EASE.warm)); }

// the overlaps light up as the whale crosses each seam on its loop back
const OVA = SEAM.map(sx => { for (let t = 6.0; t < 8.6; t += 1 / 240) if (herm(t).x <= sx) return +t.toFixed(3); return 8.0; });

// ---------- camera ----------
function cam(t) { const k0 = ramp(t, 0, 4.5, EASE.rest), k1 = ramp(t, 16.9, 19.8, EASE.rest);
  const z = lerp(lerp(1.06, 1.0, k0), 1.04, k1);
  return { x: lerp(-90, 0, k0) + 14 * Math.sin(t * 0.23) * (1 - k1), y: lerp(-60, -255 + 90 / 1.04, k1), z, ax: 960, ay: 540 }; }

// ---------- READ (captions, card, station words) ----------
const STATIONS = [['Stalk', 4.0, 6.4], ['Overlap', 6.4, 8.3], ['Compare', 8.3, 10.7], ['Discord', 10.7, 13.4], ['Glue', 13.4, 16.8], ['Section', 16.8, 21.3]];
const CAPS = [
  { id: 'c1', in: 2.35, out: 4.4, fi: 0.3, fo: 0.3, text: 'Five notes. Five local views.' },
  { id: 'c2', in: 4.5, out: 6.7, fi: 0.3, fo: 0.3, text: 'Each note keeps its own view.' },
  { id: 'c3', in: 6.85, out: 10.6, fi: 0.3, fo: 0.3, text: 'Where two notes overlap, read both ends.' },
  { id: 'c4', in: 10.85, out: 13.4, fi: 0.3, fo: 0.3, text: 'One seam disagrees. Show it.' },
  { id: 'c5', in: 13.6, out: 16.75, fi: 0.3, fo: 0.3, text: 'Reconcile it, and every overlap agrees.' },
  { id: 'c6', in: 17.0, out: 21.05, fi: 0.3, fo: 0.3, text: 'The pieces glue into one whole.' },
  { id: 'not', in: 21.2, out: 23.5, fi: 0.3, fo: 0.3, text: 'Glued is not the same as true.' },
  { id: 'end', in: 23.55, out: DUR, fi: 0.4, fo: 0, text: 'Check each note against its neighbours. Show disagreements; never overwrite them.', size: 34 },
];
const CARD = { id: 'card', in: 10.9, out: 14.3, fi: 0.3, fo: 0.3, text: 'Real case · film check 18 vs 20 captions 6 text, 3 timing mismatches' };
const OPEN_OUT = 2.5;
const READ = [{ id: 'eyebrow', in: 0.25, out: OPEN_OUT, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 03' }, { id: 'title', in: 0.25, out: OPEN_OUT, fi: 0.4, fo: 0.45, text: 'Memory that agrees.' }, ...CAPS, CARD,
  ...STATIONS.map(([w, a, b]) => ({ id: 'st-' + w, in: a, out: b, fi: 0.15, fo: 0.15, text: w }))];

// ---------- drawing helpers ----------
function strokePts(c, pts, col, lw, a = 1) { if (pts.length < 2) return; c.save(); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); pts.forEach(([x, y], k) => k ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.restore(); }
function chevron(c, x, y, dir, s, col, a) { c.save(); c.globalAlpha *= a; c.fillStyle = col; c.beginPath(); c.moveTo(x + dir * s, y); c.lineTo(x - dir * s * 0.6, y - s * 0.8); c.lineTo(x - dir * s * 0.6, y + s * 0.8); c.closePath(); c.fill(); c.restore(); }

function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
  S.ground(c, t, cm, { tint: TINT });

  const G = glue(t), fz = ramp(t, FUSE0, FUSE1, EASE.warm), fuseFade = 1 - ramp(t, FUSE1 - 0.2, FUSE1 + 0.4, EASE.rest);
  const zipL = lerp(SEAM[BAD], -800 - OV - 20, fz), zipR = lerp(SEAM[BAD], 800 + OV + 20, ramp(t, FUSE0, FUSE1 - 0.25, EASE.warm));
  const fusing = t >= FUSE0;

  // ---------- overlap bands (under the notes) ----------
  for (let j = 0; j < 4; j++) { const ap = ramp(t, OVA[j], OVA[j] + 0.3, EASE.glaser) * fuseFade; if (ap <= 0.001) continue;
    const sx = SEAM[j], yc = g(sx), bad = j === BAD, ver = ramp(t, VER[j], VER[j] + 0.2, EASE.glaser), ok = bad ? ramp(t, SNAP, SNAP + 0.3, EASE.glaser) : ver;
    const hgt = 150 * ap, x0 = X(sx - OV), x1 = X(sx + OV), y0 = Y(yc) - hgt / 2 * z, y1 = Y(yc) + hgt / 2 * z;
    c.fillStyle = rgba(C.slate, 0.07 * ap); c.fillRect(x0, y0, x1 - x0, y1 - y0);
    if (ok > 0) { c.fillStyle = rgba(TEALG, 0.42 * ok * ap); c.fillRect(x0, y0, x1 - x0, y1 - y0); }
    if (bad && ver > 0) { const pulse = 0.5 + 0.5 * Math.cos(TAU * (t - VER[j]) / B); c.fillStyle = rgba(TERRA, (0.14 + 0.08 * pulse) * ver * (1 - ok) * ap); c.fillRect(x0, y0, x1 - x0, y1 - y0); }
    c.save(); c.strokeStyle = rgba(C.slate, 0.5 * ap); c.lineWidth = 1.2; c.setLineDash([3, 5]); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.moveTo(x1, y0); c.lineTo(x1, y1); c.stroke(); c.restore(); }

  // ---------- discord glow (local, never full frame) ----------
  { const v = ramp(t, VER[BAD], VER[BAD] + 0.25, EASE.glaser) * (1 - ramp(t, SNAP - 0.1, SNAP + 0.35, EASE.rest)); if (v > 0) {
      const sx = SEAM[BAD], ym = (rowY(2, sx, t) + rowY(3, sx, t)) / 2, pulse = 0.5 + 0.5 * Math.cos(TAU * (t - VER[BAD]) / B), R = (95 + 12 * pulse) * z;
      const gr = c.createRadialGradient(X(sx), Y(ym), 0, X(sx), Y(ym), R); gr.addColorStop(0, rgba(TERRA, 0.32 * v)); gr.addColorStop(1, rgba(TERRA, 0));
      c.fillStyle = gr; c.beginPath(); c.arc(X(sx), Y(ym), R, 0, TAU); c.fill(); } }

  // ---------- the notes ----------
  const segA = i => ramp(t, 2.25 + 0.08 * i, 2.9 + 0.08 * i, EASE.warm);
  c.save();
  if (fusing) { c.beginPath(); c.rect(0, 0, X(zipL), H); c.rect(X(zipR), 0, W - X(zipR), H); c.clip(); }
  if (fuseFade > 0) for (let i = 0; i < 5; i++) { const a = segA(i); if (a <= 0) continue; const pts = [];
    for (let x = segL(i); x <= segR(i) + 0.01; x += 8) { const p = notePt(i, x, t); pts.push([X(p.x), Y(p.y)]); }
    strokePts(c, pts, NOTE, 5 * z, a);
    for (const [px, py] of [pts[0], pts[pts.length - 1]]) { c.save(); c.globalAlpha = a; c.fillStyle = KNOB; c.strokeStyle = NOTE; c.lineWidth = 3 * z; c.beginPath(); c.arc(px, py, 7 * z, 0, TAU); c.fill(); c.stroke(); c.restore(); } }
  c.restore();

  // ---------- compare: chevrons read each end, then the verdict ----------
  for (let j = 0; j < 4; j++) { const ar = ARR[j], k = ramp(t, ar, ar + 0.25, EASE.glaser); if (k <= 0 || !(t < FUSE1)) continue;
    const sx = SEAM[j], bad = j === BAD, ver = ramp(t, VER[j], VER[j] + 0.2, EASE.glaser), yl = rowY(j, sx, t), yr = rowY(j + 1, sx, t);
    const ok = bad ? ramp(t, SNAP, SNAP + 0.25, EASE.glaser) : ver, chev = k * (1 - (bad ? ok : ver)) * (1 - ramp(t, FUSE0, FUSE0 + 0.3));
    const d = lerp(70, 22, k);
    if (bad && ver > 0 && ok < 1) { c.save(); c.strokeStyle = TERRA; c.lineWidth = 5 * z; c.lineCap = 'round'; c.globalAlpha = ver * (1 - ok); c.beginPath(); c.moveTo(X(sx), Y(yl)); c.lineTo(X(sx), Y(yr)); c.stroke(); c.restore(); }
    if (chev > 0) { chevron(c, X(sx - d), Y(rowY(j, sx - d, t)) - 24 * z, 1, 14 * z, BLACK, chev); chevron(c, X(sx + d), Y(rowY(j + 1, sx + d, t)) + 24 * z, -1, 14 * z, BLACK, chev);
      c.save(); c.globalAlpha = chev; c.fillStyle = BLACK; c.beginPath(); c.arc(X(sx), Y(yl), 5 * z, 0, TAU); c.arc(X(sx), Y(yr), 5 * z, 0, TAU); c.fill(); c.restore(); }
    if (ok > 0) { const r = (16 + (bad ? 8 * Math.exp(-(t - SNAP) * 4) : 0)) * z; c.save(); c.globalAlpha = ok * fuseFade; c.strokeStyle = TEAL; c.lineWidth = 3.4 * z; c.beginPath(); c.arc(X(sx), Y(yl), r * (0.6 + 0.4 * ok), 0, TAU); c.stroke(); c.restore(); }
    if (bad && t > SNAP && t < SNAP + 0.9) { const u = (t - SNAP) / 0.9, r = lerp(20, 130, EASE.glaser(u)) * z; c.save(); c.globalAlpha = 0.6 * (1 - u); c.strokeStyle = TEAL; c.lineWidth = 3 * z; c.beginPath(); c.arc(X(sx), Y(yl), r, 0, TAU); c.stroke(); c.restore(); } }

  // ---------- the section: one line, fused outward from the glued seam, then bent into a ring ----------
  if (fusing) { const Kb = ramp(t, BEND0, CLOSE, EASE.rest), kap = TAU / L * Kb, amp = 1 - 0.72 * ramp(t, BEND0 - 0.2, CLOSE + 0.4, EASE.rest), ph = 46 * Math.max(0, t - BEND0);
    const pts = []; for (let u = -800; u <= 800.01; u += 8) { let bx = u, by = 0, nx = 0, ny = 1;
      if (kap > 1e-7) { bx = Math.sin(kap * u) / kap; by = -(1 - Math.cos(kap * u)) / kap; nx = Math.sin(kap * u); ny = Math.cos(kap * u); }
      const o = g(u, ph) * amp; pts.push([X(bx + nx * o), Y(by + ny * o)]); }
    c.save(); if (t < FUSE1 + 0.05) { c.beginPath(); c.rect(X(zipL), 0, X(zipR) - X(zipL), H); c.clip(); }
    const closeGlow = Math.exp(-Math.max(0, t - CLOSE) * 2.2) * (t > CLOSE ? 1 : 0);
    strokePts(c, pts, TEALG, (16 + 10 * closeGlow) * z, 0.75);
    strokePts(c, pts, TEAL, 6 * z, 1); c.restore();
    if (t < FUSE1 + 0.1) for (const zx of [zipL, zipR]) { if (zx < -800 || zx > 800) continue; const gr = c.createRadialGradient(X(zx), Y(g(zx)), 0, X(zx), Y(g(zx)), 30 * z);
      gr.addColorStop(0, rgba(TEALG, 0.95)); gr.addColorStop(1, rgba(TEALG, 0)); c.fillStyle = gr; c.beginPath(); c.arc(X(zx), Y(g(zx)), 30 * z, 0, TAU); c.fill(); }
    if (t > CLOSE && t < CLOSE + 1.2) { const u = (t - CLOSE) / 1.2, R0 = L / TAU; c.save(); c.globalAlpha = 0.55 * (1 - u); c.strokeStyle = TEAL; c.lineWidth = 2.5 * z;
      c.beginPath(); c.arc(X(0), Y(-R0), (R0 + 20 + 70 * EASE.glaser(u)) * z, 0, TAU); c.stroke(); c.restore(); } }

  // ---------- the whale ----------
  { const p = wpos(t), f = facing(t), ang = heading(t), v = wvel(t), sp = Math.hypot(v.x, v.y), still = sp < 60;
    let blink = 0; for (const b of [3.2, 7.0, 12.25, 19.6, 22.6, 25.8]) blink = Math.max(blink, 1 - Math.abs(t - b) / 0.07);
    const focus = Math.max(win(t, 8.4, 12.05, 0.25, 0.2), win(t, BACK, SNAP, 0.3, 0.1), 0.6 * win(t, 21.3, 23.4, 0.4, 0.4));
    const surprise = win(t, VER[BAD], VER[BAD] + 0.7, 0.08, 0.3), spark = win(t, SNAP, SNAP + 1.3, 0.1, 0.4);
    const delight = (t > SNAP + 0.02 && t < 16.7) || (t > CLOSE + 0.05 && (t < 21.3 || t > 23.5)) ? 1 : 0;
    let squash = 0; for (const ta of [8.5, 9.5, 10.5, 11.5, BACK, 18.6]) squash += 0.05 * Math.sin(Math.PI * clamp((t - ta) / 0.28));
    squash += 0.1 * Math.sin(Math.PI * clamp((t - SNAP + 0.06) / 0.3));
    const spray = win(t, CLOSE, CLOSE + 0.9, 0.12, 0.35);
    c.save(); c.translate(X(p.x), Y(p.y)); c.scale(Math.abs(f) < 0.08 ? 0.08 * Math.sign(f || 1) : f, 1);
    KH.drawWhale(c, { x: 0, y: 0, ang: f < 0 ? -ang : ang, scale: 0.6 * z, L: 1, tail: Math.sin(t * (still ? 3 : 10)) * (still ? 0.12 : 0.3), fin: Math.sin(t * (still ? 3 : 10) + 1.3) * 0.3 + (t > GL0 && t < SNAP ? 0.25 * Math.sin(t * 9) : 0),
      blink, focus: delight ? 0 : focus, eye: 1 + 0.3 * surprise, spark, sparkColor: TEAL, sparkScale: 1.4, delight, blush: 0.5, mouth: delight ? 0.4 : 0.12 * surprise, squash, spray, sprayColor: TEAL });
    c.restore(); }

  // ---------- real case card (framed) ----------
  { const a = win(t, CARD.in, CARD.out, CARD.fi, CARD.fo); if (a > 0) { const x0 = 1330, y0 = 170, w = 430, h = 150, dy = (1 - EASE.defer(clamp((t - CARD.in) / CARD.fi))) * 10;
      c.save(); c.globalAlpha = a; c.fillStyle = C.paper; c.strokeStyle = mix(C.paper, C.slate, 0.45); c.lineWidth = 1.2; c.beginPath(); c.roundRect(x0, y0 + dy, w, h, 8); c.fill(); c.stroke();
      c.fillStyle = TERRA; c.fillRect(x0, y0 + dy + 14, 6, h - 28); c.restore();
      text(c, 'Real case · film check', x0 + 30, y0 + dy + 40, { f: 'mono', size: 13, col: SOFT, a });
      text(c, '18 vs 20 captions', x0 + 30, y0 + dy + 86, { f: 'sans', size: 32, col: INK, a });
      text(c, '6 text, 3 timing mismatches', x0 + 30, y0 + dy + 124, { f: 'sans', size: 22, col: INK, a }); } }

  // ---------- chrome: station rail (top left) and the seam counter (top right) ----------
  { const ra = ramp(t, 2.4, 2.9) * (1 - ramp(t, 23.2, 23.7)); if (ra > 0) { let x = 160;
      for (let s = 0; s < STATIONS.length; s++) { const [w, a, b] = STATIONS[s], on = win(t, a, b, 0.15, 0.15), past = t >= b - 0.15;
        const col = on > 0.5 ? INK : FUT, tw = text(c, w, x, 120, { f: on > 0.5 ? 'monoB' : 'mono', size: 15, col, a: ra });
        if (on > 0) { c.save(); c.globalAlpha = ra * on; c.fillStyle = w === 'Discord' ? TERRA : TEAL; c.fillRect(x, 132, tw * EASE.glaser(clamp((t - a) / 0.3)), 3); c.restore(); }
        if (past && !(on > 0)) { c.save(); c.globalAlpha = ra * 0.9; c.fillStyle = w === 'Discord' ? TEAL : TEAL; c.beginPath(); c.arc(x + tw / 2, 140, 2.5, 0, TAU); c.fill(); c.restore(); }
        x += tw + (s < STATIONS.length - 1 ? text(c, '·', x + tw + 12, 120, { f: 'mono', size: 15, col: FUT, a: ra, track: 0 }) + 24 : 0); } } }
  { const sa = ramp(t, ARR[0], ARR[0] + 0.3) * (1 - ramp(t, 21.2, 21.6)); if (sa > 0) {
      const agree = VER.filter((v, j) => j !== BAD && t >= v).length + (t >= SNAP ? 1 : 0), disc = t >= VER[BAD] && t < SNAP ? 1 : 0;
      text(c, `Overlaps 4 · agree ${agree} · discord ${disc}`, 1760, 120, { f: 'mono', size: 14, col: SOFT, a: sa, align: 'right' }); } }

  // ---------- opening, captions, lockup ----------
  S.open(c, t, EP, { out: OPEN_OUT });
  for (const r of CAPS) S.caption(c, t, r, { size: r.size });
  S.lockup(c, t, DUR - 2.2, EP);
  const fb = 1 - ramp(t, 0, 0.35); if (fb > 0) { c.fillStyle = rgba(GROUND, fb); c.fillRect(0, 0, W, H); }
  c.restore();
}

function cues() { return { bpm: 120, dur: DUR, title: 0.3, enter: 1.6, settle: SETTLE, overlap: OVA, arrive: ARR, verdict: VER, bad: BAD, back: BACK, glue0: GL0, snap: SNAP,
  fuse0: FUSE0, fuse1: FUSE1, bend0: BEND0, close: CLOSE, notThis: CAPS[6].in, end: CAPS[7].in, lockup: DUR - 2.2, card: CARD.in,
  stations: STATIONS.map(s => s[1]), captions: CAPS.map(r => r.in) }; }
const CONTRAST = [['caption ink on paper chip', INK, C.paper], ['open eyebrow slate on ground', SOFT, GROUND], ['open title ink on ground', INK, GROUND], ['title accent (teal→navy) on ground', ACCENT, GROUND],
  ['rail active ink on ground', INK, GROUND], ['rail future on ground', FUT, GROUND], ['rail dot separators on ground', FUT, GROUND], ['counter slate on ground', SOFT, GROUND],
  ['card eyebrow slate on paper', SOFT, C.paper], ['card body ink on paper', INK, C.paper], ['lockup slate on ground', SOFT, GROUND]];
const shutter = t => (t > 1.3 && t < 8.6) || (t > 16.9 && t < 18.8) ? [3, 0.6] : [2, 0.5];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, DUR, W, H, fps: 60, shutter, wpos, heading, cam };
})(typeof window !== 'undefined' ? window : globalThis);
