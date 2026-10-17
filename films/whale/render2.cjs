// node render2.cjs out.mp4 startFrame endFrame — 60 fps, 2 sub-frames of motion blur per frame, raw RGBA -> ffmpeg
const { FILM, makeRenderer } = require('./engine2.cjs');
const { spawn } = require('child_process'); const fs = require('fs');
const [out, a, b] = [process.argv[2], +process.argv[3], +process.argv[4]], fps = 60, R = makeRenderer(2);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', '1920x1080', '-r', String(fps), '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-g', '120', '-tune', 'animation', out], { stdio: ['pipe', 'inherit', 'inherit'] });
(async () => {
  const t0 = Date.now();
  for (let i = a; i < b; i++) {
    const c = R(i / fps);
    if (!ff.stdin.write(Buffer.from(c.data()))) await new Promise(r => ff.stdin.once('drain', r));
    if ((i - a) % 120 === 0) fs.writeFileSync(out + '.log', `frame ${i - a}/${b - a} ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
  }
  ff.stdin.end(); ff.on('close', () => fs.writeFileSync(out + '.log', `DONE ${b - a} ${((Date.now() - t0) / 1000).toFixed(0)}s\n`));
})();
