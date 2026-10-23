// D2 / D1 check (v9.1): PLAY + v9 toggles inside the viewport at 1366/1600/1920, and the Standalone boots in Chromium.
// Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers PW_MODULE=/path/to/node_modules/playwright/index.js node work/eval-v9/check-transport.mjs
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PW_MODULE ? pathToFileURL(process.env.PW_MODULE).href : 'playwright').then((m) => m.default || m);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const browser = await chromium.launch();
let ok = true;
const ids = ['toggle-play', 'toggle-music', 'toggle-vector-layer', 'toggle-captions-covered'];
for (const width of [1366, 1600, 1920]) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  for (const id of ids) {
    const b = await page.locator(`button[data-action="${id}"]`).first().boundingBox();
    const inside = !!b && b.x >= 0 && b.x + b.width <= width && b.y >= 0 && b.y + b.height <= 1000;
    if (!inside) ok = false;
    console.log(`${width}px ${id}: ${b ? `x=${Math.round(b.x)}..${Math.round(b.x + b.width)} y=${Math.round(b.y)}` : 'missing'} ${inside ? 'IN' : 'OUT'}`);
  }
  if (width === 1600) await page.screenshot({ path: path.join(ROOT, 'work/eval-v9/after-D2-strip-1600.png'), clip: { x: 0, y: 0, width, height: 170 } });
  await page.close();
}
const sp = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = [];
sp.on('pageerror', (e) => errs.push(e.message));
await sp.goto(pathToFileURL(path.join(ROOT, 'Motion Atlas Studio Pro — Standalone.html')).href, { waitUntil: 'load' });
await sp.waitForTimeout(800);
const boot = await sp.evaluate(() => ({ play: !!document.querySelector('button[data-action="toggle-play"]'), MA: !!window.MA, MUSIC: !!window.MUSIC, bodyTextHasSource: /function\s*\(/.test(document.body.innerText) }));
const booted = boot.play && boot.MA && boot.MUSIC && !boot.bodyTextHasSource && errs.length === 0;
console.log('Standalone boot:', JSON.stringify(boot), 'errors:', errs.length, booted ? 'BOOTS' : 'BROKEN');
await browser.close();
if (!ok || !booted) process.exit(1);
