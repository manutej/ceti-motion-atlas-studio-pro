# FIX-NOTES v9.3.0 — round 3 integration (SCENE + MIX)

Accepted lane modules wired into the host, one step per commit, `npm test` green after each.
Tests: **38/38 gates + 19/19 mutations → 40/40 gates + 22/22 mutations.**

## What changed
1. `studio-scene.js` = `work/vector3/soup.js` verbatim (SCENE 3.0.0-soup); `studio-mix-design.js` = `work/music3/soup.js` verbatim (MIX mix-soup/3.0.0). Loaded after `studio-two-renderer.js` / `studio-music-engine.js` in `index.html` and `Motion Atlas Studio Pro.dc.html`; inlined by `build-package.mjs` (Standalone + dist copy list); same order in the validator's `filesToLoad`.
2. SCENE hook in `MA.render` (studio-motion-engine.js, ~L2758): when the Vector layer toggle is on, TWO_LAYER is available and `beat.show` exists, `SCENE.fromBeat(beat, null, seed)` drives both vector passes through `SCENE.render` (beat diagram, one focus, counter). **Critic fix:** the host actor pass (`pr.draw`) still runs on every beat between SCENE back and SCENE front (identity lock), so the character is never dropped; SCENE draws the props around it. The contract's `buildV9Board` storyKey change was not made (the actor pass needs the story clock).
3. MIX hook (`studio-ui.js` `musicMixDesign()`, after `MUSIC.schedule` in `musicReplan` and after `MUSIC.seek`): `MIX.apply(MUSIC.mix._ctx, MUSIC.mix, MIX.design(plan, null, 7), plan)`, guarded and idempotent; one limiter comp→limiter→master; `MUSIC.DUCK` untouched. The audio probe (`work/eval-v9/audio-probe/audio.mjs`) mirrors the hook.
4. Gates: **G38** "Show = Drawn" (both boards, 15 beats: coverage 0 unmatched, every primitive's `from` in `show`, ≤ 1 mask, hotspot in frame, textBox kept, the host front pass carries the beat's own scene 15/15, **≥ 1 actor op per beat**, min measured 276). **G39** "Mix Design Present" (32 plans: deterministic design, duck law equal to `MUSIC.DUCK`, one limiter on a mock graph, cue gains in (0, 1], predict LUFS within −16 ± 1.5, breather ≥ −30, TP < −1.5; the measured v9.3 report in the same bands; host hook present). **MUT-20** (SCENE drops a merged noun mark → G38 fails), **MUT-21** (MIX duck −5 dB → G39 fails), **MUT-22** (engine skips the actor pass when a SCENE is drawn → G38 fails). HUD lists G38/G39 with plain names. G36 now reads `v9.3-audio-report.json` when present.
5. `WAIVERS.json`: lufs and breather removed; `sfx_over_bed` kept with floor **+3.6** (validator honours `floor`) and the round-4 look-ahead-duck note.

## Audio (MCP board, 30 s offline render, same probe)
| metric | v9.2 | v9.3 | gate |
|---|---|---|---|
| LUFS (proxy) | −18.45 | **−17.01** | PASS (was waived) |
| true peak | −2.08 dBTP | **−2.33 dBTP** | PASS |
| SFX over bed, min | −3.1 dB | **+3.6 dB** | waived, floor +3.6 |
| breather floor | −31.3 dBFS | **−28.2 dBFS** | PASS (was waived) |
| seam min | −16.8 dBFS | −15.2 dBFS | PASS |
| SFX min gap / holes | 350 ms / 0 | 350 ms / 0 | PASS |
Score: `work/eval-v9/v9.3-score.ogg` (30 s, 260 KB, gitignored).

## Screenshots (MCP board, rendered at 3200×2000 = 1600×1000 @2x, saved downscaled to 1600 px)
`work/eval-v9/after-r3-hook.png` (robot pill → arrow → "locked drawer"), `after-r3-proof.png` (adapter → read / search / write pills), `after-r3-breather.png` ("robot · adapter" + "drawer", no arrows), `after-r3-landing.png` (robot/drawer under the end card), `after-r3-sheet.png`. Each frame: the drawn primitives match `show`, the whale is on screen, one caption, one dashed spotlight ring.

## Open items for round 4 (logged, not fixed)
- Critic: mcp#3 / mcp#5 have up to 6 labelled word boxes (the scene is written, not drawn).
- Critic: pf#3 says "two bars" but draws one counter.
- Critic: `sfx_over_bed` is +3.6 dB, still waived (round-4 look-ahead duck predicted 7.0–9.6 dB).
- Critic: on mcp the breather ties the final beat at 2 primitives, so it is not uniquely the emptiest frame.
- Integrator (seen in the screenshots): the actor pass also draws the legacy `s_retrieve` set (the "Q · what changed in v2?" card, the doc grid, "3 SOURCES" / "A ·" box on the breather). That set is borrowed from another story and crowds the breather; round 4 should split the character from the story set.
