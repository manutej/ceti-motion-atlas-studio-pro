# Candidate B — two.js "storyboard theatre" layer

`work/two/candidate-B.js` (20,334 B, IIFE → `window.TWO_LAYER_B`: `init`, `renderFrame(ctx2d, t, beat, palette, seed, P)`, `modules`, `isAvailable`, `dispose`, `onReady`). API confirmed against the `two.js@0.8.17` npm source (Context7 quota exhausted): `Two.Types.canvas`, `domElement`, `Path.ending`, `Group.mask`, `Two.Stop`, manual `update()`.

## Rationale

two.js is used only where it carries meaning the Canvas engine does not: the **relation between beats** (transition), the **argument structure** (diagram), **quantity change** (counter), **where to look** (one spotlight), **what to remember** (end card). No decoration. Every module is `f(t, beat, palette, seed)` through one `env()`; the scene is rebuilt from `t` each call.

## Transition-direction semantics

| relation (from `grammar`/`hinge`/`cameraMove`; `beat.transition` overrides) | mask | why |
|---|---|---|
| hook | `wipe` left→right | reading order: the story starts |
| cause→effect (`THEREFORE`, proof) | `wipe` left→right | effect follows cause |
| contrast (`BUT`) | `split`: top half exits left, bottom exits right | the two halves disagree |
| zoom-in (claim, `push-in`) | `iris` opening from the beat's focus point | we go inside the idea |
| breather | `cut` | nothing new, no machinery |
| callback / `returns` | hook's mask **reversed** (`wipe-back` / `iris-back`) | the plant comes back the way it left |
| landing | `iris-close` onto the end-card | the frame closes on the takeaway |

## Draw-on timing law

`sayTiming(e)`: the `say` line lands word by word at ~3.3 words/s, starting `min(0.35 s, 12 %)` into the beat, spanning ≤ 64 % of it. `at(i)` is the instant word *i* shows. Each diagram element names the word it supports (`node.word`, `edge.word`), starts drawing at `at(i) − D` and **finishes exactly at `at(i)`** (`Path.ending` = eased progress; the arrow head is emitted only in the last 15 % and pops with Glaser overshoot as the word lands). Render order = supported word, then left→right. Without an explicit `diagram` one is derived: hook → plant pill + underline; proof → `claim ⟶ proof` arrow; callback → bracketed `returns`; else `prev ⟶ this`.

The counter shares the clock: value eases to `to` at `at(word)`; digits roll as an odometer (higher columns flip as lower ones wrap); a visible `↳ moves because: <beat.because>` tag is G11 MovementOk on screen.

## Composite order inside `MA.render`

Insert after `pr.draw(...); ctx.restore();` (engine L2757–2758), **before** the grain/vignette pass (L2783) so grain unifies both layers:

```js
if (op.twoLayer && window.TWO_LAYER_B && TWO_LAYER_B.isAvailable())
  TWO_LAYER_B.renderFrame(ctx, T, op.beat, pal, op.seed || 7, { sheet: op.sheet, reduced: op.reduced });
```

Layer z-order: spotlight (dim-the-rest) → diagram → counter → end-card → transition curtain. It draws to its own offscreen `Two({type: canvas, domElement})` stage and `drawImage`s it once inside one `save/restore`.

## Standalone inlining

`build-package.mjs`: add `vendor/two.min.js` (182 KB) and the layer to the `<script src>` replace list, dist copy list, and the validator's `filesToLoad`. Zero-dependency build: `TWO_LAYER_B.init({ cdn: false, inline: () => Two })` hands over the inlined constructor; CDN build: `init()` injects the cdnjs script. `onReady` fires either way; if nothing loads, `isAvailable()` stays false and every call is a silent no-op.

## G06 argument

No `play()`, no rAF, no `Date.now/performance.now/Math.random` (asserted). `two.clear()` then rebuild from `t`; `two.update()` manual. `mulberry32(seed·1000003 + beatIndex·7919)` is re-seeded per call, so identical `(t, seed)` gives identical wobble. Reduced motion (G16) clamps `t` to the beat's final instant → settled static frame. In the validator sandbox `Two` is undefined → `renderFrame` returns `false` with zero ctx ops, so G06's op count is untouched.

## Smoke test

`node work/two/selftest-B.js [two.js]` — 17 assertions:

```
PASS isAvailable() → false without Two
PASS init/renderFrame/dispose never throw without Two
PASS no-op: renderFrame → false, zero ctx ops (G06 mock-ctx safe)
PASS no document, no Two → still no-op, no throw
PASS say timing law: 9 words land in order (last at 3.52s)
PASS transition semantics: wipe → iris → wipe → cut → wipe-back → iris-close
PASS seeded PRNG only · size 20334 B ≤ 20480 B
PASS Two loaded → 12 s of frames never throw; stage drew 1787 ops
PASS G06: same t,seed → identical stage ops (49=49); other t → 27
PASS counter rolls 0→128 (- - 76 128 128) · G16 reduced → settled frame
PASS dispose() → subsequent renderFrame no-op
ALL PASS
```

Risk: pill widths use estimated text metrics (6.4 px/char).
