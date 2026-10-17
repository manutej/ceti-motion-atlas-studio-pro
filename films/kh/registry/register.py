#!/usr/bin/env python3
"""Motion Atlas design registry — provenance for everything made in a registered style.

  register.py designs/<id>.json          validate, hash, lint colours, append to the ledger,
                                         write out/<id>.provenance.json and out/<id>.notion.json
  register.py --link <id> <notion_url>    record the Notion page a design was published to
  register.py --verify <id>               re-hash sources/outputs and report drift since registration
  register.py --ledger                    check the hash chain of the ledger
  register.py --payload <id>              rebuild the Notion payload (after parents are linked); ledger untouched

A design's fingerprint covers: the style passport (style.json) hash, the kit hash, every source and
output hash, its parents' fingerprints and its gate results. The ledger is append-only and each
entry carries the previous entry's hash, so history cannot be rewritten silently.
"""
import hashlib, json, os, re, sys, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))  # the films/ folder: spec paths are relative to it
STYLE = os.path.join(HERE, 'style.json')
LEDGER = os.path.join(HERE, 'ledger.jsonl')
MAP = os.path.join(HERE, 'registry-map.json')
ATLAS_MAP = os.path.join(ROOT, 'atlas', 'graph', 'notion-map.json')
OUT = os.path.join(HERE, 'out')
HEX = re.compile(r'#[0-9A-Fa-f]{6}\b')

def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''): h.update(chunk)
    return h.hexdigest()

