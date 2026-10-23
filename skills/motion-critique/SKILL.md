---
name: motion-critique
description: Critique loop for animated explainers and motion graphics (film spec item 8) — render stills at the hook, every payoff mark and the landing, have one blind stills critic score them on the brief's §8 axes, write the 3 worst problems, route each fix to its lane, and repeat until every score is 8+, then log the polish stage. Use when the user says "critique", "critique loop", "score the stills", "review the frames", "is it 8+", "what's wrong with this animation", "run the stills critic", or after motion-soup's full pass is green and before motion-deliver renders the MP4. Do not use to write the brief (motion-brief), build lanes (motion-soup) or render the MP4 (motion-deliver).
---

# motion-critique — stills → score → worst 3 → fix → repeat until 8+

Third of four: **motion-brief** (writes `work/BRIEF.md`, `work/beats.json`) → **motion-soup** (parallel lane build) →
**motion-critique** (this) → **motion-deliver** (MP4, loop check, poster, contact sheet). This skill owns FILM-SPEC-9
item 8: *"Render stills, score them, write the 3 worst problems, fix, repeat until every score is 8+."* The gate it
feeds is **FS-critique** (motion-soup `references/gates.md`): no `render` stage row until the last `critique` row has
every score ≥ 8.

Paths below are relative to the repo root. `R` = `node skills/motion-soup/scripts/soup-runner.mjs`,
`S` = `node skills/motion-critique/scripts/stills.mjs`, `C` = `node skills/motion-critique/scripts/critique-check.mjs`.

## Inputs (check before pass 1)

| Need | From | If missing |
|---|---|---|
| axes + who-fixes map | brief §8, read by `C --axes-from work/BRIEF.md` | exit 1 → ask the owner the film-brief.md §8 question once; never invent axes |
| payoff marks | `work/beats.json` (motion-brief) or the host's own timeline (config `timelineExpr`) | neither → stop; FS-cadence has nothing to check either |
| a seekable host | a stills config (`configs/*.json`) for the page | write one (§Stills on a new host) |
| ladder position | ledger `stage` rows | see §Where in the ladder |

**Axes are never hardcoded.** They come from §8. The six defaults — hook, cadence, readability, identity, music fit,
polish — apply only when §8 says `default`, with the default fixers hook→transitions, cadence→wording,
readability→typography, identity→vector, music fit→music, polish→vector. A §8 that lists `legibility` scores
legibility, not readability.

## Where in the ladder

motion-soup step 8b walks `plan → rig → stills → animatic → full → polish → audio → render` (FS-gateorder). The loop
runs at two points:
- **at `stills`** — an early pass on frames from the lane soups. Exit writes nothing extra: the `stills` stage row is
  motion-soup's.
- **at `polish`** (the default, and what "critique it" means once a `full` row exists) — exit writes the `polish`
  stage row. Before writing it, confirm the ledger already has `plan, rig, stills, animatic, full` for this round
  (`R report --round K` prints the ladder); if one is missing, say which and stop — never backfill a stage row.

## The loop (pass P = 1..4)

**1. Pick times.** Default `--times auto`: the hook at 1.0 s, every payoff mark (beat end − 0.05 s, or the beat's
`payoffAt`), and the landing (middle of the last beat). Add a time only when the previous pass's worst3 named a
moment that is not one of those; never drop the hook or the landing.

**2. Capture.**
```
$S --config skills/motion-critique/configs/motion-atlas.json --out work/stills/rK/pP \
   --param board=<board id> [--beats work/beats.json] [--times auto]
```
Set `PW_MODULE` / `CHROME_PATH` (and `PLAYWRIGHT_BROWSERS_PATH`) for your environment; see `configs/motion-atlas.json`
→ `hostAdapter.env` for an example. `--beats` takes motion-brief's dur-only `beats.json` as is (t0/t1 accumulate from
`dur`); `--times auto` exits 1 if it resolves a NaN or fewer than 3 times. `--selftest` unit-tests that path.
Writes `<t>s.png` per time and `stills.json`. Exit 1 on a missing stage element, a blank still (< 4 colours), a page
error, or a failed **determinism check** (one time captured again after seeking elsewhere must match byte for byte,
else by RGBA pixel diff = 0). A non-deterministic page is a G06-class bug for the lane that owns the clock, not a
critique finding — report it and stop. If the page looks broken (another agent may be rebuilding the bundle), wait a
minute and re-run once before concluding anything. Read one still yourself before spawning the critic.

**3. Score.** Spawn ONE stills critic with `references/stills-critic-prompt.md`, slots filled from the brief and
`C --axes-from`. It sees only the stills dir and the brief lines — no source, no test output, no ledger, no earlier
critique file. A fresh agent every pass. It writes `work/critique-rK-pP.json`.

**4. Validate.** `$C work/critique-rK-pP.json --brief work/BRIEF.md`
- exit **1** invalid (e.g. two worst items, a fix without `<lane>:`, a score of 7 not named in worst3, a still not
  named) → re-spawn the critic once with the error lines appended; a second invalid row → stop and report.
