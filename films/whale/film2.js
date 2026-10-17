// Little whale v2 — canvas engine. drawFrame(ctx, t) is a pure function of t (seeded RNG, no clocks).
// Runs in Node (@napi-rs/canvas) for rendering and in the browser for preview.
(function (root) {
'use strict';
const W = 1920, H = 1080, SURF = 290;
const SC = root.SCORE, DUR = SC.duration;

// ---------- palette & maths --------------------------------------------------
const PAL = {
  navy: '#1A1F2E', bathy: '#0F1320', fog: '#B8B0A1', paper: '#F5EFE3', paperSoft: '#E8DFCB', ink: '#1A1F2E',
  copper: '#A67756', sage: '#7A9171', peach: '#D88B5C', slate: '#324555', sienna: '#BB7125', umber: '#71502F',
  vinaceous: '#EEA78C', ecru: '#C2AE93', tyrian: '#12354E', salmon: '#D8A37B', sulpher: '#F5ECC2',
  grenadine: '#F48067', naples: '#FBE6A0', glaucous: '#A5C8D1', dsgreen: '#112F2C',
};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smoothstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const win = (t, a, b, fi = 0.4, fo = 0.4) => smoothstep(a, a + fi, t) * (1 - smoothstep(b - fo, b, t));
function bez(p1x, p1y, p2x, p2y) {
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx, cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  const sx = u => ((ax * u + bx) * u + cx) * u, sy = u => ((ay * u + by) * u + cy) * u, dx = u => (3 * ax * u + 2 * bx) * u + cx;
  return x => { x = clamp(x); let u = x; for (let i = 0; i < 8; i++) { const e = sx(u) - x, d = dx(u); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; u -= e / d; } return sy(clamp(u)); };
}
const EASE = { glaser: bez(0.22, 1, 0.36, 1), warm: bez(0.4, 0, 0.2, 1), defer: bez(0.25, 0.46, 0.45, 0.94), collect: bez(0.55, 0, 0.55, 0.2), rest: bez(0.4, 0, 0.6, 1) };
const ramp = (t, a, b, e = EASE.glaser) => e(clamp((t - a) / (b - a)));
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let q = Math.imul(seed ^ seed >>> 15, 1 | seed); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; }; }
const hex2 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const toLin = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const toSrgb = c => c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
function mix(a, b, k) { const A = hex2(a).map(toLin), B = hex2(b).map(toLin);
  return '#' + A.map((v, i) => Math.round(clamp(toSrgb(lerp(v, B[i], k))) * 255).toString(16).padStart(2, '0')).join(''); }
