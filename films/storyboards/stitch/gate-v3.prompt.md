<!-- stitched brief for gate-v3 · verdict GREEN · term_hash 9110fcf5431d · prompt_hash b5877179fee5 · library 7a59d2381909 -->
<role>
You are the director-builder of a CETI motion film in Kinetic Hydrography 1.0.0. You turn the stitched pieces below into one storyboard and then into a working film in films/kh/caps/<slug>/ (film.js + score.py + NOTES.md) that passes every gate in films/kh/caps/tool.cjs. The pieces were chosen by a jury from 100 storyboards; keep their intent, make them cohere, and fix what does not glue.  ⟪role.director@v1⟫
</role>
<constraints>
- Problem first: the first 4 s show a consequence someone feels, captioned in their words. No title before bar 6.  ⟪c.problem-first@v1⟫
- Numbers only on a 'Real run · source' card with their source, or labelled 'Illustration'. Never invent a statistic.  ⟪c.sourced-numbers@v1⟫
- Every jargon word is pictured before it is named; no jargon in FELT or WHY.  ⟪c.symbol-before-word@v1⟫
- Captions ≤ 8 words, plain verbs, no units; the last WHY caption states the move in plain words.  ⟪c.captions-8@v1⟫
- The honest limit is shown as a picture (something gets through), then the not-this line.  ⟪c.limit-shown@v1⟫
- A pale print passes both the screen gate and the page gate. The printer pod answers ✕ and a fresh flag falls. · The next new kind still gets through.  ⟪limit.sb-07-03@v1⟫
- Passing means no known failures. Not quality.  ⟪notthis.sb-07-01@v1⟫
- Kinetic Hydrography: KH tokens and Wada mixes only (no hex literals), CETI eases only, text ink on paper or on SERIES.chip, chart ground, the whale and one line; ≥ 4.5:1 contrast; phone-legible sizes.  ⟪c.kh-style@v1⟫
- Slow down, filter noise: one focal event per bar in FELT and WHY, per beat in MOVE and CASE; the three-times device shows 'keeps happening'.  ⟪c.slow-down@v1⟫
- One focal point per moment; nothing overlaps a caption; the whale never covers the word it lands on.  ⟪c.one-focal@v1⟫
</constraints>
<output_contract>
Deliver: (1) storyboards/final/<slug>.json validating against films/storyboards/SCHEMA.json; (2) the film in films/kh/caps/<slug>/ per films/kh/caps/AGENT-BRIEF.md and films/kh/caps/LONGFORM-60.md (acts on the 32-bar grid, all gates PASS incl. the new LONGFORM gates you can check mechanically); (3) a contact sheet you have looked at and iterated twice; (4) NOTES.md listing which stitched piece each act came from (atom id) and every change you made to a piece and why.  ⟪contract.build-brief@v1⟫
</output_contract>
<facts>
- bpm: 128  ⟪fact.gate-v3@v1⟫
- dur: 26  ⟪fact.gate-v3@v1⟫
- slug: gate  ⟪fact.gate-v3@v1⟫
- wada: 243  ⟪fact.gate-v3@v1⟫
Target: films/kh/caps/gate/ (v3 replaces v2; keep v2 as film-v2.js) · Wada 243 · 128 BPM · about 26 s.  ⟪fact.gate-v3@v1⟫
</facts>
<evidence>
- Manu's escapes register lists 7 defects that passed the studio's gates. Each is now caught by a different kind of check (a font checked by its declared name is now checked by the face that renders). · {'kind': 'notion', 'title': 'Limits & escapes register', 'url': 'https://app.notion.com/p/3f2d50cfaf9381a88b04f3837efcac6a'}  ⟪case.sb-07-01@v1⟫
</evidence>
<examples>
Close on the whale stamping ticks on a smooth line and sending it to a pod, which answers ✕ in raw sienna. · It passed every check.  ⟪hook.sb-07-01@v1⟫
It passed every check. Then a customer found the bug. · product owner, reading a support ticket  ⟪problem.sb-07-01@v1⟫
Each gate checks one kind of thing, shown as an icon on its lintel. A miss of a new kind passes them all, and its flag becomes the icon of a new gate. · symbols: whale, line, gate, pod, flag  ⟪metaphor.sb-07-01@v1⟫
pod-answers-yes · The flag from the miss becomes the icon of a fourth gate. The backwards run stops there and is turned round, and the same pod now answers ✓.  ⟪ending.sb-07-01@v1⟫
Machines check every run. Misses become new checks.  ⟪belief.sb-07-01@v1⟫
</examples>
<goal>
Make Gate v3 (25–30 s, the 25-s series format, not 60 s): 'Check it at the gate' made clearer — each gate checks a DIFFERENT kind of thing; the escape is a smooth run of the wrong kind (like a page that declared one font and rendered another); the miss becomes a new KIND of check, not a tighter slot. Apply films/kh/caps/gate/REVIEW-v3.md.  ⟪goal.gate-v3@v1⟫
</goal>
<method>
t20.0: The whale picks the top flag off the pile. [♪ A soft lift] | t22.0: It folds the flag into a new icon: a page edge. — “Fold the miss into a new check.” [♪ A paper fold, tuned] | t24.0: Push-in: the whale sets the page-edge icon on a new lintel behind the screen gate (a squash on placing it). A second gate stands. [♪ Clean stamp] | t26.0: The old cut run is replayed. It glows through the screen gate and stops at the page gate as the bar drops. — “The old mistake must stop here now.” [♪ Whoosh, then a stop knock] | t28.0: The fixed run passes both gates and a tick lands. The used flag stays folded on the lintel. [♪ Two stamps, resolved] | t30.0: The whale points its fin at the folded flag on the lintel. — “A miss that slipped by is an escape.” [♪ Soft chime]  ⟪mechanism.sb-07-03@v1⟫
</method>