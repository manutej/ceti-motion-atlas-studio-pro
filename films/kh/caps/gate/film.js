// CETI Capabilities 02 · gate v3 — "Check it at the gate." Kinetic Hydrography 1.0.0 + series layer. 25-s series format.
// Each gate checks ONE KIND of thing, drawn as an icon on its lintel (wobble, gap). All openings are the same size.
// The escape is a smooth, whole run of the WRONG KIND (wrong colour): it passes both gates honestly and the pod answers ✕.
// The whale folds the miss flag into a new icon (colour) and builds a new KIND of gate; the old mistake now stops there.
// Honest limit: a run of yet another kind (backwards) still gets through. drawFrame(ctx, t) is a pure function of t.
// Gate outcomes are not hand-timed: each run is checked by every gate that exists when it arrives, and stops at the first
// gate of its own kind; otherwise it reaches the pod, which answers ✓ only for a good run.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, win, EASE, ramp, mix, rgba, text } = KH;
const W = 1920, H = 1080, BPM = 128, B = 60 / BPM, DUR = 27.38;
const INK = C.navy, SOFT = C.slate, OLIVE = WD.oliveGreen, RAW = WD.rawSienna, SLATE = WD.slateColor;
const BG = mix(C.paper, OLIVE, 0.06);                       // what SERIES.ground paints with tint: olive
let ACC = RAW; for (let k = 0; k <= 1; k += 0.05) { ACC = mix(RAW, INK, k); if (KH.contrast(ACC, BG) >= 4.6 && KH.contrast(ACC, C.paper) >= 4.6) break; }
const PASS = mix(OLIVE, INK, 0.12), FAIL = mix(RAW, INK, 0.08), TRACK = mix(C.paper, C.slate, 0.5), WALL = mix(C.paper, C.slate, 0.16), HATCH = mix(C.paper, C.slate, 0.34);
const PODCOL = mix(SLATE, C.paper, 0.3);

// ---------- the line, the gates (one kind each), the pod ----------
const GX = [-520, -260, 0, 260], KIND = ['wobble', 'gap', 'colour', 'back'];
const HT = 150, A = 56, GW = 30, ICON_Y = -HT - 52, ICON_R = 34, LEN = 300, PODX = 560, MOUTH = 515;
const T_PICK = [11.25, 21.0], T_FOLD = [[11.5, 11.95], [21.25, 21.65]], T_SET = [12.35, 22.05];
const BUILT = [-9, -9, T_SET[0] - 0.35, T_SET[1] - 0.35];     // posts rise for 0.35 s; the icon lands as they finish

// ---------- runs: kind decides colour/shape; t1 = time the head is at gate 1 ----------
const RUNS = [
  { id: 'e1', kind: 'colour', v: 650, t1: 0.56 },                         // FELT: smooth, whole, wrong colour: passes both, pod ✕
  { id: 'w', kind: 'wobble', v: 650, t1: 6.95 },                          // KINDS: stopped by the wobble gate
  { id: 'gp', kind: 'gap', v: 650, t1: 7.7 },                             // passes wobble, stopped by the gap gate
  { id: 'e2', kind: 'colour', v: 800, t1: 8.75 },                         // the wrong colour again, faster…
  { id: 'e3', kind: 'colour', v: 1000, t1: 9.47 },                        // …and faster: the pile of flags grows
  { id: 'old', kind: 'colour', v: 650, t1: 13.05 },                       // MOVE: the old mistake, replayed, stops at the new gate
  { id: 'fix', kind: 'ok', v: 700, t1: 14.2 },                            // the fixed run threads all three: pod ✓
  { id: 'back', kind: 'back', v: 800, t1: 18.68 },                        // LIMIT: a new kind (backwards) gets through: pod ✕
  { id: 'end', kind: 'ok', v: 640, t1: 23.13 },                            // PAYOFF: four kinds of check, the same pod answers ✓
];
const built = (g, t) => t >= BUILT[g] + 0.35;
for (const r of RUNS) {
  r.cross = GX.map((x, g) => ({ g, t: r.t1 + (x - GX[0]) / r.v })).filter(e => built(e.g, e.t));
  const st = r.cross.find(e => KIND[e.g] === r.kind);
  if (st) { r.stop = st.g; r.face = GX[st.g] - GW - 4; r.tStop = r.t1 + (r.face - GX[0]) / r.v - 0.02; r.fade = [r.tStop + 0.4, r.tStop + 0.7]; r.cross = r.cross.filter(e => e.g < st.g); }
  else r.arr = r.t1 + (MOUTH - GX[0]) / r.v;
}
const PASSES = RUNS.flatMap(r => r.cross.map(e => ({ ...e, id: r.id }))).sort((a, c) => a.t - c.t);
const STOPS = RUNS.filter(r => r.stop != null).map(r => ({ t: r.tStop, g: r.stop, id: r.id, open: r.tStop + 0.6 }));
const ANSWERS = RUNS.filter(r => r.arr != null).map(r => ({ t: r.arr, ok: r.kind === 'ok', id: r.id })).sort((a, c) => a.t - c.t);
// flags: one per ✕, falling onto a pile under the pod. Slot 2 is the top of the pile (the one the whale picks).
const FLAGS = ANSWERS.filter(a => !a.ok).map((a, i) => ({ t: a.t + 0.1, slot: [0, 1, 2, 2][i], id: a.id,
  pick: i === 2 ? 0 : i === 3 ? 1 : null, gone: i < 2 ? [14.0, 14.4] : null }));
