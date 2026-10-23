# motion-soup — prompt templates (verbatim, `{{slots}}`)

Every template is a complete, self-contained prompt for one `Agent` call. Fill every slot; leave none as `{{...}}`. Workers are Opus 5.5: give them numbered deliverables, exact paths, a verification command they must run, a budget, and a blocked clause. Do not add narrative. Do not paste token values, engine code, or another agent's output.

Shared slots:

| Slot | Meaning |
|---|---|
| `{{REPO}}` | absolute repo root |
| `{{K}}` | round number |
| `{{LANE}}` | `music` · `vector` · `wording` · `transitions` · `typography` · `data-viz` |
| `{{I}}` | candidate id (`A`, `B`, `C`) |
| `{{CONTRACT_PATH}}` | `work/<lane>/CONTRACT.md` (API stub + self-test shape, ≤ 60 lines) |
| `{{TOKENS_PATH}}` | `work/tokens.resolved.json` |
| `{{TEST_CMD}}` | the repo test command, e.g. `npm test` |
| `{{SIZE_KB}}` | file cap for this lane (default 40) |
| `{{LENS}}` | one sentence forcing this candidate's angle (differs per `{{I}}`) |
| `{{REQUIRED_SLOTS}}` | lines `Q# → slot` from unanswered self-queries, plus `avoid: G##` lines |
| `{{FORBIDDEN}}` | lane forbidden tokens (regex) + elements that failed in ≥ 2 candidates last round |
| `{{LEDGER_DIGEST}}` | ≤ 40 lines of E2/E3 atoms for this lane, newest first (empty in round 1) |
| `{{HOST_READS}}` | ≤ 5 `file:lineStart-lineEnd` ranges the agent may read; everything else is grep-only |
| `{{CONTRACT_GAPS}}` | gaps the orchestrator already knows and has decided (one line each: field → default), or `none known`; the candidate adds its own under 'contract gaps' |
| `{{AXES}}` · `{{P}}` · `{{LANES}}` | BRIEF §8 critique axes (≤ 6 names) · critique pass number · lanes in this round (critic prompts only) |
| `{{FILM_LINE}}` | BRIEF §1 verbatim — the one-line film (logline + the joke). Every deliverable `.md` restates it on line 1 and checks each decision against it; a decision that does not serve the line is logged, not shipped |

---

## 1. CANDIDATE (one per lane × I; spawn all in one message)

```
Agent({ description: "soup r{{K}} {{LANE}} cand-{{I}}", subagent_type: "general-purpose", model: "opus", run_in_background: true, prompt: `
Repo: {{REPO}}. Round {{K}}, lane {{LANE}}, candidate {{I}}. You are ONE independent ingredient of a model soup.

FILM: {{FILM_LINE}}
  Every decision you make serves this line. cand-{{I}}.md restates it verbatim on line 1 and, in the modules table, gives each module a 'serves the film by' cell (≤ 8 words). A module you cannot tie to the line goes under 'open risk', not into the file.

LENS: {{LENS}}

RULES
- NO-COORDINATION: never read {{REPO}}/work/{{LANE}}/cand-* or soup* or any other agent's file. Never ask what the others did.
- Read {{CONTRACT_PATH}} and {{TOKENS_PATH}} first. Use token ROLES (tokens.color.accent, tokens.type.display, tokens.motion.feels.<name>, tokens.tempo.range). Never write a colour, font name, easing number or bpm literal; any value you need comes from the tokens file at runtime.
- Big files: never Read a file over 300 lines whole. grep -n for the symbol, then Read with offset/limit (≤ 120 lines per read). Allowed ranges: {{HOST_READS}}.
- Determinism: output is f(t, seed, tokens). Forbidden in render/schedule paths: Math.random, Date.now, performance.now, requestAnimationFrame, {{FORBIDDEN}}.
- Do not touch any file outside work/{{LANE}}/. Do not modify the validator or package.json.
- {{CONTRACT_GAPS}}: if the contract is silent on a field you need, choose the simplest default, state it in cand-{{I}}.md under 'contract gaps' (one line: field → default chosen → why simplest), do not ask. Known gaps already decided: {{CONTRACT_GAPS}}.
- Budget: ≤ 25 tool calls. Stop as soon as deliverable 3 exits 0.

