# BART-REPO-AUDIT — `Barty-Bart/motion-graphics` vs CETI Motion Atlas Studio Pro v9.1

Source: read-only clone `/home/claude/barty-bart/motion-graphics` (MIT; 6 skills; 109 `.ogg`; no Remotion anywhere). Nothing executed. Ours = `v9-fable-soup`, 34 gates + 15 mutations.

## Common renderer (explainers + motion-broll)

One self-contained HTML page: `window.VIDEO={w,h,duration}`, `window.seek(t)` a **pure function of time** (no CSS transitions/timers, seeded `rng`, history "baked at load" at 1/240 s). Headless **Playwright/Chromium** screenshots → **ffmpeg** (`tmix` of 4 sub-frames over a 180° shutter = motion blur, libx264 crf 16). Audio: `window.buildAudio(ctx)` on an `OfflineAudioContext` → PCM → `loudnorm=I=-16:TP=-1.5:LRA=11`. Fonts inlined as base64. The ~100-line `render.mjs` is pasted inside each SKILL.md. Same contract as our G06 — theirs is prose, ours is a gate.

## Per skill

| Skill | What | Pipeline / gates | In → Out | Libs | Music vs SFX | Verdict |
|---|---|---|---|---|---|---|
| **motion-broll** | B-roll timed to a talking-head's words; one shape that morphs and never cuts, cursor-driven | interview → `inspect_video.py` (fps, PiP box, black) → plan table, **stop for approval** → fragment per clip on `engine/motion.js` (8.7 KB closed-form springs) → `beats.js` contact sheet, "look yourself, fix, check once more" → `render.js` → `composite.py`, `make_pages.py`. No scored gate; two human checkpoints | video + SRT/VTT → MP4 cutaways, ProRes 4444 `.mov` panels, `preview.mp4`, `viewer.html`, `compare.html`, `TIMING.md`, `plan.json` | DOM/CSS, Geist (OFL), Lucide paths (ISC), Playwright, ffmpeg | none; original audio kept, SFX deferred to `sound-effects` | **ADAPT**: word-time `SEQ` binding and the `compare.html` wipe are missing in ours; our DAG canvas, Wada palette and G31 vector layer are stronger |
| **object-separation** | SAM 2.1 rotoscope on the user's machine; green preview + per-frame masks | scan hardware → model size → click points → chunked propagation → render | video + points → `separated.mp4`, `masks/*.png` | torch, transformers, OpenCV | n/a | **SKIP**: no footage input in our brief; our engine is synthetic |
| **explainer-high-energy** | 12–20 s hype promo, 6–8 scenes on a 120–140 BPM grid, a shape carries every transition | 7-slot brief in one message → beat sheet as a comment at the top of the script → stills → draft 30 fps → final 60 fps 8 sub-frames | brief → `demo.html`, `draft.mp4`, `demo.mp4`, `demo_silent.mp4` | as above | **both synthesised** in `buildAudio`: kick per beat, clap 2/4, sub on scene roots, riser into slam, impact on flood, blips per typed word, whoosh per transition; "mix the music under the hits", no duck law | **ADAPT**: beat-locking rules (below); our G30 duck law, MUSIC quantize and G33 wording are stronger |
| **explainer-default** | 45–90 s calm product demo; the camera is the editor, real UI rebuilt as vector | same brief + 3–5 features; length budget table; no hard cuts | same | same | synthesised 100–110 BPM bed; small SFX: key ticks, clicks, tick per step, whoosh on camera moves, chime on end card | **ADAPT**: pacing numbers (2 s title hold, 25 chars/s typing, 0.5 s read pause) as `say` draw-on defaults |
| **explainer-engaging** | 10–30 s one-take loop; a hero travels through stations; camera pulls out at the climax | brief + 3–6 steps → hero → stations → contact points **on beats** → baked camera (spring w≈6) → seam rule `seek(duration)==seek(0)` | same | same | synthesised 110–120 BPM groove; **hero contacts are the instrument** (pitched tick rising with the story) | **ADAPT**: "contacts are the instrument" as a MUSIC cue type; our D7 seam fix already holds the chord |
| **sound-effects** | Measured sound pass over an exported MP4 | see below | silent MP4 + `cues.json` + music → `after.mp4`, `SOUND.md`, `CREDITS.txt`, `report.html`, `beatgrid.png`, `checks/` | librosa, soundfile, numpy, scipy, matplotlib; ffmpeg `ebur128`, `alimiter` | **music = real file** (user's or Mixkit runtime); **SFX = real CC0 files**; "never synthesize" — the opposite of the explainers and of our engine | **ADOPT** the CC0 kit + the acceptance window; **SKIP** the librosa/MP4 flow (no MP4 stage; our probe already renders offline) |

## Measured sound pass (`sound_pass.py` 170 lines, `report.py` 28)

1. **Beat grid check.** `librosa.beat.beat_track`; music low-passed at 120 Hz, 5 ms max-envelope, `find_peaks` ≥ 50 % of max at ≥ 0.6 × period = kicks. Median kick-to-beat offset > **30 ms** → shift the whole grid; plot 4 bars.
2. **Cuts on the beat.** Cannot retime video, so it searches the music start in **5 ms** steps over ≤ 8 periods to minimise Σ|cut − nearest beat| for `scene_cut`/`reveal` cues; reports residual per cut. No threshold; residuals rank the risky timestamps.
3. **Placement rules** (files are −3 dBFS peak-normalised): movement/scene_cut −4 dB and **2 frames early**; typing −8 dB looped with a 50 ms fade; build_up −6 dB with the riser **ending** on the hit; appear/click/hover −6 dB; reveal 0 dB; one file per cue, default kit first.
4. **Bed** at **−12 dB** under SFX, 0.6 s fade-out.
5. **Loudness loop on the exported MP4**: ≤ 10 export→measure passes; accept at **|I + 16| ≤ 0.5 LU and true peak < −4 dBFS**, else add (−16 − I) dB and/or tighten `alimiter` ×0.9. Mono downmix measured once.
6. **Proof.** Frame at −0.1 s and +0.15 s plus a 1.3 s waveform per cue; the 5 riskiest cues (beat error × 10 + type weight) go to a human: "Not claiming it sounds good: listen to these."
7. **Licence in code.** Only `CC0` or `Mixkit … Free License` count; others are named UNKNOWN; use-case conflicts flagged. `report.html` plays each cue and exports `swaps.json`.

Not measured: SFX-to-bed ratio, SFX collisions, duck shape, per-section loudness, holes — exactly what our `work/eval-v9/audio-probe/analyze.py` already does (RMS/s, holes, breather floor, seam, duck dip per cue, bell Δ). The port is additive: their acceptance window + our per-cue metrics = G36. Don't copy: `eval()` on the ffprobe string, hard-coded `/tmp`, `random` for alternatives.

## Beat-locking of kinetic type (explainer-high-energy)

- Grid 120–140 BPM, default **128 BPM / 8 bars = 15 s**; scenes 1.5–3 s.
- Scene changes on **beats**, typography on **1/8 or 1/16**, letter masks on consecutive 1/16s, the kinetic triplet = three words at **two beats each**.
- Hard cuts only on a downbeat, at most twice; otherwise "transitions are objects".
- Overshoot `z ≈ 0.6–0.7` on impacts via `spring(t, w, z)`; `w` 8/14/22.
- The beat-sheet comment is the single timeline for visuals and `buildAudio`.
- Ours quantises SFX to 16ths within 60 ms (G30 pred 7) but `say` draw-on and vector reveals are time-based. ADAPT = `MUSIC.gridTimes` + a `snap` field on the beat.

## Brief format the explainers expect

Seven slots in **one message**, only the product required: product (+URL), the one thing to remember, brand, 16:9/9:16, length, music (own file or synthesise), direction; plus 3–5 features (default) or 3–6 workflow steps (engaging). Rules: never invent facts, logos only if supplied, CTA only if given. `motion-broll` adds density, look, avoid/include and `plan.json` `{title, video, fps, clips[{id,title,line,in,out,kind,file}], notes[]}`. Our FILM-SPEC-9 is the superset; their additive fields are `oneThing`, `format`, `musicSource`, `density`, `line`, `illustrative[]`.

## "Critique loop until score ≥ N"

**None.** Two unscored human checkpoints (plan approval; "look at the sheet, fix, check again") and the sound pass's measured accept loop. Our FS-critique (every axis ≥ 8 before `render`) has no counterpart here.

## Licensing of the SFX library

- `sfx/manifest.json`: 103 bundled entries **all CC0 1.0** (Freesound CC0 verified per sound 2026-10-12; Kenney packs CC0), 6 `kit/*.ogg` CC0; `default_kit.typing` and 40 `runtime` entries are **Mixkit** (videos OK, **no redistribution**, never bundled). Files: trimmed, −3 dBFS peak-normalised, 48 kHz OGG q4.
- Categories (files): ambience 3 · click 8 · ding 9 · glitch 7 · impact 11 · kit 6 · pop 15 · riser 12 · tick 3 · transition 12 · typing 5 · ui-blip 11 · whoosh 7 = 109, 2.7 MB.
- **Vendor verdict:** yes for any CC0 file; copy its `LICENSES.md` row (author + source URL). Never vendor Mixkit, Pixabay, Sonniss, YouTube Audio Library. Minimal kit: whoosh 10.6 KB, impact 5.6, pop 4.8, click 6.3, tick 4.0, riser 17.2 (all `kit/`) + ding `kenney-interface-confirmation-001.ogg` 4.8 = **53 KB raw, ≈71 KB base64**. Code MIT; keep the Vox (@Voxyz_ai) method credit.

## Summary

ADOPT: CC0 kit; acceptance window (−16 LUFS, TP, mono check); proof frames + 5 timestamps; `CREDITS.txt`. ADAPT: grid snapping for reveals; brief fields `oneThing/format/line/illustrative`; word-time `SEQ`; `compare.html`; "contacts are the instrument". SKIP: librosa/MP4 flow; synthesised-only music (our G30 score + duck law); object-separation; unscored critique (FS-critique is stricter).
