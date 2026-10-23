Film line: "A robot finds one adapter that opens every drawer" (MCP board). Here the adapter is one limiter law that every cue passes through.

# MIX soup, round 3, lane music (`work/music3/soup.js`, `window.MIX`, 10,940 B)

## Provenance per lever (measured probe values, MCP board; soup probed once, `soup-audio-report.json`)
| lever | from | why it wins (measured) | soup value |
|---|---|---|---|
| limiter law: knee 0, ratio 20, attack 0, release 0.1 | A = C | best true-peak control (A TP −2.06; C −1.63 with no trim) | same |
| master makeup-cancel: master trims the limiter's makeup K = 0.6·abs(T)·(1−1/R), so ceiling + 1.5 lands at tpMax − 0.05 | A | A is the only single with TP < −2 | master 0.837 (−0.63 dB vs 0.9) |
| threshold −3.5 | C | smallest measured overshoot (0.79 dB, A/B 1.0); more over-bed per LUFS dB under the TP law (contradiction 3) | −3.5 |
| per-cue solved gains: worst instance → +6.5 under the contract law, plan gain to cap 1, rest to kit | C | best min over-bed (C 3.4 vs A/B 2.9) | CLICK 1 · BOOP 0.653 · WHOOSH 1 · THUD 0.677 · BOING 0.803 · kit click 1.345, whoosh 1.059, ding 2.017, tick/riser 3.362 |
| least bed lift on the pad: lufsProxy (calibrated) = −17.5 + 0.4 | C | best over-bed per LUFS dB (bed peak +0.318 dB per pad dB vs music bus +0.77) | breatherFloorGain 1.239 (+1.86 dB); music 0.72, sfx 0.8 |
| breather by breatherFloorGain first | B, contract | B best breather (−22.5), but B's music −2.2 / pad +9.9 swap costs over-bed (B 2.9) → only the "pad first" rule kept | breather −28.2 |
| apply: one limiter, keyed on (ctx, comp); `limiterInserted` = inserted by this call | C graph + B flag | contract: "a second call reconfigures, never re-inserts" | |

## Measured soup vs predicted vs singles (probe-soup.mjs → analyze.py, isolated folder)
| metric | A | B | C | soup predicted | soup measured | gate |
|---|---|---|---|---|---|---|
| lufs | −16.68 | −16.72 | −16.27 | −17.10 | **−17.01** | PASS (0.49 inside the edge) |
| true peak | −2.06 | −1.58 | −1.63 | −1.55 | **−2.33** | PASS |
| over-bed min | 2.9 | 2.9 | 3.4 | 3.63 | **3.6** (CLICK@0.865 and WHOOSH@3.75) | FAIL vs +6, WAIVED-with-floor |
| breather | −23.9 | −22.5 | −26.5 | −28.07 | **−28.2** | PASS |
| seam | −15.3 | −16.0 | −14.5 | −15.47 | **−15.2** | PASS |
| spacing / holes | 350/0 | 350/0 | 350/0 | engine | 350 ms / 0 | PASS |
Per cue (sfx peak / bed peak / over-bed): CLICK@0.865 −2.9/−6.5/3.6 · BOOP −3.1/−8.3/5.2 · WHOOSH −4.4/−7.9/3.6 · CLICK@4.1 −2.7/−8.3/5.6 · THUD −2.8/−7.6/4.8 · BOING −2.9/−6.8/3.9 · CLICK@13.2 −2.7/−9.8/7.1.
The upgraded predict is within 0.03–0.27 dB of measured on lufs, over-bed, breather and seam. TP is off by 0.78 dB on the safe side, because the contract's +1.5 dB overshoot is kept. The candidates' own predicts were 3.1–4.6 dB optimistic on over-bed.

## Intersection (all three state it; E1 atoms in proposed-atoms.json)
1. The +6 dB over-bed target is infeasible with the frozen 10 ms duck attack under a −3 dB limiter at lufs ≥ −17.5. The bed is at full level for the cue's first 10 ms, and the limiter pins SFX peaks near −2…−3.5 dBFS. Measured over the four mixes: over-bed ≈ TP − LUFS − k, where k = 11.08 (soup), 11.24 (C), 11.72 (A), 12.24 (B). With TP < −1.5 and LUFS ≥ −17.5 this gives a ceiling of about +4.9 dB.
2. MIX.predict must model the limiter's makeup gain and the SFX-only limiter cap. Otherwise predictions are 3–4.6 dB optimistic. soup.predict does both: perCue = min(contract law, cap law), with the cap at threshold + K + master.
3. The probe recipe must re-inject the script after each `page.reload` and must run in an isolated folder. probe-soup.mjs resolves soup.js and index.html from its own directory, and PROBE_OUT points at the scratch folder. Only the JSON report was copied back.
4. Uncovered cues inherit the worst measured cue. A plan cue with no same-name anchor within holeMs gets the WHOOSH@3.75 anchor (selftest I4).

