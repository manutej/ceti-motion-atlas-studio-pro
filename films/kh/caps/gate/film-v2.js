// CETI Capabilities 02 · gate — "Check it at the gate." Kinetic Hydrography 1.0.0 + series layer.
// A gate stands on the line: two posts under a lintel, walled except for one slot — the slot is the spec (tolerance band).
// Runs of the line slide along the track: a run that fits threads the slot and glows; one that does not hits the closed bar
// and crumples (fail closed). One subtle wobble escapes, is flagged MISSED downstream, the whale catches it, and it becomes
// a new gate with a narrower slot. Pull back: a row of gates, every miss a rule. drawFrame(ctx, t) is a pure function of t.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, win, EASE, ramp, mix, rgba, text } = KH;
const W = 1920, H = 1080, BPM = 128, B = 60 / BPM, b = n => n * B, DUR = 26.05;
const INK = C.navy, SOFT = C.slate, OLIVE = WD.oliveGreen, RAW = WD.rawSienna;
const BG = mix(C.paper, OLIVE, 0.06);                       // what SERIES.ground paints with tint: olive
let ACC = RAW; for (let k = 0; k <= 1; k += 0.05) { ACC = mix(RAW, INK, k); if (KH.contrast(ACC, BG) >= 4.6 && KH.contrast(ACC, C.paper) >= 4.6) break; }
const PASS = mix(OLIVE, INK, 0.12), FAIL = mix(RAW, INK, 0.08), TRACK = mix(C.paper, C.slate, 0.5), WALL = mix(C.paper, C.slate, 0.16), HATCH = mix(C.paper, C.slate, 0.34);

// ---------- gates: 640 apart; 06 is built in the story, 07 is the escape turned into a rule. A = half-height of the slot ----------
const SP = 640, HT = 160, GW = 34, LEN = 320, V = SP / B;    // V: runs cross one gate per beat
const GATES = [128, 118, 108, 100, 96, 62, 32].map((A, i) => ({ i, no: String(i + 1).padStart(2, '0'), x: (i - 5) * SP, A }));
const T_BUILD7 = 15.98, T_HOP = 15.4, T_NUDGE = 16.75, T_STOP7 = 16.9, T_RULE7 = 16.95, T_MISS = 13.93, T_TAKE = 14.2, T_CATCH = 14.8;
const BUILT = [-9, -9, -9, -9, -9, b(10), T_BUILD7], SCAN = [0, 0, 0, 0, 0, b(14), T_BUILD7 + 0.3];
const CLOSE = [{ g: 5, t: b(23), open: 12.45 }, { g: 6, t: T_STOP7, open: 17.55 }];
const CHIP_AT = [18.6, 18.65, 18.7, 18.75, 18.8, 11.0, T_RULE7];

// ---------- runs: tg = time the head is at x = 0 (gate 06); amp/wl = wobble; only gates in `chk` check this run ----------
const R = (o) => ({ v: V, amp: 10, wl: 180, ph: 0.4, chk: [], ...o });
const RUNS = [
  R({ id: 'a', tg: b(6) }), R({ id: 'b', tg: b(7), ph: 2.1 }), R({ id: 'old0', tg: b(8.5), amp: 90, wl: 96, ph: 1.0 }),   // act 1: no gate, all ship
  R({ id: 'r1', tg: b(16), chk: [5] }), R({ id: 'r2', tg: b(19), chk: [5], ph: 1.7 }), R({ id: 'r3', tg: b(21), chk: [5], ph: 3.0 }),
  R({ id: 'old', tg: b(23), amp: 90, wl: 96, ph: 1.0, stop: 5, fade: [11.95, 12.4], chip: 'OLD COPY' }),                    // fail-first: the act-1 copy returns
  R({ id: 'esc', tg: b(28.5), v: 980, amp: 44, wl: 116, ph: 0.6, chk: [5], catchT: T_CATCH, stop: 6, fade: [17.35, 17.75] }),
  R({ id: 'g', tg: b(38), chk: [5, 6], ph: 2.5 }),
  ...[46, 47.5, 49].map((n, k) => R({ id: 'p' + k, tg: b(n), chk: [0, 1, 2, 3, 4, 5, 6], ph: k * 1.3 })),     // payoff: one gate per beat
];
const ESC = RUNS.find(r => r.id === 'esc');
const escFree = t => { const d = t - ESC.tg; return d < 0 ? ESC.v * d : 560 - 560 * Math.exp(-1.75 * d); };   // 980 px/s at the gate, drifting to rest downstream
function head(r, t) {
  if (r === ESC) { const h0 = escFree(Math.min(t, T_NUDGE)); return t <= T_NUDGE ? h0 : lerp(h0, GATES[6].x - GW - 4, ramp(t, T_NUDGE, T_STOP7, EASE.collect)); }
  const f = r.v * (t - r.tg);
  if (r.stop != null) { const G = GATES[r.stop].x - GW - 4, s = 50; return f < G - s ? f : G - s * Math.exp(-(f - (G - s)) / s); }
  return f; }
