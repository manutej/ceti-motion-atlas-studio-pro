# 02 · gate — Prove it at the *gate*.

Wada 243 (Raw Sienna, Ivory Buff, Olive Green, Slate). 128 BPM (beat = 0.469 s). DUR 28.0 s.
Olive = pass / checked. Raw Sienna = stopped / caught. Text is ink or slate on paper only.

A gate is two upright ticks on the line, one above and one below. The gap between them is the spec. Runs (short thick strokes of the line) slide along the track. A run whose wobble fits the gap glows olive and goes through; a run that does not fit is stopped, and the two ticks close on it (fail closed). Runs travel at 640 px per beat, so in the payoff every run hits one gate per beat.

## Beat sheet

| t (s) | beat | what happens | on screen |
|---|---|---|---|
| 0.0–2.5 | 0–5 | Opening card. The track draws on underneath it. | "CETI · Capabilities · 02" / "Prove it at the *gate*." |
| 2.4–4.6 | 5–10 | **Mess.** Three runs flow along the line with no gate. The third one is very wobbly and ships anyway, while the whale swims in. | "By eye, misses ship." |
| 4.69 | 10 | **Spec.** The whale lands, the two ticks grow out of the line, and the spec band (dashed) draws upstream. | Spec · what must be true |
| 6.56 | 14 | **Check.** The whale stomps; the scan in the gap switches on. Run 1 crosses on beat 16, the ticks flash and the run glows olive. | Check · a machine, not opinion |
| 8.44 | 18 | **Gate.** Runs 2 and 3 glow through on beats 19 and 21. | Gate · pass, or stop |
| 10.31 | 22 | **Fail-first.** The act-1 wobbly run comes back with an "old copy" chip. On beat 23 it hits the gate and is stopped: the ticks close (Raw Sienna). On 11.0 the rule ships: chip "06", counter RULES 05 → 06. | Fail-first · fails on the old copy · caption "Real catch, this series: the whale snapped 1.26 → 0.11 rad/frame." |
| 12.66 | 27 | **Escape.** A subtly wobbly run fits inside the gap and passes on beat 29, with a false olive flash. The startled whale chases it and lands on it downstream at 14.08. | Escape · what slipped past |
| 15.47 | 33 | **Rule.** The whale hops forward and lands at 640. A tighter gate 07 grows and its ticks close on the escaped run (16.2), so the new check fails on the old copy. Then: RULES 07, a spark and delight. A good run passes 06 and 07 on beats 37 and 38. | Rule · the escape becomes a check |
| 18.28–20.1 | 39–43 | **Rules accrue.** The camera pulls back, anchored on gate 07 and the whale, to a row of seven gates, 01 → 07, each one tighter. Five good runs (19.7–25.3) cross the whole row, one gate per beat, which sounds as a rising canon. | "RULES 6" chip at 18.5; chips 01…07 |
| 19.69 | 42 | "→ 7" lands on the counter, with a halo on 07 and whale delight plus spark. | RULES 6 → 7 |
| 20.15–23.05 | | Not-this caption. | "A gate proves the absence of known failures — not quality." |
| 23.0–25.7 | | End belief (out before the lockup), then `SERIES.lockup` from 25.7 to 28.0. Runs are still crossing and the camera keeps drifting, so nothing holds still before the lockup. | "Machines check every run. Every miss becomes a rule." |

Station words (RESEARCH.md §2): Spec, Check, Gate, Fail-first, Escape, Rule.
Real numbers used: only the framed self-referential catch (1.26 rad/frame fixed to 0.11, from *Whale Line — The brief v1*). There is no "proof" or "Lean" on screen except the series title ("Prove it at the gate.") and the given not-this line.

## Known weaknesses
- The aperture metaphor reduces every rule to one property (wobble size). Gates 01–05 are drawn as wider gates so that the act-1 wobbly run could pass them, which makes the row read as a funnel. That is a visual device, not a claim that rules get stricter.
- Gates 01–05 sit just off the left edge during the story and are only revealed by the pull-back.
- In the pull-back the gates and the whale are drawn with a vertical size floor (zv = max(z, 0.85)) so they stay readable. `wpos` reports the on-screen equivalent y, so the jump gate measures what is actually drawn.
- Story camera: z 1.38→1.45, a small push-in on the fail-first stop, a pan on the chase, and a push-in to z 1.75 on the new rule (the key moment).
- The escape's pass flash is the same olive as an honest pass, on purpose (a false yes); the sound makes it 35 cents flat. With the sound off, only the visibly larger wobble tells you it shouldn't have passed.
- The gate number chips and the station strip are 18 px mono: legible at 1080p, small on a phone.
- Score: K-weighted, gated loudness normalised in-script to −16.0 LUFS, true peak −1.2 dBTP.
