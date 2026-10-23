# Round 3 — lens seeds + HOST_READS (lanes `music` → MIX, `vector` → SCENE)

Ledger check (SKILL.md §Lens seeds vs ledger): each seed below varies ONE dimension that no ratified E2/E3 atom fixes. Atoms grepped: `work/music/MERGE-NOTES.md` §Contradictions (duck −6/10/250/150; OKLCH mode; tempo→fps grid; pluck cap; voice-leading), G30 preds 13–14 (kit → `mix.sfx`, never `mix.duck`; synth under kit at −9 dB), G36 (SFX ≥ 120 ms; kit map), `work/two/MERGE-NOTES.md` §Contradictions (rebuild-from-t; two passes; one clock per beat = word landing; spotlight dim governs type; `measureText`; seed composition; palette lock; one spotlight), D3 (one caption per card, `say` landed by 35 %), `work/transitions/proposed-atoms.json` (E1 only: direction encodes relation, breather → cut, uniform split timing, no easing in feels), `docs/rsi/META-COMPOUND-LOOP.md` (merge law; E2/E3 digest rule; retain-old).
Dead lenses, do not reuse: music "deeper/faster duck" (atom: duck law frozen, G36), "kit through the duck" (G30 pred 13), "silence first" (one breather with no pulse is fixed; the breather floor is now a numeric target); vector "type only" (D3 fixed one caption), "cuts only"/"transition masks" (E1 direction-encodes-relation + transitions lane), "character-led scenes" (contract: character hidden unless `beat.character`), "parallax atmosphere" (back-pass modules are fixed and not this lane's).

## music (MIX) — dimension · direction
- A **headroom lives in the limiter** — buses stay at BASE; all loudness comes from `masterGain` + a hard limiter (`threshold ≤ −3`, ratio ≥ 20); per-cue gains only lift the two cues under +6 dB. Dimension: where the gain lives (end of chain). 
- B **bed-to-SFX ratio** — `busGains.music` down, `busGains.sfx` up, master nearly flat, limiter light (ratio 12, threshold −3); LUFS recovered by `breatherFloorGain` + pad share. Dimension: which bus moves (contrast, not level).
- C **per-cue sculpting from the measurement** — every `perCueGain` (and `kit.*`) is solved cue-by-cue from `BASE.cues[].over_bed_dB` so each cue lands at exactly +6.5 dB; buses and master move last and least. Dimension: gain granularity (per cue, not per bus).

## vector (SCENE) — dimension · direction
- A **labelled props** — every `terms(show)` noun becomes its own labelled `card`/`pill` (the frame is a captioned diagram of nouns); arrows only where `show` has a motion verb. Dimension: label density → maximal.
- B **the verb is the hero** — one `arrow`/`path`/`counter` carries the "one visual change"; nouns are unlabelled pills at its ends, the hotspot rides the arrow head. Dimension: which primitive carries the change → the edge, not the node.
- C **noun continuity across beats** — a per-board noun → `box` map (`drawer` always at the same box; `adapter` appears between robot and drawer and stays there; the callback's six drawers fan from the hook's box) so cuts feel like one set. Dimension: cross-beat spatial continuity → fixed positions (rebuild-from-t unchanged; positions are data, not retained objects).

## HOST_READS (whole-file reads allowed; everything else grep-only)
music: `studio-music-engine.js:118-135` · `studio-music-engine.js:340-362` · `studio-music-engine.js:458-472` · `scripts/validate-motion-studio.mjs:383-418` · `work/wording/storyboard-grammar.md:16-42`
vector: `studio-two-renderer.js:67-107` · `studio-two-renderer.js:184-262` · `studio-two-renderer.js:343-412` · `work/two/selftest-merged.js:1-28` · `work/wording/storyboard-grammar.md:16-52`
Shared data (loaded, not read): `work/tokens.resolved.json`, `work/eval-v9/audio-probe/{WAIVERS.json,v9.2-audio-report.json}`, the boards via `STUDIO_CANVAS_OAUTH.buildStoryboardSheet` (`studio-canvas-oauth.js` is grep-only: beats at L84-516).
