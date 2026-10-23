# STATUS — CETI Motion Atlas Studio Pro (`v9.3.0` · SCENE (show = drawn, character kept) + MIX (one limiter, loudness and pause floor in band) · 40/40 + 22/22 · over-bed +3.6 dB still waived)

**Last Updated:** 2026-10-23  
**Workspace:** `/Users/cairo/Documents/CETI/ACCENTURE/content-factory v2/ARTE/motion-atlas/`  
**Public Repository:** `https://github.com/manutej/ceti-motion-atlas-studio-pro`  
**Current Version:** `v9.3.0` (see `work/FIX-NOTES-v9.3.md`; earlier: `v9.2.0`, `work/FIX-NOTES-v9.2.md`; branch `v9-fable-soup`)  

---

## Round 9 (`v9.0.0`) — Fable model soup

Independent candidates per lane (music A/B, two.js A/B, wording) were merged under the typed contract; nothing was accepted on one agent's say-so. Merge logs: `work/music/MERGE-NOTES.md`, `work/two/MERGE-NOTES.md`, `work/wording/`.

| What changed | Gate | Where |
|---|---|---|
| Adaptive WebAudio score (harmonic bed + leitmotif, −6 dB duck under every SFX, seekable lookahead scheduler); `♪ Music` toggle + `key · bpm · section` readout; `♪ SONIFY` now fires the CHORD stab through the mix (old `playWadaHarmonicChord` kept for G24) | **G30** · MUT-11 | `studio-music-engine.js`, `studio-ui.js` (tick / scrub / replan hooks) |
| two.js vector stage layer (back pass: parallax, ribbons, cutouts · front pass: spotlight, diagram, counter, kinetic `say`, end card); offscreen, rebuilt from t, no play loop; no-op without `Two`; `✦ Vector layer` toggle on storyboard cards | **G31** · MUT-12 | `vendor/two.min.js`, `studio-two-renderer.js`, `MA.render` in `studio-motion-engine.js` |
| Storyboard grammar hook → claim → proof → breather → callback → landing; additive beat fields `grammar, claimId, say, show, hear, because, plant, returns, readingLevel`; two example boards (MCP server, planning fallacy) in Surface IV; `say` = caption, `because` = MovementOk tag, `hear` drives the score | **G32** · MUT-13 | `studio-canvas-oauth.js` (`V9_STORYBOARDS`, `auditStoryboardGrammar`), `studio-ui.js` |
| Plain-language wording: 51 vocab entries rewritten (2 near-duplicate pairs merged), UI copy for header/tabs/storyboard/modals, HUD gates carry `plainName` (tooltip `id · plainName`) | **G33** · MUT-14 | `studio-canvas-oauth.js` (`auditWordingClarity`), `studio-ui.js` |
| Standalone inlines two.js (MIT header kept) → TWO_LAYER → MUSIC; build asserts zero `<script src=` | G16 | `scripts/build-package.mjs` |

**Score:** `npm test` = **33/33 gates PASS · 14/14 mutations CAUGHT**. Standalone 580,339 → 866,352 B.

---

## 1. Live Studio Endpoints, VBM Recordings & Deliverables

| Deliverable | Path / URL | Status |
|---|---|---|
| **Public GitHub Repository** | `https://github.com/manutej/ceti-motion-atlas-studio-pro` | **PUBLIC (`v8.0.0`)** |
| **Live Local Studio & OAuth 2.0 PKCE Server** | `http://127.0.0.1:43110/` (served by [`scripts/oauth-bridge-server.mjs`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/scripts/oauth-bridge-server.mjs)) | **ONLINE** |
| **Standalone Single-File Studio (Downloads)** | [`/Users/cairo/Downloads/CETI Motion Atlas Studio Pro.html`](file:///Users/cairo/Downloads/CETI%20Motion%20Atlas%20Studio%20Pro.html) (`556 KB`) | **LOCKED (`v8`)** |
| **Standalone Single-File Studio (Workspace)** | [`ARTE/motion-atlas/Motion Atlas Studio Pro — Standalone.html`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/Motion%20Atlas%20Studio%20Pro%20%E2%80%94%20Standalone.html) (`556 KB`) | **LOCKED (`v8`)** |
| **VBM `@2x` Walkthrough Video (`MP4` + `GIF`)** | [`recordings/v8-final-walkthrough.mp4`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/recordings/v8-final-walkthrough.mp4) & [`recordings/v8-final-walkthrough.gif`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/recordings/v8-final-walkthrough.gif) | **CAPTURED (`v8-final`)** |
| **VBM `@2x` Screenshot Progression (`v4-baseline` → `v6-final` → `v7-final` → `v8-final`)** | [`recordings/screenshots/v8-final/`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/recordings/screenshots/v8-final/) (`13` surfaces/modals at `@2x` Retina) | **VERIFIED (`136px` shell, `0` overlaps, `0` clips)** |
| **VBM Automated CDP Walkthrough Recorder** | [`ARTE/motion-atlas/scripts/vbm-walkthrough-recorder.mjs`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/scripts/vbm-walkthrough-recorder.mjs) | **LOCKED (`v8`)** |
| **29-Gate Mechanical Validator + Selftest** | [`ARTE/motion-atlas/scripts/validate-motion-studio.mjs`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/scripts/validate-motion-studio.mjs) | **`29/29 PASS` + `10/10 SELFTEST`** |
| **Typed Contract, Meta-Plan & RSI Ledger** | [`docs/TYPED-CONTRACT-MOTION-ATLAS.md`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/docs/TYPED-CONTRACT-MOTION-ATLAS.md) · [`docs/META-PLAN-AND-RSI.md`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/docs/META-PLAN-AND-RSI.md) · [`docs/RSI-LEDGER.md`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/docs/RSI-LEDGER.md) | **COMPLETE (`v1 → v8`)** |

---

## 2. Verification & VBM Recording Commands

```bash
cd "/Users/cairo/Documents/CETI/ACCENTURE/content-factory v2/ARTE/motion-atlas"
npm run build
npm test
npm run vbm
```
