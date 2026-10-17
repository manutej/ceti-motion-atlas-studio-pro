// node shot.mjs <page.html> <out.png> [t1,t2,...]  — screenshots a page (optionally at seek times)
import chromium from '@sparticuz/chromium';
import { chromium as pw } from 'playwright-core';
import path from 'node:path';
const [page, out, times] = process.argv.slice(2);
const b = await pw.launch({ executablePath: await chromium.executablePath(), args: chromium.args });
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await pg.goto('file://' + path.resolve(page));
await pg.evaluate(() => document.fonts.ready);
if (!times) await pg.screenshot({ path: out });
else for (const t of times.split(',').map(Number)) {
  await pg.evaluate(t => window.seek(t), t);
  await pg.screenshot({ path: out.replace('%t', String(t).padStart(5, '0')) });
}
await b.close();
