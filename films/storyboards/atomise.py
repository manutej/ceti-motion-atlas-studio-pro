#!/usr/bin/env python3
"""atomise.py — turn the 100 storyboards into an operadic-stitch atom library (snapshot JSON).

usage: python3 storyboards/atomise.py OUT.snapshot.json
Each storyboard piece becomes one typed atom, scoped to its cluster (ceti/films/cNN), id = <slot>.<sb-id>.
Connective atoms (role, goals, contracts, constraints from LONGFORM-60, per-target facts) live in CONNECTIVE below,
so the library is rebuilt byte-identically from the files (no hand splicing)."""
import json, glob, os, sys, re
HERE = os.path.dirname(os.path.abspath(__file__))
def clean(s): return re.sub(r'[⟪⟫]', '', str(s)).strip()
def txt(v, *keys):
    if isinstance(v, str): return clean(v)
    if isinstance(v, dict):
        parts = [clean(v[k]) for k in keys if v.get(k)]
        return ' · '.join(p for p in parts if p)
    return clean(json.dumps(v, ensure_ascii=False))
SLOTS = [  # slot, kind, how to render the body
  ('hook', 'Example', lambda v: txt(v, 'picture', 'words')),
  ('problem', 'Example', lambda v: txt(v, 'body', 'who')),
  ('why', 'Example', lambda v: txt(v, 'picture', 'words', 'body')),
  ('stakes', 'Example', lambda v: txt(v, 'body', 'picture')),
  ('hint', 'Example', lambda v: txt(v, 'body')),
  ('metaphor', 'Example', lambda v: txt(v, 'body') + (' · symbols: ' + ', '.join(v.get('symbols', [])) if isinstance(v, dict) and v.get('symbols') else '')),
  ('mechanism', 'Method', lambda v: ' | '.join(f"t{s.get('t')}: {clean(s.get('picture',''))}" + (f" — “{clean(s['words'])}”" if s.get('words') else '') + (f" [♪ {clean(s['sound'])}]" if s.get('sound') else '') for s in (v.get('steps', []) if isinstance(v, dict) else v))),
  ('case', 'Evidence', lambda v: txt(v, 'claim', 'source') + (' · ' + clean(v.get('label', '')) if isinstance(v, dict) and v.get('label') else '')),
  ('limit', 'Constraint', lambda v: txt(v, 'picture', 'words')),
  ('notthis', 'Constraint', lambda v: txt(v, 'body')),
  ('ending', 'Example', lambda v: txt(v, 'slug', 'body')),
  ('belief', 'Example', lambda v: txt(v, 'body')),
  ('captions', 'Example', lambda v: ' / '.join(clean(c.get('text', '')) for c in v if isinstance(c, dict))),
]
FIELD = {'hook': 'hook', 'problem': 'problem_in_viewer_words', 'why': 'why_it_keeps_happening', 'stakes': 'stakes', 'hint': 'solution_hint',
         'metaphor': 'metaphor', 'mechanism': 'mechanism_beats', 'case': 'real_case', 'limit': 'honest_limit', 'notthis': 'not_this',
         'ending': 'ending_pattern', 'belief': 'end_belief', 'captions': 'captions'}
CONNECTIVE = json.load(open(os.path.join(HERE, 'connective.json')))
scopes = {'global': None, 'ceti': 'global', 'ceti/films': 'ceti'}
atoms = list(CONNECTIVE['atoms']); boards = {}
for f in sorted(glob.glob(os.path.join(HERE, 'c[0-9][0-9]', 'sb-*.json'))):
    d = json.load(open(f)); sid = d['id']; c = 'c' + sid.split('-')[1]; sc = f'ceti/films/{c}'; scopes[sc] = 'ceti/films'
    boards[sid] = {'file': os.path.relpath(f, HERE), 'title': d.get('title'), 'repo': d.get('repo'), 'wada': d.get('wada'), 'score_self': (d.get('score_self') or {}).get('score')}
    for slot, kind, render in SLOTS:
        v = d.get(FIELD[slot])
        if v in (None, '', [], {}): continue
        body = render(v)
        if not body: continue
        atoms.append({'id': f'{slot}.{sid}', 'kind': kind, 'scope': [sc], 'body': body, 'status': 'draft', 'version': 1,
                      'priority': int(round(10 * ((d.get('score_self') or {}).get('score') or 0.5)))})
snap = {'_comment': 'CETI Storyboard Lab — atoms from the 100 storyboards (films/storyboards/c*/sb-*.json) + connective atoms. Built by atomise.py.',
        'scopes': scopes, 'overlaps': [], 'confidential': [], 'invariants': CONNECTIVE.get('invariants', []), 'atoms': atoms, 'operations': CONNECTIVE.get('operations', [])}
json.dump(snap, open(sys.argv[1], 'w'), indent=1, ensure_ascii=False, sort_keys=True)
json.dump(boards, open(os.path.join(HERE, 'boards.index.json'), 'w'), indent=1, ensure_ascii=False, sort_keys=True)
print(f'{len(boards)} storyboards → {len(atoms)} atoms ({len(atoms) - len(CONNECTIVE["atoms"])} pieces + {len(CONNECTIVE["atoms"])} connective)')