const stopT = r => r.stop == null ? null : CLOSE.find(e => e.g === r.stop).t;
const crossings = r => r.chk.map(g => ({ g, t: r.tg + GATES[g].x / r.v })).filter(e => (r.catchT == null || e.t < r.catchT) && e.t > SCAN[e.g] && (r.stop == null || e.g < r.stop));
const PASSES = RUNS.flatMap(r => crossings(r).map(e => ({ ...e, id: r.id }))).sort((a, c) => a.t - c.t);
// run shape; crumple (0..1) bunches the front of a stopped run against the bar
function runPt(r, u, h, cr) { const uu = Math.pow(u, 1 + 1.3 * cr), x = h - LEN * (1 - 0.32 * cr) * uu;
  const env = Math.max(Math.pow(Math.sin(Math.PI * u), 0.7), cr * Math.pow(1 - u, 0.5) * 0.9);
  return [x, r.amp * env * Math.sin(u * LEN * 2 * Math.PI / r.wl + r.ph)]; }

// ---------- the whale: Hermite through keys (optional explicit velocity); rides the escaped run while holding it ----------
const K1 = [[1.9, -1150, -250], [3.2, -640, -272], [4.25, -120, -256], [b(10), 0, -196, 0, 0], [T_TAKE, 0, -196, 0, 0], [14.5, 170, -252], [T_CATCH, 355, -86, 79, 0]];
const K2 = [[T_HOP, 0, -86, 0, 0], [15.72, 515, -268], [T_BUILD7, 640, -196, 0, 0], [DUR + 1, 640, -196, 0, 0]];
function herm(P, t) { const n = P.length; if (t <= P[0][0]) return { x: P[0][1], y: P[0][2] }; if (t >= P[n - 1][0]) return { x: P[n - 1][1], y: P[n - 1][2] };
  let i = 0; while (P[i + 1][0] < t) i++; const p1 = P[i], p2 = P[i + 1], h = p2[0] - p1[0], u = (t - p1[0]) / h;
  const tan = k => { const p = P[k]; if (p.length > 3) return [p[3], p[4]]; const a = P[Math.max(0, k - 1)], c = P[Math.min(n - 1, k + 1)]; return [(c[1] - a[1]) / (c[0] - a[0]), (c[2] - a[2]) / (c[0] - a[0])]; };
  const m1 = tan(i), m2 = tan(i + 1), u2 = u * u, u3 = u2 * u, A = 2 * u3 - 3 * u2 + 1, Bb = u3 - 2 * u2 + u, Cc = -2 * u3 + 3 * u2, D = u3 - u2;
  return { x: A * p1[1] + Bb * h * m1[0] + Cc * p2[1] + D * h * m2[0], y: A * p1[2] + Bb * h * m1[1] + Cc * p2[2] + D * h * m2[1] }; }
