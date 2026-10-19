# AUDIT v8.0.0 — CETI Motion Atlas Studio Pro (prep for v9 "Fable Soup")

Date 2026-10-19. Baseline verified: `npm test` → 29/29 gates PASS, 10/10 mutations CAUGHT. All line numbers below are from the v8 files as cloned. "[inferred]" marks anything not directly read in code.

---

## A. ARCHITECTURE MAP

**Load order** (`Motion Atlas Studio Pro.dc.html` L728–734; identical `index.html`): `geome-wada.js` → `studio-motion-engine.js` → `studio-canvas-oauth.js` → `studio-ui.js`. Plain `<script>` tags, no modules, no CDN JS (only Google Fonts CSS L7–9). Each file is an IIFE writing globals: `STUDIO_WADA_ENGINE` (engine L425), `STUDIO_CHARACTER_FOUNDRY` (L436), `STUDIO_ATLAS_TAXONOMY` (L733), `_MA_INTERNAL` (L1728), `MA` (L3037), `STUDIO_CANVAS_OAUTH` (canvas-oauth L2305), `MotionAtlasStudioApp` (ui L406); `bootStudio()` at ui L2458 runs on DOMContentLoaded.

**Flow of a storyboard beat: spec → render → compile → export**

1. **Story spec** — `STORIES[]` in engine L469–606: each story has `beats: [[tSec, label, action], ...]` (8 rows), `styles`, `elements`. `EL_DEMO` map L619–640 binds element names to proof keys (`'Music bed on a beat grid': 'e_beat'`, `'Sound effect per action': 'e_sfx'`).
2. **Beat schema** — `buildStoryboardSheet(opts)` canvas-oauth L73–156 expands any story into exactly 8 beats with fixed arrays: `roles` L86 (`hook, threshold, escalation, turn, filter, breather, climax, callback`), `hinges` L88 (THEREFORE/BUT pattern), `cams` L89. Beat object L118–142: `{index, id, tStartSec, tEndSec, tMidSec, role, hinge, label, visualAction, captionOnScreen, cameraMove, activeSimultaneousMoves, wadaFocusRole, characterPose{x,y,rot,scale,fin,fluke,streak,rung}}`. Optional per-beat `palId` (ui L953). `auditStoryboardSheet` L158–181 computes `audit{coveredOk, movementOk, oneBreather, callback, allPassed}`. `moveStoryboardBeat` L778–810 reorders and re-stamps `tStartSec`/hinges.
3. **Timeline clock** — `MotionAtlasStudioApp.tick(now)` ui L190–203: `this._T += dt * speed` from rAF (`dt` clamped 0.08 s). Seek: `#global-scrub` range input L525 / L1652–1655 (`self._T = Number(value)`), `scrub-to-beat` action L2140–2144, `[`/`]` keys L290–294. Display modulo 12 s. `drawAllCanvases()` L205–243 iterates every `canvas[data-proof]`, reads `data-fixed-t` (storyboard cards pass `b.tMidSec`, L967), `data-cam`, `data-beat-idx`, `data-pal-id`, and calls `MA.render(canvas, key, pal, feel, tVal, opts)`.
4. **Feels/easing** — `bez()` engine L805, `glaser`/`rest` L818, `spring` L819. `FEELS` L2957–2966 (`{id,label,ease,warp(t),note,brief}`), `FEEL_ORDER` L2967. `warp` quantises/scales t (held 12 fps, beat 120 BPM 0.5 s grid, saul 8 fps, rostrum 10 fps).
5. **Render** — `render(el, key, pal, F, T, opts)` L2669–2797: `prep(pal)` L830 → `setTransform` to 480×300 logical (`LW/LH` L756) → cached bg `getBg` L2644 → camera transform L2704–2718 → onion ghosts L2721–2755 → `pr.draw(ctx, t, P, easeObj, bg)` L2757 → viewfinder/beat badge L2769–2780 → grain+vignette L2783–2793. `PROOFS` table L1768–2640 (styles `s_*`, elements `e_*`, interactions `ix_*`), each `{L, draw, bg?, ownBg?, noFinish?, guide?}`. Archetype geometry: `actorGeom(spec, opts)` L1006–1295, `renderActor` L1446–1667, `renderReductionRung` L1321, `whale()` shim L1671 (calls `renderActor` with `getCharSpec(o.charId)`). `drawDirect` L3017 is the headless entry (`MA.draw(key, ctx, t, pal, opts)`) used by G06.
6. **Sonification** — see §B. `computeWadaHarmonicChord` L2834–2901, `playWadaHarmonicChord` L2903–2935, `_audioCtx` L2833.
7. **Vocab library** — `VOCAB_LIBRARY` canvas-oauth L970–1431 (entries `{token, slashToken, category, title, plainEnglish, jargonTerm, promptSnippet, patch}`); `DEFAULT_SAVED_SCHEMES` L814–894; `getFullVocabLibrary` L1433, `searchVocabLibrary` L1472, `parsePromptTokens` L1494.
8. **Compile** — `compileStage1Brief` L1939; `compileCodeScaffold(state, target)` L1973–2189: `remotion` L1980–2000 (TSX stub, `t = frame/fps`), `animejs` L2002–2018 (`createTimeline` + one `tl.add` per beat, `seek(tSec)`), `svg-keyframes` L2020–2055 (`actorGeom` body at ph 0/π → `<animate attributeName="d">`), `lottie-json` L2057–2164 (v5.7.4, position keyframes at `b.tStartSec*24`), default `hyperframes` L2166–2188 (inlines `WADA_PALETTE`, `CHARACTER_SPEC`, `BEATS`, exposes `window.seek(tSec)` that calls `window.MA.render`). `compilePlayableHTML5` L2192–2205 wraps hyperframes in a page — **it does not inline MA**, so `window.MA` is undefined in the export unless the host supplies it [verified: no script src for engine in L2196–2204].
9. **Export/persist** — `saveSessionState` L2211 (IndexedDB `ceti_motion_atlas_studio_v1`), `loadSessionState` L2233. Live gate HUD `run16GateAudit` L2246–2303 (29 entries).

