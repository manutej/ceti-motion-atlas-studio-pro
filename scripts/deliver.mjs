#!/usr/bin/env node
// deliver.mjs — v9.2 step 7: `npm run deliver` → work/deliver/<board>/{poster.png, contact-sheet.png, loop-check.json, README.md, compare.html}
// Stills come from the live studio (index.html) via Playwright; the v9.1 side of compare.html is the v9.1 Standalone from git.
// Env: PW_MODULE (path to playwright/index.js), CHROME_PATH (chromium binary), V91_REF (git ref of v9.1, default the commit before v9.2 step 1).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'work', 'deliver');
const { chromium } = await import(process.env.PW_MODULE ? pathToFileURL(process.env.PW_MODULE).href : 'playwright').then((m) => m.default || m);
const BOARDS = ['v9-mcp-server', 'v9-planning-fallacy'];
const SA = 'Motion Atlas Studio Pro — Standalone.html';
const v91Ref = process.env.V91_REF || execFileSync('git', ['log', '--format=%H', '-1', '--grep=^v9.2: step 1', '--', 'vendor/sfx-kit.js'], { cwd: ROOT }).toString().trim() + '~1';
const v91Path = path.join(OUT, '.v91-standalone.html');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(v91Path, execFileSync('git', ['show', v91Ref + ':' + SA], { cwd: ROOT }));
const tokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'work', 'tokens.resolved.json'), 'utf8'));

const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
async function open(url, board) {
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(900);
  await page.evaluate((board) => {
    const a = window.__MOTION_ATLAS_STUDIO_INSTANCE; a.setState({ surface: 'storyboard-sheet', playing: false, musicOn: false });
    const sel = document.querySelector('#sb-story-select'); if (sel && sel.value !== 'v9:' + board) { sel.value = 'v9:' + board; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  }, board);
  await page.waitForTimeout(500);
  return page.evaluate(() => { const sb = window.__MOTION_ATLAS_STUDIO_INSTANCE.state.storyboard || {}; return { total: sb.totalDurationSec, beats: (sb.beats || []).map((b) => ({ i: b.index, g: b.grammar, t0: b.tStartSec, t1: b.tEndSec, payoff: b.payoff === true, say: b.say })) }; });
}
async function still(t) {
  const clip = await page.evaluate((t) => {
    const a = window.__MOTION_ATLAS_STUDIO_INSTANCE, beats = (a.state.storyboard && a.state.storyboard.beats) || [];
    const c = [...document.querySelectorAll('canvas')].sort((x, y) => y.clientWidth * y.clientHeight - x.clientWidth * x.clientHeight)[0];
    // the largest storyboard card becomes the stage: pin it to time t and to the beat that owns t
    const tt = beats.length ? t % beats[beats.length - 1].tEndSec : t, b = beats.find((x) => tt >= x.tStartSec && tt < x.tEndSec) || beats[0];
    c.setAttribute('data-fixed-t', String(tt)); if (b) c.getAttributeNames().filter((n) => /beat/.test(n)).forEach((n) => c.setAttribute(n, String(b.index)));
    a._T = tt; a.drawAllCanvases();
    const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height };
  }, t);
  await page.waitForTimeout(120);
  return page.screenshot({ clip });
}
async function composite(pngs, cols) {   // in-page canvas grid → PNG buffer
  const b64 = await page.evaluate(async ({ srcs, cols }) => {
    const imgs = await Promise.all(srcs.map((s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; })));
    const w = imgs[0].width, h = imgs[0].height, rows = Math.ceil(imgs.length / cols), cv = document.createElement('canvas');
    cv.width = w * Math.min(cols, imgs.length); cv.height = h * rows; const g = cv.getContext('2d');
    imgs.forEach((im, k) => g.drawImage(im, (k % cols) * w, Math.floor(k / cols) * h));
    return cv.toDataURL('image/png').split(',')[1];
  }, { srcs: pngs.map((p) => p.toString('base64')), cols });
  return Buffer.from(b64, 'base64');
}
async function diff(a, b) {   // mean absolute RGB difference, as a fraction of full scale
  return page.evaluate(async ({ a, b }) => {
    const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
    const [A, B] = await Promise.all([load(a), load(b)]); const cv = document.createElement('canvas'); cv.width = A.width; cv.height = A.height; const g = cv.getContext('2d');
    g.drawImage(A, 0, 0); const da = g.getImageData(0, 0, A.width, A.height).data; g.drawImage(B, 0, 0); const db = g.getImageData(0, 0, A.width, A.height).data;
    let s = 0; for (let i = 0; i < da.length; i += 4) s += Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
    return s / (da.length / 4 * 3 * 255);
  }, { a: a.toString('base64'), b: b.toString('base64') });
}

