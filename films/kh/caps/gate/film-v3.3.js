// CETI Capabilities 02 · gate v3.3 — "Every new mistake gets a check." Kinetic Hydrography 1.0.0 + series layer. 25-s series format.
// The work is a REPORT (a page riding the line) going to a customer. Each gate checks ONE KIND of mistake, named under its icon:
// spelling, totals. The miss is concrete: the report used the wrong font. It passes both gates honestly and the customer answers ✕.
// You (the whale) turn the miss flag into a new check: a font gate. The old wrong-font report now stops there.
// Honest limit: a new kind (pages in the wrong order) still slips through. drawFrame(ctx, t) is a pure function of t.
// Gate outcomes are computed: a report is checked by every gate that exists when it arrives and stops at the first gate of its
// own kind; otherwise it reaches the customer, who answers ✓ only for a good report.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, win, EASE, ramp, mix, rgba, text } = KH;
const W = 1920, H = 1080, BPM = 128, B = 60 / BPM, DUR = 30.62;
const INK = C.navy, SOFT = C.slate, OLIVE = WD.oliveGreen, RAW = WD.rawSienna, SLATE = WD.slateColor;
const BG = mix(C.paper, OLIVE, 0.06);                       // what SERIES.ground paints with tint: olive
let ACC = RAW; for (let k = 0; k <= 1; k += 0.05) { ACC = mix(RAW, INK, k); if (KH.contrast(ACC, BG) >= 4.6 && KH.contrast(ACC, C.paper) >= 4.6) break; }
const PASS = mix(OLIVE, INK, 0.12), FAIL = mix(RAW, INK, 0.08), TRACK = mix(C.paper, C.slate, 0.5), WALL = mix(C.paper, C.slate, 0.16), HATCH = mix(C.paper, C.slate, 0.34);
const PODCOL = mix(SLATE, C.paper, 0.3);

// ---------- the line, the gates (one kind each), the pod ----------
const GX = [-560, -220, 120, 460], KIND = ['spell', 'total', 'font', 'order'], LABEL = ['spelling', 'totals', 'font', 'page order'];
// each kind has its own tint: it lights that gate's opening and draws its icon (the font gate's icon shows the EXPECTED font)
const KT = [OLIVE, SLATE, mix(WD.ivoryBuff, C.driftwood, 0.3), C.mist], KM = [OLIVE, SLATE, INK, mix(C.mist, C.navy, 0.45)];
const HT = 200, A = 88, GW = 46, ICON_Y = -HT - 118, ICON_R = 46, LEN = 300, PW = 112, PH = 144, PODX = 863, MOUTH = 793, PODS = 140;
const T_PICK = [14.2, 24.7], T_FOLD = [[14.45, 14.9], [24.95, 25.35]], T_SET = [15.3, 25.75];
const BUILT = [-9, -9, T_SET[0] - 0.35, T_SET[1] - 0.35];     // posts rise for 0.35 s; the icon lands as they finish

