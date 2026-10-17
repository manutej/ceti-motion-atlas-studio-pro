// CETI Capabilities 07 · counter — "Stop when the counter hits zero." Kinetic Hydrography 1.0.0 + series layer. 30-s house format.
// Source: storyboards/c05/sb-05-02.json (meta-suite), compressed from 60 s. Model: kh/caps/gate (problem-first 30-s cut).
// The work is a concrete thing: YOUR COVER LETTER. The whale is YOU. Rough bits of the letter are squiggles in its lines.
// FELT: you smooth one squiggle and another pops up — you never know when to stop.
// MOVE: three fresh readers (identical helper pods) sweep the letter; each mark is a red-pen circle with a plain label
// (typo, unclear…); a counter shows CHANGES FOUND this round. You fix the marks (a fix can make a new rough bit), they read
// again: 4 → 2 → 0. At 0 you stop. CASE: the real numbers from our own records (14, 14, 10, then 0) on a sourced card.
// LIMIT: the readers all look the same way; a rough bit on the last line sits outside every reader's light and is never marked.
// ENDING (counter says stop): you reach to tweak again, look up at the counter, see 0, and let go.
// drawFrame(ctx, t) is a pure function of t. Flaw marks/fixes are computed from the sweep, not hand-timed.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, win, EASE, ramp, mix, rgba, text, rng } = KH;
const W = 1920, H = 1080, BPM = 128, B = 60 / BPM, DUR = 28.2;
const INK = C.navy, SOFT = C.slate, PINK = WD.seashellPink, DSG = WD.deepSlateGreen;
const BG = mix(C.paper, PINK, 0.06);                           // what SERIES.ground paints with tint: pink
const ACC = DSG;                                               // the title's accent word: Deep Slate Green (12.5:1 on paper)
const PAGE = mix(C.paper, KH.NEUTRALS.white, 0.45), EDGE = mix(C.paper, C.slate, 0.42), SHADOW = mix(C.paper, PINK, 0.55);
const TXT = mix(C.paper, C.slate, 0.62), PEN = mix(C.rust, PINK, 0.1), OK = mix(DSG, C.sage, 0.25), POD = mix(C.mist, C.paper, 0.12);
const BEAM = C.mist, LIGHT = mix(PINK, C.paper, 0.35);

// ---------- the letter: a page with a greeting and five lines of text ----------
const PX0 = -540, PX1 = 480, PY0 = -265, PY1 = 255, LY = [-120, -45, 30, 105, 180], LX0 = -470, LX1 = [420, 400, 425, 390, 380];
const WORDS = LY.map((y, i) => { const R = rng(70 + i), segs = []; let x = LX0; while (x < LX1[i] - 30) { const w = 40 + R() * 120; segs.push([x, Math.min(x + w, LX1[i])]); x += w + 22; } return segs; });
const BEAM_Y = 142;                                            // how far down every reader looks (line 5 at y 180 is never lit)

// ---------- rough bits (flaws). in: pops up (−1 = there from the start); fix: you smooth it ----------
const F = {
  a: { x: -300, y: LY[1], in: -1 }, b: { x: -20, y: LY[3], in: 0.95 }, c: { x: 230, y: LY[0], in: 2.05 }, d: { x: -200, y: LY[2], in: 3.1 },
  e: { x: -380, y: LY[0], in: 5.2 }, f: { x: 120, y: LY[3], in: 5.3 }, g: { x: 330, y: LY[1], in: 5.4 },
  h: { x: -60, y: LY[0] }, i: { x: 200, y: LY[2] },             // made by fixes in round 1 (the FELT problem, now caught)
  z: { x: 300, y: LY[4], in: -1, amp: 0.7 },                    // the blind spot: below every reader's light, never marked
};
const LABEL = { e: 'typo', d: 'unclear', f: 'too long', g: 'wrong name', h: 'typo', i: 'unclear' };

