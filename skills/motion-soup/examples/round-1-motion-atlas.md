# Worked example — CETI Motion Atlas Studio Pro, round 1 (v8 → v9 "Fable Soup")

This is the round that produced `studio-music-engine.js`, `studio-two-renderer.js`, the v9 storyboard grammar and gates G30–G33, rewritten in the skill's terms. Sources: `work/BRIEF.md`, `work/round-1-prompts.md`, `work/music/MERGE-NOTES.md`, `work/two/MERGE-NOTES.md`, `work/wording/clarity-gate.md`, `docs/RSI-LEDGER.md` round 9 row. Where a number was not recorded in the hand-backs it says so.

## 0. Frame

| Input | Value |
|---|---|
| Brief | `work/BRIEF.md`: adaptive procedural score (keep SFX, drop the 4-voice drone), two.js as an additional renderer, clear wording / storyboard / messaging; sharpen, don't reskin |
| Test command | `npm test` → `node scripts/validate-motion-studio.mjs --selftest`; baseline 29/29 gates + 10/10 mutations green before the round |
| Contract | `docs/TYPED-CONTRACT-MOTION-ATLAS.md` + per-lane excerpts inlined in `work/round-1-prompts.md` (G06 determinism, G24 four sonification voices, G31 regex, G32/G33 wording) |
| Tokens | not resolved as a file in round 1 — palette roles came from the host's Wada OKLab engine at runtime; type from the shell CSS; tempo from the music lane's own feel table. (Round 2 should run `resolve-tokens` first; see §6.) |
| Lanes | `music`, `vector` (two.js), `wording` (+ storyboard grammar) |
| N | music 2, vector 2, wording 1 (prompts said 3; two were run per module lane, one for wording) |
| Audit set | storylines `s_hydro`, `s_orbit`; Wada combination 207 — never named in a candidate prompt |
| Workers | one-off agents per candidate; orchestrator (Fable) merged and integrated via further agents |

## 1. Self-query → required slots

| Lane | Slots emitted | From |
|---|---|---|
| music | `beat.hear = {mood, cue, duck}` ×8 · exactly one breather cue · `transition.semantic` per cue boundary · `predicted.firstFlag` | Q4, Q5, Q9, Q6 |
| vector | `beat.severedMark` (the one primitive carrying the idea at caption-off) · `beat.because` per added motion · `ladder.rung5` (what was removed) · `predicted.firstFlag` | Q1, Q3, Q7, Q6 |
| wording | `beat.proofMark` per claim · `say` rewrite above grade 8 · breather `say` ≤ 4 words · `predicted.firstFlag` | Q2, Q8, Q5, Q6 |

## 2. Fan-out (candidates)

| Lane | Cand | Lens | Bytes | Self-test | Wall time |
|---|---|---|---|---|---|
| music | A | harmonic bed first (continuous pad + sub, chord per beat role, duck as mix law) | 25,519 | own harness, exit 0 | not recorded |
| music | B | leitmotif + pulse first (8 archetype signatures → seeded motif, plant/return bell, Karplus-Strong pluck, 16th-grid quantisation) | 22,340 | `selftest-B.js` 6,067 B, exit 0 | not recorded |
| vector | A | living vector atmosphere (parallax, flow-field ribbons, 28-vertex cutouts, kinetic say, palette lock) | 17,785 | own harness, exit 0 | not recorded |
| vector | B | storyboard theatre (transition masks by relation, diagram, counter, one spotlight, end card) | 20,334 | `selftest-B.js` 8,556 B, exit 0 | not recorded |
| wording | 1 | grammar hook·claim·proof·breather·callback·landing + plain-language gate | `storyboard-grammar.md`, `clarity-gate.md`, `ui-copy.json`, `vocab-rewrite.json` | pure predicates P1–P8 | not recorded |

