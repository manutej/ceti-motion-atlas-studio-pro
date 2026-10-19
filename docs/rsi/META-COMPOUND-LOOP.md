# META-COMPOUND LOOP — the key to motion graphics at scale

**Written:** 2026-10-19 · BRIEF item 6 · builds on `PAPER-DIGEST.md` (arXiv 2610.13912), `AUDIT-v8.md` §E–F, `META-PLAN-AND-RSI.md` §3.
**Method:** `meta-suite:meta-compound` + `meta-suite:meta-prompting` (both loaded). Diagrams: `docs/rsi/workflows.html`. Round-1 instances: `work/round-1-prompts.md`.

**Gate numbering (binding):** G30 music, G31 two.js, G32 grammar, G33 wording (per AUDIT-v8). The digest's RSI gates are renumbered **G34 PredictionLogged, G35 RankerReliability, G36 CandidateDiversity, G37 SoupDominance, G38 PairCompatibility, G39 EvidenceTagged, G40 CoverageFloor**, each with MUT-11…MUT-21.

---

## 0. The key in one paragraph

An explainer is not written; it is **queried into existence**. The studio holds a frozen Typed Contract and a growing Ledger. Each round it asks itself twelve questions about the current artifact; each is bound to a gate (checkable now) or a predictor (checkable after telemetry). Unanswered questions become the slots of the next candidate prompts. N independent agents answer them from the contract alone, a merger soups the answers under the contract, a blind critic predicts what will fail, the gates decide, and the ledger records prediction beside observation. The next round's prompts are **generated from the ledger**, not rewritten by a human. That is the recursion; the gates stop it collapsing.

## 1. The loop as an algorithm

Retained pair at round *k*: **(Θ_k, Φ_k)** = (Prompt-set, Predictor). Θ is the three meta-prompts plus their ledger-injected slots; Φ is the blind-critic rubric plus its calibration table.

**Objects**

| Object | Type | Where it lives |
|---|---|---|
| **Brief** `B` | `{deliverable, audience, claims[], mustKeep[], budget{agentCalls, renderMin}}` | `work/BRIEF.md` |
| **Typed Contract** `T` | frozen: closed vocabularies, per-beat quad `say/show/hear/because`, shotSpec, feel, palette, gates G01–G40, metrics `M`, budgets `B` | `docs/TYPED-CONTRACT-MOTION-ATLAS.md` |
| **Self-Query set** `Q` | 12 × `{question, binds: GateId \| PredictorId, slotProduced}` | §2 |
| **Candidate** `c_i` | `{lane, packet: typed JSON, selfAnswers: Q→text, predicted: {wow, firstFlag}, evidence}` | `work/<lane>/cand-<i>.json` |
| **Soup** `s` | one candidate-shaped packet + `mergeLog[]` | `work/<lane>/soup.json` |
| **Audit set** `D_audit` | 2 storylines + 1 palette never tuned on (`s_hydro`, `s_orbit`; Wada 207) | reserved, never injected into prompts |
| **Ledger** `H` | append-only rows `{round, lane, atomType, predicted, observed, evidence E0–E3, gate}` | `docs/RSI-LEDGER.md` + `docs/rsi/RELIABILITY.json` |

**Steps per round**

