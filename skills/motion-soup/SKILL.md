---
name: motion-soup
description: Build or upgrade any animated explainer / motion-graphics deliverable (procedural music, vector layers, storyboard wording, transitions, typography, data-viz) by fanning out parallel Opus subagents under a typed contract, souping their candidates under merge laws, and accepting only what passes the repo's own gates. Use it whenever a motion, explainer, animation engine, WebAudio score or storyboard-grammar task is big enough that one agent's say-so is not good enough, whenever the user says "soup", "model soup", "candidates", "fan out", "parallel agents", "merge the best of", or "self-query loop", and whenever a deliverable must stay brand-agnostic (no hardcoded colours, fonts, tempos).
---

# motion-soup

A model soup for motion work. N independent candidates per lane, one merger per lane, one integrator, one blind critic, the repo's test command as the only judge, a ledger that writes the next round's prompts. Workers are **Opus subagents** spawned with the `Agent` tool; the orchestrator (you — Fable when available, Opus otherwise) only frames, spawns, runs gates, and decides. Nothing here is accepted because an agent said so.

Read `references/film-brief.md` before writing `work/BRIEF.md` (the 9-element film spec is the intake contract); `references/prompts.md` before spawning anything; `references/lanes.md` when choosing lanes; `references/gates.md` when a gate fails or a new one is needed.

## When to use

- A new or upgraded animated explainer, motion engine module, procedural score, vector/SVG layer, storyboard grammar, transition vocabulary, kinetic typography or animated chart.
- The deliverable has a **repo test command** (or you can add one) and a **typed contract** (an API the module must expose). Without both, make them first (step 0) — the soup has nothing to judge otherwise.
- Quality matters more than a single agent's taste, and wall-time matters more than token cost.

Do not use for a one-line fix, a prose-only task with no checkable output, or when the user wants to iterate by hand on one file.

## Inputs

| Input | Where | Why |
|---|---|---|
| **Brief** | `work/BRIEF.md` from the template in `references/film-brief.md` | the owner's 9-element film spec (film line · references · tools & keys · character bible · beat sheet · text on screen · workflow gates · critique loop · deliverables); §3 "Spend it economically" is the budget `{agentCalls, wallMin}`; the ⟂ lines are read by the FS gates below |
| **Repo test command** | `package.json` `test` (e.g. `npm test`) | the only gate that decides acceptance |
| **Tokens source** | `tokens.css`, brand JSON, or a palette id resolved by the host engine | all colour / type / motion / tempo values; the skill carries none |
| **Lanes** | 1–6 from the catalog below | each lane = one API contract + one self-test |
| **Audit set** | 1–2 inputs never named in any prompt | dominance is measured here, never where candidates tuned |

## The loop (orchestrator runbook)

Every step names what runs, how it is spawned, and what verifies it. Steps 3, 5 and 7 spawn **in a single message** so agents run concurrently.

**0. Frame (you, ~3 min).** Read the brief; if it is not in the nine-section shape, copy the template from `references/film-brief.md`, ask the blank-slot question for each empty section once, export §5 to `work/beats.json`, run FS-hook + FS-cadence on it, and write the `stage: plan` ledger row with the bible hash (FS-identity). Confirm the test command exits 0 before anything changes (`npm test`). Pick lanes. Pick N (2 for a known lane, 3 for a new one). Pick the audit set. Freeze the contract: write `work/<lane>/CONTRACT.md` per lane (API stub + self-test shape from `references/lanes.md`, ≤ 60 lines) and walk the checklist in §Authoring a lane CONTRACT.md — every item the contract leaves silent is a gap all N candidates will hit independently (round 2: three of them, three times).

**1. Resolve tokens (you, 1 min).**
```
node skills/motion-soup/scripts/soup-runner.mjs resolve-tokens <source>... --out work/tokens.resolved.json
```
Sources: `css:<file>`, `json:<file>`, `wada:<id>[@<engine.js>]`, `cjs:<file>#<export>`. Later sources override earlier ones. Check `missing` in the output; fill missing roles from another source or state in the brief that the lane may not need them. Every candidate prompt references this file **by path**; nobody pastes values.

