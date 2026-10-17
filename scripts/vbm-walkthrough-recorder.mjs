#!/usr/bin/env node
/**
 * CETI MOTION ATLAS STUDIO PRO — VBM (Visual Browser Monitor) & INTERACTIVE WALKTHROUGH RECORDER
 *
 * Drives a dedicated headless Google Chrome instance via native Chrome DevTools Protocol (CDP)
 * over Node 22 built-in WebSocket at @2x Retina resolution (1680x1040), steps through all
 * 7 Studio Surfaces, modals, zoom levels, and character rigs, captures @2x PNG screenshots,
 * collects DOM/BBox/Overlap/Contrast UX telemetry, and compiles an MP4 + GIF video walkthrough
 * via `/opt/homebrew/bin/ffmpeg`.
 *
 * Usage:
 *   node scripts/vbm-walkthrough-recorder.mjs [tag] [url]
 */

import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG = '/opt/homebrew/bin/ffmpeg';

const tag = process.argv[2] || 'v4-baseline';
const targetUrl = process.argv[3] || pathToFileURL(path.join(ROOT, 'Motion Atlas Studio Pro.dc.html')).href;
const outDir = path.join(ROOT, 'recordings', 'screenshots', tag);
const recDir = path.join(ROOT, 'recordings');

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(recDir, { recursive: true });

