// The little whale — character rig, part of Kinetic Hydrography (first drawn in "Little whale", v2 volume model).
// Canvas only. Every colour is a mix of registered tokens (no literals): back/flank/belly come from Light Glaucous Blue.
(function (root) {
'use strict';
const KH = root.KH, { CETI: C, W: WD, clamp, mix, rgba } = KH;
const P2 = s => new root.Path2D(s);
let G = null;
const geo = () => G || (G = {
  BODY: P2('M118,8 C120,-36 96,-64 54,-66 C12,-68 -36,-54 -70,-31 C-88,-20 -102,-13 -110,-9 L-110,7 C-98,12 -80,24 -48,41 C-14,57 40,60 78,50 C108,42 117,30 118,8 Z'),
  FLUKE: P2('M0,-5 C-14,-10 -30,-28 -52,-40 C-47,-23 -42,-10 -33,0 C-42,10 -47,23 -52,40 C-30,28 -14,10 0,5 Z'),
  FIN: P2('M0,0 C11,16 4,40 -18,52 C-18,33 -16,16 -9,2 Z'),
  PLEATS: [P2('M30,49 Q62,46 92,36'), P2('M42,55 Q72,52 102,42')],
});
// o: x, y, ang, scale, L (0 deep … 1 light), stroke, tail, fin, eye, blink, mouth, spray, squash, blush, alpha, sw, ghost
function drawWhale(c, o) {
  const g = geo(), L = o.L ?? 1, gl = WD.lightGlaucousBlue;
  const back = mix(mix(C.navy, C.slate, 0.4), mix(gl, C.slate, 0.42), L), mid = mix(mix(C.navy, C.slate, 0.25), gl, L), belly = mix(mix(C.navy, C.slate, 0.55), mix(gl, KH.NEUTRALS.white, 0.62), L);
  const st = o.stroke ?? mix(C.paper, C.navy, L), sw = o.sw ?? 3.2;
  c.save(); c.globalAlpha *= o.alpha ?? 1; c.translate(o.x, o.y); c.rotate(o.ang || 0);
  const sq = o.squash || 0; c.scale(o.scale * (1 + sq), o.scale * (1 - sq));
  c.lineJoin = 'round'; c.lineCap = 'round'; c.lineWidth = sw; c.strokeStyle = st;
  if (!o.ghost) { c.save(); c.translate(6, 36); c.rotate((o.fin || 0) * -0.8 - 0.35); c.scale(0.8, 0.8); c.fillStyle = mix(back, C.navy, 0.3); c.fill(g.FIN); c.lineWidth = sw * 0.8; c.stroke(g.FIN); c.restore(); }
  c.save(); c.translate(-109, -1); c.rotate(o.tail || 0); c.fillStyle = o.ghost ? 'rgba(0,0,0,0)' : mix(back, mid, 0.4); c.fill(g.FLUKE); c.stroke(g.FLUKE); c.restore();
  if (!o.ghost) { const gr = c.createLinearGradient(0, -66, 0, 58); gr.addColorStop(0, back); gr.addColorStop(0.55, mid); gr.addColorStop(1, belly); c.fillStyle = gr; c.fill(g.BODY);
    c.save(); c.clip(g.BODY); const hg = c.createRadialGradient(36, -50, 2, 36, -50, 62); hg.addColorStop(0, rgba(KH.NEUTRALS.white, 0.1 + 0.28 * L)); hg.addColorStop(1, rgba(KH.NEUTRALS.white, 0));
      c.fillStyle = hg; c.beginPath(); c.ellipse(36, -48, 70, 24, -0.08, 0, Math.PI * 2); c.fill(); c.restore(); }
  c.stroke(g.BODY);
  c.save(); c.lineWidth = sw * 0.42; c.globalAlpha *= 0.65; g.PLEATS.forEach(p => c.stroke(p)); c.restore();
  if ((o.blush || 0) > 0.01) { c.fillStyle = rgba(WD.grenadinePink, 0.38 * o.blush); c.beginPath(); c.ellipse(86, 12, 13, 7, 0, 0, Math.PI * 2); c.fill(); }
  const er = 8.5 * (o.eye ?? 1), bl = clamp(1 - (o.blink || 0), 0.08, 1) * (1 - 0.45 * (o.focus || 0)), dl = o.delight || 0;
  if (dl > 0.5) { c.save(); c.translate(70, -12); c.lineWidth = sw * 0.9; c.beginPath(); c.arc(0, 3, er * 0.95, Math.PI * 1.12, Math.PI * 1.88); c.stroke(); c.restore(); }
  else { c.save(); c.translate(70, -14); c.scale(1, bl); c.fillStyle = st; c.beginPath(); c.arc(0, 0, er, 0, Math.PI * 2); c.fill();
    c.fillStyle = L > 0.5 ? C.paper : C.navy; c.beginPath(); c.arc(er * 0.3, -er * 0.35, er * 0.3, 0, Math.PI * 2); c.fill(); c.restore();
    if ((o.focus || 0) > 0.05) { c.save(); c.lineWidth = sw * 0.8; c.globalAlpha *= o.focus; c.beginPath(); c.moveTo(58, -28); c.lineTo(80, -25); c.stroke(); c.restore(); } }
  const m = o.mouth || 0;
  if (m < 0.04) { c.save(); c.lineWidth = sw * 0.8; c.beginPath(); c.moveTo(117, 18); c.quadraticCurveTo(104, 27, 88, 25); c.stroke(); c.restore(); }
  else { c.beginPath(); c.moveTo(117, 16); c.quadraticCurveTo(104, 25 + m * 3, 88, 25); c.quadraticCurveTo(101, 27 + m * 15, 115, 20 + m * 6); c.closePath(); c.fillStyle = st; c.fill(); c.lineWidth = sw * 0.7; c.stroke(); }
  c.save(); c.translate(22, 38); c.rotate(o.fin || 0); c.fillStyle = o.ghost ? 'rgba(0,0,0,0)' : mid; c.fill(g.FIN); c.stroke(g.FIN); c.restore();
  const sk = o.spark || 0;
  if (sk > 0.02) { c.save(); c.strokeStyle = o.sparkColor || WD.rawSienna; c.lineWidth = sw * 0.9; c.lineCap = 'round';
    const ss = o.sparkScale || 1, cx = 52, cy = -128 - 20 * (ss - 1), r0 = (18 + 10 * sk) * ss, r1 = r0 + 24 * ss * Math.min(1, sk * 1.6);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 - Math.PI / 2; c.globalAlpha = (o.alpha ?? 1) * clamp(sk * 2) * (k % 2 ? 0.7 : 1);
      c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.stroke(); }
    c.globalAlpha = (o.alpha ?? 1) * clamp(sk * 2); c.fillStyle = o.sparkColor || WD.rawSienna; c.beginPath(); c.arc(cx, cy, (5 + 3 * sk) * (o.sparkScale || 1), 0, Math.PI * 2); c.fill(); c.restore(); }
  const sp = o.spray || 0;
  if (sp > 0.02) { const Ls = 76 * sp; c.save(); c.strokeStyle = o.sprayColor || st; c.fillStyle = o.sprayColor || st; c.lineWidth = sw * 0.8; c.globalAlpha *= clamp(sp * 1.4);
    for (const a of [-0.55, -0.2, 0.15, 0.5]) { const x2 = 40 + Math.sin(a) * Ls * 1.1, y2 = -68 - Math.cos(a) * Ls;
      c.beginPath(); c.moveTo(40, -68); c.quadraticCurveTo(40 + Math.sin(a) * Ls * 0.4, -68 - Ls * 0.9, x2, y2); c.stroke();
      c.beginPath(); c.arc(x2 + Math.sin(a) * 9, y2 + 6, sw * 0.6, 0, Math.PI * 2); c.fill(); }
    c.restore(); }
  c.restore();
}
// AI pod — the whale's helpers. A teardrop with a notch tail and one eye; colour = the job it carries.
function drawPod(c, x, y, ang, size, col, o = {}) {
  c.save(); c.globalAlpha *= o.alpha ?? 1; c.translate(x, y); c.rotate(ang); const s = size / 40; c.scale(s, s);
  c.beginPath(); c.moveTo(20, 0); c.bezierCurveTo(20, -13, 6, -16, -6, -12); c.bezierCurveTo(-14, -9, -18, -4, -22, -1);
  c.lineTo(-30, -9); c.lineTo(-27, 0); c.lineTo(-30, 9); c.lineTo(-22, 1); c.bezierCurveTo(-18, 6, -10, 13, 2, 13); c.bezierCurveTo(14, 13, 20, 8, 20, 0); c.closePath();
  c.fillStyle = col; c.fill(); c.lineWidth = 2.4 / s * Math.min(1, s * 1.6); c.strokeStyle = o.ink || C.navy; c.lineJoin = 'round'; c.stroke();
  c.fillStyle = o.ink || C.navy; c.beginPath(); c.arc(9, -3, 2.6, 0, Math.PI * 2); c.fill();
  if (o.glow) { c.globalAlpha *= o.glow; c.strokeStyle = col; c.lineWidth = 2 / s; c.beginPath(); c.arc(0, 0, 30, 0, Math.PI * 2); c.stroke(); }
  c.restore();
}
KH.drawWhale = drawWhale; KH.drawPod = drawPod;
})(typeof window !== 'undefined' ? window : globalThis);
