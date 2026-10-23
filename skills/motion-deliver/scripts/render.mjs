#!/usr/bin/env node
// render.mjs — deterministic MP4 from any host page with a seekable clock (frame n = f(n / fps), never real-time playback).
//
//   node skills/motion-deliver/scripts/render.mjs --config <config.json> [--param key=value]... [--out <dir>]
//        [--fps 30] [--duration <sec>|from-beats] [--allow-preview] [--ledger work/soup-ledger.jsonl] [--round N]
//
// Config = the motion-critique stills config (url, viewport, deviceScaleFactor, readyExpr, setupExpr, selector, seekExpr,
// timelineExpr) — directly or via "extends": "<path relative to this config>" — plus:
//   fps (default 30) · duration: number | "from-beats" (timelineExpr total) · frameSettleMs (default 0)
//   audio: { sampleRate, channels, expr }  expr = async function body run in a fresh load of the page, params.{sr,dur,channels}
//          in scope, returning { b64 (Float32 PCM, base64), sr, channels, meta } — the host's own engine, offline
//   audio: { cmd: "<shell command>" } instead: run with DUR/SR/OUT_WAV in env; it must write OUT_WAV
//   compareTimes: "auto" | [t...] · compareLimit (mean abs RGB diff, fraction of full scale) · loop: { seamLimit,
//   lastVsFirstLimit, audioJumpMax, audioStepDbMax } · encode: { crf, preset, audioBitrate } · launchArgs []
// Gate first: final.mp4 only when the latest critique row of the round has every score >= 8 (FS-critique, shared with
// deliverables-check.mjs). Otherwise refuses (exit 1) — or, with --allow-preview, writes final-preview.mp4 and labels it.
// Output (<out> default work/deliver/<params.board>): final(.|-preview.)mp4, loop-check.json (merged), README.md section,
// render-check/{render.json, mp4-<t>s.png, still-<t>s.png}. Exit 1 if any verification fails.
// Env: PW_MODULE, CHROME_PATH, PLAYWRIGHT_BROWSERS_PATH, FFMPEG (default /usr/bin/ffmpeg), FFPROBE (default /usr/bin/ffprobe).
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync, execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { critiqueGate, readLedger, PREVIEW_LABEL } from './deliverables-check.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STILLS = path.resolve(HERE, '../../motion-critique/scripts/stills.mjs');
const FFMPEG = process.env.FFMPEG || '/usr/bin/ffmpeg', FFPROBE = process.env.FFPROBE || '/usr/bin/ffprobe';
const argv = process.argv.slice(2), flags = {}, params = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]; if (!a.startsWith('--')) continue;
  const k = a.slice(2), v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  if (k === 'param') { const [pk, ...pv] = String(v).split('='); params[pk] = pv.join('='); } else flags[k] = v;
}
const die = (m) => { console.error('render: ' + m); process.exit(1); };
if (!flags.config) die('usage: --config <file> [--param board=<id>] [--allow-preview]');
function loadConfig(file) {   // "extends" chain, shallow merge, child wins
  const c = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!c.extends) return c;
  const { extends: base, ...rest } = c; return { ...loadConfig(path.resolve(path.dirname(file), base)), ...rest };
}
const cfg = loadConfig(path.resolve(flags.config));
const root = path.resolve(flags.root || process.cwd());
const fps = Number(flags.fps || cfg.fps || 30);
const out = path.resolve(flags.out || path.join('work', 'deliver', params.board || 'default'));
const chk = path.join(out, 'render-check');
const t0 = Date.now(), log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

// ---- FS-critique gate before any pixel is captured ----
const ledgerPath = flags.ledger || 'work/soup-ledger.jsonl';
const gate = critiqueGate(readLedger(ledgerPath), flags.round != null ? Number(flags.round) : undefined);
const preview = !!flags['allow-preview'];
if (!gate.open && !preview) die(`refused (FS-critique): ${gate.why}. Re-run motion-critique to 8+, or pass --allow-preview for final-preview.mp4.`);
fs.mkdirSync(chk, { recursive: true });
const videoName = preview ? 'final-preview.mp4' : 'final.mp4', videoPath = path.join(out, videoName);
log(`gate round ${gate.round}: ${gate.why} → ${videoName}`);

