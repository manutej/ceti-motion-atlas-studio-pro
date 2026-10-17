// CETI Capabilities 07 · counter v2 — "Stop when the counter hits zero." Kinetic Hydrography 1.0.0 + series layer. 30-s house format.
// Source: storyboards/c05/sb-05-02.json (meta-suite). Model: kh/caps/gate. v1 kept as film-v1.js. v2 applies LAY-JURY.json v1 + brief lessons 7–10.
// The work: YOUR COVER LETTER. The whale is YOU. Rough bits of the letter are squiggles in its lines.
// FELT: you smooth one squiggle and another pops up. MOVE: THREE AI READERS (peach pods with magnifiers, nothing like the whale)
// sweep the letter; every problem gets a red-pen circle and a plain label; PROBLEMS FOUND counts them per round: 3 → 1 → 0. Stop.
// CASE: the real numbers (14, 14, 10, 0) on a sourced card that explains the repeat. LIMIT, phrased "and also": the readers'
// light never reaches the last line, so zero means only "these readers found nothing". Add one new kind of reader (a green pod
// that looks up from below): it finds the bit, you fix it, it checks again: 0. drawFrame(ctx, t) is a pure function of t.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, win, EASE, ramp, mix, rgba, text, rng } = KH;
const W = 1920, H = 1080, BPM = 128, DUR = 29.5;
const SA = 0.6, SB = 1.6;                                       // v3: card +0.6 s, then "Zero means" hold +1.0 s
const INK = C.navy, SOFT = C.slate, PINK = WD.seashellPink, DSG = WD.deepSlateGreen;
const BG = mix(C.paper, PINK, 0.06), ACC = DSG;
const PAGE = mix(C.paper, KH.NEUTRALS.white, 0.45), EDGE = mix(C.paper, C.slate, 0.42), SHADOW = mix(C.paper, PINK, 0.55);
const TXT = mix(C.paper, C.slate, 0.62), PEN = mix(C.rust, PINK, 0.1), OK = mix(DSG, C.sage, 0.25);
const READER = mix(C.peach, PINK, 0.25), RBEAM = C.peach, NEWR = mix(DSG, C.sage, 0.45), NBEAM = C.sage;

// ---------- the letter ----------
const PX0 = -540, PX1 = 480, PY0 = -265, PY1 = 255, LY = [-110, -35, 40, 115, 190], LX0 = -470, LX1 = [420, 400, 425, 390, 380];
const WORDS = LY.map((y, i) => { const R = rng(70 + i), segs = []; let x = LX0; while (x < LX1[i] - 30) { const w = 40 + R() * 120; segs.push([x, Math.min(x + w, LX1[i])]); x += w + 22; } return segs; });
const BEAM_Y = 152;                                            // how far down the three readers look (line 5 at y 190 is never lit)

// ---------- rough bits ----------
const F = {
  a: { x: -300, y: LY[1], in: -1 }, b: { x: -20, y: LY[3], in: 0.95 }, c: { x: 230, y: LY[0], in: 2.05 }, d: { x: -200, y: LY[2], in: 3.1 },
  f: { x: 120, y: LY[3], in: 5.0 }, g: { x: 330, y: LY[1], in: 5.2 },
  h: { x: -60, y: LY[1] },                                      // made by a fix in round 1 (the FELT problem, now caught)
  z: { x: 300, y: LY[4], in: -1, amp: 0.8 },                    // the blind spot: below the three readers' light
};
const LABEL = { g: 'typo', f: 'too long', d: 'unclear', h: 'wrong name', z: 'too vague' };

// ---------- the whale (you) ----------
const WS = 0.8, REACH = 96, R0 = [700, 150];
const fixAt = (id, f) => [F[id].x - f * REACH, F[id].y - 26];
const K = []; const key = (t, p) => K.push([t, p[0], p[1]]);
key(0, [-560, 60]); key(0.55, fixAt('a', 1)); key(0.85, fixAt('a', 1)); key(1.6, fixAt('b', 1)); key(1.9, fixAt('b', 1));
key(2.6, fixAt('c', 1)); key(2.9, fixAt('c', 1)); key(3.6, [60, -140]); key(4.3, [60, -140]); key(5.8, R0); key(8.8, R0);
const FIX1 = [['g', 9.2, 9.38], ['f', 9.7, 9.88], ['d', 10.25, 10.43]], FIX2 = [['h', 12.55, 12.72]];
for (const [id, a, b] of FIX1) { key(a, fixAt(id, -1)); key(b, fixAt(id, -1)); }
key(10.65, fixAt('d', -1)); key(11.6, R0); key(11.85, R0);
for (const [id, a, b] of FIX2) { key(a, fixAt(id, -1)); key(b, fixAt(id, -1)); }
key(12.95, fixAt('h', -1)); key(13.95, R0);
const T_ZFIX = [22.85 + SB, 23.05 + SB]; key(22.4 + SB, R0); key(T_ZFIX[0], fixAt('z', -1)); key(T_ZFIX[1], fixAt('z', -1)); key(23.8 + SB, R0); key(DUR + 1, R0);
for (const [id, a] of [...FIX1, ...FIX2]) F[id].fix = a;
F.a.fix = 0.55; F.b.fix = 1.6; F.c.fix = 2.6; F.h.in = 9.8; F.z.fix = T_ZFIX[0];

