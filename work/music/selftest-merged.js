// Node self-test for the merged studio-music-engine.js (v9 soup). Run: node work/music/selftest-merged.js
'use strict';
const fs = require('fs');
const path = require('path');
const FILE = process.env.MUSIC_FILE || path.resolve(__dirname, '../../studio-music-engine.js');
const src = fs.readFileSync(FILE, 'utf8');
let fails = 0;
function check(name, ok, detail) { if (ok) console.log('PASS ' + name); else { fails++; console.log('FAIL ' + name + (detail ? ' :: ' + detail : '')); } }

// ---------- static text gates ----------
check('size <= 40 KB', Buffer.byteLength(src) <= 40 * 1024, Buffer.byteLength(src) + ' bytes');
check('no Math.random / Date.now', !/Math\.random|Date\.now/.test(src));
check('no requestAnimationFrame in schedule paths', !/requestAnimationFrame/.test(src));
check('declares VERSION 9.0.0', /VERSION = '9\.0\.0'/.test(src));

// ---------- load under Node with no window / AudioContext ----------
delete global.window; delete global.AudioContext; delete global.webkitAudioContext;
const M = require(FILE);
check('exposes globalThis.MUSIC + CommonJS export', globalThis.MUSIC === M);
['plan', 'scoreForBeat', 'schedule', 'seek', 'play', 'pause', 'duck', 'sfx', 'sync', 'dispose', 'keyFor', 'tempoFor', 'setPalette', 'setEnabled']
  .forEach(k => check('API.' + k + ' is a function', typeof M[k] === 'function'));
check('API.mix object and VERSION', M.mix && typeof M.mix === 'object' && M.VERSION === '9.0.0');

// ---------- canonical 8-beat storyboard sheet (studio-canvas-oauth shape) ----------
const roles = ['hook', 'threshold', 'escalation', 'turn', 'filter', 'breather', 'climax', 'callback'];
const hinges = ['THEREFORE', 'BUT', 'THEREFORE', 'BUT', 'THEREFORE', 'THEREFORE', 'BUT', 'THEREFORE'];
const cams = ['static-wide', 'pan-follow', 'push-in', 'dutch-tilt', 'tracking-drift', 'breather-hold', 'kick-shake', 'pull-back'];
function sheet(extra) {
  const total = (extra && extra.totalDurationSec) || 12;
  return Object.assign({
    id: 'sb-test', charId: 'saul-falcon', archetype: 'avian', feelKey: 'beat', palId: 343, totalDurationSec: total,
    beats: roles.map((r, i) => ({ index: i, id: 'beat-' + (i + 1), tStartSec: +(i * total / 8).toFixed(2), tEndSec: +((i + 1) * total / 8).toFixed(2),
      tMidSec: +((i + 0.5) * total / 8).toFixed(2), role: r, hinge: hinges[i], cameraMove: cams[i], activeSimultaneousMoves: i === 5 ? 1 : 2, characterPose: { rung: 1 } }))
  }, extra || {});
}
const pal = { id: 343, a: '#ebd3a2', h: '#ae5224', b: '#527e91' };

// ---------- plan determinism ----------
const p1 = M.plan(sheet(), pal, 'seed-42'), p2 = M.plan(sheet(), pal, 'seed-42'), p3 = M.plan(sheet(), pal, 'seed-43');
check('plan deterministic (same seed => deep-equal)', JSON.stringify(p1) === JSON.stringify(p2));
check('plan differs by seed', JSON.stringify(p1.motif) !== JSON.stringify(p3.motif));
check('plan has 8 cues', p1.cues.length === 8);
check('exactly one breather cue', p1.cues.filter(c => c.role === 'breather').length === 1);
check('plan.duck matches contract', JSON.stringify(p1.duck) === JSON.stringify({ dB: -6, attackMs: 10, holdMs: 250, releaseMs: 150 }));

// ---------- key / tempo ----------
check('beat feel => 120 bpm', p1.bpm === 120);
check('tonic from shared C3..C4 table (343 % 8 = 7 => C4)', p1.key.root === 'C4' && p1.key.rootMidi === 60);
check('OKLCH ochre palette => Mixolydian', p1.key.family === 'ochre' && p1.key.mode === 'mixolydian');
const deep = M.keyFor({ id: 341, a: '#1a2a4a', h: '#2b4a7a', b: '#0b1a2a' });
check('deep-sea palette => Aeolian/Dorian via OKLCH (no keyword heuristic)', deep.family === 'deep-sea' && /aeolian|dorian/.test(deep.mode));
['saul', 'held', 'rostrum'].forEach(f => {
  const T = M.tempoFor(f), fps = M.FPS_GRID[f];
  check('tempo ' + f + ' snaps to ' + fps + ' fps grid', T.fps === fps && Math.abs(T.beatSec * fps - Math.round(T.beatSec * fps)) < 1e-9, JSON.stringify(T));
});
check('tempo rest=60 slow=64 glaser=84 spring=104 (A table)', [60, 64, 84, 104].join() === ['rest', 'slow', 'glaser', 'spring'].map(f => M.tempoFor(f).bpm).join());

