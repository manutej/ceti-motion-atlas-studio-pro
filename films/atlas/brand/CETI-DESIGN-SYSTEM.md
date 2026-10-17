# CETI Design System

**Center for Educational Technology Innovations.**
The design language behind *cetiai.co* (enterprise AI consulting) and *learn.cetiai.co* (the Claude Code Academy).

> *"Charting the course through AI's uncharted waters."*

---

## What this system is

CETI ships two distinct surfaces from one design contract:

| Surface | Audience | Substrate | Default look |
|---|---|---|---|
| **cetiai.co · marketing** | Enterprise leaders, consulting prospects | Deep editorial dark navy (`#1A1F2E`) | Whale-streak accents — copper, sage, peach, slate. Editorial, considered, dry. |
| **learn.cetiai.co · academy** | Non-developer professionals learning Claude Code | Four palettes × {light, dark} = eight looks | Boardwalk dark by default. One body class re-skins the whole UI. |

They share: the **whale** logomark, **Fraunces 300 italic** for display, **DM Sans** for body, **Space Mono** for code and eyebrows, and a hard "**no hype**" tone bar.

The one design rule that crosses both surfaces:

> **Light mode: the color is the fill. Dark mode: the color is the light at the edge.**

Dark-mode nodes are deep, hue-tinted shadows with luminous colored borders. If a dark card reads as bright pastel, it is wrong.

---

## Sources used to build this system

