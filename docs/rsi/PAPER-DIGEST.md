# PAPER DIGEST — arXiv 2610.13912 → Motion Atlas Studio Pro v9 "Fable Soup"

**Status:** Full PDF readable (`arxiv.org/pdf/2610.13912`, v1), cross-checked with the abstract page. Items marked *(studio inference)* are my mapping, not the paper's claim.
**Written:** 2026-10-19 · `work/BRIEF.md` item 6 · companion to `docs/META-PLAN-AND-RSI.md` §3 and `docs/RSI-LEDGER.md`.

---

## 1. Citation and plain-English abstract

**RSI-Anything: Unlocking Recursive Self-Improvement with World Models.** Taoyong Cui, Pinxian Zeng, Wanghan Xu, Hao Xiao, Shuhan Xue, Qiang Gao, Wanli Ouyang, Pheng Ann Heng, Zhenfei Yin, Yingcheng Wu, Ling Yang. arXiv:2610.13912v1, submitted 9 Oct 2026 (PDF header 12 Oct 2026). World models built on the authors' JEPA-Anything.

The paper argues that a system improves itself recursively only when it keeps two things and updates them under separate tests: a policy that proposes actions, and a predictive world model that scores proposals before anything expensive runs. Each cycle the policy proposes several candidates, a verifier rejects invalid ones, the world model ranks the rest, and only the top candidate is executed; the observed outcome is logged beside the prediction so model error is measurable per version. The policy is retrained only when a trigger fires; the world model is adapted only when its reliability audit says "unreliable" and data and budget suffice. A new policy and a new model must each beat their predecessor on held-out gate data, and the assembled pair must pass a compatibility test, otherwise the whole old pair is kept. Across code repair, GUI control, lab planning and chemistry the authors show steady gains (code-repair success 26.3% → 31.2% at constant test budget; lab-planning 21.8 → 46.0 over five accepted policy versions).

## 2. The core loop as an algorithm

State at cycle *k* is the retained pair **(θ_k, φ_k)** = (policy, predictor).

1. **Inputs.** A fixed task spec **T_d = (X, S, A, W, V, M, C, B)**: observations/context, state space, action space, world-model adapter, verifier, metrics, constraints, budgets. Frozen for the run.
2. **Predict.** Encode state z_t = E(s_t, c); roll latent forward ẑ_{t+1} = F(z_t, a_t, c); read out an outcome p_φ(o_{t+1} | s_t, a_t, c) (point or distribution; multi-step optional).
3. **Propose.** Policy θ emits K_t candidates for (s_t, goal g).
4. **Verify + select.** Verifier V drops invalid candidates. Survivors are ranked by **R_d = Σ w·r − Δ** (weighted metric readouts minus an optional uncertainty penalty). One candidate is executed.
5. **Self-query / critique.** There is no free-text self-critique. The critique is the **reliability assessment ρ^W_k ∈ {reliable, unreliable, insufficient}** (Eq. 10): error, calibration, drift and coverage of the *current-version* predictions against observations. Earlier-version predictions are kept but never pooled into the estimate.
6. **Feedback / memory.** Observation stored separately from prediction, tagged with generating version and evidence class **E0–E3** (rule check, learned prediction, specialised simulator, external experiment). Appended to history **H_k** and routed into **D_policy / D_adapt / D_sim / D_gate / D_compat**.
7. **Update proposals.** Policy update (Eq. 9) only when trigger **u^π = 1**, using D_policy plus admitted imagined data D_sim (admission indicator e_τ: valid candidate, score threshold, optional uncertainty bound, approved evidence class). World-model adaptation (Eq. 12) only when ρ^W = unreliable, |D_adapt| is sufficient, and budget B_update remains (Eq. 11).
8. **Acceptance.** Component gates **G^π, G^W** compare each proposal to its current version on D_gate. Pair gate **G^pair** (Eq. 17) compares the assembled (θ', φ') against (θ, φ) under matched conditions on D_compat. Fail component ⇒ keep that component; fail pair ⇒ keep the *whole* old pair.
9. **Ledger.** H_k and the retained pair carry forward; an untouched **audit set** is reserved for final reporting only.
10. **Termination.** Budget exhaustion or task-level stopping rules (e.g. code repair: all public tests pass or 3 rounds). No convergence criterion is given.

