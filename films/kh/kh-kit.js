// Kinetic Hydrography — style kit v1.0.0
// The style in code: tokens (CETI design system + Sanzo Wada combinations), the five CETI eases,
// seeded randomness, colour mixing and type. Every design imports this file; its sha256 is recorded
// in each design's provenance, so any frame can be traced back to the exact style that drew it.
(function (root) {
'use strict';
const STYLE = { name: 'Kinetic Hydrography', version: '1.0.0', lineage: ['CETI Design System', 'Sanzo Wada — A Dictionary of Color Combinations'] };

const CETI = {
  navy: '#1A1F2E', bathy: '#0F1320', nightTide: '#262721', rule: '#2A3142', paper: '#F5EFE3', paperSoft: '#E8DFCB',
  fog: '#B8B0A1', copper: '#A67756', sage: '#7A9171', peach: '#D88B5C', slate: '#324555', rust: '#8C4A2E', mist: '#95A8B0', driftwood: '#5C5447',
};
const WADA = {
  296: [['Sulpher Yellow', '#F5ECC2'], ['Ochraceous Salmon', '#D8A37B'], ['Pale Raw Umber', '#71502F'], ['Slate Color', '#34454C']],
  279: [['Raw Sienna', '#BB7125'], ['Vinaceous Cinnamon', '#EEA78C'], ['Ecru', '#C2AE93'], ['Dark Tyrian Blue', '#12354E']],
  166: [['Grenadine Pink', '#F48067'], ['Naples Yellow', '#FBE6A0'], ['Deep Slate Green', '#112F2C']],
  339: [['Ochraceous Salmon', '#D8A37B'], ['English Red', '#D96629'], ['Light Glaucous Blue', '#A5C8D1'], ['Violet Blue', '#40456A']],
  84: [['Seashell Pink', '#FDD4BD'], ['Deep Slate Green', '#112F2C']],
  207: [['Sudan Brown', '#A36752'], ['Glaucous Green', '#B4CDC2'], ['Black', '#111314']],
  243: [['Raw Sienna', '#BB7125'], ['Ivory Buff', '#EBD3A2'], ['Olive Green', '#6B7140'], ['Slate Color', '#34454C']],
};
const NEUTRALS = { white: '#FFFFFF', black: '#000000' };
const W = {}; for (const k in WADA) for (const [n, h] of WADA[k]) W[n.replace(/[^A-Za-z]/g, '').replace(/^./, c => c.toLowerCase())] = h;

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smoothstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const win = (t, a, b, fi = 0.4, fo = 0.4) => smoothstep(a, a + fi, t) * (1 - smoothstep(b - fo, b, t));
function bez(p1x, p1y, p2x, p2y) {
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx, cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  const sx = u => ((ax * u + bx) * u + cx) * u, sy = u => ((ay * u + by) * u + cy) * u, dx = u => (3 * ax * u + 2 * bx) * u + cx;
  return x => { x = clamp(x); let u = x; for (let i = 0; i < 8; i++) { const e = sx(u) - x, d = dx(u); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; u -= e / d; } return sy(clamp(u)); };
}
// the five CETI eases (no bounce, no elastic: "CETI is not nervous")
const EASE = { glaser: bez(0.22, 1, 0.36, 1), warm: bez(0.4, 0, 0.2, 1), defer: bez(0.25, 0.46, 0.45, 0.94), collect: bez(0.55, 0, 0.55, 0.2), rest: bez(0.4, 0, 0.6, 1) };
const ramp = (t, a, b, e = EASE.glaser) => e(clamp((t - a) / (b - a)));
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let q = Math.imul(seed ^ seed >>> 15, 1 | seed); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; }; }
const hex2 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const toLin = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const toSrgb = c => c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
// all intermediate colours are MIXES of registered tokens in linear light — no unregistered literals
function mix(a, b, k) { const A = hex2(a).map(toLin), B = hex2(b).map(toLin);
  return '#' + A.map((v, i) => Math.round(clamp(toSrgb(lerp(v, B[i], k))) * 255).toString(16).padStart(2, '0')).join(''); }
