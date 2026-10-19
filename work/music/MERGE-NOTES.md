# MERGE NOTES — music soup → `studio-music-engine.js` (MUSIC 9.0.0)

39,997 B readable IIFE, `window.MUSIC` + CommonJS. Selftest: 70 PASS, exit 0. `npm test`: 29/29 + 10/10.

## From A (harmonic bed)
OKLCH → mode table; tonic from the `computeWadaHarmonicChord` C3..C4 table (`wadaIdx % 8`). Feel→bpm table. Role arc: per-role progression (I→IV … V7→I7 … IV7→I7), `dyn from→to` driving pad level, cutoff, LFO, bass and pluck velocity; breather = I add9 pad only. Detuned-saw pad, sub bass, five synthesized SFX, CHORD stab via `MA.computeWadaHarmonicChord`. Chain music→duck→comp←sfx. Lookahead scheduler over a flat event list; `seek(t)` re-enters sustaining pad/bass (80 ms attack); `schedule(null,…)` → `{live:false}`.

## From B (leitmotif + pulse)
8 archetype signatures → seeded 4–8 note motif; per-role transforms (state·transpose·invert·fragment·rest·octave·augment), landing on the tonic. FM bell phrase: plant mid-hook, 3-note echo in breather, identical return at callback start. Karplus-Strong pluck. Kick/hat pulse per role, off in breather. Grammar → SFX (BUT→BOOP, THEREFORE→CLICK, push/pull→WHOOSH, dutch-tilt→BOING, kick-shake→THUD); 16th quantization within 60 ms (`tRaw` kept); least-motion voice leading; gesture resume.

## Intersection
Lookahead scheduler, seeded PRNG only, gesture resume, duck under every SFX, CHORD preserved, Node-safe planner.

## Contradictions → resolution
| Topic | A | B | Resolution |
|---|---|---|---|
| Duck | −6 dB 10/250/120 | −5 dB 200/len/400 | **−6 dB, 10 ms, 250 ms hold, 150 ms release** |
| Mode | OKLCH | HSL + keywords | **A's OKLCH**, keywords dropped |
| Tempo | feel table | beat/saul 120… | **A's table snapped to fps grids** saul 8 / held 12 / rostrum 10 (→ 96 / 72 / 85.7 bpm) |
| Pluck density | unbounded | motif-driven | **≤ 12 notes / 12 s on `beat`** (`pluckCap.applied`) |
| Voicing | root position | voice-led | A's degrees, B's least-motion voicing |

## Dominance
- Harmony: A's modal progressions **and** B's voice leading (A was parallel root-position; B a fixed loop).
- Memorability: B's leitmotif + plant/return bell riding A's dynamics arc (A's contour was anonymous).
- SFX pop: contract duck (deeper, faster than B's), B's quantization, A's transients.
- Determinism: both pure; soup adds the Math.random-throws proof and `tRaw` audit trail.
- Seekability: A's mid-flight pad/bass re-entry (B restarted only the last pad) + B's idempotent rebase.

## G30 predicates (integrator)
Text: (1) ≤ 40 KB, `node --check`, zero `Math.random|Date.now|requestAnimationFrame`; (2) `MUSIC` exposes the 15 contract members + `VERSION:'9.0.0'`.
Node run: (3) `plan` deep-equal on same seed, differs by seed; (4) exactly one breather cue, 0 pulse/0 motif; (5) 8 archetypes ⇒ 8 distinct `motif.rel`; (6) hook bell MIDI === callback bell MIDI, `returnT > plantT`; (7) `quantized ⇒ |t−tRaw| ≤ 0.06 ∧ t on 16th grid`, else `t === tRaw`; (8) `plan.duck` = `{−6,10,250,150}` and mock duck-param log = cancel→1→0.501@+10ms→hold 250→1@+150; (9) `beat` ⇒ Σ motif ≤ totalSec; (10) `tempoFor(saul|held|rostrum)`: beatSec·fps integer; (11) `schedule(null,p,0).live === false`, `seek(5)` on mock ctx never throws; (12) `key.rootMidi === [48,50,52,53,55,57,59,60][wadaIdx % 8]`.
**MUT-11**: `sed 's/dB: -6/dB: -5/'` ⇒ (8) fails (verified; also cap feels `[]` ⇒ (9), return bell `t0+0.3` ⇒ (6)).

Open risks: no browser listen yet (LUFS unmeasured); saul/held bpm intentionally differ from AUDIT's "saul=92".