---

## B. MUSIC

**What exists now (verified):**
- **One** audio path: `playWadaHarmonicChord` (engine L2903), fired only by the `sonify-wada-chord` action (ui L2119–2123) from header `♪ SONIFY` (L527) and Wada surface `♪ Play Wada Chord` (L1166). 1.35 s one-shot. **Nothing is scheduled per beat, loops, or follows the timeline.**
- Scale: `rootTable` L2843 (C3–C4 roots by `wadaIdx % 8`), `jiRatios` L2849 (1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2). Voice ratio index L2866 = `(idx*2 + round(dOklab/12)) % 8` — a colour-distance-driven subset of the JI set, not a chord grammar; 9/8 + 15/8 clusters are common.
- Voices: 4 oscillators, `sine`/`triangle` (`waveformsByRung` L2855), gain `0.18/sqrt(idx+1)` L2884, 50 ms stagger, 80 ms attack, single exponential decay; no sustain, filter, reverb, or **master gain** (each gain → `destination`, L2923).
- "Vibrato" L2870 is a static ±0.4 % offset baked into `freqHz`, not an LFO.
- `_audioCtx` created lazily on click (L2909) and resumed (L2910) — autoplay-safe only because click-driven.
- `e_sfx` (L2497–2508) and `e_beat` (L2486–2496) are **visual-only proofs**. `e_sfx` draws a cue strip from the hard-coded `cues = [[0.62,'WHOOSH',0.3],[1.42,'THUD',0.45],[2.0,'CLICK',0.08],[2.4,'BOOP',0.2],[2.8,'BOING',0.8],[3.4,'THUD',0.25]]` (L2502); `e_beat` prints "120 BPM · KICK EVERY BEAT · VISUAL ONLY" (L2494). **No WebAudio SFX are synthesised anywhere.** The brief's "SFX are good — keep them" must refer to the visual cue vocabulary (names, timing, gain-as-height) [inferred].