## 3. What makes it recursive, and what prevents collapse

**Recursive:** accepted revisions of θ or φ change the next cycle's candidates, rankings and training signal, so later learning depends on earlier *accepted* revisions. The authors are explicit that merely extending H_k is not a revision; only accepted changes count.

**Anti-collapse / anti-drift mechanisms:**

| Mechanism | What it blocks |
|---|---|
| Version-attributed reliability (no pooling across versions) | A stale model inheriting credit for a newer one's errors or successes |
| Three-valued ρ^W with "insufficient" | Adapting on too little evidence; the model is never adapted by default |
| Admission filter e_τ on imagined data | Hallucinated rollouts leaking into training |
| Held-out D_gate / D_compat, separate final audit set | Over-fitting to the selection signal; reward hacking the gate |
| Pair compatibility gate G^pair | A "better" predictor that is unreliable on the new policy's candidate distribution |
| Fallback to whole previous pair | Partial upgrades that silently break coupling |
| Explicit budgets B, B_update | Runaway re-evaluation cost |

**Not addressed:** candidate diversity. The paper has no mechanism forcing the K candidates to differ; it relies on the base policy's sampling.

## 4. Mapping table: paper concept → studio artifact → gap

| Paper concept | Existing studio artifact | Gap / what to add in v9 |
|---|---|---|
| Task spec T_d (frozen) | `docs/TYPED-CONTRACT-MOTION-ATLAS.md` closed vocabularies; frozen upstream fields | Make budgets **B** (agent calls, render minutes) and metrics **M** explicit fields of the contract |
| Verifier V (validity) | `scripts/validate-motion-studio.mjs` G01–G29 | Already strong. Gates are *static* predicates on files; add per-candidate gates callable on in-memory storyboard JSON |
| Predictor φ / R_d ranking | None. MOE rounds rank by human/agent critique (A1–A4) | **Biggest gap.** Add a cheap learned/heuristic *predicted WOW score* over (storyboard, palette, feel) so candidates are ranked before compile |
| Prediction vs observation, version-tagged | `RSI-LEDGER.md` records fixes, not predictions | Add `predicted` and `observed` columns per round (e.g. predicted gate score / telemetry vs VBM result) |
| ρ^W reliability status | None | Compute |predicted − observed| per ledger round; flag the ranker "unreliable" when error exceeds threshold |
| Component gate G^π | Negative mutation selftests MUT-01…07 | MUT tests prove the *gate* works, not that a *new version is better*. Add a held-out proof set the candidate must not regress on |
| Pair gate G^pair | Sheaf restriction ρ(child)=parent, δ⁰=0 on DAG forks (G10, G22) | ρ checks *consistency* of a fork with its parent, not *compatibility* of a changed engine with a changed storyboard. Add a joint test: new engine × retained storyboards and old engine × new storyboards |
| K candidates | DAG forks ("Fork 3 Narrative Branches"), A⊕B pushout | Forks exist but are LLM-sampled with no diversity floor; enforce a `tell-apart` minimum distance between candidates (reuse `auditArchetypeDiscriminability`) |
| Evidence classes E0–E3 | Implicit: validator (E0), agent critique (E1), VBM telemetry (E2), owner review (E3) | Tag every ledger finding with its class; only E2/E3 may unlock a music/visual law change |
| Admission e_τ for imagined data | None | Agent-proposed "improvements" enter the ledger only if they cite a gate id or telemetry number |
| Budget B_update | Save-token mode in BRIEF | Formalise as a per-round agent-call cap in the ledger header |
| Audit set | None | Reserve 2 storylines + 1 palette never used for tuning; report only on them at release |

## 5. "Model soup" reading for agent outputs

The BRIEF's soup — N independent Fable agents each produce a candidate, a merger unions strengths, intersects agreed rules, resolves contradictions by contract + gates — maps onto the paper as follows *(studio inference)*:

