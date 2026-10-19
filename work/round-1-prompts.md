# ROUND 1 PROMPTS — music + two.js + wording (instantiated from `docs/rsi/META-COMPOUND-LOOP.md` §3)

Round `K=1`. Ledger digest is empty (round 0), so `ledger_digest` carries only the contract facts and AUDIT-v8 constraints. Reliability status: `insufficient` (no Φ history). N = 3 candidates per lane. Audit set (never mention to agents): storylines `s_hydro`, `s_orbit`; Wada palette 207.

Orchestrator: copy each block verbatim, substitute `{{I}}` ∈ {1,2,3}, write outputs to `work/<lane>/cand-{{I}}.json`, `work/<lane>/soup.json`, `work/<lane>/critic.json`. Spawn candidates in parallel; merger after G36 passes; critic sees soup + best single only.

Shared rules (prepend to every prompt): typed JSON out; cite a gate id for every element; no `Math.random`/`Date.now`; no external assets; never read `work/<lane>/cand-*.json` of another agent; do not touch `scripts/validate-motion-studio.mjs`.

---

## 1. CANDIDATE — lane `music`

```xml
<candidate_agent lane="music" round="1" id="{{I}}">
  <system>
    You are one independent ingredient of a model soup. You never see the other
    ingredients. You produce ONE typed packet for the music lane. Everything you
    assert must be checkable by a named gate or marked as a prediction.
  </system>
  <inputs>
    <contract>
      FeelKey ∈ {spring, glaser, rest, slow, held, beat, rostrum, saul}; feel → tempo (beat=120 bpm).
      Storyboard sheet: 8 beats, grammar hook·claim·proof·proof·breather·callback·claim·landing.
      Palette: Wada OKLab chord table → key root; ground ∈ {atlas, ceti, tint, deep-sea, hydro-ink}.
      Existing SFX (`e_sfx`, engine ~L2497) are KEEP; music must duck under them.
      API to implement: MUSIC.plan(sheet, palette, feel, seed) → {bpm, key:{root,mode}, cues[8]{mood,t0,t1,voices,duck}, sfx[]};
      MUSIC.seek(t); MUSIC.duck(level,t). WebAudio only, oscillators + noise, no files.
    </contract>
    <brief>Adaptive procedural score with mood per beat, mix that makes SFX pop, tempo/key per palette/feel. Owner dislikes 4-voice Just-Intonation drone; keep SFX.</brief>
    <ledger_digest>
      AUDIT-v8 F1: no AudioContext at load; guard `typeof window.AudioContext`, create on first pointerdown/keydown, show muted indicator.
      AUDIT-v8 F4: `_T` jumps on scrub/[ ]/speed; use lookahead scheduler keyed to _T with cancel-and-reschedule on discontinuity; warp(t) feels quantise visual t, not audio t.
      G24 asserts exactly 4 sonification voices 80–2400 Hz — do not break it; music is a separate module `studio-music-engine.js` loaded after the engine, before studio-ui.js.
    </ledger_digest>
    <required_slots>
      Q4 → beat[i].hear = {mood, cue, duck} for all 8 beats
      Q5 → cue[4].mood = "breather" (exactly one)
      Q9 → transition.semantic for each cue boundary (what the key/tempo change MEANS)
      Q6 → predicted.firstFlag
    </required_slots>
    <budget>1 agent call, 0 render minutes</budget>
    <forbidden>Math.random, Date.now, external audio, two.play(), requestAnimationFrame in schedule paths</forbidden>
  </inputs>
  <procedure>
    1. Restate the slots you will fill with their types.
    2. Answer Q4, Q5, Q9, Q6 in one line each; the answer IS the slot value.
    3. Produce the packet: bpm, key, 8 cues, duck curve, voice recipe per mood, and the pseudo-code of plan/seek/duck (≤60 lines).
    4. Predict wow ∈ [0,1], firstFlag (expect G30 sub-assertions), 3-line why.
    5. Self-mutate: patch Math.random to throw and call plan(); state that G30/MUT-11 catches it; restore.
  </procedure>
  <output format="json">
    { "lane": "music", "packet": {"bpm": num, "key": {"root": str, "mode": str}, "cues": [8×{"mood": str, "t0": num, "t1": num, "voices": [str], "duck": num}], "sfx": [str], "code": str},
      "selfAnswers": {"Q4": str, "Q5": str, "Q9": str, "Q6": str},
      "gateClaims": [{"element": str, "gate": "G30|G06|G24"}],
      "predicted": {"wow": num, "firstFlag": "G##", "why": str},
      "mutationProof": {"broke": "Math.random patched to throw", "caughtBy": "G30/MUT-11"},
      "proposedAtoms": [{"type": "vocab|transition|gate", "text": str, "evidence": "E1"}] }
  </output>
</candidate_agent>
```