// ---------- 8 archetypes => 8 distinct motifs ----------
const archs = Object.keys(M.SIG);
check('8 archetype signatures present', archs.length === 8);
const motifs = new Set(archs.map(a => M.plan(sheet({ archetype: a }), pal, 'x').motif.rel.join()));
check('8 archetypes => 8 distinct motifs (same seed)', motifs.size === 8, [...motifs].join(' | '));

// ---------- plant / return bell phrase identical ----------
const hook = p1.cues[0], cb = p1.cues[7], br = p1.cues[5];
check('hook plants bell phrase (4 notes, mid-beat)', hook.bell.length === 4 && hook.bell[0].tag === 'plant' && Math.abs(hook.bell[0].t - (hook.tStart + (hook.tEnd - hook.tStart) / 2)) < 1e-6);
check('callback returns bell at beat start', cb.bell.length === 4 && cb.bell[0].tag === 'return' && cb.bell[0].t === cb.tStart);
check('plant/return bell MIDI identical', hook.bell.map(b => b.midi).join() === cb.bell.map(b => b.midi).join());
check('plant/return bell durations identical', hook.bell.map(b => b.dur).join() === cb.bell.map(b => b.dur).join());
check('callback.plantT < callback.returnT', p1.callback.plantT >= 0 && p1.callback.returnT > p1.callback.plantT);
check('breather: pad only (no pulse, no pluck, 3-note echo)', br.pulse.length === 0 && br.motif.length === 0 && br.bell.length === 3 && br.bell[0].tag === 'echo');
check('breather chord is I add9', br.chordProgression.length === 1 && br.chordProgression[0].degree === 1 && /add9/.test(br.chordProgression[0].quality));
check('climax V7 -> I7 at peak dynamics', p1.cues[6].chordProgression.map(c => c.degree).join() === '5,1' && p1.cues[6].dynamics.to === 1.0);
const land = cb.motif[cb.motif.length - 1];
check('landing ends on tonic pitch class', land && land.midi % 12 === p1.key.rootMidi % 12, land && land.name);

// ---------- SFX quantization + cue names ----------
const grid = p1.beatSec / 4;
check('all 6 SFX names present in plan', ['WHOOSH', 'THUD', 'CLICK', 'BOOP', 'BOING', 'CHORD'].every(n => p1.sfx.some(s => s.name === n)), p1.sfx.map(s => s.name).join());
check('SFX quantized to 16ths within 60 ms, otherwise untouched', p1.sfx.every(s => s.quantized ? Math.abs(s.t / grid - Math.round(s.t / grid)) < 1e-6 && Math.abs(s.t - s.tRaw) <= 0.06 + 1e-9 : s.t === s.tRaw));
const pq = M.plan(sheet({ sfxCues: [[0.62, 'WHOOSH', 0.3], [1.42, 'THUD', 0.45], [2.0, 'CLICK', 0.08]] }), pal, 'q');
const w = pq.sfx.find(s => s.tRaw === 0.62);
check('e_sfx cue 0.62 => 0.625 (16th at 120 bpm)', w && w.quantized && w.t === 0.625, JSON.stringify(w));
check('no SFX on breather beat', !p1.sfx.some(s => s.beat === 5));
check('CHORD stab on callback beat', p1.sfx.some(s => s.name === 'CHORD' && s.beat === 7));

// ---------- pluck density cap on 'beat' ----------
const plucks = p => p.cues.reduce((s, c) => s + c.motif.length, 0);
check('pluck density cap on beat: <= 12 notes / 12 s', plucks(p1) <= 12 * p1.totalSec / 12, plucks(p1) + ' notes in ' + p1.totalSec + 's');
const p24 = M.plan(sheet({ totalDurationSec: 24 }), pal, 'seed-42');
check('pluck cap scales with duration (24 s => <= 24)', plucks(p24) <= 24, plucks(p24));
const pg = M.plan(sheet({ feelKey: 'glaser' }), pal, 'seed-42');
check('cap not applied on glaser feel', pg.pluckCap.applied === false);
check('every event has t/end/type, sorted by t', p1.events.every((e, i) => typeof e.t === 'number' && e.end >= e.t && e.type && (i === 0 || p1.events[i - 1].t <= e.t)));

// ---------- planner-only schedule ----------
const dry = M.schedule(null, p1, 0);
check('schedule without AudioContext => {live:false}', dry.live === false && dry.events === p1.events.length, JSON.stringify(dry));

