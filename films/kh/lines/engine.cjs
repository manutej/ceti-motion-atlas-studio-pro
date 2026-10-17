// Node host for Whale Line films: kit + whale rig + format engine + a story file.
const { KH, createCanvas } = require('../host.cjs');
require('../whale-rig.js');
require('./whaleline.js');
const fs = require('fs'), path = require('path');
function load(storyPath) {
  const story = JSON.parse(fs.readFileSync(path.resolve(storyPath), 'utf8'));
  const FILM = globalThis.WHALELINE.makeFilm(story);
  function makeRenderer() {
    const out = createCanvas(FILM.W, FILM.H), oc = out.getContext('2d'), tmp = createCanvas(FILM.W, FILM.H), tc = tmp.getContext('2d');
    return (t) => { const [sub, sh] = FILM.shutter(t); FILM.drawFrame(oc, t);
      for (let k = 1; k < sub; k++) { FILM.drawFrame(tc, t + (k / sub) * (sh / FILM.fps)); oc.save(); oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalAlpha = 1 / (k + 1); oc.drawImage(tmp, 0, 0); oc.restore(); }
      return out; };
  }
  return { KH, FILM, story, makeRenderer, createCanvas };
}
module.exports = { load };
