// Signal — a 30-second kinetic film in Kinetic Hydrography 1.0.0.
// drawFrame(ctx, t) is a pure function of t. All timing hangs off a 120 BPM beat grid (B = 0.5 s).
(function (root) {
'use strict';
const KH = root.KH, { CETI: C, W: WD, clamp, lerp, smoothstep, win, EASE, ramp, rng, mix, rgba, text, whaleMark, bearingRing } = KH;
const W = 1920, H = 1080, DUR = 30, B = 0.5, CX = 960, CY = 540;
const RED = WD.englishRed, VIO = WD.violetBlue, SAL = WD.ochraceousSalmon, SIG = WD.lightGlaucousBlue, NAP = WD.naplesYellow;
const beatT = n => n * B;

// ---------- looks over time ----------
const Lt = t => EASE.rest(clamp((t - 13) / 4));           // 0 = paper (the feed), 1 = navy (the signal)
// dusk passes through Violet Blue (Wada 339), never through flat grey
const ground = t => { const k = Lt(t); return k < 0.5 ? mix(C.paper, VIO, EASE.warm(k * 2)) : mix(VIO, C.navy, EASE.rest((k - 0.5) * 2)); };
const ink = t => mix(C.navy, C.paper, smoothstep(0.22, 0.42, Lt(t)));
const soft = t => mix(C.slate, C.fog, smoothstep(0.22, 0.42, Lt(t)));

// ---------- camera: whips, kick pulses, slow push ----------
const WHIPS = [[7.5, -260], [9.5, -260], [11.5, 520]];
const camX = t => WHIPS.reduce((a, [t0, d]) => a + d * (t0 === 11.5 ? ramp(t, t0, t0 + 0.5, EASE.warm) : ramp(t, t0, t0 + 0.18, EASE.glaser)), 0);
function kick(t) { if (t < 4 || t >= 16) return 0; const b = Math.floor(t / B) * B; if (t >= 12 && Math.floor(t / B) % 2) return 0; return Math.exp(-(t - b) * 12); }
const zoom = t => 1 + 0.014 * kick(t) + 0.05 * ramp(t, 20, 24, EASE.rest) - 0.05 * ramp(t, 24, 26, EASE.rest);

// ---------- lanes: kinetic type at different depths (size = nearness = speed) ----------
const WORDS = ['Breaking', 'New model', '10x faster', 'You are behind', 'Must-read', 'Hot take', 'Update 4.0', 'Act now', 'Trending', 'Another framework', 'Live', 'Do not miss', 'Ranked', 'Unread', 'Limited', 'Thread', 'Just dropped', 'Viral'];
const LANES = [
  { y: 250, size: 30, f: 'monoB', col: RED, stroke: 0, v: 320, dir: 1, beat: 8 },
  { y: 352, size: 96, f: 'monoB', col: RED, stroke: 2.2, v: 820, dir: -1, beat: 9 },
  { y: 412, size: 18, f: 'mono', col: C.navy, stroke: 0, v: 180, dir: 1, beat: 10 },
  { y: 520, size: 72, f: 'monoB', col: VIO, stroke: 0, v: 640, dir: 1, beat: 11 },
  { y: 598, size: 24, f: 'mono', col: C.slate, stroke: 0, v: 260, dir: -1, beat: 12 },
  { y: 730, size: 120, f: 'monoB', col: SAL, stroke: 2.6, v: 980, dir: -1, beat: 13 },
  { y: 830, size: 40, f: 'monoB', col: VIO, stroke: 1.6, v: 420, dir: 1, beat: 14 },
  { y: 940, size: 56, f: 'monoB', col: RED, stroke: 0, v: 560, dir: -1, beat: 15 },
];
let LAID = false;
function layout(c) {
  if (LAID) return; LAID = true; const R = rng(21);
  LANES.forEach((L, li) => { c.save(); c.font = `${L.size}px ${KH.FONTS[L.f]}`; if ('letterSpacing' in c) c.letterSpacing = `${(L.size * 0.08).toFixed(1)}px`;
    L.items = []; let ox = 0; const gap = L.size * 1.1;
    while (ox < 2700) { const w0 = WORDS[Math.floor(R() * WORDS.length)].toUpperCase(), w = c.measureText(w0).width; L.items.push({ s: w0, ox, w, id: `L${li}:${L.items.length}` }); ox += w + gap; }
    L.span = ox; c.restore(); });
}
// travelled distance multiplier: full speed until 12 s, then decelerates to rest by 13 s
const S = (() => { const tab = []; let acc = 12; for (let i = 0; i <= 600; i++) { tab.push(acc); const tt = 12 + i / 600; acc += (1 - EASE.warm(clamp(tt - 12))) / 600; } return t => t < 12 ? t : tab[Math.min(600, Math.round((t - 12) * 600))]; })();
function laneX(L, it, t) {
  const enter = (1 - ramp(t, beatT(L.beat), beatT(L.beat) + 0.35, EASE.glaser)) * 2200;
  const raw = it.ox + L.dir * L.v * S(t);
  const x = ((raw % L.span) + L.span) % L.span - 360;
  return x + enter + camX(t) * (L.size / 90);
}

// ---------- pills and dots (world-fixed, so the whips reveal new ones) ----------
const PILL_LABELS = ['12 new', 'Live', '+3', 'Breaking', '9 unread', 'Now', '+27', 'Alert', 'Hot', 'New', '+1', 'Trending'];
const KEEP = [{ sx: 420, sy: 300, label: 'Question' }, { sx: 1500, sy: 262, label: 'Context' }, { sx: 300, sy: 800, label: 'Source' }, { sx: 1580, sy: 812, label: 'Test' }, { sx: 980, sy: 900, label: 'Decision' }];
const PILLS = [], DOTS = [];
{ const R = rng(9); let k = 0;
  for (let b = 12; b < 24; b++) for (let j = 0; j < 2; j++) {
    const tb = beatT(b) + j * 0.12, keepIdx = (b < 15 && j === 0) ? (b - 12) : (b === 15 && j === 0 ? 3 : (b === 16 && j === 0 ? 4 : -1));
    const kp = keepIdx >= 0 ? KEEP[keepIdx] : null;
    const sx = kp ? kp.sx : 160 + R() * 1600, sy = kp ? kp.sy : 200 + R() * 760;
    PILLS.push({ id: 'P' + (k++), tb, wx: sx - camX(tb), wy: sy, label: kp ? '+' + (3 + keepIdx * 4) : PILL_LABELS[Math.floor(R() * PILL_LABELS.length)],
      col: [RED, VIO, SAL][Math.floor(R() * 3)], outline: R() < 0.3, keep: keepIdx, calm: kp ? kp.label : null }); }
  for (let b = 8; b < 24; b++) for (let j = 0; j < 25; j++) { const tb = beatT(b) + R() * B; DOTS.push({ tb, wx: R() * 1920 - camX(tb), wy: 170 + R() * 860, r: 1.6 + R() * 3.4, col: [RED, VIO, SAL][Math.floor(R() * 3)] }); } }

// ---------- the filter: a sweep decides every item it passes ----------
const SWEEP0 = 13.0, REV = 2.0, A0 = -Math.PI / 2;
const sweepAng = t => A0 + Math.max(0, t - SWEEP0) / REV * Math.PI * 2;
function decideAt(x, y) { const phi = Math.atan2(y - CY, x - CX); const d = (((phi - A0) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); return SWEEP0 + d / (Math.PI * 2) * REV; }
const onScreen = (x, y) => x > -120 && x < W + 120 && y > -60 && y < H + 60;
let DECIDE = null;
function decisions(c) {
  if (DECIDE) return DECIDE; layout(c); const list = [];
  LANES.forEach(L => L.items.forEach(it => { const x = laneX(L, it, 13), xm = x + it.w / 2; it.td = onScreen(xm, L.y) ? decideAt(xm, L.y - L.size * 0.35) : 13; if (onScreen(xm, L.y)) list.push({ t: it.td, kind: 'drop' }); }));
  PILLS.forEach(p => { const x = p.wx + camX(13); p.td = onScreen(x, p.wy) ? decideAt(x, p.wy) : 13; if (onScreen(x, p.wy)) list.push({ t: p.td, kind: p.keep >= 0 ? 'keep' : 'drop' }); });
  DOTS.forEach(d => { const x = d.wx + camX(13); d.td = onScreen(x, d.wy) ? decideAt(x, d.wy) : 13; });
  list.sort((a, b) => a.t - b.t); DECIDE = list; return list;
}

// ---------- the line: kept items become points on a rising line ----------
const PTS = [[420, 700], [690, 610], [960, 520], [1230, 420], [1500, 330]];
const COLUMN = i => [1640, 300 + i * 120];
const landT = i => 18.2 + i * 0.5;
function chartY(x) { if (x <= PTS[0][0]) return PTS[0][1]; if (x >= PTS[4][0]) return PTS[4][1];
  for (let i = 0; i < 4; i++) if (x <= PTS[i + 1][0]) { const u = (x - PTS[i][0]) / (PTS[i + 1][0] - PTS[i][0]); return lerp(PTS[i][1], PTS[i + 1][1], u); } }

// ---------- drawing ----------
function pill(c, x, y, label, fill, fg, outline, a, scale = 1) {
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(scale, scale); c.font = `17px ${KH.FONTS.monoB}`; if ('letterSpacing' in c) c.letterSpacing = '3px';
  const s = label.toUpperCase(), w = c.measureText(s).width + 38, h = 38; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 19);
  if (outline) { c.strokeStyle = fill; c.lineWidth = 2.2; c.stroke(); } else { c.fillStyle = fill; c.fill(); }
  c.fillStyle = outline ? fill : fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, 0, 1); c.restore();
}

function drawFrame(c, t) {
  t = clamp(t, 0, DUR); layout(c); decisions(c);
  const L = Lt(t), INK = ink(t), SOFT = soft(t);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
  c.fillStyle = ground(t); c.fillRect(0, 0, W, H);
  const z = zoom(t); c.save(); c.translate(CX, CY); c.scale(z, z); c.translate(-CX, -CY);

  // ===== cold open: a pulse finds the beat, the beat grid draws, the title lands =====
  if (t < 4.2) {
    const out = ramp(t, 3.5, 3.85, EASE.collect) * -2400;
    c.save(); c.translate(out, 0);
    const lineK = ramp(t, 1.0, 1.6);
    if (lineK > 0) { c.strokeStyle = rgba(C.slate, 0.55); c.lineWidth = 1; c.beginPath(); c.moveTo(CX - 860 * lineK, 640); c.lineTo(CX + 860 * lineK, 640); c.stroke();
      for (let k = -7; k <= 7; k++) { const tk = 1.0 + Math.abs(k) * 0.06; const a = ramp(t, tk, tk + 0.2); if (a <= 0) continue; const tall = k % 4 === 0;
        c.fillStyle = rgba(C.slate, 0.7 * a); c.fillRect(CX + k * 120 - 1, tall ? 622 : 630, 2, tall ? 36 : 20); } }
    // the playhead walks the grid on the beat
    if (t > 1.6) { const n = Math.floor((t - 1.6) / B), px = CX - 840 + Math.min(n, 14) * 120; c.fillStyle = RED; c.fillRect(px - 1, 612, 2, 56); }
    // title
    const tk = ramp(t, 2.0, 2.35, EASE.glaser);
    let titleEnd = CX;
    if (t >= 2.0) { c.save(); c.globalAlpha = clamp((t - 2.0) / 0.1); c.translate(CX, 520); const s = lerp(1.08, 1, tk); c.scale(s, s);
      const w = text(c, 'Signal', 0, 0, { f: 'disp', size: 230, col: C.navy, align: 'center' }); c.restore(); titleEnd = CX + w / 2 * 1; }
    // the pulse: one red dot, then it becomes the title's full stop
    const bt = t % B, pulse = Math.exp(-bt * 9);
    const dk = ramp(t, 2.0, 2.4, EASE.glaser), dx = lerp(CX, titleEnd + 26, dk), dy = lerp(520, 516, dk);
    c.fillStyle = RED; c.beginPath(); c.arc(dx, dy, lerp(7 + 12 * pulse, 15, dk), 0, Math.PI * 2); c.fill();
    if (t < 2.0) { c.strokeStyle = rgba(RED, 0.5 * pulse); c.lineWidth = 1.5; c.beginPath(); c.arc(CX, 520, 20 + 70 * (1 - pulse), 0, Math.PI * 2); c.stroke(); }
    text(c, 'CETI · A film in 30 seconds', CX, 720, { f: 'mono', size: 15, col: C.slate, align: 'center', a: ramp(t, 2.5, 2.9) });
    c.restore();
  }

  // ===== the feed: lanes, pills, dots =====
  if (t >= 4 && t < 18) {
    const cam = camX(t);
    // dots
    for (const d of DOTS) { if (t < d.tb) continue; const x = d.wx + cam, y = d.wy; let a = ramp(t, d.tb, d.tb + 0.12), r = d.r;
      if (t > d.td) { const k = clamp((t - d.td) / 0.35); a *= 1 - k; r *= 1 - 0.6 * k; } if (a <= 0.01) continue;
      c.fillStyle = rgba(d.col, 0.85 * a); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
    // lanes
    for (const Ln of LANES) { if (t < beatT(Ln.beat)) continue; const la = clamp((t - beatT(Ln.beat)) / 0.12);
      for (const it of Ln.items) { let x = laneX(Ln, it, t), y = Ln.y, a = la, col = Ln.col, rot = 0;
        if (x > W + 60 || x + it.w < -60) continue;
        if (t > it.td) { const dt = t - it.td; y += 900 * dt * dt + 60 * dt; a *= 1 - clamp(dt / 0.9); col = mix(Ln.col, L > 0.5 ? C.fog : C.slate, clamp(dt / 0.2)); rot = dt * 0.25 * (it.w % 2 ? 1 : -1); }
        if (a <= 0.01 || y > H + 200) continue;
        c.save(); c.translate(x, y); c.rotate(rot); text(c, it.s, 0, 0, { f: Ln.f, size: Ln.size, col, a, stroke: Ln.stroke && t <= it.td ? Ln.stroke : (t > it.td ? 1.2 : 0), track: 0.08 }); c.restore(); } }
    // pills
    for (const p of PILLS) { if (t < p.tb) continue; let x = p.wx + cam, y = p.wy; const sIn = lerp(0.55, 1, ramp(t, p.tb, p.tb + 0.16, EASE.glaser)); let a = clamp((t - p.tb) / 0.06);
      if (p.keep >= 0) continue;
      if (t > p.td) { const dt = t - p.td; y += 900 * dt * dt; a *= 1 - clamp(dt / 0.8); }
      if (a <= 0.01) continue;
      pill(c, x, y, p.label, t > p.td ? mix(p.col, C.fog, 0.8) : p.col, C.paper, p.outline || t > p.td, a, sIn); }
  }
  // ===== the filter: bearing ring + sweep =====
  const ringA = win(t, 12.0, 17.2, 0.5, 0.8);
  if (ringA > 0) {
    const R = 270 * lerp(0.6, 1, ramp(t, 12.0, 12.6, EASE.glaser)) * lerp(1, 0.4, ramp(t, 16.4, 17.2, EASE.collect));
    bearingRing(c, CX, CY, R, (t - 12) * 0.05, INK, ringA * 0.85, true);
    if (t > SWEEP0 - 0.3) { const ang = sweepAng(t), sa = ringA * ramp(t, SWEEP0 - 0.3, SWEEP0);
      for (let k = 0; k < 28; k++) { const a0 = ang - (k + 1) * 0.03; c.beginPath(); c.moveTo(CX, CY); c.arc(CX, CY, R, a0, a0 + 0.031); c.closePath(); c.fillStyle = rgba(SIG, sa * 0.32 * (1 - k / 28) ** 2); c.fill(); }
      c.strokeStyle = rgba(SIG, sa); c.lineWidth = 2.4; c.beginPath(); c.moveTo(CX, CY); c.lineTo(CX + Math.cos(ang) * R, CY + Math.sin(ang) * R); c.stroke();
      c.strokeStyle = rgba(SIG, sa * 0.25); c.lineWidth = 1; c.beginPath(); c.moveTo(CX, CY); c.lineTo(CX + Math.cos(ang) * 1400, CY + Math.sin(ang) * 1400); c.stroke(); }
  }
  // ===== kept items: flip calm at the sweep, gather, then land as points on the line =====
  for (const p of PILLS) { if (p.keep < 0 || t < p.tb || t > 25) continue; const i = p.keep;
    const start = [p.wx + camX(t), p.wy]; let x = start[0], y = start[1];
    const g = ramp(t, 15.6 + i * 0.25, 16.3 + i * 0.25, EASE.glaser), col = COLUMN(i);
    x = lerp(x, col[0], g); y = lerp(y, col[1], g);
    const l = ramp(t, landT(i), landT(i) + 0.45, EASE.glaser); x = lerp(x, PTS[i][0], l); y = lerp(y, PTS[i][1], l);
    const calm = t > p.td, sIn = lerp(0.55, 1, ramp(t, p.tb, p.tb + 0.16, EASE.glaser)) * (calm ? lerp(1.12, 1, ramp(t, p.td, p.td + 0.3)) : 1);
    const fade = 1 - ramp(t, 24.0, 24.6);
    if (l < 1) pill(c, x, y, calm ? p.calm : p.label, calm ? SIG : p.col, C.navy, !calm && p.outline, (1 - l) * fade * clamp((t - p.tb) / 0.06), sIn * lerp(1, 0.3, l));
    if (l > 0) { c.save(); c.globalAlpha = l * fade; c.fillStyle = ground(t); c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fill(); c.strokeStyle = SIG; c.lineWidth = 2.6; c.stroke(); c.restore();
      text(c, p.calm, PTS[i][0], PTS[i][1] + 40, { f: 'mono', size: 12, col: SOFT, a: l * fade, align: 'center', track: 0.16 }); } }
  // ===== the line: grid, then a rising line through the kept points =====
  const gridA = win(t, 18.0, 24.2, 0.6, 1.0);
  if (gridA > 0) { for (let k = 0; k < 6; k++) { const y = 300 + k * 90, gk = ramp(t, 18.0 + k * 0.08, 18.7 + k * 0.08);
      c.strokeStyle = rgba(C.fog, 0.18 * gridA); c.lineWidth = 1; c.beginPath(); c.moveTo(360, y); c.lineTo(360 + 1200 * gk, y); c.stroke(); }
    text(c, 'Signal', 360, 270, { f: 'mono', size: 11, col: C.fog, a: gridA * 0.8 }); }
  // the line itself morphs into the calm wave
  if (t > 18.5) {
    const waveK = ramp(t, 24.0, 25.4, EASE.rest), endY = lerp(600, 800, ramp(t, 27.5, 28.3, EASE.rest)), amp = lerp(34, 18, ramp(t, 26, 30, EASE.rest));
    const drawTo = (() => { let x = PTS[0][0]; for (let i = 1; i < 5; i++) { const k = ramp(t, landT(i), landT(i) + 0.45); if (k <= 0) break; x = lerp(PTS[i - 1][0], PTS[i][0], k); } return x; })();
    const x0 = lerp(PTS[0][0], 0, waveK), x1 = lerp(drawTo, W, waveK);
    c.strokeStyle = SIG; c.lineWidth = lerp(3, 2.4, waveK); c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
    for (let i = 0; i <= 240; i++) { const x = lerp(x0, x1, i / 240), env = Math.sin(Math.PI * clamp(x / W));
      const yw = endY + Math.sin(x * 0.0062 - t * 1.1) * amp * env + Math.sin(x * 0.013 - t * 0.7) * amp * 0.25 * env;
      const y = lerp(chartY(x), yw, waveK); i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
  }
  c.restore(); // end zoom

  // ===== chrome =====
  for (const [a, b, lb] of [[4.0, 12.0, 'I · The feed'], [12.0, 18.0, 'II · The filter'], [18.0, 24.0, 'III · The line'], [24.0, 27.7, 'IV · Signal']]) {
    const o = win(t, a, b, 0.25, 0.25); if (o > 0) text(c, lb, 160, 150, { f: 'mono', size: 14, col: SOFT, a: o }); }
  // unread counter
  const ua = win(t, 4.0, 12.6, 0.3, 0.6);
  if (ua > 0) { const n = Math.min(9999, Math.round(12 * Math.exp((t - 4) * 0.86))); const s = n >= 9999 ? '9,999+' : n.toLocaleString('en-US');
    text(c, 'Unread', 1824, 120, { f: 'mono', size: 13, col: SOFT, a: ua, align: 'right' });
    text(c, s, 1824, 182, { f: 'monoB', size: 54, col: RED, a: ua, align: 'right', track: 0.04 }); }
  // noise meter (counts down as the sweep decides)
  const ma = win(t, 4.4, 17.6, 0.4, 0.6);
  if (ma > 0) { const decided = DECIDE.filter(d => d.t <= t && d.kind === 'drop').length, total = DECIDE.filter(d => d.kind === 'drop').length;
    const pct = t < 13 ? Math.round(lerp(61, 98, ramp(t, 4.4, 11.5, EASE.warm))) : Math.max(2, Math.round(98 * (1 - decided / total)));
    const x0 = 160, y0 = 990, w = 360;
    text(c, 'Noise', x0, y0 - 18, { f: 'mono', size: 12, col: SOFT, a: ma }); text(c, pct + '%', x0 + w, y0 - 18, { f: 'mono', size: 12, col: SOFT, a: ma, align: 'right' });
    c.globalAlpha = ma; c.fillStyle = rgba(SOFT, 0.25); c.fillRect(x0, y0, w, 6); c.fillStyle = pct > 10 ? RED : SIG; c.fillRect(x0, y0, w * pct / 100, 6); c.globalAlpha = 1; }
  // signal ticker
  const sa = win(t, 18.6, 24.2, 0.4, 0.5);
  if (sa > 0) { const k = [0, 1, 2, 3, 4].filter(i => t >= landT(i) + 0.2).length;
    text(c, 'Kept', 1824, 120, { f: 'mono', size: 13, col: SOFT, a: sa, align: 'right' });
    text(c, `<i>${k}</i> / 9,999`, 1824, 182, { f: 'monoB', size: 54, col: C.fog, accent: SIG, a: sa, align: 'right', track: 0.04 }); }
  // closing words
  for (const r of READ.filter(r => r.words)) { const o = win(t, r.in, r.out, r.fi, r.fo); if (o <= 0) continue;
    text(c, r.markup, 160, 470 + (1 - EASE.defer(clamp((t - r.in) / r.fi))) * 12, { f: 'disp', size: 132, col: C.paper, accent: SIG, a: o }); }
  const E0 = READ.find(r => r.id === 'end').in, ec = ramp(t, E0, E0 + 0.6);
  if (ec > 0) { const s = k => ramp(t, E0 + k * 0.15, E0 + 0.6 + k * 0.15);
    text(c, 'CETI · Signal', 160, 430, { f: 'mono', size: 15, col: C.fog, a: s(0) });
    text(c, 'Signal over <i>noise</i>.', 160, 560 + (1 - s(1)) * 12, { f: 'disp', size: 120, col: C.paper, accent: RED, a: s(1), strike: ramp(t, E0 + 0.6, E0 + 1.1, EASE.glaser), strikeCol: RED });
    whaleMark(c, 160, 612, 0.6, C.fog, s(2)); text(c, 'cetiai.co', 240, 640, { f: 'mono', size: 14, col: C.fog, a: s(2) }); }
  c.restore();
}

// cue sheet for the score: every sound sits on an event the picture draws
function cues(c) {
  decisions(c);
  return { bpm: 120, whips: [3.5, ...WHIPS.filter(w => w[0] < 11).map(w => w[0])], title: 2.0, pills: PILLS.map(p => ({ t: p.tb, keep: p.keep })),
    lanes: LANES.map(l => beatT(l.beat)), drops: DECIDE.filter(d => d.kind === 'drop').map(d => d.t), keeps: PILLS.filter(p => p.keep >= 0).map(p => p.td),
    lands: [0, 1, 2, 3, 4].map(landT), words: [24.3, 26.1], end: 27.85, strike: 28.45 };
}
// readable text: [in, out, label] — checked by the read-time gate
// in/out/fade-in/fade-out of every line meant to be READ; drawFrame draws from this table and the read-time gate checks it
const READ = [
  { id: 'title', in: 2.0, out: 3.5, fi: 0.1, fo: 0.35, text: 'Signal' },
  { id: 'w1', in: 24.3, out: 26.0, fi: 0.4, fo: 0.3, text: 'Slow down.', markup: 'Slow down.', words: true },
  { id: 'w2', in: 26.1, out: 27.75, fi: 0.35, fo: 0.3, text: 'Filter noise.', markup: 'Filter <i>noise</i>.', words: true },
  { id: 'end', in: 27.85, out: 30.0, fi: 0.75, fo: 0, text: 'Signal over noise.' },
];
const READABLES = READ;
root.SIGNAL = { drawFrame, cues, DUR, W, H, READABLES, fps: 60, shutter: t => (t >= 3.4 && t < 17) ? [4, 0.75] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
