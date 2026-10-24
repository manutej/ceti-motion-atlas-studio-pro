# TYPED META-CONTRACT: CETI Motion Atlas & Narrative Design Studio (`CETI-MOTION-STUDIO-V1.0`)

**Contract ID:** `CETI-MOTION-STUDIO-V1.0`  
**Lineage:** `Motion Atlas Explorer` (171 Notion nodes, 13 styles, 6 storylines, 24 elements, 6 feels) $\times$ `ARTE/hyperframes/pipeline/TYPES.md` (Sheaf Packet & Restriction Glue) $\times$ `ARTE/orpheum` (Sanzo Wada 348-Combination Dictionary, OKLab Chord Algebra, Content-Addressable Session Vault) $\times$ `Kinetic Hydrography` (`philosophy.md` + `motion-atlas-plates.pdf`) $\times$ `saul` & `rem` Co-Expression Protocol.  
**Status:** SPEC-FIRST RATIFICATION (`16/16 Binary Conservation Gates Defined`)

---

## 0. Why This Contract Exists (What We Keep, What We Generalize, What We Refuse)

From your existing exploration in [`Motion Atlas Explorer`](file://WORKSPACE/ARTE/motion-atlas/source_bundle/Motion%20Atlas%20Explorer.dc.html), [`ARTE/hyperframes/pipeline/TYPES.md`](file://~/Documents/ARTE/hyperframes/pipeline/TYPES.md), [`ARTE/orpheum/docs/ORPHIC-META-SPEC.md`](file://WORKSPACE/ARTE/orpheum/docs/ORPHIC-META-SPEC.md), and [`Kinetic Hydrography`](file://~/Downloads/philosophy.md), four structural truths are already proven:

1. **The Prompt is 10%; the Harness & Typed Packets are 90%.** Open strings and untyped "vibe prompts" produce LLM slop. Every stage in this studio is a typed packet (`CanvasDecision → Intake → ClaimsFile → Brief → Direction → Storyboard → ShotList → CompositionSet → CheckReport`) governed by four morphism classes (`collect`, `derive`, `choose`, `gate`) and sheaf restriction equality $\rho(\text{later}) = \text{frozen earlier}$.
2. **One Deterministic Clock (`frame = f(t)` / `window.seek(t)`).** Every proof, storyboard panel, character rig preview, and infinite-canvas node is a pure function of time $t$, palette $P$, feel $F$, character rig $C$, and seed $s$. No `Math.random()`, no `Date.now()`, no CSS `@keyframes` for narrative motion.
3. **Harmonic Color Pinning is a Mathematical Law, Not a Color Picker.** Every color on every frame is automatically pinned to **Sanzo Wada's *Haishoku Sōkan* (348 combinations)** + the **17 Atlas Watercolor Plates** + the **7 Kinetic Hydrography Survey Plates (`Nos. 296, 279, 166, 243, 339, 84, 207`)**, with automatic contrast verification ($\ge 7:1$ ink on paper or luminous edge on deep-sea `#1A1F2E`), OKLab perceptual chord resolution on overlaps, and $\Delta E_{2000}$ nearest CETI design-system token mapping.
4. **Characters Are Parametric Actors, Never Hardcoded to One Species.** In `Motion Atlas Explorer`, the humpback whale (`whaleGeom`, `whale`, `whaleStreaks`) was hardcoded into the rendering engine. In this contract, the whale is **one inhabitant** (`char_ceti_whale`) of a general **Parametric Character & Emblem Rig Algebra (`CharacterSpec`)** that supports any character, mascot, instrument, or severed Saul-Bass emblem across multiple interaction modes (`hero-journey`, `filter-engine`, `guide-pointer`, `retriever-carrier`, `continuous-morph`, `dialogue-duet`, `simulation-driver`, `hydrographic-trace`).

---

## 1. Closed Vocabularies & Enums

Unknown enum values fail parse at the packet boundary.

```typescript
export type StudioSurfaceMode =
  | "infinite-canvas"    // Infinite-zoom living pasteboard with DAG story forks & live canvases
  | "fork-explorer"      // 5-Lens guided decision tree (Look, Use, Story, Character, Register)
  | "character-foundry"  // Parametric Character Rig & Saul Bass 5-Rung Reduction Ladder studio
  | "storyboard-sheet"   // S4/S5 Beat-locked Storyboard, ShotList & Captions-Covered Stills room
  | "wada-chord-matrix"  // 348 Sanzo Wada + 17 Atlas + 7 Hydrographic plates + OKLab chord proof
  | "contact-sheet"      // All 13 styles × active character × active Wada palette on one clock
  | "compile-export";    // Stage-1 Brief, HyperFrames/Remotion/anime.js bundle, WebM/PNG export

export type ForkLensId = "look" | "use" | "story" | "character" | "register";

export type StyleKey =
  | "watercolor"   // A1 · Watercolor storybook cartoon
  | "cutout"       // A1 · Paper-cutout stop-motion (12 fps held boil)
  | "doodle"       // A1 · Stick-figure / hand-ink doodle narrative
  | "pixel"        // A2 · Low-res pixel art (quantized grid + hit-stop)
  | "voxel"        // A2 · Retro isometric low-poly & voxel 3D
  | "orbit"        // A2 · 3D cinematic camera orbit
  | "morph"        // B1 · Never-cut morphing container film
  | "kinetic"      // B1 · Beat-locked kinetic type showreel (120 BPM)
  | "hybrid"       // B1 · Hybrid generative-plate + code telemetry layer
  | "editorial"    // B2 · Editorial explainer collage
  | "whiteboard"   // B2 · Whiteboard vector shape-grammar diagram
  | "sim"          // B2 · Interactive simulation explainer
  | "overlay"      // B2 · Talking-head side-third overlay b-roll
  | "hydrographic" // C1 · Kinetic Hydrography survey plate (ghosts, bearing ring, soundings)
  | "saul-severe"; // C2 · Saul Bass cut-paper overture (7-beat disturbance & severance)

export type FeelKey =
  | "spring"       // Physical underdamped spring (anticipation 0.2s, stretch 1.28, f=2.4, damp=7)
  | "glaser"       // CETI house ease cubic-bezier(0.22, 1, 0.36, 1) — fast arrival, no overshoot
  | "rest"         // CETI rest ease cubic-bezier(0.4, 0, 0.6, 1) — symmetric, unhurried
  | "slow"         // Half-speed tide (0.5x) with house ease — "Slow down, filter noise"
  | "held"         // Quantized 12 fps held-frame cadence (2 frames per drawing + seeded boil)
  | "beat"         // Beat-locked 120 BPM (0.18s burst on 0.5s grid, hold between)
  | "rostrum";     // Saul Bass rostrum cut-ease: outCut = 1-(1-x)^3, binary opacity, zero fade

export type GroundMode =
  | "atlas"        // Atlas warm paper (#FBF3E6)
  | "ceti"         // CETI field-manual paper (#F5EFE3)
  | "tint"         // 78% paper + 22% Wada primary pigment tint
  | "deep-sea"     // CETI marketing bathysphere navy (#1A1F2E) — light at the edge
  | "hydro-ink";   // Kinetic Hydrography deep water (#141A21)

export type SpineArcId =
  | "count-scale-compare-rest" // Research data film spine (JobCSC)
  | "follow-a-process"         // Step-by-step mechanism spine (JobProcess)
  | "understand-one-idea"      // Teaching explainer spine (JobTeach)
  | "saul-seven-beat"          // Field → Entrance → Accumulation → Lock → Disturbance → Resolution → Hand-off
  | "rem-five-move"            // Collect → Taxonomy → Section Diagram → Conjecture (†) → Manifesto
  | "hero-inner-change";       // Silence/Grey → Contact → Transformation → Leap → Calm Hold

export type CharacterRenderMode =
  | "wash"         // Watercolor multiply wash + ink contour + belly/dorsal shading
  | "paper"        // Torn/cut irregular polygon collage with paper knockout border
  | "line"         // Seeded multi-pass hand-wobble ink line (rough/drawPartial)
  | "flat"         // Hard-edged flat Saul Bass vector silhouette
  | "pixel"        // Quantized low-res sprite matrix
  | "hydrographic";// Ghost-position survey trail + bearing ticks + datum drop-lines

export type CharacterLocomotion =
  | "undulate"     // Axial wave propagation bend(s, t) — whale, fish, ribbon, serpent, current
  | "avian"        // Wing-beat dihedral articulation + pitch glide — falcon, crane, gull
  | "biped"        // Stride + torso bob + arm swing + 6-12fps walk cycle — scribe, figure
  | "instrument"   // Mechanical/nautical pivot rotation + pendulum swing — bathysphere, sextant, dividers
  | "dihedral"     // Concentric rotational symmetry Dn + harmonic pulse — Orpheum geome, lantern, compass
  | "emblem";      // Saul Bass severed form (shear, bend-wrong, wedge-subtract, rotation-to-lock)

export type CharacterInteractionMode =
  | "hero-journey"       // Character undergoes state transformation (grey->color, broken->whole)
  | "filter-engine"      // Character ingests high-entropy noise and emits ordered lines/structures
  | "guide-pointer"      // Character enters margin/side-third, points at beats/claims, nods, exits
  | "retriever-carrier"  // Character visits spatial nodes, gathers relevant fibers, returns synthesis
  | "continuous-morph"   // Character feature (eye/core) morphs uncut into diagram card and back
  | "dialogue-duet"      // Two characters (or character + speaker plate) exchange signals across a rule
  | "simulation-driver"  // Character operates a physical parameter (angle, cursor, lever, frequency)
  | "hydrographic-trace";// Character is plotted as N ghost positions at Δt intervals with depth soundings
```

---

## 2. Sanzo Wada Harmonic Color Law (`WadaHarmonicPalette`)

Colors in the studio **never** come from an arbitrary RGB picker. Every palette is a verified `WadaHarmonicPalette` derived from Sanzo Wada's 348 combinations (`geome-wada.js`) and the curated Motion Atlas plates:

```typescript
export interface WadaSwatch {
  hex: string;                   // Canonical hex (#RRGGBB)
  name: string;                  // Original Sanzo Wada pigment name (e.g. "Vandar Poel's Blue")
  oklab: [number, number, number]; // Perceptual OKLab coordinates [L, a, b]
  nearestCetiToken: {
    token: "--mk-copper" | "--mk-sage" | "--mk-peach" | "--mk-slate" | "--mk-rust" | "--mk-paper" | "--mk-deep-sea";
    hex: string;
    dE2000: number;              // CIEDE2000 perceptual distance (as in Plate II of motion-atlas-plates.pdf)
  };
}

export interface WadaHarmonicPalette {
  id: number;                    // Wada combination number (1..348)
  name: string;                  // Editorial title (e.g. "Sienna & Poel", "Umber Ledger")
  size: 2 | 3 | 4;               // Number of swatches in the closed Wada combination
  mood: string;                  // 1-line harmonic temperament note
  lensBinding?: string;          // Optional plate role (e.g. "PLATE I HERO", "LENS 01 STYLES")
  roles: {
    paper: string;               // Ground hex (#FBF3E6, #F5EFE3, tint, or #1A1F2E in dark mode)
    ink: string;                 // Darkest swatch (light mode) or highest-luminance swatch (dark mode)
    a: string;                   // Primary wash / field pigment
    h: string;                   // Hero / focal / disturbance spark pigment
    b: string;                   // Secondary structure / counterpoint pigment
    c: string;                   // Deep anchor pigment
  };
  contrastOnPaper: number;       // WCAG contrast ratio of roles.ink on roles.paper (Gate G01: >= 7.0 on paper, >= 4.5 for accents)
  chordTable: number[][];        // Closed N×N OKLab midpoint chord matrix (overlap(i,j) -> swatch k in the same palette)
  swatches: WadaSwatch[];
}
```

### Conservation Predicates for Color (`G01`–`G03`)
- **`G01 (Wada Closure Law)`:** Every `fillStyle` and `strokeStyle` emitted by the engine resolves through `prep(WadaHarmonicPalette)` or its `chordTable`. Zero off-palette hex literals in scene code.
- **`G02 (Contrast Floor)`:** `roles.ink` against `roles.paper` must clear `7.0:1` on light grounds (`atlas`, `ceti`, `tint`) and `10.0:1` on dark grounds (`deep-sea`, `hydro-ink`). If a raw Wada combination's darkest swatch has contrast `< 7.0:1` on paper, the engine automatically pins `ink` to the nearest Wada dark anchor while preserving the combination's chromatic swatches as `a / h / b`.
- **`G03 (Dominant Field & Spark Budget)`:** One ground owns `55–75%` of the frame; `roles.h` (the focal spark) is restricted to the active change, disturbance, or character focal mark (`<= 18%` frame area).

---

## 3. Parametric Character & Emblem Rig Algebra (`CharacterSpec`)

Instead of hardcoding `whale(ctx, P, o)`, the engine defines a universal **`renderActor(ctx, P, charSpec, poseState)`** and **`actorGeom(charSpec, poseState)`** that any proof, storyline, or storyboard frame can drive:

```typescript
export interface ReductionLadderSpec {
  inventory: string[];           // Rung 1: 15-25 concrete nouns, verbs, materials, failure modes
  pivot: string;                 // Rung 2: The 1 item where the meaning becomes physical
  silhouetteDesc: string;        // Rung 3: Interior detail deleted; 16px survival check
  severanceOp:                   // Rung 4: One of the 12 Saul Bass severance operations
    | "bend-wrong" | "dismember" | "shear" | "subtract-wedge" | "repeat-rhythm" | "figure-ground"
    | "join-mirror" | "crop" | "direct" | "contain" | "repeat-to-many" | "none";
  oneMeaning: string;            // Rung 5: Single abstract phrase carried by the form
  neverMistakeFor: string[];     // Disambiguation guards
  constructionNote: string;      // Underlying geometric discipline
}

export interface CharacterPartSpec {
  id: "body" | "limb_primary" | "limb_secondary" | "propulsion" | "eye" | "mouth" | "grooves" | "streaks";
  label: string;                 // e.g. "Ventral grooves", "Swept wing", "Sonar ring", "Dividers leg"
  pivot: [number, number];       // Normalized anchor [u, v] in [-0.5..0.5, -0.5..0.5]
  colorRole: "h" | "b" | "c" | "a" | "ink" | "paper";
  contour: [number, number][];   // Normalized control polygon / spline vertices
  phaseOffset: number;           // Radians offset relative to locomotion cycle
  amplitude: number;             // Articulation range
}

export interface CharacterSpec {
  id: string;                    // e.g. "ceti-whale", "saul-falcon", "lantern-bathysphere", "origami-crane", "astronav-compass", "doodle-scribe", "geome-orpheus", or custom
  name: string;                  // Human-readable name
  archetype: string;             // e.g. "Guide & Hero Mascot", "Kinetic Vector Emblem", "Deep-Sea Survey Instrument"
  locomotion: CharacterLocomotion;
  defaultRenderMode: CharacterRenderMode;
  aspectRatio: number;           // H / L ratio (e.g. 0.36 for humpback whale, 0.55 for crane, 1.0 for compass)
   axialProfile: {
    headTaper: number;           // Nose/head contour exponent
    dorsalArch: number;          // Upper ridge curvature
    ventralBelly: number;        // Lower profile curvature
    tailTaper: number;           // Posterior narrowing
    undulationWave: number;      // Wave number along spine
  };
  parts: CharacterPartSpec[];
  pixelSprite?: string[];        // 12x7 ASCII sprite matrix for `pixel` style proof
  streakConfig: {
    enabled: boolean;
    kind: "streamlines" | "sonar-rings" | "feather-wake" | "plumb-ticks" | "harmonic-chords";
    count: number;               // 1..6
  };
  defaultInteractions: CharacterInteractionMode[];
  reductionLadder: ReductionLadderSpec;
}
```

### How Proofs & Storylines Consume Any `CharacterSpec`
Every style proof (`watercolor`, `cutout`, `doodle`, `pixel`, `voxel`, `orbit`, `morph`, `kinetic`, `hybrid`, `editorial`, `whiteboard`, `sim`, `overlay`, `hydrographic`, `saul-severe`), every storyline (`s_voice`, `s_filter`, `s_retrieve`, `s_sting`, `s_loop`, `s_guide`, plus custom storylines), and every element demo (`e_rig`, `e_squash`, `e_fx`, `e_camera`, `e_connect`, etc.) calls:
- `actorGeom(charSpec, pose)` $\to$ returns `{ L, H, X, bend, body, limbPrimary, propulsion, grooves, eye, er, mouth, finRoot, flukeRoot }` with the **exact same geometric socket interface**!
- `renderActor(ctx, P, charSpec, pose)` $\to$ renders the active character (`ceti-whale`, `saul-falcon`, `lantern-bathysphere`, `origami-crane`, `astronav-compass`, `doodle-scribe`, `geome-orpheus`, or any user/OAuth-created character) in the active `CharacterRenderMode` (`wash`, `paper`, `line`, `flat`, `pixel`, `hydrographic`)!
- Thus, switching the character in the studio **instantly transforms all 25+ live proofs, storylines, and storyboard frames** to star the new character with its own locomotion physics, parts, and interaction grammar!

---

## 4. Infinite-Zoom Living Canvas & Fork DAG (`StoryDAG` & `CanvasNode`)

To support mapping ideas, making decisions, choosing forks, and zooming from macro story topology down to micro frame-by-frame storyboards, the studio state is a **Directed Acyclic Graph (DAG) of Typed Packets** on an infinite 2D coordinate plane:

```typescript
export type CanvasNodeKind =
  | "root-brief"         // S0/S2 Root concept, source claims & thesis
  | "fork-decision"      // Decision gate across Look / Use / Story / Character / Register
  | "character-node"     // Character Rig & 5-Rung Reduction Ladder card
  | "storyline-branch"   // Multi-beat narrative arc with live scrubbable canvas
  | "storyboard-frame"   // S4/S5 Individual frame + shot spec + live canvas at t_frame
  | "hydro-survey-plate" // Kinetic Hydrography time-series ghost plate
  | "oauth-synthesis";   // Live AI-enhanced expansion / alternative fork node

export interface CanvasNode {
  id: string;                    // Unique node ID (e.g. "node-root", "fork-look-A1", "beat-03")
  parentId: string | null;       // Upstream parent node ID in the DAG
  upstreamHash: string;          // Canonical hash of frozen parent fields (Sheaf restriction ρ)
  kind: CanvasNodeKind;
  x: number;                     // World X coordinate on infinite canvas
  y: number;                     // World Y coordinate on infinite canvas
  w: number;                     // Logical width
  h: number;                     // Logical height
  status: "committed" | "candidate-fork" | "archived" | "gate-failed";
  title: string;
  subtitle: string;
  // Bound Studio State in this fiber:
  styleKey: StyleKey;
  storyKey: string;
  characterId: string;
  interactionMode: CharacterInteractionMode;
  wadaPaletteId: number;
  feelKey: FeelKey;
  groundMode: GroundMode;
  spineArc: SpineArcId;
  // Optional S4/S5 Frame & Shot payload when kind === "storyboard-frame" or "storyline-branch":
  beats: {
    t0: number;
    t1: number;
    job: string;
    label: string;
    actionLine: string;          // Present-tense action ("The bar shears and does not return")
    coveredSentence: string;     // Must pass CoveredOk (false if stage were empty)
    movementClaim: string;       // Must complete "This moves because..." (attention|continuity|change|character)
    shotSpec: { size: "WS" | "MS" | "CU" | "ECU"; move: "static" | "pan" | "push" | "whip" | "orbit"; dur: number };
    techniques: string[];
  }[];
  conjectureNote?: string;       // Rem Koolhaas †C ledger note if this fork tests a leap
  gateVerdict?: {
    passed: boolean;
    score: string;               // e.g. "16/16 Gates Pass"
    issues: string[];
  };
}

export interface StudioSessionState {
  schemaVersion: "cetimotion.studio.v1";
  projectSlug: string;
  projectTitle: string;
  activeSurface: StudioSurfaceMode;
  // Global Defaults / Active Fiber:
  activeCharacterId: string;
  activeInteraction: CharacterInteractionMode;
  activePaletteId: number;
  activeFeel: FeelKey;
  activeGround: GroundMode;
  activeStyle: StyleKey;
  activeStory: string;
  tweaks: {
    speed: number;               // 0.25 .. 2.0
    grain: number;               // 0.0 .. 0.5
    wobble: number;              // 0.0 .. 2.0
    streaks: boolean;
    guideOverlay: boolean;
    hydroGhostCount: number;     // 12 | 24 | 48 ghost intervals for Kinetic Hydrography mode
  };
  // Custom & OAuth-created actors and storylines:
  customCharacters: CharacterSpec[];
  customStories: StorylineSpec[];
  // Infinite-Zoom Canvas & Fork DAG:
  viewport: { panX: number; panY: number; zoom: number }; // zoom: 0.1x .. 8.0x
  nodes: CanvasNode[];
  selectedNodeId: string | null;
  compareNodeId: string | null;  // For side-by-side A/B branch comparison
  // Tray / Kept Brief Atoms:
  keptItems: { kind: "style" | "story" | "node"; key: string; palId: number; feel: FeelKey; charId: string }[];
  keptElements: string[];
}
```

### Semantic Zoom Levels (LOD) on the Infinite Canvas
1. **Macro Constellation (`zoom < 0.45`)**: Shows high-contrast Saul Bass / Hydrographic node silhouettes, Wada color bars, branch connection splines, and `◆ COMMITTED` / `⑂ FORK` stamps.
2. **Narrative DAG & Preview (`0.45 <= zoom < 1.35`)**: Renders live 60fps `frame(t)` `<canvas>` previews inside every visible card, plus fork action buttons (`⑂ Fork Branch`, `⚖ Compare A/B`, `✦ OAuth Enhance`, `✓ Commit Path`).
3. **Micro Storyboard & Beat Inspector (`zoom >= 1.35`)**: Reveals the full 8-panel storyboard strip, per-beat `CoveredOk` / `MovementOk` editors, Rung 1–5 Reduction Ladder, and live keyframe curve telemetry directly on the card.

---

## 5. Multi-Provider OAuth PKCE & Live AI Enhancement Contract (`OAuthLiveEnhancer`)

To ensure the studio's live AI enhancement is **both zero-config locally and standards-compliant with OAuth 2.0 in the browser**, the studio implements a 3-tier authentication & synthesis bridge:

1. **Tier 1 · Browser OAuth 2.0 PKCE + Google Identity Services (GIS)**:
   - Supports client-side OAuth 2.0 Authorization Code with PKCE (`S256` code challenge) and Google OAuth token flow for Gemini (`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`), plus OpenRouter OAuth PKCE (`https://openrouter.ai/auth` — which natively supports zero-backend browser OAuth PKCE redirects back to `window.location.href`!).
2. **Tier 2 · Local Agent / CLI Loopback Bridge (`http://127.0.0.1:8787/api/enhance`)**:
   - Companion lightweight local server (`scripts/oauth-bridge-server.mjs`) that proxies authenticated requests using your local CLI credentials (`gcloud auth print-access-token`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, or `OPENAI_API_KEY`) and exposes an OAuth token exchange endpoint.
3. **Tier 3 · Direct API Key / Deterministic Algebraic Synthesizer Fallback**:
   - Optional direct key input stored in `sessionStorage` + a **built-in Deterministic Algebraic Story & Character Synthesizer** so that even completely offline (`file://`), clicking **"✦ Enhance Beat"**, **"✦ Fork 3 Directions"**, or **"✦ Synthesize Character"** executes a lawful, rule-driven structural expansion that passes all 16 gates!

### Strict Schema-Validated AI Output Law
The OAuth Enhancer **never** accepts freeform prose from an LLM. Every AI request supplies the upstream frozen packet hash and enforces a strict JSON Schema response (`responseMimeType: "application/json"`), which is then parsed through the **16-Gate Mechanical Checker** before it is allowed onto the canvas.
