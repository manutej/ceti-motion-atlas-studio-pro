// Signal — moodboard. Drawn entirely with the Kinetic Hydrography kit.
const { KH, createCanvas } = require('../host.cjs');
const fs = require('fs');
const { CETI: C, W, text, mix, rgba, rng, EASE, bearingRing, whaleMark } = KH;
const cv = createCanvas(1920, 1080), c = cv.getContext('2d');
const SPLIT = 1080;
const NOISE = [W.englishRed, W.violetBlue, W.ochraceousSalmon], SIG = W.lightGlaucousBlue;

// grounds
c.fillStyle = C.paper; c.fillRect(0, 0, SPLIT, 1080);
c.fillStyle = C.navy; c.fillRect(SPLIT, 0, 1920 - SPLIT, 1080);

// header
text(c, 'CETI · Signal · Moodboard', 96, 120, { f: 'mono', size: 15, col: C.slate });
text(c, 'Signal over <i>noise</i>.', 96, 200, { f: 'disp', size: 76, col: C.navy, accent: W.englishRed, strike: 1, strikeCol: W.englishRed });
text(c, 'A 30-second kinetic film at 120 BPM. Loud to quiet, light to dark.', 96, 246, { f: 'sans', size: 20, col: C.slate });
text(c, 'Act IV – V · The signal', 1176, 120, { f: 'mono', size: 15, col: C.fog });
text(c, 'Wada · 339 / 166', 1824, 120, { f: 'mono', size: 13, col: SIG, align: 'right' });
text(c, 'Act I – III · The feed', 96, 300, { f: 'mono', size: 13, col: C.slate });

// THE FEED: kinetic lanes with speed smear
const R = rng(3);
const WORDS = ['Breaking', 'New model', '10x faster', 'You are behind', 'Must-read', 'Hot take', 'Update 4.0', 'Act now', 'Trending', 'Another framework', 'Live', 'Do not miss', 'Ranked', 'Unread'];
const lanes = [[360, 46, 'monoB', NOISE[0], 0], [402, 18, 'mono', C.navy, 0], [476, 66, 'monoB', NOISE[2], 2], [512, 16, 'mono', NOISE[1], 0], [566, 36, 'monoB', NOISE[1], 0], [628, 52, 'monoB', NOISE[0], 2]];
c.save(); c.beginPath(); c.rect(96, 300, SPLIT - 300, 380); c.clip();
lanes.forEach(([y, size, f, col, stroke], li) => {
  let s = ''; for (let i = 0; i < 9; i++) s += WORDS[(li * 5 + i * 3) % WORDS.length] + '  ·  ';
  const x0 = 96 - R() * 200;
  for (let k = 6; k >= 0; k--) text(c, s, x0 - k * (li % 2 ? -9 : 9), y, { f, size, col, a: k ? 0.12 : 1, stroke: stroke || 0, track: 0.08 });
});
c.restore();
// notification pills
const pill = (x, y, label, bg, fg, outline) => { c.save(); c.font = '15px SpaceMonoB'; if ('letterSpacing' in c) c.letterSpacing = '2.5px';
  const w = c.measureText(label).width + 34, h = 34; c.beginPath(); c.roundRect(x, y - h / 2, w, h, 17);
  if (outline) { c.strokeStyle = bg; c.lineWidth = 2; c.stroke(); } else { c.fillStyle = bg; c.fill(); }
  c.fillStyle = outline ? bg : fg; c.textBaseline = 'middle'; c.fillText(label, x + 17, y + 1); c.restore(); };
pill(620, 330, '12 NEW', W.englishRed, C.paper); pill(250, 438, 'LIVE', W.violetBlue, C.paper); pill(760, 536, 'BREAKING', W.englishRed, C.paper, true);
pill(420, 600, '+3', W.ochraceousSalmon, C.navy); pill(600, 655, '9,999+', W.violetBlue, C.paper);
for (let i = 0; i < 70; i++) { c.fillStyle = rgba(NOISE[i % 3], 0.8); c.beginPath(); c.arc(110 + R() * 860, 310 + R() * 360, 1.5 + R() * 3, 0, 7); c.fill(); }