function herm(P, t) { const n = P.length; if (t <= P[0][0]) return { x: P[0][1], y: P[0][2] }; if (t >= P[n - 1][0]) return { x: P[n - 1][1], y: P[n - 1][2] };
  let i = 0; while (P[i + 1][0] < t) i++; const p1 = P[i], p2 = P[i + 1], u = (t - p1[0]) / (p2[0] - p1[0]), A2 = 2 * u * u * u - 3 * u * u + 1, C2 = 1 - A2;
  return { x: A2 * p1[1] + C2 * p2[1], y: A2 * p1[2] + C2 * p2[2] }; }
const NODS = Object.values(F).filter(f => f.fix != null).map(f => f.fix);
function wworld(t) { const p = herm(K, t), q = herm(K, t + 0.01), sp = Math.hypot(q.x - p.x, q.y - p.y) * 100, still = 1 - clamp(sp / 150);
  let dip = 0; for (const s of NODS) { const d = t - s; if (d > 0 && d < 0.3) dip = Math.max(dip, 7 * Math.sin(Math.PI * d / 0.3)); }
  return { x: p.x, y: p.y + (Math.sin(t * 2.4) * 2.5 + dip) * still }; }
const wvel = t => { const a = wworld(t - 1 / 240), c = wworld(t + 1 / 240); return { x: (c.x - a.x) * 120, y: (c.y - a.y) * 120 }; };
function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
    a += (sp < 40 ? 0 : clamp(Math.atan2(v.y, Math.abs(v.x)), -0.8, 0.8) * clamp(sp / 300)) * w; s += w; } return a / s; }
const TURNS = [[3.15, -1], [4.35, 1], [5.85, -1], [10.43, 1], [11.62, -1], [12.72, 1], [13.98, -1]];
function facing(t) { let f = 1; for (const [a, to] of TURNS) f = lerp(f, to, ramp(t, a, a + 0.22, EASE.warm)); return f; }
const wpos = t => wworld(t);

// ---------- the three AI readers: peach pods with magnifiers, sweeping left → right above the letter ----------
const SPEED = 891, GAP = 180, POD_Y = -372;
const LAPS = [7.0, 10.9, 13.3, 19.15 + SA];                          // rounds 1-3, then the limit pass (same readers, same light)
const lead = (L, t) => -700 + SPEED * (t - L), lapEnd = L => L + 2.0;
const MARKS = [];
LAPS.slice(0, 3).forEach((L, r) => {
  const here = Object.entries(F).filter(([id, f]) => f.y < BEAM_Y && (f.in ?? -1) < L && (f.fix == null || f.fix > L)).sort((p, q) => p[1].x - q[1].x);
  here.forEach(([id, f], j) => { const k = (here.length - 1 - j) % 3; MARKS.push({ id, r, k, t: L + (f.x + 700 + GAP * k) / SPEED }); });
});
const ROUND = [0, 1, 2].map(r => MARKS.filter(m => m.r === r));
const ZERO = lapEnd(LAPS[2]) - 0.2;
// the new kind of reader: green, looks UP from below the letter; out to the right, then back to check again
const NR = { t0: 20.95 + SB, y: 300, v: 1100 }, NR_TURN = [23.0 + SB, 23.3 + SB], T_BLIND = 20.75 + SA, T_SPOUT = 24.15 + SB;
function nrX(t) { return t < NR_TURN[1] ? Math.min(640, -720 + NR.v * (t - NR.t0)) : 640 - NR.v * 1.4 * (t - NR_TURN[1]); }
const NR_MARK = NR.t0 + (F.z.x + 720) / NR.v, NR_CLEAR = NR_TURN[1] + (640 - F.z.x) / (NR.v * 1.4);
MARKS.push({ id: 'z', r: 3, k: 0, t: NR_MARK });
const FLAW_AMP = (f, t) => { const a = f.amp ?? 1, inn = f.in == null || f.in < 0 ? 1 : ramp(t, f.in, f.in + 0.28, EASE.glaser), out = f.fix == null ? 0 : ramp(t, f.fix, f.fix + 0.25, EASE.warm); return a * inn * (1 - out); };

