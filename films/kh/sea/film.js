// Sea of data — Kinetic Hydrography 1.0.0. The little whale makes sense of a sea of data, has an idea,
// connects the pieces into a network and sends AI pods to work. drawFrame(ctx, t) is a pure function of t.
(function (root) {
'use strict';
const KH = root.KH, { CETI: C, W: WD, clamp, lerp, smoothstep, win, EASE, ramp, rng, mix, rgba, text, whaleMark } = KH;
const W = 1920, H = 1080, B = 60 / 128, DUR = 30, beat = n => n * B;
const CLS = [WD.englishRed, WD.lightGlaucousBlue, WD.violetBlue, WD.ochraceousSalmon];      // Wada 339
const CLS_EDGE = CLS.map(c => mix(c, C.navy, 0.28));
const NAMES = ['Orders', 'Tickets', 'Usage', 'Reviews'], RESULTS = ['trend up 12%', '3 urgent', 'peak at 9 pm', 'avg 4.6 of 5'];
const INK = C.navy, SOFT = C.slate, GREY = mix(C.paper, C.slate, 0.52);
const CENT = [[-640, -250], [640, -250], [-640, 260], [640, 260]];

// ---------- data ----------
const PTS = [], FAR = [];
{ const R = rng(77); const counts = [0, 0, 0, 0];
  for (let i = 0; i < 880; i++) { let x, y; do { x = (R() - 0.5) * 3000; y = (R() - 0.5) * 1640; } while (Math.hypot(x, y * 1.4) < 160);
    const cl = Math.floor(R() * 4), kind = R() < 0.3 ? 2 : R() < 0.55 ? 1 : 0;
    PTS.push({ x, y, cl, kind, r: kind === 1 ? 8 + R() * 4 : 4 + R() * 3, d: String(Math.floor(R() * 10)), ds: 13 + Math.floor(R() * 4), ph: R() * 6.28, k: counts[cl]++, jit: R() }); }
  for (let i = 0; i < 260; i++) FAR.push({ x: (R() - 0.5) * 4200, y: (R() - 0.5) * 2400, r: 1 + R() * 2, ph: R() * 6.28 }); }

// ---------- the whale's path ----------
const KEYS = [[0.4, -2300, 250], [2.0, -1250, 150], [3.0, -650, -380], [4.0, 150, -560], [5.0, 900, -260], [6.0, 1060, 380], [7.0, 380, 560], [7.6, -60, 330],
  [8.6, -40, 80], [9.6, 0, 0], [17.6, 0, -10], [18.4, 0, -40], [24.0, 0, -40], [25.5, 0, -30]];
const PK = KEYS.map(([t, x, y]) => ({ t, x, y }));
function herm(t) { const P = PK, n = P.length; if (t <= P[0].t) return { x: P[0].x, y: P[0].y }; if (t >= P[n - 1].t) return { x: P[n - 1].x, y: P[n - 1].y };
  let i = 0; while (P[i + 1].t < t) i++; const p1 = P[i], p2 = P[i + 1], h = p2.t - p1.t, u = (t - p1.t) / h;
  const tan = k => { const a = P[Math.max(0, k - 1)], b = P[Math.min(n - 1, k + 1)]; return { x: (b.x - a.x) / (b.t - a.t), y: (b.y - a.y) / (b.t - a.t) }; };
  const m1 = tan(i), m2 = tan(i + 1), u2 = u * u, u3 = u2 * u, a = 2 * u3 - 3 * u2 + 1, b = u3 - 2 * u2 + u, c = -2 * u3 + 3 * u2, d = u3 - u2;
  return { x: a * p1.x + b * h * m1.x + c * p2.x + d * h * m2.x, y: a * p1.y + b * h * m1.y + c * p2.y + d * h * m2.y }; }
const wpos = t => { const p = herm(t), still = smoothstep(9.2, 9.8, t); return { x: p.x, y: p.y + Math.sin(t * 2.1) * 6 * still }; };
const wvel = t => { const a = wpos(t - 1 / 240), b = wpos(t + 1 / 240); return { x: (b.x - a.x) * 120, y: (b.y - a.y) * 120 }; };
function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const tt = t + k * 0.022, v = wvel(tt), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
    const h = sp < 40 ? 0 : clamp(Math.atan2(v.y, Math.abs(v.x)), -0.9, 0.9) * clamp(sp / 300); a += h * w; s += w; } return a / s; }