// ---------- the whale (you): Hermite through keys; zero tangents = it settles at each key ----------
const WS = 0.8, REACH = 96, R0 = [700, 150];
const fixAt = (id, f) => [F[id].x - f * REACH, F[id].y - 26];   // where you sit to smooth flaw id while facing f
const K = [];
function key(t, p) { K.push([t, p[0], p[1]]); }
// FELT: smooth a, b pops; smooth b, c pops; smooth c, d pops behind you; hover, fin up
key(0, [-470, -170]); key(0.55, fixAt('a', 1)); key(0.85, fixAt('a', 1)); key(1.6, fixAt('b', 1)); key(1.9, fixAt('b', 1));
key(2.6, fixAt('c', 1)); key(2.9, fixAt('c', 1)); key(3.6, [60, -140]); key(4.5, [60, -140]);
// under the title veil: swim to your seat beside the counter
key(6.0, R0); key(8.45, R0);
// round 1 fixes (right to left), then back
const FIX1 = [['g', 8.9, 9.08], ['f', 9.42, 9.6], ['d', 9.95, 10.13], ['e', 10.43, 10.62]];
for (const [id, a, b] of FIX1) { key(a, fixAt(id, -1)); key(b, fixAt(id, -1)); }
key(10.85, fixAt('e', -1)); key(11.85, R0); key(12.6, R0);
const FIX2 = [['i', 13.05, 13.22], ['h', 13.55, 13.72]];
for (const [id, a, b] of FIX2) { key(a, fixAt(id, -1)); key(b, fixAt(id, -1)); }
key(13.97, fixAt('h', -1)); key(14.95, R0);
// ENDING: reach toward the letter to tweak again, look up at the counter, let go
const T_REACH = [22.0, 22.7], T_LOOK = 22.85, T_SEE = 23.15, T_LETGO = 23.45;
key(T_REACH[0], R0); key(T_REACH[1], [585, 85]); key(T_LETGO, [585, 85]); key(24.3, R0); key(DUR + 1, R0);
for (const [id, a] of FIX1) F[id].fix = a; for (const [id, a] of FIX2) F[id].fix = a;
F.a.fix = 0.55; F.b.fix = 1.6; F.c.fix = 2.6; F.h.in = 9.5; F.i.in = 10.5;

function herm(P, t) { const n = P.length; if (t <= P[0][0]) return { x: P[0][1], y: P[0][2] }; if (t >= P[n - 1][0]) return { x: P[n - 1][1], y: P[n - 1][2] };
  let i = 0; while (P[i + 1][0] < t) i++; const p1 = P[i], p2 = P[i + 1], u = (t - p1[0]) / (p2[0] - p1[0]), A2 = 2 * u * u * u - 3 * u * u + 1, C2 = 1 - A2;
  return { x: A2 * p1[1] + C2 * p2[1], y: A2 * p1[2] + C2 * p2[2] }; }
const NODS = Object.values(F).filter(f => f.fix != null).map(f => f.fix);
function wworld(t) { const p = herm(K, t), q = herm(K, t + 0.01), sp = Math.hypot(q.x - p.x, q.y - p.y) * 100, still = 1 - clamp(sp / 150);
  let dip = 0; for (const s of NODS) { const d = t - s; if (d > 0 && d < 0.3) dip = Math.max(dip, 7 * Math.sin(Math.PI * d / 0.3)); }
  return { x: p.x, y: p.y + (Math.sin(t * 2.4) * 2.5 + dip) * still }; }
const wvel = t => { const a = wworld(t - 1 / 240), c = wworld(t + 1 / 240); return { x: (c.x - a.x) * 120, y: (c.y - a.y) * 120 }; };
const look = t => -0.32 * win(t, T_LOOK, T_LETGO + 0.5, 0.3, 0.45);   // tilt the nose up toward the counter
function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
    a += (sp < 40 ? 0 : clamp(Math.atan2(v.y, Math.abs(v.x)), -0.8, 0.8) * clamp(sp / 300)) * w; s += w; } return a / s + look(t); }
