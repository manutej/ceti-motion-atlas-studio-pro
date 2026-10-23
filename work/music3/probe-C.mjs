// Offline render of the v9 MUSIC score on the MCP board (current palette) + measurements
// Copied from the v9 blind critic's scratchpad (v9.1): only OUT/TAG/URL/playwright resolution are parameterised.
// Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers PW_MODULE=<…/playwright/index.js> PROBE_OUT=<dir> TAG=v9.1 node audio.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PW_MODULE ? pathToFileURL(process.env.PW_MODULE).href : 'playwright').then((m) => m.default || m);
const OUT = process.env.PROBE_OUT || path.dirname(fileURLToPath(import.meta.url));
const TAG = process.env.TAG || 'v9';
const URL = process.env.STUDIO_URL || pathToFileURL(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../index.html')).href;
const SR = 44100, DUR = 30;
const KIT = process.env.KIT !== '0';   // v9.2: KIT=0 renders the synth-only SFX (pre-kit baseline)
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'], ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(1200);
await page.click('button[data-action="toggle-play"]').catch(() => {});   // synthetic user gesture
await page.evaluate(() => { const a = window.__MOTION_ATLAS_STUDIO_INSTANCE; a.setState({ surface: 'storyboard-sheet', playing: false, musicOn: true }); });
await page.evaluate(() => { const sel = document.querySelector('#sb-story-select'); if (sel.value !== 'v9:v9-mcp-server') { sel.value = 'v9:v9-mcp-server'; sel.dispatchEvent(new Event('change', { bubbles: true })); } });
await page.addScriptTag({path:'work/music3/cand-C.js'});
await page.waitForTimeout(600);

async function render(mode) {
  if (!(await page.evaluate(() => !!window.MIX_C))) await page.addScriptTag({path:'work/music3/cand-C.js'});
  return page.evaluate(async ({ mode, SR, DUR, KIT }) => {
    if (!KIT) window.SFX_KIT = null;
    const a = window.__MOTION_ATLAS_STUDIO_INSTANCE;
    // stop the app from driving MUSIC while we render offline
    cancelAnimationFrame(a._raf); MUSIC.sync = function () {};
    try { MUSIC.pause(); } catch (_e) {}
    const pal = a.getActivePalette(); const sheet = a.musicSheet();
    const seed = String(sheet.id || 'sb') + '|' + (pal.id || 0);
    MUSIC.setEnabled(true); MUSIC.setPalette(pal);
    const plan = MUSIC.plan(sheet, pal, seed);
    const ctx = new OfflineAudioContext(1, SR * DUR, SR);
    const info = MUSIC.schedule(ctx, plan, 0); MIX_C.apply(ctx, MUSIC.mix, MIX_C.design(plan, null, 7), plan);
    if (window.SFX_KIT) await window.SFX_KIT.decode(ctx);   // v9.2: decode the CC0 kit once before rendering (deterministic trigger times)
    if (mode === 'musicOnly') MUSIC.mix.sfx.gain.value = 0;
    if (mode === 'sfxOnly') MUSIC.mix.music.gain.value = 0;
    // step the lookahead scheduler: suspend every 100 ms, let the 40 ms interval tick fire, resume
    const step = 0.1; const susp = [];
    for (let t = step; t < DUR; t += step) susp.push(ctx.suspend(Number(t.toFixed(3))));
    MUSIC.play();
    const renderP = ctx.startRendering();
    for (const p of susp) { await p; await new Promise(r => setTimeout(r, 55)); ctx.resume(); }
    const buf = await renderP;
    try { MUSIC.pause(); } catch (_e) {}
    const ch = buf.getChannelData(0);
    // transfer as base64 of Float32
    const u8 = new Uint8Array(ch.buffer); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    const planLite = { bpm: plan.bpm, key: plan.key, feel: plan.feel, archetype: plan.archetype, totalSec: plan.totalSec, loopSec: plan.loopSec, endSec: plan.endSec, cues: plan.cues.map(c => ({ i: c.beatIndex, t0: c.tStart, t1: c.tEnd, mood: c.mood, role: c.role, voices: c.voices, dyn: c.dyn, chords: (c.chordProgression || []).map(x => x.quality + '@' + (x.t != null ? x.t : '')) })), sfx: plan.sfx, callback: plan.callback, motif: plan.motif, duck: plan.duck, targetLUFS: plan.targetLUFS, events: plan.events.length, eventTypes: plan.events.reduce((m, e) => { m[e.type] = (m[e.type] || 0) + 1; return m; }, {}) };
    return { info: { live: info.live, events: info.events, bpm: info.bpm, key: info.key }, plan: planLite, b64: btoa(s), sr: buf.sampleRate, len: buf.length, mode };
  }, { mode, SR, DUR, KIT });
}

const out = {};
for (const mode of ['full', 'musicOnly', 'sfxOnly']) {
  // fresh page state per render to avoid cross-ctx mix leftovers
  const r = await render(mode);
  const f32 = new Float32Array(Buffer.from(r.b64, 'base64').buffer.slice(0));
  fs.writeFileSync(`${OUT}/${TAG}-score-${mode}.f32`, Buffer.from(f32.buffer));
  out[mode] = { info: r.info, len: r.len, sr: r.sr };
  if (mode === 'full') fs.writeFileSync(`${OUT}/${TAG}-plan.json`, JSON.stringify(r.plan, null, 2));
  console.log(mode, r.info, 'samples', r.len);
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(1000);
  await page.click('button[data-action="toggle-play"]').catch(() => {});
  await page.evaluate(() => { const a = window.__MOTION_ATLAS_STUDIO_INSTANCE; a.setState({ surface: 'storyboard-sheet', playing: false, musicOn: true }); });
  await page.waitForTimeout(400);
}
fs.writeFileSync(`${OUT}/${TAG}-render-info.json`, JSON.stringify(out, null, 2));
await browser.close();
