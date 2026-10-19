// Node self-test for MUSIC_B: pure planner + mock AudioContext scheduler
const fs = require('fs');
const path = '/home/claude/ceti-motion-atlas-studio-pro/work/music/candidate-B.js';
const src = fs.readFileSync(path, 'utf8');
const sizeKB = Buffer.byteLength(src) / 1024;
if (/Math\.random|Date\.now/.test(src)) throw new Error('nondeterministic call found');
delete global.window; delete global.AudioContext;
new Function(src)();
const M = globalThis.MUSIC_B;
if (!M) throw new Error('MUSIC_B not exposed');
['plan','scoreForBeat','schedule','seek','play','pause','duck','sfx','dispose'].forEach(k => { if (typeof M[k] !== 'function') throw new Error('missing ' + k); });
if (!('mix' in M)) throw new Error('missing mix');

// 6-beat dummy storyboard with plant (hook) / return (callback)
const roles = ['hook','escalation','turn','breather','climax','callback'];
const cams = ['static-wide','push-in','dutch-tilt','breather-hold','kick-shake','pull-back'];
const hinges = ['THEREFORE','BUT','THEREFORE','THEREFORE','BUT','THEREFORE'];
const sb = { id: 'sb-test', charId: 'saul-falcon', archetype: 'avian', feelKey: 'beat', totalDurationSec: 12,
  beats: roles.map((r, i) => ({ index: i, id: 'beat-' + (i + 1), tStartSec: i * 2, tEndSec: i * 2 + 2, tMidSec: i * 2 + 1, role: r, hinge: hinges[i], cameraMove: cams[i], activeSimultaneousMoves: r === 'breather' ? 1 : 2, characterPose: { rung: 1 } })),
  sfxCues: [[0.62,'WHOOSH',0.3],[1.42,'THUD',0.45],[2.0,'CLICK',0.08]] };
const pal = { id: 296, name: 'Test warm', a: '#ebd3a2', h: '#ae5224', b: '#635a3a', ink: '#064f6e', mood: 'Burnt sienna, warm.' };

const p1 = M.plan(sb, pal, 'seed-42');
const p2 = M.plan(sb, pal, 'seed-42');
const p3 = M.plan(sb, pal, 'seed-43');
if (JSON.stringify(p1) !== JSON.stringify(p2)) throw new Error('not deterministic');
if (JSON.stringify(p1.motif) === JSON.stringify(p3.motif)) throw new Error('seed has no effect');
if (p1.motif.rel.length < 4 || p1.motif.rel.length > 8) throw new Error('motif size ' + p1.motif.rel.length);
if (p1.cues.length !== 6) throw new Error('cues');
const br = p1.cues.find(c => c.role === 'breather');
if (br.pulse.length !== 0 || br.motif.length !== 0 || br.bell.length === 0) throw new Error('breather must be pad+bell only');
if (!(p1.callback.plantT >= 0 && p1.callback.returnT > p1.callback.plantT)) throw new Error('callback plant/return missing');
const plant = p1.cues[0].bell.map(b => b.midi).join(','), ret = p1.cues[5].bell.map(b => b.midi).join(',');
if (plant !== ret) throw new Error('callback bell phrase differs: ' + plant + ' vs ' + ret);
const land = p1.cues[5];
if (land.transform !== 'augment' || land.tail !== 1.5) throw new Error('landing');
const lastNote = land.motif[land.motif.length - 1];
if (lastNote.midi % 12 !== p1.key.rootMidi % 12) throw new Error('landing does not resolve to tonic: ' + lastNote.name);
const q = p1.sfx.filter(s => s.quantized).length;
const grid = 15 / p1.bpm;
p1.sfx.forEach(s => { if (s.quantized && Math.abs(s.t / grid - Math.round(s.t / grid)) > 1e-6) throw new Error('bad quantize'); if (!s.quantized && Math.abs(s.tRaw - s.t) > 1e-9) throw new Error('unquantized moved'); });
if (!p1.sfx.some(s => s.name === 'CHORD')) throw new Error('CHORD cue missing');
// temperature table coverage
const temps = [M.temperatureOf(pal), M.temperatureOf({ a: '#b5decc', h: '#96d1aa', b: '#5c7c77', mood: 'Two cool greens on slate. Calm, clinical.' }), M.temperatureOf({ a: '#f7f1e3', h: '#f0e6c8', b: '#ead9a8', mood: 'Pale ivory, luminous.' })];
if (temps.join() !== 'warm,cool,luminous') throw new Error('temperature ' + temps.join());
// all 8 archetypes produce distinct motifs on same seed
const archs = Object.keys(M.SIG);
const sigs = new Set(archs.map(a => M.plan(Object.assign({}, sb, { archetype: a }), pal, 'x').motif.rel.join()));
if (sigs.size !== 8) throw new Error('archetype motifs collide');

// mock AudioContext
let created = 0, started = 0;
function P() { const p = { v: 0 }; ['setValueAtTime','linearRampToValueAtTime','exponentialRampToValueAtTime','cancelScheduledValues'].forEach(k => p[k] = () => p); return p; }
function node(extra) { created++; const n = Object.assign({ connect() { return this; }, disconnect() {}, start() { started++; }, stop() {} }, extra); return n; }
const ctx = { currentTime: 0, sampleRate: 8000, state: 'suspended', resume() { this.state = 'running'; }, destination: {},
  createGain: () => node({ gain: P() }), createOscillator: () => node({ type: 'sine', frequency: P() }), createBiquadFilter: () => node({ type: 'lowpass', frequency: P(), Q: P() }),
  createDynamicsCompressor: () => node({ threshold: P(), ratio: P(), attack: P(), release: P() }),
  createBufferSource: () => node({ buffer: null }), createBuffer: (c, n, sr) => ({ getChannelData: () => new Float32Array(n) }) };
const h = M.schedule(ctx, p1, 0);
if (!M.mix || !M.mix.master || !M.mix.music || !M.mix.sfx || !M.mix.duck) throw new Error('mix buses');
if (ctx.state !== 'running') throw new Error('resume not called');
const s0 = started;
ctx.currentTime = 2.3; M.seek(5.0); // cancel + reschedule
if (M.state.t < 4.9 || M.state.t > 5.1) throw new Error('seek position ' + M.state.t);
M.pause(); if (M.state.playing) throw new Error('pause');
M.play(); if (!M.state.playing) throw new Error('play');
const r = M.sfx('whoosh', 5.01); if (!r.quantized) throw new Error('sfx quantize ' + JSON.stringify(r));
M.duck(200);
M.dispose(); if (M.mix !== null) throw new Error('dispose');

console.log(JSON.stringify({ sizeKB: +sizeKB.toFixed(1), bpm: p1.bpm, key: p1.key.rootName + ' ' + p1.mode, temperature: p1.temperature, archetype: p1.archetype, signature: p1.signature, loop: p1.loop,
  motif: p1.motif.names, motifRel: p1.motif.rel, cuesRoles: p1.cues.map(c => c.role + ':' + c.transform + '/' + c.chord.name + '/' + c.motif.length + 'n'), events: p1.events.length,
  sfx: p1.sfx.map(s => s.name + '@' + s.t + (s.quantized ? 'q' : '')), callback: p1.callback, landingLast: lastNote.name, endSec: p1.endSec, audioNodes: created, started: s0 }, null, 1));
console.log('SELFTEST PASS');
