import numpy as np, json, struct, sys
# Copied from the v9 blind critic (v9.1): D/TAG from argv; extra metrics (holes, breather floor, seam, bell delta) appended.
D=(sys.argv[1] if len(sys.argv)>1 else '.').rstrip('/')+'/'
TAG=sys.argv[2] if len(sys.argv)>2 else 'v9'
SR=44100
plan=json.load(open(D+TAG+'-plan.json'))
def load(m): return np.fromfile(D+f'{TAG}-score-{m}.f32',dtype=np.float32).astype(np.float64)
full,mus,sfx=load('full'),load('musicOnly'),load('sfxOnly')
def db(x): return 20*np.log10(max(x,1e-9))
def rms(x): return float(np.sqrt(np.mean(x*x))) if len(x) else 0.0
def wav(path,x):
    y=np.clip(x,-1,1); pcm=(y*32767).astype('<i2')
    with open(path,'wb') as f:
        f.write(b'RIFF'+struct.pack('<I',36+pcm.nbytes)+b'WAVEfmt '+struct.pack('<IHHIIHH',16,1,1,SR,SR*2,2,16)+b'data'+struct.pack('<I',pcm.nbytes)); f.write(pcm.tobytes())
wav(D+TAG+'-score.wav',full); wav(D+TAG+'-score-musicOnly.wav',mus); wav(D+TAG+'-score-sfxOnly.wav',sfx)
rep={}
for name,x in [('full',full),('musicOnly',mus),('sfxOnly',sfx)]:
    peak=float(np.max(np.abs(x))); r=rms(x)
    win=[rms(x[i*SR:(i+1)*SR]) for i in range(30)]
    sil=float(np.mean(np.abs(x)<10**(-60/20)))
    # spectral centroid per 1 s
    cents=[]
    for i in range(30):
        seg=x[i*SR:(i+1)*SR]*np.hanning(SR); S=np.abs(np.fft.rfft(seg)); f=np.fft.rfftfreq(SR,1/SR)
        cents.append(float((S*f).sum()/max(S.sum(),1e-9)))
    rep[name]=dict(peak_dBFS=round(db(peak),2),rms_dBFS=round(db(r),2),crest_dB=round(db(peak)-db(r),2),silence_ratio=round(sil,4),
                   rms_per_s=[round(db(w),1) for w in win],centroid_per_s=[round(c) for c in cents])
# loop boundary check: first loop 0-14 vs second 14-28
rep['loop']=dict(rms_loop1=round(db(rms(full[:14*SR])),2),rms_loop2=round(db(rms(full[14*SR:28*SR])),2),rms_tail_28_30=round(db(rms(full[28*SR:])),2))
# duck measurement on music-only bus at each SFX time (loop 1 and loop 2)
def env(x,t0,t1,hop=0.005):
    out=[]; t=t0
    while t<t1:
        a=int(t*SR); b=int((t+hop)*SR); out.append((round(t,3),db(rms(x[a:b])))); t+=hop
    return out
ducks=[]
for loopoff in (0,14):
    for s in plan['sfx']:
        t=s['t']+loopoff
        pre=db(rms(mus[int((t-0.25)*SR):int((t-0.02)*SR)]))
        e=env(mus,t-0.05,t+0.6)
        mn=min(e,key=lambda p:p[1]);
        # duration below pre-3dB
        below=[p for p in e if p[1]<pre-3]
        dur=(below[-1][0]-below[0][0]+0.005) if below else 0.0
        sfxpk=db(float(np.max(np.abs(sfx[int(t*SR):int((t+0.4)*SR)]))))
        muspk=db(float(np.max(np.abs(mus[int(t*SR):int((t+0.4)*SR)]))))
        ducks.append(dict(t=round(t,3),name=s['name'],music_pre_dB=round(pre,1),min_dB=round(mn[1],1),min_at=mn[0],dip_dB=round(pre-mn[1],1),dur_below3dB_s=round(dur,3),sfx_peak_dBFS=round(sfxpk,1),music_peak_dBFS=round(muspk,1),sfx_over_music_dB=round(sfxpk-muspk,1)))
rep['ducks']=ducks
# cross-check: does SFX bus alone contain anything at those times? and SFX RMS overall
rep['sfx_bus_rms_dBFS']=round(db(rms(sfx)),2)
# plant/return bell audibility: music-only RMS around plantT and returnT vs 0.5 s before
for tag,tt in (('plant',plan['callback']['plantT']),('return',plan['callback']['returnT'])):
    rep[tag]=dict(t=tt,rms_before=round(db(rms(mus[int((tt-0.5)*SR):int(tt*SR)])),1),rms_during=round(db(rms(mus[int(tt*SR):int((tt+0.5)*SR)])),1))