// ---------- runs: kind decides colour/shape; t1 = time the head is at gate 1 ----------
const RUNS = [
  { id: 'e1', kind: 'font', v: 850, t1: 2.21, park: -622, write: [0.45, 1.8] },        // FELT: right spelling, right totals, WRONG FONT: passes both, customer ✕
  { id: 'w', kind: 'spell', v: 850, t1: 9.3 },        // KINDS: a spelling mistake stops at the spelling gate
  { id: 'gp', kind: 'total', v: 850, t1: 10.05 },        // spelling fine, totals wrong: stops at the totals gate
  { id: 'e2', kind: 'font', v: 1046, t1: 11.33 },       // the wrong font again, faster…
  { id: 'e3', kind: 'font', v: 1308, t1: 12.05 },       // …and faster: the pile of flags grows
  { id: 'old', kind: 'font', v: 850, t1: 15.68, hold: 0.7 },      // MOVE: the old wrong-font report, replayed, stops at the new font gate
  { id: 'fix', kind: 'ok', v: 915, t1: 16.68 },         // the fixed report passes all three: customer ✓
  { id: 'back', kind: 'order', v: 1046, t1: 22.31 },   // LIMIT: a new kind (pages in the wrong order) slips through: customer ✕
  { id: 'end', kind: 'ok', v: 837, t1: 26.48 },        // PAYOFF: four kinds of check, the same customer answers ✓
];
const built = (g, t) => t >= BUILT[g] + 0.35;
for (const r of RUNS) {
  r.cross = GX.map((x, g) => ({ g, t: r.t1 + (x - GX[0]) / r.v })).filter(e => built(e.g, e.t));
  const st = r.cross.find(e => KIND[e.g] === r.kind);
  if (st) { r.stop = st.g; r.face = GX[st.g] - GW - 4; r.tStop = r.t1 + (r.face - GX[0]) / r.v - 0.02; const hd = r.hold || 0.4; r.fade = [r.tStop + hd, r.tStop + hd + 0.3]; r.cross = r.cross.filter(e => e.g < st.g); }
  else r.arr = r.t1 + (MOUTH - GX[0]) / r.v;
}
const PASSES = RUNS.flatMap(r => r.cross.map(e => ({ ...e, id: r.id }))).sort((a, c) => a.t - c.t);
const STOPS = RUNS.filter(r => r.stop != null).map(r => ({ t: r.tStop, g: r.stop, id: r.id, open: r.fade[1] - 0.1 }));
const ANSWERS = RUNS.filter(r => r.arr != null).map(r => ({ t: r.arr, ok: r.kind === 'ok', id: r.id })).sort((a, c) => a.t - c.t);
// flags: one per ✕, falling onto a pile under the pod. Slot 2 is the top of the pile (the one the whale picks).
const FLAGS = ANSWERS.filter(a => !a.ok).map((a, i) => ({ t: a.t + 0.1, slot: [0, 1, 2, 2][i], id: a.id,
  pick: i === 2 ? 0 : i === 3 ? 1 : null, gone: i < 2 ? [16.6, 17.0] : null }));
const SLOTX = [500, 552, 600], FTOP = 92, FBASE = 200, FS = 1.8, LEAN = [-0.16, -0.06, 0];
const TC = s => ({ x: SLOTX[s] + 14 * FS, y: FBASE + (FTOP - FBASE + 12) * FS });   // centre of a flag's cloth (slot 2 stands upright)
function head(r, t) { let f = GX[0] + r.v * (t - r.t1); if (r.park != null) f = Math.max(f, r.park); if (r.stop == null) return f;
  const G = r.face, s = 50; return f < G - s ? f : G - s * Math.exp(-(f - (G - s)) / s); }
function runPt(r, u, h, cr) { const uu = Math.pow(u, 1 + 1.3 * cr), x = h - LEN * (1 - 0.32 * cr) * uu;
  const amp = 6, wl = 300;
  const env = Math.max(Math.pow(Math.sin(Math.PI * u), 0.7), cr * Math.pow(1 - u, 0.5) * 0.9);
  return [x, amp * env * Math.sin(u * LEN * 2 * Math.PI / wl + 0.6)]; }

// ---------- the whale: Hermite through keys (zero tangents = it settles at each key) ----------
const WS = 0.8, REACH = 118 * WS + 48;                      // whale scale; nose-to-carried-item distance
const P0 = [-50, -440], P1 = [300, -440], P2 = [640, -440], PICK = [TC(2).x - REACH, TC(2).y - 4];
const K = [[0, ...P0], [13.45, ...P0], [T_PICK[0], ...PICK], [14.5, ...PICK], [T_SET[0], GX[2] + REACH, ICON_Y - 4], [15.75, ...P1],
  [24.15, ...P1], [T_PICK[1], ...PICK], [25.0, ...PICK], [T_SET[1], GX[3] + REACH, ICON_Y - 4], [26.2, ...P2], [DUR + 1, ...P2]];
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
const TURNS = [[14.22, -1], [23.9, 1], [24.72, -1], [26.25, 1]];
function facing(t) { let f = 1; for (const [a, to] of TURNS) f = lerp(f, to, ramp(t, a, a + 0.25, EASE.warm)); return f; }
// what the whale carries: the picked flag, folding into the new icon, held at its nose
function nose(t) { const p = wworld(t), a = heading(t), f = facing(t), rx = REACH * Math.cos(a) - 4 * Math.sin(a), ry = REACH * Math.sin(a) + 4 * Math.cos(a); return { x: p.x + f * rx, y: p.y + ry, f }; }

