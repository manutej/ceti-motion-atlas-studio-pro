// Deterministic capture of frames [a, b): seek(i/fps) -> screenshot -> ffmpeg segment
import chromium from '@sparticuz/chromium';
import { chromium as pw } from 'playwright-core';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const [out, a, b] = [process.argv[2], +process.argv[3], +process.argv[4]];
const br = await pw.launch({ executablePath: await chromium.executablePath(), args: chromium.args });
const pg = await br.newPage({ viewport: { width: 1920, height: 1080 } });
await pg.goto('file://' + path.resolve('film.html'));
await pg.evaluate(() => document.fonts.ready);
const { fps } = await pg.evaluate(() => window.FILM);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-tune', 'animation', '-g', '60', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now(), log = out + '.log';
for (let i = a; i < b; i++) {
  await pg.evaluate(t => window.seek(t), i / fps);
  const buf = await pg.screenshot({ type: 'jpeg', quality: 96 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if ((i - a) % 60 === 0) fs.writeFileSync(log, `frame ${i - a}/${b - a} ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
}
ff.stdin.end(); await new Promise(r => ff.on('close', r));
fs.writeFileSync(log, `DONE ${b - a} frames ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
await br.close();