// ---- page plumbing (same contract as stills.mjs) ----
const url = /^[a-z]+:/i.test(cfg.url) ? cfg.url : pathToFileURL(path.resolve(root, cfg.url)).href;
const body = (e) => Array.isArray(e) ? e.join('\n') : `return (${e});`;
const { chromium } = await import(process.env.PW_MODULE ? pathToFileURL(process.env.PW_MODULE).href : 'playwright').then((m) => m.default || m);
const browser = await chromium.launch({ args: cfg.launchArgs || [], ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
async function openPage() {
  const page = await browser.newPage({ viewport: cfg.viewport || { width: 1600, height: 1000 }, deviceScaleFactor: cfg.deviceScaleFactor || 1 });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e.message || e).slice(0, 200)));
  const run = (expr, extra = {}) => page.evaluate(async ({ src, params, extra }) => {
    const AF = Object.getPrototypeOf(async function () {}).constructor;
    return new AF('params', 't', 'el', src)(Object.assign({}, params, extra.p || {}), extra.t, extra.useEl ? window.__renderEl || null : null);
  }, { src: body(expr), params, extra });
  await page.goto(url, { waitUntil: 'load' });
  if (cfg.readyExpr) await page.waitForFunction(({ src, params }) => new Function('params', src)(params), { src: body(cfg.readyExpr), params }, { timeout: 20000 });
  if (cfg.setupExpr) await run(cfg.setupExpr);
  await page.waitForTimeout(cfg.setupWaitMs ?? 500);
  return { page, run, errs };
}
const raw = (input, extra = []) => execFileSync(FFMPEG, ['-v', 'error', ...(Buffer.isBuffer(input) ? ['-i', 'pipe:0'] : ['-i', input]), ...extra, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { input: Buffer.isBuffer(input) ? input : undefined, maxBuffer: 1 << 29 });
function meanAbs(A, B) { if (A.length !== B.length) return NaN; let s = 0; for (let i = 0; i < A.length; i++) s += Math.abs(A[i] - B[i]); return s / (A.length * 255); }
const mp4Frame = (n, w, h, png) => { if (png) execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', videoPath, '-vf', `select=eq(n\\,${n})`, '-vframes', '1', png]); return raw(videoPath, ['-vf', `select=eq(n\\,${n}),scale=${w}:${h}`, '-vframes', '1']); };

// ---- timeline ----
const main = await openPage();
const timeline = cfg.timelineExpr ? await main.run(cfg.timelineExpr) : null;
const durFlag = flags.duration || cfg.duration || 'from-beats';
const duration = durFlag === 'from-beats' ? Number(timeline && timeline.total) : Number(durFlag);
if (!(duration > 0)) die('no duration: give --duration <sec> or a timelineExpr that returns { total }');
const N = Math.round(duration * fps);
log(`timeline ${duration}s × ${fps} fps = ${N} frames`);

// ---- audio: the host's own engine, offline, in a fresh load ----
const A = cfg.audio || {}, sr = A.sampleRate || 44100, wav = path.join(chk, 'audio.wav');
let audioMeta = null, pcm = null;
if (A.cmd) execSync(A.cmd, { stdio: 'inherit', env: { ...process.env, DUR: String(duration), SR: String(sr), OUT_WAV: wav } });
else if (A.expr) {
  const ap = await openPage();
  const r = await ap.run(A.expr, { p: { dur: duration, sr, channels: A.channels || 1 } });
  await ap.page.close();
  pcm = new Float32Array(Buffer.from(r.b64, 'base64').buffer.slice(0)); audioMeta = { ...r.meta, sr: r.sr, samples: pcm.length };
  const f32 = path.join(chk, 'audio.f32'); fs.writeFileSync(f32, Buffer.from(pcm.buffer));
  execFileSync(FFMPEG, ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(r.sr), '-ac', String(r.channels || 1), '-i', f32, '-c:a', 'pcm_s16le', wav]);
  fs.rmSync(f32);
} else die('config has no audio (audio.expr or audio.cmd): a deliverable MP4 carries the score');
if (!pcm) pcm = new Float32Array(Buffer.from(execFileSync(FFMPEG, ['-v', 'error', '-i', wav, '-f', 'f32le', '-ac', '1', 'pipe:1'], { maxBuffer: 1 << 29 })).buffer.slice(0));
log(`audio ${(pcm.length / sr).toFixed(3)}s rendered offline${audioMeta ? ` (bpm ${audioMeta.bpm}, ${audioMeta.events} events)` : ''}`);

// ---- frames → ffmpeg ----
const enc = { crf: 16, preset: 'medium', audioBitrate: '192k', ...(cfg.encode || {}) };
const ff = spawn(FFMPEG, ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', 'pipe:0', '-i', wav,
  '-map', '0:v', '-map', '1:a', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2:out_color_matrix=bt709:out_range=tv,format=yuv420p',
  '-c:v', 'libx264', '-preset', enc.preset, '-crf', String(enc.crf), '-pix_fmt', 'yuv420p', '-r', String(fps),
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
  '-c:a', 'aac', '-b:a', enc.audioBitrate, '-t', String(N / fps), '-movflags', '+faststart', videoPath], { stdio: ['pipe', 'inherit', 'inherit'] });
