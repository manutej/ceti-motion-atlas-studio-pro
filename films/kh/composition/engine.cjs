// Node host for "Composition": kit + whale rig + film. makeRenderer() adds motion blur from the film's shutter.
const { KH, createCanvas } = require('../host.cjs');
require('../whale-rig.js');
require(process.env.FILM ? require('path').resolve(__dirname, process.env.FILM) : './film.js');   // FILM=film2.js selects v2
function load() {
  const FILM = globalThis.COMPOSITION.makeFilm();
  function makeRenderer() {
    const out = createCanvas(FILM.W, FILM.H), oc = out.getContext('2d'), tmp = createCanvas(FILM.W, FILM.H), tc = tmp.getContext('2d');
    return (t) => { const [sub, sh] = FILM.shutter(t); FILM.drawFrame(oc, t);
      for (let k = 1; k < sub; k++) { FILM.drawFrame(tc, t + (k / sub) * (sh / FILM.fps)); oc.save(); oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalAlpha = 1 / (k + 1); oc.drawImage(tmp, 0, 0); oc.restore(); }
      return out; };
  }
  return { KH, FILM, makeRenderer, createCanvas };
}
module.exports = { load };
