# v9 Storyboard Grammar — HOOK → CLAIM → PROOF → BREATHER → CALLBACK → LANDING

Additive to the v8 beat schema (`studio-canvas-oauth.js` L118–142). Existing fields (`role`, `hinge`, `label`, `visualAction`, `cameraMove`, `activeSimultaneousMoves`, …) stay untouched for G08/G11 compatibility. v9 adds the fields below; the UI shows `say` as the card title and `show` as the body.

## Roles (ordered)

| grammar | count | job |
|---|---|---|
| `hook` | exactly 1, first | Make the viewer lean in. A question or a surprise. |
| `claim` | 1–2 | The one thing we want them to believe. |
| `proof` | 1–3 per claim | A concrete, visible demonstration of that claim. |
| `breather` | exactly 1 | Nothing new. Let the proof sink in. |
| `callback` | exactly 1 | Return to something planted in the hook. |
| `landing` | exactly 1, last | The takeaway in one line. Echoes the hook frame. |

## Per-beat fields (new)

| field | rule |
|---|---|
| `grammar` | one of the six roles above |
| `claimId` | required on `proof`: the `id` of the claim it demonstrates |
| `say` | ≤ 12 words, one idea, spoken or on-screen line, grade-7 reading level |
| `show` | the one visual change in this beat (a verb phrase) |
| `hear` | `{ music: section, sfx: [{ name, at }] }` — section ∈ `intro · build · peak · rest · return · outro`; sfx names from the engine cue list (`WHOOSH THUD CLICK BOOP BOING`) or the SFX vault |
| `because` | causal link to the previous beat, written as a sentence; it is the plain-English face of `hinge` (BUT → "but…", THEREFORE → "so…"); the G11 MovementOk reason |
| `plant` / `returns` | `hook` may set `plant` (a word or image); `callback` must set `returns` to that exact plant |
| `readingLevel` | target 7 (Flesch-Kincaid grade of `say` + `show`), gate fails above 8 |

## Rules

1. **One idea per beat.** If `say` needs an "and", split the beat.
2. **Claim/proof pairing.** Every `claim` is followed by at least one `proof` whose `claimId` points to it. A proof with no claim, or a claim with no proof, fails.
3. **Breather placement.** Exactly one `breather`; never first, never last, never directly after the hook. It has `activeSimultaneousMoves: 1` and `cameraMove: 'breather-hold'` (satisfies G11 OneBreather).
4. **Callback plant and return.** The hook names a `plant`; the callback's `returns` must equal it. The landing's `show` echoes the hook's `show` (satisfies the G08 regex `/echo|calm|first|hold|frame 0/`).
5. **Hinges stay.** Each beat still carries `hinge: BUT|THEREFORE`; `because` must start with "But" when hinge is BUT and "So" when THEREFORE.
6. **No internal names** in `say`, `show`, `because`: no gate IDs, rung numbers, Wada numbers, Greek letters, element codes.
7. **Six to eight beats.** The legacy builder emits 8; v9 accepts 6–8, padding `proof` beats, never breathers.

## Example 1 — technical: "What an MCP server is" (7 beats)