const SLOTX = [374, 410, 444], FTOP = 92, FBASE = 178, FS = 1.35, LEAN = [-0.16, -0.06, 0];
const TC = s => ({ x: SLOTX[s] + 14 * FS, y: FBASE + (FTOP - FBASE + 12) * FS });   // centre of a flag's cloth (slot 2 stands upright)
function head(r, t) { const f = GX[0] + r.v * (t - r.t1); if (r.stop == null) return f;
  const G = r.face, s = 50; return f < G - s ? f : G - s * Math.exp(-(f - (G - s)) / s); }
function runPt(r, u, h, cr) { const uu = Math.pow(u, 1 + 1.3 * cr), x = h - LEN * (1 - 0.32 * cr) * uu;
  const amp = r.kind === 'wobble' ? 80 : 5, wl = r.kind === 'wobble' ? 104 : 210;
  const env = Math.max(Math.pow(Math.sin(Math.PI * u), 0.7), cr * Math.pow(1 - u, 0.5) * 0.9);
  return [x, amp * env * Math.sin(u * LEN * 2 * Math.PI / wl + 0.6)]; }

// ---------- the whale: Hermite through keys (zero tangents = it settles at each key) ----------
const WS = 0.58, REACH = 118 * WS + 30;                      // whale scale; nose-to-carried-item distance
const P0 = [-130, -310], P1 = [130, -310], P2 = [430, -310], PICK = [TC(2).x - REACH, TC(2).y - 4];
const K = [[0, ...P0], [10.5, ...P0], [T_PICK[0], ...PICK], [11.55, ...PICK], [T_SET[0], GX[2] + REACH, ICON_Y - 4], [12.8, ...P1],
  [20.45, ...P1], [T_PICK[1], ...PICK], [21.3, ...PICK], [T_SET[1], GX[3] + REACH, ICON_Y - 4], [22.5, ...P2], [DUR + 1, ...P2]];
function herm(P, t) { const n = P.length; if (t <= P[0][0]) return { x: P[0][1], y: P[0][2] }; if (t >= P[n - 1][0]) return { x: P[n - 1][1], y: P[n - 1][2] };
  let i = 0; while (P[i + 1][0] < t) i++; const p1 = P[i], p2 = P[i + 1], u = (t - p1[0]) / (p2[0] - p1[0]), A2 = 2 * u * u * u - 3 * u * u + 1, C2 = 1 - A2;
  return { x: A2 * p1[1] + C2 * p2[1], y: A2 * p1[2] + C2 * p2[2] }; }
const NODS = PASSES.filter(e => e.t < 3).map(e => e.t).concat(T_PICK, T_SET);
function wworld(t) { const p = herm(K, t), q = herm(K, t + 0.01), sp = Math.hypot(q.x - p.x, q.y - p.y) * 100, still = 1 - clamp(sp / 150);
  let dip = 0; for (const s of NODS) { const d = t - s; if (d > 0 && d < 0.35) dip = Math.max(dip, 6 * Math.sin(Math.PI * d / 0.35)); }
  return { x: p.x, y: p.y + (Math.sin(t * 2.4) * 2.5 + dip) * still }; }
