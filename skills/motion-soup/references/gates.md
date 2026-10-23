# motion-soup — universal gate predicates

Seven soup gates plus seven film-spec gates (§Film-spec gates, from `docs/rsi/FILM-SPEC-9.md` via `references/film-brief.md`) every host gets, independent of its own validator. Each has: what it asserts, how to implement it as a text or node predicate (≤ 15 lines, no deps), and one negative mutation that must make it fail — a gate that cannot be shown to fail is not a gate. The orchestrator runs these on every soup and every shipped single; the integrator ports the lane-specific ones into the host validator with the host's gate/mutation numbering.

Conventions below: `SRC` = module source text, `M` = module loaded in a node `vm` sandbox (or `require`), `T` = `work/tokens.resolved.json`, `R` = `skills/motion-soup/scripts/soup-runner.mjs`.

---

## 1. determinism

**Asserts.** The module is a pure function of `(t, seed, tokens, inputs)`. No wall-clock, no RNG, no animation loop in render or schedule paths. Seeking to the same `t` twice yields byte-identical output.

**Text predicate.**
```js
const bad = /Math\.random|Date\.now|performance\.now|requestAnimationFrame|setInterval/;
assert(!bad.test(SRC), 'forbidden clock/RNG token');
```
**Node predicate** (op-trace form for renderers, deep-equal form for planners).
```js
const trace = () => { const ops = []; const ctx = new Proxy({}, { get: (_, k) => (...a) => ops.push(k + JSON.stringify(a)) }); return { ctx, ops }; };
const a = trace(), b = trace();
M.renderFrame(a.ctx, 3.7, beat, T, 7, P, opts); M.renderFrame(b.ctx, 9.0, beat, T, 7, P, opts); M.renderFrame(b.ctx, 3.7, beat, T, 7, P, opts);
assert(a.ops.join('\n') === b.ops.slice(b.ops.length - a.ops.length).join('\n'), 'seek-history changed the frame');
// planners:
assert(JSON.stringify(M.plan(sheet, T, feel, 7)) === JSON.stringify(M.plan(sheet, T, feel, 7)) && JSON.stringify(M.plan(sheet, T, feel, 7)) !== JSON.stringify(M.plan(sheet, T, feel, 8)));
```
**Mutation.** `sed -i 's/seeded(seed)/Math.random()/' copy.js` → text predicate fails; or inject `ops.push(Date.now())` → trace predicate fails.

---

## 2. no-literal-token

**Asserts.** No colour literal in any candidate/soup/integration output that is not in `T.literals`. Fonts, easings, tempos are referenced by role (`tokens.type.display`, `tokens.motion.feels.<name>`, `tokens.tempo.range`), never spelled.

**Predicate.**
```
node R check-literals work/<lane> --tokens work/tokens.resolved.json      # exit 0
grep -nE "font-family\s*:\s*['\"]|['\"][A-Z][a-z]+ (Sans|Serif|Mono)['\"]" work/<lane>/soup.js   # expect no output
grep -nE "\b(bpm|tempo)\s*[:=]\s*[0-9]{2,3}\b" work/<lane>/soup.js                               # expect no output
```
The runner matches `#rgb/#rgba/#rrggbb/#rrggbbaa` and `rgb()/hsl()/oklch()` calls with numeric arguments; calls on variables (`rgba(h, a)`) are computed colours and pass. `vendor/` and `node_modules/` are ignored.

**Mutation.** Append `const FALLBACK = '#<six hex digits not in T.literals>';` to a copy → exit 1 with `file:line: #<that literal>`.

---

## 3. size caps

**Asserts.** Candidate/soup ≤ `SIZE_KB` (default 40), self-test ≤ 12 KB, MERGE-NOTES ≤ 80 lines, candidate .md ≤ 60 lines. Oversized modules hide duplication and blow the integrator's context.

**Predicate.**
```js
assert(fs.statSync('work/<lane>/soup.js').size <= SIZE_KB * 1024, 'soup over cap');
assert(fs.readFileSync('work/<lane>/MERGE-NOTES.md', 'utf8').split('\n').length <= 80);
```
**Mutation.** `yes '// pad' | head -3000 >> copy.js` → fails.

---

## 4. selftest-exit-0