// ---------- camera: close on the consequence, pull back under the title, one push-in on the build, release ----------
function cam(t) {
  const pull = ramp(t, 5.5, 7.8, EASE.rest), push = ramp(t, 14.85, 15.75, EASE.warm), rel = ramp(t, 17.4, 18.1, EASE.warm), end = ramp(t, 26.5, DUR, EASE.rest);
  let z = lerp(1.08, 1.0, pull), x = lerp(100, 180, pull); z = lerp(z, 1.3, push); x = lerp(x, 160, push); z = lerp(z, 1.0, rel); x = lerp(x, 180, rel);
  return { x, y: 0, z: z + 0.03 * end, ax: 960, ay: 660 }; }
const wpos = t => wworld(t);

// ---------- text ----------
const T0 = 5.43, T_LOCK = 28.5;
const cap = (id, inn, out, text) => ({ id, kind: 'caption', in: inn, out, fi: 0.2, fo: 0.15, text });
const lab = (id, inn, out, text) => ({ id, kind: 'label', in: inn, out, fi: 0.3, fo: 0.3, text });
const READ = [
  cap('felt1', 0.25, 2.11, 'Your AI helper wrote a report.'),
  lab('you', 0.25, 5.63, 'you'), lab('customer', 0.25, T_LOCK, 'customer'),
  lab('l0', 0.25, T_LOCK, LABEL[0]), lab('l1', 0.25, T_LOCK, LABEL[1]), lab('l2', T_SET[0], T_LOCK, LABEL[2]), lab('l3', T_SET[1], T_LOCK, LABEL[3]),
  cap('felt2', 2.16, 3.72, 'It passed every check.'),
  cap('felt3', 3.77, 5.63, 'The customer still found a mistake.'),
  { id: 'eyebrow', kind: 'label', in: T0 + 0.25, out: T0 + 3.6, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 02' },
  { id: 'title', kind: 'title', in: T0 + 0.25, out: T0 + 3.6, fi: 0.4, fo: 0.45, text: 'Every new mistake gets a check.' },
  cap('kinds', 9.08, 11.24, 'Each check looks for one kind of mistake.'),
  cap('esc', 11.29, 13.85, 'Nothing checks the font.'),
  cap('fold', 13.9, 15.91, 'Turn the mistake into a new check.'),
  cap('old', 15.96, 18.12, 'Now the wrong font stops here.'),
  { id: 'card', kind: 'card', card: true, in: 18.55, out: 22.15, fi: 0.3, fo: 0.3, text: 'True story · 7 mistakes, 7 new checks', src: 'https://app.notion.com/p/3f2d50cfaf9381a88b04f3837efcac6a' },
  { id: 'src', kind: 'label', in: 18.55, out: 22.15, fi: 0.3, fo: 0.3, text: 'Source: our own list of mistakes' },
  cap('limit', 22.2, 24.36, 'A new kind of mistake still slips through.'),
  cap('notthis', 24.41, 26.42, 'Passing means: no mistakes we know of.'),
  cap('belief', 26.47, T_LOCK, 'Every new mistake becomes a new check.'),
  { id: 'lockup', kind: 'label', in: T_LOCK, out: DUR, fi: 0.45, fo: 0, text: 'CETI · Capabilities · 02 · Check' },
];
const INTENT = { problem: 'Your AI helper wrote a report; it passed every check, yet the customer found a mistake: nothing checked the font.',
  move: 'Each check looks for one kind of mistake; you turn every new mistake into a new check (a font check).',
  belief: 'Every new mistake becomes a new check. Passing means no mistakes we know of, not quality.' };
// 'report' trips the expert list (it matches repo*); the report page is on screen from 0 s, before the word (0.25 s)
const TERMS = [{ term: 'report', pictured_at: 0 }];
const RD = id => READ.find(r => r.id === id), RA = (t, id) => { const r = RD(id); return win(t, r.in, r.out, r.fi, r.fo); };

// ---------- icons: a paper disc on the lintel with one mark for the kind it checks ----------
function iconMark(c, kind, x, y, r, a, lw) {
  c.save(); c.globalAlpha *= a; c.strokeStyle = KM[KIND.indexOf(kind)]; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath();
  if (kind === 'spell') { c.restore(); text(c, 'abc', x, y + 0.12 * r, { f: 'sans', size: Math.round(r * 0.72), col: INK, a, align: 'center' });
    c.save(); c.globalAlpha *= a; c.strokeStyle = FAIL; c.lineWidth = lw * 0.8; c.lineCap = 'round'; c.beginPath();       // a red wavy underline
    for (let k = 0; k <= 24; k++) { const u = k / 24, px = x + (u - 0.5) * 1.15 * r, py = y + 0.36 * r + 0.1 * r * Math.sin(u * Math.PI * 6); k ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
  else if (kind === 'total') { c.restore(); text(c, '1+2', x, y + 0.28 * r, { f: 'sans', size: Math.round(r * 0.82), col: INK, a, align: 'center' }); return; }
  else if (kind === 'font') { c.restore(); text(c, 'Aa', x, y + 0.38 * r, { f: 'sans', size: Math.round(r * 1.1), col: INK, a, align: 'center' }); return; }   // the EXPECTED font
  else if (kind === 'order') { c.restore(); text(c, '1 2 3', x, y + 0.24 * r, { f: 'sans', size: Math.round(r * 0.66), col: INK, a, align: 'center' }); return; }
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
  c.fillStyle = mix(RAW, C.paper, m); c.fill(); c.strokeStyle = mix(FAIL, INK, m); c.lineWidth = lerp(3, 5, m); c.lineJoin = 'round'; c.stroke(); c.restore();
  if (m > 0.4) iconMark(c, kind, x, y, r, (m - 0.4) / 0.6, 5); }

// a report page: paper, folded corner, a heading 'Aa' and three text lines; its mistake is drawn on it in the alarm colour
function drawPage(c, kind, x, y, s, rot, a, wr = 1) {
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(rot); const w = PW * s, h = PH * s, k = 18 * s;
  c.fillStyle = C.paper; c.strokeStyle = INK; c.lineWidth = Math.max(2.5, 3 * s); c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2 - k, -h / 2); c.lineTo(w / 2, -h / 2 + k); c.lineTo(w / 2, h / 2); c.lineTo(-w / 2, h / 2); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(w / 2 - k, -h / 2); c.lineTo(w / 2 - k, -h / 2 + k); c.lineTo(w / 2, -h / 2 + k); c.stroke();
  const bad = kind === 'font';
  text(c, 'Aa', -w / 2 + 12 * s, -h / 2 + 54 * s, { f: bad ? 'disp' : 'sans', size: Math.round((bad ? 58 : 46) * s), col: bad ? ACC : INK, a: clamp(wr * 4) });
  c.strokeStyle = SOFT; c.lineWidth = Math.max(2, 3.5 * s); c.beginPath();
  [[0.1, 0.7], [0.26, 0.62], [0.42, 0.5]].forEach(([yy, l], i) => { const q = clamp(wr * 4 - 1 - i); if (q <= 0) return; c.moveTo(-w / 2 + 10 * s, yy * h); c.lineTo(-w / 2 + 10 * s + q * l * (w - 20 * s), yy * h); }); c.stroke();
  c.strokeStyle = FAIL; c.lineWidth = Math.max(2.5, 4 * s); c.beginPath();
  if (kind === 'spell') { for (let i = 0; i <= 16; i++) { const u = i / 16, px = -w / 2 + 10 * s + u * 0.7 * (w - 20 * s), py = 0.1 * h + 10 * s + 4 * s * Math.sin(u * Math.PI * 6); i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
  if (kind === 'total') { const bx = w / 2 - 26 * s, by = 0.4 * h; c.moveTo(bx - 12 * s, by - 5 * s); c.lineTo(bx + 12 * s, by - 5 * s); c.moveTo(bx - 12 * s, by + 5 * s); c.lineTo(bx + 12 * s, by + 5 * s); c.moveTo(bx + 7 * s, by - 13 * s); c.lineTo(bx - 7 * s, by + 13 * s); c.stroke(); }
  c.restore(); }

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
    const X0 = X(gx), gA = ramp(t, BUILT[g], BUILT[g] + 0.35, EASE.glaser), grow = 1; if (gA <= 0) return; c.globalAlpha = gA;
    const top = Y(-HT * grow), bot = Y(HT * grow), sA = Math.min(A, HT * grow), st = Y(-sA), sb = Y(sA), flash = flashOf(g), close = closeOf(g);
    c.fillStyle = WALL; c.fillRect(X0 - hw, top, 2 * hw, st - top); c.fillRect(X0 - hw, sb, 2 * hw, bot - sb);
    c.save(); c.beginPath(); c.rect(X0 - hw, top, 2 * hw, st - top); c.rect(X0 - hw, sb, 2 * hw, bot - sb); c.clip(); c.strokeStyle = HATCH; c.lineWidth = 1.5; c.beginPath();
    for (let y = top - 2 * hw; y < bot + 2 * hw; y += 13) { c.moveTo(X0 - hw, y); c.lineTo(X0 + hw, y - 2 * hw); } c.stroke(); c.restore();
    c.fillStyle = mix(C.paper, KT[g], 0.26); c.fillRect(X0 - hw, st, 2 * hw, sb - st);
    if (flash > 0.02) { c.fillStyle = rgba(KT[g], 0.38 * flash); c.fillRect(X0 - hw, st, 2 * hw, sb - st); }
    if (close > 0.02) { c.fillStyle = rgba(RAW, 0.22 * close); c.fillRect(X0 - hw, st, 2 * hw, sb - st); }
    c.globalAlpha = 1;
  });

  // runs
  for (const r of RUNS) {
    const h = head(r, t); if (h < cm.x - 1100 / z || h - LEN > MOUTH + 4) continue;
    const a = r.fade ? 1 - ramp(t, r.fade[0], r.fade[1], EASE.rest) : 1; if (a <= 0) continue;
    let glow = 0; for (const e of r.cross) if (t >= e.t) glow = Math.max(glow, Math.exp(-(t - e.t) * 1.6));
    const cr = r.tStop != null ? ramp(t, r.tStop, r.tStop + 0.28, EASE.glaser) : 0;
    const col = mix(mix(SLATE, PASS, glow * 0.6), FAIL, cr * 0.5), lw = Math.max(8, 9 * z);
    const pts = []; for (let k = 0; k <= 90; k++) { const [x, y] = runPt(r, k / 90, h, cr); pts.push({ x, y, u: k / 90 }); }
    const vis = p => p.x <= MOUTH - PW;
    const path = () => { c.beginPath(); let pen = false; for (const p of pts) { if (!vis(p)) { pen = false; continue; } pen ? c.lineTo(X(p.x), Y(p.y)) : c.moveTo(X(p.x), Y(p.y)); pen = true; } };
    if (glow > 0.02) { c.strokeStyle = rgba(OLIVE, 0.32 * glow * a); c.lineWidth = lw * 3.4; path(); c.stroke(); }
    c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = lw; path(); c.stroke();
    if (r.kind === 'order') { c.lineWidth = lw * 0.75; c.beginPath();       // chevrons pointing the wrong way
      for (const u of [0.35, 0.6, 0.85]) { const [x, y] = runPt(r, u, h, 0); if (x + 8 > MOUTH - PW) continue; const s = 20 * z;
        c.moveTo(X(x) + s, Y(y) - s); c.lineTo(X(x) - s * 0.6, Y(y)); c.lineTo(X(x) + s, Y(y) + s); } c.stroke(); }
    c.globalAlpha = 1;
    // the report itself rides at the front; it shrinks into the customer's mouth
    const pc = h - PW / 2 - 2, sink = clamp((pc - (MOUTH - PW * 0.2)) / (PW * 0.8));
    if (sink < 1) { if (glow > 0.02) { c.fillStyle = rgba(OLIVE, 0.22 * glow * a); c.beginPath(); c.roundRect(X(pc) - (PW / 2 + 10) * z, Y(0) - (PH / 2 + 10) * z, (PW + 20) * z, (PH + 20) * z, 10 * z); c.fill(); }
      drawPage(c, r.kind, X(pc - sink * 30), Y(0), z * (1 - 0.6 * sink), (r.kind === 'order' ? Math.PI : 0) - 0.18 * cr, a * (1 - sink), r.write ? ramp(t, r.write[0], r.write[1], EASE.warm) : 1); }
  }

  // gate fronts: posts, lintel, foot, the closing bar, and the kind icon on the lintel
  GX.forEach((gx, g) => {
    const X0 = X(gx), gA = ramp(t, BUILT[g], BUILT[g] + 0.35, EASE.glaser), grow = 1; if (gA <= 0) return; c.globalAlpha = gA;
    const flash = flashOf(g), close = closeOf(g), top = Y(-HT * grow), bot = Y(HT * grow), sA = Math.min(A, HT * grow), st = Y(-sA), sb = Y(sA), lw = Math.max(8, 9 * Math.min(z, 1.2));
    const col = mix(mix(INK, PASS, flash * 0.8), FAIL, close * 0.6);
    if (flash > 0.02) { c.strokeStyle = rgba(KT[g], 0.25 * flash); c.lineWidth = lw * 4; c.strokeRect(X0 - hw, top, 2 * hw, bot - top); }
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
      c.fillStyle = C.paper; c.strokeStyle = ring; c.lineWidth = Math.max(5, 5 * z); c.beginPath(); c.arc(ix, iy, ir, 0, Math.PI * 2); c.fill(); c.stroke();
      iconMark(c, KIND[g], ix, iy, ir, 1, Math.max(5, 5.5 * z));
    }
    { const la = RA(t, 'l' + g); if (la > 0) S.chip(c, LABEL[g], ix, Y(-HT - 22), { f: 'sans', size: 34, col: INK, a: la, align: 'center', pad: 10, border: mix(C.paper, KT[g], 0.6) }); }
    // a pass leaves a small olive tick beside the icon
    let tk = 0; for (const e of PASSES) if (e.g === g && t >= e.t) tk = Math.max(tk, win(t, e.t, e.t + 0.95, 0.08, 0.4));
    if (tk > 0.02) { const s = 16 * z, tx = ix + ir + 26 * z, ty = iy; c.strokeStyle = rgba(PASS, tk); c.lineWidth = 5 * z; c.beginPath(); c.moveTo(tx - s, ty); c.lineTo(tx - s * 0.2, ty + s * 0.8); c.lineTo(tx + s * 1.1, ty - s); c.stroke(); }
    c.globalAlpha = 1;
  });

  // the pod: receives the work; answers ✓ or ✕ above its head
  { let shake = 0, glow = 0, cur = null; for (const e of ANSWERS) if (t >= e.t) { cur = e; const d = t - e.t; if (!e.ok) shake = 6 * Math.sin(d * 42) * Math.exp(-d * 7); else glow = win(t, e.t, e.t + 1.2, 0.1, 0.6); }
    const px = X(PODX) + shake * z, py = Y(0);
    c.save(); c.translate(px, py); c.scale(-1, 1); KH.drawPod(c, 0, 0, 0, PODS * z, PODCOL, { glow: glow * 0.8 }); c.restore();
    { const la = RA(t, 'customer'); if (la > 0) S.chip(c, 'customer', X(PODX), Y(108), { f: 'sans', size: 34, col: INK, a: la, align: 'center', pad: 10, border: mix(C.paper, C.slate, 0.4) }); }
    if (cur) { const hold = cur.ok && cur.t > 24 ? DUR + 1 : cur.t + 1.7, a = win(t, cur.t, hold, 0.08, 0.3), pop = 1 + 0.18 * Math.exp(-(t - cur.t) * 8);
      if (a > 0) { const cx = X(PODX), cy = Y(-160), R = 46 * z * pop, m = 19 * z * pop;
        c.save(); c.globalAlpha = a; c.fillStyle = C.paper; c.strokeStyle = cur.ok ? PASS : FAIL; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill(); c.stroke();
        c.lineWidth = 8 * z; c.beginPath();
        if (cur.ok) { c.moveTo(cx - m, cy + 1); c.lineTo(cx - m * 0.25, cy + m * 0.8); c.lineTo(cx + m * 1.05, cy - m * 0.9); }
        else { c.moveTo(cx - m, cy - m); c.lineTo(cx + m, cy + m); c.moveTo(cx + m, cy - m); c.lineTo(cx - m, cy + m); }
        c.stroke(); c.restore(); } } }

  // the flags: one per ✕, falling onto a pile under the pod
  for (const F of FLAGS) { if (t < F.t) continue; if (F.pick != null && t >= T_PICK[F.pick]) continue;
    const a = F.gone ? 1 - ramp(t, F.gone[0], F.gone[1], EASE.rest) : 1; if (a <= 0) continue;
    const u = ramp(t, F.t, F.t + 0.38, EASE.glaser), fx = lerp(PODX - 40, SLOTX[F.slot], u), dy = lerp(-260, 0, u), lean = LEAN[F.slot];
    c.save(); c.globalAlpha = a * clamp((t - F.t) / 0.08); c.translate(X(fx), Y(FBASE + dy)); c.rotate(lean); c.scale(z * FS, z * FS);
    c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, FTOP - FBASE); c.stroke();
    c.fillStyle = RAW; c.strokeStyle = FAIL; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, FTOP - FBASE); c.lineTo(36, FTOP - FBASE + 12); c.lineTo(0, FTOP - FBASE + 24); c.closePath(); c.fill(); c.stroke(); c.restore(); }

  // the little whale (and what it carries)
  { const p = wworld(t), ang = heading(t), v = wvel(t), sp = Math.hypot(v.x, v.y), moving = clamp(sp / 400), f = facing(t);
    let blink = 0; for (const k of [1.6, 7.0, 10.9, 16.9, 19.6, 21.4, 23.0, 27.6]) blink = Math.max(blink, 1 - Math.abs(t - k) / 0.07);
    let squash = 0; for (const k of [...T_PICK, ...T_SET]) { const d = t - k; if (d >= 0 && d < 0.32) squash = Math.max(squash, 0.13 * (1 - EASE.glaser(d / 0.32))); }
    const focus = Math.max(win(t, 9.1, 10.6, 0.3, 0.3) * 0.6, win(t, T_PICK[0] - 0.1, T_SET[0] + 0.1, 0.15, 0.15), win(t, T_PICK[1] - 0.1, T_SET[1] + 0.1, 0.15, 0.15), win(t, 15.7, 16.4, 0.2, 0.1) * 0.7);
    const eye = 1 + 0.35 * win(t, 3.8, 5.3, 0.06, 0.4) + 0.3 * win(t, 12.62, 13.5, 0.06, 0.3) + 0.3 * win(t, 23.6, 24.2, 0.06, 0.3);
    const oldStop = STOPS.find(s => s.id === 'old').t, fixA = ANSWERS.find(a => a.id === 'fix').t, endA = ANSWERS.find(a => a.id === 'end').t;
    const spark = Math.max(win(t, oldStop, oldStop + 1.0, 0.12, 0.4), win(t, endA, endA + 1.3, 0.12, 0.5));
    const delight = (t > oldStop + 0.05 && t < oldStop + 0.9) || (t > fixA && t < fixA + 1.1) || t > endA + 0.05 ? 1 : 0;
    c.save(); c.translate(X(p.x), Y(p.y)); c.scale(f, 1);
    KH.drawWhale(c, { x: 0, y: 0, ang, scale: WS * z, L: 1, tail: Math.sin(t * (moving > 0.3 ? 11 : 3)) * lerp(0.12, 0.34, moving), fin: Math.sin(t * 6 + 1.3) * lerp(0.15, 0.3, moving),
      blink, squash, focus: delight ? 0 : focus, eye, spark, sparkColor: OLIVE, delight, blush: 0.6, mouth: delight ? 0.4 : 0.35 * win(t, 3.85, 5.0, 0.06, 0.3), sw: 3.2 });
    c.restore();
    { const la = RA(t, 'you'); if (la > 0) S.chip(c, 'you', X(p.x + 130), Y(p.y + 12), { f: 'sans', size: 34, col: INK, a: la, pad: 10, border: mix(C.paper, C.slate, 0.4) }); }
    for (let k = 0; k < 2; k++) { if (t < T_PICK[k] || t >= T_SET[k]) continue;
      const n = nose(t), m = ramp(t, T_FOLD[k][0], T_FOLD[k][1], EASE.warm), r = lerp(1, ICON_R, m);
      flagToIcon(c, KIND[2 + k], X(n.x), Y(n.y), r * z, m, n.f, 1); } }

  // the pointer for 'here': an ink arrow at the font gate's closed opening
  { const pa = win(t, 16.15, 17.4, 0.3, 0.3); if (pa > 0) { const gx = GX[2], x1 = X(gx + GW + 150), y1 = Y(150), x2 = X(gx + GW + 18), y2 = Y(30), an = Math.atan2(y2 - y1, x2 - x1), hl = 22 * z;
    c.save(); c.globalAlpha = pa; c.strokeStyle = INK; c.lineWidth = 6 * z; c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(X(gx + GW + 150), Y(40), x2, y2);
    const an2 = Math.atan2(y2 - Y(40), x2 - X(gx + GW + 150)); c.moveTo(x2 - hl * Math.cos(an2 - 0.5), y2 - hl * Math.sin(an2 - 0.5)); c.lineTo(x2, y2); c.lineTo(x2 - hl * Math.cos(an2 + 0.5), y2 - hl * Math.sin(an2 + 0.5)); c.stroke(); c.restore(); } }

  // the title hinge: the scene goes still under a paper veil, the title names what we just watched
  const veil = win(t, 5.5, T0 + 3.67, 0.35, 0.4); if (veil > 0) { c.fillStyle = rgba(C.paper, 0.9 * veil); c.fillRect(0, 0, W, H); }

  // the real-run card (top left, clean paper round it)
  const ka = RA(t, 'card'); if (ka > 0) { const x0 = 150, dy = (1 - EASE.defer(ramp(t, 18.55, 18.9))) * 8;
    c.save(); c.font = `64px ${KH.FONTS.disp}`; const w1 = c.measureText('7 mistakes, 7 new checks').width; c.font = `34px ${KH.FONTS.sans}`; const w2 = c.measureText('Source: our own list of mistakes').width; c.restore();
    const wd = Math.max(w1, w2) + 60; c.save(); c.globalAlpha = ka; c.fillStyle = C.paper; c.strokeStyle = mix(C.paper, C.slate, 0.4); c.lineWidth = 1.2;
    c.beginPath(); c.roundRect(x0 - 30, 36 + dy, wd, 230, 8); c.fill(); c.stroke(); c.fillStyle = OLIVE; c.fillRect(x0 - 30, 36 + dy, 6, 230); c.restore();
    text(c, 'True story', x0, 90 + dy, { f: 'mono', size: 34, col: SOFT, a: ka });
    text(c, '7 mistakes, 7 new checks', x0, 170 + dy, { f: 'disp', size: 64, col: INK, a: ka });
    text(c, 'Source: our own list of mistakes', x0, 232 + dy, { f: 'sans', size: 34, col: SOFT, a: ka }); }

  for (const r of READ) if (r.kind === 'caption') S.caption(c, t, r, { size: 40 });
  S.open(c, t - T0, { no: '02', title: 'Every new mistake gets a <i>check</i>.', accent: ACC }, { out: 3.6 });
  S.lockup(c, t, T_LOCK, { no: '02', short: 'Check' });
  c.restore();
}