const wvel = t => { const a = wworld(t - 1 / 240), c = wworld(t + 1 / 240); return { x: (c.x - a.x) * 120, y: (c.y - a.y) * 120 }; };
function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
    a += (sp < 40 ? 0 : clamp(Math.atan2(v.y, Math.abs(v.x)), -0.8, 0.8) * clamp(sp / 300)) * w; s += w; } return a / s; }
// facing: +1 right, -1 left; it turns only while still (a squash through zero width)
const TURNS = [[11.27, -1], [20.2, 1], [21.02, -1], [22.55, 1]];
function facing(t) { let f = 1; for (const [a, to] of TURNS) f = lerp(f, to, ramp(t, a, a + 0.25, EASE.warm)); return f; }
// what the whale carries: the picked flag, folding into the new icon, held at its nose
function nose(t) { const p = wworld(t), a = heading(t), f = facing(t), rx = REACH * Math.cos(a) - 4 * Math.sin(a), ry = REACH * Math.sin(a) + 4 * Math.cos(a); return { x: p.x + f * rx, y: p.y + ry, f }; }

// ---------- camera: close on the consequence, pull back under the title, one push-in on the build, release ----------
function cam(t) {
  const pull = ramp(t, 4.0, 6.3, EASE.rest), push = ramp(t, 11.9, 12.8, EASE.warm), rel = ramp(t, 14.5, 15.3, EASE.warm), end = ramp(t, 22.8, DUR, EASE.rest);
  let z = lerp(1.45, 1.2, pull), x = lerp(0, 20, pull); z = lerp(z, 1.45, push); x = lerp(x, -40, push); z = lerp(z, 1.2, rel); x = lerp(x, 20, rel);
  return { x, y: 0, z: z + 0.03 * end, ax: 960, ay: 560 }; }
const wpos = t => wworld(t);

