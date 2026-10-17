// Motion moodboard — built from the real engines, so every cell is a true frame of the style in motion.
// node board.cjs static out.png   |   node board.cjs video out.mp4 a b   (8 s loop at 60 fps; cells loop their own segment)
const { KH, createCanvas } = require('../host.cjs'); require('../whale-rig.js');
require('../sea/film.js'); require('../composition/film2.js'); require('../lines/whaleline.js');
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const { CETI: C, W: WD, text, whaleMark, rgba, mix, clamp } = KH;
const SEA = globalThis.SEA, COMP = globalThis.COMPOSITION.makeFilm();
const LINE = globalThis.WHALELINE.makeFilm(JSON.parse(fs.readFileSync(path.join(__dirname, '../lines/stories/brief-v2.json'), 'utf8')));
const CELLS = [
  { f: SEA, a: 3.0, b: 5.6, still: 4.2, name: 'Sense', note: 'reach ring · glyphs light on contact · speed trail' },
  { f: SEA, a: 7.3, b: 9.8, still: 8.0, name: 'Sounding', note: 'one ping sorts the rest · 1,900 px/s' },
  { f: SEA, a: 10.6, b: 13.0, still: 12.2, name: 'Idea', note: 'push in to 1.7× · spark on the beat' },
  { f: SEA, a: 18.1, b: 21.4, still: 20.4, name: 'Dispatch', note: 'pods leave on beats · work ring · check' },
  { f: COMP, a: 7.4, b: 10.6, still: 8.9, name: 'Typed joints', note: 'parts snap only if they fit' },
  { f: COMP, a: 11.8, b: 15.6, still: 14.2, name: 'Show its work', note: 'the value flows; every step leaves a trace' },
];
const W = 1920, H = 1080, CW = 576, CH = 324, GX = 72, GY = 196, GAP = 24, ROWH = CH + 68;
const src = createCanvas(1920, 1080), sc = src.getContext('2d');
function board(c, T, video) {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = C.paper; c.fillRect(0, 0, W, H);
  text(c, 'CETI · Motion moodboard · Sea of data + Composition', GX, 72, { f: 'mono', size: 14, col: C.slate });
  text(c, 'Make sense, then <i>compose</i>.', GX, 146, { f: 'disp', size: 62, col: C.navy, accent: WD.englishRed });
  text(c, video ? 'Each cell loops its own moment' : 'Stills from the live engines', W - GX, 72, { f: 'mono', size: 13, col: C.slate, align: 'right' });
  CELLS.forEach((cell, i) => {
    const col = i % 3, row = Math.floor(i / 3), x = GX + col * (CW + GAP), y = GY + row * ROWH;
    const len = cell.b - cell.a, lt = video ? cell.a + ((T + i * 0.37) % len) : cell.still;
    cell.f.drawFrame(sc, lt);
    c.drawImage(src, x, y, CW, CH);
    if (video) { const e = ((T + i * 0.37) % len); const fade = Math.min(1, e / 0.18, (len - e) / 0.18); if (fade < 1) { c.fillStyle = rgba(C.paper, 1 - fade); c.fillRect(x, y, CW, CH); } }
    c.strokeStyle = rgba(C.navy, 0.18); c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, CW - 1, CH - 1);
    text(c, `${String(i + 1).padStart(2, '0')} · ${cell.name}`, x, y + CH + 28, { f: 'mono', size: 13, col: C.navy });
    text(c, cell.note, x, y + CH + 50, { f: 'sans', size: 15, col: C.slate });
  });
  // palettes + lineage
  const py = 1046, chips = (x, label, cols) => { text(c, label, x, py - 4, { f: 'mono', size: 11, col: C.slate }); cols.forEach((h, k) => { c.fillStyle = h; c.fillRect(x + 236 + k * 30, py - 20, 24, 24); }); };
  chips(GX, 'Sea · Wada 339', KH.WADA[339].map(([, h]) => h));
  chips(GX + 420, 'Composition · Wada 296', KH.WADA[296].map(([, h]) => h));
  chips(GX + 840, 'Line · Wada 279', KH.WADA[279].map(([, h]) => h));
  text(c, 'Kinetic Hydrography 1.0.0 → Whale Line → Sea of data · Composition', W - GX, py - 4, { f: 'mono', size: 11, col: C.slate, align: 'right', track: 0.12 });
  c.restore();
}
const [mode, out, a, b] = process.argv.slice(2);
const cv = createCanvas(W, H), cx = cv.getContext('2d');
if (mode === 'static') { board(cx, 0, false); fs.writeFileSync(out, cv.toBuffer('image/png')); console.log('ok'); }
else { const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', '1920x1080', '-r', '60', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  (async () => { for (let i = +a; i < +b; i++) { board(cx, i / 60, true); if (!ff.stdin.write(Buffer.from(cv.data()))) await new Promise(r => ff.stdin.once('drain', r)); } ff.stdin.end(); })(); }
