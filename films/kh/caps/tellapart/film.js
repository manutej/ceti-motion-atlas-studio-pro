// CETI Capabilities · 05 · Tell-apart — "Same reading, different world."
// Two worlds below (a calm wave, and one with a gap) feed one line above that reads the same for both.
// The whale dives, finds the gap, brings back the witness pair, then unzips the line into two strands,
// each with its own reading. drawFrame(ctx, t) is a pure function of t.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, smoothstep, win, EASE, ramp, mix, rgba, text } = KH;
const W = 1920, H = 1080, BPM = 132, B = 60 / BPM, DUR = 25.35, beat = n => n * B;
const INK = C.navy, SOFT = C.slate, TINT = WD.violetBlue;
const GROUND = mix(C.paper, TINT, 0.06);                       // what SERIES.ground actually paints
let ACC = WD.englishRed; for (let k = 0; k <= 1.0001; k += 0.02) { ACC = mix(WD.englishRed, INK, k); if (KH.contrast(ACC, GROUND) >= 4.7) break; }
const COL_A = WD.violetBlue, COL_B = mix(WD.ochraceousSalmon, INK, 0.28), GAP = WD.englishRed, OK = C.sage;
const RULE = mix(C.paper, C.slate, 0.38);
const EP = { no: '05', short: 'Tell-apart', title: 'Same reading, <i>different</i> world.', accent: ACC };

// ---------- geometry (world units; camera maps them to the screen) ----------
const WX = [-360, 360], WY = 250, HW = 250, BASE = 196, MERGE = -20, CHIP_Y = -300, TOP = -230, POD = [0, -430];
const GX = 470, GW = 46;                                       // the gap in world B (the outage)
const CARD = [[-240, 50], [240, 50]], CW = 270, CHH = 140, CHIPX = [-240, 240];
// ---------- times on the 132 BPM grid ----------
const T_DEC = beat(6), T_COL = beat(12), T_DIVE = beat(18), T_GAP = beat(21), T_FOUND = beat(22), T_RISE = beat(23), T_CARDS = beat(25);
const T_SPLIT = beat(27), T_RIDE = beat(30), T_CHIPS = beat(30), T_ALERT = beat(32), T_TURN = beat(31), T_GREEN = beat(33.5);
const T_NOT = 16.6, T_END = 19.45, T_LOCK = DUR - 2.3;
const TRAVEL = 2 * B;                                          // a pulse takes two beats from its world to the reading
// pulses 0–3: the collapse; 4–5: after the split (4 lands on the alert); 6 = the green check; 7+: the strands keep reading to the end
const G_PULSE = 6;
const PULSES = [[0, 10], [1, 12], [0, 14], [1, 15], [1, 30], [0, 31], [0, 34], [1, 35], [0, 37], [1, 39], [0, 41], [1, 43], [0, 45], [1, 47], [0, 49], [1, 51], [0, 53]].map(([w, b]) => ({ w, t0: beat(b), t1: beat(b) + TRAVEL }));

// ---------- the whale's path (Hermite through time keys; zero tangent where it perches) ----------
const RIDE_Y = -168;
const KEYS = [[1.1, -1300, -380], [2.0, -620, -480], [T_DEC, -205, -440], [4.9, -205, -440], [5.5, -170, -110], [7.95, -170, -110],
  [8.5, 40, 110], [9.05, 220, 150], [T_GAP, GX - 98, 140], [T_RISE, GX - 98, 140], [10.95, 380, 0], [T_CARDS, 280, -92], [T_SPLIT - 0.5, 280, -92],
  [T_SPLIT, 0, 4], [T_RIDE, 0, RIDE_Y], [T_TURN, 0, RIDE_Y], [T_TURN + 0.32, 16, RIDE_Y - 2], [DUR, 16, RIDE_Y - 2]];
