// CETI Capabilities 09 · private — "Private notes stay home." (v6) Kinetic Hydrography 1.0.0 + series layer. 30-s house format.
// Source: storyboards/c04/sb-04-04 (Context Atoms), compressed. Everyday picture: an email is a page of notes; each client has a
// folder. Beside a note sits a small PRIVATE button; you tap it and it becomes a violet stamp. A stamped note is tied by a violet
// thread to its own client's folder, so when the email goes to anyone else the thread pulls that note back home. And also: tap
// it when you write the note; a note whose button was never tapped still goes (shown landing, circled, in the limit beat).
// drawFrame(ctx, t) is a pure function of t.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, win, EASE, ramp, mix, rgba, text } = KH;
const W = 1920, H = 1080, BPM = 120;
// v6 retime: M maps v5 beat times to v6 (longer title hold, slower tie, the "no one has to remember" beat and its email cut).
const MK = [[0, 0], [5.4, 5.4], [6.9, 7.9], [10.0, 11.0], [10.7, 12.2], [12.05, 14.05], [14.37, 16.37], [16.45, 16.4], [40, 39.95]];
const M = v => { let i = 0; while (i < MK.length - 2 && MK[i + 1][0] < v) i++; const [a, A] = MK[i], [b, B2] = MK[i + 1]; return +(A + (v - a) / (b - a) * (B2 - A)).toFixed(4); };
const DUR = M(28.65);
const INK = C.navy, SOFT = C.slate, VIO = WD.violetBlue, RED = WD.englishRed, SAL = WD.ochraceousSalmon, GLAU = WD.lightGlaucousBlue;
const BG = mix(C.paper, VIO, 0.06);                          // what SERIES.ground paints with tint: violet blue
let ACC = VIO; for (let k = 0; k <= 1; k += 0.05) { ACC = mix(VIO, INK, k); if (KH.contrast(ACC, BG) >= 4.6 && KH.contrast(ACC, C.paper) >= 4.6) break; }
const CARD = mix(C.paper, C.slate, 0.06), CARDEDGE = mix(C.paper, C.slate, 0.5), CLINE = mix(C.paper, C.slate, 0.32), PTAB = mix(C.paper, C.slate, 0.4);
const PAGEEDGE = mix(C.paper, C.slate, 0.55), BOXF = mix(C.paper, C.slate, 0.08), BOXB = mix(C.paper, C.slate, 0.26);
const ALARM = mix(RED, INK, 0.1), STAMPC = mix(VIO, INK, 0.1), THREAD = VIO, CROSS = mix(GLAU, INK, 0.45);
const CHIPF = mix(CARD, VIO, 0.12), BTNSH = rgba(C.slate, 0.35);

// ---------- the world: one desk (the email being written), two client boxes ----------
const DESK = { x: 0, y: 40 }, PW = 344, PH = 300, CY = [-50, 28, 106], CW = 304, CH = 74;
const BAK = { x: -480, y: 70 }, CLI = { x: 480, y: 70 }, RIM = -60, BW = 290, BH = 150;
const ANCH = { x: BAK.x, y: BAK.y + RIM };
const SLOT = i => ({ x: BAK.x - 18 + 34 * i, y: BAK.y + RIM - 14 - 5 * (i % 2), r: -0.09 + 0.06 * i });
const POP = { x: 440, y: -192 }, PSC = 0.92, TICK = { x: CLI.x, y: -110 }, POD = { x: 245, y: 135 }, PODS = 120, PODCOL = mix(C.slate, C.paper, 0.35);
const PODEYE = { x: POD.x - 27, y: POD.y - 9 };

// ---------- the emails: each has a header (To:), three cards, a send time and a flight time ----------
const LET = [
  // L1 and L5 do not vanish into the folder: they land just above the Clinic's folder and stay open, so the viewer sees
  // the Bakery note arrive inside the Clinic's email (v5, lay jury: "never saw the Clinic email get the note").
  { id: 'L1', in: -1, send: 1.4, fly: 0.95, mid: 'bakery', hdr: [['To: Bakery', -1, 1.05, 0, 0.15], ['To: Clinic', 1.0, M(7.65), 0.15, 0.4]], pop: [M(7.25), M(7.65)] },
  // L2 carries the PRIVATE button beside its note: tapped at L2.stamp, it becomes the stamp. L5's button is never tapped.
  { id: 'L2', in: M(7.55), send: M(12.25), fly: 0.9, mid: 'sealed', btn: true, stamp: M(8.5), thread: [M(10.0), M(10.7)], hdr: [['To: Bakery', M(7.65), M(12.0), 0.3, 0.15], ['To: Clinic', M(11.9), M(13.2), 0.15, 0.1]] },
  { id: 'L5', in: M(19.85), send: M(20.95), fly: 0.85, mid: 'scrawl', btn: true, scrawl: [M(20.3), M(20.8)], hdr: [['To: Clinic', M(19.9), M(23.8), 0.3, 0.4]], pop: [M(23.4), M(23.8)] },
  { id: 'L6', in: M(23.25), send: M(24.55), fly: 0.95, mid: 'sealed', hdr: [['To: Bakery', M(23.25), M(24.45), 0.15, 0.15], ['To: Clinic', M(24.35), M(25.55), 0.1, 0.1]] },
];
let home = 0;
for (const L of LET) { L.arr = L.send + L.fly;
  if (L.mid === 'sealed') { L.taut = L.send + 0.3; L.land = L.taut + 1.0; L.slot = home++; L.ok = L.arr + 0.1; }
  else { L.stay = true; L.popT = L.arr; } }
