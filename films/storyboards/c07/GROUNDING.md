# c07 grounding: Formal correctness & logic

Fetched 2026-10-17. Fetches used: 5 GitHub pages (WebFetch), 4 Notion page fetches and 1 Notion search, for 10 in all.
Rule: a number appears here only if it was read in the source named next to it. Anything else is marked "no number" and any storyboard that leans on it says "Illustration".

## Repos

| Repo | Problem it solves (one line) | Real numbers (exact, with source) |
|---|---|---|
| manutej/intuitionistic-logic-framework | A Claude Code plugin that stops "it exists" claims that come without a concrete example. It asks for a witness, compares classical and constructive validity, and type-checks terms. 6 commands (`/ilf:witness`, `/ilf:first-principles`, `/ilf:contrarian`, `/ilf:analyze-logic`, `/ilf:prove`, `/ilf:check-type`) and 3 agents. | README says "Version: 0.1.0", "Status: Initial release", "Testing: Needs real-world validation" (https://github.com/manutej/intuitionistic-logic-framework). **No performance numbers**: boards using it are Illustration. |
| manutej/fstar-labs | A research lab for F* (a dependent-type, proof-oriented language). It bundles skills, agents and commands so AI agents can help write verified code. | README self-reports "104+ examples", "32+ proofs", "16 skills", "12 agents", "8 commands" (https://github.com/manutej/fstar-labs). These are counts of material, not results. Not verified by me. Don't put them on screen as evidence that anything works. |
| manutej/Lean4Agent | A **fork** of RickySkywalker/Lean4Agent (paper: *Lean4Agent: Formal Modeling and Verification for Agent Workflow and Trajectory*, Wang et al., 2026, arXiv:2606.06523). It models agent workflows in Lean 4, checks whether they are consistent, and finds where a recorded run went wrong. | README: verification-passing workflows beat failing ones by an average of "11.94%". LeanEvolve improved SWE performance by "7.47%" on average. Tests used a 50-problem SWE-Bench Verified subset and a 100-problem ELAIP-Bench subset, across "5 leading LLMs" (https://github.com/manutej/Lean4Agent). **Third-party result, not Manu's.** Credit it as "Lean4Agent paper (Wang et al.)". |
| manutej/mathlib4-ai | A **fork** of leanprover-community/mathlib4, the community maths library for the Lean prover. The README is upstream's and states no AI-specific goal. | "33,649 Commits" (upstream history) (https://github.com/manutej/mathlib4-ai). Not a result. Use only as a picture of scale ("a library of checked steps"), marked Illustration if it is shown at all. |
| the jury / escapes register (Notion) | The jury: fresh agents who didn't build the work try to break it, and every finding must carry evidence. The escapes register: defects found *after* a gate passed, and the new check that catches each one now. | See below. **Manu's own records, read verbatim.** |

## Manu's own records (verified, read in source today)

**Limits & escapes register**: https://app.notion.com/p/3f2d50cfaf9381a88b04f3837efcac6a
- "Beauty is not a gate. The gates prove the absence of catalogued failures, not the presence of quality."
- "Source truth is not machine-checkable. An invented URL with an invented excerpt validates."
- Each escape is listed with what it slipped past and what catches it now:
  1. "Example declared IBM Plex, rendered Inter": slipped past a "Font check by declared name". Now caught by "AP-14b (rendered faces via DevTools)".
  2. "Built page at 1.18:1 contrast": slipped past "Contrast computed on tokens only". Now caught by "Built-page contrast per scheme".
  3. "Slider throwing on every move": slipped past "Click test covered buttons only". Now caught by "Every control exercised + visible-change check".
  4. "Textbook shadcn landing page, 0 findings": slipped past "CSS-text detectors". Now caught by "Rendered-box detectors (3 P0s)".
  5. "Generation-3 house look in the studio's own example": "No detector existed". Now caught by "AP-53 + archive distance".
  6. "Clipped A3 sheet": slipped past because the "Screen gate [was] used for print". Now caught by "print_check.py".
  7. "Build silently diverging from its design document": "Nothing compared them". Now caught by "AP-54 conformance".
- That makes **7 escapes, each now caught by a different kind of check.** This is the strongest real case for the "each gate checks a different kind of thing" idea.

**The jury: adversarial evaluation**: https://app.notion.com/p/3f2d50cfaf93811dafbdfac6f43bd8a9
- "The builder never judges." "Evidence or strike." "Agreement is not correctness." "Never weaken a gate. Every fix ships with a check that fails on the old copy."
- Round 1: "57 rows, 0 struck → 14 P0 · 28 P1 · 8 P2".
- Fixers: "A 0/22 → 22/22 · B 0/15 → 15/15 · C 0/16 → 16/16".
- Round 2: the red team "re-broke nothing". A fresh user found "no print gate (P0)". The fix added "32 new fail-first checks".
- Security: "The round-2 red team tried 18 new bypasses: all contained."
- Final: "116 passed, 0 failed".
- Caution: "the whole panel was one model family".

**Whale Line: The brief v1**: https://app.notion.com/p/3fcd50cfaf9381bda8d6e0a53b1ddc79
- "Fixes found by the gates before render: whale perched over the letters (moved above), take-off snap (1.26 rad/frame → 0.11), swim too fast (41 → 26.5 px/frame)."
- Gate list: read_time, frame_jump, flash_safety, loudness, ffprobe, contact_sheet, colour_provenance. That is **7 gates of 7 different kinds**.
- On-screen form (W6, no units): "Real catch: our whale turned too fast." The numbers stay in notes.

**llm-verification (FRONTIER topic)**: https://app.notion.com/p/3fbd50cfaf93815e82a1c8ac4a862ce9
- "Verus system proofs 81%, DafnyBench 92.7%. Lean end-to-end verified codegen is far lower (VERINA proof 4.9%, CLEVER near-zero)." "Verifier is an oracle for proofs, not specs." Gluing note: "spec integrity is the weak point."
- These are field results, not Manu's. Credit the source as "llm-verification · FRONTIER".

## Couldn't ground
- intuitionistic-logic-framework: no results exist yet (v0.1.0, "Needs real-world validation"). Boards about it are Illustration.
- fstar-labs: only self-reported counts of material. No outcome numbers.
- mathlib4-ai: an upstream fork with no stated AI purpose. Treat it as background only.