1. **Frame.** Read `B`, `T`, the ledger index. Fill Θ's slots from the ledger (§4). Freeze `T` for the round.
2. **Self-query.** Run `Q` against the current accepted artifact (round 0: the brief). Each unanswered question emits a *required slot* into the candidate prompt.
3. **Fan-out.** Spawn `N≥3` one-off agents per lane with the candidate meta-prompt. Each receives only `T`, the required slots, and the ledger digest — never another agent's output, never the audit set.
4. **Diversity floor.** Pairwise `tell-apart` over (palette, feel, camera moves, beat titles, key/tempo); `min ≥ 0.35` else request one more candidate (**G36**). Souping near-duplicates is the paper's unaddressed failure.
5. **Predict before compile.** Each candidate carries `predicted.wow ∈ [0,1]` and `predicted.firstFlag` (the gate it expects to fail first). The blind critic, seeing packets only, writes its own (**G34**: prediction timestamp precedes telemetry).
6. **Merge law.** **Union** of elements that pass a gate in ≥1 candidate; **intersection** of rules all candidates state becomes a proposed atom (E1); **contradictions** resolved by `T` (E0), then ledger E2/E3 atoms, else logged `openContradiction` — never by the merger's taste.
7. **Gate audit.** G01–G40 on `s` and each `c_i`. **G37 SoupDominance**: on `D_audit`, `s ≥ best(c_i)` on every gate and strictly better on ≥1 metric of `M`, else ship `best(c_i)`. **G38 PairCompatibility**: new engine × retained storyboards and old engine × new storyboards both pass; seek-hash at 3 t-samples unchanged for untouched nodes.
8. **Predictor update.** Compare `predicted` with `observed` (gates, VBM telemetry, owner review) per Φ version; write `RELIABILITY.json` status ∈ {reliable, unreliable, insufficient} (**G35**). `unreliable` ⇒ critic comments but cannot prune; `insufficient` ⇒ no update.
9. **Ledger entry.** One row per atom with evidence class (**G39**); coverage grid updated (**G40**).
10. **Accept or retain old.** Accept `(Θ_{k+1}, Φ_{k+1})` only if 7 passed, new Θ beat Θ_k on `D_gate`, and 8 passed. Any failure ⇒ keep the **whole** old pair; the round's rows stay as E1 proposals.
11. **Stop** on budget `B` or two consecutive rounds with no accepted atom.

## 2. The twelve self-queries

Each is asked by the system of its own artifact; each binds to a gate (G) or a predictor (P) and produces a typed slot.

| # | Question the system asks itself | Binds | Slot produced |
|---|---|---|---|
| 1 | What does the viewer not yet *see* if captions are hidden? | G11 CoveredOk | `beat.severedMark` |
| 2 | Which *claim* has no proof mark on screen? | G32 grammar (claim→proof) | `beat.proofMark` |
| 3 | Which *motion* has no "because"? | G11 MovementOk | `beat.because ∈ {attention, continuity, change, character}` |
| 4 | Which *beat* has no "hear"? | G30 music cue | `beat.hear = {mood, cue, duck}` |
| 5 | Where does the piece *breathe*, exactly once? | G11 OneBreather + G30 breather mood | `beat[i].grammar = breather` |
| 6 | What would a Fable critic flag *first*? | P: Φ.firstFlag → G34/G35 | `predicted.firstFlag` |
| 7 | What is still in frame that does not have to be? | G05 Bass ladder, 16px test | `ladder.rung5` |
| 8 | Which *word* would an eighth-grader stumble on? | G33 wording | `say` rewrite |
| 9 | Which *transition* carries no meaning? | vocab atom → G39 (E2/E3 only) | `transition.semantic` |
| 10 | Are the candidates actually *different*? | G36 diversity | `tellApart.min` |
| 11 | Is the soup *better* than its best ingredient on untuned proofs? | G37 dominance | `soupVsBest.json` |
| 12 | Does the retained world still *render identically* at `seek(t)`? | G06 + G38 pair | `hashTable[3×8]` |

Questions 1–9 shape content; 10–12 guard the mechanism. A question with no gate and no predictor is not admitted to `Q`.

## 3. The meta-prompts (verbatim, fill-in-the-slots)

Rules shared by all three: example-agnostic; typed slots; a resolved slot is immutable downstream; output is JSON validated against `T`; cite a gate id or ledger row for every rule you apply; never read another agent's candidate.

### 3a. CANDIDATE (one-off agent, any lane)

```xml
<candidate_agent lane="{{LANE: music|visual|wording|storyboard}}" round="{{K}}" id="{{I}}">
  <system>
    You are one independent ingredient of a model soup. You never see the other
    ingredients. You produce ONE typed packet for the lane above. Everything you
    assert must be checkable by a named gate or marked as a prediction.
  </system>
  <inputs>
    <contract>{{T: path or inline excerpt of closed vocabularies for this lane}}</contract>
    <brief>{{B.deliverable}}, audience {{B.audience}}, keep {{B.mustKeep[]}}</brief>
    <ledger_digest>{{H.index filtered to lane, E2/E3 rows only, ≤40 lines}}</ledger_digest>
    <required_slots>{{slots emitted by unanswered self-queries, as Q# → slot}}</required_slots>
    <budget>{{B.agentCalls per candidate}}, {{B.renderMin}}</budget>
    <forbidden>Math.random, Date.now, external assets, audit-set storylines {{D_audit.ids}}</forbidden>
  </inputs>
  <procedure>
    1. Restate the lane's contract slots you will fill, with their types.
    2. Answer each required self-query in one line; the answer IS the slot value.
    3. Produce the packet. For every element, name the gate that will check it.
    4. Predict: wow ∈ [0,1], firstFlag = the gate you expect to fail first, 3-line why.
    5. Self-mutate once: break one element, state which gate catches it, restore.
  </procedure>
  <output format="json">
    { "lane": str, "packet": {{LANE_SCHEMA}}, "selfAnswers": {"Q#": str},
      "gateClaims": [{"element": str, "gate": "G##"}],
      "predicted": {"wow": num, "firstFlag": "G##", "why": str},
      "mutationProof": {"broke": str, "caughtBy": "G##"},
      "proposedAtoms": [{"type": "gate|mutation|vocab|motif|transition", "text": str, "evidence": "E1"}] }
  </output>
</candidate_agent>
```

