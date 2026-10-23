FILM LINE: "A robot finds one adapter that opens every drawer" (MCP board) — one mix law, every cue opens.

# MIX_C — per-cue sculpting from the measurement (round 3, lane music, candidate C)

## Rationale
1. Each perCueGain is solved from the worst measured `BASE.cues[].over_bed_dB` of its name so that cue lands at exactly overBedMin + 0.5 = +6.5 dB; the plan gain fills to its G36 cap (1) first, the remainder goes to its `kit.*` key; shared `pop` (BOOP+BOING) is resolved by the plan gain so both land exactly on +6.5.
2. Buses move last and least: master 0.9 and sfx 0.8 stay on their anchors; the bed takes only the least lift that puts lufsProxy inside the window (-17.0), carried by the sustained pad (breatherFloorGain 1.396, +2.9 dB) — the music bus is untouched (0.72).
3. Why least bed: the probe showed sfx peaks pinned at the limiter ceiling (~-2 dBFS), so every dB of bed lift is a dB of over-bed lost; the first variant (music bus +2.45 dB) measured min over-bed 2.4, this one 3.4.

## Design (MIX_C.design(plan, null, 7))
master 0.9 · music 0.72 · sfx 0.8 · breatherFloorGain 1.396 · limiter {threshold -3.5, knee 0, ratio 20, release 0.1, attack 0}
perCueGain CLICK 1 · BOOP 0.693 · WHOOSH 1 · THUD 0.719 · BOING 0.853 · CHORD 1 · TICK 0.4 · RISER 0.5
kit whoosh 1.124 · impact 1 · pop 1 · click 1.427 · ding 2.141 · tick 3.569 · riser 3.569 · duck {-6, 10, 250, 150} (frozen copy)

## Predicted (MIX.predict, MCP board) vs target vs measured (probe, PW_MODULE run, cand-C-audio-report.json)
| field | predicted | target | measured | |pred-meas| |
|---|---|---|---|---|
| lufsProxy | -17.00 | -16 ± 1.5 | -16.27 | 0.73 |
| truePeakProxy | -2.00 | ≤ -1.5 (validator: < -1.5) | -1.63 | 0.37 |
| sfxOverBedMinDb | +6.50 (every cue, both boards) | ≥ +6 | +3.4 (WHOOSH@3.75) | 3.1 FAIL |
| breatherFloorDb | -28.40 | ≥ -30 | -26.5 | 1.9 (safe side) |
| seamDb | -15.35 | ≥ -20 | -14.5 | 0.85 |
Measured per cue (sfx peak / bed peak / over): CLICK@0.865 -2.2/-5.9/3.6 · BOOP -2.3/-7.3/5.0 · WHOOSH -3.6/-6.9/3.4 · CLICK@4.1 -2.1/-7.4/5.4 · THUD -2.1/-6.7/4.6 · BOING -2.2/-5.9/3.7 · CLICK@13.2 -2.0/-8.6/6.6. Holes 0, min gap 350 ms.
Measured thresholds: lufs PASS, true_peak PASS, seam PASS, breather PASS, holes PASS, spacing PASS, **sfx_over_bed FAIL** (min 3.4, baseline -3.1: +6.5 dB better, no regression).

## Contract gaps (simplest default chosen)
- Design constants (margin 0.5, breatherMargin 1, overshoot 1.5, tpGuard 0.5, knee 0, ratio 20, release 0.1, gainCap 1), `kitMap`, `kitOnly`, `duck` and `padShare` live in `BASE` (exempt object); TARGETS shape unchanged. Literals 0 and 1 treated as structural.
- Plan cue → BASE cue: same name, nearest t; a name never measured (CHORD, TICK, RISER) inherits the board's worst cue (-3.1), hence large ding/tick/riser kit multipliers.
- Kit multipliers may exceed 1 (they are not G36 plan gains); plan gains are clamped to (0, 1].
- `limiterInserted` = a limiter is in the graph after the call (true on the 2nd call too; only one is ever created). A stale limiter (engine rebuilt comp/ctx) is replaced.
- truePeakProxy's "max fx" is taken over all 8 names; threshold set to -3.5 (not -3) because the validator's TP test is strict (< -1.5); measured overshoot was ~1.9 dB.
- Breather window is not needed by predict (pad share is law-fixed); design ignores `plan`, `tokens`, `seed` (plan-independent, deterministic).
- Probe copy: the page reloads between renders, so `probe-C.mjs` re-adds the script tag at the top of `render()`; STUDIO_URL is passed because the copy sits two levels deep.

## predicted.wow = 0.55
## predicted.firstFlag = G36 `sfx_over_bed` (measured)
Why: the limiter that guarantees TP pins every SFX peak at ~-2 dBFS (sfxOnly render), while the bed peaks at the cue windows sit at -5.9..-8.6 dBFS after any lift that satisfies the predict-law lufs window. The prediction law books loudness to the bed only, but the +8 dB SFX lift also raises measured LUFS (measured -16.27 vs predicted -17.0); a pass would need ~2.5 dB less bed at the cues, which the predict law forbids (lufsProxy would fall below -17.5). Predict over-bed is 3.1 dB optimistic (predicate 7 fails).

## mutationProof
`depthDb: -6,` → `depthDb: -5,` on an in-memory copy, vm-loaded in a fresh sandbox: predicate 4 (duck frozen) FAILS → `8 mutation caught` ok.

## Verify
`node work/music3/selftest-C.js` → exit 0 (SKIP probe without PW_MODULE; with the probe report present predicate 7 fails on over-bed, see above).
`node skills/motion-soup/scripts/soup-runner.mjs check-literals work/music3/cand-C.js --tokens work/tokens.resolved.json` → exit 0.

## Open risk
Over-bed ≥ +6 measured is unreachable under the current law (frozen duck, comp untouched, TP-strict limiter, bed-only lufs prediction). Merger options: (a) let predict credit the SFX contribution to LUFS so the bed can stay at 0 dB; (b) a quieter bed in cue windows needs automation, which this lane forbids.