const ffDone = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));
const clip = await main.page.evaluate(({ sel }) => {
  const el = sel === 'largest-canvas' ? [...document.querySelectorAll('canvas')].sort((x, y) => y.clientWidth * y.clientHeight - x.clientWidth * x.clientHeight)[0] : document.querySelector(sel);
  window.__renderEl = el || null; if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height };
}, { sel: cfg.selector || 'largest-canvas' });
if (!clip) die('stage element not found');
async function frameAt(t) { await main.run(cfg.seekExpr, { t, useEl: true }); if (cfg.frameSettleMs) await main.page.waitForTimeout(cfg.frameSettleMs); return main.page.screenshot({ clip }); }
const c0 = Date.now(); let first = null;
for (let n = 0; n < N; n++) {
  const png = await frameAt(n / fps); if (n === 0) first = png;
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
  if (n % (fps * 2) === 0) log(`frame ${n}/${N}`);
}
const captureSec = (Date.now() - c0) / 1000, speed = +(N / captureSec).toFixed(2);
ff.stdin.end(); await ffDone;
const wrap = await frameAt(duration);   // seek(total): the studio clock wraps onto the loop (deliver.mjs's seamDelta)
log(`captured ${N} frames in ${captureSec.toFixed(1)}s = ${speed} frames/s; encoded ${videoName}`);
const pageErrors = main.errs.slice(); await browser.close();

// ---- verify with ffprobe ----
const probe = JSON.parse(execFileSync(FFPROBE, ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', videoPath]).toString());
const vs = probe.streams.find((s) => s.codec_type === 'video'), as = probe.streams.find((s) => s.codec_type === 'audio');
const P = { format: probe.format.format_name, duration: +probe.format.duration, size: +probe.format.size, video: vs && { codec: vs.codec_name, pix_fmt: vs.pix_fmt, width: vs.width, height: vs.height, fps: vs.r_frame_rate, frames: +vs.nb_read_frames, duration: +vs.duration }, audio: as && { codec: as.codec_name, sr: +as.sample_rate, channels: as.channels, duration: +as.duration } };
const fails = [], tol = 1 / fps;
if (!P.video || P.video.codec !== 'h264' || P.video.pix_fmt !== 'yuv420p' || P.video.width % 2 || P.video.height % 2) fails.push('video is not H.264 yuv420p with even dimensions');
if (P.video && Math.abs(P.video.duration - duration) > tol) fails.push(`video duration ${P.video.duration} not within 1 frame of ${duration}`);
if (P.video && P.video.frames !== N) fails.push(`frame count ${P.video.frames} != ${fps} × ${duration} = ${N}`);
if (!P.audio) fails.push('no audio stream'); else if (Math.abs(P.audio.duration - duration) > tol) fails.push(`audio duration ${P.audio.duration} not within 1 frame of ${duration}`);
if (Math.abs(P.duration - duration) > tol) fails.push(`container duration ${P.duration} not within 1 frame of ${duration}`);
{ // +faststart: the top-level moov box must come before mdat
  const buf = fs.readFileSync(videoPath), boxes = []; for (let o = 0; o + 8 <= buf.length && boxes.length < 16;) { let sz = buf.readUInt32BE(o); const ty = buf.toString('latin1', o + 4, o + 8); if (sz === 1) sz = Number(buf.readBigUInt64BE(o + 8)); boxes.push(ty); if (sz < 8) break; o += sz; }
  P.boxes = boxes; if (!(boxes.indexOf('moov') >= 0 && boxes.indexOf('moov') < boxes.indexOf('mdat'))) fails.push('moov box is not before mdat (+faststart)');
}

// ---- 3 MP4 frames vs stills.mjs at the same t ----
const snap = (t) => { for (let d = 0; d < fps * 2; d++) for (const n of [Math.round(t * fps) + d, Math.round(t * fps) - d]) { const x = n / fps; if (n >= 0 && n < N && Math.abs(x - +x.toFixed(2)) < 1e-9) return +x.toFixed(2); } return +(Math.round(t * fps) / fps).toFixed(2); };
let cmpT = cfg.compareTimes && cfg.compareTimes !== 'auto' ? cfg.compareTimes : null;
if (!cmpT) { const bs = (timeline && timeline.beats) || [], last = bs[bs.length - 1]; cmpT = [1.0, duration / 2, last ? (last.t0 + last.t1) / 2 : duration * 0.9]; }
cmpT = [...new Set(cmpT.map(snap))];
const resolved = path.join(chk, 'config.resolved.json'); fs.writeFileSync(resolved, JSON.stringify(cfg, null, 2) + '\n');
execFileSync(process.execPath, [STILLS, '--config', resolved, '--out', path.join(chk, 'stills'), '--root', root, '--times', cmpT.join(','), ...Object.entries(params).flatMap(([k, v]) => ['--param', `${k}=${v}`])], { stdio: ['ignore', 'pipe', 'inherit'] });
const limit = cfg.compareLimit ?? 0.02, compare = [];
const stillRaw = cmpT.map((t) => raw(path.join(chk, 'stills', `${t.toFixed(2)}s.png`)));
const W = P.video.width, H = P.video.height;
const stillWH = execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path.join(chk, 'stills', `${cmpT[0].toFixed(2)}s.png`)]).toString().trim().split(',').map(Number);
cmpT.forEach((t, k) => {
  const n = Math.round(t * fps), png = path.join(chk, `mp4-${t.toFixed(2)}s.png`);
  const m = mp4Frame(n, stillWH[0], stillWH[1], png);
  fs.copyFileSync(path.join(chk, 'stills', `${t.toFixed(2)}s.png`), path.join(chk, `still-${t.toFixed(2)}s.png`));
  const same = meanAbs(m, stillRaw[k]), other = meanAbs(m, stillRaw[(k + 1) % cmpT.length]);
  compare.push({ t, frame: n, meanAbsDiff: +same.toFixed(5), vsOtherStill: +other.toFixed(5), pass: same <= limit && same < other });
  if (!(same <= limit)) fails.push(`MP4 frame ${n} (t=${t}) differs from the still by ${same.toFixed(4)} > ${limit}`);
});
fs.rmSync(path.join(chk, 'stills'), { recursive: true, force: true });