const facing = t => { let vx = 0; for (let k = 0; k < 6; k++) vx += wvel(t - k * 0.05).x; return t > 9.3 ? 1 : (vx < -30 ? -1 : 1); };

// ---------- sensing: a glyph is classified when the whale passes within reach, or when the sounding ring reaches it ----------
const PING = 7.6, PING_V = 1900, REACH = 240;
{ const P0 = wpos(PING);
  for (const p of PTS) { let tc = Infinity; for (let tt = 1.6; tt < PING; tt += 1 / 120) { const w = wpos(tt); if (Math.hypot(w.x - p.x, w.y - p.y) < REACH) { tc = tt; break; } }
    p.tc = Math.min(tc, PING + Math.hypot(p.x - P0.x, p.y - P0.y) / PING_V); } }
const SORTED_AT = PTS.map(p => p.tc).sort((a, b) => a - b);
// ---------- sorting into clusters (sunflower packing) ----------
PTS.forEach(p => { const a = p.k * 2.39996, r = 10.2 * Math.sqrt(p.k + 0.6); p.cx = CENT[p.cl][0] + Math.cos(a) * r; p.cy = CENT[p.cl][1] + Math.sin(a) * r * 0.95;
  p.ts = 8.3 + p.cl * 0.14 + p.jit * 0.55; });
const COLLAPSE = c => 13.25 + c * B;      // each cluster becomes one node, on the beat
const NODE_R = 80;
// ---------- network ----------
const HUB = [0, -40];
const EDGES = [{ a: 'hub', b: 0, t: beat(29) }, { a: 'hub', b: 1, t: beat(30) }, { a: 'hub', b: 2, t: beat(31) }, { a: 'hub', b: 3, t: beat(32) },
  { a: 0, b: 1, t: beat(33) }, { a: 2, b: 3, t: beat(33.5) }, { a: 0, b: 2, t: beat(34) }, { a: 1, b: 3, t: beat(34.5) }];
const nodeXY = k => k === 'hub' ? HUB : CENT[k];
// ---------- dispatch: pods out to each node, work, back with the answer ----------
const SPOUT = beat(38), POD = [0, 1, 2, 3].map(i => ({ out: beat(39 + i), arrive: beat(39 + i) + 0.62, done: beat(39 + i) + 0.62 + 1.25, back: beat(47 + i * 0.5), home: beat(47 + i * 0.5) + 0.6 }));

// ---------- camera ----------
function cam(t) {
  let fx = 0, fy = 0, s = 0; for (let k = 0; k <= 8; k++) { const w = 1 - k / 9, p = wpos(t - k * 0.05); fx += p.x * w; fy += p.y * w; s += w; } fx /= s; fy /= s;
  const k1 = ramp(t, 8.0, 10.2, EASE.rest), k2 = ramp(t, 24.6, 27.0, EASE.rest), ki = ramp(t, 10.5, 11.6, EASE.glaser) * (1 - ramp(t, 13.0, 13.9, EASE.rest));
  const z = lerp(lerp(lerp(1.0, 0.86, k1) + 0.03 * ramp(t, 17.5, 23.5, EASE.rest), 0.74, k2), 1.7, ki);
  return { x: lerp(lerp(fx + 140 * (1 - k1), 0, k1), fx, ki), y: lerp(lerp(fy, 10, k1) + lerp(0, 30, k2), fy - 40, ki), z, ax: 960, ay: lerp(lerp(560, 640, k1) + 40 * k2, 620, ki) };
}