// ---------- camera ----------
const CARD = [15.65, 19.15 + SA];
function cam(t) {
  const pull = ramp(t, 3.9, 6.6, EASE.rest), push = ramp(t, 14.4, 15.2, EASE.warm), rel = ramp(t, 15.4, 16.1, EASE.warm);
  const lim = ramp(t, 19.3 + SA, 20.1 + SA, EASE.warm), lrel = ramp(t, 23.9 + SB, 24.9 + SB, EASE.warm), end = ramp(t, 24.6 + SB, DUR, EASE.rest);
  let z = lerp(1.3, 1.15, pull), x = lerp(-60, 90, pull), y = lerp(-40, -30, pull);
  z = lerp(z, 1.2, push); x = lerp(x, 170, push); z = lerp(z, 1.15, rel); x = lerp(x, 90, rel);
  z += 0.05 * win(t, CARD[0], CARD[1] + 0.3, 1.6, 0.6);           // a slow breath while the card is up
  z = lerp(z, 1.2, lim); x = lerp(x, 200, lim); y = lerp(y, 20, lim);
  z = lerp(z, 1.15, lrel); x = lerp(x, 120, lrel); y = lerp(y, -30, lrel);
  const card = win(t, CARD[0] - 0.25, CARD[1] + 0.25, 0.5, 0.45);
  return { x, y, z: z - 0.03 * end, ax: 960, ay: 540 + 150 * card }; }