const rgba = (h, a) => { const [r, g, b] = hex2(h); return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${clamp(a).toFixed(3)})`; };
const lum = h => { const [r, g, b] = hex2(h).map(toLin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

// type: three voices with fixed roles (Fraunces 300 italic display · DM Sans body · Space Mono eyebrows)
const FONTS = { disp: 'FrauncesL', mono: 'SpaceMono', monoB: 'SpaceMonoB', sans: 'DMSansS' };
function text(c, s, x, y, o) {
  c.save(); c.globalAlpha *= o.a ?? 1; c.font = `${o.size}px ${FONTS[o.f]}`; c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'alphabetic';
  const mono = o.f === 'mono' || o.f === 'monoB';
  if ('letterSpacing' in c) c.letterSpacing = mono ? `${(o.size * (o.track ?? 0.2)).toFixed(1)}px` : (o.f === 'disp' ? `${(-o.size * 0.02).toFixed(1)}px` : '0px');
  const str = mono ? s.toUpperCase() : s;
  const segs = str.split(/(<i>.*?<\/i>|<I>.*?<\/I>)/).filter(Boolean);
  const plain = g => g.replace(/<\/?[iI]>/g, '');
  const total = segs.reduce((a, g) => a + c.measureText(plain(g)).width, 0);
  let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x; c.textAlign = 'left';
  for (const g of segs) { const it = /^<[iI]>/.test(g), tx = plain(g); const w = c.measureText(tx).width;
    if (o.stroke) { c.lineWidth = o.stroke; c.strokeStyle = it ? o.accent : o.col; c.strokeText(tx, cx, y); } else { c.fillStyle = it ? o.accent : o.col; c.fillText(tx, cx, y); }
    if (it && o.strike != null && o.strike > 0) { c.strokeStyle = o.strikeCol || o.accent; c.lineWidth = Math.max(2, o.size * 0.045); c.beginPath(); const sy = y - o.size * 0.3; c.moveTo(cx - 4, sy); c.lineTo(cx - 4 + (w + 8) * o.strike, sy); c.stroke(); }
    cx += w; }
  c.restore(); return total;
}
// CETI whale mark (from the design system's whale-mark.svg, 100x60, unmodified)
const WHALE_MARK_D = ['M8 32 C 11 24, 20 20, 32 20 C 50 20, 66 28, 78 34', 'M8 32 C 12 40, 24 44, 42 44 C 60 44, 74 42, 82 38', 'M36 42 C 42 52, 54 56, 64 56 C 58 50, 50 44, 44 38', 'M82 38 C 90 38, 96 32, 96 22 C 90 26, 84 30, 80 34 C 88 30, 94 22, 96 14 C 88 18, 82 24, 78 30'];
function whaleMark(c, x, y, s, col, a = 1) { c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s, s); c.strokeStyle = col; c.lineWidth = 2; c.lineCap = 'round'; c.lineJoin = 'round';
  for (const d of WHALE_MARK_D) c.stroke(new root.Path2D(d)); c.restore(); }
// bearing ring — the sounding instrument; first drawn in "Little whale", reused as a style element
function bearingRing(c, x, y, R, rot, col, a = 1, labels = true) {
  c.save(); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.stroke(); c.beginPath();
  for (let i = 0; i < 72; i++) { const th = i / 72 * Math.PI * 2 + rot, l = i % 9 ? 6 : 14; c.moveTo(x + Math.cos(th) * R, y + Math.sin(th) * R); c.lineTo(x + Math.cos(th) * (R + l), y + Math.sin(th) * (R + l)); }
  c.stroke(); c.restore();
  if (labels) [['000', -Math.PI / 2], ['090', 0], ['180', Math.PI / 2], ['270', Math.PI]].forEach(([lb, th]) =>
    text(c, lb, x + Math.cos(th + rot) * (R + 34), y + Math.sin(th + rot) * (R + 34) + 4, { f: 'mono', size: 11, col, a: a * 0.9, align: 'center' }));
}

root.KH = { STYLE, CETI, WADA, W, NEUTRALS, clamp, lerp, smoothstep, win, bez, EASE, ramp, rng, mix, rgba, lum, contrast, FONTS, text, whaleMark, bearingRing, WHALE_MARK_D };
})(typeof window !== 'undefined' ? window : globalThis);
