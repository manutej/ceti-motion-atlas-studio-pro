# motion-soup — universal gate predicates

Seven gates every host gets, independent of its own validator. Each has: what it asserts, how to implement it as a text or node predicate (≤ 15 lines, no deps), and one negative mutation that must make it fail — a gate that cannot be shown to fail is not a gate. The orchestrator runs these on every soup and every shipped single; the integrator ports the lane-specific ones into the host validator with the host's gate/mutation numbering.

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

## Host-specific gates

Whatever the repo test command already checks is host-specific and stays the final authority. In this repo: `node scripts/validate-motion-studio.mjs --selftest` (G01–G33, MUT-01…14). The integrator adds exactly one gate + one mutation per shipped lane, numbered after the host's last, with a plain-language name the UI can show. The lane's MERGE-NOTES §gate predicates is the source; the integrator may not weaken a predicate to make it pass — a predicate that cannot pass goes back to the lane as an open item.

## Evidence classes (used in ledger rows and proposed atoms)

| Class | Meaning | May change the contract? |
|---|---|---|
| E0 | contract clause | — |
| E1 | merger intersection / candidate proposal | no (expires after 2 rounds) |
| E2 | observed by a gate or telemetry | yes, via integrator |
| E3 | ratified by the owner | yes |