**2. Self-query + lens check (you, 3 min).** Run the 12 questions in `references/prompts.md` §Self-queries against the current accepted artifact (round 0: the brief). Each unanswered question becomes a `required_slots` line in the candidate prompt. A question with no gate and no predictor is not asked. Then check every lens seed against the ledger (§Lens seeds vs ledger) before it goes into a prompt.

**3. Fan-out (Opus, parallel, 8–15 min wall).** For every lane × candidate, one `Agent` call, all in one message:
```
Agent({
  description: "soup r{{K}} {{lane}} cand-{{I}}",
  subagent_type: "general-purpose",
  model: "opus",
  run_in_background: true,
  prompt: <references/prompts.md §Candidate, slots filled>
})
```
Each prompt is self-contained (no shared chat context): lens, contract path, tokens path, size cap, output path `work/<lane>/cand-<I>.js` + `work/<lane>/cand-<I>.md`, self-test path `work/<lane>/selftest-<I>.js`, "stop when the self-test exits 0", ≤ 8-line report. NO-COORDINATION: a candidate never reads another `cand-*` file.

**4. Diversity floor (you, 1 min).** `soup-runner.mjs diversity work/<lane>/cand-*.js --min 0.35`. Below the floor: spawn one more candidate with a forced different approach stated in its lens (not a copy of a sibling). Souping near-duplicates is the failure the paper left open.

**5. Merge (Opus, one per lane, parallel, 10–15 min wall).** One `Agent` per lane, all in one message, `model: "opus"`, `run_in_background: true`, prompt from §Merger. Law: UNION of elements that pass a gate in ≥ 1 candidate; INTERSECTION of rules all candidates state → proposed atom (E1); CONTRADICTIONS resolved by the contract, then ledger E2/E3 atoms, else logged open — never by preference. Output `work/<lane>/soup.js`, `work/<lane>/selftest-merged.js` (exit 0), `work/<lane>/MERGE-NOTES.md` with a **dominance argument** per module (why soup ⊇ each single) and the lane's gate predicates + one negative mutation.

**6. Gates on each soup (you, 2 min).** `node <selftest-merged>`; `soup-runner.mjs check-literals work/<lane>`; size cap; forbidden-token grep (`references/gates.md`). Any fail → the lane ships `bestSingle` from MERGE-NOTES if it alone passes, else nothing.

**7. Integrate + critic (parallel, 10–20 min wall).** In one message spawn:
- **Integrator** (`model: "opus"`, background): ordered steps, each followed by the repo test command; a step that fails is **reverted** and reported, the rest stays green; adds the lane's gate + negative mutation to the validator; never rewrites a module.
- **Blind critic** (Fable if the orchestrator can spawn it, else `model: "opus"`, background): sees `soup.js` + `cand-<best>.js` + contract **only** — no renders, no test output, no audit set. Predicts `firstFlag` (the gate it expects to fail first) and `wow ∈ [0,1]` for both; ranks; authority `advisory` until its record is `reliable`.

**8. Gate audit (you, 3 min).** Run the repo test command. Run `check-literals` on every touched file. Dominance: on the audit set, soup ≥ bestSingle on every gate and strictly better on ≥ 1 metric, else ship bestSingle. Pair compatibility: old inputs × new module and new inputs × old module both pass; seek-hash unchanged for untouched nodes.

**8b. Stage ladder (you, 1 min per stage).** The round walks the brief's §7 order — `plan → rig → stills → animatic → full → polish → audio → render` — and writes one `stage` row per stage reached, in that order, each with `pass:true` and the bible hash. Map onto the loop: `plan` = steps 0–2; `rig` = step 6 (lane soups green); `stills` = frames rendered at the payoff marks from the soups; `animatic` = the timed board with those stills; `full` = step 7 integrator green; `polish` = after the critique loop exits; `audio` = music lane mixed under SFX; `render` = final MP4. FS-gateorder fails any row whose predecessor is missing — a round that stops early logs where it stopped, it never jumps.

**8c. Critique loop (critic + lane fixers, 5–10 min per pass).** At `stills` and again at `polish`: (1) render stills at every payoff mark (`work/stills/r<K>/p<n>/`); (2) spawn the stills critic (prompts.md §4b) — scores each brief-§8 axis 1–10, names the **3 worst** problems, one fix per problem, written as a `critique` row; (3) hand each fix to its lane (a one-candidate re-spawn with the fix as `{{LENS}}`, same contract); (4) repeat. Exit only when every score ≥ 8 — FS-critique refuses a `render` row otherwise. Cap passes at `wallMin / 10`; if the cap hits first, the round stops at `polish` and the open scores go into `open` rows.