Lane schemas: `music` → `{bpm, key, cues[8]{mood, t0, t1, voices, duck}}`; `visual` → `{layers[], primitives[], seekFn: "f(t,seed)"}`; `wording` → `beats[8]{say, show, hear, because, grammar}`; `storyboard` → the contract's `beats[]` with `shotSpec`.

### 3b. MERGER

```xml
<merger lane="{{LANE}}" round="{{K}}">
  <system>
    You soup N candidates into one packet. You have no taste. Three laws only:
    UNION of elements that pass a gate in ≥1 candidate; INTERSECTION of rules
    all candidates state becomes a proposed atom (E1); CONTRADICTIONS resolved
    by the contract (E0), then by ledger E2/E3 atoms, else logged open.
  </system>
  <inputs>
    <contract>{{T}}</contract>
    <candidates>{{c_1..c_N as JSON}}</candidates>
    <gate_results>{{per-candidate G01–G40 table}}</gate_results>
    <diversity>{{tellApart matrix; abort if min < 0.35}}</diversity>
    <ledger_atoms>{{E2/E3 rows for this lane}}</ledger_atoms>
  </inputs>
  <procedure>
    1. List every element across candidates with its gate verdict.
    2. Apply UNION; drop any element failing all candidates.
    3. Apply INTERSECTION; emit agreed rules as proposedAtoms.
    4. For each contradiction, cite the resolving contract clause or ledger row,
       or write it to openContradictions. Never resolve by preference.
    5. Emit the soup packet and a mergeLog line per decision.
  </procedure>
  <output format="json">
    { "soup": {{LANE_SCHEMA}}, "mergeLog": [{"element": str, "law": "union|intersection|contract|ledger", "cite": str}],
      "openContradictions": [str], "proposedAtoms": [...], "bestSingle": "cand-id" }
  </output>
</merger>
```

### 3c. BLIND CRITIC (predictor Φ)

```xml
<blind_critic round="{{K}}" phi_version="{{Φ.v}}">
  <system>
    You see packets, never renders, never telemetry, never the audit set. You
    predict what will fail and how much the viewer will feel. Your record is
    audited per version; being confidently wrong lowers your authority to prune.
  </system>
  <inputs>
    <contract>{{T}}</contract>
    <soup>{{s}}</soup> <best_single>{{best c_i}}</best_single>
    <self_queries>{{Q 1–9}}</self_queries>
    <reliability>{{RELIABILITY.json status for Φ.v}}</reliability>
  </inputs>
  <procedure>
    1. For each self-query, answer for soup AND best single; mark unanswered ones.
    2. Name firstFlag (gate id) for each, and the single sentence Bass would cut.
    3. Predict wow ∈ [0,1] and clarity grade ≤ 8 for each; give one falsifiable reason.
    4. Rank: soup vs best single. If reliability ≠ reliable, mark rank "advisory".
  </procedure>
  <output format="json">
    { "answers": {"soup": {"Q#": str}, "best": {"Q#": str}},
      "predicted": {"soup": {"wow": num, "firstFlag": "G##"}, "best": {...}},
      "bassCut": str, "rank": "soup|best", "authority": "prune|advisory" }
  </output>
</blind_critic>
```

## 4. The compounding law

**What is written back after every round** (atoms; one ledger row each; all tagged E0–E3 and `round`, `lane`, `Φ.v`):

