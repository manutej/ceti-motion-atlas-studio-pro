# G32 · Wording clarity

Runs on the active storyboard sheet plus `VOCAB_LIBRARY` and `DEFAULT_SAVED_SCHEMES`. Pure functions, no DOM. Add after G31 in `runAllGates()` and to `run16GateAudit` as `{ id:'G32', name:'Wording Clarity', plainName:'Wording is plain and clear' }`.

## Predicates (all must hold)

| # | predicate | computation |
|---|---|---|
| P1 | `say` ≤ 12 words | `say.trim().split(/\s+/).length <= 12` on every beat |
| P2 | blurb ≤ 14 words | same split on every `plainEnglish` and scheme `notes` |
| P3 | banned jargon only in parentheses | each BANNED term found in `say/show/because/plainEnglish/title` must match `/\([^)]*\bTERM\b[^)]*\)/i`; a bare hit fails |
| P4 | every PROOF cites its CLAIM | `grammar==='proof'` ⇒ `claimId` resolves to an earlier beat with `grammar==='claim'` |
| P5 | exactly one BREATHER | count === 1, index ∉ {0, 1, last} |
| P6 | plant has a return | if `beats[0].plant` set ⇒ some `callback|landing` beat has `returns === plant` |
| P7 | no internal names | `/\bG\d\d\b|\brung ?\d|\be_[a-z]+\b|[δρ⊕]|Wada No\.? ?\d|cohomology|sheaf|pushout|PKCE/i` matches nothing in user copy fields |
| P8 | reading level | Flesch-Kincaid grade of `say + show` ≤ 8 (vowel-group syllable heuristic); target 7 |

**BANNED:** boil, overshoot, misregistration, anticipation, follow-through, onion-skin, iris, negative-space, figure-ground, stipple, rostrum, dutch, hydrographic, telemetry, bathyal, pelagic, sumi, shoji, sonification, cohomology, sheaf, pushout, rung.

Detail: `say≤12 {a}/{n} · blurb≤14 {b}/{m} · jargon {c} · proofs {p}/{q} · breather {k} · plant→return {y/n} · grade {max}`.

## Negative mutations (selftest; each must set `caught`)

| mut | corruption | fails |
|---|---|---|
| MUT-P1 | `beats[1].say` = a 13-word sentence | P1 |
| MUT-P2 | clone `VOCAB_LIBRARY[0]`, append 8 words to `plainEnglish` | P2 |
| MUT-P3 | `beats[2].show = 'Add line boil to the outline'`; control `'Add hand-drawn wobble (line boil)'` passes | P3 |
| MUT-P4 | `beats[2].claimId = 'beat-9'` | P4 |
| MUT-P5 | `beats[4].grammar = 'proof'` (zero breathers); then also set two | P5 |
| MUT-P6 | set `beats[0].plant`, delete every `returns` | P6 |
| MUT-P7 | `beats[2].say = 'Alexandrov sheaf δ⁰ cohomology G18'` | P7 |
| MUT-P8 | `beats[2].say = 'Heterogeneous orchestration necessitates interoperability'` | P8 |

RSI fixer: P5 → reuse rule A2 (force index 4/5 breather, demote extras to `proof`); P6 → copy `plant` into last beat's `returns`; P7 → strip tokens and flag for human rewrite, never auto-synonym.
