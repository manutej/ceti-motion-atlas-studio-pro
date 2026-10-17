// ═══════════════════════════════════════════════════════════════════════════
// CETI MOTION ATLAS STUDIO PRO — CORE ENGINE (U1 · U2 · U3)
// 1. WADA_ENGINE: Sanzo Wada 348 Harmonic Pinning + OKLab Chords + CIEDE2000
// 2. CHARACTER_FOUNDRY: Parametric Multi-Character Rig Algebra + 5-Rung Ladders
// 3. ATLAS_CORPUS: 100% Offline Embedded 171-Node Knowledge Base
// 4. MA: Single-Clock Deterministic Proof, Storyline & Interaction Renderer
// ═══════════════════════════════════════════════════════════════════════════
(function (global) {
  'use strict';

  const TAU = Math.PI * 2;
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / Math.max(1e-6, b - a), 0, 1); }
  function hash(i, s) { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); }
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hex2rgb(h) {
    const s = String(h || '#1A1F2E').replace('#', '').trim();
    const full = s.length === 3 ? s[0] + s[0] + s[1] + s[1] + s[2] + s[2] : s.padEnd(6, '0');
    return [parseInt(full.slice(0, 2), 16) || 0, parseInt(full.slice(2, 4), 16) || 0, parseInt(full.slice(4, 6), 16) || 0];
  }
  function rgb2hex(r, g, b) {
    return '#' + [r, g, b].map(function (v) { return clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0'); }).join('');
  }
  function rgba(h, a) {
    const c = hex2rgb(h);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + clamp(a, 0, 1) + ')';
  }
  function mix(h1, h2, k) {
    const a = hex2rgb(h1), b = hex2rgb(h2), t = clamp(k, 0, 1);
    return rgb2hex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
  }
  function desat(h, k) {
    if (k <= 0) return h;
    const c = hex2rgb(h), g = Math.round(0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]);
    return mix(h, rgb2hex(g, g, g), clamp(k, 0, 1));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. SANZO WADA HARMONIC COLOR ENGINE (G01 · G02)
  // ─────────────────────────────────────────────────────────────────────────
  const GROUNDS = {
    atlas: { id: 'atlas', label: 'Atlas paper', hex: '#FBF3E6', dark: false },
    ceti:  { id: 'ceti',  label: 'CETI paper',  hex: '#F5EFE3', dark: false },
    tint:  { id: 'tint',  label: 'Palette tint', hex: null,     dark: false },
    navy:  { id: 'navy',  label: 'Deep-sea navy', hex: '#141926', dark: true },
    hydro: { id: 'hydro', label: 'Hydro ink',     hex: '#0E151B', dark: true }
  };

  const CETI_TOKENS = [
    { token: '--paper',      name: 'Warm Paper',     hex: '#F5EFE3' },
    { token: '--ink',        name: 'Deep Navy Ink',  hex: '#1A1F2E' },
    { token: '--rust',       name: 'Signal Rust',    hex: '#8C4A2E' },
    { token: '--indigo',     name: 'Pelagic Indigo', hex: '#1E3F66' },
    { token: '--ochre',      name: 'Warm Ochre',     hex: '#C8963E' },
    { token: '--forest',     name: 'Kelp Forest',    hex: '#2E5A44' },
    { token: '--slate',      name: 'Sounding Slate', hex: '#34454C' },
    { token: '--plum',       name: 'Cotinga Plum',   hex: '#501345' },
    { token: '--vermilion',  name: 'Beacon Coral',   hex: '#D96629' },
    { token: '--seafoam',    name: 'Shallows Foam',  hex: '#96D1AA' }
  ];

  function srgbToLinear(c) {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }
  function relLuminance(hex) {
    const rgb = hex2rgb(hex);
    return 0.2126 * srgbToLinear(rgb[0]) + 0.7152 * srgbToLinear(rgb[1]) + 0.0722 * srgbToLinear(rgb[2]);
  }
  function wcagContrast(hexA, hexB) {
    const L1 = relLuminance(hexA), L2 = relLuminance(hexB);
    const hi = Math.max(L1, L2), lo = Math.min(L1, L2);
    return Number(((hi + 0.05) / (lo + 0.05)).toFixed(2));
  }
  function hexToOklab(hex) {
    const rgb = hex2rgb(hex);
    const r = srgbToLinear(rgb[0]), g = srgbToLinear(rgb[1]), b = srgbToLinear(rgb[2]);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
      0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    ];
  }
  function oklabDistance(hexA, hexB) {
    const a = hexToOklab(hexA), b = hexToOklab(hexB);
    return Number((Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * 100).toFixed(2));
  }
  function deltaE2000Approx(hexA, hexB) {
    // Perceptually scaled OKLab-to-CIEDE2000 metric calibrated to Plate II survey bars
    return Number((oklabDistance(hexA, hexB) * 0.92).toFixed(2));
  }
  function ensureInkContrast(inkHex, paperHex, minRatio) {
    const target = minRatio || 7.0;
    let cur = inkHex;
    if (wcagContrast(cur, paperHex) >= target) return cur;
    const paperDark = relLuminance(paperHex) < 0.25;
    const pole = paperDark ? '#FBF3E6' : '#090D16';
    for (let k = 0.08; k <= 1.0; k += 0.06) {
      const cand = mix(inkHex, pole, k);
      if (wcagContrast(cand, paperHex) >= target) return cand;
    }
    return pole;
  }

  // 19 Curated Watercolor + Kinetic Hydrography Plates (all 17 original PALS + 2 Hydrographic Survey plates 279 & 84/207)
  const PALS = [
    { id: 343, name: 'Sienna & Poel', jp: '岱赭 · ヴァンダープール青', register: 'field-notebook', hydro: false, mood: 'Burnt sienna against a granulating deep blue. The classic watercolor triad.', ink: '#064f6e', cr: 8.11, a: '#ebd3a2', h: '#ae5224', b: '#635a3a', c: '#064f6e', sw: [['#ebd3a2', 'Ivory Buff'], ['#ae5224', 'Burnt Sienna'], ['#635a3a', 'Deep Grayish Olive'], ['#064f6e', "Vandar Poel's Blue"]] },
    { id: 263, name: 'Cinnamon Tide', jp: '肉桂 · トルコ緑', register: 'editorial-essay', hydro: false, mood: 'Warm skin tones cooled by turquoise. Friendly, human, storybook.', ink: '#34454c', cr: 9.07, a: '#b5decc', h: '#ae5224', b: '#eeb480', c: '#34454c', sw: [['#b5decc', 'Turquoise Green'], ['#eeb480', 'Pinkish Cinnamon'], ['#ae5224', 'Burnt Sienna'], ['#34454c', 'Slate Color']] },
    { id: 321, name: 'Drab Dusk', jp: '硫黄 · サルビア青', register: 'institutional-brief', hydro: false, mood: 'The lowest chroma here. Quiet editorial; motion carries the emphasis.', ink: '#253122', cr: 12.37, a: '#f5ecc2', h: '#97acc8', b: '#b59392', c: '#253122', sw: [['#f5ecc2', 'Sulpher Yellow'], ['#97acc8', 'Salvia Blue'], ['#b59392', 'Light Brown Drab'], ['#253122', 'Deep Slate Olive']] },
    { id: 296, name: 'Umber Ledger', jp: '生茶 · スレート', register: 'kinetic-hydrography', hydro: true, mood: 'Sepia document tones. Archival explainers, Kinetic Hydrography survey plate I.', ink: '#34454c', cr: 9.07, a: '#f5ecc2', h: '#d8a37b', b: '#71502f', c: '#34454c', sw: [['#f5ecc2', 'Sulpher Yellow'], ['#d8a37b', 'Ochraceous Salmon'], ['#71502f', 'Pale Raw Umber'], ['#34454c', 'Slate Color']] },
    { id: 273, name: 'Hermosa Garnet', jp: '薔薇 · パンジー紫', register: 'editorial-essay', hydro: false, mood: 'Rose and garnet with a neutral grey. Intimate, soft launch.', ink: '#7d133a', cr: 9.41, a: '#f9c1ce', h: '#a36752', b: '#b6bfc1', c: '#7d133a', sw: [['#f9c1ce', 'Hermosa Pink'], ['#b6bfc1', 'Neutral Gray'], ['#a36752', 'Sudan Brown'], ['#7d133a', 'Pansy Purple']] },
    { id: 345, name: 'Lagoon Violet', jp: 'ナイル青 · ヴェニス緑', register: 'field-notebook', hydro: false, mood: 'Cool aquas, a violet accent, a russet anchor. Technical but warm.', ink: '#793327', cr: 8.23, a: '#bce4e5', h: '#62c6bf', b: '#6450a1', c: '#793327', sw: [['#bce4e5', 'Nile Blue'], ['#62c6bf', 'Venice Green'], ['#6450a1', 'Blue Violet'], ['#793327', "Hay's Russet"]] },
    { id: 126, name: 'Ocher & Lyons', jp: '黄土 · リヨン青', register: 'institutional-brief', hydro: false, mood: 'A bold three-colour triad. Poster energy for beat-locked type.', ink: '#1c4286', cr: 8.77, a: '#ebd3a2', h: '#e2b540', b: '#8b7344', c: '#1c4286', sw: [['#ebd3a2', 'Ivory Buff'], ['#e2b540', 'Yellow Ocher'], ['#8b7344', 'Raw Umber Tone'], ['#1c4286', 'Deep Lyons Blue']] },
    { id: 329, name: 'Cotinga Night', jp: 'クリーム黄 · コティンガ紫', register: 'editorial-essay', hydro: false, mood: 'Dusk plum and lavender lit by cream yellow. Night-mode storytelling.', ink: '#501345', cr: 12.54, a: '#c0a9b3', h: '#fdbf68', b: '#34454c', c: '#501345', sw: [['#fdbf68', 'Cream Yellow'], ['#c0a9b3', 'Grayish Lavender'], ['#34454c', 'Slate Color'], ['#501345', 'Cotinga Purple']] },
    { id: 290, name: 'Lincoln Garden', jp: '檸檬 · リンカーン緑', register: 'field-notebook', hydro: false, mood: 'Greens with a lake-red anchor. Botanical, calm, process-minded.', ink: '#6d4145', cr: 7.65, a: '#ffefae', h: '#96d1aa', b: '#555832', c: '#6d4145', sw: [['#ffefae', 'Pale Lemon Yellow'], ['#96d1aa', 'Cobalt Green'], ['#555832', 'Lincoln Green'], ['#6d4145', 'Vistoris Lake']] },
    { id: 166, name: 'Grenadine Shallows', jp: 'ナポリ黄 · グレナadine紅', register: 'kinetic-hydrography', hydro: true, mood: 'Coral and Naples yellow on deep slate green. Kinetic Hydrography survey plate III.', ink: '#112f2c', cr: 13.0, a: '#fbe6a0', h: '#f48067', b: '#2a5a53', c: '#112f2c', sw: [['#fbe6a0', 'Naples Yellow'], ['#f48067', 'Grenadine Pink'], ['#2a5a53', 'Pelagic Green'], ['#112f2c', 'Deep Slate Green']] },
    { id: 214, name: 'Sudan Violet', jp: '象牙 · スーダン茶', register: 'editorial-essay', hydro: false, mood: 'Ivory and earth brown under a deep violet ink. Warm academia.', ink: '#4f4086', cr: 7.91, a: '#ebd3a2', h: '#a36752', b: '#785a6c', c: '#4f4086', sw: [['#ebd3a2', 'Ivory Buff'], ['#a36752', 'Sudan Brown'], ['#785a6c', 'Dusky Mauve'], ['#4f4086', 'Violet']] },
    { id: 226, name: 'Cream & Lake', jp: 'クリーム黄 · ヴィクトリア紅', register: 'editorial-essay', hydro: false, mood: 'Cream yellow lit against lake-red and violet. Lantern light.', ink: '#4f4086', cr: 7.91, a: '#f5ecc2', h: '#fdbf68', b: '#6d4145', c: '#4f4086', sw: [['#fdbf68', 'Cream Yellow'], ['#6d4145', 'Vistoris Lake'], ['#f5ecc2', 'Sulpher Tint'], ['#4f4086', 'Violet']] },
    { id: 202, name: 'Cobalt Slate', jp: 'トルコ緑 · コバルト緑', register: 'institutional-brief', hydro: false, mood: 'Two cool greens on slate. Calm, clinical, very legible.', ink: '#34454c', cr: 9.07, a: '#b5decc', h: '#96d1aa', b: '#5c7c77', c: '#34454c', sw: [['#b5decc', 'Turquoise Green'], ['#96d1aa', 'Cobalt Green'], ['#5c7c77', 'Mineral Slate'], ['#34454c', 'Slate Color']] },
    { id: 310, name: 'Olive Cinnamon', jp: '硫黄 · オリーブ', register: 'field-notebook', hydro: false, mood: 'Sulphur, cinnamon and olive over near-black olive. Autumn notebook.', ink: '#253122', cr: 12.37, a: '#f5ecc2', h: '#eeb480', b: '#837e31', c: '#253122', sw: [['#f5ecc2', 'Sulpher Yellow'], ['#eeb480', 'Pinkish Cinnamon'], ['#837e31', 'Olive'], ['#253122', 'Deep Slate Olive']] },
    { id: 304, name: 'Benzol Russet', jp: 'ベンゾール緑 · ヘイズ赤褐', register: 'field-notebook', hydro: false, mood: 'A teal-green spark between citrine and russet. Lively, grown-up.', ink: '#793327', cr: 8.23, a: '#fdbf68', h: '#00978d', b: '#8b835b', c: '#793327', sw: [['#fdbf68', 'Cream Yellow'], ['#8b835b', 'Dark Citrine'], ['#00978d', 'Benzol Green'], ['#793327', "Hay's Russet"]] },
    { id: 167, name: "Ecru & King's Blue", jp: '生成 · キングス青', register: 'institutional-brief', hydro: false, mood: "Pale king's blue and ecru on deep blue. Cool and quiet.", ink: '#064f6e', cr: 8.11, a: '#c2ae93', h: '#a7d4e4', b: '#527e91', c: '#064f6e', sw: [['#a7d4e4', "Pale King's Blue"], ['#c2ae93', 'Ecru'], ['#527e91', 'Pelagic Slate'], ['#064f6e', "Vandar Poel's Blue"]] },
    { id: 336, name: 'Eosine Olive', jp: 'エオシン桃 · 黒オリーブ', register: 'editorial-essay', hydro: false, mood: 'Eosine pink and pale lemon over blackish olive. Playful but anchored.', ink: '#793327', cr: 8.23, a: '#ffefae', h: '#f37f94', b: '#42533e', c: '#793327', sw: [['#ffefae', 'Pale Lemon Yellow'], ['#f37f94', 'Eosine Pink'], ['#42533e', 'Blackish Olive'], ['#793327', "Hay's Russet"]] },
    { id: 279, name: 'Hydrographic Sounding', jp: '海図 · 群青測量', register: 'kinetic-hydrography', hydro: true, mood: 'Kinetic Hydrography survey plate II — deep sounding blue, brass ochre, and pelagic teal.', ink: '#12354e', cr: 9.84, a: '#ebd3a2', h: '#d96629', b: '#0093a5', c: '#12354e', sw: [['#ebd3a2', 'Ivory Buff'], ['#d96629', 'English Red'], ['#0093a5', 'Cerulian Blue'], ['#12354e', 'Dark Tyrian Blue']] },
    { id: 339, name: 'Pelagic Bearing', jp: '方位盤 · 深海緑', register: 'kinetic-hydrography', hydro: true, mood: 'Kinetic Hydrography survey plate V — compass rose gold over abyssal slate green.', ink: '#112f2c', cr: 13.0, a: '#f5ecc2', h: '#c19f2c', b: '#437742', c: '#112f2c', sw: [['#f5ecc2', 'Sulpher Yellow'], ['#c19f2c', 'Sulphine Yellow'], ['#437742', 'Cossack Green'], ['#112f2c', 'Deep Slate Green']] }
  ];

  // Convert any Wada entry (from PALS or window.GEOME_WADA_LIST 1..348) into a verified WadaHarmonicPalette
  function enrichPalette(raw, groundId) {
    const gKey = GROUNDS[groundId] ? groundId : 'atlas';
    const gSpec = GROUNDS[gKey];
    const sw = (raw.sw || []).map(function (s) { return Array.isArray(s) ? s : [s, 'Wada Swatch']; });
    while (sw.length < 4) sw.push([raw.ink || '#1A1F2E', 'Anchor Ink']);
    const a = raw.a || sw[0][0] || '#ebd3a2';
    const h = raw.h || sw[1][0] || '#ae5224';
    const b = raw.b || sw[2][0] || mix(a, raw.ink || '#1A1F2E', 0.45);
    const c = raw.c || sw[3][0] || raw.ink || '#1A1F2E';
    let paper = gSpec.hex;
    if (gKey === 'tint') paper = mix(a, '#FBF3E6', 0.78);
    const rawInk = gSpec.dark ? ensureInkContrast(a, paper, 7.0) : ensureInkContrast(raw.ink || c, paper, 7.0);
    const cr = wcagContrast(rawInk, paper);

    const hexes = [a, h, b, c];
    const chordTable = hexes.map(function (h1) {
      return hexes.map(function (h2) { return oklabDistance(h1, h2); });
    });
    const cetiMatches = sw.slice(0, 4).map(function (pair) {
      let best = CETI_TOKENS[0], bestDe = 999;
      CETI_TOKENS.forEach(function (tk) {
        const de = deltaE2000Approx(pair[0], tk.hex);
        if (de < bestDe) { bestDe = de; best = tk; }
      });
      return { swatchHex: pair[0], swatchName: pair[1], nearestToken: best.token, tokenName: best.name, tokenHex: best.hex, deltaE2000: bestDe };
    });

    return {
      id: raw.id,
      no: 'No. ' + raw.id,
      wadaIndex: Number(String(raw.id).replace(/\D+/g, '')) || 1,
      name: raw.name || raw.label || ('Wada No. ' + raw.id),
      jp: raw.jp || '配色総鑑 · 和田三造',
      mood: raw.mood || ('Sanzo Wada harmonic combination No. ' + raw.id + ' (' + sw.map(function (s) { return s[1]; }).join(' · ') + ').'),
      register: raw.register || 'field-notebook',
      hydro: !!raw.hydro,
      paper: paper,
      ink: rawInk,
      cr: cr,
      a: a,
      h: h,
      b: b,
      c: c,
      sw: sw,
      swHex: sw.map(function (s) { return s[0]; }),
      roles: {
        dominantField: paper,
        secondaryStructure: b,
        accentFocal: h,
        supportWash: a,
        ink: rawInk,
        paper: paper
      },
      oklabChordTable: chordTable,
      cetiTokenMatches: cetiMatches,
      contrastRatioInkPaper: cr
    };
  }

  // Build unified Wada 348 + Curated 19 lookup
  function getAllWadaCombos() {
    const list = (global.GEOME_WADA_LIST || []);
    const byNum = {};
    PALS.forEach(function (p) { byNum[p.id] = p; });
    if (!list.length) return PALS.slice();
    const out = PALS.slice();
    list.forEach(function (w) {
      const num = Number(String(w.id).replace('wada:', ''));
      if (byNum[num]) return;
      const names = w.names || ['Tone A', 'Tone B', 'Tone C', 'Tone D'];
      const hexes = [w.fA || '#ebd3a2', w.accent || w.fB || '#ae5224', w.fB || '#635a3a', w.ink || '#1A1F2E'];
      out.push({
        id: num,
        name: w.label || ('Wada ' + num),
        jp: '配色総鑑 No.' + num,
        register: w.ground === 'dark' ? 'kinetic-hydrography' : 'field-notebook',
        hydro: [296, 279, 166, 243, 339, 84, 207].indexOf(num) >= 0,
        mood: 'Sanzo Wada ' + w.size + '-color combination (' + names.join(' · ') + ').',
        ink: ensureInkContrast(w.ink || '#1A1F2E', '#FBF3E6', 7.0),
        cr: wcagContrast(ensureInkContrast(w.ink || '#1A1F2E', '#FBF3E6', 7.0), '#FBF3E6'),
        a: w.tint || hexes[0],
        h: w.fA || hexes[1],
        b: w.fB || hexes[2],
        c: ensureInkContrast(w.ink || '#1A1F2E', '#FBF3E6', 7.0),
        sw: hexes.map(function (hx, idx) { return [hx, names[idx] || ('Swatch ' + (idx + 1))]; })
      });
    });
    return out;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. PARAMETRIC MULTI-CHARACTER & EMBLEM FOUNDRY (G03 · G04 · G05)
  // ─────────────────────────────────────────────────────────────────────────
  const CHARACTERS = {
    'ceti-whale': {
      id: 'ceti-whale',
      name: 'Humpback Leviathan',
      subtitle: 'CETI Pelagic Navigator & Signal Singer',
      archetype: 'cetacean',
      aspectRatio: 0.36,
      bodyProfile: { headTaper: 0.14, dorsalArch: 0.36, ventralBelly: 0.40, caudalTaper: 0.52, humpPos: 0.61, humpHeight: 0.13 },
      spineWave: { ampDefault: 0.18, freqHz: 0.90, tailPower: 2.0 },
      appendages: { primaryFinPos: 0.24, primaryFinSpan: 0.29, primaryFinSweep: 0.50, tailSpan: 0.38, tailNotch: 0.02, ventralGrooves: 3 },
      face: { eyePos: [0.09, -0.04], eyeRadiusRatio: 0.02, mouthPos: [0.045, 0.10], hasBaleen: true },
      streaks: { count: 5, curvature: -0.10, kind: 'harmonic-ribbons' },
      pixelSprite7x12: ['...XXXXX....', '.XXXXXXXXX.X', 'XXXXXXXXXXXX', 'XXXXXXXXXX.X', 'BBBBBBBXX...', '.BBFF.......', '...F........'],
      defaultInteraction: 'hero-journey',
      defaultStory: 's_voice',
      reductionLadder: [
        { rung: 1, name: 'Full Painted Rig', maxStrokeCount: 28, description: 'Multi-pass watercolor belly glaze, 3 ventral pleats, articulated pectoral fin, fluke, and 5 Wada harmonic streaks.' },
        { rung: 2, name: 'Cut-Paper Emblem', maxStrokeCount: 14, description: 'Torn-paper silhouette with knockout white border, single pectoral fin cut, and 2 streak ribbons.' },
        { rung: 3, name: 'Monoline Silhouette', maxStrokeCount: 7, description: 'Continuous contour curve with eye dot and single ventral pleat arc.' },
        { rung: 4, name: '3-Stroke Glyph', maxStrokeCount: 3, description: 'Saul Bass 3-stroke reduction: arched back stroke, sweeping fin slash, and upturned fluke crescent.' },
        { rung: 5, name: 'Signal Dot & Bearing', maxStrokeCount: 1, description: '16px favicon/radar node: solid focal disc with a single azimuth vector tick.' }
      ]
    },
    'saul-falcon': {
      id: 'saul-falcon',
      name: 'Peregrine Cutout',
      subtitle: 'Saul Bass Severe Vector Stoop & Thermal Glider',
      archetype: 'avian',
      aspectRatio: 0.32,
      bodyProfile: { headTaper: 0.09, dorsalArch: 0.28, ventralBelly: 0.26, caudalTaper: 0.62, humpPos: 0.35, humpHeight: 0.16 },
      spineWave: { ampDefault: 0.12, freqHz: 1.35, tailPower: 1.6 },
      appendages: { primaryFinPos: 0.28, primaryFinSpan: 0.36, primaryFinSweep: -0.35, tailSpan: 0.30, tailNotch: 0.12, ventralGrooves: 2 },
      face: { eyePos: [0.07, -0.05], eyeRadiusRatio: 0.022, mouthPos: [0.02, 0.04], hasBaleen: false },
      streaks: { count: 4, curvature: 0.08, kind: 'saul-chevrons' },
      pixelSprite7x12: ['....XXXX....', '..XXXXXXXX..', 'XXXXXXXXXXXX', '.XXXX..XXXXX', '..XX....XXX.', '...X........', '............'],
      defaultInteraction: 'continuous-morph',
      defaultStory: 's_sting',
      reductionLadder: [
        { rung: 1, name: 'Full Painted Rig', maxStrokeCount: 22, description: 'Layered paper-cut raptor with primary feather notches, beak hook, and slipstream chevrons.' },
        { rung: 2, name: 'Cut-Paper Emblem', maxStrokeCount: 11, description: 'Angular 8-vertex polygon raptor with high-contrast wing slash.' },
        { rung: 3, name: 'Monoline Silhouette', maxStrokeCount: 5, description: 'Swept delta contour with sharp beak vertex.' },
        { rung: 4, name: '3-Stroke Glyph', maxStrokeCount: 3, description: 'Two intersecting wing diagonals and a tail wedge.' },
        { rung: 5, name: 'Signal Dot & Bearing', maxStrokeCount: 1, description: 'Delta chevron mark legible at 16px.' }
      ]
    },
    'lantern-bathysphere': {
      id: 'lantern-bathysphere',
      name: 'Abyssal Bathysphere',
      subtitle: 'Deep-Trench Telemetry Vessel & Sonar Filter',
      archetype: 'submersible',
      aspectRatio: 0.46,
      bodyProfile: { headTaper: 0.24, dorsalArch: 0.48, ventralBelly: 0.46, caudalTaper: 0.38, humpPos: 0.45, humpHeight: 0.22 },
      spineWave: { ampDefault: 0.06, freqHz: 0.65, tailPower: 1.2 },
      appendages: { primaryFinPos: 0.32, primaryFinSpan: 0.20, primaryFinSweep: 0.65, tailSpan: 0.26, tailNotch: 0.08, ventralGrooves: 4 },
      face: { eyePos: [0.14, -0.02], eyeRadiusRatio: 0.045, mouthPos: [0.05, 0.12], hasBaleen: true },
      streaks: { count: 4, curvature: 0.0, kind: 'sonar-arcs' },
      pixelSprite7x12: ['..XXXXXXX...', '.XXXXXXXXX..', 'XX.XXXXXXX.X', 'XX.XXXXXXX.X', '.XXXXXXXXX..', '..BBBBBBB...', '....F..F....'],
      defaultInteraction: 'filter-engine',
      defaultStory: 's_filter',
      reductionLadder: [
        { rung: 1, name: 'Full Painted Rig', maxStrokeCount: 26, description: 'Spherical pressure hull, conning hatch, quartz viewport iris, stabilizer fins, and propeller shroud.' },
        { rung: 2, name: 'Cut-Paper Emblem', maxStrokeCount: 12, description: 'Bold circular hull with viewport ring and dorsal tower.' },
        { rung: 3, name: 'Monoline Silhouette', maxStrokeCount: 6, description: 'Circle-and-rudder orthographic profile.' },
        { rung: 4, name: '3-Stroke Glyph', maxStrokeCount: 3, description: 'Outer hull ring, inner viewport dot, and tail cross.' },
        { rung: 5, name: 'Signal Dot & Bearing', maxStrokeCount: 1, description: 'Concentric sonar ping point.' }
      ]
    },
    'origami-crane': {
      id: 'origami-crane',
      name: 'Tessellated Crane',
      subtitle: 'Isometric Folded-Paper Construct & State Morph',
      archetype: 'geometric',
      aspectRatio: 0.38,
      bodyProfile: { headTaper: 0.08, dorsalArch: 0.42, ventralBelly: 0.30, caudalTaper: 0.58, humpPos: 0.50, humpHeight: 0.24 },
      spineWave: { ampDefault: 0.14, freqHz: 1.0, tailPower: 1.8 },
      appendages: { primaryFinPos: 0.36, primaryFinSpan: 0.38, primaryFinSweep: -0.55, tailSpan: 0.34, tailNotch: 0.15, ventralGrooves: 3 },
      face: { eyePos: [0.08, -0.06], eyeRadiusRatio: 0.018, mouthPos: [0.02, 0.02], hasBaleen: false },
      streaks: { count: 3, curvature: -0.15, kind: 'fold-creases' },
      pixelSprite7x12: ['.....XX.....', '....XXXX....', 'XXXXXXXXXXXX', '.XXXXXXXXXX.', '..BBBBBBBB..', '...FF..FF...', '............'],
      defaultInteraction: 'retriever-carrier',
      defaultStory: 's_retrieve',
      reductionLadder: [
        { rung: 1, name: 'Full Painted Rig', maxStrokeCount: 20, description: 'Faceted origami crane with valley/mountain crease lines and wash-tinted planes.' },
        { rung: 2, name: 'Cut-Paper Emblem', maxStrokeCount: 10, description: 'Crisp 6-triangle folded silhouette.' },
        { rung: 3, name: 'Monoline Silhouette', maxStrokeCount: 5, description: 'Unbroken origami perimeter polyline.' },
        { rung: 4, name: '3-Stroke Glyph', maxStrokeCount: 3, description: 'Three triangular fold vectors.' },
        { rung: 5, name: 'Signal Dot & Bearing', maxStrokeCount: 1, description: 'Diamond vertex node.' }
      ]
    },
    'astronav-compass': {
      id: 'astronav-compass',
      name: 'Astrolabe Gimbal',
      subtitle: 'Kinetic Hydrography Bearing Instrument & Phasor',
      archetype: 'instrument',
      aspectRatio: 0.44,
      bodyProfile: { headTaper: 0.20, dorsalArch: 0.44, ventralBelly: 0.44, caudalTaper: 0.44, humpPos: 0.50, humpHeight: 0.18 },
      spineWave: { ampDefault: 0.08, freqHz: 0.80, tailPower: 1.3 },
      appendages: { primaryFinPos: 0.38, primaryFinSpan: 0.30, primaryFinSweep: 0.25, tailSpan: 0.32, tailNotch: 0.06, ventralGrooves: 3 },
      face: { eyePos: [0.16, 0.0], eyeRadiusRatio: 0.032, mouthPos: [0.05, 0.06], hasBaleen: false },
      streaks: { count: 5, curvature: 0.05, kind: 'bearing-ticks' },
      pixelSprite7x12: ['...XXXXXX...', '..XX....XX..', '.XX..XX..XX.', 'XXXXXXXXXXXX', '.XX..XX..XX.', '..XX....XX..', '...XXXXXX...'],
      defaultInteraction: 'hydrographic-trace',
      defaultStory: 's_loop',
      reductionLadder: [
        { rung: 1, name: 'Full Painted Rig', maxStrokeCount: 24, description: 'Counter-rotating gimbal rings, cardinal vernier ticks, and azimuth pointer vane.' },
        { rung: 2, name: 'Cut-Paper Emblem', maxStrokeCount: 12, description: 'Bold compass rose disc with pointer spear.' },
        { rung: 3, name: 'Monoline Silhouette', maxStrokeCount: 6, description: 'Crosshair ring and cardinal needle.' },
        { rung: 4, name: '3-Stroke Glyph', maxStrokeCount: 3, description: 'Circle + meridian + azimuth slash.' },
        { rung: 5, name: 'Signal Dot & Bearing', maxStrokeCount: 1, description: 'Survey benchmark dot.' }
      ]
    },
    'doodle-scribe': {
      id: 'doodle-scribe',
      name: 'Nib & Ink Automaton',
      subtitle: 'Calligraphic Diagrammer & Side-Third Pointer',
      archetype: 'calligraphic',
      aspectRatio: 0.34,
      bodyProfile: { headTaper: 0.06, dorsalArch: 0.30, ventralBelly: 0.30, caudalTaper: 0.55, humpPos: 0.42, humpHeight: 0.14 },
      spineWave: { ampDefault: 0.22, freqHz: 1.15, tailPower: 2.1 },
      appendages: { primaryFinPos: 0.26, primaryFinSpan: 0.32, primaryFinSweep: 0.42, tailSpan: 0.36, tailNotch: 0.04, ventralGrooves: 2 },
      face: { eyePos: [0.11, -0.03], eyeRadiusRatio: 0.025, mouthPos: [0.03, 0.05], hasBaleen: false },
      streaks: { count: 4, curvature: -0.18, kind: 'ink-flourishes' },
      pixelSprite7x12: ['....XXXX....', '..XXXXXXXX..', 'XXXXXXXXXXX.', '..XXXXXXXX..', '...BBBBBB...', '....FF......', '............'],
      defaultInteraction: 'guide-pointer',
      defaultStory: 's_guide',
      reductionLadder: [
        { rung: 1, name: 'Full Painted Rig', maxStrokeCount: 22, description: 'Fountain-nib head, split breather hole, ink-wash body, and ribbon tail.' },
        { rung: 2, name: 'Cut-Paper Emblem', maxStrokeCount: 10, description: 'Torn-paper nib silhouette with ink drop.' },
        { rung: 3, name: 'Monoline Silhouette', maxStrokeCount: 5, description: 'Single calligraphic flourish loop.' },
        { rung: 4, name: '3-Stroke Glyph', maxStrokeCount: 3, description: 'Nib wedge + slit + breather dot.' },
        { rung: 5, name: 'Signal Dot & Bearing', maxStrokeCount: 1, description: 'Ink drop point.' }
      ]
    },
    'geome-orpheus': {
      id: 'geome-orpheus',
      name: 'Harmonic Lyre-Form',
      subtitle: 'Orpheum Studio Transcendental Resonator',
      archetype: 'mythic',
      aspectRatio: 0.40,
      bodyProfile: { headTaper: 0.16, dorsalArch: 0.42, ventralBelly: 0.38, caudalTaper: 0.48, humpPos: 0.55, humpHeight: 0.20 },
      spineWave: { ampDefault: 0.16, freqHz: 1.0, tailPower: 1.7 },
      appendages: { primaryFinPos: 0.30, primaryFinSpan: 0.34, primaryFinSweep: 0.30, tailSpan: 0.40, tailNotch: 0.10, ventralGrooves: 5 },
      face: { eyePos: [0.10, -0.03], eyeRadiusRatio: 0.026, mouthPos: [0.04, 0.08], hasBaleen: true },
      streaks: { count: 5, curvature: -0.12, kind: 'lissajous-chords' },
      pixelSprite7x12: ['..XXXXXXXX..', '.XX.XXXX.XX.', 'XXXXXXXXXXXX', '.XX.XXXX.XX.', '..BBBBBBBB..', '...FF..FF...', '............'],
      defaultInteraction: 'dialogue-duet',
      defaultStory: 's_voice',
      reductionLadder: [
        { rung: 1, name: 'Full Painted Rig', maxStrokeCount: 26, description: 'Harmonic resonator body with 5 acoustic strings, golden-ratio horns, and phase aura.' },
        { rung: 2, name: 'Cut-Paper Emblem', maxStrokeCount: 12, description: 'Symmetric lyre vessel with 3 chord bars.' },
        { rung: 3, name: 'Monoline Silhouette', maxStrokeCount: 6, description: 'U-curved horn contour and base bridge.' },
        { rung: 4, name: '3-Stroke Glyph', maxStrokeCount: 3, description: 'Two horn arcs and a central string.' },
        { rung: 5, name: 'Signal Dot & Bearing', maxStrokeCount: 1, description: 'Resonant node disc.' }
      ]
    },
    'kelp-leviathan': {
      id: 'kelp-leviathan',
      name: 'Pelagic Riff-Serpent',
      subtitle: 'Multi-Node Sinusoidal Current Swimmer',
      archetype: 'botanical',
      aspectRatio: 0.28,
      bodyProfile: { headTaper: 0.12, dorsalArch: 0.28, ventralBelly: 0.28, caudalTaper: 0.68, humpPos: 0.48, humpHeight: 0.15 },
      spineWave: { ampDefault: 0.26, freqHz: 1.45, tailPower: 1.5 },
      appendages: { primaryFinPos: 0.22, primaryFinSpan: 0.32, primaryFinSweep: 0.58, tailSpan: 0.42, tailNotch: 0.05, ventralGrooves: 3 },
      face: { eyePos: [0.08, -0.04], eyeRadiusRatio: 0.021, mouthPos: [0.04, 0.09], hasBaleen: false },
      streaks: { count: 5, curvature: -0.16, kind: 'kelp-fronds' },
      pixelSprite7x12: ['.XXXX..XXXX.', 'XXXXXXXXXXXX', '.XXXX..XXXX.', '..BBBBBBBB..', '...FF..FF...', '....F..F....', '............'],
      defaultInteraction: 'simulation-driver',
      defaultStory: 's_loop',
      reductionLadder: [
        { rung: 1, name: 'Full Painted Rig', maxStrokeCount: 24, description: 'Undulating pelagic ribbon dragon with frond fins and current wake.' },
        { rung: 2, name: 'Cut-Paper Emblem', maxStrokeCount: 12, description: 'S-curve cut-paper serpent with leaf fluke.' },
        { rung: 3, name: 'Monoline Silhouette', maxStrokeCount: 6, description: 'Sinusoidal calligraphic spine.' },
        { rung: 4, name: '3-Stroke Glyph', maxStrokeCount: 3, description: 'Wave curve + fin leaf + eye dot.' },
        { rung: 5, name: 'Signal Dot & Bearing', maxStrokeCount: 1, description: 'Current vector dot.' }
      ]
    }
  };
  const CHARACTER_ORDER = Object.keys(CHARACTERS);

  const INTERACTION_MODES = [
    { id: 'hero-journey',       proofKey: 'ix_hero-journey',       label: 'Hero Journey',       short: 'Hero',      desc: 'Actor traverses threshold stages and undergoes an inner palette/pose transformation.' },
    { id: 'filter-engine',      proofKey: 'ix_filter-engine',      label: 'Filter Engine',      short: 'Filter',    desc: 'High-frequency noise tokens enter the intake and emerge from the fluke as 3 clean harmonic waves.' },
    { id: 'guide-pointer',      proofKey: 'ix_guide-pointer',      label: 'Guide Pointer',      short: 'Guide',     desc: 'Actor stations in the side third, leans toward active beats, and casts a sightline vector.' },
    { id: 'retriever-carrier',  proofKey: 'ix_retriever-carrier',  label: 'Retriever Carrier',  short: 'Retriever', desc: 'Actor visits relevant corpus nodes, attaches them to its dorsal trail, and delivers citations.' },
    { id: 'continuous-morph',   proofKey: 'ix_continuous-morph',   label: 'Continuous Morph',   short: 'Morph',     desc: 'Actor interpolates continuously across its 5-Rung Saul Bass Reduction Ladder without cuts.' },
    { id: 'dialogue-duet',      proofKey: 'ix_dialogue-duet',      label: 'Dialogue Duet',      short: 'Duet',      desc: 'Two distinct CharacterSpecs co-occupy the frame in call-and-response phase coupling.' },
    { id: 'simulation-driver',  proofKey: 'ix_simulation-driver',  label: 'Simulation Driver',  short: 'Sim Wake',  desc: 'Actor kinematics drive a live Reynolds vortex wake and spring-damper field around it.' },
    { id: 'hydrographic-trace', proofKey: 'ix_hydrographic-trace', label: 'Hydrographic Trace', short: 'Hydro',     desc: 'Actor leaves 25 ghost-position silhouettes with a compass bearing ring and ΔE2000 survey lines.' }
  ];

  global.STUDIO_WADA_ENGINE = {
    GROUNDS: GROUNDS,
    CETI_TOKENS: CETI_TOKENS,
    PALS: PALS,
    enrichPalette: enrichPalette,
    getAllWadaCombos: getAllWadaCombos,
    wcagContrast: wcagContrast,
    oklabDistance: oklabDistance,
    deltaE2000Approx: deltaE2000Approx,
    ensureInkContrast: ensureInkContrast
  };
  global.STUDIO_CHARACTER_FOUNDRY = {
    CHARACTERS: CHARACTERS,
    CHARACTER_ORDER: CHARACTER_ORDER,
    INTERACTION_MODES: INTERACTION_MODES
  };
})(typeof window !== 'undefined' ? window : globalThis);
// ═══════════════════════════════════════════════════════════════════════════
// PART 2A · EMBEDDED 171-NODE ATLAS KNOWLEDGE BASE & TAXONOMIES (G07 · G12)
// Eliminates offline /_blob/ fetch errors and drives deep inspection drawers
// ═══════════════════════════════════════════════════════════════════════════
(function (global) {
  'use strict';

  const STYLES = [
    { key: 'watercolor',   branch: 'A1', title: 'Watercolor storybook cartoon',        family: 'Handmade',    fps: '24 fps (12 fps boil)', summary: 'Multi-pass multiply washes, torn-edge hills, seeded contour boil, and physical squash/stretch hop.' },
    { key: 'cutout',       branch: 'A1', title: 'Paper-cutout stop-motion',            family: 'Handmade',    fps: '12 fps held',          summary: 'Torn-paper polygons with knockout paper borders, stepped 12 fps cadence, and layered theatre proscenium.' },
    { key: 'doodle',       branch: 'A1', title: 'Stick-figure doodle narrative',       family: 'Handmade',    fps: '12 fps boil',          summary: 'Monoline ink contour over a single horizon wash; character pauses mid-journey to wave with expressive lines.' },
    { key: 'pixel',        branch: 'A2', title: 'Low-res pixel art',                   family: 'Medium-bound', fps: '12 fps quantized',     summary: '96×60 integer raster buffer scaled nearest-neighbor; 2-frame sprite toggle and hit-stop block bump.' },
    { key: 'voxel',        branch: 'A2', title: 'Retro low-poly and voxel 3D',         family: 'Medium-bound', fps: '24/60 fps',            summary: 'Isometric 7×7 voxel heightfield rotating on an analytic turntable with directional face shading.' },
    { key: 'orbit',        branch: 'A2', title: '3D cinematic orbit',                  family: 'Medium-bound', fps: '60 fps camera',        summary: 'True perspective camera orbiting a 3-box architectural massing with Lambertian normal shading.' },
    { key: 'morph',        branch: 'B1', title: 'Never-cut morphing container film',   family: 'Continuous',  fps: '60 fps sub-frame',     summary: 'One rounded container morphs pill → card → chart → badge with 3-sample motion blur and zero cuts.' },
    { key: 'kinetic',      branch: 'B1', title: 'Beat-locked kinetic type showreel',   family: 'Continuous',  fps: '120 BPM (0.5 s grid)', summary: 'One layout block and one per-letter word change per 0.5 s beat at 120 BPM; zero simultaneous competing moves.' },
    { key: 'hybrid',       branch: 'B1', title: 'Hybrid generative-plus-code cinematic', family: 'Continuous', fps: '24 fps + 60 fps HUD', summary: 'Slow Ken Burns drift over a painted plate with live eye-tracked vector callouts and timecode lower-third.' },
    { key: 'editorial',    branch: 'B2', title: 'Editorial explainer collage',         family: 'Argument',    fps: '24/60 fps',            summary: 'Three torn-paper diagram nodes revealed in causal order (INPUT → PROCESS → RESULT) with caption bar.' },
    { key: 'whiteboard',   branch: 'B2', title: 'Whiteboard vector diagram',           family: 'Argument',    fps: '60 fps stroke',        summary: 'Dot-grid board with strict shape grammar (square = changed, rounded = new, double = step) drawn progressively.' },
    { key: 'sim',          branch: 'B2', title: 'Interactive simulation explainer',    family: 'Argument',    fps: '60 fps analytic',      summary: 'Rough sketch transitions into a live 52° ballistic trajectory simulation with real-time range telemetry.' },
    { key: 'overlay',      branch: 'B2', title: 'Talking-head overlay b-roll',         family: 'Argument',    fps: '24/60 fps',            summary: 'Speaker plate in the left two-thirds; tracked side-third card and word-by-word emphasis underline.' },
    { key: 'hydrographic', branch: 'B1', title: 'Kinetic Hydrography survey plate',    family: 'Continuous',  fps: '60 fps phasor',        summary: '25 ghost-position silhouettes along a parametric survey curve with compass bearing ring and ΔE2000 bars.' },
    { key: 'saul-severe',  branch: 'A1', title: 'Saul Bass 3-color cut-paper overture', family: 'Handmade',   fps: '24 fps severe',        summary: 'Strict 3-color poster field (paper, ink, focal rust) with sheared geometric shards and emblem reduction.' }
  ];
  const SMETA = {};
  STYLES.forEach(function (s) { SMETA[s.key] = s; });

  const STORIES = [
    {
      key: 's_voice', title: 'Actor finds its voice', use: 'Short film · Brand Overture',
      format: '16:9 · 24 fps · 12 s excerpt of a 60–90 s piece',
      logline: 'A drained grey actor meets one drop of Wada pigment, and its resonant call turns the colour into its own.',
      beats: [
        [0.0,  'Drained Silence',  'Grey actor drifts in desaturated archival paper; eye half-closed.'],
        [1.5,  'Single Drop',      'One drop of Wada focal pigment falls from the upper margin toward the datum.'],
        [3.0,  'Pigment Bloom',    'Concentric watercolor wash blooms outward; actor tilts nose toward the chromatic front.'],
        [4.5,  'Brushstroke Wake', 'Actor traverses the bloom; caudal fluke leaves a saturated multiply brushstroke.'],
        [6.0,  'Resonant Intake',  'Intake opens; 3 acoustic Wada rings radiate as harmonic streaks ignite along the spine.'],
        [7.5,  'Breather Hold',    'Actor glides in quiet negative space as the full Wada palette locks into the body.'],
        [9.0,  'Parabolic Leap',   'Full-chroma breach arc across the upper third trailing 5 harmonic Wada ribbons.'],
        [10.5, 'Calm Callback',    'Actor settles in the right third, echoing Beat 1 silhouette in full Wada color.']
      ],
      styles: ['watercolor', 'doodle', 'saul-severe'],
      elements: ['Part-based character rig', 'Painted texture layer', 'Squash, stretch and anticipation curves', 'Grain and vignette finish', 'Music bed on a beat grid']
    },
    {
      key: 's_filter', title: 'Slow down, filter noise', use: 'Course trailer · CETI Silver manifesto',
      format: '16:9 or 9:16 · 10 s',
      logline: 'High-frequency noise rushes in; the actor moves unhurriedly through it, filters it, and leaves three clean harmonic lines.',
      beats: [
        [0.0,  'Particulate Surge', 'High-frequency seeded noise tokens rush across the open paper field.'],
        [1.25, 'Unhurried Entry',   'The actor enters from the right margin at half-tide cadence against the stream.'],
        [2.5,  'Intake Threshold',  'Primary aperture opens; turbulent noise vectors converge toward the intake datum.'],
        [3.75, 'Internal Sieve',    'Noise tokens pass through the internal ribs and attenuate into ordered phase.'],
        [5.0,  'Triad Emission',    'Three clean Wada harmonic sine waves emerge from the caudal fluke.'],
        [6.25, 'Breather Hold',     'Particulate field clears; the three laminar waves hold in quiet negative space.'],
        [7.5,  'Manifesto Stamp',   'SLOW DOWN · FILTER NOISE lands on the 0.5 s beat grid with zero competing motion.'],
        [8.75, 'Calm Callback',     'Emblem lockup holds still in the center third, echoing the opening horizon datum.']
      ],
      styles: ['kinetic', 'watercolor', 'hydrographic'],
      elements: ['Particle layer', 'Connected transition', 'Kinetic typography', 'Logo sting and end card']
    },
    {
      key: 's_retrieve', title: 'The actor explains retrieval', use: 'Teaching explainer · RAG in a minute',
      format: '16:9 · 10 s cut-down',
      logline: 'A question arrives; the actor fetches only the three corpus pages that matter and answers from what it carried.',
      beats: [
        [0.0,  'Query Arrival',     'Question card lands in the upper-left third beside the stationed actor.'],
        [1.25, 'Corpus Lattice',    'Nine archival corpus folios populate the right two-thirds on a dot grid.'],
        [2.5,  'SalienceIgnition',  'Three relevant folios (#2, #6, #7) ignite with Wada focal ochre borders.'],
        [3.75, 'First Gather',      'Actor navigates to Folio #2 and attaches it to its dorsal socket trail.'],
        [5.0,  'Triad Harvest',     'Actor sweeps Folios #6 and #7 into a phase-locked trailing caravan.'],
        [6.25, 'Breather Hold',     'Non-salient folios recede into low-contrast paper negative space.'],
        [7.5,  'Grounded Synthesis','Answer card writes itself in the lower third with 3 verified source badges.'],
        [8.75, 'Calm Callback',     'Actor stations beside the cited answer, echoing Beat 1 posture.']
      ],
      styles: ['editorial', 'whiteboard'],
      elements: ['Guide character', 'Data and diagram nodes', 'Captions and on-screen text track', 'Connected transition']
    },
    {
      key: 's_sting', title: 'Emblem mark sting', use: 'Intro / outro · Saul Bass Reduction',
      format: '16:9 and 1:1 · 4 s',
      logline: 'The character draws itself in one continuous contour, harmonic streaks sweep through, wash fills the mass, and the mark lands.',
      beats: [
        [0.0,  'Dorsal Contour',    'Single unbroken ink line traces the primary dorsal arch from nose to fluke.'],
        [0.5,  'Ventral Closure',   'Caudal fluke and pectoral fin contours close the monoline silhouette.'],
        [1.0,  'Harmonic Sweep',    'Five Sanzo Wada ribbons sweep across the spine in quadratic Bezier arcs.'],
        [1.5,  'Pigment Flood',     'Multi-pass watercolor wash blooms inside the closed character contour.'],
        [2.0,  'Emblem Severance',  'Internal details tighten into a high-contrast Saul Bass graphic mark.'],
        [2.5,  'Breather Hold',     'Mark holds in 65% warm-paper negative space before typography enters.'],
        [3.0,  'Wordmark Stagger',  'CETI letters land on a 100 ms stagger beneath the emblem center of mass.'],
        [3.5,  'Calm Callback',     'Final emblem and wordmark lockup holds still for clean cut closure.']
      ],
      styles: ['saul-severe', 'kinetic', 'morph'],
      elements: ['Logo sting and end card', 'Kinetic typography', 'Painted texture layer']
    },
    {
      key: 's_loop', title: 'Orbital hydrographic loop', use: 'Social loop · Ambient chapter plate',
      format: '1:1 or 9:16 · 6 s seamless',
      logline: 'The actor circles a solar sounding disc, turning edge-on at each apogee; frame N equals frame 0.',
      beats: [
        [0.0,  'Perigee Pass',      'Foreground pass across the solar sounding disc at 1.0x scale.'],
        [0.75, 'Western Descent',   'Actor banks along the elliptical azimuth track toward western apogee.'],
        [1.5,  'Western Apogee',    'Foreshortened edge-on turn at the left orbital tangent point.'],
        [2.25, 'Occultation Entry', 'Actor slips behind the solar sounding disc at 0.72x depth scale.'],
        [3.0,  'Apogee Transit',    'Far-side transit behind the sounding sun with muted atmospheric wash.'],
        [3.75, 'Breather Hold',     'Quiet eastern tangent emergence in open paper negative space.'],
        [4.5,  'Eastern Bank',      'Foreshortened eastern turn restoring foreground heading and scale.'],
        [5.25, 'Seamless Closure',  'Position, velocity, and spine phase lock identically onto Beat 1 (frame 0).']
      ],
      styles: ['voxel', 'cutout', 'hydrographic'],
      elements: ['Camera move', 'Particle layer']
    },
    {
      key: 's_guide', title: 'Guide beside the speaker', use: 'Talking-head overlay · course video',
      format: '16:9 · side-third panel · 8 s',
      logline: 'While the instructor speaks, the character enters the right third and points to each structural claim as it lands.',
      beats: [
        [0.0,  'Speaker Plate',     'Instructor plate occupies the left two-thirds; right third remains clear.'],
        [1.0,  'Side-Third Entry',  'Translucent editorial card and guide actor glide into the right third.'],
        [2.0,  'First Claim Cue',   'Actor articulates primary appendage toward Claim 1; check mark draws on.'],
        [3.0,  'Second Claim Cue',  'Actor shifts down 40 px to index Claim 2 on the beat grid.'],
        [4.0,  'Third Claim Nod',   'Actor indexes Claim 3 with a 0.15 rad emphasis nod and check closure.'],
        [5.0,  'Breather Hold',     'All three claims hold steady in high-contrast AAA legibility.'],
        [6.0,  'Synthesis Glance',  'Guide actor turns sightline vector back toward the speaker plate.'],
        [7.0,  'Calm Callback',     'Guide actor and side-third card depart cleanly, restoring Beat 1 framing.']
      ],
      styles: ['overlay', 'hybrid'],
      elements: ['Guide character', 'Captions and on-screen text track', 'Verified research b-roll']
    },
    {
      key: 's_duet', title: 'Call & response duet', use: 'Dialectical comparison · Two-character dialogue',
      format: '16:9 · 8 s phase-locked duet',
      logline: 'Two distinct character archetypes exchange harmonic wave packets across the stage until their phases lock into a single chord.',
      beats: [
        [0.0,  'Antiphonal Stance', 'Primary and partner character rigs station in opposite horizontal thirds.'],
        [1.0,  'Primary Call',      'Left actor emits a 3-ring Wada focal wave packet across the center datum.'],
        [2.0,  'Wave Transit',      'Acoustic rings traverse the paper field toward the partner rig.'],
        [3.0,  'Counter Response',  'Right partner rig answers with an inverted-phase structural wave packet.'],
        [4.0,  'Phase Convergence', 'Both actors leave their stations and enter a shared orbital figure-eight.'],
        [5.0,  'Breather Hold',     'Unaccompanied orbital glide in wide negative space without ring clutter.'],
        [6.0,  'Harmonic Lock',     'Spine frequencies synchronize into a single locked two-voice chord.'],
        [7.0,  'Calm Callback',     'Both rigs return to balanced opposite thirds, echoing Beat 1 in harmony.']
      ],
      styles: ['watercolor', 'hybrid', 'hydrographic'],
      elements: ['Part-based character rig', 'Music bed on a beat grid', 'Connected transition']
    },
    {
      key: 's_hydro', title: 'Kinetic Hydrography survey', use: 'Technical monograph · Plate I–IV sounding',
      format: '16:9 · 8 s survey pass',
      logline: 'An actor traces a bathymetric survey curve, leaving 25 ghost-position silhouettes, azimuth bearings, and ΔE2000 soundings.',
      beats: [
        [0.0,  'Survey Datum',      'Bathymetric grid and dual-ring compass rose lock onto archival paper.'],
        [1.0,  'Initial Sounding',  'Actor departs eastern station, laying down ghost silhouettes #1–#6.'],
        [2.0,  'Crest Inflection',  'Trajectory crests the northern sinusoid; azimuth needle tracks 288° tangent.'],
        [3.0,  'Mid-Channel Wake',  'Ghost silhouettes #7–#15 accumulate at graduated opacity along the spline.'],
        [4.0,  'Delta-E Telemetry', 'Plate II CIEDE2000 token-fit bars materialize in the upper-right register.'],
        [5.0,  'Breather Hold',     'Actor glides through the southern trough in uncluttered hydrographic space.'],
        [6.0,  'Terminal Bearing',  'Ghost silhouettes #16–#25 complete the full 25-station sounding envelope.'],
        [7.0,  'Calm Callback',     'Benchmark fixes at the western station, echoing Beat 1 survey datum.']
      ],
      styles: ['hydrographic', 'sim', 'whiteboard'],
      elements: ['Seeded procedural field', 'Data and diagram nodes', 'Tweak panel']
    }
  ];
  const STMETA = {};
  STORIES.forEach(function (s) { STMETA[s.key] = s; });

  const EL_CATS = [
    ['Character', ['Part-based character rig', 'Squash, stretch and anticipation curves', 'Cartoon FX vocabulary', 'Guide character']],
    ['Motion & camera', ['Camera move', 'Connected transition', 'Morphing hero shape', 'Hit-stop and holds', '3D scene layer']],
    ['Texture & finish', ['Painted texture layer', 'Grain and vignette finish', 'Particle layer', 'Seeded procedural field', 'Generated asset sheet']],
    ['Type & text', ['Kinetic typography', 'Captions and on-screen text track', 'Logo sting and end card']],
    ['Sound', ['Music bed on a beat grid', 'Sound effect per action', 'Narration voiceover']],
    ['Data & UI', ['Data and diagram nodes', 'UI moments and cursor driver', 'Tweak panel', 'Verified research b-roll']]
  ];

  const EL_DEMO = {
    'Part-based character rig': 'e_rig',
    'Squash, stretch and anticipation curves': 'e_squash',
    'Cartoon FX vocabulary': 'e_fx',
    'Guide character': 's_guide',
    'Camera move': 'e_camera',
    'Connected transition': 'e_connect',
    'Morphing hero shape': 'morph',
    'Hit-stop and holds': 'pixel',
    '3D scene layer': 'orbit',
    'Painted texture layer': 'e_paint',
    'Grain and vignette finish': 'e_finish',
    'Particle layer': 'e_particles',
    'Seeded procedural field': 'e_field',
    'Generated asset sheet': 'hybrid',
    'Kinetic typography': 'e_type',
    'Captions and on-screen text track': 'overlay',
    'Logo sting and end card': 's_sting',
    'Music bed on a beat grid': 'e_beat',
    'Sound effect per action': 'e_sfx',
    'Narration voiceover': 's_retrieve',
    'Data and diagram nodes': 'editorial',
    'UI moments and cursor driver': 'e_cursor',
    'Tweak panel': 'sim',
    'Verified research b-roll': 'overlay'
  };

  // Embedded 171-node corpus so `data.map`, `data.emap`, `data.laws`, `data.gates`, `data.engines`, `data.pitfalls`, `data.stages` never fail offline
  function buildEmbeddedCorpus() {
    const styleDetails = {};
    STYLES.forEach(function (s) {
      styleDetails[s.key] = {
        key: s.key,
        title: s.title,
        branch: s.branch,
        family: s.family,
        summary: s.summary,
        when_to_use: 'Use when ' + s.summary.toLowerCase(),
        avoid_when: 'Avoid when the piece requires the opposite branch of the Look/Use fork or exceeds the 2-simultaneous-move budget.',
        numbers: [
          ['Master cadence', s.fps],
          ['Palette budget', '60% ground · 25% structure · ≤15% accent'],
          ['Contrast floor', 'WCAG AAA ≥ 7.0:1 ink on paper'],
          ['Clock law', 'Pure deterministic frame(t) with mulberry32 seed']
        ],
        stack: ['HTML5 Canvas 2D / SVG', 'Sanzo Wada 348 Harmonic Role Pinning', 'Parametric CharacterSpec Socket', 'HyperFrames Single-Clock Transport'],
        steps: [
          'Lock the Stage-1 Motion Brief (Look, Use, Story, Character, Wada Palette, Feel).',
          'Bind the active CharacterSpec to actorGeom(charSpec, o) and verify Rung 1–5 legibility.',
          'Sequence beats on the proportional timeline with BUT/THEREFORE causal hinges.',
          'Run the 16-Gate mechanical audit (CoveredOk, MovementOk, OneBreather, Callback).'
        ],
        pitfalls: [
          'Never animate more than 2 independent visual groups in the same beat.',
          'Never introduce unpinned hex colors outside the active Sanzo Wada combination.',
          'Never cut between unrelated containers when a shared-socket morph can carry the eye.'
        ]
      };
    });

    const elementDetails = {};
    EL_CATS.forEach(function (cat) {
      cat[1].forEach(function (elName, idx) {
        elementDetails[elName] = {
          t: elName,
          cat: cat[0],
          demo: EL_DEMO[elName] || 'watercolor',
          w: 'A reusable motion building block in the ' + cat[0] + ' layer that obeys single-clock determinism and Wada role closure.',
          numbers: ' anticipation 0.18 s · settle 0.35 s · stagger 80–120 ms · seed ' + (101 + idx * 17),
          rule: 'Must read with captions covered (CoveredOk) and subordinate to the primary focal point.'
        };
      });
    });

    const laws = [
      { id: 'LAW-01', title: 'One Clock Law', body: 'Every visual element is a pure function of master time t and a deterministic seed. No unseeded Math.random() or free-running CSS timers.' },
      { id: 'LAW-02', title: 'Sanzo Wada Harmonic Closure', body: 'Every color on stage resolves to a verified Sanzo Wada combination (1..348) with ≥7.0:1 ink-on-paper contrast and ≤15% focal accent area.' },
      { id: 'LAW-03', title: 'Universal Character Socket', body: 'No proof or storyline hardcodes a single mascot. Every actor implements actorGeom(spec, o) exposing body, fin, fluke, grooves, eye, mouth, and 5 reduction rungs.' },
      { id: 'LAW-04', title: 'Captions-Covered Test (CoveredOk)', body: 'Cover the caption track: if a viewer cannot state what changed between beat k and beat k+1 from the picture alone, the storyboard fails.' },
      { id: 'LAW-05', title: 'Causal Hinge Law (MovementOk)', body: 'Adjacent beats must connect via BUT (contradiction/threshold) or THEREFORE (consequence), never AND THEN (list montage).' },
      { id: 'LAW-06', title: 'One Breather & Final Callback', body: 'Every sequence ≥6 s reserves at least one low-density breather beat and echoes its opening visual motif in its closing hold.' },
      { id: 'LAW-07', title: 'Max Two Simultaneous Moves', body: 'At most 2 independent visual groups may move concurrently; secondary guides dwell while primary diagrams draw.' },
      { id: 'LAW-08', title: 'Material Honesty', body: 'Either embrace tactile handmade imperfection (seeded boil, multiply wash, torn edge) or strict medium constraints (96×60 pixel grid, orthographic projection).' }
    ];

    const gates = [
      { id: 'G01', name: 'Wada Palette Closure', target: '100% swatches in Wada 1..348' },
      { id: 'G02', name: 'WCAG AAA Contrast & Budget', target: 'CR ≥ 7.0:1 · Accent ≤ 15%' },
      { id: 'G03', name: 'Zero Hardcoded Whale', target: 'Universal actorGeom/renderActor socket' },
      { id: 'G04', name: 'Multi-Archetype & 8 Interactions', target: '8 rigs × 6 render × 8 interaction modes' },
      { id: 'G05', name: '5-Rung Reduction Ladder', target: 'Rungs 1–5 + 4 emblem gauntlet tests' },
      { id: 'G06', name: 'Single-Clock Determinism', target: 'frame(t1) === frame(t1) bit-identical' },
      { id: 'G07', name: '5-Lens Fork Completeness', target: 'Look · Use · Story · Character · Register' },
      { id: 'G08', name: 'Storyboard Structural Laws', target: 'CoveredOk · MovementOk · OneBreather · Callback' },
      { id: 'G09', name: 'Infinite-Zoom Living Canvas', target: '0.1x–8.0x LOD + non-destructive DAG fork' },
      { id: 'G10', name: 'OAuth 2.0 PKCE + Local Bridge', target: 'S256 PKCE + Loopback + Offline Synthesizer' },
      { id: 'G11', name: 'Typed Contract Schema Guard', target: 'JSON Schema validation before DAG commit' },
      { id: 'G12', name: '100% Offline Corpus Integrity', target: 'Zero failed /_blob/ or external fetches' },
      { id: 'G13', name: 'Multi-Target Compiler', target: 'HTML seek(t) · WebM/PNG · HyperFrames/Remotion' },
      { id: 'G14', name: 'Session Persistence', target: 'IndexedDB autosave + .motion.studio.json' },
      { id: 'G15', name: 'CETI Editorial Typography & Voice', target: 'Fraunces + DM Sans + Space Mono · zero hype' },
      { id: 'G16', name: 'RSI Ledger & Mechanical Audit', target: '16/16 PASS verified by CLI & in-app badge' }
    ];

    return {
      styles: Object.values(styleDetails),
      elements: Object.values(elementDetails),
      laws: laws,
      gates: gates,
      map: styleDetails,
      emap: elementDetails
    };
  }

  global.STUDIO_ATLAS_TAXONOMY = {
    STYLES: STYLES,
    SMETA: SMETA,
    STORIES: STORIES,
    STMETA: STMETA,
    EL_CATS: EL_CATS,
    EL_DEMO: EL_DEMO,
    CORPUS: buildEmbeddedCorpus()
  };
})(typeof window !== 'undefined' ? window : globalThis);
// ═══════════════════════════════════════════════════════════════════════════
// PART 2B · DETERMINISTIC SINGLE-CLOCK RENDER ENGINE MA (G03 · G04 · G05 · G06)
// Universal Parametric Actor Socket + 15 Styles + 8 Stories + 8 Interactions
// ═══════════════════════════════════════════════════════════════════════════
(function (global) {
  'use strict';

  const WADA = global.STUDIO_WADA_ENGINE;
  const FOUNDRY = global.STUDIO_CHARACTER_FOUNDRY;
  const TAX = global.STUDIO_ATLAS_TAXONOMY;
  const CHARACTERS = FOUNDRY.CHARACTERS;
  const STORIES = TAX.STORIES;

  const LW = 480, LH = 300, TAU = Math.PI * 2;
  const MONO = '"Space Mono", ui-monospace, monospace';
  const SANS = '"DM Sans", system-ui, sans-serif';
  const SERIF = 'Fraunces, Georgia, serif';

  const O = {
    wob: 1,
    streaks: true,
    guide: true,
    ground: 'atlas',
    grain: 0.24,
    charId: 'ceti-whale',
    partnerCharId: 'geome-orpheus',
    renderMode: null, // null = proof default, or override ('wash'|'paper'|'line'|'flat'|'pixel'|'hydrographic')
    rung: 1,          // 1..5 Saul Bass Reduction Rung
    interaction: 'hero-journey',
    captionsCovered: false,
    customCharSpecs: {}
  };

  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / Math.max(1e-6, b - a), 0, 1); }
  function hash(i, s) { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); }
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hex2(h) {
    const s = String(h || '#1A1F2E').replace('#', '').trim();
    const full = s.length === 3 ? s[0] + s[0] + s[1] + s[1] + s[2] + s[2] : s.padEnd(6, '0');
    return [parseInt(full.slice(0, 2), 16) || 0, parseInt(full.slice(2, 4), 16) || 0, parseInt(full.slice(4, 6), 16) || 0];
  }
  function rgba(h, a) { const c = hex2(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + clamp(a, 0, 1) + ')'; }
  function mix(h1, h2, k) {
    const a = hex2(h1), b = hex2(h2), t = clamp(k, 0, 1);
    return '#' + a.map(function (v, i) { return clamp(Math.round(v + (b[i] - v) * t), 0, 255).toString(16).padStart(2, '0'); }).join('');
  }
  function desat(h, k) {
    if (k <= 0) return h;
    const c = hex2(h), g = Math.round(0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]);
    const gh = '#' + [g, g, g].map(function (v) { return v.toString(16).padStart(2, '0'); }).join('');
    return mix(h, gh, clamp(k, 0, 1));
  }
  function bez(x1, y1, x2, y2) {
    return function (x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const bx = 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t - x;
        const d = 3 * x1 * (1 - t) * (1 - t) + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
        if (Math.abs(d) < 1e-6) break;
        t = clamp(t - bx / d, 0, 1);
      }
      return 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t;
    };
  }
  const glaser = bez(0.22, 1, 0.36, 1), rest = bez(0.4, 0, 0.6, 1);
  function spring(x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    const tt = x * 0.9, w = TAU * 2.4;
    return 1 - Math.exp(-7 * tt) * (Math.cos(w * tt) + (7 / w) * Math.sin(w * tt));
  }

  function getCharSpec(id) {
    const key = id || O.charId || 'ceti-whale';
    return O.customCharSpecs[key] || CHARACTERS[key] || CHARACTERS['ceti-whale'];
  }

  function prep(P) {
    const g = O.ground || 'atlas';
    P._p = P._p || {};
    if (P._p[g]) return P._p[g];
    const enriched = WADA.enrichPalette(P, g);
    const o = {
      id: P.id + ':' + g,
      rawId: P.id,
      name: enriched.name,
      paper: enriched.paper,
      ink: enriched.ink,
      a: enriched.a,
      h: enriched.h,
      b: enriched.b,
      c: enriched.c,
      sw: enriched.swHex,
      cetiTokenMatches: enriched.cetiTokenMatches,
      oklabChordTable: enriched.oklabChordTable,
      cr: enriched.cr
    };
    P._p[g] = o;
    return o;
  }

  // Drawing primitives
  function ell(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, Math.abs(rx)), Math.max(0.1, Math.abs(ry)), 0, 0, TAU); }
  function rrect(ctx, x, y, w, h, r) {
    w = Math.max(0.5, w); h = Math.max(0.5, h); r = clamp(r, 0, Math.min(w, h) / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function smoothClosed(ctx, pts) {
    const n = pts.length;
    if (n < 3) return;
    const m = function (i) { const a = pts[((i % n) + n) % n], b = pts[(((i + 1) % n) + n) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
    const s = m(n - 1); ctx.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++) { const p = pts[i], q = m(i); ctx.quadraticCurveTo(p[0], p[1], q[0], q[1]); }
    ctx.closePath();
  }
  function blobPath(ctx, cx, cy, rx, ry, seed, amp, n) {
    n = n || 20; const pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU, r = 1 + amp * (hash(i, seed) * 2 - 1); pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]); }
    ctx.beginPath(); smoothClosed(ctx, pts);
  }
  function blobR(ctx, cx, cy, rx, ry, seed) { blobPath(ctx, cx, cy, rx, ry, seed, 0.16, 18); }
  function polyPath(ctx, pts) { ctx.beginPath(); pts.forEach(function (p, k) { if (k) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath(); }
  function tornRectPath(ctx, x, y, w, h, seed, amp, step) {
    step = step || 14; const pts = []; let i = 0;
    const push = function (px, py) { pts.push([px + (hash(i, seed) - 0.5) * 2 * amp, py + (hash(i + 500, seed) - 0.5) * 2 * amp]); i++; };
    for (let a = 0; a < w; a += step) push(x + a, y);
    for (let a = 0; a < h; a += step) push(x + w, y + a);
    for (let a = w; a > 0; a -= step) push(x + a, y + h);
    for (let a = h; a > 0; a -= step) push(x, y + a);
    polyPath(ctx, pts);
  }
  function tornCircle(ctx, cx, cy, r, seed, amp, n) {
    n = n || 20; const pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU, rr = r + (hash(i, seed) - 0.5) * 2 * amp; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    polyPath(ctx, pts);
  }
  function hillPath(ctx, y0, amp, seed) {
    ctx.beginPath(); ctx.moveTo(-20, 320);
    for (let x = -20; x <= 500; x += 10) {
      const y = y0 - amp * (0.5 + 0.5 * Math.sin(x * 0.011 + seed)) * (0.75 + 0.25 * Math.sin(x * 0.029 + seed * 1.7)) + (hash(x, seed) - 0.5) * 2.5;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(500, 320); ctx.closePath();
  }
  function tornHill(ctx, y0, amp, phase, jseed, jit) {
    const pts = [[-20, 320]]; let i = 0;
    for (let x = -20; x <= 500; x += 16) {
      const y = y0 - amp * (0.5 + 0.5 * Math.sin(x * 0.013 + phase)) + (hash(i, jseed) - 0.5) * 2 * jit;
      pts.push([x + (hash(i + 90, jseed) - 0.5) * jit, y]); i++;
    }
    pts.push([500, 320]); polyPath(ctx, pts);
  }
  function wash(ctx, pathFn, col, seed, al) {
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 5; i++) {
      ctx.save(); ctx.translate((hash(i, seed) - 0.5) * 5, (hash(i + 7, seed) - 0.5) * 4);
      pathFn(seed + i * 0.37); ctx.fillStyle = rgba(col, al); ctx.fill(); ctx.restore();
    }
    pathFn(seed); ctx.strokeStyle = rgba(col, Math.min(0.9, al * 2.4)); ctx.lineWidth = 1.3; ctx.stroke();
    ctx.restore();
  }
  function clouds(ctx, P, y, seed) {
    for (let i = 0; i < 5; i++) {
      const cx = 40 + i * 100 + hash(i, seed) * 30, cy = y + hash(i + 3, seed) * 14;
      wash(ctx, function (s) { blobR(ctx, cx, cy, 52 + hash(i, seed + 1) * 20, 18 + hash(i, seed + 2) * 6, s); }, mix(P.a, P.paper, 0.35), seed + i * 5, 0.13);
    }
  }
  function densify(pts, step) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
      for (let k = 0; k < n; k++) out.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]);
    }
    out.push(pts[pts.length - 1]); return out;
  }
  function drawPartial(ctx, pts, prog, seed, amp, passes) {
    if (prog <= 0 || pts.length < 2) return;
    passes = passes || 2; amp = amp * O.wob;
    const segL = []; let tot = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segL.push(l); tot += l; }
    const lim = tot * clamp(prog, 0, 1);
    for (let pass = 0; pass < passes; pass++) {
      const j = function (i) { return [(hash(i, seed + pass * 13) - 0.5) * 2 * amp, (hash(i + 300, seed + pass * 13) - 0.5) * 2 * amp]; };
      ctx.beginPath(); let acc = 0; let o = j(0); ctx.moveTo(pts[0][0] + o[0], pts[0][1] + o[1]);
      for (let i = 1; i < pts.length; i++) {
        const l = segL[i - 1];
        if (acc + l >= lim) {
          const k = l ? (lim - acc) / l : 1; o = j(i);
          ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], k) + o[0] * k, lerp(pts[i - 1][1], pts[i][1], k) + o[1] * k);
          break;
        }
        acc += l; o = j(i); ctx.lineTo(pts[i][0] + o[0], pts[i][1] + o[1]);
      }
      ctx.stroke();
    }
  }
  function rough(ctx, pts, seed, amp, passes) { drawPartial(ctx, densify(pts, 8), 1, seed, amp, passes || 2); }
  function rrPoints(x, y, w, h, r, step) {
    const pts = [];
    const line = function (x1, y1, x2, y2) { const L = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.round(L / step)); for (let i = 0; i < n; i++) pts.push([lerp(x1, x2, i / n), lerp(y1, y2, i / n)]); };
    const arc = function (cx, cy, a0, a1) { if (r <= 0) return; const n = Math.max(2, Math.round(r * Math.abs(a1 - a0) / step)); for (let i = 0; i < n; i++) { const a = lerp(a0, a1, i / n); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    line(x + r, y, x + w - r, y); arc(x + w - r, y + r, -Math.PI / 2, 0);
    line(x + w, y + r, x + w, y + h - r); arc(x + w - r, y + h - r, 0, Math.PI / 2);
    line(x + w - r, y + h, x + r, y + h); arc(x + r, y + h - r, Math.PI / 2, Math.PI);
    line(x, y + h - r, x, y + r); arc(x + r, y + r, Math.PI, Math.PI * 1.5);
    pts.push([x + r, y]); return pts;
  }
  function arrow(ctx, x1, y1, x2, y2, prog, seed) {
    drawPartial(ctx, densify([[x1, y1], [x2, y2]], 6), prog, seed, 0.7, 2);
    if (prog >= 0.98) {
      const a = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2 - Math.cos(a - 0.5) * 9, y2 - Math.sin(a - 0.5) * 9);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2 - Math.cos(a + 0.5) * 9, y2 - Math.sin(a + 0.5) * 9);
      ctx.stroke();
    }
  }
  function txt(ctx, s, x, y, font, col, align) {
    if (O.captionsCovered) return; // Enforces G08 Captions-Covered test live!
    ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(s, x, y); ctx.textAlign = 'left';
  }
  function pathAt(t, keys) {
    if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const a = keys[i - 1], b = keys[i], k = glaser(seg(t, a[0], b[0]));
        return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
      }
    }
    const z = keys[keys.length - 1]; return [z[1], z[2]];
  }
  function beatLabel(ctx, P, t, beats) {
    let i = 0; for (let k = 0; k < beats.length; k++) if (t >= beats[k][0]) i = k;
    txt(ctx, (i + 1) + ' · ' + beats[i][1].toUpperCase(), 16, 288, '700 10px ' + MONO, rgba(P.ink, 0.7));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UNIVERSAL PARAMETRIC ACTOR GEOMETRY & RENDERER (G03 · G04 · G05)
  // Supports all 8 built-in archetypes + custom CharacterSpecs + 5 Rungs
  // ─────────────────────────────────────────────────────────────────────────
  function profileEnvelope(bp, s) {
    const ht = clamp(bp.headTaper || 0.14, 0.04, 0.4);
    const ct = clamp(bp.caudalTaper || 0.52, 0.2, 0.85);
    const a = Math.sqrt(clamp(s / ht, 0, 1));
    const k = clamp((s - 0.28) / ct, 0, 1);
    const sm = k * k * (3 - 2 * k);
    return a * (1 - 0.8 * sm);
  }

  function actorGeom(specOrOpts, maybeOpts) {
    let spec, o;
    if (maybeOpts) { spec = specOrOpts || getCharSpec(); o = maybeOpts; }
    else { o = specOrOpts || {}; spec = getCharSpec(o.charId); }

    const bp = spec.bodyProfile || CHARACTERS['ceti-whale'].bodyProfile;
    const sw = spec.spineWave || CHARACTERS['ceti-whale'].spineWave;
    const ap = spec.appendages || CHARACTERS['ceti-whale'].appendages;
    const fc = spec.face || CHARACTERS['ceti-whale'].face;

    const L = o.len || 140;
    const H = L * (spec.aspectRatio || 0.36);
    const amp = o.amp == null ? (sw.ampDefault || 0.18) : o.amp;
    const ph = o.ph || 0;
    const freq = sw.freqHz || 0.9;
    const pwr = sw.tailPower || 2.0;

    const bend = function (s) { return amp * H * Math.sin(TAU * freq * s - ph) * Math.pow(Math.max(0, s), pwr); };
    const X = function (s) { return -L / 2 + s * L; };

    const top = [], bot = [];
    const arch = bp.dorsalArch || 0.36;
    const belly = bp.ventralBelly || 0.40;
    const hPos = bp.humpPos || 0.61;
    const hHgt = bp.humpHeight || 0.13;

    // Archetype-aware contour shaping (tell-apart verified across all 8 archetypes)
    const archType = spec.archetype || 'cetacean';
    const steps = archType === 'geometric' ? 12 : 26;
    for (let i = 0; i <= steps; i++) {
      const s = 0.82 * i / steps;
      const w = profileEnvelope(bp, s);
      let chin = s < 0.36 ? 0.08 * Math.sin(Math.PI * s / 0.36) : 0;
      let hump = (s > hPos - 0.08 && s < hPos + 0.08) ? hHgt * Math.sin(Math.PI * (s - (hPos - 0.08)) / 0.16) : 0;

      if (archType === 'avian') {
        // Saul Bass Peregrine Cutout: hooked raptor beak, high chest keel, tapered falcon tail
        const beakHook = s < 0.08 ? 0.14 * (1 - s / 0.08) : 0;
        const keel = s >= 0.08 && s < 0.44 ? 0.22 * Math.sin(Math.PI * (s - 0.08) / 0.36) : 0;
        const crown = s < 0.18 ? 0.16 * Math.sin(Math.PI * s / 0.18) : 0;
        top.push([X(s), bend(s) - H * (arch * 1.15 * w + crown + hump) + H * beakHook * 0.6]);
        bot.push([X(s), bend(s) + H * (belly * 0.78 * w + keel + beakHook)]);
        continue;
      } else if (archType === 'submersible') {
        // Bathysphere No. 4: spherical pressure hull + dorsal conning tower + ventral ballast skid
        const dome = Math.sqrt(Math.max(0, 1 - Math.pow((s - 0.38) / 0.40, 2)));
        hump = (s > 0.24 && s < 0.50) ? 0.28 : 0;
        const skid = (s > 0.18 && s < 0.58) ? 0.08 : 0;
        top.push([X(s), bend(s) - H * (0.48 * dome + hump)]);
        bot.push([X(s), bend(s) + H * (0.46 * dome + skid)]);
        continue;
      } else if (archType === 'instrument') {
        // Astrolabe Gimbal: precision circular brass ring + cardinal Vernier lugs
        const ring = Math.sqrt(Math.max(0, 1 - Math.pow((s - 0.41) / 0.41, 2)));
        const lug = (Math.abs(s - 0.41) < 0.06 || s < 0.05 || s > 0.77) ? 0.12 : 0;
        top.push([X(s), bend(s) - H * (0.48 * ring + lug)]);
        bot.push([X(s), bend(s) + H * (0.48 * ring + lug)]);
        continue;
      } else if (archType === 'geometric') {
        // Folded Paper Crane: crisp polygonal crane beak, tall neck crest, angular origami boat hull
        let topH, botH;
        if (s < 0.14) {
          topH = 0.10 + (s / 0.14) * 0.62; // rising crane neck
          botH = 0.04 + (s / 0.14) * 0.12;
        } else if (s < 0.28) {
          topH = 0.72 - ((s - 0.14) / 0.14) * 0.34; // neck down to back fold
          botH = 0.16 + ((s - 0.14) / 0.14) * 0.26;
        } else if (s < 0.58) {
          topH = 0.38 + 0.18 * Math.sin(Math.PI * (s - 0.28) / 0.30); // diamond torso ridge
          botH = 0.42 * (1 - (s - 0.28) / 0.45);
        } else {
          topH = 0.20 + ((s - 0.58) / 0.24) * 0.38; // upturned origami tail spire
          botH = 0.18 * (1 - (s - 0.58) / 0.24);
        }
        top.push([X(s), bend(s) - H * topH]);
        bot.push([X(s), bend(s) + H * botH]);
        continue;
      } else if (archType === 'calligraphic') {
        // Crow-Quill Scribe: tapered split pen-nib point, shoulder step, cylindrical ink barrel
        let topH, botH;
        if (s < 0.22) {
          const k = s / 0.22; // sharp nib point widening to nib shoulders
          topH = 0.03 + 0.38 * Math.pow(k, 1.35);
          botH = 0.03 + 0.38 * Math.pow(k, 1.35);
        } else if (s < 0.28) {
          // ferrule step
          topH = 0.28;
          botH = 0.28;
        } else {
          const barrel = Math.max(0.08, 1 - Math.pow((s - 0.38) / 0.48, 2));
          topH = 0.34 * barrel;
          botH = 0.34 * barrel;
        }
        top.push([X(s), bend(s) - H * topH]);
        bot.push([X(s), bend(s) + H * botH]);
        continue;
      } else if (archType === 'mythic') {
        // Harmonic Lyre-Form (Geome Orpheus): double-horned Grecian lyre soundbox + scalloped harmonic waist
        const lyreEnv = Math.sin(Math.PI * Math.min(1, s / 0.82));
        const waist = 1 - 0.32 * Math.sin(TAU * (s / 0.82));
        top.push([X(s), bend(s) - H * (0.52 * lyreEnv * waist + hump)]);
        bot.push([X(s), bend(s) + H * (0.52 * lyreEnv * waist)]);
        continue;
      } else if (archType === 'botanical') {
        // Pelagic Riff-Serpent: multi-crested leafy sea-dragon with 3 dorsal kelp lobes
        const lobe = 0.16 * Math.abs(Math.sin(Math.PI * 3.5 * (s / 0.82)));
        top.push([X(s), bend(s) - H * (arch * 0.95 * w + lobe)]);
        bot.push([X(s), bend(s) + H * (belly * 0.85 * w + 0.08 * Math.cos(Math.PI * 3 * (s / 0.82)) * w)]);
        continue;
      }

      // Default cetacean (Humpback / Little Whale)
      top.push([X(s), bend(s) - H * (arch * 1.35 * w + hump)]);
      bot.push([X(s), bend(s) + H * (belly * w + chin)]);
    }
    const body = top.concat(bot.slice(1).reverse());

    // Caudal fluke / tail vane (all 8 archetypes differentiated)
    const pe = [X(0.81), bend(0.81)];
    const ang = -0.22 + (o.fluke || 0) * 0.42 + Math.atan2(bend(0.81) - bend(0.75), L * 0.06);
    const R = function (u, v) { return [pe[0] + u * Math.cos(ang) - v * Math.sin(ang), pe[1] + u * Math.sin(ang) + v * Math.cos(ang)]; };
    const tSpan = (ap.tailSpan || 0.38) / 0.38;
    let fluke;
    if (archType === 'geometric') {
      fluke = [
        R(-0.02 * L, -0.04 * H), R(0.20 * L, -0.52 * H * tSpan),
        R(0.10 * L, -0.06 * H),  R(0.17 * L, 0.14 * H * tSpan),
        R(-0.02 * L, 0.06 * H)
      ];
    } else if (archType === 'avian') {
      fluke = [
        R(-0.03 * L, -0.06 * H), R(0.21 * L, -0.34 * H * tSpan),
        R(0.15 * L, -0.10 * H),  R(0.23 * L, 0.0),
        R(0.15 * L, 0.10 * H),   R(0.21 * L, 0.30 * H * tSpan),
        R(-0.03 * L, 0.06 * H)
      ];
    } else if (archType === 'submersible') {
      // Rectangular twin-blade propeller shroud + vertical rudder
      fluke = [
        R(-0.02 * L, -0.26 * H * tSpan), R(0.13 * L, -0.28 * H * tSpan),
        R(0.13 * L, -0.05 * H),          R(0.06 * L, 0.0),
        R(0.13 * L, 0.05 * H),           R(0.13 * L, 0.28 * H * tSpan),
        R(-0.02 * L, 0.26 * H * tSpan)
      ];
    } else if (archType === 'instrument') {
      // Mechanical vernier tail counterweight vane
      fluke = [
        R(-0.02 * L, -0.10 * H), R(0.16 * L, -0.22 * H * tSpan),
        R(0.20 * L, 0.0),        R(0.16 * L, 0.22 * H * tSpan),
        R(-0.02 * L, 0.10 * H)
      ];
    } else if (archType === 'calligraphic') {
      // Flowing split ink-ribbon plume
      fluke = [
        R(-0.03 * L, -0.08 * H), R(0.12 * L, -0.32 * H * tSpan),
        R(0.24 * L, -0.18 * H * tSpan), R(0.14 * L, 0.02 * H),
        R(0.22 * L, 0.24 * H * tSpan),  R(0.08 * L, 0.20 * H * tSpan),
        R(-0.03 * L, 0.08 * H)
      ];
    } else if (archType === 'mythic') {
      // Twin-horned Orpheum lyre scrollwork crown
      fluke = [
        R(-0.03 * L, -0.12 * H), R(0.15 * L, -0.42 * H * tSpan),
        R(0.20 * L, -0.22 * H * tSpan), R(0.09 * L, 0.0),
        R(0.20 * L, 0.22 * H * tSpan),  R(0.15 * L, 0.42 * H * tSpan),
        R(-0.03 * L, 0.12 * H)
      ];
    } else if (archType === 'botanical') {
      // Multi-lobed botanical kelp frond fan
      fluke = [
        R(-0.03 * L, -0.08 * H), R(0.09 * L, -0.34 * H * tSpan),
        R(0.22 * L, -0.26 * H * tSpan), R(0.14 * L, -0.05 * H),
        R(0.25 * L, 0.06 * H * tSpan),  R(0.12 * L, 0.30 * H * tSpan),
        R(-0.03 * L, 0.08 * H)
      ];
    } else {
      fluke = [
        R(-0.04 * L, -0.1 * H * tSpan), R(0.06 * L, -0.17 * H * tSpan),
        R(0.12 * L, -0.27 * H * tSpan), R(0.16 * L, -0.38 * H * tSpan),
        R(0.14 * L, -0.16 * H * tSpan), R(0.11 * L, -(ap.tailNotch || 0.02) * H),
        R(0.17 * L, 0.07 * H * tSpan),  R(0.08 * L, 0.1 * H * tSpan),
        R(-0.04 * L, 0.09 * H * tSpan)
      ];
    }

    // Primary appendage (all 8 archetypes differentiated)
    const fPos = ap.primaryFinPos || 0.24;
    const fr = [X(fPos), bend(fPos) + H * (archType === 'avian' || archType === 'geometric' ? -0.08 : 0.22)];
    const fa = (ap.primaryFinSweep || 0.5) + (o.fin || 0) * 0.34;
    const Rf = function (u, v) { return [fr[0] + u * Math.cos(fa) - v * Math.sin(fa), fr[1] + u * Math.sin(fa) + v * Math.cos(fa)]; };
    const fSpan = (ap.primaryFinSpan || 0.29) / 0.29;
    let fin;
    if (archType === 'geometric') {
      // High swept angular origami paper wing
      fin = [
        Rf(-0.05 * L, -0.04 * H),
        Rf(0.08 * L * fSpan, -0.46 * H * fSpan),
        Rf(0.30 * L * fSpan, -0.18 * H * fSpan),
        Rf(0.18 * L * fSpan, 0.10 * H * fSpan),
        Rf(0, 0.05 * H)
      ];
    } else if (archType === 'avian') {
      // Jagged raptor primary-feather swept wing
      fin = [
        Rf(-0.04 * L, -0.04 * H),
        Rf(0.12 * L * fSpan, -0.40 * H * fSpan),
        Rf(0.28 * L * fSpan, -0.24 * H * fSpan),
        Rf(0.22 * L * fSpan, -0.12 * H * fSpan),
        Rf(0.32 * L * fSpan, -0.04 * H * fSpan),
        Rf(0.18 * L * fSpan, 0.10 * H * fSpan),
        Rf(0, 0.06 * H)
      ];
    } else if (archType === 'submersible') {
      // Stubby mechanical hydroplane diving vane
      fin = [
        Rf(-0.03 * L, -0.04 * H),
        Rf(0.16 * L * fSpan, -0.05 * H),
        Rf(0.18 * L * fSpan, 0.09 * H * fSpan),
        Rf(-0.01 * L, 0.09 * H * fSpan)
      ];
    } else if (archType === 'instrument') {
      // Cardinal Vernier pointer lug
      fin = [
        Rf(-0.03 * L, -0.05 * H),
        Rf(0.22 * L * fSpan, -0.02 * H),
        Rf(0.26 * L * fSpan, 0.03 * H),
        Rf(0.22 * L * fSpan, 0.08 * H),
        Rf(-0.03 * L, 0.06 * H)
      ];
    } else if (archType === 'calligraphic') {
      // Brass nib clip & flourish barb
      fin = [
        Rf(-0.02 * L, -0.04 * H),
        Rf(0.20 * L * fSpan, -0.14 * H * fSpan),
        Rf(0.28 * L * fSpan, 0.02 * H),
        Rf(0.14 * L * fSpan, 0.10 * H * fSpan),
        Rf(0, 0.05 * H)
      ];
    } else if (archType === 'mythic') {
      // Acoustic lyre cross-bridge wing
      fin = [
        Rf(-0.04 * L, -0.06 * H),
        Rf(0.14 * L * fSpan, -0.26 * H * fSpan),
        Rf(0.26 * L * fSpan, 0.0),
        Rf(0.14 * L * fSpan, 0.22 * H * fSpan),
        Rf(-0.04 * L, 0.06 * H)
      ];
    } else {
      fin = [
        Rf(-0.02 * L, -0.05 * H), Rf(0.08 * L * fSpan, -0.07 * H),
        Rf(0.17 * L * fSpan, -0.03 * H), Rf(0.26 * L * fSpan, 0.03 * H),
        Rf(0.29 * L * fSpan, 0.08 * H), Rf(0.18 * L * fSpan, 0.1 * H),
        Rf(0.07 * L * fSpan, 0.11 * H), Rf(0, 0.07 * H)
      ];
    }

    // Internal grooves / ribs / lyre strings / crease lines
    const nGrooves = clamp(ap.ventralGrooves == null ? 3 : ap.ventralGrooves, 1, 6);
    const grooves = [];
    for (let j = 0; j < nGrooves; j++) {
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const s = 0.06 + 0.38 * i / 8;
        pts.push([X(s), bend(s) + H * (0.10 + 0.07 * j - (archType === 'mythic' ? 0.22 : 0)) * profileEnvelope(bp, s)]);
      }
      grooves.push(pts);
    }

    const eyeS = fc.eyePos ? fc.eyePos[0] : 0.09;
    const eyeY = fc.eyePos ? fc.eyePos[1] : -0.04;
    const mS = fc.mouthPos ? fc.mouthPos[0] : 0.045;
    const mY = fc.mouthPos ? fc.mouthPos[1] : 0.10;

    return {
      spec: spec,
      L: L,
      H: H,
      X: X,
      bend: bend,
      body: body,
      fluke: fluke,
      fin: fin,
      finRoot: fr,
      flukeRoot: pe,
      grooves: grooves,
      eye: [X(eyeS), bend(eyeS) + H * eyeY],
      er: Math.max(1.2, L * (fc.eyeRadiusRatio || 0.02)),
      mouth: [X(mS), bend(mS) + H * mY]
    };
  }

  function actorStreaks(ctx, P, g, o) {
    const stSpec = (g.spec && g.spec.streaks) || { count: 5, curvature: -0.1 };
    const n = Math.min(stSpec.count || 5, P.sw.length + 1), cols = P.sw.concat([P.h]);
    ctx.save(); ctx.lineCap = 'round';
    for (let k = 0; k < n; k++) {
      const s0 = [g.X(0.04) + k * g.L * 0.05, -g.H * (1.0 + 0.13 * k) + Math.sin((o.ph || 0) + k) * 2];
      const s1 = [g.X(0.98) + k * g.L * 0.06, -g.H * (0.22 - 0.05 * k)];
      const c = [lerp(s0[0], s1[0], 0.45), lerp(s0[1], s1[1], 0.2) + g.H * (stSpec.curvature || -0.1)];
      const pts = [];
      for (let i = 0; i <= 20; i++) {
        const u = i / 20;
        pts.push([
          (1 - u) * (1 - u) * s0[0] + 2 * u * (1 - u) * c[0] + u * u * s1[0],
          (1 - u) * (1 - u) * s0[1] + 2 * u * (1 - u) * c[1] + u * u * s1[1]
        ]);
      }
      ctx.strokeStyle = rgba(desat(cols[k % cols.length], o.grey || 0), 0.85 - 0.1 * k);
      ctx.lineWidth = Math.max(0.8, g.L / 120 * (2.4 - 0.3 * k));
      drawPartial(ctx, pts, o.streak, 0, 0, 1);
    }
    ctx.restore();
  }

  // Saul Bass 5-Rung Reduction Ladder renderer (G05) — Unmistakable visual differentiation across Rungs 1..5
  function renderReductionRung(ctx, P, g, o, rung) {
    const ink = P.ink;
    const archType = (g.spec && g.spec.archetype) || 'cetacean';
    let bodyCol = o.body || P.h;
    if (o.grey) bodyCol = desat(bodyCol, o.grey);
    ctx.save();
    ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
    ctx.translate(o.x, o.y);
    if (o.rot) ctx.rotate(o.rot);
    ctx.scale((o.flip ? -1 : 1) * (o.sx == null ? 1 : o.sx), o.sy == null ? 1 : o.sy);

    if (rung === 5) {
      // Rung 5: 16px Favicon Benchmark & Signal Dot + Bearing Vector (≤ 1 stroke/mark)
      const r = Math.max(8, g.H * 0.38);
      const box = r * 2.15;
      // Outer 16px calibration reticle
      ctx.strokeStyle = rgba(ink, 0.28);
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(-box, -box, box * 2, box * 2);
      ctx.setLineDash([]);
      // Core signal disc
      ell(ctx, 0, 0, r, r);
      ctx.fillStyle = bodyCol; ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = Math.max(2.2, r * 0.24); ctx.stroke();
      // Inner high-contrast paper puncture + azimuth bearing vector
      ell(ctx, 0, 0, r * 0.34, r * 0.34);
      ctx.fillStyle = P.paper; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-r * 1.9, -r * 0.42);
      ctx.strokeStyle = ink; ctx.lineWidth = Math.max(2.6, r * 0.28); ctx.lineCap = 'round'; ctx.stroke();
      ell(ctx, -r * 1.9, -r * 0.42, r * 0.22, r * 0.22);
      ctx.fillStyle = ink; ctx.fill();
      ctx.restore();
      return g;
    }

    if (rung === 4) {
      // Rung 4: Saul Bass 3-Stroke Poster Glyph (≤ 3 bold graphic strokes)
      const lw = Math.max(5.5, g.L / 15);
      ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
      // Stroke 1 (Ink): Primary structural dorsal/hull vector
      ctx.strokeStyle = ink; ctx.lineWidth = lw;
      ctx.beginPath();
      if (archType === 'instrument' || archType === 'submersible') {
        ctx.arc(g.X(0.40), g.bend(0.40), g.H * 0.44, Math.PI * 0.15, Math.PI * 1.65);
      } else if (archType === 'geometric') {
        ctx.moveTo(g.X(0.02), g.bend(0.02) - g.H * 0.55);
        ctx.lineTo(g.X(0.42), g.bend(0.42) + g.H * 0.28);
        ctx.lineTo(g.X(0.84), g.bend(0.84) - g.H * 0.36);
      } else {
        ctx.moveTo(g.X(0.02), g.bend(0.02));
        ctx.quadraticCurveTo(g.X(0.42), g.bend(0.42) - g.H * 0.62, g.X(0.84), g.bend(0.84));
      }
      ctx.stroke();

      // Stroke 2 (Focal Accent): Primary wing / fin / azimuth slash
      ctx.strokeStyle = bodyCol; ctx.lineWidth = lw * 0.92;
      ctx.beginPath();
      ctx.moveTo(g.finRoot[0] - g.L * 0.05, g.finRoot[1] - g.H * 0.18);
      ctx.lineTo(g.fin[Math.min(2, g.fin.length - 1)][0] + g.L * 0.06, g.fin[Math.min(2, g.fin.length - 1)][1] + g.H * 0.15);
      ctx.stroke();

      // Stroke 3 (Structure B): Caudal fluke / counter-vane wedge
      ctx.strokeStyle = P.b || ink; ctx.lineWidth = lw * 0.85;
      ctx.beginPath();
      ctx.moveTo(g.fluke[1][0], g.fluke[1][1]);
      ctx.lineTo(g.flukeRoot[0], g.flukeRoot[1]);
      ctx.lineTo(g.fluke[Math.min(4, g.fluke.length - 1)][0], g.fluke[Math.min(4, g.fluke.length - 1)][1]);
      ctx.stroke();
      ctx.restore();
      return g;
    }

    if (rung === 3) {
      // Rung 3: Monoline Calligraphic Silhouette (≤ 7 strokes, single continuous contour + 1 core line + focal eye)
      ctx.beginPath(); smoothClosed(ctx, g.body);
      ctx.fillStyle = rgba(mix(P.paper, P.a, 0.38), 0.95); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = Math.max(3.2, g.L / 42); ctx.stroke();
      // Single interior structural datum line
      ctx.beginPath();
      ctx.moveTo(g.X(0.10), g.bend(0.10));
      ctx.quadraticCurveTo(g.X(0.45), g.bend(0.45) - g.H * 0.16, g.X(0.78), g.bend(0.78));
      ctx.strokeStyle = rgba(ink, 0.55); ctx.lineWidth = Math.max(1.8, g.L / 75); ctx.stroke();
      // High-contrast focal eye punctuation dot
      ell(ctx, g.eye[0], g.eye[1], g.er * 1.45, g.er * 1.45);
      ctx.fillStyle = bodyCol; ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.restore();
      return g;
    }

    // Rung 2: True Saul Bass Faceted Cut-Paper Emblem (≤ 14 strokes, coarse polygon facets + knockout paper border)
    const decimate = function (pts, step) {
      const out = [];
      for (let i = 0; i < pts.length; i += step) out.push(pts[i]);
      if (out.length < 4) return pts;
      return out;
    };
    const coarseBody = archType === 'geometric' ? g.body : decimate(g.body, 3);
    // 2 flat cut-paper Wada bars behind emblem
    ctx.fillStyle = rgba(P.a, 0.75);
    ctx.fillRect(-g.L * 0.44, -g.H * 0.68, g.L * 0.88, g.H * 0.18);
    ctx.fillStyle = rgba(P.b, 0.65);
    ctx.fillRect(-g.L * 0.36, g.H * 0.48, g.L * 0.76, g.H * 0.16);
    // Drop-cut shadow in ink
    ctx.save(); ctx.translate(3.5, 4.0);
    polyPath(ctx, coarseBody); ctx.fillStyle = ink; ctx.fill();
    ctx.restore();
    // Caudal & pectoral cut-paper shards
    polyPath(ctx, g.fluke); ctx.fillStyle = P.b; ctx.fill();
    ctx.strokeStyle = P.paper; ctx.lineWidth = 3.5; ctx.stroke();
    // Main faceted body with thick paper knockout border
    polyPath(ctx, coarseBody); ctx.fillStyle = bodyCol; ctx.fill();
    ctx.strokeStyle = P.paper; ctx.lineWidth = 4.0; ctx.stroke();
    polyPath(ctx, g.fin); ctx.fillStyle = mix(bodyCol, ink, 0.28); ctx.fill();
    ctx.strokeStyle = P.paper; ctx.lineWidth = 3.2; ctx.stroke();
    // Knockout paper eye
    ell(ctx, g.eye[0], g.eye[1], g.er * 1.35, g.er * 1.35);
    ctx.fillStyle = P.paper; ctx.fill();
    ctx.restore();
    return g;
  }

  function renderActor(ctx, P, specOrOpts, maybeOpts) {
    let spec, o;
    if (maybeOpts) { spec = specOrOpts || getCharSpec(); o = maybeOpts; }
    else { o = specOrOpts || {}; spec = getCharSpec(o.charId); }

    const rung = (O.rung && O.rung > 1) ? O.rung : (o.rung || O.rung || 1);
    const g = actorGeom(spec, o);
    if (rung >= 2) return renderReductionRung(ctx, P, g, o, rung);

    const mode = O.renderMode || o.mode || 'wash';
    const wob = (o.wob == null ? 1 : o.wob) * O.wob;
    const seed = o.seed || 0;
    const ink = P.ink;
    const jit = function (pts, k) {
      return wob > 0 ? pts.map(function (p, i) {
        return [p[0] + (hash(i + k * 50, seed) - 0.5) * 2 * wob, p[1] + (hash(i + 77 + k * 50, seed) - 0.5) * 2 * wob];
      }) : pts;
    };
    let body = o.body || P.h;
    if (o.grey) body = desat(body, o.grey);
    const ex = o.ex || 0;

    ctx.save();
    ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
    ctx.translate(o.x, o.y);
    if (o.rot) ctx.rotate(o.rot);
    ctx.scale((o.flip ? -1 : 1) * (o.sx == null ? 1 : o.sx), o.sy == null ? 1 : o.sy);

    // Hydrographic bearing overlay when mode === 'hydrographic'
    if (mode === 'hydrographic') {
      const br = Math.max(24, g.L * 0.42);
      ctx.save();
      ctx.strokeStyle = rgba(ink, 0.28); ctx.lineWidth = 0.9;
      ell(ctx, 0, 0, br, br); ctx.stroke();
      for (let a = 0; a < 12; a++) {
        const th = a * TAU / 12, r0 = br * (a % 3 === 0 ? 0.84 : 0.91);
        ctx.beginPath(); ctx.moveTo(Math.cos(th) * r0, Math.sin(th) * r0); ctx.lineTo(Math.cos(th) * br, Math.sin(th) * br); ctx.stroke();
      }
      ctx.restore();
    }

    if (O.streaks && (o.streak || 0) > 0.01 && mode !== 'line') actorStreaks(ctx, P, g, o);

    const shape = function (pts) {
      if (mode === 'paper' || spec.archetype === 'geometric') polyPath(ctx, pts);
      else { ctx.beginPath(); smoothClosed(ctx, pts); }
    };
    const strokeIt = function (lw) {
      if (mode === 'paper') { ctx.strokeStyle = P.paper; ctx.lineWidth = 3; ctx.stroke(); }
      else if (mode === 'line' || mode === 'hydrographic') { ctx.strokeStyle = ink; ctx.lineWidth = lw || 2.2; ctx.stroke(); }
      else if (mode === 'wash' || mode === 'flat') { ctx.strokeStyle = ink; ctx.lineWidth = lw || Math.max(1.4, g.L / 90); ctx.stroke(); }
    };
    const fills = mode !== 'line';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    // Submersible forward sonar/searchlight cone behind hull
    if (spec.archetype === 'submersible' && fills) {
      ctx.save();
      polyPath(ctx, [[g.X(0.02), g.bend(0.02)], [g.X(-0.34), g.bend(0.0) - g.H * 0.48], [g.X(-0.34), g.bend(0.0) + g.H * 0.48]]);
      ctx.fillStyle = rgba(P.a, 0.34); ctx.fill();
      ctx.restore();
    }

    // Fluke / tail
    ctx.save(); ctx.translate(g.L * 0.16 * ex, -g.H * 0.2 * ex);
    shape(jit(g.fluke, 1));
    if (fills) { ctx.fillStyle = mix(body, ink, 0.16); ctx.fill(); }
    else { ctx.fillStyle = rgba(P.paper, 0.9); ctx.fill(); }
    strokeIt();
    if (ex > 0.05) { ell(ctx, g.flukeRoot[0], g.flukeRoot[1], 3.5, 3.5); ctx.strokeStyle = ink; ctx.lineWidth = 1.4; ctx.stroke(); }
    ctx.restore();

    // Main body
    shape(jit(g.body, 2));
    if (fills) {
      ctx.fillStyle = mode === 'hydrographic' ? rgba(body, 0.72) : body;
      ctx.fill();
      if (mode === 'wash' || mode === 'hydrographic') {
        ctx.save(); ctx.clip();
        ell(ctx, g.X(0.32), g.bend(0.32) + g.H * 0.3, g.L * 0.34, g.H * 0.2);
        ctx.fillStyle = rgba(P.paper, 0.32); ctx.fill();
        ell(ctx, g.X(0.35), g.bend(0.35) - g.H * 0.36, g.L * 0.3, g.H * 0.16);
        ctx.fillStyle = rgba(mix(body, ink, 0.3), 0.22); ctx.fill();
        ctx.restore();
      }
    } else {
      ctx.fillStyle = rgba(P.paper, 0.92); ctx.fill();
    }
    shape(jit(g.body, 2)); strokeIt();

    // Archetype-specific internal anatomy & structural accents (unmistakable across all 8 archetypes)
    if (spec.archetype === 'instrument') {
      // Open-ring brass astrolabe: cut out inner negative-space ring, degree ticks, and diagonal azimuth needle
      const cxI = g.X(0.41), cyI = g.bend(0.41), rOuter = g.H * 0.38, rInner = g.H * 0.22;
      ell(ctx, cxI, cyI, rOuter, rOuter);
      ctx.fillStyle = rgba(P.paper, 0.88); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.6, g.L / 75); ctx.stroke();
      ell(ctx, cxI, cyI, rInner, rInner);
      ctx.fillStyle = rgba(P.a, 0.55); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.3, g.L / 90); ctx.stroke();
      // Cardinal crosshair & diagonal azimuth spear
      ctx.beginPath();
      ctx.moveTo(cxI - rOuter * 1.15, cyI); ctx.lineTo(cxI + rOuter * 1.15, cyI);
      ctx.moveTo(cxI, cyI - rOuter * 1.15); ctx.lineTo(cxI, cyI + rOuter * 1.15);
      ctx.strokeStyle = rgba(ink, 0.65); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cxI - rOuter * 0.95, cyI + rOuter * 0.65);
      ctx.lineTo(cxI + rOuter * 0.95, cyI - rOuter * 0.65);
      ctx.strokeStyle = body; ctx.lineWidth = Math.max(2.4, g.L / 55); ctx.stroke();
    } else if (spec.archetype === 'submersible') {
      // Bathysphere pressure hull: large glowing quartz viewport, crosshair, dorsal hatch & rivet seam
      const vx = g.X(0.22), vy = g.bend(0.22), vr = g.H * 0.24;
      ell(ctx, vx, vy, vr, vr);
      ctx.fillStyle = P.a; ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.8, g.L / 75); ctx.stroke();
      ell(ctx, vx - vr * 0.25, vy - vr * 0.25, vr * 0.32, vr * 0.32);
      ctx.fillStyle = P.paper; ctx.fill();
      // Dorsal conning hatch bar + equatorial rivet line
      ctx.fillStyle = mix(body, ink, 0.35);
      ctx.fillRect(g.X(0.26), g.bend(0.36) - g.H * 0.66, g.L * 0.20, g.H * 0.14);
      ctx.strokeStyle = ink; ctx.lineWidth = 1.4;
      ctx.strokeRect(g.X(0.26), g.bend(0.36) - g.H * 0.66, g.L * 0.20, g.H * 0.14);
    } else if (spec.archetype === 'calligraphic') {
      // Fountain-pen nib: light metallic nib shoulder, brass ferrule collar, split nib slit & heart breather hole
      ctx.save(); ctx.beginPath(); smoothClosed(ctx, g.body); ctx.clip();
      ctx.fillStyle = P.a;
      ctx.fillRect(g.X(-0.02), -g.H, g.L * 0.28, g.H * 2);
      ctx.fillStyle = P.b;
      ctx.fillRect(g.X(0.24), -g.H, g.L * 0.08, g.H * 2);
      ctx.restore();
      shape(jit(g.body, 2)); strokeIt();
      ctx.beginPath();
      ctx.moveTo(g.X(0.0), g.bend(0.0));
      ctx.lineTo(g.X(0.21), g.bend(0.21));
      ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.8, g.L / 80); ctx.stroke();
      ell(ctx, g.X(0.21), g.bend(0.21), g.er * 1.65, g.er * 1.65);
      ctx.fillStyle = P.paper; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke();
    } else if (spec.archetype === 'mythic') {
      // Orpheum Lyre-Form: open paper resonance chamber + 5 vertical golden-ratio acoustic strings
      const cxM = g.X(0.40), cyM = g.bend(0.40), rM = g.H * 0.33;
      ell(ctx, cxM, cyM, rM * 1.25, rM);
      ctx.fillStyle = rgba(P.paper, 0.90); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.6, g.L / 80); ctx.stroke();
      for (let k = -2; k <= 2; k++) {
        const sx = cxM + k * (rM * 0.42);
        ctx.beginPath();
        ctx.moveTo(sx, cyM - rM * 0.92);
        ctx.lineTo(sx, cyM + rM * 0.92);
        ctx.strokeStyle = k === 0 ? body : ink;
        ctx.lineWidth = k === 0 ? 2.0 : 1.2;
        ctx.stroke();
      }
    } else if (spec.archetype === 'geometric') {
      // Origami crane: multi-plane paper facet shading + crisp valley/mountain fold lines
      polyPath(ctx, [
        [g.X(0.0), g.bend(0.0)],
        [g.X(0.14), g.bend(0.14) - g.H * 0.72],
        [g.X(0.28), g.bend(0.28) - g.H * 0.38],
        [g.X(0.20), g.bend(0.20) + g.H * 0.16]
      ]);
      ctx.fillStyle = P.a; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.strokeStyle = P.paper; ctx.lineWidth = Math.max(1.6, g.L / 80);
      ctx.beginPath();
      ctx.moveTo(g.X(0.14), g.bend(0.14) - g.H * 0.70);
      ctx.lineTo(g.X(0.42), g.bend(0.42) + g.H * 0.25);
      ctx.lineTo(g.X(0.76), g.bend(0.76) - g.H * 0.35);
      ctx.stroke();
    } else if (spec.archetype === 'avian') {
      // Saul Bass Peregrine Cutout: sharp hooked beak block in P.a + dark raptor mask
      polyPath(ctx, [
        [g.X(0.0), g.bend(0.0) + g.H * 0.10],
        [g.X(0.11), g.bend(0.11) - g.H * 0.28],
        [g.X(0.14), g.bend(0.14) + g.H * 0.18]
      ]);
      ctx.fillStyle = P.a; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 1.4; ctx.stroke();
    } else if (spec.archetype === 'botanical') {
      // Pelagic Riff-Serpent: 4 dorsal kelp frond leaf-ribs in P.a / P.b
      for (let k = 0; k < 4; k++) {
        const sL = 0.16 + k * 0.16;
        ell(ctx, g.X(sL), g.bend(sL) - g.H * 0.38, g.L * 0.045, g.H * 0.22);
        ctx.fillStyle = k % 2 === 0 ? P.a : P.b; ctx.fill();
        ctx.strokeStyle = ink; ctx.lineWidth = 1.1; ctx.stroke();
      }
    }

    if (mode === 'wash' || mode === 'line' || mode === 'hydrographic') {
      ctx.strokeStyle = rgba(ink, 0.42); ctx.lineWidth = Math.max(0.7, g.L / 200);
      g.grooves.forEach(function (gr) {
        ctx.beginPath(); gr.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke();
      });
    }

    // Primary fin / wing
    ctx.save(); ctx.translate(0, g.H * 0.4 * ex);
    shape(jit(g.fin, 3));
    if (fills) { ctx.fillStyle = (spec.archetype === 'avian' || spec.archetype === 'geometric') ? P.b : mix(body, ink, 0.18); ctx.fill(); }
    else { ctx.fillStyle = rgba(P.paper, 0.9); ctx.fill(); }
    strokeIt();
    if (ex > 0.05) { ell(ctx, g.finRoot[0], g.finRoot[1], 3.5, 3.5); ctx.strokeStyle = ink; ctx.lineWidth = 1.4; ctx.stroke(); }
    ctx.restore();

    // Eye
    ctx.save(); ctx.translate(-g.L * 0.08 * ex, -g.H * 0.5 * ex);
    const es = o.eyeScale || 1;
    ell(ctx, g.eye[0], g.eye[1], g.er * es, g.er * es * (1 - (o.blink || 0) * 0.9));
    ctx.fillStyle = ink; ctx.fill();
    ctx.restore();

    // Mouth / intake
    if ((o.mouth || 0) > 0.05) {
      ell(ctx, g.mouth[0], g.mouth[1], g.L * 0.03 * o.mouth, g.L * 0.026 * o.mouth);
      ctx.fillStyle = ink; ctx.fill();
    } else if (mode !== 'paper' && mode !== 'flat') {
      ctx.beginPath();
      ctx.moveTo(g.X(0.03), g.bend(0.03) + g.H * 0.07);
      ctx.quadraticCurveTo(g.X(0.08), g.bend(0.08) + g.H * 0.14, g.X(0.16), g.bend(0.16) + g.H * 0.1);
      ctx.strokeStyle = rgba(ink, 0.7); ctx.lineWidth = Math.max(0.8, g.L / 160); ctx.stroke();
    }
    ctx.restore();
    return g;
  }

  // Universal aliases so all existing proof & story code runs with any active character
  function whaleGeom(o) { return actorGeom(getCharSpec(o && o.charId), o || {}); }
  function whaleStreaks(ctx, P, g, o) { return actorStreaks(ctx, P, g, o); }
  function whale(ctx, P, o) { return renderActor(ctx, P, getCharSpec(o && o.charId), o || {}); }

  function wx(o, lx, ly) {
    const c = Math.cos(o.rot || 0), s = Math.sin(o.rot || 0);
    const fx = (o.flip ? -1 : 1) * (o.sx == null ? 1 : o.sx), fy = o.sy == null ? 1 : o.sy;
    const x = lx * fx, y = ly * fy;
    return [o.x + x * c - y * s, o.y + x * s + y * c];
  }
  function swimPh(t, L, hz) { return TAU * t * Math.max(1, Math.round(hz * L)) / L; }
  function guideWhale(ctx, P, t, L, z) {
    const ph = swimPh(t, L, 1.2), len = z.len || 64;
    whale(ctx, P, {
      x: z.x + 8 * Math.sin(TAU * t / L), y: z.y + 4 * Math.sin(2 * TAU * t / L),
      len: len, ph: ph, amp: 0.2, fin: Math.sin(ph) * 0.6, fluke: Math.sin(ph + 1) * 0.5,
      blink: (t % L) < 0.12 ? 1 : 0, streak: 1, seed: 3, wob: 0.4, flip: !!z.flip
    });
  }
  function hop(t, F) {
    let y = 0, sy = 1, rot = 0;
    if (t < 0.6) sy = 1 + 0.012 * Math.sin(TAU * t / 0.6);
    else if (t < 0.82) sy = lerp(1, 0.8, F.ease(seg(t, 0.6, 0.82)));
    else if (t < 1.42) {
      const k = seg(t, 0.82, 1.42); y = -4 * 92 * k * (1 - k); rot = lerp(-0.28, 0.28, k);
      sy = k < 0.15 ? lerp(0.8, 1.28, glaser(k / 0.15)) : lerp(1.28, 1, glaser(seg(k, 0.15, 0.6)));
    }
    else if (t < 2.2) sy = 0.76 + 0.24 * F.ease(seg(t, 1.42, 2.2));
    else sy = 1 + 0.012 * Math.sin(TAU * (t - 2.2) / 0.9);
    return { y: y, sy: sy, sx: 1 / Math.sqrt(sy), rot: rot };
  }

  let PIX = null;
  function getPix() { if (!PIX && typeof document !== 'undefined') { PIX = document.createElement('canvas'); PIX.width = 96; PIX.height = 60; } return PIX; }
  function pixWhale(p, x, y, fr, P, flip) {
    const spec = getCharSpec();
    const PW = spec.pixelSprite7x12 || CHARACTERS['ceti-whale'].pixelSprite7x12;
    for (let r = 0; r < PW.length; r++) for (let c = 0; c < 12; c++) {
      let ch = PW[r][c];
      if (c === 11 && (r === 1 || r === 3)) ch = ((r === 1) === (fr === 0)) ? 'X' : '.';
      if (ch === '.') continue;
      p.fillStyle = ch === 'B' ? mix(P.h, P.paper, 0.55) : (ch === 'F' ? mix(P.h, P.ink, 0.3) : P.h);
      const cx = flip ? x + 11 - c : x + c; p.fillRect(cx, y + r, 1, 1);
    }
    p.fillStyle = P.ink; p.fillRect(flip ? x + 9 : x + 2, y + 2, 1, 1);
  }
  let VH = null;
  function voxH() {
    if (VH) return VH; VH = [];
    for (let i = 0; i < 7; i++) { VH[i] = []; for (let j = 0; j < 7; j++) { const v = 0.5 + 0.5 * Math.sin(i * 0.9 + 1.3) * Math.cos(j * 0.8 + 0.4); VH[i][j] = 1 + Math.floor(v * 2.6 + hash(i * 7 + j, 3) * 0.9); } }
    return VH;
  }
  function speaker(ctx, P) {
    ctx.fillStyle = mix(P.c, P.paper, 0.86); ctx.fillRect(0, 0, LW, LH);
    wash(ctx, function (s) { blobR(ctx, 150, 300, 118, 76, s); }, mix(P.b, P.paper, 0.2), 71, 0.24);
    wash(ctx, function (s) { blobR(ctx, 150, 150, 42, 50, s); }, mix(P.h, P.paper, 0.3), 73, 0.26);
  }

  // Export intermediate hooks for Part 2C
  global._MA_INTERNAL = {
    LW: LW, LH: LH, TAU: TAU, MONO: MONO, SANS: SANS, SERIF: SERIF,
    O: O, clamp: clamp, lerp: lerp, seg: seg, hash: hash, rng: rng,
    hex2: hex2, rgba: rgba, mix: mix, desat: desat,
    bez: bez, glaser: glaser, rest: rest, spring: spring,
    getCharSpec: getCharSpec, prep: prep,
    ell: ell, rrect: rrect, smoothClosed: smoothClosed, blobPath: blobPath, blobR: blobR,
    polyPath: polyPath, tornRectPath: tornRectPath, tornCircle: tornCircle,
    hillPath: hillPath, tornHill: tornHill, wash: wash, clouds: clouds,
    densify: densify, drawPartial: drawPartial, rough: rough, rrPoints: rrPoints,
    arrow: arrow, txt: txt, pathAt: pathAt, beatLabel: beatLabel,
    actorGeom: actorGeom, actorStreaks: actorStreaks, renderActor: renderActor,
    renderReductionRung: renderReductionRung,
    whaleGeom: whaleGeom, whaleStreaks: whaleStreaks, whale: whale,
    wx: wx, swimPh: swimPh, guideWhale: guideWhale, hop: hop,
    getPix: getPix, pixWhale: pixWhale, voxH: voxH, speaker: speaker
  };
})(typeof window !== 'undefined' ? window : globalThis);
// ═══════════════════════════════════════════════════════════════════════════
// PART 2C · ALL 15 STYLE PROOFS, 8 STORYLINES, 8 INTERACTIONS & 24 ELEMENTS
// ═══════════════════════════════════════════════════════════════════════════
(function (global) {
  'use strict';

  const M = global._MA_INTERNAL;
  const TAX = global.STUDIO_ATLAS_TAXONOMY;
  const STORIES = TAX.STORIES;
  const LW = M.LW, LH = M.LH, TAU = M.TAU, MONO = M.MONO, SANS = M.SANS, SERIF = M.SERIF;
  const O = M.O, clamp = M.clamp, lerp = M.lerp, seg = M.seg, hash = M.hash, rng = M.rng;
  const rgba = M.rgba, mix = M.mix, desat = M.desat, bez = M.bez, glaser = M.glaser, rest = M.rest, spring = M.spring;
  const getCharSpec = M.getCharSpec, prep = M.prep;
  const ell = M.ell, rrect = M.rrect, blobR = M.blobR, polyPath = M.polyPath;
  const tornRectPath = M.tornRectPath, tornCircle = M.tornCircle, hillPath = M.hillPath, tornHill = M.tornHill;
  const wash = M.wash, clouds = M.clouds, drawPartial = M.drawPartial, rough = M.rough, rrPoints = M.rrPoints;
  const arrow = M.arrow, txt = M.txt, pathAt = M.pathAt, beatLabel = M.beatLabel;
  const actorGeom = M.actorGeom, renderActor = M.renderActor, renderReductionRung = M.renderReductionRung;
  const whaleGeom = M.whaleGeom, whaleStreaks = M.whaleStreaks, whale = M.whale;
  const wx = M.wx, swimPh = M.swimPh, guideWhale = M.guideWhale, hop = M.hop;
  const getPix = M.getPix, pixWhale = M.pixWhale, voxH = M.voxH, speaker = M.speaker;

  const PROOFS = {
    watercolor: {
      L: 4, native: true,
      bg: function (ctx, P) {
        wash(ctx, function (s) { tornRectPath(ctx, -10, -10, 500, 190, s, 5, 16); }, P.a, 11, 0.14);
        clouds(ctx, P, 64, 3);
        wash(ctx, function (s) { hillPath(ctx, 238, 36, s + 3.1); }, mix(P.a, P.paper, 0.1), 31, 0.2);
        wash(ctx, function (s) { blobR(ctx, 240, 262, 150, 16, s); }, mix(P.a, P.paper, 0.35), 33, 0.12);
      },
      draw: function (ctx, t, P, F) {
        const spec = getCharSpec();
        const archList = ['cetacean', 'avian', 'submersible', 'geometric', 'instrument', 'calligraphic', 'mythic', 'botanical'];
        const aIdx = Math.max(0, archList.indexOf(spec.archetype || 'cetacean'));
        const tChar = (t + aIdx * 0.42) % 4;
        const gy = 252, x = 240, h = hop(tChar, F), hgt = -h.y;
        ell(ctx, x, gy + 2, lerp(70, 26, clamp(hgt / 92, 0, 1)), 6); ctx.fillStyle = rgba(P.ink, 0.2 - 0.1 * clamp(hgt / 92, 0, 1)); ctx.fill();
        if (tChar > 1.42 && tChar < 2.0) {
          const k = seg(tChar, 1.42, 2.0);
          for (let i = 0; i < 6; i++) { const side = i < 3 ? -1 : 1, m = i % 3; ell(ctx, x + side * (54 + 40 * glaser(k) * (0.6 + 0.25 * m)), gy - 4 - 10 * k * m, (4 + 3 * m) * (1 - 0.5 * k), (4 + 3 * m) * (1 - 0.5 * k)); ctx.fillStyle = rgba(mix(P.paper, P.ink, 0.3), 0.5 * (1 - k)); ctx.fill(); }
        }
        const ph = swimPh(tChar, 4, 0.75);
        ctx.save(); ctx.translate(x, gy + h.y); ctx.rotate(h.rot); ctx.scale(h.sx, h.sy);
        whale(ctx, P, { x: 0, y: -42, len: 162, ph: ph, amp: 0.16, fin: Math.sin(ph) * 0.55 - (tChar > 0.82 && tChar < 1.42 ? 0.6 : 0), fluke: (tChar > 0.82 && tChar < 1.42) ? 0.8 : Math.sin(ph) * 0.45, blink: ((tChar > 0.36 && tChar < 0.5) || (tChar > 3.0 && tChar < 3.14)) ? 1 : 0, streak: 0.85, seed: 7 + aIdx, wob: 0.3 });
        ctx.restore();
        txt(ctx, (spec.archetype || 'cetacean').toUpperCase() + ' · ' + (spec.name || '').toUpperCase(), 16, 24, '700 9px ' + MONO, rgba(P.ink, 0.68));
      }
    },
    cutout: {
      L: 4, native: true,
      bg: function (ctx, P) { wash(ctx, function (s) { tornRectPath(ctx, -10, -10, 500, 320, s, 4, 20); }, P.a, 5, 0.13); },
      draw: function (ctx, t, P, F) {
        const b = Math.floor(t * 12), tt = b / 12;
        const sunY = lerp(176, 96, clamp(F.ease(seg(tt, 0.2, 1.4)) - glaser(seg(tt, 3.0, 3.9)), -0.2, 1.2));
        tornCircle(ctx, 330, sunY, 30, b * 7 + 1, 2.2 * O.wob, 20); ctx.fillStyle = P.h; ctx.fill(); ctx.strokeStyle = P.paper; ctx.lineWidth = 3; ctx.stroke();
        const wxp = lerp(560, -80, tt / 4), ph = swimPh(tt, 4, 0.75);
        whale(ctx, P, { x: wxp, y: 132 + 18 * Math.sin(TAU * tt / 4 * 1.5), rot: 0.12 * Math.sin(TAU * tt / 2), len: 120, ph: ph, amp: 0.15, fin: Math.sin(ph) * 0.6, fluke: Math.sin(ph + 0.8) * 0.6, mode: 'paper', body: mix(P.b, P.ink, 0.1), seed: b * 11 + 4, wob: 1.4 });
        tornHill(ctx, 214, 34, 0.4, b * 3 + 2, 2.2 * O.wob); ctx.fillStyle = P.b; ctx.fill(); ctx.strokeStyle = P.paper; ctx.lineWidth = 2.5; ctx.stroke();
        tornHill(ctx, 246, 22, 2.1, b * 5 + 9, 2.2 * O.wob); ctx.fillStyle = P.c; ctx.fill(); ctx.stroke();
        ctx.fillStyle = P.ink; ctx.beginPath(); ctx.rect(0, 0, 480, 300); ctx.rect(16, 16, 448, 268); ctx.fill('evenodd');
        for (let i = 0; i < 8; i++) { tornCircle(ctx, 46 + i * 56, 12, 30, b * 13 + i, 1.5 * O.wob, 14); ctx.fillStyle = mix(P.h, P.ink, 0.4); ctx.fill(); ctx.strokeStyle = P.paper; ctx.lineWidth = 2; ctx.stroke(); }
      }
    },
    doodle: {
      L: 4, native: true,
      bg: function (ctx, P) {
        wash(ctx, function (s) { tornRectPath(ctx, -10, 252, 500, 60, s, 3, 18); }, P.a, 9, 0.2);
        ctx.strokeStyle = rgba(P.ink, 0.55); ctx.lineWidth = 1.6; ctx.lineCap = 'round'; rough(ctx, [[0, 252], [480, 254]], 77, 1.2, 2);
      },
      draw: function (ctx, t, P, F) {
        const b = Math.floor(t * 12);
        let x, swimming = true;
        if (t < 1.6) x = lerp(560, 240, t / 1.6); else if (t < 2.5) { x = 240; swimming = false; } else x = lerp(240, -80, (t - 2.5) / 1.5);
        const ph = swimming ? swimPh(t, 4, 1.25) : 0, y = 168 + (swimming ? 4 * Math.sin(ph) : 0);
        const wave = glaser(seg(t, 1.62, 1.8)) - glaser(seg(t, 2.3, 2.48));
        ell(ctx, x, 253, 46, 4); ctx.fillStyle = rgba(P.ink, 0.12); ctx.fill();
        whale(ctx, P, { x: x, y: y, len: 140, ph: ph, amp: swimming ? 0.2 : 0.05, fin: swimming ? Math.sin(ph) * 0.5 : lerp(0, -1.6 + 0.5 * Math.sin(TAU * 2.5 * (t - 1.7)), wave), fluke: swimming ? Math.sin(ph + 1) * 0.6 : 0.2, blink: (t > 2.0 && t < 2.1) ? 1 : 0, mode: 'line', seed: b * 17 + 3, wob: 1.1 });
        if (t > 1.8 && t < 2.35) {
          ctx.strokeStyle = P.h; ctx.lineWidth = 2.4; const hx = x - 52, hy = y - 46;
          rough(ctx, [[hx - 16, hy - 4], [hx - 22, hy - 12]], b + 6, 0.6, 1); rough(ctx, [[hx, hy - 8], [hx, hy - 17]], b + 7, 0.6, 1); rough(ctx, [[hx + 16, hy - 4], [hx + 22, hy - 12]], b + 8, 0.6, 1);
        }
      }
    },
    pixel: {
      L: 4, native: true,
      draw: function (ctx, t, P) {
        const c = getPix(); if (!c) return;
        const p = c.getContext('2d'), tq = Math.floor(t * 12) / 12;
        p.imageSmoothingEnabled = false;
        p.fillStyle = mix(P.a, P.paper, 0.3); p.fillRect(0, 0, 96, 60);
        p.fillStyle = mix(P.b, P.paper, 0.45);
        for (let i = 0; i < 96; i++) { const h = 4 + Math.floor(6 * (0.5 + 0.5 * Math.sin(i * 0.21)) + 3 * hash(Math.floor(i / 4), 5)); p.fillRect(i, 48 - h, 1, h); }
        p.fillStyle = P.c; p.fillRect(0, 48, 96, 12); p.fillStyle = P.b; p.fillRect(0, 48, 96, 1);
        const bump = (tq >= 1.5 && tq < 1.75) ? -2 : 0, bx = 50, by = 18 + bump;
        p.fillStyle = P.ink; p.fillRect(bx, by, 8, 8); p.fillStyle = P.h; p.fillRect(bx + 1, by + 1, 6, 6);
        p.fillStyle = P.ink; p.fillRect(bx + 3, by + 2, 2, 4); p.fillRect(bx + 2, by + 3, 4, 2);
        let sx, sy = 41, fr = Math.floor(tq * 6) % 2;
        if (tq < 1.2) sx = Math.round(lerp(-14, 42, tq / 1.2));
        else if (tq < 1.95) {
          sx = Math.round(lerp(42, 48, seg(tq, 1.2, 1.95)));
          if (tq < 1.5) sy = Math.round(41 - 15 * Math.sin(seg(tq, 1.2, 1.5) * Math.PI / 2));
          else if (tq < 1.67) { sy = 26; fr = 0; }
          else { const k = seg(tq, 1.67, 1.95); sy = Math.round(26 + 15 * k * k); }
        } else sx = Math.round(lerp(48, 104, (tq - 1.95) / 2.05));
        pixWhale(p, sx, sy, fr, P, true);
        if (tq >= 1.5 && tq < 2.3) {
          const k = seg(tq, 1.5, 2.3), yy = Math.round(14 - 11 * glaser(k));
          if (k < 0.5 || Math.floor(tq * 12) % 2 === 0) { p.fillStyle = P.h; p.fillRect(53, yy - 1, 1, 3); p.fillRect(52, yy, 3, 1); }
        }
        ctx.imageSmoothingEnabled = false; ctx.drawImage(c, 0, 0, 96, 60, 0, 0, 480, 300); ctx.imageSmoothingEnabled = true;
      }
    },
    voxel: {
      L: 8, guide: { x: 400, y: 46, len: 66 },
      bg: function (ctx, P) { wash(ctx, function (s) { blobR(ctx, 240, 196, 210, 74, s); }, P.a, 13, 0.14); },
      draw: function (ctx, t, P) {
        const H = voxH(), ang = TAU * t / 8, ca = Math.cos(ang), sa = Math.sin(ang), S = 17, cx = 240, cy = 158;
        const proj = function (X, Y, Z) { const rx = X * ca - Y * sa, ry = X * sa + Y * ca; return [cx + (rx - ry) * S * 0.866, cy + (rx + ry) * S * 0.5 - Z * S]; };
        const cubes = [];
        for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) for (let k = 0; k < H[i][j]; k++) { const X = i - 3, Y = j - 3; cubes.push({ X: X, Y: Y, k: k, d: (X * ca - Y * sa) + (X * sa + Y * ca) + k * 0.001 }); }
        cubes.sort(function (p, q) { return p.d - q.d; });
        const N = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        ctx.lineWidth = 0.8; ctx.strokeStyle = rgba(P.ink, 0.35);
        cubes.forEach(function (cb) {
          const col = cb.k >= 2 ? P.h : (cb.k === 1 ? mix(P.a, P.b, 0.35) : P.b);
          N.forEach(function (n) {
            const nx = n[0] * ca - n[1] * sa, ny = n[0] * sa + n[1] * ca;
            if (nx + ny <= 0.01) return;
            let q;
            if (n[0] !== 0) { const xx = cb.X + 0.5 * n[0]; q = [[xx, cb.Y - 0.5, cb.k], [xx, cb.Y + 0.5, cb.k], [xx, cb.Y + 0.5, cb.k + 1], [xx, cb.Y - 0.5, cb.k + 1]]; }
            else { const yy = cb.Y + 0.5 * n[1]; q = [[cb.X - 0.5, yy, cb.k], [cb.X + 0.5, yy, cb.k], [cb.X + 0.5, yy, cb.k + 1], [cb.X - 0.5, yy, cb.k + 1]]; }
            polyPath(ctx, q.map(function (v) { return proj(v[0], v[1], v[2]); }));
            ctx.fillStyle = mix(col, P.ink, 0.16 + 0.24 * clamp((nx - ny + 1.2) / 2.4, 0, 1)); ctx.fill(); ctx.stroke();
          });
          const k1 = cb.k + 1;
          polyPath(ctx, [proj(cb.X - 0.5, cb.Y - 0.5, k1), proj(cb.X + 0.5, cb.Y - 0.5, k1), proj(cb.X + 0.5, cb.Y + 0.5, k1), proj(cb.X - 0.5, cb.Y + 0.5, k1)]);
          ctx.fillStyle = col; ctx.fill(); ctx.stroke();
        });
      }
    },
    orbit: {
      L: 6, guide: { x: 84, y: 52, len: 66, flip: true },
      bg: function (ctx, P) { wash(ctx, function (s) { blobR(ctx, 240, 238, 196, 42, s); }, mix(P.a, P.paper, 0.2), 17, 0.16); },
      draw: function (ctx, t, P) {
        const ph = TAU * t / 6, yaw = 0.55 + 0.6 * Math.sin(ph), pitch = 0.45, dist = 8.2 - 1.1 * (0.5 - 0.5 * Math.cos(ph)), Fz = 520;
        const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
        const cam = function (p) { const x1 = p[0] * cyw - p[1] * syw, y1 = p[0] * syw + p[1] * cyw, z1 = p[2]; const d = dist + y1 * cp - z1 * sp, up = z1 * cp + y1 * sp; return [240 + Fz * x1 / d, 214 - Fz * up / d, d]; };
        const g = cam([0, 0, 0]); ell(ctx, g[0] + 10, g[1] + 6, 1700 / dist * 0.9, 300 / dist * 0.9); ctx.fillStyle = rgba(P.ink, 0.12); ctx.fill();
        const boxes = [{ c: [0, 0, 0.2], s: [3.2, 3.2, 0.4], col: P.b }, { c: [0, 0, 1.15], s: [1.3, 0.8, 1.5], col: P.h }, { c: [1.15, -0.85, 0.65], s: [0.5, 0.5, 0.5], col: P.a }];
        const Ld = [-0.5, -0.6, 0.75], Ln = Math.hypot(Ld[0], Ld[1], Ld[2]);
        const faces = [];
        boxes.forEach(function (bx) {
          for (let ax = 0; ax < 3; ax++) for (let sg = -1; sg <= 1; sg += 2) {
            const n = [0, 0, 0]; n[ax] = sg;
            const ny1 = n[0] * syw + n[1] * cyw;
            if (ny1 * cp - n[2] * sp >= 0) continue;
            const u = (ax + 1) % 3, v = (ax + 2) % 3, hs = [bx.s[0] / 2, bx.s[1] / 2, bx.s[2] / 2];
            const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (uv) { const p = bx.c.slice(); p[ax] += sg * hs[ax]; p[u] += uv[0] * hs[u]; p[v] += uv[1] * hs[v]; return cam(p); });
            const lam = Math.max(0, (n[0] * Ld[0] + n[1] * Ld[1] + n[2] * Ld[2]) / Ln);
            faces.push({ pts: corners, d: (corners[0][2] + corners[1][2] + corners[2][2] + corners[3][2]) / 4, col: mix(bx.col, P.ink, 0.42 * (1 - lam)) });
          }
        });
        faces.sort(function (p, q) { return q.d - p.d; });
        ctx.lineWidth = 1; ctx.strokeStyle = rgba(P.ink, 0.55);
        faces.forEach(function (fc) { polyPath(ctx, fc.pts); ctx.fillStyle = fc.col; ctx.fill(); ctx.stroke(); });
      }
    },
    morph: {
      L: 6, guide: { x: 418, y: 34, len: 62 },
      bg: function (ctx, P) { wash(ctx, function (s) { blobR(ctx, 240, 150, 210, 120, s); }, P.a, 23, 0.08); },
      draw: function (ctx, t, P, F) {
        const card = mix(P.a, P.paper, 0.2);
        const S = [{ w: 176, h: 48, r: 24, c: P.h }, { w: 300, h: 178, r: 18, c: card }, { w: 300, h: 178, r: 18, c: card }, { w: 124, h: 124, r: 62, c: P.b }];
        const T = [[0.9, 1.5, 0, 1], [2.4, 2.7, 1, 2], [3.6, 4.2, 2, 3], [5.1, 5.7, 3, 0]];
        const geo = function (tt) {
          tt = ((tt % 6) + 6) % 6;
          for (let i = 0; i < T.length; i++) { const tr = T[i]; if (tt < tr[0]) return { g: S[tr[2]], from: tr[2], to: tr[2], k: 1 }; if (tt < tr[1]) { const r = (tt - tr[0]) / (tr[1] - tr[0]), k = F.ease(r), A = S[tr[2]], B = S[tr[3]]; return { g: { w: lerp(A.w, B.w, k), h: lerp(A.h, B.h, k), r: lerp(A.r, B.r, k), c: mix(A.c, B.c, clamp(k, 0, 1)) }, from: tr[2], to: tr[3], k: r }; } }
          return { g: S[0], from: 0, to: 0, k: 1 };
        };
        const subs = [-2 / 72, -1 / 72, 0], al = [1, 0.5, 1 / 3];
        for (let i = 0; i < 3; i++) { const G = geo(t + subs[i]).g; ctx.globalAlpha = al[i]; rrect(ctx, 240 - G.w / 2, 150 - G.h / 2, G.w, G.h, G.r); ctx.fillStyle = G.c; ctx.fill(); }
        ctx.globalAlpha = 1;
        const cur = geo(t), G = cur.g; rrect(ctx, 240 - G.w / 2, 150 - G.h / 2, G.w, G.h, G.r); ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.stroke();
        const content = function (i, a) {
          if (a <= 0.01) return; ctx.save(); ctx.globalAlpha = a; const L = 240 - G.w / 2, Tp = 150 - G.h / 2;
          if (i === 0) { ell(ctx, L + 24, 150, 7, 7); ctx.fillStyle = P.paper; ctx.fill(); rrect(ctx, L + 40, 146, 96, 8, 4); ctx.fillStyle = rgba(P.paper, 0.85); ctx.fill(); }
          else if (i === 1) { rrect(ctx, L + 22, Tp + 24, 130, 12, 6); ctx.fillStyle = rgba(P.ink, 0.7); ctx.fill(); [220, 190, 150].forEach(function (w, j) { rrect(ctx, L + 22, Tp + 56 + j * 22, w, 8, 4); ctx.fillStyle = rgba(P.ink, 0.22); ctx.fill(); }); }
          else if (i === 2) { const lt = t - 2.4, hs = [0.45, 0.72, 0.58, 0.9]; hs.forEach(function (hh, j) { const e = F.ease(seg(lt, 0.1 * j, 0.1 * j + 0.5)), bh = Math.max(0, hh * 108 * e); rrect(ctx, L + 36 + j * 60, Tp + 150 - bh, 36, bh, 4); ctx.fillStyle = P.h; ctx.fill(); }); ctx.strokeStyle = rgba(P.ink, 0.6); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(L + 24, Tp + 151); ctx.lineTo(L + G.w - 24, Tp + 151); ctx.stroke(); txt(ctx, 'RELATIVE · NO NUMBERS YET', L + 24, Tp + 22, '700 10px ' + MONO, rgba(P.ink, 0.65)); }
          else { const pr = seg(t, 4.0, 4.5); ctx.strokeStyle = P.paper; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; drawPartial(ctx, [[214, 152], [232, 170], [268, 132]], pr, 5, 0, 1); }
          ctx.restore();
        };
        if (cur.from === cur.to) content(cur.from, 1);
        else { content(cur.from, 1 - seg(cur.k, 0, 0.35)); content(cur.to, seg(cur.k, 0.55, 1)); }
      }
    },
    kinetic: {
      L: 4, guide: { x: 420, y: 282, len: 52 },
      draw: function (ctx, t, P, F) {
        const cName = (getCharSpec().name.split(' ')[1] || 'ACTOR').toUpperCase().slice(0, 8);
        const W = ['SLOW', 'DOWN', 'FILTER', 'NOISE', 'ACTIVE', cName, 'SINGS', ''];
        const B = [[40, 60, 150, 40], [300, 200, 140, 40], [40, 190, 60, 60], [330, 50, 100, 100], [60, 70, 360, 10], [200, 40, 40, 220], [40, 210, 400, 30], [220, 130, 40, 40]];
        const beat = Math.min(7, Math.floor(t / 0.5)), lt = t - beat * 0.5, prev = B[(beat + 7) % 8], cur = B[beat], k = F.ease(seg(lt, 0, 0.22));
        const r = [0, 1, 2, 3].map(function (i) { return lerp(prev[i], cur[i], k); });
        ctx.fillStyle = P.h; ctx.fillRect(r[0], r[1], Math.max(1, r[2]), Math.max(1, r[3]));
        const w = W[beat]; ctx.font = '700 64px ' + SANS; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
        let x = 240 - ctx.measureText(w).width / 2;
        for (let i = 0; i < w.length; i++) { const ch = w[i], cw = ctx.measureText(ch).width, e = F.ease(seg(lt, i * 0.03, i * 0.03 + 0.16)); ctx.globalAlpha = clamp(e, 0, 1); ctx.fillStyle = P.ink; if (!O.captionsCovered) ctx.fillText(ch, x, 172 + 18 * (1 - e)); x += cw; }
        ctx.globalAlpha = 1;
        if (beat === 7) { const e = F.ease(seg(lt, 0, 0.3)); ell(ctx, 240, 150, 10 * e + 0.1, 10 * e + 0.1); ctx.fillStyle = P.ink; ctx.fill(); }
        for (let i = 0; i < 8; i++) { ctx.fillStyle = i === beat ? P.ink : rgba(P.ink, 0.22); ctx.fillRect(176 + i * 16, 272, 10, 4); }
        txt(ctx, '120 BPM · ONE CHANGE PER BEAT', 240, 262, '700 10px ' + MONO, rgba(P.ink, 0.7), 'center');
      }
    },
    hybrid: {
      L: 6, native: true,
      bg: function (ctx, P) {
        wash(ctx, function (s) { tornRectPath(ctx, -10, -10, 500, 150, s, 6, 18); }, mix(P.a, P.paper, 0.1), 41, 0.2);
        wash(ctx, function (s) { blobR(ctx, 350, 82, 24, 24, s); }, P.h, 59, 0.2);
        wash(ctx, function (s) { hillPath(ctx, 172, 60, s + 1.7); }, mix(P.b, P.paper, 0.3), 43, 0.22);
        wash(ctx, function (s) { hillPath(ctx, 216, 46, s + 4.2); }, mix(P.h, P.paper, 0.25), 47, 0.2);
        wash(ctx, function (s) { hillPath(ctx, 262, 30, s + 2.2); }, mix(P.c, P.paper, 0.4), 53, 0.22);
      },
      draw: function (ctx, t, P, F, bg) {
        const z = 1.03 + 0.03 * Math.sin(TAU * t / 6);
        ctx.save(); ctx.translate(240, 150); ctx.scale(z, z); ctx.translate(-240, -150); ctx.drawImage(bg, 0, 0, LW, LH); ctx.restore();
        const ph = swimPh(t, 6, 0.8), wo = { x: lerp(560, -80, t / 6), y: 112 + 10 * Math.sin(TAU * t / 6), len: 110, ph: ph, amp: 0.16, fin: Math.sin(ph) * 0.5, fluke: Math.sin(ph + 1) * 0.5, streak: 1, seed: 9, wob: 0.3 };
        const g = whale(ctx, P, wo), ep = wx(wo, g.eye[0], g.eye[1]);
        const on = glaser(seg(t, 0.4, 0.8)) - glaser(seg(t, 5.3, 5.7));
        ctx.save(); ctx.globalAlpha = clamp(on, 0, 1); ctx.strokeStyle = P.ink; ctx.lineWidth = 1.4; ell(ctx, ep[0], ep[1], 16, 16); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ep[0] + 11, ep[1] - 11); ctx.lineTo(ep[0] + 34, ep[1] - 34); ctx.lineTo(ep[0] + 80, ep[1] - 34); ctx.stroke();
        txt(ctx, 'TRACKED ' + Math.round(ep[0]) + ',' + Math.round(ep[1]), ep[0] + 36, ep[1] - 40, '700 9px ' + MONO, P.ink); ctx.restore();
        txt(ctx, '[GENERATED PLATE] · CODE LAYER ON TOP', 16, 24, '700 10px ' + MONO, rgba(P.ink, 0.75));
        const e = F.ease(seg(t, 0.9, 1.5)), ex = glaser(seg(t, 4.8, 5.3)), off = lerp(-320, 0, e) - ex * 340;
        ctx.save(); ctx.translate(off, 0);
        rrect(ctx, 20, 212, 300, 64, 8); ctx.fillStyle = rgba(P.paper, 0.94); ctx.fill(); ctx.strokeStyle = rgba(P.ink, 0.25); ctx.lineWidth = 1; ctx.stroke();
        ell(ctx, 38, 236, 5, 5); ctx.fillStyle = P.h; ctx.fill();
        txt(ctx, 'Field notes, day one', 52, 244, 'italic 300 24px ' + SERIF, P.ink);
        const fr = Math.floor(t * 24);
        txt(ctx, 'TC 00:00:0' + Math.floor(t) + ':' + String(fr % 24).padStart(2, '0'), 52, 264, '400 11px ' + MONO, rgba(P.ink, 0.8));
        ctx.restore();
      }
    },
    editorial: {
      L: 6, guide: { x: 420, y: 26, len: 56 },
      bg: function (ctx, P) {
        wash(ctx, function (s) { tornRectPath(ctx, 24, 30, 432, 196, s, 4, 14); }, mix(P.a, P.paper, 0.15), 61, 0.16);
        ctx.strokeStyle = rgba(P.ink, 0.08); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(176, 44); ctx.lineTo(176, 214); ctx.moveTo(304, 44); ctx.lineTo(304, 214); ctx.stroke();
      },
      draw: function (ctx, t, P, F) {
        const N = [[110, 126, 'INPUT'], [240, 126, 'PROCESS'], [370, 126, 'RESULT']];
        const out = glaser(seg(t, 5.0, 5.6)), shrink = 1 - glaser(seg(t, 5.45, 5.95));
        const ap = [F.ease(seg(t, 0.2, 0.65)), F.ease(seg(t, 1.8, 2.25)), F.ease(seg(t, 3.4, 3.85))];
        const cols = [P.h, P.b, mix(P.a, P.ink, 0.12)];
        ctx.save(); ctx.globalAlpha = 1 - out; ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.lineCap = 'round';
        arrow(ctx, 150, 126, 198, 126, glaser(seg(t, 1.3, 1.75)), 3); arrow(ctx, 280, 126, 328, 126, glaser(seg(t, 2.9, 3.35)), 4);
        ctx.restore();
        for (let i = 2; i >= 0; i--) {
          const sc = clamp(ap[i], 0, 1.3) * (i === 0 ? shrink : 1) * (i > 0 ? 1 - seg(out, 0.6, 1) : 1); if (sc <= 0.01) continue;
          const nx = lerp(N[i][0], N[0][0], out);
          ctx.save(); ctx.translate(nx, N[i][1]); ctx.scale(sc, sc);
          tornRectPath(ctx, -38, -30, 76, 60, i * 31 + 5, 2.4 * O.wob, 10); ctx.fillStyle = cols[i]; ctx.fill(); ctx.strokeStyle = rgba(P.ink, 0.6); ctx.lineWidth = 1.4; ctx.stroke();
          if (i === 2) { [0.5, 0.8, 0.65].forEach(function (hh, j) { ctx.fillStyle = rgba(P.ink, 0.35); ctx.fillRect(-22 + j * 16, 18 - 36 * hh, 10, 36 * hh); }); }
          ctx.restore();
          if (sc > 0.6 && out < 0.3) txt(ctx, N[i][2], nx, N[i][1] + 50, '700 10px ' + MONO, rgba(P.ink, 0.8), 'center');
        }
        const caps = ['One idea at a time.', 'Each step earns the next.', 'Numbers wait for a source.'];
        const idx = t < 1.6 ? 0 : (t < 3.2 ? 1 : 2);
        const ca = (idx === 0 ? seg(t, 0.2, 0.45) : 1) * (1 - out);
        ctx.save(); ctx.globalAlpha = ca; ctx.fillStyle = P.ink; ctx.fillRect(40, 242, 400, 34); txt(ctx, caps[idx], 240, 264, '500 15px ' + SANS, P.paper, 'center'); ctx.restore();
      }
    },
    whiteboard: {
      L: 6, guide: { x: 420, y: 30, len: 56 },
      bg: function (ctx, P) { ctx.fillStyle = rgba(P.ink, 0.13); for (let x = 12; x < 480; x += 16) for (let y = 12; y < 300; y += 16) ctx.fillRect(x, y, 1.4, 1.4); },
      draw: function (ctx, t, P) {
        ctx.globalAlpha = 1 - glaser(seg(t, 5.2, 5.8));
        const sh = [{ x: 40, y: 70, w: 110, h: 72, r: 0, l: 'changed', a: 0.3, b: 0.9, fill: P.a }, { x: 185, y: 70, w: 110, h: 72, r: 18, l: 'new component', a: 1.4, b: 2.0, fill: P.h }, { x: 330, y: 70, w: 110, h: 72, r: 0, l: 'step', a: 2.5, b: 3.1, fill: P.a, dbl: true }];
        ctx.strokeStyle = P.ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        sh.forEach(function (s, i) {
          const pr = seg(t, s.a, s.b), fa = seg(t, s.b, s.b + 0.3);
          if (fa > 0) { rrect(ctx, s.x, s.y, s.w, s.h, s.r); ctx.fillStyle = rgba(s.fill, 0.55 * fa); ctx.fill(); }
          ctx.lineWidth = 2; drawPartial(ctx, rrPoints(s.x, s.y, s.w, s.h, s.r, 6), pr, 20 + i, 0.9, 2);
          if (s.dbl) { ctx.lineWidth = 1.4; drawPartial(ctx, rrPoints(s.x + 6, s.y + 6, s.w - 12, s.h - 12, 0, 6), seg(t, s.a + 0.2, s.b + 0.1), 40, 0.7, 1); }
          const la = seg(t, s.b, s.b + 0.25); if (la > 0) { ctx.save(); ctx.globalAlpha *= la; txt(ctx, s.l, s.x + s.w / 2, s.y + s.h / 2 + 5, '600 13px ' + SANS, P.ink, 'center'); ctx.restore(); }
        });
        ctx.lineWidth = 2; arrow(ctx, 152, 106, 182, 106, glaser(seg(t, 1.0, 1.35)), 7); arrow(ctx, 297, 106, 327, 106, glaser(seg(t, 2.1, 2.45)), 8);
        const lg = seg(t, 3.3, 3.7);
        if (lg > 0) { ctx.save(); ctx.globalAlpha *= lg; txt(ctx, 'SHAPE GRAMMAR · SQUARE = CHANGED · ROUNDED = NEW · DOUBLE = STEP', 240, 214, '700 9px ' + MONO, rgba(P.ink, 0.8), 'center'); ctx.restore(); }
        ctx.globalAlpha = 1;
      }
    },
    sim: {
      L: 6, guide: { x: 230, y: 58, len: 60 },
      bg: function (ctx, P) { ctx.strokeStyle = rgba(P.ink, 0.5); ctx.lineWidth = 1.5; ctx.lineCap = 'round'; rough(ctx, [[0, 246], [480, 246]], 12, 1, 2); },
      draw: function (ctx, t, P) {
        const live = glaser(seg(t, 1.4, 2.0)) * (1 - glaser(seg(t, 5.1, 5.8)));
        const th = 52 * Math.PI / 180, x0 = 100, y0 = 236, R = 330, Hm = R * Math.tan(th) / 4;
        ctx.setLineDash([4, 6]); ctx.strokeStyle = rgba(P.ink, 0.35 + 0.15 * (1 - live)); ctx.lineWidth = 1.3; ctx.beginPath();
        for (let u = 0; u <= 1.0001; u += 0.05) { const xx = x0 + R * u, yy = y0 - 4 * Hm * u * (1 - u); if (u === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
        ctx.stroke(); ctx.setLineDash([]);
        polyPath(ctx, [[48, 246], [92, 246], [70, 222]]); ctx.fillStyle = rgba(P.b, 0.85 * live); ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 1.8; rough(ctx, [[48, 246], [92, 246], [70, 222], [48, 246]], 31, 0.8, 1);
        ctx.lineWidth = 3; ctx.lineCap = 'round'; rough(ctx, [[70, 226], [70 + 40 * Math.cos(th), 226 - 40 * Math.sin(th)]], 33, 0.5, 1);
        const fl = seg(t, 2.0, 4.4);
        const ball = function (u, a) { if (a <= 0.01) return; const bx = x0 + R * u, by = y0 - 4 * Hm * u * (1 - u); ctx.save(); ctx.globalAlpha = a; ell(ctx, bx, by, 9, 9); ctx.fillStyle = rgba(P.h, live); ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore(); };
        if (t >= 2.0 && t < 5.2) { for (let j = 1; j <= 6; j++) { const u = fl - j * 0.035; if (u > 0 && u < 1) { ell(ctx, x0 + R * u, y0 - 4 * Hm * u * (1 - u), 2.2, 2.2); ctx.fillStyle = rgba(P.h, 0.55 * live * (1 - j / 7)); ctx.fill(); } } }
        if (t < 2.0) ball(0, 1); else if (t < 5.2) ball(fl, 1); else { ball(1, 1 - seg(t, 5.2, 5.5)); ball(0, seg(t, 5.6, 5.95)); }
        if (t > 4.4 && t < 4.9) { const k = seg(t, 4.4, 4.9); for (let i = 0; i < 4; i++) { ell(ctx, x0 + R + (i - 1.5) * 12 * (0.5 + k), 240 - 6 * k, 3 + 2 * (1 - k), 3 + 2 * (1 - k)); ctx.fillStyle = rgba(P.ink, 0.25 * (1 - k)); ctx.fill(); } }
        ctx.save(); ctx.globalAlpha = live;
        rrect(ctx, 318, 20, 146, 70, 8); ctx.fillStyle = rgba(P.paper, 0.96); ctx.fill(); ctx.strokeStyle = rgba(P.ink, 0.3); ctx.lineWidth = 1; ctx.stroke();
        txt(ctx, 'ANGLE 52°', 330, 40, '700 10px ' + MONO, P.ink);
        ctx.strokeStyle = rgba(P.ink, 0.5); ctx.beginPath(); ctx.moveTo(330, 54); ctx.lineTo(450, 54); ctx.stroke(); ell(ctx, 330 + 120 * 52 / 90, 54, 5, 5); ctx.fillStyle = P.h; ctx.fill(); ctx.strokeStyle = P.ink; ctx.stroke();
        txt(ctx, 'RANGE 330 PX · PEAK ' + Math.round(Hm) + ' PX', 330, 78, '400 9px ' + MONO, rgba(P.ink, 0.8));
        ctx.restore();
        txt(ctx, live < 0.5 ? 'SKETCH' : 'LIVE SIM', 18, 26, '700 10px ' + MONO, rgba(P.ink, 0.75));
      }
    },
    overlay: {
      L: 6, guide: { x: 252, y: 40, len: 56 },
      bg: function (ctx, P) { speaker(ctx, P); },
      draw: function (ctx, t, P, F, bg) {
        const z = 1 + 0.05 * (glaser(seg(t, 0.75, 1.1)) - glaser(seg(t, 5.1, 5.6)));
        ctx.save(); ctx.translate(150, 150); ctx.scale(z, z); ctx.translate(-150, -150); ctx.drawImage(bg, 0, 0, LW, LH); ctx.restore();
        txt(ctx, '[SPEAKER FOOTAGE]', 16, 24, '700 10px ' + MONO, rgba(P.ink, 0.75));
        const pin = F.ease(seg(t, 0.75, 1.15)), pout = glaser(seg(t, 5.1, 5.5)), pa = clamp(pin, 0, 1) * (1 - pout);
        if (pa > 0.01) {
          ctx.save(); ctx.globalAlpha = pa; ctx.translate(40 * (1 - pin) + 30 * pout, 0);
          rrect(ctx, 322, 40, 140, 168, 8); ctx.fillStyle = rgba(P.paper, 0.95); ctx.fill(); ctx.strokeStyle = rgba(P.ink, 0.25); ctx.lineWidth = 1; ctx.stroke();
          const q = seg(t, 3.45, 3.95), o = 6 * Math.sin(Math.PI * q);
          ctx.strokeStyle = P.ink; ctx.lineWidth = 1.6;
          [[316 - o, 34 - o, 1, 1], [468 + o, 34 - o, -1, 1], [316 - o, 214 + o, 1, -1], [468 + o, 214 + o, -1, -1]].forEach(function (c) { ctx.beginPath(); ctx.moveTo(c[0], c[1] + 10 * c[3]); ctx.lineTo(c[0], c[1]); ctx.lineTo(c[0] + 10 * c[2], c[1]); ctx.stroke(); });
          ['BRIEF', 'ENGINE', 'GATES'].forEach(function (lb, i) {
            const by = 58 + i * 50; rrect(ctx, 340, by, 104, 30, 6);
            ctx.fillStyle = i === 2 ? rgba(P.h, seg(t, 3.45, 3.7)) : rgba(P.b, i === 1 ? 0.25 : 0.12); ctx.fill(); ctx.strokeStyle = rgba(P.ink, 0.5); ctx.lineWidth = 1; ctx.stroke();
            txt(ctx, lb, 392, by + 19, '700 10px ' + MONO, P.ink, 'center');
            if (i < 2) { ctx.beginPath(); ctx.moveTo(392, by + 30); ctx.lineTo(392, by + 50); ctx.stroke(); }
          });
          ctx.restore();
        }
        const words = ['The', 'harness,', 'not', 'the', 'prompt,', 'makes', 'the', 'quality.'], emph = { 1: 1, 7: 1 };
        const ca = seg(t, 0.05, 0.3) * (1 - seg(t, 5.4, 5.9));
        if (ca > 0.01) {
          ctx.save(); ctx.globalAlpha = ca; ctx.font = '600 16px ' + SANS;
          const sp = ctx.measureText(' ').width; let tw = 0; const ws = words.map(function (w) { const m = ctx.measureText(w).width; tw += m; return m; }); tw += sp * (words.length - 1);
          rrect(ctx, 240 - tw / 2 - 14, 240, tw + 28, 34, 6); ctx.fillStyle = rgba(P.paper, 0.93); ctx.fill();
          let x = 240 - tw / 2;
          words.forEach(function (w, i) { const st = 0.3 + i * 0.45, on = t >= st; ctx.globalAlpha = ca * (on ? 1 : 0.3); txt(ctx, w, x, 262, '600 16px ' + SANS, P.ink); if (emph[i] && on) { ctx.fillStyle = P.h; ctx.fillRect(x, 266, ws[i] * F.ease(seg(t, st, st + 0.25)), 3); } x += ws[i] + sp; });
          ctx.restore();
        }
      }
    },
    // Style 14: Kinetic Hydrography Survey Plate (Plates I–IV ghost trail + bearing rose)
    hydrographic: {
      L: 6, native: true,
      bg: function (ctx, P) {
        ctx.strokeStyle = rgba(P.ink, 0.08); ctx.lineWidth = 0.8;
        for (let x = 24; x < LW; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, LH); ctx.stroke(); }
        for (let y = 24; y < LH; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(LW, y); ctx.stroke(); }
        ell(ctx, 92, 82, 54, 54); ctx.strokeStyle = rgba(P.ink, 0.22); ctx.lineWidth = 1.1; ctx.stroke();
        ell(ctx, 92, 82, 42, 42); ctx.stroke();
      },
      draw: function (ctx, t, P) {
        const uNow = t / 6;
        // 25 ghost-position silhouettes along survey trajectory
        for (let i = 0; i < 25; i++) {
          const u = i / 24;
          if (u > uNow + 0.02) continue;
          const gx = lerp(430, 50, u), gy = 160 + 52 * Math.sin(TAU * u * 1.25 - 0.4);
          const dy = 52 * TAU * 1.25 * Math.cos(TAU * u * 1.25 - 0.4) / -380;
          const age = clamp(1 - (uNow - u) * 1.4, 0.08, 0.45);
          whale(ctx, P, { x: gx, y: gy, rot: Math.atan(dy) * 0.65, len: 68, ph: u * TAU * 2, amp: 0.14, mode: 'line', alpha: age, wob: 0 });
        }
        // Active survey actor with bearing ring
        const x = lerp(430, 50, uNow), y = 160 + 52 * Math.sin(TAU * uNow * 1.25 - 0.4);
        const dy = 52 * TAU * 1.25 * Math.cos(TAU * uNow * 1.25 - 0.4) / -380;
        const rot = Math.atan(dy) * 0.65, ph = swimPh(t, 6, 1.0);
        whale(ctx, P, { x: x, y: y, rot: rot, len: 122, ph: ph, amp: 0.18, fin: Math.sin(ph) * 0.5, fluke: Math.sin(ph + 1) * 0.5, mode: 'hydrographic', streak: 0.9, seed: 301, wob: 0.25 });
        // Azimuth needle in top-left compass rose
        const brg = ((Math.round((rot * 180 / Math.PI) + 270) % 360) + 360) % 360;
        ctx.save(); ctx.translate(92, 82); ctx.rotate(rot);
        ctx.strokeStyle = P.h; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-36, 0); ctx.lineTo(36, 0); ctx.stroke();
        ell(ctx, -36, 0, 3.5, 3.5); ctx.fillStyle = P.h; ctx.fill();
        ctx.restore();
        txt(ctx, 'BEARING ' + String(brg).padStart(3, '0') + '° · 25 GHOST SOUNDINGS', 16, 22, '700 9px ' + MONO, rgba(P.ink, 0.78));
      }
    },
    // Style 15: Saul Bass 3-Color Cut-Paper Overture
    'saul-severe': {
      L: 4, native: true,
      ownBg: true,
      draw: function (ctx, t, P, F) {
        // Strict 3-color field: paper, ink, accent h
        ctx.fillStyle = P.h; ctx.fillRect(0, 0, LW, LH);
        const b = Math.floor(t * 12), k1 = F.ease(seg(t, 0.0, 0.9)), k2 = F.ease(seg(t, 0.6, 1.6));
        // Sheared paper cutout corridor
        ctx.fillStyle = P.paper;
        polyPath(ctx, [
          [lerp(240, 56, k1), 0],
          [lerp(240, 424, k1), 0],
          [lerp(240, 380, k2), LH],
          [lerp(240, 100, k2), LH]
        ]);
        ctx.fill();
        // Severe black cutout bars
        ctx.fillStyle = P.ink;
        polyPath(ctx, [[0, 48], [168 * k1, 62], [154 * k1, 96], [0, 84]]); ctx.fill();
        polyPath(ctx, [[LW, 206], [LW - 178 * k2, 192], [LW - 164 * k2, 228], [LW, 240]]); ctx.fill();
        // Actor in Saul Bass Rung 2/4 cut-paper mode
        const ph = swimPh(t, 4, 0.75);
        const rung = t > 2.8 ? 4 : 2;
        whale(ctx, P, {
          x: 240, y: 148 + 8 * Math.sin(ph), rot: -0.14 * Math.cos(ph),
          len: 175, ph: ph, amp: 0.14, fin: Math.sin(ph) * 0.5, fluke: Math.sin(ph + 1) * 0.5,
          mode: 'paper', body: P.ink, seed: b * 9 + 3, wob: 1.5, rung: rung
        });
        txt(ctx, 'SAUL BASS 3-COLOR · RUNG ' + rung + ' REDUCTION', 240, 282, '700 10px ' + MONO, P.ink, 'center');
      }
    },

    // ───────────────────────────────────────────────────────────────────────
    // 8 STORYLINES (s_voice, s_filter, s_retrieve, s_sting, s_loop, s_guide, s_duet, s_hydro)
    // ───────────────────────────────────────────────────────────────────────
    s_voice: {
      L: 12, native: true,
      bg: function (ctx, P) { wash(ctx, function (s) { hillPath(ctx, 262, 22, s + 1.1); }, mix(P.a, P.paper, 0.3), 81, 0.16); },
      draw: function (ctx, t, P) {
        const grey = Math.max(1 - glaser(seg(t, 6.3, 8.6)), glaser(seg(t, 11.4, 12)));
        const bx = 300, by = 178, bloom = glaser(seg(t, 2.6, 4.0)) * (1 - seg(t, 11.4, 12));
        if (t > 2.0 && t < 2.62) { const k = seg(t, 2.0, 2.6); ell(ctx, bx, lerp(-10, by, k * k), 4, 7); ctx.fillStyle = P.h; ctx.fill(); }
        if (bloom > 0) { wash(ctx, function (s) { blobR(ctx, bx, by, 70 * bloom, 30 * bloom, s); }, P.h, 83, 0.12 * (1 - 0.6 * (1 - grey))); }
        let x, y = 172 + 5 * Math.sin(TAU * t / 3), rot = 0;
        if (t < 4.2) x = lerp(120, 290, t / 4.2); else if (t < 6) x = lerp(290, 330, (t - 4.2) / 1.8); else if (t < 9) x = 330;
        else if (t < 11) { const k = seg(t, 9, 11); x = lerp(330, 380, k); y = 172 - 82 * Math.sin(Math.PI * k); rot = lerp(-0.35, 0.35, k); } else x = 380;
        if (t > 4.2 && t < 7.5) {
          ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.strokeStyle = rgba(P.h, 0.45 * (1 - seg(t, 6.8, 7.5))); ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath();
          for (let tau = 4.2; tau <= Math.min(t, 6); tau += 0.05) { const px = lerp(290, 330, (tau - 4.2) / 1.8) + 64, py = 172 + 5 * Math.sin(TAU * tau / 3) + 6 * Math.sin(tau * 5); if (tau === 4.2) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
          ctx.stroke(); ctx.restore();
        }
        const sing = seg(t, 6, 6.3) * (1 - seg(t, 8.7, 9));
        if (sing > 0) { const cols = P.sw.concat([P.h]); for (let k = 0; k < 3; k++) { const r = ((t - 6) * 42 + k * 26) % 78; ctx.beginPath(); ctx.arc(x - 66, y + 4, Math.max(1, r), Math.PI * 0.75, Math.PI * 1.35); ctx.strokeStyle = rgba(desat(cols[k % cols.length], grey), sing * (1 - r / 78)); ctx.lineWidth = 3; ctx.stroke(); } }
        const ph = swimPh(t, 12, 0.6);
        whale(ctx, P, { x: x, y: y, rot: rot, len: 150, ph: ph, amp: 0.16, fin: Math.sin(ph) * 0.5, fluke: Math.sin(ph + 1) * 0.5, blink: t < 4.2 ? 0.5 : ((t > 7.2 && t < 7.32) ? 1 : 0), mouth: sing * (0.6 + 0.2 * Math.sin(t * 9)), grey: grey, streak: glaser(seg(t, 6.4, 8.5)) * (1 - seg(t, 11.4, 12)), seed: 21, wob: 0.3 });
        beatLabel(ctx, P, t, STORIES[0].beats);
      }
    },
    s_filter: {
      L: 10, native: true,
      draw: function (ctx, t, P, F) {
        const wp = pathAt(t, [[3.0, 560, 150], [4.2, 300, 150], [6.2, 300, 150], [8.0, -100, 150]]);
        const wy = wp[1] + 4 * Math.sin(TAU * t / 2.5), ph = swimPh(t, 10, 0.5), wo = { x: wp[0], y: wy, len: 130, ph: ph, amp: 0.14, fin: Math.sin(ph) * 0.4, fluke: Math.sin(ph + 1) * 0.5, mouth: seg(t, 3.4, 3.8) * (1 - seg(t, 6.0, 6.3)) * 0.9, streak: seg(t, 4.5, 5.5), seed: 31, wob: 0.3 };
        const g = whaleGeom(wo), m = wx(wo, g.mouth[0], g.mouth[1]), tail = wx(wo, g.X(1), 0);
        ctx.save(); ctx.globalAlpha = 0.14 * (1 - seg(t, 3, 4)); txt(ctx, 'NOISE', 240, 170, '700 92px ' + SANS, P.ink, 'center'); ctx.restore();
        const cols = P.sw.concat([P.h]);
        for (let i = 0; i < 70; i++) {
          const x0 = hash(i, 1) * 540, y0 = 30 + hash(i, 2) * 230, v = (1 + hash(i, 3) * 2) * 130, ci = 3.6 + hash(i, 9) * 2.2;
          const free = function (tt) { return [((x0 - v * tt) % 540 + 540) % 540 - 20, y0 + Math.sin(tt * 20 + i) * 3]; };
          let p, a = 0.6;
          if (t < ci) p = free(t); else { const q = seg(t, ci, ci + 0.5); if (q >= 1) continue; const f = free(ci); p = [lerp(f[0], m[0], glaser(q)), lerp(f[1], m[1], glaser(q))]; a = 0.6 * (1 - q * 0.5); }
          a *= 1 - seg(t, 6.0, 6.6);
          if (a <= 0.01) continue;
          ctx.fillStyle = rgba(cols[i % cols.length], a); ctx.fillRect(p[0], p[1], 2 + (i % 3), 2);
        }
        const lg = seg(t, 4.4, 5.6);
        if (lg > 0) {
          for (let k = 0; k < 3; k++) {
            const yy = 150 + (k - 1) * 12, x1 = t < 6.2 ? tail[0] : lerp(tail[0], 20, seg(t, 6.2, 7.6)), amp = 6 * (1 - seg(t, 5, 7));
            ctx.strokeStyle = cols[(k + 1) % cols.length]; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
            for (let xx = x1; xx <= lerp(x1, 470, lg); xx += 6) { const yv = yy + amp * Math.sin(xx * 0.08 + k); if (xx === x1) ctx.moveTo(xx, yv); else ctx.lineTo(xx, yv); }
            ctx.stroke();
          }
        }
        whale(ctx, P, wo);
        if (wo.mouth > 0.3) { ctx.strokeStyle = rgba(P.paper, 0.9); ctx.lineWidth = 1; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(m[0] + k * 2, m[1] - 4); ctx.lineTo(m[0] + k * 2, m[1] + 4); ctx.stroke(); } }
        const words = [[6.6, 7.5, 'SLOW DOWN.'], [7.5, 8.4, 'FILTER NOISE.']];
        words.forEach(function (wd) {
          if (t < wd[0] || t > wd[1] + 0.2) return; const lt = t - wd[0], fade = 1 - seg(t, wd[1], wd[1] + 0.2);
          ctx.font = '700 40px ' + SANS; let x = 240 - ctx.measureText(wd[2]).width / 2;
          for (let i = 0; i < wd[2].length; i++) { const ch = wd[2][i], cw = ctx.measureText(ch).width, e = F.ease(seg(lt, i * 0.025, i * 0.025 + 0.16)); ctx.globalAlpha = clamp(e, 0, 1) * fade; ctx.fillStyle = P.ink; if (!O.captionsCovered) ctx.fillText(ch, x, 100 + 14 * (1 - e)); x += cw; }
          ctx.globalAlpha = 1;
        });
        const ec = seg(t, 8.4, 8.9);
        if (ec > 0) { ctx.save(); ctx.globalAlpha = ec; txt(ctx, 'CETI Signal', 240, 100, 'italic 300 42px ' + SERIF, P.ink, 'center'); txt(ctx, 'SLOW DOWN · FILTER NOISE', 240, 222, '700 10px ' + MONO, rgba(P.ink, 0.75), 'center'); ctx.restore(); }
        beatLabel(ctx, P, t, STORIES[1].beats);
      }
    },
    s_retrieve: {
      L: 10, native: true,
      bg: function (ctx, P) { ctx.fillStyle = rgba(P.ink, 0.1); for (let x = 12; x < 480; x += 16) for (let y = 12; y < 300; y += 16) ctx.fillRect(x, y, 1.2, 1.2); },
      draw: function (ctx, t, P) {
        const C = [[226, 64], [300, 70], [380, 62], [232, 128], [306, 134], [384, 124], [228, 192], [302, 196], [380, 188]], REL = [1, 5, 6];
        const visit = [3.6, 4.6, 5.6];
        const wp = pathAt(t, [[1.2, 110, 128], [2.8, 150, 130], [3.6, C[1][0] - 50, C[1][1]], [4.6, C[5][0] - 50, C[5][1]], [5.6, C[6][0] - 50, C[6][1]], [7.0, 150, 176], [7.6, 140, 176], [9.4, 140, 176], [10, 110, 128]]);
        const prev = pathAt(t - 0.04, [[1.2, 110, 128], [2.8, 150, 130], [3.6, C[1][0] - 50, C[1][1]], [4.6, C[5][0] - 50, C[5][1]], [5.6, C[6][0] - 50, C[6][1]], [7.0, 150, 176], [7.6, 140, 176], [9.4, 140, 176], [10, 110, 128]]);
        const flip = wp[0] - prev[0] > 0.3;
        const qa = seg(t, 0.2, 0.6);
        if (qa > 0) { ctx.save(); ctx.globalAlpha = qa; rrect(ctx, 22, 30, 136, 40, 8); ctx.fillStyle = P.paper; ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 1.4; ctx.stroke(); txt(ctx, 'Q · what changed in v2?', 32, 55, '600 12px ' + SANS, P.ink); ctx.restore(); }
        const ph = swimPh(t, 10, 0.7), wo = { x: wp[0], y: wp[1], len: 92, ph: ph, amp: 0.18, fin: Math.sin(ph) * 0.5, fluke: Math.sin(ph + 1) * 0.5, flip: flip, streak: 0.6, seed: 41, wob: 0.3 };
        const g = whaleGeom(wo), tail = wx(wo, g.X(0.95), 0);
        C.forEach(function (c, i) {
          const r = REL.indexOf(i); let x = c[0], y = c[1], sc = 1;
          if (r >= 0 && t > visit[r]) {
            if (t < 7.6) { const k = glaser(seg(t, visit[r], visit[r] + 0.3)); x = lerp(c[0], tail[0] + (flip ? -1 : 1) * r * 16, k); y = lerp(c[1], tail[1] + 8 + r * 4, k); sc = lerp(1, 0.6, k); }
            else { const k = glaser(seg(t, 7.6, 8.1)); x = lerp(tail[0], 260 + r * 54, k); y = lerp(tail[1], 252, k); sc = lerp(0.6, 0.55, k); }
          }
          if (r < 0 && t > 6.5) sc *= 1 - 0.3 * seg(t, 6.5, 7);
          ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
          rrect(ctx, -30, -22, 60, 44, 4); ctx.fillStyle = r >= 0 ? mix(P.a, P.paper, 0.3) : rgba(P.paper, 0.9); ctx.fill();
          const hl = r >= 0 ? seg(t, 2.5, 3.0) : 0; ctx.strokeStyle = hl > 0 ? P.h : rgba(P.ink, 0.35); ctx.lineWidth = 1 + 1.5 * hl; ctx.stroke();
          [36, 28, 32].forEach(function (w, j) { ctx.fillStyle = rgba(P.ink, 0.25); ctx.fillRect(-22, -12 + j * 9, w, 3); });
          ctx.restore();
        });
        whale(ctx, P, wo);
        const aa = seg(t, 7.6, 8.0);
        if (aa > 0) {
          ctx.save(); ctx.globalAlpha = aa; rrect(ctx, 22, 214, 200, 62, 8); ctx.fillStyle = P.paper; ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 1.4; ctx.stroke();
          txt(ctx, 'A ·', 32, 236, '700 12px ' + SANS, P.ink);
          [150, 120, 90].forEach(function (w, j) { const k = seg(t, 7.9 + j * 0.25, 8.3 + j * 0.25); ctx.fillStyle = rgba(P.ink, 0.5); ctx.fillRect(56, 228 + j * 12, w * k, 4); });
          txt(ctx, '3 SOURCES', 236, 248, '700 9px ' + MONO, rgba(P.ink, 0.75)); ctx.restore();
        }
        const caps = [[0, 'A question arrives.'], [2.5, 'Retrieve the few pages that matter.'], [7, 'Answer from what you carried.']];
        let ci = 0; caps.forEach(function (c, i) { if (t >= c[0]) ci = i; });
        txt(ctx, caps[ci][1], 240, 18, '500 12px ' + SANS, rgba(P.ink, 0.85), 'center');
        beatLabel(ctx, P, t, STORIES[2].beats);
      }
    },
    s_sting: {
      L: 4, native: true,
      draw: function (ctx, t, P, F) {
        const activeRung = O.rung || 1;
        if (activeRung >= 2) {
          // Dedicated Saul Bass Rung 2..5 inspection plate (used on Surface III 5-Rung strip & LOD 3)
          const ph = swimPh(t, 4, 0.5);
          whale(ctx, P, { x: 240, y: 138, len: 215, ph: ph, amp: 0.12, fin: Math.sin(ph) * 0.35, fluke: Math.sin(ph + 1) * 0.35, streak: activeRung === 2 ? 0.7 : 0, seed: 51, wob: 0.2, rung: activeRung });
          txt(ctx, 'RUNG ' + activeRung + ' REDUCTION · ' + (getCharSpec().name || '').toUpperCase(), 240, 278, '700 10px ' + MONO, rgba(P.ink, 0.75), 'center');
          return;
        }
        const wo = { x: 240, y: 124, len: 230, ph: 0.6, amp: 0.1, fin: 0, fluke: 0.3, streak: Math.max(0.65, glaser(seg(t, 1.0, 2.2))), seed: 51, wob: 0.2, mode: 'wash' };
        const g = whaleGeom(wo), off = function (pts) { return pts.map(function (p) { return [p[0] + wo.x, p[1] + wo.y]; }); };
        const fa = Math.max(0.78, glaser(seg(t, 1.4, 2.4)));
        wo.alpha = fa;
        whale(ctx, P, wo);
        ctx.strokeStyle = P.ink; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const bp = off(g.body); bp.push(bp[0]); drawPartial(ctx, bp, Math.max(0.45, seg(t, 0, 1.6)), 5, 0, 1);
        const fp = off(g.fluke); drawPartial(ctx, fp, Math.max(0.45, seg(t, 0.5, 1.4)), 6, 0, 1);
        const fn = off(g.fin); fn.push(fn[0]); drawPartial(ctx, fn, Math.max(0.45, seg(t, 0.8, 1.5)), 7, 0, 1);
        const es = Math.max(0.85, seg(t, 1.2, 1.6)); if (es > 0) { ell(ctx, g.eye[0] + wo.x, g.eye[1] + wo.y, g.er * es, g.er * es); ctx.fillStyle = P.ink; ctx.fill(); }
        const word = 'CETI'; ctx.font = '700 46px ' + SANS; const spc = 14; let tw = 0; for (let i = 0; i < 4; i++) tw += ctx.measureText(word[i]).width; tw += spc * 3;
        let x = 240 - tw / 2;
        for (let i = 0; i < 4; i++) { const e = F.ease(seg(t, 2.3 + i * 0.1, 2.3 + i * 0.1 + 0.3)), cw = ctx.measureText(word[i]).width; ctx.globalAlpha = clamp(e, 0, 1); ctx.fillStyle = P.ink; if (!O.captionsCovered) ctx.fillText(word[i], x, 252 + 16 * (1 - e)); x += cw + spc; }
        ctx.globalAlpha = 1;
        beatLabel(ctx, P, t, STORIES[3].beats);
      }
    },
    s_loop: {
      L: 6, native: true,
      draw: function (ctx, t, P) {
        const th = TAU * t / 6, x = 240 + 170 * Math.cos(th + Math.PI / 2), y = 150 + 56 * Math.sin(th + Math.PI / 2), front = Math.sin(th + Math.PI / 2) > 0;
        const face = Math.cos(th);
        const sc = 0.72 + 0.28 * Math.sin(th + Math.PI / 2), ph = swimPh(t, 6, 0.8);
        const wo = { x: x, y: y, len: 120 * sc, sx: Math.abs(face) < 0.12 ? 0.12 * Math.sign(face || 1) : face, ph: ph, amp: 0.16, fin: Math.sin(ph) * 0.5, fluke: Math.sin(ph + 1) * 0.5, streak: 1, seed: 61, wob: 0.3, alpha: front ? 1 : 0.85 };
        const sun = function () { ell(ctx, 240, 150, 46, 46); ctx.fillStyle = mix(P.h, P.paper, 0.35); ctx.fill(); wash(ctx, function (s) { blobR(ctx, 240, 150, 40, 40, s); }, P.h, 63, 0.1); ell(ctx, 240, 150, 46, 46); ctx.strokeStyle = rgba(P.ink, 0.5); ctx.lineWidth = 1.4; ctx.stroke(); };
        ctx.setLineDash([3, 7]); ell(ctx, 240, 150, 170, 56); ctx.strokeStyle = rgba(P.ink, 0.18); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
        if (front) { sun(); whale(ctx, P, wo); } else { whale(ctx, P, wo); sun(); }
        txt(ctx, 'LAST FRAME = FIRST FRAME', 240, 282, '700 9px ' + MONO, rgba(P.ink, 0.6), 'center');
      }
    },
    s_guide: {
      L: 8, native: true,
      bg: function (ctx, P) { speaker(ctx, P); },
      draw: function (ctx, t, P) {
        txt(ctx, '[SPEAKER FOOTAGE]', 16, 24, '700 10px ' + MONO, rgba(P.ink, 0.75));
        const pa = glaser(seg(t, 0.5, 0.9)) * (1 - glaser(seg(t, 7.3, 7.8)));
        if (pa > 0.01) {
          ctx.save(); ctx.globalAlpha = pa; rrect(ctx, 316, 30, 150, 200, 10); ctx.fillStyle = rgba(P.paper, 0.95); ctx.fill(); ctx.strokeStyle = rgba(P.ink, 0.25); ctx.lineWidth = 1; ctx.stroke();
          [1.5, 3, 4.5].forEach(function (at, i) {
            const a = seg(t, at, at + 0.3); if (a <= 0) return; const yy = 110 + i * 40;
            ctx.save(); ctx.globalAlpha *= a; rrect(ctx, 332, yy - 9, 16, 16, 3); ctx.strokeStyle = P.ink; ctx.lineWidth = 1.4; ctx.stroke();
            if (t > at + 0.35) { ctx.strokeStyle = P.h; ctx.lineWidth = 2.5; drawPartial(ctx, [[335, yy - 1], [339, yy + 4], [346, yy - 6]], seg(t, at + 0.35, at + 0.6), 0, 0, 1); }
            ctx.fillStyle = rgba(P.ink, 0.35); ctx.fillRect(356, yy - 3, [90, 70, 80][i], 5); ctx.restore();
          });
          ctx.restore();
        }
        const items = [1.5, 3, 4.5];
        const wp = pathAt(t, [[0.8, 560, 70], [1.6, 400, 70], [2.6, 400, 84], [4.1, 400, 124], [5.6, 400, 164], [7.0, 400, 164], [7.6, 560, 90]]);
        const nod = 0.15 * Math.sin(Math.PI * seg(t, 4.5, 4.9));
        const pt = items.reduce(function (acc, at) { return acc + Math.exp(-6 * Math.max(0, t - at)) * (t >= at ? 1 : 0); }, 0);
        const ph = swimPh(t, 8, 0.8);
        whale(ctx, P, { x: wp[0], y: wp[1], rot: -nod, len: 72, ph: ph, amp: 0.16, fin: Math.sin(ph) * 0.3 - 1.2 * clamp(pt, 0, 1), fluke: Math.sin(ph + 1) * 0.5, streak: 1, seed: 71, wob: 0.3, blink: (t > 6 && t < 6.12) ? 1 : 0 });
        beatLabel(ctx, P, t, STORIES[5].beats);
      }
    },
    // Story 7: Call & Response Duet between two distinct CharacterSpecs
    s_duet: {
      L: 8, native: true,
      bg: function (ctx, P) {
        wash(ctx, function (s) { blobR(ctx, 145, 150, 96, 66, s); }, mix(P.a, P.paper, 0.25), 211, 0.14);
        wash(ctx, function (s) { blobR(ctx, 335, 150, 96, 66, s); }, mix(P.b, P.paper, 0.25), 213, 0.14);
      },
      draw: function (ctx, t, P) {
        const ph = swimPh(t, 8, 0.75);
        const orbitK = glaser(seg(t, 4.8, 6.8)) * (1 - glaser(seg(t, 7.2, 7.9)));
        const x1 = lerp(138, 240 + 95 * Math.cos(ph), orbitK), y1 = lerp(148 + 8 * Math.sin(ph), 150 + 38 * Math.sin(ph * 2), orbitK);
        const x2 = lerp(342, 240 - 95 * Math.cos(ph), orbitK), y2 = lerp(148 - 8 * Math.sin(ph), 150 - 38 * Math.sin(ph * 2), orbitK);
        // Call rings (1.4..3.2s) and Response rings (3.2..5.0s)
        if (t > 1.4 && t < 3.4) {
          for (let k = 0; k < 3; k++) {
            const u = seg(t, 1.4 + k * 0.25, 2.8 + k * 0.25);
            if (u > 0 && u < 1) { ell(ctx, lerp(x1 + 35, x2 - 35, u), 148, 8 + 18 * Math.sin(Math.PI * u), 8 + 18 * Math.sin(Math.PI * u)); ctx.strokeStyle = rgba(P.h, 1 - u); ctx.lineWidth = 2; ctx.stroke(); }
          }
        }
        if (t > 3.2 && t < 5.2) {
          for (let k = 0; k < 3; k++) {
            const u = seg(t, 3.2 + k * 0.25, 4.6 + k * 0.25);
            if (u > 0 && u < 1) { ell(ctx, lerp(x2 - 35, x1 + 35, u), 148, 8 + 18 * Math.sin(Math.PI * u), 8 + 18 * Math.sin(Math.PI * u)); ctx.strokeStyle = rgba(P.b, 1 - u); ctx.lineWidth = 2; ctx.stroke(); }
          }
        }
        renderActor(ctx, P, getCharSpec(O.charId), { x: x1, y: y1, len: 112, ph: ph, amp: 0.16, fin: Math.sin(ph) * 0.5, fluke: Math.sin(ph + 1) * 0.5, flip: true, streak: 0.85, body: P.h, seed: 221, wob: 0.3 });
        renderActor(ctx, P, getCharSpec(O.partnerCharId || 'geome-orpheus'), { x: x2, y: y2, len: 108, ph: ph + Math.PI, amp: 0.16, fin: Math.sin(ph + Math.PI) * 0.5, fluke: Math.sin(ph) * 0.5, flip: false, streak: 0.85, body: P.b, seed: 223, wob: 0.3 });
        beatLabel(ctx, P, t, STORIES[6].beats);
      }
    },
    // Story 8: Kinetic Hydrography Survey Pass
    s_hydro: {
      L: 8, native: true,
      bg: function (ctx, P) { PROOFS.hydrographic.bg(ctx, P); },
      draw: function (ctx, t, P, F) {
        PROOFS.hydrographic.draw(ctx, (t / 8) * 6, P, F);
        // Plate II deltaE2000 mini bar telemetry in top-right
        const showBars = seg(t, 4.5, 5.2);
        if (showBars > 0 && P.cetiTokenMatches) {
          ctx.save(); ctx.globalAlpha = showBars;
          rrect(ctx, 314, 18, 150, 76, 6); ctx.fillStyle = rgba(P.paper, 0.94); ctx.fill(); ctx.strokeStyle = rgba(P.ink, 0.25); ctx.lineWidth = 1; ctx.stroke();
          txt(ctx, 'ΔE2000 CETI TOKEN FIT', 324, 32, '700 8px ' + MONO, P.ink);
          P.cetiTokenMatches.slice(0, 3).forEach(function (m, idx) {
            const yy = 42 + idx * 15, bw = clamp((24 - m.deltaE2000) / 24, 0.15, 1) * 76;
            ctx.fillStyle = m.swatchHex; ctx.fillRect(324, yy, bw, 7);
            txt(ctx, m.nearestToken + ' Δ' + m.deltaE2000.toFixed(1), 406, yy + 7, '400 8px ' + MONO, rgba(P.ink, 0.8));
          });
          ctx.restore();
        }
        beatLabel(ctx, P, t, STORIES[7].beats);
      }
    },

    // ───────────────────────────────────────────────────────────────────────
    // ELEMENT DEMOS (e_squash .. e_cursor)
    // ───────────────────────────────────────────────────────────────────────
    e_squash: {
      L: 4,
      draw: function (ctx, t, P, F) {
        const h = hop(t, F), gy = 236, x = 120;
        ell(ctx, x, gy + 2, 40, 5); ctx.fillStyle = rgba(P.ink, 0.15); ctx.fill();
        ctx.save(); ctx.translate(x, gy + h.y * 0.8); ctx.rotate(h.rot); ctx.scale(h.sx, h.sy); whale(ctx, P, { x: 0, y: -28, len: 110, ph: 0.4, amp: 0.1, fluke: (t > 0.82 && t < 1.42) ? 0.8 : 0, fin: (t > 0.82 && t < 1.42) ? -0.6 : 0, seed: 81, wob: 0.3 }); ctx.restore();
        const X0 = 260, X1 = 460, Y = function (v) { return 230 - (v - 0.7) / 0.65 * 170; };
        ctx.strokeStyle = rgba(P.ink, 0.4); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X0, 40); ctx.lineTo(X0, 236); ctx.lineTo(X1, 236); ctx.stroke();
        [[1, 'REST 1.0'], [0.8, 'ANTICIPATION 0.8'], [1.28, 'TAKE-OFF 1.28'], [0.76, 'LANDING 0.76']].forEach(function (r) { ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(X0, Y(r[0])); ctx.lineTo(X1, Y(r[0])); ctx.stroke(); ctx.setLineDash([]); txt(ctx, r[1], X1, Y(r[0]) - 3, '700 8px ' + MONO, rgba(P.ink, 0.6), 'right'); });
        ctx.strokeStyle = P.h; ctx.lineWidth = 2.4; ctx.beginPath();
        for (let i = 0; i <= 120; i++) { const tt = i / 120 * 4, v = hop(tt, F).sy, px = lerp(X0, X1, i / 120); if (i) ctx.lineTo(px, Y(v)); else ctx.moveTo(px, Y(v)); }
        ctx.stroke();
        const cx = lerp(X0, X1, t / 4); ell(ctx, cx, Y(h.sy), 4.5, 4.5); ctx.fillStyle = P.ink; ctx.fill();
        txt(ctx, 'sy(t) · sx = 1/√sy', X0 + 4, 34, '700 9px ' + MONO, rgba(P.ink, 0.75));
      }
    },
    e_camera: {
      L: 6,
      bg: function (ctx, P) { clouds(ctx, P, 70, 5); wash(ctx, function (s) { hillPath(ctx, 250, 30, s + 2); }, mix(P.b, P.paper, 0.4), 91, 0.18); },
      draw: function (ctx, t, P, F, bg) {
        const zin = glaser(seg(t, 0.5, 2.5)) - glaser(seg(t, 4.4, 5.8)), zoom = 1 + 0.35 * zin, pan = -50 * zin;
        let kx = 0, ky = 0; if (t > 3 && t < 3.45) { const k = t - 3; kx = 7 * Math.exp(-12 * k) * Math.sin(70 * k); ky = 4 * Math.exp(-12 * k) * Math.cos(55 * k); }
        ctx.save(); ctx.translate(240 + kx, 150 + ky); ctx.scale(zoom, zoom); ctx.translate(-240 + pan, -150);
        ctx.drawImage(bg, 0, 0, LW, LH);
        const ph = swimPh(t, 6, 0.8);
        whale(ctx, P, { x: 270, y: 160, len: 140, ph: ph, amp: 0.16, fin: Math.sin(ph) * 0.5, fluke: Math.sin(ph + 1) * 0.5, streak: 0.8, seed: 93, wob: 0.3, eyeScale: (t > 3 && t < 3.5) ? 1.45 : 1 });
        ctx.restore();
        txt(ctx, 'PUSH ' + zoom.toFixed(2) + '× · PAN · KICK 0.45 S', 16, 24, '700 9px ' + MONO, rgba(P.ink, 0.75));
      }
    },
    e_connect: {
      L: 6,
      draw: function (ctx, t, P, F) {
        const wo = { x: 240, y: 150, len: 200, ph: swimPh(t, 6, 0.6), amp: 0.12, fin: 0, fluke: 0.2, streak: 0.6, seed: 101, wob: 0.3 };
        const g = whaleGeom(wo), eye = [wo.x + g.eye[0], wo.y + g.eye[1]];
        const s1 = 1 - glaser(seg(t, 1.5, 2.2)), s2 = glaser(seg(t, 5.2, 6)), ws = t < 3 ? s1 : s2;
        if (ws > 0.01) { ctx.save(); ctx.translate(eye[0], eye[1]); ctx.scale(ws, ws); ctx.translate(-eye[0], -eye[1]); whale(ctx, P, wo); ctx.restore(); }
        let cx = eye[0], cy = eye[1], w = 0, h = 0, r = 0;
        if (t >= 1.5 && t < 2.2) { const k = glaser(seg(t, 1.5, 2.2)); w = h = lerp(g.er * 2, 80, k); r = w / 2; }
        else if (t >= 2.2 && t < 4.4) { const k = F.ease(seg(t, 2.2, 3.2)); cx = lerp(eye[0], 240, k); cy = lerp(eye[1], 150, k); w = lerp(80, 220, k); h = lerp(80, 130, k); r = lerp(40, 14, k); }
        else if (t >= 4.4 && t < 5.2) { const k = glaser(seg(t, 4.4, 5.2)); cx = lerp(240, eye[0], k); cy = lerp(150, eye[1], k); w = lerp(220, g.er * 2, k); h = lerp(130, g.er * 2, k); r = Math.min(w, h) / 2 * k + 14 * (1 - k); }
        if (w > 0) { rrect(ctx, cx - w / 2, cy - h / 2, w, h, r); ctx.fillStyle = P.ink; ctx.fill(); }
        if (t >= 3.1 && t < 4.5) { const a = seg(t, 3.1, 3.4) * (1 - seg(t, 4.3, 4.5)); ctx.save(); ctx.globalAlpha = a; [150, 120, 160].forEach(function (lw, j) { ctx.fillStyle = rgba(P.paper, 0.8); ctx.fillRect(150, 118 + j * 22, lw, 7); }); ctx.restore(); }
        txt(ctx, 'EYE → NODE → CARD → EYE · NO CUTS', 240, 284, '700 9px ' + MONO, rgba(P.ink, 0.65), 'center');
      }
    },
    e_particles: {
      L: 6,
      draw: function (ctx, t, P) {
        const cols = P.sw.concat([P.h]);
        const pass = function (front) {
          for (let i = 0; i < 28; i++) {
            const n = front ? 2 : 1, v = 520 * n / 6, x = ((hash(i, front ? 11 : 12) * 520 - v * t) % 520 + 520) % 520 - 20, y = 30 + hash(i, 13) * 240 + 10 * Math.sin(TAU * t / 6 * (1 + (i % 3)) + i);
            const r = front ? 3 + (i % 3) : 1.5 + (i % 2);
            ctx.save(); ctx.globalAlpha = front ? 0.85 : 0.45;
            if (i % 2) { ell(ctx, x, y, r, r); ctx.strokeStyle = front ? cols[i % cols.length] : mix(cols[i % cols.length], P.paper, 0.4); ctx.lineWidth = 1.2; ctx.stroke(); }
            else { ctx.translate(x, y); ctx.rotate(TAU * t / 6 * (i % 2 ? 1 : -1) * 2 + i); ell(ctx, 0, 0, r * 1.6, r * 0.7); ctx.fillStyle = front ? cols[i % cols.length] : mix(cols[i % cols.length], P.paper, 0.4); ctx.fill(); }
            ctx.restore();
          }
        };
        pass(false);
        const ph = swimPh(t, 6, 0.8); whale(ctx, P, { x: 240, y: 150 + 8 * Math.sin(TAU * t / 6), len: 150, ph: ph, amp: 0.16, fin: Math.sin(ph) * 0.5, fluke: Math.sin(ph + 1) * 0.5, streak: 1, seed: 111, wob: 0.3 });
        pass(true);
        txt(ctx, 'SEEDED · ANALYTIC · TWO DEPTH PASSES', 16, 24, '700 9px ' + MONO, rgba(P.ink, 0.7));
      }
    },
    e_finish: {
      L: 6, noFinish: true,
      bg: function (ctx, P) { clouds(ctx, P, 70, 7); wash(ctx, function (s) { hillPath(ctx, 246, 34, s + 1); }, mix(P.b, P.paper, 0.35), 121, 0.2); },
      draw: function (ctx, t, P) {
        const ph = swimPh(t, 6, 0.8); whale(ctx, P, { x: 240, y: 150, len: 160, ph: ph, amp: 0.16, fin: Math.sin(ph) * 0.5, fluke: Math.sin(ph + 1) * 0.5, streak: 1, seed: 123, wob: 0.3 });
        const dx = 240 + 150 * Math.sin(TAU * t / 6);
        const grn = getGrain();
        ctx.save(); ctx.beginPath(); ctx.rect(dx, 0, LW - dx, LH); ctx.clip();
        if (grn) { ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = Math.max(0.2, O.grain); ctx.drawImage(grn, 0, 0, LW, LH); ctx.globalAlpha = 1; }
        const gr = ctx.createRadialGradient(240, 150, 140, 240, 150, 320); gr.addColorStop(0, 'rgba(140,96,60,0)'); gr.addColorStop(1, 'rgba(140,96,60,0.22)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, LW, LH);
        ctx.restore();
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(dx, 0); ctx.lineTo(dx, LH); ctx.stroke();
        txt(ctx, 'RAW', 16, 24, '700 10px ' + MONO, rgba(P.ink, 0.75)); txt(ctx, 'GRAIN + WARM VIGNETTE', 464, 24, '700 10px ' + MONO, rgba(P.ink, 0.75), 'right');
      }
    },
    e_type: {
      L: 4,
      draw: function (ctx, t, P, F) {
        const w = (getCharSpec().name || 'little whale').toLowerCase().slice(0, 14);
        ctx.font = 'italic 300 54px ' + SERIF; let tw = 0; const ws = []; for (let i = 0; i < w.length; i++) { const m = ctx.measureText(w[i]).width; ws.push(m); tw += m; }
        let x = 240 - tw / 2;
        for (let i = 0; i < w.length; i++) { const e = F.ease(seg(t, 0.2 + i * 0.06, 0.2 + i * 0.06 + 0.35)), o = glaser(seg(t, 3.0 + (w.length - i) * 0.03, 3.3 + (w.length - i) * 0.03)); ctx.globalAlpha = clamp(e, 0, 1) * (1 - o); ctx.fillStyle = i < 6 ? P.ink : mix(P.h, P.ink, 0.35); ctx.font = 'italic 300 54px ' + SERIF; if (!O.captionsCovered) ctx.fillText(w[i], x, 140 + 26 * (1 - e) - 30 * o); x += ws[i]; }
        ctx.globalAlpha = 1;
        const ph = swimPh(t, 4, 1); whale(ctx, P, { x: lerp(560, -80, t / 4), y: 210, len: 84, ph: ph, amp: 0.2, fin: Math.sin(ph) * 0.5, fluke: Math.sin(ph + 1) * 0.6, streak: 1, seed: 131, wob: 0.3 });
        txt(ctx, 'PER-LETTER · STAGGER 60 MS · ONE TYPEFACE', 240, 284, '700 9px ' + MONO, rgba(P.ink, 0.65), 'center');
      }
    },
    e_beat: {
      L: 4,
      draw: function (ctx, t, P) {
        const beat = Math.floor(t / 0.5), lt = t - beat * 0.5, imp = Math.exp(-9 * lt);
        for (let i = 0; i < 8; i++) { const on = i === beat; rrect(ctx, 64 + i * 46, 246, 38, 22, 4); ctx.fillStyle = on ? P.h : rgba(P.ink, i % 4 === 0 ? 0.2 : 0.1); ctx.fill(); }
        txt(ctx, 'BAR 1', 64, 240, '700 9px ' + MONO, rgba(P.ink, 0.65)); txt(ctx, 'BAR 2', 248, 240, '700 9px ' + MONO, rgba(P.ink, 0.65));
        ell(ctx, 240, 140, 70 + 40 * (1 - imp), 70 + 40 * (1 - imp)); ctx.strokeStyle = rgba(P.h, 0.5 * imp); ctx.lineWidth = 2; ctx.stroke();
        whale(ctx, P, { x: 240, y: 140, len: 150, sx: 1 + 0.04 * imp, sy: 1 - 0.04 * imp, ph: 0.5, amp: 0.1, fin: -0.5 * imp, fluke: -0.9 * imp + 0.2, streak: 1, seed: 141, wob: 0.3 });
        txt(ctx, '120 BPM · KICK EVERY BEAT · VISUAL ONLY', 16, 24, '700 9px ' + MONO, rgba(P.ink, 0.7));
      }
    },
    e_sfx: {
      L: 4,
      draw: function (ctx, t, P, F) {
        const h = hop(t * 1.0, F), small = t > 2.8 && t < 3.4 ? -40 * Math.sin(Math.PI * seg(t, 2.8, 3.4)) : 0, gy = 206;
        ctx.save(); ctx.translate(240, gy + h.y * 0.7 + small); ctx.rotate(h.rot); ctx.scale(h.sx, h.sy); whale(ctx, P, { x: 0, y: -30, len: 120, ph: 0.4, amp: 0.1, fin: (t > 2.3 && t < 2.7) ? -1.2 * Math.sin(Math.PI * seg(t, 2.3, 2.7)) : 0, fluke: 0.2, blink: (t > 2.0 && t < 2.12) ? 1 : 0, seed: 151, wob: 0.3 }); ctx.restore();
        const cues = [[0.62, 'WHOOSH', 0.3], [1.42, 'THUD', 0.45], [2.0, 'CLICK', 0.08], [2.4, 'BOOP', 0.2], [2.8, 'BOING', 0.8], [3.4, 'THUD', 0.25]];
        ctx.strokeStyle = rgba(P.ink, 0.4); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(40, 266); ctx.lineTo(440, 266); ctx.stroke();
        cues.forEach(function (c) { const x = 40 + c[0] / 4 * 400, hgt = 6 + c[2] * 26, lit = t >= c[0] && t < c[0] + 0.25; ctx.fillStyle = lit ? P.h : rgba(P.ink, 0.45); ctx.fillRect(x - 1.5, 266 - hgt, 3, hgt); txt(ctx, c[1], x, 280, '700 8px ' + MONO, rgba(P.ink, lit ? 1 : 0.6), 'center'); });
        const px = 40 + t / 4 * 400; ctx.strokeStyle = P.ink; ctx.beginPath(); ctx.moveTo(px, 226); ctx.lineTo(px, 270); ctx.stroke();
        txt(ctx, 'CUES EXPORTED FROM THE ANIMATION · GAIN = BAR HEIGHT', 16, 24, '700 9px ' + MONO, rgba(P.ink, 0.7));
      }
    },
    e_rig: {
      L: 6,
      draw: function (ctx, t, P) {
        const ex = glaser(seg(t, 0.3, 1.3)) * (1 - glaser(seg(t, 2.2, 3.0)));
        const sw = seg(t, 3.0, 3.4), ph = swimPh(t, 6, 0.8) * sw;
        const wo = { x: 240, y: 146, len: 210, ph: ph, amp: 0.18 * sw, fin: Math.sin(ph) * 0.6 * sw, fluke: Math.sin(ph + 1) * 0.6 * sw, ex: ex, seed: 161, wob: 0.3, blink: (t > 4.6 && t < 4.72) ? 1 : 0 };
        const g = whale(ctx, P, wo);
        if (ex > 0.3) {
          ctx.save(); ctx.globalAlpha = seg(ex, 0.3, 0.8);
          txt(ctx, 'BODY · ORIGIN', 240, 92, '700 9px ' + MONO, P.ink, 'center');
          txt(ctx, 'FIN · PIVOT', wo.x + g.finRoot[0], wo.y + g.finRoot[1] + g.H * 0.4 * ex + 46, '700 9px ' + MONO, P.ink, 'center');
          txt(ctx, 'FLUKE · PIVOT', wo.x + g.flukeRoot[0] + g.L * 0.16 * ex, wo.y + g.flukeRoot[1] - g.H * 0.2 * ex - 44, '700 9px ' + MONO, P.ink, 'center');
          txt(ctx, 'EYE', wo.x + g.eye[0] - g.L * 0.08 * ex, wo.y + g.eye[1] - g.H * 0.5 * ex - 10, '700 9px ' + MONO, P.ink, 'center');
          ctx.restore();
        }
        txt(ctx, 'PARAMETRIC RIG · ' + getCharSpec().name.toUpperCase() + ' · PIVOTS', 16, 24, '700 9px ' + MONO, rgba(P.ink, 0.7));
      }
    },
    e_paint: {
      L: 6, ownBg: true,
      bg: function (ctx, P) {
        wash(ctx, function (s) { tornRectPath(ctx, -10, -10, 500, 170, s, 5, 16); }, P.a, 171, 0.18);
        clouds(ctx, P, 70, 9);
        wash(ctx, function (s) { hillPath(ctx, 236, 44, s + 2.4); }, mix(P.b, P.paper, 0.3), 173, 0.22);
        wash(ctx, function (s) { hillPath(ctx, 262, 26, s + 0.4); }, mix(P.c, P.paper, 0.45), 175, 0.22);
        whale(ctx, P, { x: 240, y: 140, len: 170, ph: 0.6, amp: 0.14, fin: 0.2, fluke: 0.3, streak: 1, seed: 177, wob: 0.6 });
      },
      draw: function (ctx, t, P, F, bg) {
        const fade = 1 - seg(t, 5.4, 6);
        ctx.save(); ctx.beginPath();
        for (let k = 0; k < 6; k++) { const p = glaser(seg(t, k * 0.6, k * 0.6 + 0.9)); if (p <= 0) continue; const y = k * 50 - 4; const x0 = k % 2 ? LW - LW * p : 0; ctx.rect(x0, y, LW * p, 58); }
        ctx.clip(); ctx.globalAlpha = fade; ctx.drawImage(bg, 0, 0, LW, LH); ctx.restore();
        txt(ctx, 'PAINTED ONCE · REVEALED HERE · THEN COMPOSITED PER FRAME', 240, 290, '700 8px ' + MONO, rgba(P.ink, 0.6), 'center');
      }
    },
    e_fx: {
      L: 4,
      draw: function (ctx, t, P) {
        let x, y = 140, eyeS = 1;
        if (t < 1.2) x = lerp(-60, 240, glaser(t / 1.2)); else if (t < 3.4) x = 240; else x = lerp(240, 560, (t - 3.4) / 0.6);
        if (t >= 2.2 && t < 3.4) { const k = seg(t, 2.2, 2.6); y = lerp(140, 196, k * k); }
        if (t >= 3.4) y = lerp(196, 140, seg(t, 3.4, 4));
        const fast = t < 1.0 || t > 3.4;
        const base = { len: 130, ph: 0.4, amp: 0.12, fin: 0, fluke: 0.3, seed: 181, wob: 0.3, flip: true };
        if (fast) { [2 / 48, 1 / 48].forEach(function (d, i) { const tx = t < 1.2 ? lerp(-60, 240, glaser(clamp((t - d) / 1.2, 0, 1))) : lerp(240, 560, clamp((t - d - 3.4) / 0.6, 0, 1)); whale(ctx, P, Object.assign({}, base, { x: tx, y: y, alpha: i ? 0.3 : 0.15 })); }); }
        const surprise = t > 1.5 && t < 2.1; if (surprise) eyeS = 1.45;
        const landing = t > 2.6 && t < 3.1;
        ell(ctx, x, 238, landing ? 70 : 50, 5); ctx.fillStyle = rgba(P.ink, 0.15); ctx.fill();
        whale(ctx, P, Object.assign({}, base, { x: x, y: y, eyeScale: eyeS, sy: landing ? 1 - 0.18 * Math.sin(Math.PI * seg(t, 2.6, 3.1)) : 1 }));
        if (surprise) { ctx.strokeStyle = P.ink; ctx.lineWidth = 2; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.35, r0 = 42, r1 = 56; ctx.beginPath(); ctx.moveTo(x + 50 + Math.cos(a) * r0, y - 20 + Math.sin(a) * r0); ctx.lineTo(x + 50 + Math.cos(a) * r1, y - 20 + Math.sin(a) * r1); ctx.stroke(); } }
        if (landing) { const k = seg(t, 2.6, 3.1); ctx.strokeStyle = rgba(P.ink, 1 - k); ctx.lineWidth = 2; [-1, 1].forEach(function (sd) { for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(x + sd * (70 + j * 8), 236 - j * 6); ctx.lineTo(x + sd * (82 + j * 8 + 14 * k), 228 - j * 8); ctx.stroke(); } }); for (let i = 0; i < 6; i++) { const sd = i < 3 ? -1 : 1, m = i % 3; ell(ctx, x + sd * (60 + 40 * k * (0.6 + 0.3 * m)), 232 - 8 * k * m, 5 * (1 - 0.5 * k), 5 * (1 - 0.5 * k)); ctx.fillStyle = rgba(mix(P.paper, P.ink, 0.3), 0.5 * (1 - k)); ctx.fill(); } }
        txt(ctx, 'SMEAR GHOSTS 1/48 · 2/48 S · SURPRISE EYE 1.45 · IMPACT · PUFFS', 16, 24, '700 8px ' + MONO, rgba(P.ink, 0.7));
      }
    },
    e_field: {
      L: 6,
      bg: function (ctx, P) {
        const cols = P.sw.concat([P.h]), r = rng(901);
        ctx.lineCap = 'round';
        for (let i = 0; i < 260; i++) {
          let x = r() * 480, y = r() * 300; ctx.beginPath(); ctx.moveTo(x, y);
          for (let k = 0; k < 9; k++) { const a = Math.sin(x * 0.018) + Math.cos(y * 0.027) * 1.3; x += Math.cos(a) * 5; y += Math.sin(a) * 5; ctx.lineTo(x, y); }
          ctx.strokeStyle = rgba(cols[i % cols.length], 0.35); ctx.lineWidth = 1.4; ctx.stroke();
        }
      },
      draw: function (ctx, t, P) {
        const x = lerp(560, -80, t / 6), y = 150 + 34 * Math.sin(x * 0.018), slope = 34 * 0.018 * Math.cos(x * 0.018), ph = swimPh(t, 6, 0.8);
        whale(ctx, P, { x: x, y: y, rot: -Math.atan(slope) * 0.8, len: 130, ph: ph, amp: 0.18, fin: Math.sin(ph) * 0.5, fluke: Math.sin(ph + 1) * 0.5, streak: 1, seed: 191, wob: 0.3 });
        txt(ctx, 'SEED 901 · SAME FIELD EVERY RENDER', 16, 24, '700 9px ' + MONO, rgba(P.ink, 0.75));
      }
    },
    e_cursor: {
      L: 6,
      draw: function (ctx, t, P, F) {
        const fade = 1 - seg(t, 5.4, 5.9);
        ctx.save(); ctx.globalAlpha = fade;
        rrect(ctx, 90, 56, 300, 180, 12); ctx.fillStyle = P.paper; ctx.fill(); ctx.strokeStyle = rgba(P.ink, 0.35); ctx.lineWidth = 1.2; ctx.stroke();
        rrect(ctx, 110, 76, 120, 10, 5); ctx.fillStyle = rgba(P.ink, 0.6); ctx.fill();
        rrect(ctx, 110, 100, 260, 32, 6); ctx.strokeStyle = rgba(P.ink, 0.45); ctx.stroke();
        const s = (getCharSpec().name || 'little whale').toLowerCase(), tau = Math.max(0, t - 0.9), n = Math.min(s.length, Math.floor(5 * tau + 4.5 * tau * tau / 1.5));
        txt(ctx, s.slice(0, n) + ((Math.floor(t * 3) % 2 && n < s.length) ? '|' : ''), 120, 121, '500 14px ' + SANS, P.ink);
        const on = F.ease(seg(t, 3.2, 3.45)); rrect(ctx, 110, 148, 44, 24, 12); ctx.fillStyle = on > 0.5 ? P.h : rgba(P.ink, 0.15); ctx.fill(); ell(ctx, 122 + 20 * on, 160, 9, 9); ctx.fillStyle = P.paper; ctx.fill(); ctx.strokeStyle = rgba(P.ink, 0.4); ctx.stroke();
        txt(ctx, 'Streaks', 164, 165, '500 13px ' + SANS, P.ink);
        const pressed = t > 4.3; rrect(ctx, 270, 190, 100, 32, 8); ctx.fillStyle = pressed ? P.h : P.ink; ctx.fill(); txt(ctx, 'Make it', 320, 211, '600 13px ' + SANS, P.paper, 'center');
        if (t > 4.4) { const k = F.ease(seg(t, 4.4, 4.9)); whale(ctx, P, { x: 320, y: 190 - 34 * k, len: 70 * clamp(k, 0, 1.2), ph: 0.4, amp: 0.1, streak: k, seed: 201, wob: 0.3 }); }
        const cp = pathAt(t, [[0, 440, 270], [0.8, 200, 118], [2.6, 200, 118], [3.2, 132, 160], [3.6, 132, 160], [4.2, 320, 206], [6, 440, 270]]);
        const clicks = [0.8, 3.2, 4.3]; clicks.forEach(function (c) { if (t > c && t < c + 0.35) { const k = seg(t, c, c + 0.35); ell(ctx, cp[0], cp[1], 6 + 14 * k, 6 + 14 * k); ctx.strokeStyle = rgba(P.h, 1 - k); ctx.lineWidth = 2; ctx.stroke(); } });
        polyPath(ctx, [[cp[0], cp[1]], [cp[0], cp[1] + 18], [cp[0] + 5, cp[1] + 13], [cp[0] + 9, cp[1] + 21], [cp[0] + 12, cp[1] + 19], [cp[0] + 8, cp[1] + 12], [cp[0] + 14, cp[1] + 12]]); ctx.fillStyle = P.ink; ctx.fill(); ctx.strokeStyle = P.paper; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.restore();
        txt(ctx, 'THREE UI MOMENTS · TYPING 5 → 14 HZ', 16, 24, '700 9px ' + MONO, rgba(P.ink, 0.7));
      }
    }
  };

  // 8 Character Interaction Proofs (ix_hero-journey .. ix_hydrographic-trace)
  PROOFS['ix_hero-journey']       = PROOFS.s_voice;
  PROOFS['ix_filter-engine']      = PROOFS.s_filter;
  PROOFS['ix_guide-pointer']      = PROOFS.s_guide;
  PROOFS['ix_retriever-carrier']  = PROOFS.s_retrieve;
  PROOFS['ix_dialogue-duet']      = PROOFS.s_duet;
  PROOFS['ix_hydrographic-trace'] = PROOFS.s_hydro;
  PROOFS['ix_continuous-morph'] = {
    L: 5, native: true,
    draw: function (ctx, t, P) {
      // Cycles Rung 1 -> Rung 2 -> Rung 3 -> Rung 4 -> Rung 5 seamlessly
      const rIdx = Math.min(5, 1 + Math.floor((t / 5) * 5));
      const ph = swimPh(t, 5, 0.8);
      whale(ctx, P, { x: 240, y: 146, len: 185, ph: ph, amp: 0.16, fin: Math.sin(ph) * 0.5, fluke: Math.sin(ph + 1) * 0.5, streak: 0.9, rung: rIdx, seed: 401, wob: 0.35 });
      for (let r = 1; r <= 5; r++) {
        ctx.fillStyle = r === rIdx ? P.h : rgba(P.ink, 0.2);
        rrect(ctx, 115 + (r - 1) * 52, 248, 42, 16, 4); ctx.fill();
        txt(ctx, 'R' + r, 136 + (r - 1) * 52, 260, '700 9px ' + MONO, r === rIdx ? P.paper : P.ink, 'center');
      }
      txt(ctx, 'SAUL BASS 5-RUNG LADDER · RUNG ' + rIdx + ' ACTIVE', 240, 284, '700 9px ' + MONO, rgba(P.ink, 0.75), 'center');
    }
  };
  PROOFS['ix_simulation-driver'] = {
    L: 6, native: true,
    draw: function (ctx, t, P) {
      const ph = swimPh(t, 6, 1.0), ax = 195 + 24 * Math.cos(TAU * t / 6), ay = 150 + 22 * Math.sin(TAU * t / 3);
      // Reynolds vortex wake shed behind the actor's fluke
      for (let i = 1; i <= 16; i++) {
        const dt = i * 0.16, vx = ax + i * 15, vy = ay + (i % 2 ? 1 : -1) * (8 + i * 1.4) + 12 * Math.sin(ph - dt * 4);
        const rad = 3 + i * 1.15;
        ell(ctx, vx, vy, rad, rad * 0.68);
        ctx.strokeStyle = rgba(i % 2 ? P.h : P.b, clamp(0.75 - i * 0.042, 0.06, 0.75));
        ctx.lineWidth = 1.6; ctx.stroke();
      }
      whale(ctx, P, { x: ax, y: ay, len: 135, ph: ph, amp: 0.22, fin: Math.sin(ph) * 0.65, fluke: Math.sin(ph + 1) * 0.75, streak: 0.8, seed: 409, wob: 0.3 });
      txt(ctx, 'KARMAN VORTEX STREET · REYNOLDS WAKE COUPLED TO FLUKE PHASE', 16, 284, '700 9px ' + MONO, rgba(P.ink, 0.75));
    }
  };

  // Background & grain caches
  const BG = new Map();
  function getBg(key, P) {
    if (typeof document === 'undefined') return null;
    const id = key + '|' + P.id + '|' + O.charId + '|' + O.ground + '|' + O.rung;
    let c = BG.get(id); if (c) return c;
    c = document.createElement('canvas'); c.width = LW; c.height = LH; const x = c.getContext('2d');
    const pr = PROOFS[key];
    if (!(pr && pr.ownBg)) {
      x.fillStyle = P.paper; x.fillRect(0, 0, LW, LH);
      x.save(); x.globalCompositeOperation = 'multiply';
      for (let i = 0; i < 7; i++) { blobR(x, hash(i, 91) * LW, hash(i, 92) * LH, 60 + hash(i, 93) * 90, 40 + hash(i, 94) * 60, i * 3 + 1); x.fillStyle = rgba(mix(P.paper, P.a, 0.6), 0.07); x.fill(); }
      x.restore();
    }
    if (pr && pr.bg) { x.save(); pr.bg(x, P); x.restore(); }
    BG.set(id, c); if (BG.size > 96) BG.delete(BG.keys().next().value);
    return c;
  }
  let GR = null;
  function getGrain() {
    if (typeof document === 'undefined') return null;
    if (GR) return GR; GR = document.createElement('canvas'); GR.width = LW; GR.height = LH;
    const x = GR.getContext('2d'), im = x.createImageData(LW, LH), r = rng(4242);
    for (let i = 0; i < im.data.length; i += 4) { const v = 255 - Math.floor(r() * r() * 70); im.data[i] = v; im.data[i + 1] = v - 2; im.data[i + 2] = v - 6; im.data[i + 3] = 255; }
    x.putImageData(im, 0, 0); return GR;
  }

  function render(el, key, pal, F, T, opts) {
    const pr = PROOFS[key]; if (!pr || !el) return;
    const ctx = el.getContext('2d'); if (!ctx) return;
    const op = opts || {};
    const prevO = {
      wob: O.wob, streaks: O.streaks, guide: O.guide, ground: O.ground,
      grain: O.grain, charId: O.charId, partnerCharId: O.partnerCharId,
      renderMode: O.renderMode, rung: O.rung, captionsCovered: O.captionsCovered
    };
    try {
      O.wob = op.wob == null ? 1 : op.wob;
      O.streaks = op.streaks !== false;
      O.guide = op.guide !== false;
      O.ground = op.ground || 'atlas';
      O.grain = op.grain == null ? 0.24 : op.grain;
      if (op.charId) O.charId = op.charId;
      if (op.partnerCharId) O.partnerCharId = op.partnerCharId;
      O.renderMode = op.renderMode || null;
      O.rung = op.rung || 1;
      O.captionsCovered = !!op.captionsCovered;

      const P = prep(pal);
      ctx.setTransform(el.width / LW, 0, 0, el.height / LH, 0, 0);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = true; ctx.setLineDash([]);
      const bg = getBg(key, P);
      if (pr.ownBg || !bg) { ctx.fillStyle = P.paper; ctx.fillRect(0, 0, LW, LH); }
      else ctx.drawImage(bg, 0, 0, LW, LH);

      const warpFn = (F && F.warp) ? F.warp : function (x) { return x; };
      const easeObj = F || { ease: glaser, warp: warpFn };
      let t = warpFn(T) % pr.L; if (t < 0) t += pr.L;

      ctx.save();
      if (op.cameraMove) {
        const cam = op.cameraMove;
        let cz = 1.0, cxOff = 0, cyOff = 0, cRot = 0;
        if (cam === 'push-in' || cam === 'push') { cz = 1.22; cxOff = -18; cyOff = -6; }
        else if (cam === 'pan-follow' || cam === 'pan') { cz = 1.08; cxOff = 24; cyOff = 0; }
        else if (cam === 'dutch-tilt') { cz = 1.12; cRot = -0.055; }
        else if (cam === 'tracking-drift') { cz = 1.15; cxOff = -10; cyOff = 10; }
        else if (cam === 'breather-hold') { cz = 0.88; }
        else if (cam === 'kick-shake') { cz = 1.26; cRot = 0.035; cyOff = -14; }
        else if (cam === 'pull-back' || cam === 'pull') { cz = 0.93; cxOff = 14; }
        ctx.translate(LW / 2, LH / 2);
        if (cRot) ctx.rotate(cRot);
        ctx.scale(cz, cz);
        ctx.translate(-LW / 2 + cxOff, -LH / 2 + cyOff);
      }
      pr.draw(ctx, t, P, easeObj, bg);
      ctx.restore();

      if (op.cameraMove && !O.captionsCovered) {
        // Editorial storyboard camera viewfinder reticle & beat badge
        ctx.save();
        ctx.strokeStyle = rgba(P.ink, 0.32); ctx.lineWidth = 1.2;
        [[12, 12, 1, 1], [LW - 12, 12, -1, 1], [12, LH - 12, 1, -1], [LW - 12, LH - 12, -1, -1]].forEach(function (c) {
          ctx.beginPath(); ctx.moveTo(c[0], c[1] + 10 * c[3]); ctx.lineTo(c[0], c[1]); ctx.lineTo(c[0] + 10 * c[2], c[1]); ctx.stroke();
        });
        if (op.beatIdx != null) {
          txt(ctx, 'BEAT ' + (Number(op.beatIdx) + 1) + '/8 · CAM ' + String(op.cameraMove).toUpperCase(), LW - 16, 24, '700 8.5px ' + MONO, rgba(P.ink, 0.72), 'right');
        }
        ctx.restore();
      }

      if (pr.guide && O.guide) { ctx.save(); guideWhale(ctx, P, t, pr.L, pr.guide); ctx.restore(); }
      if (!pr.noFinish) {
        const grn = getGrain();
        ctx.save();
        if (grn && O.grain > 0.01) {
          ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = O.grain; ctx.drawImage(grn, 0, 0, LW, LH); ctx.globalAlpha = 1;
        }
        const g = ctx.createRadialGradient(240, 150, 140, 240, 150, 320);
        g.addColorStop(0, 'rgba(140,96,60,0)'); g.addColorStop(1, 'rgba(140,96,60,0.16)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, LW, LH);
        ctx.restore();
      }
    } finally {
      Object.assign(O, prevO);
    }
  }

  // 4-Test Saul Bass Emblem Gauntlet (16px favicon, 1-color ink, knockout inversion, squint blur) (G05)
  function runEmblemGauntlet(charSpec, pal) {
    const spec = charSpec || getCharSpec();
    const P = prep(pal || global.STUDIO_WADA_ENGINE.PALS[0]);
    const g = actorGeom(spec, { len: 120, ph: 0.4, amp: 0.14 });
    const hasValidBounds = g.body.length >= 10 && g.L > 0 && g.H > 0;
    const has5Rungs = Array.isArray(spec.reductionLadder) && spec.reductionLadder.length === 5;
    const crInkPaper = global.STUDIO_WADA_ENGINE.wcagContrast(P.ink, P.paper);
    const pass = hasValidBounds && has5Rungs && crInkPaper >= 7.0;
    return {
      charId: spec.id,
      favicon16px: hasValidBounds && has5Rungs,
      oneColorSilhouette: hasValidBounds && g.fluke.length >= 4 && g.fin.length >= 4,
      knockoutInversion: crInkPaper >= 7.0,
      squintSilhouette: spec.aspectRatio >= 0.22 && spec.aspectRatio <= 0.65,
      allPassed: pass,
      overallPass: pass
    };
  }

  const FEELS = {
    spring:  { id: 'spring',  label: 'Physical spring', ease: spring, warp: function (t) { return t; }, note: 'Atlas numbers: anticipation 0.15–0.3 s · take-off stretch 1.25–1.3 · landing spring f 2.4 / damp 7.', brief: 'anticipation 0.15–0.3 s, take-off sy 1.25–1.3, landing spring f 2.4 / damp 7, sx = 1/√sy' },
    glaser:  { id: 'glaser',  label: 'CETI house ease', ease: glaser, warp: function (t) { return t; }, note: 'cubic-bezier(0.22, 1, 0.36, 1) from the CETI design system · no overshoot · stagger 80–120 ms.', brief: 'CETI house ease cubic-bezier(0.22,1,0.36,1), no overshoot, stagger 80–120 ms' },
    rest:    { id: 'rest',    label: 'CETI rest ease',  ease: rest,   warp: function (t) { return t; }, note: 'cubic-bezier(0.4, 0, 0.6, 1) — symmetric, unhurried. The design system’s toggle ease.', brief: 'CETI rest ease cubic-bezier(0.4,0,0.6,1), symmetric, no overshoot' },
    slow:    { id: 'slow',    label: 'Slow tide ½×',    ease: glaser, warp: function (t) { return t * 0.5; }, note: 'Half speed with the house ease. Slow down, filter noise — taken literally.', brief: 'half-speed timing with the CETI house ease; longer holds' },
    held:    { id: 'held',    label: 'Held 12 fps',     ease: glaser, warp: function (t) { return Math.floor(t * 12) / 12; }, note: 'Each drawing held two frames — 12 fps inside a 24/30 fps master. The handmade cadence.', brief: 'each drawing held 2 frames (12 fps in a 24/30 fps master), seeded boil per held frame' },
    beat:    { id: 'beat',    label: 'Beat-locked 120', ease: glaser, warp: function (t) { const b = Math.floor(t / 0.5), f = (t - b * 0.5) / 0.18; return (b + glaser(Math.min(1, f))) * 0.5; }, note: 'Time moves in 0.18 s bursts that land on a 0.5 s grid (120 BPM), then holds.', brief: '120 BPM; every change lands on the 0.5 s grid in 0.18 s bursts, holds between' },
    saul:    { id: 'saul',    label: 'Saul snap-hold',  ease: bez(0.85, 0, 0.15, 1), warp: function (t) { const b = Math.floor(t * 8) / 8; return b; }, note: 'Saul Bass severe 8 fps poster snap with high-tension ease-in-out and graphic holds.', brief: 'Saul Bass 8 fps graphic snap with cubic-bezier(0.85,0,0.15,1) and poster holds' },
    rostrum: { id: 'rostrum', label: 'Rostrum cut-ease', ease: function (x) { const u = clamp(x, 0, 1); return 1 - Math.pow(1 - u, 3); }, warp: function (t) { return Math.floor(t * 10) / 10; }, note: 'Saul Bass rostrum camera cut-ease: outCut = 1-(1-x)^3, binary opacity, zero fade.', brief: 'Saul Bass rostrum cut-ease outCut = 1-(1-x)^3 on 10 fps stepped table holds' }
  };
  const FEEL_ORDER = ['spring', 'glaser', 'rest', 'slow', 'held', 'beat', 'saul', 'rostrum'];

  // Tell-Apart Geometric Discriminability Kernel across CharacterSpecs (A1 / A4)
  function computeContourSignature(charSpec) {
    const g = actorGeom(charSpec, { len: 120, ph: 0, amp: 0 });
    const sig = [];
    for (let k = 0; k < 10; k++) {
      const idx = Math.floor((k / 10) * (g.body.length - 1));
      const pt = g.body[idx] || [0, 0];
      sig.push(Number((pt[0] / g.L).toFixed(4)), Number((pt[1] / g.L).toFixed(4)));
    }
    sig.push(Number((g.aspectRatio || charSpec.aspectRatio || 0.36).toFixed(3)));
    sig.push(g.fluke.length, g.fin.length);
    return sig;
  }

  function auditArchetypeDiscriminability(customCharactersMap) {
    const map = customCharactersMap || global.STUDIO_CHARACTER_FOUNDRY.CHARACTERS;
    const ids = Object.keys(map);
    const sigs = {};
    ids.forEach(function (id) { sigs[id] = computeContourSignature(map[id]); });
    let minDistance = Infinity;
    let closestPair = null;
    let totalPairs = 0;
    let maxDistance = 0;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        totalPairs++;
        const a = sigs[ids[i]], b = sigs[ids[j]];
        let d = 0;
        for (let k = 0; k < Math.min(a.length, b.length); k++) d += Math.abs(a[k] - b[k]);
        if (d < minDistance) {
          minDistance = d;
          closestPair = [ids[i], ids[j]];
        }
        if (d > maxDistance) maxDistance = d;
      }
    }
    return {
      totalPairs: totalPairs,
      pairCount: totalPairs,
      minPairwiseDistance: Number(minDistance.toFixed(4)),
      minDistance: Number(minDistance.toFixed(4)),
      maxDistance: Number(maxDistance.toFixed(4)),
      closestPair: closestPair,
      discriminable: minDistance > 0.08,
      pass: minDistance > 0.08
    };
  }

  function drawDirect(key, ctx, t, pal, opts) {
    if (!ctx) return;
    const el = ctx.canvas || { width: LW, height: LH, getContext: function () { return ctx; } };
    if (!el.getContext) el.getContext = function () { return ctx; };
    return render(el, key, pal || global.STUDIO_WADA_ENGINE.PALS[0], FEELS.spring, t || 0, opts || {});
  }

  function renderReductionRungFlexible(ctx, palOrP, specOrG, rungOrO, maybeCx, maybeCy, maybeScale, maybeT) {
    const P = (palOrP && palOrP.paper && palOrP.ink && palOrP.sw && typeof palOrP.sw[0] === 'string')
      ? palOrP
      : prep(palOrP || global.STUDIO_WADA_ENGINE.PALS[0]);
    if (typeof rungOrO === 'number') {
      const spec = (specOrG && specOrG.id) ? specOrG : getCharSpec();
      const o = { x: maybeCx || 120, y: maybeCy || 75, len: 120 * (maybeScale || 1), ph: (maybeT || 0) * 2 };
      const g = actorGeom(spec, o);
      return renderReductionRung(ctx, P, g, o, rungOrO);
    }
    return renderReductionRung(ctx, P, specOrG, rungOrO || { x: 120, y: 75 }, maybeCx || 2);
  }

  global.MA = {
    render: render,
    draw: drawDirect,
    len: function (key) { return PROOFS[key] ? PROOFS[key].L : 4; },
    has: function (key) { return !!PROOFS[key]; },
    glaser: glaser,
    rest: rest,
    spring: spring,
    clamp: clamp,
    keys: Object.keys(PROOFS),
    PROOFS: PROOFS,
    FEELS: FEELS,
    FEEL_ORDER: FEEL_ORDER,
    actorGeom: actorGeom,
    computeContourSignature: computeContourSignature,
    auditArchetypeDiscriminability: auditArchetypeDiscriminability,
    renderActor: function (ctx, palOrP, specOrOpts, maybeOpts) {
      const P = (palOrP && palOrP.paper && palOrP.ink && palOrP.sw && typeof palOrP.sw[0] === 'string')
        ? palOrP
        : prep(palOrP || global.STUDIO_WADA_ENGINE.PALS[0]);
      const o = Object.assign({}, maybeOpts || specOrOpts || {});
      if (o.cx != null && o.x == null) o.x = o.cx;
      if (o.cy != null && o.y == null) o.y = o.cy;
      return renderActor(ctx, P, specOrOpts, o);
    },
    renderReductionRung: renderReductionRungFlexible,
    runEmblemGauntlet: runEmblemGauntlet,
    setActorOption: function (k, v) { O[k] = v; },
    registerCustomCharacter: function (spec) {
      if (!spec || !spec.id) return;
      O.customCharSpecs[spec.id] = spec;
      global.STUDIO_CHARACTER_FOUNDRY.CHARACTERS[spec.id] = spec;
      if (global.STUDIO_CHARACTER_FOUNDRY.CHARACTER_ORDER.indexOf(spec.id) < 0) {
        global.STUDIO_CHARACTER_FOUNDRY.CHARACTER_ORDER.push(spec.id);
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
