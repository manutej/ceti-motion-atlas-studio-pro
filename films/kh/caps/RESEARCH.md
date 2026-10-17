# CETI Capabilities — research brief (grounding for ~25 s Whale Line films)

Compiled 2026-10-17 from Manu's Notion workspace (read only) plus, where Notion is thin, his own installed skill files (marked [skill]). Page titles and URLs are in the Sources list at the end. Quotes are verbatim and kept short.

## 0. Format constraints these films inherit (from the Design Registry)

- **Whale Line format** (registered `whale-line-format-v1`, v1.1 "air mode"): "one line of thinking draws the sea; the little whale swims under it and hops onto each key word on the beat; the camera pulls back to show the whole line as the summary. A story is a small JSON file: title, 4–8 words with one-line glosses, a Wada combination, BPM." Existing stories: `kh/lines/stories/brief.json`, `brief-v2.json` (6 stations, `{word, sub}`), 24 s at 128 BPM, 5 beats per station.
- **Style:** Kinetic Hydrography 1.0.0. Every colour comes from a token (colour-provenance gate).
- **Gates the films must pass** (`kh/caps/tool.cjs`, Brief v2 record): read time ≥ 0.6 s + 0.15 s per word; whale on-screen jump ≤ 30 px and ≤ 0.35 rad per frame at 60 fps; contrast ≥ 4.5:1 for every text/ground pair; flash safety; loudness about −16 LUFS; ffprobe spec.
- **What this means for wording:** station words should be one word; glosses 2–5 words. Six stations at 128 BPM and 5 beats each is about 14 s of stations, which leaves intro and outro room inside 24–25 s.
- `kh/caps/tool.cjs` already calls the series **"CETI Capabilities"**: one folder per episode at `kh/caps/<slug>/` with `film.js` and `score.py`.

---

## 1. Compositional AI (operads, typed composition, operadic stitch)

**His vocabulary and definitions**
- "A **coloured operad** has typed many-input operations that compose when an output type matches an input type, associatively, with identities. The studio uses that as an engineering discipline, not a theorem." It answers "which units plug into which, which can run in parallel, and where the checks go." (*The operad of design units*)
- Law 1, "**Typed plugging.** Compose only when types match; otherwise insert a named adapter." Law 4, "**Disjoint slots commute** — the parallelism licence." Law 7, "**Checks live at seams**." (*The operad of design units*)
- Context Atoms: "You edit small typed *atoms* here; agents compose them into prompts and sub-agent briefs with a short term, and the engine checks the result (types, fact consistency across delegations, confidentiality, recursion bounds) before anything is sent." (*Context Atoms — operadic stitch*)
- "Context is not written, it is **composed**." "Facts must glue … a disagreement is a RED finding, never last-write-wins." [skill: operadic-stitch]
- JEV: "**γ is defined only on a color match.** That is the type checker." "Fail closed. Compose only on GREEN." "A claim cannot occupy an evidence port." (*JEV × JAX × The Twenty*)

**Core mechanism in plain words:** Build a big job from small parts that have labelled sockets. A part snaps in only if its output label matches the next socket. Because every joint gets checked, you can trust how the whole thing is wired.

**Stations (in story order)**
| Word | Gloss |
|---|---|
| Atoms | small typed parts |
| Types | each socket has a colour |
| Snap | fits, or refused |
| Seams | checks live at joints |
| Parallel | separate parts run together |
| Certificate | a receipt for every joint |

**Concrete example (his numbers):** Context Atoms' first three jobs (16 Oct 2026). Motion Atlas dashboard: 3 prompts, 41 atoms, GREEN. Motion graphics notebook: 3 prompts, 26 atoms, GREEN. Little whale film: 3 prompts, 41 atoms, GREEN. The three jobs share a "spine" of 9 atoms. In JEV, a sub-answer that tries to fill the `evidence` port with an `action` is refused.

**Visual metaphor:** The line rises into a row of notches, each a different colour. The whale nudges small coloured blocks along the line. A matching block clicks into its notch with a short line flash. A mismatched block bounces off and the line stays flat ("refused"). Pull back: the notched line reads as one tree.

