# clawd-video: deep study

Source: https://github.com/aadil6971/clawd-video. Clone at `/home/claude/atlas/ref/clawd-video`, commit `653c3ae`, 2026-09-23. Nothing was run or installed. I read the files and probed the two demo MP4s with ffprobe and contact sheets.

## 1. What it is

It is a Claude Code plugin with one skill, `clawd-video`. From a short brief it makes an 8–20 s **hand-painted watercolor cartoon** as an MP4 with its own synthesized music and sound effects. The skill contains a small engine that gets copied into each project. Claude writes only two files per film: `story/story.js` for the picture and `audio/score.mjs` for the sound.

- **Stack:** p5.js 2.x plus **p5.brush 2.x** for the watercolor and ink painting. Drawing happens on a Canvas 2D context in a p5 sketch. **Puppeteer** (headless Chrome) captures frames and **FFmpeg** encodes them. A Node synth built from scratch does the audio (Karplus-Strong pluck, FM bell, drums, about 20 cartoon SFX). There is **no Remotion, no Motion Canvas, no GSAP.**
- **Output:** 1920×1080 at 24 fps, H.264 with `-preset slow -crf 16 -tune animation`, AAC 192k / 48 kHz audio at −16 LUFS. Both demos check out exactly: 15.000 s and 8.000 s, with an audio stream present.
- **Install paths:** a plugin marketplace entry (`.claude-plugin/marketplace.json`), a copied skill folder, or a zipped `dist/clawd-video.skill` for the Claude app.

## 2. Architecture map

```
skills/clawd-video/
  SKILL.md                      workflow + "things that bite" (the prompt that drives Claude)
  references/{style,characters,animation,sound,qa}.md   loaded per step (progressive disclosure)
  scripts/new_project.sh        copies template/ (and optionally an example) -> npm install
  template/
    index.html                  script order: p5 -> p5.brush -> core -> paint -> kit -> rig -> scene -> story
                                modes: live loop | ?t=4.2 freeze | ?render (driven by Puppeteer)
    engine/core.js   (G)        config, easing, spring, pulse, blink, hop, seeded rng, shape point lists
    engine/paint.js  (paintAssets, brush kit k)  hidden WEBGL p5 runs each paint job ONCE -> 2D canvas
    engine/kit.js    (K)        shadow, clipDraw, occlude, blendPose, ghosts, puffs, particles,
                                sticker, floater, surprise, impact, kick, glow
    engine/rig.js    (Rig)      part-based character rig, eyes/expressions, Rig.point, Rig.tint
    engine/scene.js  (startScene) compositor: STORY.frame(t) then paper finish (vignette+grain)
    story/story.js              THE STORY (starter "Bun and the Flower", 8 s)
    audio/synth.mjs             instruments + SFX + mixdown to WAV
    audio/score.mjs             THE SCORE, reads out/cues.json
    render.mjs                  stills | samples | full render | audio-only; 2-pass loudnorm + mux
    tools/check-motion.mjs      frame-to-frame jump detector over STORY.track(t)
    tools/sheet.mjs             FFmpeg contact sheet (with frame-number labels, optional range)
  examples/clawd-desk/{story.js (1391 lines), score.mjs}
```

**Data flow:** `STORY.paint[]` runs once through p5.brush and fills asset canvas `A`. Then, for each frame i, `STORY.frame({ctx, t=i/FPS, A})` draws, the paper finish is applied on top, the frame is exported with `toDataURL` as a PNG, and the PNG is piped to FFmpeg's `image2pipe`. In parallel, `STORY.cues()` is written to `out/cues.json`. `score.mjs` reads it and writes `audio.wav`, which goes through two-pass linear loudnorm and is muxed into the MP4.

**The STORY contract** is the interface Claude writes against: `{ finish, paint[], setup(), frame(), track(t), cues() }`. Composition settings are set with `G.config({W,H,FPS,DURATION,slug})` on the first line.

## 3. How scenes and timing are defined

- **Beat table first.** A comment at the top of `story.js` lists the beats in seconds, for example `0.0–2.4 peeks…`, `2.4–3.3 crouch, hop…`. Blocking marks (ground lines, prop positions) follow as named constants.
- **`poseAt(t)`** has one `if/else` branch per beat. Inside a beat, progress comes from `G.seg(t,t0,t1)` (0 to 1) and is shaped by an easing function. Nothing is remembered between frames. If a later beat depends on an earlier one, it recomputes it. In the Clawd example, `carry(t)` is shared by the mug and the character.
- **Easing set** (`engine/core.js`): `smooth`, cubic `easeIn/Out/InOut`, `easeOutBack(t, overshoot)`, `spring(dt,freq,damp)` (a damped cosine, used for landing squash), `pulse(t,a,b)` (a sine hump), `blink`, and `hop` (a parabola with a given apex height).
- **Rhythm with acceleration** (Clawd typing): typing speeds up from 5 Hz to 14 Hz. The rate is integrated into a phase table at 1/480 s steps, and the times where the phase crosses a whole number become discrete key-tap events. Those taps drive the key flashes, the flying code glyphs and the click sounds. This keeps a variable-rate rhythm deterministic and in sync across picture and sound (`examples/clawd-desk/story.js` ~L282–303).
- **Ordering.** Draw order sets depth: background, then resting particles, shadows, props, character ghosts, the character, flying particles and FX.

