# c01 · Sheaf memory: grounding

Fetched 2026-10-17. 5 GitHub pages tried with WebFetch (4 read, 1 failed), plus 3 Notion fetches and 2 Notion searches. RESEARCH.md §3 was read for the capability seed. Rule: never invent a number. Any claim without a source below is marked UNVERIFIED and stays off screen.

## Per repo

| Repo | Problem it solves (one line) | Real numbers (verbatim) | Source |
|---|---|---|---|
| manutej/sheaf-knowledge-studio | Turns PDF textbooks into page-cited knowledge bases and study pages, with automated binary quality gates. | "30/30 binary gates cleared across all 3 builds" · "33/33 negative mutation self-tests passing" · Spivak "609 pp.", "30" stalks, "877" declarations · Marinov "377 pp.", "24" stalks, "291" declarations · independent zero-shot run "377 pp.", "18" auto-induced stalks, "279" declarations | https://github.com/manutej/sheaf-knowledge-studio (README) |
| manutej/stalks-and-sections | Most knowledge-graph viewers put every entity in one shared space. This explorer lets each node keep its own vector space, compares nodes through restriction maps, makes the residuals visible, and treats only approximate global sections as trusted. | "dim 2–16" (stalk sizes) · "Four hierarchy planes" · levels "L0–L3" | https://github.com/manutej/stalks-and-sections (README) |
| manutej/cell-sheaf | A design template for a "cellular sheaf volume": pillar stalks, curved restriction maps and glue-status colours. The JSON contract files hold the sheaf data. | None in the README. Notion: "cell-sheaf glue colors match JEV GREEN/ORANGE/RED". Specimen is Greta/Little Women | https://github.com/manutej/cell-sheaf · JEV ELDER collector pack https://app.notion.com/p/3e1d50cfaf938136b66ff87c7039ebac |
| manutej/sheaf-port | Takes a folder, builds a typed index of its parts and their links, draws it as a lattice, checks which links resolve, and leaves a reusable structure for the next folder. **It does not decide whether a folder is ported or safe to merge.** | "should print 6 parts, 4 teal links" (sanity check) · "Cap 120 parts." | https://github.com/manutej/sheaf-port (README) |
| manutej/glue | **NOT GROUNDED.** WebFetch failed, `gh` access was refused (private or unavailable), and two Notion searches found no page for it. | None | — |

## Capability-level evidence (sheaf memory as a lens)

| # | Claim (verbatim where quoted) | Numbers | Source | Verified |
|---|---|---|---|---|
| E1 | Film consistency gate, check R1 (storyboard captions vs data.js captions): the Type-safe film "fails: 18 vs 20, with 6 text and 3 timing mismatches." Repair rule: "Each overlap gets one authority." | 18 vs 20 · 6 text · 3 timing | RESEARCH.md §3, quoting *Research agenda* https://app.notion.com/p/3f3d50cfaf9381eb9151e006efd3aba6 | yes (via RESEARCH.md quote) |
| E2 | "Rust sheaf-spectral, Python TopoNetX+scipy, Haskell hmatrix give identical H⁰=588 and edge discord (≤1e-13) on 215-node FRONTIER sheaf → spec is source of truth." | 215-node · H⁰=588 · ≤1e-13 · three libraries | *sheaf-memory* topic https://app.notion.com/p/3fbd50cfaf93816db95ee314148a8031 (read directly) | yes |
| E3 | Memory graph citation audit: "47 of 60 sampled citations faithful: glued is not the same as true." | 47 of 60 | RESEARCH.md §3, quoting *Memory graph map* https://app.notion.com/p/3f3d50cfaf93813b8cfce21490365024 | yes (via RESEARCH.md quote) |
| E4 | JEV ELDER collector pack: residuals δ1–δ8 listed under "do not fold"; "Collector glue: **orange**. Maps exist. Secretary loop unwired. Do not fold."; "Φ is false until δ2 and δ3 close or are accepted as parked." | δ1–δ8 (8 listed) · orange | https://app.notion.com/p/3e1d50cfaf938136b66ff87c7039ebac (read directly) | yes |
| E5 | Memory System Design: "glue locally consistent sections; per-edge discord ‖F_u x_u − F_v x_v‖² flags conflicts for human review. Consistency ≠ truth." | none | https://app.notion.com/p/3fbd50cfaf9381e7a330f435e03d30e3 (via search highlight + RESEARCH.md) | yes (design, not a run) |
| E6 | Video idea #2: "Sheaf Diffusion: How Local Data Learns to Agree. Seven sensors disagree, and one equation makes them consistent without a central boss." | none (an idea; there is no run) | *Video ideas* https://app.notion.com/p/3f3d50cfaf938103991de635a7d029ba (via RESEARCH.md) | yes (as an idea) |
| E7 | OAH lattice colour code: teal = observed wiring; "A terracotta edge is an overlap named in the source as unbuilt, unresolved … not a decoration." | none | https://app.notion.com/p/3d4d50cfaf9381a18059e8085c072932 (via RESEARCH.md) | yes |

## Hard cautions carried into mp-c01-v1
- Consistency is not truth (E3, E5). Every board's limit has to respect this. No board may claim that agreement means correct.
- H⁰ = 588 is a dimension, not "588 facts". It never goes on screen (W5).
- His memory graph does not yet use typed, non-identity restriction maps ("need typed non-identity maps"). Don't claim it does.
- "Sheaf" is a **lens** over his conservation checks, except for the FRONTIER computation (E2).
- It is not settled that cohomology detects contradictions (SLM-V3 says H¹; PAGR says H⁰ and energy).
- Diffusion reaches agreement, not truth.
- sheaf-port maps links. It does not certify a merge.
