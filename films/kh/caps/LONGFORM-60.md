# LONGFORM-60: the one-minute, problem-first CETI capability film

Design schema `ds-longform60-v1` (meta-design). This covers the whole category, not one film:
**a 55–65 s Kinetic Hydrography film about one CETI capability. It starts with a pain the viewer already has and ends on a belief they can act on.**
It sits on top of KH 1.0.0 and the series layer (`series.js`). Everything in `SERIES.md` and `AGENT-BRIEF.md` still applies unless this file overrides it by name.

Assumptions: the viewer watches on a phone with the sound off, is a professional rather than a mathematician, and gives the film about 5 s before scrolling. There is no voice-over. The film has to read from pictures and captions alone.

**Why this format exists.** Manu said of the 25 s cuts: "Conserve and stitch are awesome but we could … show more about the challenge people have or the problems, and frame the solution more clearly … with clearer words. We use simple ideas and symbols and I like that." So the 25 s cut becomes the middle third of a longer film. The new time goes to the **problem** (felt, then explained), a **real case**, and an **honest limit**. The symbol set stays the same.

---

## 1. The brief, classified

| Axis | Value |
|---|---|
| Medium | 1920×1080, 60 fps canvas film, 55–65 s, KH air mode over the chart ground, plus a score |
| Audience | Engineers, leaders, learners and researchers in Manu's courses and feeds. They know AI tools, not the maths |
| Purpose | Make the viewer think "that's my problem", show the one move that fixes it, prove it once with a real run, say where it stops |
| Constraints | KH tokens only; gates in `tool.cjs`; one Wada per film; the existing symbols; captions of 8 words or fewer; no invented numbers |
| Success | A fresh viewer, with the sound off, can state (a) the problem in their own words and (b) the move in one plain sentence |

**Derived from the 25 s schema by four named edits:**
- `Lengthen(25→60)`: the act table is rebuilt on a 32-bar grid (§3). Tokens, symbols and gates are kept.
- `ProblemFirst`: a cold open with the pain. The title card moves from 0 s to the hinge at bar 6. The old "mess" act (3–5 s) becomes two acts: FELT and WHY.
- `PlainWords`: the six-station strip becomes a three-word verb strip, and jargon is allowed only after its picture (§5).
- `AddEvidence+Limit`: a CASE act carries one real, sourced run, and a LIMIT act *shows*, not just says, what the move cannot catch.

---

## 2. Typed slots (what every instance must fill)

These are the same slots as `storyboards/SCHEMA.json`. Types are in brackets.

| Slot | Type | Rule |
|---|---|---|
| `title` | str, one `<i>accent</i>` | Everyday words only, 6 words or fewer. The accent word is the everyday name of the move's symbol (gate, pin, seam, parts). |
| `problem_in_viewer_words` | str of 12 words or fewer | First or second person. Something the viewer has said at work. No jargon. |
| `hook` | picture + words | The first 3 s: the pain happening to the whale, mid-action. Never a title. |
| `why_it_keeps_happening` | picture + str | One cause, shown repeating three times. |
| `stakes` | str | What it costs: wrong answer shipped, trust lost, time burned. |
| `solution_hint` | caption of 8 words or fewer | The last WHY caption. It names the move as a plain verb phrase. |
| `symbols` | 2–5 from the lexicon (§4) | The whale and the line are always in. Add 3 at most. |
| `mechanism_beats` | list of {t, picture, words, sound}, 3–6 items | The MOVE act. Each beat is one visible cause and its effect. |
| `real_case` | {claim, numbers, source, verified} | Evidence. It names a source, or says "Illustration" on screen. |
| `honest_limit` | picture + str | Something the move lets through, *shown*. |
| `not_this` | caption of 8 words or fewer | The misconception from RESEARCH.md. |
| `ending_pattern` | slug | Unique across the series registry. |
| `end_belief` | caption of 8 words or fewer | Imperative or plain claim. The viewer could act on it Monday. |
| `terms` | list of {term, pictured_at, named_at} | Feeds gate N3. |

---

## 3. Acts, time budget and beat grid

**Grid.** The film is 32 bars of 4/4 at 120–132 BPM. DUR = 32 bars plus a 0.3 s tail:

| BPM | bar (s) | DUR (s) |
|---|---|---|
| 120 | 2.000 | 64.3 |
| 124 | 1.935 | 62.2 |
| 128 | 1.875 | 60.3 |
| 132 | 1.818 | 58.5 |

