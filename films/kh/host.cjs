// Node host for Kinetic Hydrography canvas work: fonts, Path2D, canvas factory, kit.
const { createCanvas, GlobalFonts, Path2D } = require('@napi-rs/canvas');
const path = require('path');
const F = p => path.join(__dirname, '..', 'fonts', p);
GlobalFonts.registerFromPath(F('Fraunces-LightItalic-static.ttf'), 'FrauncesL');
GlobalFonts.registerFromPath(F('SpaceMono-Regular.ttf'), 'SpaceMono');
GlobalFonts.registerFromPath(F('SpaceMono-Bold.ttf'), 'SpaceMonoB');
GlobalFonts.registerFromPath(F('DMSans-static.ttf'), 'DMSansS');
globalThis.Path2D = Path2D;
globalThis.makeCanvas = (w, h) => createCanvas(w, h);
require('./kh-kit.js');
module.exports = { KH: globalThis.KH, createCanvas };
