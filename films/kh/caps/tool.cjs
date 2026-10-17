// Shared tool for every CETI Capabilities episode. An episode is a folder kh/caps/<slug>/ with:
//   film.js   — sets globalThis.EPISODE = { drawFrame(ctx,t), cues(), READ, CONTRAST, DUR, W, H, fps, shutter(t), wpos?, heading?, cam? }
//   score.py  — python3 score.py cues.json out.wav  (every sound on an exported cue)
// usage: node kh/caps/tool.cjs <slug> stills t1,t2,... out.png | sheet out.png [step] | frame t out.png | gate | cues out.json | dur | render out.mp4 a b
const path = require('path'), fs = require('fs'), { spawn } = require('child_process');
const { KH, createCanvas } = require('../host.cjs'); require('../whale-rig.js'); require('./series.js');
const [slug, cmd, ...rest] = process.argv.slice(2);
require(path.resolve(__dirname, slug, 'film.js'));
const FILM = globalThis.EPISODE;
function makeRenderer() { const out = createCanvas(FILM.W, FILM.H), oc = out.getContext('2d'), tmp = createCanvas(FILM.W, FILM.H), tc = tmp.getContext('2d');
  return t => { const [sub, sh] = FILM.shutter(t); FILM.drawFrame(oc, t);
    for (let k = 1; k < sub; k++) { FILM.drawFrame(tc, t + (k / sub) * (sh / FILM.fps)); oc.save(); oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalAlpha = 1 / (k + 1); oc.drawImage(tmp, 0, 0); oc.restore(); }
    return out; }; }
function sheet(times, out) { const R = makeRenderer(), cols = 3, w = 640, h = 360;
  const sh = createCanvas(w * cols, h * Math.ceil(times.length / cols)), sc = sh.getContext('2d'), t0 = Date.now();
  sc.fillStyle = KH.CETI.fog; sc.fillRect(0, 0, sh.width, sh.height);
  times.forEach((t, i) => { const x = (i % cols) * w, y = Math.floor(i / cols) * h; sc.drawImage(R(t), x + 1, y + 1, w - 2, h - 2);
    sc.fillStyle = KH.W.englishRed; sc.font = '16px SpaceMono'; sc.fillText(t.toFixed(2), x + 8, y + 20); });
  fs.writeFileSync(out, sh.toBuffer('image/png')); console.log('ms/frame', ((Date.now() - t0) / times.length).toFixed(0)); }

if (cmd === 'stills') sheet(rest[0].split(',').map(Number), rest[1]);
else if (cmd === 'sheet') { const st = +(rest[1] || 1.25), ts = []; for (let t = 0; t < FILM.DUR - 1e-6; t += st) ts.push(+t.toFixed(3)); sheet(ts, rest[0]); }
else if (cmd === 'frame') fs.writeFileSync(rest[1], makeRenderer()(+rest[0]).toBuffer('image/png'));
else if (cmd === 'dur') process.stdout.write(String(FILM.DUR));
else if (cmd === 'cues') { fs.writeFileSync(rest[0], JSON.stringify(FILM.cues())); console.log('cues ok'); }
else if (cmd === 'gate') { let ok = true;
  for (const r of FILM.READ) { const hold = (r.out - r.fo) - (r.in + r.fi), need = 0.6 + 0.15 * r.text.split(/\s+/).length, pass = hold >= need; ok = ok && pass;
    console.log(`read  ${pass ? 'PASS' : 'FAIL'}  "${r.text}" ${hold.toFixed(2)} s (needs ${need.toFixed(2)})`); }
  if (FILM.wpos) { // frame-jump on the SCREEN position of the whale, 60 fps; heading wrapped to (-pi, pi]
    const cam = FILM.cam || (() => ({ x: 0, y: 0, z: 1, ax: 0, ay: 0 })), scr = t => { const c = cam(t), p = FILM.wpos(t); return { x: (p.x - c.x) * c.z + c.ax, y: (p.y - c.y) * c.z + c.ay }; };
    const wrap = a => Math.atan2(Math.sin(a), Math.cos(a)); let wpx = 0, wr = 0, at = 0, atr = 0;
    for (let i = 1; i < FILM.DUR * 60; i++) { const a = scr((i - 1) / 60), b = scr(i / 60), d = Math.hypot(b.x - a.x, b.y - a.y);
      const dh = FILM.heading ? Math.abs(wrap(FILM.heading(i / 60) - FILM.heading((i - 1) / 60))) : 0;
      if (d > wpx) { wpx = d; at = i / 60; } if (dh > wr) { wr = dh; atr = i / 60; } }
    const pj = wpx <= 30 && wr <= 0.35; ok = ok && pj; console.log(`jump  ${pj ? 'PASS' : 'FAIL'}  whale on screen ${wpx.toFixed(1)} px/frame @${at.toFixed(2)}s, ${wr.toFixed(3)} rad/frame @${atr.toFixed(2)}s`); }
  for (const [what, fg, bg] of FILM.CONTRAST) { const r = KH.contrast(fg, bg), pass = r >= 4.5; ok = ok && pass; console.log(`contrast ${pass ? 'PASS' : 'FAIL'}  ${what} ${r.toFixed(1)}:1`); }
  console.log(ok ? 'GATES PASS' : 'GATES FAIL'); process.exitCode = ok ? 0 : 1; }
else if (cmd === 'render') { const [out, a, b] = [rest[0], +rest[1], +rest[2]], R = makeRenderer();
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${FILM.W}x${FILM.H}`, '-r', String(FILM.fps), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-g', '120', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  (async () => { const t0 = Date.now(); for (let i = a; i < b; i++) { if (!ff.stdin.write(Buffer.from(R(i / FILM.fps).data()))) await new Promise(r => ff.stdin.once('drain', r));
      if ((i - a) % 120 === 0) fs.writeFileSync(out + '.log', `frame ${i - a}/${b - a} ${((Date.now() - t0) / 1000).toFixed(0)}s\n`); }
    ff.stdin.end(); ff.on('close', () => fs.writeFileSync(out + '.log', `DONE ${b - a} ${((Date.now() - t0) / 1000).toFixed(0)}s\n`)); })(); }
else { console.error('unknown command'); process.exitCode = 2; }
