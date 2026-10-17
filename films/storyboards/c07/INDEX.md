# c07 Formal correctness & logic: index

Meta-prompt: `mp-c07-v1` (META-PROMPT.md) · Grounding: GROUNDING.md · Schema: all 10 valid against sb60-v1. The mechanical checks (N2, N3, N5, N6, N7, N8, G1 read time, W1, W6, W9, N10 slug uniqueness and S1 seam) also pass, 0 errors.
Gate-v3 direct takes (machine gates that each check a different kind of thing; every miss becomes a new kind of check): **01, 02, 03, 09**.

| id | title | repo | hook in 8 words | self |
|---|---|---|---|---|
| sb-07-01 | Every miss gets a new *gate*. | Limits & escapes register | Stamped ticks, sent to a pod, answered ✕. | 0.82 |
| sb-07-02 | Add a different *gate*. | Limits & escapes register | Whale stacks identical gates. Same bug passes all. | 0.80 |
| sb-07-03 | Turn every miss into a *gate*. | The jury (print gate) | Perfect on screen, the print comes out sliced. | 0.85 |
| sb-07-04 | The old bug hits a *gate*. | The jury (fail-first) | Fixed wobble swims back in. Pod answers ✕. | 0.80 |
| sb-07-05 | Fresh *eyes* try to break it. | The jury | Whale checks its own line twice, misses gap. | 0.78 |
| sb-07-06 | Check the *pin* before the work. | manutej/fstar-labs | Line hits the pin perfectly. Pod still ✕. | 0.72 |
| sb-07-07 | Find the first broken *joint*. | manutej/Lean4Agent (fork) | Whale scrolls an endless run, hunting the break. | 0.76 |
| sb-07-08 | Show one real *example*. | manutej/intuitionistic-logic-framework | A claim card arrives with an empty socket. | 0.74 |
| sb-07-09 | Seven *gates* watch every frame. | Whale Line: The brief v1 | Our own whale snaps its turn. Phone flinches. | 0.84 |
| sb-07-10 | Check the work, not its *label*. | Limits & escapes register | Green tag, wrong-colour line, pod answers ✕. | 0.79 |

Spread: Everyone 01, 09 · Leaders 02, 10 · Learners 03, 08 · Engineers 04, 07 · Researchers 05, 06. Wada: 243 (01, 07), 339 (02), 296 (03, 08), 207 (04, 10), 166 (05), 84 (06), 279 (09). Ending slugs (all new): pod-answers-yes, swap-the-stack, flag-on-the-lintel, ghost-bounces, fresh-poke-lands, pin-finds-home, hop-to-the-joint, show-me-one, smooth-turn, label-peels-off.

## Two strongest

1. **sb-07-03 Turn every miss into a gate (0.85).** It makes "a miss becomes a new kind of check" literal in a single picture: the whale folds the miss's flag into the icon of a new gate and sets it on the lintel. That is the one push-in, and it fixes REVIEW-v3 P1-1 and P2-5. The escape (a clipped print edge) differs in kind from what the screen gate checks. The case is Manu's own jury record ("no print gate", then 32 new fail-first checks). Gate v3 can lift its MOVE act whole.
2. **sb-07-09 Seven gates watch every frame (0.84).** It is self-referential and fully sourced: the series' own seven gates, each of a different kind, caught its own whale turning too fast before render. The phone-flinch hook is a pain anyone feels, and the not-this is Manu's own line, "Beauty is not a gate." Its CASE and PAYOFF give Gate v3 a better "real catch" than the old rad/frame caption.

Honest weak spots: 06 is dense (pin, two gates and cards) and leans on field numbers. 08 has no real run (Illustration only). 07's evidence is third-party (it is credited as "Paper").
