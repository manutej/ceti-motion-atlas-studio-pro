// node tool.cjs stills t1,t2,... out.png | sheet out.png [step] | frame t out.png | gate | cues out.json | render out.mp4 a b
const { load } = require('./engine.cjs');
const fs = require('fs'); const { spawn } = require('child_process');
const [cmd, ...rest] = process.argv.slice(2);
const { FILM, makeRenderer, createCanvas, KH } = load();
function sheet(times, out) { const R = makeRenderer(), cols = 3, w = 640, h = 360;
  const sh = createCanvas(w * cols, h * Math.ceil(times.length / cols)), sc = sh.getContext('2d'), t0 = Date.now();
  sc.fillStyle = KH.CETI.fog; sc.fillRect(0, 0, sh.width, sh.height);
  times.forEach((t, i) => { const x = (i % cols) * w, y = Math.floor(i / cols) * h; sc.drawImage(R(t), x + 1, y + 1, w - 2, h - 2); sc.fillStyle = KH.W.englishRed; sc.font = '16px SpaceMono'; sc.fillText(t.toFixed(2), x + 8, y + 20); });
  fs.writeFileSync(out, sh.toBuffer('image/png')); console.log('ms/frame', ((Date.now() - t0) / times.length).toFixed(0)); }
if (cmd === 'stills') sheet(rest[0].split(',').map(Number), rest[1]);
else if (cmd === 'sheet') { const st = +(rest[1] || 1.25), ts = []; for (let t = 0; t < FILM.DUR - 1e-6; t += st) ts.push(+t.toFixed(3)); sheet(ts, rest[0]); }
else if (cmd === 'frame') { const R = makeRenderer(); fs.writeFileSync(rest[1], R(+rest[0]).toBuffer('image/png')); console.log('ok'); }
else if (cmd === 'gate') {
  let ok = true;
  for (const r of FILM.READ) { const hold = (r.out - r.fo) - (r.in + r.fi), need = 0.6 + 0.15 * r.text.split(/\s+/).length, pass = hold >= need; ok = ok && pass;
    console.log(`read  ${pass ? 'PASS' : 'FAIL'}  ${r.id.padEnd(5)} "${r.text}" ${hold.toFixed(2)} s (needs ${need.toFixed(2)})`); }
  // frame-jump on SCREEN position of the whale (what the viewer tracks), 60 fps
  let wpx = 0, wr = 0, at = 0, atr = 0;
  const scr = t => { const c = FILM.cam(t), p = FILM.wpos(t); return { x: (p.x - c.x) * c.z + c.ax, y: (p.y - c.y) * c.z + c.ay }; };
  for (let i = 1; i <= FILM.DUR * 60; i++) { const a = scr((i - 1) / 60), b = scr(i / 60), d = Math.hypot(b.x - a.x, b.y - a.y), dh = Math.abs(FILM.heading(i / 60) - FILM.heading((i - 1) / 60));
    if (d > wpx) { wpx = d; at = i / 60; } if (dh > wr) { wr = dh; atr = i / 60; } }
  const pj = wpx <= 30 && wr <= 0.35; ok = ok && pj;
  console.log(`jump  ${pj ? 'PASS' : 'FAIL'}  whale on screen ${wpx.toFixed(1)} px/frame @${at.toFixed(2)}s, ${wr.toFixed(3)} rad/frame @${atr.toFixed(2)}s (limits 30 px, 0.35 rad)`);
  console.log(ok ? 'GATES PASS' : 'GATES FAIL'); process.exitCode = ok ? 0 : 1;
} else if (cmd === 'cues') { fs.writeFileSync(rest[0], JSON.stringify(FILM.cues())); console.log('cues ok');
} else if (cmd === 'render') {
  const [out, a, b] = [rest[0], +rest[1], +rest[2]], R = makeRenderer();
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', '1920x1080', '-r', '60', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-g', '120', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  (async () => { const t0 = Date.now(); for (let i = a; i < b; i++) { if (!ff.stdin.write(Buffer.from(R(i / 60).data()))) await new Promise(r => ff.stdin.once('drain', r));
      if ((i - a) % 120 === 0) fs.writeFileSync(out + '.log', `frame ${i - a}/${b - a} ${((Date.now() - t0) / 1000).toFixed(0)}s\n`); }
    ff.stdin.end(); ff.on('close', () => fs.writeFileSync(out + '.log', `DONE ${b - a} ${((Date.now() - t0) / 1000).toFixed(0)}s\n`)); })();
}
