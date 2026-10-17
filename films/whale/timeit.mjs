import chromium from '@sparticuz/chromium';
import { chromium as pw } from 'playwright-core';
import path from 'node:path';
const b = await pw.launch({ executablePath: await chromium.executablePath(), args: chromium.args });
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await pg.goto('file://' + path.resolve('film.html'));
for (const t of [10, 36, 50]) { let a = 0, c = 0; for (let i = 0; i < 4; i++) { const t0 = Date.now(); await pg.evaluate(x => seek(x), t + i / 30); const t1 = Date.now(); await pg.screenshot({ type: 'jpeg', quality: 95 }); a += t1 - t0; c += Date.now() - t1; } console.log(t, 'seek', a / 4, 'shot', c / 4, 'ms'); }
await b.close();
