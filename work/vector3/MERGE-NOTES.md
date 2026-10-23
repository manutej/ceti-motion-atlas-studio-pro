Film line: "A robot finds one adapter that opens every drawer". Every frame draws its own `show`, and the hotspot lands on the adapter or the drawer, never on the robot.

# MERGE-NOTES: lane vector, round 3, module SCENE (soup of A, B, C)
`soup.js` is 16126 B (`window.SCENE` + `module.exports`). `selftest-merged.js` is 12269 B and passes 333/333 (exit 0). `check-literals` exits 0. Forbidden tokens: 0. Primitives per beat: mcp 3·4·5·6·2·6·2, pf 3·2·4·2·1·3·3·1, total 47 (A 51, B 54, C 36).

## Provenance (module · source · law · serves the film by)
| module | source | law | serves the film by |
|---|---|---|---|
| `terms`, STOP, quoted pills, plant card, counter, `into <count>` stack | A | UNION | naming the robot, the adapter and the drawer out loud: every noun gets a labelled mark |
| motion-verb arrows (`reaches/taps/opens/plugs/turns…`, ≤ 2, `out of` reverses) | A | UNION | drawing "opens" and "plugs into each" as direction, the verb the film is about |
| `between X and Y` → arrow X→Y, referents first, newcomer last | contract inference 4 + C order | CONTRADICTION→contract | having the adapter land last, on the robot→drawer edge (mcp#1) |
| mask on the arrow head when an arrow lands last (hotspot = head) | B | UNION | putting the spotlight on the six drawers the adapter plugs into (mcp#5) |
| noun→slot ring (`hsh(key+'C3543') % 6`, actor HOME .15/.31, in-beat probing, frame clamp) | C | UNION | keeping the drawer, adapter and sign in the same place across cuts, so all beats read as one set |
| anchored callback stack (`into six` fans one step off the drawer's own slot) | C (+A label) | UNION | having the six drawers come out of the one locked drawer |
| merges: comma-run stacks · `noun reads 'x'` · `X of [w] Y` · same noun key (spans joined, highlight wins) | C | CONTRADICTION→contract "fewer primitives win" | removing duplicate drawers (mcp#0): one drawer, one adapter |
| colon list replaces its stack; the list pills take the stack's span | C (+A pills) | CONTRADICTION→G38 | showing read/search/write as the three cards, each with a label |
| actor-first order (robot/character lands first) | C HOME + film line | CONTRADICTION→contract "one hotspot = last to land" | keeping the landing hotspot off the robot (mcp#6 hotspot = drawer) |
| breather chunking (≤ 2 cards, `·`-joined labels); a lone counted plural becomes a stack | A + C | INTERSECTION + G38 | holding the robot, the adapter and the drawer still in the emptiest frame |
| `toDiagram` (tail = previous drawable; stack head = last node; path dots) | A ≡ C | INTERSECTION | running "adapter → drawer" in reading order |
| `coverage(scene, show?)`: arg › WeakMap › structural clone › loud fail | A + B + C | INTERSECTION (fixed) | proving the drawer, adapter and robot are drawn, including on cloned scenes |
| `characterOf` (contract box, shifted above the textBox, `visible: !!beat.character`) | A ≡ B ≡ C | INTERSECTION | keeping the robot a prop on these boards, so the hotspot stays on the object |
| `render` → `TWO_LAYER.renderFrame(b2)` only; `counterOf` | A ≡ C | INTERSECTION | drawing in the grammar's ink (palette lock), with one spotlight per frame |

## Intersection (all three stated, now proposed atoms E1)
1. The arrow's tail is the previous drawable primitive. 2. `coverage` needs `show` on a cloned scene; the soup now accepts both forms and finds clones structurally. 3. The breather keeps the primitives that preserve show-coverage: chunk, never drop a term. 4. `between` is a relation between two referents with a newcomer. The contract makes it an arrow; A and C only placed it.

## Contradictions
| topic | A | B | C | resolution | cite |
|---|---|---|---|---|---|
| label density | label every noun | no labels | label every noun | Label every noun mark. Duplicates merge (fewer primitives). B's unlabelled pills are dropped: a noun with no label is not recognisable | contract "coverage beats richness: fewer primitives win" + G38 |
| `between` | no arrow | path | no arrow | arrow X→Y | contract inference 4 "two terms joined by into\|between\|out of → arrow" |
| hotspot owner | last primitive (robot on mcp#6) | arrow head (mask) | landing on robot | Actor lands first. The mask sits on the arrow head only when an arrow lands last. Landing = drawer | contract "one hotspot, the last to land" + film line |
| pf#3 two bars | counter + pill (2) | pill + counter | one counter | two marks (counter + "second"); pf#4 breather = stack n=2 | G38 show = drawn ("Two bars" ⇒ 2 marks) |
| verb arrows vs fewer primitives (mcp#3: A 6, C 4) | arrows | 1 edge | none | Keep ≤ 2 verb arrows. "Fewer primitives" applies to noun marks | ledger E1 "direction encodes relation" (weakest resolution, see open) |
| plant box | fixed ANCHOR top-left | same box at hook and callback | noun slot | C slot (hook = callback through the noun key; also gives continuity) | contract inference 3 "callback reuses the hook's box" (both satisfy; C ⊇ A) |
| mask count | none | always 1 | none | ≤ 1, only when an arrow lands last | contract predicate 4 "at most one mask". OPEN: the kind map says "exactly one" |
| breather chunk "robot · adapter" position | n/a | n/a | adapter slot | actor HOME | OPEN: no clause |
| mcp#5 `turns` arrow length (the anchored fan overlaps its card) | — | — | — | kept (C fan-out + A arrow) | OPEN: visual, no gate |

## Dominance argument
- **vs A**: same 49/49 coverage. A is noun-for-noun the same, but the soup uses fewer primitives on 6 beats (mcp#0 3<4, mcp#2 5<6, pf#0 3<4, pf#2 4<5, pf#5 3<4, pf#6 3<4) and more on 2: mcp#1 (+1, the contract's `between` arrow) and mcp#5 (+1, a mask that draws nothing). It is also strictly better on the contract (between → arrow) and on the film (the mcp#6 hotspot is on the drawer; on A it was the robot). It does not dominate on count alone.
- **vs B**: B fails G38-strict (filing, search, write, page, detours, tire and projects have no mark of their own). The soup passes it on all 15 beats with fewer primitives (47 < 54), and keeps B's verb-head hotspot where the verb lands last. The soup dominates B.
- **vs C**: C has fewer primitives (36 vs 47), so the soup does NOT dominate C on count. The soup wins on clauses that outrank count: G38 "show = drawn" (pf#3 two bars vs C's one), the contract's `between` arrow, the hotspot being the last to land and off the character (C's mcp#6 lands on the robot), and E1 arrows. C's continuity is kept intact (same SALT and ring; predicate "C continuity" is green).

## G38 "show = drawn": gate predicates (node checks, all in `selftest-merged.js`)
- `node work/vector3/selftest-merged.js | grep -c 'FAIL.*G38'` → `0` (1 G38: `coverage(scene).unmatched.length===0` ×15; G38 strict: every term matched by a non-arrow/path/mask primitive ×15; G38 literal: `<count> <plural>` outside quotes draws ≥ count marks).
- Clone check: `coverage(JSON.parse(JSON.stringify(scene))).unmatched.length === 0` ×15.
- **MUT (sed-able, verified):** `sed "s/if (f0) join(f0, d, null);/if (f0) P.splice(P.indexOf(d), 1);/" work/vector3/soup.js > $S/m.js && SCENE_SRC=$S/m.js node work/vector3/selftest-merged.js` → exit 1 (mcp#0 unmatched=`locked`; 327/333).
- Contract MUT: `sed "s/visible: !!beat.character/visible: true/"` → exit 1 (`5 character` FAIL). It is also caught in-process (`mutation caught`).

## bestSingle
**C.** All three tie on coverage (100%) and wow (0.62), so the contract tie-break "fewer primitives win" decides, and C has the fewest (36). If the soup were blocked, ship C and patch the mcp#6 hotspot (actor first) and the mcp#1 `between` arrow.