// facing: +1 right, −1 left; turns only while (nearly) still
const TURNS = [[3.15, -1], [4.55, 1], [6.05, -1], [10.62, 1], [11.9, -1], [13.72, 1], [15.0, -1]];
function facing(t) { let f = 1; for (const [a, to] of TURNS) f = lerp(f, to, ramp(t, a, a + 0.22, EASE.warm)); return f; }
const wpos = t => wworld(t);

// ---------- the readers: three identical helpers sweeping left → right above the letter ----------
const SPEED = 891, GAP = 150, POD_Y = -365;
const LAPS = [6.75, 10.9, 14.5, 19.35];                         // round 1, round 2, round 3 (finds nothing), and the limit pass
const lead = (L, t) => -700 + SPEED * (t - L);
const lapEnd = L => L + (860 + 700) / SPEED;
// marks: a flaw is marked by the reader whose light passes over it, if the flaw is there and lit, in rounds 1-3
const MARKS = [];
LAPS.slice(0, 3).forEach((L, r) => {
  const here = Object.entries(F).filter(([id, f]) => f.y < BEAM_Y && (f.in ?? -1) < L && (f.fix == null || f.fix > L)).sort((p, q) => p[1].x - q[1].x);
  here.forEach(([id, f], j) => { const k = j % 3; MARKS.push({ id, r, k, t: L + (f.x + 700 + GAP * k) / SPEED }); });
});
const ROUND = [0, 1, 2].map(r => MARKS.filter(m => m.r === r));
const ZERO = lapEnd(LAPS[2]) - 0.25;                            // round 3 ends with nothing marked: the counter says stop
const FLAW_AMP = (f, t) => { const a = f.amp ?? 1, inn = f.in == null || f.in < 0 ? 1 : ramp(t, f.in, f.in + 0.28, EASE.glaser), out = f.fix == null ? 0 : ramp(t, f.fix, f.fix + 0.25, EASE.warm); return a * inn * (1 - out); };

// ---------- camera ----------
function cam(t) {
  const pull = ramp(t, 4.1, 6.4, EASE.rest), push = ramp(t, 15.3, 16.2, EASE.warm), rel = ramp(t, 16.5, 17.2, EASE.warm);
  const lim = ramp(t, 19.1, 19.95, EASE.warm), lrel = ramp(t, 21.5, 22.4, EASE.warm), end = ramp(t, 24.4, DUR, EASE.rest);
  let z = lerp(1.3, 1.0, pull), x = lerp(-60, 80, pull), y = lerp(-40, -30, pull);
  z = lerp(z, 1.1, push); x = lerp(x, 230, push); z = lerp(z, 1.0, rel); x = lerp(x, 80, rel);
  z = lerp(z, 1.55, lim); x = lerp(x, 280, lim); y = lerp(y, 95, lim);
  z = lerp(z, 1.12, lrel); x = lerp(x, 300, lrel); y = lerp(y, -10, lrel);
  return { x, y, z: z - 0.03 * end, ax: 960, ay: 540 }; }

