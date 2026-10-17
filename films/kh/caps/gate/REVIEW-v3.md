# 02 · gate: meta-review for v3

**Reviewed:** `sheet-v2.png` (1 s contact sheet), stills at 5.6 / 11.6 / 14.3 / 17.2 s, `NOTES.md` and `film.js` (READ, GATES, chips, sizes).
**Lenses:** Clarity (sound off, on a phone) · Correctness of the metaphor · Evidence and honesty · Coherence (the parts agree) · Word rules (LONGFORM-60 §5) · Adversarial.
**Verdict:** the craft is clean and every gate passes, but the film does not say what it means. Manu's note, "Cap gate could be clearer", is right, and the root cause is the metaphor, not the polish. Fix the P1s before any re-timing.

## P1: must fix (they block understanding)

| # | Lens | Defect | Remedy |
|---|---|---|---|
| P1-1 | Correctness of the metaphor | Every gate checks **one property: wobble height** (slot half-heights 128→62→32 in `GATES`). The "escape" is just a smaller wobble that fits slot 06, and the "new rule" is the same check with a narrower slot. This teaches "tighten the tolerance", which is the opposite of the capability. The real lesson (RESEARCH §2, *Limits & escapes*) is that an escape is a failure **of a kind no gate looked at** ("declared IBM Plex, rendered Inter"), and the new rule is a **new kind of check**. | Give each gate a *kind*, drawn as an icon on its lintel (wobble, colour, gap…). The escape run is smooth (it passes the wobble gate honestly) but is the **wrong colour**. The new gate 07 carries a colour-lens icon. Slots stay the same size. |
| P1-2 | Clarity, sound off | At 14.3 s the escaping wave looks about as wobbly as the one stopped at 11.6 s. A viewer cannot see *why* one passed and the other didn't, so the MISSED flag reads as an arbitrary verdict. | Fixed by P1-1: a difference in kind is visible at a glance (a smooth line in the wrong colour beside a wobbly line in the right colour). |
| P1-3 | Clarity: the problem | The problem act is 2.2 s, and "By eye, misses ship." shows lines leaving the frame with **no consequence**. The viewer never meets the pain (a customer hits the bug, a pod answers wrong). | Open on a consequence: a run ships, a pod downstream answers ✕, and the caption reads "It passed review. It broke later." In the 60 s cut this is FELT, bars 1–5. In a 25 s v3, give it at least 4 s. |
| P1-4 | Word rules (W4, W6) | Jargon before the picture, and units: "Spec", "Fail-first · fails on the old copy", "OLD COPY", and the caption "Real catch, this series: whale snapped 1.26 → 0.11 rad/frame." (11 words, units no viewer can feel, 32 px, the smallest caption in the series). | Cut the six-station strip and the station headings. Use the verbs **Check · Stop · Learn**. Replace the catch caption with "Real catch: our whale turned too fast." (7 words), with a source chip "Whale Line · The brief v1". Keep the numbers in NOTES. |
| P1-5 | Clarity: symbol | The gate glyph is two hatched boxes on posts. It reads as a pillar or an hourglass, and the "opening" (the actual check) is a pale gap. The dashed tolerance lines float detached to the left. | Draw a doorway: two posts and a lintel with the opening at line height, and the kind-icon on the lintel. Drop the detached dashed band. Pass = the opening glows. Stop = the bar drops across the opening (keep that; it works). |

## P2: should fix

