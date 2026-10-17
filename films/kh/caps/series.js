// CETI Capabilities — series layer on top of Kinetic Hydrography 1.0.0.
// Shared by every episode so the series reads as one thing: the chart ground (air mode is never bare),
// the opening card, paper caption chips, and the closing lockup. Episodes own their middle and their ending beat.
(function (root) {
'use strict';
const KH = root.KH, { CETI: C, clamp, lerp, smoothstep, win, EASE, ramp, rng, mix, rgba, text, whaleMark, bearingRing } = KH;
const INK = C.navy, SOFT = C.slate, GRID = mix(C.paper, C.slate, 0.16), GRID2 = mix(C.paper, C.slate, 0.3);

// fixed sounding numbers scattered over the chart (seeded, so every frame and every episode agree)
const SOUND = []; { const R = rng(4041); for (let i = 0; i < 90; i++) SOUND.push({ x: (R() - 0.5) * 4200, y: (R() - 0.5) * 2600, n: String(2 + Math.floor(R() * 48)) }); }

// The chart ground: paper, a lat/long grid, depth contours and sounding numbers, all world-anchored so the
// camera's motion reads as flight over a chart. cam = { x, y, z, ax, ay } (world point x,y shown at screen ax,ay at zoom z).
function ground(c, t, cam, o = {}) {
  const W = 1920, H = 1080, z = cam.z, a = o.a ?? 1, tint = o.tint ? mix(C.paper, o.tint, 0.06) : C.paper;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = tint; c.fillRect(0, 0, W, H);
  const sx = x => (x - cam.x) * z + cam.ax, sy = y => (y - cam.y) * z + cam.ay, step = 240;
  c.globalAlpha = a; c.lineWidth = 1;
  const x0 = Math.floor((cam.x - cam.ax / z) / step) * step, x1 = cam.x + (W - cam.ax) / z, y0 = Math.floor((cam.y - cam.ay / z) / step) * step, y1 = cam.y + (H - cam.ay) / z;
  c.strokeStyle = GRID; c.beginPath();
  for (let x = x0; x <= x1; x += step) { c.moveTo(sx(x), 0); c.lineTo(sx(x), H); }
  for (let y = y0; y <= y1; y += step) { c.moveTo(0, sy(y)); c.lineTo(W, sy(y)); }
  c.stroke();
  // depth contours: three slow sinusoids, dashed like a hydrographic chart
  c.strokeStyle = GRID2; c.setLineDash([2, 7]);
  for (let k = 0; k < 3; k++) { c.beginPath(); for (let X = 0; X <= W; X += 24) { const wx = cam.x + (X - cam.ax) / z, wy = 380 * (k - 1) + 90 * Math.sin(wx / 520 + k * 1.7) + 40 * Math.sin(wx / 210 + k);
      const Y = sy(wy); X ? c.lineTo(X, Y) : c.moveTo(X, Y); } c.stroke(); }
  c.setLineDash([]);
  for (const s of SOUND) { const X = sx(s.x), Y = sy(s.y); if (X < -40 || X > W + 40 || Y < -40 || Y > H + 40) continue;
    text(c, s.n, X, Y, { f: 'mono', size: 10, col: SOFT, a: a * 0.32, align: 'center', track: 0.05 }); }
  // compass rose, screen-fixed, bottom right
  bearingRing(c, W - 120, H - 120, 46, -t * 0.02, mix(C.paper, C.slate, 0.5), a * 0.7, false);
  c.restore();
}

// A paper chip under any text that must be read over colour — the series never puts text straight on a fill.
function chip(c, s, x, y, o) { c.save(); c.font = `${o.size}px ${KH.FONTS[o.f]}`;
  const w = c.measureText(s.replace(/<\/?i>/g, '')).width * (o.f === 'mono' ? 1 + (o.track ?? 0.2) : 1), pad = o.pad ?? 12, h = o.size * 1.5;
  const X = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  c.globalAlpha *= o.a ?? 1; c.fillStyle = o.bg || C.paper; c.beginPath(); c.roundRect(X - pad, y - o.size * 1.05, w + pad * 2, h, 6); c.fill();
  if (o.border) { c.strokeStyle = o.border; c.lineWidth = 1.2; c.stroke(); } c.restore();
  text(c, s, x, y, o); }

// Opening card: eyebrow + title + a rule that draws on. Returns the alpha so the episode can fade its own work in under it.
function open(c, t, ep, o = {}) { const a = win(t, 0.25, o.out ?? 2.5, 0.4, 0.45), d = ramp(t, 0.3, 1.2);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  text(c, `CETI · Capabilities · ${ep.no}`, 960, 430, { f: 'mono', size: 15, col: SOFT, a, align: 'center' });
  c.strokeStyle = rgba(ep.accent, a); c.lineWidth = 2; c.beginPath(); c.moveTo(960 - 160 * d, 462); c.lineTo(960 + 160 * d, 462); c.stroke();
  text(c, ep.title, 960, 560, { f: 'disp', size: 92, col: INK, accent: ep.accent, a, align: 'center' });
  c.restore(); return a; }

// Caption: one line at the bottom on a paper chip. r = { in, out, fi, fo, text }
function caption(c, t, r, o = {}) { const a = win(t, r.in, r.out, r.fi, r.fo); if (a <= 0.001) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  chip(c, r.html || r.text, 960, o.y ?? 990, { f: 'sans', size: o.size ?? 38, col: INK, accent: o.accent || INK, a, align: 'center', pad: 18 });
  c.restore(); }

// Closing lockup: whale mark + series name + episode. It takes the caption's place at the bottom, so the
// end-belief caption must be fully out by t0 (the lockup's start). Every episode ends on it after its own ending beat.
function lockup(c, t, t0, ep) { const a = ramp(t, t0, t0 + 0.6, EASE.warm);
  if (a <= 0) return; c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  whaleMark(c, 960 - 60, 900, 1.2, INK, a);
  text(c, `CETI · Capabilities · ${ep.no} · ${ep.short}`, 960, 1010, { f: 'mono', size: 15, col: SOFT, a, align: 'center' });
  c.restore(); }

KH.SERIES = { name: 'CETI Capabilities', INK, SOFT, ground, chip, open, caption, lockup };
})(typeof window !== 'undefined' ? window : globalThis);
