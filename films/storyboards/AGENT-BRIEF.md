# Brief for a storyboard cluster agent (10 storyboards)

You write TEN one-minute, problem-first motion storyboards for ONE cluster of Manu's (CETI, cetiai.co) research and repos. Repo root: `/home/claude/ceti-motion-atlas-studio-pro/films` (FILMS). Write only inside `FILMS/storyboards/c<NN>/`. Don't run git, don't render anything, and don't edit shared files.

## Read first
1. `FILMS/storyboards/MASTER-META-PROMPT.md`: the category meta-prompt (mp-master-v1). You specialise it; you don't replace it.
2. `FILMS/storyboards/SCHEMA.json`: every storyboard must validate against it.
3. `FILMS/kh/caps/LONGFORM-60.md`: the one-minute format, symbol vocabulary, word rules and gates.
4. `FILMS/storyboards/CLUSTERS.md`: your row (repos plus the capability seed). Also `FILMS/kh/caps/RESEARCH.md` and `FILMS/storyboards/NOTION.md`.

## Steps
1. **Ground (fast, bounded: at most about 12 fetches in total).**
   - For each repo in your row, try the public GitHub page with WebFetch (`https://github.com/<owner>/<repo>`) to learn what problem it solves.
   - Private repos fail; for those, use the Notion search tool on the repo or topic name.
   - Write `c<NN>/GROUNDING.md`: per repo, the problem it solves in one line, plus any real numbers with their source URL.
   - Never invent a number. If there's no source, say so; the storyboard then marks it "Illustration".
2. **Specialise the meta-prompt.**
   - Load the skill `meta-suite:meta-prompting` with the Skill tool and follow it.
   - Specialise mp-master-v1 into a cluster meta-prompt `mp-c<NN>-v1`: fill the typed slots for your cluster, add the cluster's vocabulary, its symbols (drawn from the LONGFORM-60 vocabulary), the traps to avoid (the misconceptions and accuracy cautions), and your grounding.
   - Save it verbatim to `c<NN>/META-PROMPT.md`.
3. **Write ten storyboards** with your cluster meta-prompt, as `c<NN>/sb-<NN>-<01..10>.json`.
   - Spread them over your repos, audiences (Engineers, Leaders, Learners, Researchers, Everyone) and Wada combinations: 296, 279, 166, 339, 84, 207, 243 (from `FILMS/kh/kh-kit.js`).
   - Make them genuinely different: different hooks, problems, metaphors and endings. They are raw material for a later composition step that picks the best pieces across all 100, so variety is the point.
   - Keep the series' simple symbols: the whale, one line, pins, gates, seams, atoms, pods, the chart ground.
4. **Validate** every file with `python3 -c "import json,jsonschema,sys; jsonschema.validate(json.load(open(sys.argv[1])), json.load(open('FILMS/storyboards/SCHEMA.json')))" <file>`. Fix them until all ten pass.
5. **Self-score honestly.** In `score_self`, give 0–1 with a reason against the LONGFORM-60 gates. Then write `c<NN>/INDEX.md`: one line per storyboard (id, title, repo, the hook in 8 words, self-score), plus your two strongest and why.
6. **Save to Notion.** Fetch the data sources first to get the exact property names (ids are in NOTION.md).
   - **Meta-Prompts:** one row for `mp-c<NN>-v1` with Level Cluster, your Cluster option, Skill meta-prompting, Repos, Prompt ID, Storyboards made 10, Status Used, and Local file. The body is the meta-prompt verbatim inside a fenced code block, so Notion doesn't eat asterisks or underscores.
   - **Storyboards:** ten rows in a single create-pages call. Fill Name (the plain title), SB ID, Cluster, Repo, Capability, Problem, Audience, Hook, Metaphor, Ending, End belief, Wada, Score (your score_self), and Meta-prompt ID. The body is a readable storyboard: a beats table with t / picture / words / sound, then the real case with its source, the honest limit and the not-this line. Escape stray asterisks.

## Report (≤ 150 words)
Include: files written, the validation result (10 of 10?), the Notion URLs (the meta-prompt row plus the database), your two strongest storyboards with one line each, and any repo you couldn't ground.
