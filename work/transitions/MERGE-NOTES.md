# MERGE-NOTES — lane `transitions`, round 2 (soup of cand-A, cand-B, cand-C)

## Provenance (module · source · law)
| module | source | law |
|---|---|---|
| UMD wrapper → `window.TRANS` + `module.exports` | CONTRACT §API | contract |
| `table`, `REVERSE`, callback = REVERSE[hook] | A·B·C | intersection; hook = wipe by contradiction #1 |
| `relationOf` | B + A (null → hook) + C (hinge) | union; order by #2–#5 |
| `focusOf` / `cueFocus` / `hash` | B | union (only candidate with it); governs by tie-break |
| `feelOf`, `bpmOf`, `ease` | B | union; ease validation by #13 |
| `holdRatio`, `relationWeight` | C | union, applied to `cut` only (tie-break) |
| `durFor` | A/B (non-cut) + C (cut) | contradiction #8/#9 |
| `transitionFor` shape {kind, semantic, t0, t1, focus?, relation, because, feel, from, to} | B, minus focus on cut (C) | union; #7 |
| `TEMPLATE` (Q9) | B | contradiction #11 |
| `BECAUSE` (Q3) | A | open #14/#15 (provisional = bestSingle) |
| `FEEL_BY_GRAMMAR` | B | open #16 (A lacks one) |
| `normalize` + aliases `layout` (A), `schedule` (C), `plan` (A/B) | A·B·C | union; empty-total fallback open #17 |
| `mask` (chevron wipe, focus-born split/iris/iris-back) | B; cut flips at u=½ from C | #6, #10 |
| `coverage` (exact shoelace, optional focus) | B | #18; A/C grid samplers dropped (same slot) |
| `progress`, `maskAt`, `active`, `toPathD` | B | union |
| `drawTwo` (cmds form B, group/tr form A) | A + B | union |
| `twoLayer` | C | union |
Nothing failed a gate in all three, so nothing was dropped on that count. The A/C grid coverage, A/C rect wipe, A `bezierAt` and C `circle` were dropped as losing implementations of a slot whose contradiction was resolved.

## Intersection (every candidate states it → proposedAtom, E1)
1. The boards carry no start/dur/feel, so timing comes from grammar + `totalDurationSec`. 2. The example boards put zoom in `cameraMove` (push-in), not in `show`. 3. `tokens.motion.feels` carry no easing, so progress is linear in u.
4. callback kind = REVERSE[table.hook], derived and never typed. 5. breather → cut; landing → iris-back. 6. The window is clamped to the shorter beat and centred on toBeat.start.
7. Every transition returns relation + because + feel beside the contract fields. 8. The iris polygon radius is divided by cos(π/N) so that u=1 covers the frame. 9. G31: the two.js layer returns null without `Two`.

