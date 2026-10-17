// Little whale — shared library: palette, easing, seeded RNG, colour math, and the whale rig.
// Everything is a pure function of its inputs: no clocks, no unseeded randomness.

const PAL = {
  navy: '#1A1F2E', bathy: '#0F1320', rule: '#2A3142', fog: '#B8B0A1',
  paper: '#F5EFE3', paperSoft: '#E8DFCB', ink: '#1A1F2E',
  copper: '#A67756', sage: '#7A9171', peach: '#D88B5C', slate: '#324555', rust: '#8C4A2E',
  // Sanzo Wada combinations
  w296: ['#F5ECC2', '#D8A37B', '#71502F', '#34454C'],
  w279: ['#BB7125', '#EEA78C', '#C2AE93', '#12354E'],
  w166: ['#F48067', '#FBE6A0', '#112F2C'],
  w339: ['#D8A37B', '#D96629', '#A5C8D1', '#40456A'],
  glaucous: '#A5C8D1', naples: '#FBE6A0', grenadine: '#F48067', sienna: '#BB7125',
};

// ---- maths -------------------------------------------------------------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const win = (t, a, b, fi = 0.4, fo = 0.4) => smooth(a, a + fi, t) * (1 - smooth(b - fo, b, t));

// cubic-bezier easing (CETI named eases)
function bez(p1x, p1y, p2x, p2y) {
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
  const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  const sx = t => ((ax * t + bx) * t + cx) * t, sy = t => ((ay * t + by) * t + cy) * t;
  const dx = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => {
    x = clamp(x); let t = x;
    for (let i = 0; i < 8; i++) { const e = sx(t) - x; const d = dx(t); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; t -= e / d; }
    return sy(clamp(t));
  };
}
const EASE = {
  glaser: bez(0.22, 1, 0.36, 1), warm: bez(0.4, 0, 0.2, 1), defer: bez(0.25, 0.46, 0.45, 0.94),
  collect: bez(0.55, 0, 0.55, 0.2), rest: bez(0.4, 0, 0.6, 1),
};
const ramp = (t, a, b, e = EASE.glaser) => e(clamp((t - a) / (b - a)));

// seeded RNG (mulberry32)
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// colour: hex <-> rgb, lerp in linear light
const hex2 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const toLin = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const toSrgb = c => c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
function mix(a, b, k) {
  const A = hex2(a).map(toLin), B = hex2(b).map(toLin);
  return '#' + A.map((v, i) => Math.round(clamp(toSrgb(lerp(v, B[i], k))) * 255).toString(16).padStart(2, '0')).join('');
}
const f2 = n => (Math.round(n * 100) / 100);

// ---- the little whale rig ---------------------------------------------
// Local space: faces +x, ~310 units nose-to-flukes, origin at body centre.
// p: { tail, fin, eye, blink, mouth, spray, squash, stroke, fill, ink, blush, sw, light }
const BODY = 'M118,8 C120,-36 96,-64 54,-66 C12,-68 -36,-54 -70,-31 C-88,-20 -102,-13 -110,-9 L-110,7 C-98,12 -80,24 -48,41 C-14,57 40,60 78,50 C108,42 117,30 118,8 Z';
const FLUKE = 'M0,-5 C-14,-10 -30,-28 -52,-40 C-47,-23 -42,-10 -33,0 C-42,10 -47,23 -52,40 C-30,28 -14,10 0,5 Z';
const FIN = 'M0,0 C11,16 4,40 -18,52 C-18,33 -16,16 -9,2 Z';

function whale(p) {
  const deg = r => f2(r * 180 / Math.PI);
  const sw = p.sw ?? 3.2, stroke = p.stroke, fill = p.fill, ink = p.ink ?? stroke;
  const eyeR = 8.5 * (p.eye ?? 1);
  const blink = clamp(1 - (p.blink ?? 0), 0.08, 1);
  const mouth = p.mouth ?? 0;
  let s = '';
  // flukes (behind body)
  s += `<g transform="translate(-109,-1) rotate(${deg(p.tail ?? 0)})"><path d="${FLUKE}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/></g>`;
  // body
  s += `<path d="${BODY}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  // ventral pleats
  s += `<g fill="none" stroke="${stroke}" stroke-width="${f2(sw * 0.42)}" stroke-linecap="round" opacity="0.7">`
    + `<path d="M30,49 Q62,46 92,36"/><path d="M42,55 Q72,52 102,42"/></g>`;
  // blush (appears as the voice returns)
  if ((p.blush ?? 0) > 0.01) s += `<ellipse cx="86" cy="12" rx="13" ry="7" fill="${PAL.grenadine}" opacity="${f2(0.38 * p.blush)}"/>`;
  // eye
  s += `<g transform="translate(70,-14) scale(1,${f2(blink)})"><circle r="${f2(eyeR)}" fill="${ink}"/>`
    + (p.light ? `<circle cx="${f2(eyeR * 0.3)}" cy="${f2(-eyeR * 0.35)}" r="${f2(eyeR * 0.3)}" fill="${PAL.paper}"/>` : `<circle cx="${f2(eyeR * 0.3)}" cy="${f2(-eyeR * 0.35)}" r="${f2(eyeR * 0.28)}" fill="${PAL.navy}"/>`)
    + `</g>`;
  // mouth: a line that opens into a small song-shape
  if (mouth < 0.04) s += `<path d="M117,18 Q104,27 88,25" fill="none" stroke="${stroke}" stroke-width="${f2(sw * 0.8)}" stroke-linecap="round"/>`;
  else s += `<path d="M117,16 Q104,${f2(25 + mouth * 3)} 88,25 Q101,${f2(27 + mouth * 15)} 115,${f2(20 + mouth * 6)} Z" fill="${ink}" stroke="${stroke}" stroke-width="${f2(sw * 0.7)}" stroke-linejoin="round"/>`;
  // pectoral fin (in front)
  s += `<g transform="translate(22,38) rotate(${deg(p.fin ?? 0)})"><path d="${FIN}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/></g>`;
  // blowhole spray
  const sp = p.spray ?? 0;
  if (sp > 0.02) {
    const L = 70 * sp;
    s += `<g fill="none" stroke="${p.sprayColor ?? stroke}" stroke-width="${f2(sw * 0.8)}" stroke-linecap="round" opacity="${f2(clamp(sp * 1.4))}">`;
    for (const a of [-0.55, -0.2, 0.15, 0.5]) {
      const x2 = 40 + Math.sin(a) * L * 1.1, y2 = -68 - Math.cos(a) * L;
      s += `<path d="M40,-68 Q${f2(40 + Math.sin(a) * L * 0.4)},${f2(-68 - L * 0.9)} ${f2(x2)},${f2(y2)}"/>`;
      s += `<circle cx="${f2(x2 + Math.sin(a) * 9)}" cy="${f2(y2 + 6)}" r="${f2(sw * 0.6)}" fill="${p.sprayColor ?? stroke}" stroke="none"/>`;
    }
    s += `</g>`;
  }
  const sq = p.squash ?? 0;
  return `<g transform="scale(${f2(1 + sq)},${f2(1 - sq)})">${s}</g>`;
}

// place a whale in the world
function placeWhale(x, y, ang, scale, p, opacity = 1) {
  return `<g opacity="${f2(opacity)}" transform="translate(${f2(x)},${f2(y)}) rotate(${f2(ang * 180 / Math.PI)}) scale(${f2(scale)})">${whale(p)}</g>`;
}

if (typeof module !== 'undefined') module.exports = { PAL, clamp, lerp, smooth, win, EASE, ramp, rng, mix, whale, placeWhale };
