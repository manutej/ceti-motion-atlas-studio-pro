// node stills2.cjs out_dir t1,t2,...  — renders stills with motion blur and a contact sheet
const { makeRenderer, createCanvas } = require('./engine2.cjs');
const fs = require('fs');
const [dir, ts] = process.argv.slice(2);
fs.mkdirSync(dir, { recursive: true });
const R = makeRenderer(2), times = ts.split(',').map(Number);
const cols = 3, w = 640, h = 360, sheet = createCanvas(w * cols, h * Math.ceil(times.length / cols)), sc = sheet.getContext('2d');
let t0 = Date.now();
times.forEach((t, i) => {
  const c = R(t);
  fs.writeFileSync(`${dir}/v2_${String(t).padStart(5, '0')}.png`, c.toBuffer('image/png'));
  sc.drawImage(c, (i % cols) * w, Math.floor(i / cols) * h, w, h);
  sc.fillStyle = '#ff5050'; sc.font = '16px SpaceMono'; sc.fillText(String(t), (i % cols) * w + 8, Math.floor(i / cols) * h + 20);
});
fs.writeFileSync(`${dir}/sheet.png`, sheet.toBuffer('image/png'));
console.log('ms/frame (2 sub)', ((Date.now() - t0) / times.length).toFixed(0));
