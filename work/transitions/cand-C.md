# cand-C — transitions, lens: cuts only, meaning carried by hold length

## Rationale
1. Every relation is first told by window length; the mask is the least the ledger allows (hook and callback are cuts, so the rhyme is the hold, not a shape).
2. Window = shorter beat dur × (tempo.range[0] / tempo.byFeel[feel of landing beat]) × relation weight; snap relations use range[0]/range[1], rest relations use 1.
3. Ratios only: no bpm, easing, colour or font value is written; beats without `feel` take one from their grammar role, checked against tokens.motion.feels.

## Slots
- Q3 because: cause→effect → continuity · callback → continuity · contrast → change · zoom-in → attention · breather → attention · landing → character.
- Q9 transition.semantic (≤ 14 words, clamped):
  - cause→effect: "{A} therefore {B}: the wipe carries cause into effect."
  - contrast: "{A} against {B}: the split holds both sides apart."
  - zoom-in: "{A} narrows to {B}: the iris pulls one point close."
  - breather: "{A} settles into {B}: a plain cut, the long hold rests."
  - callback: "{B} returns {motif}: the hook reversed, same hold."
  - landing: "{A} resolves in {B}: the iris closes on the answer."
- avoid G06: no clock or random source; transitionFor, schedule, mask and coverage are pure; P6 deep-equals two runs and P5 regex-scans the source.
- avoid G31: `twoLayer(two, …)` returns null unless the global Two and an instance with makePath both exist; P6 asserts the null.

## Table (relation → kind)
hook cut · cause→effect wipe · contrast split · zoom-in iris · breather cut · callback = reverse(hook) = cut · landing iris-back

## Holds on the example boards (2 s beats)
- cause→effect (rostrum/glaser): about 0.7 s window, a brisk wipe.
- breather (rest): the full 2 s, a cut centred in a long hold.
- callback (beat feel): 1 s cut.
- landing (held): about 1.7 s iris-back.

## Modules
| module | does | gate / predicate |
|---|---|---|
| table + REVERSE | relation → kind; callback derived from hook | P2 |
| relationOf | contract inference (breather, landing, callback, zoom-in, hook→claim "But", proof→proof claimId, hinge BUT fallback) | P1, P2 |
| BECAUSE | relation → because enum | P1 |
| SEMANTIC | per-relation sentence, clamped to 14 words | P1 |
| holdRatio / snapRatio | hold length from tokens.tempo ratios | P4, P5 |
| transitionFor | {kind, semantic, t0, t1, focus?, relation, because, feel}; focus only on iris/split | P4, P6 |
| schedule | normalises start/dur from totalDurationSec, emits transitions | P4, P6 |
| mask | closed-form rect/polygon paths; iris-back = rect + reversed circle (even-odd) | P3 |
| coverage | 48×48 even-odd sample of mask at centre focus | P3 |
| twoLayer | optional two.js layer; null without Two | G31 (P6) |

## Prediction
- predicted.wow: 0.46
- predicted.firstFlag: G-lens/wow (taste gate). The ledger fixes wipe, split and iris for most relations, so "cuts only" shows only in hook/callback/breather. The film reads as mostly wipes with varied holds, which may score as timid next to mask-rich candidates.
- Secondary risk: `relation`, `because` and `feel` are extra return fields. A strict shape gate that wants exactly {kind, semantic, t0, t1, focus?} would flag them.

## mutationProof
- Broke `breather: 'cut',` → `breather: 'wipe',` (in a vm copy, not on disk).
- Predicate P2 caught it ("table.breather must be cut").
- The original passes P2 again; restored (the file on disk was never changed).

## Open risk
- The example beats carry no `start`, `dur` or `feel`. `schedule()` spreads totalDurationSec evenly and takes the feel from the grammar role. A host that passes real start/dur values overrides this.
- zoom-in reads `show`/`visualAction` only, per the contract. `cameraMove: push-in` is ignored, so neither board triggers iris(zoom-in).
