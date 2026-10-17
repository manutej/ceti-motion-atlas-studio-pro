# c04 grounding: Operads & composition

Fetched 2026-10-17 (12 fetches: 6 GitHub, 6 Notion). Numbers are copied exactly. Anything without a source is marked and goes on screen only as "Illustration".

## manutej/operadic-compositionality-course
- **Problem:** teaching professionals how typed parts compose. README: "Interactive Noether course: Applications of Applied Operadic Theory for Compositionality." "Standalone interactive Noether course."
- **Numbers:** none about the content (3 commits, 0 stars; not useful on screen). Source: https://github.com/manutej/operadic-compositionality-course
- **Borrowed grounding (Notion, The operad of design units, https://app.notion.com/p/3f2d50cfaf93816a83bccc20dda6ae05):** seven laws. Law 1: "Typed plugging. Compose only when types match; otherwise insert a named adapter. The estate needs four … (colour is written six incompatible ways today)". Law 2: "Associativity = recomputability. Every colour is a file; any subtree re-runs from its inputs." Law 3: "Identity = the fixpoint." Law 4: "Disjoint slots commute — the parallelism licence … This is exactly how the jury's fixers worked: disjoint file ownership, no merge conflicts." Law 6: "Composed vs direct consistency … Disagreement localises the unstable seam. Consistency is not correctness." Law 7: "Checks live at seams: witness … interface … verification (is each gate checking the right *type*?)". Also: "an engineering discipline, not a theorem."

## manutej/wiring-and-the-whole
- **Problem:** a big codebase won't fit in a model's context, so ship a compact description of its *wiring* (interfaces and interaction patterns) instead of the whole source. "A large codebase is not a pile of files."
- **Numbers (README, https://github.com/manutej/wiring-and-the-whole):** E3 "B PASSES. A 93.8% vs B 95.3% vs C 0% on the wiring pool. B uses 63% of A's tokens." (Conditions A/B/C are not defined on the README page, so the screen must not say "full source".) E5 "Pooled B−A = −3.7 pts." "Raw −10.2 pts was ~80% harness artifact." E1 "13/13" on a "16-file toybank". E2 "WIN on 3/3" Fineract sites, "Not repo-scale savings". Extrapolation "~43k tokens … a sketch, not a claim".
- **Limits (verbatim):** "a pack can be lossless under the builder's private expansion function and still be unreadable, if the legend forgets to define a sentinel." "4/10 trees were decomposition theater, caught label-free by universal inconsistency." Only L2 of four levels has measured evidence.

## manutej/discopy
- **Could not read** (GitHub fetch failed twice). Grounded on the upstream project instead: https://github.com/discopy/discopy, "The Python toolkit for computing with string diagrams." Assumed to be a fork; marked UNVERIFIED. No number from it goes on screen.
- Storyboards using it lean on Law 2 (associativity = recomputability) from *The operad of design units*, plus RESEARCH.md's caution that associativity and identity hold for the engine's term algebra and **not** for LLM outputs.

## manutej/catreview-go
- **Problem:** nobody can see what depends on what in a codebase. catreview models modules as objects and dependencies, calls and imports as morphisms, and reports coupling, cycles and instability.
- **Numbers (README, https://github.com/manutej/catreview-go):** "5 real-world repositories analyzed (5,055 objects, 8,141 morphisms)". "Linear complexity scaling (R² = 0.999)". Example run: "Cycles Found: 0"; instability "I=1.00 (Ce=24, Ca=0)". "100% category axiom verification" (this is a check on its own model, not on the code's correctness).
- **Limit:** "Only the Go extractor is production-ready (v1.0). The Java and Python extractors are skeletons."

## operadic-stitch (Context Atoms), the Stitch film's source
- **Problem:** pasting everything into one prompt lets a guess pass as fact, leaks private notes, and hands helpers conflicting facts. Atoms are small typed units (Role, Constraint, Tool, Contract, Fact, Evidence, Example, Goal, Method, Gate, Frame, Operation) composed into briefs; "the engine checks the result (types, fact consistency across delegations, confidentiality, recursion bounds) before anything is sent."
- **Numbers (Notion, Context Atoms — operadic stitch, https://app.notion.com/p/3fbd50cfaf9381048ffaecd94c9f8264):** first three jobs, 16 Oct 2026: Motion Atlas dashboard "3 prompts, 41 atoms, GREEN"; Motion graphics notebook "3 prompts, 26 atoms, GREEN"; Little whale film "3 prompts, 41 atoms, GREEN"; a shared "spine" of "the 9 atoms all three jobs share".
- **Facts quoted:** "Rows start as Draft; flip to Verified when you agree with them." "An agent working at a scope sees that scope and everything above it. Confidential scopes are sealed." Skill: "Facts must glue … a disagreement is a RED finding, never last-write-wins." "Context is not written, it is composed."
- **Limit:** "Consistency is not correctness." The checker reads types and labels, not truth. Draft atoms (not yet verified) still compose.

## Supporting (shared with c06)
- JEV × JAX × The Twenty (https://app.notion.com/p/3e1d50cfaf93819ea721c14fae4c777e): "γ is defined only on a color match. That is the type checker." "Fail closed. Compose only on GREEN." "A claim cannot occupy an evidence port." Not JAX, not FOL, not a Lean kernel.
- The jury (via RESEARCH.md §7): fixers on disjoint files went "0/22 → 22/22, 0/15 → 15/15 and 0/16 → 16/16".

## Overlap to avoid
- *Composition film v2* (shipped, Wada 296): "one big box becomes small checkable parts that only snap if their types fit", ending a push-in on "Every part checked." (https://app.notion.com/p/3fcd50cfaf93816eb330e17eda7a552d). Shipped series endings: seal-and-send, rules-accrue, one-wave, the-shake, the-split. None of these are reused here.
