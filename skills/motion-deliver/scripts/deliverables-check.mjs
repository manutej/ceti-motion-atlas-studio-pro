#!/usr/bin/env node
// deliverables-check.mjs — FILM-SPEC-9 item 9 (FS-deliverables) as a dependency-free CLI, plus the FS-critique render gate.
//
//   node skills/motion-deliver/scripts/deliverables-check.mjs <deliverables-dir> [--ledger work/soup-ledger.jsonl] [--round N]
//        [--allow-preview] [--mark-render [--minutes M]] [--probe] [--json]
//   node skills/motion-deliver/scripts/deliverables-check.mjs --selftest
//
// Pass (exit 0) when:
//   1. the dir holds a non-empty video, loop-check.json, poster.png, contact-sheet.png and a README.md with a "# " title;
//   2. loop-check.json has pass === true and a numeric seamDelta;
//   3. the video is final.mp4 AND the latest `critique` row of the round has every score >= 8 (FS-critique) — or, with
//      --allow-preview, the video is final-preview.mp4 and README.md carries the label "preview: critique not yet 8+";
//   4. the ledger has no `render` stage row for the round while the critique gate is closed (a render row behind a < 8 is
//      the spec's "don't skip gates" broken in the ledger).
// --mark-render appends `{kind:"stage", stage:"render"}` for the round only when 1-4 pass in non-preview mode; it never
// marks a preview. --probe additionally runs ffprobe (FFPROBE env, default /usr/bin/ffprobe) on the video.
// Exit 1 = a check failed (each failure is printed), 2 = usage error.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const PREVIEW_LABEL = 'preview: critique not yet 8+';
export const NEED = ['loop-check.json', 'poster.png', 'contact-sheet.png', 'README.md'];

