# 02 · gate — Prove it at the *gate*.

Wada 243 (Raw Sienna, Ivory Buff, Olive Green, Slate). 128 BPM (beat = 0.469 s). DUR 26.05 s.
Olive = pass / checked. Raw Sienna = stopped / caught. Text is ink or slate on paper only.

A gate is two upright ticks on the line, one above and one below. The gap between them is the spec. Runs (short thick strokes of the line) slide along the track. A run whose wobble fits the gap glows olive and goes through; a run that does not fit is stopped, and the two ticks close on it (fail closed). Runs travel at 640 px per beat, so in the payoff every run hits one gate per beat.

## Beat sheet (v2)

| t (s) | beat | what happens | on screen |
|---|---|---|---|
| 0.0–2.5 | 0–5 | Opening card. The track draws on underneath it. | "CETI · Capabilities · 02" / "Check it at the *gate*." |
| 2.4–4.6 | 5–10 | **Mess.** Three runs ship with no gate. The third one is a big wobble. | "By eye, misses ship." |
| 4.69 | 10 | **Spec.** The whale lands and a gate grows under it: two posts, a lintel, hatched walls and one paper slot. The slot's dashed edges extend upstream as the tolerance band. | Spec · what must be true |
| 6.56 | 14 | **Check.** The whale stomps and the slot edges light up. Run 1 threads the slot on beat 16; the slot flashes olive and the run glows. | Check · a machine, not opinion |
| 8.44 | 18 | **Gate.** Runs 2 and 3 thread the slot on beats 19 and 21. | Gate · pass, or stop |
| 10.31 | 22 | **Fail-first.** The act-1 "old copy" returns. On beat 23 a rust bar drops across the slot and the run crumples against it. At 11.0: RULES 06 and chip 06. | caption "Real catch, this series: whale snapped 1.26 → 0.11 rad/frame." |
| 12.66 | 27 | **Escape.** A subtle wobble fits the slot (a false olive pass at 13.36) and drifts downstream. At 13.93 a rust MISSED flag drops under it and ESCAPES 1 appears. The whale takes off at 14.2 and lands on the run at 14.8. | Escape · what slipped past |
| 15.4 | 33 | **Rule.** The whale hops to 640 and gate 07 grows (15.98), open, with a visibly narrower slot. On 16.75 the run is nudged in, and on 16.9 the bar drops and the run crumples. RULES 07, spark and delight. A good run threads 06 and 07 on beats 38 and 39. | Rule · the escape becomes a check |
| 18.28–19.9 | 39–42.5 | **Rules accrue.** The camera pulls back, anchored on 07 and the whale, to seven gates across the frame (each about 270 px tall). Three runs cross the row, one gate per beat. | not-this caption from 18.28 |
| 19.69 | 42 | "RULES 6 → 7" (48 px chip) lands, with a halo on 07 and whale spark plus delight. | |
| 21.1–23.75 | | End belief, which is out before the lockup. | "Machines check every run. Every miss becomes a rule." |
| 23.75–26.05 | | `SERIES.lockup` | |

Station words (RESEARCH.md §2): Spec, Check, Gate, Fail-first, Escape, Rule.
Real numbers used: only the framed self-referential catch (1.26 rad/frame fixed to 0.11, from *Whale Line — The brief v1*). There is no "proof" or "Lean" on screen except the given not-this line ("proves the absence of known failures").

## Known weaknesses
- The aperture metaphor reduces every rule to one property (wobble size). Gates 01–05 are drawn as wider gates so that the act-1 wobbly run could pass them, which makes the row read as a funnel. That is a visual device, not a claim that rules get stricter.
- Gates 01–05 sit just off the left edge during the story and are only revealed by the pull-back.
- In the pull-back the gates and the whale are drawn with a vertical size floor (zv = max(z, 0.85)) so they stay readable. `wpos` reports the on-screen equivalent y, so the jump gate measures what is actually drawn.
- Story camera: z 1.38→1.45, a small push-in on the fail-first stop, a pan on the chase, and a push-in to z 1.6 on the new rule.
- The escape's pass flash is the same olive as an honest pass, on purpose (a false yes). The MISSED flag and the ESCAPES 1 counter carry it with the sound off.
- In the payoff, gates 01–05 have very wide slots, so their walls are short stubs. The row reads as a funnel.
- Score: K-weighted, gated loudness normalised in-script to −16.0 LUFS, true peak −1.2 dBTP.
