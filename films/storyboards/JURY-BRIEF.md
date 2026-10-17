# Jury brief: score the pieces, pick the stitch

You are a juror seat. You did not write any of these storyboards ("the builder never judges"). The repo is at `/home/claude/ceti-motion-atlas-studio-pro/films` (FILMS). Write only your own output file. Do not run git or edit anything else.

## Material
- `FILMS/storyboards/stitch/slots/<slot>.tsv`: one TSV per piece slot, with 100 rows each. The slots are hook, problem, why, stakes, hint, metaphor, mechanism, case, limit, notthis, ending, belief and captions. Atom ids look like `<slot>.sb-NN-MM`.
- `FILMS/storyboards/c*/INDEX.md`: each cluster's own index and self-scores. Treat self-scores as claims, not evidence.
- `FILMS/kh/caps/LONGFORM-60.md`: the format and its gates. `FILMS/kh/caps/gate/REVIEW-v3.md` covers Gate v3. `FILMS/kh/caps/RESEARCH.md` has the accuracy cautions.
- `FILMS/storyboards/connective.json`: the three targets' goals (goal.conserve60, goal.stitch60, goal.gate-v3).

## Task
1. For each target (conserve60, stitch60, gate-v3), pick the best atom for every slot it needs, plus a runner-up. Pieces may come from any cluster. Cross-pollination is the point, as long as the piece can be adapted to the target without changing its meaning.
   - conserve60 and stitch60 need: hook, problem, why, stakes, hint, metaphor, mechanism, case, limit, notthis, ending, belief.
   - gate-v3 is short (about 26 s), so it needs: hook, problem, metaphor, mechanism, case, limit, notthis, ending, belief.
   - For each pick, give a score from 0 to 1 and a reason in 15 words or fewer, judged against the LONGFORM gates: problem first, symbol before word, captions of 8 words or fewer, sourced numbers, limit shown, simple symbols, and accuracy cautions respected.
   - The mechanism and case MUST fit the target capability. A real case must cite a real source that actually concerns that capability; otherwise pick one marked Illustration.
2. Score all 100 storyboards as wholes (0–1) and name the top 10 as future episodes. Give one line on why each is the strongest film idea and what problem it solves.
3. Flag any piece with an accuracy problem (an overclaim, an invented number, or a banned word) so it is never stitched.

## Output
Write `FILMS/storyboards/stitch/JURY-<SEAT>.json`:
```json
{"seat": "<SEAT>", "lens": "<your lens>",
 "targets": {"conserve60": {"hook": {"pick": "hook.sb-..", "score": 0.9, "why": "..", "runner_up": "hook.sb-.."}, ...}, "stitch60": {...}, "gate-v3": {...}},
 "boards": {"sb-01-01": 0.62, ...},
 "top10": [{"id": "sb-..", "score": 0.9, "why": ".."}],
 "flags": [{"atom": "case.sb-..", "problem": ".."}]}
```
Report in 120 words or fewer: your three strongest picks per target, and any flags.
