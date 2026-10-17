"""Sea of data — score. 128 BPM. Every sound sits on an event the picture exports in cues.json."""
import json, sys, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile
Q = json.load(open(sys.argv[1])); OUT = sys.argv[2]
SR = 48000; D = Q['dur']; N = int(D * SR); t = np.arange(N) / SR; B = 60 / Q['bpm']
rng = np.random.default_rng(9); BUS = np.zeros((N, 2)); SEND = np.zeros(N)
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

# pulse: soft kick + shaker while the whale hunts and sorts; half-time while the pods work; gone at the end
n = 0
while n * B < 24.0:
    tb = n * B
    if tb >= 0.9 and (tb < 17.6 or n % 2 == 0):
        tt = T(0.32); f = 48 + 75 * np.exp(-tt * 30); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9), tb, 0.6 if tb < 10.5 or tb > 13.2 else 0.25)
        if tb < 17.6: tt = T(0.07); put(hp(rng.standard_normal(len(tt)), 6500) * np.exp(-tt * 55), tb + B / 2, 0.18, 0.35)
    n += 1
# data shimmer: a tiny tick for every glyph the whale senses (grain cloud), louder in the sounding ring
cl = np.array(Q['classified'])
for x in cl: put(tick(rng.uniform(2200, 4200)), x, 0.035 if x < Q['ping'] else 0.02, rng.uniform(-0.8, 0.8), 0.15)
# the sounding: a sonar ping and its echo
tt = T(2.2); ping = np.sin(2 * np.pi * 1046.5 * tt) * np.exp(-tt * 2.6) * np.minimum(1, tt / 0.004)
put(ping, Q['ping'], 0.28, 0, 0.7); put(ping, Q['ping'] + 0.42, 0.1, 0.5, 0.8)
# sorting: a long whoosh as everything flows into four clusters
put(whoosh(2.0), Q['sortStart'], 0.3, 0, 0.3)
# the idea: a bright bell over held breath
tt = T(3.0); bell = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a, d in [(1318.5, 1, 1.6), (1318.5 * 2.76, 0.3, 3.5), (659.25, 0.4, 1.2)])
put(bell * np.minimum(1, tt / 0.003), Q['idea'], 0.2, 0, 0.6)
put(whoosh(0.5, rev=True), Q['idea'] - 0.5, 0.15, 0, 0.2)
# network: each cluster collapses with a low mallet; each link draws with a rising note
for i, x in enumerate(Q['collapses']): put(mallet([110, 138.59, 164.81, 220][i], 1.2, 0.5), x, 0.35, -0.4 + 0.27 * i, 0.3)
SCALE = [440, 493.88, 554.37, 659.25, 739.99, 880, 987.77, 1108.73]
for i, x in enumerate(Q['edges']): put(mallet(SCALE[i], 1.0), x, 0.2, -0.3 + 0.08 * i, 0.4)
# dispatch: spout, pods leave (pips), work (soft pulses), done (chime), home (descending pips)
tt = T(0.8); put(bp(rng.standard_normal(len(tt)), 300, 3000) * np.exp(-tt * 4) * np.minimum(1, tt / 0.02), Q['spout'], 0.3, 0, 0.3)
for i in range(4):
    put(whoosh(0.4), Q['out'][i], 0.18, -0.5 + 0.33 * i, 0.1); put(tick(1800 + 300 * i, 0.06), Q['out'][i], 0.25, -0.5 + 0.33 * i, 0.2)
    for k in range(3): put(tick(900, 0.05), Q['arrive'][i] + k * 0.4, 0.12, -0.5 + 0.33 * i, 0.2)
    put(mallet(SCALE[4 + i % 4], 1.6, 1.2), Q['done'][i], 0.26, -0.5 + 0.33 * i, 0.5)
    put(tick(2400 - 300 * i, 0.06), Q['home'][i], 0.2, 0, 0.2)
# resolve: pad swell and an end chord
pad = np.zeros(N)
for f, g in [(220, 1), (277.18, 0.6), (329.63, 0.8), (440, 0.5), (554.37, 0.35)]: pad += g * np.sin(2 * np.pi * f * (1 + 0.0015 * np.sin(2 * np.pi * 0.12 * t + f)) * t)
pad *= 0.05 * smooth(21.5, 25.5, t) * (1 - 0.5 * smooth(D - 1.0, D, t)); BUS[:, 0] += lp(pad, 2500); BUS[:, 1] += lp(pad, 2500); SEND += pad * 0.4
for i, f in enumerate([440, 554.37, 659.25, 880]): put(mallet(f, 2.6, 0.8), Q['end'] + i * 0.11, 0.28, -0.3 + 0.2 * i, 0.6)
put(whoosh(0.7, rev=True), Q['title'] - 0.1, 0.12, 0, 0.2)
ir_t = T(1.7); ir = [lp(rng.standard_normal(len(ir_t)), 5000) * np.exp(-ir_t * 3.3) for _ in range(2)]; ir = [x / np.sqrt((x ** 2).sum()) for x in ir]
wet = np.stack([fftconvolve(SEND, ir[0])[:N], fftconvolve(SEND, ir[1])[:N]], 1)
out = BUS + 0.3 * wet; out *= (smooth(0, 0.05, t) * (1 - smooth(D - 0.4, D, t)))[:, None]; out /= np.abs(out).max() / 0.8
wavfile.write(OUT, SR, (out * 32767).astype(np.int16)); print('score ok')