export function readLedger(file) {
  if (!file || !fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

// FS-critique: the latest critique row of the round must exist and have every score >= 8.
export function critiqueGate(rows, round) {
  const rs = rows.map((r) => r.round).filter((x) => typeof x === 'number'), R = round ?? (rs.length ? Math.max(...rs) : null);
  const crits = rows.filter((r) => r.kind === 'critique' && r.round === R);
  const last = crits[crits.length - 1];
  const renderRow = rows.some((r) => r.kind === 'stage' && r.stage === 'render' && r.round === R);
  if (!last) return { round: R, open: false, renderRow, why: `no critique row for round ${R}` };
  const scores = Object.entries(last.scores || {});
  const low = scores.filter(([, s]) => !(typeof s === 'number' && s >= 8)).map(([a, s]) => `${a}=${s}`);
  if (!scores.length) return { round: R, open: false, renderRow, why: `critique row for round ${R} has no scores` };
  return { round: R, open: low.length === 0, renderRow, min: Math.min(...scores.map(([, s]) => s)), why: low.length ? `latest critique (pass ${last.pass}) below 8: ${low.join(', ')}` : 'every score >= 8' };
}

export function check(dir, { rows = [], round, allowPreview = false, probe = false } = {}) {
  const fails = [], info = {};
  const has = (f) => fs.existsSync(path.join(dir, f)) && fs.statSync(path.join(dir, f)).size > 0;
  const gate = critiqueGate(rows, round); info.gate = gate;
  const video = allowPreview ? 'final-preview.mp4' : 'final.mp4'; info.video = video;
  const missing = [video, ...NEED].filter((f) => !has(f));
  if (missing.length) fails.push('missing deliverables: ' + missing.join(', '));
  if (has('loop-check.json')) {
    let lc = null; try { lc = JSON.parse(fs.readFileSync(path.join(dir, 'loop-check.json'), 'utf8')); } catch { fails.push('loop-check.json is not JSON'); }
    if (lc && !(lc.pass === true && typeof lc.seamDelta === 'number')) fails.push('loop check did not pass or carries no seamDelta');
  }
  const readme = has('README.md') ? fs.readFileSync(path.join(dir, 'README.md'), 'utf8') : '';
  if (has('README.md') && !/^# /m.test(readme)) fails.push('README has no title');
  if (allowPreview) {
    if (has('README.md') && !readme.includes(PREVIEW_LABEL)) fails.push(`README does not label the preview ("${PREVIEW_LABEL}")`);
  } else if (!gate.open) fails.push(`render refused (FS-critique): ${gate.why}`);
  if (gate.renderRow && !gate.open) fails.push(`ledger has a render stage row for round ${gate.round} but ${gate.why}`);
  if (probe && has(video)) {
    try {
      const j = JSON.parse(execFileSync(process.env.FFPROBE || '/usr/bin/ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', path.join(dir, video)]).toString());
      const v = j.streams.find((s) => s.codec_type === 'video'), a = j.streams.find((s) => s.codec_type === 'audio');
      info.probe = { video: v && `${v.codec_name} ${v.pix_fmt} ${v.width}x${v.height}`, audio: a && a.codec_name };
      if (!v || v.codec_name !== 'h264' || v.pix_fmt !== 'yuv420p' || v.width % 2 || v.height % 2) fails.push('video stream is not H.264 yuv420p with even dimensions');
      if (!a) fails.push('no audio stream');
    } catch (e) { fails.push('ffprobe failed: ' + String(e.message).slice(0, 120)); }
  }
  return { dir, pass: !fails.length, fails, info };
}

function selftest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deliv-'));
  const scores = (n) => ({ clarity: n, payoff: n, identity: n, text: n });
  const goodRows = [{ kind: 'critique', round: 1, pass: 1, stills: [], scores: scores(8), worst3: ['a', 'b', 'c'], fixes: [] }];
  const make = (name, { preview = false } = {}) => {
    const d = path.join(tmp, name); fs.mkdirSync(d);
    fs.writeFileSync(path.join(d, preview ? 'final-preview.mp4' : 'final.mp4'), 'x');
    fs.writeFileSync(path.join(d, 'loop-check.json'), JSON.stringify({ pass: true, seamDelta: 0 }));
    fs.writeFileSync(path.join(d, 'poster.png'), 'x'); fs.writeFileSync(path.join(d, 'contact-sheet.png'), 'x');
    fs.writeFileSync(path.join(d, 'README.md'), '# board\n' + (preview ? `\n- final-preview.mp4 — ${PREVIEW_LABEL}\n` : ''));
    return d;
  };
  const cases = [
    ['positive: full deliverables, critique 8+', () => check(make('ok'), { rows: goodRows }), true],
    ['positive: preview with label, critique 5', () => check(make('okp', { preview: true }), { rows: [{ ...goodRows[0], scores: scores(5) }], allowPreview: true }), true],
    ['MUT-1 poster.png renamed', () => { const d = make('m1'); fs.renameSync(path.join(d, 'poster.png'), path.join(d, 'poster.bak')); return check(d, { rows: goodRows }); }, false],
    ['MUT-2 loop-check pass:false', () => { const d = make('m2'); fs.writeFileSync(path.join(d, 'loop-check.json'), JSON.stringify({ pass: false, seamDelta: 0 })); return check(d, { rows: goodRows }); }, false],
    ['MUT-3 loop-check without seamDelta', () => { const d = make('m3'); fs.writeFileSync(path.join(d, 'loop-check.json'), JSON.stringify({ pass: true })); return check(d, { rows: goodRows }); }, false],
    ['MUT-4 README without a title', () => { const d = make('m4'); fs.writeFileSync(path.join(d, 'README.md'), 'no title\n'); return check(d, { rows: goodRows }); }, false],
    ['MUT-5 final.mp4 with a critique score of 7', () => check(make('m5'), { rows: [{ ...goodRows[0], scores: { ...scores(9), text: 7 } }] }), false],
    ['MUT-6 final.mp4 with no critique row', () => check(make('m6'), { rows: [] }), false],
    ['MUT-7 preview without the README label', () => { const d = make('m7', { preview: true }); fs.writeFileSync(path.join(d, 'README.md'), '# board\n'); return check(d, { rows: [], allowPreview: true }); }, false],
    ['MUT-8 render stage row behind a score < 8', () => check(make('m8', { preview: true }), { rows: [{ ...goodRows[0], scores: scores(6) }, { kind: 'stage', round: 1, stage: 'render', pass: true, minutes: 1 }], allowPreview: true }), false],
    ['MUT-9 older 8+ row superseded by a later < 8 row', () => check(make('m9'), { rows: [goodRows[0], { ...goodRows[0], pass: 2, scores: scores(6) }] }), false],
    ['MUT-10 empty final.mp4', () => { const d = make('m10'); fs.writeFileSync(path.join(d, 'final.mp4'), ''); return check(d, { rows: goodRows }); }, false],
  ];
  let bad = 0;
  for (const [name, fn, want] of cases) {
    const r = fn(); const ok = r.pass === want; if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} → ${r.pass ? 'pass' : 'caught: ' + r.fails[0]}`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(bad ? `selftest FAIL ${bad}/${cases.length}` : `selftest PASS ${cases.length}/${cases.length} (${cases.length - 2} mutations caught)`);
  process.exit(bad ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2), flags = {}, pos = [];
  for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const k = a.slice(2); flags[k] = argv[i + 1] && !argv[i + 1].startsWith('--') && ['ledger', 'round', 'minutes'].includes(k) ? argv[++i] : true; } else pos.push(a); }
  if (flags.selftest) selftest();
  if (!pos[0]) { console.error('usage: deliverables-check.mjs <dir> [--ledger file] [--round N] [--allow-preview] [--mark-render] [--probe] | --selftest'); process.exit(2); }
  const ledger = flags.ledger || 'work/soup-ledger.jsonl', rows = readLedger(ledger);
  const r = check(path.resolve(pos[0]), { rows, round: flags.round != null ? Number(flags.round) : undefined, allowPreview: !!flags['allow-preview'], probe: !!flags.probe });
  if (flags['mark-render']) {
    if (flags['allow-preview']) r.fails.push('--mark-render refused: a preview is never a render stage');
    else if (r.pass) { fs.appendFileSync(ledger, JSON.stringify({ round: r.info.gate.round, kind: 'stage', stage: 'render', pass: true, minutes: Number(flags.minutes || 0), artifacts: [path.relative(process.cwd(), path.join(r.dir, 'final.mp4'))], ts: new Date().toISOString() }) + '\n'); r.marked = true; }
    r.pass = !r.fails.length;
  }
  if (flags.json) console.log(JSON.stringify(r, null, 2));
  else { console.log(`deliverables-check ${pos[0]} (${r.info.video}; critique round ${r.info.gate.round}: ${r.info.gate.why})`); for (const f of r.fails) console.log('  FAIL ' + f); console.log(r.pass ? `PASS${r.marked ? ' — render stage row written' : ''}` : `FAIL ${r.fails.length} check(s)`); }
  process.exit(r.pass ? 0 : 1);
}
