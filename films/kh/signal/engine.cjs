// Node host for Signal: kit + film + motion-blur renderer (sub-frames per film.shutter(t)).
const { KH, createCanvas } = require('../host.cjs');
require('./film.js');
const FILM = globalThis.SIGNAL;
function makeRenderer() {
  const out = createCanvas(FILM.W, FILM.H), oc = out.getContext('2d');
  const tmp = createCanvas(FILM.W, FILM.H), tc = tmp.getContext('2d');
  return (t, fps = FILM.fps) => {
    const [sub, shutter] = FILM.shutter(t);
    FILM.drawFrame(oc, t);
    for (let k = 1; k < sub; k++) {
      FILM.drawFrame(tc, t + (k / sub) * (shutter / fps));
      oc.save(); oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalAlpha = 1 / (k + 1); oc.drawImage(tmp, 0, 0); oc.restore();
    }
    return out;
  };
}
module.exports = { KH, FILM, makeRenderer, createCanvas };