const STOMPS = [b(14), 11.0];
function wbase(t) { if (t < T_CATCH) return herm(K1, t); if (t < T_HOP) return { x: head(ESC, t) - LEN / 2, y: -86 }; return herm(K2, t); }
{ const h = head(ESC, T_HOP), h2 = head(ESC, T_HOP + 0.01); K2[0][1] = h - LEN / 2; K2[0][3] = (h2 - h) * 100; }   // hop starts exactly where the ride ends
function wworld(t) { const p = wbase(t), q = wbase(t + 0.01), sp = Math.hypot(q.x - p.x, q.y - p.y) * 100, still = 1 - clamp(sp / 150);
  let dip = 0; for (const s of STOMPS) { const d = t - s; if (d > 0 && d < 0.35) dip = Math.max(dip, 8 * Math.sin(Math.PI * d / 0.35)); }
  return { x: p.x, y: p.y + (Math.sin(t * 2.4) * 2.5 + dip) * still }; }
const wvel = t => { const a = wworld(t - 1 / 240), c = wworld(t + 1 / 240); return { x: (c.x - a.x) * 120, y: (c.y - a.y) * 120 }; };
function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
    a += (sp < 40 ? 0 : clamp(Math.atan2(v.y, Math.abs(v.x)), -0.8, 0.8) * clamp(sp / 300)) * w; s += w; } return a / s; }

// ---------- camera: gentle push, push on the stop, pan on the chase, push in on the new rule, pull back to the row ----------
const T_PULL = b(39), T_PULLEND = 19.9;
function cam(t) {
  const fp = win(t, 10.5, 12.5, 0.6, 0.6), pan = ramp(t, 14.0, 15.0, EASE.warm), push = ramp(t, 15.4, 16.5, EASE.warm), k = ramp(t, T_PULL, T_PULLEND, EASE.rest), d = ramp(t, T_PULLEND, DUR, EASE.rest);
  const zs = lerp(1.38, 1.45, ramp(t, 0, b(10), EASE.warm)) + 0.1 * fp + 0.15 * push, xs = 150 - 50 * fp + 180 * pan + 140 * push;
  // the pull-back is anchored on gate 07 (where the whale sits), so the whale stays in frame while the row opens out
  const zk = lerp(zs, 0.40, k), sk = lerp((640 - xs) * zs, (640 + 1280) * 0.40, k);
  return { x: 640 - sk / zk + 40 * d, y: 0, z: zk + 0.025 * d, ax: 960, ay: lerp(640, 540, k) };
}
const zv = z => Math.max(z, 0.85);   // vertical size floor so gates and whale stay readable in the pull-back
const wpos = t => { const p = wworld(t), c = cam(t); return { x: p.x, y: p.y * zv(c.z) / c.z }; };   // reports the drawn screen position

// ---------- text ----------
const STN = [['Spec', 'what must be true', 10], ['Check', 'a machine, not opinion', 14], ['Gate', 'pass, or stop', 18], ['Fail-first', 'fails on the old copy', 22], ['Escape', 'what slipped past', 27], ['Rule', 'the escape becomes a check', 33]]
  .map(([word, gloss, n], i, A) => ({ word, gloss, in: b(n), out: (i < A.length - 1 ? b(A[i + 1][2]) : T_PULL) - 0.05 }));