```json
{
  "id": "sb-mcp-server", "title": "What an MCP server is", "totalDurationSec": 14,
  "beats": [
    { "id": "beat-1", "index": 0, "grammar": "hook", "role": "hook", "hinge": "THEREFORE",
      "say": "Your AI is smart, but it cannot touch your files.", "plant": "locked drawer",
      "show": "Robot reaches for a filing drawer; the drawer is locked.",
      "hear": { "music": "intro", "sfx": [{ "name": "CLICK", "at": 0.9 }] },
      "because": "So we need a way in.", "readingLevel": 7,
      "label": "Locked Drawer", "visualAction": "Robot reaches for a filing drawer; the drawer is locked.", "cameraMove": "static-wide", "activeSimultaneousMoves": 1 },
    { "id": "beat-2", "index": 1, "grammar": "claim", "role": "threshold", "hinge": "BUT",
      "say": "An MCP server is a plug adapter for tools.",
      "show": "A small adapter box appears between robot and drawer.",
      "hear": { "music": "build", "sfx": [{ "name": "BOOP", "at": 0.3 }] },
      "because": "But a single adapter can open any drawer.", "readingLevel": 6,
      "label": "The Adapter", "visualAction": "A small adapter box appears between robot and drawer.", "cameraMove": "push-in", "activeSimultaneousMoves": 1 },
    { "id": "beat-3", "index": 2, "grammar": "proof", "claimId": "beat-2", "role": "escalation", "hinge": "THEREFORE",
      "say": "The server lists what it can do.",
      "show": "Three labeled cards slide out of the adapter: read, search, write.",
      "hear": { "music": "build", "sfx": [{ "name": "WHOOSH", "at": 0.2 }, { "name": "CLICK", "at": 0.6 }] },
      "because": "So the AI sees a menu, not a mystery.", "readingLevel": 5,
      "label": "The Menu", "visualAction": "Three labeled cards slide out of the adapter: read, search, write.", "cameraMove": "pan-follow", "activeSimultaneousMoves": 2 },
    { "id": "beat-4", "index": 3, "grammar": "proof", "claimId": "beat-2", "role": "turn", "hinge": "THEREFORE",
      "say": "The AI picks one and the server does it.",
      "show": "Robot taps 'read'; the drawer opens and a page floats back.",
      "hear": { "music": "peak", "sfx": [{ "name": "THUD", "at": 0.4 }] },
      "because": "So the AI never touches the drawer itself.", "readingLevel": 6,
      "label": "One Call", "visualAction": "Robot taps read; the drawer opens and a page floats back.", "cameraMove": "dutch-tilt", "activeSimultaneousMoves": 2 },
    { "id": "beat-5", "index": 4, "grammar": "breather", "role": "breather", "hinge": "THEREFORE",
      "say": "That is the whole trick.",
      "show": "Robot, adapter, open drawer hold still in wide empty space.",
      "hear": { "music": "rest", "sfx": [] },
      "because": "So take a second with it.", "readingLevel": 3,
      "label": "Breather Hold", "visualAction": "Robot, adapter and open drawer hold still in wide negative space.", "cameraMove": "breather-hold", "activeSimultaneousMoves": 1 },
    { "id": "beat-6", "index": 5, "grammar": "callback", "role": "climax", "hinge": "BUT", "returns": "locked drawer",
      "say": "Same adapter, any drawer: calendar, database, your inbox.",
      "show": "The locked drawer multiplies into six; the one adapter plugs into each.",
      "hear": { "music": "return", "sfx": [{ "name": "BOING", "at": 0.5 }] },
      "because": "But the first drawer was only the start.", "readingLevel": 7,
      "label": "Every Drawer", "visualAction": "The locked drawer multiplies into six; the one adapter plugs into each.", "cameraMove": "kick-shake", "activeSimultaneousMoves": 2 },
    { "id": "beat-7", "index": 6, "grammar": "landing", "role": "callback", "hinge": "THEREFORE",
      "say": "MCP: one plug, every tool.",
      "show": "Pull back to the first frame; drawer open, robot calm, echoing beat 1.",
      "hear": { "music": "outro", "sfx": [{ "name": "CLICK", "at": 1.2 }] },
      "because": "So remember the plug, not the wiring.", "readingLevel": 4,
      "label": "Calm Callback", "visualAction": "Final frame echoes Beat 1: drawer open, robot calm, first pose held.", "cameraMove": "pull-back", "activeSimultaneousMoves": 1 }
  ]
}
```

## Example 2 — non-technical: "The planning fallacy" (8 beats)

