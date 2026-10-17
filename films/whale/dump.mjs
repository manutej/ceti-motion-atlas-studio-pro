import chromium from '@sparticuz/chromium';
import { chromium as pw } from 'playwright-core';
import path from 'node:path'; import fs from 'node:fs';
const b = await pw.launch({ executablePath: await chromium.executablePath(), args: chromium.args });
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await pg.goto('file://' + path.resolve('film.html'));
await pg.evaluate(() => seek(44));
fs.writeFileSync('frame44.svg', await pg.evaluate(() => document.getElementById('s').outerHTML));
await b.close();
