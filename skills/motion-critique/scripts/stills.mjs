#!/usr/bin/env node
// stills.mjs — capture deterministic stills from any host page that exposes a seekable clock (frame = f(t)).
//
//   node skills/motion-critique/scripts/stills.mjs --config <config.json> --out <dir>
//        [--times auto | 1,4.2,9] [--beats work/beats.json] [--param key=value]... [--no-determinism]
//
// Config (JSON; every *Expr is a JS string evaluated in the page; a string is an expression, an array of strings is a
// function body that may `return`; in scope: `params`, and for seekExpr also `t` and `el`):
//   url          page to open; a path without a scheme resolves against --root (default: cwd)
//   viewport     { width, height }   deviceScaleFactor  pixel density of the stills (default 1)
//   readyExpr    polled until truthy after load (optional)
//   setupExpr    run once after ready (choose board, pause playback, mute) (optional)
//   selector     CSS selector of the stage element, or "largest-canvas"
//   seekExpr     pins the stage to time t (must be pure in t: no wall clock)
//   settleMs     wait after each seek before the screenshot (default 120)
//   timelineExpr returns { total, beats: [{ t0, t1, payoff }] } — used by --times auto when no --beats file is given
//   times        default times (array) or "auto"
// Times "auto" = hook at 1.0 s + every payoff mark (beat end − 0.05 s) + the landing (middle of the last beat).
// Output: <out>/<t>s.png per time, <out>/stills.json manifest. Exit 1 on capture failure, a blank still, a page
// error, or a failed determinism check (same t captured twice with a different seek in between → bytes or pixels equal).
// Env: PW_MODULE (playwright/index.js), CHROME_PATH (chromium binary), PLAYWRIGHT_BROWSERS_PATH.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const argv = process.argv.slice(2), flags = {}, params = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]; if (!a.startsWith('--')) continue;
  const k = a.slice(2), v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  if (k === 'param') { const [pk, ...pv] = String(v).split('='); params[pk] = pv.join('='); } else flags[k] = v;
}
const die = (m) => { console.error('stills: ' + m); process.exit(1); };
if (!flags.config || !flags.out) die('usage: --config <file> --out <dir> [--times auto|a,b,c] [--beats file] [--param k=v]');
const cfg = JSON.parse(fs.readFileSync(flags.config, 'utf8'));
const root = path.resolve(flags.root || process.cwd());
const out = path.resolve(flags.out); fs.mkdirSync(out, { recursive: true });
const url = /^[a-z]+:/i.test(cfg.url) ? cfg.url : pathToFileURL(path.resolve(root, cfg.url)).href;
const body = (e) => Array.isArray(e) ? e.join('\n') : `return (${e});`;
const FFMPEG = process.env.FFMPEG || '/usr/bin/ffmpeg';

const { chromium } = await import(process.env.PW_MODULE ? pathToFileURL(process.env.PW_MODULE).href : 'playwright').then((m) => m.default || m);
const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const page = await browser.newPage({ viewport: cfg.viewport || { width: 1600, height: 1000 }, deviceScaleFactor: cfg.deviceScaleFactor || 1 });
const pageErrors = []; page.on('pageerror', (e) => pageErrors.push(String(e.message || e).slice(0, 200)));
const run = (expr, extra = {}) => page.evaluate(({ src, params, extra }) => {
  const el = extra.useEl ? (window.__stillsEl || null) : null;
  return new Function('params', 't', 'el', src)(params, extra.t, el);
}, { src: body(expr), params, extra });

await page.goto(url, { waitUntil: 'load' });
if (cfg.readyExpr) await page.waitForFunction(({ src, params }) => new Function('params', src)(params), { src: body(cfg.readyExpr), params }, { timeout: 20000 });
if (cfg.setupExpr) await run(cfg.setupExpr);
await page.waitForTimeout(cfg.setupWaitMs ?? 500);