// ---- loop check: last vs first frame, seek wrap, audio seam ----
const L = { seamLimit: 0.01, lastVsFirstLimit: 0.02, audioJumpMax: 0.1, audioStepDbMax: 12, audioHeadGapMaxMs: 1000 / fps, ...(cfg.loop || {}) };
const f0 = mp4Frame(0, W, H), fN = mp4Frame(N - 1, W, H);
const seamDelta = +meanAbs(raw(first), raw(wrap)).toFixed(4), lastVsFirst = +meanAbs(fN, f0).toFixed(4);
const win = Math.round(sr * (L.audioWindowSec || 0.4)), win20 = Math.round(sr * 0.02),   // 400 ms = EBU R128 momentary-loudness window
      rms = (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length), db = (x) => 20 * Math.log10(Math.max(x, 1e-9));
let onset = 0; while (onset < pcm.length && Math.abs(pcm[onset]) < 1e-3) onset++;   // first sample above -60 dBFS
const head = pcm.subarray(onset, onset + win), tail = pcm.subarray(pcm.length - win);
const audioSeam = { sampleJump: +Math.abs(pcm[pcm.length - 1] - pcm[0]).toFixed(4), headGapMs: +(onset * 1000 / sr).toFixed(1), windowSec: win / sr, headRmsDb: +db(rms(head)).toFixed(1), tailRmsDb: +db(rms(tail)).toFixed(1), attack20msDb: +db(rms(pcm.subarray(onset, onset + win20))).toFixed(1), tail20msDb: +db(rms(pcm.subarray(pcm.length - win20))).toFixed(1) };
audioSeam.levelStepDb = +Math.abs(audioSeam.headRmsDb - audioSeam.tailRmsDb).toFixed(1);
audioSeam.pass = audioSeam.sampleJump <= L.audioJumpMax && audioSeam.levelStepDb <= L.audioStepDbMax && audioSeam.headGapMs <= L.audioHeadGapMaxMs;
const lcPath = path.join(out, 'loop-check.json'), prev = fs.existsSync(lcPath) ? JSON.parse(fs.readFileSync(lcPath, 'utf8')) : {};
const loop = { ...prev, totalSec: duration, seamDelta, seamLimit: L.seamLimit, mp4LastVsFirst: lastVsFirst, lastVsFirstLimit: L.lastVsFirstLimit, audioSeam, audioLimits: { sampleJump: L.audioJumpMax, levelStepDb: L.audioStepDbMax, headGapMs: L.audioHeadGapMaxMs }, video: videoName };
loop.pass = seamDelta <= L.seamLimit && lastVsFirst <= L.lastVsFirstLimit && audioSeam.pass && !(prev.seek0_vs_seekWrap > (prev.limit ?? L.seamLimit));   // deliver.mjs's own wrap measure, if present
loop.seamNote = 'seamDelta = mean abs RGB diff (fraction of full scale) of seek(0) vs seek(totalSec), the deliver.mjs wrap measure; mp4LastVsFirst = decoded MP4 frame N-1 vs frame 0; audioSeam = last-vs-first sample jump (click), silence before the first onset (a gap at the loop point) and tail-vs-head RMS step over the EBU R128 momentary window (400 ms) of the offline score; the 20 ms values are reported, not gated (they measure the hook attack, not a level).';
fs.writeFileSync(lcPath, JSON.stringify(loop, null, 2) + '\n');
if (!loop.pass) fails.push('loop check failed: ' + JSON.stringify({ seamDelta, lastVsFirst, audioSeam }));
if (pageErrors.length) fails.push('page errors: ' + pageErrors.slice(0, 3).join(' | '));