// ---------- text ----------
const T0 = 3.92, T_LOCK = 25.25;
const cap = (id, inn, out, text) => ({ id, kind: 'caption', in: inn, out, fi: 0.25, fo: 0.2, text });
const READ = [
  cap('felt1', 0.30, 2.05, 'It passed every check.'),
  cap('felt2', 2.12, 4.10, 'Then a customer found the bug.'),
  { id: 'eyebrow', kind: 'label', in: T0 + 0.25, out: T0 + 2.47, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 02' },
  { id: 'title', kind: 'title', in: T0 + 0.25, out: T0 + 2.47, fi: 0.4, fo: 0.45, text: 'Check it at the gate.' },
  cap('kinds', 6.45, 8.57, 'Each gate checks one kind of thing.'),
  cap('esc', 8.65, 10.47, 'No gate looks at colour.'),
  cap('fold', 10.55, 12.67, 'Fold the miss into a new check.'),
  cap('old', 12.75, 14.87, 'The old mistake must stop here now.'),
  { id: 'card', kind: 'card', in: 16.1, out: 18.55, fi: 0.3, fo: 0.3, text: 'Real run · 7 misses, 7 new checks', src: 'https://app.notion.com/p/3f2d50cfaf9381a88b04f3837efcac6a' },
  { id: 'src', kind: 'label', in: 16.1, out: 18.55, fi: 0.3, fo: 0.3, text: 'Source · Limits & escapes register' },
  cap('font', 16.2, 18.55, 'A page asked for one font, got another.'),
  cap('limit', 18.6, 20.72, 'The next new kind still gets through.'),
  cap('notthis', 20.8, 22.92, 'Passing means no known failures. Not quality.'),
  cap('belief', 22.98, T_LOCK, 'Machines check every run. Misses become new checks.'),
  { id: 'lockup', kind: 'label', in: T_LOCK, out: DUR, fi: 0.45, fo: 0, text: 'CETI · Capabilities · 02 · Gate' },
];
const RD = id => READ.find(r => r.id === id), RA = (t, id) => { const r = RD(id); return win(t, r.in, r.out, r.fi, r.fo); };

// ---------- icons: a paper disc on the lintel with one mark for the kind it checks ----------
function iconMark(c, kind, x, y, r, a, lw) {
  c.save(); c.globalAlpha *= a; c.strokeStyle = INK; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath();
  if (kind === 'wobble') { for (let k = 0; k <= 24; k++) { const u = k / 24, px = x + (u - 0.5) * 1.3 * r, py = y + 0.3 * r * Math.sin(u * Math.PI * 3); k ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
  else if (kind === 'gap') { c.lineWidth = lw * 1.25; c.moveTo(x - 0.64 * r, y); c.lineTo(x - 0.16 * r, y); c.moveTo(x + 0.16 * r, y); c.lineTo(x + 0.64 * r, y); c.stroke(); }
  else if (kind === 'colour') { const q = 0.56 * r; c.fillStyle = SLATE; c.beginPath(); c.arc(x, y, q, Math.PI / 2, Math.PI * 1.5); c.fill(); c.fillStyle = RAW; c.beginPath(); c.arc(x, y, q, -Math.PI / 2, Math.PI / 2); c.fill();
    c.lineWidth = lw * 0.7; c.beginPath(); c.arc(x, y, q, 0, Math.PI * 2); c.moveTo(x, y - q); c.lineTo(x, y + q); c.stroke(); }
  else if (kind === 'back') { c.moveTo(x - 0.6 * r, y); c.lineTo(x + 0.5 * r, y); c.moveTo(x + 0.18 * r, y - 0.3 * r); c.lineTo(x + 0.56 * r, y); c.lineTo(x + 0.18 * r, y + 0.3 * r); c.stroke(); }
  c.restore(); }
// a flag's cloth (triangle, raw sienna) morphing into an icon disc (m: 0 flag → 1 icon). f mirrors the cloth.
function flagToIcon(c, kind, x, y, r, m, f, a) {
  const N = 48, tri = [[-14, -12], [22, 0], [-14, 12], [-14, -12]].map(([a, b]) => [a * FS, b * FS]), per = [];
  for (let i = 0; i < 3; i++) per.push(Math.hypot(tri[i + 1][0] - tri[i][0], tri[i + 1][1] - tri[i][1]));
  const tot = per.reduce((p, q) => p + q, 0), pts = [];
  for (let k = 0; k < N; k++) { let d = k / N * tot, i = 0; while (d > per[i]) { d -= per[i]; i++; } const u = d / per[i];
    const tx = lerp(tri[i][0], tri[i + 1][0], u) * f, ty = lerp(tri[i][1], tri[i + 1][1], u), th = Math.atan2(ty, tx);
    pts.push([x + lerp(tx, r * Math.cos(th), m), y + lerp(ty, r * Math.sin(th), m)]); }
  pts.sort((p, q) => Math.atan2(p[1] - y, p[0] - x) - Math.atan2(q[1] - y, q[0] - x));
  c.save(); c.globalAlpha *= a; c.beginPath(); pts.forEach(([px, py], j) => j ? c.lineTo(px, py) : c.moveTo(px, py)); c.closePath();
  c.fillStyle = mix(RAW, C.paper, m); c.fill(); c.strokeStyle = mix(FAIL, INK, m); c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke(); c.restore();
  if (m > 0.4) iconMark(c, kind, x, y, r, (m - 0.4) / 0.6, 3); }

function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay;
  S.ground(c, t, cm, { tint: OLIVE });
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.lineCap = 'round'; c.lineJoin = 'round';

  // the track: one line, ending in the pod's mouth
  c.strokeStyle = TRACK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(X(-1500), Y(0)); c.lineTo(X(MOUTH), Y(0)); c.stroke();

  const flashOf = g => { let f = 0; for (const e of PASSES) if (e.g === g && t >= e.t) f = Math.max(f, Math.exp(-(t - e.t) * 3.5)); return f; };
  const closeOf = g => { let k = 0; for (const e of STOPS) if (e.g === g) k = Math.max(k, ramp(t, e.t - 0.06, e.t + 0.12, EASE.glaser) * (1 - ramp(t, e.open, e.open + 0.3, EASE.warm))); return k; };
  const hw = Math.max(GW * z, 26);

  // gate backs: hatched walls above and below one paper opening (same size on every gate)
  GX.forEach((gx, g) => {
    const X0 = X(gx), grow = ramp(t, BUILT[g], BUILT[g] + 0.35, EASE.glaser); if (grow <= 0) return;
    const top = Y(-HT * grow), bot = Y(HT * grow), sA = Math.min(A, HT * grow), st = Y(-sA), sb = Y(sA), flash = flashOf(g), close = closeOf(g);
    c.fillStyle = WALL; c.fillRect(X0 - hw, top, 2 * hw, st - top); c.fillRect(X0 - hw, sb, 2 * hw, bot - sb);
    c.save(); c.beginPath(); c.rect(X0 - hw, top, 2 * hw, st - top); c.rect(X0 - hw, sb, 2 * hw, bot - sb); c.clip(); c.strokeStyle = HATCH; c.lineWidth = 1.5; c.beginPath();
    for (let y = top - 2 * hw; y < bot + 2 * hw; y += 13) { c.moveTo(X0 - hw, y); c.lineTo(X0 + hw, y - 2 * hw); } c.stroke(); c.restore();
    c.fillStyle = C.paper; c.fillRect(X0 - hw, st, 2 * hw, sb - st);
    if (flash > 0.02) { c.fillStyle = rgba(OLIVE, 0.45 * flash); c.fillRect(X0 - hw, st, 2 * hw, sb - st); }
    if (close > 0.02) { c.fillStyle = rgba(RAW, 0.22 * close); c.fillRect(X0 - hw, st, 2 * hw, sb - st); }
  });

  // runs
  for (const r of RUNS) {
    const h = head(r, t); if (h < cm.x - 1100 / z || h - LEN > MOUTH + 4) continue;
    const a = r.fade ? 1 - ramp(t, r.fade[0], r.fade[1], EASE.rest) : 1; if (a <= 0) continue;
    let glow = 0; for (const e of r.cross) if (t >= e.t) glow = Math.max(glow, Math.exp(-(t - e.t) * 1.6));
    const cr = r.tStop != null ? ramp(t, r.tStop, r.tStop + 0.28, EASE.glaser) : 0;
    const base = r.kind === 'colour' ? RAW : SLATE, col = mix(mix(base, PASS, glow * (r.kind === 'colour' ? 0.15 : 0.6)), FAIL, cr * 0.5), lw = Math.max(6, 7.5 * z);
    const pts = []; for (let k = 0; k <= 90; k++) { const [x, y] = runPt(r, k / 90, h, cr); pts.push({ x, y, u: k / 90 }); }
    const vis = p => p.x <= MOUTH && !(r.kind === 'gap' && p.u > 0.36 && p.u < 0.64);
    const path = () => { c.beginPath(); let pen = false; for (const p of pts) { if (!vis(p)) { pen = false; continue; } pen ? c.lineTo(X(p.x), Y(p.y)) : c.moveTo(X(p.x), Y(p.y)); pen = true; } };
    if (glow > 0.02) { c.strokeStyle = rgba(OLIVE, (r.kind === 'colour' ? 0.22 : 0.32) * glow * a); c.lineWidth = lw * 3.4; path(); c.stroke(); }
    c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = lw; path(); c.stroke();
    if (r.kind === 'back') { c.lineWidth = lw * 0.75; c.beginPath();       // chevrons pointing the wrong way
      for (const u of [0.22, 0.5, 0.78]) { const [x, y] = runPt(r, u, h, 0); if (x + 8 > MOUTH) continue; const s = 13 * z;
        c.moveTo(X(x) + s, Y(y) - s); c.lineTo(X(x) - s * 0.6, Y(y)); c.lineTo(X(x) + s, Y(y) + s); } c.stroke(); }
    c.globalAlpha = 1;
  }

  // gate fronts: posts, lintel, foot, the closing bar, and the kind icon on the lintel
  GX.forEach((gx, g) => {
    const X0 = X(gx), grow = ramp(t, BUILT[g], BUILT[g] + 0.35, EASE.glaser); if (grow <= 0) return;
    const flash = flashOf(g), close = closeOf(g), top = Y(-HT * grow), bot = Y(HT * grow), sA = Math.min(A, HT * grow), st = Y(-sA), sb = Y(sA), lw = Math.max(6, 7.5 * Math.min(z, 1.2));
    const col = mix(mix(INK, PASS, flash * 0.8), FAIL, close * 0.6);
    if (flash > 0.02) { c.strokeStyle = rgba(OLIVE, 0.22 * flash); c.lineWidth = lw * 4; c.strokeRect(X0 - hw, top, 2 * hw, bot - top); }
    c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
    c.moveTo(X0 - hw, st); c.lineTo(X0 - hw, top); c.moveTo(X0 + hw, st); c.lineTo(X0 + hw, top); c.moveTo(X0 - hw, sb); c.lineTo(X0 - hw, bot); c.moveTo(X0 + hw, sb); c.lineTo(X0 + hw, bot);
    c.moveTo(X0 - hw, st); c.lineTo(X0 + hw, st); c.moveTo(X0 - hw, sb); c.lineTo(X0 + hw, sb); c.stroke();
    c.lineWidth = lw * 1.2; c.beginPath(); c.moveTo(X0 - hw - 16 * z, top); c.lineTo(X0 + hw + 16 * z, top); c.moveTo(X0 - hw - 10 * z, bot); c.lineTo(X0 + hw + 10 * z, bot); c.stroke();
    if (close > 0.01) { c.strokeStyle = FAIL; c.lineWidth = lw * 1.3; c.beginPath(); c.moveTo(X0 - hw, st); c.lineTo(X0 - hw, lerp(st, sb, close)); c.stroke(); }
    // the icon: present from the start on gates 1-2; on gates 3-4 it is the folded flag, set down by the whale
    const ix = X0, iy = Y(ICON_Y), ir = ICON_R * z, pg = g >= 2 ? g - 2 : -1;
    if (pg < 0 || t >= T_SET[pg]) {
      const fresh = pg >= 0 ? win(t, T_SET[pg], T_SET[pg] + 2.2, 0.05, 0.8) : 0, ring = mix(mix(INK, PASS, Math.max(flash, fresh) * 0.85), FAIL, close * 0.85);
      if (fresh > 0.02) { c.strokeStyle = rgba(OLIVE, 0.3 * fresh); c.lineWidth = 12 * z; c.beginPath(); c.arc(ix, iy, ir + 8 * z, 0, Math.PI * 2); c.stroke(); }
      c.fillStyle = C.paper; c.strokeStyle = ring; c.lineWidth = Math.max(3, 3.2 * z); c.beginPath(); c.arc(ix, iy, ir, 0, Math.PI * 2); c.fill(); c.stroke();
      iconMark(c, KIND[g], ix, iy, ir, 1, Math.max(3, 3.4 * z));
    }
    // a pass leaves a small olive tick beside the icon
    let tk = 0; for (const e of PASSES) if (e.g === g && t >= e.t) tk = Math.max(tk, win(t, e.t, e.t + 0.95, 0.08, 0.4));
    if (tk > 0.02) { const s = 14 * z, tx = ix + ir + 22 * z, ty = iy; c.strokeStyle = rgba(PASS, tk); c.lineWidth = 5 * z; c.beginPath(); c.moveTo(tx - s, ty); c.lineTo(tx - s * 0.2, ty + s * 0.8); c.lineTo(tx + s * 1.1, ty - s); c.stroke(); }
  });

  // the pod: receives the work; answers ✓ or ✕ above its head
  { let shake = 0, glow = 0, cur = null; for (const e of ANSWERS) if (t >= e.t) { cur = e; const d = t - e.t; if (!e.ok) shake = 6 * Math.sin(d * 42) * Math.exp(-d * 7); else glow = win(t, e.t, e.t + 1.2, 0.1, 0.6); }
    const px = X(PODX) + shake * z, py = Y(0);
    c.save(); c.translate(px, py); c.scale(-1, 1); KH.drawPod(c, 0, 0, 0, 104 * z, PODCOL, { glow: glow * 0.8 }); c.restore();
    if (cur) { const hold = cur.ok && cur.t > 24 ? DUR + 1 : cur.t + 1.7, a = win(t, cur.t, hold, 0.08, 0.3), pop = 1 + 0.18 * Math.exp(-(t - cur.t) * 8);
      if (a > 0) { const cx = X(PODX), cy = Y(-112), R = 34 * z * pop, m = 14 * z * pop;
        c.save(); c.globalAlpha = a; c.fillStyle = C.paper; c.strokeStyle = cur.ok ? PASS : FAIL; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill(); c.stroke();
        c.lineWidth = 6.5 * z; c.beginPath();
        if (cur.ok) { c.moveTo(cx - m, cy + 1); c.lineTo(cx - m * 0.25, cy + m * 0.8); c.lineTo(cx + m * 1.05, cy - m * 0.9); }
        else { c.moveTo(cx - m, cy - m); c.lineTo(cx + m, cy + m); c.moveTo(cx + m, cy - m); c.lineTo(cx - m, cy + m); }
        c.stroke(); c.restore(); } } }

  // the flags: one per ✕, falling onto a pile under the pod
  for (const F of FLAGS) { if (t < F.t) continue; if (F.pick != null && t >= T_PICK[F.pick]) continue;
    const a = F.gone ? 1 - ramp(t, F.gone[0], F.gone[1], EASE.rest) : 1; if (a <= 0) continue;
    const u = ramp(t, F.t, F.t + 0.38, EASE.glaser), fx = lerp(PODX - 40, SLOTX[F.slot], u), dy = lerp(-170, 0, u), lean = LEAN[F.slot];
    c.save(); c.globalAlpha = a * clamp((t - F.t) / 0.08); c.translate(X(fx), Y(FBASE + dy)); c.rotate(lean); c.scale(z * FS, z * FS);
    c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, FTOP - FBASE); c.stroke();
    c.fillStyle = RAW; c.strokeStyle = FAIL; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, FTOP - FBASE); c.lineTo(36, FTOP - FBASE + 12); c.lineTo(0, FTOP - FBASE + 24); c.closePath(); c.fill(); c.stroke(); c.restore(); }

  // the little whale (and what it carries)
  { const p = wworld(t), ang = heading(t), v = wvel(t), sp = Math.hypot(v.x, v.y), moving = clamp(sp / 400), f = facing(t);
    let blink = 0; for (const k of [1.6, 5.2, 9.1, 13.3, 17.2, 19.6, 23.4, 26.2]) blink = Math.max(blink, 1 - Math.abs(t - k) / 0.07);
    let squash = 0; for (const k of [...T_PICK, ...T_SET]) { const d = t - k; if (d >= 0 && d < 0.32) squash = Math.max(squash, 0.13 * (1 - EASE.glaser(d / 0.32))); }
    const focus = Math.max(win(t, 6.6, 8.3, 0.3, 0.3) * 0.6, win(t, T_PICK[0] - 0.1, T_SET[0] + 0.1, 0.15, 0.15), win(t, T_PICK[1] - 0.1, T_SET[1] + 0.1, 0.15, 0.15), win(t, 13.0, 13.85, 0.2, 0.1) * 0.7);
    const eye = 1 + 0.35 * win(t, 2.15, 3.7, 0.06, 0.4) + 0.3 * win(t, 10.04, 10.95, 0.06, 0.3) + 0.3 * win(t, 19.97, 20.6, 0.06, 0.3);
    const oldStop = STOPS.find(s => s.id === 'old').t, fixA = ANSWERS.find(a => a.id === 'fix').t, endA = ANSWERS.find(a => a.id === 'end').t;
    const spark = Math.max(win(t, oldStop, oldStop + 1.0, 0.12, 0.4), win(t, endA, endA + 1.3, 0.12, 0.5));
    const delight = (t > oldStop + 0.05 && t < oldStop + 0.9) || (t > fixA && t < fixA + 1.1) || t > endA + 0.05 ? 1 : 0;
    c.save(); c.translate(X(p.x), Y(p.y)); c.scale(f, 1);
    KH.drawWhale(c, { x: 0, y: 0, ang, scale: WS * z, L: 1, tail: Math.sin(t * (moving > 0.3 ? 11 : 3)) * lerp(0.12, 0.34, moving), fin: Math.sin(t * 6 + 1.3) * lerp(0.15, 0.3, moving),
      blink, squash, focus: delight ? 0 : focus, eye, spark, sparkColor: OLIVE, delight, blush: 0.6, mouth: delight ? 0.4 : 0.35 * win(t, 2.2, 3.4, 0.06, 0.3), sw: 3.2 });
    c.restore();
    for (let k = 0; k < 2; k++) { if (t < T_PICK[k] || t >= T_SET[k]) continue;
      const n = nose(t), m = ramp(t, T_FOLD[k][0], T_FOLD[k][1], EASE.warm), r = lerp(1, ICON_R, m);
      flagToIcon(c, KIND[2 + k], X(n.x), Y(n.y), r * z, m, n.f, 1); } }

  // the title hinge: the scene goes still under a paper veil, the title names what we just watched
  const veil = win(t, 4.0, T0 + 2.55, 0.35, 0.4); if (veil > 0) { c.fillStyle = rgba(C.paper, 0.9 * veil); c.fillRect(0, 0, W, H); }

  // the real-run card (top left, clean paper round it)
  const ka = RA(t, 'card'); if (ka > 0) { const x0 = 150, dy = (1 - EASE.defer(ramp(t, 16.1, 16.45))) * 8;
    c.save(); c.font = `58px ${KH.FONTS.disp}`; const w1 = c.measureText('7 misses, 7 new checks').width; c.font = `26px ${KH.FONTS.sans}`; const w2 = c.measureText('Source · Limits & escapes register').width; c.restore();
    const wd = Math.max(w1, w2) + 60; c.save(); c.globalAlpha = ka; c.fillStyle = C.paper; c.strokeStyle = mix(C.paper, C.slate, 0.4); c.lineWidth = 1.2;
    c.beginPath(); c.roundRect(x0 - 30, 52 + dy, wd, 190, 8); c.fill(); c.stroke(); c.fillStyle = OLIVE; c.fillRect(x0 - 30, 52 + dy, 6, 190); c.restore();
    text(c, 'Real run', x0, 98 + dy, { f: 'mono', size: 24, col: SOFT, a: ka });
    text(c, '7 misses, 7 new checks', x0, 166 + dy, { f: 'disp', size: 58, col: INK, a: ka });
    text(c, 'Source · Limits & escapes register', x0, 214 + dy, { f: 'sans', size: 26, col: SOFT, a: ka }); }

  for (const r of READ) if (r.kind === 'caption') S.caption(c, t, r, { size: 40 });
  S.open(c, t - T0, { no: '02', title: 'Check it at the <i>gate</i>.', accent: ACC }, { out: 2.47 });
  S.lockup(c, t, T_LOCK, { no: '02', short: 'Gate' });
  c.restore();
}