const summary = [];
for (const board of BOARDS) {
  const dir = path.join(OUT, board); fs.mkdirSync(dir, { recursive: true });
  const sb = await open(pathToFileURL(path.join(ROOT, 'index.html')).href, board);
  const pays = sb.beats.filter((b) => b.payoff);
  const landing = sb.beats[sb.beats.length - 1];
  const poster = await still((landing.t0 + landing.t1) / 2);
  fs.writeFileSync(path.join(dir, 'poster.png'), poster);
  const payStills = []; for (const b of pays) payStills.push(await still(b.t1 - 0.05));
  fs.writeFileSync(path.join(dir, 'contact-sheet.png'), await composite(payStills, 2));
  const a0 = await still(0), aEnd = await still(sb.total - 1e-3), aWrap = await still(sb.total);
  const loop = { board, totalSec: sb.total, seek0_vs_seekEnd: +(await diff(a0, aEnd)).toFixed(4), seek0_vs_seekWrap: +(await diff(a0, aWrap)).toFixed(4), limit: 0.01 };
  loop.pass = loop.seek0_vs_seekWrap <= loop.limit;
  loop.note = 'seekWrap = seek(totalSec), which the studio clock wraps onto the loop; seekEnd = the last landing frame (expected to differ: the landing echoes, not repeats, the hook).';
  fs.writeFileSync(path.join(dir, 'loop-check.json'), JSON.stringify(loop, null, 2) + '\n');
  await open(pathToFileURL(v91Path).href, board);
  const old = await still((landing.t0 + landing.t1) / 2);
  fs.writeFileSync(path.join(dir, 'poster-v9.1.png'), old);
  const css = Object.entries(tokens).filter(([, v]) => typeof v === 'string').map(([k, v]) => `--${k.replace(/[^a-z0-9-]/gi, '-')}: ${v};`).join(' ');
  fs.writeFileSync(path.join(dir, 'compare.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${board} · v9.1 vs v9.2</title>
<!-- Wipe compare adapted from motion-graphics/skills/motion-broll/templates/compare.html (MIT, Bart); stills instead of video. -->
<style>:root{${css}} body{margin:0;padding:16px;font:15px/1.4 system-ui,sans-serif;background:var(--paper, Canvas);color:var(--ink, CanvasText)}
.wipe{position:relative;max-width:1100px;margin:auto} .wipe img{display:block;width:100%} .top{position:absolute;inset:0;overflow:hidden;width:50%} .top img{width:calc(100% * 2)}
input{width:100%;max-width:1100px;display:block;margin:12px auto} p{max-width:1100px;margin:8px auto}</style></head><body>
<p><b>${board}</b> · landing frame · left: v9.1 · right: v9.2 (drag to wipe)</p>
<div class="wipe"><img src="poster.png" alt="v9.2 landing frame"><div class="top" id="top"><img src="poster-v9.1.png" alt="v9.1 landing frame"></div></div>
<input type="range" min="0" max="100" value="50" aria-label="Wipe position" oninput="var t=document.getElementById('top');t.style.width=this.value+'%';t.firstElementChild.style.width=(this.value>0?10000/this.value:100)+'%'">
</body></html>\n`);
  fs.writeFileSync(path.join(dir, 'README.md'), `# ${board} — v9.2 deliverables\n\n- \`poster.png\` — landing frame (t = ${((landing.t0 + landing.t1) / 2).toFixed(2)} s)\n- \`contact-sheet.png\` — one still per payoff (${pays.map((b) => b.t1 + ' s').join(', ')})\n- \`loop-check.json\` — seek(0) vs seek(end): wrap ${loop.seek0_vs_seekWrap} (≤ 0.01: ${loop.pass}), landing ${loop.seek0_vs_seekEnd}\n- \`compare.html\` — v9.1 vs v9.2 wipe (template pattern: motion-broll/templates/compare.html, MIT)\n\nRegenerate: \`npm run deliver\` (needs Playwright; see scripts/deliver.mjs).\n`);
  summary.push({ board, payoffs: pays.length, loop });
}
fs.rmSync(v91Path);
await browser.close();
console.log(JSON.stringify(summary, null, 1));