const LANDS = LET.filter(L => L.land).map(L => ({ t: L.land, slot: L.slot, id: L.id }));
const OKS = LET.filter(L => L.ok).map((L, i, a) => ({ t: L.ok, out: i + 1 < a.length ? Math.min(a[i + 1].ok - 0.05, L.ok + 1.4) : DUR + 1 }));
const SCANS = LET.filter(L => L.taut || L.mid === 'scrawl').map(L => ({ L, t: (L.taut ? L.taut - 0.4 : L.send - 0.3) }));
const POPS = LET.filter(L => L.stay).map(L => ({ L, t: L.popT, circ: L.popT + 0.3, fade: L.pop }));

function letter(L, t) {   // email page transform: x, y, scale, alpha
  let a = L.in < 0 ? 1 : ramp(t, L.in, L.in + 0.3, EASE.warm);
  const u = ramp(t, L.send, L.arr, EASE.warm);
  if (L.stay) { const x = lerp(DESK.x, POP.x, u), y = lerp(DESK.y, POP.y, u) - 40 * Math.sin(Math.PI * u), s = lerp(1, PSC, u);
    return { x, y, s, a: a * (1 - ramp(t, L.pop[0], L.pop[1], EASE.rest)) }; }
  const x = lerp(DESK.x, CLI.x, u), y = lerp(DESK.y, CLI.y - 10, u) - 90 * Math.sin(Math.PI * u), s = lerp(1, 0.4, u);
  a *= 1 - ramp(t, L.arr - 0.1, L.arr + 0.04, EASE.rest);
  return { x, y, s, a: t > L.arr + 0.05 ? 0 : a };
}
function sealedCard(L, t) {   // where the stamped card is: in the email, being pulled home, or home
  const at = (tt) => { const lt = letter(L, tt), g = ramp(tt, L.send, L.taut, EASE.warm);   // tugged: the thread holds the card back as the email leaves
    return { x: lt.x - 120 * g, y: lt.y + CY[1] * lt.s + 20 * g, s: lt.s, r: -0.12 * g }; };
  const p0 = at(Math.min(t, L.taut));
  if (t <= L.send) return { ...p0, inLetter: true };
  if (t <= L.taut) return { ...p0, inLetter: false };
  const H0 = SLOT(L.slot), u = ramp(t, L.taut, L.taut + 0.8, EASE.warm), d = ramp(t, L.taut + 0.8, L.land, EASE.glaser);
  const up = { x: H0.x, y: H0.y - 120 };
  return { x: lerp(p0.x, up.x, u), y: lerp(p0.y, up.y, u) - 60 * Math.sin(Math.PI * u) + (H0.y - up.y) * d, s: lerp(p0.s, 0.8, u), r: lerp(p0.r, H0.r, u), inLetter: false };
}

// ---------- the whale ("you"): Hermite through keys (zero tangents = it settles at each key) ----------
const WS = 0.8, REACH = 118 * WS + 48;
// the PRIVATE button sits on the note's lower right, under the words (card coords BTN). The whale taps its right end nose-down
// from above-right (TILT), so its head stays right of and below the words; the scrawl is on the loaf (left).
const BTN = { x: 22, y: 4, w: 116, h: 32 }, IMP = { x: DESK.x + BTN.x + BTN.w / 2, y: DESK.y + CY[1] + BTN.y + BTN.h / 2 };
const TA = 0.55, TAPNOSE = { x: IMP.x + 34, y: IMP.y - 2 };
const PERCH0 = [-150, -180], PERCHR = [235, -245], PRESS = [TAPNOSE.x + REACH * Math.cos(TA) - 4 * Math.sin(TA), TAPNOSE.y - REACH * Math.sin(TA) - 4 * Math.cos(TA)],
  HOVER = [PRESS[0] + 46, PRESS[1] - 40],
  SCRAWL = [DESK.x - 116 - REACH, DESK.y + CY[1] - 60], WATCH = [40, -250], BAKP = [-480, -160];
const K = [[0, ...PERCH0], [2.85, ...PERCH0], [3.7, 120, -235], [4.85, 120, -235], [5.65, 100, -150], [M(7.8), 100, -150],
  [M(8.25), ...HOVER], [M(8.5), ...PRESS], [M(8.5) + 0.55, ...PRESS], [M(8.5) + 0.85, ...HOVER], [M(9.55) + 0.4, ...PERCHR], [M(16.55), ...PERCHR], [M(17.75), ...BAKP], [M(18.95), ...BAKP],
  [M(19.95), ...SCRAWL], [M(20.85), ...SCRAWL], [M(21.55), ...WATCH], [M(23.0), ...WATCH], [M(23.75), ...PERCH0], [DUR + 1, ...PERCH0]];
function herm(P, t) { const n = P.length; if (t <= P[0][0]) return { x: P[0][1], y: P[0][2] }; if (t >= P[n - 1][0]) return { x: P[n - 1][1], y: P[n - 1][2] };
  let i = 0; while (P[i + 1][0] < t) i++; const p1 = P[i], p2 = P[i + 1], u = (t - p1[0]) / (p2[0] - p1[0]), A2 = 2 * u * u * u - 3 * u * u + 1, C2 = 1 - A2;
  return { x: A2 * p1[1] + C2 * p2[1], y: A2 * p1[2] + C2 * p2[2] }; }
