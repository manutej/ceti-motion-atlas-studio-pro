# CONTRACT — lane `transitions` (round 2, motion-soup rail test)

Module name: `TRANS`. Expose on `window.TRANS_<I>` (candidate) / `window.TRANS` (soup) and `module.exports`.

## API
```
TRANS.transitionFor(fromBeat, toBeat, tokens) → { kind, semantic, t0, t1, focus? }
   kind ∈ cut | wipe | split | iris | iris-back | wipe-back
   semantic: string ≤ 14 words naming the RELATION between the beats (never decoration)
   t0, t1: seconds on the storyboard clock; t0 = toBeat.start − dur/2, t1 = toBeat.start + dur/2
   focus?: {x, y} in [0,1]² (where the mask opens/closes)
TRANS.mask(kind, u, focus, w, h) → array of path commands [['M',x,y],['L',x,y],...,['Z']]
   closed-form in u ∈ [0,1]; no accumulated state; coverage(u) monotone non-decreasing
TRANS.table → { hook, 'cause→effect', contrast, 'zoom-in', breather, callback, landing } → kind
TRANS.coverage(kind, u, w, h) → number in [0,1]   (area revealed; used by the self-test)
TRANS.VERSION
```

## Beat shape (subset you may rely on — see work/wording/storyboard-grammar.md for the full schema)
```
{ id, grammar: hook|claim|proof|breather|callback|landing, start: sec, dur: sec,
  feel: one of tokens.motion.feels, claimId?, plant?: motifId, returns?: motifId,
  because: attention|continuity|change|character, say: string }
```
Relation inference: hook→claim = 'cause→effect' unless say starts with "But" → contrast; proof→proof = contrast if claimIds differ else 'cause→effect';
→breather = breather; callback (returns set) = callback; →landing = landing; a beat whose `show` mentions zoom/push-in = 'zoom-in'.

## Self-test predicates (selftest-<I>.js must check all; exit 0 only if all hold)
1. Every transition returned on the two example boards (load JSON blocks from work/wording/storyboard-grammar.md) has a non-empty `semantic` ≤ 14 words.
2. breather → `cut`; callback kind is the reverse of the hook's kind (wipe↔wipe-back, iris↔iris-back, cut↔cut); landing → iris-back or cut.
3. `mask(kind, u)` deep-equal on repeated calls for 11 values of u; `coverage` monotone over u for every kind.
4. For every consecutive pair, `t1 − t0` ≤ the shorter of the two beats' `dur`; no two transitions overlap in time.
5. Source text: no Math.random / Date.now / performance.now / requestAnimationFrame; no numeric easing constants outside values read from `tokens.motion`; no colour/font literals (check-literals exit 0).
6. Same (fromBeat, toBeat, tokens) twice → deep-equal result.
7. Negative mutation: patch a copy so breather → wipe; assert predicate 2 fails.

## Size cap: 18 KB per file. Tokens: work/tokens.resolved.json (roles only).