**9. Ledger (you, 2 min).** One row per candidate, merge, critic, integrate, stage, critique, verdict (plus `gate`/`open` rows as needed), in the exact shapes of §Ledger row schema — `ledger add` rejects anything else with exit 1 and the missing field names. Rows are best written as each agent hands back (step 3, 5, 7), not all at the end. Then `soup-runner.mjs report --round K`. Compare critic `predicted` with observed `firstFlag`; a wrong prediction becomes an `avoid:` line in next round's `required_slots`.

**10. Accept or retain old.** Accept only if 8 passed in full and, when the round reached `render`, FS-gateorder, FS-critique, FS-identity and FS-deliverables pass at the verdict. Otherwise keep the **whole** previous (prompts, predictor, artifact); the round's atoms survive as E1 proposals. No partial acceptance — that is how coupling breaks silently.

**11. Stop** on budget, or two consecutive rounds with no accepted atom.

## Lane catalog (detail in `references/lanes.md`)

| Lane | API contract stub | Self-test shape |
|---|---|---|
| **music** | `plan(sheet, tokens, feel, seed) → {tempo, key, cues[], duck}`; `seek(t)`; `duck(level,t)`; `schedule(ctx\|null, plan, t0)` | plan deep-equal on same seed, differs by seed; exactly one breather cue; duck curve equals plan; `schedule(null,…).live === false`; zero `Math.random\|Date.now\|requestAnimationFrame` |
| **vector** (visual layer) | `renderFrame(ctx, t, beat, tokens, seed, opts{pass}) → bool`; `audit(t, …) → {offPalette[]}`; `init({inline, cdn, onReady})` | op-trace identical after seeks; two passes; `offPalette.length === 0`; `false` with 0 ops when the renderer lib is absent; no play loop |
| **wording** + storyboard grammar | `beats[6–8]{grammar, say, show, hear, because, claimId?, plant?, returns?}` | grammar order; one breather not first/last; every proof cites a claim; plant returns; reading grade ≤ 8; no internal names |
| **transitions** | `transitionFor(fromBeat, toBeat) → {kind, semantic, t0, t1}`; `mask(t) → path` | every transition carries a one-sentence `semantic`; callback reverses the hook's mask; cut for breather; deterministic |
| **typography** | `layout(say, tokens.type, box, t) → {glyphs[], tracking, clockAt(word)}` | one clock per beat; widths via measurer with fallback; scale from `tokens.type.scale`; no font literal outside tokens |
| **data-viz** | `chart(spec, tokens, t) → {marks[], axes, counterAt(t)}` | marks use token roles only; counter monotone in t; same spec + seed → same marks; ≤ 1 highlight per frame |

Every lane also inherits the universal gates below.

## Budgets & timing

Measured on the round-2 rail test (one lane `transitions`, N=3, all workers Opus 5.5 via `Agent` with `run_in_background`, 2026-10-23); phases not run that day keep their round-1 estimates and say so.

| Phase | Runs | Parallel? | Wall (measured r2) | Tool calls | Note |
|---|---|---|---|---|---|
| 0–2 frame, contract, tokens, self-query | orchestrator | — | ≈ 3 min | — | 37-line CONTRACT.md authored inside this window |
| 3 candidates | lane × N Opus agents | all at once, one message | **3.5 / 4 / 4 min** | **10 / 11 / 9** | all three selftest exit 0, 0 literals; 12.3 / 15.8 / 9.9 KB |
| 4 diversity | runner | — | < 1 min | — | min 0.897 (floor 0.35) |
| 5 merger | one Opus per lane | all at once | **8.5 min** | **19** | soup 25/25, bestSingle A 20/25, 4 open contradictions, 10 E1 atoms |
| 6 soup gates | runner + node | — | 1 min | — | selftest-merged, check-literals, size cap, forbidden grep |
| 7 integrator + critic | 2 agents | together | 10–20 min (est., not run r2) | ≤ 40 / ≤ 20 | round 1 integrator was run as a one-off, unmeasured |
| 8–10 audit, ledger, verdict | orchestrator | — | 2–5 min | — | |
| **One lane, N=3, through merge (measured)** | 4 agents | | **≈ 16 min** orchestrator wall (00:20:35 → 00:36:19) | 49 | fan-out + merge ≈ 12.5 min of it; the rest is contract authoring and orchestration |
| **Round total (3 lanes, N=2–3, with integrator + critic)** | 9–12 agents | | **≈ 35–50 min** (est.) | | lanes run concurrently, so wall ≈ one lane + integrator |

