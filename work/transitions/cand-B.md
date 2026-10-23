# cand-B — transitions lane, round 2 · lens: the mask follows the focus point

## Rationale
Every mask is born as a zero-area point at the incoming beat's single hot spot and grows (or shrinks) around it, so the eye never has to look for the cut.
Wipes carry a chevron whose tip rides the focus row, splits open on the focus column, irises open from / close onto the focus; callback and landing inherit the planted / hook focus.
Timing is one beat of the incoming feel's tempo token (`60 / tokens.tempo.byFeel[feel]`, clamped to the beats), easing only from `tokens.motion.feels[feel].ease` (linear when empty).

## Required slots
- **Q3 → because**: hook→attention · zoom-in→attention · cause→effect→continuity · callback→continuity · contrast→change · breather→character · landing→character
- **Q9 → transition.semantic** (≤14 words; {A}=outgoing label, {B}=incoming label, {M}=returned motif):
  - cause→effect: "{A} leads to {B}; the reveal runs forward into its focus."
  - contrast: "{B} answers {A} by contrast; the frame splits at the difference."
  - zoom-in: "{B} looks closer at {A}; the iris opens on its detail."
  - breather: "{A} settles into {B}; a hard cut lets the eye rest."
  - callback: "{B} returns to the planted {M}; the opening mask runs backwards."
  - landing: "{B} lands what {A} began; the iris closes onto one point."
  - hook (table only): "{B} opens the question; the reveal starts from its hot spot."
- **avoid G06 (determinism)**: no clock/random/rAF; FNV-1a hash of `seed|beat.id` is the only seed use; masks closed-form in u; selftest P6 deep-equals transitionFor, plan and maskAt.
- **avoid G31 (two.js no-op)**: `drawTwo(two, cmds)` returns `null` without touching `two` when `Two` (global or `window.Two`) is absent; selftest passes a throwing `two.add` to prove it.

## Relation → kind (ledger E2)
cause→effect = wipe (L→R) · contrast = split · zoom-in = iris · breather = cut · callback = REVERSE[table.hook] = wipe-back · landing = iris-back · hook = wipe.
Inference order: breather > landing > callback (`returns`) > contrast (say "But…", proof→proof with different claimId) > zoom-in (show/cameraMove/visualAction mentions zoom/push-in) > cause→effect.

## Modules and the gate that checks each
| module | what it does | checked by |
|---|---|---|
| `relationOf` | beat pair → relation | P2 + LENS synthetic split cases |
| `table`, `REVERSE` | relation → kind; callback derived from hook | P2, P7 mutation |
| `focusOf` | one hot spot per beat (`show` cues, thirds grid, plant/hook inheritance) | LENS (one point in [0,1]², = incoming focus, landing = hook focus, callback = planted focus) |
| `transitionFor` / `plan` / `normalize` | t0/t1 centred on toBeat.start, span = min(60/bpm, both durs) | P4, P6 |
| `semanticFor` (TEMPLATE) | relation sentence, word-clipped at 14 | P1 |
| `mask` | closed-form path commands per kind, born at focus | P3 (11 u × 4 foci, deep-equal) |
| `coverage` | shoelace area of mask, holes subtract | P3 monotone, 0 at u=0, 1 at u=1 |
| `ease` / `progress` / `maskAt` | f(t, tokens): ease from token feel only | P5 (no easing literal), P6 |
| `drawTwo` | two.js layer | LENS G31 no-op |
| source | no forbidden tokens, no colour/font/bpm/easing literals | P5 (+ soup-runner check-literals exit 0) |

## Predictions
- **predicted.wow**: 0.62
- **predicted.firstFlag**: contract §relation-inference — hook→claim on both example boards resolves to `zoom-in` (cameraMove `push-in`) rather than the contract's default `cause→effect`, because I rank zoom-in above the default; a gate expecting hook→claim = wipe will flag it first.

## mutationProof
Broke `breather: 'cut'` → `breather: 'wipe'` (in-memory copy, vm realm); P2 caught it ("sb-mcp-server breather beat-5 kind=wipe"); source untouched, unpatched copy re-checked clean.

## Open risk
- Focus comes from keyword cues in `show`; boards without spatial words fall back to the thirds grid by grammar (proof column picked by seed parity).
- `tokens.motion.feels.*` are empty in the resolved file, so all transitions are linear in u until feels carry an `ease` 4-tuple.
