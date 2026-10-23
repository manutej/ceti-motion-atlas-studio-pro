# motion-brief — the `work/BRIEF.md` template

The owner's 9-element film spec (`docs/rsi/FILM-SPEC-9.md`) as a fill-in brief. Headings are verbatim and in order; `brief-check.mjs` finds them by `## N. <title>` and fails a missing, renamed, blank or still-`<slotted>` section.

motion-brief **owns §1–§6** (interview). §7–§9 are written with the defaults below, which the sibling skills consume; the owner may override any line. Every `⟂` line is machine-checked here and again by motion-soup's FS gates (`skills/motion-soup/references/gates.md` §Film-spec gates).

**OPEN rule.** A slot the owner leaves blank is asked once, in the single batch. If the answer does not come, write `- OPEN: <the question, verbatim>` in that section — never a guess, never an invented logline. `brief-check` prints it as an `OPEN` line. With `--ready`, an OPEN line in §4–§7 fails: those sections feed gates that cannot run on nothing, so the round does not start.

No colour, font, easing, tempo or duration appears in this template. Colours are token roles (`color.<role>` from `work/tokens.resolved.json`); durations live in the beat sheet the owner approves.

---

```markdown
# FILM BRIEF — <title> (round K)

## 1. Film in one line.
<logline + the joke, ≤ 30 words>
```
- **ask when blank:** "In one line: what is this film, and what is its joke?"
- **checked:** S1 — ≤ 30 words. **read by:** `{{FILM_LINE}}` in every motion-soup prompt; motion-critique scores against it; motion-deliver restates it on README line 1.

```markdown
## 2. References.
- source video: <url or path | none>
- song / score reference: <url or path | none>
- image library: <path>
- prior work repo: <url + what to keep | none>
- keep: <3 lines>   push: <3 lines>
```
- **ask when blank:** "What should this look and sound like — one video, one song, one image set, one prior repo — and what do we keep vs push?"
- **read by:** motion-soup step 0 (host reads, audit set); the "keep" lines are tie-breaks for the vector and music lanes.

```markdown
## 3. Tools & keys.
- skills to load: <names>
- APIs available: image <y/n · key env> · video <y/n> · voice <y/n>
- docs live at: <path>
- Spend it economically → budget { agentCalls: <n>, wallMin: <n> }
```
- **ask when blank:** "Which skills and APIs may the round use, where do the docs live, and how much may it spend — agent calls and wall minutes?"
- **read by:** motion-soup's stop rule (step 11) and every per-agent tool-call budget.

```markdown
## 4. Character bible.
- bible: character-bible.json
- proportions: <one line per character>
- palette: <reference sheet path | resolved tokens> → roles only
- expressions: <≤ 6 per character, each tied to a grammar role>
- identity lock ⟂: <the 3 invariants that survive every style change>
- bible hash: sha256:<64 hex, from brief-check --hash>
```
- **ask when blank:** "Who is on screen — proportions, palette sheet, expressions — and which three things about them must never change when the style does?"
- **checked:** BIBLE-shape (roles only, ≤ 6 expressions whose triggers exist on the board, exactly 3 lock lines), BIBLE-roles (every role resolves in the tokens file), BIBLE-hash (this line equals the canonical-JSON sha256). **read by:** FS-identity — every motion-soup `stage` row and the `verdict` row carry this hash.

```markdown
## 5. Beat sheet.
| # | act | start s | dur s | grammar | say | payoff ⟂ | textBox ⟂ |
|---|-----|---------|-------|---------|-----|----------|-----------|
| 1 | I | 0 | <s> | hook | <≤ 12 words> | ✓ @<s> | x,y,w,h |
hook ≤ 2 s ⟂ · payoff every 3–5 s ⟂ · exported to beats.json (show / hear / because live there)
```
- **ask when blank:** "What are the acts with timestamps, where is the hook inside the first two seconds, and where does the viewer get a visual payoff every three to five seconds?"
- **checked:** S5 (names beats.json) and every B-* check on the JSON (`references/beat-grammar.md`). **read by:** FS-hook, FS-cadence; the wording lane reads `say/show/hear/because`.

```markdown
## 6. Text on screen.
- huge (lyric / headline) at beats: <#s | none>
- subtitle-sized at beats: <#s>
- reserved text box per `say` beat ⟂: <where; the textBox fields in beats.json>
- composition rule: <one line — what may never sit under the text>
```
- **ask when blank:** "When do words go huge, when do they sit like subtitles, and where exactly is the room the composition leaves for them?"
- **checked:** S6 (huge / subtitle / composition rule), B-textbox. **read by:** FS-textroom — the vector layer's audit must find each box empty of other marks.

---

### Defaults for §7–§9 (written by motion-brief; owner may override)

```markdown
## 7. Workflow gates.
plan → rig → stills → animatic → full pass → polish → audio → render ⟂
- this round covers stages: plan, rig, stills, animatic   previous rounds reached: none
```
- **ask only if the owner wants to change it:** "Which of the eight stages does this round cover, and which stage did the last round reach?"
- **checked:** S7 — one line reads the eight stages in this order. **read by:** FS-gateorder (motion-soup ledger `stage` rows).

```markdown
## 8. Critique loop.
- axes scored 1–10: hook, cadence, readability, identity, music fit, polish
- stills per pass: one per payoff mark   exit ⟂: every axis ≥ 8
- who fixes: hook, cadence → wording · readability → vector · identity → rig · music fit → music · polish → integrator
```
- **checked:** S8 — the exit rule is "every axis ≥ 8". **read by:** motion-critique (scores, worst 3, fixes) and FS-critique.

```markdown
## 9. Deliverables.
- dir: work/deliver/<board key>/
- final MP4 ⟂ · loop check ⟂ · poster frame ⟂ · contact sheet ⟂ · clean source + README ⟂
- extras: none
```
- **checked:** S9 — all five named. **read by:** motion-deliver and FS-deliverables.

```markdown
## defaults taken
- <which §7–§9 lines are defaults; which OPEN lines went to the ledger>
```