// ---------- mock AudioContext ----------
const log = [];
function P(name) { const p = { value: 0 }; ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'cancelScheduledValues'].forEach(k => { p[k] = (v, t) => { log.push([name, k, v, t]); return p; }; }); return p; }
let created = 0;
function node(extra) { created++; return Object.assign({ connect() { return this; }, disconnect() {}, start() {}, stop() {} }, extra); }
const ctx = { currentTime: 0, sampleRate: 8000, state: 'suspended', resume() { this.state = 'running'; }, destination: {},
  createGain: () => node({ gain: P('gain') }), createOscillator: () => node({ type: 'sine', frequency: P('freq'), detune: { value: 0 } }),
  createBiquadFilter: () => node({ type: 'lowpass', frequency: P('filt'), Q: { value: 1 } }),
  createDynamicsCompressor: () => node({ threshold: { value: 0 }, knee: { value: 0 }, ratio: { value: 1 }, attack: { value: 0 }, release: { value: 0 } }),
  createBufferSource: () => node({ buffer: null, loop: false }), createBuffer: (c, n, sr) => ({ getChannelData: () => new Float32Array(n) }) };
const live = M.schedule(ctx, p1, 0);
check('schedule with ctx => live', live.live === true && M.mix.master && M.mix.music && M.mix.duck && M.mix.sfx);
// duck gain node is the one wired as mix.duck; capture its param
const duckParam = M.mix.duck.gain;
let duckLog = [];
['setValueAtTime', 'linearRampToValueAtTime', 'cancelScheduledValues'].forEach(k => { duckParam[k] = (v, t) => { duckLog.push([k, v, t]); return duckParam; }; });
check('play() starts', M.play() === true && M.state.playing && ctx.state === 'running');
M._tick();
check('tick dispatched events (created audio nodes)', created > 20, String(created));

// duck envelope on an SFX
duckLog = [];
const r = M.sfx('THUD', 0.5, 0.5);
check('sfx() returns quantized cue', r && r.name === 'THUD' && r.quantized === true && r.t === 0.5, JSON.stringify(r));
const lo = Math.pow(10, -6 / 20);
const d = duckLog;
check('duck envelope: cancel -> 1 -> -6 dB @10 ms -> hold 250 ms -> 1 @ +150 ms',
  d.length === 5 && d[0][0] === 'cancelScheduledValues' && d[1][0] === 'setValueAtTime' && d[1][1] === 1 &&
  d[2][0] === 'linearRampToValueAtTime' && Math.abs(d[2][1] - lo) < 1e-9 && Math.abs((d[2][2] - d[1][2]) - 0.010) < 1e-9 &&
  d[3][0] === 'setValueAtTime' && Math.abs(d[3][1] - lo) < 1e-9 && Math.abs((d[3][2] - d[2][2]) - 0.250) < 1e-9 &&
  d[4][0] === 'linearRampToValueAtTime' && d[4][1] === 1 && Math.abs((d[4][2] - d[3][2]) - 0.150) < 1e-9, JSON.stringify(d));

// all 6 SFX cue names schedule
const before = created;
const okNames = ['WHOOSH', 'THUD', 'CLICK', 'BOOP', 'BOING', 'CHORD'].map(n => M.sfx(n, null, 0.5));
check('all 6 SFX cue names schedule live', okNames.every(x => x && x.name) && created > before, okNames.map(x => x && x.name).join());

// seek rebase without throw
let threw = null;
try { ctx.currentTime = 2.3; M.seek(5.0); ctx.currentTime = 2.4; M._tick(); M.seek(9.0); M._tick(); M.seek(0); } catch (e) { threw = e; }
check('seek(t) rebase without throw', !threw, threw && threw.stack);
check('seek(t) rebases position', Math.abs(M.seek(5.0) - 5.0) < 1e-9 && Math.abs(M.position() - 5.0) < 0.05, String(M.position()));
check('seek is idempotent', (M.seek(5.0), M.seek(5.0), Math.abs(M.position() - 5.0) < 0.05));
M.pause(); check('pause() stops', !M.state.playing);
M.sync(3.0, true); check('sync(t, true) resumes at t', M.state.playing && Math.abs(M.position() - 3.0) < 0.05);
M.sync(3.0, false); check('sync(t, false) pauses', !M.state.playing);
check('setEnabled(false) mutes play()', M.setEnabled(false) === false && M.play() === false && M.sfx('CLICK') === null);
M.setEnabled(true);
check('duck() live', M.duck(250) === true);
M.dispose(); check('dispose() clears mix', M.mix.master === null && !M.state.playing);

// ---------- negative mutation: Math.random patched to throw must not affect plan() ----------
const realRandom = Math.random; Math.random = () => { throw new Error('Math.random called in plan()'); };
let mutErr = null; try { M.plan(sheet(), pal, 'mut'); } catch (e) { mutErr = e; } finally { Math.random = realRandom; }
check('MUT: plan() never calls Math.random', !mutErr, mutErr && mutErr.message);

console.log(fails ? ('SELFTEST FAIL (' + fails + ')') : 'SELFTEST PASS');
process.exit(fails ? 1 : 0);
