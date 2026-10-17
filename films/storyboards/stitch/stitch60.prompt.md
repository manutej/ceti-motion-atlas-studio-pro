<!-- stitched brief for stitch60 · verdict GREEN · term_hash 9cf7d02350fd · prompt_hash c19614112251 · library 7a59d2381909 -->
<role>
You are the director-builder of a CETI motion film in Kinetic Hydrography 1.0.0. You turn the stitched pieces below into one storyboard and then into a working film in films/kh/caps/<slug>/ (film.js + score.py + NOTES.md) that passes every gate in films/kh/caps/tool.cjs. The pieces were chosen by a jury from 100 storyboards; keep their intent, make them cohere, and fix what does not glue.  ⟪role.director@v1⟫
</role>
<constraints>
- Problem first: the first 4 s show a consequence someone feels, captioned in their words. No title before bar 6.  ⟪c.problem-first@v1⟫
- Numbers only on a 'Real run · source' card with their source, or labelled 'Illustration'. Never invent a statistic.  ⟪c.sourced-numbers@v1⟫
- Every jargon word is pictured before it is named; no jargon in FELT or WHY.  ⟪c.symbol-before-word@v1⟫
- Jury caution on case.sb-04-01: B: Not an error, a caution: GREEN is the engine's own verdict, and the 9 spine atoms are still Draft per the Context Atoms page. Never caption them 'verified'.  ⟪caution.case.sb-04-01@v1⟫
- Captions ≤ 8 words, plain verbs, no units; the last WHY caption states the move in plain words.  ⟪c.captions-8@v1⟫
- The honest limit is shown as a picture (something gets through), then the not-this line.  ⟪c.limit-shown@v1⟫
- A slate decided card snaps into the decided socket and gets its receipt, but the words inside it carry a copper smudge: someone labelled a wrong date as decided. · A wrong label still fits the slot.  ⟪limit.sb-04-01@v1⟫
- Labels catch mix-ups, not wrong facts.  ⟪notthis.sb-04-01@v1⟫
- Kinetic Hydrography: KH tokens and Wada mixes only (no hex literals), CETI eases only, text ink on paper or on SERIES.chip, chart ground, the whale and one line; ≥ 4.5:1 contrast; phone-legible sizes.  ⟪c.kh-style@v1⟫
- Slow down, filter noise: one focal event per bar in FELT and WHY, per beat in MOVE and CASE; the three-times device shows 'keeps happening'.  ⟪c.slow-down@v1⟫
- One focal point per moment; nothing overlaps a caption; the whale never covers the word it lands on.  ⟪c.one-focal@v1⟫
</constraints>
<output_contract>
Deliver: (1) storyboards/final/<slug>.json validating against films/storyboards/SCHEMA.json; (2) the film in films/kh/caps/<slug>/ per films/kh/caps/AGENT-BRIEF.md and films/kh/caps/LONGFORM-60.md (acts on the 32-bar grid, all gates PASS incl. the new LONGFORM gates you can check mechanically); (3) a contact sheet you have looked at and iterated twice; (4) NOTES.md listing which stitched piece each act came from (atom id) and every change you made to a piece and why.  ⟪contract.build-brief@v1⟫
</output_contract>
<facts>
- bpm: 128  ⟪fact.stitch60@v1⟫
- dur: 60.3  ⟪fact.stitch60@v1⟫
- slug: stitch60  ⟪fact.stitch60@v1⟫
- wada: 166  ⟪fact.stitch60@v1⟫
Target: films/kh/caps/stitch60/ · Wada 166 · 128 BPM · 60.3 s.  ⟪fact.stitch60@v1⟫
</facts>
<evidence>
- Context Atoms first three jobs (16 Oct 2026): 3 prompts and 41, 26 and 41 atoms, all GREEN; 9 atoms shared by all three (the spine), to be verified first. · {'kind': 'notion', 'title': 'Context Atoms — operadic stitch', 'url': 'https://app.notion.com/p/3fbd50cfaf9381048ffaecd94c9f8264'}  ⟪case.sb-04-01@v1⟫
</evidence>
<examples>
Close on the whale dropping two near-identical grey cards, an old draft and the final decision, into one huge pasted card on the line.  ⟪hook.sb-04-01@v1⟫
It quoted our old draft like it was the decision. · project lead reading the AI summary on Monday  ⟪problem.sb-04-01@v1⟫
Pull back: dozens of grey cards on the line, drafts and decisions side by side with no difference. Three more look-alike pairs drop in, every 2 beats, then 1, then half; each time the pod grabs the wrong one. · Each note shows up looking the same.  ⟪why.sb-04-01@v1⟫
A decision gets reversed in front of the client, and the team stops trusting the summary.  ⟪stakes.sb-04-01@v1⟫
Label each note by what it is.  ⟪hint.sb-04-01@v1⟫
Notes are cards that all look the same until each gets a coloured tab for its kind; the brief is a tree of sockets that only takes the right kind in each slot. · symbols: whale, line, atom, seam, pod  ⟪metaphor.sb-04-01@v1⟫
draft-stays-out · The same two look-alike cards return in the FELT framing, now tabbed yellow and slate. The pod reaches in; only the slate socket opens to it, the draft drifts aside, and its answer chip shows a tick.  ⟪ending.sb-04-01@v1⟫
Say what each piece is before you send.  ⟪belief.sb-04-01@v1⟫
</examples>
<goal>
Make Stitch-60: the one-minute, problem-first version of 'Context is composed' — agents given a pasted heap of context quote drafts as decisions and mix sources; the move: build the brief from small labelled parts that only fit where their type matches, checked at every seam, with a receipt.  ⟪goal.stitch60@v1⟫
</goal>
<method>
t18.75: The cards freeze and tabs colour in: yellow tab for draft, slate tab for decided, umber tab for rule. [♪ Three tuned wooden clicks, one per colour] | t20.625: A tree of sockets hangs from the line; each socket shows the tab colour it accepts. — “Label it: draft, decided, or rule.” [♪ A rising two-note figure] | t22.5: A slate decided card glides into the slate socket and snaps; a small tick appears at the joint. [♪ Clean wooden click] | t24.375: Push-in: the whale nudges the yellow draft card at the decided socket; it is refused at the joint, a copper cross, a small shake, and it drops back. — “A draft cannot fill a decision slot.” [♪ The click, muffled and a half-step flat] | t26.25: The umber rule card drops into its own socket at the top of the tree; receipts tick up the branches. [♪ Soft ticks climbing] | t28.125: The tree settles; every card shows its tab. — “Labelled cards that fit slots: atoms.” [♪ The clean click once, held]  ⟪mechanism.sb-04-01@v1⟫
</method>