**Why it sounds bad (specific):**
1. Static drone: four fixed-pitch oscillators for 1.35 s; no harmonic rhythm, voice-leading or chord change.
2. No dynamics: one exponential decay; no sustain/release, velocity or accent.
3. Intervals chosen by colour distance, so dissonant pairs (9/8 vs 1, 15/8 vs 2/1) are common and never resolve.
4. Pure sine/triangle, no filter → thin test-tone timbre; low roots (130–262 Hz) at gain 0.18 stacked = muddy.
5. No master bus or limiter → summed voices can clip.
6. Not timeline-aware (ignores beats, feels, `_T`); not seekable; cannot duck under SFX because no SFX audio exists.

**Integration seam for `studio-music-engine.js`** (load between engine and canvas-oauth, or after ui — see §F):

Minimum API (global `MUSIC`), all pure functions of `(beat, palette, feel, seed, t)`:
```
MUSIC.plan(sheet, pal, feel, seed) → Score
   { bpm, key:{root, mode}, bars[], cues:[Cue...], sfx:[SfxEvent...] }
MUSIC.scoreForBeat(beat, pal, feel, seed) → Cue
   { tStart, tEnd, mood, chordProgression[], density, register, accent }
MUSIC.schedule(ctx, score, t0, opts) → ScheduleHandle   // schedules from timeline t0 forward
MUSIC.seek(t)            // cancel + reschedule from t (must be idempotent)
MUSIC.stop()
MUSIC.duck(sfxEvent)     // sidechain: ramp music bus gain down/up around sfxEvent.t
MUSIC.sfx(name, t, gain) // synthesises WHOOSH/THUD/CLICK/BOOP/BOING deterministically
MUSIC.mix → { master: GainNode, music: GainNode, sfx: GainNode, duck: GainNode }
```
Hook points in existing code: `tick()` (ui L190) should call `MUSIC.sync(this._T, this.state.playing)`; scrub paths (L1655, L2142, L290–294) call `MUSIC.seek(T)`; `setState` with storyboard/pal/feel changes (L140–151) calls `MUSIC.plan(...)`. Palette→key: reuse `rootTable`/`wadaIdx` L2842–2846; feel→tempo: `beat`=120 BPM (L2963), `saul`=8 fps grid, `held`=12 fps, `slow`=half-time. **SFX event hook names to duck under**: the `e_sfx` cue names `WHOOSH, THUD, CLICK, BOOP, BOING` (L2502) and the implicit per-beat events in the beat schema: `hinge` change at `tStartSec`, `cameraMove === 'kick-shake'` (climax hit), `breather-hold` (music thins), `callback` (restate theme). Keep G24's `computeWadaHarmonicChord` intact (gate reads `voices.length === 4` and 80–2400 Hz, validator L583–601) — the new engine can consume its `voices[].freqHz` as the pad's pitch set but must re-voice them.

---

## C. VISUALS — where two.js slots in

