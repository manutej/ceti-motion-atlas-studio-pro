# EVAL-v9 — blind critic (authority: advisory, phi-0)

Scope: branch `v9-fable-soup`, graded only on what a user sees/hears. Evidence produced in headless Chromium 1600×1000 @2x (Playwright), offline WebAudio renders, DOM pulls. Screenshots in `work/eval-v9/`; raw data in the critic scratchpad (`…/scratchpad/critic/`: `v9-audio-report.json`, `v9-duck.json`, `v9-plan.json`, `v9-score.wav`). v8 baseline = `main` served from its own source files (its Standalone bundle does not boot — see D1).

## Scorecard (1–10)

| Axis | v8 | v9 | Evidence |
|---|---|---|---|
| Wording | 4 | 8 | v9 `say` lines avg 7.6 words, Flesch-Kincaid grade 2.7 (MCP) / −0.1 (planning); v8 beat labels "Salience Ignition", "phase-locked trailing caravan" grade 9.6/7.1. 51 vocab cards all carry a plain-English name + (term) pair, descriptions grade 6.3. |
| Storyboard | 5 | 4 | Grammar badges and because-lines read cleanly (`01-v9-mcp-sheet-vecON.jpg`), but 15/15 beats across both boards draw a different scene than their `show` says (robot/drawer text over whale/index-card art; potholes/bars text over "NOISE"/"SLOW DOWN." art, `07-v9-planning-sheet-vecON.jpg`). |
| Messaging | 3 | 7 | "MCP: one plug, every tool" lands in text and the landing end-card; v8 had no thesis line at all. Undercut by the picture never showing a plug. |
| Visuals / WOW | 6 | 5 | Look preserved (good), but the vector layer stacks captions: `say` typed over the legacy beat label at bottom-left in every card (`04-v9-beat1-hook-vecON-960.jpg`), whale clipped behind the end-card (`06-…beat7…`), 5 competing elements in beat 3. |
| Music | 2 | 5 | A real score now exists (C Mixolydian, 104 bpm, 112 events) but renders at −25.8 LUFS integrated vs its own −14 target, with 13 holes ≥100 ms per 14-s loop and a 1.6-s near-silence at the breather (`09-v9-score-spectrogram-30s.jpg`). |
| SFX pop | 5 | 8 | Duck measured on every cue: −6.0 dB, 0.32 s below −3 dB (10/250/150 ms law), SFX peaks 2.6–11.9 dB above music peaks; THUD −6.1 dBFS. |

## Top 10 defects (ranked by user impact)

**D1 — Standalone bundle is broken (pre-existing, still shipped).** `studio-canvas-oauth.js:2801` contains the literal string `'</script>'`; the HTML parser ends the inlined block there, so `Motion Atlas Studio Pro — Standalone.html` and `dist/…standalone.html` throw "Invalid or unexpected token", never mount, and dump the rest of the source as page text (`10-v9-standalone-bundle-blank.jpg`; root innerHTML length 0). Same on v8 `main`. Fix: write `'<\/script>'`; add a build assertion that no inlined block contains `</script`.

**D2 — The new v9 controls are off-screen.** At 1600 px the control strip is 2151 px wide (`overflow-x:auto`, `flex-wrap:nowrap`, `index.html:109`); PLAY sits at x=1658, ♪ Music at 1915, ✦ Vector layer at 1976, NO-TEXT at 2077 — invisible even at 1920 px (`08-v9-transport-strip-clipped-1600px.jpg`). v8 showed PLAY at this width. Fix: let `.st-control-strip` wrap to two rows, or move the transport to its own row under the Wada strip.

