// CETI Capabilities 02 · gate — "Prove it at the gate." Kinetic Hydrography 1.0.0 + series layer.
// A gate is two upright ticks on the line; the gap between them is the spec. Runs of the line slide along the track:
// a run that fits glows through, one that does not is stopped (the ticks close: fail closed). One subtle wobble escapes,
// the whale catches it downstream, and it becomes a new, tighter gate. Pull back: a row of gates, every miss a rule.
// drawFrame(ctx, t) is a pure function of t.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, smoothstep, win, EASE, ramp, mix, rgba, text } = KH;
const W = 1920, H = 1080, BPM = 128, B = 60 / BPM, b = n => n * B, DUR = 28.0;
const INK = C.navy, SOFT = C.slate, OLIVE = WD.oliveGreen, RAW = WD.rawSienna, BUFF = WD.ivoryBuff;
const BG = mix(C.paper, OLIVE, 0.06);                       // what SERIES.ground paints with tint: olive
let ACC = RAW; for (let k = 0; k <= 1; k += 0.05) { ACC = mix(RAW, INK, k); if (KH.contrast(ACC, BG) >= 4.6 && KH.contrast(ACC, C.paper) >= 4.6) break; }
const PASS = mix(OLIVE, INK, 0.12), FAIL = mix(RAW, INK, 0.08), TRACK = mix(C.paper, C.slate, 0.5);

// ---------- gates: 640 apart; 06 is built in the story, 07 is the escape turned into a rule ----------
const SP = 640, POST = 64, LEN = 320, V = SP / B;            // V: runs cross one gate per beat
const GATES = [120, 108, 98, 88, 80, 46, 24].map((A, i) => ({ i, no: String(i + 1).padStart(2, '0'), x: (i - 5) * SP, A }));
const BUILT = [-9, -9, -9, -9, -9, b(10), 15.8], SCAN = [0, 0, 0, 0, 0, b(14), 16.0];
const CLOSE = [{ g: 5, t: b(23), open: 12.45 }, { g: 6, t: 16.2, open: 17.15 }];
const CHIP_AT = [18.7, 18.75, 18.8, 18.85, 18.9, 11.0, 16.25];

// ---------- runs: tg = time the head is at x = 0 (gate 06); amp/wl = wobble; only gates in `chk` check this run ----------
const R = (o) => ({ v: V, amp: 6, wl: 170, ph: 0.4, chk: [], ...o });
const RUNS = [
  R({ id: 'a', tg: b(6) }), R({ id: 'b', tg: b(7), ph: 2.1 }), R({ id: 'old0', tg: b(8.5), amp: 74, wl: 92, ph: 1.0 }),   // act 1: no gate, all ship
  R({ id: 'r1', tg: b(16), chk: [5] }), R({ id: 'r2', tg: b(19), chk: [5], ph: 1.7 }), R({ id: 'r3', tg: b(21), chk: [5], ph: 3.0 }),
  R({ id: 'old', tg: b(23), amp: 74, wl: 92, ph: 1.0, stop: 5, fade: [11.95, 12.4], chip: 'OLD COPY' }),                    // fail-first: the act-1 copy returns
  R({ id: 'esc', tg: b(29), v: 1000, amp: 34, wl: 112, ph: 0.6, chk: [5], catchT: 14.08, tau: 0.12, held: 6, fade: [16.75, 17.15] }),
  R({ id: 'g', tg: b(37), chk: [5, 6], ph: 2.5 }),
  ...[48, 49.5, 51, 52.5, 54].map((n, k) => R({ id: 'p' + k, tg: b(n - 1), chk: [0, 1, 2, 3, 4, 5, 6], ph: k * 1.3 })),     // payoff: one gate per beat
];
function head(r, t) { const f = r.v * (t - r.tg);
  if (r.stop != null) { const G = GATES[r.stop].x - 4, s = 50; return f < G - s ? f : G - s * Math.exp(-(f - (G - s)) / s); }
  if (r.catchT != null && t > r.catchT) { const hc = r.v * (r.catchT - r.tg); return hc + r.v * r.tau * (1 - Math.exp(-(t - r.catchT) / r.tau)); }
  return f; }
