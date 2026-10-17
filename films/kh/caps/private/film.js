// CETI Capabilities 09 · private — "Private notes stay put." (v7) Kinetic Hydrography 1.0.0 + series layer. 30-s house format.
// Source: storyboards/c04/sb-04-04 (Context Atoms), compressed. Everyday picture: an email is a page of notes; each client has a
// folder. Beside a note sits a small PRIVATE button; you tap it and it becomes a violet stamp that names the client
// ("PRIVATE · BAKERY"). v7 makes the CHECK the hero beat: when the email is readdressed to the Clinic, your AI app reaches for
// the note, sees the stamp ("Stamped for Bakery. Not sent."), drops the note back into the Bakery folder and sends the email
// without it. No thread, no "home". And also: tap it when you write the note; an untapped note still goes (the limit beat).
// drawFrame(ctx, t) is a pure function of t.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, win, EASE, ramp, mix, rgba, text } = KH;
const W = 1920, H = 1080, BPM = 120;
const DUR = 29.4;
const INK = C.navy, SOFT = C.slate, VIO = WD.violetBlue, RED = WD.englishRed, SAL = WD.ochraceousSalmon, GLAU = WD.lightGlaucousBlue;
const BG = mix(C.paper, VIO, 0.06);                          // what SERIES.ground paints with tint: violet blue
let ACC = VIO; for (let k = 0; k <= 1; k += 0.05) { ACC = mix(VIO, INK, k); if (KH.contrast(ACC, BG) >= 4.6 && KH.contrast(ACC, C.paper) >= 4.6) break; }
const CARD = mix(C.paper, C.slate, 0.06), CARDEDGE = mix(C.paper, C.slate, 0.5), CLINE = mix(C.paper, C.slate, 0.32), PTAB = mix(C.paper, C.slate, 0.4);
const PAGEEDGE = mix(C.paper, C.slate, 0.55), BOXF = mix(C.paper, C.slate, 0.08), BOXB = mix(C.paper, C.slate, 0.26);
const ALARM = mix(RED, INK, 0.1), STAMPC = mix(VIO, INK, 0.1), CROSS = mix(GLAU, INK, 0.45);
const CHIPF = mix(CARD, VIO, 0.12), BTNSH = rgba(C.slate, 0.35);

// ---------- the world: one desk (the email being written), two client folders ----------
const DESK = { x: 0, y: 40 }, PW = 344, PH = 300, CY = [-50, 28, 106], CW = 304, CH = 74;
const BAK = { x: -480, y: 70 }, CLI = { x: 480, y: 70 }, RIM = -60, BW = 290, BH = 150;
// v7: stamped notes stand in the Bakery folder high enough that the words and the stamp clear the rim; the folder tab is drawn
// on the folder's back sheet, so it never covers a note's words.
const SLOT = i => ({ x: BAK.x - 30 + 40 * i, y: BAK.y + RIM - 26 - 6 * i, r: -0.06 + 0.07 * i });
const POP = { x: 440, y: -192 }, PSC = 0.92, TICK = { x: CLI.x, y: -110 }, POD = { x: 245, y: 135 }, PODS = 120, PODCOL = mix(C.slate, C.paper, 0.35);
const REACHP = { x: 214, y: 66 };   // the AI app's nose touches the note's right edge

// ---------- the emails ----------
// hdr: [text, in, out, fi, fo, strike duration]. L1 and L5 land just above the Clinic's folder and stay open (the wrong note is
// circled inside them). L2 and L6 carry a stamped note: the AI app reaches for it, a chip says "Stamped for Bakery. Not sent.",
// the note drops into the Bakery folder, and the email goes to the Clinic without it.
const LET = [
  { id: 'L1', in: -1, send: 2.0, fly: 0.9, mid: 'bakery', hdr: [['To: Bakery', -1, 1.6, 0, 0.15, 0.5], ['To: Clinic', 1.45, 8.65, 0.3, 0.4]], pop: [8.25, 8.65] },
  { id: 'L2', in: 8.4, mid: 'sealed', btn: true, stamp: 9.5, hdr: [['To: Bakery', 8.65, 14.45, 0.3, 0.15, 0.5], ['To: Clinic', 14.3, 18.6, 0.3, 0.1]],
    reach: [14.1, 17.0], chip: [15.0, 16.95], lift: 16.5, land: 17.45, send: 17.6, fly: 0.9 },
  { id: 'L5', in: 19.8, send: 20.9, fly: 0.85, mid: 'scrawl', btn: true, scrawl: [20.25, 20.75], hdr: [['To: Clinic', 19.85, 23.75, 0.3, 0.4]], pop: [23.35, 23.75], reach: [20.4, 21.2] },
  { id: 'L6', in: 22.9, mid: 'sealed', hdr: [['To: Bakery', 22.9, 24.15, 0.15, 0.15, 0.45], ['To: Clinic', 24.0, 27.0, 0.25, 0.1]],
    reach: [24.1, 25.85], chip: [24.45, 26.3], lift: 26.0, land: 26.9, send: 26.1, fly: 0.9 },
];
let home = 0;
for (const L of LET) { L.arr = L.send + L.fly;
  if (L.mid === 'sealed') { L.slot = home++; L.ok = L.arr + 0.1; }
  else { L.stay = true; L.popT = L.arr; } }