- The N agents are the **K candidates** of step 3; the merger is a second policy whose candidate is the souped artifact.
- The merge is **not accepted on the merger's say-so**. It must pass: (a) the verifier (all gates) — a union can pull in a failing element; (b) the **component gate**: soup ≥ best single candidate on held-out proofs, else keep the best single; (c) the **pair gate**: souped storyboard × current engine and souped engine × current storyboards both pass, else revert the whole pair.
- Contradictions settled by the typed contract are E0 evidence; those settled by taste need E2 (VBM telemetry) or E3 (owner) before becoming a ledger rule.
- Souping fails silently on near-duplicate candidates. A `tell-apart` distance floor is a precondition for the soup, not polish.

## 6. Eight testable recommendations for a v9 recursive self-query mechanism

Each: **trigger → self-question → artifact → gate**.

1. **Every storyboard fork** → "Which single mark carries `coveredSentence` at 16px with captions hidden?" → `beat.severedMark` per beat → **G11 CoveredOk** extended: `severedMark` non-empty and references a rendered primitive (mutation: blank field fails).
2. **Before compile** → "What WOW score do I predict for this branch, and why?" → `predicted.wow ∈ [0,1]` + 3-line rationale on the DAG node → **G30 PredictionLogged**: prediction timestamp precedes VBM telemetry.
3. **After VBM telemetry** → "How wrong was my prediction, per version?" → `docs/rsi/RELIABILITY.json`, mean absolute error per ranker version → **G31 RankerReliability**: status ∈ {reliable, unreliable, insufficient}; "unreliable" blocks the ranker from pruning until re-fitted.
4. **N soup candidates arrive** → "Are these actually different?" → pairwise `tell-apart` matrix over (palette, feel, camera moves, beat titles) → **G32 CandidateDiversity**: min distance ≥ 0.35 (0.6327 archetype floor as reference), else request another candidate.
5. **After the merge** → "Is the soup better than its best ingredient on untuned proofs?" → `soup-vs-best.json` on the reserved audit storylines → **G33 SoupDominance**: soup ≥ best single on every audit gate, strictly better on one metric, else ship the best single.
6. **Engine code changes (two.js, music)** → "Does the new engine render every retained storyboard identically at seek(t)?" → pixel-hash table, 3 t-samples × 8 storylines, old vs new → **G34 PairCompatibility**: hashes match for unchanged nodes (G06 inheritance), new nodes pass G01–G16; failure reverts the whole pair.
7. **Every ledger append** → "What evidence class justifies this rule?" → `evidence: E0|E1|E2|E3` column in `RSI-LEDGER.md` → **G35 EvidenceTagged**: rows changing a law (vocabulary, music key/tempo, palette pin) cite E2 or E3; E1-only rows are proposals.
8. **End of each round** → "What did we not test?" → generated `coverage.md`: storylines × archetypes × render modes exercised → **G36 CoverageFloor**: ≥ 80% of grid touched; audit set never in the tuning grid.

Each gate gets a negative mutation selftest (MUT-08…MUT-15) per BRIEF.

## 7. Open questions the paper does not settle

- **No convergence or termination theory**: stopping is budget/task rule only. Expect plateaus (lab-planning gains shrink +16, +4, +2.6, +1.5) and decide when to stop souping.
- **No diversity mechanism** for candidates; G32 is our addition.
- **Reliability thresholds are implementation choices** (error, calibration, drift, coverage); G31 thresholds must be calibrated on our telemetry.
- **Feedback only from executed candidates**: the predictor is never checked on what it rejected, so it can be confidently wrong about pruned branches. Occasional execution of a rejected candidate is implied, not specified.
- **Joint multi-round co-improvement** of policy and model within one task is listed as future work; most results change one component at a time.
- **Subjective metrics** (WOW, clarity, messaging) have no analogue; all paper metrics are externally verifiable. Whether an aesthetic ranker is reliable enough to prune is an open empirical question for v9.
- **Pair gate for prose artifacts** (wording, messaging) needs a fixed proof set of scripts we do not yet have.
