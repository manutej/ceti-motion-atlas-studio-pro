// Composition v2 — "Trust what you can compose." Kinetic Hydrography (kit 1.0.0, little-whale rig v2).
// v2: frame-filling scale, the rejection staged at the centre joint (the whale carries the wrong part in),
// a full-beat second run, an underlined effect, a slow push-in resolve with "Every part checked."
// makeFilm() -> { drawFrame(ctx, t), READ, cues(), DUR, fps, shutter(t), wpos, heading, cam }. drawFrame is pure in t.
(function (root) {
'use strict';
const KH = root.KH, { CETI: C, W: WD, clamp, lerp, win, EASE, ramp, mix, rgba, text, whaleMark } = KH;

function makeFilm() {
  const W = 1920, H = 1080, FPS = 60, BPM = 128, B = 60 / BPM, DUR = 28, b = n => n * B;
  const INK = C.navy, SOFT = C.slate, PAPER = C.paper, PART = mix(C.paper, KH.NEUTRALS.white, 0.45);
  const YEL = WD.sulpherYellow, SAL = WD.ochraceousSalmon, UMB = WD.paleRawUmber, SLA = WD.slateColor, RED = WD.englishRed;
  const ACC = mix(SAL, UMB, 0.65);                       // caption accent: 3.4:1 on paper at 88 px
  const TYPE = { num: SAL, bool: SLA, text: UMB };       // type = shape + colour: circle number, square yes/no, triangle text
  const S = { gl: EASE.glaser, wm: EASE.warm, co: EASE.collect, rs: EASE.rest, df: EASE.defer };
  const seg = (t, t0, t1, e = S.wm) => e(clamp((t - t0) / (t1 - t0)));

  // ---------------- layout (v2 scale: parts 320×300, chips r40, whale 1.3×) ----------------
  const CY = 670, PW = 320, PH = 300, JR = 24, CR = 40, POD = 70;
  const BOX = { x: 460, y: CY - 150, w: 900, h: 300 };
  const THIRD = [610, 910, 1210], REST = [420, 1000, 1400], CHAIN = [640, 960, 1280];
  const LINE0 = 300, LINE1 = 1640, START = 400, OUT = 1520, TRY = 892;
  const SCALE = 0.73, BELLY = 46, WRONG = { w: 160, h: 80 };

  // ---------------- timeline (beats) ----------------
  const T = {
    crack: b(6.5), split: b(7), spark: b(10), joints: b(13), legend: b(14),
    wrongIn: b(14.5), carry: b(15), contact: b(18), back: b(19), fall: b(19.5), line: b(20.5),
    snap1: b(21.5), snap2: b(22.5), act4: b(24), podIn: b(25), chipIn1: b(26),
    run1: [b(27.5), b(29.5), b(31.5)], out1: b(33.5),
    act5: b(38), lift: b(38.25), newIn: b(39), podBack: b(39.5), snap3: b(41), chipIn2: b(42),
    run2: [b(43), b(44), b(45)], out2: b(46), under: b(46.5),
    act6: b(48), checks: [b(49), b(50), b(51)], whaleEnd: b(50.5), title: b(52), mark: b(53.5),
  };
  const ACTS = [0, T.split, T.joints, T.act4, T.act5, T.act6];

  // ---------------- READ: captions + traces (drives drawing AND the read-time gate) ----------------
  const cap = (id, html, i, o, fi = 0.25, fo = 0.2) => ({ id, kind: 'cap', html, in: i, out: o, fi, fo, text: html.replace(/<\/?i>/g, '') });
  const TR1 = ['3 → 6', '6 → 7', '7 ≥ 5 → yes'], TR2 = ['3 → 3', '3 → 4', '4 ≥ 5 → no'];
  const READ = [
    cap('c1', 'One big <i>box</i>.', 0.2, 1.75),
    cap('c2', 'Can you <i>trust</i> it?', 1.8, 3.5),
    cap('c3', 'Make it from small <i>parts</i>.', 3.55, 6.05),
    cap('c4', 'Parts only snap if they <i>fit</i>.', 6.1, 11.2),
    cap('c5', 'Every step shows its <i>work</i>.', 11.25, 17.6),
    cap('c6', 'Change a part. See the <i>effect</i>.', 17.65, 22.45),
    cap('c7', 'Every part <i>checked</i>.', 22.5, T.title - 0.05),
    cap('end', 'Trust what you can <i>compose</i>.', T.title, DUR, 0.5, 0),
    { id: 'tr0a', kind: 'trace', slot: 0, html: TR1[0], in: T.run1[0] + 0.1, out: T.lift + 0.35, fi: 0.25, fo: 0.3 },
    { id: 'tr1a', kind: 'trace', slot: 1, html: TR1[1], in: T.run1[1] + 0.1, out: T.run2[1] + 0.35, fi: 0.25, fo: 0.25 },
    { id: 'tr2a', kind: 'trace', slot: 2, html: TR1[2], in: T.run1[2] + 0.1, out: T.run2[2] + 0.35, fi: 0.25, fo: 0.25 },
    { id: 'tr0b', kind: 'trace', slot: 0, html: TR2[0], in: T.run2[0] + 0.1, out: DUR, fi: 0.25, fo: 0 },
    { id: 'tr1b', kind: 'trace', slot: 1, html: TR2[1], in: T.run2[1] + 0.1, out: DUR, fi: 0.25, fo: 0 },
    { id: 'tr2b', kind: 'trace', slot: 2, html: TR2[2], in: T.run2[2] + 0.1, out: DUR, fi: 0.25, fo: 0 },
  ].map(r => ({ ...r, text: r.text || r.html }));

  // ---------------- camera: still, then a slow push-in on the whole chain ----------------
  function cam(t) { const k = seg(t, T.act6, DUR, S.rs); return { x: 960, y: CY, z: lerp(1, 1.06, k), ax: 960, ay: CY, k }; }

  // ---------------- the whale: keyed moves in air, gentle bob ----------------
  const WK = [ // t0, t1, from, to, arc lift, late (y exponent: >1 stays high, settles at the end)
    [3.35, T.spark, [-260, 330], [330, 375], 0],
    [T.carry, b(16.5), [330, 375], [694, 375], 0],          // carries the wrong part over the top
    [b(16.5), b(17.5), [694, 375], [694, 584], 0],           // down into the gap between ×2 and +1
    [b(17.5), T.contact, [694, 584], [724, 584], 0],         // offers it to +1's socket
    [T.back, T.back + 0.3, [724, 584], [694, 584], 0],       // slides it back out
    [b(19.75), b(20.75), [694, 584], [610, 375], 0],           // lets go, rises to watch
    [b(38.5), T.newIn, [610, 375], [610, 384], 0],
    [b(40), T.snap3, [610, 384], [610, 474], 0],             // lowers ×1 into the slot
    [b(41.5), b(43), [610, 474], [610, 375], 0],
    [b(47), T.whaleEnd, [610, 375], [1640, CY], 40, 5],      // over the chain, settles beside the output
  ];
  function wbase(t) {
    if (t < WK[0][0]) return { x: WK[0][2][0], y: WK[0][2][1] };
    let last = WK[0][2];
    for (const [t0, t1, a, z, lift, late = 1] of WK) {
      if (t < t0) return { x: last[0], y: last[1] };
      if (t <= t1) { const u = S.wm(clamp((t - t0) / (t1 - t0))); return { x: lerp(a[0], z[0], u), y: lerp(a[1], z[1], u ** late) - lift * Math.sin(Math.PI * u) }; }
      last = z;
    }
    return { x: last[0], y: last[1] };
  }
  const wpos = t => { const p = wbase(t); return { x: p.x, y: p.y + Math.sin(t * 2.3) * 4 }; };
  const wvel = t => { const a = wbase(t - 1 / 240), c2 = wbase(t + 1 / 240); return { x: (c2.x - a.x) * 120, y: (c2.y - a.y) * 120 }; };
  function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const tt = t + k * 0.02, v = wvel(tt), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
      const h = sp < 20 ? 0 : clamp(Math.atan2(v.y, Math.max(90, Math.abs(v.x))), -0.5, 0.5) * clamp((sp - 20) / 200); a += h * w; s += w; }
    return (a / s) * (1 - 0.7 * carryK(t)); }   // level flight while carrying a part
  const carryK = t => Math.max(win(t, T.wrongIn, T.fall, 0.3, 0.3), win(t, T.newIn - 0.2, T.snap3 + 0.2, 0.3, 0.3));

  // ---------------- parts ----------------
  const PLOT = { x2: u => 2 * u, p1: u => u + 0.35, ge5: u => (u < 0.55 ? 0.12 : 0.88), x1: u => u };
  function partState(id, t) {
    const sp = seg(t, T.split, T.split + 0.55, S.gl), L = seg(t, T.split + 0.08, T.split + 0.5);
    const base = i => ({ cx: lerp(THIRD[i], REST[i], sp), cy: CY, w: lerp(300, PW, sp), h: PH, L, a: 1, sc: 1, rot: 0,
      radii: [i === 0 ? lerp(14, 10, sp) : lerp(0, 10, sp), i === 2 ? lerp(14, 10, sp) : lerp(0, 10, sp), i === 2 ? lerp(14, 10, sp) : lerp(0, 10, sp), i === 0 ? lerp(14, 10, sp) : lerp(0, 10, sp)],
      inK: seg(t, T.joints + i * B / 2, T.joints + i * B / 2 + 0.35, S.gl), outK: seg(t, T.joints + i * B / 2, T.joints + i * B / 2 + 0.35, S.gl),
      labelA: seg(t, b(8) + i * B / 2, b(8) + i * B / 2 + 0.3, S.gl), plotK: seg(t, b(8) + i * B / 2 + 0.1, b(8) + i * B / 2 + 0.55) });
    if (id === 0) { const p = { ...base(0), label: '×2', plot: 'x2', out: 'num' };
      p.cx += (CHAIN[0] - REST[0]) * seg(t, T.snap1 - 0.42, T.snap1);
      const lift = seg(t, T.lift, T.lift + 0.4, S.co); p.cy -= 80 * lift; p.a = 1 - lift; return p; }
    if (id === 1) { const p = { ...base(1), label: '+1', plot: 'p1', out: 'num' }; p.cx += (CHAIN[1] - REST[1]) * seg(t, T.snap1 - 0.3, T.snap1);
      p.sockRed = win(t, T.contact - 0.03, T.back + 0.05, 0.06, 0.12); return p; }
    if (id === 2) { const p = { ...base(2), label: '≥ 5 ?', plot: 'ge5', out: 'bool' }; p.cx += (CHAIN[2] - REST[2]) * seg(t, T.snap2 - 0.36, T.snap2); return p; }
    if (id === 3) { if (t < T.newIn) return null; const ap = seg(t, T.newIn, T.newIn + 0.3, S.gl), w = wbase(Math.min(t, T.snap3));   // ×1, carried down into the slot
      return { cx: w.x + 30, cy: w.y + BELLY + PH / 2, w: PW, h: PH, L: 1, a: ap, sc: lerp(0.92, 1, ap), rot: 0, radii: [10, 10, 10, 10],
        inK: 1, outK: 1, labelA: 1, plotK: seg(t, T.newIn + 0.15, T.newIn + 0.6), label: '×1', plot: 'x1', out: 'num' }; }
    if (id === 4) { if (t < T.wrongIn) return null; const ap = seg(t, T.wrongIn, T.wrongIn + 0.3, S.gl), fall = seg(t, T.fall, T.fall + 0.65, S.co), w = wbase(Math.min(t, T.fall));
      return { cx: w.x + 30, cy: w.y + BELLY + WRONG.h / 2 + 560 * fall, w: WRONG.w, h: WRONG.h, L: 1, a: ap * (1 - seg(t, T.fall + 0.3, T.fall + 0.65)), sc: lerp(0.92, 1, ap),
        rot: 0.35 * fall, radii: [10, 10, 10, 10], inK: 0, outK: 1, labelA: 1, plotK: 0, label: 'text', out: 'text', red: win(t, T.contact - 0.03, T.back + 0.05, 0.06, 0.12), small: true }; }
  }

  function shapePath(c, kind, x, y, r, half) {
    c.beginPath();
    if (kind === 'num') { if (half) { c.moveTo(x, y - r); c.arc(x, y, r, -Math.PI / 2, Math.PI / 2, false); c.closePath(); } else c.arc(x, y, r, 0, Math.PI * 2); }
    else if (kind === 'bool') { if (half) c.rect(x, y - r, r, 2 * r); else c.rect(x - r, y - r, 2 * r, 2 * r); }
    else { if (half) { c.moveTo(x, y - r); c.lineTo(x + r * 1.25, y); c.lineTo(x, y + r); c.closePath(); } else { c.moveTo(x - r, y + r * 0.85); c.lineTo(x, y - r); c.lineTo(x + r, y + r * 0.85); c.closePath(); } }
  }
  function drawPlot(c, kind, x, y, w, h, k) {
    if (k <= 0) return; c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = rgba(SOFT, 0.6); c.lineWidth = 2; c.beginPath(); c.moveTo(x - w / 2, y - h); c.lineTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 4.5; c.beginPath(); const f = PLOT[kind], N = 48; let first = true;
    for (let j = 0; j <= N * k; j++) { const u = j / N, v = f(u); if (v > 1.02) break; const px = x - w / 2 + u * w, py = y - clamp(v) * h;
      if (kind === 'ge5' && j > 0 && f((j - 1) / N) !== v) c.lineTo(px, y - clamp(f((j - 1) / N)) * h);
      first ? c.moveTo(px, py) : c.lineTo(px, py); first = false; }
    c.stroke(); c.restore();
  }
  function tick(c, x, y, s, k, col, lw) {   // a drawn check: two strokes, revealed by k
    if (k <= 0) return; const P = [[x - s, y], [x - s * 0.3, y + s * 0.7], [x + s, y - s * 0.8]], L1 = Math.hypot(s * 0.7, s * 0.7), L2 = Math.hypot(s * 1.3, s * 1.5), d = k * (L1 + L2);
    c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(...P[0]);
    if (d <= L1) c.lineTo(lerp(P[0][0], P[1][0], d / L1), lerp(P[0][1], P[1][1], d / L1)); else { c.lineTo(...P[1]); const q = (d - L1) / L2; c.lineTo(lerp(P[1][0], P[2][0], q), lerp(P[1][1], P[2][1], q)); }
    c.stroke(); c.restore();
  }
  function drawPart(c, p, active = 0, check = 0) {
    if (!p || p.a <= 0.002) return;
    c.save(); c.globalAlpha *= p.a; c.translate(p.cx, p.cy); c.rotate(p.rot); c.scale(p.sc, p.sc);
    const w = p.w, h = p.h, x0 = -w / 2, y0 = -h / 2, x1 = w / 2, y1 = h / 2, [rtl, rtr, rbr, rbl] = p.radii, nr = JR * (p.inK || 0);
    c.beginPath(); c.moveTo(x0 + rtl, y0); c.lineTo(x1 - rtr, y0); c.arcTo(x1, y0, x1, y0 + rtr, rtr); c.lineTo(x1, y1 - rbr); c.arcTo(x1, y1, x1 - rbr, y1, rbr);
    c.lineTo(x0 + rbl, y1); c.arcTo(x0, y1, x0, y1 - rbl, rbl);
    if (nr > 0.5) { c.lineTo(x0, nr); c.arc(x0, 0, nr, Math.PI / 2, -Math.PI / 2, true); }
    c.lineTo(x0, y0 + rtl); c.arcTo(x0, y0, x0 + rtl, y0, rtl); c.closePath();
    c.fillStyle = mix(mix(INK, PART, p.L), YEL, 0.92 * active); c.fill();
    c.lineJoin = 'round'; c.strokeStyle = rgba(INK, p.L); c.lineWidth = 2.5; c.stroke();
    if (p.red > 0.01) { c.strokeStyle = rgba(RED, p.red); c.lineWidth = 4.5; c.stroke(); }
    if (p.sockRed > 0.01 && nr > 0.5) { c.strokeStyle = rgba(RED, p.sockRed); c.lineWidth = 4.5; c.beginPath(); c.arc(x0, 0, nr, Math.PI / 2, -Math.PI / 2, true); c.stroke(); }
    if (p.out && p.outK > 0.01) { const r = JR * p.outK; shapePath(c, p.out, x1, 0, r, true); c.fillStyle = TYPE[p.out]; c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
      if (p.red > 0.01) { c.strokeStyle = rgba(RED, p.red); c.lineWidth = 4.5; c.stroke(); } }
    if (p.small) text(c, p.label, -6, 14, { f: 'disp', size: 46, col: INK, align: 'center', a: p.labelA });
    else { text(c, p.label, 0, y0 + 78, { f: 'sans', size: 60, col: INK, align: 'center', a: p.labelA }); drawPlot(c, p.plot, 0, y1 - 30, 150, 66, p.plotK); }
    if (check > 0) { const cx = x1 - 40, cy = y0 + 40; c.save(); c.globalAlpha *= clamp(check * 3); c.fillStyle = YEL; c.beginPath(); c.arc(cx, cy, 25 * S.gl(clamp(check * 2)), 0, Math.PI * 2); c.fill();
      c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); c.restore(); tick(c, cx, cy + 1, 13, clamp(check * 1.4 - 0.3), INK, 4.4); }
    c.restore();
  }
  function arrow(c, xa, xb, y, k, a = 1) {
    if (k <= 0 || a <= 0) return; const xe = lerp(xa, xb, k); c.save(); c.globalAlpha *= a; c.strokeStyle = INK; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(xa, y); c.lineTo(xe, y); c.stroke(); if (k > 0.85) { c.beginPath(); c.moveTo(xe - 15, y - 11); c.lineTo(xe, y); c.lineTo(xe - 15, y + 11); c.stroke(); } c.restore();
  }

  // ---------------- chips: the value that flows ----------------
  function drawChip(c, x, y, val, sy, sc, a) {
    if (a <= 0.002 || sc <= 0.002) return; c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(sc, sc * Math.max(0.06, sy)); c.lineWidth = 2.5; c.strokeStyle = INK;
    if (val === '?') { c.setLineDash([7, 7]); c.fillStyle = PART; c.beginPath(); c.arc(0, 0, CR, 0, Math.PI * 2); c.fill(); c.stroke(); c.setLineDash([]); text(c, '?', 0, 19, { f: 'disp', size: 58, col: INK, align: 'center' }); }
    else if (typeof val === 'number') { c.fillStyle = SAL; c.beginPath(); c.arc(0, 0, CR, 0, Math.PI * 2); c.fill(); c.stroke(); text(c, String(val), 0, 17, { f: 'sans', size: 48, col: INK, align: 'center' }); }
    else { c.fillStyle = SLA; c.beginPath(); c.rect(-CR, -CR, 2 * CR, 2 * CR); c.fill(); c.stroke(); text(c, val, 1, 8, { f: 'monoB', size: 22, col: PAPER, align: 'center', track: 0.08 }); }
    c.restore();
  }
  function runState(t, popT, swaps, outT, vals, mv, fl, fadeAt) {
    if (t < popT) return null;
    const stops = [...swaps.map(s => s - fl), outT], xs = [START, ...CHAIN, OUT]; let x = START;
    for (let k = 0; k < stops.length; k++) { const t1 = stops[k], t0 = t1 - mv; if (t >= t0) x = lerp(xs[k], xs[k + 1], seg(t, t0, t1)); }
    let v = vals[0], sy = 1, ring = 0, rr = 0;
    swaps.forEach((s, k) => { if (t >= s) v = vals[k + 1]; const d = (t - (s - fl)) / (2 * fl); if (d >= 0 && d <= 1) sy = Math.abs(Math.cos(Math.PI * d)); const r = (t - s) / 0.5; if (r >= 0 && r < 1 && 1 - r > ring) { ring = 1 - r; rr = r; } });
    const ro = (t - outT) / 0.6; if (ro >= 0 && ro < 1 && 1 - ro > ring) { ring = 1 - ro; rr = ro; }
    return { x, v, sy, sc: seg(t, popT, popT + 0.25, S.gl), a: 1 - seg(t, fadeAt, fadeAt + 0.45, S.co), ring, rr };
  }
  const run1 = t => runState(t, T.chipIn1, T.run1, T.out1, [3, 6, 7, 'yes'], 0.85 * B, 0.12, T.act5);
  const run2 = t => runState(t, T.chipIn2, T.run2, T.out2, [3, 3, 4, 'no'], 0.85 * B, 0.12, T.act6);

  // ---------------- the pod: carries the value (always behind the chip) ----------------
  const cub = (p0, p1, p2, p3, u) => { const v = 1 - u; return v * v * v * p0 + 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u * p3; };
  const quad = (p0, p1, p2, u) => (1 - u) * (1 - u) * p0 + 2 * u * (1 - u) * p1 + u * u * p2;
  const PB = POD + 2;
  function podBase(t) {
    if (t < T.podIn) return null;
    if (t < T.chipIn1) { const w = wbase(T.podIn), u = seg(t, T.podIn, T.chipIn1); return { x: quad(w.x + 30, START - PB, START - PB, u), y: quad(w.y + 50, w.y + 50, CY, u), s: seg(t, T.podIn, T.podIn + 0.3, S.gl) }; }
    if (t < T.podBack) { const r = run1(t); return { x: r.x - PB, y: CY, s: 1 }; }
    if (t < T.chipIn2 - 0.3) { const u = seg(t, T.podBack, T.chipIn2 - 0.3); return { x: cub(OUT - PB, 1720, 60, START - PB, u), y: cub(CY, 1090, 1090, CY, u), s: 1 }; }
    if (t < b(49)) { const r = run2(t); return { x: r ? r.x - PB : START - PB, y: CY, s: 1 }; }
    const w = wpos(t), u = seg(t, b(49), b(51)); return { x: lerp(OUT - PB, w.x + 60, u), y: lerp(CY, w.y + 78, u), s: lerp(1, 0.75, u) };
  }
  function podAng(t) { const a = podBase(t - 1 / 120), c2 = podBase(t + 1 / 120); if (!a || !c2) return 0; const dx = c2.x - a.x, dy = c2.y - a.y; return Math.hypot(dx, dy) < 0.6 ? 0 : Math.atan2(dy, dx); }

  // ---------------- drawFrame ----------------
  function drawFrame(c, t) {
    t = clamp(t, 0, DUR);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
    const cm = cam(t); c.setTransform(cm.z, 0, 0, cm.z, cm.ax - cm.x * cm.z, cm.ay - cm.y * cm.z);

    // ---- act 1: one big box draws itself in; a value goes in, a question comes out ----
    const a1 = 1 - seg(t, T.split, T.split + 0.3, S.co);
    if (a1 > 0) {
      arrow(c, 190, 440, CY, seg(t, b(1), b(2)), a1);
      const absorb = seg(t, b(3) - 0.1, b(3) + 0.15, S.co);
      drawChip(c, lerp(250, 420, seg(t, b(2), b(3))), CY, 3, 1, seg(t, b(1.5), b(1.5) + 0.25, S.gl) * (1 - absorb), 1);
      arrow(c, 1380, 1650, CY, seg(t, b(3), b(3.6)), a1);
      drawChip(c, 1580, CY, '?', 1, seg(t, b(4), b(4) + 0.3, S.gl), a1);
    }
    if (t < T.split) {
      const dk = seg(t, 0.2, 0.75, S.wm), fk = seg(t, 0.55, 0.95, S.gl), bump = t >= b(3) ? 1 + 0.01 * Math.exp(-(t - b(3)) * 10) : 1;
      c.save(); c.translate(BOX.x + BOX.w / 2, CY); c.scale(bump, bump);
      const per = 2 * (BOX.w + BOX.h); c.beginPath(); c.roundRect(-BOX.w / 2, -BOX.h / 2, BOX.w, BOX.h, 14);
      if (fk > 0) { c.fillStyle = rgba(INK, fk); c.fill(); }
      if (dk > 0 && fk < 1) { c.setLineDash([per * dk, per]); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); c.setLineDash([]); }
      text(c, 'AI', 0, 58, { f: 'disp', size: 170, col: PAPER, align: 'center', a: seg(t, 0.8, 1.15, S.gl) });
      for (let k = 0; k < 2; k++) { const kk = seg(t, T.crack + k * 0.12, T.crack + k * 0.12 + 0.16); if (kk <= 0) continue; const x = -BOX.w / 2 + 300 * (k + 1);
        c.strokeStyle = PAPER; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, -BOX.h / 2 - 2); for (let j = 1; j <= 8 * kk; j++) c.lineTo(x + ((j % 2) ? 6 : -6), -BOX.h / 2 + j * BOX.h / 8); c.stroke(); }
      c.restore();
    }

    // ---- the composition line ----
    const lk = seg(t, T.line, T.line + 0.45);
    if (lk > 0) { arrow(c, LINE0, LINE1, CY, lk, 1); c.fillStyle = INK; c.beginPath(); c.arc(LINE0, CY, 6, 0, Math.PI * 2); c.fill(); }

    // ---- type legend (act 3) ----
    const lg = seg(t, T.legend, T.legend + 0.35, S.gl) * (1 - seg(t, b(23), b(23.6), S.co));
    if (lg > 0) { c.save(); c.globalAlpha = lg;
      [['num', 'number', 900], ['bool', 'yes / no', 1100], ['text', 'text', 1320]].forEach(([k, lb, x]) => { shapePath(c, k, x, 902, 11, false); c.fillStyle = TYPE[k]; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
        text(c, lb, x + 24, 909, { f: 'mono', size: 18, col: SOFT, track: 0.14 }); }); c.restore(); }

    // ---- traces (READ-driven), with the effect underlined ----
    const dim = 1 - 0.5 * seg(t, T.act5, T.act5 + 0.3);
    for (const r of READ) { if (r.kind !== 'trace') continue; const a = win(t, r.in, r.out, r.fi, r.fo); if (a <= 0) continue;
      const old = r.id.endsWith('a'), p0 = partState(0, t), x = r.id === 'tr0a' ? p0.cx : CHAIN[r.slot], yo = (1 - S.df(clamp((t - r.in) / r.fi))) * 8;
      const tw = text(c, r.html, x, TRY + yo, { f: 'mono', size: 22, col: INK, align: 'center', track: 0.06, a: a * (old ? dim : 1) * (r.id === 'tr0a' ? p0.a : 1) });
      if (r.id === 'tr2b') { const u = seg(t, T.under, T.under + 0.4); if (u > 0) { c.strokeStyle = SAL; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - tw / 2 - 6, TRY + 16); c.lineTo(x - tw / 2 - 6 + (tw + 12) * u, TRY + 16); c.stroke(); } } }

    // ---- parts ----
    const r1 = run1(t), r2 = run2(t), chips = [r1, r2].filter(r => r && r.a > 0);
    const act = cx => chips.reduce((m, r) => Math.max(m, r.a * clamp(1 - Math.abs(r.x - cx) / 160) ** 0.7), 0);
    const chk = i => seg(t, T.checks[i] - 0.12, T.checks[i] + 0.3);
    if (t >= T.split) {
      const held = id => id === 4 || (id === 3 && t < T.snap3);   // carried parts are drawn in front of the whale
      [[4, 0], [0, 0], [3, chk(0)], [1, chk(1)], [2, chk(2)]].forEach(([id, ck]) => { const p = partState(id, t); if (p && !held(id)) drawPart(c, p, act(p.cx), ck); });
      const ai = 1 - seg(t, T.split, T.split + 0.22, S.co);
      if (ai > 0) text(c, 'AI', BOX.x + BOX.w / 2, CY + 58, { f: 'disp', size: 170, col: PAPER, align: 'center', a: ai });
    }

    // ---- snaps: pulse ring + tick at each joint ----
    for (const [ts, jx] of [[T.snap1, CHAIN[0] + PW / 2], [T.snap2, CHAIN[1] + PW / 2], [T.snap3, CHAIN[0] + PW / 2]]) {
      const d = t - ts; if (d < 0 || d > 2.2) continue; const u = clamp(d / 0.55);
      if (u < 1) { c.strokeStyle = rgba(SAL, (1 - u) * 0.95); c.lineWidth = 3.5; c.beginPath(); c.arc(jx, CY, JR + 8 + 60 * S.gl(u), 0, Math.PI * 2); c.stroke(); }
      c.save(); c.globalAlpha = 1 - seg(t, ts + 1.6, ts + 2.2, S.co); tick(c, jx, CY - PH / 2 - 34, 13, seg(t, ts, ts + 0.22), INK, 4); c.restore();
    }

    // ---- value chips + pod ----
    for (const r of chips) if (r.ring > 0) { c.strokeStyle = rgba(SAL, r.ring * 0.9 * r.a); c.lineWidth = 3; c.beginPath(); c.arc(r.x, CY, CR + 6 + 40 * S.gl(r.rr), 0, Math.PI * 2); c.stroke(); }
    const pb = podBase(t);
    if (pb && pb.s > 0.01) { const ang = podAng(t); c.save(); c.translate(pb.x, pb.y); c.rotate(ang); if (Math.cos(ang) < 0) c.scale(1, -1); KH.drawPod(c, 0, 0, 0, POD * pb.s, C.mist, { ink: INK }); c.restore(); }
    for (const r of chips) drawChip(c, r.x, CY, r.v === 'yes' ? 'YES' : r.v === 'no' ? 'NO' : r.v, r.sy, r.sc, r.a);

    // ---- the little whale ----
    if (t > 3.3) {
      const p = wpos(t), ang = heading(t), v = wvel(t), sp = Math.hypot(v.x, v.y), mv = clamp(sp / 300);
      const tailF = 4 + 6 * mv, tailA = 0.1 + 0.24 * mv;
      const spark = 0.95 * seg(t, T.spark - 0.05, T.spark + 0.12, S.gl) * (1 - seg(t, b(11.5), b(12.6), S.co));
      const carrying = (t >= T.wrongIn && t < T.fall) || (t >= T.newIn && t < T.snap3);
      const focus = Math.max(win(t, b(17.3), T.back + 0.1, 0.15, 0.2), win(t, b(39.8), T.snap3 + 0.1, 0.15, 0.2));
      let blink = 0; for (const tb of [b(12.2), T.back + 0.3, b(25.7), b(35.3), b(44.8), T.whaleEnd + 0.2]) blink = Math.max(blink, 1 - Math.abs(t - tb) / 0.07);
      const delight = t >= T.whaleEnd + 0.2 ? 1 : 0;
      const mouth = Math.max(0.35 * win(t, T.snap3, T.snap3 + 0.9, 0.1, 0.3), 0.5 * seg(t, T.whaleEnd + 0.2, T.whaleEnd + 0.55));
      if (mv > 0.05 && !carrying) { const cols = [SAL, SLA, UMB]; for (let k = 0; k < 3; k++) { const pts = [];
          for (let j = 0; j <= 12; j++) { const tt = t - j * 0.014, q = wpos(tt), hh = heading(tt); pts.push([q.x - Math.cos(hh) * 124, q.y - Math.sin(hh) * 124 + (k - 1) * 12]); }
          const len = Math.hypot(pts[0][0] - pts[12][0], pts[0][1] - pts[12][1]); if (len < 30) continue;
          c.strokeStyle = rgba(cols[k], 0.6 * clamp((len - 30) / 70)); c.lineWidth = 3 - k * 0.5; c.lineCap = 'round'; c.beginPath(); pts.forEach(([x, y], j) => j ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); } }
      KH.drawWhale(c, { x: p.x, y: p.y, ang, scale: SCALE, L: 1, tail: Math.sin(t * tailF) * tailA, fin: Math.sin(t * tailF + 1.3) * (0.12 + 0.2 * mv), eye: spark > 0.1 ? 1.2 : 1,
        blink, focus, delight, mouth, spark, sparkColor: UMB, blush: lerp(0.6, 1, delight), sw: 3.4 });
    }
    if (t >= T.wrongIn && t < T.fall + 0.7) drawPart(c, partState(4, t), 0, 0);
    if (t >= T.newIn && t < T.snap3) drawPart(c, partState(3, t), act(CHAIN[0]), 0);

    // ---------------- chrome (screen space) ----------------
    c.setTransform(1, 0, 0, 1, 0, 0);
    const ch = ramp(t, 0.2, 0.6) * (1 - seg(t, T.title - 0.3, T.title + 0.1, S.co));
    if (ch > 0) { text(c, 'CETI · Composition', 160, 130, { f: 'mono', size: 15, col: SOFT, a: ch });
      const ai = ACTS.reduce((m, a, i) => (t >= a - 0.05 ? i : m), 0);
      text(c, `${String(ai + 1).padStart(2, '0')} / ${String(ACTS.length).padStart(2, '0')}`, 1760, 130, { f: 'mono', size: 15, col: SOFT, a: ch, align: 'right' }); }
    for (const r of READ) { if (r.kind !== 'cap') continue; const a = win(t, r.in, r.out, r.fi, r.fo); if (a <= 0) continue;
      const end = r.id === 'end', rise = (1 - S.df(clamp((t - r.in) / r.fi))) * 12;
      text(c, r.html, 160, 250 + rise, { f: 'disp', size: end ? 96 : 88, col: INK, accent: ACC, a }); }
    const ea = seg(t, T.title, T.title + 0.5);
    if (ea > 0) text(c, 'CETI · Compositional AI', 160, 130, { f: 'mono', size: 15, col: SOFT, a: ea });
    const ma = seg(t, T.mark, T.mark + 0.5);
    if (ma > 0) { whaleMark(c, 160, 935, 0.7, INK, ma); text(c, 'cetiai.co', 252, 966, { f: 'mono', size: 16, col: SOFT, a: ma }); }
    c.restore();
  }

  // ---------------- score cue sheet: every sound lands on a drawn event ----------------
  function cues() {
    return { bpm: BPM, dur: DUR, beat: B,
      box: 0.2, arrows: [b(1), b(3)], pops: [b(1.5), b(4), T.wrongIn, T.chipIn1, T.chipIn2, T.newIn], absorb: b(3), cracks: [T.crack, T.crack + 0.12], split: T.split,
      labels: [b(8), b(8.5), b(9)], spark: T.spark, joints: [T.joints, T.joints + B / 2, T.joints + B], reject: T.contact, fall: T.fall, line: T.line,
      snaps: [T.snap1, T.snap2, T.snap3], pod: T.podIn,
      steps: [...T.run1.map((s, i) => ({ t: s, deg: [5, 6, 8][i] })), ...T.run2.map((s, i) => ({ t: s, deg: [2, 3, 1][i] }))],
      outs: [{ t: T.out1, deg: 8 }, { t: T.out2, deg: 1 }], swap: T.lift, push: b(40), podBack: T.podBack, under: T.under,
      checks: T.checks, whale: [3.35, T.carry, b(47)], chord: T.title, pulse: [T.split, T.act6], pad: T.act6, mark: T.mark };
  }
  return { drawFrame, cues, READ, DUR, W, H, fps: FPS, wpos, heading, cam, T, shutter: () => [3, 0.5] };
}
root.COMPOSITION = { makeFilm };
})(typeof window !== 'undefined' ? window : globalThis);