def canon(o): return json.dumps(o, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
def load(p, d=None):
    try: return json.load(open(p))
    except FileNotFoundError: return d

def style_info():
    s = load(STYLE)
    allowed = {v.upper() for v in s['tokens']['ceti'].values()} | {v.upper() for v in s['tokens']['neutrals'].values()}
    for combo in s['tokens']['wada'].values(): allowed |= {v.upper() for v in combo.values()}
    return s, hashlib.sha256(canon(s).encode()).hexdigest(), allowed

def colour_lint(sources, allowed, declared):
    found = {}
    for p in sources:
        try: txt = open(os.path.join(ROOT, p), encoding='utf-8', errors='ignore').read()
        except FileNotFoundError: continue
        if p.endswith('.json') and 'tokens' in txt and 'wada' in txt: continue   # the passport itself
        for m in HEX.findall(txt): found.setdefault(m.upper(), set()).add(p)
    declared_up = {k.upper(): v for k, v in declared.items()}
    unregistered = sorted(h for h in found if h not in allowed and h not in declared_up)
    return {'literal_colours': len(found), 'registered': sum(1 for h in found if h in allowed),
            'declared_derived': sorted(h for h in found if h in declared_up), 'unregistered': unregistered,
            'status': 'PASS' if not unregistered else 'FAIL'}

def ledger_tail():
    if not os.path.exists(LEDGER): return '0' * 64
    last = [l for l in open(LEDGER) if l.strip()][-1]
    return hashlib.sha256(last.strip().encode()).hexdigest()

def register(spec_path):
    spec = load(spec_path); s, style_hash, allowed = style_info()
    reg = load(MAP, {})
    if spec.get('style') != s['version']: sys.exit(f"style drift: design says {spec.get('style')}, passport is {s['version']}")
    missing_parents = [p for p in spec.get('parents', []) if p not in reg and p != spec['id']]
    parent_fps = {}
    for p in spec.get('parents', []):
        prov = load(os.path.join(OUT, p + '.provenance.json'))
        if not prov: sys.exit(f'parent {p} is not registered yet — register parents first')
        parent_fps[p] = prov['fingerprint']
    files = lambda key: [{'path': p, 'sha256': sha(os.path.join(ROOT, p)), 'bytes': os.path.getsize(os.path.join(ROOT, p))} for p in spec.get(key, [])]
    sources, outputs = files('sources'), files('outputs')
    lint = colour_lint(spec.get('sources', []), allowed, spec.get('derived_colours', {}))
    kit = os.path.join(ROOT, 'kh/kh-kit.js')
    prov = {
        'id': spec['id'], 'name': spec['name'], 'kind': spec['kind'], 'version': spec['version'], 'status': spec.get('status', 'shipped'),
        'style': {'name': s['name'], 'version': s['version'], 'passport_sha256': style_hash, 'kit_sha256': sha(kit) if spec.get('uses_kit') else None},
        'parents': parent_fps, 'wada': spec.get('wada', []), 'engine': spec.get('engine', []), 'atlas': spec.get('atlas', []),
        'sources': sources, 'outputs': outputs, 'gates': {**spec.get('gates', {}), 'colour_provenance': lint['status']},
        'colour_provenance': lint, 'deviations': spec.get('deviations', []), 'summary': spec.get('summary', ''), 'changes': spec.get('changes', ''),
        'registered_at': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
    }
    prov['fingerprint'] = hashlib.sha256(canon({k: v for k, v in prov.items() if k != 'registered_at'}).encode()).hexdigest()
    os.makedirs(OUT, exist_ok=True)
    json.dump(prov, open(os.path.join(OUT, spec['id'] + '.provenance.json'), 'w'), indent=1)
    entry = {'id': spec['id'], 'fingerprint': prov['fingerprint'], 'style': s['version'], 'parents': list(parent_fps), 'at': prov['registered_at'], 'prev': ledger_tail()}
    with open(LEDGER, 'a') as f: f.write(canon(entry) + '\n')
    build_payload(spec, prov, s, style_hash, lint, parent_fps, outputs, sources)
    print(f"registered {spec['id']}  fp {prov['fingerprint'][:16]}  colours {lint['status']}  gates {'PASS' if all(str(v).upper().startswith('PASS') for v in prov['gates'].values()) else 'FAIL'}")

def build_payload(spec, prov, s, style_hash, lint, parent_fps, outputs, sources):
    reg = load(MAP, {}); atlas = load(ATLAS_MAP, {}); missing_parents = [p for p in spec.get('parents', []) if p not in reg]
    # ---- Notion payload: properties match the Design Registry schema; relations resolved to page ids ----
    gate_ok = all(str(v).upper().startswith('PASS') for v in prov['gates'].values())
    props = {
        'Name': spec['name'], 'Kind': spec['kind'], 'Version': spec['version'], 'Status': prov['status'],
        'Style': f"{s['name']} {s['version']}", 'Fingerprint': prov['fingerprint'][:16], 'Passport hash': style_hash[:16],
        'Wada': [str(w) for w in spec.get('wada', [])], 'Engine': spec.get('engine', []),
        'Gates': 'Pass' if gate_ok else 'Fail', 'Gate detail': ' · '.join(f'{k}: {v}' for k, v in prov['gates'].items()),
        'Deviations': ' · '.join(spec.get('deviations', [])) or 'None', 'Design ID': spec['id'],
        'Derived from': [reg[p] for p in spec.get('parents', []) if p in reg],
        'Atlas lineage': [atlas[a] for a in spec.get('atlas', []) if a in atlas],
        'date:Registered:start': prov['registered_at'][:10], 'date:Registered:is_datetime': 0,
    }
    md = [spec.get('summary', ''), '',
          '## Provenance',
          f"- **Style:** {s['name']} {s['version']} · passport `{style_hash[:16]}`" + (f" · kit `{prov['style']['kit_sha256'][:16]}`" if prov['style']['kit_sha256'] else ''),
          f"- **Fingerprint:** `{prov['fingerprint']}`",
          f"- **Parents:** " + (', '.join(f'{p} (`{fp[:12]}`)' for p, fp in parent_fps.items()) or 'none — this is a root'),
          f"- **Colour provenance:** {lint['status']} — {lint['literal_colours']} literal colours, {lint['registered']} registered tokens, {len(lint['declared_derived'])} declared derived" + (f", unregistered: {', '.join(lint['unregistered'])}" if lint['unregistered'] else ''),
          '', '## What changed', spec.get('changes', '') or '—', '',
          '## Gates', *[f'- {k}: {v}' for k, v in prov['gates'].items()], '',
          '## Deviations from the style', *([f'- {d}' for d in spec.get('deviations', [])] or ['- None']), '',
          '## Files', *[f"- `{x['path']}` · `{x['sha256'][:12]}` · {x['bytes']:,} bytes" for x in outputs + sources], '',
          '## Manifest', '```json', json.dumps({k: prov[k] for k in ('id', 'fingerprint', 'style', 'parents', 'wada', 'atlas', 'gates')}, indent=1), '```']
    payload = {'properties': props, 'content': '\n'.join(md), 'preview': spec.get('preview'), 'unresolved_parents': missing_parents}
    json.dump(payload, open(os.path.join(OUT, spec['id'] + '.notion.json'), 'w'), indent=1)
    return payload

def rebuild_payload(i):
    spec = load(os.path.join(HERE, 'designs', i + '.json')); prov = load(os.path.join(OUT, i + '.provenance.json')); s, style_hash, _ = style_info()
    p = build_payload(spec, prov, s, prov['style']['passport_sha256'], prov['colour_provenance'], prov['parents'], prov['outputs'], prov['sources'])
    print(f"payload {i}: derived-from {len(p['properties']['Derived from'])}/{len(spec.get('parents', []))} linked, atlas {len(p['properties']['Atlas lineage'])}/{len(spec.get('atlas', []))}" + (f", waiting on {p['unresolved_parents']}" if p['unresolved_parents'] else ''))

def link(i, url):
    reg = load(MAP, {}); m = re.search(r'([0-9a-f]{32})', url.replace('-', '')); reg[i] = m.group(1) if m else url
    json.dump(reg, open(MAP, 'w'), indent=1); print(f'linked {i} -> {reg[i]}')

def verify(i):
    prov = load(os.path.join(OUT, i + '.provenance.json')); drift = []
    for f in prov['sources'] + prov['outputs']:
        p = os.path.join(ROOT, f['path'])
        if not os.path.exists(p):
            # rendered media lives in GitHub Releases, not git: absent outputs are 'not checked out', not drift
            if f in prov['outputs'] and re.search(r'\.(mp4|wav|mov|webm)$', f['path']): print(f"  (not in checkout: {f['path']})")
            else: drift.append(f"missing {f['path']}")
        elif sha(p) != f['sha256']: drift.append(f"changed {f['path']}")
    _, style_hash, _ = style_info()
    if style_hash != prov['style']['passport_sha256']: drift.append('style passport changed since registration')
    print(f"{i}: " + ('no drift' if not drift else 'DRIFT — ' + '; '.join(drift)))

def check_ledger():
    prev = '0' * 64; n = 0
    for line in open(LEDGER):
        if not line.strip(): continue
        e = json.loads(line)
        if e['prev'] != prev: sys.exit(f'ledger broken at entry {n} ({e["id"]})')
        prev = hashlib.sha256(line.strip().encode()).hexdigest(); n += 1
    print(f'ledger intact: {n} entries, head {prev[:16]}')

if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['--link']: link(a[1], a[2])
    elif a[:1] == ['--verify']: verify(a[1])
    elif a[:1] == ['--ledger']: check_ledger()
    elif a[:1] == ['--payload']: rebuild_payload(a[1])
    else: register(a[0])