// ---- README section ----
const rdPath = path.join(out, 'README.md'); let rd = fs.existsSync(rdPath) ? fs.readFileSync(rdPath, 'utf8') : `# ${params.board || 'board'} — deliverables\n`;
rd = rd.replace(/\n?<!-- motion-deliver:start -->[\s\S]*<!-- motion-deliver:end -->\n?/, '\n');
const mb = (P.size / 1048576).toFixed(2);
rd = rd.trimEnd() + `\n\n<!-- motion-deliver:start -->\n## ${videoName}${preview ? ` — ${PREVIEW_LABEL}` : ''}\n\n` +
  (preview ? `- **${PREVIEW_LABEL}.** FS-critique for round ${gate.round}: ${gate.why}. This file is a preview, not the film-spec §9 final MP4; no \`render\` stage row was written. Re-run motion-critique until every score is 8+, then re-render without \`--allow-preview\`.\n` : `- FS-critique round ${gate.round}: ${gate.why}.\n`) +
  `- ${P.video.width}×${P.video.height} H.264 ${P.video.pix_fmt} + ${P.audio ? P.audio.codec.toUpperCase() : 'no'} audio, ${fps} fps, ${P.video.frames} frames, ${P.duration.toFixed(3)} s, ${mb} MB, +faststart.\n` +
  `- Every frame seeked (frame n = f(n/${fps})), never played in real time; audio is the host's own score + SFX rendered offline.\n` +
  `- Frame check vs stills.mjs: ${compare.map((c) => `t=${c.t} s ${c.meanAbsDiff}`).join(', ')} (limit ${limit}); see \`render-check/\`.\n` +
  `- Loop: seamDelta ${seamDelta}, MP4 last-vs-first ${lastVsFirst}, audio jump ${audioSeam.sampleJump} / head gap ${audioSeam.headGapMs} ms / step ${audioSeam.levelStepDb} dB → ${loop.pass ? 'pass' : 'FAIL'}.\n\n` +
  `Regenerate: \`node skills/motion-deliver/scripts/render.mjs --config skills/motion-deliver/configs/motion-atlas.json --param board=${params.board || ''}${preview ? ' --allow-preview' : ''}\`\n<!-- motion-deliver:end -->\n`;
fs.writeFileSync(rdPath, rd);

const report = { video: path.relative(root, videoPath), preview, gate, fps, duration, frames: N, captureSec: +captureSec.toFixed(1), framesPerSec: speed, totalSec: +((Date.now() - t0) / 1000).toFixed(1), probe: P, compare, compareLimit: limit, loop: { seamDelta, lastVsFirst, audioSeam, pass: loop.pass }, audio: audioMeta, fails, pass: !fails.length };
fs.writeFileSync(path.join(chk, 'render.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, probe: P }, null, 1));
process.exit(fails.length ? 1 : 0);
