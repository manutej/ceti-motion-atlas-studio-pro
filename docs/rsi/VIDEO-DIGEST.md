# VIDEO-DIGEST — "Claude Opus 5.5 Just Solved Motion Graphics (No More AI Slop)"

Bart Slodyczka · YouTube `6Ij9-f2T2Ck` · published 2026-09-25 · 12:22 · no chapters on the page.
Companion repo: `Barty-Bart/motion-graphics` (read-only clone at `/home/claude/barty-bart/motion-graphics`); the video demos the `motion-broll` skill, and the repo's `examples/opus-aoe2/` is the exact six-clip project shown.

**Transcript: NOT obtained.** YouTube served a bot-protection page (metadata only, no captions); `youtubetranscript.com` was blocked by the fetch permission layer (not retried); web search found only re-posts of the description and one unrelated article about a different skill. Nothing below is quoted from speech. The method is reconstructed from the description, the repo README and `skills/motion-broll/SKILL.md`, which the video walks through.

## What the description claims

- "I created a skill that makes Claude Opus 5.5 absolutely insane at Motion Design."
- The graphics are "polished" and "match the rhythm of your words".
- "a new technique where each shape is continuous and fuses into the next" — the one-shape-never-cuts style.
- "Opus 5.5 + my skill make this entire process so easy." No speed numbers, no benchmarks, no before/after scores are given anywhere.

## The method, as the companion skill runs it

1. **Set up once.** Node 18+, Python 3, ffmpeg; Playwright + Chromium installed into a local `motion/` folder. Everything is a local tool; nothing is uploaded.
2. **Interview in one round.** Video path, transcript (SRT/VTT with timestamps; else `faster-whisper` for word times), density (light 2–4 / medium 4–7 / heavy clips per minute), look (default warm-gray canvas + one orange accent, or brand), and what to avoid or include.
3. **Inspect the footage mechanically.** `inspect_video.py` writes a contact sheet and `video.json` with resolution, fps and layout sections (full / pip / black, with the PiP box position and a warning if it moves). `words.py` flattens the transcript to word times (treated as ±0.2 s estimates).
4. **Plan in a table and stop for approval before any code.** One row per clip: in–out, the spoken line, what the shape does *on which words*, treatment, why. The creative call is per clip: full-frame cutaway (3–10 s, never in the first second of the hook, ≥2 s of face between), transparent panel in the empty PiP space (can run 15 s+), or nothing. Content rules: show the subject's real objects; never invent numbers; one idea per clip; pace to speech, one change per spoken beat, 0.4–1.2 s apart.
5. **Build each clip as a small HTML fragment** on a shared engine: one shape with `SH` states (w, h, radius, colour, camera zoom), a `SEQ` of `[time, state]` pairs put on the words, layers with `tin/tout`, a cursor with clicks and drags. Every value is a closed-form spring of `t`; no CSS transitions, no timers.
6. **Check stills on the key words.** `beats.js` renders a contact sheet at chosen times (settled states plus mid-morphs). "Look at every sheet yourself. Fix anything cramped, clipped, unreadable or off-word. Then check once more."
7. **Render frame by frame with motion blur.** Headless Chromium shoots 4 sub-frames over a 180° shutter per frame; ffmpeg blends them. Panels go to ProRes 4444 `.mov` with alpha; files are named by timeline in-point (`04-master-prompt_0m32s40.mp4`).
8. **Deliver for the editor, not as the final cut.** `plan.json` → `composite.py` makes a preview with hard cuts and original audio; `make_pages.py` makes `viewer.html` (step through clips) and `compare.html` (original vs preview, side by side / stacked / wipe); `TIMING.md` lists every clip, its line and what is illustrative. The user places the clips in their own NLE.

## Quality mechanics the video is selling (reconstructed)

- **Continuity over cuts.** One element morphs through pill → card → terminal → chart; content swaps with a short blur; a cursor with real clicks motivates every change. This is what "no more AI slop" means in practice: no template cuts, no particles, no glows, no bouncy easing, no made-up data (all explicitly banned in the skill).
- **Rhythm = speech, not music.** State changes land on spoken words taken from the transcript; important changes sit on the first or last word of a caption cue because SRT timing drifts inside a cue.
- **Frame = f(t).** Springs are closed-form step responses summed per target change, so any frame renders alone, which is what makes sub-frame motion blur possible.
- **Human in the loop at two fixed points:** plan approval before code, and the creator's own eyes on contact sheets before render. There is no scored critique loop and no "repeat until ≥ N" rule — that is where our FS-critique gate is stronger.

## Eight quotable lessons (paraphrased; no transcript)

1. One shape that never cuts beats ten cuts that never connect.
2. Put every change on a spoken word; the transcript is the timeline.
3. Decide per clip: cut away, panel beside the face, or nothing.
4. Never invent numbers; bars stay relative, text stays skeleton until sourced.
5. Approve the plan table before a single line of code.
6. Render stills on the key words and look at every sheet yourself.
7. Frames must be pure functions of time, or motion blur is impossible.
8. Deliver clips for the editor; the preview is for review, not shipping.

## Not in the video or repo

No critique scoring, no measured sound inside `motion-broll` (that is the separate `sound-effects` skill), no Remotion, no two.js, no music beat-locking for B-roll. The `explainer-*` skills are the music-locked siblings; see `BART-REPO-AUDIT.md`.