## 4. Typography and color system

- **Typography is deliberately minimal.** The only text is in-world: code glyphs, "!", notes. It is drawn with `K.sticker`: bold monospace, a thick outline in the paper colour, and a bright fill. `K.floater` makes a glyph pop in with `easeOutBack` overshoot 2.2, drift up and fade out. There are no captions or titles unless the user asks. *There is no type scale or layout system to borrow.*
- **Colour** works in layers, explained in `references/style.md`:
  1. Warm paper base `#FBF3E6`.
  2. Watercolor washes.
  3. Wobbly ink outlines (`#3A2A24` to `#4A3428`).
  4. Clean, saturated characters on top.

  The rule of thumb is that backgrounds are light and warm or desaturated, while characters and hero props are mid-value and saturated. The character is always the highest-contrast thing on screen. The reference gives named hex palettes for cozy room, meadow, night, forest and underwater. Character colour comes from the reference art: Clawd is `rgb(215,119,87)`, the `clawd_body` theme token taken from the Claude Code binary. Lighting is only ever added on top as a `screen` tint and never changes a base colour.

## 5. Reusable primitives (with paths)

| Primitive | Path | What it gives |
|---|---|---|
| `G.seg / easeOutBack / spring / pulse / blink / hop / rng` | `template/engine/core.js` | A deterministic timing and easing toolkit; `spring` drives squash and camera kick |
| `paintAssets(jobs)` + brush kit `k.wash/water/blob/ink/shape/pigment/band/dense` | `template/engine/paint.js` | Paints each asset once, so the texture never flickers; `dense` subdivides edges to stop sawtooth bleed |
| `K.clipDraw`, `K.occlude` | `template/engine/kit.js` | Sprite halo control; "hide behind X" by redrawing the background clipped to X |
| `K.blendPose` | `kit.js` | A recursive numeric lerp of nested pose objects that removes pops at beat boundaries |
| `K.ghosts(poseAt,t)` | `kit.js` | Translucent past poses (1/48 s and 2/48 s back) used as smear frames |
| `K.particles` | `kit.js` | Confetti, petals, snow: bursts with an analytic drag-and-gravity solution, rain with sway, a rest state on the ground, and a 3D flip faked with `scale(1,cos)` |
| `K.puffs`, `K.shadow`, `K.impact`, `K.surprise`, `K.kick`, `K.glow`, `K.sticker`, `K.floater` | `kit.js` | Cartoon FX vocabulary; `shadow` shrinks and fades with height, which is a big part of why jumps read |
| `Rig.draw / pose / point / tint` | `template/engine/rig.js` | Part rig with origin at the feet, pivots, a `turn` value for spins with a back view, eye modes (normal / happy / closed, pixel chevrons), and hand-attachment points |
| Paper finish (`makeGrain`, `makeVignette`) | `template/engine/scene.js` | Low-frequency mottle plus fine noise in `overlay`, and a warm radial vignette in `multiply` |
| Render CLI (`--stills`, `--samples`, `--audio-only`) | `template/render.mjs` | Fast keyframe stills, a full render, and an audio-only rebuild; script errors surface through `window.__error` |
| Pop detector | `template/tools/check-motion.mjs` | Per-channel limits: x/y 60 px, scale 0.25, angle 0.7 per frame |
| Contact sheet | `template/tools/sheet.mjs` | An FFmpeg `select`+`tile` sheet with frame numbers; give it a range for a dense look at fast actions |
| Synth + SFX map | `template/audio/synth.mjs`, `references/sound.md` | Original audio, an action-to-SFX lookup table, and a beat grid aligned to the picture |

## 6. Quality levers (why it looks good)

