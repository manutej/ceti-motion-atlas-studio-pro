# 02 · gate v3.3: Every new mistake gets a *check*.

## v3.3 (word pass; v3.2 is kept as `film-v3.2.js`)

- **No "gate" in any on-screen word**; the picture is still a gate. The lockup short name is now "Check".
- **FELT:** "Your AI helper wrote a report." The page sits parked at the left and its lines write in. Then "It passed every check." (it passes spelling and totals), then "The customer still found a mistake." (✕ at 3.8 s).
- **Title:** "Every new mistake gets a *check*." It is fully visible for 2.5 s (5.88–8.38).
- **Captions:**
  - "Each check looks for one kind of mistake."
  - "Nothing checks the font." (2.2 s hold)
  - "Turn the mistake into a new check."
  - "Now the wrong font stops here." (pointer)
  - "A new kind of mistake still slips through."
  - "Passing means: no mistakes we know of."
  - "Every new mistake becomes a new check."
- **Card:** "True story · 7 mistakes, 7 new checks" with "Source: our own list of mistakes". It is up 3.6 s; the main line is 64 px and the other lines 34 px.
- **Icons are 92 px:** "abc" with a red wavy underline, "1+2", "Aa", "1 2 3". New gates fade in at full size, so the "=" glyph at about 12 s is gone.
- **DUR 30.62 s**, 0.6 s over the 30 s ceiling. The new read holds force it: the title's 2.5 s, the extra FELT caption, the font caption's 2.2 s and the 3.6 s card. Caption fades are already down to 0.2/0.15 s.

---



## v3.2 (lay-jury pass; v3.1 is kept as `film-v3.1.js`)

The lay jury (`LAY-JURY.json`, O2: FAIL on v3.1) got the gist but not the words or the actors. The structure is unchanged; the semantics are now everyday:

- **The work and the actors.** The moving thing is a **report**: a page with an "Aa" heading and text lines, riding the line with its trail. Caption at 0.45 s: "Your report passed every check." The grey fish is labelled **customer** (0.3 s to the lockup). The whale is labelled **you** (0.45–4.25 s).
- **Each gate has a plain word under its icon:**

  | Gate | Icon | Label | Tint |
  |---|---|---|---|
  | 1 | wavy underline | spelling | olive |
  | 2 | Σ | totals | slate |
  | 3 | "Aa" in the expected sans font | font | ivory buff × driftwood |
  | 4 | arrow | page order | mist |

  Each mistake is drawn on the page in the alarm colour: a wavy underline, a ≠ on the total, the heading set in a curly italic font, or the page upside-down (wrong order).
- **The escape is the wrong font.** The page's "Aa" is set in Fraunces italic, in the darkened sienna accent. The new font gate's icon shows the expected plain "Aa".
- **Words.**
  - Title: "Check each report at the gate."
  - Captions:
    - "The customer still found a mistake."
    - "Each gate checks one kind of mistake."
    - "No gate checks the font."
    - "Turn the miss into a new check."
    - "Now the wrong font stops here." (an ink arrow points at the closed font gate; the stopped report now holds there for 1.0 s)
    - "A new kind of mistake still slips through."
    - "Passing means no known mistakes. Not quality."
    - "Machines check each report. Misses become new checks."
  - I used "each", not the requested "every": the O1 syllable counter scores "every" as 3 syllables, which pushed that line to grade 6.7.
- **Card:** "True story · 7 misses, 7 new checks" with "Source: our own error log". It is up for 3.35 s, the smallest text is 28 px, and it is marked `card: true`.
- **Pace:** captions between 10.8 and 16 s now get 2.55–2.6 s windows. DUR is 29.22 s.
- **O1:** INTENT and TERMS are declared. "report" is in TERMS because the expert regex matches `repo*`. The report page is on screen from 0.42 s, before the word appears at 0.45 s.

---

# (v3/v3.1 notes follow)