- **Render-loop contract**: `MA.render(el, key, pal, F, T, opts)` (engine L2669) and `pr.draw(ctx, t, P, easeObj, bg)` (L2757). `t` is already warped and wrapped `% pr.L`. Everything is **Canvas2D on a 480×300 logical space** scaled by `setTransform` (L2693). G06 (validator L250–268) calls `MA.draw(key, mockCtx, 2.1, pal, {charId})` with a **mock context** (L37–85) and counts ops > 5 — any two.js code must either be skipped when `ctx.canvas` is a mock (no `document`) or take a separate path, otherwise G06 will fail under node.
- **Compositing**: single canvas, `source-over`, cached background canvases (`getBg` L2644, keyed `key|pal|char|ground|rung`) and a `multiply` grain pass. A two.js layer fits as **(a)** a sibling `<canvas>`/`<svg>` positioned over each `canvas[data-proof]` (`.sb-card { position: relative }` L439/L482) driven by the same `tVal`, or **(b)** an offscreen `Two({type: Two.Types.canvas})` whose `renderer.domElement` is `drawImage`d into the main ctx inside `render()` before the grain pass. (b) keeps grain/vignette unity and G06 determinism if the scene is rebuilt from `t` each frame (no `two.play()`; call `two.update()` manually). (a) is simpler but loses the multiply grain look.
- **Surfaces/compilers**: best fit is Surface IV storyboard cards (ui L946–1020), Surface I DAG card previews (L555), Surface VI contact sheet (L1196). Compiler targets: `svg-keyframes` (canvas-oauth L2020) is the natural export for two.js SVG output (`Two.Types.svg` renderer → serialise `two.renderer.domElement`); `hyperframes` scaffold (L2166) already exposes `window.seek(t)`, add `MUSIC`/two.js init inside it.
- **Standalone inlining path**: `scripts/build-package.mjs` L31–35 replaces four literal `<script src="./x.js">` strings with inline bodies. Adding two.js and the music engine means: (1) add `<script src="./vendor/two.min.js">` + `<script src="./studio-music-engine.js">` to the `.dc.html` and `index.html`; (2) add matching `.replace()` lines and `fs.readFileSync` calls; (3) add the files to the dist copy list L43. Standalone is currently 580,339 B; two.js 0.8.17 min is ~150 KB [inferred, not measured] → ~730 KB. G16 (validator L409–428) only checks file existence, so new files should be appended to that list. The validator loads files via `vm.runInContext` in the order of `filesToLoad` L137–142 — any new JS must be added there too or `MUSIC`/`Two` will be undefined in gates.

---

## D. WORDING / STORYBOARD / MESSAGING

**Jargon-heavy user-facing strings (verified):**
- Header/eyebrows (ui): "CETI INTERNAL DESIGN & NARRATIVE STUDIO" L471; "STAGE-4 / STAGE-5 STORYBOARD BEAT SHEET … (GATE G08 · G26)" L993; "UNIVERSAL PARAMETRIC ACTOR SOCKET · ZERO HARDCODED MASCOTS (GATE G03 · G04 · G05)" L893; "SOURCE A CARD INSPECTOR · SHEAF PACKET" L696; "ORPHEUM 4-VOICE JUST-INTONATION HARMONIC SYNTHESIZER (GATE G24 · ROOT …)" L1165; "RFC 7636 OAUTH 2.0 PKCE (S256) + LOCAL AGENT BRIDGE + # / SKILL VOCABULARY SYNTHESIZER (G10 · G11 · G27 · G28)" L1329; "29 BINARY CONSERVATION GATES + TELL-APART + SHEAF + FREEFORM STUDIO ERGONOMICS" L1475.
- Gate HUD names (canvas-oauth L2265–2293): "Alexandrov Sheaf Cohomology δ⁰ = 0", "Alexandrov Sheaf Pushout Synthesis (A ⊕ B Gluing)", "Typed Contract Schema Guard", "Orpheum Harmonic WebAudio Sonification (OKLab → Hz)", "VBM Visual & UX Ergonomics (0 Overlaps · 136px Header)". Modal badges L1481–1482: "TELL-APART KERNEL: min Δ=…", "ALEXANDROV SHEAF δ⁰=0".
- Storyboard badges L1011–1014: "CoveredOk (Visual-Only Legible)", "MovementOk (BUT/THEREFORE Hinges)", "OneBreather (Negative-Space Hold)", "Callback (Beat 8 Echoes Beat 1)". Beat select L963–964 shows "THEREFORE · HOOK"; footer "MOVES: 1/2" L984; "CAM: dutch-tilt" L981.
- Canvas captions in proofs: "SEEDED · ANALYTIC · TWO DEPTH PASSES" L2456, "SMEAR GHOSTS 1/48 · 2/48 S · SURPRISE EYE 1.45" L2560, "KARMAN VORTEX STREET · REYNOLDS WAKE COUPLED TO FLUKE PHASE" L2638, "ONION-SKIN · -2Δt / -1Δt / +1Δt" L2765.
- Story beat text (engine L474–483): "caudal fluke leaves a saturated multiply brushstroke", "3 acoustic Wada rings radiate as harmonic streaks ignite along the spine" — anatomical, not audience-facing.
- Vocab `plainEnglish` (canvas-oauth L977–1425) mostly good; weak: `#theme/nautical-radar` L997, `#element/spotlight-circle` L1139 (lowercase start); `jargonTerm` fields leak into the modal.
- DAG card copy (screenshot 01): "p_99a75970 ← p_root0000", "†C0 · Verified section along committed spine", "SHEAF ρ: δ⁰=0 PASS".