**End belief:** Big AI work becomes checkable when it is built from small typed parts that only connect where the types fit.

**Misconception to avoid:** That composition makes the AI correct. Typed plugging catches wiring mistakes, not wrong content. His own words: "Consistency is not correctness."

**Accuracy cautions**
- He says outright that it is "an engineering discipline, not a theorem." Don't say it "proves" a prompt or an agent is right.
- Associativity and identity hold for the engine's term algebra (bag, seq, glue, restrict, nest). They do not hold for LLM outputs.
- JEV is "not (yet): JAX. Gradients. … FOL. A Lean kernel." Don't conflate it with formal proof.
- **Overlap warning:** *Composition — film v1/v2* already exists and is shipped: "Trustworthy AI by composition, really simple: one big box becomes small checkable parts that only snap if their types fit … 'Every part checked.'" A Capabilities episode has to differ from it (for example, stitching context for agents, or seams and parallelism) or it becomes a re-cut.

---

## 2. Formal systems for correctness (gates, contracts, verification, fail-closed)

**His vocabulary and definitions**
- FRONTIER project: "the bridge between formal provers and coding agents (C→Rust, verification, decomposition, context management, RSI)." (*FRONTIER Research Graph*)
- "SMT-backed auto-active verifiers (Verus, Dafny) are where LLMs work best … **Verifier is an oracle for proofs, not specs**: strong systems add anti-cheat gates." (*llm-verification*)
- "**Beauty is not a gate.** The gates prove the absence of catalogued failures, not the presence of quality." (*Limits & escapes register*)
- Jury doctrine: "**Evidence or strike.**" "**Never weaken a gate.** Every fix ships with a check that fails on the old copy." (*The jury*)
- Studio constitution veto list: "builder ≠ evaluator ≠ fixer · never weaken a gate · no console errors · every control works." (*Estate integration*)
- JEV: "Fail closed." "Soft trains; hard ships." (*JEV × JAX × The Twenty*)

**Core mechanism in plain words:** Write down what must be true. A machine checks it every time and stops anything that fails. People choose the rules; the machine never gets tired of applying them.

**Stations**
| Word | Gloss |
|---|---|
| Spec | what must be true |
| Check | a machine, not opinion |
| Gate | pass, or stop |
| Fail-first | the test breaks the old copy |
| Escape | what slipped past |
| Rule | the escape becomes a check |

**Concrete examples (his records)**
- *Escape → new check:* "Example declared IBM Plex, rendered Inter." It slipped past a font check that only read the declared name. It is now caught by checking the faces that actually render. Also: "Built page at 1.18:1 contrast" slipped past because contrast was computed on tokens only. (*Limits & escapes*)
- *Gates on the films themselves:* the gates caught the Brief film's whale take-off snapping at 1.26 rad/frame (fixed to 0.11) and its swim at 41 px/frame (fixed to 26.5) before render. (*Whale Line — The brief v1*) This is a very good self-referential example.
- *Scale:* the jury's round 1 found 14 P0, 28 P1 and 8 P2. Final re-run: "116 passed, 0 failed". (*The jury*)
- *Field numbers:* Verus system proofs 81%, DafnyBench 92.7%, Lean end-to-end VERINA proof 4.9%. (*llm-verification*)

**Visual metaphor:** A small gate (two ticks) stands on the line. The whale swims through and the gate glows. A wobbly copy of the line hits the gate and stops. One wobble slips through ("escape"). The line then draws a second, tighter gate behind the first.

**End belief:** Let machines check the rules on every run. People decide which rules matter, and every miss becomes a new rule.

**Misconception to avoid:** That "passed the gates" means good, true or proven. His register says a gate proves only the absence of the failures it catalogues.

**Accuracy cautions**
- Most of his "machine gates" are mechanical checks (contrast, timing, hashes, schema, type matches). They are not theorem proofs. Don't put "proof" or "Lean" on screen for them.
- A formal verifier checks a proof against a spec. It cannot tell whether the spec matches the intent: "spec integrity is the weak point."
- LLM success on Lean end-to-end verification is low (VERINA 4.9%). Don't imply that AI routinely produces formal proofs.

---

