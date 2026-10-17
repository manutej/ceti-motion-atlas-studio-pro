// Node host for film2.js: registers fonts, provides Path2D + canvas factory, loads the film.
const { createCanvas, GlobalFonts, Path2D } = require('@napi-rs/canvas');
const fs = require('fs'), path = require('path');
const F = p => path.join(__dirname, 'fonts', p);
GlobalFonts.registerFromPath(F('Fraunces-LightItalic-static.ttf'), 'FrauncesL');
GlobalFonts.registerFromPath(F('SpaceMono-Regular.ttf'), 'SpaceMono');
GlobalFonts.registerFromPath(F('DMSans-static.ttf'), 'DMSansS');
globalThis.SCORE = JSON.parse(fs.readFileSync(path.join(__dirname, 'score.json'), 'utf8'));
globalThis.Path2D = Path2D;
globalThis.makeCanvas = (w, h) => createCanvas(w, h);
require('./film2.js');
const FILM = globalThis.FILM2;

// render one output frame; sub>1 averages sub-frames across a 180-degree shutter (motion blur)
function makeRenderer(sub = 2) {
  const out = createCanvas(FILM.W, FILM.H), oc = out.getContext('2d');
  const tmp = createCanvas(FILM.W, FILM.H), tc = tmp.getContext('2d');
  return (t, fps = 60) => {
    FILM.drawFrame(oc, t);
    for (let k = 1; k < sub; k++) {
      FILM.drawFrame(tc, t + (k / sub) * (0.5 / fps));
      oc.save(); oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalAlpha = 1 / (k + 1); oc.drawImage(tmp, 0, 0); oc.restore();
    }
    return out;
  };
}
module.exports = { FILM, makeRenderer, createCanvas };
