# Beat grammar — condensed for `work/beats.json`

Source of truth: `work/wording/storyboard-grammar.md` (v9 + v9.2 fields) and `work/wording/clarity-gate.md` (P1–P8). This page is the part motion-brief needs to write a board that `brief-check.mjs` and the engine's G33 / G37 both accept. Full worked boards: the grammar file's two examples, and `examples/beats.json` here (the repo's `v9-mcp-server` board).

## Board shape

```json
{ "id": "sb-…", "title": "…", "totalDurationSec": 14, "beats": [ { …beat… } ] }
```
`totalDurationSec` must equal the sum of `dur` (B-timing). Beat times are cumulative from `dur`; an explicit `start` is allowed but must match.

## Roles, in order — HOOK → CLAIM → PROOF → BREATHER → CALLBACK → LANDING

| grammar | count | job |
|---|---|---|
| `hook` | exactly 1, first | the viewer leans in: a question or a surprise; sets `plant` |
| `claim` | 1–2 | the one thing we want believed |
| `proof` | 1–3 per claim | a visible demonstration; `claimId` = the claim's `id` |
| `breather` | exactly 1 | nothing new; not 1st, not 2nd, not last; no payoff |
| `callback` | 0–1 | sets `returns` = the hook's `plant` |
| `landing` | exactly 1, last | the takeaway; its `show` echoes the hook frame; may carry `returns` when no callback beat exists |

6–8 beats. Pad with `proof`, never with breathers.

## Per-beat fields

| field | rule | check |
|---|---|---|
| `id`, `index` | `beat-N`, 0-based index | — |
| `grammar` | one of the six roles | B-roles |
| `dur` | seconds, > 0, from the approved beat sheet | B-timing |
| `payoff` | `true` / `false`; the mark lands at beat end (or at `payoffAt` s into the beat) | B-hook, B-cadence |
| `claimId` | required on `proof`; an earlier `claim`'s `id` | B-claim-proof |
| `plant` / `returns` | hook plants; callback (or landing) returns the exact string | B-plant |
| `say` | ≤ 12 words, one idea; if it needs "and", split the beat | B-say |
| `show` | the one visual change, a verb phrase | B-grade |
| `hear` | `{ music: intro·build·peak·rest·return·outro, sfx: [{ name, at }] }` | engine G36 |
| `because` | "So…" after THEREFORE, "But…" after BUT (`hinge`) | engine G11 |
| `textBox` | `{x, y, w, h}` frame fractions in 0..1, inside the frame; required on every beat with `say` or `onScreen` text | B-textbox |
| `textSize` | optional `huge` · `subtitle`; mirrors BRIEF §6 | — |
| `readingLevel` | target 7; Flesch-Kincaid of `say + show` must be ≤ 8 | B-grade |

Legacy v8 fields (`role`, `hinge`, `label`, `visualAction`, `cameraMove`, `activeSimultaneousMoves`) stay on the beat when the board is going into the engine; brief-check ignores them.

## Timing rules (the film spec's ⟂ lines)

- **Hook in the first 2 s:** the hook beat ends at ≤ 2 s, or its payoff mark is at ≤ 2 s.
- **A visual payoff every 3–5 s:** at least two payoff marks; every gap between consecutive marks is 3–5 s; the last mark is ≤ 5 s before the end.
- Same predicate as the engine's `auditFilmSpec` (G37), so a board that passes here passes there.

## Wording rules

- No internal names in `say`, `show`, `because`: no gate ids, rung numbers, palette numbers, Greek letters, element codes (B-names, P7).
- Jargon from the clarity gate's banned list only inside parentheses (engine G33 · P3; not re-run here).

## Negative mutations brief-check's selftest proves it catches

hook at 3.1 s · two breathers · breather 2nd · proof with no claimId · a 6.5 s payoff gap · a 13-word `say` · a grade-19 `say` · a missing `textBox` · a `returns` that was never planted · an internal name in `say` · a blank §6 · an unfilled §2 slot · a ladder that skips the animatic · bible drift after hashing · a colour literal in the bible · §4 OPEN under `--ready`.
