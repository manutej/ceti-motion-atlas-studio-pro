"""04 · conserve60: score. 124 BPM, 32 bars. Every sound sits on an event the picture exports (cues.json -> ev[]).
Two motifs (LONGFORM-60 §7). Signature: the line is a plucked string and the pins are its nodes; once pinned, every edit
plucks the SAME A (220 Hz). Problem motif: the same string detuned and sagging, with no ring (FELT, WHY).
Hinge: half a bar of near-silence, then the title tick. LIMIT: the signature plays once against a B-flat and does not resolve.
PAYOFF: the link lands on a true A; the pod's tick resolves to A major; the shake strums the one note. BELIEF: pad tail only.
Normalised to -16 LUFS (BS.1770 K-weighting, gated), true peak <= -1 dBTP (4x oversampled limiter)."""
import json, sys, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, lfilter, resample_poly
from scipy.ndimage import minimum_filter1d
from scipy.io import wavfile
Q = json.load(open(sys.argv[1])); OUT = sys.argv[2]
SR = 48000; D = Q['dur']; N = int(D * SR); t = np.arange(N) / SR; B = 60 / Q['bpm']; ACTS = Q['acts']
rng = np.random.default_rng(4060); BUS = np.zeros((N, 2)); SEND = np.zeros(N)
A = 220.0
EV = Q['ev']
def at(k): return [e for e in EV if e['k'] == k]
def one(k): return at(k)[0]['t']
def clamp(x, a=0.0, b=1.0): return np.minimum(b, np.maximum(a, x))
def smooth(a, b, x): k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def T(d): return np.arange(int(d * SR)) / SR
def put(sig, start, gain=1.0, pan=0.0, send=0.0):
    i0 = int(round(start * SR))
    if i0 >= N: return
    s0 = max(0, -i0); i0 = max(0, i0); i1 = min(N, i0 + len(sig) - s0); s = sig[s0:s0 + i1 - i0] * gain
    BUS[i0:i1, 0] += s * np.sqrt(0.5 * (1 - pan)); BUS[i0:i1, 1] += s * np.sqrt(0.5 * (1 + pan)); SEND[i0:i1] += s * send
def mallet(f, d=1.4, bright=1.0):
    tt = T(d); return (np.sin(2 * np.pi * f * tt) + 0.45 * bright * np.sin(2 * np.pi * 4 * f * tt) * np.exp(-tt * 28)) * np.exp(-tt * 4) * np.minimum(1, tt / 0.002)
def tick(f=2600, d=0.04):
    tt = T(d); return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 140)
def whoosh(d, rev=False, lo=500, hi=6000):
    tt = T(d); e = (tt / d) ** 2 if rev else np.sin(np.pi * tt / d) ** 2; return bp(rng.standard_normal(len(tt)), lo, hi) * e
def pluck(f, d=1.6, bright=0.5, glide=None, damp=1.0):
    """Karplus-Strong string. glide = (f_end, seconds) retunes it while it rings. damp < 1 kills the ring (the problem motif)."""
    f0 = f if glide is None else max(f, glide[0]); L = max(2, int(round(SR / f0))); n = int(d * SR)
    buf = lp(rng.uniform(-1, 1, L), 1500 + 9000 * bright, 1); k = (0.996 - 0.004 * (1 - bright)) * damp
    out = lfilter([1.0], np.concatenate([[1.0], np.zeros(L - 1), [-0.5 * k, -0.5 * k]]), np.concatenate([buf, np.zeros(n)]))[:n]
    if glide is not None:
        tt = T(d); fr = f + (glide[0] - f) * smooth(0, glide[1], tt); pos = np.cumsum(fr / f0); pos = pos[pos < n - 1]
        out = np.interp(pos, np.arange(n), out); out = np.pad(out, (0, n - len(out)))
    return out * np.minimum(1, T(d) / 0.002) * (1 - smooth(d - 0.15, d, T(d)))
def knock(f=900, d=0.12):
    tt = T(d); return (np.sin(2 * np.pi * f * tt) * np.exp(-tt * 45) + 0.6 * bp(rng.standard_normal(len(tt)), f * 0.8, f * 2.5) * np.exp(-tt * 90))
def thunk(f=150):
    tt = T(0.5); return lp(np.sin(2 * np.pi * f * (1 - 0.15 * tt) * tt) * np.exp(-tt * 12) + 0.4 * rng.standard_normal(len(tt)) * np.exp(-tt * 60), 900)