function cues() { const oldStop = STOPS.find(s => s.id === 'old').t, endA = ANSWERS.find(a => a.id === 'end').t;
  return { bpm: BPM, dur: DUR, title: T0 + 0.25, veil: 4.0, unveil: T0 + 2.15,
    pass: PASSES.map(e => ({ t: e.t, g: e.g, id: e.id })), stop: STOPS.map(e => ({ t: e.t, g: e.g, id: e.id })), reopen: STOPS.map(e => e.open),
    answer: ANSWERS.map(a => ({ t: a.t, ok: a.ok, id: a.id })), flag: FLAGS.map(F => F.t), flagGone: 16.6,
    lift: [13.45, 24.15], pick: T_PICK, fold: T_FOLD.map(f => f[0]), grow: BUILT.slice(2), set: T_SET, push: 14.85, release: 17.4,
    spark: [oldStop, endA], card: RD('card').in, limit: ANSWERS.find(a => a.id === 'back').t,
    notThis: RD('notthis').in, belief: RD('belief').in, lockup: T_LOCK,
    tags: { consequence: [ANSWERS[0].t], focus: [ANSWERS[0].t, STOPS[0].t, STOPS[1].t, ANSWERS[1].t, T_SET[0], oldStop, ANSWERS.find(a => a.id === 'fix').t, endA], mech: [T_PICK[0], T_SET[0], oldStop], limit: [ANSWERS.find(a => a.id === 'back').t] } }; }
const CONTRAST = [['gate / actor labels (ink on paper chip)', INK, C.paper], ['wrong-font heading on the report (accent on paper)', ACC, C.paper], ['captions / card main (ink on paper chip)', INK, C.paper], ['title (ink on chart ground)', INK, BG], ['title accent on ground', ACC, BG],
  ['title accent on veiled ground (paper)', ACC, C.paper], ['eyebrow / lockup (slate on ground)', SOFT, BG], ['card label + source (slate on paper)', SOFT, C.paper]];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, INTENT, TERMS, DUR, W, H, fps: 60, wpos, heading, cam,
  shutter: t => (t > 13.4 && t < 15.35) || (t > 24.1 && t < 25.8) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
