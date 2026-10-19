# v9 UPGRADE BRIEF — CETI Motion Atlas Studio Pro (v8.0.0 → v9.0.0 "Fable Soup")

Repo root: /home/claude/ceti-motion-atlas-studio-pro (shallow clone, push allowed, branch main).
Owner: Manu Mulaveesala (CETI.AI). Date: 2026-10-19.

## What the owner asked for (verbatim intent, condensed)
1. Upgrade the studio from "Opus-level" to "Fable-level" via a **model-soup mechanism**: several independent Fable one-off agents produce candidates for the same deliverable; a merger "soups" them (union of strengths, intersection of agreed rules, contradictions resolved by the typed contract + gates). Nothing is accepted on one agent's say-so.
2. Ultra-high quality: **clear wording, clear storyboard, clear messaging, rock-solid WOW visuals**. Owner LIKES the current look — do not reskin; sharpen.
3. Use **two.js** (https://two.js.org, CDN `https://cdnjs.cloudflare.com/ajax/libs/two.js/0.8.17/two.min.js` or newer) plus the elements already used (vanilla canvas engine, SVG, anime.js v4 scaffolds, HyperFrames/Remotion compilers) — two.js is an ADDITIONAL renderer, must respect gate G06 (frame = f(t), deterministic, seekable).
4. **Music**: owner does NOT like the current music (4-voice Just-Intonation sonification). SFX are good — keep them. Add real background MUSIC that makes SFX pop: adaptive procedural score (WebAudio, no external audio files), with mood per storyboard beat, proper mix (sidechain/ducking under SFX), tempo/key chosen per palette/feel.
5. Save-token mode: short, concise tasks; write files; hand off through files in `work/` and `docs/rsi/`; do not dump large file contents into chat.
6. Re-think how animated explainers / motion graphics are done — find the **meta-prompt + meta-compound** key so the method scales (recursive self-query loop akin to arXiv 2610.13912 — an RSI paper; digest at `docs/rsi/PAPER-DIGEST.md` once written).
7. HTML diagram workflows for the examples/ideas.

## Hard constraints
- All 29 gates must still pass: `npm test` (node scripts/validate-motion-studio.mjs --selftest). Read `scripts/validate-motion-studio.mjs` before changing any file it inspects. New features ⇒ add gates (G30+) + a negative mutation selftest each.
- `npm run build` must regenerate dist/ and the Standalone bundle.
- No external audio/image assets. CDN JS allowed only from cdnjs/jsdelivr/unpkg and must have an offline fallback path (Standalone bundle is "zero-dependency": inline two.js in the Standalone build via build-package.mjs or lazy-load with graceful degrade).
- Never `Math.random()`/`Date.now()` in render or audio-schedule paths; seeded + t-driven.
- Keep CSS/visual language (Sanzo Wada 348, Saul Bass ladder, Glaser overshoot). Sharpen, don't replace.
- Write deliverables to the paths named in your task. End your report with ≤10 lines: files written, gates affected, open risks.

## Key files
- studio-motion-engine.js (~199 KB): Wada OKLab, 8 archetypes, feels, sonification (AudioContext ~line 2906, `e_sfx` ~2497).
- studio-canvas-oauth.js (~125 KB): DAG canvas, vocab library, color vault, OAuth, 7 compilers.
- studio-ui.js (~150 KB): 7 surfaces, 3 modals.
- Motion Atlas Studio Pro.dc.html / index.html: shell + CSS. scripts/build-package.mjs: bundler. docs/: contract, meta-plan, RSI ledger.
