# 01 · stitch60 — "Give every note a *label*." (LONGFORM-60)

Brief: `storyboards/stitch/stitch60.prompt.md` (operadic-stitch, GREEN, prompt_hash c19614112251). Storyboard: `storyboards/final/stitch60.json` (validates against `SCHEMA.json`; mechanism steps equal the MOVE beats).
Wada 166 · 128 BPM (beat 0.469 s, bar 1.875 s) · 32 bars + 0.3 s tail = 60.3 s. Kinds: draft = Naples Yellow (tab left), decided = Deep Slate Green (centre), rule = Grenadine Pink (right). Alarm = rust (one colour).
Symbols: whale, line, atom (card + tab), seam (joint dot / receipt tick), pod. Ending: `draft-stays-out` (new to the registry).

## Beat sheet

| Bars · s | Act | Picture | Words | Atom |
|---|---|---|---|---|
| 1–5 · 0–9.4 | FELT | z 1.6. Whale flicks two look-alike grey cards into one huge pasted card. Pod reads it; answer circles a line in rust, thread back to the draft rows, ✕ (3.28). A newer note is pasted; same answer, ✕✕ (6.80). Whale leans in, focus face. | "It quoted our old draft as final." · "Same answer, same mistake, again." | hook, problem.sb-04-01 |
| 6 · 9.4–11.3 | WHY | ½ bar of stillness (score −56 dBFS), paper wash, title at 9.84. | "Give every *label*" title | (sb-04-01 title) |
| 7–9 · 11.3–16.9 | WHY | Pull back 1.6 → 1.2. The huge card spills into 16 grey cards. Look-alike pairs drop at 2, 1, ½ beats; each time the pod threads to the draft, lifts it, rust ✕, chip grows to six. Pod leaves. | "Each note shows up looking the same." | why.sb-04-01 |
| 10 · 16.9–18.8 | WHY | Freeze; faint tab colours ghost on. | Hint: "Label each note by what it is." (ends 19.20) | hint.sb-04-01 |
| 11–16 · 18.8–30.0 | MOVE | Tabs colour in (18.75 / 19.22 / 19.69), one of each lifts out, named inside. Tree of sockets (20.63). Decided snaps (22.5), tick. Push to z 1.6: draft refused at the joint (24.84). Rule snaps (26.25), a real decision fills slot 2 (26.72), receipts climb, root bell (27.66). | labels draft / decided / rule · "Label it: draft, decided, or rule." · "A draft cannot fill a decision slot." · "Labelled cards that fit slots: *atoms*." | mechanism.sb-04-01, metaphor.sb-04-01 |
| 17–22 · 30.0–41.3 | CASE | Three blocks of 41 / 26 / 41 small tabbed cards; the shared first row of each is joined by a dashed line (the nine) and pulses, still dashed. Rows tick on the beat. | Card: Real run · Context Atoms · 16 Oct 2026 / 3 prompts · 41, 26 and 41 atoms / Engine check: GREEN · 9 shared, still draft · "Three real prompts, built this way." · "The shared ones get a human check next." | case.sb-04-01, caution |
| 23–25 · 41.3–46.9 | LIMIT | A decided card with a rust smudge in its words snaps in and gets its receipt; slow push to it; tick unchanged. | "A wrong date marked decided still fits." · "Labels catch mix-ups, not wrong facts." | limit / notthis.sb-04-01 |
| 26–29 · 46.9–54.4 | PAYOFF | FELT framing (same camera). Small brief instead of the huge card. Decided snaps in, ticks; draft bounces off and floats aside. Pod returns, only the decided socket glows for it, answer circled green, ✓; whale sparks; pod leaves. | label "brief" | ending.sb-04-01 |
| 30–31 · 54.4–58.1 | BELIEF | Settled; whale spouts. | "Say what each piece is before you send." | belief.sb-04-01 |
| 32 · 58.1–60.3 | LOCKUP | `SERIES.lockup`. | | |

Term: "atoms" pictured 18.75 (tabbed card), named 28.13. No jargon in FELT or WHY.

## Changes to stitched atoms, and why
- **Palette (mechanism, limit, ending):** fact.stitch60 fixes Wada 166, but sb-04-01 was written for Wada 296. Slate → Deep Slate Green (decided), umber → Grenadine Pink (rule), yellow stays (Naples). Copper alarm → **rust**, per LONGFORM §10 and the shipped Stitch, and because rust reads apart from the pink rule tab.
- **caution.case.sb-04-01:** sb-04-01 flipped a spine card from dashed to solid ("checked and agreed"). That would show the nine as verified. Now the shared rows stay dashed, the card says "9 shared, still draft", and the caption is "The shared ones get a human check next." GREEN is labelled "Engine check".
- **case caption:** "jobs" → "prompts" (the source says 3 prompts). Card numbers come only from the Notion page.
- **limit words:** "A wrong label still fits the slot." → "A wrong date marked decided still fits." The old line read as "type checking fails", the opposite of the picture (right tab, wrong content).
- **mechanism t26.25:** "rule drops into its socket at the top of the tree" → rule socket on the left of a flat tree. A real decision then fills the slot the draft was refused from, so the settled tree is complete.
- **mechanism t18.75:** the three kinds are named by in-card labels shown one at a time (N7: at most 2 text items), before the bar-12 caption.
- **ending:** "only the slate socket opens to it" is drawn as the decided socket glowing while the pod reads, plus an answer thread to the decided card.
- **move2 caption** starts at bar 14 (the nudge), 0.47 s before the refusal, to keep captions 2 bars apart (P6).
- No 3-verb strip: it would be a third text item next to the labels and captions.

## Gates
`node kh/caps/tool.cjs stitch60 gate` → GATES PASS (read, jump 28.4 px/frame max, 11 contrast pairs).
The LONGFORM checks N1–N12, W10 and P6 were run with a scratch checker (not a shared file) and all PASS. Exports: `ACTS`, `TERMS`, `JARGON`, `BPM`, `SOLUTION_HINT`, `ENDING`, READ `kind`/`size`, cue `tags` in `cues().ev`.
Score: −16.1 LUFS, peak −1.5 dBFS. Hinge ½ bar −56 dBFS.

## Known weaknesses
- The series eyebrow and lockup are 15 px (series.js, shared). They are exempt from the §5 size floors.
- The deep-green "decided" tab reads close to black at a glance.
- The CASE blocks are small (cards 34×22 world units), and the act is mostly a static picture with row ticks. It is the weakest act.
- The camera re-frames from z 1.2 to z 1.3 as MOVE starts (18.5–20.3), on top of the one push-in. This is a gentle settle, but still a second zoom.
- The "Not this" caption fades out 0.28 s into PAYOFF.
- J1 (sound-off jury) has not been run. The builder never judges its own film.
