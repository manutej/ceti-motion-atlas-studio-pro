# motion-soup — the film brief (`work/BRIEF.md` template)

Every round starts from a `work/BRIEF.md` that carries the owner's **9-element film spec** (`docs/rsi/FILM-SPEC-9.md`). The nine headings below are verbatim and in order; the orchestrator copies the template block into `work/BRIEF.md`, fills every slot, and runs the blank-slot questions before step 0 of the loop. Lines marked **⟂** are gate-backed: a universal predicate in `references/gates.md` §Film-spec gates reads them, and a brief that leaves one blank cannot pass that gate.

Per section: the **fill slot**, the **question the orchestrator asks** when the slot is blank (asked once, to the owner, verbatim), and **which gate / prompt slot reads it**. Nothing below carries a colour, font, tempo or tool value — those come from `work/tokens.resolved.json` and §3.

---

```markdown
# FILM BRIEF — <title> (round K)

## 1. Film in one line.
<logline + the joke, one sentence, ≤ 30 words>
```
- **ask when blank:** "In one line: what is this film, and what is its joke?"
- **read by:** `{{FILM_LINE}}` in every CANDIDATE / MERGER / CRITIC prompt; every deliverable's `.md` restates it on line 1 and checks each decision against it (prompts.md §1–§4). Not a gate: it is the thing every gate's "why" is checked against.

```markdown
## 2. References.
- source video: <url or path | none>
- song / score reference: <url or path | none>
- image library: <path>
- prior work repo: <url + what to keep | none>
- keep: <3 lines>   push: <3 lines>
```
- **ask when blank:** "What should this look and sound like — one video, one song, one image set, one prior repo — and what do we keep vs push?"
- **read by:** step 0 frame (`{{HOST_READS}}` ranges, audit-set choice); the vector / music lane contracts cite "keep" lines as tie-breaks. Not a gate.

```markdown
## 3. Tools & keys.
- skills to load: <names>
- APIs available: image <y/n · key env> · video <y/n> · voice <y/n>
- docs live at: <path>
- Spend it economically → budget { agentCalls: <n>, wallMin: <n> }
```
- **ask when blank:** "Which skills and APIs may the round use, where do the docs live, and how much may it spend — agent calls and wall minutes?"
- **read by:** the `Spend it economically` line **is** the budget `{agentCalls, wallMin}` that SKILL.md §Inputs names: step 11 stops on it, the `verdict` row's `wallMinutes` is compared to it, every per-agent "Budget ≤ n tool calls" line is derived from `agentCalls / agents`. Not a gate; the stop rule.

```markdown
## 4. Character bible.
- proportions: <head:body ratio, limb lengths as ratios, one line each>
- palette: sampled from <sheet path> → roles only (tokens.color.*)
- expressions: <list, ≤ 6, each with its trigger beat grammar>
- identity lock ⟂: <the 3 invariants that survive every style change>
```
- **ask when blank:** "Who is on screen — proportions, palette sheet, expressions — and which three things about them must never change when the style does?"
- **read by:** **FS-identity** ⟂ — the hash of this section (and of `work/character-bible.md` if the bible is split out) is recorded at the `plan` stage row and must be unchanged at every later stage row and at verdict; the identity-lock test renders the character under two token sets and asserts equal proportions. Skill-added ⟂ (the spec calls it a lock; the gate makes it checkable).

```markdown
## 5. Beat sheet.
| # | act | start s | dur s | grammar | say | show | hear | because | payoff ⟂ | textBox ⟂ |
|---|-----|---------|-------|---------|-----|------|------|---------|-----------|-----------|
| 1 | I | 0 | 2 | hook | … | … | … | … | ✓ @0.8 | x,y,w,h |
hook in the first 2 s ⟂ · a visual payoff every 3–5 s ⟂ · exported to work/beats.json (same fields)
```
- **ask when blank:** "What are the acts with timestamps, where is the hook inside the first two seconds, and where does the viewer get a visual payoff every three to five seconds?"
- **read by:** **FS-hook** ⟂ (first beat ends ≤ 2 s or first payoff mark ≤ 2 s) and **FS-cadence** ⟂ (payoff marks every 3–5 s across the board), both computed from `start`/`dur`/`payoff`; the wording lane contract reads `grammar`/`say`/`show`/`hear`/`because`; `textBox` feeds §6.