| Atom | Admission rule | Becomes |
|---|---|---|
| **New gate** `G##` + `MUT-##` | only from an E2/E3 finding the existing gates missed | a predicate in `validate-motion-studio.mjs` |
| **New mutation** | every new gate; or a critic firstFlag that a gate did not catch | a negative selftest |
| **Vocab entry** | intersection rule confirmed by telemetry/owner | closed-vocabulary term in `T` |
| **Motif** (plant/return) | storyboard element that passed Callback in ≥2 storylines | reusable `motifs[]` the storyboard lane may cite |
| **Transition semantic** | transition whose "meaning" sentence survived G33 and owner review | `transition.semantic` vocabulary |
| **Prediction row** | always | `predicted` vs `observed` for Φ reliability |
| **Coverage cell** | always | G40 grid |

**How the next round's prompts are generated from the ledger** — this is the recursion:

```
Θ_{k+1}.candidate.required_slots  = { Q# : slot | Q# unanswered on accepted artifact_k }
                                   ∪ { "avoid: " + firstFlag | observed firstFlag ≠ predicted firstFlag }
Θ_{k+1}.candidate.ledger_digest   = top-40 E2/E3 atoms for the lane, newest first
Θ_{k+1}.merger.ledger_atoms       = all E2/E3 atoms for the lane
Θ_{k+1}.critic.reliability        = RELIABILITY.json[Φ.v]
Θ_{k+1}.candidate.forbidden      += elements that failed in ≥2 candidates this round
Q_{k+1}                           = Q_k ∪ { q | q from an E3 critique, bound to a gate or predictor }
```

No one rewrites prompts by hand. A human changes the brief or ratifies an atom (E3); the generator does the rest. Teach once, reuse forever.

## 5. Scaling table — which limits disappear

| Limit | Mechanism that removes it |
|---|---|
| **Context length** (199 KB engine, 150 KB UI) | Agents never read the engine: only `T` (≈6 KB per lane), required slots, a 40-line ledger digest. Packets, not files, cross agent boundaries. |
| **Taste drift** | Taste enters only as an atom with E2/E3 evidence; G37 is measured on the never-tuned audit set. |
| **One-model blind spots** | N independent candidates + diversity floor (G36) + a blind critic whose authority is version-audited (G35). |
| **Re-explaining house style** | Ledger digest injected automatically; vocabulary, motifs, transition semantics are closed lists in `T`. |
| **Merger say-so** | Merge law has no taste branch; G37 ships the best single if the soup does not dominate. |
| **Engine change breaks old work** | G38 seek-hash pair compatibility; failure reverts the whole pair. |
| **Runaway cost** | `B.agentCalls`, `B.renderMin` are contract fields; stop rule §1.11. |
| **Prose has no pixels to hash** | Wording lane gets a fixed proof set of 8 scripts (G33); ratified scripts become the held-out `D_gate` for prose. |

## 6. Failure modes and the retain-old rule

1. **Near-duplicate soup** — union adds nothing. Caught by G36; remedy: one more candidate with a forced different `feel`/`key`.
2. **Union pulls in a failing element** — passes alone, breaks a gate in context (music cue vs SFX). Caught by the full gate run on `s`, not on parts.
3. **Predictor wrong on pruned branches** — Φ is never scored on what it rejected. Every third round, compile one critic-rejected candidate (E2).
4. **Gate hacking** — candidates learn the gate text. G37 is measured on `D_audit`, never in prompts.
5. **Ledger rot** — digest ≤ 40 lines; uncited atoms archived after 5 rounds; E1 proposals expire after 2.
6. **Evidence laundering** — merger's intersection treated as law. G39: E1 rows change nothing in `T`.
7. **Validator sandbox** — two.js/AudioContext constructors throw in `vm` (AUDIT-v8 F1–F2); guard with `typeof` checks.

**Retain-old rule.** If G37, G38, or the Θ-vs-Θ_k held-out comparison fails, the **entire** previous pair (Θ_k, Φ_k) is kept; the shipped artifact is `best(c_i)` if it alone passes G01–G40, else the previous accepted artifact; the round's atoms survive only as E1 proposals. Partial acceptance is how coupling silently breaks.

---

*First move:* run `work/round-1-prompts.md` (music + two.js + wording, N=3 each), write `RELIABILITY.json` with status `insufficient`, and add G34–G40 stubs with their mutations before any candidate is merged.