def snapclick():
    tt = T(0.06); return hp(rng.standard_normal(len(tt)), 3000) * np.exp(-tt * 120)
def kick(g):
    tt = T(0.32); f = 46 + 70 * np.exp(-tt * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9) * g
def shaker(d=0.07):
    tt = T(d); return hp(rng.standard_normal(len(tt)), 6500) * np.exp(-tt * 55)
def tone(f, d, parts=((1, 1, 0.9), (2, 0.45, 1.4), (3, 0.2, 2.2))):
    tt = T(d); return sum(a * np.sin(2 * np.pi * f * h * tt) * np.exp(-tt * dd) for h, a, dd in parts) * np.minimum(1, tt / 0.004)

# ---------- FELT: the problem motif only (detuned, no ring), no drums ----------
put(pluck(207.6, 1.0, 0.5, glide=(200.0, 0.6), damp=0.985), one('bump'), 0.55, 0.1, 0.25); put(knock(420, 0.1), one('bump'), 0.22, 0.1, 0.1)
put(pluck(196.0, 0.8, 0.35, glide=(190.0, 0.5), damp=0.98), one('flutter'), 0.32, -0.1, 0.25)
put(whoosh(0.8, lo=300, hi=3000), one('podIn') - 0.7, 0.07, -0.5, 0.2)
put(thunk(150), one('podX'), 0.6, 0.2, 0.2); put(thunk(140), one('pulseX'), 0.22, 0.2, 0.3)
put(whoosh(1.0, lo=250, hi=2500), one('podOut'), 0.08, 0.5, 0.1)
# ---------- WHY: hinge silence, title tick, the problem motif three times and accelerating ----------
hg = ACTS['why']['in']; rt = lp(rng.standard_normal(N), 300) * 0.02 * smooth(hg - 0.3, hg, t) * (1 - smooth(hg + 2 * B, hg + 2 * B + 0.4, t)); BUS[:, 0] += rt; BUS[:, 1] += rt
ti = one('title'); put(mallet(A / 2, 2.4, 0.4), ti, 0.2, 0, 0.5); put(tick(2400, 0.04), ti, 0.12, 0, 0.1)
put(whoosh(1.6, lo=200, hi=1800), one('pull'), 0.06, 0, 0.3)
for e in at('edit'):
    i = e['i']; g = [0.45, 0.5, 0.55, 0.4][i]; f = [207.6, 201.0, 214.0, 196.0][i]
    put(pluck(f, 0.9, 0.45 + 0.1 * i, glide=(f * 0.955, 0.45), damp=0.985), e['t'], g, [-0.4, 0.3, -0.1, 0.4][i], 0.25)
    if i < 3: put(snapclick(), e['t'] + 0.12, 0.18, [0.3, -0.4, 0.1][i], 0.1)
# the hint: the first clean, in-tune A (the signature, heard once before the move)
put(pluck(A, 2.6, 0.55), one('homes'), 0.5, 0, 0.45)
# ---------- MOVE: the string is tuned; three pins build an open A chord ----------
for e, f in zip(at('tap'), [110.0, 164.81, 220.0]):
    put(knock(900 + 150 * e['i']), e['t'], 0.35, -0.5 + 0.5 * e['i'], 0.2); put(mallet(f, 2.4, 0.5), e['t'] + 0.02, 0.32, -0.5 + 0.5 * e['i'], 0.5)
put(tick(3000, 0.03), one('label'), 0.1, 0, 0.2);
for e in at('pedit'):
    i = e['i']; put(pluck(A, 1.8, [0.3, 0.75, 0.5, 0.6][i]), e['t'], 0.55, [-0.3, 0.3, 0.0, -0.2][i], 0.35); put(kick(0.3), e['t'])
for e in at('pulse'):
    tense = e['tense']; kase = e['kase']; b = int(round(e['t'] / B))
    if not tense or b % 2 == 0: put(kick(0.4 if not kase else 0.32), e['t'])
    if not tense: put(shaker(), e['t'] + B / 2, 0.12 if not kase else 0.16, 0.35, 0.0)
    if kase: put(shaker(0.05), e['t'] + B / 4, 0.07, -0.35, 0.0); put(shaker(0.05), e['t'] + 3 * B / 4, 0.07, -0.35, 0.0)
for e in at('check'):
    tt = T(0.9); put(np.sin(2 * np.pi * 1760 * tt) * np.exp(-tt * 7) * np.minimum(1, tt / 0.004), e['t'], 0.06, 0, 0.6)
