# c03 Noether & conservation — grounding

Fetched 2026-10-17. Seven fetches: 3 GitHub pages (WebFetch), 2 Notion pages, 2 Notion searches. I also read the local noether-wiki skill files. Numbers are quoted exactly as the source gives them. A number with no source here does not go on screen, and the board marks it "Illustration".

## Repos

### manutej/noether-resonance-core
- **Problem it solves (one line):** It is not a knowledge-base tool. It is a browser 3D WebGL audio synthesiser with field visuals and a voice interface, and it cites Noether's 1918 theorem (continuous symmetry ↔ conserved quantity) only as inspiration.
- **Numbers (README, https://github.com/manutej/noether-resonance-core):** "5 quantum field topologies", "9 palettes (6 Wada, 3 Mono)", "Adversarial evaluation logged across Rounds 1–4". The README gives no test or pass/fail metrics.
- **Use in boards:** the honest, physical "symmetry gives a conserved quantity" picture (the thing the wiki analogy borrows from, and where the analogy stops). Not as evidence for KB claims.

### manutej/noether-wiki (GitHub repo)
- **Problem it solves (one line):** It is a "Typed wiki for reconnecting working programmers with the mathematics that actual computer science is made of". It indexes Jane Street monthly puzzles (Sept 2024 – Sept 2026) and runs a trainer whose solutions stay hidden until you log an attempt. It stores only URLs and short original framing; nothing is republished.
- **Numbers (README, https://github.com/manutej/noether-wiki):** "twenty-five problems"; "September 2024 to September 2026".
- **Caution:** the public README does **not** mention conserved quantities, drift budgets, ledger or escapes. Those come from Manu's **noether-wiki skill** (below), which shares the name. Boards that cite conservation mechanics cite the skill, not this repo's README.

### noether-wiki skill (local SKILL.md + references/THEORY.md, LENS-CATALOG.md, MERGE-PROTOCOL.md)
- **Problem it solves (one line):** Knowledge bases rot as they grow: broken links, duplicate entities, unsourced claims, drift. Instead of "hoping the knowledge base stays coherent, you declare **conserved quantities** … and the agent may only commit steps that preserve them within a declared **drift budget**."
- **Mechanics, read verbatim:** inner loop PROPOSE → MEASURE ("a deterministic script, not your judgment") → DECIDE → REPAIR (k = 3 cycles max; the violations must strictly shrink, or it ESCALATEs) → COMMIT (one LEDGER row). "Never silently commit or silently drop." RE-BASELINE is the only legal way to change a law ("the record of a deliberately broken symmetry"). ESCAPES.md holds "defects found *after* commit", and "every ESCAPES.md row is a proposal for a new conserved quantity". Lens sweet spot: "3–7 active gating lenses". "A gate the agent routes around is worse than no gate."
- **Defaults (skill table, illustrative of the method, not a run):** k 3, ε_step 2.0, B_task 10.0.
- **Goodhart guard:** "'no broken links' [is satisfied] by deleting the linking claim. Therefore the measurement apparatus … is inside the conserved set."
- **Merge:** "Never present a merge as 'smooth' because zero conflicts surfaced."
- **Where the analogy stops (THEORY.md):** "there is no Lagrangian and no symmetry group here — Noether *derives* conserved quantities, we *choose* them and then *discover* more from escapes … Do not overclaim the analogy in any artifact."

### manutej/noether-operadic-course
- **Problem it solves (one line):** It is a public static course on operadic question trees, Noether symmetries, double operads and thesis synthesis. It is for self-study and teaches the maths behind the method.
- **Numbers (README, https://github.com/manutej/noether-operadic-course):** "9 curriculum modules", "Thesis (12 sections)". The live site is listed as "After GitHub Pages is enabled", so it may be unpublished.

## Real runs (Notion)

### Memory graph map (https://app.notion.com/p/3f3d50cfaf93813b8cfce21490365024), verified by fetch
- The p5.js explainer atlas (437 entities, 2,561 triples) was merged with lab work (111 new entities, 372 new triples).
- Result: Entities "548 (437 atlas + 107 lab + 4 hubs)"; Triples "2,933 (2,561 + 372)"; Types "17 (atlas 13 + Chrome, Pedagogy, Lens, AntiPattern, added via logged RE-BASELINE)"; New sources "95".
- Gates (wikictl): "exact 0 · soft drift 0.0 · prov.coverage 0.988 · orphans 0 · stubs 0".
- Honest limits: "The atlas's own audit found 47 of 60 sampled citations faithful: glued is not the same as true." "No geometry or diffusion engine was run over this graph; the gates are set-valued consistency checks." "Conflicts kept, not smoothed." Tags with the same name from different corpora "were not imported, to avoid fake glue."

### Limits & escapes register (https://app.notion.com/p/3f2d50cfaf9381a88b04f3837efcac6a), verified by fetch
- Type: "register (noether-wiki ESCAPES + known limits)". "Every item here was measured or reproduced; nothing is hypothetical."
- Escapes: "Example declared IBM Plex, rendered Inter" (slipped past a "Font check by declared name"); "Built page at 1.18:1 contrast" (slipped past "Contrast computed on tokens only"); "Slider throwing on every move" (slipped past "Click test covered buttons only"); "Build silently diverging from its design document" (slipped past "Nothing compared them", now caught by AP-54 conformance).
- Limits: "Source truth is not machine-checkable. An invented URL with an invented excerpt validates." "Beauty is not a gate."

### MetaSuite (https://app.notion.com/p/3bfd50cfaf9381bda9bbd2a06c9de9f8), search highlight only
- The sell line is "category theory and Noether-symmetry mapping of codebases, adversarial multi-lens review". It is a positioning claim with no numbers.

## Not grounded / UNVERIFIED
- "noether-harness" appears only as a name in Estate integration's eval cluster. I found no spec, so no board makes a claim about it.
- "Three spaces of symmetry" / symmetry-inventory: no Notion page exists (RESEARCH.md §4), so it is not used.
- noether-resonance-core gives no pass/fail numbers. Its "Rounds 1–4" is a count of logged rounds, not results.
