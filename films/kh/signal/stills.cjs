// node stills.cjs t1,t2,... [out.png] — contact sheet of motion-blurred stills
const { makeRenderer, createCanvas } = require('./engine.cjs');
const fs = require('fs');
const times = process.argv[2].split(',').map(Number), out = process.argv[3] || __dirname + '/sheet.png';
const R = makeRenderer(), cols = 3, w = 640, h = 360, sheet = createCanvas(w * cols, h * Math.ceil(times.length / cols)), sc = sheet.getContext('2d');
const t0 = Date.now();
times.forEach((t, i) => { const c = R(t); sc.drawImage(c, (i % cols) * w, Math.floor(i / cols) * h, w, h);
  sc.fillStyle = '#ff3b3b'; sc.font = '16px SpaceMono'; sc.fillText(String(t), (i % cols) * w + 8, Math.floor(i / cols) * h + 20); });
fs.writeFileSync(out, sheet.toBuffer('image/png'));
console.log('ms/frame', ((Date.now() - t0) / times.length).toFixed(0));