// ---------- READ table (drives captions and the read-time gate) ----------
const READ = [
  { id: 'c1', in: 0.4, out: 2.7, fi: 0.4, fo: 0.3, text: 'A sea of data.', mk: 'A sea of <i>data</i>.' },
  { id: 'c2', in: 3.2, out: 7.7, fi: 0.35, fo: 0.3, text: "Notice what's alike.", mk: "Notice what's <i>alike</i>." },
  { id: 'c3', in: 11.35, out: 13.2, fi: 0.3, fo: 0.3, text: 'An idea.', mk: 'An <i>idea</i>.' },
  { id: 'c4', in: 13.4, out: 17.0, fi: 0.35, fo: 0.3, text: 'Connect the pieces.', mk: 'Connect the <i>pieces</i>.' },
  { id: 'c5', in: 17.9, out: 21.6, fi: 0.35, fo: 0.3, text: 'Send the AI to work.', mk: 'Send the AI to <i>work</i>.' },
  { id: 'c6', in: 21.8, out: 24.5, fi: 0.35, fo: 0.3, text: 'Bring back the answers.', mk: 'Bring back the <i>answers</i>.' },
  { id: 'end', in: 25.4, out: DUR, fi: 0.6, fo: 0, text: 'Make sense of the sea.', mk: 'Make sense of the <i>sea</i>.' },
];

