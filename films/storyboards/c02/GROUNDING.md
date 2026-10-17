# c02 grounding: Sheaves in the wild

Fetched 2026-10-17. Ten lookups in all: four GitHub pages, two raw READMEs, one upstream dataset README, two Notion searches and two Notion page fetches. Every number below is quoted exactly from its source. Anything without a source is marked UNVERIFIED and stays off screen.

## manutej/cell-sheaf-swarm (public, MIT)
**Problem it solves.** When many agents' outputs are merged, disagreements get silently overwritten. This repo makes every join between two agents' pieces carry an explicit glue status, and only joins that agree fold into the shared trunk.
- README, verbatim: "Live swarm observatory on a cellular sheaf. Restriction color is glue. Gold is earned."
- README, verbatim: "Edges are ρ with `status` ∈ {ok, strange, broken, missing}." "`onTrunk` is earned iff some incident ρ is `ok`."
- Glue table (README): ok = "compose = collapse", folds into trunk "yes"; strange = "map exists, rank/sort odd", folds "only after a person"; broken = "coboundary will not vanish", "no"; missing = "no ρ written", "no".
- JSON contracts are validated against the `sheaf-graph/2020-12` schema. CI runs the validator on every push.
- Source: https://github.com/manutej/cell-sheaf-swarm (raw README read in full).
- Real run, from Notion: "Nine consecutive red runs on main inside six minutes, each failing in 5-8 seconds with 3 annotations — that is a config or validation error, not a flake, and main is currently unbuildable." This was on 2026-09-22 and the obligation was still Open when fetched. Source: https://app.notion.com/p/3e3d50cfaf93816d9f8fc45cb3a403bc
- The repo reports no benchmarks or measured outcomes. The fetch summariser also mentioned "20 ticks", "3 cell loops" and "4 seats", but I did not read them in the raw text, so they count as UNVERIFIED and are not used.

## manutej/sheaf-dirichlet-protein-3d (public)
**Problem it solves.** It relaxes a perturbed 3D protein back to its native shape, and predicts which parts are floppy. The sheaf Laplacian serves as the Dirichlet energy of the chain's contact graph.
- README, verbatim: "Six folds loaded from RCSB (1L2Y, 1CRN, 1VII, 2JOF, 1PGB, 1UBQ)." "Every rigid-enough contact graph has dim H0 = 6." "Heat flow on E = 1/2 x^T L_F x returns a 0.4 A-perturbed native to E~0 and RMSD < 0.2 A." "Sheaf-Laplacian flexibility vs X-ray B-factors: 1UBQ r=0.64, 1PGB r=0.50, 1CRN r=0.39 (r=0.69 at 7 A cutoff)." "Burial-only auto-sequence recovers hydrophobic class on cages (~70%), not residue identity."
- Honest limit, verbatim: "This is structure-based Dirichlet descent, not sequence-to-fold. Sequence does not yet generate the contact sheaf."
- Source: https://github.com/manutej/sheaf-dirichlet-protein-3d (raw README read in full)
- Caution: reading dim H0 = 6 as "3 slides + 3 turns" is the standard elastic-network reading, but the README doesn't say it. UNVERIFIED, so it stays off screen. Å and r are not units a viewer can feel, so they stay in the numbers list and off captions.

## manutej/sheaf-dep-ethereum (public)
**Problem it solves.** People only see the projects on top. This repo is a 3D sheaf-lattice explorer for the real Ethereum open-source dependency graph, laid out by level, so the projects underneath become visible.
- About, verbatim: "Cellular Sheaf Dependency Lattice explorer for real Ethereum ecosystem dependency JSON (deepfunding/dependency-graph)." "Interactive 3D WebGL sheaf visualization." The README has nothing more, and the repo states no numbers of its own.
- Source: https://github.com/manutej/sheaf-dep-ethereum
- Data numbers come from the upstream dataset, not from Manu's repo: "Total number of Level 1 (seed) nodes: 31" (the listed seeds look like 34, so the source disagrees with itself and the seed count is not used on screen); "Total number of Level 2 (dependency) nodes: 5,024"; "Total number of edges: 14,927". Each edge weight is "the portion of the credit for `source` (dependent) that belongs to `target` (dependency)". The weights leaving a source total less than one, and the dataset's validator checks that. Source: https://github.com/deepfunding/dependency-graph
- Visual language, from the OAH Notion page: "matches `sheaf-dep-ethereum` + stalks-and-sections: teal ↔ terracotta, strata by level, size = dim."

## manutej/ormus-harness-sheaf-lattice (private, grounded via Notion)
**Problem it solves.** An auto-generated map of an agent harness codebase is an unreadable hairball that also suggests links nobody built. This repo is a hand-built digest: four strata, edges only where the source shows them, and named unbuilt items in terracotta.
- Notion *OAH 3D sheaf lattice — private review* (https://app.notion.com/p/3d4d50cfaf9381a18059e8085c072932), verbatim: "This is a digest lattice, not the 225KB raw ingest … Raw ingest is a folder walk (cap 400) and hairballs in 3D." "Edges only where the source shows them." "Kernel has no outgoing package edges … Do not invent links to make the kernel look connected." "A terracotta edge is an overlap named in the source as unbuilt, unresolved, or a known ingest limit — not a decoration." Strata: "L0 Law / doctrine (pinned)", "L1 Packages", "L2 Surfaces", "L3 Named next". "Terracotta (six first-class facts)". These include "MAKER escalation thresholds (deferred by decision)" and "Ingest line-regex false-positive imports (accepted)". "Φ is false because those six are named disagreements, not errors." "Section axes (dim 6) … Zeros where nothing is measured. No Gaussian fill."
- The reviewed upstream is HermeticOrmus/ormus-agent-harness @ `573cff5`.

## Cross-cutting cautions (from kh/caps/RESEARCH.md §3)
- Consistency is not truth ("Consistency ≠ truth", "glued is not the same as true").
- Use "sheaf" only as a lens unless the subject really is a computed sheaf. The swarm contract and the protein Laplacian are real computations. The OAH lattice is a hand-built digest.
- Don't say "cohomology detects contradictions". H0 is a dimension, not a count of facts.