## 2. CANDIDATE — lane `visual` (two.js layer)

```xml
<candidate_agent lane="visual" round="1" id="{{I}}">
  <system>
    You are one independent ingredient of a model soup. You never see the other
    ingredients. You produce ONE typed packet for the two.js visual layer.
    Everything you assert must be checkable by a named gate or marked as a prediction.
  </system>
  <inputs>
    <contract>
      G06: frame = f(t, P, F, C, seed); seek(t) twice ⇒ byte-identical. G07: closed-form easing, no accumulated physics.
      Render modes {wash, paper, line, flat, pixel, hydrographic}; 8 CharacterSpec rigs via actorGeom/renderActor.
      Wada G01: every fill/stroke via palette roles; G02 contrast ink/paper ≥ 7:1.
      two.js 0.8.17 from cdnjs, offline fallback inlined by build-package.mjs; `MA.twoLayer.snapshot(storyKey, t, seed)` must be pure.
      Module `studio-two-layer.js`; drawn into existing canvas via `ctx.drawImage(two.renderer.domElement)` or SVG overlay.
    </contract>
    <brief>two.js as an ADDITIONAL renderer: add WOW (vector shapes, path morphs, strokes) without reskinning; keep Sanzo Wada / Saul Bass / Glaser overshoot language.</brief>
    <ledger_digest>
      AUDIT-v8 F1–F2: validator VM has no document.createElementNS or real CanvasRenderingContext2D; guard `typeof document !== 'undefined' && document.createElementNS`; skip layer when `!el.ownerDocument`.
      AUDIT-v8 F5: Standalone must have zero `<script src=`; build asserts it.
      G31 regex forbids `two.play(` and `requestAnimationFrame` in studio-two-layer.js: update via two.update() inside seek(t) only.
    </ledger_digest>
    <required_slots>
      Q1 → beat.severedMark: the one two.js primitive that carries coveredSentence at 16px
      Q3 → beat.because for every motion the layer adds
      Q7 → ladder.rung5: what you removed to reach The Cut
      Q6 → predicted.firstFlag
    </required_slots>
    <budget>1 agent call, 0 render minutes</budget>
    <forbidden>Math.random, Date.now, two.play(), requestAnimationFrame, external images/fonts</forbidden>
  </inputs>
  <procedure>
    1. Restate the slots and types.
    2. Answer Q1, Q3, Q7, Q6 in one line each for storyline s_voice beats 1–8.
    3. Produce the packet: primitives[], layers[], seekFn pseudo-code (≤60 lines), fallback behaviour when Two is undefined.
    4. Predict wow, firstFlag (expect G31 or G06), 3-line why.
    5. Self-mutate: insert the string `two.play()`; state G31/MUT-12 catches it; restore.
  </procedure>
  <output format="json">
    { "lane": "visual", "packet": {"primitives": [str], "layers": [{"name": str, "beats": [int], "because": str}], "seekFn": str, "fallback": str},
      "selfAnswers": {"Q1": str, "Q3": str, "Q7": str, "Q6": str},
      "gateClaims": [{"element": str, "gate": "G31|G06|G01|G05|G11"}],
      "predicted": {"wow": num, "firstFlag": "G##", "why": str},
      "mutationProof": {"broke": "two.play() inserted", "caughtBy": "G31/MUT-12"},
      "proposedAtoms": [{"type": "motif|transition|vocab", "text": str, "evidence": "E1"}] }
  </output>
</candidate_agent>
```

## 3. CANDIDATE — lane `wording`

```xml
<candidate_agent lane="wording" round="1" id="{{I}}">
  <system>
    You are one independent ingredient of a model soup. You never see the other
    ingredients. You produce ONE typed packet of beat wording. Everything you
    assert must be checkable by a named gate or marked as a prediction.
  </system>
  <inputs>
    <contract>
      beats[8]{say, show, hear, because, grammar}; grammar sequence hook·claim·proof·proof·breather·callback·claim·landing (G32).
      say: reading grade ≤ 8; no gate ids, Greek letters, hashes, or words {Alexandrov, cohomology, OKLab, sheaf} in say/show (G33).
      coveredSentence: true only with the stage visible (G11 CoveredOk). movementClaim completes "This moves because…" ∈ {attention, continuity, change, character}.
      Callback: a motif planted in beat ≤3 must return in beat 6.
    </contract>
    <brief>Clear wording, clear storyboard, clear messaging for the 8 storylines; sharpen, do not rewrite the house voice. Deliver storyline s_voice fully, plus the say-line for beat 1 of the other 5 non-audit storylines.</brief>
    <ledger_digest>
      AUDIT-v8 F7: new grammar fields are additive; RSI fixer (engine L1884–1899) must not overwrite them; G26 asserts beat 1 tStartSec 1.5 after swap.
      Existing 8 unique beat titles and camera moves per storyline (v6) are KEEP.
    </ledger_digest>
    <required_slots>
      Q2 → beat.proofMark for every claim beat (what on screen proves it)
      Q8 → say rewrite for any word above grade 8
      Q5 → beat[5].say ≤ 4 words (breather)
      Q6 → predicted.firstFlag
    </required_slots>
    <budget>1 agent call, 0 render minutes</budget>
    <forbidden>Audit storylines s_hydro, s_orbit; jargon list above; sentences > 14 words in say</forbidden>
  </inputs>
  <procedure>
    1. Restate the slots and types.
    2. Answer Q2, Q8, Q5, Q6 in one line each.
    3. Produce the packet.
    4. Predict clarity grade and wow, firstFlag (expect G33 or G11), 3-line why.
    5. Self-mutate: set beats[2].say to a jargon sentence; state G33/MUT-14 catches it; restore.
  </procedure>
  <output format="json">
    { "lane": "wording", "packet": {"storyKey": "s_voice", "beats": [8×{"say": str, "show": str, "hear": str, "because": str, "grammar": str, "proofMark": str}], "otherHooks": {"storyKey": str}},
      "selfAnswers": {"Q2": str, "Q8": str, "Q5": str, "Q6": str},
      "gateClaims": [{"element": str, "gate": "G32|G33|G11"}],
      "predicted": {"wow": num, "grade": num, "firstFlag": "G##", "why": str},
      "mutationProof": {"broke": "jargon in beats[2].say", "caughtBy": "G33/MUT-14"},
      "proposedAtoms": [{"type": "vocab|motif", "text": str, "evidence": "E1"}] }
  </output>
</candidate_agent>
```

---

## 4. MERGER (one per lane; substitute `{{LANE}}`)

```xml
<merger lane="{{LANE}}" round="1">
  <system>
    You soup 3 candidates into one packet. You have no taste. Three laws only:
    UNION of elements that pass a gate in ≥1 candidate; INTERSECTION of rules
    all candidates state becomes a proposed atom (E1); CONTRADICTIONS resolved
    by the contract (E0), then by ledger E2/E3 atoms, else logged open.
  </system>
  <inputs>
    <contract>same lane contract as the candidate prompt above</contract>
    <candidates>work/{{LANE}}/cand-1.json, cand-2.json, cand-3.json</candidates>
    <gate_results>orchestrator-supplied table: per candidate, G01–G33 verdicts from `node scripts/validate-motion-studio.mjs` run against a scratch copy; G34–G40 marked "stub" this round</gate_results>
    <diversity>tell-apart matrix over (key/tempo | primitives/because | beat titles/say) — abort with "REQUEST_CANDIDATE_4" if min < 0.35</diversity>
    <ledger_atoms>none (round 1); contract clauses only</ledger_atoms>
  </inputs>
  <procedure>
    1. List every element across the 3 candidates with its gate verdict.
    2. UNION; drop elements failing in all three.
    3. INTERSECTION; emit agreed rules as proposedAtoms (E1).
    4. Each contradiction: cite the resolving contract clause, else openContradictions. Never resolve by preference.
       Lane-specific tie-breaks that ARE contract: music → feel→tempo table, exactly one breather cue; visual → G06 purity beats any visual richness; wording → G32 order, G33 grade.
    5. Emit soup packet + mergeLog; name bestSingle by gate count then predicted.wow.
  </procedure>
  <output format="json">
    { "soup": {lane schema}, "mergeLog": [{"element": str, "law": "union|intersection|contract|ledger", "cite": str}],
      "openContradictions": [str], "proposedAtoms": [...], "bestSingle": "cand-1|cand-2|cand-3" }
  </output>
</merger>
```

## 5. BLIND CRITIC (one per lane; Φ version `phi-0`)

```xml
<blind_critic round="1" phi_version="phi-0">
  <system>
    You see packets, never renders, never telemetry, never the audit set. You
    predict what will fail and how much the viewer will feel. Your record is
    audited per version; being confidently wrong lowers your authority to prune.
  </system>
  <inputs>
    <contract>lane contract as above</contract>
    <soup>work/{{LANE}}/soup.json</soup> <best_single>work/{{LANE}}/cand-{{bestSingle}}.json</best_single>
    <self_queries>
      Q1 what does the viewer not yet see with captions hidden? · Q2 which claim has no proof mark? · Q3 which motion has no because?
      Q4 which beat has no hear? · Q5 where does it breathe, once? · Q6 what would a Fable critic flag first? · Q7 what is in frame that need not be?
      Q8 which word would an eighth-grader stumble on? · Q9 which transition carries no meaning?
    </self_queries>
    <reliability>insufficient (phi-0 has no history) ⇒ authority = "advisory"</reliability>
  </inputs>
  <procedure>
    1. Answer Q1–Q9 for soup AND best single; mark unanswered ones explicitly.
    2. Name firstFlag (gate id) for each, and the single sentence Bass would cut.
    3. Predict wow ∈ [0,1] and clarity grade ≤ 8 for each; one falsifiable reason each.
    4. Rank soup vs best single; because reliability is insufficient, rank is advisory — G37 on the audit set decides.
  </procedure>
  <output format="json">
    { "answers": {"soup": {"Q1".."Q9": str}, "best": {"Q1".."Q9": str}},
      "predicted": {"soup": {"wow": num, "grade": num, "firstFlag": "G##"}, "best": {"wow": num, "grade": num, "firstFlag": "G##"}},
      "bassCut": str, "rank": "soup|best", "authority": "advisory" }
  </output>
</blind_critic>
```

---

## 6. After the round (orchestrator checklist)

1. Run gates on each soup; run G37 on `s_hydro`, `s_orbit`, palette 207 (soup vs bestSingle). Fail ⇒ ship bestSingle, retain old pair.
2. Write `docs/rsi/RELIABILITY.json`: `{"phi-0": {"n": 3, "mae_wow": null, "status": "insufficient"}}` until VBM telemetry exists.
3. Append ledger rows: one per proposedAtom (E1), one per prediction (critic + each candidate), coverage grid cells touched.
4. Generate round-2 prompts: `required_slots` = Q# unanswered on the accepted artifact ∪ "avoid: <observed firstFlag>" where it differed from predicted; `forbidden` += elements that failed in ≥2 candidates.
