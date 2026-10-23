Film line: "A robot finds one adapter that opens every drawer" (MCP board) — one limiter is the adapter: every cue opens through it, nothing clips past it.

# cand-A — lane `music`, round 3 · lens: headroom lives in the limiter

## Rationale
1. Buses stay at BASE (music 0.72, sfx 0.8); one hard limiter (threshold −3, knee 0, ratio 20, attack 0, release 0.1) between comp and master is the only peak control.
2. WebAudio's compressor adds automatic makeup gain K = 0.6·|T|·(1 − 1/R) ≈ 1.71 dB; masterGain trims K/2, so the limiter carries half of K as loudness, and the pad (breatherFloorGain) carries the rest of the bed lift: sustained and low crest, so it raises lufs and the breather without raising the peaks.
3. Per-cue gains lift only cues measured under +6 dB (all of them in v9.2) up to 1.0; the remainder goes to the kit multipliers (click ×1.98, whoosh ×1.56, pop ×1.18). Times, duck and comp are left alone.

## Design (seed 7, both boards identical)
masterGain 0.816 · breatherFloorGain 2.140 (pad 6.42) · limiter {−3, 0, 20, 0.1} · perCueGain CLICK 1, BOOP 0.963, WHOOSH 1, THUD 0.998, BOING 1, CHORD 1, TICK 0.4, RISER 0.5 · kit {whoosh 1.56, impact 1, pop 1.18, click 1.98, tick 4.96, riser 4.96, ding 2.97} · duck {−6, 10, 250, 150}

## Predicted (MIX.predict) vs targets vs measured (offline probe, MCP board, 2 loops)
| field | predicted | target | measured | Δ |
|---|---|---|---|---|
| lufsProxy | −16.00 | −16 ± 1.5 | −16.68 PASS | 0.68 |
| truePeakProxy | −1.50 | ≤ −1.5 | −2.06 PASS | 0.56 |
| sfxOverBedMinDb | +7.50 | ≥ +6 | +2.9 FAIL (WHOOSH@3.75) | 4.6 |
| breatherFloorDb | −25.55 | ≥ −30 | −23.9 PASS | 1.65 |
| seamDb | −14.35 | ≥ −20 | −15.3 PASS | 0.95 |
spacing 350 ms PASS · holes 0 PASS. Measured over-bed per cue: CLICK@0.865 4.2 · BOOP 4.4 · WHOOSH 2.9 · CLICK@4.1 4.9 · THUD 4.2 · BOING 3.0 · CLICK@13.2 5.4 (v9.2 baseline min −3.1 → +2.9).
Waivers: clears lufs (−18.45 → −16.68) and breather (−31.3 → −23.9); improves sfx_over_bed by +6.0 dB but does not clear it. Report: work/music3/cand-A-audio-report.json.

## predicted.wow = 0.55
## predicted.firstFlag = G36 `sfx_over_bed`
The limiter clamps every SFX to the same ceiling (measured peaks −3.3 to −4.6 dBFS), while the bed's onset peak in the [t, t+0.3 s] window (−6.6 to −8.7 dBFS) is sampled before the frozen 10 ms duck attack lands. Ceiling minus bed peak is capped at about 5 dB whenever lufs ≥ −17.5. Selftest p7 (PW_MODULE set) therefore exits 1, on this gate plus breather Δ 1.65 > 1.5.

## mutationProof
selftest-A.js copies cand-A.js and replaces `depthDb: -6,` with `depthDb: -5,`, then reruns predicate 4 on the copy: it FAILS (`caught: true`). The mutant is deleted after the run.

## Contract gaps (simplest default taken)
- Literals: the frozen DUCK object and BASE.lim {overshoot 1.5, makeupExp 0.6 (Web Audio spec makeup exponent), ratio 20, knee 0, release 0.1, attack 0} sit inside the exempt BASE/TARGETS block (`/*EXEMPT-BEGIN … EXEMPT-END*/`). 0, 1 and 2 count as structural, 10 and 20 are units (log10), and 1000 is ms per second. The self-test scans for every other numeric literal.
- perCue base for a plan cue: the BASE.cues entry with the same name within holeMs (100 ms); otherwise the worst measured value for that name; otherwise the worst measured cue overall (−3.1). So CHORD, TICK and RISER are lifted conservatively.
- design() ignores plan, tokens and seed (it is deterministic and never re-times anything), so both boards get the same design.
- Kit multipliers may be above 1. Only `plan.sfx` and `plan.events` gains are clamped to (0, 1] (G36 'gains').
- `limiterInserted` is true whenever a limiter sits in the graph after the call. A new ctx (the engine rebuilds `mix` per ctx) gets a fresh limiter, keyed by `nodes.__mixCtx`.
- Probe recipe: audio.mjs calls `page.reload` between renders, which drops the injected script. probe-A.mjs injects cand-A.js again after each reload and resolves index.html as `../../`.
- The probe was run with PROBE_OUT in a private scratch directory because work/music3 is shared with concurrent probes (the .f32 files raced). The report was then copied to work/music3/cand-A-audio-report.json.

## Open risk
- The prediction law cannot see (a) the limiter's automatic makeup gain or (b) the limiter clamping the sfxOnly stem. The predicted over-bed (+7.5) is therefore optimistic by 4.6 dB.
- Clearing sfx_over_bed together with lufs and TP looks infeasible for any design that only uses the limiter. Under the frozen duck and comp, the bed's crest (onset peak about 9 dB over its loudness) leaves at most about 5 dB between ceiling and bed. This is a contract-level decision: duck attack, bed peak control, or the measurement window.
- Self-test p7 is honest and fails when PW_MODULE is set. The deliverable run (no PW_MODULE) prints `SKIP probe` and exits 0.