// THE FILTER: scanner ring straddling the split; sweep wedge
const SX = SPLIT, SY = 520, SR = 160;
c.save(); const g = c.createConicGradient ? c.createConicGradient(-0.9, SX, SY) : null;
for (let k = 0; k < 24; k++) { const a0 = -0.9 + k * 0.0375; c.beginPath(); c.moveTo(SX, SY); c.arc(SX, SY, SR, a0, a0 + 0.04); c.closePath(); c.fillStyle = rgba(SIG, 0.02 + 0.3 * (k / 23) ** 2); c.fill(); } c.strokeStyle = SIG; c.lineWidth = 2; c.beginPath(); c.moveTo(SX, SY); c.lineTo(SX + Math.cos(0) * SR, SY); c.stroke(); c.restore();
c.save(); c.beginPath(); c.rect(0, 0, SPLIT, 1080); c.clip(); bearingRing(c, SX, SY, SR, 0.15, C.slate, 0.9, false); c.restore();
c.save(); c.beginPath(); c.rect(SPLIT, 0, 840, 1080); c.clip(); bearingRing(c, SX, SY, SR, 0.15, C.fog, 0.9, false); c.restore();
text(c, 'The filter', SX - 40, SY + SR + 52, { f: 'mono', size: 12, col: C.slate, align: 'right' });
// dropped items: grey outlines falling away on the dark side
for (let i = 0; i < 6; i++) { const x = SX + 70 + i * 16, y = SY + 60 + i * 13; c.strokeStyle = rgba(C.fog, 0.55 - i * 0.06); c.lineWidth = 1.5;
  c.beginPath(); c.roundRect(x, y, 40 - i * 4, 14, 7); c.stroke(); }

// THE SIGNAL: kept items on a rising line, then one calm wave
text(c, 'Filter <i>noise</i>.', 1176, 300, { f: 'disp', size: 64, col: C.paper, accent: SIG });
const pts = [[1290, 560], [1410, 512], [1530, 470], [1650, 418], [1770, 372]], labels = ['Question', 'Context', 'Source', 'Test', 'Decision'];
c.strokeStyle = SIG; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
pts.forEach(([x, y], i) => { c.fillStyle = C.navy; c.beginPath(); c.arc(x, y, 8, 0, 7); c.fill(); c.strokeStyle = SIG; c.lineWidth = 2.5; c.stroke();
  text(c, labels[i], x, y + 36, { f: 'mono', size: 10, col: C.fog, align: 'center', track: 0.16 }); });