const LANDS = LET.filter(L => L.land).map(L => ({ t: L.land, slot: L.slot, id: L.id }));
const OKS = LET.filter(L => L.ok).map((L, i, a) => ({ t: L.ok, out: i + 1 < a.length ? Math.min(a[i + 1].in - 0.05, L.ok + 1.4) : DUR + 1 }));
const POPS = LET.filter(L => L.stay).map(L => ({ L, t: L.popT, circ: L.popT + 0.3, fade: L.pop }));
const strikeT = ([, , b0, , , d]) => [b0 - 0.2 - (d ?? 0.25), b0 - 0.2];

function letter(L, t) {   // email page transform: x, y, scale, alpha
  let a = L.in < 0 ? 1 : ramp(t, L.in, L.in + 0.3, EASE.warm);
  const u = ramp(t, L.send, L.arr, EASE.warm);
  if (L.stay) { const x = lerp(DESK.x, POP.x, u), y = lerp(DESK.y, POP.y, u) - 40 * Math.sin(Math.PI * u), s = lerp(1, PSC, u);
    return { x, y, s, a: a * (1 - ramp(t, L.pop[0], L.pop[1], EASE.rest)) }; }
  const x = lerp(DESK.x, CLI.x, u), y = lerp(DESK.y, CLI.y - 10, u) - 90 * Math.sin(Math.PI * u), s = lerp(1, 0.4, u);
  a *= 1 - ramp(t, L.arr - 0.1, L.arr + 0.04, EASE.rest);
  return { x, y, s, a: t > L.arr + 0.05 ? 0 : a };
}
// the stamped note: held up a little when the AI app sees the stamp, then lifted out and dropped into the Bakery folder
const held = (L, t) => L.chip ? ramp(t, L.chip[0], L.chip[0] + 0.3, EASE.glaser) : 0;
function stampedNote(L, t) {
  const h = held(L, t), P0 = { x: DESK.x, y: DESK.y + CY[1] - 12 * h, s: 1, r: -0.04 * h };
  if (t <= L.lift) return { ...P0, inLetter: true };
  const H0 = SLOT(L.slot), u = ramp(t, L.lift, L.land, EASE.warm);
  return { x: lerp(P0.x, H0.x, u), y: lerp(P0.y, H0.y, u) - 170 * Math.sin(Math.PI * u), s: lerp(1, 0.8, u), r: lerp(P0.r, H0.r, u), inLetter: false };
}

// ---------- the whale ("you"): Hermite through keys (zero tangents = it settles at each key) ----------
const WS = 0.8, REACH = 118 * WS + 48;
// the PRIVATE button sits on the note's lower right, under the words (card coords BTN). The whale taps its right end nose-down
// from above-right (TILT), so its head stays right of and below the words; the scrawl is on the loaf (left).
const BTN = { x: 22, y: 4, w: 116, h: 32 }, IMP = { x: DESK.x + BTN.x + BTN.w / 2, y: DESK.y + CY[1] + BTN.y + BTN.h / 2 };
const SB = { x: -88, y: 5, w: 234, h: 31 };   // v7: the stamp band "PRIVATE · BAKERY" under the words
const TA = 0.55, TAPNOSE = { x: IMP.x + 34, y: IMP.y - 2 };
const PERCH0 = [-150, -180], PERCHR = [235, -245], PRESS = [TAPNOSE.x + REACH * Math.cos(TA) - 4 * Math.sin(TA), TAPNOSE.y - REACH * Math.sin(TA) - 4 * Math.cos(TA)],
  HOVER = [PRESS[0] + 46, PRESS[1] - 40],
  SCRAWL = [DESK.x - 116 - REACH, DESK.y + CY[1] - 60], WATCH = [40, -250], PEND = [170, -235], WATCHR = [330, -120];
const K = [[0, ...PERCH0], [3.05, ...PERCH0], [3.9, 120, -235], [4.85, 120, -235], [5.65, 100, -150], [8.8, 100, -150],
  [9.25, ...HOVER], [9.5, ...PRESS], [10.05, ...PRESS], [10.35, ...HOVER], [10.95, ...PERCHR], [12.9, ...PERCHR], [14.0, ...WATCHR], [18.6, ...WATCHR],
  [19.9, ...SCRAWL], [20.8, ...SCRAWL], [21.5, ...WATCH], [22.95, ...WATCH], [23.7, ...PEND], [DUR + 1, ...PEND]];
function herm(P, t) { const n = P.length; if (t <= P[0][0]) return { x: P[0][1], y: P[0][2] }; if (t >= P[n - 1][0]) return { x: P[n - 1][1], y: P[n - 1][2] };
  let i = 0; while (P[i + 1][0] < t) i++; const p1 = P[i], p2 = P[i + 1], u = (t - p1[0]) / (p2[0] - p1[0]), A2 = 2 * u * u * u - 3 * u * u + 1, C2 = 1 - A2;
  return { x: A2 * p1[1] + C2 * p2[1], y: A2 * p1[2] + C2 * p2[2] }; }
