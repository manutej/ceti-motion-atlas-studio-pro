# motion-soup — lane catalog

One lane = one API contract + one self-test shape + lens seeds for diverse candidates. Copy the stub into `work/<lane>/CONTRACT.md` (≤ 60 lines), fill the host-specific names, and never put a token value in it — `tokens` is always the resolved object read from `work/tokens.resolved.json`.

Common to all lanes:
- Module shape: IIFE that registers `window.<NAME>` and `module.exports`, exposes `VERSION`, is a no-op without its optional dependency (`typeof Two`, `typeof AudioContext`), and never calls `Math.random`, `Date.now`, `performance.now`, `requestAnimationFrame` in render/schedule paths.
- Self-test shape: node script, no deps, mock DOM/ctx where needed, prints `PASS`/`FAIL` lines, exits non-zero on any fail, contains ≥ 1 negative mutation on a copy of the source that sets `caught`.
- `seed` is an integer; a seeded PRNG (mulberry32 or equivalent) is the only randomness and is re-created from `(seed, beat.index)` on every call.

---

## music

**Contract stub**
```
MUSIC.plan(sheet, tokens, feel, seed) → {
  tempo: { bpm ∈ tokens.tempo.range, beatSec, grid },          // bpm chosen from tokens.tempo.byFeel[feel] or the range
  key:   { root, mode },                                        // derived from tokens.color roles (hue/lightness → mode), not a table in the module
  cues:  [ { beatId, mood, t0, t1, voices[], duck } ],          // one per beat; exactly one mood === 'breather'
  motif: { rel[], plantT, returnT },                            // optional; returnT > plantT when present
  duck:  { dB, attackMs, holdMs, releaseMs },                   // one law for the whole plan
  sfx:   [ { name, t, tRaw, quantized } ]                       // host SFX names; music ducks under every one
}
MUSIC.schedule(ctx | null, plan, t0) → { live: bool }           // null ctx → { live: false }, never throws
MUSIC.seek(t) · MUSIC.duck(level, t) · MUSIC.dispose() · MUSIC.VERSION
```
**Self-test predicates**
1. `plan` deep-equal on same `(sheet, tokens, feel, seed)`; differs when `seed` changes.
2. Exactly one `breather` cue; it has no pulse/percussion voices.
3. `cues.length === sheet.beats.length`; `t0 < t1`; cues tile the sheet without gaps.
4. `plan.duck` fields all finite; a mock gain-param log on `duck()` shows cancel → attack → hold → release in that order.
5. If `motif` present: `returnT > plantT`, and the return pitches equal the plant pitches.
6. `quantized ⇒ |t − tRaw| ≤ grid/2`, else `t === tRaw`.
7. `tempo.bpm` within `tokens.tempo.range`; `beatSec * fps` integer for feels that declare an fps grid.
8. `schedule(null, plan, 0).live === false`; `seek(5)` with a mock ctx never throws.
9. Text: forbidden-token regex; `VERSION` string; size cap.

**Lens seeds.** A "harmonic bed first" (continuous pad + bass, chord per beat role, ducking as the mix law) · B "leitmotif and pulse first" (seeded motif per archetype, plant/return, quantised pulse) · C "silence first" (sparse hits, long rests, the breather as the loudest silence).

**Lane tie-breaks that are contract.** feel → tempo comes from tokens; exactly one breather; the deeper/faster duck wins when two candidates disagree (SFX must pop); determinism beats richness.

---

## vector (visual layer)

**Contract stub**
```
LAYER.init({ inline?: string, cdn?: string, onReady?: fn })     // vendored source preferred; cdn fallback; no-op if neither
LAYER.isAvailable() → bool
LAYER.renderFrame(ctx2d, t, beat, tokens, seed, P, opts{ pass: 'back'|'front', sheet, captionsCovered }) → bool
LAYER.audit(t, beat, tokens, seed, P, opts) → { offPalette: string[], spotlights: n, modules: string[] }
LAYER.modules = { <name>: (t, beat, tokens, seed) → sceneData }   // pure; the applier is the only code that touches the vector lib
LAYER.dispose() · LAYER.VERSION
```
**Self-test predicates**
1. Without the vector lib in scope: `renderFrame` returns `false` and the mock ctx records 0 ops.
2. With the lib: op-trace of `renderFrame(…, 3.7, …)` identical after seeks to two other `t` values (seek-history independence).
3. Two passes: `back` draws before the host actor, `front` after; a module appears in exactly one pass.
4. `audit().offPalette.length === 0` — every fill/stroke resolves to a `tokens.color` role.
5. `audit().spotlights === 1` per frame (one place to look).
6. Reduced-motion flag → a settled frame (same ops at any `t`).
7. Every module has a `because ∈ {attention, continuity, change, character}` in its scene data.
8. `dispose()` idempotent; `init` twice is safe.
9. Text: no `play(`, no rAF, no RNG, no font/colour literal; `autostart: false` or equivalent.

**Lens seeds.** A "atmosphere" (parallax planes, flow-field ribbons, silhouette cutouts) · B "argument" (diagram in reading order, counter, one spotlight, end card, transition masks) · C "type only" (kinetic `say` drawn on the beat clock, nothing else).