const crossings = r => r.chk.map(g => ({ g, t: r.tg + GATES[g].x / r.v })).filter(e => (r.catchT == null || e.t < r.catchT) && e.t > SCAN[e.g]);
const PASSES = RUNS.flatMap(r => crossings(r).map(e => ({ ...e, id: r.id }))).sort((a, c) => a.t - c.t);
const runY = (r, x, h) => { const u = (h - x) / LEN; if (u < 0 || u > 1) return 0; return r.amp * Math.pow(Math.sin(Math.PI * u), 0.7) * Math.sin((h - x) * 2 * Math.PI / r.wl + r.ph); };

// ---------- the whale: Hermite through keys (optional explicit velocity), rides the escaped run while holding it ----------
const K1 = [[1.9, -1150, -200], [3.2, -640, -222], [4.25, -120, -206], [b(10), 0, -146, 0, 0], [13.62, 0, -146, 0, 0], [13.86, 150, -205], [14.08, 330, -80, 1000, 0]];
const K2 = [[15.47, 450, -80, 0, 0], [15.64, 548, -170], [15.8, 640, -124, 0, 0], [DUR + 1, 640, -124, 0, 0]];
function herm(P, t) { const n = P.length; if (t <= P[0][0]) return { x: P[0][1], y: P[0][2] }; if (t >= P[n - 1][0]) return { x: P[n - 1][1], y: P[n - 1][2] };
  let i = 0; while (P[i + 1][0] < t) i++; const p1 = P[i], p2 = P[i + 1], h = p2[0] - p1[0], u = (t - p1[0]) / h;
  const tan = k => { const p = P[k]; if (p.length > 3) return [p[3], p[4]]; const a = P[Math.max(0, k - 1)], c = P[Math.min(n - 1, k + 1)]; return [(c[1] - a[1]) / (c[0] - a[0]), (c[2] - a[2]) / (c[0] - a[0])]; };
  const m1 = tan(i), m2 = tan(i + 1), u2 = u * u, u3 = u2 * u, A = 2 * u3 - 3 * u2 + 1, Bb = u3 - 2 * u2 + u, Cc = -2 * u3 + 3 * u2, D = u3 - u2;
  return { x: A * p1[1] + Bb * h * m1[0] + Cc * p2[1] + D * h * m2[0], y: A * p1[2] + Bb * h * m1[1] + Cc * p2[2] + D * h * m2[1] }; }
const ESC = RUNS.find(r => r.id === 'esc');
const STOMPS = [b(14), 11.0];
function wbase(t) { if (t < 14.08) return herm(K1, t); if (t < 15.47) return { x: head(ESC, t) - LEN / 2, y: -80 }; return herm(K2, t); }
function wworld(t) { const p = wbase(t), q = wbase(t + 0.01), sp = Math.hypot(q.x - p.x, q.y - p.y) * 100, still = 1 - clamp(sp / 150);
  let dip = 0; for (const s of STOMPS) { const d = t - s; if (d > 0 && d < 0.35) dip = Math.max(dip, 8 * Math.sin(Math.PI * d / 0.35)); }
  return { x: p.x, y: p.y + (Math.sin(t * 2.4) * 2.5 + dip) * still }; }
const wvel = t => { const a = wworld(t - 1 / 240), c = wworld(t + 1 / 240); return { x: (c.x - a.x) * 120, y: (c.y - a.y) * 120 }; };
function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
    a += (sp < 40 ? 0 : clamp(Math.atan2(v.y, Math.abs(v.x)), -0.8, 0.8) * clamp(sp / 300)) * w; s += w; } return a / s; }