| # | Lens | Defect | Remedy |
|---|---|---|---|
| P2-1 | Coherence | Counters disagree. In the story: RULES 05 → 06 (at fail-first) → 07. In the payoff: "RULES 6 → 7" with 7 gates shown and zero-padded chips "01…07". Fail-first *incrementing* the count implies gate 06 was new, which contradicts the story. | One counter, no padding: "rules 6" from the first frame, "6 → 7" only when the new gate appears. Don't increment on fail-first. |
| P2-2 | Clarity: scale | Counters are 20 px mono at the top right. MISSED, OLD COPY and the gate numbers are 18–20 px chips. On a phone these are about 6–7 px, and they sit far from the focal point. | Counter ≥ 28 px, next to the gate it counts. The MISSED flag label ≥ 24 px, or drop the label and let a pod's ✕ carry it. |
| P2-3 | Word rules (W1, W10) | Not-this: "A gate proves the absence of known failures — not quality." is 11 words with an em dash, and uses "proves", which the cautions avoid. Belief: 9 words. | Not-this: "Passing means no known failures. Not quality." (7). Belief: "Machines check every run. Misses become rules." (7). |
| P2-4 | Correctness of the metaphor | The payoff row is a **funnel** (gates 01–05 have wide slots with stub walls), which says "rules get stricter" (NOTES admits this). | With P1-1: seven gates, seven different icons, equal slots. The run threads all seven, one per beat, and gate 07's icon is freshly outlined. |
| P2-5 | Character | The whale perches on the gate and "stomps": it supervises but never *does* the work. | The whale *builds* the new gate (carries the lens icon and sets it on the lintel, with a squash on placement). That is the only push-in. |
| P2-6 | Coherence | NOTES headline says "Prove it at the *gate*." The film says "Check it at the *gate*." "Prove" breaks the caution in RESEARCH §2. | Fix NOTES to "Check". |
| P2-7 | Honesty | The fail-first idea ("every fix ships with a check that fails on the old copy") is shown as gate 06 stopping an orange run labelled OLD COPY. Without the words, it looks like an ordinary fail. | In v3, picture it: the whale fixes a run (the wobble is smoothed), and the *old* wobbly version is replayed and bounces off. Caption: "The check must catch the old mistake." (7). Or drop it from the 25 s cut and keep it for the 60 s MOVE act. |

## P3: nice to fix

- P3-1. The escape's false-pass flash uses the same olive as an honest pass. That is correct in principle, but it is unreadable with the sound off. After P1-1, keep the olive flash on the wobble gate (it really did pass that check) and let the colour mismatch carry the miss.
- P3-2. The end hold is about 2.4 s of a static row before the lockup. Add a quiet run threading the row on the belief, which keeps it alive (LONGFORM P4).
- P3-3. The two slot-edge flashes plus the olive glow put three accents in a 0.3 s window at 6.6 s. Merge them into one (N11 focal spacing).
- P3-4. The score: give the new colour gate its own timbre (a glass ping), so the ear hears "a new kind of check", not "the same check again".

## Blind-spot probes

- **Hardest decision:** how to draw "a rule" as a single picture. The author chose aperture size because it animates cleanly (a fit/no-fit test). That choice is the source of P1-1 and P2-4.
- **Rejected alternative (implied):** gates with different checks. It was probably rejected as "too many symbols". But an icon on the lintel is one extra mark, not a new symbol, and it stays inside the lexicon.
- **Least confident (per NOTES):** the funnel and the off-screen gates 01–05. The author knew. The review confirms these are not polish issues: they make the film say the wrong thing.

## Ordered fix list

1. Re-model the gate as a *kind* of check with an icon (P1-1, P1-5), and the escape as a difference of kind (P1-2).
2. Problem-first opening with a consequence (P1-3).
3. Word pass: cut the jargon and units, three verbs, the rewritten not-this and belief, NOTES headline (P1-4, P2-3, P2-6).
4. Counter coherence and scale (P2-1, P2-2).
5. Payoff row: equal slots, seven icons (P2-4). The whale builds gate 07 (P2-5).
6. Fail-first: picture it or move it to the 60 s cut (P2-7).
7. P3 polish and the sound timbre.
8. Re-run `tool.cjs gate gate`, then the sound-off jury (LONGFORM J1): a fresh agent gets 6 stills and must say "machines check each run, and a miss of a new kind becomes a new kind of check".

## Lesson atom

`pattern · motion-film · check-metaphors`: **When a film is about a check, an escape must differ in kind, not in degree.** If the escaped item is just a smaller version of the caught one, the picture teaches "tighten the threshold" instead of "add the missing check". Detection: in the storyboard, the escape and the caught failure must differ along a visual axis the gate does not test. Add this to the LONGFORM-60 review list for clusters 07 and 06.