// ---------- text ----------
const T0 = 3.8, T_LOCK = DUR - 2.2, T_COUNTER = 6.9;
const cap = (id, inn, out, text) => ({ id, kind: 'caption', in: inn, out, fi: 0.25, fo: 0.2, text });
const lab = (id, inn, out, text, fi = 0.2, fo = 0.2) => ({ id, kind: 'label', in: inn, out, fi, fo, text });
const READ = [
  lab('tab', 0, DUR, 'Your cover letter', 0.01, 0.01),
  lab('dear', 0, DUR, 'Dear Hiring Team,', 0.01, 0.01),
  lab('you', 0.2, 3.05, 'You', 0.2, 0.3),
  cap('felt1', 0.25, 2.07, 'I keep tweaking my letter.'),
  cap('felt2', 2.12, 4.1, 'I never know when to stop.'),
  { id: 'eyebrow', kind: 'label', in: T0 + 0.25, out: T0 + 3.6, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 07' },
  { id: 'title', kind: 'title', in: T0 + 0.25, out: T0 + 3.6, fi: 0.4, fo: 0.45, text: 'Stop when the <i>counter</i> hits zero.' },
  lab('counter', T_COUNTER, DUR, 'Problems found', 0.3, 0.01),
  lab('readers', 7.1, 9.7, 'Three AI apps read it', 0.25, 0.3),
  lab('you2', 7.3, 8.85, 'You', 0.25, 0.2),
  cap('m1', 7.45, 9.45, 'The apps circle each problem.'),
  cap('m2', 9.52, 11.5, 'You fix each one. Ask again.'),
  cap('m3', 11.58, 13.5, 'Fewer problems each time.'),
  cap('m4', 13.58, 15.6, 'Nothing left to fix? Stop.'),
  lab('you3', 14.05, T_ZFIX[0] - 0.45, 'You', 0.3, 0.25),
  lab('you4', 26.3, DUR, 'You', 0.3, 0.01),
  { id: 'card', kind: 'card', card: true, in: CARD[0], out: CARD[1], fi: 0.3, fo: 0.3, text: 'Real draft: 28 problems, then 10, then 0.', src: 'https://app.notion.com/p/3f2d50cfaf938197a25ce5ee67145c35' },
  lab('src', CARD[0], CARD[1], 'Source: our own drafts', 0.3, 0.3),
  cap('lim1', 19.2 + SA, 22.85, 'Zero means: these readers found nothing.'),
  lab('newapp', NR.t0 + 0.5, NR_TURN[0] + 0.2, 'A new AI app', 0.25, 0.25),
  cap('lim2', 22.92, 24.9, 'Add one new kind of reader.'),
  cap('belief', 24.98, T_LOCK - 0.02, 'Repeat until fresh eyes find nothing. Then stop.'),
  { id: 'lockup', kind: 'label', in: T_LOCK, out: DUR, fi: 0.45, fo: 0, text: 'CETI · Capabilities · 07 · Counter' },
];
for (const m of MARKS) { const f = F[m.id]; READ.push(lab('mk-' + m.id, m.t, (f.fix ?? DUR) + 0.35, LABEL[m.id], 0.18, 0.2)); }
const RD = id => READ.find(r => r.id === id), RA = (t, id) => { const r = RD(id); return win(t, r.in, r.out, r.fi, r.fo); };

// ---------- helpers ----------
function lineY(i, x, t) { let dy = 0; for (const id in F) { const f = F[id]; if (f.y !== LY[i]) continue; const a = FLAW_AMP(f, t); if (a < 0.005) continue;
    const u = (x - f.x) / 40; dy += a * 36 * Math.exp(-u * u) * Math.sin((x - f.x) / 8.5); } return dy; }
function ringPath(c, x, y, r, p) { c.beginPath(); const a0 = -2.2; for (let k = 0; k <= 48 * p; k++) { const a = a0 + (k / 48) * Math.PI * 2.15, rr = r * (1 + 0.06 * Math.sin(a * 3 + 1));
    const px = x + rr * Math.cos(a) * 1.18, py = y + rr * Math.sin(a) * 0.86; k ? c.lineTo(px, py) : c.moveTo(px, py); } }
function tick(c, x, y, s, col, lw, a) { if (a <= 0) return; c.save(); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
  c.moveTo(x - s, y); c.lineTo(x - s * 0.25, y + s * 0.75); c.lineTo(x + s * 1.05, y - s * 0.85); c.stroke(); c.restore(); }
// a reader: a pod with a magnifying glass held at its nose. dir = +1 right / −1 left; up = looks up (the new kind)
function reader(c, x, y, s, col, dir, up, a) { c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(dir, up ? -1 : 1);
  KH.drawPod(c, 0, 0, 0.08, 130 * s, col, {});
  const mx = 74 * s, my = 34 * s, r = 22 * s; c.strokeStyle = INK; c.lineWidth = 6 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(42 * s, 14 * s); c.lineTo(mx - r * 0.7, my - r * 0.7); c.stroke();
  c.fillStyle = rgba(C.paper, 0.7); c.beginPath(); c.arc(mx, my, r, 0, Math.PI * 2); c.fill(); c.stroke(); c.restore(); }
// counter state: current number, earlier rounds, and whether it says stop (green)
function counterState(t) {
  if (t < LAPS[0] - 0.2) return { n: 0, hist: [], last: -9, stop: 0 };
  let r = 0; for (let k = 0; k < 3; k++) if (t >= LAPS[k] - 0.2) r = k;
  const hist = ROUND.slice(0, r).map(R => R.length), ms = ROUND[r].filter(m => t >= m.t);
  let n = ms.length, last = ms.length ? ms[ms.length - 1].t : LAPS[r] - 0.2, stop = r === 2 ? ramp(t, ZERO, ZERO + 0.35, EASE.glaser) : 0;
  if (t >= NR_MARK) { n = 1; last = NR_MARK; stop = 0; }
  if (t >= NR_CLEAR) { n = 0; last = NR_CLEAR; stop = ramp(t, NR_CLEAR, NR_CLEAR + 0.35, EASE.glaser); }
  return { n, hist, last, stop }; }

function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay;
  S.ground(c, t, cm, { tint: PINK });
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.lineCap = 'round'; c.lineJoin = 'round';

  // the letter
  c.fillStyle = SHADOW; c.beginPath(); c.roundRect(X(PX0) + 10 * z, Y(PY0) + 12 * z, (PX1 - PX0) * z, (PY1 - PY0) * z, 10 * z); c.fill();
  c.fillStyle = PAGE; c.strokeStyle = EDGE; c.lineWidth = 2; c.beginPath(); c.roundRect(X(PX0), Y(PY0), (PX1 - PX0) * z, (PY1 - PY0) * z, 10 * z); c.fill(); c.stroke();
  S.chip(c, 'Your cover letter', X(PX0) + 4 * z, Y(PY0) - 22 * z, { f: 'mono', size: Math.round(22 * z), col: INK, pad: 12 * z, bg: PAGE, border: EDGE, track: 0.12 });
  text(c, 'Dear Hiring Team,', X(LX0), Y(-198), { f: 'sans', size: Math.round(34 * z), col: INK });

  // light: the three readers look down to BEAM_Y; the new reader looks up from below
  const lapA = L => win(t, L - 0.1, lapEnd(L), 0.25, 0.35);
  c.save(); c.beginPath(); c.rect(X(PX0), Y(PY0), (PX1 - PX0) * z, (PY1 - PY0) * z); c.clip();
  for (const L of LAPS) { const a = lapA(L); if (a <= 0) continue; const ld = lead(L, t);
    for (let k = 0; k < 3; k++) { const px = ld - GAP * k; if (px < PX0 - 120 || px > PX1 + 120) continue;
      c.fillStyle = rgba(RBEAM, 0.16 * a); c.beginPath(); c.moveTo(X(px - 22), Y(PY0)); c.lineTo(X(px + 22), Y(PY0)); c.lineTo(X(px + 68), Y(BEAM_Y)); c.lineTo(X(px - 68), Y(BEAM_Y)); c.closePath(); c.fill();
      c.strokeStyle = rgba(RBEAM, 0.6 * a); c.lineWidth = 3 * z; c.beginPath(); c.moveTo(X(px - 68), Y(BEAM_Y)); c.lineTo(X(px + 68), Y(BEAM_Y)); c.stroke(); } }
  { const a = win(t, NR.t0 + 0.4, 23.95 + SB, 0.3, 0.3); if (a > 0) { const px = nrX(t);
      c.fillStyle = rgba(NBEAM, 0.2 * a); c.beginPath(); c.moveTo(X(px - 22), Y(PY1)); c.lineTo(X(px + 22), Y(PY1)); c.lineTo(X(px + 68), Y(150)); c.lineTo(X(px - 68), Y(150)); c.closePath(); c.fill();
      c.strokeStyle = rgba(NBEAM, 0.7 * a); c.lineWidth = 3 * z; c.beginPath(); c.moveTo(X(px - 68), Y(150)); c.lineTo(X(px + 68), Y(150)); c.stroke(); } }
  c.restore();

  // the lines of text
  c.strokeStyle = TXT; c.lineWidth = Math.max(4, 9 * z);
  LY.forEach((ly, i) => { for (const [a, b] of WORDS[i]) { c.beginPath(); for (let x = a; x <= b; x += 3) { const yy = ly + lineY(i, x, t); x === a ? c.moveTo(X(x), Y(yy)) : c.lineTo(X(x), Y(yy)); } c.stroke(); } });

  // the blind spot: a dashed circle and "?" once the three readers have passed it by
  { const f = F.z, a = win(t, T_BLIND, NR_MARK + 0.1, 0.35, 0.15); if (a > 0) { c.save(); c.globalAlpha = a; c.strokeStyle = SOFT; c.lineWidth = 4 * z; c.setLineDash([10 * z, 9 * z]);
      ringPath(c, X(f.x), Y(f.y), 50 * z, 1); c.stroke(); c.setLineDash([]); c.restore(); S.chip(c, '?', X(f.x - 92), Y(f.y + 14), { f: 'disp', size: Math.round(46 * z), col: INK, a, align: 'center', bg: PAGE, pad: 10 * z }); } }

  // red-pen marks → green ticks at the fix; each with a plain label
  for (const m of MARKS) { if (t < m.t) continue; const f = F[m.id], p = ramp(t, m.t, m.t + 0.3, EASE.glaser), fx = f.fix ?? 99;
    const gone = ramp(t, fx, fx + 0.3, EASE.warm), pop = 1 + 0.12 * Math.exp(-(t - m.t) * 9);
    if (gone < 1) { c.save(); c.globalAlpha = 1 - gone; c.strokeStyle = PEN; c.lineWidth = Math.max(5, 6 * z); ringPath(c, X(f.x), Y(f.y), 52 * z * pop, p); c.stroke(); c.restore(); }
    tick(c, X(f.x), Y(f.y - 4), 20 * z, OK, Math.max(5, 6 * z), win(t, fx + 0.05, fx + 0.95, 0.12, 0.4));
    const la = RA(t, 'mk-' + m.id); if (la > 0) { const rt = f.x > 150, below = m.id === 'z';
      S.chip(c, LABEL[m.id], X(f.x + (rt ? -62 : 58)), Y(f.y + (below ? -50 : -52)), { align: rt ? 'right' : 'left', f: 'sans', size: Math.round(32 * z), col: INK, a: la, bg: PAGE, border: PEN, pad: 10 * z }); } }

  // the three AI readers
  for (const L of LAPS) { const a = lapA(L); if (a <= 0) continue; const ld = lead(L, t);
    for (let k = 0; k < 3; k++) { const px = ld - GAP * k; if (px < PX0 - 220 || px > PX1 + 260) continue; const fade = 1 - ramp(px, PX1 + 60, PX1 + 240, EASE.rest);
      reader(c, X(px), Y(POD_Y + Math.sin(t * 7 + k * 1.9) * 5), z, READER, 1, false, a * fade); } }
  { const a = RA(t, 'readers'); if (a > 0) { const px = lead(LAPS[0], t) - GAP; S.chip(c, 'Three AI apps read it', X(clamp(px, -200, 170)), Y(POD_Y - 74), { f: 'mono', size: Math.round(30 * z), col: INK, a, align: 'center', bg: C.paper, border: EDGE, track: 0.12 }); } }
  // the new kind of reader (green, looking up from below), out and back
  { const a = win(t, NR.t0, 24.05 + SB, 0.3, 0.3); if (a > 0) { const dir = t < NR_TURN[0] ? 1 : t < NR_TURN[1] ? lerp(1, -1, ramp(t, NR_TURN[0], NR_TURN[1], EASE.warm)) : -1;
      reader(c, X(nrX(t)), Y(NR.y + Math.sin(t * 6) * 4), z * 1.05, NEWR, dir, true, a);
      const la = RA(t, 'newapp'); if (la > 0) S.chip(c, 'A new AI app', X(clamp(nrX(t) - 130, -300, 510)), Y(NR.y + 4), { f: 'mono', size: Math.round(28 * z), col: INK, a: la, align: 'right', bg: C.paper, border: NEWR, track: 0.1 }); } }

  // the counter: PROBLEMS FOUND — earlier rounds, then this round, in one row
  { const a = ramp(t, T_COUNTER, T_COUNTER + 0.45, EASE.warm); if (a > 0) {
      const cx = 690, cy = -120, wd = 360, ht = 236, s = counterState(t), pop = 1 + 0.22 * Math.exp(-(t - s.last) * 9);
      const glow = Math.max(win(t, ZERO, ZERO + 1.6, 0.1, 0.6), win(t, NR_CLEAR, NR_CLEAR + 1.6, 0.1, 0.6));
      c.save(); c.globalAlpha = a;
      if (glow > 0.02) { c.strokeStyle = rgba(OK, 0.32 * glow); c.lineWidth = 16 * z; c.beginPath(); c.roundRect(X(cx - wd / 2), Y(cy - ht / 2), wd * z, ht * z, 14 * z); c.stroke(); }
      c.fillStyle = C.paper; c.strokeStyle = mix(EDGE, DSG, s.stop); c.lineWidth = lerp(2, 5, s.stop) * z; c.beginPath(); c.roundRect(X(cx - wd / 2), Y(cy - ht / 2), wd * z, ht * z, 14 * z); c.fill(); c.stroke();
      c.restore();
      text(c, 'Problems found', X(cx), Y(cy - 74), { f: 'mono', size: Math.round(24 * z), col: SOFT, a, align: 'center', track: 0.1 });
      // measure the row: [h1 → h2 →] N [✓]
      const HS = 50, BS = 116, AW = 44; c.save(); c.font = `${HS}px ${KH.FONTS.sans}`; const hw = s.hist.map(n => c.measureText(String(n)).width); c.font = `${BS}px ${KH.FONTS.sans}`; const bw = c.measureText(String(s.n)).width; c.restore();
      const tw = hw.reduce((p, w) => p + w + AW + 14, 0) + bw + (s.stop > 0 ? 70 * s.stop : 0); let x = cx - tw / 2; const by = cy + 62;
      s.hist.forEach((n, j) => { const ha = a * ramp(t, LAPS[j + 1] - 0.2, LAPS[j + 1] + 0.25, EASE.warm);
        text(c, String(n), X(x), Y(by), { f: 'sans', size: Math.round(HS * z), col: SOFT, a: ha }); x += hw[j] + 7;
        c.save(); c.globalAlpha = ha; c.strokeStyle = SOFT; c.lineWidth = 4 * z; const ay = Y(by - 18); c.beginPath(); c.moveTo(X(x), ay); c.lineTo(X(x + AW - 8), ay);
        c.moveTo(X(x + AW - 20), ay - 9 * z); c.lineTo(X(x + AW - 8), ay); c.lineTo(X(x + AW - 20), ay + 9 * z); c.stroke(); c.restore(); x += AW + 7; });
      c.save(); c.translate(X(x + bw / 2), Y(by)); c.scale(pop, pop); text(c, String(s.n), 0, 0, { f: 'sans', size: Math.round(BS * z), col: mix(INK, DSG, s.stop), a, align: 'center' }); c.restore();
      tick(c, X(x + bw + 40), Y(by - 40), 24 * z, DSG, 8 * z, s.stop * a); } }

  // the little whale: you
  { const p = wworld(t), ang = heading(t), v = wvel(t), sp = Math.hypot(v.x, v.y), moving = clamp(sp / 400), f = facing(t);
    let blink = 0; for (const k of [1.3, 5.2, 8.2, 12.3, 16.6, 18.4, 21.0, 26.5, 28.6]) blink = Math.max(blink, 1 - Math.abs(t - k) / 0.07);
    let squash = 0; for (const k of NODS) { const d = t - k; if (d >= 0 && d < 0.3) squash = Math.max(squash, 0.12 * (1 - EASE.glaser(d / 0.3))); }
    const fixing = NODS.some(k => t > k - 0.35 && t < k + 0.35);
    const focus = fixing ? 1 : Math.max(win(t, 3.6, 4.4, 0.2, 0.3) * 0.7, win(t, 20.9, 23.4, 0.2, 0.2) * 0.6);
    const eye = 1 + 0.35 * Math.max(win(t, 0.95, 1.4, 0.05, 0.3), win(t, 2.05, 2.5, 0.05, 0.3), win(t, 3.1, 3.7, 0.05, 0.3), win(t, NR_MARK, NR_MARK + 0.5, 0.05, 0.3));
    const spark = Math.max(win(t, ZERO, ZERO + 1.0, 0.12, 0.4), win(t, NR_CLEAR, NR_CLEAR + 1.2, 0.12, 0.5));
    const delight = (t > ZERO + 0.05 && t < ZERO + 1.2) || t > NR_CLEAR + 0.05 ? 1 : 0;
    const finUp = win(t, 3.3, 4.5, 0.25, 0.3);
    c.save(); c.translate(X(p.x), Y(p.y)); c.scale(f, 1);
    KH.drawWhale(c, { x: 0, y: 0, ang, scale: WS * z, L: 1, tail: Math.sin(t * (moving > 0.3 ? 11 : 3)) * lerp(0.12, 0.34, moving), fin: lerp(Math.sin(t * 6 + 1.3) * lerp(0.15, 0.3, moving), -1.05, finUp),
      blink, squash, focus: delight ? 0 : focus, eye, spark, sparkColor: OK, delight, blush: 0.6, spray: win(t, T_SPOUT, T_SPOUT + 1.35, 0.35, 0.6), sprayColor: mix(C.mist, C.navy, 0.2),
      mouth: delight ? 0.4 : 0.3 * win(t, 3.15, 3.9, 0.06, 0.3), sw: 3.2 });
    c.restore();
    const ya = Math.max(...['you', 'you2', 'you3', 'you4'].map(id => RA(t, id))); if (ya > 0) S.chip(c, 'You', X(p.x), Y(p.y - 92), { f: 'mono', size: Math.round(28 * z), col: INK, a: ya, align: 'center', bg: C.paper, border: EDGE, track: 0.16 }); }

  // the title hinge
  const veil = win(t, 3.9, T0 + 3.68, 0.35, 0.4); if (veil > 0) { c.fillStyle = rgba(C.paper, 0.9 * veil); c.fillRect(0, 0, W, H); }

  // the real-numbers card: one line, top centre on clean paper; each number gets a green underline in turn
  const ka = RA(t, 'card'); if (ka > 0) { const dy = (1 - EASE.defer(ramp(t, CARD[0], CARD[0] + 0.35))) * 8, MS = 54, y0 = 34 + dy;
    const SEG = [['Real draft: ', 0], ['28', 1], [' problems, then ', 0], ['10', 1], [', then ', 0], ['0', 2], ['.', 0]];
    c.save(); c.font = `${MS}px ${KH.FONTS.sans}`; const sw = SEG.map(([s]) => c.measureText(s).width); c.restore();
    const tw = sw.reduce((p, w) => p + w, 0), wd = tw + 120, x0 = 960 - tw / 2, ht = 170;
    c.save(); c.globalAlpha = ka; c.fillStyle = C.paper; c.strokeStyle = EDGE; c.lineWidth = 1.4; c.beginPath(); c.roundRect(960 - wd / 2, y0, wd, ht, 10); c.fill(); c.stroke();
    c.fillStyle = DSG; c.fillRect(960 - wd / 2, y0, 6, ht); c.restore();
    let x = x0, nk = 0; SEG.forEach(([s, kind], j) => { text(c, s, x, y0 + 82, { f: 'sans', size: MS, col: kind === 2 ? DSG : INK, a: ka });
      if (kind) { const u = ramp(t, CARD[0] + 0.35 + nk * 0.45, CARD[0] + 0.7 + nk * 0.45, EASE.glaser); nk++;
        if (u > 0) { c.save(); c.globalAlpha = ka; c.strokeStyle = kind === 2 ? DSG : OK; c.lineWidth = 6; c.beginPath(); c.moveTo(x, y0 + 100); c.lineTo(x + sw[j] * u, y0 + 100); c.stroke(); c.restore(); } }
      x += sw[j]; });
    text(c, 'Source: our own drafts', x0, y0 + 142, { f: 'sans', size: 30, col: SOFT, a: ka }); }

  for (const r of READ) if (r.kind === 'caption') S.caption(c, t, r, { size: 40 });
  S.open(c, t - T0, { no: '07', title: 'Stop when the <i>counter</i> hits zero.', accent: ACC }, { out: 3.6 });
  S.lockup(c, t, T_LOCK, { no: '07', short: 'Counter' });
  c.restore();
}