const NODS = [1.2, 15.2, 24.6];
function wworld(t) { const p = herm(K, t), q = herm(K, t + 0.01), sp = Math.hypot(q.x - p.x, q.y - p.y) * 100, still = 1 - clamp(sp / 150);
  let dip = 0; for (const s of NODS) { const d = t - s; if (d > 0 && d < 0.35) dip = Math.max(dip, 7 * Math.sin(Math.PI * d / 0.35)); }
  const wig = win(t, 20.25, 20.75, 0.05, 0.05) * 7 * Math.sin((t - 20.25) * 30);
  return { x: p.x + wig, y: p.y + (Math.sin(t * 2.4) * 2.5 + dip) * still }; }
const wvel = t => { const a = wworld(t - 1 / 240), c = wworld(t + 1 / 240); return { x: (c.x - a.x) * 120, y: (c.y - a.y) * 120 }; };
function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
    a += (sp < 40 ? 0 : clamp(Math.atan2(v.y, Math.abs(v.x)), -0.8, 0.8) * clamp(sp / 300)) * w; s += w; } return a / s; }
const TURNS = [[8.45, -1], [19.7, 1]];   // v7: during the check the whale watches from above-right of the email, facing it
function facing(t) { let f = 1; for (const [a, to] of TURNS) f = lerp(f, to, ramp(t, a, a + 0.25, EASE.warm)); return f; }
const tilt = t => TA * win(t, 9.0, 10.5, 0.3, 0.4);
const angle = t => heading(t) + tilt(t);
function nose(t) { const p = wworld(t), a = angle(t), f = facing(t); return { x: p.x + f * (REACH * Math.cos(a) - 4 * Math.sin(a)), y: p.y + REACH * Math.sin(a) + 4 * Math.cos(a) }; }

// ---------- camera ----------
const FELT = { x: 300, y: 0, z: 1.55 }, TITLE = { x: -150, y: -320, z: 0.9 }, MID = { x: 0, y: -20, z: 1.36 }, STAMP = { x: 10, y: 0, z: 1.42 },
  NOTE = { x: 20, y: 60, z: 2.35 }, REF = { x: 60, y: 30, z: 2.15 }, LIM = { x: 40, y: -40, z: 1.3 }, PAY = { x: 0, y: -20, z: 1.36 }, PAY2 = { x: 50, y: 10, z: 1.75 };
function cam(t) { let s = { ...FELT };
  const go = (a, b, T, e) => { const k = ramp(t, a, b, e); s = { x: lerp(s.x, T.x, k), y: lerp(s.y, T.y, k), z: lerp(s.z, T.z, k) }; };
  go(4.85, 5.7, TITLE, EASE.rest); go(8.0, 8.95, STAMP, EASE.warm);
  go(10.95, 11.85, NOTE, EASE.warm);     // v7: push onto the stamp: "PRIVATE · BAKERY"
  go(13.25, 14.1, REF, EASE.warm);       // v7: the check, big and centred: the Clinic email, the AI app reaching, the chip
  go(16.15, 17.1, MID, EASE.warm);       // pull back so the note can be seen dropping into the Bakery folder
  go(21.5, 22.7, LIM, EASE.warm); go(23.15, 23.85, PAY, EASE.warm);
  go(24.0, 24.75, PAY2, EASE.warm); go(25.85, 26.75, PAY, EASE.warm);   // v7: the payoff check up close, then back for the folder and the tick
  return { x: s.x, y: s.y, z: s.z + 0.02 * ramp(t, 27.2, DUR, EASE.rest), ax: 960, ay: 540 }; }
const wpos = t => wworld(t);