## 3. Sheaf memory (Stalks & Sections)

**His vocabulary and definitions**
- "Nodes: sources, topics, claims … **Stalks**: small feature vectors … Typed edges … each carry **restriction maps**; coboundary δ and Laplacian L = δᵀδ." "Glue locally consistent sections; per-edge **discord** ‖F_u x_u − F_v x_v‖² flags conflicts for human review. **Consistency ≠ truth**." (*Memory System Design*)
- Video idea #2: "**Sheaf Diffusion: How Local Data Learns to Agree** — seven sensors disagree, and one equation makes them consistent without a central boss." Social cut: "**One Equation, Seven Opinions**." (*Video ideas*)
- "Best blueprint: PAGR — embeddings only rank; certified facts need provenance; **sheaf energy = consistency, not truth**." (*sheaf-memory* topic)
- The lattice review's colour code: teal = observed wiring; "A **terracotta edge** is an overlap named in the source as unbuilt, unresolved … not a decoration." (*OAH 3D sheaf lattice — private review*)
- Stalks & Sections (github.com/manutej/stalks-and-sections) is his WebGL explorer: stalks are variable-dimension vector spaces, plus restriction maps and sheaf-Laplacian residuals. No dedicated Notion hub page was found.

**Core mechanism in plain words:** Each note keeps its own local view. Wherever two notes overlap, you compare what each says about the shared part. Mismatches light up. When every overlap agrees, the local pieces fit together into one consistent whole.

**Stations**
| Word | Gloss |
|---|---|
| Stalk | what each note holds |
| Overlap | the part two share |
| Compare | read it both ways |
| Discord | a seam that disagrees |
| Glue | agreement everywhere |
| Section | one consistent whole |

**Concrete examples (his numbers)**
- *Plain and visual:* the film consistency gate treats a film's storyboard, data, scene code and render as artifacts "that must agree wherever they overlap." Check R1, storyboard captions against data.js captions: the Type-safe film "fails: 18 vs 20, with 6 text and 3 timing mismatches." Repair rule: "Each overlap gets one authority." (*Research agenda*)
- *Technical:* on the 215-node FRONTIER sheaf, three independent libraries (Rust sheaf-spectral, Python TopoNetX + scipy, Haskell hmatrix) give identical H⁰ = 588 and edge discord to ≤ 1e-13, so "spec is source of truth." (*sheaf-memory* gluing notes)
- *Honesty example:* the atlas's own audit found "47 of 60 sampled citations faithful: **glued is not the same as true**." (*Memory graph map*)

**Visual metaphor:** The line breaks into five short wave segments, one per note. Where two segments meet, their ends must sit at the same height. One seam is off and glows terracotta. The whale hops to that seam, the two ends meet and turn teal, and the line runs on as one smooth wave.

**End belief:** Memory stays trustworthy when each note is checked against its neighbours where they overlap, and disagreements are shown, not overwritten.

**Misconception to avoid:** That a consistent memory is a true memory. Consistency can be wrong everywhere at once. Provenance is a separate check.

**Accuracy cautions**
- For a finite cellular sheaf, the kernel of the sheaf Laplacian is the space of global sections (H⁰), and zero energy means every edge agrees. That much is safe. H⁰ = 588 is a dimension, not "588 facts."
- His open note: "identity restriction maps ≈ graph Laplacian⊗I; need typed non-identity maps." His current memory graph doesn't yet use learned or typed restriction maps. Don't claim it does.
- On the p5 memory graph he writes: "The sheaf vocabulary is a **lens** over these conservation checks. It is not a claim that the graph is a cellular sheaf." The film gate says the same. Keep "sheaf" as the lens unless the subject is the FRONTIER computation.
- His sources disagree: SLM-V3 uses H¹ as the contradiction detector, while PAGR argues for H⁰ and energy. Don't say "cohomology detects contradictions" as settled.
- "Without a central boss" is fine for diffusion. Don't say diffusion "finds the truth."

---

## 4. Noether symmetry for knowledge bases (noether-wiki / noether-harness)