**Asserts.** Every candidate ships `selftest-<I>.js`, every soup ships `selftest-merged.js`; each exits 0, prints `PASS`/`FAIL` lines, and contains ≥ 1 negative mutation that sets a `caught` flag. The repo test command is still the final judge; the self-test is the author's own claim, made checkable.

**Predicate.**
```js
const r = spawnSync('node', ['work/<lane>/selftest-merged.js'], { encoding: 'utf8' });
assert(r.status === 0 && /PASS/.test(r.stdout) && !/^FAIL/m.test(r.stdout));
assert(/caught|MUT-/.test(fs.readFileSync('work/<lane>/selftest-merged.js', 'utf8')), 'no negative mutation in selftest');
```
**Mutation.** Flip one `ok(` assertion to its negation in a copy of the self-test → exit 1.

---

## 5. dominance (soup ≥ best single)

**Asserts.** On the audit set (inputs never named in any prompt), the soup passes every gate the best single passes **and** is strictly better on ≥ 1 declared metric (predicates passed, modules covered, wording grade, op-trace stability). Otherwise ship the best single. This is the paper's open failure: a soup can regress to the mean.

**Predicate** (orchestrator, after mergers).
```js
const gates = (mod) => runGateTable(mod, AUDIT_INPUTS);   // host validator on a scratch copy, or selftest-merged with AUDIT inputs
const S = gates('work/<lane>/soup.js'), B = gates('work/<lane>/cand-<best>.js');
assert(S.passed.every(g => true) && B.passed.every(g => S.passed.includes(g)), 'soup loses a gate the single passed');
assert(S.metrics.some((m, i) => m > B.metrics[i]), 'soup not strictly better on any metric');
```
Write `work/<lane>/soupVsBest.json` `{passedSoup, passedBest, metrics, verdict}` and a ledger row `kind:"gate", gate:"dominance"`.

**Mutation.** Replace `soup.js` with a copy of `cand-<best>.js` → metrics equal → fails (ties are not dominance).

---

## 6. diversity floor

**Asserts.** Pairwise distance between candidates ≥ 0.35 (word-trigram Jaccard distance on source, or a lane-specific tell-apart over `{tempo/key | primitives/because | beat titles/say}`). Near-duplicates make the union empty and the merger's intersection trivially large.

**Predicate.**
```
node R diversity work/<lane>/cand-*.js --min 0.35       # exit 0; prints the matrix
```
**Mutation.** `cp cand-A.js cand-C.js` → distance 0.000 → exit 1 with the pair named. Remedy in the loop: one more candidate with a forced different `{{LENS}}`.

---

## 7. additive-schema-only

**Asserts.** Integration adds fields and gate ids; it never removes, renames or re-types an existing field, and never renumbers an existing gate. Existing fixtures (saved boards, schemes, storylines) load unchanged.

**Predicate** (diff of key sets, before vs after integration).
```js
const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) => v && typeof v === 'object' && !Array.isArray(v) ? keys(v, p + k + '.') : [p + k]);
const before = new Set(keys(require('./fixture.before.json'))), after = new Set(keys(require('./fixture.after.json')));
assert([...before].every(k => after.has(k)), 'a pre-existing field disappeared');
const ids = (src) => [...src.matchAll(/\bG\d\d\b/g)].map(m => m[0]);
assert(new Set(ids(VALIDATOR_BEFORE)).size <= new Set(ids(VALIDATOR_AFTER)).size && ids(VALIDATOR_BEFORE).every(g => VALIDATOR_AFTER.includes(g)));
```
**Mutation.** Rename `role` → `grammar` on one fixture beat → first assert fails; delete one `G##` line from the validator copy → second fails.

---

## Film-spec gates (FS-*)