# breather (8-10 s) vs peak (10-12) vs hook (0-2)
rep['sections']={k:round(db(rms(mus[a*SR:b*SR])),1) for k,(a,b) in dict(hook=(0,2),claim=(2,4),proof1=(4,6),proof2=(6,8),breather=(8,10),callback=(10,12),landing=(12,14)).items()}
# ---- v9.1 extras ----
def wins(x,t0,t1,w):
    return [(round(t0+i*w,3),db(rms(x[int((t0+i*w)*SR):int((t0+(i+1)*w)*SR)]))) for i in range(int(round((t1-t0)/w)))]
def holes(x,t0,t1,thr=-38,minlen=0.1,w=0.01):
    out=[];run=[]
    for t,v in wins(x,t0,t1,w):
        if v<thr: run.append(t)
        else:
            if run and len(run)*w>=minlen-1e-9: out.append((run[0],round(len(run)*w,2)))
            run=[]
    if run and len(run)*w>=minlen-1e-9: out.append((run[0],round(len(run)*w,2)))
    return out
L=plan['loopSec']
# v9.2: the breather window comes from the plan (beat timings are no longer an even 2-s split)
BR=next(((c['t0'],c['t1']) for c in plan['cues'] if c.get('role')=='breather' or c.get('mood')=='breather'),(8,10))
BR=(round(BR[0]*10)/10,round(BR[1]*10)/10)
rep['v91']=dict(
  rms_full_dBFS=rep['full']['rms_dBFS'], rms_music_dBFS=rep['musicOnly']['rms_dBFS'],
  holes_loop1=holes(mus,0,L), holes_loop1_count=len(holes(mus,0,L)),
  breather_floor_dBFS=round(min(v for _,v in wins(mus,*BR,0.1)),1), breather_rms_dBFS=rep['sections']['breather'],
  seam_min_dBFS=round(min(v for _,v in wins(full,L-0.25,L+0.25,0.05)),1),
  duck_dip_mean_dB=round(float(np.mean([d['dip_dB'] for d in ducks])),2) if ducks else None,
  bell_delta_plant_dB=round(rep['plant']['rms_during']-rep['plant']['rms_before'],1),
  bell_delta_return_dB=round(rep['return']['rms_during']-rep['return']['rms_before'],1))
json.dump(rep,open(D+TAG+'-audio-report.json','w'),indent=1)
print(json.dumps(rep['v91'],indent=1))
# ---- v9.2 measured sound pass (G36) ----
import os
from scipy.signal import lfilter, resample_poly
TH=dict(lufs_target=-16.0, lufs_tol=1.5, true_peak_max_dBTP=-1.5, sfx_over_bed_min_dB=6.0, sfx_min_gap_ms=120, seam_min_dBFS=-20.0, breather_floor_min_dBFS=-30.0, holes_inside_max=0)
def kweight(x,fs=SR):
    K=np.tan(np.pi*1681.974450955533/fs); Vh=10**(3.999843853973347/20); Vb=Vh**0.4996667741545416; Q=0.7071752369554196; a0=1+K/Q+K*K
    y=lfilter([(Vh+Vb*K/Q+K*K)/a0,2*(K*K-Vh)/a0,(Vh-Vb*K/Q+K*K)/a0],[1,2*(K*K-1)/a0,(1-K/Q+K*K)/a0],x)
    K=np.tan(np.pi*38.13547087602444/fs); Q=0.5003270373238773; a0=1+K/Q+K*K
    return lfilter([1,-2,1],[1,2*(K*K-1)/a0,(1-K/Q+K*K)/a0],y)
def lufs_i(x):
    y=kweight(x); n=int(0.4*SR); hop=n//4
    ms=np.array([np.mean(y[i:i+n]**2) for i in range(0,len(y)-n+1,hop)]); L=-0.691+10*np.log10(np.maximum(ms,1e-12))
    g=ms[L>-70]; rel=-0.691+10*np.log10(np.mean(g))-10; g2=ms[(L>-70)&(L>rel)]
    return round(float(-0.691+10*np.log10(np.mean(g2))),2), L, hop