**His vocabulary and definitions**
- "Instead of hoping the knowledge base stays coherent, you declare **conserved quantities** (link integrity, entity uniqueness, provenance coverage, ontology consistency...) and the agent may only commit steps that preserve them within a declared **drift budget**." "The wiki doesn't just store knowledge — it stores *the laws that keep the knowledge trustworthy* and *the ledger of every time those laws fired*." [skill: noether-wiki]
- Wiki anatomy: `LEDGER.md` (every commit and every fire), `RE-BASELINE.md` (intentional changes to a law), `ESCAPES.md` ("defects found *after* commit — fuel for new lenses"). Notion pages built "in a noether-wiki shape: one page per entity or concept, typed relations, every non-obvious claim tagged with a source, a ledger of what happened, and an escapes register." (*GenUI Studio — Research Wiki*)
- How it is sold: "category theory and **Noether-symmetry mapping of codebases**, adversarial multi-lens review." (*MetaSuite / meta-prompting system — the sellable asset*)
- Theorem R in plain words: "the extractor explores *content* while integrity, uniqueness, and provenance are frozen axes." [skill: noether-wiki THEORY]
- "Three spaces of symmetry" and the symmetry-inventory suite exist only in his account memory (August 2026: symmetry-inventory v0, piloted on the CETI skill library, value measured with tell-apart). **No Notion page was found**, so don't put that phrase on screen without a source.

**Core mechanism in plain words:** Name the few things that must never change: no broken links, one page per thing, every claim sourced. Content can change freely, but every edit is measured against those, and an edit that breaks one is repaired or refused.

**Stations**
| Word | Gloss |
|---|---|
| Change | content moves freely |
| Conserve | what must not change |
| Measure | count it every edit |
| Budget | how much wobble allowed |
| Repair | fix before commit |
| Ledger | every fire written down |

(Optional seventh: **Escape**, "a miss becomes a law.")

**Concrete example (his numbers):** a 437-entity atlas was merged with 111 new lab entities into a 548-entity, 2,933-triple graph. The gates read "exact 0 · soft drift 0.0 · prov.coverage 0.988 · orphans 0 · stubs 0". Types grew from 13 to 17 only "via logged RE-BASELINE." (*Memory graph map*) The honest counterweight: provenance coverage 0.988 is not truth, since the citation audit found 47/60 faithful.

**Visual metaphor:** The whale swims and the line bends freely into new shapes (the content changes). Three small pinned dots on the line never move. When a hop tugs one pin, the line springs back to it. A tiny counter in the corner stays at 0.

**End belief:** A knowledge base stays trustworthy when you name what must never change and check it on every edit.

**Misconception to avoid:** That Noether's theorem is literally applied or proved for wikis. In his words: "there is no Lagrangian and no symmetry group here — Noether *derives* conserved quantities, we *choose* them and then *discover* more from escapes … The direction of derivation is reversed. **Do not overclaim the analogy** in any artifact."

**Accuracy cautions**
- If the real theorem is mentioned, state it carefully: every *continuous (differentiable)* symmetry of a physical system's action gives a conserved quantity (time-shift symmetry gives energy). Not "every symmetry."
- Say "Noether-inspired" or "conservation-checked." Never "a Noether theorem for knowledge."
- Drift bounds add up by the triangle inequality, which is honest and simple. Don't upgrade that into a stronger guarantee.

---

## 5. Tell-apart (can this representation tell apart what its decisions need?) — recommended extra

**His vocabulary:** "One deductive fact powers this skill: **a consumer that sees only a representation's output cannot systematically act on distinctions the representation collapses** — provided the outputs are identical as consumed … and the consumer truly sees nothing else. Everything else here is disciplined heuristic, not theorem." Triggers: "green during the outage", "tests pass but bugs ship". [skill: tell-apart] In Notion it is listed in the Eval / verification cluster (*Estate integration*), and his memory says it measures the value of the symmetry lens.

**Mechanism in plain words:** If two different situations produce the same dashboard reading, no decision based on that reading can treat them differently. Find the pair, then add the missing distinction.

**Stations:** Decision — who acts on it · Collapse — two realities, one reading · Witness — show both side by side · Split — add the missing distinction · Green — irrelevant change, same reading