function cues() {
  return { bpm: BPM, dur: DUR, title: T0 + 0.25, veil: 3.9, unveil: T0 + 3.2,
    pop: Object.values(F).filter(f => f.in > 0 && f.in < 4).map(f => f.in), popNew: [F.h.in],
    fixFelt: [F.a.fix, F.b.fix, F.c.fix], fix: [...FIX1, ...FIX2].map(x => x[1]).concat([T_ZFIX[0]]), counterIn: T_COUNTER,
    lap: LAPS.slice(0, 3), limitLap: LAPS[3], mark: MARKS.filter(m => m.r < 3).map(m => ({ t: m.t, r: m.r, k: m.k, n: ROUND[m.r].indexOf(m) + 1 })),
    zero: ZERO, card: CARD[0], cardNums: [0, 1, 2].map(j => CARD[0] + 0.35 + j * 0.45), blind: T_BLIND,
    newReader: NR.t0, newMark: NR_MARK, newTurn: NR_TURN[0], clear: NR_CLEAR, spout: T_SPOUT, belief: RD('belief').in, lockup: T_LOCK,
    tags: { consequence: [F.b.in, F.c.in, F.d.in], focus: [F.a.fix, ZERO, NR_CLEAR], mech: MARKS.map(m => m.t), limit: [T_BLIND] } }; }
