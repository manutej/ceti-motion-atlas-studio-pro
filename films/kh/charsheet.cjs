// Character sheet v2 — the little whale's expressions and the AI pods, drawn from the rig.
const { KH, createCanvas } = require('./host.cjs'); require('./whale-rig.js');
const fs = require('fs'); const { CETI: C, W, text } = KH;
const cv = createCanvas(1920, 1080), c = cv.getContext('2d');
c.fillStyle = C.paper; c.fillRect(0, 0, 1920, 1080);
text(c, 'CETI · Little whale · Character sheet v2', 96, 110, { f: 'mono', size: 15, col: C.slate });
text(c, 'One whale, a few <i>feelings</i>, a pod of helpers.', 96, 186, { f: 'disp', size: 64, col: C.navy, accent: W.rawSienna });
const poses = [['Cruise', {}], ['Focus', { focus: 1 }], ['Idea', { spark: 0.8, eye: 1.25 }], ['Delight', { delight: 1, blush: 1, mouth: 0.5 }], ['Sing', { mouth: 1, blush: 0.6 }], ['Spout', { spray: 1, sprayColor: W.rawSienna }]];
poses.forEach(([lb, o], i) => { const x = 230 + i * 290, y = 430;
  KH.drawWhale(c, { x, y, ang: i === 5 ? -0.25 : 0, scale: 0.78, L: 1, tail: [0.2, 0.05, -0.1, 0.25, -0.2, 0.1][i], fin: 0.2, blush: 0.5, ...o });
  text(c, lb, x, 560, { f: 'mono', size: 13, col: C.slate, align: 'center' }); });
// flight in air: ghost frames along an arc
text(c, 'Swims in air — no water needed', 96, 660, { f: 'mono', size: 13, col: C.slate });
for (let k = 0; k < 6; k++) { const u = k / 5, x = 140 + u * 620, y = 860 - Math.sin(u * Math.PI) * 120;
  KH.drawWhale(c, { x, y, ang: Math.atan2(-Math.cos(u * Math.PI) * 120 * Math.PI, 620) * 0.8, scale: 0.42, L: 1, alpha: k === 5 ? 1 : 0.18 + k * 0.12, ghost: k !== 5, tail: Math.sin(k * 1.7) * 0.3, sw: 3.6 }); }
// pods
text(c, 'AI pods — one job each, coloured by the job', 900, 660, { f: 'mono', size: 13, col: C.slate });
const jobs = [W.rawSienna, W.lightGlaucousBlue, W.vinaceousCinnamon, W.naplesYellow, W.sageGreen || C.sage, W.violetBlue];
jobs.forEach((col, i) => { const x = 960 + i * 130, y = 800; KH.drawPod(c, x, y, -0.15 + i * 0.06, [64, 52, 44, 36, 28, 22][i], col); text(c, [64, 52, 44, 36, 28, 22][i] + ' px', x, 870, { f: 'mono', size: 10, col: C.slate, align: 'center' }); });
KH.drawWhale(c, { x: 1680, y: 760, ang: -0.1, scale: 0.55, L: 1, spark: 0.5, eye: 1.2, blush: 0.6 });
text(c, 'Rig: kh/whale-rig.js · every colour a token or a mix of tokens', 96, 1000, { f: 'mono', size: 11, col: C.slate, track: 0.14 });
fs.writeFileSync(process.argv[2] || require('path').join(__dirname, 'charsheet-v2.png'), cv.toBuffer('image/png')); console.log('ok');