// ---- times ----
function beatsFrom(file) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8')), arr = Array.isArray(j) ? j : j.beats || [];
  const beats = arr.map((b) => ({ t0: b.t0 ?? b.tStartSec ?? b.start, t1: b.t1 ?? b.tEndSec ?? b.end, payoff: b.payoff === true || b.payoffAt != null, payoffAt: b.payoffAt }));
  return { total: j.total ?? j.totalDurationSec ?? (beats.length ? beats[beats.length - 1].t1 : 0), beats };
}
let times = flags.times && flags.times !== 'auto' ? String(flags.times).split(',').map(Number) : (flags.times === 'auto' ? 'auto' : cfg.times || 'auto');
let timeline = null;
if (times === 'auto') {
  timeline = flags.beats ? beatsFrom(flags.beats) : cfg.timelineExpr ? await run(cfg.timelineExpr) : null;
  if (!timeline || !timeline.beats || !timeline.beats.length) die('times auto needs --beats <file> or a config timelineExpr that returns beats');
  const last = timeline.beats[timeline.beats.length - 1];
  times = [1.0, ...timeline.beats.filter((b) => b.payoff).map((b) => b.payoffAt ?? b.t1 - 0.05), (last.t0 + last.t1) / 2];
}
times = [...new Set(times.filter((t) => Number.isFinite(t) && t >= 0).map((t) => +t.toFixed(2)))].sort((a, b) => a - b);
if (!times.length) die('no valid times');

// ---- capture ----
async function capture(t) {
  const clip = await page.evaluate(({ sel }) => {
    const el = sel === 'largest-canvas'
      ? [...document.querySelectorAll('canvas')].sort((x, y) => y.clientWidth * y.clientHeight - x.clientWidth * x.clientHeight)[0]
      : document.querySelector(sel);
    window.__stillsEl = el || null; if (!el) return null;
    const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height };
  }, { sel: cfg.selector || 'largest-canvas' });
  if (!clip || clip.width < 2 || clip.height < 2) throw new Error(`stage element "${cfg.selector || 'largest-canvas'}" not found or empty`);
  await run(cfg.seekExpr, { t, useEl: true });
  await page.waitForTimeout(cfg.settleMs ?? 120);
  return page.screenshot({ clip });
}
function raw(buf) {   // decode PNG → RGBA bytes via ffmpeg (no pngjs needed)
  return execFileSync(FFMPEG, ['-v', 'error', '-i', 'pipe:0', '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1'], { input: buf, maxBuffer: 1 << 28 });
}
function pixelDiff(a, b) {
  const A = raw(a), B = raw(b); if (A.length !== B.length) return { diffPixels: -1, note: 'size differs' };
  let d = 0; for (let i = 0; i < A.length; i += 4) if (A[i] !== B[i] || A[i + 1] !== B[i + 1] || A[i + 2] !== B[i + 2] || A[i + 3] !== B[i + 3]) d++;
  return { diffPixels: d };
}
function distinctColours(buf) {   // blank guard: a real frame has many colours
  const A = raw(buf), seen = new Set(); const step = Math.max(4, Math.floor(A.length / 4 / 20000) * 4);
  for (let i = 0; i < A.length && seen.size < 64; i += step) seen.add((A[i] << 16) | (A[i + 1] << 8) | A[i + 2]);
  return seen.size;
}
const name = (t) => `${t.toFixed(2)}s.png`;
const shots = [], problems = [];
for (const t of times) {
  try {
    const buf = await capture(t), file = path.join(out, name(t)); fs.writeFileSync(file, buf);
    const colours = distinctColours(buf); if (colours < 4) problems.push(`${name(t)} looks blank (${colours} colours)`);
    shots.push({ t, file: path.relative(root, file), bytes: buf.length, sha1: createHash('sha1').update(buf).digest('hex'), colours, buf });
  } catch (e) { problems.push(`t=${t}: ${e.message}`); }
}
let determinism = { skipped: true };
if (!flags['no-determinism'] && shots.length) {
  const probe = shots[Math.floor(shots.length / 2)], other = shots.find((s) => s !== probe) || { t: probe.t + 0.5 };
  await capture(other.t);                     // seek elsewhere first
  const again = await capture(probe.t);
  const bytesEqual = Buffer.compare(again, probe.buf) === 0;
  const px = bytesEqual ? { diffPixels: 0 } : pixelDiff(again, probe.buf);
  determinism = { t: probe.t, seekedVia: other.t, bytesEqual, ...px, pass: px.diffPixels === 0 };
  if (!determinism.pass) problems.push(`determinism: t=${probe.t} differs by ${px.diffPixels} px after seeking to ${other.t}`);
}
if (pageErrors.length) problems.push(`page errors: ${pageErrors.slice(0, 3).join(' | ')}`);
const manifest = { url: cfg.url, params, times, stills: shots.map(({ buf, ...s }) => s), determinism, pageErrors, problems, pass: !problems.length };
fs.writeFileSync(path.join(out, 'stills.json'), JSON.stringify(manifest, null, 2) + '\n');
await browser.close();
console.log(JSON.stringify({ out: path.relative(root, out), times, determinism, problems, pass: manifest.pass }));
process.exit(manifest.pass ? 0 : 1);
