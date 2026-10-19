# MERGE NOTES — two.js soup → `studio-two-renderer.js` (TWO_LAYER 9.0.0, 36,854 B)

## Provenance (module · pass · source)
- parallax (3 planes, `#camera/` tags) · back · A
- ribbons (flow field, +14 % swash) · back · A (all strands back)
- cutouts (28-vertex rung→rung+1) · back · A
- spotlight (one travelling hot spot) · front · B — emits a `spot` item even at dim 0 ⇒ exactly one per frame
- diagram (reading order, head lands on the word) · front · B — widths via `measurer()`
- counter (odometer + MovementOk tag) · front · B
- kinetic `say` · front · A×B — A's letter draw-on re-clocked to B's `sayTiming.at(word)`, opacity × (1 − spotlight.dim)
- end-card lock-up, transition table · front · B
- palette lock + `audit()` · A, extended to rgba/gradient inks
- env/sayTiming/relation/focusOf · B, with A's `normBeat` (pose, rung, intensity, 12 s synth grid) folded in
- loader · B's `init({inline,cdn,onReady})` + A's `load()` Promise and `__TWO_INLINE_SRC`

## Intersection (kept verbatim)
Offscreen `Two.Types.canvas`, `autostart:false`, rebuild-from-t + manual `update()`, mulberry32 only, palette-locked fills, zero-op no-op without `Two`, reduced-motion settled frame, `init({inline})` + cdn loader.

## Contradictions → resolution
1. Scene application: A retained pool vs B clear-and-rebuild → G06 ⇒ B's rebuild over A's pure scene data (`build()` is the only two.js-touching code).
2. Passes: A two vs B one → contract: two passes; A's lone "front" ribbon strand moved to back.
3. `say` clock: A per-letter on `s` vs B word-landing → B's law (one clock per beat) with A's letter draw-on inside each word.
4. Hot spots: A's full-ink type vs B's spotlight → spotlight dim governs type (max letter op 0.78 under dim 0.22).
5. Text metrics: B's 6.4 px/char → `ctx.measureText` when available, 6.4 fallback.
6. Seed: A `seed^hash(palette)` and B `seed·1000003+idx·7919` composed. 7. `isAvailable`: A's `Two.Types.canvas` check + B's disposed flag.

## Dominance
Soup ⊇ both singles: every A and B module passes G31-text and the node run. B alone broke the two-pass contract; A alone had no transition/attention semantics. 36 assertions pass, `node --check` clean, zero forbidden tokens, real Wada 343 palette audit `[]`.

## G31 predicates
File-text on `studio-two-renderer.js`: `!/two\.play\(|requestAnimationFrame|Math\.random|Date\.now|performance\.now/.test(src)`; `/Two\.Types\.canvas/ && /autostart:\s*false/ && /two\.update\(\)/`; `/VERSION\s*=\s*'9\.0\.0'/`.
Node-run (validator sandbox, load `vendor/two.min.js` then the renderer — both load clean): `TWO_LAYER.audit(2.1,null,pal,7,null,{})` ⇒ `offPalette.length===0 && spotlights===1`; stage op-trace of `renderFrame(mock,3.7,null,pal,7,P,{sheet})` identical after seeks to 5.5 and 9.0 (harness in `selftest-merged.js`); without `Two`, `renderFrame` returns `false` with 0 mock ops.
MUT-12: in a copy replace `two.update();` with `two.play(); two.update();` ⇒ regex predicate fails (verified).

## Integrator checklist
1. `studio-motion-engine.js` MA.render: before `pr.draw(...)` L2757 (inside camera save, after onion ghosts): `if (op.twoLayer && global.TWO_LAYER) TWO_LAYER.renderFrame(ctx, T, op.beat, pal, op.seed|0, P, {pass:'back', sheet:op.sheet, captionsCovered:O.captionsCovered});` After `ctx.restore();` L2758, before the viewfinder L2769: same with `pass:'front'`. Grain L2783 unchanged. `studio-ui.js` `drawAllCanvases` passes `twoLayer, beat, sheet, seed`.
2. `scripts/build-package.mjs`: read `vendor/two.min.js` and `studio-two-renderer.js`; two more `.replace()` lines (vendor first, then renderer); assert `!/<script src=/.test(standalone)`; add both to the dist copy list (mkdir `dist/vendor`).
3. Validator `filesToLoad`: `geome-wada.js, studio-motion-engine.js, vendor/two.min.js, studio-two-renderer.js, studio-canvas-oauth.js, studio-ui.js`; append both to the G16 existence list.
4. Shell (`.dc.html`, `index.html`) script order: `geome-wada.js` → `studio-motion-engine.js` → `vendor/two.min.js` → `studio-two-renderer.js` → `studio-canvas-oauth.js` → `studio-ui.js`; `bootStudio` calls `TWO_LAYER.init({onReady: () => app.drawAllCanvases()})`.