// ---------- text ----------
const T0 = 5.5, T_OUT = 2.85, T_LOCK = DUR - 2.2;
const cap = (id, inn, out, text) => ({ id, kind: 'caption', in: inn, out, fi: 0.25, fo: 0.2, text });
const CHIPTXT = 'Stamped for Bakery. Not sent.', STAMPTXT = 'PRIVATE · BAKERY';
const READ = [
  cap('felt1', 0.25, 2.4, 'Same email, new client.'),
  cap('felt2', 3.25, 5.5, "I didn't mean to send the client's notes."),
  { id: 'you', kind: 'label', in: 0.1, out: 2.6, fi: 0.2, fo: 0.3, text: 'You' },
  { id: 'you2', kind: 'label', in: 8.7, out: 10.7, fi: 0.2, fo: 0.3, text: 'You' },
  { id: 'email', kind: 'label', in: 0, out: 8.65, fi: 0.01, fo: 0.4, text: 'Email' },
  { id: 'eyebrow', kind: 'label', in: T0 + 0.25, out: T0 + T_OUT, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 09' },
  { id: 'title', kind: 'title', in: T0 + 0.25, out: T0 + T_OUT, fi: 0.4, fo: 0.45, text: 'Private notes stay put.' },
  cap('stamp', 8.6, 11.05, 'Tap PRIVATE to stamp the note.'),
  cap('says', 11.2, 13.6, "The stamp says which client it's for."),
  cap('sees', 14.5, 16.5, 'Your AI app sees the stamp.'),
  cap('leaves', 16.55, 19.2, 'It leaves the Bakery note out.'),
  cap('limit', 20.95, 23.65, 'Stamp a note the moment you write it.'),
  cap('belief', 23.75, T_LOCK - 0.05, 'Stamp once. Private notes stay with their client.'),
  { id: 'ai1', kind: 'label', in: 0.1, out: DUR, fi: 0.3, fo: 0, text: 'Your AI app' },
  { id: 'lockup', kind: 'label', in: T_LOCK, out: DUR, fi: 0.45, fo: 0, text: 'CETI · Capabilities · 09 · Private' },
  { id: 'boxB', kind: 'label', in: 0, out: DUR, fi: 0.01, fo: 0, text: 'Client folder Bakery' },
  { id: 'boxC', kind: 'label', in: 0, out: DUR, fi: 0.01, fo: 0, text: 'Client folder Clinic' },
];
LET.forEach(L => L.hdr.forEach(([s, a, b, fi, fo], k) => READ.push({ id: `${L.id}h${k}`, kind: 'header', in: a, out: b, fi, fo, text: s })));
LET.forEach(L => READ.push({ id: `${L.id}note`, kind: 'note', in: L.in, out: L.pop ? L.pop[1] : DUR, fi: L.in < 0 ? 0.01 : 0.3, fo: L.pop ? 0.3 : 0, text: "Bakery's rent is late" }));
LET.filter(L => L.btn).forEach(L => READ.push({ id: `${L.id}btn`, kind: 'button', in: L.in, out: L.stamp ? L.stamp + 0.1 : L.pop[1], fi: 0.3, fo: L.stamp ? 0.1 : 0.3, text: 'PRIVATE' }));
LET.filter(L => L.mid === 'sealed').forEach(L => READ.push({ id: `${L.id}stamp`, kind: 'stamp', in: L.stamp ?? L.in, out: DUR, fi: 0.3, fo: 0, text: STAMPTXT }));
LET.filter(L => L.chip).forEach(L => READ.push({ id: `${L.id}chip`, kind: 'chip', in: L.chip[0], out: L.chip[1], fi: 0.2, fo: 0.25, text: CHIPTXT }));
const RD = id => READ.find(r => r.id === id), RA = (t, id) => { const r = RD(id); return win(t, r.in, r.out, r.fi, r.fo); };
const INTENT = {
  problem: "You reuse last week's email for a new client (the Clinic), and the old client's private note (\"Bakery's rent is late\") arrives inside the Clinic's email.",
  move: "When you write the note you tap PRIVATE; the note gets a stamp that names its client (\"PRIVATE · BAKERY\"). Before sending to anyone else, your AI app sees the stamp, leaves that note out (it drops back into the Bakery folder) and sends the Clinic email without it.",
  belief: "Stamp private notes once, the moment you write them, and they stay with their client. And also: a note you never stamped can still go." };
const TERMS = [];

// ---------- drawing helpers ----------
function loaf(c, x, y, s, fill, stroke, lw, prog = 1) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = lw / s; c.lineJoin = 'round'; c.lineCap = 'round';
  const p = new root.Path2D('M-22,12 L22,12 L22,-1 C22,-19 -22,-19 -22,-1 Z M-11,-9 L-6,1 M0,-11 L5,-1 M11,-9 L15,0');
  if (prog < 1) c.setLineDash([150 * prog, 400]);
  if (fill && prog >= 1) { c.fillStyle = fill; c.fill(new root.Path2D('M-22,12 L22,12 L22,-1 C22,-19 -22,-19 -22,-1 Z')); }
  c.strokeStyle = stroke; c.stroke(p); c.restore(); }
