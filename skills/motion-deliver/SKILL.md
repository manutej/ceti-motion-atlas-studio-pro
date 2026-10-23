---
name: motion-deliver
description: Deliverables for animated explainers and motion graphics (film spec item 9) — render the video as a deterministic MP4 (every frame seeked, never played in real time; the host's own score + SFX rendered offline; H.264 yuv420p + AAC, +faststart), verify it with ffprobe and against stills at the same t, run the loop check (last frame vs first, seek wrap, audio seam), and gate the result on FS-deliverables and FS-critique. Use when the user says "render the video", "export mp4", "make the final cut", "final cut", "deliverables", "poster frame", "contact sheet", "loop check", "is it ready to ship", or after motion-critique has every score at 8+. Refuses final.mp4 while the critique is below 8; --allow-preview writes a labelled final-preview.mp4 instead. Do not use to write the brief (motion-brief), build lanes (motion-soup) or score stills (motion-critique).
---

# motion-deliver — seek every frame → MP4 → verify → loop check → gate

Last of four: **motion-brief** (`work/BRIEF.md`, `work/beats.json`) → **motion-soup** (lane build loop) →
**motion-critique** (stills scored to 8+) → **motion-deliver** (this). It owns FILM-SPEC-9 item 9: *"Final MP4, loop
check, poster frame, contact sheet, clean source with a README."* It feeds two gates from motion-soup
`references/gates.md`: **FS-deliverables** (five files, loop check with `pass` + `seamDelta`, README title) and
**FS-critique** (no `render` stage row until the latest critique row has every score ≥ 8).

Paths are relative to the repo root. `RD` = `node skills/motion-deliver/scripts/render.mjs`,
`DC` = `node skills/motion-deliver/scripts/deliverables-check.mjs`, `R` = `node skills/motion-soup/scripts/soup-runner.mjs`.

## Inputs (check before rendering)

| Need | From | If missing |
|---|---|---|
| critique at 8+ | latest `critique` row of the round in `work/soup-ledger.jsonl` | stop: run motion-critique. Only the owner can ask for a preview |
| ladder up to `audio` | `R report --round K` | say which stage is missing and stop; never backfill a stage row |
| deliverables dir | brief §9 `- dir:` (default `work/deliver/<board>/`) | use the default and say so |
| poster, contact sheet, README | `npm run deliver` (`scripts/deliver.mjs`) in this repo; elsewhere stills.mjs at the landing and payoff marks | make them first; render.mjs only adds the MP4, the loop check and a README section |
| a seekable host | the motion-critique stills config the render config `extends` | write the stills config first (motion-critique §Stills on a new host) |
| fps | brief §9 `fps:` if present, else 30 | — |

No design tokens live here: colour, type and timing come from the host page. `R check-literals skills/motion-deliver`
must exit 0.

## The render

```
PW_MODULE=/opt/npm-tools/node_modules/playwright/index.js \
CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
$RD --config skills/motion-deliver/configs/motion-atlas.json --param board=<board id> [--fps 30] [--allow-preview]
```

What it does, in order (each step fails the run with exit 1 and a named reason):
1. **Gate.** Reads the ledger. The latest critique row of the round (`--round`, default the highest) must exist with
   every score ≥ 8, or it refuses before capturing a pixel. `--allow-preview` writes `final-preview.mp4` instead
   and labels it in README.md as **"preview: critique not yet 8+"**.
2. **Timeline.** `duration` = a number or `"from-beats"` (the config's `timelineExpr` total). `N = round(fps × duration)`.
3. **Audio, offline.** A fresh load of the page runs the config's `audio.expr`: the host's own engine scheduled into
   an `OfflineAudioContext` and stepped with suspend/resume (the work/eval-v9/audio-probe/audio.mjs approach). No new
   music. A host whose audio lives outside the page gives `audio.cmd` instead (env `DUR`, `SR`, `OUT_WAV`).
4. **Frames.** For n = 0..N−1 the stage is seeked to t = n/fps with the stills config's `seekExpr` (here
   `data-fixed-t`, `_T`, `drawAllCanvases()`), screenshotted and piped as PNG into ffmpeg. Never real-time playback.
5. **Encode.** libx264 yuv420p (BT.709, tagged), even dimensions, AAC, `-movflags +faststart`.
6. **Verify (ffprobe).** H.264 yuv420p, even size; video, audio and container durations within 1 frame of the board
   total; counted frames = fps × duration; `moov` before `mdat`.
7. **Frame check.** stills.mjs (the motion-critique script, not a copy) captures 3 times — hook 1.0 s, middle,
   landing — snapped to exact frame times. The MP4 frames at those n are extracted and compared: mean absolute RGB
   difference ≤ `compareLimit` (0.02 of full scale), and each must be closer to its own still than to another
   still. Why 0.02: yuv420p halves chroma resolution and H.264 at crf 16 adds about 0.3% mean error on flat
   graphics; a wrong frame on this host differs by 7–12%. 0.02 leaves ~6× room above the codec and ~4× below a
   wrong frame.
8. **Loop check** (merged into `loop-check.json`, the deliver.mjs fields kept):
   - `seamDelta` — seek(0) vs seek(total), deliver.mjs's wrap measure, ≤ `seamLimit` (0.01);
   - `mp4LastVsFirst` — decoded frame N−1 vs frame 0, ≤ `lastVsFirstLimit` (0.02; the landing echoes the hook);
   - `audioSeam` — last-vs-first sample jump (a click, ≤ 0.1), silence before the first onset (a gap at the loop
     point, ≤ 1 frame) and tail-vs-head RMS step over 400 ms (the EBU R128 momentary window, ≤ 12 dB). The 20 ms
     values are reported but not gated: at the head they measure the hook's attack, not its level.
9. **README.** Replaces the `<!-- motion-deliver:start/end -->` section of the dir's README.md; the rest is kept.
   Artifacts: `render-check/{render.json, mp4-<t>s.png, still-<t>s.png}` (`audio.wav` is gitignored).

Read two of the `render-check/mp4-*.png` frames yourself before reporting. A blank or wrong frame is a host bug, not
an encoding detail.

## The gate

```
$DC work/deliver/<board>                 # FS-deliverables + FS-critique: needs final.mp4 and a critique at 8+
$DC work/deliver/<board> --allow-preview # accepts final-preview.mp4 only if README carries the preview label
$DC work/deliver/<board> --mark-render   # appends the `render` stage row only when everything passes, never for a preview
$DC --selftest                           # 2 positives + 10 mutations, each must be caught
```
`--probe` adds an ffprobe check of the codec. `--json` prints the result object. The checker uses only node built-ins.

## Where in the ladder

`render` is the last stage of motion-soup 8b. Write it only through `DC --mark-render` after a non-preview render:
that is the one path that checks FS-critique first. Then motion-soup step 10 runs FS-gateorder, FS-critique,
FS-identity and FS-deliverables at the verdict. A preview never gets a stage row. Say in the report that it is a
preview and quote the gate's reason.

## Config (extends the stills config)

`configs/motion-atlas.json` sets `"extends": "../../motion-critique/configs/motion-atlas.json"` and adds `fps`,
`duration`, `frameSettleMs`, `compareTimes`, `compareLimit`, `loop{}`, `encode{crf, preset, audioBitrate}`,
`launchArgs` and `audio{sampleRate, channels, expr | cmd}`. For a new host: write its stills config first, then a
render config that extends it with an audio render from the host's own engine. Keep `seekExpr` pure in t.

## Speed

Capture time is dominated by the host's redraw plus a screenshot per frame. On this repo at 1040×650 (the
storyboard card at device scale 3, rounded to even) it runs at about 2.7 frames/s: 420 frames in about 2.5 min, under
3 min including audio and checks. If you need it faster, lower `deviceScaleFactor` in the render config. Never switch
to real-time recording.

## Don'ts

- Rendering `final.mp4` past a closed gate, or writing the `render` row by hand. FS-critique exists for this.
- Real-time capture (screen recording, `requestAnimationFrame` playback). Frame n must equal f(n/fps).
- New or substitute music. The deliverable carries the host's score.
- Duplicating stills.mjs logic. Extend its config and call the script.
- Colour, font or easing literals in this skill.
- Committing a large MP4: if it is over 8 MB, add `work/**/*.mp4` to `.gitignore`.