const CONTRAST = [['captions / chips (ink on paper)', INK, C.paper], ['title (ink on chart ground)', INK, BG], ['title accent on ground', ACC, BG],
  ['title accent on veiled ground (paper)', ACC, C.paper], ['eyebrow / lockup (slate on ground)', SOFT, BG], ['card label + source, counter label + earlier rounds (slate on paper)', SOFT, C.paper],
  ['letter greeting, tab, mark labels, "?" (ink on letter page)', INK, PAGE], ['zero + card 0 (deep slate green on paper)', DSG, C.paper], ['"You" / "A new AI app" chips (ink on paper)', INK, C.paper]];
const INTENT = {
  problem: 'You keep tweaking your cover letter and never know when it is done; each fix seems to make a new rough bit.',
  move: 'Three AI apps read the letter and circle problems; you fix each one and ask again; a counter shows problems found each round (3, 1, 0). Stop at zero. Zero only means these apps found nothing, so add one new kind of AI app as a reader.',
  belief: 'Repeat until fresh eyes find nothing. Then stop.' };
const TERMS = [{ term: 'counter', pictured_at: T_COUNTER }];   // an everyday word, named in the title, pictured as the veil lifts
root.EPISODE = { drawFrame, cues, READ, CONTRAST, DUR, W, H, fps: 60, wpos, heading, cam, INTENT, TERMS,
  shutter: t => (t > 8.7 && t < 11.7) || (t > 11.8 && t < 14.0) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