1. **Every frame depends only on t.** Rendering is deterministic, with seeded randomness and no state carried between frames. That is what makes frame-exact QA, stills checks and pop detection possible.
2. **Painted once, animated on top.** The static art has rich organic texture, and everything that moves is clean vector drawing, so nothing shimmers.
3. **The animation principles come as numbers.** The reference table in `references/animation.md` gives values for anticipation, stretch, squash with a spring, volume preservation (`sx≈1/√sy`), arcs, follow-through delays of 0.05–0.1 s, blink lengths and surprise takes. This is the biggest lever for an LLM because it turns taste into parameters.
4. **There are speed limits for 24 fps** (60 px/frame, 0.7 rad/frame, cycles at or below 5 Hz). Ghost smears handle anything faster.
5. **Staging rules.** One action at a time. The character looks at its target before acting. It holds still after an impact so the hit lands. It stays calm for the last 0.5 s. It changes depth only when fully clear of the occluder.
6. **Restraint in effects.** Glow alpha stays at or below 0.15–0.2 and rays at or below 0.04. Coloured light uses `screen`, never source-over. Grain sits at about 0.26.
7. **Unified finish.** The paper grain and vignette tie the vector characters and the painted set into one medium.
8. **Sound locked to the picture.** `cues()` drives the SFX so nothing drifts. The music tempo is derived from on-screen beats (for example, a 0.4 s dance beat gives 150 BPM). Two-pass linear loudnorm keeps the impacts punchy.
9. **A closed self-critique loop.** Stills, samples, contact sheets, the motion check and ffprobe give Claude machine gates where a human would otherwise have to look. The skill also tells Claude to be honest about what it cannot verify, namely the audio.

## 7. How Claude is driven (prompt design)

- **Frontmatter `description`** lists many trigger phrases and adds "even if they don't name the skill."
- **Defaults instead of questions.** The size, fps and length defaults let Claude start without asking. User timings are "the contract." Five beats is enough for 15 s, and beats should be merged rather than rushed.
- **Reference-first for existing characters.** Claude writes proportions down as numbers in comments. The Clawd film decoded the quarter-block terminal logo from the binary.
- **Progressive disclosure.** Five reference files, each loaded only at its matching step.
- **Ordered build with a still after each step:** beat table, paint jobs, static rig, `poseAt`, FX.
- **A "Things that bite" list** in SKILL.md holds about 12 hard-won pitfalls. `references/qa.md` adds a symptom → cause → fix table and a pre-delivery checklist.
- **Delivery contract:** the MP4, the runnable project, and an honest summary of what was checked, what was fixed and what could not be checked.

## 8. Borrow vs avoid (for a Claude-driven motion-graphics skill)

**Borrow:**
- The **STORY contract pattern**: the engine stays fixed and Claude writes only a time-pure `frame(t)`, a `track(t)` and a `cues()`. That small surface keeps quality high.
- The **numbers-first animation reference**, rewritten for motion graphics: entrance and exit overshoots, stagger offsets, hold durations, per-frame speed limits.
- The **paint-once, composite-per-frame** split. It works for any expensive generative layer: noise fields, brush textures, blurred backgrounds.
- **Machine QA gates**: the stills CLI, every-Nth samples, contact sheets labelled with frame numbers and dense around fast moves, a per-channel pop detector, an ffprobe frame-count check, EBU R128 and a waveform PNG.
- **`blendPose`** for continuity at beat boundaries, and **`ghosts`** for motion blur on the cheap.
- **Cue export** to keep sound in sync. Integrating a phase table for variable-rate rhythms.
- The **finish layer** (grain plus vignette) as a global style unifier.
- The **"things that bite" plus symptom/cause/fix table** format for the skill's own docs.
- **Preview modes** in one HTML file: live loop, `?t=` freeze, and `?render`.

**Avoid or adapt:**
- **Hand-coded `if/else` beat branches.** The Clawd story runs to 1391 lines. For motion graphics, prefer a declarative timeline (a keyframes/tracks DSL or a Remotion-style sequence) that compiles to `f(t)`.
- **There is no typography or layout system.** Motion graphics depend on kinetic type, grids and data viz, so that layer has to come from elsewhere.
- **The frame capture path is slow:** `toDataURL` PNG per frame, then a pipe. It is fine for 15 s at 1080p (about 40 s render on an M-series Mac, per the README), but it won't scale to minute-long 4K. Consider WebCodecs, or Remotion's renderer.
- **p5.brush quirks** (no transparency, only works in WEBGL, halos) only apply if you want the watercolor look.
- **Platform:** tested on macOS. The Linux fallback is SwiftShader, which is slow, and Puppeteer downloads its own Chrome.
- **Branding:** Clawd is an Anthropic mascot and the repo says it is an unaffiliated fan project. Don't ship Clawd art in client deliverables.

## 9. License

**There is no LICENSE file** in the repo, and there is no license field in `marketplace.json`, `package.json` or the README. The GitHub API was not reachable from this session to confirm the repo-level setting. Without a license, the default is all rights reserved: you may study it and take ideas and patterns, but **do not copy the code verbatim** into a distributed skill unless the author adds a license or you get permission. The third-party dependencies have their own licenses: p5.js is LGPL-2.1, p5.brush is MIT, and Puppeteer is Apache-2.0. Check these before redistributing a derivative engine. The demo media show the Clawd mascot, an Anthropic trademark, and the README states the project is unaffiliated.
