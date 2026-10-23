// D3 check (v9.1): MCP board at a proof beat + the breather, rendered at tMid (1600×1000 @2x), plus the sheet.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PW_MODULE ? pathToFileURL(process.env.PW_MODULE).href : 'playwright').then((m) => m.default || m);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'work/eval-v9');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'load' });
await page.waitForTimeout(800);
await page.evaluate(() => { const a = window.__MOTION_ATLAS_STUDIO_INSTANCE; a.setState({ playing: false, surface: 'storyboard-sheet', vectorOn: true, captionsCovered: false }); });
await page.waitForTimeout(300);
await page.evaluate(() => { const sel = document.querySelector('#sb-story-select'); if (sel && sel.value !== 'v9:v9-mcp-server') { sel.value = 'v9:v9-mcp-server'; sel.dispatchEvent(new Event('change', { bubbles: true })); } });
await page.waitForTimeout(500);
await page.evaluate(() => window.__MOTION_ATLAS_STUDIO_INSTANCE.drawAllCanvases());
await page.screenshot({ path: path.join(OUT, 'after-D3-mcp-sheet.png') });
const datas = await page.evaluate(() => {
  const a = window.__MOTION_ATLAS_STUDIO_INSTANCE, st = a.state, sb = st.storyboard, pal = a.getActivePalette(), feel = MA.FEELS[st.feel], out = {};
  const pick = { proof: sb.beats.findIndex((b) => b.grammar === 'proof'), breather: sb.beats.findIndex((b) => b.grammar === 'breather') };
  for (const [k, i] of Object.entries(pick)) {
    const b = sb.beats[i], c = document.createElement('canvas'); c.width = 960; c.height = 600;
    MA.render(c, sb.storyKey, pal, feel, b.tMidSec, { wob: st.wob, grain: st.grain, streaks: st.streaks, guide: st.guide, ground: st.ground, charId: st.charId, rung: st.rung, renderMode: null, cameraMove: b.cameraMove, beatIdx: i, beatCount: sb.beats.length, captionsCovered: false, onionSkin: false, twoLayer: true, beat: b, sheet: sb, seed: pal.id | 0 });
    out[k] = { url: c.toDataURL('image/png'), say: b.say };
  }
  return out;
});
for (const [k, d] of Object.entries(datas)) { fs.writeFileSync(path.join(OUT, `after-D3-${k}.png`), Buffer.from(d.url.split(',')[1], 'base64')); console.log(k, '→', d.say); }
await browser.close();
