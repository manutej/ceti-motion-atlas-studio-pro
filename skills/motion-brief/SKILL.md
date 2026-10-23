---
name: motion-brief
description: Write the brief every animated explainer or motion graphic starts from — the owner's 9-element film spec as work/BRIEF.md, a storyboard as work/beats.json (HOOK → CLAIM → PROOF → BREATHER → CALLBACK → LANDING), and a hashed character bible — then prove it with a dependency-free checker (hook in 2 s, a payoff every 3–5 s, one breather, every claim proved, ≤ 12-word lines, grade ≤ 8, room for on-screen text). Use it whenever the user says "brief", "film brief", "storyboard", "beat sheet", "logline", "character bible", "identity lock", or asks to plan an explainer, animation, animated video or motion graphic, and as the intake step before motion-soup, motion-critique and motion-deliver.
---

# motion-brief

Intake for the four-skill motion set: **motion-brief** (this: what the film is) → **motion-soup** (parallel build loop) → **motion-critique** (stills scored to 8+) → **motion-deliver** (MP4 and deliverables). This skill owns items 1–6 of the owner's film spec (`docs/rsi/FILM-SPEC-9.md`) and writes defaults for 7–9 that the sibling skills read. Everything downstream reads the three files it produces; nothing downstream re-asks the owner.

Read `references/brief-template.md` before writing the brief (the nine sections, the question to ask for each blank slot, who reads each line). Read `references/beat-grammar.md` before writing `beats.json`. `examples/` holds a passing brief, board and bible made from the repo's `v9-mcp-server` board.

## When to use

- A new explainer, animation or motion graphic, before any rendering or agent fan-out.
- An existing film whose brief is missing sections, whose board fails the hook or rhythm checks, or whose character drifted between styles.
- motion-soup step 0 finds `work/BRIEF.md` absent or not in the nine-section shape.

Do not use for a one-off still, a fix inside one module with an already-passing brief, or prose with no film behind it.

## Outputs

