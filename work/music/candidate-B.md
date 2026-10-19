# Candidate B — "Motif & pulse first" (`work/music/candidate-B.js`, 21.8 KB, `window.MUSIC_B`)

## Rationale
v8's chord is a drone because nothing in it is *about* the story. Candidate B is a **leitmotif system**: one 4–8 note motif per storyboard (seed + archetype), developed per beat role over a voice‑led 4‑chord loop picked by palette temperature. A quiet kick/hat pulse shares the deterministic clock, so SFX quantize onto the same 16th grid. Physical timbres (Karplus‑Strong string, FM bell, filtered pad) make synthesized SFX pop.

`plan()` is pure (runs in Node). Runtime: 300 ms lookahead on `AudioContext.currentTime`; `seek(t)` stops all nodes, rebases the origin, re‑arms from the first event ≥ t and re‑fires the active pad chord. Randomness only via `prng(seed)` (Mulberry32/FNV‑1a). Gesture resume on pointer/key/touch.

## Archetype → interval signature (semitones; rhythm cell in beats)
| archetype | intervals | cell |
|---|---|---|
| cetacean | +7 +5 −2 +12 −7 | 2 2 1 3 |
| avian | +4 +3 +5 +2 −12 | 1 1 1 2 |
| submersible | −2 −3 +2 −5 0 | 2 2 4 2 |
| geometric | +5 +5 −10 +5 +2 | 1 1 2 2 |
| instrument | +2 +2 +3 −2 +2 | 1 1 1 1 |
| calligraphic | +1 +2 −1 −2 +3 | 1 ½ ½ 2 |
| mythic | +6 +1 +4 −11 +7 | 3 1 2 2 |
| botanical | +3 +2 +2 +3 −10 | 1 2 1 2 |

Motif: `4 + prng·5` notes, steps from the signature, clamped ±14, snapped to scale. Root = `ROOTS[wadaIdx % 8]` (table shared with `computeWadaHarmonicChord`). Tempo by feel: beat/saul 120, spring 112, glaser 104, rest 96, held 90, rostrum 75, slow 60.

## Palette temperature → chord loop
`temperatureOf(pal)`: hue of `a/h/b` weighted by saturation plus mood keywords; mean lightness > 0.66 ⇒ luminous.
| temperature | mode | loop |
|---|---|---|
| warm | major | I – V – vi – IV |
| cool | natural minor | i – VI – III – VII |
| luminous | lydian | I – II – IV – I |

Closed triads, least‑motion voice leading; callback returns to I.

## Transformation per beat role
| role | motif | pulse | reg. | bell |
|---|---|---|---|---|
| hook | stated | kick on 2s + hats | — | **plant** (4‑note phrase, mid‑beat) |
| threshold | transposed to chord | basic | — | — |
| escalation | inverted | drive | — | — |
| turn | inverted | basic | −12 | — |
| filter | first half, ×½ | sparse | +12 | — |
| breather | rest | **off** | — | 3‑note echo |
| climax | +12, 16th hats, kick every beat | drive | +12 | — |
| callback | augmentation ×2 + tonic, tail 1.5 s | half‑beat then off | — | **return** (same phrase, beat start) |

Phrases rescale by powers of 2 to fit the beat; the landing ends on the tonic.

## SFX and duck law
Cues from storyboard grammar (BUT→BOOP, THEREFORE→CLICK, push‑in/pull‑back→WHOOSH, kick‑shake/climax→THUD, dutch‑tilt→BOING, callback→`CHORD` = `MA.computeWadaHarmonicChord` voices as a stab) plus `sheet.sfxCues`; quantized to the nearest 16th when within 60 ms. **Duck:** each SFX ramps `mix.duck.gain` 1 → −5 dB over 200 ms, holds for the SFX length, back over 400 ms (`cancelScheduledValues` first). Graph: pad→LP 900 Hz→music; pulse/pluck/bell→music→duck→master→compressor→destination; sfx→master.

## Node self‑test (PASS)
`node selftest-B.js` (beside this file) loads the script with no `window`/`AudioContext`, checks API shape and zero unseeded randomness, plans a 6‑beat storyboard (hook/escalation/turn/breather/climax/callback, avian, feel `beat`, warm palette, three e_sfx cues), then drives a mock AudioContext through schedule/seek/pause/play/sfx/duck/dispose.

Output: 120 BPM, C3 major, warm, I–V–vi–IV; motif C4 D4 G4 B4 B3 C4; cues `hook:state/I, escalation:invert/V, turn:invert/vi, breather:rest (0 notes, no pulse), climax:octave/I, callback:augment/I`; 98 events; 13 SFX all quantized (WHOOSH 0.62→0.625); plant @1.0 s and return @10.0 s with identical bell MIDI [72,74,79,83]; landing ends on C4; endSec 13.5; deterministic across runs, differs by seed, 8 archetypes → 8 distinct motifs; seek(5.0) rebased to t≈5.0; `sfx('whoosh',5.01)` quantized.
