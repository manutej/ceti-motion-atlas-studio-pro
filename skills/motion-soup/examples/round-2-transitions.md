# Worked example — round 2, lane `transitions` (the rail test, 2026-10-23)

The first round run end-to-end *through the skill's own runbook*: one new lane, N = 3, all workers Opus 5.5 spawned with the `Agent` tool (`run_in_background: true`, three candidates in one message), the runner for tokens / diversity / literals / ledger, orchestrator Fable. It stopped after the merge on purpose — the point was to measure the fan-out → merge rail and find what the skill itself gets wrong. Every number below is measured; where something was not run it says so. Sources: `work/transitions/CONTRACT.md`, `cand-{A,B,C}.md`, `MERGE-NOTES.md`, `proposed-atoms.json`, `work/soup-ledger.jsonl`.

## 0. Frame

| Input | Value |
|---|---|
| Brief | rail-test the skill on a lane the host does not yet have: `transitions` — `transitionFor(from, to, tokens) → {kind, semantic, t0, t1, focus?}`, `mask(kind, u, focus, w, h)`, `table`, `coverage` |
| Contract | `work/transitions/CONTRACT.md`, 37 lines: API + kind enum, beat subset, relation-inference order, 7 numbered predicates, mutation (`breather → wipe` must fail P2), 18 KB cap |
| Tokens | `work/tokens.resolved.json` from `css:index.html` + `wada:<non-audit>` + `cjs:studio-music-engine.js#TEMPO`; CSS alone left `color.accent/highlight/contrast` missing until the `wada:` source was added; `motion.feels` resolved as names with no easing |
| Fixtures | the two example boards in `work/wording/storyboard-grammar.md` (hook·claim·proof·breather·callback·landing, `totalDurationSec`, beats with `say`, `show`, `cameraMove`, `hinge`) |
| Lenses | A "reading-order wipes" · B "mask follows the focus point" · C "cuts only, meaning carried by hold length" (the three seeds from `lanes.md`, unchecked against the ledger — see §5) |
| Ledger digest | E2 atoms from round 1: *direction encodes relation* (wipe/split/iris per relation), *one hot spot per beat*, G06 determinism, G31 two.js no-op |
| Audit set | not exercised (no integration this round) |

## 1. Fan-out — measured

| Cand | Lens | cand.js | selftest.js | Self-test | Literals | Wall | Tool calls | wow | predicted firstFlag |
|---|---|---|---|---|---|---|---|---|---|
| A | reading-order wipes | 12,266 B | 8,027 B | exit 0 | 0 | 3.5 min | 10 | 0.55 | a number scan on `SECONDS_PER_MINUTE = 60` (unit constant = `tempo.byFeel.rest`) |
| B | mask follows the focus point | 15,821 B | 9,754 B | exit 0 | 0 | 4 min | 11 | 0.62 | relation inference: it ranks zoom-in above the `cause→effect` default, so hook→claim with `cameraMove: push-in` resolves to iris |
| C | cuts only, hold length | 9,894 B | 8,055 B | exit 0 | 0 | 4 min | 9 | 0.46 | the taste gate: the ledger fixes masks for most relations, so "cuts only" shows in three relations and reads timid |

All three were spawned in one message and came back within 30 s of each other. All three ran the same mutation (`breather: 'cut'` → `'wipe'` on an in-memory copy) and all three were caught by P2. Diversity (word-trigram Jaccard, runner): **min 0.897** against a 0.35 floor — souping justified.

**Contract gaps every candidate hit independently** (each wrote it as "open risk"; none asked):

| Gap | Contract said | Boards had | A | B | C |
|---|---|---|---|---|---|
| beat timing | `start: sec, dur: sec, feel` in the beat subset | none of the three | `totalDurationSec / n`, feel from grammar | same | same (`schedule()`) |
| zoom tag | "a beat whose `show` mentions zoom/push-in" | `cameraMove: push-in`, `show` silent | reads `show` only → iris never fires on a board | reads `show` + `cameraMove` + `visualAction` | reads `show` + `visualAction` |
| easing | "no numeric easing constants outside `tokens.motion`" | `tokens.motion.feels` = names, no curves | linear in u | linear unless a feel carries a 4-tuple | linear |

Three candidates, three identical rediscoveries — the cost of one missing contract line is N agents' time plus a merger contradiction. SKILL.md §Authoring a lane CONTRACT.md items 2, 3 and 5 exist because of this table.

## 2. Merge — measured

One merger agent, Opus 5.5: **8.5 min, 19 tool calls**. Output `soup.js` 17,869 B (cap 18,432 — 97 %), `selftest-merged.js` 17,541 B, `MERGE-NOTES.md` 71 lines, `proposed-atoms.json` 10 atoms.

- **Merged predicates 25/25.** Soup passes `selftest-A` unchanged; passes `selftest-B` except one clause the contract narrows (focus on a cut — §API says focus is "where the mask opens", a cut has none); passes `selftest-C` except its number scan on the `60` unit constant (contract §5 lists easing/colour/font only).
- **Dominance:** A 20/25 · B 19/25 · C 18/25 → **bestSingle = A**, soup ⊇ every single on all 25. What each single lacks: A has no `maskAt`/`focusOf`, misses `hinge: BUT` and `cameraMove`, no two.js layer; B puts a focus on cuts, has `2.0`/`ARC = 64` literals, no hook entry; C has literal `0.5`/`2.0`, its iris-back hold ≠ one beat, and callback = cut collapses onto breather.
- **UNION** took B's focus machinery, masks and exact shoelace coverage; A's `BECAUSE` map and null-from hook entry; C's hold ratio (applied to `cut` only) and `twoLayer`. Nothing failed in all three, so nothing was dropped on that count; A/C grid coverage, A/C rect wipe, A `bezierAt`, C `circle` were dropped as losing implementations of a slot a contradiction resolved.
- **INTERSECTION → 10 E1 atoms**, three of which are the contract gaps above (now typed `gate`/`vocab`; the MERGER template now writes shared gaps as type `contract`).