const PK = KEYS.map(([t, x, y]) => ({ t, x, y }));
const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < 1;
function herm(t) { if (t > T_SPLIT && t < T_RIDE) return { x: 0, y: lerp(4, RIDE_Y, EASE.glaser((t - T_SPLIT) / (T_RIDE - T_SPLIT))) };
  const P = PK, n = P.length; if (t <= P[0].t) return { x: P[0].x, y: P[0].y }; if (t >= P[n - 1].t) return { x: P[n - 1].x, y: P[n - 1].y };
  let i = 0; while (P[i + 1].t < t) i++; const p1 = P[i], p2 = P[i + 1], h = p2.t - p1.t, u = (t - p1.t) / h;
  const tan = k => { if (k <= 0 || k >= n - 1 || near(P[k], P[k - 1]) || near(P[k], P[k + 1])) return { x: 0, y: 0 };
    const a = P[k - 1], b = P[k + 1]; return { x: (b.x - a.x) / (b.t - a.t), y: (b.y - a.y) / (b.t - a.t) }; };
  const m1 = tan(i), m2 = tan(i + 1), u2 = u * u, u3 = u2 * u, a = 2 * u3 - 3 * u2 + 1, b = u3 - 2 * u2 + u, c = -2 * u3 + 3 * u2, d = u3 - u2;
  return { x: a * p1.x + b * h * m1.x + c * p2.x + d * h * m2.x, y: a * p1.y + b * h * m1.y + c * p2.y + d * h * m2.y }; }
const hspeed = t => { const a = herm(t - 1 / 120), b = herm(t + 1 / 120); return Math.hypot(b.x - a.x, b.y - a.y) * 60; };
const wpos = t => { const p = herm(t), still = 1 - smoothstep(20, 90, hspeed(t)); return { x: p.x, y: p.y + Math.sin(t * 2.6) * 5 * still }; };
const wvel = t => { const a = wpos(t - 1 / 240), b = wpos(t + 1 / 240); return { x: (b.x - a.x) * 120, y: (b.y - a.y) * 120 }; };
function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
    a += (sp < 40 ? 0 : clamp(Math.atan2(v.y, Math.abs(v.x)), -0.9, 0.9) * clamp(sp / 300)) * w; s += w; } return a / s; }
// facing: the sign of the last real horizontal motion, eased through a short turn so it never pops
const lastDir = t => { for (let k = 0; k < 160; k++) { const vx = herm(t - k * 0.04 + 1 / 120).x - herm(t - k * 0.04 - 1 / 120).x; if (Math.abs(vx) * 60 > 30) return Math.sign(vx); } return 1; };
const facing = t => { let f = 0; for (let k = 0; k < 6; k++) f += lastDir(t - k * 0.05); return f / 6; };

// ---------- the line: two strands, merged above MERGE until the whale unzips them ----------
// fork height (world y): everything below it is split. It waits under the worlds, then rides just behind the whale.
function forkY(t) { if (t < T_SPLIT - 0.4) return 420; if (t < T_SPLIT) return lerp(420, 24, ramp(t, T_SPLIT - 0.4, T_SPLIT, EASE.warm));
  if (t < T_RIDE) return herm(t).y + 20; return lerp(RIDE_Y + 20, TOP - 170, ramp(t, T_RIDE, T_RIDE + 0.35, EASE.glaser)); }
const ss = u => { u = clamp(u); return u * u * (3 - 2 * u); };
function strandX(y, k, t) { const sg = k ? 1 : -1;
  const u = (BASE - y) / (BASE - MERGE);
  const xm = y > MERGE ? sg * WX[1] * (1 - ss(u)) : 0;
  const xs = sg * (CHIPX[1] + (WX[1] - CHIPX[1]) * (1 - ss((BASE - y) / (BASE - TOP))));   // split: each world straight up to its own chip
  return lerp(xm, xs, splitW(y, t)); }
const splitW = (y, t) => ss((y - forkY(t)) / 150);
const drainK = (y, t) => (1 - splitW(y, t)) * clamp((MERGE + 14 - y) / 46);   // above the merge the colour is gone (one reading)
const drawIn = t => ramp(t, 2.15, 2.85, EASE.warm);

// ---------- the worlds ----------
const amp = (k, t) => k ? 36 : lerp(36, 54, ramp(t, T_GREEN, T_GREEN + 0.7, EASE.warm));
const waveY = (x, k, t) => WY + amp(k, t) * Math.sin((x - WX[k]) / 50 + t * 1.5 + k * 0.9 + (k ? 0 : 1.3 * ramp(t, T_GREEN, T_GREEN + 0.7, EASE.warm)));
const inGap = x => Math.abs(x - GX) < GW;