const T_SEVEN = b(42), T_LOCK = DUR - 2.3;
const READ = [
  { id: 'eyebrow', in: 0.25, out: 2.5, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 02' },
  { id: 'title', in: 0.25, out: 2.5, fi: 0.4, fo: 0.45, text: 'Check it at the gate.' },
  { id: 'mess', in: 2.45, out: b(10) - 0.05, fi: 0.3, fo: 0.25, text: 'By eye, misses ship.' },
  ...STN.map((s, i) => ({ id: 'w' + i, in: s.in, out: s.out, fi: 0.25, fo: 0.2, text: `${s.word} ${s.gloss}` })),
  { id: 'strip', in: b(10), out: T_PULL + 0.4, fi: 0.4, fo: 0.4, text: 'Spec Check Gate Fail-first Escape Rule' },
  { id: 'rules5', in: 2.6, out: 11.0, fi: 0.4, fo: 0.05, text: 'RULES 05' }, { id: 'rules6', in: 11.0, out: T_RULE7, fi: 0.05, fo: 0.05, text: 'RULES 06' },
  { id: 'rules7', in: T_RULE7, out: T_PULL + 0.4, fi: 0.05, fo: 0.3, text: 'RULES 07' },
  { id: 'escapes', in: T_MISS, out: T_PULL + 0.4, fi: 0.1, fo: 0.3, text: 'ESCAPES 1' },
  { id: 'oldcopy', in: 10.2, out: 12.35, fi: 0.2, fo: 0.3, text: 'OLD COPY' },
  { id: 'missed', in: T_MISS, out: 17.7, fi: 0.15, fo: 0.3, text: 'MISSED' },
  { id: 'catch', in: 10.8, out: 13.5, fi: 0.25, fo: 0.3, text: 'Real catch, this series: whale snapped 1.26 → 0.11 rad/frame.' },
  ...GATES.map((g, i) => ({ id: 'chip' + g.no, in: CHIP_AT[i], out: DUR, fi: 0.3, fo: 0, text: g.no })),
  { id: 'six', in: 18.5, out: T_SEVEN, fi: 0.25, fo: 0, text: 'RULES 6' },
  { id: 'seven', in: T_SEVEN, out: DUR, fi: 0.05, fo: 0, text: 'RULES 6 → 7' },
  { id: 'notthis', in: 18.28, out: 21.15, fi: 0.3, fo: 0.3, text: 'A gate proves the absence of known failures — not quality.' },
  { id: 'belief', in: 21.1, out: T_LOCK, fi: 0.35, fo: 0.3, text: 'Machines check every run. Every miss becomes a rule.' },
  { id: 'lockup', in: T_LOCK, out: DUR, fi: 0.6, fo: 0, text: 'CETI · Capabilities · 02 · Gate' },
];
const RD = id => READ.find(r => r.id === id), RA = (t, id) => { const r = RD(id); return win(t, r.in, r.out, r.fi, r.fo); };

function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, Z = zv(z), X = x => (x - cm.x) * z + cm.ax, Y = y => y * Z + cm.ay;
  const visL = cm.x - (cm.ax + 60) / z, visR = cm.x + (W - cm.ax + 60) / z;
  S.ground(c, t, cm, { tint: OLIVE });
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.lineCap = 'round'; c.lineJoin = 'round';

  // the track: one line, drawn on under the title card
  const tip = lerp(-1300, 4000, ramp(t, 0.3, 2.0, EASE.warm)), ta = Math.max(-4400, visL), tb = Math.min(tip, visR);
  if (tb > ta) { c.strokeStyle = TRACK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(X(ta), Y(0)); c.lineTo(X(tb), Y(0)); c.stroke(); }

  // gate state helpers
  const flashOf = g => { let f = 0; for (const e of PASSES) if (e.g === g && t >= e.t) f = Math.max(f, Math.exp(-(t - e.t) * 3.5)); return f; };
  const closeOf = g => { let k = 0; for (const e of CLOSE) if (e.g === g) k = Math.max(k, ramp(t, e.t - 0.06, e.t + 0.12, EASE.glaser) * (1 - ramp(t, e.open, e.open + 0.3, EASE.warm))); return k; };
  const hwOf = () => Math.max(GW * z, 26);

  // gate backs (walls + slot), drawn under the runs
  for (const G of GATES) {
    const X0 = X(G.x), hw = hwOf(); if (X0 < -120 || X0 > W + 120) continue;
    const g = G.i, grow = ramp(t, BUILT[g], BUILT[g] + 0.35, EASE.glaser); if (grow <= 0) continue;
    const top = Y(-HT * grow), bot = Y(HT * grow), sA = Math.min(G.A, HT * grow), st = Y(-sA), sb = Y(sA), flash = flashOf(g), close = closeOf(g);
    // walls with a light hatch
    c.fillStyle = WALL; c.fillRect(X0 - hw, top, 2 * hw, st - top); c.fillRect(X0 - hw, sb, 2 * hw, bot - sb);
    c.save(); c.beginPath(); c.rect(X0 - hw, top, 2 * hw, st - top); c.rect(X0 - hw, sb, 2 * hw, bot - sb); c.clip(); c.strokeStyle = HATCH; c.lineWidth = 1.5; c.beginPath();
    for (let y = top - 2 * hw; y < bot + 2 * hw; y += 13) { c.moveTo(X0 - hw, y); c.lineTo(X0 + hw, y - 2 * hw); } c.stroke(); c.restore();
    // the slot: paper, flashes olive on a pass, rust when closed
    c.fillStyle = C.paper; c.fillRect(X0 - hw, st, 2 * hw, sb - st);
    if (flash > 0.02) { c.fillStyle = rgba(OLIVE, 0.45 * flash); c.fillRect(X0 - hw, st, 2 * hw, sb - st); }
    if (close > 0.02) { c.fillStyle = rgba(RAW, 0.22 * close); c.fillRect(X0 - hw, st, 2 * hw, sb - st); }
    // spec edges: dashed, continued upstream as the tolerance band while the story is close
    const on = ramp(t, SCAN[g], SCAN[g] + 0.3), band = ramp(t, BUILT[g] + 0.2, BUILT[g] + 0.9, EASE.glaser) * (1 - ramp(t, T_PULL, T_PULL + 0.6)) * (g >= 5 ? 1 : 0);
    c.strokeStyle = rgba(OLIVE, 0.45 + 0.5 * Math.max(on * 0.5, flash)); c.lineWidth = Math.max(2, 2.5 * Z); c.setLineDash([8, 8]);
    for (const s of [st, sb]) { c.beginPath(); c.moveTo(X0 + hw, s); c.lineTo(X0 - hw - 420 * z * band, s); c.stroke(); }
    c.setLineDash([]);
  }

  // runs
  for (const r of RUNS) {
    const h = head(r, t); if (h < visL - 40 || h - LEN > visR + 40) continue;
    const a = r.fade ? 1 - ramp(t, r.fade[0], r.fade[1], EASE.rest) : 1; if (a <= 0) continue;
    let glow = 0; for (const e of crossings(r)) if (t >= e.t) glow = Math.max(glow, Math.exp(-(t - e.t) * 1.4));
    const ts = stopT(r), cr = ts != null ? ramp(t, ts, ts + 0.28, EASE.glaser) : 0;
    let bad = cr; if (r === ESC) bad = Math.max(bad, 0.55 * ramp(t, T_MISS, T_MISS + 0.3));
    const col = mix(mix(INK, PASS, glow * 0.9), FAIL, bad), lw = Math.max(5, 6 * Z);
    const pts = []; for (let k = 0; k <= 90; k++) { const [x, y] = runPt(r, k / 90, h, cr); pts.push([X(x), Y(y)]); }
    const path = () => { c.beginPath(); pts.forEach(([x, y], j) => j ? c.lineTo(x, y) : c.moveTo(x, y)); };
    if (glow > 0.02) { c.strokeStyle = rgba(OLIVE, 0.34 * glow * a); c.lineWidth = lw * 3.4; path(); c.stroke(); }
    if (bad > 0.02) { c.strokeStyle = rgba(RAW, 0.18 * bad * a); c.lineWidth = lw * 3; path(); c.stroke(); }
    c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = lw; path(); c.stroke(); c.globalAlpha = 1;
    if (r.chip) { const ca = RA(t, 'oldcopy') * a; if (ca > 0) S.chip(c, r.chip, X(h - LEN / 2), Y(140) + 6, { f: 'mono', size: 18, col: INK, a: ca, align: 'center', pad: 10, border: mix(C.paper, C.slate, 0.4) }); }
    if (r === ESC) { // the MISSED flag: a rust tag hung under the front of the run once it is clearly past the gate
      const fa = RA(t, 'missed') * a, pop = ramp(t, T_MISS, T_MISS + 0.3, EASE.glaser); if (fa > 0) {
        const fx = h - 24, [, fy] = runPt(r, 24 / LEN, h, 0), px = X(fx), py0 = Y(Math.max(fy, 0) + 8), py1 = py0 + 92 * Z * pop;
        c.save(); c.globalAlpha = fa; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(px, py0); c.lineTo(px, py1); c.stroke();
        c.fillStyle = RAW; c.strokeStyle = FAIL; c.lineWidth = 2; c.beginPath(); c.moveTo(px, py1 - 40 * Z * pop); c.lineTo(px + 46 * Z * pop, py1 - 27 * Z * pop); c.lineTo(px, py1 - 14 * Z * pop); c.closePath(); c.fill(); c.stroke(); c.restore();
        S.chip(c, 'MISSED', px - 72, py1 + 30, { f: 'mono', size: 20, col: INK, a: fa * pop, align: 'center', pad: 10, border: FAIL }); } }
  }

  // gate fronts: posts, lintel, foot, the closing bar, number chip
  for (const G of GATES) {
    const X0 = X(G.x), hw = hwOf(); if (X0 < -120 || X0 > W + 120) continue;
    const g = G.i, grow = ramp(t, BUILT[g], BUILT[g] + 0.35, EASE.glaser); if (grow <= 0) continue;
    const flash = flashOf(g), close = closeOf(g), seven = g === 6 ? win(t, T_SEVEN, DUR, 0.1, 0) : 0;
    const top = Y(-HT * grow), bot = Y(HT * grow), sA = Math.min(G.A, HT * grow), st = Y(-sA), sb = Y(sA), lw = Math.max(6, 7.5 * Math.min(Z, 1.2));
    const col = mix(mix(INK, PASS, flash * 0.8), FAIL, close * 0.6);
    if (flash > 0.02 || seven > 0) { c.strokeStyle = rgba(OLIVE, 0.22 * Math.max(flash, seven * 0.9)); c.lineWidth = lw * 4; c.strokeRect(X0 - hw, top, 2 * hw, bot - top); }
    c.strokeStyle = col; c.lineWidth = lw;
    c.beginPath(); c.moveTo(X0 - hw, st); c.lineTo(X0 - hw, top); c.moveTo(X0 + hw, st); c.lineTo(X0 + hw, top);       // posts above the slot
    c.moveTo(X0 - hw, sb); c.lineTo(X0 - hw, bot); c.moveTo(X0 + hw, sb); c.lineTo(X0 + hw, bot);                      // posts below the slot
    c.moveTo(X0 - hw, st); c.lineTo(X0 + hw, st); c.moveTo(X0 - hw, sb); c.lineTo(X0 + hw, sb); c.stroke();            // slot lips
    c.lineWidth = lw * 1.2; c.beginPath(); c.moveTo(X0 - hw - 16 * Z, top); c.lineTo(X0 + hw + 16 * Z, top); c.moveTo(X0 - hw - 10 * Z, bot); c.lineTo(X0 + hw + 10 * Z, bot); c.stroke();  // lintel + foot
    // the bar drops across the slot mouth when the gate fails closed
    if (close > 0.01) { c.strokeStyle = FAIL; c.lineWidth = lw * 1.3; c.beginPath(); c.moveTo(X0 - hw, st); c.lineTo(X0 - hw, lerp(st, sb, close)); c.stroke(); }
    const r = RD('chip' + G.no), ca = win(t, r.in, r.out, r.fi, r.fo);
    if (ca > 0) S.chip(c, G.no, X0, bot + 42, { f: 'mono', size: 20, col: INK, a: ca, align: 'center', pad: 10, border: seven > 0 ? mix(OLIVE, C.paper, 0.2 * (1 - seven)) : mix(C.paper, C.slate, 0.4) });
  }

  // the little whale
  { const p = wworld(t), ang = heading(t), v = wvel(t), sp = Math.hypot(v.x, v.y), moving = clamp(sp / 400);
    let blink = 0; for (const k of [3.0, 6.1, 9.3, 12.9, 17.6, 19.3, 22.4, 24.9]) blink = Math.max(blink, 1 - Math.abs(t - k) / 0.07);
    let squash = 0; for (const k of [b(10), b(14), 11.0, T_CATCH, T_BUILD7, T_SEVEN]) { const d = t - k; if (d >= 0 && d < 0.32) squash = Math.max(squash, 0.13 * (1 - EASE.glaser(d / 0.32))); }
    const focus = Math.max(win(t, b(14) - 0.1, b(23) + 0.2, 0.3, 0.3) * 0.7, win(t, T_TAKE - 0.1, 15.5, 0.12, 0.3), win(t, T_BUILD7, T_STOP7, 0.1, 0.1) * 0.8);
    const eye = 1 + 0.25 * win(t, b(23), b(23) + 0.9, 0.06, 0.3) + 0.35 * win(t, T_MISS - 0.05, T_TAKE + 0.1, 0.06, 0.15);
    const spark = Math.max(win(t, T_RULE7, T_RULE7 + 1.1, 0.12, 0.4), win(t, T_SEVEN, T_SEVEN + 1.2, 0.12, 0.4));
    const delight = (t > T_RULE7 + 0.05 && t < 18.0) || t > T_SEVEN + 0.05 ? 1 : 0;
    KH.drawWhale(c, { x: X(p.x), y: Y(p.y), ang, scale: 0.56 * Z, L: 1, tail: Math.sin(t * (moving > 0.3 ? 11 : 3)) * lerp(0.12, 0.34, moving), fin: Math.sin(t * 6 + 1.3) * lerp(0.15, 0.3, moving),
      blink, squash, focus: delight ? 0 : focus, eye, spark, sparkColor: OLIVE, sparkScale: 1.0, delight, blush: 0.6, mouth: delight ? 0.4 : 0.3 * win(t, b(10), b(10) + 0.5, 0.06, 0.2), sw: 3.2 });
  }

  // ---------- chrome ----------
  const ma = RA(t, 'mess'); if (ma > 0) S.chip(c, 'By eye, misses <i>ship</i>.', 160, 200 + (1 - EASE.defer(ramp(t, 2.45, 2.75))) * 10, { f: 'disp', size: 72, col: INK, accent: ACC, a: ma, pad: 14 });
  STN.forEach((s, i) => { const a = RA(t, 'w' + i); if (a <= 0) return; const dy = (1 - EASE.defer(clamp((t - s.in) / 0.3))) * 10;
    S.chip(c, s.word, 160, 200 + dy, { f: 'disp', size: 72, col: INK, a, pad: 14 });
    S.chip(c, s.gloss, 162, 256 + dy, { f: 'sans', size: 28, col: SOFT, a, pad: 12 });
    c.save(); c.font = `72px ${KH.FONTS.disp}`; const ww = c.measureText(s.word).width; c.restore();
    const u = ramp(t, s.in + 0.1, s.in + 0.5, EASE.glaser); c.strokeStyle = rgba(i === 3 || i === 4 ? RAW : OLIVE, a); c.lineWidth = 5; c.beginPath(); c.moveTo(160, 220 + dy); c.lineTo(160 + ww * u, 220 + dy); c.stroke(); });
  // station strip: all six, the active one on a chip with a colour bar
  const sa = RA(t, 'strip'); if (sa > 0) { c.save(); c.font = `18px ${KH.FONTS.mono}`; if ('letterSpacing' in c) c.letterSpacing = '3.6px';
    const ws = STN.map(s => c.measureText(s.word.toUpperCase()).width), gap = 34, tot = ws.reduce((p, q) => p + q, 0) + gap * 5; c.restore();
    let x = 1760 - tot; STN.forEach((s, i) => { const act = t >= s.in && t < s.out + 0.05, done = t >= s.out;
      if (act) { S.chip(c, s.word, x, 122, { f: 'mono', size: 18, col: INK, a: sa, pad: 10, border: mix(C.paper, C.slate, 0.4) });
        c.fillStyle = rgba(i === 3 || i === 4 ? RAW : OLIVE, sa); c.fillRect(x, 140, ws[i], 4); }
      else text(c, s.word, x, 122, { f: 'mono', size: 18, col: done ? INK : SOFT, a: sa });
      x += ws[i] + gap; }); }
  for (const id of ['rules5', 'rules6', 'rules7', 'escapes']) { const a = RA(t, id); if (a <= 0) continue; const r = RD(id), pop = 1 + 0.25 * Math.exp(-Math.max(0, t - r.in) * 6) * (id === 'rules5' ? 0 : 1);
    if (id === 'escapes') { c.fillStyle = rgba(RAW, a); c.beginPath(); c.arc(1760 - 4, 228, 6, 0, Math.PI * 2); c.fill(); }
    text(c, r.text, id === 'escapes' ? 1760 - 18 : 1760, id === 'escapes' ? 236 : 196, { f: 'monoB', size: Math.round(20 * pop), col: INK, a, align: 'right' }); }
  // the counter: RULES 6 → 7
  const s6 = RA(t, 'six'), s7 = RA(t, 'seven'); if (s6 > 0 || s7 > 0) { const fs = 48; c.save(); c.font = `${fs}px ${KH.FONTS.monoB}`; if ('letterSpacing' in c) c.letterSpacing = `${(fs * 0.2).toFixed(1)}px`;
    const wa = c.measureText('RULES 6 ').width, wf = c.measureText('RULES 6 → 7').width; c.restore();
    const x0 = 960 - wf / 2, a0 = Math.max(s6, s7), y0 = 270, pop = s7 > 0 ? 1 + 0.06 * Math.exp(-(t - T_SEVEN) * 5) : 1;
    c.save(); c.translate(960, y0 - fs * 0.3); c.scale(pop, pop); c.translate(-960, -(y0 - fs * 0.3));
    S.chip(c, ' ', 960, y0, { f: 'monoB', size: fs, col: INK, a: a0, align: 'center', pad: wf / 2 + 24, border: s7 > 0 ? mix(OLIVE, C.paper, 0.15) : mix(C.paper, C.slate, 0.4) });
    text(c, 'RULES 6', x0, y0, { f: 'monoB', size: fs, col: INK, a: a0 });
    if (s7 > 0) { const u = EASE.glaser(clamp((t - T_SEVEN) / 0.35)); text(c, '→ 7', x0 + wa - 14 * (1 - u), y0, { f: 'monoB', size: fs, col: INK, a: u }); }
    c.restore(); }
  for (const id of ['catch', 'notthis', 'belief']) S.caption(c, t, RD(id), { size: id === 'catch' ? 32 : 38 });
  S.open(c, t, { no: '02', title: 'Check it at the <i>gate</i>.', accent: ACC }, { out: 2.5 });
  S.lockup(c, t, T_LOCK, { no: '02', short: 'Gate' });
  c.restore();
}