**Example:** It is fictional and the skill marks it "CALIBRATION ONLY", so label it illustrative. A global checkout success rate of 99.1% (EU lockers hard down: 0% success on 4% of traffic) and 99.2% (healthy everywhere) both render green and neither alerts. The aggregate hides a regional outage. The skill's contract was "calibrated by a 100-case evaluation (20 independent Sonnet testers, 5 adversarial judges)."

**Visual metaphor:** Under the line, two waves: one calm, one with a gap. Above them the line reads exactly the same. The whale dives, finds the gap and surfaces, and the line splits into two strands.

**End belief:** If two different situations look the same in your numbers, nothing built on those numbers can tell them apart, so find the pair and fix the representation.

**Misconception:** That "more metrics" fixes it, or that a Galois/Stone–Weierstrass theorem is being applied. **Cautions:** the only deductive claim is function composition, and it needs the "closure" condition (no side channels). Banned words in findings: "orbit", "quotient", "invariant", "certified".

---

## 6. Recursive self-improvement, the bounded kind (RSI / Recursive Meta Prompting) — recommended extra

**His vocabulary**
- "Each candidate revision of the skill changes **exactly one instruction**, so its effect on scores can be attributed and reverted." "Success framed as a checkable number, not 'make it better'." "The core move of an RSI loop." (*Single-change skill edit*)
- RMP: "draft → critique → edit script → apply, **until the edit script is empty**." (*The studio meta-prompt + RMP ledger*)
- Context Atoms' **Runs** log is "what the self-improvement loop learns from." (*Context Atoms*)
- "It is not a model rewriting its own weights or its own judges." "Scores come from outcomes … never from the engine's verdict." [skill: operadic-stitch RSI.md]

**Mechanism in plain words:** Change one thing, score it with something that didn't make it, keep it only if the score improves, and repeat until the critics find nothing left to fix.

**Stations:** Draft — first version · Critique — a fresh reader · One change — attributable edit · Score — fixed yardstick · Keep — or revert · Fixpoint — nothing left to fix

**Example (his ledger):** three critics produced 14 + 14 + 10 = 38 edits, taking the meta-prompt from v1 to v3. The author's re-check found 0, so v3 is the fixpoint.