for e in at('hit'):
    put(tick(1300 if e['bad'] else 2400 + 150 * int(e['id'][1]), 0.05), e['t'], 0.12 if e['bad'] else 0.07, 0, 0.25)
for e in at('ledger'):
    if e['fire']:
        tt = T(2.0); bell = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a, d in [(659.25, 1, 1.8), (659.25 * 2.76, 0.3, 4), (329.63, 0.5, 1.4)])
        put(bell * np.minimum(1, tt / 0.003), e['t'], 0.2, 0.5, 0.6)
    else: put(tick(1800, 0.03), e['t'], 0.08 if e['quiet'] else 0.14, 0.6, 0.05)
# the tug: a heavy landing, the string pulled flat while it rings; the gate drops; a beating drone until the fix
tug, stop, rep = one('tug'), one('stop'), one('repair')
put(kick(0.7), tug); put(pluck(A, 2.2, 0.5, glide=(A * 0.89, 0.75)), tug, 0.6, 0, 0.3); put(knock(300, 0.15), stop, 0.35, 0.5, 0.2)
seg = (t > stop) & (t < rep + 0.4); dr = np.zeros(N)
dr[seg] = (np.sin(2 * np.pi * A * 0.89 * t[seg]) + np.sin(2 * np.pi * (A * 0.89 + 5.5) * t[seg])) * smooth(stop, stop + 0.3, t[seg]) * (1 - smooth(rep, rep + 0.35, t[seg]))
dr = lp(dr, 1200) * 0.05; BUS[:, 0] += dr; BUS[:, 1] += dr; SEND += dr * 0.3
put(pluck(A * 0.89, 1.8, 0.7, glide=(A, 0.12)), rep, 0.55, 0, 0.35); put(knock(1100), rep, 0.3, 0, 0.1)
put(mallet(880, 0.9, 0.8), one('gateOpen'), 0.1, 0.5, 0.4)
# ---------- CASE: pulse bed (above), the lab slides in, docks in tune, the card, each new source ----------
put(whoosh(1.9, rev=True, lo=300, hi=4000), one('dock') - 1.9, 0.08, 0.6, 0.2); put(kick(0.6), one('dock')); put(knock(700), one('dock'), 0.3, 0.3, 0.2)
put(pluck(A, 2.0, 0.6), one('dock') + 0.02, 0.4, 0.2, 0.35); put(pluck(A * 1.5, 2.0, 0.6), one('dock') + 0.05, 0.25, 0.5, 0.35)
put(mallet(440, 1.6, 0.6), one('card'), 0.12, 0.3, 0.5); put(mallet(659.25, 1.6, 0.6), one('card') + B / 2, 0.1, 0.4, 0.5)
for e in at('labDot'): put(mallet(880 * (1.25 if e['i'] else 1.0), 1.0, 0.7), e['t'], 0.1, 0.5, 0.5)
# ---------- LIMIT: the signature once, against a B-flat; it does not resolve ----------
g0 = one('grid'); put(pluck(A, 2.8, 0.5), g0, 0.45, -0.1, 0.5); put(mallet(233.08, 2.8, 0.4), g0 + 0.03, 0.22, 0.2, 0.6); put(mallet(311.13, 2.4, 0.3), g0 + 0.06, 0.1, 0.3, 0.6)
for j, e in enumerate(at('auditTick')): put(tick(900 if e['bad'] else 3200, 0.035), e['t'], 0.09 if e['bad'] else 0.04, ((j * 5) % 7 - 3) / 6, 0.1)
put(mallet(A * 2, 1.2, 0.5), one('pinsCalm'), 0.08, -0.3, 0.5)
nt = one('notThis'); room = lp(rng.standard_normal(N), 400) * 0.006 * smooth(nt, nt + 0.6, t) * (1 - smooth(nt + 2.2, nt + 2.6, t)); BUS[:, 0] += room; BUS[:, 1] += room
# ---------- PAYOFF: the link lands on a true A, the pod's tick resolves, the shake strums the one note ----------
put(pluck(A, 1.4, 0.4), one('follow'), 0.35, -0.3, 0.3)
ld = one('land'); put(tone(A, 4.0), ld, 0.22, 0, 0.6); put(knock(1000), ld, 0.25, 0, 0.2)
put(whoosh(1.2, lo=300, hi=3000), one('podIn2') - 0.4, 0.06, -0.5, 0.2)
ok = one('podOk')
for i, f in enumerate([220, 277.18, 329.63, 440]): put(mallet(f, 2.6, 0.7), ok + i * 0.09, 0.24, -0.3 + 0.2 * i, 0.6)
put(mallet(1318.5, 1.4, 1.0), ok + 0.15, 0.07, 0.4, 0.7)
put(whoosh(1.4, lo=300, hi=3500), one('podOut2'), 0.07, -0.5, 0.3)
sh0, sh1, st = one('shake'), one('shakeEnd'), one('still')
put(kick(0.7), sh0); x = sh0; k = 0
while x < st - 0.2:
    env = min(1, (x - sh0) / 0.2) * (1 - smooth(sh1, st, x))
    put(pluck(A, 0.6, 0.85 if k % 2 == 0 else 0.55), x, 0.4 * env, -0.35 if k % 2 else 0.35, 0.25); put(shaker(0.09), x + B / 4, 0.18 * env, 0.0, 0.1)
    if k % 2 == 0: put(kick(0.5 * env), x)
    x += B / 2; k += 1
