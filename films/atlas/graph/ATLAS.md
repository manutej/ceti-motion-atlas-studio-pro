# Motion Atlas: synthesis

Built 2026-10-16 from 29 source atoms (research batches 1-5) and the clawd-video repo study. The companion graph is `atlas-graph.json`: 157 nodes and 710 edges. Node ids are given in `code` below so this page can link straight into the graph.

## (a) The frontier in one paragraph

The best Claude-made motion work does not come from better prompts. It comes from a **harness**: a fixed engine in which every frame is a pure function of time (`q:time-pure-frames`). Claude writes only a small composition file against that engine. The harness locks decisions before any pixels exist, using a brief that settles everything, a reference teardown, a design-system file and a beat grid. It encodes taste as numbers: speed limits, spring constants, anticipation times, effect caps and a banned list with replacements. It also gives the model machine eyes: key stills, frame-numbered contact sheets, a frame-jump detector, ffprobe and loudness meters. Sound is built from the same event times the animation exports, so it cannot drift. Every review round is written back into the rules, so the system improves with use. clawd-video (`src:aadil6971-clawd-video`) is the most complete public example. The prompt-motion gallery analysis (`src:prompt-motion-com`) is the best evidence for which brief and look rules actually matter. Slodyczka's morphing b-roll skill (`src:6ij9-f2t2ck`) adds the strongest look idea, one-object continuity, along with motion blur from subframe blending. The frontier now is turning this from a hand-tuned craft into a measured self-improvement loop (`gate:frozen-evaluator`).

## (b) Style taxonomy

| Style (graph id) | Look | Core engine | Maturity | Signature lever |
|---|---|---|---|---|
| Watercolor storybook cartoon (`sty:watercolor-storybook-cartoon`) | warm paper, washes, wobbly ink, clean saturated characters | p5.js + p5.brush, Canvas 2D | proven | paint the textured layers once, then composite per frame |
| Never-cut morphing container (`sty:morphing-container-film`) | one rounded shape becomes pill, card, terminal, chart | custom seek(t) HTML | proven | one object carries the whole clip, with subframe blur |
| Beat-locked kinetic type showreel (`sty:kinetic-type-showreel`) | type, shapes and UI changing on every beat | HyperFrames + GSAP, seek HTML | proven | 120 BPM grid, 1 typeface, at most 3 colours |
| Editorial explainer collage (`sty:editorial-explainer`) | Vox-like diagrams, collage, labels | HTML/SVG | proven | shaped as a process, about 5 s per idea |
| Talking-head overlay b-roll (`sty:talking-head-overlay`) | cutaways, side-third alpha panels, HUDs | seek HTML, ProRes 4444, NLE | proven | keyed to the SRT, avoids the speaker's face |
| Paper-cutout stop-motion (`sty:paper-cutout-stop-motion`) | gouache, torn edges, puppet stage, wobble | HTML/Canvas, Fish Audio | emerging | material vocabulary plus held frames |
| Low-res pixel art (`sty:pixel-art-low-fps`) | 320x180, 12 fps, hit-stop | Canvas | emerging | a deliberately low frame rate |
| Retro low-poly / voxel 3D (`sty:retro-low-poly-3d`) | PS1 low-poly, seeded voxel worlds | Three.js | emerging | the period constraint hides model weaknesses |
| 3D cinematic orbit (`sty:3d-cinematic-orbit`) | orbiting cameras on 3D scenes | Three.js in a timeline; Blender MCP | emerging | depth used only when it carries meaning |
| Stick-figure doodle narrative (`sty:stick-figure-doodle`) | line characters, moving shadows | JS canvas | speculative | timing and staging over rendering |
| Whiteboard vector diagram (`sty:whiteboard-vector-diagram`) | editable Excalidraw/SVG, fixed shape key | Excalidraw CLI, SVG | emerging | render, export, compare loop |
| Interactive simulation explainer (`sty:interactive-sim-explainer`) | sketch that turns into a live sim with sliders | Three.js/canvas, generative UI | emerging | a renderer decision matrix |
| Hybrid generative + code cinematic (`sty:hybrid-generative-cinematic`) | photoreal shots under code-exact type and UI | Higgsfield/Flow + code + editor | emerging | each tool does only what it is good at |