**D3 — `say` caption collides with the legacy beat label.** `studio-two-renderer.js:298` draws the say at (18, H−22); `studio-motion-engine.js:990` draws "1 · QUERY ARRIVAL" at (16, 288). Both print in 10–11 px uppercase mono, so every card shows "YOUR AI IS SMART, BUT IT CANN" over "OT TOUCH YOUR FILES." over "1 · QUERY ARRIVAL" (`04-…`). Fix: suppress `beatLabel` when a v9 beat is active; render say in sentence case at ≥14 px on a paper plate; cap the draw-on so the full line has landed by `tMidSec` (today ~3.3 w/s on 2-s beats leaves half the line un-typed at the card's sample time).

**D4 — `show` ≠ drawn.** The MCP board borrows `s_retrieve` (12-s loop) and the planning board `s_filter`, so no beat depicts its own sentence, the breather is the busiest frame on the sheet (`05-v9-beat5-breather-vecON-960.jpg`: answer card, 3 sources, 9 folios), and the 12-s storyline drifts against 14/16-s boards ("8 · CALM CALLBACK" shows at the breather, "3 · SALIENCE IGNITION" at the landing). Fix: either draw minimal two.js scenes per `show` (drawer/adapter/cards are 3 primitives) or rewrite `show` to describe what the whale scene actually does.

**D5 — Score pumps every second.** `INST.pad` (`studio-music-engine.js:399`) restarts its ADSR from 0.0001 at each 1-s chord change with a 0.3-s attack; measured holes (<−38 dBFS, ≥100 ms) at 0.8, 1.8, 2.8 … 12.8 s, 150–250 ms each. Fix: voice-lead the pad legato (retune oscillators, one envelope per beat) or overlap chords by 120 ms.

**D6 — Breather is a dropout, not a hold.** 7.8–8.5 s and 9.2–10.0 s sit at −45 to −91 dBFS; "pad-only-hold" at dyn 0.3 through a 890 Hz lowpass is inaudible. Listeners will think the audio broke. Fix: breather pad floor ≥ −32 dBFS (raise `0.12·(0.5+dyn)` floor or bypass the per-chord retrigger).

**D7 — Loop hard-cuts at 14.0 s.** Level −22 → −180 dBFS in one 50-ms window, then the hook restarts; the planned 1.5-s `tailSec` never plays in loop mode. Fix: loop at `endSec` with a 300-ms crossfade, or hold the resolve chord through the restart.

**D8 — Score is 12 dB under its own target.** Integrated −25.8 LUFS (ffmpeg ebur128), music-only −24.7 dBFS RMS, peak −11 dBFS. SFX pop partly because the bed is quiet, not because of the duck. Fix: raise `mix.music` to ~0.7 and let the compressor work; keep the duck law.

**D9 — Callback is not audible.** `plan.callback` says plant 1.0 s / return 12.0 s, but music RMS at 12.0–12.5 s equals the preceding half-second (−22.5 vs −22.5 dBFS); the FM bell is buried under the peak-section pluck/kick. Plant at 1 s is +2.3 dB — marginal. Visually the plant ("locked drawer") is a 9-px pill in beat 2 only. Fix: duck the bed −4 dB under the return bell and give the plant/return mark a spotlight on both beats.

**D10 — Grammar drift and small clips.** MCP board has 7 beats and no second claim (contract: 8, hook·claim·proof·proof·breather·callback·claim·landing); planning board has no `callback` grammar beat (only `returns` on the landing). "3 · SALIENCEIGNITION" loses its space; the push-in camera clips "Q · what changed in v2?" to "hat changed in v2?" in beat 2; "Retrieve the few pages that matter." overprints "BEAT 7/7 · CAM PULL-BACK"; vector pill labels still show in NO-TEXT mode. Fixes are one-liners each.

## Wording: 5 weakest lines

1. "Same adapter, any drawer: calendar, database, your inbox." (grade 11, list-colon) → "One adapter opens every drawer: calendar, files, inbox."
2. "An MCP server is a plug adapter for tools." (two nouns stacked) → "An MCP server is a plug that fits any tool."
3. "The AI picks one and the server does it." → "The AI picks one. The server does the work."
4. "Students guessed 34 days. Average: 55." (reads like a table cell) → "Students guessed 34 days. It took 55."
5. "So take a second with it." (because-line, vague) → "Let it sink in."

Jargon-without-parenthesis count on both boards: 0 beyond the subject nouns MCP/server/database. Vocab modal: 0 of 51 titles lack a plain-English pair.

## Storyboard read

To a newcomer the MCP sheet reads hook→claim→proof→proof→breather→callback→landing from the badges, say lines and because-lines alone — the text layer works. The pictures do not: no beat draws a drawer, adapter, or plug; the breather is the fullest frame; the landing end-card hides the character. The callback is planted as a 9-px "Locked Drawer" pill (beat 2, not beat 1) and returns as a 1-s bell nobody can hear (D9). One idea per beat holds in text; in picture, beats 3 and 7 carry 4–5 ideas.

## Would the owner like the music now?

Probably not yet, from the measurements rather than the code. Positives: it is music, not a drone — a 6-note motif, a Mixolydian key picked from the palette, a 104-bpm groove with kick/hat/pluck, a planned dynamic arc (hook −24 → breather −33 → callback −22.7 dBFS), and the duck is textbook (−6 dB, 320 ms, every cue), so SFX genuinely pop. Negatives he will hear in the first 10 seconds: a hiccup at every chord change (D5), the bed dropping to silence at the breather (D6), a hard cut at the loop (D7), and a mix so quiet (−26 LUFS) that it reads as "background noise" rather than a score (D8). Listen: `work/eval-v9/v9-score-30s.ogg`. D5–D8 are mix/envelope fixes, not composition fixes.

## Verdict

**ACCEPT-WITH-FIXES.** v9 dominates v8 on wording, messaging, music and SFX pop, but regresses on visuals/WOW and storyboard; under a strict dominance rule that is RETAIN-OLD, and I would retain v8's Surface IV only if D3 and D4 cannot be fixed. Blocking before ship: D1, D2, D3, D5, D6 (all ≤1 day). D4 is the structural risk — the owner asked for a clear storyboard and the pictures currently tell a different story than the words.
