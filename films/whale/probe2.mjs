import chromium from '@sparticuz/chromium';
import { chromium as pw } from 'playwright-core';
import path from 'node:path';
const b = await pw.launch({ executablePath: await chromium.executablePath(), args: chromium.args });
const pg = await b.newPage();
await pg.goto('file://' + path.resolve('film.html'));
console.log(await pg.evaluate(() => { const o = []; for (let t = 48.0; t <= 48.4; t += 1 / 30) { const v = vel(t); o.push([t.toFixed(3), heading(t).toFixed(3), v.x.toFixed(0), v.y.toFixed(0)].join(' ')); } return o.join('\n'); }));
await b.close();