## (c) Element inventory

The 24 elements fall into five groups:

- **Form:** kinetic type (`el:kinetic-type`), morphing hero shape (`el:morphing-shape`), data and diagram nodes (`el:data-diagram`), UI moments with a cursor driver (`el:ui-cursor`), logo sting and end card (`el:end-card`), 3D layer (`el:3d-layer`).
- **Motion:** camera move (`el:camera-move`), connected transition (`el:connected-transition`), squash, stretch and anticipation curves (`el:squash-stretch`), hit-stop and holds (`el:hit-stop`).
- **Character:** part-based rig (`el:character-rig`), guide character (`el:guide-character`), cartoon FX vocabulary (`el:cartoon-fx`).
- **Texture:** painted texture layer (`el:painted-texture-layer`), grain and vignette finish (`el:paper-finish`), particle layer (`el:particle-layer`), seeded procedural field (`el:procedural-noise-field`), generated asset sheet (`el:asset-sheet`), verified research b-roll (`el:research-broll`).
- **Sound and text track:** captions (`el:captions`), voiceover (`el:voiceover`), music bed on a beat grid (`el:music-bed`), a sound effect per action (`el:sfx-cue`).
- **Human-in-loop control:** tweak panel (`el:tweak-panel`).

Recurring numbers worth memorising:

- Anticipation lasts 0.15-0.3 s with sy 0.78-0.85.
- Take-off stretch is sy 1.25-1.3.
- Landing squash is a spring with frequency 2.4 and damping 7.
- Volume is preserved with sx = 1/√sy.
- Follow-through lags 0.05-0.1 s.
- A blink takes 0.12-0.14 s.
- A camera kick lasts 0.3-0.5 s.
- Glow alpha stays at or below 0.15-0.2 and rays at or below 0.04.
- Grain sits around 0.26-0.28.
- The last 0.5 s stays calm.
- A text floater overshoots by about 2.2.

## (d) Canonical execution logic

Each stage is a node (`stg:*`, with `params.order`). The gates sit between stages. A stage does not hand off until its gate passes.

1. **Brief intake** (`stg:brief-intake`). Fill an inputs block of about 100 words or more: subject, single concept, duration, format, tempo and bars, hex palette, one font, avoid list, renderer, ending. Empty fields take stated defaults. → *Gate: prompt bouncer* (`gate:prompt-bouncer`): field coverage must reach a threshold.
2. **Reference teardown** (`stg:reference-teardown`). Extract frames from the references. Write down palette, type, layout, shot length, transitions, camera moves and finish, then a borrow list and a leave-out list. Copy the grammar, never the content.
3. **Style system and assets** (`stg:style-system`). Write one design-system file with tokens, spring and easing constants, transition grammar, the banned list with replacements, and house rules such as "fills the frame" and "nothing overlaps". Then collect brand material and any generated assets.
4. **Script and storyboard** (`stg:storyboard`). Build a per-scene list: visual, on-screen text within the word cap, VO line, and the transition into the next scene. Every scene can be addressed on its own. → *Gate: plan approval* (`gate:plan-approval`), done by a human or a critic panel (`gate:critic-panel`). Unsourced numbers fail here.
5. **Beat grid** (`stg:beat-grid`). Choose the timing master: music (BPM and bars), speech (word timings from the SRT) or story (a beat table). Place every change and cue on the grid.
6. **Key stills** (`stg:key-stills`). Render one still per scene type or per beat, which is just a seek to t. → *Gate: key-stills review* (`gate:key-stills-review`): collisions, contrast, text size, brand fit.
7. **Scene build** (`stg:scene-build`). Write against a fixed engine contract: `frame(t)`, `track(t)`, `cues()`. Prefer a declarative track timeline to if/else beat branches. Check stills after each build step. → *Gate: frame-jump detector* (`gate:frame-jump-detector`): zero jumps above the limits except whitelisted snaps.
8. **Render** (`stg:render`). Capture in a headless browser at t = i/FPS, with 3-4 subframes over a 180° shutter, then encode. → *Gates: ffprobe spec* (`gate:ffprobe-spec`) and *contact sheet* (`gate:contact-sheet`).
9. **Audio** (`stg:audio`). Synthesize or source music on the grid and place an SFX on every exported cue. Normalise with two-pass linear loudnorm to −16 LUFS with a −1.5 dBTP ceiling, then mux. → *Gate: loudness and waveform* (`gate:loudness-waveform`).
10. **QA and self-critique** (`stg:qa-critique`). Vision self-review (`gate:vision-self-review`), a scored rubric threshold of about 7-8/10 (`gate:scored-critique`), and a repair loop back to step 7.
11. **Assembly and delivery** (`stg:assembly-delivery`). Assemble in the NLE or with ffmpeg, then build the viewer and comparison pages. → *Gate: timestamped human review* (`gate:timestamped-review`). Deliver the MP4, the runnable project, and an honest note on what was verified (the audio was never heard).
12. **Feedback to rules** (`stg:feedback-to-rules`). Write notes back to the design system and the rules file, one attributable change at a time. → *Gates: frozen evaluator* (`gate:frozen-evaluator`) and *regression benchmark* (`gate:regression-benchmark`). The loop then returns to step 3 for the next run.