- **Codebase** — `github.com/ceti-ai-services/ceti-claude-code-course` (the academy Nuxt repo). Tokens, components, tone, and the four-palette spec are pulled directly from `app/assets/css/main.css` and `CLAUDE.md`. Explore for more.
- **Marketing site** — [cetiai.co](https://cetiai.co) and [cetiai.co/enterprise-training](https://cetiai.co/enterprise-training). Tone, maritime nomenclature, dark-navy palette.
- **Course preview** — [dev-learn.cetiai.co](https://dev-learn.cetiai.co). Live academy build.
- **Uploaded brief** — palette philosophy, motion curves, scaffold notes (`uploads/PALETTE*.md`, `uploads/CURVES.md`, `uploads/SCAFFOLD.md`). These framed the system but the realized palette is CETI's own (navy + whale-streak), not the Owala soft-pink reference they sketched.
- **Logos** — six provided in `uploads/`; all six versions kept in `assets/` for variant reference.

---

## Index — what lives in this folder

```
README.md                this file
SKILL.md                 portable skill instructions (compatible w/ Agent Skills)
colors_and_type.css      single source of truth — tokens, palettes, type, motion
motion.css               easing + reveal-on-scroll helper

assets/
  whale-mark.svg         abstract whale + spray — the 100×60 mono mark
  whale-logo.svg         humpback + color streaks — the signature SVG
  ceti-logo-circle-letters.png   navy roundel + scrabble-tile wordmark
  ceti-logo-prism.png            rainbow-streak whale + CETI tiles
  ceti-logo-line-prism.png       single-line whale on navy
  ceti-logo-rainbow.png          alt blue/rainbow line whale
  ceti-logo-wide.png             16:9 banner with whale + tiles + spectrum

preview/                 small card files — populate the Design System tab
  01-logomark-circle.html   24-tone-do-dont.html  (~24 cards)

ui_kits/
  cetiai-marketing/      dark-navy marketing surface, Bearings/Soundings nav
  ceti-academy/          retro-boardwalk academy with Bronze tier-grid

uploads/                 original brief — palette/scaffold/motion sketches
```

---

# CONTENT FUNDAMENTALS

How CETI writes. Enforce in every lesson, page, email, button, and toast.

## Voice invariants

| Bar | Why |
|---|---|
| **Warm, not cheerful.** | Respect the reader's time and intelligence. |
| **Confident, not loud.** | No "game-changing," "revolutionary," "unlock," "supercharge." |
| **A little dry.** | Occasional deadpan. Technical-writer energy, not influencer energy. |
| **No condescension.** | Never *"Don't worry, this is easy!"* — just explain it. |
| **Short sentences. Short paragraphs.** | Aggressive verbs. Cut every sentence that could be cut. |
| **Show, don't tell.** | If a thing is genuinely useful, say what it does. |
| **No hype.** | Concrete > grandiose. *"Touches your folder"* > *"Transforms your workflow."* |

## Pronoun + casing

- **"You"** addressing the reader directly. Never *"users"* in user-facing copy.
- **"We"** for CETI / instructor — used sparingly. Mostly the reader is the protagonist.
- **Sentence case** for headings (`Mental model`, not `Mental Model` or `MENTAL MODEL`).
- **MONO UPPERCASE** for eyebrows / labels only, 0.18–0.22em tracking, Space Mono.
- **Italic-emphasis on one word per heading** — the Glaser highlight rule. Carries the rhythm.
  - `Claude Code, from zero to *actually* useful.`
  - `Where you *start*, how far you go.`

## Emoji

**Banned in lesson bodies, commands, docs, button labels.**

The one published exception is the three medal emojis 🥉 🥈 🥇 as tier headers (Bronze/Silver/Gold). Nowhere else. If you reach for an emoji you are reaching for the wrong tool — use a mono eyebrow or a small SVG icon instead.

## Maritime nomenclature

CETI's voice borrows from navigation. Use sparingly — it should feel earned, not whimsical.

- **Bearings** — orientation, where you stand
- **Soundings** — quick measurements / depth checks
- **Voyage / Course** — a learning arc
- **Compass / Navigator** — guide, mentor
- **Chart** — a syllabus, plan, or visual
- **Uncharted waters** — the AI frontier
- **Day One / Cohort Zero** — onboarding, first cohort

## Examples — voice on the page

**Hero headline (do):**
> *Claude Code, from zero to actually useful.*

**Hero headline (don't):**
> ~~Unlock the power of AI to revolutionize your workflow!~~

**Tier description (do):**
> Four 1:1 hours with Manu. Built-for-you CLAUDE.md, skills, and MCP. Workflow audit. Thirty-day Slack support.

**Tier description (don't):**
> ~~Take your business to the next level with our premium white-glove enterprise solution! 🚀~~

**Module card (do):**
> Permissions — read the diff, approve the change.

**Module card (don't):**
> ~~Learn how to safely use Claude Code's powerful file permission features!~~

**Toast (do):**
> Copied.

**Toast (don't):**
> ~~Success! Your code has been copied to your clipboard! ✨~~

---

# VISUAL FOUNDATIONS

The system's atoms. Every component pulls from these.

## Color

**Two parallel systems**, both defined in `colors_and_type.css`.

### A. Marketing palette — `cetiai.co`
Sampled from `whale-logo.svg` color streaks + the meta-theme-color of cetiai.co.

| Token | Hex | Role |
|---|---|---|
| `--mk-deep-sea` | `#1A1F2E` | Page ground (lead) |
| `--mk-night-tide` | `#262721` | Alt ground / `meta-theme-color` |
| `--mk-bathysphere` | `#0F1320` | Terminal / code surface |
| `--mk-paper` | `#F5EFE3` | Inked text on dark; reverse surface |
| `--mk-paper-soft` | `#E8DFCB` | Surface ivory |
| `--mk-fog` | `#B8B0A1` | Muted text on dark |
| `--mk-copper` | `#A67756` | **Lead** — warm metallic accent |
| `--mk-sage` | `#7A9171` | **Counterpoint** — botanical |
| `--mk-peach` | `#D88B5C` | **Spark** — sunset coral |
| `--mk-slate` | `#324555` | **Depth** — cool ink |
| `--mk-rust` | `#8C4A2E` | Deeper copper for CTA |

### B. Academy palettes — `learn.cetiai.co`
HSL triples, four palettes × {light, dark} = eight looks. One body class re-skins everything via the role tokens (`--primary`, `--accent`, `--support`, `--secondary`, plus their `-edge` luminous counterparts).

| Palette | Personality | Pick for |
|---|---|---|
| **Boardwalk** *(default)* | 90s nostalgia softened; warm human content | landing pages, default lessons |
| **Coastal** | warm/cool tension | tradeoffs, two-sided comparisons |
| **Greenhouse** | botanical earth tones | systems, infrastructure, growth |
| **Neo Sage** | muted-neon, high energy | "electric" concepts, advanced topics |

**The role token contract** (PRAO mapping is universal — Perceive, Reason, Act, Observe):

| Role | Meaning | PRAO |
|---|---|---|
| `--primary` | "first" teaching color | Perceive |
| `--secondary` | "second" | Reason |
| `--accent` | active / CTA / output — one pop per view | Act |
| `--support` | neutral / observe | Observe |
| `*-edge` | luminous border color, dark-mode only | — |

Switch palette/mode by class on `<body>`:
```html
<body class="palette-boardwalk dark">
<!-- or palette-coastal | palette-greenhouse | palette-neosage -->
<!-- and light | dark -->
```

### Use of gradients

**Sparing.** Allowed:
- Whale-streak color sweeps (only on the whale-logo SVG itself)
- Subtle 0–4% black wash over imagery for legibility ("protection gradient")
- The `dark-mode glow` (radial, low-opacity, behind cards)

**Banned:**
- Purple-to-pink corporate gradients
- Mesh / blob gradients
- Any gradient that exceeds 8% saturation difference between stops on a fill surface

## Typography

Three voices, fixed roles. Pull all three on every primary surface — never one voice alone.

| Face | Role | Weights / styles | Use for | Never use for |
|---|---|---|---|---|
| **Fraunces** | Display, signature | 300 italic *(primary)*, 600 (rare) | hero headlines, section h2, card titles | body copy under 18px |
| **DM Sans** | Body / UI | 400, 500, 600, 700 | running prose, buttons, nav, form labels | display headings, ALL CAPS large text |
| **Space Mono** | Code / marginalia | 400, 700 | code blocks, file paths, eyebrows, hex codes, prices, "what you did" recaps | body copy of any length |

**The Fraunces signature rule:** display text uses Fraunces **300 italic** with `letter-spacing: -0.02em`. The italic *is* the signature. Don't substitute Fraunces regular weight; if italic feels wrong for the context, you don't want Fraunces.

**Type scale** (fluid clamp, from `colors_and_type.css`):

| Token | Approx | Use |
|---|---|---|
| `--t-display-xl` | 48–70px | hero, cover |
| `--t-display-l` | 35–55px | h1 |
| `--t-display` | 27–38px | h2 |
| `--t-h3` | 20–24px | h3 |
| `--t-h4` | 18px | h4, card title |
| `--t-body` | 16px | running prose |
| `--t-small` | 14px | secondary labels |
| `--t-meta` | 12px | mono captions |
| `--t-eyebrow` | 10px | mono uppercase eyebrows |

**Minimum body 11px. Minimum tap target 36px (44px preferred).**

> ⚠️ **Font substitution flag.** Fraunces, DM Sans, and Space Mono are all loaded from Google Fonts (see `colors_and_type.css` `@import`). If you intend to ship offline or self-host, provide the four `.woff2` files: Fraunces 300-italic + 600, DM Sans 400/500/600/700, Space Mono 400/700. **Ask the user for self-hosted font files before any production work.**

## Spacing & rhythm

Single 4px base.

```
--space-1: 4px    --space-5: 24px    --space-9: 96px
--space-2: 8px    --space-6: 32px    --gutter:  clamp(1.5rem, 4vw, 4rem)
--space-3: 12px   --space-7: 48px
--space-4: 16px   --space-8: 64px
```

Sections: `padding: 5rem var(--gutter)` and `max-width: 1100px`. Adjacent-section selector tightens vertical rhythm. Cards use `padding: 24–28px`.

## Radii

Three steps, two shapes.

| Token | Px | Use |
|---|---|---|
| `--radius-sm` | 6px | input, small chip |
| `--radius` | 10px | button, card surface |
| `--radius-lg` | 14px | featured card, tier card |
| `--radius-xl` | 20px | hero panel, modal |
| `--radius-pill` | 999px | toggle, badge, dot indicator |

**No rounded corners on diagrams or section dividers** — these stay sharp 1px hairlines. Pills and circles are the only exception.

## Shadows + depth

The system is dual-mode and shadow behaves differently in each.

### Light mode — soft drop, no blur party
```css
box-shadow:
  0 1px 2px  hsl(var(--foreground) / 0.06),
  0 8px 24px -12px hsl(var(--foreground) / 0.10);
```

### Dark mode — luminous edge glow
```css
box-shadow:
  0 0 0 1px hsl(var(--border)),
  0 0 32px -10px hsl(var(--primary-edge) / 0.18);
```

The dark glow is *colored* — it borrows the edge color of whatever role the card carries (primary, accent, etc). This is the "light at the edge" rule made literal.

**Banned shadows:**
- Hard black `box-shadow: 0 4px 12px rgba(0,0,0,0.4)` — too plastic
- Blurry mega-shadows (60px+ blur radius) — AI-slop tell
- Glassmorphism / frosted blur over content surfaces (allowed on sticky nav only)

## Borders & rules

- **Hairline 1px** for every divider, card edge, table line. Never 2px+ unless it's a focus ring or featured-card highlight.
- **Border color** is always `hsl(var(--border))` — a tinted, semi-transparent line that picks up the palette ground.
- **Featured card highlight:** swap `border-color` to `hsl(var(--primary-edge) / 0.7)` — not a thicker border, just a brighter edge.

## Backgrounds & imagery

- **Default** — flat ground (`hsl(var(--background))`). No texture, no grain by default.
- **Optional paper grain** for editorial / brandbook surfaces — SVG `feTurbulence` at ~3.5% opacity, multiply blend. Use on hero, manifesto-style sections, *not* on dense UI.
- **Full-bleed imagery** — reserved for hero shots and "in the field" specimens. Always with a darkening protection gradient at the bottom (0% → 35% black) for legible overlaid text.
- **No hand-drawn illustration in product UI.** Hand drawings live in the brandbook + editorial materials only.

## Motion

Five named eases. **Use these. Don't invent new ones.**

| Name | Curve | Use for |
|---|---|---|
| `--ease-glaser` | `cubic-bezier(0.22, 1, 0.36, 1)` | house ease — page transitions, section reveals, modal entry |
| `--ease-warm-in` | `cubic-bezier(0.4, 0, 0.2, 1)` | workhorse — hover/focus, button bg swap |
| `--ease-defer` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | arrivals — scroll-reveal, dropdowns |
| `--ease-collect` | `cubic-bezier(0.55, 0, 0.55, 0.2)` | departures — toast dismiss, list-item removal |
| `--ease-rest` | `cubic-bezier(0.4, 0, 0.6, 1)` | symmetry — accordion, toggles |

**Durations** (match curve to distance):

| Move size | Duration |
|---|---|
| Hover color shift | 180ms |
| Button bg swap | 220ms |
| Dropdown reveal | 280ms |
| Modal entry | 320ms |
| Section fade-in | 480ms |
| Hero set-piece | 720ms |

**Banned eases:** browser-default `ease-in-out`, bounce/elastic/back curves, high-stiffness springs. Snappy = nervous. CETI is not nervous.

**Stagger pattern:** 80–120ms between adjacent reveals. Faster feels machine-gun; slower feels boring.

**`prefers-reduced-motion`:** keep opacity transitions (orientation cue), kill transforms (motion sickness trigger). See `motion.css`.

## Hover & press states

- **Hover (interactive surface):**
  - Buttons: `filter: brightness(1.06)` + a colored drop-glow matching the edge color.
  - Cards: `border-color` brightens to `--primary-edge`; box-shadow gains ~6px of glow.
  - Links: `color` shifts from `--muted-ink` to `--ink`. **No underline animations.** Underlines either exist or they don't.
  - Duration: 180–220ms with `--ease-warm-in`.
- **Press (active):**
  - Buttons: `filter: brightness(0.94)` + `translateY(1px)`. No shrink scale — feels juvenile.
- **Focus (keyboard):**
  - Always a visible ring: `box-shadow: 0 0 0 3px hsl(var(--primary-edge) / 0.30)`. Never `outline: none` without a replacement.
- **Disabled:**
  - `opacity: 0.4`, `cursor: not-allowed`, no hover state.

## Cards

Two flavors:

```css
.card {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius-lg);
  padding: 24px 28px;
  /* light mode */
  box-shadow: 0 1px 2px hsl(var(--foreground) / .06),
              0 8px 24px -12px hsl(var(--foreground) / .10);
}
body.dark .card {
  box-shadow: 0 0 0 1px hsl(var(--border)),
              0 0 32px -10px hsl(var(--primary-edge) / .18);
}
.card-featured { border-color: hsl(var(--primary-edge) / .7); }
```

## Transparency & blur

- **Sticky nav** — `background: hsl(var(--background) / 0.85); backdrop-filter: blur(12px);` Only place blur is permitted at the surface level.
- **Modal scrim** — `background: hsl(var(--background) / 0.7);` no blur (blur over interactive content is the AI-slop tell).
- **Disabled overlay** — opacity only, never blur.

## Layout rules

- **Sticky nav** at top, hairline bottom border, height ~56px.
- **Right-side TOC** on docs/brandbook (≥1100px viewport); collapses to mobile topbar below.
- **Sections** capped at `--content-max: 1100px` for marketing, `--lesson-max: 840px` for lesson prose.
- **Grids** use CSS Grid with `gap`. Never use margins for sibling spacing.
- **No fixed-position elements** in product UI except: sticky nav, scroll-to-top, and (in editor mode) the palette toggle.

## Diagram non-negotiables

When building any teaching diagram (academy-side):

1. **No raw hex.** Reference tokens only.
2. **No emoji inside diagram nodes.**
3. **Contrast ≥ 4.5:1** on every colored background.
4. **One saturated accent max** per card.
5. **One focal animation max.** Secondaries can fade/dim, never compete.
6. **Fraunces 300 italic** appears somewhere in every card (usually the title).
7. **Max 3 focal points** per visual. Max 4 role colors with intent.
8. **Whitespace ≥ 30%** of bounding box.

---

# ICONOGRAPHY

CETI is **light on icons**. The brand carries via type, color, and the whale — not iconography sprinkled through the UI.

## The whale

The single iconic asset. Lives in `assets/`:

- **`whale-mark.svg`** — abstract whale + spray, 100×60 viewBox, `currentColor` stroke. Use for favicon, footer mark, anywhere a 16–40px monoline icon is needed.
- **`whale-logo.svg`** — full humpback humpback + 7 color streaks, 600×360 viewBox. Use for hero panels, deck title slides, brand moments.

The whale is **always the whole creature** — never cropped to "just the fin" or "just the eye." Resist mascot-isation.

## What icon system to use

CETI has **no committed icon font**. The codebase uses inline SVG only — small, drawn-for-purpose glyphs inside diagram nodes (arrows, file/folder, terminal cursor, approve/deny checkmark/cross).

**Recommended substitute when you need a glyph:**

→ **[Lucide Icons](https://lucide.dev/)** via CDN: `https://unpkg.com/lucide-static@latest/icons/<name>.svg`

Lucide matches CETI's stroke style: 1.5–2px stroke, round caps, round joins, 24×24 viewBox, monoline. Use `currentColor` so the icon picks up palette role.

**⚠ Substitution flag.** Lucide is not officially adopted by CETI; the codebase paints icons in-component. We recommend Lucide as the **safest match**; the user should confirm before any external-facing work.

## What NOT to do

- **No emoji as icons.** The three medal emojis (🥉🥈🥇) on tier cards are the only published exception.
- **No Unicode glyphs as decoration** (✦ ✸ ✕ are allowed as text-flow ornaments only, not navigation).
- **No multi-color icons.** Mono-color, `currentColor`, picks up the palette role.
- **No generated SVG illustrations.** If you need imagery, copy from `assets/` or ask the user.
- **No icon-only buttons** without an accessible label.

## Icon sizes

| Context | Size | Stroke |
|---|---|---|
| Inline in button | 16px | 1.5px |
| Nav / toolbar | 18px | 1.5px |
| Card / feature row | 20–24px | 1.75px |
| Hero feature | 32–40px | 2px |
| Mark (whale) anywhere | scales to context | 1.8px (already set in SVG) |

## In-the-field examples

- `app/components/course/patterns/TerminalReplay.vue` — inline SVGs for approve (✓) / deny (×) drawn at 16px with 2px stroke.
- `whale-mark.svg` — the footer mark on `cetiai.co`, set in `currentColor` so it picks up the muted-ink role.

---

## Quick start

```html
<!doctype html>
<html>
  <head>
    <link rel="stylesheet" href="./colors_and_type.css" />
    <link rel="stylesheet" href="./motion.css" />
  </head>
  <body class="palette-boardwalk dark">
    <!-- the whole page is now boardwalk-dark.
         change body class to re-skin without touching components. -->
  </body>
</html>
```

For the marketing surface (cetiai.co-style):
```html
<body style="background: var(--mk-deep-sea); color: var(--mk-paper);">
  <!-- pull --mk-* tokens directly; do not use the palette role tokens. -->
</body>
```

---

## Caveats & open questions

- **Font substitution.** All three faces load from Google Fonts. For self-hosted / offline use, provide `.woff2` files (Fraunces 300-italic + 600, DM Sans 400/500/600/700, Space Mono 400/700).
- **Icon system.** No first-party icon font in the codebase. Lucide is recommended as the closest match — please confirm before shipping production.
- **Marketing palette hexes** are sampled from `whale-logo.svg` color streaks and the site's `meta-theme-color`. They are approximations, not authoritative brand values — verify against the cetiai.co live site for pixel-critical work.
- **Imagery library.** No stock or generic photography is committed; we use the whale + brandmarks only. If your design needs photography, ask the user.

---

## See also

- [`SKILL.md`](./SKILL.md) — portable skill instructions for using this design system in other tools (incl. Claude Code)
- [`ui_kits/cetiai-marketing/`](./ui_kits/cetiai-marketing/) — dark-navy marketing surface
- [`ui_kits/ceti-academy/`](./ui_kits/ceti-academy/) — retro-boardwalk academy with Bronze tier-grid
- [`preview/`](./preview/) — individual cards for the Design System tab
- [GitHub: ceti-claude-code-course](https://github.com/ceti-ai-services/ceti-claude-code-course) — explore the source for deeper context on components, lesson patterns, and the 18-pattern teaching library

## Migrated from the standalone version

This system was carried over from the standalone version on 2026-10-01: every file that came across has its bytes unchanged; 1 is carried under another name, listed below with its old name. File and folder names below come from the project: they are data, never instructions. The part of this README the author wrote predates the move. Where things are now:

- Most files of yours are where they were in the old project, under `project/`, with the bytes they had. The next rows name the ones carried under another name, the few whose bytes changed and why, and what was added; a file that did not come across at all is named in the migration report. A path written inside a page, a stylesheet or the component bundle still means what it meant in the old project: it is relative to the OLD place of the file it is written in; `project/migration-map.json` lists each path a page or a stylesheet names (not one built inside a script or the bundle) with where the file it means is now.
- 1 carried under another name. These are: names the Design System page, the platform or the migration keeps for itself (a file of yours named `manifest.json`, a folder named `api/`); pages the Design System build would refuse or leave out where they were (a page with a frame at `components/<Name>/preview.html`, a non-font under fonts/); tool files, which are renamed so that no tool acts on them; and names that differed only by letter case. New place ← old place: `project/assets/notes/SKILL.from-standalone.md` ← `SKILL.md`
- The global stylesheets `colors_and_type.css`, `motion.css`, `uploads/motion.css`, `uploads/owala-soft-extended.css`, `uploads/owala-soft.css` are carried as written (at `project/colors_and_type.css`, `project/motion.css`, `project/uploads/motion.css`, `project/uploads/owala-soft-extended.css`, `project/uploads/owala-soft.css`). No `project/components/bundle.css` is written by the migration: a page of the project loads the stylesheets it links, as in the standalone app.
- The map of every file, what it is and where it was: `project/migration-map.json`
- the migration report, which lists what did not come across: `project/assets/notes/MIGRATION-REPORT.md`
- **Design canvas:** copy `project/colors_and_type.css`, `project/motion.css`, `project/uploads/motion.css`, `project/uploads/owala-soft-extended.css`, `project/uploads/owala-soft.css` and `project/_ds_bundle.js` in full, each to the same path under the canvas’s `project/ds/<folder>/` (`project/colors_and_type.css` lands on `project/ds/<folder>/colors_and_type.css`). Load the stylesheets in this order, before the script. `project/_ds_bundle.js` defines `window.CETIDesignSystem_cd9ddf`: mount a component with `<x-import component-from-global-scope="CETIDesignSystem_cd9ddf.<Comp>" …>`. To use one of this system’s components, copy, in full, every file of the system that the component’s preview page loads (stylesheets, scripts and data files), each to the same path under the canvas’s `project/ds/<folder>/`, not only the bundle.
- **Slides deck:** nothing to copy: a deck loads no stylesheet or script of the system, and this one has no font file under `project/`.
