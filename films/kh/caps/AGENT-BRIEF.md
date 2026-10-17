# Brief for an episode builder (CETI Capabilities)

You are building ONE ~25 s motion-graphics episode in an existing, working canvas pipeline. Repo root: `/home/claude/ceti-motion-atlas-studio-pro/films` (call it FILMS). Work ONLY inside `FILMS/kh/caps/<slug>/`. Do not edit any other file, do not run git, and do not render the full MP4: the orchestrator does that. CPU is shared with four other builders, so keep stills and sheets modest.

## Read first (in this order)
1. `FILMS/kh/caps/SERIES.md`: the format, plus your row in the episode table (title, Wada, BPM, mechanism, ending, belief, "not this").
2. `FILMS/kh/caps/RESEARCH.md`: your capability's section. Stay inside its accuracy cautions; on-screen wording should use Manu's own vocabulary.
3. `FILMS/kh/kh-kit.js` (tokens, `mix`, eases, `text`, `win`, `ramp`, `rng`), `FILMS/kh/whale-rig.js` (`KH.drawWhale` options incl. focus/delight/spark/blink/mouth/fin/tail/squash; `KH.drawPod`), and `FILMS/kh/caps/series.js` (`ground`, `chip`, `open`, `caption`, `lockup`).
4. `FILMS/kh/sea/film.js` and `FILMS/kh/sea/score.py`: the best template. Copy their patterns: a Hermite whale path through time keys, `heading` smoothing, `facing`, an eased camera `cam(t)` → {x,y,z,ax,ay}, `READ`, `CONTRAST`, `cues()`, `shutter`.
5. `FILMS/kh/caps/tool.cjs`: the contract your film must satisfy.

## Deliverables in `FILMS/kh/caps/<slug>/`
- `film.js`: an IIFE that sets `globalThis.EPISODE = { drawFrame(ctx,t), cues(), READ, CONTRAST, DUR, W:1920, H:1080, fps:60, shutter(t), wpos, heading, cam }`. `drawFrame` must be a pure function of t: no state carried between frames, and randomness only via `KH.rng(seed)` at load time. Begin each frame with `KH.SERIES.ground(c, t, cam(t), {tint: <your main Wada colour>})`, use `KH.SERIES.open` for the opening card, `KH.SERIES.caption` for captions, and `KH.SERIES.lockup` for the close.
- `score.py`: `python3 score.py cues.json out.wav`. 48 kHz stereo; every sound placed on a cue from `cues()`. Base it on `sea/score.py`'s helpers (mallet, tick, whoosh, pad, reverb send). Keep it musical and sparse; give it a signature sound for your episode's mechanism.
- `NOTES.md` (short): the beat sheet with times, the station words used, and known weaknesses.

## Hard rules (the gates check most of these: `node FILMS/kh/caps/tool.cjs <slug> gate`, which must print GATES PASS)
- **Read time:** every entry in READ ({id,in,out,fi,fo,text}) is fully visible for ≥ 0.6 s + 0.15 s per word. Put every caption, title and station word in READ.
- **Frame jump:** the whale moves ≤ 30 px per frame on screen and its heading ≤ 0.35 rad per frame (the gate uses `wpos`, `heading` and `cam`). Fast but readable.
- **Contrast ≥ 4.5:1** for every text/ground pair you list in CONTRAST, and you must list every pair you draw. Text is ink (`C.navy`) or slate on paper, or on a `SERIES.chip`. Never put text on a Wada fill. For an accent colour in text, `mix(wada, C.navy, k)` until it passes.
- **Colour provenance:** no hex literals at all. Use only `KH.CETI.*`, `KH.WADA[n]`, `KH.W.*`, `KH.NEUTRALS`, or `mix()`/`rgba()` of them.
- **Flash safety:** no full-frame luminance flashes. Keep the ground light all the way through.
- **Eases:** CETI eases only (`EASE.glaser/warm/defer/collect/rest`). No bounce or elastic. Snaps are a fast glaser plus a small squash on the whale, not a spring.
- **Layout:** nothing overlaps a caption (captions sit at y≈990). The whale never covers a word it is "landing" on: perch above or beside it. Labels sit on chips or on clean paper.
- **Honesty:** show the "not this" line on screen (a short caption beat before the end belief). Use real numbers from RESEARCH.md only where they are clearly framed (e.g. "Context Atoms: 41 atoms · GREEN"). Never invent statistics.
- **Ending:** use your episode's own ending pattern from SERIES.md, then the end-belief caption, then `SERIES.lockup` from about DUR−2.2 s, holding to DUR.

## Quality loop (do it, don't skip it)
1. Write a beat sheet in NOTES.md first (times on the BPM grid, ≈ 24–28 s).
2. Build. Run `node FILMS/kh/caps/tool.cjs <slug> gate` until it passes.
3. Render a contact sheet: `node FILMS/kh/caps/tool.cjs <slug> sheet /tmp/<slug>-sheet.png 1.0`. Then LOOK at it with the Read tool. Also render `stills` at your key moments. Critique it brutally:
   - Is the mechanism obvious with the sound off?
   - Is there one clear focal point per moment?
   - Is the text readable? Is anything colliding?
   - Is the chart ground visible but quiet?
   - Is the ending distinct and satisfying?
   - Does the whale have character (expressions: focus while working, delight or spark on the payoff)?
4. Iterate at least twice on what you see. Simplicity beats density: the user said "keep it REALLY simple" and "stunning".
5. Smoke-test the score: `node FILMS/kh/caps/tool.cjs <slug> cues /tmp/<slug>-cues.json && python3 FILMS/kh/caps/<slug>/score.py /tmp/<slug>-cues.json /tmp/<slug>.wav`.

## Report back (≤ 250 words)
Include: final gate output lines, the contact-sheet path, the beat sheet in one line per act, what you'd improve next, and anything in the shared files you think should change. Don't change those files yourself.
