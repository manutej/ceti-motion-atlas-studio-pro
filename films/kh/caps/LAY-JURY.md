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

**Grading** (by the orchestrator, against the episode's `EPISODE.INTENT`)
- Score each persona's answers to questions 1 and 2 as 1 (same idea as `INTENT.problem` / `INTENT.move`), 0.5 (partly) or 0 (wrong or missing).
- **Pass:** every persona scores ≥ 0.5 on both questions, the average is ≥ 0.8, and no on-screen word is quoted in question 4.
- **Fail:** fix what was misread, re-run O1 and O2, and only then render.
- Record the answers and scores in `<slug>/LAY-JURY.json`.
