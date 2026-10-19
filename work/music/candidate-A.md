# Candidate A — "harmonic bed first" (`work/music/candidate-A.js`, 25.5 KB, `window.MUSIC_A`)

## Rationale
The v8 chord (AUDIT §B) is a static, unfiltered, unmixed 1.35 s drone that ignores the timeline. Candidate A puts a **continuous harmonic bed** first (sub bass + detuned-saw/triangle pad through a slow-LFO lowpass) that *moves* one or two chords per storyboard beat, so the picture never sits on silence, and the SFX vocabulary (WHOOSH/THUD/CLICK/BOOP/BOING + the G24 `CHORD` stab) **pops** because the bed ducks under each hit. A sparse seeded pluck motif adds editorial detail without percussion — warm, cinematic, editorial. Everything is a pure function of `(storyboard, palette, seed)`; the runtime is a Chris-Wilson lookahead scheduler (150 ms horizon, 30 ms tick) over a flat time-sorted event list, so `seek(t)` kills live nodes, resets the cursor and re-enters sustaining pad/bass events mid-flight with an 80 ms attack. `plan()` needs no `AudioContext`; `schedule()` returns `{live:false}` without one. `MA.computeWadaHarmonicChord` is untouched (G24 safe) and reused for the `CHORD` cue.

## Palette → mode (focal accent `h` hue in OKLCH; L/C averaged over a·h·b)
| Hue (°) | Mode |
|---|---|
| luminous: L > 0.80 & C < 0.09 | Lydian |
| 30–110 ochre/sienna | Mixolydian |
| 110–170 green | L > 0.7 ? Lydian : Dorian |
| 170–225 teal | Dorian |
| 225–290 deep-sea | L < 0.55 ? Aeolian : Dorian |
| 290–335 violet | L < 0.6 ? Aeolian : Lydian |
| 335–30 rose | L < 0.45 ? Aeolian : Ionian |

Root = the `computeWadaHarmonicChord` `C3..C4` table (`wadaIdx % 8`), so stab and bed share a tonic; diminished triads are lifted to minor.

## Feel → tempo
| feel | bpm | | feel | bpm |
|---|---|---|---|---|
| rest | 60 | | rostrum | 88 |
| slow | 64 | | saul | 92 |
| held | 72 | | spring | 104 |
| glaser | 84 | | beat | 120 (matches engine's 0.5 s grid) |

## Dynamics arc (per role; `dynamics.from→to`, density = pluck probability)
hook I→IV .55→.72 · threshold vi→IV .62→.66 · escalation ii→V .68→.82 (high) · turn vi→iii .74→.64 · filter IV→V .6→.7 · **breather I(add9) .30→.28, pad only, no bass/pluck** · **climax V7→I7 .9→1.0**, CHORD+THUD at onset · callback IV7→I7 .5→.42, tonic, BOOP. Dynamics drive pad level, cutoff (500 + 1300·dyn Hz), LFO depth, bass and pluck velocity.

## Duck law (exact)
On every SFX onset `t0`: `duck.gain` cancelScheduledValues(t0) → setValueAtTime(1, t0) → linearRamp to **0.501 (−6 dB) at t0+10 ms** → hold → setValueAtTime(0.501, **t0+250 ms**) → linearRamp back to 1.0 at t0+370 ms (120 ms release). A retrigger inside the window cancels the pending release and re-arms the hold. Chain: pad/bass/pluck → `music` (0.36 ≈ −14 LUFS) → `duck` → compressor (−18 dB, 3:1, 10/250 ms) ← `sfx` (0.8) → `master` (0.9) → destination; SFX bypass the duck.

## Self-test (node, 6-beat dummy; a mock-AudioContext run also exercised play/tick/seek/pause/loop: 123 nodes in 3 s, seek(9) clean, loop at 12 s)
```
node -e 'const M=require("./work/music/candidate-A.js");
const sb={id:"sb-test",feelKey:"beat",totalDurationSec:12,beats:[0,1,2,3,4,5].map(i=>({index:i,tStartSec:i*2,tEndSec:i*2+2,role:["hook","escalation","turn","breather","climax","callback"][i],cameraMove:i===4?"kick-shake":i===3?"breather-hold":"push-in"}))};
const pal={id:343,a:"#ebd3a2",h:"#ae5224",b:"#527e91"}; const p=M.plan(sb,pal,"ceti");
console.log(p.bpm,p.key.root,p.key.modeName,p.key.family); console.log(p.cues.map(c=>c.role+":"+c.chordProgression.map(x=>x.degree+x.quality).join(">")).join(" | "));
console.log(p.motif.length,p.sfx.map(s=>s.name+"@"+s.t).join(" "),JSON.stringify(p.duck));
console.log(JSON.stringify(p)===JSON.stringify(M.plan(sb,pal,"ceti")), JSON.stringify(M.schedule(null,p,0)));'
```
Output:
```
bpm 120 key C3 Mixolydian fam ochre hue 45
cues hook:1maj>4maj | escalation:2min>5min | turn:6min>3min | breather:1majadd9 | climax:5min7>1maj7 | callback:4maj7>1maj7
motif 22 (midi 72–89)   sfx WHOOSH@0 BOING@2 WHOOSH@4 CHORD@8 THUD@8.12 BOOP@10
bars 6  duck {"dB":-6,"attackMs":10,"holdMs":250,"releaseMs":120}  deterministic true  seedDiff true
modes: ochre Mixolydian | deep-sea Dorian | luminous Lydian | rest 60 bpm | spring 104
schedule(no ctx): {"live":false,"events":49,"note":"no AudioContext: planner-only"}  Math.random/Date.now count: 0
```

## Integration
`tick()` → `sync(_T, playing)`; scrub → `seek(T)`; state change → `schedule(null, plan(sheet, pal, sheet.id), T)` + `setPalette(pal)`. Optional per-beat `sfx: [[t,'NAME',gain]]` (the `e_sfx` cue shape) overrides role defaults.