const NODS = [0.95, M(11.55), M(17.95), M(18.35), M(23.9)];
function wworld(t) { const p = herm(K, t), q = herm(K, t + 0.01), sp = Math.hypot(q.x - p.x, q.y - p.y) * 100, still = 1 - clamp(sp / 150);
  let dip = 0; for (const s of NODS) { const d = t - s; if (d > 0 && d < 0.35) dip = Math.max(dip, 7 * Math.sin(Math.PI * d / 0.35)); }
  const wig = win(t, M(20.3), M(20.8), 0.05, 0.05) * 7 * Math.sin((t - M(20.3)) * 30);
  return { x: p.x + wig, y: p.y + (Math.sin(t * 2.4) * 2.5 + dip) * still }; }
const wvel = t => { const a = wworld(t - 1 / 240), c = wworld(t + 1 / 240); return { x: (c.x - a.x) * 120, y: (c.y - a.y) * 120 }; };
function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
    a += (sp < 40 ? 0 : clamp(Math.atan2(v.y, Math.abs(v.x)), -0.8, 0.8) * clamp(sp / 300)) * w; s += w; } return a / s; }
const TURNS = [[M(7.45), -1], [M(11.05), 1], [M(16.0), -1], [M(18.6), 1]];
function facing(t) { let f = 1; for (const [a, to] of TURNS) f = lerp(f, to, ramp(t, a, a + 0.25, EASE.warm)); return f; }
// nose-down tilt for the tap (eased in and out; part of the angle the gate checks)
const tilt = t => TA * win(t, M(8.0), M(8.5) + 1.0, 0.3, 0.4);
const angle = t => heading(t) + tilt(t);
function nose(t) { const p = wworld(t), a = angle(t), f = facing(t); return { x: p.x + f * (REACH * Math.cos(a) - 4 * Math.sin(a)), y: p.y + REACH * Math.sin(a) + 4 * Math.cos(a) }; }

// ---------- camera ----------
const FELT = { x: 300, y: 0, z: 1.55 }, TITLE = { x: -150, y: -320, z: 0.9 }, MID = { x: 0, y: -20, z: 1.36 }, STAMP = { x: 10, y: 0, z: 1.42 },
  CASE = { x: -60, y: -40, z: 1.3 }, LIM = { x: 40, y: -40, z: 1.3 }, PAY = { x: 0, y: -20, z: 1.36 };   // v6: no shot puts a folder within 70 px of an edge
function cam(t) { let s = { ...FELT };
  const go = (a, b, T, e) => { const k = ramp(t, a, b, e); s = { x: lerp(s.x, T.x, k), y: lerp(s.y, T.y, k), z: lerp(s.z, T.z, k) }; };
  go(4.85, 5.7, TITLE, EASE.rest); go(8.0, 8.95, STAMP, EASE.warm); go(M(9.05), M(9.85), MID, EASE.warm); go(M(16.45), M(17.55), CASE, EASE.rest);
  go(M(19.15), M(19.95), MID, EASE.warm); go(M(21.55), M(22.75), LIM, EASE.warm); go(M(23.2), M(23.9), PAY, EASE.warm);
  return { x: s.x, y: s.y, z: s.z + 0.02 * ramp(t, M(25.65), DUR, EASE.rest), ax: 960, ay: 540 }; }
const wpos = t => wworld(t);

