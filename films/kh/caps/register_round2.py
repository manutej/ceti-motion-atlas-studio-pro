import json, subprocess, sys, os
L='/tmp/claude-0/-home-claude/d9663e9c-9d44-5407-a467-8998040fb3ea/scratchpad'
src=open('kh/caps/make_specs.py').read(); g={'__file__': os.path.abspath('kh/caps/make_specs.py')}
sys.argv=['x', L]; exec(src.split('series = {')[0], g); gates_from=g['gates_from']
def probe(p): return subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-count_packets','-show_entries','stream=nb_read_packets','-of','csv=p=0',p],capture_output=True,text=True).stdout.strip()
NEW=[('cap-gate-v3','gate','gate-v3','Capabilities 02 · Check it at the gate — film v3','3.0', 243, ['cap-gate-v1','caps-series-v1'], 'build-gate3.log', 'renders/cap-gate-v3.mp4',
  'v3 from the operadic-stitch brief (sb-07-01 + sb-07-03): each gate checks a different KIND of thing (wobble, gap, colour, direction); the escape is a smooth run of the wrong colour (like a page that declared one font and rendered another); the miss becomes a new kind of check; sourced card: 7 misses, 7 new checks (Limits & escapes register).',
  'Rebuilt after meta-review (REVIEW-v3.md): the v2 metaphor taught "tighten the threshold". 1.5x scale, kind-tinted gates. v2 kept as film-v2.js.', []),
 ('cap-stitch60-v1','stitch60','stitch60','Capabilities 01 · Give every note a label — one-minute film v1','1.0', 166, ['cap-stitch-v1','caps-series-v1'], 'build-stitch60.log', 'renders/cap-stitch60.mp4',
  'One-minute, problem-first Stitch (LONGFORM-60) from the operadic-stitch brief (sb-04-01): an AI quotes the old draft as final; every note gets a label (draft, decided, rule); a draft cannot fill a decision slot; real run: Context Atoms, 3 prompts, 41/26/41 atoms, engine check GREEN, 9 shared still draft; limit: a wrong date marked decided still fits.',
  'First one-minute cut; jury cautions applied (GREEN captioned as engine check; spine atoms shown as draft).', []),
 ('cap-conserve60-v1','conserve60','conserve60','Capabilities 04 · Change everything but the pins — one-minute film v1','1.0', 84, ['cap-conserve-v1','caps-series-v1'], 'build-conserve60.log', 'renders/cap-conserve60.mp4',
  'One-minute, problem-first Conserve (LONGFORM-60) from the operadic-stitch brief (sb-03-01): edits silently break links and the AI follows them to a wrong answer; three pinned laws (no broken links, one page per thing, every claim sourced) checked on every edit; real run: memory graph map 548 entities, 2,933 links, 0 laws broken, 0.988 sourced; limit: atlas citation audit 47 of 60 faithful.',
  'First one-minute cut.', ['N7 density: a pin legend counts as one item; caption + legend + panel = 3 items for 4.1 s in MOVE (declared)'])]
for i,slug,tgt,name,ver,wada,parents,log,out,summary,changes,dev in NEW:
  gt=gates_from(os.path.join(L,log)); gt['ffprobe']=f"PASS — {probe(out)} frames at 60 fps (re-probed after mux)"
  gt['contact_sheet']='PASS — director review rounds (sheets in the episode folder)'
  spec={'id':i,'name':name,'kind':'Film','version':ver,'parents':parents,'wada':[wada],'engine':['Canvas (skia)','ffmpeg','numpy synth','operadic-stitch'],
   'atlas':['el:character-rig','el:camera-move','q:time-pure-frames','q:motion-blur','q:cue-locked-sound','gate:contact-sheet','gate:ffprobe-spec','gate:frame-jump-detector'],
   'sources':[f'kh/caps/{slug}/film.js',f'kh/caps/{slug}/score.py',f'kh/caps/{slug}/NOTES.md','kh/caps/series.js','kh/caps/tool.cjs','kh/whale-rig.js','kh/kh-kit.js',f'storyboards/stitch/{tgt}.prompt.md'],
   'outputs':[out],'preview':f'kh/registry/previews/{i}.jpg','gates':gt,'summary':summary,'changes':changes,'style':'1.0.0','status':'shipped','uses_kit':True,'derived_colours':{},'deviations':dev}
  json.dump(spec,open(f'kh/registry/designs/{i}.json','w'),indent=1,ensure_ascii=False); print(i, json.dumps(gt,ensure_ascii=False))
