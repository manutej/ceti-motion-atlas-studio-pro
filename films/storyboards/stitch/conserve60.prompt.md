<!-- stitched brief for conserve60 · verdict GREEN · term_hash 92cb57ff0620 · prompt_hash 79be352ac712 · library 7a59d2381909 -->
<role>
You are the director-builder of a CETI motion film in Kinetic Hydrography 1.0.0. You turn the stitched pieces below into one storyboard and then into a working film in films/kh/caps/<slug>/ (film.js + score.py + NOTES.md) that passes every gate in films/kh/caps/tool.cjs. The pieces were chosen by a jury from 100 storyboards; keep their intent, make them cohere, and fix what does not glue.  ⟪role.director@v1⟫
</role>
<constraints>
- Problem first: the first 4 s show a consequence someone feels, captioned in their words. No title before bar 6.  ⟪c.problem-first@v1⟫
- Numbers only on a 'Real run · source' card with their source, or labelled 'Illustration'. Never invent a statistic.  ⟪c.sourced-numbers@v1⟫
- Every jargon word is pictured before it is named; no jargon in FELT or WHY.  ⟪c.symbol-before-word@v1⟫
- Jury caution on case.sb-03-01: B: Caution: 548 = 437 + 107 lab + 4 hubs, and 47/60 is the atlas's audit, while the lab delta is unaudited. The limit card must say 'atlas citation audit'.  ⟪caution.case.sb-03-01@v1⟫
- Captions ≤ 8 words, plain verbs, no units; the last WHY caption states the move in plain words.  ⟪c.captions-8@v1⟫
- The honest limit is shown as a picture (something gets through), then the not-this line.  ⟪c.limit-shown@v1⟫
- One sourced dot's source tick opens into a grid of 60 ticks: 47 teal, 13 copper. The citation audit fails 13, but the pins never noticed. · A source can still say something else.  ⟪limit.sb-03-01@v1⟫
- Checked means no known breaks. Not true.  ⟪notthis.sb-03-01@v1⟫
- Kinetic Hydrography: KH tokens and Wada mixes only (no hex literals), CETI eases only, text ink on paper or on SERIES.chip, chart ground, the whale and one line; ≥ 4.5:1 contrast; phone-legible sizes.  ⟪c.kh-style@v1⟫
- Slow down, filter noise: one focal event per bar in FELT and WHY, per beat in MOVE and CASE; the three-times device shows 'keeps happening'.  ⟪c.slow-down@v1⟫
- One focal point per moment; nothing overlaps a caption; the whale never covers the word it lands on.  ⟪c.one-focal@v1⟫
</constraints>
<output_contract>
Deliver: (1) storyboards/final/<slug>.json validating against films/storyboards/SCHEMA.json; (2) the film in films/kh/caps/<slug>/ per films/kh/caps/AGENT-BRIEF.md and films/kh/caps/LONGFORM-60.md (acts on the 32-bar grid, all gates PASS incl. the new LONGFORM gates you can check mechanically); (3) a contact sheet you have looked at and iterated twice; (4) NOTES.md listing which stitched piece each act came from (atom id) and every change you made to a piece and why.  ⟪contract.build-brief@v1⟫
</output_contract>
<facts>
- bpm: 124  ⟪fact.conserve60@v1⟫
- dur: 62.2  ⟪fact.conserve60@v1⟫
- slug: conserve60  ⟪fact.conserve60@v1⟫
- wada: 84  ⟪fact.conserve60@v1⟫
Target: films/kh/caps/conserve60/ · Wada 84 · 124 BPM · 62.2 s.  ⟪fact.conserve60@v1⟫
</facts>
<evidence>
- Merging the 437-entity p5.js atlas with 111 new lab entities gave 548 entities and 2,933 triples with exact violations 0 and provenance coverage 0.988. · {'kind': 'notion', 'title': 'Memory graph map', 'url': 'https://app.notion.com/p/3f3d50cfaf93813b8cfce21490365024'}  ⟪case.sb-03-01@v1⟫
</evidence>
<examples>
Close on the whale (z 1.6) following a thin thread from one dot on the line to the next. The thread ends in empty air and the whale bumps into nothing. · I followed the link. It went nowhere.  ⟪hook.sb-03-01@v1⟫
I followed the wiki's link, and it went nowhere. · new hire on day one  ⟪problem.sb-03-01@v1⟫
Ghost lines of past edits stack behind the line. Each edit is saved at once and each snaps a different thread: every 2 beats, then 1, then half. · Edits get saved. No one checks the rest.  ⟪why.sb-03-01@v1⟫
New people and AI helpers read the wiki as true. One broken link sends both to a dead page, and the wrong answer travels.  ⟪stakes.sb-03-01@v1⟫
Name what must stay true. Check every edit.  ⟪hint.sb-03-01@v1⟫
The wiki is a line with dots joined by threads. Three pins hold what must stay true, so the line can bend freely and the threads still land. · symbols: whale, line, pin, pod, tick  ⟪metaphor.sb-03-01@v1⟫
link-lands · The new-hire whale follows the same thread from the same dot and lands on a pinned dot. The pod that answered with a cross now answers with a tick.  ⟪ending.sb-03-01@v1⟫
Pick three things your wiki must keep.  ⟪belief.sb-03-01@v1⟫
</examples>
<goal>
Make Conserve-60: the one-minute, problem-first version of 'Change everything but the laws' — a knowledge base people stop trusting because edits silently break links, duplicate pages and drop sources; the move: name the few things that must never change and check them on every edit (Noether-inspired, never 'Noether's theorem').  ⟪goal.conserve60@v1⟫
</goal>
<method>
t19.355: Three pins drop into the hollow dots. The line passes through each one. Two pins carry icons: a single page and a source tick. [♪ Tuned tap on each pin.] | t20.323: A chip appears on the first pin. — “Links must land.” [♪ Soft click.] | t23.226: Free edits: the whale bends the line hard three times. It still runs through all three pins, and a ring flashes on each edit. — “Edit freely. These three laws never move.” [♪ Tap, varied brightness.] | t26.129: Push-in (z 1.28). An edit tugs the link pin, a copper offset shows the break, a gate before save closes, and the whale pulls the line back to the pin. The gate glows open. — “Breaks a link? Stopped and fixed before saving.” [♪ Tap goes flat, then snaps into tune.] | t29.032: One tick lands on the strip under the line. — “Every check written down.” [♪ Soft tick.]  ⟪mechanism.sb-03-01@v1⟫
</method>