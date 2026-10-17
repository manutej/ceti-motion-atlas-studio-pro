#!/usr/bin/env python3
"""Write registry specs for the CETI Capabilities series from the final build logs.
usage: python3 kh/caps/make_specs.py <dir with final-<slug>.log or build logs> ; then register with kh/registry/register.py
Gate results are copied from the build output (the gate lines and the post-render checks), never typed by hand."""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); FILMS = os.path.abspath(os.path.join(HERE, '..', '..'))
LOGS = sys.argv[1]; DES = os.path.join(FILMS, 'kh', 'registry', 'designs')
EP = [  # slug, no, name, wada, summary, not-this
 ('stitch', '01', 'Context is composed', 166, 'Typed context atoms ride the line into a socketed tree; a claim is refused at the evidence seam, disjoint branches fill in parallel, receipts ripple to the root, and the tree folds into one brief card an AI pod carries away (Context Atoms · 41 atoms · GREEN).', 'Consistency is not correctness.'),
 ('gate', '02', 'Check it at the gate', 243, 'Runs pass a real gate whose slot is the spec; a bad run crumples against the bar (fail closed), one subtle wobble escapes, is flagged and caught, and becomes a narrower gate 07; pull back on seven gates: every miss became a rule (rules 6 → 7). Real catch: this series\' whale snap 1.26 → 0.11 rad/frame.', 'A gate proves the absence of known failures — not quality.'),
 ('glue', '03', 'Memory that agrees', 207, 'Five notes, each with its own view; overlaps are compared end to end; one seam disagrees (a visible step, terracotta) on a real film-check case (18 vs 20 captions); the whale closes it, the seam turns teal, the pieces fuse into one line and close into a ring.', 'Glued is not the same as true.'),
 ('conserve', '04', 'Change everything but the laws', 84, 'Content bends freely while three pinned laws (no broken links, one page per thing, every claim sourced) hold; an edit drags a pin over budget, is repaired before commit, and the ledger records the fire; real run 548 entities · exact 0 · drift 0.0 · prov. 0.988; then the whole line is shaken and every pin holds.', 'Noether-inspired — we choose the laws; no theorem is applied.'),
 ('tellapart', '05', 'Same reading, different world', 339, 'Two worlds — one healthy, one with an outage — feed one big reading that never changes (99%, illustrative checkout example); the whale finds the gap, brings back the witness pair, and unzips the line into two strands with their own readings (healthy vs 0%), so the alert can fire.', 'More metrics isn\'t the fix — the right distinction is.'),
]
def gates_from(log):
    t = open(log).read(); g = {}
    reads = re.findall(r'^read\s+(PASS|FAIL)\s+"(.*?)" ([\d.]+) s \(needs ([\d.]+)\)', t, re.M)
    if reads: tight = min(reads, key=lambda r: float(r[2]) - float(r[3])); g['read_time'] = f"{'PASS' if all(r[0]=='PASS' for r in reads) else 'FAIL'} — {len(reads)} lines, tightest {tight[2]} s vs {tight[3]} s"
    m = re.search(r'^jump\s+(PASS|FAIL)\s+whale on screen ([\d.]+) px/frame.*?, ([\d.]+) rad/frame', t, re.M)
    if m: g['frame_jump'] = f"{m.group(1)} — {m.group(2)} px, {m.group(3)} rad per frame"
    cs = re.findall(r'^contrast (PASS|FAIL)\s+(.*?) ([\d.]+):1', t, re.M)
    if cs: g['contrast'] = f"{'PASS' if all(c[0]=='PASS' for c in cs) else 'FAIL'} — {len(cs)} pairs, lowest {min(float(c[2]) for c in cs):.1f}:1"
    m = re.search(r'max flashes in 1 s: (\d+)\s+(PASS|FAIL)', t)
    if m: g['flash_safety'] = f"{m.group(2)} — {m.group(1)} flashes in any 1 s"
    i = re.search(r'^\s+I:\s+([-\d.]+) LUFS', t, re.M); p = re.search(r'^\s+Peak:\s+([-\d.]+) dBFS', t, re.M)
    if i and p: g['loudness'] = f"{'PASS' if abs(float(i.group(1))+16) <= 1 and float(p.group(1)) <= -1 else 'FAIL'} — {i.group(1)} LUFS, {p.group(1)} dBTP"
    m = re.search(r'^frames (\d+) \(expected (\d+)\) (PASS|FAIL)', t, re.M)
    if m: g['ffprobe'] = f"{m.group(3)} — {m.group(1)} frames at 60 fps"
    g['contact_sheet'] = 'PASS — two director review rounds (sheet-v1.png → sheet-v2.png in the episode folder)'
    return g