Per-agent budgets written into every prompt: candidate file ≤ 40 KB (lane may cap lower — transitions caps at 18 KB), self-test ≤ 12 KB, ≤ 25 tool calls hint (measured: 9–11 is normal for a candidate, 19 for a merger), ≤ 8-line report, stop when the self-test exits 0. Merger ≤ 40 KB soup. Integrator ≤ 1 touched line-range per step. Agents never read a file > 300 lines whole: `grep -n` then `Read` with `offset`/`limit`.

## Token resolver

`work/tokens.resolved.json` is the only place values live. Required roles:

```
color:  paper, ink, accent, highlight, contrast   (+ color.extra.* for named host colours)
type:   display, body, mono, scale[]
motion: feels{ name → {duration?, ease?} }        (names are the contract; numbers come from the host)
tempo:  range[min,max], byFeel{}
```
Candidates read roles (`tokens.color.accent`), never values. `resolve-tokens` prints `missing`; `--strict` turns missing into exit 1. A lane that needs no tempo may ignore `tempo`, but the file still declares it so the gate has something to compare against.

**Source order when roles come back `missing` (measured r2: the host CSS alone left `color.accent`, `color.highlight`, `color.contrast` missing).** Later sources override earlier ones, so add in this order and re-run until `missing` is empty or explained: (1) `css:<shell>` — paper/ink/type come from here; (2) `wada:<non-audit id>@<palette engine>` — accent/highlight/contrast come from a palette combination, never from the shell CSS, which only names surfaces; (3) `cjs:<module>#<export>` — tempo range + feel names; (4) `json:<brand>` for anything still missing. If a role is still missing, write it into the brief as "lane may not need it" or into `work/tokens.missing.md` for a human — never invent it. Note what the resolved file does **not** carry (r2: `motion.feels` had names but no easing; `type.scale` absent) and say so in the contract, otherwise every candidate rediscovers it.

## Gates

**Universal** (every host, implemented by the runner or a 10-line node predicate; see `references/gates.md`): determinism (same `(t, seed)` → identical output; no `Math.random|Date.now|performance.now|requestAnimationFrame` in render/schedule paths), no-literal-token (`check-literals` exit 0), size caps, selftest-exit-0, dominance (soup ≥ best single on the audit set), diversity floor (≥ 0.35), additive-schema-only (existing fields untouched; new fields optional).

**Host-specific**: whatever the repo's test command already checks (here: `scripts/validate-motion-studio.mjs --selftest`, gates G01–G33, MUT-01…14). The integrator adds one gate id + one negative mutation per lane shipped; a new gate without a mutation is not a gate.

## Film spec gates

The ⟂ lines of the 9-element brief as universal predicates (`references/gates.md` §Film-spec gates; each ≤ 15 lines of node, one negative mutation, host-agnostic). The orchestrator runs them and writes `gate` rows (`gate:"FS-…"`).

| Gate | Protects (brief §) | Runs at |
|---|---|---|
| **FS-hook** | §5 — the viewer is hooked inside 2 s: first beat ends ≤ 2 s or first payoff mark ≤ 2 s | step 0 on `work/beats.json`; again at step 8 on the shipped sheet |
| **FS-cadence** | §5 — a visual payoff every 3–5 s across the board (from `start`/`dur`/`payoff`) | step 0; `animatic` stage |
| **FS-textroom** | §6 — every `say` beat reserves a text box the vector layer's `audit({box})` reports empty of other marks | step 6 on the vector soup; `stills` stage |
| **FS-identity** | §4 — the character bible hash is unchanged across every stage row; proportions equal under two palettes | every `stage` row; verdict |
| **FS-gateorder** | §7 — `stage` rows appear as plan→rig→stills→animatic→full→polish→audio→render; a row with a missing predecessor fails | step 8b, each stage; step 10 |
| **FS-critique** | §8 — no `render` row until the last `critique` row has every score ≥ 8 | step 8c exit; step 10 |
| **FS-deliverables** | §9 — final MP4, loop check, poster frame, contact sheet, README exist at verdict | step 10 |