**Tie-breaks.** Determinism beats richness; one clock per beat (word landing) governs letter draw-on; spotlight dim governs type opacity; rebuild-from-t beats retained-object mutation when they disagree.

---

## wording + storyboard grammar

**Contract stub**
```
sheet = { storyKey, title, beats: [6–8 × {
  id, index, grammar ∈ hook|claim|proof|breather|callback|landing,
  say  (≤ 12 words, one idea, reading grade ≤ 8),
  show (one visual change, verb phrase),
  hear { music: section, sfx: [{ name, at }] },
  because (sentence; starts with the hinge word the host uses),
  claimId? (required on proof), plant? (hook), returns? (callback; equals plant),
  proofMark? (what on screen proves a claim), severedMark? (what carries the idea with captions off)
} ] }
auditWording(sheet, vocab) → { pass, detail, fails[] }         // pure, no DOM
```
**Self-test predicates**
1. Grammar order: hook first, landing last, exactly one breather not at index 0/1/last, every claim followed by ≥ 1 proof with `claimId` pointing back.
2. `plant` set ⇒ some callback/landing `returns === plant`.
3. `say` ≤ 12 words; blurbs ≤ 14; Flesch-Kincaid grade of `say + show` ≤ 8.
4. Banned jargon list (host-supplied) appears only inside parentheses; no gate ids, rung numbers, palette numbers, Greek letters in user copy.
5. Landing `show` echoes the hook `show` (host regex).
6. Additive: existing beat fields untouched (key-set diff).

**Lens seeds.** A "plain verbs, one idea per beat" · B "question-led hook, proof-heavy middle" · C "one metaphor planted in the hook, returned in the callback".

**Tie-breaks.** Grammar order and grade are contract; shorter `say` wins a tie; a proof without a claim is dropped, never promoted.

---

## transitions

**Contract stub**
```
TRANS.transitionFor(fromBeat, toBeat, tokens) → { kind ∈ cut|wipe|split|iris|iris-back|wipe-back, semantic: string, t0, t1, focus?: {x,y} }
TRANS.mask(kind, u ∈ [0,1], focus, w, h) → path commands          // closed-form in u; no accumulated state
TRANS.table → { relation → kind }                                   // hook, cause→effect, contrast, zoom-in, breather, callback, landing
```
**Self-test predicates**
1. Every transition has a non-empty `semantic` sentence ≤ 14 words that names the relation (why this mask, not decoration).
2. breather → `cut`; callback → the reverse of the hook's kind; landing → closing kind.
3. `mask(kind, u)` deep-equal on repeated calls; monotone coverage in `u`.
4. `t1 − t0` within `tokens.motion.feels[feel]` bounds when the feel declares a duration; never overlaps two transitions.
5. Text: no RNG/clock tokens, no literal easing numbers outside `tokens.motion`.

**Lens seeds.** A "reading-order wipes" · B "mask follows the focus point" · C "cuts only, meaning carried by hold length".

---

## typography

**Contract stub**
```
TYPE.layout(say, tokens.type, box{w,h}, t, beat, seed) → { glyphs: [{ch, x, y, op, draw}], tracking, clockAt(wordIdx) → t, role: 'display'|'body'|'mono' }
TYPE.measure(text, role) → width            // ctx.measureText when available, declared fallback otherwise
TYPE.scaleStep(n) → px                       // from tokens.type.scale only
```
**Self-test predicates**
1. One clock per beat: `clockAt` monotone in word index; all glyph timings derive from it.
2. Every font reference is a `tokens.type.<role>` lookup (text grep: no quoted family names).
3. Sizes come from `scaleStep`; no raw px size literals outside the scale.
4. Layout fits `box` for the longest `say` in the proof set (no overflow).
5. Deterministic for `(say, t, seed)`; reduced-motion → fully drawn glyphs at any `t`.

**Lens seeds.** A "letter draw-on, tracking tightens on the feel curve" · B "word landing, whole-word reveal" · C "static set, only weight/opacity move".

---

## data-viz

**Contract stub**
```
VIZ.chart(spec{ kind, series[], unit, label }, tokens, t, seed) → { marks: [{ kind, role, x, y, w, h, op }], axes, counterAt(t) → number, highlight?: markIdx }
VIZ.kinds = ['bar', 'line', 'counter', 'dot']
```
**Self-test predicates**
1. Every mark `role ∈ tokens.color` roles; `audit` returns `offPalette: []`.
2. `counterAt(t)` monotone (or piecewise monotone per spec) and deterministic.
3. ≤ 1 `highlight` per frame; highlight uses `tokens.color.highlight`.
4. Same `(spec, seed, t)` → identical marks; different `seed` only changes jitter the spec allows.
5. Axes labels pass the wording grade and jargon predicates.

**Lens seeds.** A "one number, big" · B "comparison bars with one highlighted" · C "line that draws on with the clock".

---

## Choosing N and lanes per round

- New lane for this host → N = 3; known lane (a previous round shipped it) → N = 2.
- Run lanes that share no files in parallel; lanes that both touch the storyboard schema (wording, transitions) are still parallel at candidate stage and serialised only at the integrator.
- A round with > 4 lanes needs 2 integrators (split by host file), each with its own ordered steps and test runs; never two integrators on the same file.
