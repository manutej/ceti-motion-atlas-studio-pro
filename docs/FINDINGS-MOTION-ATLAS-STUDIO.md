# QC FINDINGS — CETI Motion Atlas Studio Pro (`v1 → v4` Adversarial MOE)

**Date:** 2026-10-16  
**Target:** `ARTE/motion-atlas/` (`CETI Motion Atlas Studio Pro`)  
**Verdict:** **`20/20 Gates PASS` + `5/5 Negative Mutation Selftests CAUGHT`**

---

## 1. Durable Architectural & Adversarial Findings

1. **`tell-apart` Silhouette & Contour Discriminability Kernel (`G17`):**
   - **Defect Caught in `v2`:** When generalizing a single-character motion engine (`whale.html`) to an $N$-archetype parametric socket, fallback branches in `actorGeom` caused 4 of 8 archetypes (`geometric`, `calligraphic`, `mythic`, `botanical`) to share the default cetacean contour envelope.
   - **Rule / Probe:** Every multi-character parametric engine must expose a deterministic contour signature (`computeContourSignature(spec)`) and enforce pairwise $\ell_1$ geometric distance $\Delta_{\text{geom}}(c_i, c_j) > 0.08$ across all $\binom{N}{2}$ pairs (`MA.auditArchetypeDiscriminability()`).

2. **Alexandrov Sheaf Restriction Cohomology on Living Canvas DAGs (`G18`):**
   - **Defect Caught in `v2`:** Non-destructive canvas forks (`forkCanvasNode`) copied payload properties without cryptographic lineage verification, allowing silent drift between parent and child branches.
   - **Rule / Probe:** Every DAG node must carry a canonical FNV-1a 32-bit `packetHash` ($\rho(\text{self})$) and `upstreamHash` ($\rho(\text{parent})$), plus an explicit conjecture annotation (`†C`), verified mechanically via `verifyDAGSheafCohomology(dag)` ($\delta^0 = 0$).

3. **Negative Mutation Selftest Law (`--selftest`):**
   - **Rule / Probe:** A mechanical gate validator (`scripts/validate-motion-studio.mjs`) is only trustworthy if `--selftest` injects synthetic mutations (low-contrast Wada palette, cloned character geometry, corrupted `upstreamHash`, forbidden `"AND THEN"` beat hinge, malformed OAuth JSON) and proves 100% rejection/auto-repair.
