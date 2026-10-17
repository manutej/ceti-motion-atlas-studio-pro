// Whale Line — a reusable film format in Kinetic Hydrography 1.0.0.
// One line of thinking draws the sea; the little whale swims under it and hops onto each key word on the beat.
// makeFilm(story) -> { drawFrame(ctx, t), cues(), READ, DUR, fps, shutter(t) }. drawFrame is a pure function of t.
(function (root) {
'use strict';
const KH = root.KH, { CETI: C, W: WD, clamp, lerp, smoothstep, win, EASE, ramp, rng, mix, rgba, text, whaleMark } = KH;

function makeFilm(S) {
  const W = 1920, H = 1080, B = 60 / (S.bpm || 120), N = S.stations.length;
  const CYCLE = (S.cycleBeats || 6) * B, KT = CYCLE / 3, HOP = 0.62 * KT, SIT = 1.2 * KT, DIVE = 0.5 * KT, T_IN = S.intro || 3.0, AIR = S.medium === 'air', land = i => T_IN + i * CYCLE, T_OUT = land(N - 1) + SIT + DIVE, DUR = S.duration || T_OUT + 10;
  const GAP = 1150, X0 = 900, xs = i => X0 + i * GAP, X_END = xs(N - 1) + 1500, X_START = -900;
  const yLine = x => 26 * Math.sin(x * 0.0021) + 14 * Math.sin(x * 0.0053 + 1.3);
  const WS = S.wordSize || 112, SCALE = 0.56, WATER = 40;
  const combo = KH.WADA[S.wada].map(([, h]) => h);
  const accent = i => combo[i % combo.length];
  const INK = C.navy, SOFT = C.slate;
  const wordBase = i => yLine(xs(i)) - 70;

  // ---------- the line tip (draws ahead of the whale; drawing it fills the sea behind it) ----------
  const TIP = [[0.25, X_START], [Math.min(2.1, T_IN - 0.6), xs(0) + 240]];
  for (let i = 0; i < N - 1; i++) TIP.push([land(i) + 0.9 * KT, xs(i) + 240], [land(i) + 1.6 * KT, xs(i + 1) + 240]);
  TIP.push([T_OUT - 0.4, xs(N - 1) + 240], [T_OUT + 1.6, X_END + 300]);
  function tipX(t) { if (t <= TIP[0][0]) return X_START; for (let k = 1; k < TIP.length; k++) if (t <= TIP[k][0]) { const [t0, x0] = TIP[k - 1], [t1, x1] = TIP[k];
    return t1 === t0 ? x1 : lerp(x0, x1, EASE.glaser(clamp((t - t0) / (t1 - t0)))); } return TIP[TIP.length - 1][1]; }

  // ---------- the whale's path: swim, hop, sit, dive ----------
  let WORDW = null;   // word widths, measured once
  const wordTop = i => wordBase(i) - WS * 0.76;
  const sitY = i => wordTop(i) - 36;
  const under = x => yLine(x) + (AIR ? 52 : WATER);
  const arc = (x0, y0, x1, y1, Hh, u) => ({ x: lerp(x0, x1, u), y: lerp(y0, y1, u) - Hh * 4 * u * (1 - u) });
  function wpos(t) {
    if (t < land(0) - HOP) { const u = EASE.warm(clamp((t - 0.4) / (land(0) - HOP - 0.4))), x = lerp(-700, xs(0) - 260, u); return { x, y: under(x), ph: 'swim' }; }
    for (let i = 0; i < N; i++) {
      const L0 = land(i), tx = xs(i) - 260, ex = xs(i) + 330;
      if (t < L0) { const u = clamp((t - (L0 - HOP)) / HOP); return { ...arc(tx, under(tx), xs(i), sitY(i), 150, u), ph: 'hop', i }; }
      if (t < L0 + SIT) { const dip = 10 * (1 - ramp(t, L0, L0 + 0.4 * KT)); return { x: xs(i), y: sitY(i) + dip + Math.sin((t - L0) * 5) * 2, ph: 'sit', i }; }
      if (t < L0 + SIT + DIVE) { const u = clamp((t - L0 - SIT) / DIVE); return { ...arc(xs(i), sitY(i), ex, under(ex), 110, u), ph: 'dive', i }; }
      if (i < N - 1 && t < land(i + 1) - HOP) { const u = EASE.warm(clamp((t - L0 - SIT - DIVE) / (CYCLE - SIT - DIVE - HOP))), x = lerp(ex, xs(i + 1) - 260, u); return { x, y: under(x), ph: 'swim', i }; }
    }
    const e0 = xs(N - 1) + 330, b0 = xs(N - 1) + 720, b1 = xs(N - 1) + 1260, rest = X_END - 120;
    if (t < T_OUT + 0.6) { const u = EASE.warm(clamp((t - T_OUT) / 0.6)), x = lerp(e0, b0, u); return { x, y: under(x), ph: 'swim' }; }
    if (t < T_OUT + 1.6) { const u = clamp((t - T_OUT - 0.6) / 1.0); return { ...arc(b0, under(b0), b1, under(b1), 400, u), ph: 'breach' }; }
    const u = EASE.rest(clamp((t - T_OUT - 1.6) / 1.6)), x = lerp(b1, rest, u);
    return { x, y: lerp(under(x), AIR ? under(x) : yLine(x) + 6, ramp(t, T_OUT + 2.2, T_OUT + 3.4)) + Math.sin(t * 2.2) * 3, ph: 'float' };
  }
  const wvel = t => { const a = wpos(t - 1 / 240), b = wpos(t + 1 / 240); return { x: (b.x - a.x) * 120, y: (b.y - a.y) * 120 }; };
  function heading(t) { 
    return headRaw(t); }
  function headRaw(t) { let a = 0, s = 0; for (let k = -8; k <= 8; k++) { const tt = t + k * 0.022, p = wpos(tt), w = 1 - Math.abs(k) / 9;
      let h = 0; if (p.ph !== 'sit' && p.ph !== 'float') { const v = wvel(tt); h = clamp(Math.atan2(v.y, Math.max(1, Math.abs(v.x))), -0.95, 0.95); } a += h * w; s += w; } return a / s; }

  // ---------- camera: follows the whale with a lead, then pulls out to show the whole line ----------
  const zf = (W - 260) / (X_END + 300 - (xs(0) - 520));
  const xmid = ((xs(0) - 520) + (X_END + 300)) / 2;
  function cam(t) {
    let fx = 0, fy = 0, s = 0; for (let k = 0; k <= 8; k++) { const w = 1 - k / 9, p = wpos(t - k * 0.045); fx += p.x * w; fy += yLine(p.x) * w; s += w; }
    fx = fx / s + 150; fy /= s;
    const k = ramp(t, T_OUT + 1.8, T_OUT + 4.6, EASE.rest);
    return { x: lerp(fx, xmid, k), y: lerp(fy, 0, k), z: lerp(1, zf, k), ax: lerp(900, 960, k), ay: lerp(640, 640, k), k };
  }

  // ---------- seeded water content ----------
  const MOTES = []; { const R = rng(31); for (let i = 0; i < 260; i++) MOTES.push({ x: X_START + R() * (X_END + 600 - X_START), d: 30 + R() * 520, r: 1 + R() * 2.6, ph: R() * 6.28 }); }
  const SPL = []; { for (let i = 0; i < N; i++) { SPL.push({ t: land(i) - HOP, x: xs(i) - 260, s: 0.8 }); SPL.push({ t: land(i) + SIT + DIVE, x: xs(i) + 330, s: 1 }); }
    SPL.push({ t: T_OUT + 0.6, x: xs(N - 1) + 720, s: 1.4 }, { t: T_OUT + 1.6, x: xs(N - 1) + 1260, s: 1.6 }); }

  function drawFrame(c, t) {
    t = clamp(t, 0, DUR);
    if (!WORDW) { c.save(); c.font = `${WS}px ${KH.FONTS.disp}`; if ('letterSpacing' in c) c.letterSpacing = `${(-WS * 0.02).toFixed(1)}px`; WORDW = S.stations.map(s => c.measureText(s.word).width); c.restore(); }
    const cm = cam(t), z = cm.z, X = x => (x - cm.x) * z + cm.ax, Y = y => (y - cm.y) * z + cm.ay;
    const tip = tipX(t), visL = cm.x - (cm.ax + 40) / z, visR = cm.x + (W - cm.ax + 40) / z;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
    c.fillStyle = C.paper; c.fillRect(0, 0, W, H);

    // the sea: exists only where the line has been drawn
    const x0 = Math.max(X_START, visL), x1 = Math.min(tip, visR);
    if (x1 > x0 && !AIR) {
      const pts = []; for (let x = x0; x <= x1; x += 10 / z) pts.push([X(x), Y(yLine(x))]); pts.push([X(x1), Y(yLine(x1))]);
      const g = c.createLinearGradient(0, Y(0) - 30 * z, 0, H); g.addColorStop(0, rgba(WD.lightGlaucousBlue, 0.42)); g.addColorStop(1, rgba(mix(WD.lightGlaucousBlue, WD.darkTyrianBlue, 0.45), 0.42));
      c.beginPath(); c.moveTo(pts[0][0], H + 10); pts.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(pts[pts.length - 1][0], H + 10); c.closePath(); c.fillStyle = g; c.fill();
      c.save(); c.clip();
      // motes (depth: deeper = smaller, slower)
      for (const m of MOTES) { if (m.x < x0 - 50 || m.x > x1 + 50) continue; const yy = yLine(m.x) + m.d + Math.sin(t * 0.6 + m.ph) * 8, xx = m.x + Math.sin(t * 0.4 + m.ph) * 10;
        c.fillStyle = rgba(WD.darkTyrianBlue, 0.22 * (1 - m.d / 600)); c.beginPath(); c.arc(X(xx), Y(yy), m.r * Math.max(z, 0.5), 0, Math.PI * 2); c.fill(); }
      // caustic dashes under the surface
      c.strokeStyle = rgba(KH.NEUTRALS.white, 0.55); c.lineWidth = 1.6;
      for (let k = 0; k < 3; k++) { c.beginPath(); let on = false;
        for (let x = x0; x <= x1; x += 8 / z) { const ph = Math.sin(x * 0.02 + t * 1.6 + k * 2.1); const y = yLine(x) + 16 + k * 14 + Math.sin(x * 0.013 - t * 1.2 + k) * 4;
          if (ph > 0.55) { on ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y)); on = true; } else on = false; } c.stroke(); }
      c.restore();
    }
    // splashes: droplets and rings where the whale leaves or enters the water
    for (const s of (AIR ? [] : SPL)) { const d = t - s.t; if (d < 0 || d > 1.3) continue; const R = rng(Math.round(s.x)), y0 = yLine(s.x);
      for (let i = 0; i < 12 * s.s; i++) { const vx = (R() - 0.5) * 380 * s.s, vy = -(220 + R() * 300) * s.s, tt = d - R() * 0.06; if (tt < 0) continue;
        const x = s.x + vx * tt, y = y0 + vy * tt + 1100 * tt * tt; if (y > y0 + 4) continue;
        c.fillStyle = rgba(i % 3 ? WD.lightGlaucousBlue : INK, clamp(1 - tt / 0.9)); c.beginPath(); c.arc(X(x), Y(y), (2 + R() * 3) * Math.max(z, 0.6), 0, Math.PI * 2); c.fill(); }
      for (let k = 0; k < 2; k++) { const rx = (d * 240 + k * 24) * s.s * z; c.strokeStyle = rgba(INK, (1 - d / 1.3) * 0.5); c.lineWidth = 1.2; c.beginPath(); c.ellipse(X(s.x), Y(y0) + 2, rx, rx * 0.12, 0, 0, Math.PI * 2); c.stroke(); } }

    // the one line
    if (tip > X_START) { const a = Math.max(X_START, visL - 20), b = Math.min(tip, visR + 20);
      if (b > a) { c.strokeStyle = INK; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
        for (let x = a; x <= b; x += 6 / z) { x === a ? c.moveTo(X(x), Y(yLine(x))) : c.lineTo(X(x), Y(yLine(x))); } c.lineTo(X(b), Y(yLine(b))); c.stroke(); }
      if (tip < X_END + 300) { const pulse = Math.exp(-((t % B) / B) * 4); c.fillStyle = accent(0); c.beginPath(); c.arc(X(tip), Y(yLine(tip)), 7 + 3 * pulse, 0, Math.PI * 2); c.fill(); } }

    // the words: outline when the line reaches them, lit when the whale lands
    S.stations.forEach((st, i) => {
      const xi = xs(i), wv = WORDW[i]; if (X(xi + wv) < -50 || X(xi - wv) > W + 50) return;
      const shown = ramp(t, TIP_AT(i), TIP_AT(i) + 0.35, EASE.glaser); if (shown <= 0) return;
      const lit = t >= land(i) ? ramp(t, land(i), land(i) + 0.28, EASE.glaser) : 0, dip = t >= land(i) ? 10 * (1 - ramp(t, land(i), land(i) + 0.4)) : 0;
      const wz = Math.max(z, 0.38), bx = X(xi), by = Y(yLine(xi) + dip) - 70 * wz, size = WS * wz;
      c.save(); c.translate(bx, by + (1 - shown) * 18 * wz); c.globalAlpha = shown;
      text(c, st.word, 0, 0, { f: 'disp', size, col: rgba(INK, 0.5), align: 'center', stroke: 1.2 });
      if (lit > 0) { c.save(); c.beginPath(); c.rect(-wv * wz / 2 - 10, -size, (wv * wz + 20) * lit, size * 1.4); c.clip(); text(c, st.word, 0, 0, { f: 'disp', size, col: INK, align: 'center' }); c.restore();
        // swash underline in the station colour
        const u = ramp(t, land(i) + 0.05, land(i) + 0.45, EASE.glaser), hw = wv * wz / 2 + 12 * wz; c.strokeStyle = accent(i); c.lineWidth = Math.max(2.5, 6 * wz); c.lineCap = 'round'; c.beginPath();
        for (let k = 0; k <= 40 * u; k++) { const q = k / 40, x = -hw + 2 * hw * q, y = 18 * wz + Math.sin(q * Math.PI) * 6 * wz; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
      c.restore();
      // the gloss, under the line, in the water
      const gr = READ[i + 1], ga = win(t, gr.in, gr.out, gr.fi, gr.fo) * (1 - cm.k);
      if (ga > 0) { const gy = Y(yLine(xi) + (AIR ? 150 : 104));
        if (!AIR) { // never text on water: the gloss sits on a paper label (navy on paper, ~14:1)
          c.save(); c.font = `16px ${KH.FONTS.mono}`; if ('letterSpacing' in c) c.letterSpacing = '3.2px'; const tw = c.measureText(st.sub.toUpperCase()).width; c.restore();
          c.save(); c.globalAlpha = ga; c.fillStyle = C.paper; c.strokeStyle = rgba(INK, 0.25); c.lineWidth = 1; c.beginPath(); c.roundRect(X(xi) - tw / 2 - 18, gy - 24, tw + 36, 36, 18); c.fill(); c.stroke(); c.restore(); }
        text(c, st.sub, X(xi), gy, { f: 'mono', size: 16, col: AIR ? C.slate : INK, a: ga, align: 'center' }); }
    });

    // the little whale
    const p = wpos(t), ang = heading(t), sp = Math.hypot(...Object.values(wvel(t)));
    const sitting = p.ph === 'sit', airborne = p.ph === 'hop' || p.ph === 'dive' || p.ph === 'breach';
    const tailF = sitting ? 3 : 10, tailA = sitting ? 0.12 : airborne ? 0.08 : 0.34;
    let squash = 0; for (let i = 0; i < N; i++) { const d = t - land(i); if (d >= 0 && d < 0.3) squash = Math.max(squash, 0.13 * (1 - EASE.glaser(d / 0.3))); }
    if (p.ph === 'hop') squash = -0.06 * Math.sin(Math.PI * clamp((t - (land(p.i) - HOP)) / HOP));
    let blink = 0; for (let i = 0; i < N; i++) blink = Math.max(blink, 1 - Math.abs(t - land(i) - 0.8) / 0.07);
    const spray = Math.max(win(t, T_OUT + 0.95, T_OUT + 1.5, 0.12, 0.3), S.spoutT ? win(t, S.spoutT, S.spoutT + 1.1, 0.15, 0.5) : 0);
    const mouth = sitting ? 0.55 * win(t, land(p.i) + 0.05, land(p.i) + 0.6, 0.08, 0.25) : 0;
    KH.drawWhale(c, { x: X(p.x), y: Y(p.y), ang, scale: SCALE * Math.max(z, 0.45), L: 1, tail: Math.sin(t * tailF) * tailA, fin: Math.sin(t * tailF + 1.3) * (sitting ? 0.15 : 0.32), eye: sitting ? 1.12 : 1,
      blink, squash, spray, sprayColor: accent(1), mouth, blush: 0.6, sw: 3.2 });
    // a water line over the swimming whale keeps it IN the sea (only while under the surface)
    if (AIR) { const cols = [accent(0), accent(1), accent(3)]; for (let k = 0; k < 3; k++) { const pts = [];
        for (let j = 0; j <= 14; j++) { const tt = t - j * 0.018, q = wpos(tt), hh = heading(tt); pts.push([X(q.x - Math.cos(hh) * 62 * SCALE / 0.56) , Y(q.y - Math.sin(hh) * 62 * SCALE / 0.56 + (k - 1) * 9)]); }
        const len = Math.hypot(pts[0][0] - pts[14][0], pts[0][1] - pts[14][1]); if (len < 18) continue;
        c.strokeStyle = rgba(cols[k], 0.75); c.lineWidth = 2.4 - k * 0.4; c.lineCap = 'round'; c.beginPath(); pts.forEach(([x, y], j) => j ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); } }
    if (!AIR && (p.ph === 'swim' || p.ph === 'float')) { const a = p.x - 120, b = p.x + 120; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath();
      for (let x = a; x <= b; x += 6) { x === a ? c.moveTo(X(x), Y(yLine(x))) : c.lineTo(X(x), Y(yLine(x))); } c.stroke(); }

    // ---------- chrome ----------
    const ch = 1 - ramp(t, T_OUT + 1.8, T_OUT + 2.6);
    text(c, S.eyebrow, 160, 120, { f: 'mono', size: 14, col: SOFT, a: ramp(t, 0.3, 0.8) * ch });
    const cur = S.stations.findIndex((_, i) => t >= land(i) - 0.1 && t < land(i) + CYCLE - 0.1);
    if (cur >= 0 && ch > 0) text(c, `${String(cur + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`, 1760, 120, { f: 'mono', size: 14, col: SOFT, a: ch, align: 'right' });
    const ti = READ[0]; const to = win(t, ti.in, ti.out, ti.fi, ti.fo);
    if (to > 0) text(c, S.title, 160, 300 + (1 - EASE.defer(clamp((t - ti.in) / ti.fi))) * 12, { f: 'disp', size: 92, col: INK, accent: accent(0), a: to });
    const oe = READ[READ.length - 1], oa = ramp(t, oe.in, oe.in + oe.fi);
    if (oa > 0) { text(c, S.endEyebrow, 160, 190, { f: 'mono', size: 15, col: SOFT, a: ramp(t, oe.in + 0.5, oe.in + 1.0) });
      text(c, S.outro, 160, 300 + (1 - EASE.defer(oa)) * 12, { f: 'disp', size: 96, col: INK, accent: accent(0), a: oa });
      whaleMark(c, 1640, 160, 0.6, INK, ramp(t, oe.in + 0.8, oe.in + 1.3)); text(c, 'cetiai.co', 1760, 236, { f: 'mono', size: 14, col: SOFT, a: ramp(t, oe.in + 0.8, oe.in + 1.3), align: 'right' }); }
    c.restore();
  }
  const TIP_AT = i => { for (let k = 1; k < TIP.length; k++) if (TIP[k][1] >= xs(i) - 40) { const [t0, xa] = TIP[k - 1], [t1, xb] = TIP[k];
    let lo = t0, hi = t1; for (let it = 0; it < 30; it++) { const m = (lo + hi) / 2; if (tipX(m) < xs(i) - 40) lo = m; else hi = m; } return hi; } return 0; };

  const READ = [{ id: 'title', in: 0.35, out: 2.75, fi: 0.4, fo: 0.3, text: S.title.replace(/<\/?i>/g, '') },
    ...S.stations.map((s, i) => ({ id: 'gloss' + i, in: land(i) + 0.15, out: land(i) + Math.max(2.4 * KT, CYCLE + 0.4), fi: 0.2, fo: 0.3, text: s.sub })),
    { id: 'outro', in: T_OUT + 4.7, out: DUR, fi: 0.5, fo: 0, text: S.outro.replace(/<\/?i>/g, '') }];
  function cues() { return { bpm: S.bpm || 120, lands: S.stations.map((_, i) => land(i)), exits: SPL.filter((_, k) => k % 2 === 0 && k < 2 * N).map(s => s.t),
    entries: SPL.filter((_, k) => k % 2 === 1 && k < 2 * N).map(s => s.t), draws: TIP.slice(1).map(([tt], k) => tt).filter((_, k) => k % 2 === 1 || k === 0),
    breach: [T_OUT + 0.6, T_OUT + 1.6], zoom: T_OUT + 1.8, outro: T_OUT + 4.7, spout: S.spoutT || null, title: 0.35, dur: DUR }; }
  const CONTRAST = [['gloss', AIR ? C.slate : INK, C.paper], ['word', INK, C.paper], ['caption', INK, C.paper], ['eyebrow', SOFT, C.paper]];
  return { drawFrame, cues, READ, CONTRAST, DUR, W, H, fps: 60, wpos, heading, cam, shutter: t => (t >= 2.4 && t < T_OUT + 2) ? [3, 0.6] : [2, 0.5] };
}
root.WHALELINE = { makeFilm };
})(typeof window !== 'undefined' ? window : globalThis);
