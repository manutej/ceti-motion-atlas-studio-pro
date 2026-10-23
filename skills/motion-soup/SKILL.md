---
name: motion-soup
description: Build or upgrade any animated explainer / motion-graphics deliverable (procedural music, vector layers, storyboard wording, transitions, typography, data-viz) by fanning out parallel Opus subagents under a typed contract, souping their candidates under merge laws, and accepting only what passes the repo's own gates. Use it whenever a motion, explainer, animation engine, WebAudio score or storyboard-grammar task is big enough that one agent's say-so is not good enough, whenever the user says "soup", "model soup", "candidates", "fan out", "parallel agents", "merge the best of", or "self-query loop", and whenever a deliverable must stay brand-agnostic (no hardcoded colours, fonts, tempos).
---

# motion-soup

A model soup for motion work. N independent candidates per lane, one merger per lane, one integrator, one blind critic, the repo's test command as the only judge, a ledger that writes the next round's prompts. Workers are **Opus subagents** spawned with the `Agent` tool; the orchestrator (you — Fable when available, Opus otherwise) only frames, spawns, runs gates, and decides. Nothing here is accepted because an agent said so.

Read `references/prompts.md` before spawning anything; `references/lanes.md` when choosing lanes; `references/gates.md` when a gate fails or a new one is needed.

## When to use

- A new or upgraded animated explainer, motion engine module, procedural score, vector/SVG layer, storyboard grammar, transition vocabulary, kinetic typography or animated chart.
- The deliverable has a **repo test command** (or you can add one) and a **typed contract** (an API the module must expose). Without both, make them first (step 0) — the soup has nothing to judge otherwise.
- Quality matters more than a single agent's taste, and wall-time matters more than token cost.

Do not use for a one-line fix, a prose-only task with no checkable output, or when the user wants to iterate by hand on one file.

## Inputs

| Input | Where | Why |
|---|---|---|
| **Brief** | `work/BRIEF.md` (or inline) | deliverable, audience, must-keep, budget `{agentCalls, wallMin}` |
| **Repo test command** | `package.json` `test` (e.g. `npm test`) | the only gate that decides acceptance |
| **Tokens source** | `tokens.css`, brand JSON, or a palette id resolved by the host engine | all colour / type / motion / tempo values; the skill carries none |
| **Lanes** | 1–6 from the catalog below | each lane = one API contract + one self-test |
| **Audit set** | 1–2 inputs never named in any prompt | dominance is measured here, never where candidates tuned |

## The loop (orchestrator runbook)

Every step names what runs, how it is spawned, and what verifies it. Steps 3, 5 and 7 spawn **in a single message** so agents run concurrently.

**0. Frame (you, ~3 min).** Read the brief. Confirm the test command exits 0 before anything changes (`npm test`). Pick lanes. Pick N (2 for a known lane, 3 for a new one). Pick the audit set. Freeze the contract: write `work/<lane>/CONTRACT.md` per lane (API stub + self-test shape from `references/lanes.md`, ≤ 60 lines).

**1. Resolve tokens (you, 1 min).**
```
node skills/motion-soup/scripts/soup-runner.mjs resolve-tokens <source>... --out work/tokens.resolved.json
```
Sources: `css:<file>`, `json:<file>`, `wada:<id>[@<engine.js>]`, `cjs:<file>#<export>`. Later sources override earlier ones. Check `missing` in the output; fill missing roles from another source or state in the brief that the lane may not need them. Every candidate prompt references this file **by path**; nobody pastes values.

**2. Self-query (you, 2 min).** Run the 12 questions in `references/prompts.md` §Self-queries against the current accepted artifact (round 0: the brief). Each unanswered question becomes a `required_slots` line in the candidate prompt. A question with no gate and no predictor is not asked.

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

**9. Ledger (you, 2 min).** One row per candidate, soup, gate, critic prediction, open item, verdict:
```
node skills/motion-soup/scripts/soup-runner.mjs ledger add '{"round":K,"lane":"music","kind":"candidate","id":"A","selftest":"exit0","bytes":25519,"minutes":11}'
node skills/motion-soup/scripts/soup-runner.mjs report
```
Compare critic `predicted` with observed `firstFlag`; a wrong prediction becomes an `avoid:` line in next round's `required_slots`.

**10. Accept or retain old.** Accept only if 8 passed in full. Otherwise keep the **whole** previous (prompts, predictor, artifact); the round's atoms survive as E1 proposals. No partial acceptance — that is how coupling breaks silently.

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

| Phase | Runs | Parallel? | Expected wall |
|---|---|---|---|
| 0–2 frame, tokens, self-query | orchestrator | — | 5 min |
| 3 candidates | lanes × N Opus agents | all at once | 8–15 min |
| 4 diversity | runner | — | 1 min |
| 5 mergers | one Opus per lane | all at once | 10–15 min |
| 6 soup gates | runner + node | — | 2 min |
| 7 integrator + critic | 2 agents | together | 10–20 min |
| 8–10 audit, ledger, verdict | orchestrator | — | 5 min |
| **Round total (3 lanes, N=2)** | 9 agents | | **≈ 40–60 min** |

Per-agent budgets written into every prompt: candidate file ≤ 40 KB, self-test ≤ 12 KB, ≤ 25 tool calls hint, ≤ 8-line report, stop when the self-test exits 0. Merger ≤ 40 KB soup. Integrator ≤ 1 touched line-range per step. Agents never read a file > 300 lines whole: `grep -n` then `Read` with `offset`/`limit`.

## Token resolver

`work/tokens.resolved.json` is the only place values live. Required roles:

```
color:  paper, ink, accent, highlight, contrast   (+ color.extra.* for named host colours)
type:   display, body, mono, scale[]
motion: feels{ name → {duration?, ease?} }        (names are the contract; numbers come from the host)
tempo:  range[min,max], byFeel{}
```
Candidates read roles (`tokens.color.accent`), never values. `resolve-tokens` prints `missing`; `--strict` turns missing into exit 1. A lane that needs no tempo may ignore `tempo`, but the file still declares it so the gate has something to compare against.

## Gates

**Universal** (every host, implemented by the runner or a 10-line node predicate; see `references/gates.md`): determinism (same `(t, seed)` → identical output; no `Math.random|Date.now|performance.now|requestAnimationFrame` in render/schedule paths), no-literal-token (`check-literals` exit 0), size caps, selftest-exit-0, dominance (soup ≥ best single on the audit set), diversity floor (≥ 0.35), additive-schema-only (existing fields untouched; new fields optional).

**Host-specific**: whatever the repo's test command already checks (here: `scripts/validate-motion-studio.mjs --selftest`, gates G01–G33, MUT-01…14). The integrator adds one gate id + one negative mutation per lane shipped; a new gate without a mutation is not a gate.

## Retain-old rule

If dominance, pair compatibility, or the held-out comparison fails, keep the **entire** previous pair (prompt-set, predictor) and the previous artifact. Ship `bestSingle` only if it alone passes every gate. Record the round's atoms as E1. Never merge "the good half".

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