DELIVERABLES (exact paths)
1. {{REPO}}/work/{{LANE}}/cand-{{I}}.js — IIFE exposing the contract API on window.<NAME>_{{I}} and module.exports; ≤ {{SIZE_KB}} KB; node --check clean.
2. {{REPO}}/work/{{LANE}}/cand-{{I}}.md — ≤ 60 lines: line 1 = FILM line verbatim, rationale (3 lines), the slots below answered one line each, table of modules with the gate that checks each and 'serves the film by', predicted.wow ∈ [0,1], predicted.firstFlag (gate id you expect to fail first + 1 line why), mutationProof (the one line you broke, which predicate caught it, restored), 'contract gaps' (every default you chose where the contract was silent; 'none' if none).
3. {{REPO}}/work/{{LANE}}/selftest-{{I}}.js — node script, no deps, ≤ 12 KB, exit 0 only if every predicate in {{CONTRACT_PATH}} §self-test holds, including: same (t, seed) twice → deep-equal; forbidden-token regex on your own source; one negative mutation (patch a copy, assert a predicate fails).

REQUIRED SLOTS (answer in cand-{{I}}.md; the answer IS the value)
{{REQUIRED_SLOTS}}

LEDGER DIGEST (rules already ratified; obey, do not re-derive)
{{LEDGER_DIGEST}}

VERIFY before reporting (run both, paste exit codes):
  node {{REPO}}/work/{{LANE}}/selftest-{{I}}.js
  node {{REPO}}/skills/motion-soup/scripts/soup-runner.mjs check-literals {{REPO}}/work/{{LANE}}/cand-{{I}}.js --tokens {{TOKENS_PATH}}

IF BLOCKED (predicate you cannot satisfy, missing host symbol, lib absent): keep what passes, delete nothing, write the block as 'open risk', report. Do not loop past the budget.

REPORT ≤ 8 lines: 1 files+bytes · 2 selftest cmd → exit · 3 forbidden tokens · 4 check-literals exit · 5 predicted firstFlag + why · 6 blocked/reverted · 7 open risk · 8 minutes.
` })
```

Per-lane `{{LENS}}` seeds (pick different ones per `{{I}}`; see `lanes.md`): music → "harmonic bed first" / "leitmotif and pulse first" / "silence and ducking first"; vector → "atmosphere: parallax, ribbons, cutouts" / "argument: diagram, counter, spotlight, end card" / "type: kinetic say only"; wording → "plain verbs, one idea per beat" / "question-led hook, proof-heavy" / "metaphor planted in hook, returned in callback".

---

## 2. MERGER (one per lane; spawn all lanes in one message, after the diversity floor passes)

```
Agent({ description: "soup r{{K}} {{LANE}} merger", subagent_type: "general-purpose", model: "opus", run_in_background: true, prompt: `
Repo: {{REPO}}. Round {{K}}, lane {{LANE}}. Soup candidates {{CANDIDATE_IDS}} into one module. You have no taste.

FILM: {{FILM_LINE}}
  MERGE-NOTES.md restates it verbatim on line 1. Every contradiction row carries a 'film' column: which side serves the line, citing its words. The film line is NOT a resolution (contract → ledger → open stays the law); it is the check that catches a lawful resolution that drifted off the film — such a row is resolved by law AND flagged 'off-film' in §open risk.

INPUTS (read these only): {{CONTRACT_PATH}}; {{TOKENS_PATH}}; work/{{LANE}}/cand-*.js, cand-*.md, selftest-*.js; gate table: {{GATE_TABLE}} (orchestrator-supplied, per candidate); ledger atoms: {{LEDGER_ATOMS}}.
Never Read a file over 300 lines whole: grep -n, then Read with offset/limit.

MERGE LAW (the only three moves)
- UNION: keep every module/element that passes a gate in ≥ 1 candidate. Drop elements that fail in all.
- INTERSECTION: a rule every candidate states becomes a proposedAtom (evidence E1). Write it; do not enforce it beyond this round.
- CONTRADICTION: resolve by a contract clause (cite it), else by a ledger E2/E3 atom (cite the row), else write it to openContradictions. "I prefer" is not a resolution.
- CONTRACT GAPS: read the 'contract gaps' section of every cand-*.md; write every gap line that ≥ 2 candidates share as an E1 atom of type `contract` (text: field → the default to write into CONTRACT.md next round). A gap only one candidate hit goes into MERGE-NOTES §open risk.
Lane tie-breaks that ARE contract: {{LANE_TIEBREAKS}}.

