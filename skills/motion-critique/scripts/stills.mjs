#!/usr/bin/env node
// stills.mjs — capture deterministic stills from any host page that exposes a seekable clock (frame = f(t)).
//
//   node skills/motion-critique/scripts/stills.mjs --config <config.json> --out <dir>
//        [--times auto | 1,4.2,9] [--beats work/beats.json] [--param key=value]... [--no-determinism]
//   node skills/motion-critique/scripts/stills.mjs --selftest      unit-tests beatsFrom/autoTimes (no browser)
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
// Beats without start times (motion-brief's dur-only beats.json) accumulate t0/t1 from `dur`. Exit 1 if auto resolves
// a NaN or fewer than 3 times.
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

// ---- beats → times (pure; unit-tested by --selftest) ----
// A beat's start/end come from t0/t1, tStartSec/tEndSec or start/end; when absent they accumulate from `dur`
// (the motion-brief beats.json shape). A payoff beat's mark is its payoffAt (relative to the beat when the
// board is dur-only, as brief-check reads it) or its end − 0.05 s.
export function beatsFrom(j) {
  const arr = Array.isArray(j) ? j : (j && j.beats) || [];
  let acc = 0;
  const beats = arr.map((b) => {
    const num = (...v) => v.find((x) => typeof x === 'number' && Number.isFinite(x));
    const dur = num(b.dur, b.durationSec);
    let t0 = num(b.t0, b.tStartSec, b.start), t1 = num(b.t1, b.tEndSec, b.end);
    const derived = t0 === undefined;
    if (derived) t0 = acc;
    if (t1 === undefined) t1 = dur !== undefined ? t0 + dur : NaN;
    acc = t1;
    let payoffAt = num(b.payoffAt);
    if (payoffAt !== undefined && derived) payoffAt = t0 + payoffAt;
    return { t0, t1, payoff: b.payoff === true || payoffAt !== undefined, ...(payoffAt !== undefined ? { payoffAt } : {}) };
  });
  const total = num0(j && (j.total ?? j.totalDurationSec)) ?? (beats.length ? beats[beats.length - 1].t1 : 0);
  return { total, beats };
}
const num0 = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : undefined);
// hook 1.0 s + every payoff mark + the landing (middle of the last beat); refuses NaN and < 3 times.
export function autoTimes(timeline) {
  const beats = (timeline && timeline.beats) || [];
  if (!beats.length) return { error: 'no beats' };
  const last = beats[beats.length - 1];
  const raw = [1.0, ...beats.filter((b) => b.payoff).map((b) => b.payoffAt ?? b.t1 - 0.05), (last.t0 + last.t1) / 2];
  const bad = raw.filter((t) => !Number.isFinite(t));
  if (bad.length) return { error: `${bad.length} time(s) resolved to NaN` };
  const times = [...new Set(raw.filter((t) => t >= 0).map((t) => +t.toFixed(2)))].sort((a, b) => a - b);
  if (times.length < 3) return { error: `resolved only ${times.length} time(s) (${times.join(', ')}); need ≥ 3 (hook, a payoff, landing)` };
  return { times };
}
function selftest() {
  const out = []; let good = true; const ok = (l, c) => { out.push(`${c ? 'ok  ' : 'FAIL'} ${l}`); good &&= !!c; };
  const durOnly = { totalDurationSec: 14, beats: [{ dur: 2, payoff: true }, { dur: 1.5, payoff: false }, { dur: 2, payoff: true }, { dur: 3, payoff: true }, { dur: 2, payoff: false }, { dur: 3.5, payoff: true }] };
  const a = beatsFrom(durOnly), at = autoTimes(a);
  ok('dur-only board → cumulative t0/t1 (last beat 10.5–14)', a.beats[5].t0 === 10.5 && a.beats[5].t1 === 14 && a.total === 14);
  ok(`dur-only board → ${at.times ? at.times.join('/') : at.error} (≥ 5 times)`, at.times && at.times.length >= 5 && at.times.join() === '1,1.95,5.45,8.45,12.25,13.95');
  const starts = { total: 6, beats: [{ t0: 0, t1: 2, payoff: true }, { tStartSec: 2, tEndSec: 4, payoff: true }, { start: 4, end: 6, dur: 99, payoff: false }] };
  const b = beatsFrom(starts), bt = autoTimes(b);
  ok('start-time board keeps its fields (dur ignored when start/end exist)', b.beats[1].t0 === 2 && b.beats[2].t1 === 6);
  ok(`start-time board → ${bt.times ? bt.times.join('/') : bt.error}`, bt.times && bt.times.join() === '1,1.95,3.95,5');
  const mut = [
    ['MUT-nan: beat with no dur and no start/end', { beats: [{ payoff: true }, { dur: 2, payoff: true }] }],
    ['MUT-fewer-than-3: single beat, no payoff', { beats: [{ t0: 0, t1: 1, payoff: false }] }],
  ];
  for (const [l, board] of mut) { const r = autoTimes(beatsFrom(board)); ok(`${l} → ${r.error || 'NOT CAUGHT'}`, !!r.error); }
  console.log(out.join('\n')); console.log(good ? `PASS selftest (${mut.length} mutations caught)` : 'FAIL selftest');
  process.exit(good ? 0 : 1);
}
if (flags.selftest) selftest();
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
let times = flags.times && flags.times !== 'auto' ? String(flags.times).split(',').map(Number) : (flags.times === 'auto' ? 'auto' : cfg.times || 'auto');
let timeline = null;
if (times === 'auto') {
  timeline = flags.beats ? beatsFrom(JSON.parse(fs.readFileSync(flags.beats, 'utf8'))) : cfg.timelineExpr ? await run(cfg.timelineExpr) : null;
  if (!timeline || !timeline.beats || !timeline.beats.length) die('times auto needs --beats <file> or a config timelineExpr that returns beats');
  const auto = autoTimes(timeline);
  if (auto.error) die(`times auto: ${auto.error} (beats need t0/t1, tStartSec/tEndSec, start/end, or dur)`);
  times = auto.times;
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