function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.fillStyle = C.paper; c.fillRect(0, 0, W, H);

  // far plane: faint dust that drifts slower than the camera (depth)
  for (const f of FAR) { const px = (f.x - cm.x * 0.45) * z * 0.7 + 960 + Math.sin(t * 0.3 + f.ph) * 10, py = (f.y - cm.y * 0.45) * z * 0.7 + 560;
    if (px < -10 || px > W + 10 || py < -10 || py > H + 10) continue; c.fillStyle = rgba(C.slate, 0.13); c.beginPath(); c.arc(px, py, f.r, 0, Math.PI * 2); c.fill(); }

  const W0 = wpos(t);
  // ---------- network edges (under everything) ----------
  for (const e of EDGES) { const k = ramp(t, e.t, e.t + 0.38, EASE.glaser); if (k <= 0) continue; const [ax, ay] = nodeXY(e.a), [bx, by] = nodeXY(e.b);
    const fade = 1 - 0.55 * ramp(t, 27.5, 29, EASE.rest) * 0; c.strokeStyle = rgba(INK, e.a === 'hub' ? 0.85 : 0.35); c.lineWidth = (e.a === 'hub' ? 2.6 : 1.6) * Math.max(z, 0.8);
    if (e.a !== 'hub') c.setLineDash([6, 7]); c.beginPath(); c.moveTo(X(ax), Y(ay)); c.lineTo(X(lerp(ax, bx, k)), Y(lerp(ay, by, k))); c.stroke(); c.setLineDash([]); }

  // ---------- the sounding ring ----------
  if (t > PING && t < PING + 1.6) { const P0 = wpos(PING), r = (t - PING) * PING_V; c.strokeStyle = rgba(INK, 0.55 * (1 - (t - PING) / 1.6)); c.lineWidth = 2;
    c.beginPath(); c.arc(X(P0.x), Y(P0.y), r * z, 0, Math.PI * 2); c.stroke(); c.strokeStyle = rgba(INK, 0.25 * (1 - (t - PING) / 1.6)); c.beginPath(); c.arc(X(P0.x), Y(P0.y), Math.max(0, r - 60) * z, 0, Math.PI * 2); c.stroke(); }

  // ---------- data glyphs ----------
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const p of PTS) {
    const col = COLLAPSE(p.cl); if (t > col + 0.5) continue;
    let x = p.x + Math.sin(t * 0.5 + p.ph) * 7, y = p.y + Math.cos(t * 0.43 + p.ph) * 6;
    // wake: the whale parts the data as it passes
    const dx = x - W0.x, dy = y - W0.y, d = Math.hypot(dx, dy); if (t < 9 && d < 170 && d > 1) { const push = 46 * Math.exp(-d / 70); x += dx / d * push; y += dy / d * push; }
    const s = ramp(t, p.ts, p.ts + 0.95, EASE.glaser); x = lerp(x, p.cx, s); y = lerp(y, p.cy, s);
    const cc = ramp(t, col, col + 0.45, EASE.collect); x = lerp(x, CENT[p.cl][0], cc); y = lerp(y, CENT[p.cl][1], cc);
    const lit = ramp(t, p.tc, p.tc + 0.18, EASE.glaser), fill = lit > 0 ? mix(GREY, CLS[p.cl], lit) : GREY, edge = mix(GREY, CLS_EDGE[p.cl], lit);
    const sc = Math.max(z, 0.85) * (1 + 0.6 * Math.exp(-Math.max(0, t - p.tc) * 7) * (lit > 0 ? 1 : 0)) * (1 - 0.7 * cc), sx = X(x), sy = Y(y);
    if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30) continue;
    c.globalAlpha = 1 - cc;
    if (p.kind === 0) { c.fillStyle = fill; c.beginPath(); c.arc(sx, sy, p.r * sc, 0, Math.PI * 2); c.fill(); if (lit > 0.5 && p.cl === 1) { c.strokeStyle = edge; c.lineWidth = 1.2; c.stroke(); } }
    else if (p.kind === 1) { const r = p.r * sc; c.fillStyle = fill; c.fillRect(sx - r / 2, sy - r / 2, r, r); if (lit > 0.5 && p.cl === 1) { c.strokeStyle = edge; c.lineWidth = 1.2; c.strokeRect(sx - r / 2, sy - r / 2, r, r); } }
    else { c.font = `${Math.round(p.ds * sc)}px ${KH.FONTS.monoB}`; c.fillStyle = lit > 0 ? mix(GREY, CLS_EDGE[p.cl], lit) : GREY; c.fillText(p.d, sx, sy); }
  }
  c.restore();

  // ---------- nodes ----------
  for (let k = 0; k < 4; k++) { const t0 = COLLAPSE(k) + 0.3, a = ramp(t, t0, t0 + 0.4, EASE.glaser); if (a <= 0) continue;
    const [nx, ny] = CENT[k], R = NODE_R * Math.max(z, 0.8) * (0.6 + 0.4 * a), sx = X(nx), sy = Y(ny);
    c.globalAlpha = a; c.fillStyle = mix(CLS[k], C.paper, 0.55); c.beginPath(); c.arc(sx, sy, R, 0, Math.PI * 2); c.fill(); c.strokeStyle = CLS_EDGE[k]; c.lineWidth = 3; c.stroke();
    // work ring + check when its pod has done the job
    const pd = POD[k], wk = ramp(t, pd.arrive, pd.done, EASE.rest);
    if (wk > 0) { c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.arc(sx, sy, R + 10, -Math.PI / 2, -Math.PI / 2 + wk * Math.PI * 2); c.stroke(); }
    const ck = ramp(t, pd.done, pd.done + 0.3, EASE.glaser);
    text(c, String(PTS.filter(p => p.cl === k).length), sx, sy + 11, { f: 'monoB', size: Math.round(30 * Math.max(z, 0.8)), col: INK, align: 'center', a: a * (1 - ck), track: 0.04 });
    if (ck > 0) { c.save(); c.globalAlpha = a * ck; c.strokeStyle = INK; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(sx - 18, sy + 2); c.lineTo(sx - 5, sy + 15); c.lineTo(sx + lerp(-5, 22, ck), sy + lerp(15, -14, ck)); c.stroke(); c.restore(); }
    c.globalAlpha = 1;
    const below = true;
    text(c, NAMES[k], sx, sy + (below ? R + 42 : -R - 24), { f: 'mono', size: 18, col: INK, align: 'center', a });
    if (ck > 0) { const ry = sy + (below ? R + 74 : -R - 56), tw = text(c, RESULTS[k], sx + 12, ry, { f: 'sans', size: 22, col: INK, align: 'center', a: ck });
      c.globalAlpha = ck; c.fillStyle = CLS[k]; c.strokeStyle = CLS_EDGE[k]; c.lineWidth = 1.5; c.beginPath(); c.arc(sx + 12 - tw / 2 - 16, ry - 7, 7, 0, Math.PI * 2); c.fill(); c.stroke(); c.globalAlpha = 1; } }

  // ---------- pods ----------
  for (let i = 0; i < 4; i++) { const pd = POD[i], [hx, hy] = HUB, [nx, ny] = CENT[i];
    let x, y, ang, a = 1;
    if (t < pd.out - 0.15 || t > pd.home + 0.25) continue;
    if (t < pd.arrive) { const u = EASE.glaser(clamp((t - pd.out) / (pd.arrive - pd.out))); x = lerp(hx, nx, u); y = lerp(hy, ny, u); ang = Math.atan2(ny - hy, nx - hx); a = clamp((t - pd.out + 0.15) / 0.15); }
    else if (t < pd.back) { const o = (t - pd.arrive) * 2.6 + i; x = nx + Math.cos(o) * (NODE_R + 26); y = ny + Math.sin(o) * (NODE_R + 26); ang = o + Math.PI / 2; }
    else { const u = EASE.warm(clamp((t - pd.back) / (pd.home - pd.back))), o = (pd.back - pd.arrive) * 2.6 + i, sx0 = nx + Math.cos(o) * (NODE_R + 26), sy0 = ny + Math.sin(o) * (NODE_R + 26);
      x = lerp(sx0, hx, u); y = lerp(sy0, hy, u); ang = Math.atan2(hy - sy0, hx - sx0); a = 1 - ramp(t, pd.home, pd.home + 0.25); }
    const flip = Math.cos(ang) < 0; c.save(); c.translate(X(x), Y(y)); if (flip) { c.scale(-1, 1); ang = Math.PI - ang; }
    KH.drawPod(c, 0, 0, ang, 46 * Math.max(z, 0.85), CLS[i], { alpha: a, ink: INK }); c.restore(); }

  // ---------- speed trail behind the whale while it hunts ----------
  if (t < 9.4) { const cols = [CLS[0], CLS[2], CLS[3]]; for (let k = 0; k < 3; k++) { const pts = [];
      for (let j = 0; j <= 16; j++) { const tt = t - j * 0.02, q = wpos(tt), f = facing(tt), hh = heading(tt); pts.push([X(q.x - f * Math.cos(hh) * 64), Y(q.y - Math.sin(hh) * 64 + (k - 1) * 9)]); }
      const len = Math.hypot(pts[0][0] - pts[16][0], pts[0][1] - pts[16][1]); if (len < 20) continue;
      c.strokeStyle = rgba(cols[k], 0.7); c.lineWidth = 2.6 - k * 0.4; c.lineCap = 'round'; c.beginPath(); pts.forEach(([x, y], j) => j ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); } }

  // ---------- reach ring (what the whale can sense) ----------
  const rr = win(t, 2.2, 7.9, 0.4, 0.4); if (rr > 0) { c.strokeStyle = rgba(INK, 0.22 * rr); c.lineWidth = 1.4; c.setLineDash([3, 8]); c.beginPath(); c.arc(X(W0.x), Y(W0.y), REACH * z, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }

  // ---------- the whale ----------
  { const f = facing(t), ang = heading(t), sp = Math.hypot(...Object.values(wvel(t))), still = sp < 60;
    let blink = 0; for (const b of [5.4, 10.4, 16.2, 23.0, 27.5]) blink = Math.max(blink, 1 - Math.abs(t - b) / 0.07);
    const focus = win(t, 10.6, 11.75, 0.3, 0.15), spark = win(t, beat(25), beat(25) + 1.3, 0.12, 0.4), delight = t > 22.6 ? 1 : 0;
    const spray = win(t, SPOUT, SPOUT + 0.9, 0.12, 0.35);
    c.save(); c.translate(X(W0.x), Y(W0.y)); if (f < 0) c.scale(-1, 1);
    KH.drawWhale(c, { x: 0, y: 0, ang: f < 0 ? -ang : ang, scale: 0.62 * Math.max(z, 0.85), L: 1, tail: Math.sin(t * (still ? 3 : 11)) * (still ? 0.12 : 0.34), fin: Math.sin(t * (still ? 3 : 11) + 1.3) * 0.3,
      blink, focus, spark, sparkColor: WD.englishRed, sparkScale: 1.7, eye: spark > 0.1 ? 1.25 : 1, delight, blush: 0.6, mouth: delight ? 0.4 : 0, spray, sprayColor: WD.violetBlue });
    c.restore(); }

  // ---------- chrome ----------
  text(c, 'CETI · Sea of data', 160, 120, { f: 'mono', size: 14, col: SOFT, a: ramp(t, 0.3, 0.8) * (1 - ramp(t, 25.0, 25.4)) });
  const sorted = SORTED_AT.filter(x => x <= t).length;
  let stat = null;
  if (t >= 2 && t < 13.2) stat = `Sorted ${String(sorted).padStart(3, ' ')} / ${PTS.length}`;
  else if (t >= 13.2 && t < 17.8) stat = `Nodes ${[0, 1, 2, 3].filter(k => t >= COLLAPSE(k) + 0.3).length} · Links ${EDGES.filter(e => t >= e.t + 0.38).length}`;
  else if (t >= 17.8 && t < 25.0) stat = `Agents 4 · Done ${POD.filter(p => t >= p.done).length}`;
  if (stat) text(c, stat, 1760, 120, { f: 'mono', size: 14, col: SOFT, align: 'right' });
  for (const r of READ) { if (r.id === 'end') continue; const o = win(t, r.in, r.out, r.fi, r.fo); if (o <= 0) continue;
    text(c, r.mk, 160, 214 + (1 - EASE.defer(clamp((t - r.in) / r.fi))) * 12, { f: 'disp', size: 84, col: INK, accent: WD.englishRed, a: o }); }
  const e = READ[READ.length - 1], ea = ramp(t, e.in, e.in + e.fi);
  if (ea > 0) { text(c, 'CETI · Sea of data', 160, 130, { f: 'mono', size: 15, col: SOFT, a: ramp(t, e.in + 0.4, e.in + 0.9) });
    text(c, e.mk, 160, 230 + (1 - EASE.defer(ea)) * 12, { f: 'disp', size: 92, col: INK, accent: WD.englishRed, a: ea });
    whaleMark(c, 1640, 104, 0.6, INK, ramp(t, e.in + 0.7, e.in + 1.2)); text(c, 'cetiai.co', 1760, 180, { f: 'mono', size: 14, col: SOFT, a: ramp(t, e.in + 0.7, e.in + 1.2), align: 'right' }); }
  const fb = 1 - ramp(t, 0, 0.35); if (fb > 0) { c.fillStyle = rgba(C.paper, fb); c.fillRect(0, 0, W, H); }
  c.restore();
}

function cues() { return { bpm: 128, dur: DUR, title: 0.4, ping: PING, sortStart: 8.3, classified: SORTED_AT.filter(x => x < PING + 2), idea: beat(25), collapses: [0, 1, 2, 3].map(COLLAPSE),
  edges: EDGES.map(e => e.t), spout: SPOUT, out: POD.map(p => p.out), arrive: POD.map(p => p.arrive), done: POD.map(p => p.done), home: POD.map(p => p.home), end: READ[READ.length - 1].in }; }
const CONTRAST = [['caption', INK, C.paper], ['labels', INK, C.paper], ['results', INK, C.paper], ['stat', SOFT, C.paper], ['count on node 0', INK, mix(CLS[0], C.paper, 0.55)], ['count on node 1', INK, mix(CLS[1], C.paper, 0.55)], ['count on node 2', INK, mix(CLS[2], C.paper, 0.55)], ['count on node 3', INK, mix(CLS[3], C.paper, 0.55)]];
root.SEA = { drawFrame, cues, READ, CONTRAST, DUR, W, H, fps: 60, wpos, heading, cam, shutter: t => (t >= 0.4 && t < 9.5) || (t > 17.8 && t < 24.5) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
