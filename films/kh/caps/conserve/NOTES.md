# 04 · conserve — notes

**Title:** Change everything but the *laws*. · Wada 84 (Seashell Pink, Deep Slate Green) + CETI copper/navy marks · 124 BPM (beat = 0.484 s) · DUR 25.5 s.

**Colour roles (two colours, used as a rule):** Seashell Pink = content (the fill under the line, free to move). Deep Slate Green = law (the line, the pins, the station words). Copper = the only alarm (drift over budget, the one fire in the ledger, the payoff spark). Navy = ink and sounding rings.

**The picture:** one line across the chart, with nodes at x = −400, 0, +400 (the three laws). Content is a sum of sine modes on each 400 px segment, so once the pins are in, every shape the content takes still passes through them, like a plucked string with fixed nodes.

**Sound signature:** the line is a Karplus–Strong string. Before the pins are in, each landing plucks a detuned, sagging note. After that, every edit plucks the same A (220 Hz) with a different brightness. The tug pulls the string flat (a beating drone while over budget), the repair snaps it back into tune, and the shake strums that one A on every 8th. Normalised in-script to −16 LUFS, true peak −1.3 dBTP.## Beat sheet (v2, 25.5 s)
| t (s) | what happens |
|---|---|
| 0.25–2.5 | `SERIES.open`. The line draws on from 1.9 and three hollow dots appear on it. |
| 2.5–4.6 | **Change**. Hops on b6/7.5/9 bend the line under the whale, and the unpinned dots drift. |
| 4.7–6.75 | **Conserve**. Taps right to left on b10.5/11.5/12.5: each dot slides home, a pin drops in, and its law label appears (sans 24 on a chip). |
| 6.85–8.9 | **Measure**. Edits on b14.5/b16, sounding rings, pins flash, the ledger ticks. The panel (624×286, readout 40 px) appears. |
| 9.0–11.05 | **Budget**. The band fills, the camera pushes in (z 1.28), and the hop on b19 drags the middle pin. A copper drift line, a copper bar, "over budget" (26 px) and a copper panel border; the copper fire is written. |
| 11.15–13.05 | **Repair**. Lift on b23.5, the pin snaps home, the re-check passes. The real-run card (values 56 px) holds 11.9–15.05. |
| 13.1–15.15 | **Ledger**. One more edit (b27); the fire tick is ringed. |
| 15.0–17.9 | **The shake** (b31–b37), then stillness, delight and a spark. |
| 17.85–20.55 | Not-this caption; the labels return; a slow push-in toward the middle pin (z → 1.25). |
| 20.55–23.25 | End belief, fully out before `SERIES.lockup` at 23.3. |



## Known weaknesses
- The drift meter is illustrative: it shows only "0.0" or "OVER" and never an invented number. The budget mark's position is arbitrary.
- The whale's peak is 27.9 px/frame during the shake (limit 30). If the shake amplitude goes up, slow the whale's grip, not the line.
- From 17.9 the content is still; the camera push, the whale's breathing and the caption changes keep it alive.
