# cand-A — reading-order wipes (lane `transitions`, round 2)

## Rationale
Every mask moves the way the eye reads the relation: cause→effect wipes left→right, contrast splits at a seam, a callback runs the hook's wipe backward.
Duration is one musical beat of the incoming feel (60 / tokens.tempo.byFeel[feel], else tokens.tempo.range ends), clamped to the shorter beat, so no overlap.
Masks are closed-form in u; easing applies only if tokens.motion.feels[feel] carries a bezier (the resolved tokens carry none, so u is linear).

## Slots
- Q3 because: hook→attention · cause→effect→continuity · contrast→change · zoom-in→attention · breather→character · callback→continuity · landing→change
- Q9 semantic (cause→effect): "Because {A}, therefore {B}: read left to right, cause first."
- Q9 semantic (contrast): "{A} against {B}: the frame splits so both sides compare."
- Q9 semantic (zoom-in): "From {A} into {B}: the iris narrows onto one detail."
- Q9 semantic (breather): "After {A}, a pause: hard cut, nothing new to read."
- Q9 semantic (callback): "{B} returns to {M}: the hook's wipe runs backward."
- Q9 semantic (landing): "{B} closes the argument: the iris shuts on one point."
- Q9 semantic (hook): "{B} opens the question; the reveal reads left to right."
- ({A}/{B} = beat label or id, {M} = toBeat.returns or fromBeat.plant; trimmed to ≤ 14 words)
- avoid G06: no clock/random/frame-loop calls anywhere; plan() is f(board, tokens); P6 + same-input-twice deep-equal across fresh vm instances.
- avoid G31: drawTwo() returns null unless global Two, two.makePath, group and transition all exist; checked by selftest "G31 two-noop".

## Table (relation → kind)
hook wipe · cause→effect wipe · contrast split · zoom-in iris · breather cut · callback wipe-back (= REVERSE[hook], derived not typed) · landing iris-back

## Modules and the gate that checks each
| module | role | checked by |
|---|---|---|
| relationOf | CONTRACT relation inference (breather > landing > callback+returns > zoom show > hook→claim "But" > proof→proof claimId > "But" > cause→effect) | P2 (via kinds) |
| transitionFor | {kind, semantic, t0, t1, focus?, relation, because, feel} | P1, P4, P6 |
| semanticFor | template fill + 14-word trim | P1 |
| bpmFor / dur | tempo from tokens only, clamped to min(from.dur, to.dur); cut = 0 s | P4, P5 |
| focusFor | one hot spot: wipe origin, seam, or iris centre; cut has none | E2 (one focus) |
| layout / plan | start/dur from totalDurationSec / n when the board omits them | P4, P6 |
| mask | rect wipes, seam split, 48-gon iris, keyhole iris-back (even-odd) | P3 |
| coverage | exact for rects; 50×50 grid sample for iris kinds (nested ⇒ monotone) | P3 |
| progress | u from t; bezier only from tokens.motion | P5 |
| drawTwo | sets group.mask; fill = tokens.color.paper; no stroke | G31 |

## Predictions
- predicted.wow: 0.55
- predicted.firstFlag: a bpm/number-literal gate on `SECONDS_PER_MINUTE = 60`, which equals tokens.tempo.byFeel.rest. It's a unit conversion, but a naive scan of the source for numbers can't tell it from a bpm value. Runner-up: board 2's breather→claim ("The fix…", hinge BUT) reads as cause→effect, because the CONTRACT's inference uses `say` and not `hinge`.

## mutationProof
Broke `breather: 'cut',` → `breather: 'wipe',` in an in-memory copy (selftest P7). P2 caught it ("sb-mcp-server/beat-5: breather → wipe"). The source on disk was never changed, so nothing needed restoring.
Also caught during authoring: P5 flagged `.2` inside the VERSION string. Restored by renaming VERSION to 'A-r2-reading-order'.

## Open risk
- No beat on either example board mentions zoom or push-in in `show`. `cameraMove` is "push-in", but the CONTRACT reads `show`. So the iris kind is only exercised by mask/coverage tests, never by a board.
- The tokens carry no easing curves, so motion is linear until tokens.motion supplies a bezier.
- No opening (hook) transition sits before beat-1. plan() covers consecutive pairs only, and transitionFor(null, beat) gives the hook entry on request.
