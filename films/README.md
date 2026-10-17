# CETI motion films

This folder holds the source for the CETI motion films. Each frame is drawn by code: every film is a pure function `drawFrame(ctx, t)`, so the same commit always renders the same frames. Rendered videos are not kept in git. They are attached to [GitHub Releases](../../releases) and rebuilt from here.

| Film | Source | Build |
|---|---|---|
| Little whale v1 (SVG, Chromium) | `whale/lib.js`, `whale/film.html`, `whale/render.mjs` | see *Legacy SVG engine* |
| Little whale v2 (canvas, 2.5D water) | `whale/film2.js`, `whale/engine2.cjs` | `scripts/build.sh little-whale-v2` |
| Signal | `kh/signal/` | `scripts/build.sh signal` |
| Whale Line: the brief (v1, v2 in air) | `kh/lines/whaleline.js` + `kh/lines/stories/*.json` | `scripts/build.sh line kh/lines/stories/brief-v2.json` |
| Sea of data | `kh/sea/film.js` | `scripts/build.sh sea` |
| Composition v1 / v2 | `kh/composition/film.js`, `film2.js` | `scripts/build.sh composition` / `composition-v2` |
| Motion moodboard | `kh/board/board.cjs` | `node kh/board/board.cjs static out.png` |
| Character sheet | `kh/charsheet.cjs` | `node kh/charsheet.cjs out.png` |
| Atlas plates (dark and light) | `atlas/design/src/*.py` | `python3 atlas/design/src/hero.py` and so on |

## Setup

```bash
cd films
npm install                        # @napi-rs/canvas (skia). Chromium is only needed for the v1 SVG film
pip install -r requirements.txt    # numpy/scipy for scores; pillow/cairo for plates
ffmpeg -version                    # ffmpeg 6+ with libx264 on PATH
```

## Make a film

```bash
scripts/build.sh line kh/lines/stories/brief-v2.json      # -> renders/whale-line-brief-v2.mp4
```

The build runs these steps in order:

1. **Gates.** The build stops here, before rendering anything, if a gate fails.
2. **Cue sheet.** The film exports when each event happens.
3. **Score.** It is synthesised from those cues, so every sound lands on a drawn event.
4. **Render.** Two parallel workers pipe raw RGBA to x264 at 60 fps, with motion blur from the film's `shutter(t)`.
5. **Concat.**
6. **Loudness.** The mix is brought to −16 LUFS with a fixed gain plus a limiter, never with dynamic loudnorm.
7. **Mux.**
8. **Checks.** Frame count, true peak, and flash safety on the encoded file.

### A new Whale Line episode is a JSON file

Copy `kh/lines/stories/brief-v2.json` and change the words. Nothing else is required:

```json
{ "id": "my-episode", "title": "Say it in <i>one line</i>.", "medium": "air", "bpm": 128, "cycleBeats": 5,
  "intro": 2.2, "wada": 279, "duration": 24, "spoutT": 20.6,
  "stations": [ { "word": "Goal", "sub": "What done looks like" } ] }
```

- `medium`: `air` or `water`.
- `wada`: the Sanzo Wada combination (279, 296, 339, …).
- `<i>…</i>`: marks the accent word.

Iterate with `node kh/lines/tool.cjs <story> gate`, then `node kh/lines/tool.cjs <story> stills 3,6,9,12 sheet.png`.

### A new film

Copy the closest film folder (`kh/sea` is the cleanest template). Keep these interfaces:

- **The film module** exposes `drawFrame(ctx, t)`, `DUR`, `fps`, `W`/`H`, `shutter(t)`, `cues()`, `READ` (lines that must be readable), `CONTRAST` (fg/bg pairs), and `wpos`/`heading`/`cam` for the jump gate.
- **The tool** provides `stills | frame | gate | cues | render out a b`.
- **The build** needs a `case` entry in `scripts/build.sh`.

## The style: Kinetic Hydrography 1.0.0

- **Style kit and rig.** `kh/kh-kit.js` holds the tokens (CETI + Wada), linear-light `mix`, the five CETI eases (glaser, warm, defer, collect, rest; no bounce), and type with `<i>` accents. `kh/whale-rig.js` holds the little whale's rig and the AI pods (`drawPod`).
- **Colours.** Every colour is a token or a mix of tokens. A hand-typed hex fails registration unless it is declared as derived.
- **Type.** Fraunces Light Italic for display, DM Sans for body, Space Mono for labels (`fonts/`, SIL OFL).
- **The style as data.** `kh/registry/style.json` is the passport. Its hash is the style's identity.

## Gates (every film)

| Gate | Rule |
|---|---|
| Read time | every readable line is held ≥ 0.6 s + 0.15 s per word |
| Frame jump | the whale on screen moves ≤ 30 px and ≤ 0.35 rad per frame at 60 fps |
| Contrast | text against its ground is ≥ 4.5:1 (no blue text on blue water: labels sit on paper chips) |
| Flash safety | ≤ 3 general flashes in any 1 s window, measured from YAVG of the encoded file (`scripts/flash.py`) |
| Loudness | −16 LUFS integrated, true peak ≤ −1 dBTP |
| Frame count | ffprobe count = duration × 60 |
| Colour provenance | no unregistered hex (`register.py`) |

## Provenance registry

`kh/registry/` records which style drew each design, what it grew from, and whether it passed its gates. The full procedure is in `kh/registry/REGISTRY.md`.

- `register.py designs/<id>.json` hashes the sources and outputs, folds in the parents' fingerprints, appends to the hash-chained `ledger.jsonl` and writes the Notion payload.
- `register.py --ledger` checks the chain.
- `register.py --verify <id>` reports drift.
- Paths in the specs are relative to this `films/` folder. Renders that live in Releases are reported as *not in checkout*, not as drift.
- Registering a new version adds a new spec, and the ledger only grows. Never edit a registered design in place.

> Note: this snapshot was imported from the original build workspace. `kh/host.cjs`, `kh/board/board.cjs`, `kh/charsheet.cjs`, `kh/registry/register.py` and `atlas/design/src/*.py` had absolute paths that were made relative. `--verify` will therefore show those few files as changed against their original registration.

## Atlas (the research behind the style)

- `atlas/graph/`: the graph memory, with 157 nodes and 710 edges. `notion-map.json` links each node to its Notion page.
- `atlas/research/`: the video research batches, plus a study of `aadil6971/clawd-video`. That repo has no licence, so its patterns are borrowed and none of its code is copied.
- `atlas/brand/`: the CETI design system, CSS tokens and whale marks.
- `atlas/design/`: plates, covers and their generators.

## Legacy SVG engine (Little whale v1)

`whale/film.html` + `lib.js` render in headless Chromium (`@sparticuz/chromium` + `playwright-core`):

```bash
cd whale
node render.mjs seg1.mp4 0 1650      # out.mp4 startFrame endFrame
node cues.mjs && python3 synth.py    # cue sheet from the page, then the score
```

The v2 canvas engine is about 10× faster and is the one to build on.

## Versioning

- Change a film by committing to it.
- Tag each released cut: `git tag films/sea-of-data-v1`.
- Attach the MP4 to the matching GitHub Release.
- Register the new version in `kh/registry`.
