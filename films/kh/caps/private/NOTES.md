# 09 · private: Private *cards* stay home.

Wada 339: Violet Blue = the stamp and the thread (private, tied home) · English Red = the one alarm (the wrong card circled at the clinic) · Ochraceous Salmon = the bakery's loaf icon · Light Glaucous Blue = the whale and the clinic's cross.
120 BPM (B = 0.5 s). DUR 28.1 s. Source: `storyboards/c04/sb-04-04.json` (Context Atoms), compressed from 64 s.

**Everyday picture.** An email is a page of note cards. Each client has a box (CLIENT · Bakery, CLIENT · Clinic). You (the whale, labelled "You") stamp a card PRIVATE once; a violet thread ties it to its own client's box. When the email goes to anyone else, the thread pulls that card back home by itself. Nobody has to remember. Honest limit: write the same note by hand on a plain card and it still goes.

**INTENT** (declared on `EPISODE`, TERMS = [] — no expert words at all):
- problem: reusing last week's email for a new client, you send the old client's private note ("Bakery's rent is late") to the clinic.
- move: stamp the note PRIVATE once; it is tied to its client's box and is pulled back home whenever the email goes elsewhere.
- belief: stamp private cards once and they stay with their client; the check reads the stamp, not the words.

## Beat sheet

| t (s) | act | picture | caption |
|---|---|---|---|
| 0.0–4.5 | FELT | Close (z 1.55). "You" (whale) by an email "To: Bakery" holding a card "Bakery's rent is late". Header struck → "To: Clinic" (0.95). Email flies into the Clinic box (1.5–2.4). The bakery card rises out of the clinic's box (2.5) and is circled in red (2.95). The whale lunges, too late. | "Same email, new client." · "I didn't mean to send the client's notes." |
| 4.5–6.9 | hinge | Paper veil, pull back to the full layout (z 1.4). Title. | "Private *cards* stay home." |
| 6.9–8.9 | STAMP | Push in (z 1.65). The whale, from the right (never over the words), presses a violet rubber stamp: "PRIVATE" lands on the card, tab turns violet (7.55). | "Stamp the private card." |
| 8.95–11.05 | TIE | A violet thread draws from the card's tab to the Bakery box (9.05–9.75). Header struck → "To: Clinic". | "Stamped cards are tied to their client." |
| 11.0–13.15 | PULL | Email flies to the clinic; the thread goes taut (11.18) and pulls the stamped card back into the Bakery box (12.18, clasp, spark). Clinic gets ✓. | "The stamped card stays home." |
| 13.2–15.3 | ×3 | Whale turns away, eyes shut. Two more emails go by themselves (13.4, 14.1); each stamped card is pulled home. | "No one has to remember." |
| 15.4–18.6 | CASE | Push onto the Bakery box (stack of stamped cards); the whale pats it. Card, 3.2 s, 30/60 px: "From our own work / One sealed box per client / Checked before anything is sent". | — |
| 18.65–20.8 | LIMIT | With a pencil, the whale writes the bakery note on a PLAIN card. The email goes; the card rises at the clinic and is circled (20.9). | "A card you didn't stamp still goes." |
| 20.85–23.05 | not-this | Push on the circled card. | "Sending checks the stamp, not the words." |
| 23.1–25.85 | PAYOFF / belief | Callback to the opening move: "To: Bakery" → "To: Clinic", the email goes, the stamped card is pulled home (24.63, the 4th in the box), Clinic ✓, whale spark + delight. | "Stamp private cards once. They stay home." |
| 25.9–28.1 | lockup | `SERIES.lockup`; the whale spouts once. | |

Station words: stamp · tied · stays home · no one has to remember. Ending pattern: **the sealed card stays** (callback to FELT's header swap; the card is pulled home instead of circled).

## Grounding
Card claims come from *Context Atoms — operadic stitch* (Notion, https://app.notion.com/p/3fbd50cfaf9381048ffaecd94c9f8264): "client work gets one child scope per client with Confidential ticked", "Confidential scopes are sealed", the engine checks confidentiality "before anything is sent". The card names no internal page (O2 rule 4). Limit = "The checker reads types and labels, not truth." Bakery/clinic are illustrations.

## Gates
`node kh/caps/tool.cjs private gate` → GATES PASS (read all PASS, plain PASS worst grade 3.7, intent PASS, jump 23.3 px/frame, 0.115 rad/frame, 11 contrast pairs ≥ 7.6:1). Score: −16.1 LUFS, −1.2 dBTP.
Sheets: `sheet-v1.png` (too small, mechanism a thin band), `sheet-v2.png` (×1.4 zoom, whale moved right of the card), `sheet-v3.png` (final: "Bakery's rent is late" spelled on the card, whale turns away to sleep, case push onto the box).

## Known weaknesses
- The violet thread is new to viewers; its meaning rests on the caption "Stamped cards are tied to their client." at 9 s.
- "Eyes shut" is small on a 640-px sheet; the not-watching beat reads mostly through the caption and the emails leaving with no whale near them.
- The home stack in the Bakery box gets busy (4 fanned cards); fine in motion, cluttered in a still.
- The clinic box half-shows at the right edge during the case push (16–18 s).

## v4 (lay jury on v3: "who checks, me or the system?"; AGENT-BRIEF lessons 7–10). v3 kept as `film-v3.js`.
- AI named as an actor: a helper pod labelled **"Your AI assistant"** (whole film) sends every email (a small push) and checks each card as it goes: a violet dashed line goes to the PRIVATE stamp (that card is held back), and a slate line goes to the plain card (that card is let through). Caption at 11.1: "Your AI assistant checks the stamp before sending." Not-this: "It checks the stamp, not the words."
- The tie is visible: the thread is ≥ 6 px solid violet. As the email leaves, the card is first **tugged** out of the page (120 world units back, tilted), then pulled home 0.3 s later.
- The Clinic's "+" is gone. Boxes are now client **folders** (folder tab, eyebrow "CLIENT FOLDER"). The card reads "True story: how we keep client notes apart" / **"One folder per client"** (60 px) / "Source: the AI tool we use for client work". It is up 15.6–19.1 s (3.5 s).
- Title hinge: the veil is 0.5 and the camera pulls back to z 0.9 before the title arrives (3.9–4.75), so the circled card, the whale, the folders and the AI stay visible under the title.
- 12–15 s, one at a time: the second automatic email (L4) is cut. Stamped cards land home at 12.78 (L2) and 15.0 (L3), 2.2 s apart. The limit card pops at 21.0.
- Limit, phrased as "and also" (lesson 8): "Plain cards go too. So stamp them."
- Camera: no shot crops a folder at rest (STAMP z 1.5, CASE z 1.3, LIM z 1.42).
- DUR 28.5 s. Gate: GATES PASS (plain worst grade 5.2, intent PASS, jump 22.6 px/frame). Score −16.0 LUFS / −1.2 dBTP. Sheet: `sheet-v4.png`.