**Current beat grammar (G11 predicates)** — `validateEnhancementResponse` L1571–1600: `requestId` string, `summary` string, `suggestedWadaComboNo ∈ [1,348]`, `enhancedBeats.length ≥ 4`, each `hinge ∈ {BUT, THEREFORE}`, `visualAction.length ≥ 10`, `synthesizedCharacter` has `id,name,bodyProfile,reductionLadder[5]`. G08 (`auditStoryboardSheet`) adds `activeSimultaneousMoves ≤ 2`, a breather, and a last-beat callback regex (`/echo|calm|first|hold|frame 0/i` L171). The RSI fixer (L1884–1899) forces breather on index 5 and alternates hinges.

**Clearer storyboard grammar (proposal)** — keep `hinge` and `role` for backward compatibility; add fields:
```
beat.grammar : 'hook'|'claim'|'proof'|'breather'|'callback'|'landing'   // required, ordered
beat.say     : string ≤ 9 words, plain English, no gate IDs           // what the viewer should think
beat.show    : string ≤ 14 words, concrete visual verb                 // what the eye sees
beat.hear    : { mood, intensity 0..1, sfx?: [{name, tOffset, gain}] } // music/SFX intent
beat.because : string | null   // explicit causal link to previous beat (replaces raw BUT/THEREFORE in UI)
beat.readingLevel : number     // Flesch-Kincaid grade target ≤ 8 for say/show
```
Rules: exactly one `hook` first and one `landing` last; ≥1 `proof` after each `claim`; one `breather` not adjacent to `hook`/`landing`; `callback` must reference `beats[0].say` token overlap ≥ 1 word. Storyboard UI should display `say` as the card title and `show` as the body, with the hinge rendered as a sentence ("…and because of that, …").

---

## E. GATES

**Gate pattern** (validator): compute values → `recordGate(id, name, passBoolean, detailString)` (L157–159). Gates run sequentially in `runAllGates()`; summary L715–728 exits 1 on any fail. Mutation pattern (L731–883): build a corrupted input, call the real function, push `{id, desc, caught}` into `mutResults`; selftest exits 1 unless all `caught`. The live HUD `run16GateAudit` (canvas-oauth L2264–2294) must get a parallel entry or the header "Audit 29/29" count will diverge from `npm test`.