DELIVERABLES
1. {{REPO}}/work/{{LANE}}/soup.js — one module exposing the contract API; ≤ {{SIZE_KB}} KB; node --check clean; token roles only; same forbidden-token rule as candidates.
2. {{REPO}}/work/{{LANE}}/selftest-merged.js — superset of every candidate self-test predicate that survived + the contract predicates; exit 0; includes one negative mutation.
3. {{REPO}}/work/{{LANE}}/MERGE-NOTES.md — ≤ 80 lines: line 1 = FILM line verbatim; provenance table (module · source candidate · law applied); intersection list; contradictions table (topic · A · B · resolution · cite · film); DOMINANCE ARGUMENT: for each candidate, why soup ⊇ it (which predicate the single fails or lacks that the soup passes); the lane's gate predicates as text/node checks + one negative mutation (sed-able, verified); bestSingle = candidate with most predicates passed, ties by predicted.wow.
4. {{REPO}}/work/{{LANE}}/proposed-atoms.json — [{type: gate|mutation|vocab|motif|transition|contract, text, evidence: "E1"}].

VERIFY before reporting (paste exit codes):
  node {{REPO}}/work/{{LANE}}/selftest-merged.js
  node {{REPO}}/skills/motion-soup/scripts/soup-runner.mjs check-literals {{REPO}}/work/{{LANE}}/soup.js --tokens {{TOKENS_PATH}}

IF BLOCKED (two candidates cannot coexist under the contract): ship the union minus the blocking element, log the contradiction open, name bestSingle, report.
Budget ≤ 30 tool calls. Do not touch files outside work/{{LANE}}/.

REPORT ≤ 8 lines: 1 files+bytes · 2 selftest-merged → exit (n/total) · 3 forbidden tokens · 4 check-literals exit · 5 bestSingle + one-line dominance claim · 6 open contradictions count · 7 blocked · 8 minutes.
` })
```

---

## 3. INTEGRATOR (one; spawn together with the critic)

```
Agent({ description: "soup r{{K}} integrator", subagent_type: "general-purpose", model: "opus", run_in_background: true, prompt: `
Repo: {{REPO}}. Round {{K}}. Wire the accepted lane modules into the host. Each step is verified by the repo test command before the next starts.

ACCEPTED MODULES: {{ACCEPTED}}   (e.g. music → work/music/soup.js ; vector → bestSingle work/vector/cand-B.js)
GATE PREDICATES TO ADD: from each lane's MERGE-NOTES.md §gate predicates, with its negative mutation.
TEST: cd {{REPO}} && {{TEST_CMD}}   — run it first; it must exit 0 before you change anything. Record the baseline counts.

RULES
- Never rewrite a module. If a module needs a change to integrate, stop that step, leave it reverted, write the needed change as an open item for the lane, continue with the other steps.
- Never Read a file over 300 lines whole. grep -n for the hook point, Read ≤ 120 lines around it, Edit the minimal range. Allowed ranges: {{HOST_READS}}.
- Additive only: new fields optional, existing fields and existing gate ids untouched. Guard every call into a new module with typeof checks so the host runs without it.
- Token roles only; run check-literals on every file you touch.
- Budget ≤ 40 tool calls.

