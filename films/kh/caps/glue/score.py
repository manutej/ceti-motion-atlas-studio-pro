"""CETI Capabilities 03 · glue — score. 120 BPM, D major. Every sound sits on a cue exported by film.js.
Signature: each seam is read as TWO tones (one per end). Agreeing ends ring in unison; the discord seam is a beating
dyad (220 vs 226 Hz) that throbs with the terracotta glow, and at the glue the two pitches glide together into one note."""
import json, sys, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, lfilter
from scipy.io import wavfile
Q = json.load(open(sys.argv[1])); OUT = sys.argv[2]
SR = 48000; D = Q['dur']; N = int(D * SR); t = np.arange(N) / SR; B = 60 / Q['bpm']
rng = np.random.default_rng(207); BUS = np.zeros((N, 2)); SEND = np.zeros(N)
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
def whoosh(d, rev=False):
    tt = T(d); e = (tt / d) ** 2 if rev else np.sin(np.pi * tt / d) ** 2; return bp(rng.standard_normal(len(tt)), 500, 6000) * e
def bell(f, d=3.0):
    tt = T(d); return sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * k) for m, a, k in [(1, 1, 1.4), (2.76, 0.28, 3.2), (0.5, 0.35, 1.0)]) * np.minimum(1, tt / 0.003)

# ---- pulse: soft kick on the beat while the notes are worked; half-time under the glue; gone for the section ----
n = 0
while n * B < Q['fuse0']:
    tb = n * B
    if tb >= 2.0 and (tb < Q['glue0'] - 0.2 or tb >= Q['snap'] or n % 2 == 0):
        tt = T(0.3); f = 46 + 70 * np.exp(-tt * 30); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9), tb, 0.5 if tb < Q['glue0'] else 0.3)
        if 4.0 <= tb < 12.5: tt = T(0.06); put(hp(rng.standard_normal(len(tt)), 7000) * np.exp(-tt * 60), tb + B / 2, 0.12, 0.3)
    n += 1
put(whoosh(0.7, rev=True), Q['title'] - 0.05, 0.12, 0, 0.2)
put(whoosh(1.2), Q['enter'], 0.12, -0.6, 0.2)

# ---- stalk: each note settles on a pentatonic step, left to right ----
PENTA = [293.66, 329.63, 369.99, 440.0, 493.88]
for i, x in enumerate(Q['settle']): put(mallet(PENTA[i], 1.2, 0.7), x, 0.3, -0.6 + 0.3 * i, 0.35)   # note i settles; right→left so the line descends
# ---- overlap: a dry wooden tick as each band draws on ----
for j, x in enumerate(Q['overlap']): put(lp(tick(1300, 0.05), 3000), x, 0.3, 0.45 - 0.3 * j, 0.1)

# ---- compare: two tones per seam, left end then right end ----
SEAMF = [440.0, 493.88, 587.33, 220.0]
for j, (a, v) in enumerate(zip(Q['arrive'], Q['verdict'])):
    pan = -0.45 + 0.3 * j; f = SEAMF[j]
    put(tick(2200, 0.03), a, 0.18, pan, 0.1)
    if j == Q['bad']: continue
    put(mallet(f, 0.9, 0.6), a + 0.02, 0.2, pan - 0.15, 0.3); put(mallet(f, 0.9, 0.6), a + 0.14, 0.2, pan + 0.15, 0.3)
    put(mallet(f * 2, 1.4, 0.4) + 0.5 * mallet(f * 3, 1.4, 0.3), v, 0.16, pan, 0.6)          # agree: clean unison chime

# ---- the discord hum → glue: 220 vs 226 Hz beating, the two pitches glide to one note on the snap ----
j = Q['bad']; a = Q['arrive'][j]; v = Q['verdict'][j]; g0 = Q['glue0']; sn = Q['snap']
i0 = int(a * SR); i1 = int((sn + 2.4) * SR); tt = t[i0:i1]
conv = smooth(g0, sn, tt)
f1 = 220.0 + 3.0 * conv; f2 = np.where(tt < v, 220.0, 226.0) * (1 - conv) + 223.0 * conv
ph1 = 2 * np.pi * np.cumsum(f1) / SR; ph2 = 2 * np.pi * np.cumsum(f2) / SR
tone = lambda ph: np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
env1 = smooth(a, a + 0.03, tt) * (1 - smooth(sn + 0.6, sn + 2.4, tt))
env2 = smooth(a + 0.12, a + 0.15, tt) * (1 - smooth(sn + 0.6, sn + 2.4, tt))
hum = (tone(ph1) * env1 + tone(ph2) * env2) * (0.55 + 0.45 * smooth(v, v + 0.3, tt) * (1 - conv))
hum = lp(hum, 1800) * (0.5 + 0.5 * np.exp(-(tt - a) * 3) + 0.4 * smooth(v, v + 0.2, tt) * (1 - conv))
put(hum, a, 0.13, 0.15, 0.35)
put(lp(rng.standard_normal(int(0.5 * SR)), 900) * np.exp(-T(0.5) * 7), v, 0.18, 0.15, 0.4)   # the discord lands: low thud
put(whoosh(1.1, rev=True), Q['pushIn'], 0.1, 0.3, 0.2)            # the camera leans in on the bad seam
put(whoosh(1.4), Q['pushOut'], 0.08, 0.0, 0.2)
put(whoosh(0.5, rev=True), sn - 0.5, 0.14, 0.15, 0.2)
put(mallet(223.0 * 2, 2.2, 1.0) + 0.6 * mallet(223.0 * 3, 2.2, 0.6), sn, 0.3, 0.15, 0.6)          # one note
put(bell(1174.66 * 223 / 220, 2.4), sn + 0.02, 0.1, 0.15, 0.7)