The ⟂ lines of the 9-element film brief (`references/film-brief.md`), as predicates. Same conventions as above plus: `SHEET` = `work/beats.json` (the §5 beat-sheet table as `{beats:[{id, start, dur, grammar, say?, payoff?: true|number, textBox?: {x,y,w,h}}]}`; a numeric `payoff` is the mark's time, `true` means the beat start), `ROWS` = parsed `work/soup-ledger.jsonl` for round `K`, `BRIEF` = `work/BRIEF.md`, `LAYER` = the vector lane module. Host-agnostic: nothing here names a renderer, an encoder or a path outside `work/`. Each FS gate is run by the orchestrator at the loop step named in film-brief.md §Where each ⟂ line lands, and written as a `gate` ledger row (`gate:"FS-…"`).

### FS-hook

**Asserts.** The viewer is hooked inside two seconds: the first beat ends ≤ 2 s, **or** the first payoff mark is ≤ 2 s.

**Predicate.**
```js
const B = SHEET.beats; const mark = (b) => (typeof b.payoff === 'number' ? b.payoff : b.start);
const firstPayoff = Math.min(...B.filter((b) => b.payoff).map(mark), Infinity);
assert(B[0].start + B[0].dur <= 2 || firstPayoff <= 2, `no hook in the first 2 s (beat 1 ends ${B[0].start + B[0].dur}, first payoff ${firstPayoff})`);
```
**Mutation.** In a copy of `beats.json` set `beats[0].dur = 4` and delete `beats[0].payoff` → fails.

### FS-cadence

**Asserts.** A visual payoff every 3–5 s across the whole board: after the hook mark, consecutive payoff marks are 3–5 s apart, and the tail from the last mark to the end is ≤ 5 s.

**Predicate.**
```js
const marks = B.filter((b) => b.payoff).map(mark).sort((a, b) => a - b);
const end = Math.max(...B.map((b) => b.start + b.dur));
assert(marks.length >= 2, 'fewer than two payoff marks');
for (let i = 1; i < marks.length; i++) { const g = marks[i] - marks[i - 1]; assert(g >= 3 && g <= 5, `payoff gap ${marks[i - 1]}→${marks[i]} = ${g.toFixed(1)} s, want 3–5`); }
assert(end - marks[marks.length - 1] <= 5, `tail after last payoff > 5 s`);
```
**Mutation.** Delete the `payoff` flag from one mid-board beat → a gap > 5 s → fails.

### FS-textroom

**Asserts.** Every beat with a `say` (or `caption`) declares a reserved text box, and the vector layer's own audit confirms that box carries no other mark at that beat.

**Predicate.** (The vector lane contract gains one optional field — `audit(t, beat, tokens, seed, P, {box}) → {offPalette[], marksInBox[]}` — additive, so gate 7 holds.)
```js
for (const b of B.filter((b) => b.say || b.caption)) {
  const box = b.textBox; assert(box && ['x', 'y', 'w', 'h'].every((k) => typeof box[k] === 'number' && box[k] >= 0), `beat ${b.id} says but reserves no text box`);
  const a = LAYER.audit(b.start + b.dur / 2, b, T, 7, P, { box });
  assert(Array.isArray(a.marksInBox) && a.marksInBox.length === 0, `beat ${b.id}: ${a.marksInBox.length} mark(s) under the text`);
}
```
**Mutation.** Delete `textBox` from one `say` beat → first assert fails; or patch a copy of the layer to draw its spotlight at the box centre → `marksInBox.length > 0` → fails.

### FS-identity

**Asserts.** The character bible's identity lock survives every style change: the hash of BRIEF §4 (or `work/character-bible.md`) recorded at the `plan` stage row equals the hash at every later stage row and at verdict; rendering the character under two token sets that differ only in palette yields identical proportions.

**Predicate.**
```js
const crypto = require('node:crypto');
const bible = fs.existsSync('work/character-bible.md') ? fs.readFileSync('work/character-bible.md', 'utf8') : fs.readFileSync(BRIEF, 'utf8').split(/^## 5\./m)[0].split(/^## 4\./m)[1];
const h = crypto.createHash('sha256').update(bible.trim()).digest('hex').slice(0, 16);
const plan = ROWS.find((r) => r.kind === 'stage' && r.stage === 'plan');
assert(plan && plan.bibleHash === h, `bible hash ${h} ≠ plan-stage ${plan && plan.bibleHash}`);
for (const r of ROWS.filter((r) => r.kind === 'stage' && r.bibleHash)) assert(r.bibleHash === h, `stage ${r.stage} saw a different bible`);
if (LAYER.character) assert(JSON.stringify(LAYER.character(T_A).proportions) === JSON.stringify(LAYER.character(T_B).proportions), 'proportions changed with the palette');   // identity-lock test; T_A/T_B differ only in color.*
```
**Mutation.** Change one proportion ratio in the bible after the `plan` row → hash differs → fails; or make `character()` read a ratio from `tokens.color` → proportions differ → fails.

### FS-gateorder

**Asserts.** The workflow stages are walked in order — `plan → rig → stills → animatic → full → polish → audio → render` — as `stage` ledger rows; a `render` row (or any row) whose predecessor is missing in this round fails. Don't skip gates.

**Predicate.**
```js
const ORDER = ['plan', 'rig', 'stills', 'animatic', 'full', 'polish', 'audio', 'render'];
const seen = [];
for (const r of ROWS.filter((r) => r.kind === 'stage')) {
  const i = ORDER.indexOf(r.stage); assert(i >= 0, `unknown stage ${r.stage}`);
  const missing = ORDER.slice(0, i).filter((s) => !seen.includes(s));
  assert(!missing.length, `stage ${r.stage} logged before ${missing.join(',')}`);
  assert(r.pass === true, `stage ${r.stage} logged as failed`); seen.push(r.stage);
}
```
A round that covers only a subset (brief §7) stops at its last stage; the next round's first `stage` row must still have every earlier stage somewhere in the ledger (orchestrator: pass `ROWS` = all rounds when the brief says "previous rounds reached: …").

**Mutation.** Delete the `animatic` row from a copy of the ledger → the `full` (and `render`) row fails.

### FS-critique

**Asserts.** No `render` stage row until the last `critique` row has every score ≥ 8. Critique row shape: `{round, stills: [paths], scores: {axis → 1..10}, worst3: [3 strings], fixes: [strings]}`.

**Predicate.**
```js
const crit = ROWS.filter((r) => r.kind === 'critique'); const render = ROWS.find((r) => r.kind === 'stage' && r.stage === 'render');
for (const c of crit) { assert(Array.isArray(c.stills) && c.stills.length, 'critique without stills'); assert(c.worst3.length === 3, 'worst3 must name exactly three'); for (const [ax, s] of Object.entries(c.scores)) assert(Number.isInteger(s) && s >= 1 && s <= 10, `score ${ax}=${s} not in 1..10`); }
if (render) { const last = crit[crit.length - 1]; assert(last, 'render without a critique row');
  assert(new Date(last.ts) <= new Date(render.ts), 'critique written after render');
  const low = Object.entries(last.scores).filter(([, s]) => s < 8); assert(!low.length, `render while ${low.map(([a, s]) => a + '=' + s).join(',')} < 8`); }
```
**Mutation.** In a copy of the ledger set one score of the last critique row to 7 → the render row fails.

### FS-deliverables

**Asserts.** At the `verdict` row the five deliverables exist in the brief's §9 dir: final MP4, loop check, poster frame, contact sheet, clean source with a README.

**Predicate.**
```js
const D = (fs.readFileSync(BRIEF, 'utf8').match(/^- dir:\s*(\S+)/m) || [, 'work/deliver/'])[1];
const need = ['final.mp4', 'loop-check.json', 'poster.png', 'contact-sheet.png', 'README.md'];
const missing = need.filter((f) => !fs.existsSync(path.join(D, f)) || fs.statSync(path.join(D, f)).size === 0);
assert(!missing.length, 'missing deliverables: ' + missing.join(', '));
const lc = JSON.parse(fs.readFileSync(path.join(D, 'loop-check.json'), 'utf8'));
assert(lc.pass === true && typeof lc.seamDelta === 'number', 'loop check did not pass or carries no seamDelta');
assert(/^# /m.test(fs.readFileSync(path.join(D, 'README.md'), 'utf8')), 'README has no title');
```
**Mutation.** Rename `poster.png` in a copy of the dir → fails; set `loop-check.json` `pass:false` → fails.

---

## Host-specific gates

Whatever the repo test command already checks is host-specific and stays the final authority. In this repo: `node scripts/validate-motion-studio.mjs --selftest` (G01–G33, MUT-01…14). The integrator adds exactly one gate + one mutation per shipped lane, numbered after the host's last, with a plain-language name the UI can show. The lane's MERGE-NOTES §gate predicates is the source; the integrator may not weaken a predicate to make it pass — a predicate that cannot pass goes back to the lane as an open item.

## Evidence classes (used in ledger rows and proposed atoms)

| Class | Meaning | May change the contract? |
|---|---|---|
| E0 | contract clause | — |
| E1 | merger intersection / candidate proposal | no (expires after 2 rounds) |
| E2 | observed by a gate or telemetry | yes, via integrator |
| E3 | ratified by the owner | yes |