// ---------- camera ----------
function cam(t) {
  // base: readout, pod and both worlds in frame · witness: a gentle push that keeps both labels and the readout · split: push in on the unzip
  // close: z 1.15 on the two strands with their readings, breathing in; lockup: ease back so the bottom is clear
  const k1 = ramp(t, 7.9, 9.4, EASE.rest) * (1 - ramp(t, 10.6, 11.7, EASE.rest)), kS = ramp(t, T_SPLIT - 0.9, T_SPLIT + 0.1, EASE.rest);
  const kC = ramp(t, T_ALERT - 0.1, T_ALERT + 1.1, EASE.rest), kL = ramp(t, T_LOCK - 0.2, T_LOCK + 0.9, EASE.rest), drift = ramp(t, T_ALERT + 1.1, T_LOCK, EASE.rest);
  let x = lerp(0, 110, k1), y = lerp(-60, -20, k1), z = lerp(1.08, 1.22, k1), ay = 540;
  x = lerp(x, 0, kS); y = lerp(y, -190, kS); z = lerp(z, 1.35, kS);
  x = lerp(x, -45 * (1 - ramp(t, 16.9, 17.9, EASE.rest)), kC); y = lerp(y, 0, kC); z = lerp(z, 1.1 + 0.03 * drift, kC); ay = lerp(ay, 565, kC);
  z = lerp(z, 0.95, kL); ay = lerp(ay, 470, kL);
  return { x, y, z, ax: 960, ay };
}