function cues() { const oldStop = STOPS.find(s => s.id === 'old').t, endA = ANSWERS.find(a => a.id === 'end').t;
  return { bpm: BPM, dur: DUR, title: T0 + 0.25, veil: 4.0, unveil: T0 + 2.15,
    pass: PASSES.map(e => ({ t: e.t, g: e.g, id: e.id })), stop: STOPS.map(e => ({ t: e.t, g: e.g, id: e.id })), reopen: STOPS.map(e => e.open),
    answer: ANSWERS.map(a => ({ t: a.t, ok: a.ok, id: a.id })), flag: FLAGS.map(F => F.t), flagGone: 14.0,
    lift: [10.5, 20.45], pick: T_PICK, fold: T_FOLD.map(f => f[0]), grow: BUILT.slice(2), set: T_SET, push: 11.9, release: 14.5,
    spark: [oldStop, endA], card: RD('card').in, limit: ANSWERS.find(a => a.id === 'back').t,
    notThis: RD('notthis').in, belief: RD('belief').in, lockup: T_LOCK,
    tags: { consequence: [ANSWERS[0].t], focus: [ANSWERS[0].t, 6.9, 8.05, 10.04, T_SET[0], oldStop, ANSWERS.find(a => a.id === 'fix').t, endA], mech: [T_PICK[0], T_SET[0], oldStop], limit: [ANSWERS.find(a => a.id === 'back').t] } }; }
const CONTRAST = [['captions / card main (ink on paper chip)', INK, C.paper], ['title (ink on chart ground)', INK, BG], ['title accent on ground', ACC, BG],
  ['title accent on veiled ground (paper)', ACC, C.paper], ['eyebrow / lockup (slate on ground)', SOFT, BG], ['card label + source (slate on paper)', SOFT, C.paper]];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, DUR, W, H, fps: 60, wpos, heading, cam,
  shutter: t => (t > 10.5 && t < 12.4) || (t > 20.4 && t < 22.1) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
