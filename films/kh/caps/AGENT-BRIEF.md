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

## Wide-audience obviousness (added 17 Oct 2026, required for every new episode)

Manu: "make sure the idea is obvious to non-AI experts and a wide audience, as part of the eval spec." The audience is a smart adult who has never built an AI system, such as a teacher, a nurse or a shop owner. Two gates:

- **O1 · plain words (mechanical, in `tool.cjs gate`).** Declare `INTENT = {problem, move, belief}` and `TERMS = [{term, pictured_at}]` on `EPISODE`. Once INTENT is declared, the gate requires the following of every READ line:
  - 8 words or fewer.
  - Flesch–Kincaid grade 6 or lower; lines of 3 words or fewer are exempt.
  - No expert word (agent, prompt, context, model, sheaf, operad, Noether, ledger, schema, verify, proof, graph…), unless the word is listed in TERMS and its picture appeared first.
  - Real-run cards may be marked `card: true`. They may run to 14 words, but still with no jargon.
- **O2 · lay-viewer jury (judgement, run by the orchestrator after your gates pass).**
  - Three fresh agents, one each as a retired teacher, a nurse and a small-shop owner, see only the 1-second contact sheet. They are given no title, no notes and no topic.
  - Each writes what went wrong, what fixed it, what they would do differently on Monday, and any word or picture they didn't understand.
  - The episode passes when all three name the problem and the move consistently with INTENT and no on-screen word is reported as unclear. Anything they misread gets fixed before render.
- **Design consequences.** Name the pain the way a person says it ("It sent the refund twice"), not the way an engineer does. Prefer everyday objects (a door, a stamp, a checklist, a sticky note, a receipt). Keep the whale and its helpers. A helper pod is "the helper", not "the agent".

### O2 lessons, first run (Gate v3, three lay viewers, 17 Oct 2026: FAIL)
All three viewers got the gist: "every miss becomes a new check". But every one of them quoted words they didn't understand, and none could say what the gates checked or who the whale and the grey fish were. The rules below come from that run.
1. **Name the actors on screen once.** Say what the moving thing is ("your report"), who the receiver is ("the customer"), and who the whale is ("you" or "the checker"). Icons alone don't read.
2. **Make the abstract concrete.** A property like "colour" or "kind" must be a thing people know: "the page used the wrong font", "the total didn't add up", "a page was missing".
3. **Label every symbol in plain words** the first time it matters. For example, put a word under each gate icon: "spelling", "totals", "missing pages".
4. **No internal names on cards.** Write "Source: our own error log", not "Limits & escapes register". Keep a card up for at least 3 s at 28 px or larger.
5. **Banned words for lay viewers:** run, fold, register, escape, pipeline, "here" without a pointer, and "it" without a referent.
6. **Say what the work is in the first 3 s**, in everyday terms. The viewer must know whether it's a report, an email, a payment or a page.
7. **Say where AI is, once.** Lay viewers keep asking "where does AI fit?". Name the AI on screen exactly once as an actor, for example "Your AI helper", "AI readers" or "the AI checker".
8. **The limit must not contradict the move.** Phrase it as "and also", never "but actually". Write "Zero means: these readers found nothing. Add one new kind of reader.", not "Zero does not mean perfect."
9. **Real-number cards explain themselves in one line.** If a number repeats or looks odd (14, 14, 10, 0), the card says why in plain words ("round 2 found as many as round 1") or the number is left out. The main line is at least 34 px and stays up at least 3.5 s.
10. **No static stretch longer than 2 s.** Nothing should be cropped at the frame edge, and no label should overlap a card.

### O2 lessons, batch 2 (tick v2 PASS, counter v2 and private v4 FAIL, 17 Oct 2026)
11. **Make the AI unmistakably software.** "AI readers" and "Your AI assistant" were read as maybe-people. Prefer "AI app" or "AI helper" next to a non-human icon. "Your AI helper" over the whale passed.
12. **A real-number card must support the story, never complicate it.** A sequence that looks like a second, contradicting example (14 → 14 → 10 → 0 next to a tidy 3 → 1 → 0) confuses everyone. Use one line, and check it against the ledger first: "Real draft: 28 problems, then 10, then 0." (The two 14s were two critics in one round, so "four rounds" would have been false.)
13. **Use the everyday noun.** Say "notes", not "cards"; "email", not "message object". The fix's object word must be the one the viewer already uses.
14. **Show the harm land.** If the problem is a leak or a wrong send, show the thing arriving in the wrong place. Don't just say it happened.
15. **One limit line, plain.** "No stamp? Then the note can still go." beats two clever lines ("It checks the stamp, not the words." / "Plain cards go too.").
