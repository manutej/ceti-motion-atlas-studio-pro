# v9-mcp-server — v9.2 deliverables

- `poster.png` — landing frame (t = 13.00 s)
- `contact-sheet.png` — one still per payoff (2 s, 5.5 s, 8.5 s, 12 s)
- `loop-check.json` — seek(0) vs seek(end): wrap 0 (≤ 0.01: true), landing 0.0016
- `compare.html` — v9.1 vs v9.2 wipe (template pattern: motion-broll/templates/compare.html, MIT)

Regenerate: `npm run deliver` (needs Playwright; see scripts/deliver.mjs).

<!-- motion-deliver:start -->
## final-preview.mp4 — preview: critique not yet 8+

- **preview: critique not yet 8+.** FS-critique for round 3: no critique row for round 3. This file is a preview, not the film-spec §9 final MP4; no `render` stage row was written. Re-run motion-critique until every score is 8+, then re-render without `--allow-preview`.
- 1040×650 H.264 yuv420p + AAC audio, 30 fps, 420 frames, 14.000 s, 2.33 MB, +faststart.
- Every frame seeked (frame n = f(n/30)), never played in real time; audio is the host's own score + SFX rendered offline.
- Frame check vs stills.mjs: t=1 s 0.00312, t=7 s 0.00323, t=13 s 0.0035 (limit 0.02); see `render-check/`.
- Loop: seamDelta 0, MP4 last-vs-first 0.0056, audio jump 0.0222 / head gap 32 ms / step 1.7 dB → pass.

Regenerate: `node skills/motion-deliver/scripts/render.mjs --config skills/motion-deliver/configs/motion-atlas.json --param board=v9-mcp-server --allow-preview`
<!-- motion-deliver:end -->

## Status of the MP4 (round 3)

`final-preview.mp4` is a **preview: critique not yet 8+**. The round-3 blind critic predicted a minimum stills score of 5,
and the ledger has no observed `critique` row yet, so FS-critique keeps the render gate closed: there is no `final.mp4`
and no `render` stage row. `deliverables-check.mjs` passes this dir only with `--allow-preview` and refuses it without.
