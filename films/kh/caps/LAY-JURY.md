# O2: lay-viewer jury (wide-audience obviousness)

Run this after an episode's gates pass and before it is rendered. Use three fresh agents, one per persona. Each sees ONLY the episode's 1-second contact sheet: no title, no notes, no topic, no repo files.

**Personas**
- A retired primary-school teacher, 68, who uses email and WhatsApp.
- A hospital nurse, 41, who has heard of ChatGPT but never used it at work.
- A small-shop owner, 55, who keeps the books in a spreadsheet.

**Persona prompt** (fill in PERSONA and SHEET):
> You are PERSONA. You are watching a short silent animated clip on your phone; here it is as a strip of stills, one per second, left to right, top to bottom: SHEET (open it with the Read tool and look at nothing else — do not open any other file). Answer in your own everyday words, briefly:
> 1. What went wrong for someone at the start?
> 2. What fixed it?
> 3. If this were your job, what would you do differently on Monday?
> 4. Which word or picture didn't you understand, if any? Quote it exactly.
> 5. How sure are you about 1 and 2 (0–10)?

**Grading** (by the orchestrator, against the episode's `EPISODE.INTENT`). Revised 17 Oct 2026 after four episodes and nine runs.
- Score each persona's answers to questions 1 and 2 as 1 (same idea as `INTENT.problem` / `INTENT.move`), 0.5 (partly) or 0 (wrong or missing).
- **Pass** needs all of the following:
  - every persona scores 1 on both questions;
  - the mean confidence is ≥ 7/10;
  - no unclear item names a word or symbol the INTENT depends on (the problem's object, the fix's action, or the AI's role).
- **Other unclear items** are polish findings, such as the lockup, a card's fine print or a fast caption. They are fixed before render when cheap and logged when not.
- **Why the strict "zero unclear words" rule was dropped:** lay viewers always quote something, including the series lockup. Under that rule no film can pass, so the rule could not tell films apart.
- **Fail:** fix what was misread, re-run O1 and O2, and render only after the film passes.
- Record answers and scores in `<slug>/LAY-JURY.json`.