// ---------- camera: gentle push, pan on the chase, push in on the new rule, pull back to the row ----------
function cam(t) {
  const fp = win(t, 10.5, 12.5, 0.6, 0.6), pan = ramp(t, 13.3, 14.5, EASE.warm), push = ramp(t, 15.3, 16.4, EASE.warm), k = ramp(t, b(39), 20.1, EASE.rest), d = ramp(t, 20.1, DUR, EASE.rest);
  const zs = lerp(1.38, 1.45, ramp(t, 0, b(10), EASE.warm)) + 0.12 * fp + 0.3 * push, xs = 150 - 50 * fp + 180 * pan + 140 * push;
  // the pull-back is anchored on gate 07 (where the whale sits), so the whale stays in frame while the row opens out
  const zk = lerp(zs, 0.40, k), sk = lerp((640 - xs) * zs, (640 + 1280) * 0.40, k);
  return { x: 640 - sk / zk + 40 * d, y: 0, z: zk + 0.025 * d, ax: 960, ay: lerp(600, 540, k) };
}
const zv = z => Math.max(z, 0.85);   // vertical size floor so gates and whale stay readable in the pull-back
const wpos = t => { const p = wworld(t), c = cam(t); return { x: p.x, y: p.y * zv(c.z) / c.z }; };   // reports the drawn screen position

// ---------- text ----------
const STN = [['Spec', 'what must be true', 10], ['Check', 'a machine, not opinion', 14], ['Gate', 'pass, or stop', 18], ['Fail-first', 'fails on the old copy', 22], ['Escape', 'what slipped past', 27], ['Rule', 'the escape becomes a check', 33]]
  .map(([word, gloss, n], i, A) => ({ word, gloss, in: b(n), out: (i < A.length - 1 ? b(A[i + 1][2]) : b(39)) - 0.05 }));
