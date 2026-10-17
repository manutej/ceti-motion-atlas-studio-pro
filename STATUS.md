# STATUS — CETI Motion Atlas Studio Pro (`v6.0.0` Locked)

**Last Updated:** 2026-10-16  
**Workspace:** `/Users/cairo/Documents/CETI/ACCENTURE/content-factory v2/ARTE/motion-atlas/`  
**Public Repository:** `https://github.com/manutej/ceti-motion-atlas-studio-pro`  
**Current Version:** `v6.0.0` (6 Adversarial MOE + VBM Visual/UX Rounds Complete · `21/21 Gates PASS` · `5/5 Negative Mutation Selftests CAUGHT`)

---

## 1. Live Studio Endpoints, VBM Recordings & Deliverables

| Deliverable | Path / URL | Status |
|---|---|---|
| **Public GitHub Repository** | `https://github.com/manutej/ceti-motion-atlas-studio-pro` | **PUBLIC (`v6.0.0`)** |
| **Live Local Studio & OAuth 2.0 PKCE Server** | `http://127.0.0.1:43110/` (served by [`scripts/oauth-bridge-server.mjs`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/scripts/oauth-bridge-server.mjs)) | **ONLINE** |
| **Standalone Single-File Studio (Downloads)** | [`/Users/cairo/Downloads/CETI Motion Atlas Studio Pro.html`](file:///Users/cairo/Downloads/CETI%20Motion%20Atlas%20Studio%20Pro.html) (`457,599 bytes`) | **LOCKED (`v6`)** |
| **Standalone Single-File Studio (Workspace)** | [`ARTE/motion-atlas/Motion Atlas Studio Pro — Standalone.html`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/Motion%20Atlas%20Studio%20Pro%20%E2%80%94%20Standalone.html) (`457,599 bytes`) | **LOCKED (`v6`)** |
| **VBM `@2x` Walkthrough Video (`MP4` + `GIF`)** | [`recordings/v6-final-walkthrough.mp4`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/recordings/v6-final-walkthrough.mp4) & [`recordings/v6-final-walkthrough.gif`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/recordings/v6-final-walkthrough.gif) | **CAPTURED (`v6-final`)** |
| **VBM `@2x` Screenshot Suite (`v4-baseline` vs `v6-final`)** | [`recordings/screenshots/v4-baseline/`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/recordings/screenshots/v4-baseline/) vs [`recordings/screenshots/v6-final/`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/recordings/screenshots/v6-final/) (`12` surfaces/modals each) | **VERIFIED (`136px` shell, `0` overlaps)** |
| **VBM Automated CDP Walkthrough Recorder** | [`ARTE/motion-atlas/scripts/vbm-walkthrough-recorder.mjs`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/scripts/vbm-walkthrough-recorder.mjs) | **LOCKED (`v6`)** |
| **21-Gate Mechanical Validator + Selftest** | [`ARTE/motion-atlas/scripts/validate-motion-studio.mjs`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/scripts/validate-motion-studio.mjs) | **`21/21 PASS` + `5/5 SELFTEST`** |
| **Typed Contract, Meta-Plan & RSI Ledger** | [`docs/TYPED-CONTRACT-MOTION-ATLAS.md`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/docs/TYPED-CONTRACT-MOTION-ATLAS.md) · [`docs/META-PLAN-AND-RSI.md`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/docs/META-PLAN-AND-RSI.md) · [`docs/RSI-LEDGER.md`](file:///Users/cairo/Documents/CETI/ACCENTURE/content-factory%20v2/ARTE/motion-atlas/docs/RSI-LEDGER.md) | **COMPLETE (`v1 → v6`)** |

---

## 2. Verification & VBM Recording Commands

```bash
cd "/Users/cairo/Documents/CETI/ACCENTURE/content-factory v2/ARTE/motion-atlas"
npm run build
npm test
npm run vbm
```
