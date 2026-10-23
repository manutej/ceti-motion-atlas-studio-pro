# FILM BRIEF — What an MCP server is (round 1)

Worked example for `motion-brief`, built from the repo's `v9-mcp-server` board (`studio-canvas-oauth.js` → `V9_STORYBOARDS`). Beat sheet: `beats.json` beside this file. Bible: `character-bible.json` beside this file.

## 1. Film in one line.
Your AI is smart but locked out of your files; an MCP server is the one plug that lets it in. Joke: a genius robot beaten by a drawer.

## 2. References.
- source video: none (the repo's own v9 animatic is the baseline)
- image library: repo `assets/` and the CC0 SFX kit
- prior work repo: github.com/manutej/ceti-motion-atlas-studio-pro — keep the v9 look, push the payoff rhythm
- keep: the hand-drawn robot · the locked-drawer gag · the calm landing that echoes frame 0
- push: louder payoffs on beats 3, 4, 6 · cleaner text room · SFX that land on the payoff marks
- OPEN: song / score reference — the owner has not named one; the score lane uses the resolved tempo range until he does

## 3. Tools & keys.
- skills to load: motion-brief, motion-soup, motion-critique, motion-deliver
- APIs available: image n · video n · voice n (all procedural: canvas, two.js, WebAudio)
- docs live at: docs/rsi/ and work/wording/
- Spend it economically → budget { agentCalls: 24, wallMin: 60 }

## 4. Character bible.
- bible: character-bible.json
- proportions: Robot head:body 1:1.6, arms 0.9 of body; Adapter 0.35 of robot height, one cable
- palette: from resolved tokens (css:index.html + wada:296) → roles only: accent, ink, highlight, tint, ochre
- expressions: Robot 6 (one per grammar role) · Adapter 3 (claim, proof, callback)
- identity lock ⟂: head:body 1:1.6 · two round eyes, no mouth · outline on the ink role
- bible hash: sha256:48edb75de7dd56e6453e45717835bbd0d6665d7ec25785832dd5a2611fce88f1

## 5. Beat sheet.
| # | act | start s | dur s | grammar | say | payoff ⟂ | textBox ⟂ |
|---|-----|---------|-------|---------|-----|----------|-----------|
| 1 | I | 0 | 2 | hook | Your AI is smart, but it cannot touch your files. | ✓ @2 | 0.08,0.76,0.84,0.16 |
| 2 | I | 2 | 1.5 | claim | An MCP server is a plug that fits any tool. | – | 0.08,0.76,0.84,0.16 |
| 3 | II | 3.5 | 2 | proof → 2 | The server lists what it can do. | ✓ @5.5 | 0.08,0.76,0.84,0.16 |
| 4 | II | 5.5 | 3 | proof → 2 | The AI picks one. The server does the work. | ✓ @8.5 | 0.08,0.76,0.84,0.16 |
| 5 | II | 8.5 | 1.5 | breather | That is the whole trick. | – | 0.08,0.76,0.84,0.16 |
| 6 | III | 10 | 2 | callback | One adapter opens every drawer: files, mail, dates. | ✓ @12 | 0.08,0.76,0.84,0.16 |
| 7 | III | 12 | 2 | landing | MCP: one plug, every tool. | – | 0.08,0.76,0.84,0.16 |

hook lands at 2 s ⟂ · payoffs at 2 / 5.5 / 8.5 / 12 s, gaps 3.5 / 3 / 3.5 s, tail 2 s ⟂ · plant "locked drawer" returns at beat 6 · exported to beats.json (show / hear / because live there)

## 6. Text on screen.
- huge (lyric / headline) at beats: none — the landing line sits in the same box, set one step larger on the type scale
- subtitle-sized at beats: 1–7
- reserved text box per `say` beat ⟂: bottom band 0.08,0.76,0.84,0.16 on every beat (beats.json `textBox`)
- composition rule: no robot, card, drawer or cable crosses the bottom band while words are on screen

## 7. Workflow gates.
plan → rig → stills → animatic → full pass → polish → audio → render ⟂
- this round covers stages: plan, rig, stills, animatic   previous rounds reached: none (first round on this brief)

## 8. Critique loop.
- axes scored 1–10: hook, cadence, readability, identity, music fit, polish
- stills per pass: 4, at the payoff marks 2 / 5.5 / 8.5 / 12 s   exit ⟂: every axis ≥ 8
- who fixes: hook, cadence → wording lane · readability → vector lane · identity → rig · music fit → music lane · polish → integrator

## 9. Deliverables.
- dir: work/deliver/v9-mcp-server/
- final MP4 ⟂ · loop check ⟂ · poster frame ⟂ · contact sheet ⟂ · clean source + README ⟂
- extras: compare.html (before / after, read by the repo's G37 deliverables check)

## defaults taken
- §7–§9 are the motion-brief defaults; the owner may override any line.
- §2 song reference left OPEN (see the OPEN line); written to the ledger as `kind: "open"`.