Diversity floor (run retroactively with the skill's runner, word-trigram Jaccard distance): music A/B **0.953**, vector A/B **0.971** — both far above 0.35. Souping was justified.

## 3. Merge

**music → `studio-music-engine.js` (39,997 B, 70 PASS, exit 0)**
- UNION: A's harmonic bed, modal progressions, dynamics arc, lookahead scheduler, mid-flight pad/bass re-entry; B's leitmotif, plant/return bell, pluck, pulse, grammar→SFX map, quantisation, least-motion voicing.
- INTERSECTION (E1): lookahead scheduler, seeded PRNG only, gesture resume, duck under every SFX, host CHORD preserved, Node-safe planner.
- CONTRADICTIONS → resolution by contract: duck law (deeper/faster wins so SFX pop: −6 dB, 10 ms attack, 250 ms hold, 150 ms release); mode derivation (A's OKLCH over B's keywords); tempo table snapped to the feels' fps grids; pluck density capped on the fastest feel; A's degrees with B's voicing.
- Dominance argument: harmony (A's progressions ∧ B's voice leading — A was parallel root-position, B a fixed loop); memorability (B's motif on A's dynamics); SFX pop (contract duck + B's quantisation + A's transients); determinism (both pure; soup adds the RNG-throws proof + `tRaw` audit trail); seekability (A's re-entry + B's idempotent rebase). bestSingle: A.

**vector → `studio-two-renderer.js` (36,854 B, 36 assertions, exit 0)**
- UNION: back pass A (parallax, ribbons, cutouts); front pass B (spotlight, diagram, counter, end card, transition table); kinetic `say` = A's letter draw-on re-clocked to B's word landing; palette lock A extended to rgba/gradient inks; loader = B's `init({inline, cdn, onReady})` + A's `load()` promise.
- INTERSECTION: offscreen canvas renderer type, `autostart:false`, rebuild-from-t + manual `update()`, mulberry32 only, palette-locked fills, no-op without the lib, reduced-motion settled frame.
- CONTRADICTIONS → resolution: retained pool vs clear-and-rebuild → G06 ⇒ rebuild over pure scene data; one pass vs two → contract: two; per-letter vs word clock → one clock per beat; full-ink type vs spotlight → spotlight dim governs type; text metrics → `measureText` with declared fallback; seeds composed; `isAvailable` = type check + disposed flag.
- Dominance: soup ⊇ both; B alone broke the two-pass contract, A alone had no transition/attention semantics. Real-palette audit `offPalette: []`.

**wording** — single candidate; no merge. Gate predicates P1–P8 and MUT-P1…P8 written directly.

## 4. Gates added by the integrator

| Gate | Lane | Predicate (text + node) | Mutation |
|---|---|---|---|
| G30 | music | ≤ 40 KB, `node --check`, zero RNG/clock tokens; 15 contract members; plan deep-equal by seed; one breather cue; 8 distinct motifs; plant === return; quantisation bound; duck param log order; pluck cap; fps-grid tempo; null-ctx `live:false` | MUT-11: change the duck dB → fails |
| G31 | vector | no `play(`/rAF/RNG/clock; renderer type + `autostart:false` + `update()`; `audit` offPalette 0 and spotlights 1; op-trace identical after seeks; no-lib → `false`, 0 ops | MUT-12: insert `two.play()` → regex fails |
| G32 | grammar | role order, claim→proof ids, one breather, plant→return | MUT-13 |
| G33 | wording | say ≤ 12, blurb ≤ 14, jargon only in parentheses, grade ≤ 8, no internal names | MUT-14 |

Integrator ordered steps (each verified by `npm test`): copy modules → shell script order (`geome-wada → motion-engine → vendor/two → two-renderer → music-engine → canvas-oauth → ui`) → bundler inline + "no external `<script src>`" assert → validator `filesToLoad` + existence list → `MA.render` back/front hooks + ui tick/seek/replan → toggles → G30–G33 + MUT-11…14 → build.

Integrator probes (things a step turned up and the step-wise test caught): validator mock ctx lacked `transform`/`resetTransform` (two.js could not render headless) → added no-ops; one MCP beat read at grade 10.1 → split into two sentences → 7.1; two vocab labels left banned terms outside parentheses → fixed; the legacy RSI fixer would force a second breather on v9 boards → guarded.

Result: **33/33 gates + 14/14 mutations**, build regenerates dist and the Standalone bundle.

## 5. Critic, ledger, verdict

- Blind critic: the prompt was written (`round-1-prompts.md` §5, φ-0) but no `critic.json` exists in `work/` — **not run**. RELIABILITY stays `insufficient`; authority `advisory`. Round 2 must spawn it alongside the integrator.
- Ledger: round 9 row in `docs/RSI-LEDGER.md`; the skill's `work/soup-ledger.jsonl` did not exist yet (see README for the retro rows).
- Verdict: **accept** — host gates green, both soups dominate their best single on the lane predicates. Dominance on the audit set (`s_hydro`, `s_orbit`, 207) was argued per predicate, not run as a separate table; round 2 should write `soupVsBest.json`.

## 6. What the skill's universal gates say about round 1 (retro-run)

| Gate | Result | Note |
|---|---|---|
| determinism | pass | both soups: RNG-throws proof, op-trace after seeks |
| no-literal-token | **fail** — 23 literals in `work/music`, 46 in `work/two` | candidates and self-tests hard-coded fallback palettes and fixture colours; the gate did not exist. Round 2: candidates read `tokens.resolved.json`; fixtures take their colours from it too |
| size caps | pass | 39,997 B and 36,854 B under 40 KB |
| selftest-exit-0 | pass | 70 PASS, 36 PASS, mutations caught |
| dominance | argued, not tabled | write `soupVsBest.json` next round |
| diversity floor | pass | 0.953, 0.971 |
| additive-schema-only | pass | v9 fields additive; legacy `role/hinge/label` untouched (AUDIT-v8 F7) |

Caveat on the README demo: the runner was exercised with `wada:207` as a token source because it is the one combination id the brief names. In a real round, 207 is the **audit** palette and must not be the candidates' token source — pick any non-audit combination.

## 7. Round-2 prompt generation (what the ledger implies)

```
required_slots(music)   = { Q9 transition.semantic per cue boundary (unanswered in soup) }
required_slots(vector)  = { Q1 severedMark per beat (only s_voice answered) }
required_slots(wording) = { Q2 proofMark for 5 non-audit storylines (only hooks delivered) }
forbidden(all)         += literal colour/font/tempo (no-literal-token gate now exists)
avoid                   = none (no critic prediction to compare)
critic.reliability      = insufficient → advisory
```