## Contradictions
| # | topic | A | B | C | resolution | cite |
|---|---|---|---|---|---|---|
| 1 | hook kind | wipe | wipe | cut | wipe | CONTRACT §API kind set has wipe-back, reachable only as reverse(wipe); E2 "direction encodes relation": a cut has no direction, so callback=cut collapses onto breather |
| 2 | contrast vs zoom rank | zoom first | contrast first | zoom first | contrast > zoom-in | lane tie-break + CONTRACT §Relation inference: zoom is ranked only "ABOVE the cause→effect default" |
| 3 | `hinge: BUT` | ignored | ignored | last fallback | contrast trigger | lane tie-break "hinge/say But → contrast" |
| 4 | zoom fields | show | show+cameraMove+visualAction | show+visualAction | all three | lane tie-break "`show` or `cameraMove`" |
| 5 | callback test | callback ∧ returns | callback ∨ returns | callback ∨ returns | callback ∨ returns (after landing) | CONTRACT "callback (returns set)" |
| 6 | mask origin | wipe x=0, centre | incoming hot spot | centre, iris/split only | B | lane tie-break "focus from B governs" |
| 7 | focus on cut | none | yes | none | none | CONTRACT §API focus? = "where the mask opens/closes"; E2 one hot spot |
| 8 | cut window | 0 | 0 | hold ratio | C | lane tie-break "hold-length from C apply only to cut" |
| 9 | non-cut window | 60/bpm | 60/bpm | hold ratio | A/B | same tie-break |
| 10 | cut flip | u>0 | u>0 | u≥½ | u≥½ | CONTRACT §API t0/t1 centred on toBeat.start (under C's hold, only ½ lands the cut on start) |
| 11 | Q9 templates | reading order | hot spot | hold | B | tie-break #6: the template must describe the shipped mask; CONTRACT semantic names relation |
| 12 | literal `60` | unit const | unit const | scan forbids | keep; C scan exempts one `SECONDS_PER_MINUTE` | CONTRACT §Self-test 5 lists easing/colour/font + check-literals only |
| 13 | ease tuple | any 4 | monotone only | none | B | CONTRACT "coverage(u) monotone non-decreasing" |
| 14 | because.landing | change | character | character | **OPEN** (ships A) | no clause / atom |
| 15 | because.breather | character | character | attention | **OPEN** (ships A) | no clause / atom |
| 16 | grammar→feel (proof/callback/landing) | none | beat/rostrum/slow | rostrum/beat/held | **OPEN** (ships B; A lacks) | no clause / atom |
| 17 | dur when no totalDurationSec | 0 | NaN | 1 s | B excluded (t0/t1 must be seconds); A vs C **OPEN** (ships A) | CONTRACT §API |
| 18 | coverage method | grid 50² | exact | grid 48² | B | one slot; only B takes focus (tie-break #6) |
openContradictions = 4 (#14–#17). Provisional values follow one mechanical rule: take bestSingle's value; if bestSingle lacks the element, take the next candidate by score.

## Dominance (soup ⊇ each single; merged predicates 25)
- **A (20/25)**: the soup passes selftest-A unchanged (exit 0). A fails or lacks P6b (no maskAt), LENS1 (no focusOf), REL (hinge BUT, cameraMove push-in, zoom above the default), HOLD (feel null, no cut hold) and G31 (no twoLayer).
- **B (19/25)**: the soup passes selftest-B except LENS on the two breather cuts (focus on a cut), which #7 narrows. B fails P4 (cut introduces a focus), P5c (decimal `2.0` in VERSION), P5e (`ARC = 64`), REL (hinge; no hook entry), HOLD (cut span 0) and G31.
- **C (18/25)**: the soup passes selftest-C except the P5 tempo scan on `SECONDS_PER_MINUTE = 60`, which #12 narrows. C fails P5c (`0.5`, `2.0`), P6b, LENS1, REL, HOLD (iris-back 1.667 s ≠ one beat 0.833 s), G31 (no drawTwo) and E2 (callback = cut = breather).
- **bestSingle = cand-A** (20/25, no tie, so predicted.wow is not needed).
- The soup ⊇ a single holds over all 25 merged predicates. Against the raw single selftests it holds modulo the two contract-narrowed clauses (#7, #12).

## G35 transitions — gate predicates (run from work/transitions/)
- G35.1 `node --check soup.js` → 0
- G35.2 `test $(wc -c < soup.js) -le 18432` → 0
- G35.3 `! grep -nE 'Math\.random|Date\.now|performance\.now|requestAnimationFrame' soup.js` → 0
- G35.4 `node ../../skills/motion-soup/scripts/soup-runner.mjs check-literals soup.js --tokens ../tokens.resolved.json` → 0
- G35.5 `node -e 'const T=require(process.argv[1]);process.exit(T.table.breather==="cut"&&T.table.callback===T.REVERSE[T.table.hook]&&T.table.callback!==T.table.breather?0:1)' $PWD/soup.js` → 0
- G35.6 `node selftest-merged.js` → 0 (25/25)
- Negative mutation, verified: `sed "s/breather: 'cut',/breather: 'wipe',/" soup.js > $SP/mut/soup.js`. G35.5 on the mutant → exit 1. `node selftest-merged.js $SP/mut/soup.js` → exit 1 (22/25: P2, E2 and P7 fail).

## Open risk
- The board hooks→claims carry `hinge: BUT`, so contrast outranks their push-in and iris (zoom-in) is exercised only by synthetic REL cases.
- The soup is 17.9 KB, close to the 18 KB cap.