put(tone(A, 4.0), st, 0.16, 0, 0.6)
# ---------- BELIEF: pad tail on the open A chord; one low A under the lockup ----------
bl = one('belief'); pad = np.zeros(N)
for f, g in [(110, 1), (164.81, 0.7), (220, 0.6), (277.18, 0.35), (329.63, 0.4)]: pad += g * np.sin(2 * np.pi * f * (1 + 0.0015 * np.sin(2 * np.pi * 0.11 * t + f)) * t)
pad *= 0.035 * smooth(bl - 0.6, bl + 1.4, t) * (1 - smooth(D - 1.2, D, t)); pad = lp(pad, 2200); BUS[:, 0] += pad; BUS[:, 1] += pad; SEND += pad * 0.4
put(mallet(110, 3.0, 0.3), one('lockup'), 0.28, 0, 0.5)

ir_t = T(1.7); ir = [lp(rng.standard_normal(len(ir_t)), 5000) * np.exp(-ir_t * 3.3) for _ in range(2)]; ir = [x / np.sqrt((x ** 2).sum()) for x in ir]
wet = np.stack([fftconvolve(SEND, ir[0])[:N], fftconvolve(SEND, ir[1])[:N]], 1)
out = BUS + 0.3 * wet; out *= (smooth(0, 0.05, t) * (1 - smooth(D - 0.4, D, t)))[:, None]

# ---------- loudness: BS.1770-4 integrated (K-weighted, gated) and a 4x true-peak limiter ----------
def lufs(x):
    kw = lfilter([1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585], x, axis=0)
    kw = lfilter([1.0, -2.0, 1.0], [1, -1.99004745483398, 0.99007225036621], kw, axis=0)
    blk, hop = int(0.4 * SR), int(0.1 * SR); z = np.array([(kw[i:i + blk] ** 2).mean(0).sum() for i in range(0, len(kw) - blk, hop)])
    l = -0.691 + 10 * np.log10(z + 1e-12); z = z[l > -70]; rel = -0.691 + 10 * np.log10(z.mean()) - 10
    z = z[-0.691 + 10 * np.log10(z) > rel]; return -0.691 + 10 * np.log10(z.mean())
def tpeak(x): return np.abs(resample_poly(x, 4, 1, axis=0)).max()
thr = 10 ** (-1.3 / 20)
for _ in range(4):
    out *= 10 ** ((-16 - lufs(out)) / 20)
    up = np.abs(resample_poly(out, 4, 1, axis=0)).max(1).reshape(-1, 4).max(1)[:N]
    g = np.minimum(1, thr / np.maximum(up, 1e-9)); w = int(0.003 * SR)
    g = minimum_filter1d(g, 2 * w + 1); g = np.convolve(g, np.ones(w + 1) / (w + 1), 'same'); out *= g[:, None]
out *= 10 ** ((-16 - lufs(out)) / 20); tp = 20 * np.log10(tpeak(out))
if tp > -1.0: out *= 10 ** ((-1.05 - tp) / 20); tp = 20 * np.log10(tpeak(out))
# hinge check: the half bar after the hinge should be near-silent (room tone <= -40 dBFS)
h0 = int(ACTS['why']['in'] * SR); h1 = int((ACTS['why']['in'] + 2 * B) * SR); hr = 20 * np.log10(np.sqrt((out[h0:h1] ** 2).mean()) + 1e-12)
wavfile.write(OUT, SR, (clamp(out, -1, 1) * 32767).astype(np.int16)); print(f'score ok  {lufs(out):.1f} LUFS  TP {tp:.2f} dBTP  hinge {hr:.1f} dBFS')