ORDERED STEPS (after each: run TEST; green → next; red → revert that step with git checkout -- <file> or by undoing your edit, note it, continue)
{{STEPS}}   (e.g. 1 copy module to host path · 2 script order in shells · 3 bundler inline + "no external script" assert · 4 validator filesToLoad + existence list · 5 render/tick/seek hooks · 6 UI toggle · 7 add gate G## · 8 add MUT-## and prove it is caught · 9 build command)

VERIFY before reporting (paste outputs):
  {{TEST_CMD}}
  node {{REPO}}/skills/motion-soup/scripts/soup-runner.mjs check-literals <every touched file> --tokens {{TOKENS_PATH}}
  {{BUILD_CMD}}

REPORT ≤ 8 lines: 1 files touched + line ranges · 2 TEST before → after (gates n/n, mutations n/n) · 3 steps done / reverted (which, why) · 4 new gate ids + mutation ids, proven caught · 5 check-literals exit · 6 build exit · 7 open items for lanes · 8 minutes.
` })
```

---

## 4. BLIND CRITIC (one; spawn together with the integrator; Fable if the orchestrator can spawn it, else opus)

```
Agent({ description: "soup r{{K}} blind critic", subagent_type: "general-purpose", model: "{{CRITIC_MODEL}}", run_in_background: true, prompt: `
Repo: {{REPO}}. Round {{K}}. You are a predictor. You see packets, never renders, never test output, never the audit set. Your record is scored per version; a confident wrong call lowers your authority.

FILM: {{FILM_LINE}}   — every 'why' names how the flagged element fails or serves this line.

READ ONLY: {{CONTRACT_PATH}} for each lane; work/<lane>/soup.js and work/<lane>/cand-{{BEST}}.js (grep + ≤ 120-line reads; never the whole file); work/<lane>/MERGE-NOTES.md. Do NOT run the test command. Do NOT open the validator. Do NOT read work/soup-ledger.jsonl.
Reliability for your version {{PHI_VERSION}}: {{RELIABILITY}} → authority = {{AUTHORITY}}.

DELIVERABLE: {{REPO}}/work/critic-r{{K}}.json
{ "phi": "{{PHI_VERSION}}", "lanes": { "<lane>": {
    "answers": { "soup": { "Q1".."Q9": str }, "best": { "Q1".."Q9": str } },   // 'unanswered' where the packet is silent
    "predicted": { "soup": { "wow": num, "grade": num, "firstFlag": "G##", "why": str },
                   "best": { "wow": num, "grade": num, "firstFlag": "G##", "why": str } },
    "bassCut": str,            // the one element a Saul Bass would remove
    "rank": "soup|best", "authority": "{{AUTHORITY}}" } },
  "predictedCritique": {       // the critique-row shape (SKILL.md §Ledger row schema `critique`), predicted from packets only
    "stills": [],              // empty: you saw none
    "scores": { "{{AXES}}": 1..10 },   // one integer per brief-§8 axis, for the soup
    "worst3": [str, str, str], // the three worst problems the stills critic will find, each tied to a gate id
    "fixes": [str] } }

SELF-QUERIES (answer each for soup AND best single; one line each):
Q1 what does the viewer not yet see with captions hidden? · Q2 which claim has no proof mark on screen? · Q3 which motion has no "because"? · Q4 which beat has no "hear"? · Q5 where does it breathe, exactly once? · Q6 what would a stricter critic flag first? · Q7 what is in frame that need not be? · Q8 which word would an eighth-grader stumble on? · Q9 which transition carries no meaning?

THE 8+ RULE: no render stage is permitted until the last observed critique row has every score ≥ 8 (gate FS-critique). Your predictedCritique is compared axis by axis with the stills critic's observed row; a predicted ≥ 8 that observes < 8 counts against your reliability exactly like a missed firstFlag.
Every firstFlag must be a gate id that exists in the contract or the host validator; every "why" must be falsifiable by a gate or by the audit set.
Budget ≤ 20 tool calls. REPORT ≤ 8 lines: 1 file · 2 per lane: rank + firstFlag(soup) + firstFlag(best) · 3 bassCut per lane · 4 predicted min score + axis · 5 authority · 6 minutes.
` })
```

### 4b. STILLS CRITIC (one per critique pass; step 8c; the only critic that sees renders)

```
Agent({ description: "soup r{{K}} stills critic p{{P}}", subagent_type: "general-purpose", model: "{{CRITIC_MODEL}}", run_in_background: true, prompt: `
Repo: {{REPO}}. Round {{K}}, critique pass {{P}}. Score the rendered stills against the film. You see stills and the brief only — no module source, no test output, no ledger.

FILM: {{FILM_LINE}}
STILLS: {{REPO}}/work/stills/r{{K}}/p{{P}}/*.png — one per payoff mark, filename = time in seconds. Read every one (Read shows images).
AXES (brief §8, score each 1–10, integers): {{AXES}}   — 10 = nothing a stricter critic would change; 8 = ships; < 8 = a named problem.

DELIVERABLE: {{REPO}}/work/critique-r{{K}}-p{{P}}.json, exactly the ledger `critique` row:
{ "round": {{K}}, "kind": "critique", "pass": {{P}}, "stills": [paths read], "scores": { axis: int }, "worst3": [exactly 3 strings: still + what is wrong + which brief line it breaks], "fixes": [one per worst3: "<lane>: <one-line change>"], "minutes": n }

RULES: a score < 8 must appear in worst3 (lowest first), named by its axis word; worst3 names a still by filename (`<t.toFixed(2)>s.png`, e.g. `1.00s.png`); fixes[i] answers worst3[i]; a fix names one lane from {{LANES}} and one change a candidate can make under the contract — never "make it better". Nothing in the stills is fixed by you.
Budget ≤ 15 tool calls. REPORT ≤ 8 lines: 1 file · 2 scores one line · 3 worst3 · 4 fixes · 5 exit? (all ≥ 8 → yes | no) · 6 minutes.
` })
```

---

## 5. TOKEN RESOLVER (normally the runner; spawn an agent only when the host has no machine-readable tokens)

```
Agent({ description: "soup tokens resolver", subagent_type: "general-purpose", model: "opus", run_in_background: false, prompt: `
Repo: {{REPO}}. Produce {{TOKENS_PATH}} in the motion-soup token contract from the host's own sources. Do not invent values.

FIND (grep only; never read a file over 300 lines whole): CSS custom properties (--paper/--ink/--accent/--highlight/--contrast or their aliases bg/fg/primary/secondary/tertiary; --font-display/--font-body/--font-mono; --type-scale; --feel-*; --tempo-min/--tempo-max), a brand JSON, a palette engine with ids, a tempo/feel table exported from a module.

THEN run: node {{REPO}}/skills/motion-soup/scripts/soup-runner.mjs resolve-tokens <sources you found, as css:/json:/wada:/cjs: specs> --out {{TOKENS_PATH}}
If a required role is still in "missing", write {{REPO}}/work/tokens.missing.md naming the role and the host file where a human should define it. Do not fill it yourself.

REPORT ≤ 8 lines: 1 sources used · 2 roles resolved · 3 roles missing + where to define · 4 literals count · 5 minutes.
` })
```

---

## Self-queries (the 12 that generate lane briefs)

Ask each of the current accepted artifact (round 0: the brief). An unanswered question emits its slot into `{{REQUIRED_SLOTS}}` of the lane named. A question with no gate and no predictor is not admitted.

| # | Question | Binds to | Slot → lane |
|---|---|---|---|
| 1 | What does the viewer not yet *see* if captions are hidden? | covered-ok gate | `beat.severedMark` → vector |
| 2 | Which *claim* has no proof mark on screen? | grammar gate (claim→proof) | `beat.proofMark` → wording, vector |
| 3 | Which *motion* has no "because"? | movement-ok gate | `beat.because ∈ {attention, continuity, change, character}` → vector, transitions |
| 4 | Which *beat* has no "hear"? | music cue gate | `beat.hear = {mood, cue, duck}` → music |
| 5 | Where does the piece *breathe*, exactly once? | one-breather gate | `beat[i].grammar = breather` → wording, music |
| 6 | What would a stricter critic flag *first*? | predictor (critic reliability) | `predicted.firstFlag` → every lane |
| 7 | What is still in frame that does not have to be? | reduction-ladder gate | `ladder.lastRung` → vector, typography |
| 8 | Which *word* would an eighth-grader stumble on? | wording gate | `say` rewrite → wording |
| 9 | Which *transition* carries no meaning? | transition-semantic vocab | `transition.semantic` → transitions |
| 10 | Are the candidates actually *different*? | diversity floor | `tellApart.min` → orchestrator |
| 11 | Is the soup *better* than its best ingredient on untuned inputs? | dominance gate | `soupVsBest` → orchestrator |
| 12 | Does the retained world still *render identically* at `seek(t)`? | determinism + pair compatibility | `hashTable[samples × nodes]` → integrator |

Round k+1 generation (no human rewrites prompts):

```
required_slots(k+1) = { Q# → slot | Q# unanswered on accepted artifact_k }
                    ∪ { "avoid: " + observed firstFlag | observed ≠ predicted }
ledger_digest(k+1)  = top-40 E2/E3 atoms for the lane, newest first
forbidden(k+1)      = forbidden(k) ∪ { elements that failed in ≥ 2 candidates in round k }
critic.reliability  = status of the critic version after comparing predicted vs observed
```