// ---------- text ----------
const T0 = 5.4, T_OUT = 2.85, T_LOCK = M(26.45);
const cap = (id, inn, out, text) => ({ id, kind: 'caption', in: inn, out, fi: 0.25, fo: 0.2, text });
const READ = [
  cap('felt1', 0.25, 2.1, 'Same email, new client.'),
  cap('felt2', 3.1, 5.4, "I didn't mean to send the client's notes."),
  { id: 'you', kind: 'label', in: 0.1, out: 2.6, fi: 0.2, fo: 0.3, text: 'You' },
  { id: 'you2', kind: 'label', in: M(7.85), out: M(9.6), fi: 0.2, fo: 0.3, text: 'You' },
  { id: 'email', kind: 'label', in: 0, out: M(7.65), fi: 0.01, fo: 0.4, text: 'Email' },
  { id: 'eyebrow', kind: 'label', in: T0 + 0.25, out: T0 + T_OUT, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 09' },
  { id: 'title', kind: 'title', in: T0 + 0.25, out: T0 + T_OUT, fi: 0.4, fo: 0.45, text: 'Private notes stay home.' },
  cap('stamp', M(7.9), M(9.85), 'Tap PRIVATE to stamp the note.'),
  cap('tied', 10.85, 14.0, 'Stamped notes are tied to their folder.'),            // v6: held ≥ read time + 1 s
  cap('check', M(12.05), M(14.32), 'Your AI app checks the stamp before sending.'),
  // v6: one plain real-example card (was "True story: …", unclear three runs)
  { id: 'card', kind: 'card', card: true, in: M(16.5), out: M(20.5), fi: 0.25, fo: 0.25, text: 'Real example: our AI app keeps one folder per client.', src: 'https://app.notion.com/p/3fbd50cfaf9381048ffaecd94c9f8264' },
  // v6: the limit is an "and also" instruction at write time, over a new note whose PRIVATE button was never tapped
  cap('limit', M(21.0), M(23.7), 'Stamp a note the moment you write it.'),
  cap('belief', M(23.8), T_LOCK - 0.05, 'Stamp private notes once. They stay home.'),
  { id: 'ai1', kind: 'label', in: 0.1, out: DUR, fi: 0.3, fo: 0, text: 'Your AI app' },
  { id: 'lockup', kind: 'label', in: T_LOCK, out: DUR, fi: 0.45, fo: 0, text: 'CETI · Capabilities · 09 · Private' },
  { id: 'boxB', kind: 'label', in: 0, out: DUR, fi: 0.01, fo: 0, text: 'Client folder Bakery' },
  { id: 'boxC', kind: 'label', in: 0, out: DUR, fi: 0.01, fo: 0, text: 'Client folder Clinic' },
];
LET.forEach(L => L.hdr.forEach(([s, a, b, fi, fo], k) => READ.push({ id: `${L.id}h${k}`, kind: 'header', in: a, out: b, fi, fo, text: s })));
LET.forEach(L => { if (L.mid !== 'plain') READ.push({ id: `${L.id}note`, kind: 'note', in: L.in, out: L.pop ? L.pop[1] : DUR, fi: L.in < 0 ? 0.01 : 0.3, fo: L.pop ? 0.3 : 0, text: "Bakery's rent is late" }); });
LET.filter(L => L.mid === 'sealed' || L.btn).forEach(L => READ.push({ id: `${L.id}priv`, kind: 'stamp', in: L.in, out: L.pop ? L.pop[1] : DUR, fi: L.in < 0 ? 0.01 : 0.3, fo: L.pop ? 0.3 : 0, text: 'PRIVATE' }));
const RD = id => READ.find(r => r.id === id), RA = (t, id) => { const r = RD(id); return win(t, r.in, r.out, r.fi, r.fo); };
const INTENT = {
  problem: "Your AI app sends last week's email to a new client (the Clinic), and the old client's private note (\"Bakery's rent is late\") arrives inside the Clinic's email.",
  move: "When you write the note you tap the small PRIVATE button beside it; it becomes a stamp and the note is tied to the Bakery's folder. Your AI app checks the stamp before sending, so the stamped note is pulled back home.",
  belief: "Stamp private notes once, the moment you write them, and they stay with their client. And also: a note whose button you never tapped can still go." };
const TERMS = [];

// ---------- drawing helpers ----------
function loaf(c, x, y, s, fill, stroke, lw, prog = 1) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = lw / s; c.lineJoin = 'round'; c.lineCap = 'round';
  const p = new root.Path2D('M-22,12 L22,12 L22,-1 C22,-19 -22,-19 -22,-1 Z M-11,-9 L-6,1 M0,-11 L5,-1 M11,-9 L15,0');
  if (prog < 1) c.setLineDash([150 * prog, 400]);
  if (fill && prog >= 1) { c.fillStyle = fill; c.fill(new root.Path2D('M-22,12 L22,12 L22,-1 C22,-19 -22,-19 -22,-1 Z')); }
  c.strokeStyle = stroke; c.stroke(p); c.restore(); }
function cross(c, x, y, s, col) { c.save(); c.strokeStyle = col; c.lineWidth = 9 * s; c.lineCap = 'round'; c.beginPath();
  c.moveTo(x - 15 * s, y); c.lineTo(x + 15 * s, y); c.moveTo(x, y - 15 * s); c.lineTo(x, y + 15 * s); c.stroke(); c.restore(); }
