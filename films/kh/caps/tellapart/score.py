"""Tell-apart — score. 132 BPM. Every sound sits on an event the picture exports in cues.json.
Signature: before the split, both worlds' measurements land on the SAME note (unison = one reading);
the whale unzips the line and a held unison glides apart into two notes; after it, each world lands on its own note."""
import json, sys, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile
Q = json.load(open(sys.argv[1])); OUT = sys.argv[2]
SR = 48000; D = Q['dur']; N = int(D * SR); t = np.arange(N) / SR; B = 60 / Q['bpm']
rng = np.random.default_rng(5); BUS = np.zeros((N, 2)); SEND = np.zeros(N)
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
def kick(g):
    tt = T(0.3); f = 50 + 70 * np.exp(-tt * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 10) * g

E5, CS5, GS5, A4 = 659.25, 554.37, 830.61, 440.0
# pulse: half-time while the line is one reading, on every beat once it has split, gone for the captions
n = 0
while n * B < Q['notthis']:
    tb = n * B
    if tb >= Q['decision'] - 0.01:
        pre = tb < Q['split']
        if (pre and n % 2 == 0) or not pre:
            put(kick(1), tb, 0.5 if not (Q['dive'] <= tb < Q['cards']) else 0.25)
        if not pre: tt = T(0.06); put(hp(rng.standard_normal(len(tt)), 7000) * np.exp(-tt * 60), tb + B / 2, 0.12, 0.3)
    n += 1
# open: breath in, the rule draws
put(whoosh(0.6, rev=True), Q['title'] - 0.15, 0.12, 0, 0.2); put(mallet(A4, 2.0, 0.4), Q['open_rule'] + 0.4, 0.14, 0, 0.6)
# stations: a quiet wooden tick on each word
for x in Q['stations']: put(tick(1400, 0.05), x, 0.16, -0.5, 0.3)
# the consumer wakes: a two-note pip
put(mallet(1108.73, 0.5, 0.3), Q['decision'], 0.12, 0.2, 0.3); put(mallet(1318.5, 0.6, 0.3), Q['decision'] + B / 2, 0.12, 0.2, 0.3)
# landings: soft body thud
for x in Q['landings']: put(mallet(110, 0.6, 0.2), x, 0.22, 0, 0.1)
# measurements: each world launches with its own pitch; on arrival BEFORE the split both ring the same note (one reading);
# AFTER the split each lands on its own note
for p in Q['pulses']:
    pan = -0.55 if p['w'] == 0 else 0.55; late = p['t0'] > Q['green'] + 1.5
    put(tick(1760 if p['w'] == 0 else 2349, 0.05), p['t0'], 0.1 if late else 0.2, pan, 0.2)
    late = p['t0'] > Q['green'] + 1.5   # the strands keep reading under the captions: quieter
    if p['split']: put(mallet(CS5 if p['w'] == 0 else GS5, 1.4, 0.8), p['t1'], 0.12 if late else 0.24, pan * 0.6, 0.45)
    else: put(mallet(E5, 1.4, 0.8), p['t1'], 0.24, 0, 0.45)
# the dive and the find: a sonar ping, then the difference — a bell with a beating partner a semitone off
put(whoosh(0.7), Q['dive'], 0.22, 0.3, 0.2)
tt = T(1.8); ping = np.sin(2 * np.pi * 987.77 * tt) * np.exp(-tt * 3) * np.minimum(1, tt / 0.004)
put(ping, Q['gap'], 0.2, 0.4, 0.7)
tt = T(2.2); bell = (np.sin(2 * np.pi * 1318.5 * tt) + 0.6 * np.sin(2 * np.pi * 1396.9 * tt)) * np.exp(-tt * 2.2) * np.minimum(1, tt / 0.003)
put(bell, Q['found'], 0.16, 0.4, 0.6)
# the witness pair lands: the same note, hard left and hard right
put(whoosh(0.9), Q['rise'], 0.12, 0, 0.2)
put(mallet(E5, 1.6, 1.0), Q['cards'], 0.22, -0.8, 0.5); put(mallet(E5, 1.6, 1.0), Q['cards'] + 0.06, 0.22, 0.8, 0.5)
# THE SPLIT (signature): a held unison glides apart into two notes while the whale unzips the line
a, b = Q['split'], Q['ride_end']; L = b - a + 1.4; tt = T(L); g = smooth(0, b - a, tt)
for f1, pan in [(CS5, -0.6), (GS5, 0.6)]:
    f = E5 * (f1 / E5) ** g; ph = 2 * np.pi * np.cumsum(f) / SR
    env = np.minimum(1, tt / 0.15) * np.exp(-np.maximum(0, tt - (b - a)) * 2.2)
    put((np.sin(ph) + 0.2 * np.sin(2 * ph)) * env, a, 0.1, pan, 0.6)
