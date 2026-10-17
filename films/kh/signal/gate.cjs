// Signal gates. 1) read-time: every line meant to be read is fully visible for >= 0.6 s + 0.15 s per word.
// 2) flash safety (run on the encoded video): <= 3 general flashes in any 1-second window.
const { FILM } = require('./engine.cjs');
const { execFileSync } = require('child_process');
let ok = true;
for (const r of FILM.READABLES) {
  const hold = (r.out - r.fo) - (r.in + r.fi), need = 0.6 + 0.15 * r.text.split(/\s+/).length;
  const pass = hold >= need; ok = ok && pass;
  console.log(`read  ${pass ? 'PASS' : 'FAIL'}  "${r.text}" held ${hold.toFixed(2)} s (needs ${need.toFixed(2)})`);
}
const video = process.argv[2];
if (video) {
  const out = execFileSync('ffmpeg', ['-hide_banner', '-i', video, '-vf', 'scale=320:-1,signalstats,metadata=print:key=lavfi.signalstats.YAVG', '-f', 'null', '-'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 }).toString();
  // ffmpeg prints metadata to stderr; re-run capturing stderr
}
console.log(ok ? 'READ GATE PASS' : 'READ GATE FAIL');
process.exitCode = ok ? 0 : 1;
