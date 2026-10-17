// CETI Capabilities 09 · private — "Private cards stay home." Kinetic Hydrography 1.0.0 + series layer. 30-s house format.
// Source: storyboards/c04/sb-04-04 (Context Atoms), compressed. Everyday picture: an email is a page of note cards; each client
// has a box. A card stamped PRIVATE is tied by a violet thread to its own client's box, so when the email goes to anyone else
// the thread pulls that card back home. Nobody has to remember. Honest limit: a note written on a plain (unstamped) card still goes.
// drawFrame(ctx, t) is a pure function of t.
(function (root) {
'use strict';
const KH = root.KH, S = KH.SERIES, { CETI: C, W: WD, clamp, lerp, win, EASE, ramp, mix, rgba, text } = KH;
const W = 1920, H = 1080, BPM = 120, DUR = 28.5;
const INK = C.navy, SOFT = C.slate, VIO = WD.violetBlue, RED = WD.englishRed, SAL = WD.ochraceousSalmon, GLAU = WD.lightGlaucousBlue;
const BG = mix(C.paper, VIO, 0.06);                          // what SERIES.ground paints with tint: violet blue
let ACC = VIO; for (let k = 0; k <= 1; k += 0.05) { ACC = mix(VIO, INK, k); if (KH.contrast(ACC, BG) >= 4.6 && KH.contrast(ACC, C.paper) >= 4.6) break; }
const CARD = mix(C.paper, C.slate, 0.06), CARDEDGE = mix(C.paper, C.slate, 0.5), CLINE = mix(C.paper, C.slate, 0.32), PTAB = mix(C.paper, C.slate, 0.4);
const PAGEEDGE = mix(C.paper, C.slate, 0.55), BOXF = mix(C.paper, C.slate, 0.08), BOXB = mix(C.paper, C.slate, 0.26);
const ALARM = mix(RED, INK, 0.1), STAMPC = mix(VIO, INK, 0.1), THREAD = VIO, CROSS = mix(GLAU, INK, 0.45);

// ---------- the world: one desk (the email being written), two client boxes ----------
const DESK = { x: 0, y: 40 }, PW = 344, PH = 300, CY = [-50, 28, 106], CW = 304, CH = 74;
const BAK = { x: -480, y: 70 }, CLI = { x: 480, y: 70 }, RIM = -60, BW = 290, BH = 150;
const ANCH = { x: BAK.x, y: BAK.y + RIM };
const SLOT = i => ({ x: BAK.x - 50 + 34 * i, y: BAK.y + RIM - 14 - 5 * (i % 2), r: -0.09 + 0.06 * i });
const POP = { x: 440, y: -175 }, TICK = { x: CLI.x, y: -110 }, POD = { x: 245, y: 135 }, PODS = 120, PODCOL = mix(C.slate, C.paper, 0.35);
const PODEYE = { x: POD.x - 27, y: POD.y - 9 };

// ---------- the emails: each has a header (To:), three cards, a send time and a flight time ----------
const LET = [
  { id: 'L1', in: -1, send: 1.5, fly: 0.9, mid: 'bakery', hdr: [['To: Bakery', -1, 1.15, 0, 0.15], ['To: Clinic', 1.1, 2.45, 0.15, 0.1]], pop: [6.3, 6.7] },
  { id: 'L2', in: 6.6, send: 11.3, fly: 0.9, mid: 'sealed', stamp: 7.55, thread: [9.05, 9.75], hdr: [['To: Bakery', 6.7, 11.05, 0.3, 0.15], ['To: Clinic', 10.95, 12.25, 0.15, 0.1]] },
  { id: 'L3', in: 13.0, send: 13.9, fly: 0.8, mid: 'sealed', hdr: [['To: Clinic', 13.0, 14.75, 0.2, 0.1]] },
  { id: 'L5', in: 18.9, send: 20.0, fly: 0.85, mid: 'scrawl', scrawl: [19.35, 19.85], hdr: [['To: Clinic', 18.95, 20.9, 0.3, 0.1]], pop: [23.25, 23.65] },
  { id: 'L6', in: 22.95, send: 24.35, fly: 0.95, mid: 'sealed', hdr: [['To: Bakery', 22.95, 24.2, 0.15, 0.15], ['To: Clinic', 24.1, 25.35, 0.1, 0.1]] },
];
let home = 0;
for (const L of LET) { L.arr = L.send + L.fly;
  if (L.mid === 'sealed') { L.taut = L.send + 0.3; L.land = L.taut + 1.0; L.slot = home++; L.ok = L.arr + 0.1; }
  else { L.popT = L.arr + 0.1; } }
const LANDS = LET.filter(L => L.land).map(L => ({ t: L.land, slot: L.slot, id: L.id }));
const OKS = LET.filter(L => L.ok).map((L, i, a) => ({ t: L.ok, out: i + 1 < a.length ? Math.min(a[i + 1].ok - 0.05, L.ok + 1.4) : DUR + 1 }));
const SCANS = LET.filter(L => L.taut || L.mid === 'scrawl').map(L => ({ L, t: (L.taut ? L.taut - 0.4 : L.send - 0.3) }));
const POPS = LET.filter(L => L.popT).map(L => ({ L, t: L.popT, circ: L.popT + 0.45, fade: L.pop }));

function letter(L, t) {   // email page transform: x, y, scale, alpha
  let a = L.in < 0 ? 1 : ramp(t, L.in, L.in + 0.3, EASE.warm);
  const u = ramp(t, L.send, L.arr, EASE.warm);
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
// the stamp lands on the card's right half (whale on the right, facing left, so it never covers the words); the scrawl is on the loaf (left)
const IMP = { x: DESK.x + 78, y: DESK.y + CY[1] + 19 };
const PERCH0 = [-150, -180], PERCHR = [235, -245], PRESS = [IMP.x + REACH, IMP.y - 49], HOVER = [PRESS[0], PRESS[1] - 62],
  SCRAWL = [DESK.x - 116 - REACH, DESK.y + CY[1] - 60], WATCH = [40, -250], BAKP = [-480, -160];
const K = [[0, ...PERCH0], [2.55, ...PERCH0], [3.4, 120, -235], [3.9, 120, -235], [4.7, 100, -150], [6.85, 100, -150],
  [7.3, ...HOVER], [7.55, ...PRESS], [7.85, ...HOVER], [8.6, ...PERCHR], [15.6, ...PERCHR], [16.8, ...BAKP], [18.0, ...BAKP],
  [19.0, ...SCRAWL], [19.9, ...SCRAWL], [20.6, ...WATCH], [22.8, ...WATCH], [23.6, ...PERCH0], [DUR + 1, ...PERCH0]];
function herm(P, t) { const n = P.length; if (t <= P[0][0]) return { x: P[0][1], y: P[0][2] }; if (t >= P[n - 1][0]) return { x: P[n - 1][1], y: P[n - 1][2] };
  let i = 0; while (P[i + 1][0] < t) i++; const p1 = P[i], p2 = P[i + 1], u = (t - p1[0]) / (p2[0] - p1[0]), A2 = 2 * u * u * u - 3 * u * u + 1, C2 = 1 - A2;
  return { x: A2 * p1[1] + C2 * p2[1], y: A2 * p1[2] + C2 * p2[2] }; }
const NODS = [0.95, 10.6, 17.0, 17.4, 23.75];
function wworld(t) { const p = herm(K, t), q = herm(K, t + 0.01), sp = Math.hypot(q.x - p.x, q.y - p.y) * 100, still = 1 - clamp(sp / 150);
  let dip = 0; for (const s of NODS) { const d = t - s; if (d > 0 && d < 0.35) dip = Math.max(dip, 7 * Math.sin(Math.PI * d / 0.35)); }
  const wig = win(t, 19.35, 19.85, 0.05, 0.05) * 7 * Math.sin((t - 19.35) * 30);
  return { x: p.x + wig, y: p.y + (Math.sin(t * 2.4) * 2.5 + dip) * still }; }
const wvel = t => { const a = wworld(t - 1 / 240), c = wworld(t + 1 / 240); return { x: (c.x - a.x) * 120, y: (c.y - a.y) * 120 }; };
function heading(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const v = wvel(t + k * 0.022), w = 1 - Math.abs(k) / 9, sp = Math.hypot(v.x, v.y);
    a += (sp < 40 ? 0 : clamp(Math.atan2(v.y, Math.abs(v.x)), -0.8, 0.8) * clamp(sp / 300)) * w; s += w; } return a / s; }
const TURNS = [[6.5, -1], [10.1, 1], [13.2, -1], [17.65, 1]];
function facing(t) { let f = 1; for (const [a, to] of TURNS) f = lerp(f, to, ramp(t, a, a + 0.25, EASE.warm)); return f; }
function nose(t) { const p = wworld(t), a = heading(t), f = facing(t); return { x: p.x + f * (REACH * Math.cos(a) - 4 * Math.sin(a)), y: p.y + REACH * Math.sin(a) + 4 * Math.cos(a) }; }

// ---------- camera ----------
const FELT = { x: 300, y: 0, z: 1.55 }, TITLE = { x: 0, y: -320, z: 0.9 }, MID = { x: 0, y: -20, z: 1.4 }, STAMP = { x: 0, y: 0, z: 1.5 },
  CASE = { x: -60, y: -40, z: 1.3 }, LIM = { x: 40, y: -40, z: 1.42 }, PAY = { x: 0, y: -20, z: 1.42 };
function cam(t) { let s = { ...FELT };
  const go = (a, b, T, e) => { const k = ramp(t, a, b, e); s = { x: lerp(s.x, T.x, k), y: lerp(s.y, T.y, k), z: lerp(s.z, T.z, k) }; };
  go(3.9, 4.75, TITLE, EASE.rest); go(6.0, 7.1, STAMP, EASE.warm); go(8.1, 8.9, MID, EASE.warm); go(15.5, 16.6, CASE, EASE.rest);
  go(18.2, 19.0, MID, EASE.warm); go(20.6, 21.8, LIM, EASE.warm); go(22.7, 23.5, PAY, EASE.warm);
  return { x: s.x, y: s.y, z: s.z + 0.02 * ramp(t, 25.5, DUR, EASE.rest), ax: 960, ay: 540 }; }
const wpos = t => wworld(t);

// ---------- text ----------
const T0 = 4.45, T_LOCK = 26.3;
const cap = (id, inn, out, text) => ({ id, kind: 'caption', in: inn, out, fi: 0.25, fo: 0.2, text });
const READ = [
  cap('felt1', 0.25, 2.1, 'Same email, new client.'),
  cap('felt2', 2.15, 4.5, "I didn't mean to send the client's notes."),
  { id: 'you', kind: 'label', in: 0.1, out: 2.6, fi: 0.2, fo: 0.3, text: 'You' },
  { id: 'email', kind: 'label', in: 0, out: 4.6, fi: 0.01, fo: 0.3, text: 'Email' },
  { id: 'eyebrow', kind: 'label', in: T0 + 0.25, out: T0 + 2.47, fi: 0.4, fo: 0.45, text: 'CETI · Capabilities · 09' },
  { id: 'title', kind: 'title', in: T0 + 0.25, out: T0 + 2.47, fi: 0.4, fo: 0.45, text: 'Private cards stay home.' },
  cap('stamp', 6.95, 8.9, 'Stamp the private card.'),
  cap('tied', 8.95, 11.05, 'Stamped cards are tied to their folder.'),
  cap('check', 11.1, 13.35, 'Your AI assistant checks the stamp before sending.'),
  cap('remember', 13.4, 15.5, 'No one has to remember.'),
  { id: 'story', kind: 'label', card: true, in: 15.6, out: 19.1, fi: 0.3, fo: 0.3, text: 'True story: how we keep client notes apart' },
  { id: 'card', kind: 'card', card: true, in: 15.6, out: 19.1, fi: 0.3, fo: 0.3, text: 'One folder per client', src: 'https://app.notion.com/p/3fbd50cfaf9381048ffaecd94c9f8264' },
  { id: 'src', kind: 'label', card: true, in: 15.6, out: 19.1, fi: 0.3, fo: 0.3, text: 'Source: the AI tool we use for client work' },
  cap('limit', 19.15, 21.3, 'Plain cards go too. So stamp them.'),
  cap('notthis', 21.35, 23.5, 'It checks the stamp, not the words.'),
  cap('belief', 23.55, T_LOCK - 0.05, 'Stamp private cards once. They stay home.'),
  { id: 'ai1', kind: 'label', in: 0.1, out: DUR, fi: 0.3, fo: 0, text: 'Your AI assistant' },
  { id: 'lockup', kind: 'label', in: T_LOCK, out: DUR, fi: 0.45, fo: 0, text: 'CETI · Capabilities · 09 · Private' },
  { id: 'boxB', kind: 'label', in: 0, out: DUR, fi: 0.01, fo: 0, text: 'Client folder Bakery' },
  { id: 'boxC', kind: 'label', in: 0, out: DUR, fi: 0.01, fo: 0, text: 'Client folder Clinic' },
];
LET.forEach(L => L.hdr.forEach(([s, a, b, fi, fo], k) => READ.push({ id: `${L.id}h${k}`, kind: 'header', in: a, out: b, fi, fo, text: s })));
LET.forEach(L => { if (L.mid !== 'plain') READ.push({ id: `${L.id}note`, kind: 'note', in: L.in, out: L.pop ? L.pop[1] : DUR, fi: L.in < 0 ? 0.01 : 0.3, fo: L.pop ? 0.3 : 0, text: "Bakery's rent is late" }); });
LET.filter(L => L.mid === 'sealed').forEach(L => READ.push({ id: `${L.id}priv`, kind: 'stamp', in: L.stamp || L.in, out: DUR, fi: L.stamp ? 0.2 : 0.3, fo: 0, text: 'PRIVATE' }));
const RD = id => READ.find(r => r.id === id), RA = (t, id) => { const r = RD(id); return win(t, r.in, r.out, r.fi, r.fo); };
const INTENT = {
  problem: "Your AI assistant sends last week's email to a new client (the Clinic), and the old client's private note (\"Bakery's rent is late\") goes with it.",
  move: "You stamp the note PRIVATE once; it is tied to the Bakery's folder. Your AI assistant checks the stamp before sending, so the stamped card is pulled back home every time. No one has to remember.",
  belief: 'Stamp private cards once and they stay with their client. Also: a note written on a plain card goes too, because the check reads the stamp, not the words.' };
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
  if (sealed > 0.01) {   // the rubber-stamp impression: a violet box with PRIVATE, pressed over the right half of the card
    const pop = 1 + 0.25 * (1 - sealed); c.save(); c.translate(X, Y); c.rotate(r - 0.06); c.scale(k * pop, k * pop); c.globalAlpha *= a * clamp(sealed * 1.4);
    c.strokeStyle = STAMPC; c.lineWidth = 4; c.beginPath(); c.roundRect(22, 4, 112, 30, 5); c.stroke(); c.restore();
    c.save(); c.translate(X, Y); c.rotate(r - 0.06); text(c, 'PRIVATE', 78 * k * pop, 26 * k * pop, { f: 'monoB', size: 17 * k * pop, col: ACC, a: a * clamp(sealed * 1.4), align: 'center', track: 0.12 }); c.restore(); }
}

function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay;
  S.ground(c, t, cm, { tint: VIO });
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.lineCap = 'round'; c.lineJoin = 'round';

  // box backs + the stamped cards already home (peeking over the rim)
  for (const B of [BAK, CLI]) { c.fillStyle = BOXB; c.beginPath(); c.roundRect(X(B.x - BW / 2 + 10), Y(B.y + RIM - 22), (BW - 20) * z, (BH + 22) * z, 8 * z); c.fill(); }
  for (const Ld of LANDS) if (t >= Ld.t) { const s = SLOT(Ld.slot); card(c, X(s.x), Y(s.y), z, 'sealed', 0.8, s.r, 1); }

  // the helper pod: your AI assistant, who sends the email (a small push) and checks each card's stamp as it goes
  { const nud = LET.reduce((m, L) => Math.max(m, win(t, L.send - 0.2, L.send + 0.3, 0.12, 0.25)), 0);
    let glow = 0; for (const sc of SCANS) glow = Math.max(glow, win(t, sc.t, sc.t + 0.55, 0.08, 0.2));
    c.save(); c.translate(X(POD.x - 16 * nud), Y(POD.y + Math.sin(t * 2.1) * 3)); c.scale(-1, 1); KH.drawPod(c, 0, 0, 0, PODS * z, PODCOL, { glow: glow * 0.9 }); c.restore();
    const la = RA(t, 'ai1'); if (la > 0) S.chip(c, 'Your AI assistant', X(POD.x), Y(POD.y + 82), { f: 'sans', size: Math.round(26 * z), col: INK, a: la, align: 'center', pad: 12, border: CARDEDGE }); }

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
      if (L.popT && i === 1 && t > L.arr - 0.05) return;
      const seal = L.stamp ? ramp(t, L.stamp, L.stamp + 0.22, EASE.glaser) : 1;
      card(c, px, py + cy * s, 1, kind === 'sealed' && seal <= 0 ? 'bakery' : kind, s, 0, lt.a, { seal, scrawl: L.scrawl ? ramp(t, L.scrawl[0], L.scrawl[1], EASE.warm) : 1 }); });
    if (L.stamp) { const ring = win(t, L.stamp, L.stamp + 0.7, 0.03, 0.5); if (ring > 0) { const sx = px + 78 * s, sy = py + (CY[1] + 19) * s, rr = (70 + 50 * ramp(t, L.stamp, L.stamp + 0.7)) * s;
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
    let tx, ty; if (L.mid === 'sealed') { const q = sealedCard(L, t); tx = q.x + 78 * q.s; ty = q.y + 19 * q.s; } else { const lt = letter(L, t); tx = lt.x - 116 * lt.s; ty = lt.y + (CY[1] + 2) * lt.s; }
    const col = L.mid === 'sealed' ? VIO : SOFT, ex = X(PODEYE.x), ey = Y(PODEYE.y);
    c.save(); c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = 4 * z; c.setLineDash([10 * z, 8 * z]); c.beginPath(); c.moveTo(ex, ey); c.lineTo(X(tx), Y(ty)); c.stroke(); c.setLineDash([]);
    c.lineWidth = 5 * z; c.beginPath(); c.arc(X(tx), Y(ty), 30 * z, 0, Math.PI * 2); c.stroke(); c.restore(); }

  // box fronts with their labels
  for (const [B, name] of [[BAK, 'Bakery'], [CLI, 'Clinic']]) {
    const x0 = X(B.x - BW / 2), y0 = Y(B.y + RIM), w = BW * z, h = BH * z;
    let glow = 0; for (const Ld of LANDS) if (B === BAK) glow = Math.max(glow, win(t, Ld.t, Ld.t + 0.9, 0.05, 0.6));
    if (glow > 0.01) { c.save(); c.strokeStyle = rgba(VIO, 0.35 * glow); c.lineWidth = 16 * z; c.beginPath(); c.roundRect(x0, y0, w, h, 10 * z); c.stroke(); c.restore(); }
    c.fillStyle = BOXF; c.strokeStyle = INK; c.lineWidth = Math.max(4, 5 * z); c.beginPath(); c.roundRect(x0 + w - 120 * z, y0 - 26 * z, 104 * z, 40 * z, 7 * z); c.fill(); c.stroke();   // folder tab
    c.beginPath(); c.roundRect(x0, y0, w, h, 10 * z); c.fill(); c.stroke();
    text(c, 'Client folder', X(B.x), Y(B.y + RIM + 42), { f: 'mono', size: 20 * z, col: SOFT, align: 'center', track: 0.12 });
    if (B === BAK) { loaf(c, X(B.x - 70), Y(B.y + RIM + 94), 1.15 * z, SAL, INK, 3 * z); text(c, name, X(B.x + 22), Y(B.y + RIM + 107), { f: 'sans', size: 38 * z, col: INK, align: 'center' }); }
    else text(c, name, X(B.x), Y(B.y + RIM + 107), { f: 'sans', size: 38 * z, col: INK, align: 'center' });
  }

  // the wrong card comes out at the clinic: it rises out of the box and is circled
  for (const P of POPS) { if (t < P.t) continue; const a = 1 - ramp(t, P.fade[0], P.fade[1], EASE.rest); if (a <= 0) continue;
    const u = ramp(t, P.t, P.t + 0.45, EASE.glaser), x = CLI.x, y = lerp(CLI.y, POP.y, u), s = lerp(0.5, 1.25, u);
    c.save(); c.beginPath(); c.rect(0, 0, W, Y(CLI.y + RIM)); c.clip(); card(c, X(x), Y(y), z, P.L.mid === 'scrawl' ? 'scrawl' : 'bakery', s, 0.04 * u, a); c.restore();
    const ci = ramp(t, P.circ, P.circ + 0.4, EASE.warm); if (ci > 0) { c.save(); c.globalAlpha = a; c.strokeStyle = ALARM; c.lineWidth = Math.max(6, 7 * z); c.beginPath();
      for (let k = 0; k <= 60; k++) { const th = -2.2 + k / 60 * 2 * Math.PI * 1.08 * ci, rr = 1 + 0.06 * k / 60; const px = X(POP.x) + Math.cos(th) * 0.62 * CW * 1.25 * z * rr, py = Y(POP.y) + Math.sin(th) * 0.85 * CH * 1.25 * z * rr; k ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.stroke(); c.restore(); } }
  // the clinic's tick: the email arrived with only its own cards
  for (const O of OKS) { const a = win(t, O.t, O.out, 0.08, 0.3); if (a <= 0) continue; const pop = 1 + 0.2 * Math.exp(-(t - O.t) * 8), cx = X(TICK.x), cy = Y(TICK.y), R = 48 * z * pop, m = 20 * z * pop;
    c.save(); c.globalAlpha = a; c.fillStyle = C.paper; c.strokeStyle = VIO; c.lineWidth = 4 * z; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill(); c.stroke();
    c.lineWidth = 9 * z; c.beginPath(); c.moveTo(cx - m, cy + 1); c.lineTo(cx - m * 0.25, cy + m * 0.8); c.lineTo(cx + m * 1.05, cy - m * 0.9); c.stroke(); c.restore(); }

  // the little whale ("you"), with the rubber stamp at its nose during the stamping
  { const p = wworld(t), ang = heading(t), v = wvel(t), sp = Math.hypot(v.x, v.y), moving = clamp(sp / 400), f = facing(t);
    let blink = 0; for (const k of [1.8, 5.6, 9.6, 12.4, 16.0, 19.9, 24.2, 27.0]) blink = Math.max(blink, 1 - Math.abs(t - k) / 0.07);
    blink = Math.max(blink, win(t, 13.45, 15.45, 0.15, 0.15));                    // eyes shut: not watching, the box does the work
    let squash = 0; for (const k of [7.55]) { const d = t - k; if (d >= 0 && d < 0.32) squash = Math.max(squash, 0.13 * (1 - EASE.glaser(d / 0.32))); }
    const focus = Math.max(win(t, 6.9, 7.9, 0.2, 0.2), win(t, 19.0, 19.9, 0.15, 0.15), win(t, 21.6, 23.1, 0.3, 0.3) * 0.6);
    const eye = 1 + 0.4 * win(t, 2.55, 4.2, 0.06, 0.4) + 0.35 * win(t, 21.0, 21.8, 0.06, 0.3);
    const spark = Math.max(win(t, LANDS[0].t, LANDS[0].t + 0.9, 0.1, 0.4), win(t, 17.0, 17.7, 0.1, 0.3) * 0.7, win(t, LANDS[LANDS.length - 1].t, LANDS[LANDS.length - 1].t + 1.3, 0.12, 0.5));
    const delight = (t > LANDS[0].t && t < LANDS[0].t + 0.8) || (t > 16.95 && t < 17.7) || t > LANDS[LANDS.length - 1].t + 0.05 ? 1 : 0;
    c.save(); c.translate(X(p.x), Y(p.y)); c.scale(f, 1);
    KH.drawWhale(c, { x: 0, y: 0, ang, scale: WS * z, L: 1, tail: Math.sin(t * (moving > 0.3 ? 11 : 3)) * lerp(0.12, 0.34, moving), fin: Math.sin(t * 6 + 1.3) * lerp(0.15, 0.3, moving),
      blink, squash, focus: delight ? 0 : focus, eye, spark, sparkColor: VIO, delight, blush: 0.6, mouth: delight ? 0.4 : 0.45 * win(t, 2.6, 3.9, 0.06, 0.3) + 0.3 * win(t, 21.0, 21.8, 0.06, 0.3),
      spray: win(t, 26.8, 27.9, 0.2, 0.6), sw: 3.2 });
    c.restore();
    const ya = RA(t, 'you'); if (ya > 0) S.chip(c, 'You', X(p.x), Y(p.y - 98), { f: 'sans', size: Math.round(30 * z), col: INK, a: ya, align: 'center', pad: 12, border: CARDEDGE });
    const pa = win(t, 19.05, 20.1, 0.15, 0.2); if (pa > 0) { const n = nose(t), nx = X(n.x), ny = Y(n.y), k = z;   // a pencil: you write the note by hand
      c.save(); c.globalAlpha = pa; c.lineCap = 'butt'; c.strokeStyle = INK; c.lineWidth = 12 * k; c.beginPath(); c.moveTo(nx, ny - 4 * k); c.lineTo(nx, ny + 38 * k); c.stroke();
      c.fillStyle = SAL; c.strokeStyle = INK; c.lineWidth = 2.5 * k; c.beginPath(); c.moveTo(nx - 6 * k, ny + 38 * k); c.lineTo(nx + 6 * k, ny + 38 * k); c.lineTo(nx, ny + 54 * k); c.closePath(); c.fill(); c.stroke(); c.restore(); }
    const st = win(t, 6.95, 8.2, 0.2, 0.3); if (st > 0) { const n = nose(t), nx = X(n.x), ny = Y(n.y), k = z;
      c.save(); c.globalAlpha = st; c.fillStyle = INK; c.beginPath(); c.roundRect(nx - 10 * k, ny + 2 * k, 20 * k, 30 * k, 6 * k); c.fill();
      c.beginPath(); c.arc(nx, ny, 13 * k, 0, Math.PI * 2); c.fill();
      c.fillStyle = VIO; c.strokeStyle = INK; c.lineWidth = 3 * k; c.beginPath(); c.roundRect(nx - 40 * k, ny + 32 * k, 80 * k, 26 * k, 4 * k); c.fill(); c.stroke(); c.restore(); }
  }

  // the title hinge: the scene goes still under a paper veil
  const veil = win(t, 4.5, T0 + 2.55, 0.35, 0.4); if (veil > 0) { c.fillStyle = rgba(C.paper, 0.5 * veil); c.fillRect(0, 0, W, H); }

  // the real-case card (top left, clean paper round it)
  const ka = RA(t, 'card'); if (ka > 0) { const x0 = 150, dy = (1 - EASE.defer(ramp(t, 15.6, 15.95))) * 8, l1 = 'True story: how we keep client notes apart', l2 = 'One folder per client', l3 = 'Source: the AI tool we use for client work';
    c.save(); c.font = `60px ${KH.FONTS.disp}`; const w1 = c.measureText(l2).width; c.font = `30px ${KH.FONTS.sans}`; const w2 = c.measureText(l3).width; c.restore();
    c.save(); c.font = `30px ${KH.FONTS.sans}`; const w3 = c.measureText(l1).width; c.restore(); const wd = Math.max(w1, w2, w3) + 70; c.save(); c.globalAlpha = ka; c.fillStyle = C.paper; c.strokeStyle = CARDEDGE; c.lineWidth = 1.2;
    c.beginPath(); c.roundRect(x0 - 30, 48 + dy, wd, 214, 8); c.fill(); c.stroke(); c.fillStyle = VIO; c.fillRect(x0 - 30, 48 + dy, 6, 214); c.restore();
    text(c, l1, x0, 98 + dy, { f: 'sans', size: 30, col: SOFT, a: ka });
    text(c, l2, x0, 172 + dy, { f: 'disp', size: 60, col: INK, a: ka });
    text(c, l3, x0, 230 + dy, { f: 'sans', size: 30, col: SOFT, a: ka }); }

  for (const r of READ) if (r.kind === 'caption') S.caption(c, t, r, { size: 40 });
  S.open(c, t - T0, { no: '09', title: 'Private <i>cards</i> stay home.', accent: ACC }, { out: 2.47 });
  S.lockup(c, t, T_LOCK, { no: '09', short: 'Private' });
  c.restore();
}

function cues() {
  return { bpm: BPM, dur: DUR, title: T0 + 0.25, veil: 4.5, unveil: T0 + 2.15,
    hdrSwap: LET.filter(L => L.hdr.length > 1).map(L => L.hdr[0][2] - 0.45), send: LET.map(L => L.send), arrive: LET.map(L => L.arr),
    pop: POPS.map(P => P.t), circle: POPS.map(P => P.circ), stamp: 7.55, thread: [9.05, 9.75], taut: LET.filter(L => L.taut).map(L => L.taut),
    home: LANDS.map(l => l.t), ok: OKS.map(o => o.t), sleep: 13.45, wake: 15.45, pat: [17.0, 17.4], scrawl: [19.35, 19.85], podSend: LET.map(L => L.send), scan: SCANS.map(s => s.t),
    spark: [LANDS[0].t, LANDS[LANDS.length - 1].t], card: RD('card').in, limit: POPS[1].t, notThis: RD('notthis').in, belief: RD('belief').in, lockup: T_LOCK, spray: 26.8,
    tags: { consequence: [POPS[0].circ], focus: [POPS[0].circ, 7.55, LANDS[0].t, LANDS[LANDS.length - 1].t], mech: [7.55, 9.05, LET[1].taut, LANDS[0].t], limit: [POPS[1].circ], callback: [LANDS[LANDS.length - 1].t] } }; }
const CONTRAST = [['captions / card main (ink on paper chip)', INK, C.paper], ['title (ink on chart ground)', INK, BG], ['title accent on ground', ACC, BG],
  ['title accent on veiled ground (paper)', ACC, C.paper], ['eyebrow / lockup (slate on ground)', SOFT, BG], ['card label + source (slate on paper)', SOFT, C.paper],
  ['email header (ink on paper page)', INK, C.paper], ['"Bakery\'s rent is late" (ink on note card)', INK, CARD], ['PRIVATE stamp text (accent on note card)', ACC, CARD],
  ['box name (ink on box front)', INK, BOXF], ['"Client" (slate on box front)', SOFT, BOXF]];
root.EPISODE = { drawFrame, cues, READ, CONTRAST, INTENT, TERMS, DUR, W, H, fps: 60, wpos, heading, cam,
  shutter: t => LET.some(L => t > L.send && t < (L.land || L.arr)) ? [3, 0.6] : [2, 0.5] };
})(typeof window !== 'undefined' ? window : globalThis);
