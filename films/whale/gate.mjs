// Frame-jump gate: whale speed and rotation per frame must stay under limits (atlas: <=60 px, <=0.7 rad per frame)
import chromium from '@sparticuz/chromium';
import { chromium as pw } from 'playwright-core';
import path from 'node:path';
const b = await pw.launch({ executablePath: await chromium.executablePath(), args: chromium.args });
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await pg.goto('file://' + path.resolve('film.html'));
const r = await pg.evaluate(() => {
  const fps = 30, N = 60 * fps; let worst = { px: 0, rad: 0 }, at = {};
  for (let i = 1; i <= N; i++) {
    const t0 = (i - 1) / fps, t1 = i / fps;
    if ((t0 < 52.8) !== (t1 < 52.8)) continue; // offscreen hand-off between paths
    const a = pos(t0), b = pos(t1);
    const vis = p => p.x > -150 && p.x < 2070;
    if (!vis(a) && !vis(b)) continue;
    const d = Math.hypot(b.x - a.x, b.y - a.y), dh = heading(t1) - heading(t0), h = Math.abs(Math.atan2(Math.sin(dh), Math.cos(dh)));
    if (d > worst.px) { worst.px = d; at.px = t1; }
    if (h > worst.rad) { worst.rad = h; at.rad = t1; }
  }
  return { worst, at };
});
console.log(JSON.stringify(r));
console.log(r.worst.px <= 60 && r.worst.rad <= 0.7 ? 'GATE PASS' : 'GATE FAIL');
await b.close();
