# FIX-NOTES v9.1 — fix round after the blind critic (EVAL-v9.md)

Branch `v9-fable-soup`. Every step kept `npm test` green; the gate count grew from 33/33 + 14/14 to 34/34 + 15/15 (new G34 + MUT-15).

| Defect | Fix | Evidence |
|---|---|---|
| D1 Standalone does not boot | `'</script>'` → `'<\/script>'` (and `'<script>'` → `'\x3Cscript>'`) in `studio-canvas-oauth.js`; `build-package.mjs` throws if any inlined module contains `</script` or opens ≠ closes; **G34 Standalone boots** cuts blocks the way the HTML parser does, runs them in a fresh copy of the mock sandbox, and asserts MA, STUDIO_CANVAS_OAUTH, MUSIC, TWO_LAYER, GEOME_WADA_LIST; **MUT-15** injects a `</script>` string and G34 rejects it | Standalone: 7 `<script` = 7 `</script`; Chromium: app mounts, 0 page errors, no source shown as text (`work/eval-v9/check-transport.mjs`) |
| D2 transport off-screen | `.st-control-strip` wraps (`flex-wrap: wrap`, no horizontal scroll); the transport group wraps internally | PLAY, ♪ Music, ✦ Vector layer and NO-TEXT are inside the viewport at 1366, 1600 and 1920 px (`check-transport.mjs`, `after-D2-strip-1600.png`) |
| D3 caption overprint | the engine skips `beatLabel` (and the s_retrieve top caption) when the vector layer types a `say`; `say` is set in sentence case, body face, 14 px at 1× (index.html body size), on a paper plate, wrapped, and fully landed by 35% of the beat | `after-D3-proof.png`, `after-D3-breather.png`, `after-D3-mcp-sheet.png`: one caption per card, whole sentence at tMid |
| D5 pumping pad | pad is legato: 150 ms attack, release tail = max(0.6 s, chord length) capped at 1.2 s that starts at the chord end and overlaps the next chord | holes 13 → 1 (below) |
| D6 breather dropout | pad bus 0.5 → 3.0 with a dynamics floor of 0.9 on the pad envelope; the echo bell stays soft | breather floor −91.2 → −29.5 dBFS |
| D7 loop hard cut | a seek that wraps the loop seam keeps the live voices (`rescheduleFrom(t, soft)`), so the resolve chord rings under the restart | seam minimum −180 → −16.8 dBFS |
| D8 quiet bed | `mix.music` 0.36 → 0.72; duck law unchanged (−6 dB, 10·250·150 ms, G30 8/12 still exact) | −25.7 → −18.3 LUFS integrated |
| D9 bell inaudible | plant/return bell peak 0.4 → 1.8 (echo stays 0.4) | Δ plant +2.3 → +5.6 dB, Δ return 0.0 → +4.4 dB |
| Wording | the 5 rewrites from EVAL-v9.md (see commit "v9 fix: wording") | G32/G33 green |

## Audio: before / after (critic's offline-render probe, `work/eval-v9/audio-probe/`)

The critic's scripts were copied from its scratchpad into `work/eval-v9/audio-probe/` (only the output path, tag, page URL and Playwright location are parameterised; `analyze.py` gained a `v91` block). Both columns come from the same probe on the MCP board, 30 s, 44.1 kHz mono. Full reports: `audio-probe/v9.0-audio-report.json`, `audio-probe/v9.1-audio-report.json`.

| Metric | v9.0 | v9.1 | Target |
|---|---|---|---|
| Overall RMS (full mix) | −24.2 dBFS | −17.4 dBFS | ≈ −18 |
| Music-only RMS | −24.6 dBFS | −17.2 dBFS | — |
| Integrated loudness (ffmpeg ebur128) | −25.7 LUFS | −18.3 LUFS | toward −16 |
| Holes < −38 dBFS ≥ 100 ms, loop 1 | 13 | 1 (0.00–0.13 s: the first attack from silence at render start, not a gap between chords) | 0 within sections |
| Breather floor (min 100 ms RMS, 8–10 s) | −91.2 dBFS | −29.5 dBFS | ≥ −30 |
| Breather section RMS | −33.5 dBFS | −25.1 dBFS | — |
| Loop seam minimum (13.75–14.25 s) | −180 dBFS | −16.8 dBFS | no cut |
| Mean dip at SFX cues (probe method: pre-cue vs min in 0.6 s) | 21.1 dB | 11.2 dB | duck law −6 dB (unchanged in plan + G30); the probe's dip includes the old pad holes |
| Bell Δ at plant (1.0 s) | +2.3 dB | +5.6 dB | ≥ +4 |
| Bell Δ at return (12.0 s) | 0.0 dB | +4.4 dB | ≥ +4 |
| Peak (full) | −11 dBFS | −2.1 dBFS | < 0 |

Listen: `work/eval-v9/v9.1-score.ogg` (30 s, 231 KB). The v9.0 render is `work/eval-v9/v9-score-30s.ogg`.

## Open for round 3: D4 — `show` ≠ drawn

Not attempted in this round. The MCP board still borrows the `s_retrieve` whale/index-card scene and the planning board borrows `s_filter`, so no beat draws its own `show` (no drawer, adapter or plug), the breather is still the busiest frame, and the 12 s legacy storyline drifts against the 14/16 s boards. D3 removed the borrowed captions that contradicted the `say`, but the pictures still tell the retrieval story. Round 3 should either draw minimal two.js scenes per `show` (drawer, adapter and cards are three primitives) or rewrite `show` to describe what the whale scene actually does. D10's one-line fixes (grammar count, camera clip of "Q · what changed in v2?", pill labels in NO-TEXT mode) are also still open.