## Contradictions
| # | conflict | resolution | cite |
|---|---|---|---|
| 1 | over-bed ≥ +6 target vs frozen duck {−6, 10/250/150} | **OPEN**: duck not changed. Measured ceiling: +3.6 (soup); best single +3.4 (C). Round-4 lever below | CONTRACT targets vs tie-break "duck … frozen"; ledger E2 duck atom |
| 2 | contract predicate 2 "every predicted cue ≥ 6" vs honest predict (I-2) | follows #1: selftest treats it as WAIVED-with-floor ≥ 3.4, predicted and measured | open with #1 |
| 3 | merge law says A's limiter (−3), but C's −3.5 measures better | contract tie-break "at unequal margin the larger minimum over-bed wins" → −3.5; A's knee/ratio/attack/release and the makeup-cancel are kept; TP −2.33 still beats A | CONTRACT tie-breaks |
| 4 | `limiterInserted`: A/C "present after call" vs B "inserted by this call" | B | CONTRACT API "never re-inserts" |
| 5 | B's breather swap (−22.5) vs over-bed | not taken; breather reached by breatherFloorGain | CONTRACT tie-breaks (over-bed first; breather by bfg first) |
| 6 | anchor matching: B index-i, C nearest-t, A within holeMs | A + worst inheritance | E1 intersection 4 |
| 7 | contract overshoot 1.5 vs measured 0.79–1.0 | contract 1.5 kept, so 0.78 dB of TP headroom is unspent | CONTRACT prediction law; **open** (recalibrating it would buy ≈ +0.7 over-bed) |

**Round-4 lever (atom mix3-lookahead-duck; a prediction, not a measurement).** Start the duck ramp N = 13 ms before each deterministic SFX trigger (10 ms attack plus one 128-frame render quantum of 2.9 ms). Depth −6 and 10/250/150 stay unchanged. In the [t, t+0.3 s] window the onset bed then sits at −6 dB instead of 0 dB, and the window tail sits at −3.4 dB instead of −4.0 dB. Predicted gain per cue is 3.4 dB (a full-height bed note in the tail) to 6.0 dB (onset-dominated). The onset bed peaks are −6.5 / −7.9 / −6.8 dBFS (CLICK@0.865 / WHOOSH / BOING), which would fall to ≈ −10.4…−13.9. That predicts a min over-bed of 7.0–9.6 dB, i.e. ≥ 6. LUFS change ≈ −0.03 dB; TP is unchanged. **Falsifier:** if the min over-bed measures < 6.0 (gain < 2.4 dB), the window peak is not at the onset.

## Dominance argument (honest)
- The soup is ≥ every single, and strictly better, on **TP** (−2.33 vs −2.06/−1.58/−1.63) and **min over-bed** (3.6 vs 3.4/2.9/2.9).
- On seam it beats A and B (−15.2 vs −15.3/−16.0) but not C (−14.5).
- It is **not** ≥ on LUFS centring (−17.01, 1.01 from target; the singles are 0.27–0.72) or on breather (−28.2 vs −22.5…−26.5).
- So raw "≥ on every metric" does **not** hold, and by the calibrated law it cannot: raising breather to B's −22.5 needs +5.7 dB of pad, which costs ≈ 1.8 dB of over-bed; matching C's LUFS (+0.74 dB) costs ≈ 1.1–1.2 dB of over-bed (pad 0.318/0.196 or music 0.77/0.534 dB per LUFS dB).
- What does hold:
  - (a) Gate vector: every gate any single passes, the soup passes (6/7, identical to each single).
  - (b) The contract's ordering (larger min over-bed, then more TP headroom): the soup is strictly first.
  - (c) It has the lowest crest constant k (11.08).
- **bestSingle = C**: min over-bed 3.4 wins the contract tie-break. **soup > C** under the contract's order.

## G36 update (work/eval-v9/audio-probe/WAIVERS.json, integrator's edit)
Clears **lufs** (−17.01 PASS, no waiver), **breather** (−28.2 ≥ −30) and keeps **true_peak** (−2.33 < −1.5). **sfx_over_bed** stays waived, with its floor raised from the v9.2 synth baseline (−3.1) to **+3.6** (soup measured). From now on it must not regress below +3.6; the selftest floor uses +3.4, the best single.

## Integrator checklist
- [ ] Copy `work/music3/soup.js` → `studio-mix-design.js` (10,940 B ≤ 14 KB). Add a `<script>` in index.html **after** `studio-music-engine.js` (and after `vendor/sfx-kit.js`). `studio-music-engine.js` is untouched.
- [ ] Hook in studio-ui.js right after `MUSIC.schedule(ctx, plan, …)`: `if (window.MIX) MIX.apply(ctx, MUSIC.mix, MIX.design(plan, null, 7), plan);`. apply sets static gains, inserts ONE limiter comp→limiter→master (re-inserts when the engine rebuilds `mix` for a new ctx), rewrites plan.sfx/events gains (≤ 1) and wraps SFX_KIT.play once.
- [ ] Validator (G36 block, scripts/validate-motion-studio.mjs L383-418):
  - Add predicate `mix`: vm-load studio-mix-design.js; `typeof MIX.apply === 'function' && MIX.VERSION`; `MIX.design(plan)` deep-equals on repeat; plan gains stay in (0, 1]; `checkSoundPlan` still passes (duck/spacing unchanged).
  - Add predicate `mix-band` on the soup report: `Math.abs(v.lufs_i_proxy + 16) <= 1.5 && v.breather_floor_dBFS >= -30 && v.true_peak_dBTP_proxy < -1.5`.
  - Remove the `lufs` and `breather` waivers; keep `sfx_over_bed` with floor +3.6.
- [ ] MUT:
  - (i) `sed 's/depthDb: -6,/depthDb: -5,/'` on a copy → selftest predicate 4 FAILS (`8 mutation caught`).
  - (ii) Drop the `MIX.apply` hook or rename `window.MIX` → `mix` FAILS.
  - (iii) Set `law.threshold: -2` → selftest `3 limiter` FAILS.
- [ ] Probe note: the recipe logs `[pageerror] … cannot resume an offline context that has not started` once per render (from the suspend/resume stepping). The renders still completed (1,323,000 samples each). This was not checked against the candidates' logs.