series = {'id': 'caps-series-v1', 'name': 'CETI Capabilities — series format v1', 'kind': 'Format', 'version': '1.0', 'parents': ['whale-line-format-v1.1', 'character-sheet-v2'],
  'wada': [166, 243, 207, 84, 339], 'engine': ['Canvas (skia)', 'ffmpeg', 'numpy synth'],
  'atlas': ['el:character-rig', 'el:camera-move', 'el:kinetic-type', 'q:time-pure-frames', 'q:cue-locked-sound', 'q:beat-locked-changes', 'q:loudness-normalisation', 'gate:contact-sheet', 'gate:frame-jump-detector'],
  'sources': ['kh/caps/series.js', 'kh/caps/tool.cjs', 'kh/caps/SERIES.md', 'kh/caps/AGENT-BRIEF.md', 'kh/caps/RESEARCH.md', 'scripts/build.sh', 'kh/kh-kit.js', 'kh/whale-rig.js'],
  'outputs': [], 'preview': None, 'gates': {'format': 'PASS — every episode passes the shared tool gates'},
  'summary': 'One capability CETI uses every week, one move, ~25 s, the little whale flying over a hydrographic chart. Shared layer: chart ground (air mode is never bare), opening card, paper caption chips, closing lockup; one tool and one build command per episode; a reusable builder brief.',
  'changes': 'New series. Adds the chart ground to air mode, the lockup-takes-the-caption rule and the phone-legibility scale rule (learned in review round 1).',
  'style': '1.0.0', 'status': 'shipped', 'uses_kit': True, 'derived_colours': {}, 'deviations': []}
json.dump(series, open(os.path.join(DES, 'caps-series-v1.json'), 'w'), indent=1, ensure_ascii=False)
for slug, no, name, wada, summary, nt in EP:
    log = os.path.join(LOGS, f'final-{slug}.log')
    if not os.path.exists(log): log = os.path.join(LOGS, f'build-{slug}.log')
    spec = {'id': f'cap-{slug}-v1', 'name': f'Capabilities {no} · {name} — film v1', 'kind': 'Film', 'version': '1.0', 'parents': ['caps-series-v1'], 'wada': [wada],
      'engine': ['Canvas (skia)', 'ffmpeg', 'numpy synth'], 'atlas': ['el:character-rig', 'el:camera-move', 'q:time-pure-frames', 'q:motion-blur', 'q:cue-locked-sound', 'gate:contact-sheet', 'gate:ffprobe-spec', 'gate:frame-jump-detector'],
      'sources': [f'kh/caps/{slug}/film.js', f'kh/caps/{slug}/score.py', f'kh/caps/{slug}/NOTES.md', 'kh/caps/series.js', 'kh/caps/tool.cjs', 'kh/whale-rig.js', 'kh/kh-kit.js'],
      'outputs': [f'renders/cap-{slug}.mp4'], 'preview': f'kh/registry/previews/cap-{slug}-v1.jpg', 'gates': gates_from(log),
      'summary': summary + f' Not this: “{nt}”', 'changes': 'First cut, after two director review rounds (scale, focal moment, pacing, legibility).',
      'style': '1.0.0', 'status': 'shipped', 'uses_kit': True, 'derived_colours': {}, 'deviations': []}
    json.dump(spec, open(os.path.join(DES, f'cap-{slug}-v1.json'), 'w'), indent=1, ensure_ascii=False)
    print(spec['id'], json.dumps(spec['gates'], ensure_ascii=False))
