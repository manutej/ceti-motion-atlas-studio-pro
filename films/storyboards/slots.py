#!/usr/bin/env python3
"""slots.py SNAPSHOT OUTDIR — one TSV per piece slot (id · storyboard title · repo · self-score · body), for the jury."""
import json, os, sys, collections
snap = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
boards = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'boards.index.json')))
by = collections.defaultdict(list)
for a in snap['atoms']:
    slot, _, sid = a['id'].partition('.')
    if sid in boards: by[slot].append((a['id'], boards[sid], a['body'].replace('\t', ' ').replace('\n', ' ')))
for slot, rows in by.items():
    with open(os.path.join(out, f'{slot}.tsv'), 'w') as f:
        f.write('id\ttitle\trepo\tself\tbody\n')
        for i, b, body in sorted(rows): f.write(f"{i}\t{b['title']}\t{b['repo']}\t{b['score_self']}\t{body}\n")
print({k: len(v) for k, v in sorted(by.items())})
