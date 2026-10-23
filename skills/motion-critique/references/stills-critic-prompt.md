# Stills critic — prompt template (verbatim, `{{slots}}`)

Lifted from motion-soup `references/prompts.md` §4b and tightened for the standalone loop. One critic per pass, spawned
fresh each pass (a critic that scored pass P-1 has seen the old frames and anchors on them). It is the only agent in
the set that sees renders, and it sees nothing else.

## Slots

| Slot | Filled from |
|---|---|
| `{{REPO}}` | repo root |
| `{{K}}` / `{{P}}` | round number (ledger) / critique pass number, 1..4 |
| `{{FILM_LINE}}` | brief §1, verbatim |
| `{{BRIEF_LINES}}` | brief §1, §5, §6 and §8, verbatim (the lines the stills are judged against) |
| `{{STILLS_DIR}}` | `work/stills/r{{K}}/p{{P}}` — written by `scripts/stills.mjs` |
| `{{STILL_LIST}}` | the filenames in that dir, one per line, with what each is (hook · payoff n · landing) |
| `{{AXES}}` | `critique-check.mjs --axes-from work/BRIEF.md` → `axes` (never typed by hand) |
| `{{FIXERS}}` | same call → `fixers` (axis → lane) |
| `{{CRITIC_MODEL}}` | judgement tier (the planning/evaluation model the owner routes evaluation to) |

## Prompt

```
Agent({ description: "critique r{{K}} p{{P}} stills critic", subagent_type: "general-purpose", model: "{{CRITIC_MODEL}}", prompt: `
Repo: {{REPO}}. Round {{K}}, critique pass {{P}}. Score the rendered stills against the film.
You see the stills and the brief lines below ONLY. Do not open module source, test output, the ledger
(work/soup-ledger.jsonl), earlier critique files, or any other file in the repo. Do not run commands.

FILM: {{FILM_LINE}}
BRIEF (the lines you judge against):
{{BRIEF_LINES}}

STILLS: {{REPO}}/{{STILLS_DIR}}/ — filename = time in seconds. Read every one (Read shows images):
{{STILL_LIST}}

AXES (score each 1–10, integers only): {{AXES}}
  10 = nothing a stricter critic would change · 8 = ships · < 8 = a named problem you can point at in a still.
WHO FIXES (axis → lane): {{FIXERS}}

DELIVERABLE: {{REPO}}/work/critique-r{{K}}-p{{P}}.json — exactly this ledger row, nothing else in the file:
{ "round": {{K}}, "kind": "critique", "pass": {{P}},
  "stills": ["{{STILLS_DIR}}/<file>.png", ...every still you read],
  "scores": { "<axis>": int, ...one per axis above, no others },
  "worst3": [exactly 3 strings, lowest-scoring first: "<file>.png: <axis> — <what is wrong> (<brief line it breaks>)"],
  "fixes":  [exactly 3 strings, fixes[i] answers worst3[i]: "<lane>: <one concrete change>"],
  "minutes": n }

RULES
- Every axis scored < 8 is named (by axis word) in at least one worst3 item. If all axes are >= 8, worst3 still
  names the three weakest spots — the loop exits, the notes become the polish list.
- Every worst3 item names one still by its filename.
- A fix names the lane WHO FIXES maps for the axis it addresses, and one change a single candidate can make under
  that lane's contract (a duration, a position, a word, a transition, a curve) — never "make it better", never a
  reskin, never a new design token value.
- Judge what is on screen at that instant: a caption that will be readable "later" is unreadable now.
- Nothing in the stills is fixed by you.
Budget <= 15 tool calls. REPORT <= 6 lines: 1 file · 2 scores on one line · 3 worst3 · 4 fixes · 5 exit? (all >= 8 → yes | no) · 6 minutes.
` })
```

## Why it is blind

The critic's score is the only evidence the frames are good that does not come from the agents who made them. If it
reads the source it scores intentions; if it reads test output it scores the gates; if it reads the ledger it scores
the trend. Each of those inflates. `critique-check.mjs` rejects a row that cannot be tied back to a still filename,
which is the cheapest proof the critic looked.