Every event lands on a beat or a half-beat, and every act boundary lands on a bar line. Act lengths may move by ±1 bar if the total stays at 32.

| # | Act | Bars | ≈ s @128 | Share | Job | Camera | Text allowed |
|---|---|---|---|---|---|---|---|
| 1 | **FELT**: the pain, as a person lives it | 1–5 | 0.0–9.4 | 15% | The whale *is* the viewer. Show the failure and its consequence, which must land on someone (a pod gets a wrong answer, a page misleads). | Close: z 1.4–1.8, on the whale | 2 captions, viewer words, no jargon |
| 2 | **WHY**: why it keeps happening | 6–10 | 9.4–18.8 | 16% | Title card on bar 6 (the hinge). Then pull back and show the *cause*, repeating three times (the "keeps happening" device). End on the solution hint. | Pull back to z ≈ 1.0, revealing the pattern | Title + 1 cause caption + 1 hint caption |
| 3 | **MOVE**: the one move | 11–16 | 18.8–30.0 | 19% | The symbol appears, acts, and works. 3–4 beats, then the jargon name, after the picture. | Medium, z 1.1–1.3. One push-in, on the key moment only | 3-verb strip, labels of 4 words or fewer, 1 naming caption |
| 4 | **CASE**: the move on a real run | 17–22 | 30.0–41.3 | 19% | The same picture at a bigger scale, with Manu's real numbers on a "Real run · source" card. | Steady wide, slow drift | 2 captions + card (numbers on the card, not in captions) |
| 5 | **LIMIT**: an honest limit | 23–25 | 41.3–46.9 | 9% | Something gets through the move. Show it, then the not-this line. | Still, then one slow push to the thing that slipped | 2 captions |
| 6 | **PAYOFF**: the episode's ending pattern | 26–29 | 46.9–54.4 | 12% | The registered ending from SERIES.md: the big, satisfying image. | The ending's own move, usually a wide reveal | None, or a counter chip |
| 7 | **BELIEF** | 30–31 | 54.4–58.1 | 6% | The end-belief caption over the settled image. | Still, breathing only | 1 caption |
| 8 | **LOCKUP** | 32 + tail | 58.1–60.3 | 4% | `SERIES.lockup` | Still | Lockup |

**Pacing rules**
- P1. **Slow down, filter noise.** FELT and WHY allow at most **one focal event per bar**. MOVE and CASE allow at most one per beat. Two focal events must be ≥ 0.4 s apart.
- P2. **The three-times device.** In WHY the failure recurs three times, accelerating (every 2 beats, then 1, then ½). That rhythm is what says "keeps happening" without words.
- P3. **The hinge.** Bar 6 starts with ½ bar of near-silence and stillness, then the title. It is the only full stop in the film.
- P4. **Hold.** No static frame lasts longer than 2.0 s before BELIEF. In BELIEF only breathing, the whale's idle and caption fades move.
- P5. **Callback.** The PAYOFF image must visibly undo the FELT image: the same framing, with the failure that happened in act 1 now impossible.
- P6. **Captions.** At most one new caption per 2 bars. Every caption is held for the full read time (gate G1).

---

## 4. Symbol lexicon (series-wide: one meaning per symbol, forever)

The vocabulary stays simple. These are the same marks as in the 25 s films, now fixed to one meaning each so 100 storyboards stay mutually legible.

| Symbol | Means | States | Colour role |
|---|---|---|---|
| **Whale** | The one doing the work: you in FELT, the agent or checker afterwards | idle · focus · squash (effort) · delight · spark (payoff) · blink | Its own rig colours |
| **Line** | The work over time: a run, a document, a memory, a brief | calm · wobbly · broken · split · fused | Ink (navy) or law colour |
| **Pin** | Something that must not change | hollow (unnamed) · pinned · tugged · home | Law colour; copper when tugged |
| **Gate** | A machine check the line passes through | open · pass glow · closed on a fail | Law colour for pass, alarm for stop |
| **Seam** | Where two parts meet, which is where checks live | dashed · checked tick · discord glow | Teal for agree, terracotta for discord |
| **Atom** | A small labelled part (card with a coloured tab: claim, evidence, rule) | loose · snapped · refused | Tab colour = type |
| **Pod** | An AI agent that receives work | arriving · reading · answers ✓ / ✕ · leaving | Neutral, with a ✓/✕ chip |
| *Props (no new meaning)* | flag = missed/escaped · ring = a measurement happened · tick = a receipt or ledger entry · counter chip = a running count | | Alarm for flag; ink for the rest |