async function launchChromeWithCDP(width = 1680, height = 1040) {
  const userDataDir = fs.mkdtempSync('/tmp/vbm-motion-atlas-');
  const proc = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    `--window-size=${width},${height}`,
    '--force-device-scale-factor=2',
    '--remote-debugging-port=0',
    'about:blank'
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  const wsUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for Chrome DevTools WS URL')), 10000);
    let stderrBuf = '';
    proc.stderr.on('data', chunk => {
      stderrBuf += chunk.toString();
      const m = stderrBuf.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (m) {
        clearTimeout(timer);
        resolve(m[1]);
      }
    });
    proc.on('exit', code => {
      clearTimeout(timer);
      reject(new Error(`Chrome exited early with code ${code}`));
    });
  });

  const portMatch = wsUrl.match(/:(\d+)\//);
  const port = portMatch[1];
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });

  let msgId = 0;
  const pending = new Map();
  ws.addEventListener('message', ev => {
    const data = JSON.parse(ev.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(new Error(data.error.message));
      else resolve(data.result);
    }
  });

  function send(method, params = {}) {
    const id = ++msgId;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: false
  });

  async function evaluate(expr) {
    const trimmed = expr.trim();
    const wrapped = trimmed.startsWith('(() =>') ? trimmed : `(() => { ${trimmed} })()`;
    const res = await send('Runtime.evaluate', {
      expression: wrapped,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      const msg = res.exceptionDetails.exception?.description || res.exceptionDetails.text;
      throw new Error(`JS Eval Error: ${msg}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async function screenshot(filePath) {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
  }

  async function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function close() {
    try { ws.close(); } catch {}
    try { proc.kill('SIGKILL'); } catch {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }

  return { send, evaluate, screenshot, wait, close };
}

const UX_PROBE_JS = `(() => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const app = window.__MOTION_ATLAS_STUDIO_INSTANCE;
  const st = app ? app.state : {};
  const header = document.querySelector('.st-header, .studio-topbar');
  const headerRect = header ? header.getBoundingClientRect() : null;
  const mainEl = document.querySelector('.st-main, .studio-main');
  const mainRect = mainEl ? mainEl.getBoundingClientRect() : null;

  // Check DAG nodes & bounding-box overlaps on Surface 1
  const dagNodes = Array.from(document.querySelectorAll('.dag-node')).map(el => {
    const r = el.getBoundingClientRect();
    return {
      id: el.getAttribute('data-dag-node'),
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height)
    };
  });
  const overlappingPairs = [];
  for (let i = 0; i < dagNodes.length; i++) {
    for (let j = i + 1; j < dagNodes.length; j++) {
      const a = dagNodes[i], b = dagNodes[j];
      const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
      const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      if (ox * oy > 100) {
        overlappingPairs.push({ a: a.id, b: b.id, overlapAreaPx: ox * oy });
      }
    }
  }

  // Check if any canvases are blank
  const canvases = Array.from(document.querySelectorAll('canvas'));
  let nonBlankCanvases = 0;
  canvases.forEach(c => {
    try {
      const ctx = c.getContext('2d');
      const data = ctx.getImageData(0, 0, Math.min(80, c.width), Math.min(60, c.height)).data;
      for (let k = 0; k < data.length; k += 16) {
        if (data[k] !== data[0] || data[k+1] !== data[1] || data[k+2] !== data[2]) {
          nonBlankCanvases++;
          break;
        }
      }
    } catch (_e) {}
  });

  // Check control strip & tab bar layout
  const ctrlStrip = document.querySelector('.st-control-strip');
  const ctrlStripDisplay = ctrlStrip ? getComputedStyle(ctrlStrip).display : 'missing';
  const tabBar = document.querySelector('.st-tabs');
  const tabBarDisplay = tabBar ? getComputedStyle(tabBar).display : 'missing';

  return {
    viewport: { vw, vh },
    surface: st.surface || 'unknown',
    charId: st.charId || 'unknown',
    zoom: st.zoom || 1,
    headerHeightPx: headerRect ? Math.round(headerRect.height) : 0,
    headerViewportSharePct: headerRect ? Number(((headerRect.height / vh) * 100).toFixed(1)) : 0,
    mainTopPx: mainRect ? Math.round(mainRect.top) : 0,
    ctrlStripDisplay,
    tabBarDisplay,
    canvasCount: canvases.length,
    nonBlankCanvases,
    dagNodeCount: dagNodes.length,
    dagNodeOverlaps: overlappingPairs.length,
    overlappingPairs,
    dagNodes
  };
})()`;

async function main() {
  console.log(`[VBM] Launching headless Chrome CDP @2x (1680x1040) for tag="${tag}"...`);
  const cdp = await launchChromeWithCDP(1680, 1040);
  const frames = [];

  async function captureStep(file, label, actionJs) {
    if (actionJs) {
      await cdp.evaluate(actionJs);
      await cdp.wait(420);
    }
    const shotPath = path.join(outDir, file);
    await cdp.screenshot(shotPath);
    const metrics = await cdp.evaluate(UX_PROBE_JS);
    frames.push({ file, label, metrics });
    console.log(`[VBM] Captured ${file} — ${label} (header=${metrics.headerHeightPx}px, canvases=${metrics.nonBlankCanvases}/${metrics.canvasCount}, overlaps=${metrics.dagNodeOverlaps})`);
  }

  try {
    await cdp.send('Page.navigate', { url: targetUrl });
    await cdp.wait(800);

    await captureStep(
      '01-surface1-living-canvas-default.png',
      'Surface I · Infinite-Zoom Living Canvas (0.78x Studio LOD · Pelagic Sovereign · Wada No. 343)',
      null
    );

    await captureStep(
      '02-surface1-tri-fork-ab-compare.png',
      'Surface I · 3-Direction Orthogonal Fork (α/β/γ) + Pushout Gluing (A ⊕ B) + Side-by-Side Compare',
      `window.__MOTION_ATLAS_STUDIO_INSTANCE.handleAction('fork-three-directions', { getAttribute: () => 'node-proof-a' }); window.__MOTION_ATLAS_STUDIO_INSTANCE.handleAction('dag-synthesize-ab');`
    );

    await captureStep(
      '03-surface1-micro-lod-rungs.png',
      'Surface I · 1.65x Micro-Inspection LOD + Multi-Frame Onion Skinning (-2Δt / -1Δt / +1Δt)',
      `window.__MOTION_ATLAS_STUDIO_INSTANCE.setState({ showABCompare: false, onionSkin: true }); window.__MOTION_ATLAS_STUDIO_INSTANCE.handleAction('zoom-set', { getAttribute: () => '1.65' });`
    );

    await captureStep(
      '04-surface2-5lens-fork-explorer.png',
      'Surface II · 5-Lens Decision Fork Explorer (Look · Use · Story · Character · Register)',
      `window.__MOTION_ATLAS_STUDIO_INSTANCE.setState({ surface: 'fork-explorer', onionSkin: false, zoom: 0.78, panX: 18, panY: 16 });`
    );

    await captureStep(
      '05-surface3-character-foundry-orpheus.png',
      'Surface III · Character & Emblem Foundry — Orpheum Lyre-Sphere (Mythic D8 Harmonic Mandala)',
      `window.__MOTION_ATLAS_STUDIO_INSTANCE.setState({ surface: 'character-foundry', charId: 'geome-orpheus', palIdx: 7 });`
    );

    await captureStep(
      '06-surface3-character-foundry-falcon.png',
      'Surface III · Character & Emblem Foundry — Peregrine Cut (Saul Bass Avian Raptor · Wada No. 126)',
      `window.__MOTION_ATLAS_STUDIO_INSTANCE.setState({ surface: 'character-foundry', charId: 'saul-falcon', palIdx: 6 });`
    );

    await captureStep(
      '07-surface4-8beat-storyboard.png',
      'Surface IV · 8-Beat Storyboard Sheet & Inline Causal Hinge (BUT/THEREFORE) Editor + Onion Skinning',
      `window.__MOTION_ATLAS_STUDIO_INSTANCE.setState({ surface: 'storyboard-sheet', charId: 'origami-crane', palIdx: 0, onionSkin: true });`
    );

    await captureStep(
      '08-surface5-sanzo-wada-348-hydrography.png',
      'Surface V · Sanzo Wada 348 Dictionary, 4x4 OKLab Chord Matrix, Orpheum 4-Voice Sonification & CIEDE2000',
      `window.__MOTION_ATLAS_STUDIO_INSTANCE.setState({ surface: 'wada-chord-matrix', charId: 'astronav-compass', palIdx: 3, onionSkin: false });`
    );

    await captureStep(
      '09-surface6-15styles-24elements.png',
      'Surface VI · All 15 Motion Styles & 24 Building Blocks Running on One Deterministic Clock',
      `window.__MOTION_ATLAS_STUDIO_INSTANCE.setState({ surface: 'contact-sheet', charId: 'kelp-leviathan', palIdx: 0 });`
    );

    await captureStep(
      '10-surface7-compile-export-room.png',
      'Surface VII · Multi-Target Production Compiler (Brief · HyperFrames · Remotion · Anime.js · SVG · Lottie JSON)',
      `window.__MOTION_ATLAS_STUDIO_INSTANCE.setState({ surface: 'compile-export', compileTarget: 'svg-keyframes' });`
    );

    await captureStep(
      '11-modal-oauth-pkce-rsi-critique.png',
      'Modal · OAuth 2.0 PKCE Live Enhancer & 4-Lens Adversarial RSI Critique Report',
      `window.__MOTION_ATLAS_STUDIO_INSTANCE.setState({ oauthModalOpen: true }); window.__MOTION_ATLAS_STUDIO_INSTANCE.handleAction('run-rsi-critique');`
    );

    await captureStep(
      '12-modal-20gate-tellapart-sheaf.png',
      'Modal · 25-Gate Mechanical Contract Audit (25/25 PASS) + Tell-Apart Kernel + Alexandrov Sheaf Cohomology',
      `window.__MOTION_ATLAS_STUDIO_INSTANCE.setState({ oauthModalOpen: false, gateModalOpen: true });`
    );
  } finally {
    cdp.close();
  }

  const telemetryPath = path.join(recDir, `${tag}-ux-telemetry.json`);
  fs.writeFileSync(telemetryPath, JSON.stringify({ tag, capturedAt: new Date().toISOString(), frames }, null, 2), 'utf8');
  console.log(`[VBM] Wrote UX telemetry -> ${telemetryPath}`);

  if (fs.existsSync(FFMPEG)) {
    const listFile = path.join(outDir, `ffmpeg-frames-${tag}.txt`);
    const lines = [];
    for (const f of frames) {
      lines.push(`file '${path.join(outDir, f.file)}'`);
      lines.push('duration 1.35');
    }
    lines.push(`file '${path.join(outDir, frames[frames.length - 1].file)}'`);
    fs.writeFileSync(listFile, lines.join('\n'), 'utf8');

    const mp4Path = path.join(recDir, `${tag}-walkthrough.mp4`);
    execFileSync(FFMPEG, [
      '-y', '-f', 'concat', '-safe', '0', '-i', listFile,
      '-vf', 'scale=1680:1040:force_original_aspect_ratio=decrease,pad=1680:1040:(ow-iw)/2:(oh-ih)/2,format=yuv420p',
      '-r', '30', '-c:v', 'libx264', '-crf', '20', mp4Path
    ], { stdio: 'ignore' });

    const gifPath = path.join(recDir, `${tag}-walkthrough.gif`);
    execFileSync(FFMPEG, [
      '-y', '-i', mp4Path,
      '-vf', 'fps=8,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer',
      gifPath
    ], { stdio: 'ignore' });

    console.log(`[VBM] Compiled video walkthrough -> ${mp4Path} & ${gifPath}`);
  }
}

main().catch(err => {
  console.error('[VBM Error]', err);
  process.exit(1);
});
