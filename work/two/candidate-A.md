# Candidate A — "living vector atmosphere" (two.js layer)

**File:** `work/two/candidate-A.js` (17.8 KB, IIFE → `window.TWO_LAYER_A`). Tested against real two.js 0.8.17 via `npm pack` (two.min.js = 182,426 B; the audit's ~150 KB estimate is low).

## Rationale
Sharpen, don't reskin. Everything two.js draws derives from fields the beat already owns (`characterPose`, `role`, `hinge`, `cameraMove`, `wadaFocusRole`, `say`) plus the Wada `P` from `prep()`. The scene is plain data (`modules.scene`) applied to retained two.js objects by re-setting every property each frame, then one `two.update()`; the applier is the only code touching two.js, so modules are pure and testable without a DOM.

## Modules (pure functions of `(t, beat, palette, seed)`)
1. **ribbons** — three flow-field ink strokes pour in from the hinge side (BUT = left, THEREFORE = right) toward the actor with a closed-form Glaser overshoot leg (+14 %), tail released via `beginning`. *WOW:* the actor arrives on a ceremonial swash that overshoots and snaps.
2. **cutouts** — two Saul Bass silhouettes breathe between the beat's rung and rung+1 by vertex-for-vertex interpolation (28-vertex polar shapes, rungs 1–5). *WOW:* the mascot's shadow simplifies itself live.
3. **kinetic** — the beat's `say` line (fallback `label`) draws on letter by letter, stroke-to-fill, tracking tightening 11→7.4 px on the Glaser curve; hidden when `captionsCovered`. *WOW:* type locked to the clock.
4. **parallax** — three planes of Wada discs/bars drift and zoom by the camera vocab tag (`push-in` zooms, `pan-follow` slides, `kick-shake` jolts). *WOW:* the flat frame gains depth.
5. **paletteLock** — the only colour source; `audit()` returns `offPalette:[]`, a ready-made G30 gate (fills/strokes ∈ {paper, ink, a, h, b, c}).

## Composite order inside `MA.render` (studio-motion-engine.js)
- Between L2755 and L2757 (inside the camera `ctx.save()`, after onion ghosts, before `pr.draw`): `TWO_LAYER_A.renderFrame(ctx, T, op.beat, pal, op.seed|0, P, {pass:'back', captionsCovered:O.captionsCovered})` — parallax backs + cutouts sit under the actor and share the camera transform.
- After `ctx.restore()` L2758, before the viewfinder L2769: same call with `pass:'front'` — ribbons, front plane and kinetic type stay pinned to the frame.
- Grain/vignette L2783 runs after both, so the multiply grain unifies the layer with the canvas art.
`drawAllCanvases` (studio-ui.js L227) passes `opts.beat`/`opts.seed`. With no `Two`, both calls return `false` with zero ctx ops: `MA.render` and G06's op count are unchanged.

## Standalone inlining (scripts/build-package.mjs)
1. Add `vendor/two.min.js`; in `.dc.html`/`index.html` add `<script src="./vendor/two.min.js">` + `<script src="./studio-two-layer.js">` (this file, renamed) before `studio-ui.js`.
2. L31–35: two more `.replace()` lines with `fs.readFileSync` bodies — inline two.js is the zero-dependency path; `TWO_LAYER_A.load()` short-circuits since `isAvailable()` is already true.
3. Modular build: `bootStudio` calls `TWO_LAYER_A.load()` → injects the cdnjs tag; on failure the layer stays a silent no-op. `window.__TWO_INLINE_SRC` is the hook for other bundlers.
4. Append both files to the dist copy list L43 and validator `filesToLoad` L137.

## G06 determinism
`scene()` reads only `t`, beat fields, palette hexes and a Mulberry32 stream seeded from `seed ^ hash(palette)` per module/beat — no `Math.random`, wall clock or frame counter. The applier re-sets every property of every retained object each frame and hides anything untouched, so no state leaks between frames; `two.update()` redraws the offscreen canvas from scene state only (`autostart:false`, never `play()`). `prefers-reduced-motion` forces `s = 1` → the resolution frame (G16). Verified: the offscreen op trace for `t = 3.7` is identical whether preceded by `t = 5.5` or `t = 9.0` (635 ops).

## Node smoke test (run, passing)
```
$ node -e '<vm sandbox, no Two, no document; loads work/two/candidate-A.js>'
isAvailable: false init: false
renderFrame no Two -> false ctx ops: 0
scene(t) twice identical: true items: 38
audit: {"ok":true,"offPalette":[],"count":38}
no-beat 12s clock: 6 reduced s= 1
dispose ok
```
With real two.js 0.8.17 + mock DOM: `isAvailable: true`, 6 frames composited via `drawImage(two.renderer.domElement)`, determinism `true`.