// a note card. kind: plain | bakery (unstamped private note) | sealed (stamped) | scrawl (note written on a plain card)
function card(c, X, Y, z, kind, s, r, a, o = {}) {
  const k = s * z; c.save(); c.globalAlpha *= a; c.translate(X, Y); c.rotate(r); c.scale(k, k);
  c.fillStyle = CARD; c.strokeStyle = CARDEDGE; c.lineWidth = 2 / Math.min(1, k) * 0.8; c.beginPath(); c.roundRect(-CW / 2, -CH / 2, CW, CH, 7); c.fill(); c.stroke();
  const sealed = kind === 'sealed' ? (o.seal ?? 1) : 0;
  c.fillStyle = mix(PTAB, VIO, sealed); c.beginPath(); c.roundRect(-CW / 2, -CH / 2, 13, CH, [7, 0, 0, 7]); c.fill();
  if (kind === 'plain') { c.strokeStyle = CLINE; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(-110, -12); c.lineTo(122, -12); c.moveTo(-110, 13); c.lineTo(56, 13); c.stroke(); c.restore(); return; }
  if (kind === 'scrawl') loaf(c, -116, -2, 1.0, null, SOFT, 3.2, o.scrawl ?? 1); else loaf(c, -116, -2, 1.0, SAL, INK, 3);
  c.restore();
  if (kind !== 'scrawl' || (o.scrawl ?? 1) > 0.6) { const ta = kind === 'scrawl' ? clamp(((o.scrawl ?? 1) - 0.6) / 0.4) : 1;
    c.save(); c.translate(X, Y); c.rotate(r); text(c, "Bakery's rent is late", -84 * k, -8 * k, { f: 'sans', size: 24 * k, col: INK, a: a * ta }); c.restore(); }
  const bx = BTN.x + BTN.w / 2, by = BTN.y + BTN.h / 2;
  if (o.btn && sealed < 0.5) {   // the PRIVATE button under the words, raised (a shadow under it) until it is pressed
    const pr = o.press ?? 0, ba = a * (1 - clamp(sealed * 2)), dy = 3 * pr;
    c.save(); c.translate(X, Y); c.rotate(r); c.scale(k, k); c.globalAlpha *= ba;
    c.fillStyle = BTNSH; c.beginPath(); c.roundRect(BTN.x, BTN.y + 4, BTN.w, BTN.h, 8); c.fill();
    c.fillStyle = C.paper; c.strokeStyle = SOFT; c.lineWidth = 2.5; c.beginPath(); c.roundRect(BTN.x, BTN.y + dy, BTN.w, BTN.h, 8); c.fill(); c.stroke();
    if (o.pulse > 0) { c.strokeStyle = rgba(SOFT, 0.6 * o.pulse); c.lineWidth = 3; c.beginPath(); c.roundRect(BTN.x - 10 - 8 * (1 - o.pulse), BTN.y - 10 - 8 * (1 - o.pulse), BTN.w + 20 + 16 * (1 - o.pulse), BTN.h + 20 + 16 * (1 - o.pulse), 12); c.stroke(); }
    c.restore();
    c.save(); c.translate(X, Y); c.rotate(r); text(c, 'PRIVATE', bx * k, (by + 7 + dy) * k, { f: 'monoB', size: 19 * k, col: SOFT, a: ba, align: 'center', track: 0.12 }); c.restore(); }
  if (sealed > 0.01) {   // the stamp: the pressed button grows into a violet band that names the client
    const e = sealed, pop = 1 + 0.12 * (1 - e), sa = a * clamp(e * 1.4), cx = lerp(bx, SB.x + SB.w / 2, e), cy = lerp(by, SB.y + SB.h / 2, e), w = lerp(BTN.w, SB.w, e), h = lerp(BTN.h, SB.h, e);
    c.save(); c.translate(X, Y); c.rotate(r); c.scale(k, k); c.translate(cx, cy); c.scale(pop, pop); c.globalAlpha *= sa;
    c.fillStyle = CHIPF; c.strokeStyle = STAMPC; c.lineWidth = 4; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 6); c.fill(); c.stroke(); c.restore();
    c.save(); c.translate(X, Y); c.rotate(r); text(c, STAMPTXT, cx * k, (cy + 7.5) * k, { f: 'monoB', size: 20.5 * k * pop, col: ACC, a: sa * clamp(e * 2 - 0.6), align: 'center', track: 0.03 }); c.restore(); }
}
// the AI app's verdict, on the note itself: paper chip, violet edge
function verdict(c, x, y, size, a) {
  c.save(); c.font = `${size}px ${KH.FONTS.sans}`; const w = c.measureText(CHIPTXT).width, pad = size * 0.55, h = size * 1.6;
  c.globalAlpha *= a; c.fillStyle = rgba(C.slate, 0.25); c.beginPath(); c.roundRect(x - w / 2 - pad, y - h / 2 + 5, w + pad * 2, h, 10); c.fill();
  c.fillStyle = C.paper; c.strokeStyle = STAMPC; c.lineWidth = Math.max(3, size / 9); c.beginPath(); c.roundRect(x - w / 2 - pad, y - h / 2, w + pad * 2, h, 10); c.fill(); c.stroke(); c.restore();
  text(c, CHIPTXT, x, y + size * 0.36, { f: 'sans', size, col: INK, a, align: 'center' }); }

