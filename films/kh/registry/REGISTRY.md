# How to register a design

Every design made in a registered style (Kinetic Hydrography 1.0.0 today) gets a row in the **Design Registry**, with its provenance attached. The registry answers three questions about any frame: which style drew it, what it was derived from, and whether it passed its gates.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| Style passport | `kh/registry/style.json` | The style as data: tokens (CETI + Wada), type roles, eases, bans, laws, instruments, gates. Its sha256 is the style's identity. |
| Style kit | `kh/kh-kit.js` | The style as code. New work imports it, so every colour is a token or a linear-light mix of tokens. Its hash is recorded too. |
| Design spec | `kh/registry/designs/<id>.json` | One file per design: kind, version, parents, Wada combinations, engines, atlas nodes it applies, sources, outputs, gate results, deviations. |
| Register | `python3 kh/registry/register.py designs/<id>.json` | Hashes every source and output, lints colours, folds in the parents' fingerprints, appends to the ledger, writes the Notion payload. |
| Ledger | `kh/registry/ledger.jsonl` | Append-only; each entry carries the hash of the one before. `register.py --ledger` checks the chain. |
| Notion map | `kh/registry/registry-map.json` | Design id → Notion page. Filled by `register.py --link <id> <url>` after publishing. |

## The steps

1. **Make the design with the kit.** Import `kh-kit.js`; draw colours from `KH.CETI` / `KH.WADA` or `KH.mix()` of them. A colour typed by hand must be declared in the spec's `derived_colours` with the token it comes from.
2. **Run its gates** and write the results into the spec (`PASS — <the measured number>`). Films: frame-jump, read-time, flash safety, loudness, ffprobe, contact sheet.
3. **Write the spec.** Name its parents: the style passport, and the design it grew from. Name the deliberate deviations from the style.
4. **Register:** `register.py designs/<id>.json`. Colour provenance is checked here; an unregistered literal colour fails the row.
5. **Publish:** make a 800-px JPEG preview, wrap it in an SVG (`previews/<id>.svg`), upload it with Notion's create-attachment (text content), then create the row in the Design Registry from `out/<id>.notion.json`, with the preview image first in the page body and in the Preview property.
6. **Link:** `register.py --link <id> <notion_url>`, then `register.py --payload <child>` for anything waiting on this parent.
7. **Check drift later:** `register.py --verify <id>` re-hashes everything; any changed file, or a changed style passport, is reported.

## Rules of provenance

- A new **style version** is a new passport row (Kind = Style system) with the old one as its parent. Designs keep the version they were made in.
- **Never edit a registered design's files in place.** Make a new version, register it, and set the old row's Status to *superseded*.
- Deviations are allowed and expected. They are written down, not hidden.