```json
{
  "id": "sb-planning-fallacy", "title": "The planning fallacy", "totalDurationSec": 16,
  "beats": [
    { "id": "beat-1", "index": 0, "grammar": "hook", "role": "hook", "hinge": "THEREFORE", "plant": "two-week sign",
      "say": "You said two weeks. It took three months.",
      "show": "A character hammers a sign reading 'two weeks' into the ground.",
      "hear": { "music": "intro", "sfx": [{ "name": "THUD", "at": 0.6 }] },
      "because": "So why does this keep happening?", "readingLevel": 4,
      "label": "Two Weeks", "visualAction": "A character hammers a sign reading two weeks into the ground.", "cameraMove": "static-wide", "activeSimultaneousMoves": 1 },
    { "id": "beat-2", "index": 1, "grammar": "claim", "role": "threshold", "hinge": "BUT",
      "say": "We plan from the best case, not the record.",
      "show": "A thought bubble shows a smooth straight road.",
      "hear": { "music": "build", "sfx": [{ "name": "BOOP", "at": 0.3 }] },
      "because": "But the road we imagine is not the road.", "readingLevel": 6,
      "label": "Best Case", "visualAction": "A thought bubble shows a smooth straight road.", "cameraMove": "push-in", "activeSimultaneousMoves": 1 },
    { "id": "beat-3", "index": 2, "grammar": "proof", "claimId": "beat-2", "role": "escalation", "hinge": "THEREFORE",
      "say": "Real roads have potholes we never draw.",
      "show": "The bubble road sprouts potholes, detours, and a flat tire.",
      "hear": { "music": "build", "sfx": [{ "name": "BOING", "at": 0.4 }, { "name": "CLICK", "at": 0.9 }] },
      "because": "So the plan was already wrong on day one.", "readingLevel": 5,
      "label": "Potholes", "visualAction": "The bubble road sprouts potholes, detours and a flat tire.", "cameraMove": "pan-follow", "activeSimultaneousMoves": 2 },
    { "id": "beat-4", "index": 3, "grammar": "proof", "claimId": "beat-2", "role": "turn", "hinge": "THEREFORE",
      "say": "Students guessed 34 days. Average: 55.",
      "show": "Two bars grow side by side; the second keeps growing past the first.",
      "hear": { "music": "peak", "sfx": [{ "name": "WHOOSH", "at": 0.2 }] },
      "because": "So even careful people miss by half.", "readingLevel": 5,
      "label": "The Numbers", "visualAction": "Two bars grow side by side; the second keeps growing past the first.", "cameraMove": "dutch-tilt", "activeSimultaneousMoves": 1 },
    { "id": "beat-5", "index": 4, "grammar": "breather", "role": "filter", "hinge": "THEREFORE",
      "say": "Everyone does this. Not just you.",
      "show": "The two bars hold still in wide open space.",
      "hear": { "music": "rest", "sfx": [] },
      "because": "So no shame, just a pattern.", "readingLevel": 3,
      "label": "Breather Hold", "visualAction": "The two bars hold still in wide negative space.", "cameraMove": "breather-hold", "activeSimultaneousMoves": 1 },
    { "id": "beat-6", "index": 5, "grammar": "claim", "role": "breather", "hinge": "BUT",
      "say": "The fix: ask how long it took last time.",
      "show": "Character flips open a notebook of past projects.",
      "hear": { "music": "return", "sfx": [{ "name": "CLICK", "at": 0.3 }] },
      "because": "But the record beats the imagination.", "readingLevel": 5,
      "label": "Look Back", "visualAction": "Character flips open a notebook of past projects.", "cameraMove": "push-in", "activeSimultaneousMoves": 1 },
    { "id": "beat-7", "index": 6, "grammar": "proof", "claimId": "beat-6", "role": "climax", "hinge": "THEREFORE",
      "say": "Past projects say ten weeks. Plan ten.",
      "show": "Notebook pages fan out; a new sign reads 'ten weeks'.",
      "hear": { "music": "return", "sfx": [{ "name": "THUD", "at": 0.7 }] },
      "because": "So the new sign comes from evidence.", "readingLevel": 4,
      "label": "Ten Weeks", "visualAction": "Notebook pages fan out; a new sign reads ten weeks.", "cameraMove": "kick-shake", "activeSimultaneousMoves": 2 },
    { "id": "beat-8", "index": 7, "grammar": "landing", "role": "callback", "hinge": "THEREFORE", "returns": "two-week sign",
      "say": "Plan from the record, not the dream.",
      "show": "Pull back; the old two-week sign leans in the corner, echoing beat 1.",
      "hear": { "music": "outro", "sfx": [{ "name": "CLICK", "at": 1.0 }] },
      "because": "So the first sign becomes the lesson.", "readingLevel": 4,
      "label": "Calm Callback", "visualAction": "Final frame echoes Beat 1: the old sign leans in the corner, first pose held.", "cameraMove": "pull-back", "activeSimultaneousMoves": 1 }
  ]
}
```

Note on example 2: the `callback` and `landing` roles are merged into the last beat because the second claim/proof pair needs the slot; the gate accepts `landing` carrying `returns` when no separate `callback` beat exists.
