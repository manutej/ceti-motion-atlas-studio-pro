# motion-soup

Model-soup / recursive self-query method for motion-graphics deliverables, packaged as a skill. Workers are Opus subagents spawned in parallel with the `Agent` tool; the repo's test command is the gate; a ledger generates the next round's prompts. Start at `SKILL.md`.

```
SKILL.md                       runbook (inputs, loop, lanes, budgets, tokens, gates, retain-old, report, anti-patterns)
references/prompts.md          verbatim Agent-call templates: candidate, merger, integrator, blind critic, token resolver; the 12 self-queries
references/gates.md            7 universal gate predicates, each with a node/text implementation and a negative mutation
references/lanes.md            lane catalog: API stub + self-test predicates + lens seeds per lane
scripts/soup-runner.mjs        resolve-tokens · check-literals · diversity · ledger add · report  (no deps)
examples/round-1-motion-atlas.md   this repo's v9 round written in the skill's terms
```

Brand-agnostic by construction: the skill holds no colour, font, easing or tempo value. `resolve-tokens` reads them from the host (CSS custom properties, brand JSON, a palette-engine id, a CommonJS export) into `work/tokens.resolved.json`; every prompt references that path; `check-literals` fails any output that spells a colour not in it.

## Runner outputs on this repo (2026-10-23, Node 22)

Demo paths were redirected into a scratch folder so no `work/` file was created; the commands shown are the canonical ones. `wada:207` is this repo's *audit* palette — it is used here only to exercise the resolver (see the caveat in the example).

```
$ node skills/motion-soup/scripts/soup-runner.mjs resolve-tokens css:index.html cjs:studio-music-engine.js#TEMPO wada:207 --out work/tokens.resolved.json
tokens -> work/tokens.resolved.json
  color: paper=#111314 ink=#b4cdc2 accent=#b4cdc2 highlight=#a36752 contrast=#b4cdc2 extra=paper2,ink-soft,ink-faint,rust,sage,ochre,tint,disc
  type:  display="'Fraunces'…" body="'DM Sans'…" mono="'Space Mono'…" scale=∅
  motion.feels: rest,slow,held,glaser,rostrum,saul,beat,spring
  tempo.range: 60–120 | literals: 10 | missing: type.scale

$ node skills/motion-soup/scripts/soup-runner.mjs check-literals work/music
check-literals: 7 files, 23 colour literals, 10 allowed from work/tokens.resolved.json
  FAIL work/music/candidate-A.js:19: #888888
  FAIL work/music/candidate-A.js:46: #ae5224
  FAIL work/music/candidate-A.js:46: #ebd3a2
  … (23 lines)
FAIL 23 literal(s) not in tokens
exit=1

$ node skills/motion-soup/scripts/soup-runner.mjs check-literals work/two
check-literals: 7 files, 46 colour literals, 10 allowed from work/tokens.resolved.json
FAIL 46 literal(s) not in tokens
exit=1

$ node skills/motion-soup/scripts/soup-runner.mjs diversity work/music/cand*.js work/two/cand*.js
  candidate-A.js vs candidate-B.js: distance 0.953
PASS diversity min 0.953 >= 0.35
  candidate-A.js vs candidate-B.js: distance 0.971
PASS diversity min 0.971 >= 0.35

$ node skills/motion-soup/scripts/soup-runner.mjs ledger add '{"round":1,"lane":"music","kind":"candidate","id":"A","selftest":"exit0","bytes":25519}'
ledger: +1 row -> work/soup-ledger.jsonl (round=1 lane=music kind=candidate)
  … (+10 rows)

$ node skills/motion-soup/scripts/soup-runner.mjs report

== round 1 == lanes: music, vector, wording | rows 11 | gates 1/2 | agent-minutes ? | verdict: accept (host gates green; literal gate retro-fails as E1)
  music      candidates 2 (A:exit0, B:exit0) | soup: dominates best=A
  vector     candidates 2 (A:exit0, B:exit0) | soup: dominates
  wording    candidates 1 (1:P1-P8)
  FAIL no-literal-token: 23 literals in work/music, 46 in work/two (gate did not exist in round 1)
  OPEN no browser listen yet (LUFS unmeasured); blind critic not run
```

Observations: `type.scale` is reported missing because the host shell defines no `--type-scale`; the rest resolved from the host alone. The 23 + 46 literal failures are real: round-1 candidates and their self-tests hard-coded fallback palettes and fixture colours before this gate existed — round 2 candidates read token roles and fixtures take colours from the resolved file.
