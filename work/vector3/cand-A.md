Film line: "A robot finds one adapter that opens every drawer" (MCP board), so every frame names its props out loud.

## Rationale (lens: labelled props)
- Each `terms(show)` noun is its own labelled card or pill. Adjacent terms merge into one noun label ("filing drawer", "bubble road"), so the frame reads as a captioned diagram of nouns.
- Arrows appear only where `show` has a motion verb (reaches, slide, taps, opens, turns, plugs, sprouts, fan, hammers, flips): source → object, `out of` reverses the direction, at most 2 per beat, no duplicate pairs. No verb means no arrow.
- In the film-line frame (mcp#5), "turns into six" becomes a 6-high stack labelled "six drawers", and the one adapter card points into it. The plant card has a fixed box (0.06, 0.08, 0.24, 0.10), so the callback/landing card sits exactly where the hook put it.

## Coverage (`fromBeat(beat, tokens, 7)`; primitives in landing order; unmatched is empty on all 15)
| beat | show terms matched | unmatched | primitives |
|---|---|---|---|
| mcp#0 hook | robot, filing, drawer, locked | — | robot · arrow(reaches) · filing drawer · **locked drawer** |
| mcp#1 claim | adapter, robot, drawer | — | adapter · robot · drawer |
| mcp#2 proof | three, cards, adapter, read, search, write | — | stack(3 cards) · adapter · arrow(slide out of) · read · search · write |
| mcp#3 proof | robot, read, drawer, page | — | robot · arrow(taps) · read · drawer · arrow(opens) · page |
| mcp#4 breather | robot, adapter, drawer | — | "robot · adapter" · drawer (2) |
| mcp#5 callback | locked, drawer, adapter | — | **locked drawer** · arrow(turns) · stack(six drawers, n=6) · adapter · arrow(plugs) |
| mcp#6 landing | drawer, robot | — | drawer · robot |
| pf#0 hook | character, sign, two weeks | — | character · arrow(hammers) · **two-week sign** · 'two weeks' |
| pf#1 claim | thought, bubble, road | — | thought bubble · road |
| pf#2 proof | bubble, road, potholes, detours, flat, tire | — | bubble road · arrow(sprouts) · stack(potholes) · stack(detours) · flat tire |
| pf#3 proof | bars, second | — | counter(bars, 34→55 days) · second |
| pf#4 breather | bars | — | bars (1) |
| pf#5 claim | character, notebook, projects | — | character · arrow(flips) · notebook · projects |
| pf#6 proof | notebook, pages, sign, ten weeks | — | stack(notebook pages) · arrow(fan) · sign · 'ten weeks' |
| pf#7 landing | week, sign | — | **two-week sign** |
Coverage 15/15 beats, 49/49 terms (100%). Breathers have the fewest primitives on their boards: mcp 2 (ties with the landing), pf 1 (ties with the landing).

## Contract gaps (simplest default chosen)
- **mask**: no `mask` primitive is emitted. `hotspot` is the only hotspot, and predicate 4 allows ≤ 1 mask. Emitting one would break the breather's ≤ 2 limit on mcp#4.
- **arrow source**: the API gives an arrow only `to`. The source is the nearest preceding non-arrow, non-counter primitive in `primitives`; inference places each arrow right after its source. An arrow's `from` is the motion verb, which is a substring of show.
- **arrow inference vs the lens**: `into|between|out of` gives a direction only when a motion verb is present. mcp#1 "appears between" therefore has no arrow.
- **edges into a stack** resolve to the stack's last (labelled) node `id+'_'+(n-1)`.
- **plant `from`** when the plant phrase is not in show: the longest plant token found in show (a tie goes to the last token, the head noun). Example: "locked drawer" gives `drawer`.
- **counter**: `b2.counter` = `{from, to, unit, x, y, word}`. `from`/`to` are the first and last numbers in `say` (one number gives 0→n), `unit` is the word after the first number, and x/y is the box centre. The primitive's own `from` stays a show substring.
- **breather merge**: if more than 2 props, they are chunked in show order into 2 cards. Each card's label is the props joined by " · " and its `from` is the show slice covering them, so coverage is kept.
- **duplicate ids** get the suffix `_2`, `_3`, and so on (e.g. `b3_arrow_2`).
- **character box**: if the formula box hits `textBox`, it moves above the text box (or below it if there is no room). Example: mcp#4 with a character, whose pose box would cross the breather's text box.
- **coverage(scene)**: show is remembered in a WeakMap keyed by the scene object. An optional 2nd arg `show` handles cloned scenes. An unknown scene returns `unmatched: ['(show unknown)']`, so it fails loudly.
- **lens extension**: "`<noun>` into `<count>`" → a stack labelled "`<count>` `<noun>`s" with `from` = "into six".
- **16 KB** is read as 16384 bytes; cand-A.js is 15901 bytes.

## Predictions
- predicted.wow = 0.62. Every frame names its props and mcp#5 shows six drawers with one adapter feeding them. Against that, the cards are plain pills (the grammar's ink), and dense beats (mcp#2/#3: 6 primitives in 2 rows) read like diagrams, not like a picture.
- predicted.firstFlag = the lane tie-break "coverage beats richness: fewer primitives win". This lens is the densest by design: mcp#0 draws "filing drawer" and "locked drawer" both, and mcp#2/#3 carry 6 primitives each. A leaner candidate with the same 100% coverage wins those beats at merge. The runner-up flag is the arrow-on-verb rule, which departs from the contract's `between` → arrow inference on mcp#1.

## mutationProof
`selftest-A.js` checks that `visible: !!beat.character` occurs exactly once, then loads a copy with `visible: true` into a fresh harness. Predicate 5 (`charPred`) is re-run on that copy and must FAIL. It does (`caught = true`): every board beat shows the character.

## Verify
`node work/vector3/selftest-A.js` → PASS 206/206 predicates, mutation caught, exit 0.
`node skills/motion-soup/scripts/soup-runner.mjs check-literals work/vector3/cand-A.js --tokens work/tokens.resolved.json` → exit 0 (0 colour literals).