**Visual metaphor:** The line has three kinks. On each lap the whale smooths exactly one. A counter ticks 28 → 10 → 0 (three rounds; the two 14s in the ledger are two critics in round 1, and the 0 is the author's re-check), and at 0 the line holds still.

**End belief:** Self-improvement you can trust is a measured loop: one change at a time, judged by something else, kept only if it wins.

**Misconception:** That the AI rewrites itself without limit (the "singularity"). **Cautions:** "fixpoint" means these critics found no more edits. It does not mean optimal. His panel was one model family ("Independence is bounded").

---

## 7. Adversarial jury ("the builder never judges") — optional, could fold into #2

**His vocabulary:** "**The builder never judges.** Seats are fresh agents; builder, merger and fixer are three different agents." "**Evidence or strike.**" "Agreement is not correctness; disagreement is adjudicated, never averaged." (*The jury*)

**Mechanism:** A different agent, one that didn't make the work, tries to break it, and every complaint has to point at evidence.

**Stations:** Build · Seats — fresh critics · Evidence — or strike · Fix — separate hands · Re-break — try again

**Example:** Round 1 had 57 rows, 0 struck, giving 14 P0 / 28 P1 / 8 P2. Fixers working on disjoint files went 0/22 → 22/22, 0/15 → 15/15 and 0/16 → 16/16. In round 2 the red team "tried 18 new bypasses: all contained." Final: 116 passed, 0 failed.

**Visual:** The whale draws the line, then three outline whales (critics) poke it. Two pokes leave marks; the line is patched and holds against the third.

**End belief:** Work gets trustworthy when someone who didn't make it has to try to break it, with evidence. **Misconception:** that more AI judges agreeing means correct. **Caution:** all seats were one model family, so self-preference is reduced, not removed.

---

## 8. Provenance ledger (fingerprints and hash chains) — optional

**His vocabulary:** "Ledger: **Append-only; each entry carries the hash of the one before.** `register.py --ledger` checks the chain." "**Never edit a registered design's files in place.** Make a new version." "The registry answers three questions about any frame: which style drew it, what it was derived from, and whether it passed its gates." (*How to register a design*) Also "Every rendered line traces to an atom@version." [skill: operadic-stitch]

**Mechanism:** Every artifact gets a fingerprint of its files and its parents' fingerprints, linked in a chain, so any silent change shows up.

**Stations:** Fingerprint — a file's unique mark · Parents — what it grew from · Chain — each links the last · Verify — re-hash, compare · Version — never edit in place

**Example:** Composition film v1 has fingerprint `f7c3dd21…` and parents kh-style-1.0.0 (`31bf64a4…`) and character-sheet-v2 (`a5642288…`). `register.py --verify <id>` re-hashes everything.

**Visual:** Each whale hop ties a knot on the line, linked to the one before. When a knot is tugged (an edit), the break shows downstream.

**End belief:** Every artifact can say where it came from, and any silent change shows. **Misconception:** that a hash proves quality, truth or authorship. It only shows the file is unchanged since it was registered. **Caution:** there's no signing in this system. Tamper evidence depends on keeping the chain head somewhere trusted.

---

## Existing series, episode names and taglines

- **CETI Capabilities**: the series name in `kh/caps/tool.cjs` (this folder).
- **Whale Line** (format v1, v1.1 air mode). Films: *The brief* v1 (30 s, 120 BPM) and v2 (24 s, 128 BPM). Title "Brief Claude in *one line*." Outro "One line of *thinking*." Stations: Goal, Context, Constraints, Example, Format, Check.
- **Kinetic Hydrography 1.0.0** films in the Design Registry: Little whale v1/v2, Signal v1, Sea of data v1 ("CETI makes sense of a sea of data: the whale senses 880 points … four clusters … AI pods go to work"), and **Composition v1/v2** ("Trustworthy AI by composition"; end line "Every part checked."), which overlaps capability #1.
- **p5.js Explainer Lab, Video ideas, "Our math" list:** "Functors Are Structure-Preserving Shadows"; "Operads: Plugging Machines into Machines" (associativity as two assembly orders morphing into one tree); "Cohomology Detects Holes"; "Knowledge Graphs as Sheaves" (enterprise bridge: disagreement heatmap and consistency repair); "Sheaf Diffusion: How Local Data Learns to Agree" (#2 build-first); social cut "**One Equation, Seven Opinions**."
- Other series, from his memory rather than Notion: "Claude, demystified" (6 episodes); "AI at work, explained simply" / "AI's mistakes, explained simply" (visual language: peach dashed = unverified, sage solid = verified, rust strike = fixed).
- **Taglines and lines worth reusing:** "Fail closed. Compose only on GREEN." · "Soft trains; hard ships." · "Consistency is not correctness." · "Glued is not the same as true." · "Beauty is not a gate." · "The builder never judges." · "Evidence or strike." · "Never weaken a gate." · "Context is not written, it is composed." [skill] · "Train a JAX circuit to inhabit an open color. Ship only if γ accepts."

## Canonical hubs (by capability)

| Capability | Hub page(s) |
|---|---|
| Compositional AI | *Context Atoms — operadic stitch*; *The operad of design units*; *JEV × JAX × The Twenty* |
| Formal correctness | *FRONTIER Research Graph* (+ topic *llm-verification*); *Limits & escapes register*; *The jury* |
| Sheaf memory | *FRONTIER Research Graph → Memory System Design* and topic *sheaf-memory*; *OAH 3D sheaf lattice — private review*; *Video ideas* (#2). No Notion page for Stalks & Sections itself (GitHub only). |
| Noether / conservation | No dedicated Notion hub. Closest: *GenUI Studio — Research Wiki* (built "in a noether-wiki shape"), *Memory graph map* (gate numbers), *Limits & escapes* (the ESCAPES register). Canonical spec: the noether-wiki skill and github.com/manutej/noether-wiki. |
| Tell-apart | *Estate integration* (Eval / verification cluster). Spec lives in the skill. |
| RSI / RMP | *The studio meta-prompt + RMP ledger*; *Single-change skill edit*; *Context Atoms* (Runs) |
| Jury | *The jury — adversarial evaluation* |
| Provenance | *How to register a design*; the Motion Atlas *Design Registry* |
| Estate overview | *Estate integration — composing the CETI skills*; *GenUI Studio — Research Wiki* |

## Sources

Notion (fetched 2026-10-17, read only):
- Context Atoms — operadic stitch — https://app.notion.com/p/3fbd50cfaf9381048ffaecd94c9f8264
- The operad of design units — https://app.notion.com/p/3f2d50cfaf93816a83bccc20dda6ae05
- JEV × JAX × The Twenty — https://app.notion.com/p/3e1d50cfaf93819ea721c14fae4c777e
- GenUI Studio — Research Wiki — https://app.notion.com/p/3f2d50cfaf9381ed8c67faed026c76da
- Estate integration — composing the CETI skills — https://app.notion.com/p/3f2d50cfaf93817e8837c26233d8524b
- Limits & escapes register — https://app.notion.com/p/3f2d50cfaf9381a88b04f3837efcac6a
- The jury — adversarial evaluation — https://app.notion.com/p/3f2d50cfaf93811dafbdfac6f43bd8a9
- The studio meta-prompt + RMP ledger — https://app.notion.com/p/3f2d50cfaf938197a25ce5ee67145c35
- FRONTIER Research Graph — https://app.notion.com/p/3fbd50cfaf9381299c26c609e17e8767
- llm-verification (FRONTIER topic) — https://app.notion.com/p/3fbd50cfaf93815e82a1c8ac4a862ce9
- Memory System Design (FRONTIER Meta Layer) — https://app.notion.com/p/3fbd50cfaf9381e7a330f435e03d30e3
- sheaf-memory (FRONTIER topic) — https://app.notion.com/p/3fbd50cfaf93816db95ee314148a8031
- OAH 3D sheaf lattice — private review — https://app.notion.com/p/3d4d50cfaf9381a18059e8085c072932
- Video ideas (p5.js Explainer Lab) — https://app.notion.com/p/3f3d50cfaf938103991de635a7d029ba
- Research agenda (p5.js Explainer Lab) — https://app.notion.com/p/3f3d50cfaf9381eb9151e006efd3aba6
- Memory graph map (p5.js Explainer Lab) — https://app.notion.com/p/3f3d50cfaf93813b8cfce21490365024
- MetaSuite / meta-prompting system — the sellable asset — https://app.notion.com/p/3bfd50cfaf9381bda9bbd2a06c9de9f8
- Single-change skill edit (Motion Atlas node) — https://app.notion.com/p/3fbd50cfaf9381238f4ecc7b03030b94
- How to register a design (Motion Atlas) — https://app.notion.com/p/3fbd50cfaf9381ad9dcaeb45bad02d5c
- Whale Line — film format v1 — https://app.notion.com/p/3fcd50cfaf93812498bbfd2140371042
- Whale Line — film format v1.1 (air mode) — https://app.notion.com/p/3fcd50cfaf9381dfaaa1e76efbec18cf
- Whale Line — The brief v1 — https://app.notion.com/p/3fcd50cfaf9381bda8d6e0a53b1ddc79
- Whale Line — The brief v2 — https://app.notion.com/p/3fcd50cfaf938122aadbc11daf15a4f3
- Composition — film v1 — https://app.notion.com/p/3fcd50cfaf9381cbaf6cf8c5e3c61eee
- Composition — film v2 — https://app.notion.com/p/3fcd50cfaf93816eb330e17eda7a552d
- Sea of data — film v1 (search highlight only) — https://app.notion.com/p/3fcd50cfaf9381848c4dcc33d67c3235

Local skill files ([skill]), Manu's own installed skills:
- noether-wiki/SKILL.md and references/THEORY.md ("Where the Noether analogy stops")
- tell-apart/SKILL.md, references/theory.md, references/worked-example.md (fictional, calibration only)
- operadic-stitch/SKILL.md and references/RSI.md
- `films/kh/caps/tool.cjs`, `films/kh/lines/stories/brief*.json` (format and gates)