const rgba = (h, a) => { const [r, g, b] = hex2(h); return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${clamp(a).toFixed(3)})`; };

// ---------- time-varying looks --------------------------------------------------
const Lt = t => EASE.rest(clamp((t - 37) / 8.5));                 // 0 = the deep, 1 = the surface
const DAWN = mix('#5A5566', PAL.salmon, 0.35);
const dawn = (a, b, k) => k < 0.5 ? mix(a, DAWN, k * 2) : mix(DAWN, b, (k - 0.5) * 2);
const lineCol = t => mix(PAL.paper, PAL.ink, Lt(t));
const softCol = t => mix(PAL.fog, PAL.slate, Lt(t));
const accentCol = t => mix(PAL.sienna, PAL.umber, Lt(t));
const depthAt = t => 412 * (1 - EASE.warm(clamp((t - 33) / 16.3)));

// ---------- whale path (time-parameterised Hermite) ----------------------------------
const loopC = { x: 1000, y: 560, r: 150, a: 24.5, b: 29.5 };
const KA = [[5.0, -300, 650], [8.5, 250, 660], [12.0, 600, 640], [14.4, 730, 625], [16.0, 765, 615], [19.0, 790, 612],
  [21.0, 815, 620], [22.5, 880, 662], [24.0, 958, 706]];
for (let i = 0; i <= 20; i++) { const k = i / 20, th = Math.PI / 2 - k * Math.PI * 2;
  KA.push([lerp(loopC.a, loopC.b, k), loopC.x + Math.cos(th) * loopC.r, loopC.y + Math.sin(th) * loopC.r]); }
KA.push([31.0, 1110, 700], [33.5, 1240, 645], [37.0, 1340, 545], [40.0, 1420, 492], [43.0, 1470, 440], [46.0, 1505, 470],
  [48.2, 1540, 400], [49.0, 1560, 316], [49.6, 1580, 214], [50.2, 1612, 172], [51.0, 1662, 268], [51.8, 1762, 410], [52.6, 2160, 600]);
const KB = [[53.6, -360, 830], [55.9, 1230, 768], [57.4, 1430, 742], [60.5, 1470, 736]];
const toK = l => l.map(([t, x, y]) => ({ t, x, y }));
const PA = toK(KA), PB = toK(KB);
function herm(P, t) {
  const n = P.length; if (t <= P[0].t) return { x: P[0].x, y: P[0].y }; if (t >= P[n - 1].t) return { x: P[n - 1].x, y: P[n - 1].y };
  let i = 0; while (P[i + 1].t < t) i++;
  const p1 = P[i], p2 = P[i + 1], h = p2.t - p1.t, u = (t - p1.t) / h;
  const tan = k => { const a = P[Math.max(0, k - 1)], b = P[Math.min(n - 1, k + 1)]; return { x: (b.x - a.x) / (b.t - a.t), y: (b.y - a.y) / (b.t - a.t) }; };
  const m1 = tan(i), m2 = tan(i + 1), u2 = u * u, u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
  return { x: h00 * p1.x + h10 * h * m1.x + h01 * p2.x + h11 * h * m2.x, y: h00 * p1.y + h10 * h * m1.y + h01 * p2.y + h11 * h * m2.y };
}
const inB = t => t >= 53.3;
// bolder swim: a visible up-and-down undulation while travelling (off near the loop and the breach)
const undAmp = t => (t >= 53.3 ? 0 : 12) * (1 - win(t, 23.6, 30.4, 0.6, 0.6)) * (1 - win(t, 47.5, 52.5, 0.6, 0.4));
const pos = t => { const p = inB(t) ? herm(PB, t) : herm(PA, t); return { x: p.x, y: p.y + Math.sin(t * 1.7) * undAmp(t) }; };
const vel = t => { const a = pos(t - 1 / 120), b = pos(t + 1 / 120); return { x: (b.x - a.x) * 60, y: (b.y - a.y) * 60 }; };
function heading(t) {
  if (t > loopC.a && t < loopC.b) return -((t - loopC.a) / (loopC.b - loopC.a)) * Math.PI * 2;
  let ax = 0, ay = 0; for (let k = -4; k <= 4; k++) { const q = vel(t + k * 0.05), w = 1 - Math.abs(k) / 5; ax += q.x * w; ay += q.y * w; }
  const sp = Math.hypot(ax, ay) / 5;
  return clamp(Math.atan2(ay, Math.max(1, ax)) * clamp(sp / 60), -1.35, 1.35);
}
const DT = 1 / 120, DIST = [0];
for (let i = 1; i <= DUR / DT + 2; i++) { const a = pos((i - 1) * DT), b = pos(i * DT); DIST.push(DIST[i - 1] + (inB(i * DT) !== inB((i - 1) * DT) ? 0 : Math.hypot(b.x - a.x, b.y - a.y))); }
const dist = t => DIST[clamp(Math.round(t / DT), 0, DIST.length - 1)];
// smoothed whale position = the camera's target (parallax driver)
function camT(t) { let x = 0, y = 0, s = 0; for (let k = 0; k <= 8; k++) { const w = 1 - k / 9, p = pos(clamp(t - k * 0.12, 5, 53)); x += p.x * w; y += p.y * w; s += w; } return { x: x / s, y: y / s }; }
const zoomAt = t => 1 + 0.055 * win(t, 14.4, 21.5, 0.6, 1.4) + 0.04 * win(t, 36, 47, 2.5, 2.0);

// ---------- song (cue-locked) ---------------------------------------------------------
function noteEnv(n, t) { const a = 0.12, r = 0.3; if (t < n.t || t > n.t + n.d + r) return 0;
  if (t < n.t + a) return (t - n.t) / a; if (t < n.t + n.d) return 1; return 1 - (t - n.t - n.d) / r; }
function song(t) { let best = null, env = 0; for (const n of SC.notes) { const e = noteEnv(n, t); if (e > env) { env = e; best = n; } }
  if (!best) return { env: 0, f: 0 }; const k = EASE.warm(clamp((t - best.t) / best.d));
  return { env: env * best.amp, f: lerp(best.f0, best.f1, k) * (1 + best.wob * 0.035 * Math.sin(2 * Math.PI * 5.2 * t + Math.sin(11 * t))) }; }

// ---------- the little whale (canvas rig) ------------------------------------------------
const P2 = s => new root.Path2D(s);
const BODY = P2('M118,8 C120,-36 96,-64 54,-66 C12,-68 -36,-54 -70,-31 C-88,-20 -102,-13 -110,-9 L-110,7 C-98,12 -80,24 -48,41 C-14,57 40,60 78,50 C108,42 117,30 118,8 Z');
const FLUKE = P2('M0,-5 C-14,-10 -30,-28 -52,-40 C-47,-23 -42,-10 -33,0 C-42,10 -47,23 -52,40 C-30,28 -14,10 0,5 Z');
const FIN = P2('M0,0 C11,16 4,40 -18,52 C-18,33 -16,16 -9,2 Z');
const PLEATS = [P2('M30,49 Q62,46 92,36'), P2('M42,55 Q72,52 102,42')];
function drawWhale(c, o) {
  // o: x,y,ang,scale, tail,fin,eye,blink,mouth,spray,squash,blush, L (0 deep..1 light), stroke, alpha, ghost
  c.save(); c.globalAlpha = o.alpha ?? 1;
  c.translate(o.x, o.y); c.rotate(o.ang); c.scale(o.scale * (1 + (o.squash || 0)), o.scale * (1 - (o.squash || 0)));
  const L = o.L, sw = o.sw ?? 3.2, st = o.stroke;
  c.lineJoin = 'round'; c.lineCap = 'round'; c.lineWidth = sw; c.strokeStyle = st;
  const back = o.ghost ? null : mix('#222A3D', '#6F9BA8', L), mid = mix('#2A3349', PAL.glaucous, L), belly = mix('#38435C', '#E6F0F1', L);
  const fillG = () => { if (o.ghost) return 'rgba(0,0,0,0)'; const g = c.createLinearGradient(0, -66, 0, 58); g.addColorStop(0, back); g.addColorStop(0.55, mid); g.addColorStop(1, belly); return g; };
  // far-side fin (behind the body, darker): the first 3D cue
  if (!o.ghost) { c.save(); c.translate(6, 36); c.rotate((o.fin || 0) * -0.8 - 0.35); c.scale(0.8, 0.8); c.fillStyle = mix(back, PAL.navy, 0.35); c.fill(FIN); c.lineWidth = sw * 0.8; c.stroke(FIN); c.restore(); }
  // flukes
  c.save(); c.translate(-109, -1); c.rotate(o.tail || 0); c.fillStyle = o.ghost ? 'rgba(0,0,0,0)' : mix(back, mid, 0.4); c.fill(FLUKE); c.stroke(FLUKE); c.restore();
  // body with countershading + specular highlight + rim
  c.fillStyle = fillG(); c.fill(BODY);
  if (!o.ghost) {
    c.save(); c.clip(BODY);
    const hg = c.createRadialGradient(36, -50, 2, 36, -50, 62); hg.addColorStop(0, rgba('#FFFFFF', lerp(0.10, 0.38, L))); hg.addColorStop(1, rgba('#FFFFFF', 0));
    c.fillStyle = hg; c.beginPath(); c.ellipse(36, -48, 70, 24, -0.08, 0, Math.PI * 2); c.fill();
    const sg = c.createLinearGradient(0, 20, 0, 60); sg.addColorStop(0, rgba(PAL.navy, 0)); sg.addColorStop(1, rgba(PAL.navy, lerp(0.35, 0.10, L)));
    c.fillStyle = sg; c.fillRect(-120, 20, 250, 50); c.restore();
  }
  c.stroke(BODY);
  c.save(); c.lineWidth = sw * 0.42; c.globalAlpha *= 0.65; PLEATS.forEach(p => c.stroke(p)); c.restore();
  if ((o.blush || 0) > 0.01) { c.fillStyle = rgba(PAL.grenadine, 0.38 * o.blush); c.beginPath(); c.ellipse(86, 12, 13, 7, 0, 0, Math.PI * 2); c.fill(); }
  // eye
  const er = 8.5 * (o.eye ?? 1), bl = clamp(1 - (o.blink || 0), 0.08, 1);
  c.save(); c.translate(70, -14); c.scale(1, bl); c.fillStyle = st; c.beginPath(); c.arc(0, 0, er, 0, Math.PI * 2); c.fill();
  c.fillStyle = L > 0.5 ? PAL.paper : PAL.navy; c.beginPath(); c.arc(er * 0.3, -er * 0.35, er * 0.3, 0, Math.PI * 2); c.fill(); c.restore();
  // mouth
  const m = o.mouth || 0;
  if (m < 0.04) { c.save(); c.lineWidth = sw * 0.8; c.beginPath(); c.moveTo(117, 18); c.quadraticCurveTo(104, 27, 88, 25); c.stroke(); c.restore(); }
  else { c.beginPath(); c.moveTo(117, 16); c.quadraticCurveTo(104, 25 + m * 3, 88, 25); c.quadraticCurveTo(101, 27 + m * 15, 115, 20 + m * 6); c.closePath(); c.fillStyle = st; c.fill(); c.lineWidth = sw * 0.7; c.stroke(); }
  // near fin
  c.save(); c.translate(22, 38); c.rotate(o.fin || 0); c.fillStyle = o.ghost ? 'rgba(0,0,0,0)' : mid; c.fill(FIN); c.stroke(FIN); c.restore();
  // spray
  const sp = o.spray || 0;
  if (sp > 0.02) { const Ls = 76 * sp; c.save(); c.strokeStyle = o.sprayColor || st; c.fillStyle = o.sprayColor || st; c.lineWidth = sw * 0.8; c.globalAlpha *= clamp(sp * 1.4);
    for (const a of [-0.55, -0.2, 0.15, 0.5]) { const x2 = 40 + Math.sin(a) * Ls * 1.1, y2 = -68 - Math.cos(a) * Ls;
      c.beginPath(); c.moveTo(40, -68); c.quadraticCurveTo(40 + Math.sin(a) * Ls * 0.4, -68 - Ls * 0.9, x2, y2); c.stroke();
      c.beginPath(); c.arc(x2 + Math.sin(a) * 9, y2 + 6, sw * 0.6, 0, Math.PI * 2); c.fill(); }
    c.restore(); }
  c.restore();
}
// blowhole in world space (for bubbles)
function blowhole(t) { const p = pos(t), a = heading(t), s = scaleAt(t); return { x: p.x + (40 * Math.cos(a) + 68 * Math.sin(a)) * s, y: p.y + (40 * Math.sin(a) - 68 * Math.cos(a)) * s }; }
const scaleAt = t => inB(t) ? lerp(1, 0.66, ramp(t, 53.6, 56)) : 1 + 0.16 * win(t, 34, 47.5, 3, 2.5);

// ---------- seeded scene content ---------------------------------------------------------
const R0 = rng(41), STAMPS = [];
const SHAPE_COLS = [PAL.sulpher, PAL.salmon, PAL.vinaceous, PAL.grenadine, PAL.naples, PAL.glaucous, PAL.ecru, PAL.sage];
for (const cx of [210, 345, 480, 615]) for (const cy of [340, 470, 700, 820]) STAMPS.push({ cx, cy, k: 2 + Math.floor(R0() * 5), amp: 0.12 + R0() * 0.14,
  ph: R0() * 6.28, grow: 0.9 + R0() * 0.55, col: SHAPE_COLS[Math.floor(R0() * SHAPE_COLS.length)], rot: (R0() - 0.5) * 0.6, bloom: R0(), z: 0.82 + R0() * 0.36 });
STAMPS.forEach(st => { let tt = 5; while (tt < 14 && pos(tt).x < st.cx - 30) tt += 0.02; st.pass = tt; });
const R1 = rng(7), SNOW = [];
// three depth planes: far (small, slow), mid, near (big soft bokeh, fast)
for (const [n, z, r0, r1, a0] of [[150, 0.25, 0.8, 1.8, 0.45], [70, 0.6, 1.6, 3.2, 0.5], [16, 1.7, 9, 22, 0.16]])
  for (let i = 0; i < n; i++) SNOW.push({ x: R1() * 2400, y: R1() * 1500, z, r: lerp(r0, r1, R1()), a: a0 * lerp(0.5, 1, R1()), sp: lerp(8, 22, R1()), ph: R1() * 6.28, warm: R1() < 0.5 });
const R2 = rng(11), RAYS = [];
for (let i = 0; i < 8; i++) RAYS.push({ x: lerp(-100, 2000, i / 7) + (R2() - 0.5) * 140, w0: 40 + R2() * 90, w1: 160 + R2() * 220, a: 0.5 + R2() * 0.5, ph: R2() * 6.28, sw: 0.4 + R2() * 0.6 });
const RIDGES = [0, 1, 2].map(k => { const R = rng(100 + k), pts = []; for (let x = -300; x <= 2300; x += 60) pts.push([x, (R() - 0.5) * (40 + k * 25) + Math.sin(x * 0.004 + k) * (50 + k * 30)]); return pts; });
const BUBBLES = []; { const R = rng(5); for (const n of SC.notes) for (let j = 0; j < 6; j++) BUBBLES.push({ tb: n.t + 0.05 + j * 0.11 + R() * 0.05, r: 2.4 + R() * 3.4, wob: R() * 6.28, dx: (R() - 0.5) * 30, life: 2.4 + R() * 1.4 });
  for (const tb of [14.62, 14.7, 14.8]) BUBBLES.push({ tb, r: 3 + R() * 2, wob: R() * 6, dx: (R() - 0.5) * 20, life: 2.6 }); }
// distant adults: blurred once per tail phase and cached (a live blur filter costs ~1 s/frame)
const FAR = {};
function farSprite(id, s, ph, col) {
  const q = Math.round((ph + 1) * 8), key = id + q; if (FAR[key]) return FAR[key];
  const w = Math.ceil(300 * s), h = Math.ceil(200 * s), a = root.makeCanvas(w, h), ac = a.getContext('2d');
  drawWhale(ac, { x: w / 2, y: h / 2, ang: 0, scale: s, L: 0, stroke: col, alpha: 1, tail: (q / 8 - 1) * 0.25, fin: (q / 8 - 1) * 0.2, sw: 2 });
  const b = root.makeCanvas(w, h), bc = b.getContext('2d'); bc.filter = 'blur(5px)'; bc.drawImage(a, 0, 0); FAR[key] = b; return b;
}
let GRAIN = null;
function grain() { if (GRAIN) return GRAIN; const g = root.makeCanvas(256, 256), c = g.getContext('2d'), img = c.createImageData(256, 256), R = rng(77);
  for (let i = 0; i < 256 * 256; i++) { const v = Math.max(0, Math.min(255, 128 + (R() + R() + R() - 1.5) * 90)); img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 34; }
  c.putImageData(img, 0, 0); GRAIN = g; return g; }
const SPR = {};
function sprite(col) { if (SPR[col]) return SPR[col]; const s = root.makeCanvas(64, 64), c = s.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, rgba(col, 1)); g.addColorStop(0.35, rgba(col, 0.55)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(0, 0, 64, 64); SPR[col] = s; return s; }

// ---------- text helpers ---------------------------------------------------------------------
const FONTS = { disp: 'FrauncesL', mono: 'SpaceMono', sans: 'DMSansS' };
function text(c, s, x, y, o) {
  c.save(); c.globalAlpha *= o.a ?? 1; c.font = `${o.size}px ${FONTS[o.f]}`; c.textAlign = o.align || 'left'; c.textBaseline = 'alphabetic';
  if ('letterSpacing' in c) c.letterSpacing = o.f === 'mono' ? `${(o.size * 0.2).toFixed(1)}px` : (o.f === 'disp' ? `${(-o.size * 0.02).toFixed(1)}px` : '0px');
  const segs = s.split(/(<i>.*?<\/i>)/).filter(Boolean);
  if (segs.length === 1 && !s.includes('<i>')) { c.fillStyle = o.col; c.fillText(o.f === 'mono' ? s.toUpperCase() : s, x, y); }
  else { let cx = x; if (o.align === 'center') { const w = segs.reduce((a, g) => a + c.measureText(g.replace(/<\/?i>/g, '')).width, 0); cx = x - w / 2; c.textAlign = 'left'; }
    for (const g of segs) { const it = g.startsWith('<i>'), tx = g.replace(/<\/?i>/g, ''); c.fillStyle = it ? o.accent : o.col; c.fillText(tx, cx, y); cx += c.measureText(tx).width; } }
  c.restore();
}
const WHALE_MARK = ['M8 32 C 11 24, 20 20, 32 20 C 50 20, 66 28, 78 34', 'M8 32 C 12 40, 24 44, 42 44 C 60 44, 74 42, 82 38', 'M36 42 C 42 52, 54 56, 64 56 C 58 50, 50 44, 44 38', 'M82 38 C 90 38, 96 32, 96 22 C 90 26, 84 30, 80 34 C 88 30, 94 22, 96 14 C 88 18, 82 24, 78 30'].map(P2);

// ---------- the frame --------------------------------------------------------------------------
function drawFrame(c, t) {
  t = clamp(t, 0, DUR);
  const L = Lt(t), ink = lineCol(t), soft = softCol(t), depth = depthAt(t);
  const endK = ramp(t, 53.0, 54.6, EASE.collect), out = 1 - endK;
  const cam = camT(t), par = { x: (cam.x - 960) * 0.22, y: (cam.y - 560) * 0.14 };
  const rise = 412 - depth;                                   // metres climbed: drives vertical scroll of the environment
  const sy = lerp(-60, SURF, ramp(t, 41, 47, EASE.warm));
  c.save(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.setTransform(1, 0, 0, 1, 0, 0);

  // 1 · water column (light arrives from above) and air above the surface
  const top = dawn(PAL.navy, mix(PAL.paper, PAL.glaucous, 0.16), Lt(t + 2.0)), bot = dawn(PAL.bathy, PAL.paperSoft, Lt(t - 1.6));
  let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (sy > -40) { const ga = c.createLinearGradient(0, 0, 0, sy); ga.addColorStop(0, '#FBF7F0'); ga.addColorStop(1, PAL.paper); c.fillStyle = ga; c.fillRect(0, 0, W, sy); }

  // dolly: everything in the world zooms gently around the camera target
  const z = zoomAt(t), zc = { x: lerp(960, cam.x, 0.5), y: lerp(560, cam.y, 0.5) };
  c.save(); c.translate(zc.x, zc.y); c.scale(z, z); c.translate(-zc.x, -zc.y);
  const waterTint = mix(top, bot, 0.5);

  // 2 · far plane: seabed ridges (atmospheric perspective) and distant adult whales
  RIDGES.forEach((pts, k) => { const p = [0.12, 0.25, 0.42][k], base = [905, 975, 1045][k] + rise * (1.4 + k * 0.6), xo = -par.x * p * 3;
    if (base > H + 160) return;
    c.beginPath(); c.moveTo(-300 + xo, H + 400); pts.forEach(([x, y]) => c.lineTo(x + xo, base + y)); c.lineTo(2300 + xo, H + 400); c.closePath();
    c.fillStyle = mix(waterTint, PAL.bathy, [0.25, 0.5, 0.8][k] * (1 - L)); c.globalAlpha = 1 - L; c.fill(); c.globalAlpha = 1; });
  const far = win(t, 1.5, 23, 2.5, 4);
  if (far > 0) {
    for (const [x0, y0, s, sp, ph, id] of [[820, 440, 2.0, 26, 0, 'a'], [-300, 300, 1.4, 30, 2, 'b']]) { const x = x0 + t * sp - par.x * 0.15, y = y0 + Math.sin(t * 0.4 + ph) * 10 + rise * 0.5;
      const spr = farSprite(id, s, Math.sin(t * 1.1 + ph), mix(PAL.navy, PAL.fog, 0.14));
      c.save(); c.globalAlpha = 0.3 * far; c.translate(x, y); c.rotate(Math.sin(t * 0.4 + ph) * 0.05); c.drawImage(spr, -spr.width / 2, -spr.height / 2); c.restore(); } }

  // 3 · light shafts: barely there in the deep, strong under the surface
  const rayA = lerp(0.035, 0.16, smoothstep(30, 46, t)) * (1 - 0.55 * smoothstep(52, 56, t));
  c.save(); c.globalCompositeOperation = L > 0.5 ? 'source-over' : 'lighter';
  RAYS.forEach(r => { const sx = r.x + Math.sin(t * 0.25 * r.sw + r.ph) * 60 - par.x * 0.2, top0 = Math.max(0, sy), len = 900;
    const gr = c.createLinearGradient(0, top0, 0, top0 + len); const col = L > 0.5 ? '#FFFFFF' : '#9FB9CC';
    gr.addColorStop(0, rgba(col, rayA * r.a * (L > 0.5 ? 2.6 : 1))); gr.addColorStop(1, rgba(col, 0));
    c.fillStyle = gr; c.beginPath(); c.moveTo(sx - r.w0 / 2, top0); c.lineTo(sx + r.w0 / 2, top0); c.lineTo(sx + r.w1 / 2 + 260, top0 + len); c.lineTo(sx - r.w1 / 2 + 260, top0 + len); c.closePath(); c.fill(); });
  c.restore();

  // 4 · marine snow, far + mid planes (drifting down, parallax with the camera, scrolling as we rise)
  const snowDraw = plane => { SNOW.forEach(s => { if ((s.z > 1) !== plane) return;
    const x = ((s.x - par.x * s.z * 2.2 + Math.sin(t * 0.3 + s.ph) * 12) % 2400 + 2400) % 2400 - 240;
    const y = ((s.y + t * s.sp * s.z + rise * 2.2 * s.z - par.y * s.z) % 1500 + 1500) % 1500 - 210;
    if (y < sy + 6) return;
    const col = L > 0.5 ? (s.warm ? PAL.umber : PAL.slate) : (s.warm ? PAL.ecru : PAL.paper);
    const a = s.a * (L > 0.5 ? 0.5 : 1) * (s.z > 1 ? 1 : 1);
    c.globalAlpha = a * out * 0.9 + a * 0.1; c.drawImage(sprite(col), x - s.r * 2, y - s.r * 2, s.r * 4, s.r * 4); }); c.globalAlpha = 1; };
  snowDraw(false);

  // 5 · caustics just below the surface
  if (sy > 0) { const ca = smoothstep(43, 47, t) * 0.5; c.save(); c.lineWidth = 1.4;
    for (let k = 0; k < 14; k++) { const yb = sy + 14 + k * 11, fade = 1 - k / 14; c.strokeStyle = rgba(L > 0.5 ? '#FFFFFF' : '#C9DDE6', ca * fade); c.beginPath();
      for (let x = 0; x <= W; x += 24) { const yy = yb + Math.sin(x * 0.011 + t * 1.3 + k * 1.7) * 5 + Math.sin(x * 0.027 - t * 1.9 + k) * 3; x ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke(); }
    c.restore(); }

  // 6 · surface line
  if (sy > -10) { c.save(); c.strokeStyle = rgba(ink, 0.6); c.lineWidth = 1.6; c.beginPath();
    for (let x = 0; x <= W; x += 12) { const yy = sy + Math.sin(x * 0.012 + t * 1.4) * 2.5 + Math.sin(x * 0.031 - t * 2.1) * 1.2; x ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke();
    c.strokeStyle = rgba('#FFFFFF', 0.7 * L); c.lineWidth = 2; c.beginPath();
    for (let x = 0; x <= W; x += 12) { const yy = sy + 4 + Math.sin(x * 0.012 + t * 1.4) * 2.5; x ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke(); c.restore(); }

  // 7 · opening plumb line
  const plumbK = ramp(t, 0.6, 3.2), plumbOut = 1 - ramp(t, 4.6, 6.0);
  if (plumbOut > 0) { const px = 1500, py = lerp(0, 640, plumbK); c.save(); c.strokeStyle = rgba(PAL.fog, 0.7 * plumbOut); c.lineWidth = 1;
    c.beginPath(); c.moveTo(px, 0); c.lineTo(px, py); for (let k = 1; k * 64 < py; k++) { c.moveTo(px - 6, k * 64); c.lineTo(px + 6, k * 64); } c.stroke();
    c.strokeStyle = rgba(PAL.sienna, plumbK * plumbOut); c.lineWidth = 1.6; c.beginPath(); c.arc(px, py, 7, 0, Math.PI * 2); c.stroke(); c.restore();
    text(c, '412 m', px + 18, py + 5, { f: 'mono', size: 12, col: PAL.fog, a: plumbK * plumbOut }); }

  // 8 · stamps: copies at slightly different depths; later each finds its own shape
  const vary = ramp(t, 23, 31, EASE.rest);
  STAMPS.forEach(st => { const b = ramp(t, st.pass, st.pass + 0.45); if (b <= 0) return;
    const bloom = ramp(t, 33 + st.bloom * 6, 35 + st.bloom * 6); const px = -par.x * (st.z - 1) * 0.9, py = Math.sin(t * 0.8 + st.ph) * 6 * st.z;
    const r = 30 * b * lerp(1, st.grow, bloom) * st.z, a = st.amp * vary * (0.6 + 0.4 * Math.sin(t * 0.9 + st.ph)), rot = vary * (t - 23) * 0.25 * (st.rot > 0 ? 1 : -1);
    c.save(); c.globalAlpha = out * lerp(0.7, 1, st.z - 0.82); c.beginPath();
    for (let i = 0; i <= 72; i++) { const th = i / 72 * Math.PI * 2, rr = r * (1 + a * Math.sin(st.k * th + st.ph + rot)), x = st.cx + px + Math.cos(th) * rr, y = st.cy + py + Math.sin(th) * rr; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.closePath();
    const fillOp = bloom * lerp(0.12, 1, L);
    if (fillOp > 0.01) { const sg = c.createRadialGradient(st.cx + px - r * 0.3, st.cy + py - r * 0.35, r * 0.1, st.cx + px, st.cy + py, r * 1.2);
      sg.addColorStop(0, rgba(mix(st.col, '#FFFFFF', 0.35), fillOp)); sg.addColorStop(1, rgba(mix(st.col, PAL.umber, 0.18), fillOp)); c.fillStyle = sg; c.fill(); }
    c.strokeStyle = mix(mix(PAL.navy, PAL.fog, 0.55), mix(st.col, PAL.ink, L * 0.6), vary * 0.85); c.lineWidth = lerp(1.6, 2.2, vary); c.stroke(); c.restore(); });

  // 9 · ping rings + bearing ring
  const P = pos(t);
  for (const s of SC.sfx.filter(s => s.kind === 'ping')) { const dt = t - s.t; if (dt < 0 || dt > 2.6) continue;
    for (let k = 0; k < 3; k++) { const r = dt * 560 - k * 46; if (r <= 0) continue; c.strokeStyle = rgba(k ? PAL.vinaceous : PAL.sienna, s.gain * (1 - dt / 2.6) * (1 - k * 0.25));
      c.lineWidth = 2.4 - k * 0.5; c.beginPath(); c.arc(1900, 560, r, 0, Math.PI * 2); c.stroke(); } }
  const brg = win(t, 14.8, 21.4, 0.9, 0.9);
  if (brg > 0) { const R = 215, rot = (t - 14.8) * 0.03; c.save(); c.globalAlpha = brg * 0.75; c.strokeStyle = rgba(PAL.fog, 0.6); c.lineWidth = 1;
    c.beginPath(); c.arc(P.x, P.y, R, 0, Math.PI * 2); c.stroke(); c.strokeStyle = PAL.fog; c.beginPath();
    for (let i = 0; i < 72; i++) { const th = i / 72 * Math.PI * 2 + rot, l = i % 9 ? 6 : 14; c.moveTo(P.x + Math.cos(th) * R, P.y + Math.sin(th) * R); c.lineTo(P.x + Math.cos(th) * (R + l), P.y + Math.sin(th) * (R + l)); } c.stroke();
    [['000', -Math.PI / 2], ['090', 0], ['180', Math.PI / 2], ['270', Math.PI]].forEach(([lb, th]) => text(c, lb, P.x + Math.cos(th + rot) * (R + 34), P.y + Math.sin(th + rot) * (R + 34) + 4, { f: 'mono', size: 11, col: PAL.fog, a: 0.9, align: 'center' }));
    const bl = ramp(t, 15.3, 16.6), ex = lerp(P.x + 120, 1880, bl), ey = lerp(P.y - 4, 560, bl);
    c.setLineDash([6, 7]); c.strokeStyle = PAL.sienna; c.lineWidth = 1.4; c.beginPath(); c.moveTo(P.x + 120, P.y - 4); c.lineTo(ex, ey); c.stroke(); c.setLineDash([]);
    text(c, 'BRG 088', lerp(P.x + 140, 1560, 0.5), lerp(P.y - 4, 560, 0.5) - 14, { f: 'mono', size: 12, col: PAL.vinaceous, a: bl }); c.restore(); }

  // 10 · the first line, then the five streaks of its voice
  const trail = (t0, t1, off, wobF) => { const pts = []; for (let tt = t0; tt <= t1; tt += 1 / 60) { const p = pos(tt), v = vel(tt), m = Math.hypot(v.x, v.y) || 1, w = wobF ? wobF(tt) : 0;
    pts.push([p.x - v.y / m * (off + w), p.y + v.x / m * (off + w)]); } return pts; };
  const strokePts = (pts, col, w, a) => { if (pts.length < 2) return; c.strokeStyle = rgba(col, a); c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); };
  if (t > 22) strokePts(trail(22, Math.min(t, 31), 0, tt => (1 - ramp(tt, 22, 31)) * 16 * Math.sin(tt * 17) * Math.sin(tt * 5.3)), PAL.copper, 2.2, 0.9 * (1 - 0.75 * ramp(t, 33, 39)) * out);
  if (t > 31) { const cols = [PAL.copper, PAL.sage, PAL.peach, PAL.slate, PAL.sienna], spread = lerp(4, 13, ramp(t, 31, 36));
    cols.forEach((col, k) => strokePts(trail(31, Math.min(t, 52.4), (k - 2) * spread), col, 3.4 - k * 0.3, 0.92 * out)); }

  // 11 · bubbles from the blowhole on every note (and a gasp at the ping)
  c.save(); c.lineWidth = 1.6;
  for (const b of BUBBLES) { const dt = t - b.tb; if (dt < 0 || dt > b.life) continue; const o = blowhole(b.tb);
    const y = o.y - 120 * dt - 24 * dt * dt, x = o.x + b.dx * dt + Math.sin(dt * 5 + b.wob) * 6; if (y < sy + 4) continue;
    const r = b.r * (1 + 0.35 * dt), a = clamp(1 - dt / b.life) * out;
    c.strokeStyle = rgba(ink, 0.75 * a); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
    c.fillStyle = rgba(L > 0.5 ? '#FFFFFF' : PAL.paper, 0.8 * a); c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, Math.PI * 2); c.fill(); }
  c.restore();

  // 12 · breach: splash, rings and the signature arch
  const tb = 49.55;
  if (t > tb && t < 53.6) { const R = rng(99), dt = t - tb;
    for (let i = 0; i < 34; i++) { const vx = (R() - 0.5) * 520, vy = -(300 + R() * 380), r = 2.5 + R() * 4, d0 = R() * 0.15, tt = dt - d0; if (tt < 0) continue;
      const x = 1580 + vx * tt, y = SURF + vy * tt + 900 * tt * tt; if (y > SURF + 4) continue;
      c.fillStyle = rgba(i % 3 ? PAL.glaucous : PAL.ink, clamp(1 - tt / 1.4)); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
    for (const [t0, x0, s0] of [[tb, 1580, 1], [51.05, 1668, 0.7]]) { const d = t - t0; if (d < 0 || d > 2.2) continue;
      for (let k = 0; k < 3; k++) { const rx = (d * 260 + k * 26) * s0; c.strokeStyle = rgba(PAL.ink, (1 - d / 2.2) * 0.6); c.lineWidth = 1.3; c.beginPath(); c.ellipse(x0, SURF + 2, rx, rx * 0.11, 0, 0, Math.PI * 2); c.stroke(); } } }
  const sigK = ramp(t, 50.3, 52.8);
  if (sigK > 0) { [PAL.copper, PAL.sage, PAL.peach, PAL.slate, PAL.sienna].forEach((col, k) => { const o = k * 13;
    const p0 = [1606 - o * 0.2, 150 + o], c1 = [1430 - o, 10 + o], c2 = [1130 - o, 60 + o], p3 = [880 - o * 1.6, 255 + o * 0.5];
    const pts = []; for (let i = 0; i <= 80 * sigK; i++) { const u = i / 80, a = (1 - u) ** 3, bb = 3 * (1 - u) ** 2 * u, cc = 3 * (1 - u) * u * u, d = u ** 3;
      pts.push([a * p0[0] + bb * c1[0] + cc * c2[0] + d * p3[0], a * p0[1] + bb * c1[1] + cc * c2[1] + d * p3[1]]); }
    strokePts(pts, col, 3.4 - k * 0.3, lerp(0.95, 0.55, ramp(t, 54, 56))); }); }

  // 13 · ghost frames, then the whale
  const sg = song(t), v = vel(t), sp = Math.hypot(v.x, v.y);
  const swim = dist(t) / 58 + t * 2.6, ampT = 0.30 + 0.16 * clamp(sp / 300);
  const gh = win(t, 22.4, 32.5, 0.8, 1.2) * out;
  if (gh > 0) for (let k = 5; k >= 1; k--) { const tt = t - k * 0.11, q = pos(tt);
    drawWhale(c, { x: q.x, y: q.y, ang: heading(tt), scale: scaleAt(tt), L, stroke: PAL.peach, ghost: true, sw: 2, alpha: gh * (0.44 - k * 0.07), tail: Math.sin(dist(tt) / 58 + tt * 2.6) * ampT }); }
  let blink = 0; for (const b of [9.5, 14.7, 15.05, 26.2, 41.2, 57.6]) blink = Math.max(blink, 1 - Math.abs(t - b - 0.08) / 0.08);
  const quiet = 1 - ramp(t, 14.6, 16.0);
  const eye = lerp(lerp(1, 1.34, win(t, 14.6, 17.4, 0.2, 1.2)), 0.88, quiet * 0.9);
  const flinch = win(t, 14.5, 15.1, 0.06, 0.45);
  const stroke = mix(mix(mix(PAL.navy, PAL.fog, 0.62), PAL.paper, 1 - quiet), PAL.ink, L);
  const squash = -0.07 * win(t, 49.1, 49.9, 0.2, 0.3) + 0.08 * win(t, 50.95, 51.5, 0.12, 0.3) + 0.07 * flinch - 0.04 * sg.env;
  const spray = Math.max(win(t, 49.7, 51.2, 0.15, 0.6), 0.85 * win(t, 56.5, 57.7, 0.15, 0.6));
  const ang = heading(t) - 0.09 * sg.env - 0.12 * flinch + Math.sin(swim) * 0.05;   // head lifts to sing; body counter-sways with the tail
  drawWhale(c, { x: P.x, y: P.y, ang, scale: scaleAt(t) * (1 + 0.05 * sg.env), L, stroke, tail: Math.sin(swim) * ampT, fin: Math.sin(swim + 1.3) * 0.32,
    eye, blink: Math.max(blink, quiet * 0.42), mouth: sg.env, spray, sprayColor: L > 0.5 ? PAL.copper : PAL.paper, squash, blush: ramp(t, 36, 44) });

  // 14 · near plane: big soft motes passing in front (depth of field)
  snowDraw(true);
  c.restore();   // end dolly

  // 15 · vignette + static grain
  const vg = c.createRadialGradient(960, 540, 300, 960, 540, 1150); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${lerp(0.42, 0.08, L).toFixed(3)})`);
  c.fillStyle = vg; c.fillRect(0, 0, W, H);
  c.globalAlpha = lerp(0.55, 0.4, L); const gp = c.createPattern(grain(), 'repeat'); c.fillStyle = gp; c.fillRect(0, 0, W, H); c.globalAlpha = 1;

  // 16 · chrome: acts, captions, song meter, depth gauge, title and end cards
  for (const [a, b, lb] of [[5.6, 14.2, 'I · The deep'], [14.6, 21.8, 'II · A sounding'], [22.2, 32.8, 'III · First notes'], [33.2, 46.0, 'IV · The voice'], [46.4, 53.0, 'V · Surfacing']]) {
    const o = win(t, a, b, 0.5, 0.5); if (o > 0) text(c, lb, 160, 150, { f: 'mono', size: 14, col: soft, a: o }); }
  for (const cp of SC.captions) { const o = win(t, cp.t, cp.e, 0.55, 0.5); if (o <= 0) continue; const dy = (1 - EASE.defer(clamp((t - cp.t) / 0.55))) * 10;
    text(c, cp.text, 160, 214 + dy, { f: 'disp', size: 56, col: ink, accent: accentCol(t), a: o }); }
  const mo = ramp(t, 5.4, 6.4) * out;
  if (mo > 0) { const x0 = 160, y0 = 912, w = 360, h = 78; c.save(); c.globalAlpha = mo; c.strokeStyle = rgba(soft, 0.45); c.lineWidth = 1; c.strokeRect(x0, y0, w, h);
    text(c, 'Song', x0, y0 - 14, { f: 'mono', size: 12, col: soft });
    text(c, sg.env > 0.05 ? Math.round(sg.f) + ' Hz' : 'Silent', x0 + w, y0 - 14, { f: 'mono', size: 12, col: sg.env > 0.05 ? accentCol(t) : soft, align: 'right' });
    const harm = ramp(t, 30, 45); c.strokeStyle = sg.env > 0.05 ? accentCol(t) : soft; c.lineWidth = 2; c.beginPath();
    for (let i = 0; i <= 160; i++) { const x = i / 160, cyc = (sg.f || 200) / 40, tp = Math.sin(Math.PI * x);
      const yv = sg.env * tp * (Math.sin(2 * Math.PI * cyc * x - t * 9) + 0.35 * harm * Math.sin(2 * Math.PI * cyc * 2.01 * x - t * 13) + 0.18 * harm * Math.sin(2 * Math.PI * cyc * 3.02 * x + t * 7)) / (1 + 0.53 * harm);
      const px = x0 + 8 + x * (w - 16), py = y0 + h / 2 - yv * (h / 2 - 8); i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); c.restore(); }
  const go = ramp(t, 1.0, 2.6) * out;
  if (go > 0) { const gx = 1812, g0 = 190, g1 = 880, ym = d => lerp(g0, g1, d / 420); c.save(); c.globalAlpha = go; c.strokeStyle = rgba(soft, 0.6); c.lineWidth = 1; c.beginPath();
    c.moveTo(gx, g0); c.lineTo(gx, g1); for (let d = 0; d <= 420; d += 20) { c.moveTo(gx - (d % 100 ? 5 : 11), ym(d)); c.lineTo(gx, ym(d)); } c.stroke();
    for (let d = 0; d <= 400; d += 100) text(c, String(d), gx - 18, ym(d) + 4, { f: 'mono', size: 11, col: soft, a: 0.8, align: 'right' });
    c.fillStyle = accentCol(t); c.beginPath(); c.moveTo(gx + 3, ym(depth)); c.lineTo(gx + 15, ym(depth) - 7); c.lineTo(gx + 15, ym(depth) + 7); c.closePath(); c.fill();
    text(c, 'Depth ' + Math.round(depth) + ' m', 1824, 150, { f: 'mono', size: 14, col: soft, align: 'right' }); c.restore(); }
  if (sy > -10) text(c, 'Surface · 0 m', 160, sy - 16, { f: 'mono', size: 12, col: soft, a: ramp(t, 46, 47.5) * out });
  const tc = win(t, 0.8, 5.2, 0.9, 0.8);
  if (tc > 0) { const dy = (1 - EASE.glaser(clamp((t - 0.8) / 1.2))) * 16;
    text(c, 'CETI · A short film', 160, 452, { f: 'mono', size: 16, col: PAL.fog, a: tc });
    text(c, 'Little whale', 160, 590 + dy, { f: 'disp', size: 156, col: PAL.paper, a: tc });
    text(c, 'Wada · 279 / 296 / 166', 160, 660, { f: 'mono', size: 13, col: PAL.vinaceous, a: tc * 0.9 }); }
  const ec = ramp(t, 54.4, 55.8);
  if (ec > 0) { const s = k => ramp(t, 54.4 + k * 0.18, 55.6 + k * 0.18);
    text(c, 'CETI · Little whale', 160, 452, { f: 'mono', size: 16, col: PAL.slate, a: s(0) });
    text(c, 'Find your <i>song</i>.', 160, 590 + (1 - s(1)) * 14, { f: 'disp', size: 132, col: PAL.ink, accent: PAL.sienna, a: s(1) });
    c.save(); c.globalAlpha = s(2); c.translate(160, 664); c.scale(0.6, 0.6); c.strokeStyle = PAL.ink; c.lineWidth = 2; c.lineCap = 'round'; c.lineJoin = 'round'; WHALE_MARK.forEach(p => c.stroke(p)); c.restore();
    text(c, 'cetiai.co', 240, 692, { f: 'mono', size: 14, col: PAL.slate, a: s(2) }); }
  const fb = 1 - ramp(t, 0, 0.7, EASE.warm); if (fb > 0) { c.fillStyle = rgba('#0B0E16', fb); c.fillRect(0, 0, W, H); }
  c.restore();
}

root.FILM2 = { drawFrame, DUR, W, H, pos, heading, scaleAt, STAMPS, BUBBLES, fps: 60 };
})(typeof window !== 'undefined' ? window : globalThis);