// a note card. kind: plain | bakery (unstamped private note) | sealed (stamped) | scrawl (note written on a plain card)
function card(c, X, Y, z, kind, s, r, a, o = {}) {
  const k = s * z; c.save(); c.globalAlpha *= a; c.translate(X, Y); c.rotate(r); c.scale(k, k);
  c.fillStyle = CARD; c.strokeStyle = CARDEDGE; c.lineWidth = 2 / Math.min(1, k) * 0.8; c.beginPath(); c.roundRect(-CW / 2, -CH / 2, CW, CH, 7); c.fill(); c.stroke();
  const sealed = kind === 'sealed' ? (o.seal ?? 1) : 0;
  c.fillStyle = mix(PTAB, VIO, sealed); c.beginPath(); c.roundRect(-CW / 2, -CH / 2, 13, CH, [7, 0, 0, 7]); c.fill();
  if (kind === 'plain') { c.strokeStyle = CLINE; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(-110, -12); c.lineTo(122, -12); c.moveTo(-110, 13); c.lineTo(56, 13); c.stroke(); c.restore(); return; }
  if (kind === 'scrawl') loaf(c, -116, 2, 1.0, null, SOFT, 3.2, o.scrawl ?? 1); else loaf(c, -116, 2, 1.0, SAL, INK, 3);
  c.restore();
  if (kind !== 'scrawl' || (o.scrawl ?? 1) > 0.6) { const ta = kind === 'scrawl' ? clamp(((o.scrawl ?? 1) - 0.6) / 0.4) : 1;
    c.save(); c.translate(X, Y); c.rotate(r); text(c, "Bakery's rent is late", -84 * k, -6 * k, { f: 'sans', size: 24 * k, col: INK, a: a * ta * (o.ta ?? 1) }); c.restore(); }
  const bx = BTN.x + BTN.w / 2, by = BTN.y + BTN.h / 2;
  if (o.btn && sealed < 0.5) {   // v6: the PRIVATE button beside the words, raised (a shadow under it) until it is pressed
    const pr = o.press ?? 0, ba = a * (1 - clamp(sealed * 2)), dy = 3 * pr;
    c.save(); c.translate(X, Y); c.rotate(r); c.scale(k, k); c.globalAlpha *= ba;
    c.fillStyle = BTNSH; c.beginPath(); c.roundRect(BTN.x, BTN.y + 4, BTN.w, BTN.h, 8); c.fill();
    c.fillStyle = C.paper; c.strokeStyle = SOFT; c.lineWidth = 2.5; c.beginPath(); c.roundRect(BTN.x, BTN.y + dy, BTN.w, BTN.h, 8); c.fill(); c.stroke();
    if (o.pulse > 0) { c.strokeStyle = rgba(SOFT, 0.6 * o.pulse); c.lineWidth = 3; c.beginPath(); c.roundRect(BTN.x - 10 - 8 * (1 - o.pulse), BTN.y - 10 - 8 * (1 - o.pulse), BTN.w + 20 + 16 * (1 - o.pulse), BTN.h + 20 + 16 * (1 - o.pulse), 12); c.stroke(); }
    c.restore();
    c.save(); c.translate(X, Y); c.rotate(r); text(c, 'PRIVATE', bx * k, (by + 7 + dy) * k, { f: 'monoB', size: 19 * k, col: SOFT, a: ba, align: 'center', track: 0.12 }); c.restore(); }
  if (sealed > 0.01) {   // the stamp: the pressed button turns into a violet rubber-stamp impression in the same place
    const pop = 1 + 0.18 * (1 - sealed), sa = a * clamp(sealed * 1.4), rr = r - 0.06 * sealed;
    c.save(); c.translate(X, Y); c.rotate(rr); c.scale(k, k); c.translate(bx, by); c.scale(pop, pop); c.globalAlpha *= sa;
    c.fillStyle = CHIPF; c.strokeStyle = STAMPC; c.lineWidth = 4; c.beginPath(); c.roundRect(-BTN.w / 2, -BTN.h / 2 + 3, BTN.w, BTN.h, 6); c.fill(); c.stroke(); c.restore();
    c.save(); c.translate(X, Y); c.rotate(rr); text(c, 'PRIVATE', bx * k, (by + 10) * k, { f: 'monoB', size: 19 * k * pop, col: ACC, a: sa, align: 'center', track: 0.12 }); c.restore(); }
}