**Contradictions: 18 found, 14 resolved by citation, 4 open.**

| Resolved by | Count | Examples |
|---|---|---|
| CONTRACT clause | 7 | hook = wipe (kind set reachable only as reverse(wipe)); callback test = `callback ∨ returns`; no focus on cut; cut flips at u ≥ ½ (t0/t1 centred on `toBeat.start`); ease must be monotone; literal `60` kept as unit constant |
| lane tie-break (in contract) | 6 | contrast > zoom-in; `hinge: BUT` → contrast; zoom read from `show`/`cameraMove`/`visualAction`; focus from B governs; hold ratio on cut only; Q9 template must describe the shipped mask |
| ledger E2 atom | 1 (+2 co-cited) | callback = cut would collapse onto breather (*direction encodes relation*) |
| **OPEN** (ships bestSingle's value) | **4** | #14 `because.landing` change (A) vs character (B, C) · #15 `because.breather` character vs attention · #16 grammar→feel for proof/callback/landing (A has none) · #17 `dur` when `totalDurationSec` is absent: 0 (A) vs 1 s (C), B's NaN excluded by contract |

The open four are exactly the fields the contract never named (`because` per relation, grammar→feel, the no-duration fallback). The provisional rule the merger applied is mechanical: bestSingle's value; if bestSingle lacks the element, the next candidate by score.

**Gate shipped for the integrator (G35.1–G35.6)** with its mutation verified: `sed "s/breather: 'cut',/breather: 'wipe',/"` → G35.5 exit 1 and selftest-merged 22/25 (P2, E2, P7 fail).

## 3. What was not run

Integrator, blind critic, host `npm test`, dominance on the audit set, pair compatibility — the rail test ended at the merge. Verdict in the ledger is therefore the lane-level `soup>best-single`, not an `accept`. Round 3 on this lane starts at SKILL.md runbook step 7 with `soup.js` as the accepted module and the four open contradictions as `required_slots`.

## 4. Orchestrator timeline (wall 00:20:35 → 00:36:19, 15 min 44 s)

| Clock | Step | Note |
|---|---|---|
| 00:20:35 | 0 frame — read lane stub, open both boards, write `CONTRACT.md` (37 lines) | ≈ 3 min; the gaps in §1 were authored here |
| ≈ 00:23:30 | 3 fan-out — three `Agent` calls in one message | 10 / 11 / 9 tool calls |
| ≈ 00:27:30 | all three back (3.5 / 4 / 4 min); verified both VERIFY commands per candidate; `diversity` 0.897 | < 1 min orchestrator work |
| ≈ 00:28 | 5 merge — one `Agent` call | 19 tool calls |
| ≈ 00:36 | merger back (8.5 min); read MERGE-NOTES; `check-literals soup.js` 0 | |
| 00:36:19 | 9 ledger — one row written | the row the runner could not read back (§5 defect 1) |

Fan-out + merge = 12.5 of the 15.7 min; the rest is contract authoring and orchestration. Lanes run concurrently, so a 3-lane round costs about this plus the integrator.

## 5. Defects found in the skill (all fixed in this revision)

1. **Ledger row shape undocumented.** The orchestrator wrote one combined row (`candidates{}`, `merge{}`, `verdict`, no `kind`); `ledger add` accepted it; `report` printed `candidates 0 | gates 0/0 | kind=-`. Fix: SKILL.md §Ledger row schema; the runner's `SCHEMA` validates every `ledger add` (exit 1 with the missing field names) and `report` renders candidates · selftest/literals · diversity · merge n/n · bestSingle · critic · integrate · verdict · minutes. The legacy row is expanded for display with a `warn:` line rather than failing.
2. **No contract-authoring checklist.** Three candidates hit the same three gaps. Fix: SKILL.md §Authoring a lane CONTRACT.md (11 items); the CANDIDATE prompt gained the `{{CONTRACT_GAPS}}` rule (choose the simplest default, state it, do not ask) and the MERGER prompt writes gaps shared by ≥ 2 candidates as E1 atoms of type `contract`.
3. **Token resolver silent on source order.** CSS alone left accent/highlight/contrast missing until a `wada:` source was added. Fix: SKILL.md §Token resolver names the order css → wada → cjs → json and says to record what the resolved file does *not* carry.
4. **Lens seed overridden by a ledger atom.** C's "cuts only" was already decided by the E2 atom *direction encodes relation*; C differed from A/B only on hook/callback/breather and scored last. Fix: SKILL.md §Lens seeds vs ledger — grep every lens noun against the digest before spawning; replace a dead lens with a dimension no atom names.

## 6. Round-3 prompt generation (what the ledger implies for this lane)

```
required_slots(transitions) = { because.landing, because.breather, feelByGrammar(proof|callback|landing), dur when totalDurationSec absent }   // open #14–#17
contract(transitions)      += beat.start/dur/feel defaults · zoom in cameraMove|show|visualAction · feels carry no easing → linear   // the three E1 contract atoms, promoted
lenses(transitions)         = keep A, B; replace C with a dimension no atom fixes (e.g. "focus travel between beats")
forbidden(transitions)     += decimal literals in VERSION strings (B, C both tripped their own P5 on `2.0`)
avoid                       = none yet (critic not run; reliability insufficient → advisory)
```
