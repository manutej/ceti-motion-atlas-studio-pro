# CETI Capabilities: series plan

**Promise:** each episode covers one capability CETI uses every week. It shows one move, in about 25 seconds, with the little whale flying over a chart.
**Grounding:** `RESEARCH.md`, which uses Manu's own Notion vocabulary and numbers. Every on-screen claim stays inside its accuracy cautions.
**Style:** Kinetic Hydrography 1.0.0 plus the series layer (`series.js`).

## Format (every episode)

| | |
|---|---|
| Length | 24–28 s, 60 fps, 1920×1080 |
| Ground | Air mode over the chart ground (`SERIES.ground`): paper, grid, depth contours, soundings, compass. Never bare, never white. |
| Opening | `SERIES.open`: "CETI · Capabilities · 0N" plus a display title with one accent word, gone by about 2.3 s. Work starts underneath it. |
| Act 1, the mess (≈ 3–5 s) | The problem, made visible in one gesture. |
| Act 2, the move (≈ 12–15 s) | 4–6 station words from RESEARCH.md, hit on beats. The whale makes each one happen; it doesn't just point at it. |
| Act 3, the payoff (≈ 4–6 s) | The episode's **own ending pattern** (see the table below). Endings must not repeat across the series. |
| Close | One-sentence end belief as a caption, fully out by the lockup start; then `SERIES.lockup` from about DUR−2.2 s. The lockup takes the caption's place at the bottom. |
| Scale | Phone-legible: main strokes ≥ 4 px, key marks ≥ 40 px, station words ≥ 18 px mono. The mechanism fills the middle of the frame, not a thin band. Push in on the key moment. No static hold longer than about 2 s before the lockup. |
| Text | Text is ink on paper, or on a paper chip (`SERIES.chip`). Never text on a Wada fill. Colour sits in marks, never in body text. The accent word in the title is the colour mixed toward navy until it passes 4.5:1. |
| Motion | Fast but legible: the whale is ≤ 30 px and ≤ 0.35 rad per frame on screen. Camera moves are eased with CETI eases; no bounce. |
| Sound | 120–132 BPM, cue-locked. Every sound sits on an exported cue. Normalised to −16 LUFS, true peak ≤ −1 dBTP. |
| Honesty | Each episode carries its "not this" line (the misconception from RESEARCH.md), either in a caption or as the last beat before the belief. |

## Episodes

| # | Slug | Title (accent in *italics*) | Wada | BPM | Mechanism on screen | Ending pattern | End belief (caption) | "Not this" |
|---|---|---|---|---|---|---|---|---|
| 01 | `stitch` | Context is *composed*. | 166 | 128 | Typed atoms (coloured tabs) ride the line into a socketed tree. A matching atom snaps, a mismatched one is refused at the seam, and two disjoint branches fill in parallel. | **Seal and send.** The tree folds into one brief card with a receipt tick, an AI pod takes it, and it leaves frame. | Small typed parts, checked at every seam. | Consistency is not correctness. |
| 02 | `gate` | Prove it at the *gate*. | 243 | 128 | The line passes gates. Good runs glow through, a wobbly copy is stopped, and one wobble escapes. The escape is caught downstream and turned into a new, tighter gate. | **Rules accrue.** Pull back to a long line of gates, where every miss has become a rule. The counter reads "rules 6 → 7". | Machines check every run. Every miss becomes a rule. | A gate proves the absence of known failures, not quality. |
| 03 | `glue` | Memory that *agrees*. | 207 | 120 | Five wave segments (notes). At each overlap, the two ends are compared. One seam glows terracotta (discord). The whale hops to it and the ends meet and turn teal. | **One wave.** The segments fuse into one smooth line, which closes into a ring (a global section) around the whale. | Check each note against its neighbours. Show disagreements; never overwrite them. | Glued is not the same as true. |
| 04 | `conserve` | Change everything but the *laws*. | 84 | 124 | The line bends freely as content changes, but three pins never move. A hop tugs a pin, the measure shows drift, and the line repairs and springs back. A ledger ticks each firing. | **The shake.** The whole line is shaken hard, all three pins hold, the drift counter stays at 0, and everything goes still. | Name what must never change. Check it on every edit. | Noether-inspired, not Noether's theorem. |
| 05 | `tellapart` | Same reading, *different* world. | 339 | 132 | Two worlds (a calm wave and one with a gap) produce one identical gauge reading. The whale dives, finds the gap, and brings back the witness pair. | **The split.** The single line splits into two strands, each now with its own reading. | If two worlds look the same in your numbers, nothing downstream can tell them apart. | More metrics is not the fix; the right distinction is. |

The existing Composition v2 counts as the series' Episode 00 (typed parts that snap). Episode 01 is deliberately different: it is about context for agents, seams and parallelism.

Next, not yet built: `loop` (bounded RSI: one change at a time, counter 14 → 14 → 10 → 0), `jury` (the builder never judges) and `ledger` (fingerprint chain).