## (e) Quality laws ranked by leverage

Leverage here means how many other gains a law enables, how often independent sources cite it, and how cheaply it can be checked.

1. **Frame is a pure function of t** (`q:time-pure-frames`) and **seeded randomness only** (`q:seeded-rng`). Every other gate depends on these: stills, jump detection, exact frame counts, cue sync and reproducible A/B tests.
2. **Decision-settling brief, reference teardown and brand grounding** (`q:brand-grounding`, `stg:brief-intake`). The biggest measured gain in the corpus. One-liners swing from 0 to about 17k likes on the same prompt.
3. **One-object continuity with connected transitions** (`q:one-object-continuity`). Several independent sources name it as the line between designed motion and a slideshow.
4. **Banned-effects list with replacements, plus numeric effect caps** (`q:banned-effects-list`, `q:effect-restraint`). Directly removes the most-cited AI tells.
5. **Beat-locked changes and cue-locked sound** (`q:beat-locked-changes`, `q:cue-locked-sound`). Rhythm makes edits feel intentional, and cue export makes sync automatic.
6. **Animation principles as numbers** (`q:principles-as-numbers`, `q:constrained-springs`). Turns taste into parameters an LLM applies reliably.
7. **Speed limits with motion blur** (`q:speed-limits`, `q:motion-blur`). Removes strobing and the too-clean code look.
8. **Typographic and palette restraint, staging one action at a time** (`q:typographic-restraint`, `q:staging-rules`).
9. **Composition awareness and data honesty** (`q:composition-awareness`, `q:data-honesty`).
10. **Paint once, cache, and one global finish** (`q:paint-once-cache`, `q:unified-finish`).
11. **Beat-boundary continuity, render contract, render-safe code, loudness normalisation, loop closure and style-specific frame rate.** These are hygiene laws. Each is cheap and specific.

## (f) Frontier versus AI-demo output

| AI-demo | Frontier |
|---|---|
| One-line prompt with an "go all out" effort multiplier | An inputs block plus a teardown plus a design system, with the renderer named |
| Separate elements popping in, crossfades between scenes | One object morphing, every transition grown from the last |
| Changes on arbitrary times | Changes on a stated beat grid or on spoken emphasis |
| Glows, gradients, lens flares, particle bursts, bouncy easing | A banned list with replacements, near-critical springs, capped light |
| Model's default black-and-orange palette, centred text | Brand palette, one typeface, at most 3 colours, a word cap |
| Animation tied to wall-clock time (CSS transitions, timers, Math.random) | Time-pure frames with seeded RNG, any frame addressable |
| Clean but strobing fast moves | Subframe motion blur or ghost smears under per-frame speed limits |
| Stock or no sound, typed-in times | An SFX on every exported cue, tempo derived from the picture, −16 LUFS |
| Judged by watching once | Stills, contact sheets, a jump detector, probes, a scored rubric |
| Same mistakes each run | A rules file that grows, one measured change per iteration |
| Invented statistics | Relative bars and placeholders until sourced, fact-checked explainers |