// ---------- READ table (drives text and the read-time gate) ----------
const ST = [
  { id: 's1', in: 2.6, out: 5.25, word: 'Decision', gloss: 'who acts on it' },
  { id: 's2', in: 5.45, out: 7.95, word: 'Collapse', gloss: 'two realities, one reading' },
  { id: 's3', in: 8.1, out: 11.95, word: 'Witness', gloss: 'show both side by side' },
  { id: 's4', in: 12.1, out: 14.85, word: 'Split', gloss: 'add the missing distinction' },
  { id: 's5', in: 15.0, out: 16.95, word: 'Green', gloss: 'irrelevant change, same reading', f: 0.2 },
].map(s => ({ ...s, fi: s.f || 0.3, fo: s.f || 0.3, text: `${s.word} — ${s.gloss}` }));
const R_NOT = { id: 'not', in: T_NOT, out: T_NOT + 2.75, fi: 0.3, fo: 0.3, text: "More metrics isn't the fix — the right distinction is." };
const R_END = { id: 'end', in: T_END, out: T_LOCK, fi: 0.4, fo: 0.3, text: 'If two worlds look the same in your numbers, nothing downstream can tell them apart.' };
const READ = [
  { id: 'eyebrow', in: 0.25, out: 2.5, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 05' },
  { id: 'title', in: 0.25, out: 2.5, fi: 0.4, fo: 0.45, text: 'Same reading, different world.' },
  ...ST,
  { id: 'rail', in: 2.6, out: 16.95, fi: 0.4, fo: 0.2, text: 'DECISION COLLAPSE WITNESS SPLIT GREEN' },
  { id: 'illus', in: 2.6, out: T_LOCK, fi: 0.4, fo: 0.4, text: 'checkout success · illustrative' },
  { id: 'worldA', in: 0.6, out: 16.45, fi: 0.6, fo: 0.3, text: 'world A' },
  { id: 'worldB', in: 0.6, out: T_FOUND + 0.45, fi: 0.6, fo: 0.3, text: 'world B' },
  { id: 'down', in: T_FOUND + 0.3, out: 16.45, fi: 0.3, fo: 0.3, text: 'world B · EU lockers down' },
  { id: 'chip', in: 2.75, out: T_CHIPS + 0.45, fi: 0.35, fo: 0.3, text: '99%' },
  { id: 'cards', in: T_RISE + 0.5, out: T_CHIPS + 0.5, fi: 0.3, fo: 0.3, text: '99% = 99%' },
  { id: 'chipA', in: T_CHIPS + 0.15, out: DUR, fi: 0.35, fo: 0, text: 'EU lockers healthy' },
  { id: 'chipB', in: T_CHIPS + 0.15, out: DUR, fi: 0.35, fo: 0, text: 'EU lockers 0%' },
  { id: 'noalert', in: T_DEC + 0.15, out: T_ALERT + 0.1, fi: 0.3, fo: 0.25, text: 'no alert' },
  { id: 'alert', in: T_ALERT, out: DUR, fi: 0.3, fo: 0, text: 'alert' },
  R_NOT, R_END,
  { id: 'lockup', in: T_LOCK, out: DUR, fi: 0.6, fo: 0, text: 'CETI · Capabilities · 05 · Tell-apart' },
];
const RD = Object.fromEntries(READ.map(r => [r.id, r])), A = (id, t) => { const r = RD[id]; return win(t, r.in, r.out, r.fi, r.fo); };

// THE READING — the hero. A paper card: status dot (a mark) + the number in display type. Label sets cross-fade inside it.
// sets: [{ small, big, size, a }]; returns the card width in px.
function readout(c, x, y, z, sets, dot, a, o = {}) { if (a <= 0.001) return 0;
  const hh = 140 * z, pad = 26 * z, dw = 34 * z; c.save();
  const wOf = st => { c.font = `${st.size * z}px ${KH.FONTS.disp}`; let w = c.measureText(st.big).width * 0.98; if (st.small) { c.font = `${22 * z}px ${KH.FONTS.sans}`; w = Math.max(w, c.measureText(st.small).width); } return w; };
  const tw = sets.reduce((m, st) => m + wOf(st) * st.a, 0) / Math.max(1e-3, sets.reduce((m, st) => m + st.a, 0)), Wd = tw + dw + pad * 2 + 6 * z;
  c.globalAlpha = a; c.fillStyle = C.paper; c.beginPath(); c.roundRect(x - Wd / 2, y - hh / 2, Wd, hh, 14 * z); c.fill();
  c.strokeStyle = o.border || RULE; c.lineWidth = (o.bw || 2) * z; c.stroke();
  c.fillStyle = dot; c.beginPath(); c.arc(x - Wd / 2 + pad + 11 * z, y + 4 * z, 12 * z, 0, Math.PI * 2); c.fill(); c.restore();
  const x0 = x - Wd / 2 + pad + dw + 4 * z;
  for (const st of sets) { if (st.a <= 0.001) continue;
    if (st.small) { text(c, st.small, x0, y - 26 * z, { f: 'sans', size: 22 * z, col: INK, a: a * st.a }); text(c, st.big, x0, y + 44 * z, { f: 'disp', size: st.size * z, col: INK, a: a * st.a }); }
    else text(c, st.big, x0, y + 30 * z, { f: 'disp', size: st.size * z, col: INK, a: a * st.a }); }
  return Wd; }
function waveMini(c, x, y, w, k, z, a) { c.save(); c.globalAlpha = a; c.lineWidth = 4 * z; c.lineCap = 'round';
  const col = k ? COL_B : COL_A; let pen = false; c.strokeStyle = col; c.beginPath();
  for (let i = 0; i <= 60; i++) { const u = i / 60, X = x + (u - 0.5) * w, Y = y + 13 * z * Math.sin(u * 9.5 + 0.6);
    if (k && Math.abs(u - 0.72) < 0.08) { pen = false; continue; } pen ? c.lineTo(X, Y) : c.moveTo(X, Y); pen = true; } c.stroke();
  if (k) { c.strokeStyle = GAP; c.lineWidth = 3 * z; c.beginPath(); c.arc(x + 0.22 * w, y, 20 * z, 0, Math.PI * 2); c.stroke(); }
  c.restore(); }

function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
  S.ground(c, t, cm, { tint: TINT });

  // ---------- the two worlds ----------
  for (let k = 0; k < 2; k++) { const col = k ? COL_B : COL_A, x0 = WX[k] - HW, n = 110, reveal = ramp(t, 0.5 + 0.2 * k, 1.8 + 0.2 * k, EASE.warm);
    c.lineCap = 'round'; c.lineWidth = 6.2 * z;
    for (let i = 0; i < n; i++) { const xa = x0 + (i / n) * 2 * HW, xb = x0 + ((i + 1) / n) * 2 * HW; if (i / n > reveal) break; if (k && (inGap(xa) || inGap(xb))) continue;
      const edge = Math.min(i / n, 1 - (i + 1) / n); c.strokeStyle = rgba(col, smoothstep(0, 0.12, edge));
      c.beginPath(); c.moveTo(X(xa), Y(waveY(xa, k, t))); c.lineTo(X(xb), Y(waveY(xb, k, t))); c.stroke(); }
    if (k && reveal > 0.85) for (const ex of [GX - GW - 2, GX + GW + 2]) { c.fillStyle = col; c.beginPath(); c.arc(X(ex), Y(waveY(ex, 1, t)), 7 * z, 0, Math.PI * 2); c.fill(); }   // the break, capped
  }
  const LS = 20 * Math.max(z, 0.95);
  text(c, 'world A', X(WX[0]), Y(WY + 92), { f: 'mono', size: LS, col: SOFT, align: 'center', a: A('worldA', t) });
  text(c, 'world B', X(WX[1]), Y(WY + 92), { f: 'mono', size: LS, col: SOFT, align: 'center', a: A('worldB', t) });
  text(c, 'world B · EU lockers down', X(WX[1]), Y(WY + 92), { f: 'mono', size: LS, col: SOFT, align: 'center', a: A('down', t) });
  // the gap, once the whale has found it
  const fg = ramp(t, T_FOUND, T_FOUND + 0.4, EASE.glaser);
  if (fg > 0) { c.save(); c.strokeStyle = GAP; c.globalAlpha = fg; c.lineWidth = 4 * z; c.setLineDash([6 * z, 8 * z]);
    c.beginPath(); c.moveTo(X(GX - GW), Y(waveY(GX - GW, 1, t))); c.lineTo(X(GX + GW), Y(waveY(GX + GW, 1, t))); c.stroke(); c.setLineDash([]);
    const pr = 1 + 0.5 * Math.exp(-(t - T_FOUND) * 5); c.lineWidth = 4 * z; c.beginPath(); c.arc(X(GX), Y(WY), 74 * z * pr, 0, Math.PI * 2); c.stroke(); c.restore(); }

  // ---------- feeds, stem, strands ----------
  const di = drawIn(t);
  for (let k = 0; k < 2; k++) { const col = k ? COL_B : COL_A, n = 90;
    c.lineCap = 'round'; c.lineWidth = 5.6 * z;
    for (let i = 0; i < n; i++) { const s0 = i / n, s1 = (i + 1) / n; if (s0 > di) break;
      const y0 = lerp(BASE, TOP, s0), y1 = lerp(BASE, TOP, Math.min(s1, di)), ym = (y0 + y1) / 2;
      c.strokeStyle = mix(col, INK, drainK(ym, t)); c.beginPath(); c.moveTo(X(strandX(y0, k, t)), Y(y0)); c.lineTo(X(strandX(y1, k, t)), Y(y1)); c.stroke(); }
    c.fillStyle = col; c.globalAlpha = ramp(t, 2.05, 2.3); c.beginPath(); c.arc(X(strandX(BASE, k, t)), Y(BASE), 8 * z, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
  { const mk = ramp(t, 2.6, 2.9) * (1 - ramp(t, T_SPLIT, T_SPLIT + 0.3)); if (mk > 0) { c.fillStyle = rgba(INK, mk); c.beginPath(); c.arc(X(0), Y(MERGE), 9 * z, 0, Math.PI * 2); c.fill(); } }

  // ---------- pulses: measurements rising from each world ----------
  for (const p of PULSES) { if (t < p.t0 || t > p.t1 + 0.25) continue; const s = EASE.rest(clamp((t - p.t0) / TRAVEL)), y = lerp(BASE, TOP, s), x = strandX(y, p.w, t);
    const col = mix(p.w ? COL_B : COL_A, SOFT, drainK(y, t)), a = 1 - ramp(t, p.t1, p.t1 + 0.25);
    c.fillStyle = rgba(col, a); c.beginPath(); c.arc(X(x), Y(y), 21 * z, 0, Math.PI * 2); c.fill();
    c.strokeStyle = rgba(C.paper, a); c.lineWidth = 3 * z; c.stroke(); }

  // ---------- THE READING: one card until the split, then two ----------
  const sp = ramp(t, T_CHIPS, T_CHIPS + 0.5, EASE.glaser), swap = ramp(t, T_CHIPS + 0.12, T_CHIPS + 0.5, EASE.warm);
  for (let k = 0; k < 2; k++) { if (k === 1 && sp < 0.01) continue;
    const x = lerp(0, CHIPX[k], sp), a = Math.max(A('chip', t), A(k ? 'chipB' : 'chipA', t));
    const alertK = k ? ramp(t, T_ALERT, T_ALERT + 0.3) : 0, dot = mix(OK, GAP, alertK);
    let bump = 0, from = 0; for (const p of PULSES) if (t >= p.t1 && (p.w === k || sp < 0.01)) { const b = Math.exp(-(t - p.t1) * 8); if (b > bump) { bump = b; from = p.w; } }
    const sets = [{ big: '99%', size: 92, a: 1 - swap }, { small: 'EU lockers', big: k ? '0%' : 'healthy', size: 66, a: swap }];
    const wd = readout(c, X(x), Y(CHIP_Y), z * (1 + 0.04 * bump), sets, dot, a, { border: alertK > 0 ? mix(RULE, GAP, alertK) : RULE, bw: 2 + 1.6 * alertK });
    // arrival ripple: before the split it is always the same grey (one reading), after it carries its world's colour
    if (bump > 0.02) { const q = 1 - bump, rc = sp < 0.01 ? SOFT : (from ? COL_B : COL_A); c.strokeStyle = rgba(rc, 0.5 * bump); c.lineWidth = 3 * z;
      c.beginPath(); c.roundRect(X(x) - wd / 2 - 16 * q * z, Y(CHIP_Y) - 70 * z - 16 * q * z, wd + 32 * q * z, 140 * z + 32 * q * z, 16 * z); c.stroke(); }
    if (k === 1 && t > T_ALERT) { const q = clamp((t - T_ALERT) / 0.9); c.strokeStyle = rgba(GAP, 0.6 * (1 - q)); c.lineWidth = 3.5 * z;
      c.beginPath(); c.roundRect(X(x) - wd / 2 - 24 * q * z, Y(CHIP_Y) - 70 * z - 24 * q * z, wd + 48 * q * z, 140 * z + 48 * q * z, 18 * z); c.stroke(); }
    // green: an irrelevant change in world A arrives and the reading holds — a tick, no change
    if (k === 0) { const g = ramp(t, PULSES[G_PULSE].t1, PULSES[G_PULSE].t1 + 0.35, EASE.glaser); if (g > 0) { const gx = X(x) - wd / 2 - 34 * z, gy = Y(CHIP_Y) + 4 * z;
      c.save(); c.strokeStyle = OK; c.lineWidth = 6 * z; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(gx - 13 * z, gy); c.lineTo(gx - 3 * z, gy + 10 * z); c.lineTo(gx + lerp(-3, 17, g) * z, gy + lerp(10, -13, g) * z); c.stroke(); c.restore(); } } }
  // the snap: the moment the line comes apart
  { const q = clamp((t - T_RIDE) / 0.6); if (t > T_RIDE && q < 1) { c.strokeStyle = rgba(TINT, 0.6 * (1 - q)); c.lineWidth = 4 * z; c.beginPath(); c.arc(X(0), Y(CHIP_Y + 40), (60 + 260 * EASE.glaser(q)) * z, 0, Math.PI * 2); c.stroke(); } }

  // ---------- the consumer: an AI pod that decides from the reading ----------
  { const pa = ramp(t, T_DEC - 0.1, T_DEC + 0.35, EASE.glaser); if (pa > 0) { const tilt = -0.55 * ramp(t, T_ALERT, T_ALERT + 0.4, EASE.glaser);
      KH.drawPod(c, X(POD[0]), Y(POD[1]), Math.PI / 2 + tilt, 62 * z * (0.6 + 0.4 * pa), WD.ochraceousSalmon, { alpha: pa, ink: INK, glow: win(t, T_DEC, T_DEC + 0.8, 0.1, 0.5) * 0.8 });
      text(c, 'no alert', X(POD[0] + 50), Y(POD[1] + 10), { f: 'sans', size: 28 * z, col: INK, a: A('noalert', t) });
      const al = A('alert', t); if (al > 0) { text(c, 'alert', X(POD[0] + 74), Y(POD[1] + 10), { f: 'sans', size: 28 * z, col: INK, a: al });
        c.fillStyle = rgba(GAP, al); c.beginPath(); c.arc(X(POD[0] + 58), Y(POD[1]), 8 * z, 0, Math.PI * 2); c.fill(); } } }

  // ---------- the witness pair ----------
  { const rise = ramp(t, T_RISE, T_CARDS, EASE.warm), fly = ramp(t, T_CHIPS, T_CHIPS + 0.45, EASE.collect);
    if (t > T_RISE && fly < 1) for (let k = 0; k < 2; k++) { const from = k ? [GX, WY] : [WX[0], WY], [cx0, cy0] = CARD[k];
        const lag = k ? ramp(t, T_RISE + 0.08, T_CARDS + 0.1, EASE.warm) : rise;
        let cx = lerp(from[0], cx0, lag), cy = lerp(from[1], cy0, lag), sc = lerp(0.3, 1, lag);
        cx = lerp(cx, CHIPX[k], fly); cy = lerp(cy, CHIP_Y, fly); sc *= lerp(1, 0.4, fly);
        const a = clamp(lag * 3) * (1 - smoothstep(0.5, 1, fly)), w = CW * z * sc, h = CHH * z * sc, sx = X(cx), sy = Y(cy);
        c.save(); c.globalAlpha = a; c.fillStyle = C.paper; c.beginPath(); c.roundRect(sx - w / 2, sy - h / 2, w, h, 12 * z * sc); c.fill();
        c.strokeStyle = RULE; c.lineWidth = 2 * z; c.stroke(); c.restore();
        text(c, k ? 'B' : 'A', sx - w / 2 + 16 * z * sc, sy - h / 2 + 30 * z * sc, { f: 'mono', size: 20 * z * sc, col: SOFT, a });
        waveMini(c, sx + 10 * z * sc, sy - 26 * z * sc, w * 0.66, k, z * sc, a);
        c.save(); c.globalAlpha = a; c.fillStyle = OK; c.beginPath(); c.arc(sx - 56 * z * sc, sy + 34 * z * sc, 10 * z * sc, 0, Math.PI * 2); c.fill(); c.restore();
        text(c, '99%', sx - 36 * z * sc, sy + 52 * z * sc, { f: 'disp', size: 56 * z * sc, col: INK, a }); }
    const eq = win(t, T_CARDS - 0.1, T_CHIPS + 0.1, 0.3, 0.2); if (eq > 0) text(c, '=', X(0), Y(CARD[0][1] + 64), { f: 'disp', size: 72 * z, col: INK, align: 'center', a: eq }); }

  // ---------- the whale ----------
  { const P = wpos(t), f = facing(t), ang = heading(t), v = wvel(t), moving = Math.hypot(v.x, v.y) > 60;
    let blink = 0; for (const b of [4.3, 7.3, 12.0, 15.6, 18.6, 22.4]) blink = Math.max(blink, 1 - Math.abs(t - b) / 0.07);
    let squash = 0; for (const [l, g] of [[T_DEC, 0.09], [T_GAP, 0.09], [T_CARDS, 0.09], [T_RIDE, 0.16]]) if (t >= l && t - l < 0.6) squash = Math.max(squash, g * Math.exp(-(t - l) * 9));
    const s1 = win(t, T_FOUND, T_FOUND + 1.1, 0.1, 0.35), s2 = win(t, T_RIDE, T_RIDE + 0.9, 0.06, 0.35), spark = Math.max(s1, s2);
    const focus = Math.max(win(t, 5.7, 7.95, 0.3, 0.2), win(t, 9.2, T_FOUND, 0.25, 0.1), win(t, T_SPLIT - 0.2, T_RIDE, 0.15, 0.08)), delight = t > T_RIDE + 0.05 ? 1 : 0;
    const fs = Math.abs(f) < 0.15 ? 0.15 * Math.sign(f || 1) : f;
    c.save(); c.translate(X(P.x), Y(P.y)); c.scale(fs, 1);
    KH.drawWhale(c, { x: 0, y: 0, ang: f < 0 ? -ang : ang, scale: 0.62 * Math.max(z, 0.85), L: 1, squash,
      tail: Math.sin(t * (moving ? 11 : 3)) * (moving ? 0.34 : 0.12), fin: Math.sin(t * (moving ? 11 : 3) + 1.3) * 0.3,
      blink, focus, spark, sparkColor: s2 > s1 ? TINT : GAP, sparkScale: 1.4, eye: spark > 0.1 ? 1.2 : 1, delight, blush: 0.6, mouth: delight ? 0.4 : 0 });
    c.restore(); }

  // ---------- station headline + rail (top left, screen-fixed) ----------
  for (const s of ST) { const a = win(t, s.in, s.out, s.fi, s.fo); if (a <= 0) continue; const rise = (1 - EASE.defer(clamp((t - s.in) / s.fi))) * 12;
    text(c, s.word, 150, 196 + rise, { f: 'disp', size: 72, col: INK, a });
    text(c, s.gloss, 153, 244 + rise, { f: 'sans', size: 26, col: SOFT, a }); }
  { const pa = A('rail', t); if (pa > 0) for (let i = 0; i < 5; i++) { const s = ST[i], cur = win(t, s.in, s.out, 0.2, 0.2), y = 330 + i * 42, w = 16 * s.word.length;
      if (cur > 0.01) { c.save(); c.globalAlpha = pa * cur; c.fillStyle = C.paper; c.beginPath(); c.roundRect(152 - 10, y - 25, w + 22, 36, 6); c.fill();
        c.fillStyle = TINT; c.fillRect(152 - 10, y - 25, 5, 36); c.restore(); }
      text(c, s.word, 156 + 4 * cur, y, { f: 'mono', size: 20, col: mix(SOFT, INK, cur), a: pa, track: 0.2 }); } }
  text(c, 'checkout success · illustrative', 1770, 110, { f: 'mono', size: 18, col: SOFT, align: 'right', a: A('illus', t), track: 0.12 });

  // ---------- captions, open, lockup ----------
  S.caption(c, t, R_NOT, { size: 38 });
  S.caption(c, t, R_END, { size: 35 });
  S.open(c, t, EP, { out: 2.5 });
  S.lockup(c, t, T_LOCK, EP);
  const fb = 1 - ramp(t, 0, 0.3); if (fb > 0) { c.fillStyle = rgba(GROUND, fb); c.fillRect(0, 0, W, H); }
  c.restore();
}

function cues() { return { bpm: BPM, dur: DUR, title: 0.25, open_rule: 0.3, decision: T_DEC, collapse: T_COL, dive: T_DIVE, gap: T_GAP, found: T_FOUND, rise: T_RISE, cards: T_CARDS,
  split: T_SPLIT, ride_end: T_RIDE, chips: T_CHIPS, alert: T_ALERT, turn: T_TURN, green: T_GREEN, green_tick: PULSES[G_PULSE].t1, notthis: T_NOT, end: T_END, lockup: T_LOCK,
  stations: ST.map(s => s.in), pulses: PULSES.map(p => ({ w: p.w, t0: p.t0, t1: p.t1, split: p.t0 >= T_RIDE - 1e-6 })), landings: [T_DEC, T_GAP, T_CARDS] }; }
const CONTRAST = [
  ['title / station word / labels: ink on ground', INK, GROUND], ['station gloss / world labels / chrome: slate on ground', SOFT, GROUND],
  ['title accent "different"', ACC, GROUND], ['readout and card text: ink on paper', INK, C.paper], ['card letter: slate on paper', SOFT, C.paper],
  ['caption: ink on paper chip', INK, C.paper], ['station rail active: ink on paper chip', INK, C.paper], ['station rail idle: slate on ground', SOFT, GROUND], ['lockup: slate on ground', SOFT, GROUND], ['pod decision: ink on ground', INK, GROUND],
];
const shutter = t => (t > 1.1 && t < 2.8) || (t > 8.0 && t < 11.4) || (t > T_SPLIT - 0.6 && t < T_RIDE + 0.5) ? [3, 0.6] : [2, 0.5];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, DUR, W, H, fps: 60, shutter, wpos, heading, cam };
})(typeof window !== 'undefined' ? window : globalThis);