## Retain-old rule

If dominance, pair compatibility, or the held-out comparison fails, keep the **entire** previous pair (prompt-set, predictor) and the previous artifact. Ship `bestSingle` only if it alone passes every gate. Record the round's atoms as E1. Never merge "the good half".

## Ledger row schema

`work/soup-ledger.jsonl`: one JSON object per line, `kind` selects the shape, `ts` is added on write. `ledger add` validates against this table (mirrored in the runner's `SCHEMA`) and exits 1 naming the missing/mistyped fields; `report` renders exactly these shapes. A pre-schema combined row (candidates{} + merge{} in one object, no `kind`) is expanded for display with a one-line `warn:` — re-add it properly. Numbers are numbers (`"selftest":0`, not `"exit0"`); `n/n` is a string.

| kind | required | optional |
|---|---|---|
| `candidate` | `round` `lane` `id` `selftest` (exit code) `literals` (check-literals exit) `minutes` | `bytes` `wow`∈[0,1] `firstFlag` `toolCalls` `lens` `gaps` (count of 'contract gaps' lines) |
| `merge` | `round` `lane` `predicates` "n/n" `bestSingle` `minutes` | `diversity` (min pairwise) `bestSinglePredicates` "n/n" `openContradictions` `atoms` `literals` `bytes` `toolCalls` |
| `critic` | `round` `lane` `firstFlag` (predicted, soup) `wow` (soup) `rank` soup\|best `authority` `minutes` | `phi` `bestFirstFlag` `bestWow` `bassCut` |
| `integrate` | `round` `test` (before → after) `steps` "n/n" `reverted` [] `minutes` | `gates` [] `mutations` [] `literals` `toolCalls` `openItems` [] |
| `verdict` | `round` `result` accept\|retain-old\|bestSingle\|… `lanes` {lane → soup\|bestSingle\|nothing} `wallMinutes` | `why` `observedFirstFlag` {lane → G##} |
| `stage` | `round` `stage` plan\|rig\|stills\|animatic\|full\|polish\|audio\|render `pass` `minutes` | `bibleHash` `artifacts` [] `lane` `detail` |
| `critique` | `round` `pass` (critique pass number) `stills` [] `scores` {axis → 1..10} `worst3` [3] `fixes` [] | `lane` `minutes` `minScore` |
| `gate` / `open` | `round` `gate` `pass` / `round` `text` | `lane` `detail` |

Exact rows the orchestrator passes (round-2 values):
```
ledger add '{"round":2,"kind":"stage","stage":"plan","pass":true,"bibleHash":"3f9a1c0e7b2d4a66","minutes":3}'
ledger add '{"round":2,"kind":"critique","pass":1,"stills":["work/stills/r2/p1/0.8s.png","work/stills/r2/p1/4.2s.png"],"scores":{"hook":8,"cadence":7,"readability":9,"identity":8},"worst3":["payoff at 4.2 s lands under the caption","hook mark is a cut, not a reveal","breather too short"],"fixes":["vector: move spotlight above textBox","transitions: iris on hook","wording: breather dur 3→4"],"minutes":6}'
ledger add '{"round":2,"lane":"transitions","kind":"candidate","id":"A","selftest":0,"literals":0,"bytes":12266,"wow":0.55,"firstFlag":"P5 number scan on SECONDS_PER_MINUTE","toolCalls":10,"minutes":3.5}'
ledger add '{"round":2,"lane":"transitions","kind":"merge","diversity":0.897,"predicates":"25/25","bestSingle":"A","bestSinglePredicates":"20/25","openContradictions":4,"atoms":10,"literals":0,"bytes":17869,"toolCalls":19,"minutes":8.5}'
ledger add '{"round":2,"lane":"transitions","kind":"critic","phi":"φ-0","firstFlag":"G35.5","wow":0.6,"bestFirstFlag":"G35.4","bestWow":0.5,"rank":"soup","authority":"advisory","minutes":6}'
ledger add '{"round":2,"kind":"integrate","test":"33/33 gates, 14/14 mut → 34/34, 15/15","steps":"9/9","reverted":[],"gates":["G35"],"mutations":["MUT-15"],"literals":0,"minutes":12}'
ledger add '{"round":2,"kind":"verdict","result":"accept","lanes":{"transitions":"soup"},"wallMinutes":16,"why":"soup 25/25 ≥ bestSingle 20/25 on every predicate"}'
```
`report` then prints per round: verdict + shipped lanes, wall, agent-minutes (sum of candidate/merge/critic/integrate/critique), per lane one line per candidate (selftest · literals · wow · minutes), diversity min, merge n/n + bestSingle (n/n) + open + atoms, critic line or `not run`, integrate line or `not run`, a `stages` line (the ladder with ✓ / — per stage, `ORDER FAIL` if a row precedes its predecessor), a `critique` line (passes, last min score, exit ≥ 8 or not), then FAIL/OPEN rows.

## Authoring a lane CONTRACT.md (checklist)

Round 2 proved that whatever the contract leaves silent, every candidate decides alone and differently (three candidates, three identical gaps: boards had no `start/dur/feel`; zoom lived in `cameraMove`, the contract said `show`; `tokens.motion.feels` carried no easing). ≤ 60 lines; copy the stub from `references/lanes.md`; then tick every line below — an unticked line is a gap, so write the default *into* the contract:

1. **API** — every function with argument order, return shape (optional fields marked `?`), the enum for every string field (`kind ∈ …`), and the module name on `window` / `module.exports`. Extra return fields: allowed or forbidden, say which.
2. **Beat fields with defaults + where each tag lives** — for every beat field the lane reads: its path (`beat.show` vs `beat.cameraMove` vs `beat.visualAction`), its type, and the default when the host board omits it (`start`/`dur` from `totalDurationSec / n`; `feel` from grammar role; `focus` from thirds grid). Open the real example boards and check each field is actually present before naming it.
3. **Timing source** — where seconds come from (`tokens.tempo.byFeel[feel]`, a feel duration, a board field), the fallback order, and what the lane does when none exists (a number, not "NaN").
4. **Relation / state inference order** — the full precedence list, top to bottom, including every trigger token (`hinge: BUT`, `say` starts with "But", `claimId` differs, `returns` set). Two candidates ranking two rules differently is a contradiction the merger cannot resolve without this line.
5. **Tokens the lane may rely on** — which roles the resolved file carries and which it does **not** (r2: feels have names, no easing). Say what to do when a role is empty (linear, not invented).
6. **Size cap** per file, in KB, for candidate, self-test and soup.
7. **Self-test predicates, numbered** — each one checkable by a node script with no deps; name the fixture (which board, how loaded); say which numeric literals are exempt (unit constants like `60 s/min`), otherwise a candidate's own scan flags them.
8. **Negative mutation** — the one `sed`-able line to break and the predicate number that must fail.
9. **Host read ranges** — ≤ 5 `file:lineStart-lineEnd` ranges the candidate may read whole; everything else grep-only. Include the storyboard schema file.
10. **Lane tie-breaks that are contract** — the sentences the merger may cite as law (`focus from B governs`, `hold length applies to cut only`); anything not here is logged open.
11. **Gap rule** — the line "if the contract is silent, choose the simplest default, state it under 'contract gaps' in cand-<I>.md, do not ask" (the prompt repeats it; the contract owns it).

## Lens seeds vs ledger

A lens is wasted when a ratified atom already decides what the lens would vary (r2: candidate C's "cuts only" lens was overridden by the E2 atom *direction encodes relation* — wipe/split/iris fixed for most relations — so C differed from A/B only on hook/callback/breather and scored last at 18/25). Rule, before step 3:

- For each lens seed, grep the ledger digest (E2/E3 atoms for the lane) for the lens's key nouns (`cut`, `focus`, `hold`, `reading order`, …). If an atom fixes that dimension, the lens is dead: replace it with one that varies a dimension no atom names (r2 replacement for C: "meaning carried by focus *travel* between beats", or "semantic-first: templates drive kinds").
- A lens must name **one** dimension and the direction it pushes; "minimal" is not a lens.
- Keep the lens text in the candidate row (`lens`) so the next round can see which lenses produced the bestSingle and which were dead.
- Three live lenses ≥ the diversity floor by construction; if a check still fails at step 4, the lenses were restatements, not dimensions.

## Orchestrator runbook (copy-paste)

One lane round, in order. `R=node skills/motion-soup/scripts/soup-runner.mjs`, `L=<lane>`, `K=<round>`. Steps marked **one message** spawn every `Agent` call in a single assistant turn so they run concurrently; wait for all hand-backs before the next step.

```
# 0 frame — brief in the 9-section shape (references/film-brief.md); ask each blank slot once; beats → work/beats.json
npm test                                                      # exit 0 or stop
node -e '<FS-hook + FS-cadence predicates from gates.md on work/beats.json>'   # exit 0 or fix §5 before spawning anything
$R ledger add '{"round":K,"kind":"stage","stage":"plan","pass":true,"bibleHash":"<sha256[:16] of BRIEF §4>","minutes":3}'
mkdir -p work/$L && $EDITOR work/$L/CONTRACT.md               # §Authoring checklist, ≤ 60 lines; cite the film line from BRIEF §1
# 1 tokens (source order: css → wada → cjs → json; re-run until missing is empty or explained)
$R resolve-tokens css:index.html wada:<non-audit-id>@geome-wada.js cjs:studio-music-engine.js#TEMPO --out work/tokens.resolved.json
# 2 self-queries → required_slots; lens check
$R report --round $((K-1))                                    # digest of atoms; grep each lens noun (§Lens seeds vs ledger)
# 3 fan-out — ONE MESSAGE, N Agent calls (prompts.md §1, slots filled, {{CONTRACT_GAPS}} line present)
Agent({description:"soup r$K $L cand-A", subagent_type:"general-purpose", model:"opus", run_in_background:true, prompt:<CANDIDATE A>})
Agent({description:"soup r$K $L cand-B", ... prompt:<CANDIDATE B>})
Agent({description:"soup r$K $L cand-C", ... prompt:<CANDIDATE C>})
#   as each hands back: verify its two VERIFY commands yourself, then ledger it
node work/$L/selftest-A.js; $R check-literals work/$L/cand-A.js --tokens work/tokens.resolved.json
$R ledger add '{"round":K,"lane":"L","kind":"candidate","id":"A","selftest":0,"literals":0,"bytes":N,"wow":0.55,"firstFlag":"…","toolCalls":10,"minutes":3.5}'
# 4 diversity — between fan-out and merge, never skipped
$R diversity work/$L/cand-*.js --min 0.35                      # FAIL → one more candidate with a forced different lens, back to 3
# 5 merge — ONE MESSAGE, one Agent per lane (prompts.md §2; GATE_TABLE = your step-3 verifications)
Agent({description:"soup r$K $L merger", subagent_type:"general-purpose", model:"opus", run_in_background:true, prompt:<MERGER>})
$R ledger add '{"round":K,"lane":"L","kind":"merge","diversity":0.897,"predicates":"25/25","bestSingle":"A","bestSinglePredicates":"20/25","openContradictions":4,"atoms":10,"literals":0,"bytes":N,"toolCalls":19,"minutes":8.5}'
# 6 soup gates (you)
node work/$L/selftest-merged.js
$R check-literals work/$L/soup.js --tokens work/tokens.resolved.json
test $(wc -c < work/$L/soup.js) -le $((CAP_KB*1024)) && ! grep -nE 'Math\.random|Date\.now|performance\.now|requestAnimationFrame' work/$L/soup.js
# 7 integrate + critic — ONE MESSAGE, two Agent calls (prompts.md §3, §4); critic sees no test output
Agent({description:"soup r$K integrator", model:"opus", run_in_background:true, prompt:<INTEGRATOR>})
Agent({description:"soup r$K blind critic", model:"<fable|opus>", run_in_background:true, prompt:<CRITIC>})
$R ledger add '{"round":K,"kind":"integrate","test":"33/33,14/14 → 34/34,15/15","steps":"9/9","reverted":[],"gates":["G35"],"mutations":["MUT-15"],"literals":0,"minutes":12}'
$R ledger add '{"round":K,"lane":"L","kind":"critic","firstFlag":"G35.5","wow":0.6,"rank":"soup","authority":"advisory","minutes":6}'
# 8 audit (you)
npm test; $R check-literals <every touched file> --tokens work/tokens.resolved.json      # + dominance on the audit set, pair compatibility
# 8b stage ladder — one row per stage reached, in order (FS-gateorder); rig after step 6, full after step 7
$R ledger add '{"round":K,"kind":"stage","stage":"rig","pass":true,"bibleHash":"<same hash>","minutes":1}'
# 8c critique loop at stills (and again at polish): stills at payoff marks → critic (prompts.md §4b) → critique row → fixes to lanes → repeat until every score ≥ 8
Agent({description:"soup r$K stills critic p1", model:"<fable|opus>", run_in_background:true, prompt:<STILLS CRITIC>})
$R ledger add '{"round":K,"kind":"critique","pass":1,"stills":["…"],"scores":{"hook":8,"cadence":7},"worst3":["…","…","…"],"fixes":["…"],"minutes":6}'
#   score < 8 → re-spawn that lane's one candidate with the fix as LENS, back to 6, then another pass; all ≥ 8 → stage polish → audio → render
# 9–10 verdict + report (FS-critique, FS-identity, FS-deliverables at verdict when the round reached render)
$R ledger add '{"round":K,"kind":"verdict","result":"accept","lanes":{"L":"soup"},"wallMinutes":16,"why":"…"}'
$R report --round $K
```
Round-level check after step 3: all N back within ~5 min of each other means the contract was equally clear to all; one straggler usually means it hit a gap the others defaulted past — read its `contract gaps` first.

## Report format

Agents (candidate, merger, integrator, critic) end with ≤ 8 lines:
```
1. files: <paths written>, <bytes>
2. selftest: <command> → exit <0|n> (<pass>/<total>)
3. forbidden tokens: 0 | <list>
4. literals: check-literals exit <0|1>
5. predicted firstFlag: G## — <one line why>
6. blocked/reverted: none | <step> (left reverted, rest green)
7. open risk: <one line>
8. minutes: <n>
```
Orchestrator round report = `soup-runner.mjs report` output + one line per lane: shipped soup | bestSingle | nothing, and why.

## Anti-patterns

- **Shared context between candidates** — they converge; the soup gains nothing. Each prompt is self-contained; no `cand-*` reads.
- **Pasting token values into prompts** — they become literals in output. Pass the path.
- **Merger with taste** — "I preferred B's feel" is not a law. Cite a contract clause or a ledger row, or log it open.
- **Integrator that fixes modules** — it wires and gates; a broken module goes back to its lane next round.
- **Accepting on a green self-test alone** — the repo test command decides; the self-test is the candidate's own claim.
- **Partial acceptance** — one lane in, one out, prompts half-updated: the next round cannot be compared with this one.
- **Reading the engine whole** — 150–200 KB files burn the context that should hold the contract. grep, then targeted reads.
- **Critic that saw the test output** — then it is not a predictor and its reliability record is void.
- **Gate without a mutation** — nobody knows if it can fail.
- **Naming the audit set in a prompt** — dominance is then measured on tuned data.
- **A ledger row in your own shape** — `report` cannot read it, so the round leaves no trace (r2: one combined row rendered as "candidates 0"). Use §Ledger row schema; the runner now refuses anything else.
- **A lens a ledger atom already decides** — the candidate converges on its siblings and the soup gains nothing from it (r2: "cuts only" vs E2 *direction encodes relation*). Check §Lens seeds vs ledger before spawning.
- **A brief without the nine sections** — a blank §5 or §6 means FS-hook / FS-textroom have nothing to read and every candidate invents its own hook timing and caption room. Ask the blank-slot question once (film-brief.md), then start.
- **Rendering before the critique exits** — a `render` row with a score < 8 behind it is the spec's "don't skip gates" broken in the ledger; FS-critique and FS-gateorder refuse it, so the MP4 is not a deliverable.
- **A contract that trusts the board** — if the contract names `beat.show` but the boards carry `cameraMove`, every candidate reads one or the other and the merger inherits a contradiction nobody can cite. Open the boards while writing the contract.