// ---------- text ----------
const T0 = 4.1, T_LOCK = 26.0, T_COUNTER = 6.3;
const cap = (id, inn, out, text) => ({ id, kind: 'caption', in: inn, out, fi: 0.25, fo: 0.2, text });
const lab = (id, inn, out, text, fi = 0.2, fo = 0.2) => ({ id, kind: 'label', in: inn, out, fi, fo, text });
const READ = [
  lab('tab', 0, DUR, 'Your cover letter', 0.01, 0.01),
  lab('dear', 0, DUR, 'Dear Hiring Team,', 0.01, 0.01),
  lab('you', 0.2, 3.05, 'You', 0.2, 0.3),
  cap('felt1', 0.3, 2.05, 'I keep tweaking my letter.'),
  cap('felt2', 2.12, 4.2, 'I never know when to stop.'),
  { id: 'eyebrow', kind: 'label', in: T0 + 0.25, out: T0 + 2.65, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 07' },
  { id: 'title', kind: 'title', in: T0 + 0.25, out: T0 + 2.65, fi: 0.4, fo: 0.45, text: 'Stop when the <i>counter</i> hits zero.' },
  lab('counter', T_COUNTER, DUR, 'Changes found', 0.3, 0.01),
  lab('readers', 6.8, 8.75, 'Three fresh readers', 0.25, 0.3),
  cap('m1', 6.82, 8.85, 'Fresh readers mark what is wrong.'),
  cap('m2', 8.93, 10.95, 'Fix every mark. Ask again.'),
  cap('m3', 11.6, 13.7, 'Fewer marks each time.'),
  cap('m4', 14.6, 16.6, 'Nothing left to mark? Stop.'),
  { id: 'card', kind: 'card', card: true, in: 16.65, out: 19.75, fi: 0.3, fo: 0.3, text: 'Real case · changes found: 14, 14, 10, 0', src: 'https://app.notion.com/p/3f2d50cfaf938197a25ce5ee67145c35' },
  lab('cardsub', 16.65, 19.75, 'Three readers, then a last re-check', 0.3, 0.3),
  lab('src', 16.65, 19.75, 'Source: our own records', 0.3, 0.3),
  cap('limit', 19.82, 21.95, 'Same kind of readers, same blind spot.'),
  cap('notthis', 22.03, 24.05, 'Zero found does not mean perfect.'),
  cap('belief', 24.1, T_LOCK - 0.02, 'Repeat until fresh eyes find nothing. Then stop.'),
  { id: 'lockup', kind: 'label', in: T_LOCK, out: DUR, fi: 0.45, fo: 0, text: 'CETI · Capabilities · 07 · Counter' },
];
// a plain-word label beside each mark, from the moment it is marked until it is fixed
for (const m of MARKS) { const f = F[m.id]; READ.push(lab('mk-' + m.id, m.t, (f.fix ?? DUR) + 0.25, LABEL[m.id], 0.18, 0.2)); }
const RD = id => READ.find(r => r.id === id), RA = (t, id) => { const r = RD(id); return win(t, r.in, r.out, r.fi, r.fo); };

// ---------- drawing helpers ----------
function lineY(i, x, t) { let dy = 0; for (const id in F) { const f = F[id]; if (f.y !== LY[i]) continue; const a = FLAW_AMP(f, t); if (a < 0.005) continue;
    const u = (x - f.x) / 40; dy += a * 30 * Math.exp(-u * u) * Math.sin((x - f.x) / 8.5); } return dy; }
function ringPath(c, x, y, r, p) { c.beginPath(); const a0 = -2.2; for (let k = 0; k <= 48 * p; k++) { const a = a0 + (k / 48) * Math.PI * 2.15, rr = r * (1 + 0.06 * Math.sin(a * 3 + 1));
    const px = x + rr * Math.cos(a) * 1.18, py = y + rr * Math.sin(a) * 0.86; k ? c.lineTo(px, py) : c.moveTo(px, py); } }
function tick(c, x, y, s, col, lw, a) { c.save(); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
  c.moveTo(x - s, y); c.lineTo(x - s * 0.25, y + s * 0.75); c.lineTo(x + s * 1.05, y - s * 0.85); c.stroke(); c.restore(); }
function counterVal(t) { let r = -1; for (let k = 0; k < 3; k++) if (t >= LAPS[k] - 0.2) r = k; if (r < 0) return { r, n: 0, last: -9 };
  const ms = ROUND[r].filter(m => t >= m.t); return { r, n: ms.length, last: ms.length ? ms[ms.length - 1].t : LAPS[r] - 0.2 }; }

function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay;
  S.ground(c, t, cm, { tint: PINK });
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.lineCap = 'round'; c.lineJoin = 'round';

  // the letter
  c.fillStyle = SHADOW; c.beginPath(); c.roundRect(X(PX0) + 10 * z, Y(PY0) + 12 * z, (PX1 - PX0) * z, (PY1 - PY0) * z, 10 * z); c.fill();
  c.fillStyle = PAGE; c.strokeStyle = EDGE; c.lineWidth = 2; c.beginPath(); c.roundRect(X(PX0), Y(PY0), (PX1 - PX0) * z, (PY1 - PY0) * z, 10 * z); c.fill(); c.stroke();
  S.chip(c, 'Your cover letter', X(PX0) + 4 * z, Y(PY0) - 22 * z, { f: 'mono', size: Math.round(21 * z), col: INK, pad: 12 * z, bg: PAGE, border: EDGE, track: 0.12 });
  text(c, 'Dear Hiring Team,', X(LX0), Y(-188), { f: 'sans', size: Math.round(34 * z), col: INK });

  // the readers' light (under the text so the lines stay crisp): one soft beam per reader, down to BEAM_Y only
  const lapA = L => win(t, L - 0.1, lapEnd(L), 0.25, 0.35);
  c.save(); c.beginPath(); c.rect(X(PX0), Y(PY0), (PX1 - PX0) * z, (PY1 - PY0) * z); c.clip();
  for (const L of LAPS) { const a = lapA(L); if (a <= 0) continue; const ld = lead(L, t);
    for (let k = 0; k < 3; k++) { const px = ld - GAP * k; if (px < PX0 - 120 || px > PX1 + 120) continue;
      c.fillStyle = rgba(BEAM, 0.2 * a); c.beginPath(); c.moveTo(X(px - 22), Y(PY0)); c.lineTo(X(px + 22), Y(PY0)); c.lineTo(X(px + 68), Y(BEAM_Y)); c.lineTo(X(px - 68), Y(BEAM_Y)); c.closePath(); c.fill();
      c.strokeStyle = rgba(BEAM, 0.55 * a); c.lineWidth = 3 * z; c.beginPath(); c.moveTo(X(px - 68), Y(BEAM_Y)); c.lineTo(X(px + 68), Y(BEAM_Y)); c.stroke(); } }
  c.restore();

  // the lines of text, word by word; rough bits are squiggles in them
  c.strokeStyle = TXT; c.lineWidth = Math.max(4, 9 * z);
  LY.forEach((ly, i) => { for (const [a, b] of WORDS[i]) { c.beginPath(); for (let x = a; x <= b; x += 3) { const yy = ly + lineY(i, x, t); x === a ? c.moveTo(X(x), Y(yy)) : c.lineTo(X(x), Y(yy)); } c.stroke(); } });

  // the blind spot (limit): a dashed slate circle and a "?" on the rough bit nobody's light reached
  { const f = F.z, a = win(t, 20.15, 22.3, 0.35, 0.4); if (a > 0) { c.save(); c.globalAlpha = a; c.strokeStyle = SOFT; c.lineWidth = 4 * z; c.setLineDash([10 * z, 9 * z]);
      ringPath(c, X(f.x), Y(f.y), 50 * z, 1); c.stroke(); c.setLineDash([]); c.restore(); S.chip(c, '?', X(f.x + 92), Y(f.y + 14), { f: 'disp', size: Math.round(44 * z), col: INK, a, align: 'center', bg: PAGE, pad: 10 * z }); } }

  // red-pen marks: drawn on as the reader's light passes; at the fix they turn into a small green tick and fade
  for (const m of MARKS) { if (t < m.t) continue; const f = F[m.id], p = ramp(t, m.t, m.t + 0.3, EASE.glaser), fx = f.fix ?? 99;
    const gone = ramp(t, fx, fx + 0.3, EASE.warm), pop = 1 + 0.12 * Math.exp(-(t - m.t) * 9);
    if (gone < 1) { c.save(); c.globalAlpha = 1 - gone; c.strokeStyle = PEN; c.lineWidth = Math.max(5, 6 * z); ringPath(c, X(f.x), Y(f.y), 52 * z * pop, p); c.stroke(); c.restore(); }
    const tk = win(t, fx + 0.05, fx + 0.95, 0.12, 0.4); if (tk > 0) tick(c, X(f.x), Y(f.y - 4), 20 * z, OK, Math.max(5, 6 * z), tk);
    const la = RA(t, 'mk-' + m.id); if (la > 0) S.chip(c, LABEL[m.id], X(f.x + 58), Y(f.y - 52), { f: 'sans', size: Math.round(27 * z), col: INK, a: la, bg: PAGE, border: PEN, pad: 10 * z }); }

  // the readers: three identical helpers
  for (const L of LAPS) { const a = lapA(L); if (a <= 0) continue; const ld = lead(L, t);
    for (let k = 0; k < 3; k++) { const px = ld - GAP * k; if (px < PX0 - 200 || px > PX1 + 260) continue; const fade = 1 - ramp(px, PX1 + 60, PX1 + 240, EASE.rest);
      const bob = Math.sin(t * 7 + k * 1.9) * 5;
      c.save(); c.globalAlpha = a * fade; KH.drawPod(c, X(px), Y(POD_Y + bob), 0.08, 92 * z, POD, {}); c.restore(); } }
  { const a = RA(t, 'readers'); if (a > 0) { const px = lead(LAPS[0], t) - GAP; S.chip(c, 'Three fresh readers', X(clamp(px, -260, 220)), Y(POD_Y - 70), { f: 'mono', size: Math.round(21 * z), col: INK, a, align: 'center', bg: C.paper, border: EDGE, track: 0.12 }); } }

  // the counter: CHANGES FOUND this round, big; earlier rounds in a row beneath it
  { const a = ramp(t, T_COUNTER, T_COUNTER + 0.45, EASE.warm); if (a > 0) {
      const cx = 730, cy = -120, wd = 300, ht = 236, v = counterVal(t), pop = 1 + 0.22 * Math.exp(-(t - v.last) * 9), zero = ramp(t, ZERO, ZERO + 0.35, EASE.glaser);
      const see = win(t, T_SEE, DUR + 1, 0.15, 0) ; const glow = Math.max(win(t, ZERO, ZERO + 1.6, 0.1, 0.6), win(t, T_SEE, T_SEE + 1.4, 0.1, 0.6));
      c.save(); c.globalAlpha = a;
      if (glow > 0.02) { c.strokeStyle = rgba(OK, 0.32 * glow); c.lineWidth = 16 * z; c.beginPath(); c.roundRect(X(cx - wd / 2), Y(cy - ht / 2), wd * z, ht * z, 14 * z); c.stroke(); }
      c.fillStyle = C.paper; c.strokeStyle = mix(EDGE, DSG, zero); c.lineWidth = lerp(2, 5, zero) * z; c.beginPath(); c.roundRect(X(cx - wd / 2), Y(cy - ht / 2), wd * z, ht * z, 14 * z); c.fill(); c.stroke();
      c.restore();
      text(c, 'Changes found', X(cx), Y(cy - 78), { f: 'mono', size: Math.round(20 * z), col: SOFT, a, align: 'center', track: 0.14 });
      const nc = v.r === 2 ? mix(INK, DSG, zero) : INK;
      c.save(); c.translate(X(cx - (zero > 0 && v.r === 2 ? 28 : 0) * zero), Y(cy + 30)); c.scale(pop, pop); text(c, String(v.n), 0, 0, { f: 'disp', size: Math.round(128 * z), col: nc, a, align: 'center' }); c.restore();
      if (v.r === 2) tick(c, X(cx + 62), Y(cy - 2), 24 * z * (0.6 + 0.4 * zero), DSG, 8 * z, zero);
      // earlier rounds
      const hist = ROUND.slice(0, Math.max(0, v.r)).map(R => R.length);
      hist.forEach((n, j) => { const ha = ramp(t, LAPS[j + 1] - 0.2, LAPS[j + 1] + 0.25, EASE.warm); const hx = cx - 40 + j * 80 - (hist.length - 1) * 0;
        text(c, String(n), X(hx), Y(cy + 96), { f: 'disp', size: Math.round(44 * z), col: SOFT, a: a * ha, align: 'center' });
        if (j < hist.length) { c.save(); c.globalAlpha = a * ha; c.strokeStyle = SOFT; c.lineWidth = 3 * z; const ax0 = X(hx + 22), ay0 = Y(cy + 82); c.beginPath(); c.moveTo(ax0, ay0); c.lineTo(ax0 + 18 * z, ay0); c.moveTo(ax0 + 11 * z, ay0 - 7 * z); c.lineTo(ax0 + 18 * z, ay0); c.lineTo(ax0 + 11 * z, ay0 + 7 * z); c.stroke(); c.restore(); } });
      if (see > 0 && 0) {} } }

  // the little whale: you
  { const p = wworld(t), ang = heading(t), v = wvel(t), sp = Math.hypot(v.x, v.y), moving = clamp(sp / 400), f = facing(t);
    let blink = 0; for (const k of [1.3, 5.2, 8.2, 12.3, 16.0, 18.4, 21.0, 25.2, 27.3]) blink = Math.max(blink, 1 - Math.abs(t - k) / 0.07);
    let squash = 0; for (const k of NODS) { const d = t - k; if (d >= 0 && d < 0.3) squash = Math.max(squash, 0.12 * (1 - EASE.glaser(d / 0.3))); }
    const fixing = NODS.some(k => t > k - 0.35 && t < k + 0.35);
    const focus = fixing ? 1 : Math.max(win(t, 3.6, 4.4, 0.2, 0.3) * 0.7, win(t, T_REACH[0], T_LOOK, 0.2, 0.2) * 0.8);
    const eye = 1 + 0.35 * Math.max(win(t, 0.95, 1.4, 0.05, 0.3), win(t, 2.05, 2.5, 0.05, 0.3), win(t, 3.1, 3.7, 0.05, 0.3)) + 0.3 * win(t, T_SEE, T_SEE + 0.6, 0.06, 0.3);
    const spark = Math.max(win(t, ZERO, ZERO + 1.0, 0.12, 0.4), win(t, T_LETGO, T_LETGO + 1.2, 0.12, 0.5));
    const delight = (t > ZERO + 0.05 && t < ZERO + 1.2) || t > T_LETGO + 0.05 ? 1 : 0;
    const finUp = Math.max(win(t, 3.3, 4.5, 0.25, 0.3), win(t, T_REACH[0] + 0.2, T_LETGO + 0.15, 0.3, 0.3));
    c.save(); c.translate(X(p.x), Y(p.y)); c.scale(f, 1);
    KH.drawWhale(c, { x: 0, y: 0, ang, scale: WS * z, L: 1, tail: Math.sin(t * (moving > 0.3 ? 11 : 3)) * lerp(0.12, 0.34, moving), fin: lerp(Math.sin(t * 6 + 1.3) * lerp(0.15, 0.3, moving), -1.05, finUp),
      blink, squash, focus: delight ? 0 : focus, eye, spark, sparkColor: OK, delight, blush: 0.6, mouth: delight ? 0.4 : 0.3 * win(t, 3.15, 3.9, 0.06, 0.3), sw: 3.2 });
    c.restore();
    const ya = RA(t, 'you'); if (ya > 0) { S.chip(c, 'You', X(p.x), Y(p.y - 92), { f: 'mono', size: Math.round(22 * z), col: INK, a: ya, align: 'center', bg: C.paper, border: EDGE, track: 0.16 }); } }

  // the title hinge: the scene goes still under a paper veil
  const veil = win(t, 4.15, T0 + 2.72, 0.35, 0.4); if (veil > 0) { c.fillStyle = rgba(C.paper, 0.9 * veil); c.fillRect(0, 0, W, H); }

  // the real-case card (top left, above the letter)
  const ka = RA(t, 'card'); if (ka > 0) { const x0 = 150, y0 = 40, dy = (1 - EASE.defer(ramp(t, 16.65, 17.0))) * 8, wd = 760, ht = 262;
    c.save(); c.globalAlpha = ka; c.fillStyle = C.paper; c.strokeStyle = EDGE; c.lineWidth = 1.4; c.beginPath(); c.roundRect(x0 - 30, y0 + dy, wd, ht, 8); c.fill(); c.stroke();
    c.fillStyle = DSG; c.fillRect(x0 - 30, y0 + dy, 6, ht); c.restore();
    text(c, 'Real case · changes found', x0, y0 + 46 + dy, { f: 'mono', size: 24, col: SOFT, a: ka, track: 0.12 });
    const NUM = ['14', '14', '10', '0']; let nx = x0;
    NUM.forEach((n, j) => { const ta = ka * ramp(t, 16.85 + j * 0.38, 17.1 + j * 0.38, EASE.glaser), col = j === 3 ? DSG : INK;
      const w = text(c, n, nx, y0 + 140 + dy, { f: 'disp', size: 84, col, a: ta });
      if (j < 3) { c.save(); c.globalAlpha = ta; c.strokeStyle = SOFT; c.lineWidth = 4; const ax = nx + w + 26, ay = y0 + 112 + dy; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + 44, ay); c.moveTo(ax + 30, ay - 12); c.lineTo(ax + 44, ay); c.lineTo(ax + 30, ay + 12); c.stroke(); c.restore(); }
      nx += w + 100; });
    text(c, 'Three readers, then a last re-check', x0, y0 + 196 + dy, { f: 'sans', size: 30, col: INK, a: ka });
    text(c, 'Source: our own records', x0, y0 + 240 + dy, { f: 'sans', size: 28, col: SOFT, a: ka }); }

  for (const r of READ) if (r.kind === 'caption') S.caption(c, t, r, { size: 40 });
  S.open(c, t - T0, { no: '07', title: 'Stop when the <i>counter</i> hits zero.', accent: ACC }, { out: 2.65 });
  S.lockup(c, t, T_LOCK, { no: '07', short: 'Counter' });
  c.restore();
}