- exit **2** valid, repeat · exit **0** valid, every axis ≥ 8.

**5. Ledger.** `$R ledger add @work/critique-rK-pP.json` (the file is the `critique` row; the runner's schema
rejects a bad row with exit 1). One row per pass, written as soon as it validates.

**6. Route fixes (exit 2).** `critique-check` prints `routes[]` = `{lane, change, problem}`. Each goes to its lane
as motion-soup step 8c does: a one-candidate re-spawn of that lane (motion-soup `references/prompts.md` §1) with
the fix as `{{LENS}}`, same contract, same gates, then the lane soup and integrator re-run (motion-soup steps 6–7).
Two fixes for one lane go into one re-spawn. Do not edit lane files yourself and do not let the critic do it. When
the lanes are green again, go to step 1 with P+1.

**7. Exit (exit 0).** At `polish`:
```
$R ledger add '{"round":K,"kind":"stage","stage":"polish","pass":true,"minutes":<loop minutes>,"artifacts":["work/critique-rK-pP.json","work/stills/rK/pP/stills.json"],"detail":"critique exit at pass P, min score <n>"}'
```
The last worst3 (all ≥ 8) is the polish list handed to motion-deliver's README; it is not a reason for another pass.

## The cap — 4 passes, the bar does not move

If pass 4 still has an axis < 8: stop. Do not lower the bar, re-weight axes, drop the low axis from §8, swap in a
kinder critic, or write the `polish` row. Instead:
- one `open` row per axis still < 8: `$R ledger add '{"round":K,"kind":"open","text":"critique cap: <axis> <score> after 4 passes — <worst3 item>","lane":"<lane>"}'`
- report to the user: the four passes' scores per axis (trend), the open worst3 with its routed lane, and the
  choice that is theirs — another round, a brief change (§5 beats or §8 axes), or ship below 8 knowingly (FS-critique
  will still refuse a `render` row, so motion-deliver cannot produce a deliverable MP4 until they decide).

A score that does not move across two passes after its fix landed means the fix was aimed at the wrong lane or the
wrong cause; say so in the report rather than sending the same fix a third time.

## Stills on a new host

`stills.mjs` is generic over any page with a deterministic clock. A config is JSON:

| key | meaning |
|---|---|
| `url` | page; a plain path resolves against `--root` (default cwd) |
| `viewport`, `deviceScaleFactor` | browser size, pixel density of the stills |
| `readyExpr` | polled until truthy after load |
| `setupExpr` | once: choose the board/scene from `params`, pause playback, mute |
| `selector` | stage element, or `largest-canvas` |
| `seekExpr` | pin the stage element `el` to time `t` — pure in `t`, no wall clock |
| `timelineExpr` | `{total, beats:[{t0,t1,payoff}]}` for `--times auto` without `--beats` |
| `settleMs`, `times` | wait after seek; default times (`"auto"` or an array) |

Each `*Expr` is a string (an expression) or an array of strings (a function body that may `return`); `params` holds
the `--param k=v` pairs. **Host adapter:** everything specific to one host page (file name, how its clock is pinned,
board selection, browser paths) lives in its config; `configs/motion-atlas.json` is this repo's example, and its
`hostAdapter` block says in prose what the exprs do. For a Remotion/HyperFrames-style host the
seek is usually one call (`player.seekTo(t * fps)`) and a `readyExpr` on the player.

## Rules

- One critic per pass, blind, fresh. The builder never scores its own frames.
- Every fix names one lane from §8 and one change; the critic never edits.
- Validate before the ledger; the ledger before routing; route before the next capture.
- No design tokens in this skill's files: colours, fonts, easings and tempos belong to the host's token file.
  Check: `$R check-literals skills/motion-critique` → exit 0.
- Write only stills under `work/stills/`, `work/critique-r*-p*.json` and ledger rows. Lane files are the lanes'.

## Anti-patterns

- **Grading the plan.** Scoring `BRIEF.md` or `beats.json` instead of pixels — the critic must Read every still.
- **Rubber-stamp passes.** A pass whose stills are byte-identical to the previous pass's (nothing was fixed) is not
  a pass; compare the `sha1` of each still in `stills.json` with the last pass's before spawning.
- **Moving the bar.** The cap stops the loop; it never edits §8.
- **Rendering early.** A `render` row behind a score < 8 is refused by FS-critique; motion-deliver waits for `polish`.

## Files

- `references/stills-critic-prompt.md` — the critic prompt (lifted from motion-soup prompts.md §4b) and its slots.
- `scripts/stills.mjs` — capture + blank guard + determinism check → `work/stills/rK/pP/`.
- `scripts/critique-check.mjs` — row validation and the exit decision; `--selftest` runs 10 negative mutations;
  `--axes-from <brief>` prints axes, fixers and lanes.
- `configs/motion-atlas.json` — this repo's host adapter (page, seek, env example).