put(whoosh(b - a, rev=True), a, 0.1, 0, 0.3)
put(mallet(CS5, 1.8, 1.0), Q['chips'] + 0.3, 0.2, -0.6, 0.5); put(mallet(GS5, 1.8, 1.0), Q['chips'] + 0.3, 0.2, 0.6, 0.5)
# the decision can finally tell them apart: a soft two-tone alert on B
for k, f in enumerate([GS5, E5, GS5]): put(mallet(f, 0.7, 1.2), Q['alert'] + k * B / 2, 0.16, 0.55, 0.3)
put(tick(2000, 0.04), Q['turn'], 0.1, 0.2, 0.1)
# green: world A changes (a small swirl), its reading lands on the same note as before, plus a confirm tick
put(whoosh(0.6), Q['green'], 0.1, -0.5, 0.3); put(tick(3200, 0.05), Q['green_tick'] + 0.05, 0.2, -0.5, 0.3)
# harmony: one held E (one reading) that opens into A-major-7 once the line has split; a breath out for the caption
pad = np.zeros(N); one = 1 - smooth(Q['split'], Q['ride_end'] + 0.5, t)
for f, gg in [(164.81, 1.0), (329.63, 0.5)]: pad += gg * np.sin(2 * np.pi * f * t)
pad *= one * 0.6
for f, gg in [(110, 0.9), (220, 0.6), (277.18, 0.5), (329.63, 0.5), (415.3, 0.35)]: pad += (1 - one) * gg * np.sin(2 * np.pi * f * (1 + 0.0015 * np.sin(2 * np.pi * 0.11 * t + f)) * t)
pad *= 0.045 * smooth(Q['decision'] - 1, Q['decision'] + 1, t) * (1 - 0.4 * smooth(Q['notthis'], Q['notthis'] + 0.6, t) + 0.4 * smooth(Q['end'] - 0.3, Q['end'] + 1.2, t)) * (1 - smooth(D - 1.2, D, t))
BUS[:, 0] += lp(pad, 2200); BUS[:, 1] += lp(pad, 2200); SEND += pad * 0.4
# close: end chord on the belief, a small arpeggio on the lockup
for i, f in enumerate([A4, CS5, E5, GS5]): put(mallet(f, 2.6, 0.7), Q['end'] + i * 0.11, 0.2, -0.3 + 0.2 * i, 0.6)
for i, f in enumerate([1108.73, 1318.5, 1661.2]): put(mallet(f, 1.6, 0.4), Q['lockup'] + i * B / 2, 0.09, 0.2, 0.6)
ir_t = T(1.7); ir = [lp(rng.standard_normal(len(ir_t)), 5000) * np.exp(-ir_t * 3.3) for _ in range(2)]; ir = [x / np.sqrt((x ** 2).sum()) for x in ir]
wet = np.stack([fftconvolve(SEND, ir[0])[:N], fftconvolve(SEND, ir[1])[:N]], 1)
out = BUS + 0.3 * wet; out *= (smooth(0, 0.05, t) * (1 - smooth(D - 0.4, D, t)))[:, None]; out /= np.abs(out).max() / 0.8
wavfile.write(OUT, SR, (out * 32767).astype(np.int16)); print('score ok')