# ---- the card: a soft page-turn ----
put(lp(whoosh(0.35), 4000), Q['card'], 0.08, 0.6, 0.1)

# ---- section: the fuse runs outward from the glued seam (rising shimmer, panned out both ways) ----
f0, f1_ = Q['fuse0'], Q['fuse1']; ARP = [587.33, 659.25, 739.99, 880.0, 987.77, 1174.66, 1318.51, 1479.98]
for k, f in enumerate(ARP):
    x = f0 + (f1_ - f0) * k / len(ARP)
    put(mallet(f, 1.0, 0.9), x, 0.11, -0.2 - 0.08 * k, 0.5); put(mallet(f * 1.003, 1.0, 0.9), x + 0.03, 0.09, 0.2 + 0.08 * k, 0.5)
# ---- one wave: the bend swells, the ring closes with a bell chord and a spout ----
sw = np.zeros(N); swe = smooth(Q['bend0'], Q['close'], t) * (1 - smooth(Q['close'], Q['close'] + 1.2, t))
for f, gg in [(146.83, 1), (220.0, 0.6), (293.66, 0.5)]: sw += gg * np.sin(2 * np.pi * f * t)
sw = lp(sw * swe, 900) * 0.06; BUS[:, 0] += sw; BUS[:, 1] += sw; SEND += sw * 0.5
for i, f in enumerate([587.33, 739.99, 880.0, 1174.66]): put(bell(f, 3.2), Q['close'] + i * 0.06, 0.12, -0.3 + 0.2 * i, 0.7)
tt = T(0.9); put(bp(rng.standard_normal(len(tt)), 400, 3500) * np.exp(-tt * 4) * np.minimum(1, tt / 0.02), Q['close'], 0.14, 0, 0.3)
# the loop-the-loop: a slow rising/falling whoosh; the pulse round the ring: a soft high tick each lap at the top
put(whoosh(Q['lap1'] - Q['lap0']), Q['lap0'], 0.1, 0, 0.3)
for x in Q['pulseLaps']: put(mallet(1174.66, 0.8, 0.3), x, 0.07, 0, 0.6)

# ---- pad under the ending; thins out for the not-this line; end chord on the belief; low D under the lockup ----
pad = np.zeros(N)
for f, gg in [(146.83, 1), (220.0, 0.7), (293.66, 0.6), (369.99, 0.4), (440.0, 0.3)]: pad += gg * np.sin(2 * np.pi * f * (1 + 0.0015 * np.sin(2 * np.pi * 0.11 * t + f)) * t)
pad *= 0.045 * smooth(Q['fuse0'], Q['close'], t) * (1 - 0.55 * smooth(Q['notThis'], Q['notThis'] + 0.4, t) + 0.45 * smooth(Q['end'], Q['end'] + 0.6, t)) * (1 - smooth(D - 1.2, D, t))
pad = lp(pad, 2200); BUS[:, 0] += pad; BUS[:, 1] += pad; SEND += pad * 0.4
put(mallet(220.0, 1.6, 0.4), Q['notThis'], 0.16, 0, 0.5); put(mallet(233.08, 1.6, 0.3), Q['notThis'] + 0.25, 0.08, 0.1, 0.5)   # a small question
for i, f in enumerate([293.66, 369.99, 440.0, 587.33]): put(mallet(f, 2.6, 0.8), Q['end'] + i * 0.11, 0.22, -0.3 + 0.2 * i, 0.6)
put(mallet(73.42, 2.4, 0.2), Q['lockup'], 0.4, 0, 0.3)

# ---- reverb, fades, loudness (BS.1770-style K-weighted, gated) to -16 LUFS, true-peak-ish ceiling -1 dBTP ----
ir_t = T(1.8); ir = [lp(rng.standard_normal(len(ir_t)), 5000) * np.exp(-ir_t * 3.2) for _ in range(2)]; ir = [x / np.sqrt((x ** 2).sum()) for x in ir]
wet = np.stack([fftconvolve(SEND, ir[0])[:N], fftconvolve(SEND, ir[1])[:N]], 1)
out = BUS + 0.3 * wet; out *= (smooth(0, 0.05, t) * (1 - smooth(D - 0.4, D, t)))[:, None]
def kweight(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    return lfilter(b2, a2, lfilter(b1, a1, x))
def lufs(x):
    k = np.stack([kweight(x[:, c]) for c in range(2)], 1); w = int(0.4 * SR); hop = int(0.1 * SR)
    ms = np.array([(k[i:i + w] ** 2).mean(0).sum() for i in range(0, len(k) - w, hop)]); L = -0.691 + 10 * np.log10(ms + 1e-12)
    g1 = ms[L > -70]; rel = -0.691 + 10 * np.log10(g1.mean()) - 10; g2 = ms[(L > -70) & (L > rel)]
    return -0.691 + 10 * np.log10(g2.mean())
out *= 10 ** ((-16 - lufs(out)) / 20)
up = np.stack([np.interp(np.arange(N * 4) / 4, np.arange(N), out[:, c]) for c in range(2)], 1); tp = np.abs(up).max()
ceil = 10 ** (-1.0 / 20)
if tp > ceil:   # gentle soft-knee limiter on the overs only
    out = np.sign(out) * np.where(np.abs(out) > 0.7 * ceil, 0.7 * ceil + (ceil - 0.7 * ceil) * np.tanh((np.abs(out) - 0.7 * ceil) / (ceil - 0.7 * ceil)), np.abs(out))
wavfile.write(OUT, SR, (clamp(out, -1, 1) * 32767).astype(np.int16)); print(f'score ok  {lufs(out):.1f} LUFS  peak {20 * np.log10(np.abs(out).max()):.1f} dBFS')
