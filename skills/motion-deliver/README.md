# motion-deliver

The fourth skill of the motion set (motion-brief → motion-soup → motion-critique → motion-deliver). It produces
FILM-SPEC-9 item 9: the final MP4 and its loop check, next to the poster frame, contact sheet and README that
`scripts/deliver.mjs` makes.

| File | What it is |
|---|---|
| `SKILL.md` | The procedure: gate, render, verify, loop check, ladder |
| `scripts/render.mjs` | Deterministic MP4 from any seekable host page: frames seeked at n/fps and piped to ffmpeg, audio rendered offline by the host's engine, ffprobe verification, 3-frame check against stills.mjs, loop check |
| `scripts/deliverables-check.mjs` | Dependency-free FS-deliverables + FS-critique gate over a deliverables dir; `--allow-preview`, `--mark-render`, `--selftest` |
| `configs/motion-atlas.json` | Render config for this repo; extends `skills/motion-critique/configs/motion-atlas.json` |

Quick start (this repo):

```
export PW_MODULE=/opt/npm-tools/node_modules/playwright/index.js \
  CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
node skills/motion-deliver/scripts/render.mjs --config skills/motion-deliver/configs/motion-atlas.json \
  --param board=v9-mcp-server --allow-preview
node skills/motion-deliver/scripts/deliverables-check.mjs work/deliver/v9-mcp-server --allow-preview
node skills/motion-deliver/scripts/deliverables-check.mjs --selftest
```

Current state: round 3 has no observed critique row (the blind critic predicted a minimum of 5), so the repo carries
`work/deliver/v9-mcp-server/final-preview.mp4`, labelled "preview: critique not yet 8+". It has no `final.mp4` and
no `render` stage row.

Requires `/usr/bin/ffmpeg` and `/usr/bin/ffprobe` (or set `FFMPEG` and `FFPROBE`), plus Playwright with Chromium.