Wada 243 (Raw Sienna, Ivory Buff, Olive Green, Slate). 128 BPM. DUR 27.38 s (25-s series format; the 25–30 s Goal wins over the 60-s grid).
Olive = a check passed. Raw Sienna = the one alarm: the wrong-colour run, the pod's ✕, the miss flags. Text is ink or slate on paper or a chip.
v2 is kept as `film-v2.js`, `score-v2.py`, `NOTES-v2.md`, `sheet-v2.png`. Brief: `storyboards/stitch/gate-v3.prompt.md` (GREEN), applying `REVIEW-v3.md`.

**The model.** Each gate checks one *kind* of thing, shown as an icon on its lintel: wobble, gap, then colour, then direction. All openings are the same size. Outcomes are computed, not hand-timed: a run is checked by every gate that exists when it arrives, and it stops at the first gate of its own kind. Otherwise it reaches the pod, which answers ✓ only for a good run. The escape is a smooth, whole run of the wrong colour. It passes the wobble and gap gates honestly, because neither one looks at colour (the "declared one font, rendered another" escape). The fix is a **new kind** of gate, not a narrower slot.

## Beat sheet

| t (s) | act | picture | caption |
|---|---|---|---|
| 0.0–4.1 | FELT | Close (z 1.45). A smooth sienna run passes the wobble and gap gates; each icon gets an olive tick. At 2.15 the pod answers ✕ and a flag falls. The whale's eye goes wide. | "It passed every check." · "Then a customer found the bug." |
| 3.9–6.5 | hinge | The scene stills under a paper veil and the camera pulls back to z 1.2. Title card. | "Check it at the *gate*." |
| 6.45–8.6 | KINDS | A wobbly run stops at the wobble gate (6.88). A gapped run passes wobble and stops at gap (8.03). | "Each gate checks one kind of thing." |
| 8.65–10.5 | KINDS ×3 | The wrong colour comes again, faster (10.04 ✕, 10.51 ✕). Passes both gates both times; the flag pile grows to three. | "No gate looks at colour." |
| 10.5–12.7 | MOVE | The whale picks the top flag (11.25), turns, and folds it into a colour icon. One push-in (z 1.45). The posts rise and the icon lands on the new lintel with a squash (12.35). | "Fold the miss into a new check." |
| 12.75–15.7 | MOVE | The old sienna run is replayed: it passes wobble and gap, then stops at the colour gate (13.78; spark). The other flags fade. The fixed slate run threads all three, and the same pod answers ✓ (15.68). | "The old mistake must stop here now." |
| 16.1–18.55 | CASE | A Real run card: "7 misses, 7 new checks", sourced to the Limits & escapes register (Notion). The card stands alone, with no caption under it. | — |
| 18.6–20.7 | LIMIT | A backwards run (chevrons pointing the wrong way) glows through all three gates. Pod ✕ (19.97), and a fresh flag falls. The thunk is left unresolved. | "The next new kind still gets through." |
| 20.8–22.9 | not-this | The whale picks the fresh flag and folds it into an arrow icon. A fourth gate stands (22.05). | "Passing means no known failures. Not quality." |
| 22.98–25.25 | PAYOFF / BELIEF | A good run threads all four gates. The same pod answers ✓ (24.75), with whale spark and delight. ✓ holds to the end. | "Machines check every run. Misses become new checks." |
| 25.25–27.38 | lockup | `SERIES.lockup` | |

## Which stitched piece each part came from