**Symbol rules**
- S1. A film uses the whale, the line, and **at most 3** other symbols.
- S2. No more than 7 new elements on screen in any view (the working-memory cap).
- S3. A symbol is introduced by *doing* its job once before any label touches it.
- S4. **One alarm colour per film** (copper, rust or raw sienna, according to the Wada set). The alarm means "this is the problem" and nothing else.
- S5. Before the move exists (FELT and WHY), failures show as the *consequence* (a pod's ✕, a broken thread, a duplicate), not as the mechanism's alarm.

---

## 5. Word rules ("clearer words")

| # | Rule | Check |
|---|---|---|
| W1 | Captions are **8 words or fewer**; titles 6 or fewer; labels 4 or fewer; counters 3 or fewer. A number, an arrow or "·" counts as a word. | Regex count on READ (gate N4) |
| W2 | **Name the pain in the viewer's words first.** FELT captions are things people say at work ("It worked yesterday.", "Who changed this?"). Use first or second person, everyday nouns, no domain terms. | Jargon list = 0 hits in FELT and WHY (gate N5) |
| W3 | **Plain verbs.** Prefer check, stop, catch, fit, match, keep, pin, break, fix, send, miss, label, write down. Don't use leverage, ensure, enable, robust, seamless, novel. | Banned-word list |
| W4 | **Picture first, then the name.** A jargon term (spec, invariant, conserved, atom, typed, operad, sheaf, seam-as-term, ledger, drift, provenance, gate-as-jargon) first appears at least 1 beat after its symbol has been drawn *and has acted once*. | `terms[]` (gate N3) |
| W5 | **Hint the solution in plain words.** The last WHY caption names the move as a plain instruction ("Write down what must stay true."). The first MOVE caption repeats it as an action. | Storyboard slot `solution_hint` |
| W6 | **No units the viewer can't feel.** No rad/frame, LUFS, H⁰ or px on screen. Translate ("the whale turned too fast"). | Banned-unit list |
| W7 | **Numbers need a source.** Any digit on screen sits on a "Real run · <source>" card, or next to the word "Illustration". | Gate N8 |
| W8 | **One voice at a time.** At most 2 text items legible at once (a caption plus one label or counter). No station strip together with a station heading: pick one. | Gate N7 |
| W9 | **Short words.** At most 1 word of three or more syllables per caption in FELT and WHY, and at most 2 elsewhere. | Syllable counter |
| W10 | Captions are sentences: capital letter, full stop, no em dashes, no semicolons. | Regex |

Sizes at 1080p, so text survives a phone screen: captions ≥ 36 px, labels ≥ 24 px, counters ≥ 28 px, mono strip ≥ 20 px. Contrast is inherited: navy on paper is 14.3:1 and slate on paper is 8.7:1 (computed with `KH.contrast`).

---

## 6. Camera grammar

| Act | Default | Allowed | Never |
|---|---|---|---|
| FELT | Close (z 1.4–1.8), whale-led | A small follow pan | Wide establishing shot (it hides the person) |
| WHY | Pull back (z → 1.0) to reveal the repeating pattern | One reveal | A push-in |
| MOVE | Medium (z 1.1–1.3) | **One** push-in (≤ 0.6 z per second) on the decisive moment: snap, refuse, catch | Two pushes, or panning during a caption fade-in |
| CASE | Steady wide; the card is framed with clean paper around it | Slow drift (≤ 40 px/s) | Moving the card |
| LIMIT | Still | One slow push to the thing that slipped | Fast moves |
| PAYOFF | Whatever the ending pattern needs (usually a wide reveal) | | A bounce or overshoot |
| BELIEF/LOCKUP | Still | Breathing | Any move |

Eases come from `EASE.*` only. The whale's frame-jump limits apply (≤ 30 px and ≤ 0.35 rad per frame). Pan speed is ≤ 600 px/s on screen.

---

## 7. Sound

- **Two motifs per film.** The *problem motif* is a detuned or unresolved version of the *signature sound* (for example, conserve's sagging string). The signature sound appears in tune from MOVE onward. The ear hears problem → fix.
- FELT: sparse, the problem motif only, no drums. WHY: the problem motif three times, accelerating with P2. Hinge: ½ bar of near-silence (room tone ≤ −40 dBFS), then the title tick.
- MOVE: the signature sound, cue-locked to each beat. CASE: a pulse bed with ledger ticks (fast, quiet). LIMIT: the signature plays once, **unresolved** (honesty in the harmony). PAYOFF: full resolution. BELIEF: a pad tail only.
- Every sound sits on an exported cue, and every cue has a picture event. Loudness is −16 LUFS integrated, with true peak ≤ −1 dBTP. No voice-over.

---

## 8. Audited predicates (the gates)

Precedence when gates conflict: **accessibility (G1–G5) ⊐ brief (N1–N10) ⊐ aesthetics.**

**Inherited** (already in `tool.cjs`)

| ID | Predicate |
|---|---|
| G1 read-time | ∀ READ r: (out − fo) − (in + fi) ≥ 0.6 + 0.15·words(r) |
| G2 contrast | ∀ drawn text/ground pair: ratio ≥ 4.5 (listed in CONTRAST) |
| G3 frame-jump | Whale: ≤ 30 px and ≤ 0.35 rad per frame on screen |
| G4 flash | No full-frame luminance flash. ≤ 3 flashes/s for any element > 25% of the frame |
| G5 loudness | −16 ± 1 LUFS, true peak ≤ −1 dBTP |
| G6 provenance | No hex literals; only KH tokens and `mix()`/`rgba()` of them |
| G7 eases | Only `EASE.*`, with no bounce or elastic |
| G8 spec | ffprobe reports 1920×1080, 60 fps, 48 kHz stereo |

**New for LONGFORM-60.** Films export `ACTS`, `TERMS` and `JARGON` alongside `READ` and `cues()`. READ entries gain `kind` ∈ {caption, title, label, counter, card} and `size`.

| ID | Predicate (machine-checkable) | Why it exists |
|---|---|---|
| N1 duration | 55 ≤ DUR ≤ 65, there are 32 bars, and every ACTS boundary sits on a bar line within ±1 bar of §3 | Format identity across 100 boards |
| N2 problem-before-mechanism | The first cue tagged `mech` has t ≥ ACTS.felt.out. The first `consequence` cue has t < 4 s | Manu's ask: the challenge first |
| N3 pictured-before-named | ∀ term ∈ TERMS: named_at ≥ pictured_at + 60/BPM, and named_at equals the first READ occurrence of the term | "Clearer words": no jargon before the picture |
| N4 word caps | caption ≤ 8 words, title ≤ 6, label ≤ 4, counter ≤ 3 | Phone read-time, simple words |
| N5 viewer-words | READ entries in FELT and WHY contain 0 tokens from JARGON (series list + film list), and at least one FELT caption has a first- or second-person pronoun or an everyday work noun | The pain is named in the viewer's words |
| N6 hint-before-move | A READ caption with kind=caption ends ≤ ACTS.move.in + 1 beat and matches `solution_hint` | Frame the solution clearly |
| N7 density | At every t, ≤ 2 READ entries are at full opacity (counters excluded if ≤ 3 words), and READ sizes meet §5 | One voice at a time |
| N8 sourced numbers | ∀ READ r containing a digit: r.src is set (Notion URL, skill path or repo), or an "Illustration" READ overlaps it | Honesty |
| N9 limit shown | ACTS.limit contains ≥ 1 cue tagged `limit` (a picture event: something passes the move), not only a caption | An honest limit you can see |
| N10 ending unique | `ending_pattern` is not in the registry of shipped endings | Series variety |
| N11 focal spacing | Any two cues tagged `focus` are ≥ 0.4 s apart. FELT and WHY have ≤ 1 `focus` per bar | Slow down, filter noise |
| N12 callback | A frame-similarity test between PAYOFF's first frame and a FELT frame shows the same framing (camera within 15% z and 200 px) | The ending undoes the pain |
| J1 sound-off read *(soft gate, jury)* | One fresh agent sees 7 stills (one per act midpoint), no audio, no NOTES. It must write the problem and the move in one sentence each. A second agent judges them against `problem_in_viewer_words` and `solution_hint`. Pass = both match | The real success criterion. A builder never judges its own film |

N1–N12 are mechanical. J1 is a review, and it is the one Manu actually cares about. Run it last.

---

## 9. Worked mapping: Conserve-60 (director's treatment)

Wada 84 (Seashell Pink = content, Deep Slate Green = law), copper alarm, 124 BPM, bar 1.935 s, DUR 62.2 s.
Symbols: whale, line, **pins**, pod (+ ring and ledger tick props). Ending pattern: **The shake** (unchanged).
Problem in viewer words: *"I fixed one page and broke three others."*
Terms pictured, then named: pin → "law" (bar 13), measure-ring → "checked" (bar 14), copper drag → "drift" (bar 15), ticks → "ledger" (bar 19).

| Bars · t (s) | Act | Picture | Words (READ) | Sound |
|---|---|---|---|---|
| 1–2 · 0.0–3.9 | FELT | Cold open, close on the whale (z 1.6). It edits the line (a hop and a bend). Three hollow dots ride the line, with thin threads linking them (the links). On the edit, one thread **snaps**. | "One small fix." (from 1.0) | Detuned string pluck, which sags |
| 3–4 · 3.9–7.7 | FELT | Second edit: a dot **doubles** (two pages for one thing). Third edit: a dot's little source tick falls off. A pod swims in, reads the line, and answers ✕ (copper chip). | "Three things quietly broke." · "Nobody noticed until it answered." | Plucks go flatter. The pod's ✕ is a dull thunk |
| 5 · 7.7–9.7 | FELT | The whale looks at the pod's ✕ (focus face). Hold. | (no new caption) | Silence creeps in |
| 6 · 9.7–11.6 | WHY | Hinge: ½ bar of stillness, then `SERIES.open` → "Change everything but the *laws*." | Title | Near-silence, then the title tick |
| 7–9 · 11.6–17.4 | WHY | Pull back (z 1.6 → 1.0). Ghost lines of all past edits are stacked and the dots have wandered everywhere. Three-times device: three more edits, every 2 beats, then 1, then ½, each knocking a different dot. | "Nothing says what must stay true." | The problem motif ×3, accelerating |
| 10 · 17.4–19.4 | WHY | All motion stops. The three hollow dots glow softly where they *should* be (ghost homes). | **Hint:** "So write it down. Check every edit." | One clean, in-tune A: the first time the signature sound plays |
| 11–12 · 19.4–23.2 | MOVE | Taps right to left: each dot slides home and a **pin** drops in. Labels on chips: "No broken links" · "One page per thing" · "Every claim sourced". Strip: **Pin · Check · Fix** (Pin active). | labels (≤ 4 words) | The string is tuned: the same A on each pin |
| 13–14 · 23.2–27.1 | MOVE | Free edits: the content (pink) swings wildly, but the line passes through every pin (the plucked string). A ring on each edit (Check active). | "Edit freely. The pins never move." · then "These are your laws." (bar 13, after the picture) | The A, plucked with varied brightness |
| 15 · 27.1–29.0 | MOVE | Push-in (z 1.28). A hop drags the middle pin. A copper drift line, a copper bar and "Too far" on the chip. The whale squashes and lifts, and the pin snaps home (Fix active). | "Too far? Fixed before it's saved." | The string goes flat and beats, then snaps into tune |
| 16 · 29.0–31.0 | MOVE | The ledger strip ticks once, and the copper tick is ringed. | "Every check is written down." | Soft ledger tick |
| 17–19 · 31.0–36.8 | CASE | Wide. Two lines (labelled 437 and 111) slide together and **merge** into one long line. The pins hold through the merge, and ledger ticks stream. The card fades in: **Real run · Memory graph map** / 548 entities · 2,933 links / laws broken 0 · sourced 98.8%. | "Real run: two wikis merged into one." | Pulse bed, fast quiet ticks |
| 20–22 · 36.8–42.6 | CASE | One pin is moved *on purpose*: the whale carries it, and a signed tick lands in the ledger with the chip "Types 13 → 17, logged". | "Changing a law? Write down why." | A deliberate two-note figure |
| 23–24 · 42.6–46.4 | LIMIT | Push into one sourced dot. Its source tick opens into a 60-tick grid: 47 ticks turn teal and 13 turn copper (the citation audit). The pins never noticed. | "Sourced is not the same as true." · card: "Citation audit · 47 of 60 faithful" | The signature A plays once and does **not** resolve |
| 25 · 46.4–48.4 | LIMIT | Pull back to the line. | "Noether-inspired. We choose the laws." | Room tone |
| 26–29 · 48.4–56.1 | PAYOFF | **The shake.** The FELT framing is restored (z 1.6, same three dots). The line is shaken hard, all three pins hold, and the counter "broken 0" never moves. Stillness, delight and a spark. *(Callback: the thread that snapped in bar 1 now holds.)* | counter only | The A strummed on every 8th, then resolved |
| 30–31 · 56.1–60.0 | BELIEF | Still line, whale breathing. | "Name what must never change. Check every edit." (8) | Pad tail |
| 32 · 60.0–62.2 | LOCKUP | `SERIES.lockup` | lockup | |

Sources: *Memory graph map* (548 / 2,933 / exact 0 / prov 0.988 / types 13→17 via RE-BASELINE; citation audit 47/60). RESEARCH.md §4 and §3.

---

## 10. Worked mapping: Stitch-60 (director's treatment)

Wada 166 (Grenadine Pink = claim tab, Deep Slate Green = evidence tab, Naples Yellow = rule tab), rust alarm, 128 BPM, bar 1.875 s, DUR 60.3 s.
Symbols: whale, line, **atoms**, **seams**, **pod**. Ending pattern: **Seal and send** (unchanged).
Problem in viewer words: *"I pasted everything in, and it treated a guess as fact."*
Terms pictured, then named: tab colour → "typed" (bar 12), socket joint → "seam" (bar 14), finished tree → "composed" (bar 16).

| Bars · t (s) | Act | Picture | Words (READ) | Sound |
|---|---|---|---|---|
| 1–2 · 0.0–3.8 | FELT | Close on the whale shovelling a heap of identical grey cards (no tabs) into one huge card ("the prompt"). | "Just paste everything in." | Paper shuffles, a muddy low note |
| 3–4 · 3.8–7.5 | FELT | A pod reads the giant card and answers. Its answer card shows one line circled in rust: a *guess* card has been used as *proof*. | "It treated a guess as proof." | A bright note goes sour |
| 5 · 7.5–9.4 | FELT | The whale pastes *more*. The card grows and the pod's ✕ count goes up to 2. | (no caption) | The sour note twice |
| 6 · 9.4–11.3 | WHY | Hinge, then the title "Context is *composed*." | Title | Near-silence, then the title tick |
| 7–9 · 11.3–16.9 | WHY | Pull back. The heap spills apart: every card looks the same, so nothing can tell a guess from a fact from a rule. Three-times device: three cards drop into the wrong place, accelerating. | "Every piece looks the same." | The problem motif ×3 |
| 10 · 16.9–18.8 | WHY | The cards freeze, and a faint coloured tab ghosts onto each one. | **Hint:** "Label each piece. Check where they join." (7) | The first clean signature chime |
| 11–12 · 18.8–22.5 | MOVE | Tabs colour in: pink = guess, green = evidence, yellow = rule. A tree of sockets hangs over the line, and each socket shows its colour. Strip: **Label · Fit · Check**. | labels "guess" · "evidence" · "rule" · then "Typed parts." (bar 12) | Three tuned chimes, one per colour |
| 13–14 · 22.5–26.3 | MOVE | Matching cards snap. Push-in (z 1.3): the whale nudges a pink guess card toward a green socket, and it is **refused at the joint** (rust ✕, small shake, drop). | "A guess can't fill a proof slot." · then "Checks live at the joints: seams." (bar 14) | Snap = a clean click. Refuse = a muted thud |
| 15 · 26.3–28.1 | MOVE | Two separate branches fill at the same time, with pulses climbing both. | "Separate parts fill at the same time." | Two clicks in unison |
| 16 · 28.1–30.0 | MOVE | Receipts (ticks) ripple up to the root. | "Every joint gets a receipt." · strip completes | Rising arpeggio |
| 17–19 · 30.0–35.6 | CASE | Wide: **three** trees side by side. A shared trunk of 9 cards lights up in all three (the spine). Card: **Real run · Context Atoms, 16 Oct 2026** / 3 briefs · 41 · 26 · 41 parts · all GREEN · 9 shared. | "Real run: three briefs, one shared spine." | Pulse bed, receipts ticking |
| 20–22 · 35.6–41.3 | CASE | Zoom to one tree's evidence port. An "action" card tries it and is refused (the JEV case), with the chip "action ≠ evidence". | "Wrong kind of part? Refused, every time." | Muted thud, then a click |
| 23–24 · 41.3–45.0 | LIMIT | A green evidence card with **wrong content inside** (a rust smudge visible in its lines) snaps in cleanly. It gets a receipt anyway. | "A wrong fact with the right label fits." (8) | The click plays, but the chord stays unresolved |
| 25 · 45.0–46.9 | LIMIT | Hold on the smudged card. | "Consistency is not correctness." | Room tone |
| 26–29 · 46.9–54.4 | PAYOFF | **Seal and send.** FELT framing (z 1.6). The tree folds into *one small* brief card (the callback: where act 1 had a huge pasted card, this one is small and stamped). Stamp tick. A pod takes it, answers ✓, and leaves. | card header "BRIEF · checked" | Stamp, whoosh, a resolved chord |
| 30–31 · 54.4–58.1 | BELIEF | The ghost tree with the whale above it, spouting. | "Small labelled parts, checked at every joint." (7) | Pad tail |
| 32 · 58.1–60.3 | LOCKUP | `SERIES.lockup` | lockup | |

Sources: *Context Atoms — operadic stitch* (3 jobs: 41 / 26 / 41 atoms, GREEN, 9-atom spine); *JEV × JAX × The Twenty* ("A claim cannot occupy an evidence port"). RESEARCH.md §1.

---

## 11. Gate-v3 clarity plan (short; full review in `gate/REVIEW-v3.md`)

The 25 s Gate is the episode the user flagged. Its picture has one dimension: a wobble either fits a slot or it doesn't. So the "escape" looks like a smaller wobble that should have been caught, and the "new rule" looks like "tighten the slot". That teaches the wrong lesson. The fix keeps the gate symbol but changes what it checks:

1. **A gate checks one *kind* of thing, drawn on its lintel as an icon** (wobble, colour, gap). Runs differ in kind, not in degree.
2. **The escape differs in kind.** It is a smooth run that fits the wobble gate perfectly but is the *wrong colour*. That is the real catalogued escape ("declared IBM Plex, rendered Inter": the check read the declared name, not the face that actually rendered). A pod downstream answers ✕ → MISSED flag.
3. **The new rule is a new gate with a new icon** (a colour lens), not a narrower slot. Counter "rules 6 → 7" with no zero-padding, consistent from start to finish.
4. **Problem-first words.** FELT: "It passed review. It broke for a customer." WHY: "Eyes get tired. Runs don't stop." Hint: "Let a machine check every run."
5. **Cut** "Spec", "Fail-first", "OLD COPY" and the rad/frame caption. Replace that caption with "Real catch: our whale turned too fast." (source: *Whale Line — The brief v1*: 1.26 rad/frame against a 0.35 limit, fixed to 0.11; the numbers stay in NOTES, not on screen). Kill the station strip. Counters go next to the gate, at ≥ 28 px.
6. **Payoff:** a row of 7 gates with **7 different icons** (not a funnel). The run threads all of them, and the last gate (colour) has a fresh outline.
7. **Not-this caption** within 8 words: "Passing means no known failures. Not quality."

As a 60 s film: FELT bars 1–5 (a run ships, a pod ✕, "It passed review. It broke for a customer."), WHY 6–10 (the title, then three runs shipped by eye; the third one wobbles), MOVE 11–16 (the gate stops the wobble; a fix ships with a check that stops the old copy, *pictured* as the old run bouncing), CASE 17–22 (the whale-snap real catch, then "Jury: 116 passed, 0 failed" on a card), LIMIT 23–25 (the wrong-colour run passes all gates), PAYOFF 26–29 (rules accrue: a new colour gate is added, then the row of 7), BELIEF ("Machines check every run. Misses become rules." — 7 words).

---

## 12. Refinement log

- σ1 (brief ⊐ aesthetics): dropped the six-station strip in favour of a three-verb strip. Six stations in 12 s was the source of the jargon density in all three v2 films.
- σ2 (accessibility): caption size floor raised from 32 to 36 px. The gate's 32 px catch caption was the smallest text in the series.
- σ3 (brief): moved the title from 0 s to bar 6. A title before the problem names a mechanism the viewer has not seen, which breaks W4.
- σ4 (brief): LIMIT must contain a picture event (N9). In v2 every not-this was caption-only, so the limit read as a disclaimer, not as knowledge.
- σ5 (identity check): re-ran §8 over both worked mappings. Every caption is ≤ 8 words; jargon in FELT/WHY = 0; every term is named after its picture; the numbers sit on sourced cards. No further edits. **Converged** for the schema. The films themselves are unbuilt, so G1–G8 and J1 stay open until a build exists.
