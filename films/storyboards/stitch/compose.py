#!/usr/bin/env python3
"""compose.py — merge the jury seats, then let operadic stitch compose each final brief.

usage: python3 storyboards/stitch/compose.py
Reads JURY-*.json beside this file; for every target and slot the atom with the highest combined score wins
(pick = its score, runner-up = 0.8 × score, summed over seats; flagged atoms are excluded). Writes PICKS.json,
then runs stitch.py compose with --provenance --json per target → <target>.prompt.md + <target>.certificate.json.
A RED verdict stops that target (never ships)."""
import json, glob, os, subprocess, collections, sys
HERE = os.path.dirname(os.path.abspath(__file__)); SNAP = os.path.join(HERE, 'atoms.snapshot.json')
STITCH = os.environ.get('STITCH', '/root/.claude/skills/synced/ef36a148-c3ad-432f-8379-66f6ce82c4f3_2955edd5-b0fb-4198-84b4-db3d4bc035fd/operadic-stitch/scripts/stitch.py')
seats = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(HERE, 'JURY-*.json')))]
CAUTION = lambda t: t.strip().lower().startswith(('not an error', 'caution'))
flagged = {f['atom'] for s in seats for f in s.get('flags', []) if not CAUTION(f['problem'])}   # blocking flags: never stitched
cautions = {}                                                                                  # cautions: stitched WITH a constraint atom
for s in seats:
    for f in s.get('flags', []):
        if CAUTION(f['problem']): cautions.setdefault(f['atom'], []).append(f"{s['seat']}: {f['problem']}")
snap = json.load(open(SNAP)); ids = {a['id'] for a in snap['atoms']}
for atom, notes in sorted(cautions.items()):   # each caution becomes a Constraint atom, scoped like the piece it guards
    src = next(a for a in snap['atoms'] if a['id'] == atom)
    snap['atoms'].append({'id': 'caution.' + atom, 'kind': 'Constraint', 'scope': src['scope'], 'status': 'draft', 'version': 1, 'priority': 9,
                          'body': f'Jury caution on {atom}: ' + ' / '.join(notes)})
SNAP = os.path.join(HERE, 'atoms.final.snapshot.json'); json.dump(snap, open(SNAP, 'w'), indent=1, ensure_ascii=False, sort_keys=True)
picks, report = {}, {}
for target in ('conserve60', 'stitch60', 'gate-v3'):
    slots = sorted({sl for s in seats for sl in s['targets'].get(target, {})})
    picks[target] = {}
    for sl in slots:
        tally = collections.defaultdict(float); why = collections.defaultdict(list)
        for s in seats:
            e = s['targets'].get(target, {}).get(sl)
            if not e: continue
            if e.get('pick'): tally[e['pick']] += float(e.get('score', 0.5)); why[e['pick']].append(f"{s['seat']}: {e.get('why', '')}")
            if e.get('runner_up'): tally[e['runner_up']] += 0.8 * float(e.get('score', 0.5)) * 0.8
        cand = [(v, k) for k, v in tally.items() if k not in flagged and k in ids]
        if not cand: continue
        v, k = max(cand)
        agree = len({s['targets'].get(target, {}).get(sl, {}).get('pick') for s in seats}) == 1
        picks[target][sl] = {'atom': k, 'combined': round(v, 3), 'seats_agree': agree, 'why': why[k]}
json.dump(picks, open(os.path.join(HERE, 'PICKS.json'), 'w'), indent=1, ensure_ascii=False)
EX = ['hook', 'problem', 'why', 'stakes', 'hint', 'metaphor', 'ending', 'belief', 'captions']
for target, p in picks.items():
    ex = ' '.join('@' + p[s]['atom'] for s in EX if s in p)
    rest = ' '.join('@' + p[s]['atom'] for s in ('mechanism', 'case') if s in p)
    cons = ' '.join('@' + p[s]['atom'] for s in ('limit', 'notthis') if s in p)
    cons += ''.join(' @caution.' + p[s]['atom'] for s in p if p[s]['atom'] in cautions)
    goal = {'gate-v3': 'gate-v3'}.get(target, target)
    term = f"(film60 @goal.{goal} @fact.{goal} (glue (seq {ex}) {rest} (bag {cons})))"
    r = subprocess.run(['python3', STITCH, 'compose', SNAP, term, '--provenance', '--json'], capture_output=True, text=True)
    if r.returncode >= 3: print(target, 'ERROR', r.stderr[-800:]); sys.exit(r.returncode)
    out = json.loads(r.stdout); cert = out['certificate']; cert['term'] = term
    json.dump(cert, open(os.path.join(HERE, f'{target}.certificate.json'), 'w'), indent=1, ensure_ascii=False)
    open(os.path.join(HERE, f'{target}.prompt.md'), 'w').write(f"<!-- stitched brief for {target} · verdict {cert['verdict']} · term_hash {cert['term_hash']} · prompt_hash {cert['prompt_hash']} · library {cert['library_hash']} -->\n" + out['prompts']['root'])
    report[target] = cert['verdict']; print(target, cert['verdict'], 'tokens', cert['tokens'], 'findings', [f['law'] for f in cert['findings'] if f['severity'] != 'NOTE'])