function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay;
  S.ground(c, t, cm, { tint: VIO });
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.lineCap = 'round'; c.lineJoin = 'round';

  // folders fade out as the camera pushes them toward a frame edge (never shown cropped)
  const FA = B => Math.min(clamp((X(B.x - BW / 2) - 12) / 70), clamp((W - 12 - X(B.x + BW / 2)) / 70));
  // folder backs (with the tab, which belongs to the back sheet) + the stamped notes already in the Bakery folder
  for (const B of [BAK, CLI]) { const fa = FA(B); if (fa <= 0.001) continue; c.globalAlpha = fa; const x0 = X(B.x - BW / 2), y0 = Y(B.y + RIM), w = BW * z;
    c.fillStyle = BOXB; c.beginPath(); c.roundRect(X(B.x - BW / 2 + 10), Y(B.y + RIM - 22), (BW - 20) * z, (BH + 22) * z, 8 * z); c.fill();
    c.fillStyle = BOXF; c.strokeStyle = INK; c.lineWidth = Math.max(4, 5 * z); c.beginPath(); c.roundRect(x0 + w - 120 * z, y0 - 34 * z, 104 * z, 48 * z, 7 * z); c.fill(); c.stroke(); }
  c.globalAlpha = 1;
  for (const Ld of LANDS) if (t >= Ld.t) { const s = SLOT(Ld.slot); card(c, X(s.x), Y(s.y), z, 'sealed', 0.8, s.r, FA(BAK)); }

  // the emails (pages with three notes)
  for (const L of LET) { const lt = letter(L, t); if (lt.a <= 0.001) continue;
    const s = lt.s * z, px = X(lt.x), py = Y(lt.y);
    c.save(); c.globalAlpha = lt.a; c.fillStyle = C.paper; c.strokeStyle = PAGEEDGE; c.lineWidth = Math.max(2.5, 3 * s);
    c.beginPath(); c.roundRect(px - PW / 2 * s, py - PH / 2 * s, PW * s, PH * s, 10 * s); c.fill(); c.stroke();
    c.strokeStyle = CLINE; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(px - 135 * s, py - 94 * s); c.lineTo(px + 135 * s, py - 94 * s); c.stroke(); c.restore();
    if (L.id === 'L1') text(c, 'Email', px + 135 * s, py - 110 * s, { f: 'mono', size: 22 * s, align: 'right', col: SOFT, a: lt.a * RA(t, 'email') });
    for (const hd of L.hdr) { const [hs, a0, b0, fi, fo] = hd, ha = win(t, a0, b0, fi, fo) * lt.a; if (ha <= 0.001) continue;
      const w = text(c, hs, px - 135 * s, py - 108 * s, { f: 'sans', size: 34 * s, col: INK, a: ha });
      if (hd[5]) { const [s0, s1] = strikeT(hd), st = ramp(t, s0, s1, EASE.warm); if (st > 0) {   // v7: a slower strike-through
        c.save(); c.globalAlpha = ha; c.strokeStyle = INK; c.lineWidth = 4 * s; c.beginPath(); const sx = px - 135 * s + 62 * s;
        c.moveTo(sx - 4 * s, py - 119 * s); c.lineTo(sx - 4 * s + (w - 58 * s) * st, py - 119 * s); c.stroke(); c.restore(); } } }
    CY.forEach((cy, i) => { const kind = i === 1 ? L.mid : 'plain';
      if (kind === 'sealed') { const q = stampedNote(L, t); if (!q.inLetter) return;   // the slot stays empty once the note is lifted out
        const seal = L.stamp ? ramp(t, L.stamp, L.stamp + 0.3, EASE.glaser) : 1, press = L.stamp ? ramp(t, L.stamp - 0.12, L.stamp, EASE.glaser) : 0;
        card(c, px + (q.x - DESK.x) * z, py + (q.y - DESK.y) * z, 1, seal <= 0 ? 'bakery' : 'sealed', s, q.r, lt.a, { seal, btn: !!L.btn, press }); return; }
      const pulse = L.mid === 'scrawl' ? win(t, L.scrawl[1], L.scrawl[1] + 0.6, 0.15, 0.3) : 0;   // the untapped button shows itself once
      card(c, px, py + cy * s, 1, kind, s, 0, lt.a, { btn: i === 1 && L.btn, pulse, scrawl: L.scrawl ? ramp(t, L.scrawl[0], L.scrawl[1], EASE.warm) : 1 }); });
    if (L.stamp) { const ring = win(t, L.stamp, L.stamp + 0.7, 0.03, 0.5); if (ring > 0) { const sx = px + (SB.x + SB.w / 2) * s, sy = py + (CY[1] + SB.y + SB.h / 2) * s, rr = (90 + 60 * ramp(t, L.stamp, L.stamp + 0.7)) * s;
      c.save(); c.strokeStyle = rgba(VIO, 0.45 * ring); c.lineWidth = 5 * s; c.beginPath(); c.arc(sx, sy, rr, 0, Math.PI * 2); c.stroke(); c.restore(); } } }

  // stamped notes that have been left out: lifted out of the email and dropped into the Bakery folder
  for (const L of LET) { if (L.mid !== 'sealed' || t <= L.lift || t >= L.land + 0.02) continue;
    const q = stampedNote(L, t); card(c, X(q.x), Y(q.y), z, 'sealed', q.s, q.r, 1); }

  // the AI app (grey fish): it comes to the email before it sends it, and reaches for the note in the middle (v7: drawn over the
  // email so the reach and its label read; no glow ring, which viewers read as a magnifier)
  const reachK = LET.reduce((m, L) => L.reach ? Math.max(m, win(t, L.reach[0], L.reach[1], 0.45, 0.5)) : m, 0), rk = EASE.warm(reachK);
  const pod = { x: lerp(POD.x, REACHP.x, rk), y: lerp(POD.y, REACHP.y, rk) + Math.sin(t * 2.1) * 3 * (1 - rk) };
  { c.save(); c.translate(X(pod.x), Y(pod.y)); c.scale(-1, 1); KH.drawPod(c, 0, 0, 0, PODS * z, PODCOL, {}); c.restore();
    const la = RA(t, 'ai1'); if (la > 0) S.chip(c, 'Your AI app', X(pod.x), Y(pod.y + 82), { f: 'sans', size: Math.round(26 * z), col: INK, a: la, align: 'center', pad: 12, border: CARDEDGE }); }

  // folder fronts with their labels
  for (const [B, name] of [[BAK, 'Bakery'], [CLI, 'Clinic']]) { const fa = FA(B); if (fa <= 0.001) continue; c.save(); c.globalAlpha = fa;
    const x0 = X(B.x - BW / 2), y0 = Y(B.y + RIM), w = BW * z, h = BH * z;
    let glow = 0; for (const Ld of LANDS) if (B === BAK) glow = Math.max(glow, win(t, Ld.t, Ld.t + 0.9, 0.05, 0.6));
    if (glow > 0.01) { c.save(); c.strokeStyle = rgba(VIO, 0.35 * glow); c.lineWidth = 16 * z; c.beginPath(); c.roundRect(x0, y0, w, h, 10 * z); c.stroke(); c.restore(); }
    c.fillStyle = BOXF; c.strokeStyle = INK; c.lineWidth = Math.max(4, 5 * z); c.beginPath(); c.roundRect(x0, y0, w, h, 10 * z); c.fill(); c.stroke();
    text(c, 'Client folder', X(B.x), Y(B.y + RIM + 46), { f: 'mono', size: 27 * z, col: SOFT, align: 'center', track: 0.06 });
    if (B === BAK) { loaf(c, X(B.x - 70), Y(B.y + RIM + 94), 1.15 * z, SAL, INK, 3 * z); text(c, name, X(B.x + 22), Y(B.y + RIM + 110), { f: 'sans', size: 42 * z, col: INK, align: 'center' }); }
    else text(c, name, X(B.x), Y(B.y + RIM + 110), { f: 'sans', size: 42 * z, col: INK, align: 'center' });
    c.restore(); }

  // the AI app's verdict on the stamped note: "Stamped for Bakery. Not sent." (rides on the note until it is dropped)
  for (const L of LET) { if (!L.chip) continue; const a = RA(t, `${L.id}chip`); if (a <= 0) continue;
    const q = stampedNote(L, t), lt = letter(L, t), ox = q.inLetter ? X(lt.x) + (q.x - DESK.x) * z : X(q.x), oy = q.inLetter ? Y(lt.y) + (q.y - DESK.y) * z : Y(q.y);
    const pop = 1 + 0.08 * (1 - EASE.glaser(ramp(t, L.chip[0], L.chip[0] + 0.3)));
    verdict(c, ox, oy - (CH / 2 + 34) * q.s * z, Math.round(24 * z * pop), a); }

  // the wrong note has arrived inside the Clinic's email: it is circled in red where it sits
  for (const P of POPS) { if (t < P.circ) continue; const lt = letter(P.L, t); if (lt.a <= 0.001) continue;
    const ci = ramp(t, P.circ, P.circ + 0.4, EASE.warm), cx = X(lt.x), cy = Y(lt.y + CY[1] * lt.s);
    c.save(); c.globalAlpha = lt.a; c.strokeStyle = ALARM; c.lineWidth = Math.max(6, 7 * z); c.beginPath();
    for (let k = 0; k <= 60; k++) { const th = -2.2 + k / 60 * 2 * Math.PI * 1.08 * ci, rr = 1 + 0.06 * k / 60; const px = cx + Math.cos(th) * 0.5 * CW * lt.s * 1.1 * z * rr, py = cy + Math.sin(th) * 0.62 * CH * lt.s * 1.1 * z * rr; k ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.stroke(); c.restore(); }
  // the clinic's tick: the email arrived with only its own notes
  for (const O of OKS) { const a = win(t, O.t, O.out, 0.08, 0.3) * FA(CLI); if (a <= 0) continue; const pop = 1 + 0.2 * Math.exp(-(t - O.t) * 8), cx = X(TICK.x), cy = Y(TICK.y), R = 48 * z * pop, m = 20 * z * pop;
    c.save(); c.globalAlpha = a; c.fillStyle = C.paper; c.strokeStyle = VIO; c.lineWidth = 4 * z; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill(); c.stroke();
    c.lineWidth = 9 * z; c.beginPath(); c.moveTo(cx - m, cy + 1); c.lineTo(cx - m * 0.25, cy + m * 0.8); c.lineTo(cx + m * 1.05, cy - m * 0.9); c.stroke(); c.restore(); }

  // the little whale ("you")
  { const p = wworld(t), ang = angle(t), v = wvel(t), sp = Math.hypot(v.x, v.y), moving = clamp(sp / 400), f = facing(t);
    let blink = 0; for (const k of [1.8, 6.55, 11.9, 13.3, 16.9, 20.8, 24.3, 27.9]) blink = Math.max(blink, 1 - Math.abs(t - k) / 0.07);
    let squash = 0; for (const k of [LET[1].stamp]) { const d = t - k + 0.05; if (d >= 0 && d < 0.32) squash = Math.max(squash, 0.13 * (1 - EASE.glaser(d / 0.32))); }
    const focus = Math.max(win(t, 8.85, 9.85, 0.2, 0.2), win(t, 14.3, 16.4, 0.3, 0.3) * 0.7, win(t, 19.9, 20.8, 0.15, 0.15), win(t, 22.25, 23.35, 0.2, 0.2) * 0.6);
    const eye = 1 + 0.4 * win(t, 3.05, 4.7, 0.06, 0.4) + 0.35 * win(t, 22.05, 22.75, 0.06, 0.3);
    const spark = Math.max(win(t, LANDS[0].t, LANDS[0].t + 0.9, 0.1, 0.4), win(t, LANDS[LANDS.length - 1].t, LANDS[LANDS.length - 1].t + 1.3, 0.12, 0.5));
    const delight = (t > LANDS[0].t && t < LANDS[0].t + 0.8) || t > LANDS[LANDS.length - 1].t + 0.05 ? 1 : 0;
    c.save(); c.translate(X(p.x), Y(p.y)); c.scale(f, 1);
    KH.drawWhale(c, { x: 0, y: 0, ang, scale: WS * z, L: 1, tail: Math.sin(t * (moving > 0.3 ? 11 : 3)) * lerp(0.12, 0.34, moving), fin: Math.sin(t * 6 + 1.3) * lerp(0.15, 0.3, moving),
      blink, squash, focus: delight ? 0 : focus, eye, spark, sparkColor: VIO, delight, blush: 0.6, mouth: delight ? 0.4 : 0.45 * win(t, 3.1, 4.4, 0.06, 0.3) + 0.3 * win(t, 22.05, 22.75, 0.06, 0.3),
      spray: win(t, DUR - 1.65, DUR - 0.55, 0.2, 0.6), sw: 3.2 });
    c.restore();
    const ya = Math.max(RA(t, 'you'), RA(t, 'you2')); if (ya > 0) S.chip(c, 'You', X(p.x), Y(p.y - 98), { f: 'sans', size: Math.round(30 * z), col: INK, a: ya, align: 'center', pad: 12, border: CARDEDGE });
    const pa = win(t, 19.95, 21.0, 0.15, 0.2); if (pa > 0) { const n = nose(t), nx = X(n.x), ny = Y(n.y), k = z;   // a pencil: you write the note by hand
      c.save(); c.globalAlpha = pa; c.lineCap = 'butt'; c.strokeStyle = INK; c.lineWidth = 12 * k; c.beginPath(); c.moveTo(nx, ny - 4 * k); c.lineTo(nx, ny + 38 * k); c.stroke();
      c.fillStyle = SAL; c.strokeStyle = INK; c.lineWidth = 2.5 * k; c.beginPath(); c.moveTo(nx - 6 * k, ny + 38 * k); c.lineTo(nx + 6 * k, ny + 38 * k); c.lineTo(nx, ny + 54 * k); c.closePath(); c.fill(); c.stroke(); c.restore(); }
  }

  for (const r of READ) if (r.kind === 'caption') S.caption(c, t, r, { size: 40 });
  S.open(c, t - T0, { no: '09', title: 'Private <i>notes</i> stay put.', accent: ACC }, { out: T_OUT });
  S.lockup(c, t, T_LOCK, { no: '09', short: 'Private' });
  c.restore();
}

