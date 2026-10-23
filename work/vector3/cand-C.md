Film line: "A robot finds one adapter that opens every drawer" (MCP board): every beat draws its own `show`, and the cuts read as one set.
# cand-C: SCENE by noun continuity (lane vector, round 3)

## Rationale
1. Each noun owns one box. A slot ring is keyed by the noun (`hash(noun+SALT) % 6`) and the actor is pinned home at (.15,.31). On MCP the robot is always left, the adapter always top-centre (between robot and drawer) and the drawer always top-right. On PF the sign is top-right, and the bars and notebook are bottom-left.
2. The callback's six drawers fan out of the hook's drawer box: an anchored stack at the same slot, offset by one fan step. The returns card reuses the hook's box because it has the same noun key. The PF sign keeps the same box across 'two weeks', 'ten weeks' and the leaning old sign.
3. In "between A and B" beats the newcomer lands last, so the hotspot is on the adapter. The breather keeps 2 boxes. Positions are pure data from `show`/`plant`/`returns`: nothing is retained, `seed` is ignored, and rendering goes only through `TWO_LAYER.renderFrame`.

## Coverage (G38: 15/15 beats, 0 unmatched)
| beat | primitives | terms matched | unmatched |
|---|---|---|---|
| mcp#0 hook | card:Robot, card:locked drawer (highlight) | robot filing drawer locked | — |
| mcp#1 claim | card:robot, card:drawer, card:adapter | adapter robot drawer | — |
| mcp#2 proof | card:adapter, arrow, pill:read, pill:search, pill:write | three cards adapter read search write | — |
| mcp#3 proof | card:Robot, pill:read, card:drawer, card:page | robot read drawer page | — |
| mcp#4 breather | card:adapter, card:drawer | robot adapter drawer | — |
| mcp#5 callback | card:locked drawer, stack:drawers(6), card:adapter, arrow | locked drawer adapter | — |
| mcp#6 landing | card:drawer, card:robot | drawer robot | — |
| pf#0 hook | card:character, card:two-week sign (highlight) | character sign two weeks | — |
| pf#1 claim | card:thought bubble, card:road | thought bubble road | — |
| pf#2 proof | card:bubble road, stack:potholes(3), card:flat tire | bubble road potholes detours flat tire | — |
| pf#3 proof | counter:bars (34→55 days) | bars second | — |
| pf#4 breather | card:bars (same box as the counter) | bars | — |
| pf#5 claim | card:Character, card:notebook | character notebook projects | — |
| pf#6 proof | stack:pages (fans from the notebook box), card:ten weeks (sign box) | notebook pages sign ten weeks | — |
| pf#7 landing | card:two-week sign (highlight, hook box) | week sign | — |

## Contract gaps (simplest default taken)
- `arrow` edge `from`: the contract maps arrow to `{from:id,…}` but a primitive has no source field. The tail is taken as the previous drawable primitive in the list, and `to` = the target id (the last fan node for a stack).
- `between`: used as placement only (references first, newcomer last), not as an arrow. Only `into`/`out of` make arrows. `X into six` makes an anchored stack of X; `X plugs into each` makes an arrow from X to the last stack.
- `out of` followed by a colon list ("cards…: read, search, write"): the stack is replaced by one pill per list item and the arrow points at the first pill.
- Breather with more than 2 nouns (mcp#4): keeping the *first* 2 would drop `drawer` and fail G38. Instead the *last* 2 are kept, and the `from` of the first kept primitive extends back over the folded nouns ("Robot, adapter").
- `mask`: never emitted (the predicate allows ≤ 1). `hotspot` alone is the mask.
- `coverage(scene)` has no `show` in the scene. A module WeakMap scene→show is used (optional 2nd arg `show`), so no extra return field is added.
- Counter numbers: the first and last numbers in `say`, with the unit as the word after the first number. With no numbers it counts 0→count word.
- Character box: the contract formula, shifted above the textBox (or below it if there is no room) when it intersects. The breather poses on both boards need this.
- Same noun twice in one show: one box whose `from` spans both mentions. Count words ("Three", "two") are never their own card; they join the next noun's span.
- Terms are deduplicated. `seed` has no effect (no jitter), so the output is deep-equal across seeds.

## Predictions
predicted.wow = 0.62. The set continuity across cuts is legible: drawer, adapter and sign never move, and the six drawers bloom from the locked one. Weak spots: mcp#2's read/search/write pills sit bottom-left, under the robot rather than beside the adapter, and pf#3 is a lone counter.
predicted.firstFlag = G38-adjacent "show = drawn" richness on pf#3. The merger's tie-break "fewer primitives win" favours it, but a reviewer may flag that "two bars side by side" draws one counter, not two bars. Second risk: the landing hotspot (mcp#6) falls on the robot, not the hook's drawer.

## mutationProof
`sed "s/visible: !!beat.character/visible: true/"` on an in-memory copy, loaded into a fresh sandbox. `charOK()` (predicate 5) returns false, so `caught = true`. The needle occurs exactly once (asserted).

## Open risk
- The slot map is a salted string hash (SALT `C3543`, chosen once so both boards seat recurring nouns on distinct, story-ordered slots). A third board may seat nouns in a less meaningful order. In-beat probing still prevents overlaps, but continuity across beats only holds when two recurring nouns don't collide.
- Inference rules for `reads 'x'`, `X of Y`, comma runs of stack words and colon lists are general string patterns tuned on two boards.

## Verify
`node work/vector3/selftest-C.js` → PASS 174/174, exit 0. `soup-runner check-literals work/vector3/cand-C.js` → exit 0 (0 colour literals). Forbidden tokens: 0. Size 16036 B.
