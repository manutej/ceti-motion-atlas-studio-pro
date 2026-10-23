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
rep['v91']=dict(
  rms_full_dBFS=rep['full']['rms_dBFS'], rms_music_dBFS=rep['musicOnly']['rms_dBFS'],
  holes_loop1=holes(mus,0,L), holes_loop1_count=len(holes(mus,0,L)),
  breather_floor_dBFS=round(min(v for _,v in wins(mus,8,10,0.1)),1), breather_rms_dBFS=rep['sections']['breather'],
  seam_min_dBFS=round(min(v for _,v in wins(full,L-0.25,L+0.25,0.05)),1),
  duck_dip_mean_dB=round(float(np.mean([d['dip_dB'] for d in ducks])),2) if ducks else None,
  bell_delta_plant_dB=round(rep['plant']['rms_during']-rep['plant']['rms_before'],1),
  bell_delta_return_dB=round(rep['return']['rms_during']-rep['return']['rms_before'],1))
json.dump(rep,open(D+TAG+'-audio-report.json','w'),indent=1)
print(json.dumps(rep['v91'],indent=1))