```markdown
## 6. Text on screen.
- huge (lyric / headline) at beats: <#s>   subtitle-sized at beats: <#s>
- reserved text box per `say` beat ⟂: <in the beat sheet's textBox column; x,y,w,h in frame units>
- composition rule: <one line — what may never sit under the text>
```
- **ask when blank:** "When do words go huge, when do they sit like subtitles, and where exactly is the room the composition leaves for them?"
- **read by:** **FS-textroom** ⟂ — every beat with a `say`/caption declares a `textBox`, and the vector layer's `audit(t, …, {box})` must report that box empty of other marks at that beat.

```markdown
## 7. Workflow gates.
plan → rig → stills → animatic → full pass → polish → audio → render ⟂
- this round covers stages: <subset, in order>   previous rounds reached: <stage>
```
- **ask when blank:** "Which of the eight stages does this round cover, and which stage did the last round reach?"
- **read by:** **FS-gateorder** ⟂ — the ledger's `stage` rows (`plan|rig|stills|animatic|full|polish|audio|render`) must appear in this order; a `render` row whose predecessor row is missing fails. Don't skip gates.

```markdown
## 8. Critique loop.
- axes scored 1–10: <≤ 6 axes, e.g. hook, cadence, readability, identity, music fit, polish>
- stills per pass: <n, at the payoff marks>   exit ⟂: every axis ≥ 8
- who fixes: <lane per axis>
```
- **ask when blank:** "On which axes do we score the stills, how many stills per pass, and which lane fixes which axis?"
- **read by:** **FS-critique** ⟂ — no `render` stage row until the last `critique` row (`{stills[], scores{axis→1..10}, worst3[], fixes[]}`) has every score ≥ 8. The loop is SKILL.md step 8c: render stills → score → worst 3 → fix → repeat.

```markdown
## 9. Deliverables.
- dir: work/deliver/
- final MP4 ⟂ · loop check ⟂ · poster frame ⟂ · contact sheet ⟂ · clean source + README ⟂
- extras: <none | list>
```
- **ask when blank:** "Where do the deliverables go, and is there anything beyond the five standard ones?"
- **read by:** **FS-deliverables** ⟂ — at the `verdict` row, `final.mp4`, `loop-check.json` (`{pass:true, seamDelta}`), `poster.png`, `contact-sheet.png` and `README.md` exist in the declared dir.

---

## Orchestrator rule for a blank slot

A slot the owner does not fill is asked **once**, with the question above, in the frame step. If still blank: §1–§3 and §8–§9 take the simplest default and the brief says so under a `## defaults taken` footer; §4–§7 cannot default — their gates would fail on an empty slot — so the round does not start. Write the question into the `open` ledger row (`kind:"open"`) so the next round sees what was never answered.

## Where each ⟂ line lands in the loop

| Brief line | Gate | Loop step (SKILL.md) | Ledger row it reads |
|---|---|---|---|
| §5 hook ≤ 2 s | FS-hook | 0 frame (brief), 8 audit (sheet) | `stage: plan` |
| §5 payoff every 3–5 s | FS-cadence | 0, 8 | `stage: plan`, `stage: animatic` |
| §6 reserved text box | FS-textroom | 6 soup gates (vector lane), 8 | `stage: stills` |
| §4 identity lock | FS-identity | every stage row, 9 ledger | `stage: *`, `verdict` |
| §7 don't skip gates | FS-gateorder | 8b stage ladder, 10 accept | `stage: *` |
| §8 repeat until 8+ | FS-critique | 8c critique loop, 10 accept | `critique`, `stage: render` |
| §9 five deliverables | FS-deliverables | 10 accept | `verdict` |