const T_SEVEN = b(42), T_LOCK = DUR - 2.3;
const READ = [
  { id: 'eyebrow', in: 0.25, out: 2.5, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 02' },
  { id: 'title', in: 0.25, out: 2.5, fi: 0.4, fo: 0.45, text: 'Prove it at the gate.' },
  { id: 'mess', in: 2.45, out: b(10) - 0.05, fi: 0.3, fo: 0.25, text: 'By eye, misses ship.' },
  ...STN.map((s, i) => ({ id: 'w' + i, in: s.in, out: s.out, fi: 0.25, fo: 0.2, text: `${s.word} ${s.gloss}` })),
  { id: 'strip', in: b(10), out: b(39) + 0.4, fi: 0.4, fo: 0.4, text: 'Spec Check Gate Fail-first Escape Rule' },
  { id: 'rules5', in: 2.6, out: 11.0, fi: 0.4, fo: 0.05, text: 'RULES 05' }, { id: 'rules6', in: 11.0, out: 16.25, fi: 0.05, fo: 0.05, text: 'RULES 06' },
  { id: 'rules7', in: 16.25, out: 18.6, fi: 0.05, fo: 0.3, text: 'RULES 07' },
  { id: 'oldcopy', in: 10.2, out: 12.35, fi: 0.2, fo: 0.3, text: 'OLD COPY' },
  { id: 'catch', in: 10.85, out: 13.55, fi: 0.25, fo: 0.3, text: "Real catch, this series: whale snapped 1.26 → 0.11 rad/frame." },
  ...GATES.map((g, i) => ({ id: 'chip' + g.no, in: CHIP_AT[i], out: DUR, fi: 0.3, fo: 0, text: g.no })),
  { id: 'six', in: 18.5, out: T_SEVEN, fi: 0.25, fo: 0, text: 'RULES 6' },
  { id: 'seven', in: T_SEVEN, out: DUR, fi: 0.05, fo: 0, text: 'RULES 6 → 7' },
  { id: 'notthis', in: 20.15, out: 23.05, fi: 0.3, fo: 0.3, text: 'A gate proves the absence of known failures — not quality.' },
  { id: 'belief', in: 23.0, out: T_LOCK, fi: 0.35, fo: 0.3, text: 'Machines check every run. Every miss becomes a rule.' },
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

  // spec bands (dashed): what must be true, drawn upstream of 06 and 07; they leave on the pull-back
  const bandOut = 1 - ramp(t, b(39), b(39) + 0.6);
  for (const g of [5, 6]) { const G = GATES[g], d = ramp(t, BUILT[g] + 0.2, BUILT[g] + 0.9, EASE.glaser) * bandOut; if (d <= 0) continue;
    c.strokeStyle = rgba(OLIVE, 0.55); c.lineWidth = 2; c.setLineDash([8, 9]);
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(X(G.x), Y(s * G.A)); c.lineTo(X(G.x - 420 * d), Y(s * G.A)); c.stroke(); }
    c.setLineDash([]); }

  // runs
  for (const r of RUNS) {
    const h = head(r, t); if (h < visL - 40 || h - LEN > visR + 40) continue;
    let a = r.fade ? 1 - ramp(t, r.fade[0], r.fade[1], EASE.rest) : 1; if (a <= 0) continue;
    let glow = 0; for (const e of crossings(r)) if (t >= e.t) glow = Math.max(glow, Math.exp(-(t - e.t) * 1.5));
    let bad = 0; if (r.stop != null) bad = ramp(t, CLOSE[0].t, CLOSE[0].t + 0.2); if (r.held != null) bad = Math.max(ramp(t, r.catchT, r.catchT + 0.3) * 0.5, ramp(t, CLOSE[1].t, CLOSE[1].t + 0.2));
    const col = mix(mix(INK, PASS, glow * 0.9), FAIL, bad), lw = Math.max(4, 5 * Z);
    const pts = []; for (let x = Math.max(h - LEN, visL); x <= Math.min(h, visR); x += 5 / z) pts.push([X(x), Y(runY(r, x, h))]);
    if (pts.length < 2) continue;
    const path = () => { c.beginPath(); pts.forEach(([x, y], j) => j ? c.lineTo(x, y) : c.moveTo(x, y)); };
    if (glow > 0.02) { c.strokeStyle = rgba(OLIVE, 0.34 * glow * a); c.lineWidth = lw * 3.6; path(); c.stroke(); }
    if (bad > 0.02) { c.strokeStyle = rgba(RAW, 0.16 * bad * a); c.lineWidth = lw * 3.2; path(); c.stroke(); }
    c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = lw; path(); c.stroke(); c.globalAlpha = 1;
    if (r.chip) { const ca = RA(t, 'oldcopy') * a; if (ca > 0) S.chip(c, r.chip, X(h - LEN / 2), Y(124) + 6, { f: 'mono', size: 18, col: INK, a: ca, align: 'center', pad: 10, border: mix(C.paper, C.slate, 0.4) }); }
  }

  // gates: two upright ticks; they grow out of the line when built, flash olive on a pass, close (Raw Sienna) on a stop
  for (const G of GATES) {
    const X0 = X(G.x); if (X0 < -80 || X0 > W + 80) continue;
    const g = G.i, grow = ramp(t, BUILT[g], BUILT[g] + 0.35, EASE.glaser); if (grow <= 0) continue;
    let flash = 0; for (const e of PASSES) if (e.g === g && t >= e.t) flash = Math.max(flash, Math.exp(-(t - e.t) * 4));
    let close = 0; for (const e of CLOSE) if (e.g === g) close = Math.max(close, ramp(t, e.t, e.t + 0.16, EASE.glaser) * (1 - ramp(t, e.open, e.open + 0.3, EASE.warm)));
    const inner = G.A * (1 - close), outer = G.A + POST * grow, lw = Math.max(5, 6.5 * Z), col = mix(mix(INK, PASS, flash), FAIL, close);
    const seven = g === 6 ? win(t, T_SEVEN, DUR, 0.1, 0) : 0;
    if (flash > 0.02 || close > 0.02 || seven > 0) { c.strokeStyle = rgba(close > flash ? RAW : OLIVE, 0.2 * Math.max(flash, close, seven * 0.8)); c.lineWidth = lw * 4;
      c.beginPath(); c.moveTo(X0, Y(-outer)); c.lineTo(X0, Y(-inner)); c.moveTo(X0, Y(inner)); c.lineTo(X0, Y(outer)); c.stroke(); }
    // scan: the machine looking through the gap
    const sc = ramp(t, SCAN[g], SCAN[g] + 0.3) * (1 - close); if (sc > 0 && inner > 2) { c.strokeStyle = rgba(OLIVE, (0.35 + 0.5 * flash) * sc); c.lineWidth = 2; c.setLineDash([3, 6]);
      c.beginPath(); c.moveTo(X0, Y(-inner)); c.lineTo(X0, Y(inner)); c.stroke(); c.setLineDash([]); }
    c.strokeStyle = col; c.lineWidth = lw;
    c.beginPath(); c.moveTo(X0, Y(-inner)); c.lineTo(X0, Y(-outer)); c.stroke(); c.beginPath(); c.moveTo(X0, Y(inner)); c.lineTo(X0, Y(outer)); c.stroke();
    // number chip
    const r = RD('chip' + G.no), ca = win(t, r.in, r.out, r.fi, r.fo);
    if (ca > 0) S.chip(c, G.no, X0, Y(outer) + 40, { f: 'mono', size: 18, col: INK, a: ca, align: 'center', pad: 10, border: seven > 0 ? mix(OLIVE, C.paper, 0.2 * (1 - seven)) : mix(C.paper, C.slate, 0.4) });
  }

  // the little whale
  { const p = wworld(t), ang = heading(t), v = wvel(t), sp = Math.hypot(v.x, v.y), moving = clamp(sp / 400);
    let blink = 0; for (const k of [3.0, 6.1, 9.3, 12.9, 17.6, 19.3, 22.4, 24.9]) blink = Math.max(blink, 1 - Math.abs(t - k) / 0.07);
    let squash = 0; for (const k of [b(10), b(14), 11.0, 14.08, 15.8, T_SEVEN]) { const d = t - k; if (d >= 0 && d < 0.32) squash = Math.max(squash, 0.13 * (1 - EASE.glaser(d / 0.32))); }
    const focus = Math.max(win(t, b(14) - 0.1, b(23) + 0.2, 0.3, 0.3) * 0.7, win(t, 13.7, 15.5, 0.12, 0.3));
    const eye = 1 + 0.25 * win(t, b(23), b(23) + 0.9, 0.06, 0.3) + 0.35 * win(t, b(29) + 0.02, 13.95, 0.05, 0.15);
    const spark = Math.max(win(t, 16.25, 17.4, 0.12, 0.4), win(t, T_SEVEN, T_SEVEN + 1.2, 0.12, 0.4));
    const delight = (t > 16.3 && t < 17.7) || t > T_SEVEN + 0.05 ? 1 : 0;
    KH.drawWhale(c, { x: X(p.x), y: Y(p.y), ang, scale: 0.56 * Z, L: 1, tail: Math.sin(t * (moving > 0.3 ? 11 : 3)) * lerp(0.12, 0.34, moving), fin: Math.sin(t * 6 + 1.3) * lerp(0.15, 0.3, moving),
      blink, squash, focus: delight ? 0 : focus, eye, spark, sparkColor: OLIVE, sparkScale: 1.3, delight, blush: 0.6, mouth: delight ? 0.4 : 0.3 * win(t, b(10), b(10) + 0.5, 0.06, 0.2), sw: 3.2 });
  }

  // ---------- chrome ----------
  const ma = RA(t, 'mess'); if (ma > 0) S.chip(c, 'By eye, misses <i>ship</i>.', 160, 200 + (1 - EASE.defer(ramp(t, 2.45, 2.75))) * 10, { f: 'disp', size: 72, col: INK, accent: ACC, a: ma, pad: 14 });
  STN.forEach((s, i) => { const a = RA(t, 'w' + i); if (a <= 0) return; const dy = (1 - EASE.defer(clamp((t - s.in) / 0.3))) * 10;
    S.chip(c, s.word, 160, 200 + dy, { f: 'disp', size: 72, col: INK, a, pad: 14 });
    S.chip(c, s.gloss, 162, 256 + dy, { f: 'sans', size: 28, col: SOFT, a, pad: 12 });
    c.save(); c.font = `72px ${KH.FONTS.disp}`; const ww = c.measureText(s.word).width; c.restore();
    const u = ramp(t, s.in + 0.1, s.in + 0.5, EASE.glaser); c.strokeStyle = rgba(i === 3 || i === 4 ? RAW : OLIVE, a); c.lineWidth = 5; c.beginPath(); c.moveTo(160, 220 + dy); c.lineTo(160 + ww * u, 220 + dy); c.stroke(); });
  // station strip: all six, the active one on a chip with an olive bar
  const sa = RA(t, 'strip'); if (sa > 0) { c.save(); c.font = `18px ${KH.FONTS.mono}`; if ('letterSpacing' in c) c.letterSpacing = '3.6px';
    const ws = STN.map(s => c.measureText(s.word.toUpperCase()).width), gap = 34, tot = ws.reduce((p, q) => p + q, 0) + gap * 5; c.restore();
    let x = 1760 - tot; STN.forEach((s, i) => { const act = t >= s.in && t < s.out + 0.05, done = t >= s.out;
      if (act) { S.chip(c, s.word, x, 122, { f: 'mono', size: 18, col: INK, a: sa, pad: 10, border: mix(C.paper, C.slate, 0.4) });
        c.fillStyle = rgba(i === 3 || i === 4 ? RAW : OLIVE, sa); c.fillRect(x, 140, ws[i], 4); }
      else text(c, s.word, x, 122, { f: 'mono', size: 18, col: done ? INK : SOFT, a: sa });
      x += ws[i] + gap; }); }
  for (const id of ['rules5', 'rules6', 'rules7']) { const a = RA(t, id); if (a <= 0) continue; const r = RD(id), pop = 1 + 0.25 * Math.exp(-Math.max(0, t - r.in) * 6) * (id === 'rules5' ? 0 : 1);
    text(c, r.text, 1760, 196, { f: 'monoB', size: Math.round(20 * pop), col: INK, a, align: 'right' }); }
  // the counter: RULES 6 → 7
  const s6 = RA(t, 'six'), s7 = RA(t, 'seven'); if (s6 > 0 || s7 > 0) { const fs = 44; c.save(); c.font = `${fs}px ${KH.FONTS.monoB}`; if ('letterSpacing' in c) c.letterSpacing = `${(fs * 0.2).toFixed(1)}px`;
    const wa = c.measureText('RULES 6 ').width, wf = c.measureText('RULES 6 → 7').width; c.restore();
    const x0 = 960 - wf / 2, a0 = Math.max(s6, s7), y0 = 300;
    S.chip(c, ' ', 960, y0, { f: 'monoB', size: fs, col: INK, a: a0, align: 'center', pad: wf / 2 + 20, border: s7 > 0 ? mix(OLIVE, C.paper, 0.15) : mix(C.paper, C.slate, 0.4) });
    text(c, 'RULES 6', x0, y0, { f: 'monoB', size: fs, col: INK, a: a0 });
    if (s7 > 0) { const u = EASE.glaser(clamp((t - T_SEVEN) / 0.35)); text(c, '→ 7', x0 + wa - 14 * (1 - u), y0, { f: 'monoB', size: fs, col: INK, a: u }); } }
  for (const id of ['catch', 'notthis', 'belief']) S.caption(c, t, RD(id), { size: id === 'catch' ? 32 : 38 });
  S.open(c, t, { no: '02', title: 'Prove it at the <i>gate</i>.', accent: ACC }, { out: 2.5 });
  S.lockup(c, t, T_LOCK, { no: '02', short: 'Gate' });
  c.restore();
}

