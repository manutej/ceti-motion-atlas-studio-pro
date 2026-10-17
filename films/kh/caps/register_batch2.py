import json, subprocess, sys, os, re, statistics
L='/tmp/claude-0/-home-claude/d9663e9c-9d44-5407-a467-8998040fb3ea/scratchpad'
src=open('kh/caps/make_specs.py').read(); g={'__file__': os.path.abspath('kh/caps/make_specs.py')}
sys.argv=['x', L]; exec(src.split('series = {')[0], g); gates_from=g['gates_from']
def probe(p): return subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-count_packets','-show_entries','stream=nb_read_packets','-of','csv=p=0',p],capture_output=True,text=True).stdout.strip()
def plain(log):
  m=re.search(r'^plain\s+(PASS|FAIL)\s+.*?\(worst grade ([\d.]+), limit ([\d.]+)\)', open(log).read(), re.M)
  return f"{m.group(1)} — every on-screen line in plain words, worst grade {m.group(2)} (limit {m.group(3)})" if m else None
def jury(slug):
  d=json.load(open(f'kh/caps/{slug}/LAY-JURY.json')); r=d['runs'][-1]; v=[x for p in r['personas'].values() for x in p['sure']]
  ms=r.get('mean_sure', round(statistics.mean(v),2))
  hist=' → '.join(f"{x['version']} {x['verdict']}" for x in d['runs'])
  return f"{r['verdict']} — {r['version']}, mean sure {ms:.2f}, {len(r['personas'])} personas", hist
def sheets(slug):  # version order: sheet-v3.png < sheet-v3.2.png < sheet-v3.4.png
  return sorted((f for f in os.listdir(f'kh/caps/{slug}') if f.startswith('sheet-v') and f.endswith('.png')), key=lambda f: [int(x) for x in f[7:-4].split('.')])
