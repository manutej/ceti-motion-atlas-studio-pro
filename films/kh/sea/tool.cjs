// node tool.cjs stills t1,t2,... out.png | gate | cues out.json | render out.mp4 a b
const { KH, createCanvas } = require('../host.cjs'); require('../whale-rig.js'); require('./film.js');
const fs = require('fs'); const { spawn } = require('child_process');
const FILM = globalThis.SEA; const [cmd, ...rest] = process.argv.slice(2);
function makeRenderer() { const out = createCanvas(FILM.W, FILM.H), oc = out.getContext('2d'), tmp = createCanvas(FILM.W, FILM.H), tc = tmp.getContext('2d');
  return t => { const [sub, sh] = FILM.shutter(t); FILM.drawFrame(oc, t);
    for (let k = 1; k < sub; k++) { FILM.drawFrame(tc, t + (k / sub) * (sh / FILM.fps)); oc.save(); oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalAlpha = 1 / (k + 1); oc.drawImage(tmp, 0, 0); oc.restore(); } return out; }; }
if (cmd === 'stills') { const times = rest[0].split(',').map(Number), out = rest[1], R = makeRenderer(), cols = 3, w = 640, h = 360, t0 = Date.now();
  const sheet = createCanvas(w * cols, h * Math.ceil(times.length / cols)), sc = sheet.getContext('2d');
  times.forEach((t, i) => { sc.drawImage(R(t), (i % cols) * w, Math.floor(i / cols) * h, w, h); sc.fillStyle = KH.W.englishRed; sc.font = '16px SpaceMono'; sc.fillText(String(t), (i % cols) * w + 8, Math.floor(i / cols) * h + 20); });
  fs.writeFileSync(out, sheet.toBuffer('image/png')); console.log('ms/frame', ((Date.now() - t0) / times.length).toFixed(0));
} else if (cmd === 'frame') { const R = makeRenderer(); fs.writeFileSync(rest[1], R(+rest[0]).toBuffer('image/png'));
} else if (cmd === 'gate') { let ok = true;
  for (const r of FILM.READ) { const hold = (r.out - r.fo) - (r.in + r.fi), need = 0.6 + 0.15 * r.text.split(/\s+/).length, pass = hold >= need; ok = ok && pass; console.log(`read  ${pass ? 'PASS' : 'FAIL'}  "${r.text}" ${hold.toFixed(2)} s (needs ${need.toFixed(2)})`); }
  let wpx = 0, wr = 0, at = 0, atr = 0; const scr = t => { const c = FILM.cam(t), p = FILM.wpos(t); return { x: (p.x - c.x) * c.z + c.ax, y: (p.y - c.y) * c.z + c.ay }; };
  for (let i = 1; i < FILM.DUR * 60; i++) { const a = scr((i - 1) / 60), b = scr(i / 60), d = Math.hypot(b.x - a.x, b.y - a.y), dh = Math.abs(FILM.heading(i / 60) - FILM.heading((i - 1) / 60)); if (d > wpx) { wpx = d; at = i / 60; } if (dh > wr) { wr = dh; atr = i / 60; } }
  const pj = wpx <= 30 && wr <= 0.35; ok = ok && pj; console.log(`jump  ${pj ? 'PASS' : 'FAIL'}  whale on screen ${wpx.toFixed(1)} px/frame @${at.toFixed(2)}s, ${wr.toFixed(3)} rad/frame @${atr.toFixed(2)}s`);
  for (const [what, fg, bg] of FILM.CONTRAST) { const r = KH.contrast(fg, bg), pass = r >= 4.5; ok = ok && pass; console.log(`contrast ${pass ? 'PASS' : 'FAIL'}  ${what} ${r.toFixed(1)}:1`); }
  console.log(ok ? 'GATES PASS' : 'GATES FAIL'); process.exitCode = ok ? 0 : 1;
} else if (cmd === 'cues') { fs.writeFileSync(rest[0], JSON.stringify(FILM.cues())); console.log('cues ok');
} else if (cmd === 'render') { const [out, a, b] = [rest[0], +rest[1], +rest[2]], R = makeRenderer();
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', '1920x1080', '-r', '60', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-g', '120', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  (async () => { const t0 = Date.now(); for (let i = a; i < b; i++) { if (!ff.stdin.write(Buffer.from(R(i / 60).data()))) await new Promise(r => ff.stdin.once('drain', r));
      if ((i - a) % 120 === 0) fs.writeFileSync(out + '.log', `frame ${i - a}/${b - a} ${((Date.now() - t0) / 1000).toFixed(0)}s\n`); }
    ff.stdin.end(); ff.on('close', () => fs.writeFileSync(out + '.log', `DONE ${b - a} ${((Date.now() - t0) / 1000).toFixed(0)}s\n`)); })(); }