function cues() {
  const SE = LET.filter(L => L.mid === 'sealed');
  return { bpm: BPM, dur: DUR, title: T0 + 0.25, veil: T0 + 0.05, unveil: T0 + T_OUT - 0.3, tap: LET[1].stamp - 0.1,
    hdrSwap: LET.flatMap(L => L.hdr.filter(h => h[5]).map(h => strikeT(h)[0])), send: LET.map(L => L.send), arrive: LET.map(L => L.arr),
    pop: POPS.map(P => P.t), circle: POPS.map(P => P.circ), stamp: LET[1].stamp, says: RD('says').in,
    reach: LET.filter(L => L.reach).map(L => L.reach[0]), refuse: SE.map(L => L.chip[0]), lift: SE.map(L => L.lift),
    home: LANDS.map(l => l.t), ok: OKS.map(o => o.t), pat: [], scrawl: LET[2].scrawl, podSend: LET.map(L => L.send),
    spark: [LANDS[0].t, LANDS[LANDS.length - 1].t], card: LET[1].chip[0], limit: POPS[1].t, notThis: RD('limit').in, belief: RD('belief').in, lockup: T_LOCK, spray: DUR - 1.65,
    tags: { consequence: [POPS[0].circ], focus: [POPS[0].circ, LET[1].stamp, LET[1].chip[0], LANDS[LANDS.length - 1].t], mech: [LET[1].stamp, RD('says').in, LET[1].chip[0], LANDS[0].t], limit: [POPS[1].circ], callback: [LANDS[LANDS.length - 1].t] } }; }
const CONTRAST = [['captions (ink on paper chip)', INK, C.paper], ['title (ink on chart ground)', INK, BG], ['title accent on ground', ACC, BG],
  ['title accent on paper', ACC, C.paper], ['eyebrow / lockup (slate on ground)', SOFT, BG], ['"Stamped for Bakery. Not sent." (ink on paper chip)', INK, C.paper],
  ['email header (ink on paper page)', INK, C.paper], ['"Bakery\'s rent is late" (ink on note card)', INK, CARD], ['"PRIVATE · BAKERY" stamp (accent on violet-tinted stamp)', ACC, CHIPF], ['PRIVATE button text (slate on paper button)', SOFT, C.paper],
  ['folder name (ink on folder front)', INK, BOXF], ['"Client folder" (slate on folder front)', SOFT, BOXF], ['"Email" label (slate on paper page)', SOFT, C.paper]];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, INTENT, TERMS, DUR, W, H, fps: 60, wpos, heading: angle, cam,
  shutter: t => LET.some(L => (t > L.send && t < L.arr) || (L.lift && t > L.lift && t < L.land)) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