seg=full[:int(min(2*L,30)*SR)]
lufs,mom,hop=lufs_i(seg)
up=resample_poly(seg,4,1); tp=round(db(float(np.max(np.abs(up)))),2)
tpw=[(round(i*0.5,2),db(float(np.max(np.abs(up[int(i*0.5*SR*4):int((i+1)*0.5*SR*4)]))))) for i in range(int(len(seg)/SR/0.5))]
cues=[s for s in plan['sfx'] if s['t']<L]
over=[]
for s in cues:
    a,b=int(s['t']*SR),int((s['t']+0.3)*SR)
    sp=db(float(np.max(np.abs(sfx[a:b])))); bp=db(float(np.max(np.abs(mus[a:b]))))
    over.append(dict(t=s['t'],name=s['name'],sfx_peak_dBFS=round(sp,1),bed_peak_dBFS=round(bp,1),over_bed_dB=round(sp-bp,1)))
ts=sorted(s['t'] for s in cues); gaps=[(ts[i],round((ts[i+1]-ts[i])*1000)) for i in range(len(ts)-1)]
hl=[h for h in holes(mus,0,L) if h[0]>0.15]
seam=rep['v91']['seam_min_dBFS']; brf=rep['v91']['breather_floor_dBFS']
risk=[]
for o in over: risk.append(((o['over_bed_dB']-TH['sfx_over_bed_min_dB'])/6,o['t'],f"{o['name']} {o['over_bed_dB']} dB over the bed (needs >= +6)"))
for t,g in gaps: risk.append(((g-TH['sfx_min_gap_ms'])/120,t,f"two SFX {g} ms apart (needs >= 120)"))
for t,v in tpw: risk.append(((TH['true_peak_max_dBTP']-v)/6,t,f"true peak {round(v,1)} dBTP (needs < -1.5)"))
for i,v in enumerate(mom): risk.append(((lufs+8-v)/6,round(i*hop/SR,2),f"momentary {round(float(v),1)} LUFS jumps {round(float(v)-lufs,1)} LU over integrated"))
for t,d in hl: risk.append((-1,t,f"{d}s hole in the bed"))
seen=set(); top=[]
for m,t,why in sorted(risk,key=lambda r:r[0]):
    k=round(t*2)/2
    if k in seen: continue
    seen.add(k); top.append(dict(t=round(float(t),2),margin=round(float(m),2),why=why))
    if len(top)==5: break
v92=dict(thresholds=TH, lufs_i_proxy=lufs, true_peak_dBTP_proxy=tp, sfx_over_bed=over,
  sfx_over_bed_min_dB=min(o['over_bed_dB'] for o in over) if over else None, sfx_min_gap_ms=min(g for _,g in gaps) if gaps else None,
  sfx_pairs_under_120ms=sum(1 for _,g in gaps if g<120), holes_inside=hl, seam_min_dBFS=seam, breather_floor_dBFS=brf, riskiest=top)
v92['pass']={'lufs':abs(lufs-TH['lufs_target'])<=TH['lufs_tol'],'true_peak':tp<TH['true_peak_max_dBTP'],'sfx_over_bed':bool(over) and v92['sfx_over_bed_min_dB']>=TH['sfx_over_bed_min_dB'],
  'spacing':v92['sfx_pairs_under_120ms']==0,'holes':len(hl)<=TH['holes_inside_max'],'seam':seam>=TH['seam_min_dBFS'],'breather':brf>=TH['breather_floor_min_dBFS']}
v92['pass']={k:bool(v) for k,v in v92['pass'].items()}
rep['v92']=v92
json.dump(rep,open(D+TAG+'-audio-report.json','w'),indent=1)
with open(D+'SOUND.md','w') as f:
    f.write(f"# Sound pass — {TAG} (MCP board, 2 loops)\n\nIntegrated loudness proxy {lufs} LUFS (target -16 ± 1.5) · true peak proxy {tp} dBTP (< -1.5) · SFX over bed min {v92['sfx_over_bed_min_dB']} dB (>= +6) · min SFX gap {v92['sfx_min_gap_ms']} ms (>= 120) · holes inside {len(hl)} · seam {seam} dBFS · breather floor {brf} dBFS\n\n## Five riskiest timestamps\n\n| t (s) | margin | why |\n|---|---|---|\n")
    for r in top: f.write(f"| {r['t']} | {r['margin']} | {r['why']} |\n")
man=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../../vendor/sfx/manifest.json')
if os.path.exists(man):
    m=json.load(open(man))
    with open(D+'CREDITS.txt','w') as f:
        f.write('Sound effects (CC0 1.0, credit optional). Sound-pass approach: Vox (@Voxyz_ai).\n')
        for x in m['files']: f.write(f"{x['title']} by {x['author']} ({x['source']}), CC0 1.0\n")
print(json.dumps({k:v for k,v in v92.items() if k not in ('sfx_over_bed','thresholds')},indent=1))