c.strokeStyle = rgba(SIG, 0.9); c.lineWidth = 2; c.beginPath();
for (let x = 1176; x <= 1824; x += 4) { const u = (x - 1176) / 648, y = 660 + Math.sin(u * Math.PI * 4) * 18 * (1 - u * 0.6); x === 1176 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
text(c, 'Signal · 1 line', 1176, 712, { f: 'mono', size: 11, col: C.fog });

// motion vocabulary
c.fillStyle = rgba(C.navy, 0.10); c.fillRect(96, 760, SPLIT - 192, 1);
c.fillStyle = rgba(C.fog, 0.25); c.fillRect(1176, 760, 648, 1);
text(c, 'Motion vocabulary', 96, 790, { f: 'mono', size: 13, col: C.slate });
const box = (x, w, ink) => { c.strokeStyle = rgba(ink, 0.35); c.lineWidth = 1; c.strokeRect(x, 810, w, 74); };
// 1 beat grid
box(96, 210, C.slate); for (let i = 0; i < 16; i++) { const x = 108 + i * 12, tall = i % 4 === 0; c.fillStyle = tall ? C.navy : rgba(C.navy, 0.45); c.fillRect(x, tall ? 826 : 838, 2, tall ? 44 : 32); }
c.fillStyle = W.englishRed; c.fillRect(108 + 9 * 12 + 5, 818, 2, 58);
text(c, 'Beat grid · 120 BPM', 96, 908, { f: 'mono', size: 10, col: C.slate });
// 2 whip pan
box(330, 210, C.slate); for (let k = 7; k >= 0; k--) { c.fillStyle = rgba(W.violetBlue, k ? 0.09 : 1); c.fillRect(420 - k * 14, 828, 70, 38); }
text(c, 'Whip pan', 330, 908, { f: 'mono', size: 10, col: C.slate });
// 3 sort
box(564, 210, C.slate); for (let i = 0; i < 6; i++) { const x = 586 + i * 30; c.strokeStyle = rgba(C.slate, 0.6); c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, 826); c.quadraticCurveTo(x + 8, 846, x + 10, 878); c.stroke(); }
c.strokeStyle = W.englishRed; c.lineWidth = 2.4; c.beginPath(); c.moveTo(740, 870); c.quadraticCurveTo(748, 846, 760, 824); c.stroke();
text(c, 'Sort · 95 fall, 5 rise', 564, 908, { f: 'mono', size: 10, col: C.slate });
// 4 tempo decay
box(798, 186, C.slate); c.strokeStyle = C.navy; c.lineWidth = 1.6; c.beginPath(); let x = 808;
[[4, 8], [3, 6], [2, 4], [1.2, 2], [0.4, 1]].forEach(([h, n], i) => { for (let k = 0; k < n; k++) { c.moveTo(x, 874); c.lineTo(x, 874 - h * 12); x += 168 / 21; } });
c.stroke(); text(c, 'Tempo · decelerate', 798, 908, { f: 'mono', size: 10, col: C.slate });
// 5 flash gate (dark side)
box(1176, 300, C.fog); c.strokeStyle = SIG; c.lineWidth = 1.6; c.beginPath();
for (let i = 0; i <= 280; i++) { const u = i / 280, y = 856 - (Math.sin(u * 30) * 0.5 + 0.5) * 22 * (1 - u) - 4; i ? c.lineTo(1186 + i, y) : c.moveTo(1186, y); } c.stroke();
c.setLineDash([4, 5]); c.strokeStyle = rgba(W.englishRed, 0.9); c.beginPath(); c.moveTo(1186, 826); c.lineTo(1466, 826); c.stroke(); c.setLineDash([]);
text(c, 'Gate · flashes ≤ 3 per second', 1176, 908, { f: 'mono', size: 10, col: C.fog });
// palette chips
const chips = (x, label, cols, ink) => { text(c, label, x, 790, { f: 'mono', size: 11, col: ink }); };
text(c, 'Noise · Wada 339', 1520, 790, { f: 'mono', size: 11, col: C.fog });
[W.englishRed, W.violetBlue, W.ochraceousSalmon].forEach((h, i) => { c.fillStyle = h; c.fillRect(1520 + i * 52, 810, 44, 44); });
text(c, 'Signal', 1690, 790, { f: 'mono', size: 11, col: C.fog });
[SIG, W.naplesYellow].forEach((h, i) => { c.fillStyle = h; c.fillRect(1690 + i * 52, 810, 44, 44); });
[['D96629', 1520], ['40456A', 1572], ['D8A37B', 1624], ['A5C8D1', 1690], ['FBE6A0', 1742]].forEach(([s, x]) => text(c, s, x, 872, { f: 'mono', size: 9, col: C.fog, track: 0.06 }));

// provenance strip
text(c, 'Lineage · Kinetic Hydrography 1.0.0 → Little whale v2 → Signal', 96, 990, { f: 'mono', size: 11, col: C.slate, track: 0.14 });
text(c, 'Deviation · the feed outruns house durations, on purpose', 1176, 990, { f: 'mono', size: 11, col: C.fog, track: 0.14 });
whaleMark(c, 1772, 966, 0.52, C.fog);

fs.writeFileSync(__dirname + '/moodboard.png', cv.toBuffer('image/png'));
console.log('ok');
