#!/usr/bin/env node
/**
 * CETI MOTION ATLAS STUDIO PRO — DETERMINISTIC PACKAGE & BUNDLE COMPILER
 *
 * Produces:
 *  1. Motion Atlas Studio Pro — Standalone.html (root zero-dependency single-file studio)
 *  2. dist/ceti-motion-atlas-studio-pro.standalone.html (dist zero-dependency single-file studio)
 *  3. dist/ceti-motion-atlas-master-dossier.md (single unified master file containing all specs, contracts, RSI ledger, QC findings, and handoff docs)
 *  4. docs/MASTER-PACKAGE-DOSSIER.md (mirror of the unified master specification & build dossier)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DOCS = path.join(ROOT, 'docs');

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
if (!fs.existsSync(DOCS)) fs.mkdirSync(DOCS, { recursive: true });

// 1. Compile Standalone Single-File HTML Studio
const html = fs.readFileSync(path.join(ROOT, 'Motion Atlas Studio Pro.dc.html'), 'utf8');
const wada = fs.readFileSync(path.join(ROOT, 'geome-wada.js'), 'utf8');
const eng = fs.readFileSync(path.join(ROOT, 'studio-motion-engine.js'), 'utf8');
const co = fs.readFileSync(path.join(ROOT, 'studio-canvas-oauth.js'), 'utf8');
const ui = fs.readFileSync(path.join(ROOT, 'studio-ui.js'), 'utf8');

const standalone = html
  .replace('<script src="./geome-wada.js"></script>', () => '<script>\n' + wada + '\n</script>')
  .replace('<script src="./studio-motion-engine.js"></script>', () => '<script>\n' + eng + '\n</script>')
  .replace('<script src="./studio-canvas-oauth.js"></script>', () => '<script>\n' + co + '\n</script>')
  .replace('<script src="./studio-ui.js"></script>', () => '<script>\n' + ui + '\n</script>');

const standaloneRootPath = path.join(ROOT, 'Motion Atlas Studio Pro — Standalone.html');
const standaloneDistPath = path.join(DIST, 'ceti-motion-atlas-studio-pro.standalone.html');
fs.writeFileSync(standaloneRootPath, standalone, 'utf8');
fs.writeFileSync(standaloneDistPath, standalone, 'utf8');

// Copy modular assets to dist/ as well for clean static deployment
for (const file of ['index.html', 'Motion Atlas Studio Pro.dc.html', 'geome-wada.js', 'studio-motion-engine.js', 'studio-canvas-oauth.js', 'studio-ui.js']) {
  fs.copyFileSync(path.join(ROOT, file), path.join(DIST, file));
}

// 2. Compile Unified Master Specification, RSI & Handoff Dossier
const contractMd = fs.readFileSync(path.join(DOCS, 'TYPED-CONTRACT-MOTION-ATLAS.md'), 'utf8');
const metaPlanMd = fs.readFileSync(path.join(DOCS, 'META-PLAN-AND-RSI.md'), 'utf8');
const rsiLedgerMd = fs.readFileSync(path.join(DOCS, 'RSI-LEDGER.md'), 'utf8');
const statusMd = fs.readFileSync(path.join(ROOT, 'STATUS.md'), 'utf8');
const handoffMd = fs.readFileSync(path.join(ROOT, 'HANDOFF.md'), 'utf8');

const masterDossier = [
  '# CETI MOTION ATLAS STUDIO PRO (`v4.0.0`) — COMPLETE MASTER SPECIFICATION, BUILD & HANDOFF DOSSIER',
  '',
  '> **Unified Single-File Reference**: This document consolidates all formal specifications, typed contracts, operadic meta-plans, 4-round Adversarial MOE & RSI ledgers, live status scorecards, and cold-resume handoff instructions into one self-contained file.',
  '',
  '## Table of Contents',
  '1. [Live Status & Deliverable Manifest (`STATUS.md`)](#part-1--live-status--deliverable-manifest)',
  '2. [Cold-Resume Architecture & Extension Handoff (`HANDOFF.md`)](#part-2--cold-resume-architecture--extension-handoff)',
  '3. [Formal Typed Contract Specification (`TYPED-CONTRACT-MOTION-ATLAS.md`)](#part-3--formal-typed-contract-specification)',
  '4. [Operadic Meta-Plan & Recursive Self-Improvement Architecture (`META-PLAN-AND-RSI.md`)](#part-4--operadic-meta-plan--recursive-self-improvement-architecture)',
  '5. [4-Round Adversarial MOE & Negative Mutation Selftest Ledger (`RSI-LEDGER.md`)](#part-5--4-round-adversarial-moe--negative-mutation-selftest-ledger)',
  '',
  '---',
  '',
  '## PART 1 · LIVE STATUS & DELIVERABLE MANIFEST',
  '',
  statusMd,
  '',
  '---',
  '',
  '## PART 2 · COLD-RESUME ARCHITECTURE & EXTENSION HANDOFF',
  '',
  handoffMd,
  '',
  '---',
  '',
  '## PART 3 · FORMAL TYPED CONTRACT SPECIFICATION',
  '',
  contractMd,
  '',
  '---',
  '',
  '## PART 4 · OPERADIC META-PLAN & RECURSIVE SELF-IMPROVEMENT ARCHITECTURE',
  '',
  metaPlanMd,
  '',
  '---',
  '',
  '## PART 5 · 4-ROUND ADVERSARIAL MOE & NEGATIVE MUTATION SELFTEST LEDGER',
  '',
  rsiLedgerMd,
  ''
].join('\n');

fs.writeFileSync(path.join(DOCS, 'MASTER-PACKAGE-DOSSIER.md'), masterDossier, 'utf8');
fs.writeFileSync(path.join(DIST, 'ceti-motion-atlas-master-dossier.md'), masterDossier, 'utf8');

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('CETI MOTION ATLAS STUDIO PRO — PACKAGE BUILD COMPLETE');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('✓ Standalone Studio (root): Motion Atlas Studio Pro — Standalone.html (' + standalone.length + ' bytes)');
console.log('✓ Standalone Studio (dist): dist/ceti-motion-atlas-studio-pro.standalone.html (' + standalone.length + ' bytes)');
console.log('✓ Unified Master Dossier  : docs/MASTER-PACKAGE-DOSSIER.md (' + masterDossier.length + ' bytes)');
console.log('✓ Dist Master Dossier     : dist/ceti-motion-atlas-master-dossier.md (' + masterDossier.length + ' bytes)');
console.log('═══════════════════════════════════════════════════════════════════════════════');