## (g) Open questions and evidence gaps

- **Unreadable sources.** The Ben Kaluza Short (`src:upihejrayvk`) and the Drive folder "Claude Motion Graphics" (`src:17oloec9septezaqzljniuqadql2dftke`) could not be read. They sit in the graph as isolated source nodes. The stick-figure community post was a truncated preview, so `sty:stick-figure-doodle` is marked speculative. The AndersenBuilds and XplatformNEWS showcases have descriptions only.
- **Second-hand transcripts.** Most YouTube evidence came through third-party transcript summaries, not verbatim text or watched footage. The visual claims for the Vox, PS1, voxel and Blender work are not inspected.
- **Gated rule files.** Lukas Margerie's "motion studio rules" (a paid kit), Slodyczka's SKILL.md body, Peverelli's 36-rule skill (Skool), Rogoff's prompt guide, RoboNuggets' prompt PDF, Jason Lee's prompts and Biet Thinks' master prompt were all not read. These are the richest unread rule sets.
- **Engines with no inspected source.** No Remotion or HyperFrames composition was read. Their gotchas come from READMEs and write-ups.
- **No motion-specific RSI evidence.** The frozen-evaluator loop was shown only on Python bug fixing, and the critic panel only on business decisions.
- **Thin numbers.** The corpus gives no number for word caps. Speed limits exist only for 24 fps, with nothing for 60 fps UI motion. Text reading-time budgets, spring overshoot values for motion graphics, and stagger offsets are all missing.
- **Scale limits.** PNG-per-frame capture will not scale to minute-long 4K. WebCodecs and framework renderers are untested here.
- **Licensing.** clawd-video has no LICENSE file, so borrow its patterns and do not copy its code. Do not use the Clawd mascot in client work. Remotion may need a paid licence.
- **Unclear benefit.** One creator was unsure whether retiming animation to synthesized beats actually helps.

## (h) Implications for an RSI motion-graphics skill

The loop: keep the model fixed, edit one rule per candidate (`pr:single-change-edit`), run headless trials on a frozen brief set, score with a validated evaluator, keep or revert, and confirm on held-out briefs. Prove the evaluator on known-bad and known-good renders first. What to measure each iteration (all machine-checkable):

1. **Determinism:** pixel diff of the same frame across two renders. Target 0. Also count banned APIs in the source (Math.random, timers, CSS transitions).
2. **Spec conformance:** ffprobe width, height, fps, `nb_read_frames = FPS × DURATION`, duration, and audio stream present. Pass/fail.
3. **Motion smoothness:** the number of frame-to-frame jumps above fps-scaled limits that are not whitelisted, plus the pixel-difference spike rate from the MP4.
4. **Boundary continuity:** the channel difference across every beat boundary at t0 ± ε.
5. **Beat alignment:** the mean and maximum offset in ms between visual change events (from track deltas) and the nearest grid beat or cue.
6. **Audio:** integrated LUFS (target −16 ± 1), true peak ≤ −1 dBFS, maximum offset from cue to waveform peak, clipping count.
7. **Layout:** bounding-box collisions per sampled frame, out-of-safe-area count, minimum text contrast ratio, minimum text pixel height.
8. **Restraint:** colours used outside the design-system palette, number of typefaces, words per frame against the cap, hits from the banned-effects scan.
9. **Continuity:** hard cuts per minute that are not declared as punctuation, and the share of transitions that are connected morphs.
10. **Data honesty:** numbers on screen that do not trace to a source. Target 0.
11. **Loop and bookends:** difference between the first and last frame for loops, and a rubric score for frame 0 as a poster.
12. **Process cost:** agent minutes, render minutes before the first approved still, and calls per finished second.
13. **Learning health:** the repeat-note rate, meaning human notes that match an existing rule (it should fall over runs). Also rule count and the share of rules that fired.
14. **Judged quality:** the critic panel score, calibrated against a small human-rated set. Treat it as secondary to the metrics above, because self-scores inflate and likes are noise.

Keep the benchmark fixed: the same briefs, seeds, renderer and effort. Store every output with its metric table, so the skill's history is a list of measured, attributable changes.
