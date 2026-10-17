# 04 · conserve60: notes

**Title:** Change everything but the *pins*. · LONGFORM-60 · Wada 84 (Seashell Pink = content, Deep Slate Green = law) · copper is the only alarm · 124 BPM (bar 1.935 s) · DUR 62.235 s (32 bars + 0.3 s).
Brief: `storyboards/stitch/conserve60.prompt.md` (GREEN, term_hash 92cb57ff0620). Board: `storyboards/final/conserve60.json` (validates against SCHEMA.json; MOVE beats equal mechanism steps).
Reused from the 25 s `conserve/`: the sine-mode line, `drawPin`, the tug and its copper drift line, the sounding rings, the ledger ticks (now inside the save-gate panel), the real-run card, the shake, and the plucked-A score.

**New picture:** the wiki is a line with dots (pages) joined by threads (links). An edit that moves a dot leaves every link aimed at it hanging in the air with a frayed curl. Pins keep the dots home, so links land however the content bends.

## Acts (bars · s) and where each came from

| Act | Bars · s | Picture | Words | Atom |
|---|---|---|---|---|
| FELT | 1–5 · 0–9.68 | Whale follows a link to a frayed dead end and bumps into nothing (0.97). Pod follows it too and answers ✕ (3.87/4.35), then swims off with the wrong answer (7.74). Other links faded to 0.32 so there is one focal point. | "I followed the link. It went nowhere." · "The AI followed it too. Wrong answer." | hook, problem, stakes |
| WHY | 6–10 · 9.68–19.35 | Half-bar stillness, title over a paper veil (10.65). Pull back to z 1.0, ghost lines of past saves. Four saves at 13.55 / +2 / +1 / +½ beats snap three links. Bar 10: motion stops, dashed homes glow. | "Edits get saved. No one checks the rest." · hint "Name what must stay true. Check every edit." | why, hint |
| MOVE | 11–16 · 19.35–30.97 | Taps drop three pins (source, link, page icons); loose links re-land. "Links must land." chip. Strip Pin · Check · Fix. Three free edits, rings, ticks. Push-in: tug drags the link pin, two links come loose, save gate drops a copper bar; fix; gate opens. Copper tick ringed. | "Edit freely. These three laws never move." · "Breaks a link? Stopped and fixed before saving." · "Every check written down." | mechanism, metaphor |
| CASE | 17–22 · 30.97–42.58 | Wide z 0.78. The lab's line slides in and docks; its links land; ticks stream. Card: Real run · Memory graph map · 548 entities · 2,933 links · 0 laws broken · 0.988 sourced. Whale checks each new dot's source tick. | "Real run: two wikis merged into one." · "Nearly every new fact named its source." | case (+ caution) |
| LIMIT | 23–25 · 42.58–48.39 | Push into the source pin; its icon opens into 60 ticks, 47 green and 13 copper ("Atlas citation audit · 47 of 60 faithful"). A check ring passes the pin and it stays calm. | "A source can still say something else." · "Checked means no known breaks. Not proven true." | limit, notthis, caution |
| PAYOFF | 26–29 · 48.39–56.13 | **link-lands**: FELT framing; same whale, same link, now lands on the pinned dot (50.32). Pod returns, answers ✓ (52.26), spark and spout; pod leaves; one-bar shake, every pin and link holds; pull to z 1.2. | none | ending |
| BELIEF | 30–31 · 56.13–60.0 | Still, breathing. | "Pick three things your wiki must keep." | belief |
| LOCKUP | 32 · 60.0–62.24 | `SERIES.lockup` | | |

## Changes to stitched pieces, and why
- **problem / FELT caption 2:** "The AI answered from that broken page." became "The AI followed it too. Wrong answer." It matches the picture (the pod follows the same link) and puts the stakes on screen.
- **hook / FELT bar 5:** dropped "two more loose threads flutter behind it". Those snaps are saved for WHY, so the three-times device has threads left to break. Bar 5 is now the pod leaving with the wrong answer (stakes: "the wrong answer travels").
- **title:** "A wiki with pins." became "Change everything but the *pins*." It keeps the shipped Conserve title shape (goal atom) and uses "pins", not "laws", so N3 holds ("laws" is named only at 23.23, after the pins at 19.35).
- **mechanism:** pins get three icons (source, link, page) rather than two. The source icon is the one that opens in LIMIT. The "gate before save" became a small wordless panel (gate glyph and record ticks), reusing the 25 s ledger panel. Gate is the third non-core symbol (pin, pod, gate; tick and ring are props).
- **case:** no "437" or "111" chips on the lines. Per the caution, 548 = 437 + 107 lab + 4 hubs, so no arithmetic is implied. Card numbers are exactly the source's. The storyboard's "Every new link came with its source." overclaimed 0.988, so it became "Nearly every new fact named its source."
- **limit / caution:** the card reads "Atlas citation audit · 47 of 60 faithful". The atom's "teal" is drawn in Deep Slate Green, because Wada 84 has no teal.
- **notthis:** "Checked means no known breaks. Not true." became "…Not proven true." The bare "Not true." reads as a denial of the sentence before it.
- **ending:** the ✓ chip replaces the "broken 0" counter (a digit on the toy wiki would need a source). The one-bar shake was kept from the shipped cut as a coda.

## Sound (score.py)
FELT: detuned, sagging, ringless plucks; pod ✕ is a dull thunk. Hinge: room tone at −46.7 dBFS, then the title tick. WHY: the problem pluck ×4, accelerating, with snap clicks. Hint: the first clean A. MOVE: pins build A2-E3-A3; every pinned edit plucks the same A; the tug pulls the string flat (beating drone), and the fix snaps it back in tune. CASE: pulse bed with fast quiet ticks. LIMIT: A against B♭, unresolved. PAYOFF: a true A on landing, A-major arpeggio on ✓, the shake strummed. BELIEF: pad tail. Smoke test: −16.0 LUFS, TP −1.30 dBTP.

## Known weaknesses
- WHY at z 1.0 is busy: ghost lines plus four loose links.
- The save gate is a new, unlabelled glyph. Its meaning rests on the caption "Stopped and fixed before saving."
- CASE at z 0.78 makes the pins small. The card carries the act.
- J1 (sound-off jury) is unrun; a builder never judges its own film.