function cues() {
  return { bpm: BPM, dur: DUR, title: T0 + 0.25, veil: 4.15, unveil: T0 + 2.3,
    pop: Object.values(F).filter(f => f.in > 0 && f.in < 4).map(f => f.in), popNew: [F.h.in, F.i.in],
    fixFelt: [F.a.fix, F.b.fix, F.c.fix], fix: [...FIX1, ...FIX2].map(x => x[1]), counterIn: T_COUNTER,
    lap: LAPS.slice(0, 3), limitLap: LAPS[3], mark: MARKS.map(m => ({ t: m.t, r: m.r, k: m.k, n: ROUND[m.r].indexOf(m) + 1 })),
    zero: ZERO, card: RD('card').in, cardNums: [0, 1, 2, 3].map(j => 16.85 + j * 0.38), blind: 20.15,
    notThis: RD('notthis').in, reach: T_REACH[0], look: T_LOOK, see: T_SEE, letgo: T_LETGO, belief: RD('belief').in, lockup: T_LOCK,
    tags: { consequence: [F.b.in, F.c.in, F.d.in], focus: [F.a.fix, ZERO, T_SEE], mech: MARKS.map(m => m.t), limit: [20.15] } }; }
const CONTRAST = [['captions / chips (ink on paper)', INK, C.paper], ['title (ink on chart ground)', INK, BG], ['title accent on ground', ACC, BG],
  ['title accent on veiled ground (paper)', ACC, C.paper], ['eyebrow / lockup (slate on ground)', SOFT, BG], ['card label + source, counter label (slate on paper)', SOFT, C.paper],
  ['letter greeting, tab, mark labels, "?" (ink on letter page)', INK, PAGE], ['zero + card 0 (deep slate green on paper)', DSG, C.paper]];
const INTENT = {
  problem: 'You keep tweaking your cover letter and never know when it is done; each fix seems to make a new rough bit.',
  move: 'Ask fresh readers to mark what is wrong, fix every mark, ask again; a counter shows how many changes they found (4, 2, 0). Stop when it hits zero.',
  belief: 'Repeat until fresh eyes find nothing. Then stop. (Zero found does not mean perfect: readers alike share a blind spot.)' };
const TERMS = [{ term: 'counter', pictured_at: T_COUNTER }];   // an everyday word; no expert word appears on screen
root.EPISODE = { drawFrame, cues, READ, CONTRAST, DUR, W, H, fps: 60, wpos, heading, cam, INTENT, TERMS,
  shutter: t => (t > 8.4 && t < 11.9) || (t > 12.5 && t < 15.0) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
