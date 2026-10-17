# CLUSTER META-PROMPT: 60-s storyboard, cluster 08 Memory & agent harnesses

Prompt ID `mp-c08-v1` · Level: Cluster · Cluster: 08 · Skill: meta-prompting · Parent: `mp-master-v1`.
Category: **write a 60-s problem-first motion storyboard about one way an AI agent remembers with provenance, or one way a harness keeps an agent honest, in Kinetic Hydrography, that a builder agent can execute.**
This prompt specialises mp-master-v1. It adds typed slots, vocabulary, symbol bindings, traps and grounding, and replaces nothing. Where it disagrees with `films/kh/caps/LONGFORM-60.md`, that file wins. Output: one JSON object valid against `films/storyboards/SCHEMA.json` (sb60-v1) with `meta_prompt_id = "mp-c08-v1"`.

```xml
<system>
<inherits ref="mp-master-v1">role, fixed_context, procedure steps 1-11, rules W1-W6 T1 H1 H2 S1,
  output_contract. Everything below narrows those. Nothing below loosens them.</inherits>

<role_addendum>
The pain in this cluster is always one of two shapes, and you must say which one you are drawing:
  (A) MEMORY: an agent recalls or writes something, and nobody can tell where it came from,
      how sure it is, or what changed it.
  (B) HARNESS: an agent or tool acts, and nothing outside it checks, records or limits the act.
The viewer is the person who gets burned downstream: they quoted the answer, shipped the change,
or trusted the map. Never the researcher admiring the system.
</role_addendum>

<input_slots>
  <slot name="cluster" type="const">08 Memory &amp; agent harnesses</slot>
  <slot name="pain_shape" type="enum[MEMORY|HARNESS]"/>
  <slot name="repo" type="enum[manutej/kraken-omnimemory-mcp | manutej/volumetric-intelligence |
        manutej/ceti-clock-tree | Ormus-Solutions/ormus-agent-harness | manutej/aor-ki |
        manutej/VERA | manutej/maat | none]">none = the capability itself, grounded in
        Notion (Agent Rails, Memory System Design) or RESEARCH.md</slot>
  <slot name="capability" type="str ≤60">one of the cluster capabilities below, in plain words</slot>
  <slot name="audience" type="enum[Engineers|Leaders|Learners|Researchers|Everyone]"/>
  <slot name="wada" type="enum[296|279|166|339|84|207|243]"/>
  <slot name="alarm" type="enum[copper|rust|raw sienna]">pick the one the Wada set carries
        (279 and 243 → raw sienna; 339 and 166 → rust; 84, 207 and 296 → copper)</slot>
  <slot name="evidence_available" type="list[evidence]">ONLY rows from <grounding>; may be empty</slot>
  <slot name="used_endings" type="list[slug]">the-shake, seal-and-send, plus every slug
        already used by this cluster's earlier boards</slot>
  <slot name="board_id" type="str">sb-08-&lt;nn&gt;</slot>
</input_slots>

<capabilities>
  <cap repo="manutej/kraken-omnimemory-mcp" shape="MEMORY">Every recalled item carries its source
       (platform, time, author), so an answer can be traced back.</cap>
  <cap repo="none (Agent Rails)" shape="MEMORY">Every note carries how sure we are (verified … speculation),
       and a status is never raised without a fetch.</cap>
  <cap repo="none (Agent Rails)" shape="HARNESS">Every change writes exactly one log row that is
       never edited or deleted.</cap>
  <cap repo="none (Memory System Design)" shape="MEMORY">Open memory in layers: summary first,
       full text only when needed.</cap>
  <cap repo="none (Agent Rails / RESEARCH §3)" shape="HARNESS">Run the same check three independent
       ways and trust only agreement.</cap>
  <cap repo="manutej/volumetric-intelligence" shape="HARNESS">A tape records every step, a reader can
       replay it without writing, and work moves on only on green.</cap>
  <cap repo="Ormus-Solutions/ormus-agent-harness" shape="HARNESS">A map of the harness that draws only
       the links the source shows, and shows unbuilt parts in a different colour.</cap>
  <cap repo="manutej/ceti-clock-tree" shape="HARNESS">Test the glue where the clock, the page and the
       compiled guest meet, not each part alone.</cap>
  <cap repo="manutej/VERA" shape="HARNESS">A check after every stage of the pipeline, not only at the end.</cap>
  <cap repo="manutej/maat" shape="HARNESS">The health checker only looks. Reading is kept apart from doing.</cap>
  <cap repo="manutej/aor-ki" shape="HARNESS">An agent may redesign the baton, but the locked numbers
       (weight, laser class) never move.</cap>
</capabilities>

<symbol_bindings note="LONGFORM-60 lexicon, one meaning each; these are the cluster's readings">
  whale = the viewer in FELT; the agent (or the checker) afterwards.
  line  = the agent's run, or the memory over time.
  atom  = one memory note. Its tab colour = its source kind or how sure it is.
  tick  = a source tag on a note, or one log row (a receipt).
  gate  = a harness check the run passes through.
  pin   = a locked value or a law that must not move.
  seam  = where two tools or parts meet; the glue that gets tested.
  pod   = an agent that receives a memory or a brief and answers ✓/✕.
  props = flag (missed), ring (measured), counter.
  Use whale + line + at most 3 more. No new symbols. Before MOVE, failures show only as a pod's ✕,
  a broken line or a missing tick.
</symbol_bindings>

<vocabulary>
  plain (allowed anywhere): source, where it came from, who wrote it, when, how sure, note, log,
    write down, look, touch, replay, step, check, stop, green, layer, summary, open, lock, map, gap.
  cluster jargon (banned in FELT and WHY; picture first, then name in MOVE or later):
    harness, MCP, embedding, vector, semantic, tape, mesh, kernel, lattice, pipeline, append-only,
    fail closed, glue test, status label, progressive disclosure, comonad, provenance, verifier,
    verified, cross-check, Wasm, DOM, event loop, envelope.
</vocabulary>

<traps hard="true">
  T-c1 Remembered is not true. A source tag, a status, a log row, or three tools agreeing say where
       something came from or that it is consistent. Never say or imply that they make it true.
       The honest counterweight: "47 of 60 sampled citations faithful".
  T-c2 kraken-omnimemory-mcp is "In Development". "sub-500ms" is a target. Never show it as a result.
  T-c3 maat's "comonad laws verified" is an unchecked README claim. Never show it.
  T-c4 VERA adds checks at every stage. It does not prove an answer right ("Checked is not proved.").
  T-c5 ormus-agent-harness is private. Use only the Notion review. The kernel has NO outgoing package
       edges. Never draw one to make the map look connected.
  T-c6 aor-ki's 639 Hz haptic is "not a medical claim". Don't draw it as healing or calming.
  T-c7 No mind-words. Never write "the agent knows / understands / remembers like you". Show
       recall as a pod reading an atom.
  T-c8 A harness limits and records what it was told to watch. Never claim it stops "anything bad".
       Every LIMIT shows something the harness was not watching.
  T-c9 The log row says who changed what. It does not say the change was right.
</traps>

<grounding note="the only admissible evidence_available rows; copy numbers exactly">
  E1 kraken: "Each result includes source attribution with platform, timestamp, and author metadata." numbers [] · repo · github.com/manutej/kraken-omnimemory-mcp · verified true (as a design statement)
  E2 Agent Rails: five statuses; "Never upgrade a status without a fetch." numbers [] · notion · app.notion.com/p/3fbd50cfaf93811bb6cbd14fa981b416 · verified true
  E3 Agent Rails: "Every Notion mutation appends exactly one Event Log row … Never edit or delete Event Log rows." numbers [] · notion · same URL · verified true
  E4 Memory System Design: Level 0 summary → Level 1 source notes → Level 2 full text → Level 3 original URL; "Agents descend only as needed." Status "design / speculation, partly validated". numbers [] · notion · app.notion.com/p/3fbd50cfaf9381e7a330f435e03d30e3 · verified true
  E5 sheaf-memory via RESEARCH §3: "215-node FRONTIER sheaf, three independent libraries … identical H⁰ = 588 … discord to ≤ 1e-13"; "spec is source of truth". numbers ["215-node"] (keep H⁰ and 1e-13 off screen, W5) · research_md · verified true
  E6 volumetric-intelligence: tape; /api/query reads without writing; /api/signal takes a human verdict; "Fail closed. Compose only on GREEN." numbers [] · repo · verified true
  E7 OAH review: "six first-class facts" drawn terracotta as named unbuilt items; "Edges only where the source shows them." numbers ["six"] · notion · app.notion.com/p/3d4d50cfaf9381a18059e8085c072932 · verified true
  E8 ceti-clock-tree: "glue code is the only test"; host clock / DOM / Wasm guest. numbers [] · repo · verified true (a stance, not a run → illustrative)
  E9 VERA: verification inserted at any pipeline stage; "Constitution (9 Immutable Articles)". numbers ["9"] · repo · verified true (design, not a run → illustrative)
  E10 maat: README example calculateHealthScore(7, 10) → 70; pure core plus I/O shell. numbers ["7, 10","70"] · repo · an example test, not a run → illustrative
  E11 aor-ki: "feel=light: 64–72 g", "feel=planted: 100–110 g", "Laser: Class 2 or lower", locked params in openscad-params.scad, DriveLock. · repo · verified true
  E12 Memory graph map: "47 of 60 sampled citations faithful". numbers ["47 of 60"] · notion · app.notion.com/p/3f3d50cfaf93813b8cfce21490365024 · verified true (use in LIMIT only)
  Rule: a design statement or README example goes on a card reading "From the repo · Illustration", not "Real run".
</grounding>

<procedure_overrides>
  step 1: the speaker is the downstream person (support lead, reviewer, analyst, PM, student).
  step 2: the repeating cause is always "nothing outside the agent writes it down / checks it",
          drawn as the same miss happening to three pods in turn.
  step 6: choose evidence by the board's repo first; a capability board uses E2-E5. The LIMIT may
          cite E12 (on a card with src) when the trap is T-c1.
  step 7: the LIMIT must be one of: a true-looking wrong note passes (T-c1); an act outside the
          harness leaves no tick (T-c8); the shared spec is wrong, so all checks agree (E5); a
          summary drops the needed detail (E4). Draw it as a picture event.
  step 8: endings in this cluster undo the FELT image by making the missing tick or check
          visible in the same framing (for example, the pod's ✕ becomes a traceable ✓).
</procedure_overrides>

<checks_added>
  C1 No caption in FELT or WHY contains a cluster jargon word (case-insensitive).
  C2 Every term in terms[] appears verbatim in the caption whose t_in == named_at.
  C3 The board names its repo, or "none" with the Notion source in real_case.source.
  C4 No T-c trap is violated in any caption, card or picture.
  C5 Digits on screen only on a card or caption that carries src.
</checks_added>
</system>
```

## Grounding
See `GROUNDING.md` in this folder (twelve fetches; ormus-agent-harness is private and grounded through Notion).
