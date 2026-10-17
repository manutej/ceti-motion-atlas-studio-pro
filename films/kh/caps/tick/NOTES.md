# 06 · tick v2: Every step gets a *tick*.

Wada 279 (Raw Sienna = coins · Dark Tyrian Blue = ticks, ground tint · Vinaceous Cinnamon = the "working" glow · Ecru = card paper). CETI rust is used only for the crash, the ✕, the "Paid $40" border and the wrong-name ring. 128 BPM. DUR 29.35 s.
Source: `storyboards/c06/sb-06-03.json` (jev-tape). v1 is kept as `film-v1.js` / `sheet-v1.png`. v2 applies the lay-jury notes and AGENT-BRIEF lessons 1–10.

**Actors.** The whale is "Your AI helper" (the only place AI is named, 0.1–1.9 s). The customer is a coin jar labelled "Customer: Ana". The work is a $20 refund in three labelled step cards: Find order · Pay refund · Send email. A chip under the jar counts the money: "Paid $20", then "Paid $40". Money only ever means the refund.

## Beat sheet

| t (s) | act | picture | caption |
|---|---|---|---|
| 0–1.95 | FELT | The helper taps Find order, then Pay refund. A coin arcs into the jar ("Paid $20"). | "The job: refund a customer $20." |
| 1.95–3.2 | FELT | Crash at Send email. The line snaps, a "Crash!" chip appears in clear space with a leader, and the helper is thrown back. | "The computer crashed before the last step." |
| 3.2–6.2 | FELT | It starts again from step 1. A second coin lands: "Paid $40", ✕. | "Starting again sent the refund twice." |
| 6.2–9.9 | hinge | Veil at 94%, overstroked title, fully visible for 2.5 s. The tick strip draws on underneath. | "Every step gets a *tick*." |
| 9.9–14.6 | MOVE | Ticks drop in boxes 1–2. Crash, thrown back. The helper reads the ticks (rings), skips along a dotted trail, and does Send email (tick 3). Jar ✓ with one coin. Push to z 1.25 with nothing cropped. | "Each finished step gets a tick." · "After a crash, skip the ticked steps." |
| 14.7–18.8 | CASE | Bottom card, 44 px, fully visible for 3.5 s: "True story: we crashed it on purpose. / Each step happened once. / Source: our own tests". The camera lifts the strip above it and drifts; the helper moves to step 2. | — |
| 18.6–21.3 | LIMIT | Push (z 1.25, all cards in frame). The sent email lifts out of its ticked card, addressed "To: Bob" in a rust ring, next to "Customer: Ana". Tick 3 pulses but stays. | "A tick means done. Not right." |
| 21.3–27.1 | PAYOFF | The felt framing again. Same crash after paying, thrown back, read, skip, one coin lifts and glows, ✓, delight. | "Tick each step. Pay just once." (25.1) |
| 27.15–29.35 | lockup | `SERIES.lockup` | |

## Honesty
The card paraphrases the jev-tape README's `demo:crash` → "0 duplicate applies" as "Each step happened once". I did not use "Paid once", because the demo's actions are not payments. "Our own tests" is accurate: it is the project's own claim and has not been independently checked.

## Score
A pencil tick for each tick and a coin chime for each landing. The doubled, out-of-time chime is the problem motif, and a crash is a snap plus a thud. The limit is a paper whoosh, then a semitone-off chime that is left unresolved. The payoff is a glass chord, and the pad enters after the final ✓. Output is −16.0 LUFS with a true peak of −1.2 dBTP.

## Known weaknesses
- The step whale→Find order at 21.9 s goes leftwards from step 2 (a short backwards swim), because the helper waits at step 2 during the limit to avoid a camera-plus-whale jump.
- The whale's peak screen speed is 29.5 px/frame, just inside the limit.
- The title is still the light display face. I overstroked it at 2.4 px, but `SERIES.open` itself is thin, and that is a shared-file decision.
- "To: Bob" versus "Customer: Ana" needs the viewer to compare two small labels. The rust ring helps, but a viewer who misses Ana sees only "an email".