- Role, constraints, KH style: `role.director@v1`, `c.*@v1`.
- FELT: `hook.sb-07-01@v1` + `problem.sb-07-01@v1`. **Changed:** the whale watches rather than stamping. The gates' olive ticks are the "stamps", so the gate is pictured before it is named.
- KINDS: `metaphor.sb-07-01@v1` (icons on lintels, equal openings), cut to two kinds at the start. The three-times device comes from sb-07-01 and sb-07-03 WHY, with the sb-07-03 flag pile.
- MOVE: `mechanism.sb-07-03@v1` (pick flag, fold into icon, set on a new lintel, replay the old mistake, fixed run passes). **Changed:** "screen/page" became "wobble, gap → colour", so the escape is a visible difference of *kind* (REVIEW P1-1/P1-2). Dropped "A miss that slipped by is an escape." (no time, and it is jargon). The fin-point beat is cut.
- CASE: `case.sb-07-01@v1`. The number is only on the Real run card, with its source. **Changed:** the font caption ("A page asked for one font, got another.") was dropped so that only two text items are on screen at once. The font escape survives as the film's own picture: a smooth run whose colour no gate checked.
- LIMIT: `limit.sb-07-03@v1` (a picture, then a fresh flag falls). **Changed:** "pale print" became a *backwards* run, because a pale run would be caught by the new colour gate (the risk sb-07-03 itself flagged). The words are kept.
- Not-this: `notthis.sb-07-01@v1`, verbatim. Ending: `ending.sb-07-01@v1` (pod-answers-yes: the flag becomes the fourth gate's icon, and the same pod answers ✓). **Changed:** the backwards run is not "turned round". A good run threads all four gates instead (25 s budget). Belief: `belief.sb-07-01@v1`, verbatim.

## What changed vs v2 (REVIEW-v3)

- P1-1/P1-2/P1-5/P2-4: gates are doorways with a kind icon on the lintel. Slots are equal, the dashed tolerance band is gone, and so is the funnel. The escape differs in kind (colour), and the new rule is a new kind (colour lens), not a tighter slot.
- P1-3: the film opens on the consequence (pod ✕ at 2.15 s). The title comes after it (4.17 s).
- P1-4/P2-3/P2-6: no Spec/Fail-first/OLD COPY, no station strip, no units. All captions are ≤ 8 words at 40 px. Not-this and belief are rewritten.
- P2-1/P2-2: counters removed. They were digits without a source (N8), and the gates themselves count.
- P2-5: the whale builds both new gates (carries, folds, sets, squash). That is the only push-in.
- P2-7: fail-first is pictured as "the old mistake must stop here now" (a replay stopped by the new gate).
- P3-3/P3-4 (sound): one bell per kind (four pitches). The escape's bells are 30 cents flat. ✕ is the bell muffled to a thunk. The new gate rings its own bell on landing.
- The score is −16.2 LUFS with true peak −1.2 dBTP.

## Pass 2 (coordinator: "reads small")

- Layout ×1.3–1.6. Gates are at x −560/−220/120/460 (340 apart), and the pod is at 863. Each gate is 400 px tall on screen at z 1.0. Icons are 76 px across with 5 px strokes. Runs are ≥ 9 px. The pod is 140 px, its answer chip 92 px, and the flags are ×2.
- Run speeds are scaled ×340/260, so every gate crossing, stop and answer stays at the same time.
- Camera: FELT z 1.12, story z 1.0 centred at x 180 (the gates fill about 12–65% of the width and the pod sits at about 85%), push-in z 1.3 on the build. ay is 620.
- Each kind has its own tint. The tint lightly fills that gate's opening (26%) and its pass glow uses the same colour: wobble = olive, gap = slate, colour = ivory buff × driftwood, direction = mist. The icon marks use the same colours.
- The colour gate's icon is now a solid swatch of the EXPECTED colour (slate, the good runs' colour), so the sienna escape visibly mismatches it. The brief said "sienna swatch", but a sienna swatch would say sienna is expected.

## Known weaknesses

- About 27.4 s, which is over the "about 26 s" fact but inside the 25–30 s Goal. Read-time floors on 11 captions set the length.
- The pod is a dark slate fish shape. The link "pod expects slate, got sienna" is implicit, carried by the half-slate / half-sienna colour icon.
- The FELT framing (z 1.45) and the final framing (z 1.23) differ by 17%, just outside N12's 15%.
- No `storyboards/final/gate.json`. The sb60 schema is for 55–65 s boards, and this brief keeps edits inside `gate/`.
