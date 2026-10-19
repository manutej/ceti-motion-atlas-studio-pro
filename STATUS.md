# STATUS — CETI Motion Atlas Studio Pro (`v8.0.0` Locked)

**Last Updated:** 2026-10-17  
**Workspace:** `<workspace>/ARTE/motion-atlas/`  
**Public Repository:** `https://github.com/manutej/ceti-motion-atlas-studio-pro`  
**Current Version:** `v8.0.0` (8 Adversarial MOE + VBM Visual/UX & Studio Ergonomics Rounds Complete · `29/29 Gates PASS` · `10/10 Negative Mutation Selftests CAUGHT`)

---

## 1. Live Studio Endpoints, VBM Recordings & Deliverables

| Deliverable | Path / URL | Status |
|---|---|---|
| **Public GitHub Repository** | `https://github.com/manutej/ceti-motion-atlas-studio-pro` | **PUBLIC (`v8.0.0`)** |
| **Live Local Studio & OAuth 2.0 PKCE Server** | `http://127.0.0.1:43110/` (served by [`scripts/oauth-bridge-server.mjs`](file://WORKSPACE/ARTE/motion-atlas/scripts/oauth-bridge-server.mjs)) | **ONLINE** |
| **Standalone Single-File Studio (Downloads)** | [`~/Downloads/CETI Motion Atlas Studio Pro.html`](file://~/Downloads/CETI%20Motion%20Atlas%20Studio%20Pro.html) (`556 KB`) | **LOCKED (`v8`)** |
| **Standalone Single-File Studio (Workspace)** | [`ARTE/motion-atlas/Motion Atlas Studio Pro — Standalone.html`](file://WORKSPACE/ARTE/motion-atlas/Motion%20Atlas%20Studio%20Pro%20%E2%80%94%20Standalone.html) (`556 KB`) | **LOCKED (`v8`)** |
| **VBM `@2x` Walkthrough Video (`MP4` + `GIF`)** | [`recordings/v8-final-walkthrough.mp4`](file://WORKSPACE/ARTE/motion-atlas/recordings/v8-final-walkthrough.mp4) & [`recordings/v8-final-walkthrough.gif`](file://WORKSPACE/ARTE/motion-atlas/recordings/v8-final-walkthrough.gif) | **CAPTURED (`v8-final`)** |
| **VBM `@2x` Screenshot Progression (`v4-baseline` → `v6-final` → `v7-final` → `v8-final`)** | [`recordings/screenshots/v8-final/`](file://WORKSPACE/ARTE/motion-atlas/recordings/screenshots/v8-final/) (`13` surfaces/modals at `@2x` Retina) | **VERIFIED (`136px` shell, `0` overlaps, `0` clips)** |
| **VBM Automated CDP Walkthrough Recorder** | [`ARTE/motion-atlas/scripts/vbm-walkthrough-recorder.mjs`](file://WORKSPACE/ARTE/motion-atlas/scripts/vbm-walkthrough-recorder.mjs) | **LOCKED (`v8`)** |
| **29-Gate Mechanical Validator + Selftest** | [`ARTE/motion-atlas/scripts/validate-motion-studio.mjs`](file://WORKSPACE/ARTE/motion-atlas/scripts/validate-motion-studio.mjs) | **`29/29 PASS` + `10/10 SELFTEST`** |
| **Typed Contract, Meta-Plan & RSI Ledger** | [`docs/TYPED-CONTRACT-MOTION-ATLAS.md`](file://WORKSPACE/ARTE/motion-atlas/docs/TYPED-CONTRACT-MOTION-ATLAS.md) · [`docs/META-PLAN-AND-RSI.md`](file://WORKSPACE/ARTE/motion-atlas/docs/META-PLAN-AND-RSI.md) · [`docs/RSI-LEDGER.md`](file://WORKSPACE/ARTE/motion-atlas/docs/RSI-LEDGER.md) | **COMPLETE (`v1 → v8`)** |

---

## 2. Verification & VBM Recording Commands

```bash
cd "<workspace>/ARTE/motion-atlas"
npm run build
npm test
npm run vbm
```