**Template for G30–G33** (add after G29, before summary; add to `filesToLoad` L137 any new JS):
```js
// G30: Adaptive Procedural Music Score (deterministic, seekable, ducks under SFX)
const MUSIC = sandbox.MUSIC;
const sheetM = CO.buildStoryboardSheet({ storyKey: 's_voice', charId: 'ceti-whale', palId: 343 });
const scoreA = MUSIC.plan(sheetM, WADA.enrichPalette(WADA.PALS[0], 'atlas'), MA.FEELS.beat, 7);
const scoreB = MUSIC.plan(sheetM, WADA.enrichPalette(WADA.PALS[0], 'atlas'), MA.FEELS.beat, 7);
const g30Pass = JSON.stringify(scoreA) === JSON.stringify(scoreB)           // determinism
  && scoreA.cues.length === 8 && scoreA.bpm === 120                         // one cue per beat, feel→tempo
  && scoreA.cues.some(c => c.mood === 'breather') && scoreA.sfx.length >= 1
  && typeof MUSIC.duck === 'function' && typeof MUSIC.seek === 'function';
recordGate('G30', 'Adaptive Procedural Music Score', g30Pass, `bpm=${scoreA.bpm} key=${scoreA.key.root} cues=${scoreA.cues.length}`);
// MUT-11: plan() with Math.random patched to throw must still succeed; seeds 7 vs 8 must differ.

// G31: two.js Layer Determinism (frame = f(t), no play loop)
const twoSrc = fs.readFileSync(path.join(ROOT, 'studio-two-layer.js'), 'utf8');
const g31Pass = typeof sandbox.Two === 'function' && !/two\.play\(|requestAnimationFrame/.test(twoSrc)
  && MA.twoLayer && MA.twoLayer.snapshot('s_voice', 2.1, 7) === MA.twoLayer.snapshot('s_voice', 2.1, 7);
// MUT-12: inject `two.play()` string into a copy → regex must flag it.

// G32: Storyboard Grammar (hook/claim/proof/breather/callback/landing)
const gram = CO.auditStoryboardGrammar(sheetM);   // new fn
const g32Pass = gram.valid && sheetM.beats[0].grammar === 'hook' && sheetM.beats[7].grammar === 'landing';
// MUT-13: set beats[0].grammar='landing' → auditStoryboardGrammar().valid === false and RSI fix repairs it.

// G33: Wording Clarity (no gate IDs / Greek / hashes in user-facing say/show; grade ≤ 8)
const g33Pass = sheetM.beats.every(b => !/G\d\d|δ|ρ|Alexandrov|cohomology|OKLab/.test(b.say + b.show)
  && CO.readingGrade(b.say) <= 8);
// MUT-14: set beats[2].say = 'Alexandrov sheaf δ⁰ cohomology G18' → must fail.
```
Each mutation follows MUT-04's shape (L771–788): mutate → call real validator/fixer → assert `caught`.

---

## F. RISK LIST (top 8)

1. **Validator VM has no `Two`/`AudioContext`/`document.createElementNS`** (sandbox L89–131): two.js SVG/canvas renderers and any `new AudioContext()` at load time will throw inside `vm.runInContext` and fail G16. Guard every constructor behind `typeof window.AudioContext` / `typeof document.createElementNS`.
2. **G06 mock context**: two.js canvas renderer expects a real `CanvasRenderingContext2D`; drawing its domElement with `ctx.drawImage` on the mock is a no-op (fine), but constructing the Two instance with the mock canvas is not. Skip the layer when `!el.ownerDocument` [inferred].
3. **Autoplay policy**: `_audioCtx` is created only on click (L2909). A per-beat score started from `tick()` without a prior user gesture will stay `suspended`; music must attach `resume()` to the first `pointerdown`/`keydown` and show a muted-state indicator.
4. **Scheduling vs. seek**: `_T` jumps on scrub (L1655, L2142), `[`/`]` keys, and `speed` changes; music scheduled ahead on `ctx.currentTime` will drift. Need a lookahead scheduler keyed to `_T` with cancel-and-reschedule on every discontinuity; and `warp(t)` feels (held/saul/rostrum) quantise visual t but must not quantise audio t.
5. **Bundle size and inlining**: build-package.mjs uses literal `.replace()` strings (L32–35); a missing/renamed script tag silently leaves an external `src` in the Standalone (zero-dependency promise broken). Add an assertion that no `<script src=` remains after replacement.
6. **Globals and load order**: `studio-ui.js` captures `MA`, `CO` at IIFE time (L1031–1035). A music/two.js engine must load before `studio-ui.js`; if it depends on `MA.FEELS` it must load after the engine. Also `filesToLoad` L137 and the dist copy list L43 must both be updated.
7. **G24/G08/G21 coupling**: G24 asserts exactly 4 voices and `80–2400 Hz`; G08/G21 assert 8 unique labels and `allPassed`; G26 asserts beat 1 `tStartSec === 1.5` after a swap. New grammar fields must be additive, and the RSI fixer (L1884–1899) must not overwrite them.
8. **`compilePlayableHTML5` already ships without `MA`** (L2192–2205); adding music/two.js compounds the broken export. Inline engine + vendor or document the host requirement. Note `Math.random`/`Date.now` exist in canvas-oauth L1547/L1700/L1799 (OAuth only); any determinism lint must whitelist them.