function cues() { return { bpm: BPM, dur: DUR, title: 0.25, draw: 0.3, ship: RUNS.slice(0, 3).map(r => r.tg), wobble: RUNS[2].tg, spec: b(10), scan: b(14),
  stations: STN.map(s => s.in), pass: PASSES.map(e => ({ t: e.t, g: e.g, id: e.id })), stop: CLOSE.map(e => ({ t: e.t, g: e.g })), reopen: CLOSE.map(e => e.open),
  rule: [11.0, T_RULE7], falsePass: ESC.tg, missed: T_MISS, takeoff: T_TAKE, catch: T_CATCH, build7: T_BUILD7, nudge: T_NUDGE, spark: [T_RULE7, T_SEVEN], pull: T_PULL, seven: T_SEVEN,
  notThis: RD('notthis').in, belief: RD('belief').in, lockup: T_LOCK }; }
const CONTRAST = [['title / station word / chips', INK, C.paper], ['ink on chart ground (counters, strip done)', INK, BG], ['title accent on ground', ACC, BG], ['mess accent on chip', ACC, C.paper],
  ['eyebrow / strip / lockup (slate on ground)', SOFT, BG], ['gloss (slate on chip)', SOFT, C.paper]];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, DUR, W, H, fps: 60, wpos, heading, cam,
  shutter: t => (t > 2.2 && t < 4.8) || (t > 14.1 && t < 15.0) || (t > 19.5 && t < 23.6) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