function cues() { return { bpm: BPM, dur: DUR, title: 0.25, draw: 0.3, ship: RUNS.slice(0, 3).map(r => r.tg), wobble: RUNS[2].tg, spec: b(10), scan: b(14),
  stations: STN.map(s => s.in), pass: PASSES.map(e => ({ t: e.t, g: e.g, id: e.id })), stop: CLOSE.map(e => ({ t: e.t, g: e.g })), reopen: CLOSE.map(e => e.open),
  rule: [11.0, 16.25], falsePass: b(29), takeoff: 13.62, catch: 14.08, build7: 15.8, spark: [16.25, T_SEVEN], pull: b(39), seven: T_SEVEN,
  notThis: RD('notthis').in, belief: RD('belief').in, lockup: T_LOCK }; }
const CONTRAST = [['title / station word / chips', INK, C.paper], ['ink on chart ground (counter, strip done)', INK, BG], ['title accent on ground', ACC, BG], ['mess accent on chip', ACC, C.paper],
  ['eyebrow / strip / lockup (slate on ground)', SOFT, BG], ['gloss (slate on chip)', SOFT, C.paper]];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, DUR, W, H, fps: 60, wpos, heading, cam,
  shutter: t => (t > 2.2 && t < 4.8) || (t > 13.5 && t < 14.4) || (t > 19.5 && t < 25.5) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
