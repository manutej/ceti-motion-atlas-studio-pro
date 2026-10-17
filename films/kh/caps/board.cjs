// CETI Capabilities — series board. One true frame from each live episode engine, plus title, Wada chips and the "not this" line.
// node kh/caps/board.cjs out.png
const path = require('path'), fs = require('fs');
const { KH, createCanvas } = require('../host.cjs'); require('../whale-rig.js'); require('./series.js');
const { CETI: C, text, mix, rgba, whaleMark } = KH;
const EPS = [
  { slug: 'stitch', no: '01', t: 9.7, title: 'Context is <i>composed</i>.', wada: 166, not: 'Consistency is not correctness.' },
  { slug: 'gate', no: '02', t: 11.3, title: 'Check it at the <i>gate</i>.', wada: 243, not: 'A gate proves the absence of known failures — not quality.' },
  { slug: 'glue', no: '03', t: 11.6, title: 'Memory that <i>agrees</i>.', wada: 207, not: 'Glued is not the same as true.' },
  { slug: 'conserve', no: '04', t: 16.2, title: 'Change everything but the <i>laws</i>.', wada: 84, not: 'Noether-inspired — we choose the laws.' },
  { slug: 'tellapart', no: '05', t: 14.9, title: 'Same reading, <i>different</i> world.', wada: 339, not: 'More metrics isn\'t the fix.' },
];
const W = 1920, H = 1080, cv = createCanvas(W, H), c = cv.getContext('2d'), src = createCanvas(1920, 1080), sc = src.getContext('2d');
c.fillStyle = C.paper; c.fillRect(0, 0, W, H);
text(c, 'CETI · Capabilities · Series 1', 72, 78, { f: 'mono', size: 15, col: C.slate });
text(c, 'One capability. One move. <i>One whale.</i>', 72, 150, { f: 'disp', size: 60, col: C.navy, accent: mix(KH.W.rawSienna, C.navy, 0.25) });
text(c, 'Kinetic Hydrography 1.0.0 · chart ground · gates on every frame', W - 72, 78, { f: 'mono', size: 13, col: C.slate, align: 'right' });
const CW = 576, CH = 324, GX = 72, GAP = 24;
EPS.forEach((e, i) => {
  delete globalThis.EPISODE; require(path.resolve(__dirname, e.slug, 'film.js')); const F = globalThis.EPISODE; F.drawFrame(sc, e.t);
  const col = i < 3 ? i : i - 3, row = i < 3 ? 0 : 1, x = row ? GX + (CW + GAP) * (col + 0.5) : GX + col * (CW + GAP), y = row ? 640 : 210;
  c.drawImage(src, x, y, CW, CH); c.strokeStyle = rgba(C.navy, 0.2); c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, CW - 1, CH - 1);
  const chipsW = KH.WADA[e.wada].length * 22;
  text(c, `${e.no} · ${e.slug.toUpperCase()}`, x, y + CH + 30, { f: 'mono', size: 13, col: C.navy });
  KH.WADA[e.wada].forEach(([, h], k) => { c.fillStyle = h; c.fillRect(x + CW - chipsW + k * 22, y + CH + 16, 18, 18); });
  text(c, e.title, x, y + CH + 66, { f: 'disp', size: 30, col: C.navy, accent: C.rust });
  text(c, e.not, x, y + CH + 94, { f: 'sans', size: 15, col: C.slate });
});
whaleMark(c, W - 72 - 100, H - 92, 0.9, C.navy, 0.9);
fs.writeFileSync(process.argv[2], cv.toBuffer('image/png')); console.log('ok');