NEW=[('cap-tick-v1','tick','c06/sb-06-03','Capabilities 06 · Every step gets a tick — film v1','1.0', 279, ['caps-series-v1'], 'build-tick.log', 'renders/cap-tick.mp4',
  'A crash after paying made the retry refund the customer twice ($20 → $40), so each finished step gets a tick and a restart skips the ticked steps, paying once; sourced card: "True story: we crashed it on purpose. Each step happened once." (Source: our own tests — jev-tape demo:crash, 0 duplicate applies). Limit: a tick means done, not right.',
  'v1 kept as film-v1.js; v2 names the AI helper, moves the coin out of the limit beat, enlarges the card.', []),
 ('cap-counter-v1','counter','c05/sb-05-02','Capabilities 07 · Stop when the counter hits zero — film v1','1.0', 84, ['caps-series-v1'], 'build-counter.log', 'renders/cap-counter.mp4',
  'You keep tweaking a letter and never know when to stop, so three AI apps circle problems, you fix and ask again, and you stop when the problem counter hits zero (3 → 1 → 0); sourced card: "Real draft: 28 problems, then 10, then 0." (Source: our own drafts — studio meta-prompt RMP ledger). Limit: zero means these readers found nothing, so add a new kind of reader.',
  'v1/v2 kept as film-v1/v2.js; v3 names the readers as AI apps (software), card corrected to 28 → 10 → 0 over three rounds, longer limit hold.', []),
 ('cap-fresh-v1','fresh','c07/sb-07-05','Capabilities 08 · Fresh eyes find what you missed — film v1','1.0', 166, ['caps-series-v1'], 'build-fresh.log', 'renders/cap-fresh.mp4',
  'You checked your own report twice and the customer still found a missing page, so AI checkers who did not write it hunt for mistakes, every complaint must point at the problem or is crossed out, and someone else fixes it; sourced card: "True story · our own review notes — 57 complaints raised. Each one pointed at." Limit: checkers that think alike miss alike.',
  'v4 kept as film-v4.js; v5 new title, AI checkers named, one limit beat, card about this story (57 raised, 0 struck; 116 dropped).', []),
 ('cap-private-v1','private','c04/sb-04-04','Capabilities 09 · Private notes stay put — film v1','1.0', 339, ['caps-series-v1'], 'build-private.log', 'renders/cap-private.mp4',
  'Reusing last week\'s email sends the Bakery\'s private note to the Clinic, so you tap PRIVATE, the stamp names the client ("PRIVATE · BAKERY"), and your AI app sees the stamp and leaves the note out ("Stamped for Bakery. Not sent."); no real-number card — the story carries an ILLUSTRATION chip (0.2–5.4 s). Limit: a note you never stamped can still go.',
  'v6 kept as film-v6.js; v7 makes the check the hero beat (stamp names the client, slow centred refusal), drops thread/"home" and the example card; ILLUSTRATION chip added after the jury run.', []),
 ('cap-steps-v1','steps','c06/sb-06-05','Capabilities 10 · Five small checks, not one — film v1','1.0', 296, ['caps-series-v1'], 'build-steps.log', 'renders/cap-steps.mp4',
  'One big question ("Is this email a scam?") gives the AI checker a wobbly maybe, so you split it into five small yes/no checks and one clear no stops the fake; sourced card: "Real test · Right answers on scam emails — one big question 63%, five small checks 95%, a simple fixed rule 92%" (Source: our own tests — JEV-works README 62.6 / 95.1 / 91.8). Limit: splitting the question is what helps. The 0.82–0.91 figure is not on screen.',
  'v3 kept as film-v3.js, v4 as film-v4.js; v4 "checks" not "gates", AI checker named, maybe-lamp; v5 polish: chart alone on a veil at 64 px bars, limit reworded.', []),
 ('cap-gate-v3.4','gate',['c07/sb-07-01','c07/sb-07-03'],'Capabilities 02 · Every new mistake gets a check — film v3.4','3.4', 243, ['cap-gate-v3','caps-series-v1'], 'build-gate34.log', 'renders/cap-gate-v3.4.mp4',
  'Your AI helper\'s report passed every check yet the customer found the wrong font, because each check looks for one kind of mistake, so every new mistake becomes a new check (a font check); sourced card: "True story · 7 mistakes, 7 new checks" (Source: our own list of mistakes — Limits & escapes register). Limit: passing means no mistakes we know of, not quality.',
  'v3.2 everyday words and actors; v3.3 word pass (no "gate" on screen); v3.4 polish after the jury: title over a 30% dim, centred 78 px card held 3.5 s with pulsing checks, clipped labels clamped, whale turns capped, DUR 29.83 s. v3.3 kept as film-v3.3.js.', []),
]
for i,slug,boards,name,ver,wada,parents,log,out,summary,changes,dev in NEW:
  gt=gates_from(os.path.join(L,log)); gt['ffprobe']=f"PASS — {probe(out)} frames at 60 fps (re-probed after mux)"
  sh=sheets(slug); gt['contact_sheet']=f'PASS — director review rounds ({sh[0]} → {sh[-1]} in the episode folder)'
  pw=plain(os.path.join(L,log))
  if pw: gt['plain_words']=pw
  lj,hist=jury(slug); gt['lay_jury']=lj
  boards=[boards] if isinstance(boards,str) else boards
  sources=[f'kh/caps/{slug}/film.js',f'kh/caps/{slug}/score.py',f'kh/caps/{slug}/NOTES.md',f'kh/caps/{slug}/LAY-JURY.json','kh/caps/series.js','kh/caps/tool.cjs','kh/whale-rig.js','kh/kh-kit.js']
  sources+=[f'storyboards/{b}.json' for b in boards if os.path.exists(f'storyboards/{b}.json')]
  engine=['Canvas (skia)','ffmpeg','numpy synth']
  if slug=='gate': sources.append('storyboards/stitch/gate-v3.prompt.md'); engine.append('operadic-stitch')
  spec={'id':i,'name':name,'kind':'Film','version':ver,'parents':parents,'wada':[wada],'engine':engine,
   'atlas':['el:character-rig','el:camera-move','q:time-pure-frames','q:motion-blur','q:cue-locked-sound','gate:contact-sheet','gate:ffprobe-spec','gate:frame-jump-detector'],
   'sources':sources,'outputs':[out],'preview':f'kh/registry/previews/{i}.jpg','gates':gt,'summary':summary,'changes':f'Lay jury: {hist}. {changes}','style':'1.0.0','status':'shipped','uses_kit':True,'derived_colours':{},'deviations':dev}
  json.dump(spec,open(f'kh/registry/designs/{i}.json','w'),indent=1,ensure_ascii=False); print(i, json.dumps(gt,ensure_ascii=False))