| File | What | Read by |
|---|---|---|
| `work/BRIEF.md` | the nine sections, in order, verbatim headings | every sibling skill; motion-soup's FS gates |
| `work/beats.json` | the board in the storyboard-grammar schema | FS-hook, FS-cadence, FS-textroom; the engine (G33, G37) |
| `work/character-bible.json` | proportions, palette roles, expressions, identity lock | FS-identity via its hash |
| `work/tokens.resolved.json` | resolved design tokens (made by motion-soup's runner) | the bible's palette roles; every lane |

## The run

**1. Resolve tokens first (1 min).** The skill carries no colour, font, tempo or duration. Resolve them from the host:
```
node skills/motion-soup/scripts/soup-runner.mjs resolve-tokens <source>... --out work/tokens.resolved.json
```
Sources: `css:<file>`, `json:<file>`, `wada:<id>[@<engine.js>]`, `cjs:<file>#<export>`; later override earlier. If the owner supplies a **reference image or character sheet**, look at it, sample one swatch per part (body, outline, eyes, props, ground), write those samples to `work/palette.sampled.json` in the tokens JSON shape (`{ "color": { "<role>": … } }`), and pass it as the **last** source (`json:work/palette.sampled.json`) so the sheet wins. Sampled values live only in `work/`; the bible names roles.

**2. Read what already exists (2 min).** The owner's message, any attached video / song / images / repo, an existing `work/BRIEF.md`, and any board already in the host (for this repo: `V9_STORYBOARDS` in `studio-canvas-oauth.js`). Copy the template block from `references/brief-template.md` into `work/BRIEF.md` and fill every slot the material already answers. Quote the owner; do not paraphrase a logline into something he did not say.

**3. Interview — one batch, once.** Collect every slot in §1–§6 that is still blank and ask the template's question for each, **in section order, in one message**. Close the batch with one line offering the §7–§9 defaults: "I'll use the standard ladder, critique axes and five deliverables unless you want to change them." Then:
- Never invent a logline, a joke, a reference or an identity lock.
- If the owner is away or a slot stays blank, write `- OPEN: <the question>` in that section and move on. Write each OPEN to the ledger:
  `node skills/motion-soup/scripts/soup-runner.mjs ledger add '{"kind":"open","round":<K>,"text":"<question>"}'`
- Do not ask the same slot twice in a round.

**4. Character bible + identity lock.** Write `work/character-bible.json` (shape: `examples/character-bible.json`):
- `characters[]`, each with `proportions` (ratios, one line per part), `palette` (part → `color.<role>`; roles only, never a colour value), `expressions` (≤ 6, each `{name, trigger}` where `trigger` is a grammar role that exists on the board), `identityLock` (exactly 3 invariants that survive any style change).
- `tokens`: the path of the resolved tokens file; `paletteSource`: where the roles came from (sheet path or token sources).
- Hash it and write the hash into §4 as `bible hash: sha256:…`, plus `bible: character-bible.json`:
```
node skills/motion-brief/scripts/brief-check.mjs --hash work/character-bible.json
```
The hash is the identity lock made checkable: motion-soup's `stage` rows carry it as `bibleHash`, and any later row with a different hash fails FS-identity. Change the bible only by re-running this step and saying so in the ledger.

**5. Beat sheet + text on screen.** Write `work/beats.json` per `references/beat-grammar.md` and mirror it as the §5 table (`#, act, start, dur, grammar, say, payoff, textBox`). Build it in this order, because each rule constrains the next:
1. The hook: ends by 2 s, or lands its payoff by 2 s. Give it a `plant`.
2. Claims, each followed by 1–3 proofs whose `claimId` names it.
3. Payoff marks: `payoff: true` on the beats that land a visual change; consecutive marks 3–5 s apart, the last within 5 s of the end. Adjust `dur`, never the spec.
4. Exactly one breather — not first, not second, not last, no payoff.
5. The callback (or landing) `returns` the hook's plant; the landing's `show` echoes frame 0.
6. `say` ≤ 12 words and grade ≤ 8 for `say + show`; split a beat rather than stretch it.
7. A `textBox` on every beat with words; §6 says which beats go huge, which sit as subtitles, and the one composition rule (what never sits under the text).
Durations come from the owner's beat sheet or the existing board — never from this skill.

**6. Write §7–§9 defaults.** Use the default blocks in `references/brief-template.md` (ladder plan → rig → stills → animatic → full pass → polish → audio → render; six critique axes with exit "every axis ≥ 8"; the five deliverables in `work/deliver/<board key>/`). Apply any override the owner gave. List every default and every OPEN under `## defaults taken`.

**7. Check — the only judge.**
```
node skills/motion-brief/scripts/brief-check.mjs work/BRIEF.md work/beats.json --ready
```
One line per check: S1–S9 (sections present, in order, filled or OPEN; logline ≤ 30 words; §5 exports beats.json; §6 huge / subtitle / composition rule; §7 ladder in order; §8 exit ≥ 8; §9 five deliverables), BIBLE-shape / BIBLE-roles / BIBLE-hash, and B-timing, B-roles, B-hook, B-cadence, B-breather, B-claim-proof, B-plant, B-say, B-grade, B-names, B-textbox. Exit 0 means hand off. On FAIL: fix the named line, re-run; ≤ 3 repairs, then stop and show the owner the FAIL lines. A FAIL caused by an OPEN in §4–§7 is not repairable by you — it goes back to the owner.

Prove the checker before trusting it on a new machine: `node skills/motion-brief/scripts/brief-check.mjs --selftest` (base example clean; every negative mutation caught).

**8. No literals.** Before handing off, confirm the skill and the bible carry no colour values:
```
node skills/motion-soup/scripts/soup-runner.mjs check-literals skills/motion-brief work/character-bible.json
```

## Rules

- **Never guess for the owner.** A missing logline is an OPEN line, not a draft. You may propose a logline only when he asks for options, and label it "proposal".
- **Roles, not values.** No hex, rgb, font name, bpm or easing in the brief, the bible or this skill. Durations live in the board.
- **One idea per beat.** If `say` needs "and", split the beat.
- **The checker decides.** A brief is done when `brief-check --ready` exits 0, not when it reads well.
- **The hash is sacred.** Never edit `character-bible.json` after hashing without re-hashing, updating §4 and writing a ledger row that says why.
- **Stay in the frame.** This skill writes `work/BRIEF.md`, `work/beats.json`, `work/character-bible.json` and (if sampling) `work/palette.sampled.json` — nothing else.

## Report (≤ 8 lines)

Film line (or OPEN) · beats and length · payoff marks and gaps · bible hash (first 12 hex) · brief-check result line · OPEN items · defaults taken · next skill.

## Hand off to motion-soup

When `brief-check --ready` exits 0, start **motion-soup**. Its step 0 reads `work/BRIEF.md` as-is (no re-interview), runs FS-hook and FS-cadence on `work/beats.json`, and writes the first ledger row with this brief's bible hash:
```
node skills/motion-soup/scripts/soup-runner.mjs ledger add '{"kind":"stage","round":<K>,"stage":"plan","pass":true,"minutes":<m>,"bibleHash":"sha256:…","artifacts":["work/BRIEF.md","work/beats.json","work/character-bible.json"]}'
```
§3's "Spend it economically" line is its budget; §7 is its stage ladder; §8 is what motion-critique scores; §9 is what motion-deliver ships. If the owner changes §1–§6 mid-run, come back here, re-run step 7, and re-hash if §4 moved.