function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay;
  S.ground(c, t, cm, { tint: VIO });
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.lineCap = 'round'; c.lineJoin = 'round';

  // box backs + the stamped cards already home (peeking over the rim)
  // v6: during the opening pull-back the Bakery folder fades in as it clears the left edge (never shown touching it)
  const bakA = t < 7 ? clamp((X(BAK.x - BW / 2) - 12) / 70) : 1, FA = B => B === BAK ? bakA : 1;
  for (const B of [BAK, CLI]) { c.globalAlpha = FA(B); c.fillStyle = BOXB; c.beginPath(); c.roundRect(X(B.x - BW / 2 + 10), Y(B.y + RIM - 22), (BW - 20) * z, (BH + 22) * z, 8 * z); c.fill(); } c.globalAlpha = 1;
  for (const Ld of LANDS) if (t >= Ld.t) { const s = SLOT(Ld.slot); card(c, X(s.x), Y(s.y), z, 'sealed', 0.8, s.r, 1); }

  // the helper pod: your AI app, who sends the email (a small push) and checks each card's stamp as it goes
  { const nud = LET.reduce((m, L) => Math.max(m, win(t, L.send - 0.2, L.send + 0.3, 0.12, 0.25)), 0);
    let glow = 0; for (const sc of SCANS) glow = Math.max(glow, win(t, sc.t, sc.t + 0.55, 0.08, 0.2));
    c.save(); c.translate(X(POD.x - 16 * nud), Y(POD.y + Math.sin(t * 2.1) * 3)); c.scale(-1, 1); KH.drawPod(c, 0, 0, 0, PODS * z, PODCOL, { glow: glow * 0.9 }); c.restore();
    const la = RA(t, 'ai1'); if (la > 0) S.chip(c, 'Your AI app', X(POD.x), Y(POD.y + 82), { f: 'sans', size: Math.round(26 * z), col: INK, a: la, align: 'center', pad: 12, border: CARDEDGE }); }

  // the emails (pages with three cards)
  for (const L of LET) { const lt = letter(L, t); if (lt.a <= 0.001) continue;
    const s = lt.s * z, px = X(lt.x), py = Y(lt.y);
    c.save(); c.globalAlpha = lt.a; c.fillStyle = C.paper; c.strokeStyle = PAGEEDGE; c.lineWidth = Math.max(2.5, 3 * s);
    c.beginPath(); c.roundRect(px - PW / 2 * s, py - PH / 2 * s, PW * s, PH * s, 10 * s); c.fill(); c.stroke();
    c.strokeStyle = CLINE; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(px - 135 * s, py - 94 * s); c.lineTo(px + 135 * s, py - 94 * s); c.stroke(); c.restore();
    if (L.id === 'L1') text(c, 'Email', px + 135 * s, py - 110 * s, { f: 'mono', size: 22 * s, align: 'right', col: SOFT, a: lt.a * RA(t, 'email') });
    for (const [hs, a0, b0, fi, fo] of L.hdr) { const ha = win(t, a0, b0, fi, fo) * lt.a; if (ha <= 0.001) continue;
      const w = text(c, hs, px - 135 * s, py - 108 * s, { f: 'sans', size: 34 * s, col: INK, a: ha });
      if (hs === 'To: Bakery' && L.hdr.length > 1) { const st = ramp(t, b0 - 0.45, b0 - 0.2, EASE.warm); if (st > 0) {
        c.save(); c.globalAlpha = ha; c.strokeStyle = INK; c.lineWidth = 4 * s; c.beginPath(); const sx = px - 135 * s + 62 * s;
        c.moveTo(sx - 4 * s, py - 119 * s); c.lineTo(sx - 4 * s + (w - 58 * s) * st, py - 119 * s); c.stroke(); c.restore(); } } }
    CY.forEach((cy, i) => { const kind = i === 1 ? L.mid : 'plain';
      if (kind === 'sealed' && t > L.send) return;
      const seal = L.stamp ? ramp(t, L.stamp, L.stamp + 0.22, EASE.glaser) : 1, press = L.stamp ? ramp(t, L.stamp - 0.12, L.stamp, EASE.glaser) : 0;
      const pulse = L.mid === 'scrawl' ? win(t, L.scrawl[1], L.scrawl[1] + 0.6, 0.15, 0.3) : 0;   // the untapped button shows itself once
      card(c, px, py + cy * s, 1, kind === 'sealed' && seal <= 0 ? 'bakery' : kind, s, 0, lt.a, { seal, btn: i === 1 && L.btn, press, pulse, scrawl: L.scrawl ? ramp(t, L.scrawl[0], L.scrawl[1], EASE.warm) : 1 }); });
    if (L.stamp) { const ring = win(t, L.stamp, L.stamp + 0.7, 0.03, 0.5); if (ring > 0) { const sx = px + (BTN.x + BTN.w / 2) * s, sy = py + (CY[1] + BTN.y + BTN.h / 2) * s, rr = (70 + 50 * ramp(t, L.stamp, L.stamp + 0.7)) * s;
      c.save(); c.strokeStyle = rgba(VIO, 0.45 * ring); c.lineWidth = 5 * s; c.beginPath(); c.arc(sx, sy, rr, 0, Math.PI * 2); c.stroke(); c.restore(); } } }

  // stamped cards that have left their email and are on the way home, and the violet threads that tie them home
  for (const L of LET) { if (L.mid !== 'sealed') continue;
    const la = L.in < 0 ? 1 : ramp(t, L.in, L.in + 0.3, EASE.warm); if (la <= 0 || t >= L.land + 0.02) continue;
    const sc = sealedCard(L, t), sx = sc.x + (-CW / 2 + 6) * sc.s * Math.cos(sc.r), sy = sc.y + (-CW / 2 + 6) * sc.s * Math.sin(sc.r);   // the thread is tied to the violet tab
    let draw = L.thread ? ramp(t, L.thread[0], L.thread[1], EASE.warm) : 1;
    if (draw > 0.001) { const A = { x: X(sx), y: Y(sy) }, Bp = { x: X(ANCH.x), y: Y(ANCH.y) }, slack = (1 - ramp(t, L.send, L.taut, EASE.glaser)) * 130 * z;
      const M = { x: (A.x + Bp.x) / 2, y: (A.y + Bp.y) / 2 + slack };
      c.save(); c.globalAlpha = la; c.strokeStyle = THREAD; c.lineWidth = Math.max(6, 7 * z); c.beginPath();
      for (let k = 0; k <= 40; k++) { const u = k / 40 * draw, x = (1 - u) * (1 - u) * A.x + 2 * u * (1 - u) * M.x + u * u * Bp.x, y = (1 - u) * (1 - u) * A.y + 2 * u * (1 - u) * M.y + u * u * Bp.y; k ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke(); c.fillStyle = THREAD; c.beginPath(); c.arc(A.x, A.y, 7 * z, 0, Math.PI * 2); c.fill();
      if (draw > 0.98) { c.beginPath(); c.arc(Bp.x, Bp.y, 9 * z, 0, Math.PI * 2); c.fill(); } c.restore(); }
    if (!sc.inLetter) card(c, X(sc.x), Y(sc.y), z, 'sealed', sc.s, sc.r, la);
  }

  // the AI's look at each card as the email goes: a violet line to the stamp (held back), a slate line to the plain card (let through)
  for (const sc of SCANS) { const a = win(t, sc.t, sc.t + 0.5, 0.08, 0.15); if (a <= 0) continue; const L = sc.L;
    let tx, ty; if (L.mid === 'sealed') { const q = sealedCard(L, t); tx = q.x + 80 * q.s; ty = q.y + 20 * q.s; } else { const lt = letter(L, t); tx = lt.x + 80 * lt.s; ty = lt.y + (CY[1] + 20) * lt.s; }
    const col = L.mid === 'sealed' ? VIO : SOFT, ex = X(PODEYE.x), ey = Y(PODEYE.y);
    c.save(); c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = 4 * z; c.setLineDash([10 * z, 8 * z]); c.beginPath(); c.moveTo(ex, ey); c.lineTo(X(tx), Y(ty)); c.stroke(); c.restore(); }

  // box fronts with their labels
  for (const [B, name] of [[BAK, 'Bakery'], [CLI, 'Clinic']]) { if (FA(B) <= 0.001) continue; c.save(); c.globalAlpha = FA(B);
    const x0 = X(B.x - BW / 2), y0 = Y(B.y + RIM), w = BW * z, h = BH * z;
    let glow = 0; for (const Ld of LANDS) if (B === BAK) glow = Math.max(glow, win(t, Ld.t, Ld.t + 0.9, 0.05, 0.6));
    if (glow > 0.01) { c.save(); c.strokeStyle = rgba(VIO, 0.35 * glow); c.lineWidth = 16 * z; c.beginPath(); c.roundRect(x0, y0, w, h, 10 * z); c.stroke(); c.restore(); }
    c.fillStyle = BOXF; c.strokeStyle = INK; c.lineWidth = Math.max(4, 5 * z); c.beginPath(); c.roundRect(x0 + w - 120 * z, y0 - 26 * z, 104 * z, 40 * z, 7 * z); c.fill(); c.stroke();   // folder tab
    c.beginPath(); c.roundRect(x0, y0, w, h, 10 * z); c.fill(); c.stroke();
    text(c, 'Client folder', X(B.x), Y(B.y + RIM + 46), { f: 'mono', size: 27 * z, col: SOFT, align: 'center', track: 0.06 });
    if (B === BAK) { loaf(c, X(B.x - 70), Y(B.y + RIM + 94), 1.15 * z, SAL, INK, 3 * z); text(c, name, X(B.x + 22), Y(B.y + RIM + 110), { f: 'sans', size: 42 * z, col: INK, align: 'center' }); }
    else text(c, name, X(B.x), Y(B.y + RIM + 110), { f: 'sans', size: 42 * z, col: INK, align: 'center' });
    c.restore(); }

  // the wrong note has arrived inside the Clinic's email: it is circled in red where it sits
  for (const P of POPS) { if (t < P.circ) continue; const lt = letter(P.L, t); if (lt.a <= 0.001) continue;
    const ci = ramp(t, P.circ, P.circ + 0.4, EASE.warm), cx = X(lt.x), cy = Y(lt.y + CY[1] * lt.s);
    c.save(); c.globalAlpha = lt.a; c.strokeStyle = ALARM; c.lineWidth = Math.max(6, 7 * z); c.beginPath();
    for (let k = 0; k <= 60; k++) { const th = -2.2 + k / 60 * 2 * Math.PI * 1.08 * ci, rr = 1 + 0.06 * k / 60; const px = cx + Math.cos(th) * 0.5 * CW * lt.s * 1.1 * z * rr, py = cy + Math.sin(th) * 0.62 * CH * lt.s * 1.1 * z * rr; k ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.stroke(); c.restore(); }
  // the clinic's tick: the email arrived with only its own cards
  for (const O of OKS) { const a = win(t, O.t, O.out, 0.08, 0.3); if (a <= 0) continue; const pop = 1 + 0.2 * Math.exp(-(t - O.t) * 8), cx = X(TICK.x), cy = Y(TICK.y), R = 48 * z * pop, m = 20 * z * pop;
    c.save(); c.globalAlpha = a; c.fillStyle = C.paper; c.strokeStyle = VIO; c.lineWidth = 4 * z; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill(); c.stroke();
    c.lineWidth = 9 * z; c.beginPath(); c.moveTo(cx - m, cy + 1); c.lineTo(cx - m * 0.25, cy + m * 0.8); c.lineTo(cx + m * 1.05, cy - m * 0.9); c.stroke(); c.restore(); }

  // the little whale ("you"), with the rubber stamp at its nose during the stamping
  { const p = wworld(t), ang = angle(t), v = wvel(t), sp = Math.hypot(v.x, v.y), moving = clamp(sp / 400), f = facing(t);
    let blink = 0; for (const k of [1.8, 6.55, M(10.55), M(13.35), M(16.95), M(20.85), M(24.35), M(27.15)]) blink = Math.max(blink, 1 - Math.abs(t - k) / 0.07);
    let squash = 0; for (const k of [LET[1].stamp]) { const d = t - k + 0.05; if (d >= 0 && d < 0.32) squash = Math.max(squash, 0.13 * (1 - EASE.glaser(d / 0.32))); }
    const focus = Math.max(win(t, M(7.85), M(8.85), 0.2, 0.2), win(t, M(19.95), M(20.85), 0.15, 0.15), win(t, M(22.3), M(23.4), 0.2, 0.2) * 0.6);
    const eye = 1 + 0.4 * win(t, 2.85, 4.5, 0.06, 0.4) + 0.35 * win(t, M(22.1), M(22.8), 0.06, 0.3);
    const spark = Math.max(win(t, LANDS[0].t, LANDS[0].t + 0.9, 0.1, 0.4), win(t, M(17.95), M(18.65), 0.1, 0.3) * 0.7, win(t, LANDS[LANDS.length - 1].t, LANDS[LANDS.length - 1].t + 1.3, 0.12, 0.5));
    const delight = (t > LANDS[0].t && t < LANDS[0].t + 0.8) || (t > M(17.9) && t < M(18.65)) || t > LANDS[LANDS.length - 1].t + 0.05 ? 1 : 0;
    c.save(); c.translate(X(p.x), Y(p.y)); c.scale(f, 1);
    KH.drawWhale(c, { x: 0, y: 0, ang, scale: WS * z, L: 1, tail: Math.sin(t * (moving > 0.3 ? 11 : 3)) * lerp(0.12, 0.34, moving), fin: Math.sin(t * 6 + 1.3) * lerp(0.15, 0.3, moving),
      blink, squash, focus: delight ? 0 : focus, eye, spark, sparkColor: VIO, delight, blush: 0.6, mouth: delight ? 0.4 : 0.45 * win(t, 2.9, 4.2, 0.06, 0.3) + 0.3 * win(t, M(22.1), M(22.8), 0.06, 0.3),
      spray: win(t, M(26.95), M(28.05), 0.2, 0.6), sw: 3.2 });
    c.restore();
    const ya = Math.max(RA(t, 'you'), RA(t, 'you2')); if (ya > 0) S.chip(c, 'You', X(p.x), Y(p.y - 98), { f: 'sans', size: Math.round(30 * z), col: INK, a: ya, align: 'center', pad: 12, border: CARDEDGE });
    const pa = win(t, M(20.0), M(21.05), 0.15, 0.2); if (pa > 0) { const n = nose(t), nx = X(n.x), ny = Y(n.y), k = z;   // a pencil: you write the note by hand
      c.save(); c.globalAlpha = pa; c.lineCap = 'butt'; c.strokeStyle = INK; c.lineWidth = 12 * k; c.beginPath(); c.moveTo(nx, ny - 4 * k); c.lineTo(nx, ny + 38 * k); c.stroke();
      c.fillStyle = SAL; c.strokeStyle = INK; c.lineWidth = 2.5 * k; c.beginPath(); c.moveTo(nx - 6 * k, ny + 38 * k); c.lineTo(nx + 6 * k, ny + 38 * k); c.lineTo(nx, ny + 54 * k); c.closePath(); c.fill(); c.stroke(); c.restore(); }
  }

  // v6: the title sits on the unfaded picture (no veil); the camera keeps the scene clear of the title band

  // the real-example card (top left, clean paper round it): one sentence in two big lines
  const ka = RA(t, 'card'); if (ka > 0) { const x0 = 150, dy = (1 - EASE.defer(ramp(t, RD('card').in, RD('card').in + 0.35))) * 8, l1 = 'Real example:', l2 = 'Our AI app keeps one folder per client.';
    c.save(); c.font = `54px ${KH.FONTS.sans}`; const w1 = c.measureText(l2).width; c.font = `38px ${KH.FONTS.sans}`; const w2 = c.measureText(l1).width; c.restore();
    const wd = Math.max(w1, w2) + 70; c.save(); c.globalAlpha = ka; c.fillStyle = C.paper; c.strokeStyle = CARDEDGE; c.lineWidth = 1.2;
    c.beginPath(); c.roundRect(x0 - 30, 44 + dy, wd, 180, 8); c.fill(); c.stroke(); c.fillStyle = VIO; c.fillRect(x0 - 30, 44 + dy, 6, 180); c.restore();
    text(c, l1, x0, 102 + dy, { f: 'sans', size: 38, col: INK, a: ka });
    text(c, l2, x0, 182 + dy, { f: 'sans', size: 54, col: INK, a: ka }); }

  for (const r of READ) if (r.kind === 'caption') S.caption(c, t, r, { size: 40 });
  S.open(c, t - T0, { no: '09', title: 'Private <i>notes</i> stay home.', accent: ACC }, { out: T_OUT });
  S.lockup(c, t, T_LOCK, { no: '09', short: 'Private' });
  c.restore();
}

function cues() {
  return { bpm: BPM, dur: DUR, title: T0 + 0.25, veil: T0 + 0.05, unveil: T0 + T_OUT - 0.3, tap: LET[1].stamp - 0.1,
    hdrSwap: LET.filter(L => L.hdr.length > 1).map(L => L.hdr[0][2] - 0.45), send: LET.map(L => L.send), arrive: LET.map(L => L.arr),
    pop: POPS.map(P => P.t), circle: POPS.map(P => P.circ), stamp: LET[1].stamp, thread: LET[1].thread, taut: LET.filter(L => L.taut).map(L => L.taut),
    home: LANDS.map(l => l.t), ok: OKS.map(o => o.t), pat: [M(17.95), M(18.35)], scrawl: LET[2].scrawl, podSend: LET.map(L => L.send), scan: SCANS.map(s => s.t),
    spark: [LANDS[0].t, LANDS[LANDS.length - 1].t], card: RD('card').in, limit: POPS[1].t, notThis: RD('limit').in, belief: RD('belief').in, lockup: T_LOCK, spray: M(26.95),
    tags: { consequence: [POPS[0].circ], focus: [POPS[0].circ, LET[1].stamp, LANDS[0].t, LANDS[LANDS.length - 1].t], mech: [LET[1].stamp, LET[1].thread[0], LET[1].taut, LANDS[0].t], limit: [POPS[1].circ], callback: [LANDS[LANDS.length - 1].t] } }; }
const CONTRAST = [['captions / card main (ink on paper chip)', INK, C.paper], ['title (ink on chart ground)', INK, BG], ['title accent on ground', ACC, BG],
  ['title accent on veiled ground (paper)', ACC, C.paper], ['eyebrow / lockup (slate on ground)', SOFT, BG], ['card lines (ink on paper)', INK, C.paper],
  ['email header (ink on paper page)', INK, C.paper], ['"Bakery\'s rent is late" (ink on note card)', INK, CARD], ['PRIVATE stamp text (accent on violet-tinted stamp)', ACC, CHIPF], ['PRIVATE button text (slate on paper button)', SOFT, C.paper],
  ['box name (ink on box front)', INK, BOXF], ['"Client folder" (slate on folder front)', SOFT, BOXF]];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, INTENT, TERMS, DUR, W, H, fps: 60, wpos, heading: angle, cam,
  shutter: t => LET.some(L => t > L.send && t < (L.land || L.arr)) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
