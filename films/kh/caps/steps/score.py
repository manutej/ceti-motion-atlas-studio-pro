"""CETI Capabilities 10 · steps — score. 132 BPM. Every sound sits on a cue the picture exports (cues.json).
Signature: five short tuned pings, a pentatonic run (one note per small check, C D E G A). Problem motif: one long note
bending sharp and flat (the wobbly maybe). The split is a paper tear into five. A clear no is a dry knock under a muffled ping.
The card's bars land as pings: dull for the one big question, bright for five small ones, nearly as bright for the plain rule.
Payoff: the run plays all five and resolves as one chord when the real bill reaches the inbox."""
import json, sys, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, resample_poly, lfilter
from scipy.io import wavfile
Q = json.load(open(sys.argv[1])); OUT = sys.argv[2]
SR = 48000; D = Q['dur']; N = int(D * SR); t = np.arange(N) / SR; B = 60 / Q['bpm']
rng = np.random.default_rng(296); BUS = np.zeros((N, 2)); SEND = np.zeros(N)
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
def mallet(f, d=1.4, bright=1.0, detune=0.0):
    tt = T(d); f = f * 2 ** (detune / 1200)
    return (np.sin(2 * np.pi * f * tt) + 0.45 * bright * np.sin(2 * np.pi * 4 * f * tt) * np.exp(-tt * 28)) * np.exp(-tt * 4) * np.minimum(1, tt / 0.002)
def tick(f=2600, d=0.04):
    tt = T(d); return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 140)
def whoosh(d, rev=False):
    tt = T(d); e = (tt / d) ** 2 if rev else np.sin(np.pi * tt / d) ** 2; return bp(rng.standard_normal(len(tt)), 500, 6000) * e
def bell(f, d=2.6):
    tt = T(d); return sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * k) for m, a, k in [(1, 1, 1.6), (2.76, 0.3, 3.5), (0.5, 0.35, 1.2)]) * np.minimum(1, tt / 0.003)

PENTA = [523.25, 587.33, 659.25, 783.99, 880.0]
def glass(f, d=2.0, muffle=False):
    tt = T(d); s = sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * k) for m, a, k in [(1, 1, 2.6), (2.76, 0.38, 6.0), (5.4, 0.15, 10.0)]) * np.minimum(1, tt / 0.002)
    return lp(s * np.exp(-tt * 6), 800) * 2.0 if muffle else s
def knock(t0, g=0.5):
    tt = T(0.35); f = 75 + 55 * np.exp(-tt * 25); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 11), t0, g)
    put(tick(2200, 0.05), t0, 0.2, -0.2, 0.1)
def paper(t0, d=0.16, lo=900, hi=5000, g=0.14, pan=0.0):
    tt = T(d); put(bp(rng.standard_normal(len(tt)), lo, hi) * np.sin(np.pi * tt / d) ** 2, t0, g, pan, 0.2)

# the wobbly maybe: one long note bending sharp and flat under the big lamp, gone by the split
d = Q['mushEnd'] + 0.3 - Q['mush']; tt = T(d)
f = 440 * 2 ** ((38 * np.sin(2 * np.pi * 1.16 * tt) * np.cos(2 * np.pi * 0.46 * tt + 0.7)) / 1200)
env = np.minimum(1, tt / 0.25) * (1 - smooth(Q['veil'] - Q['mush'], Q['veil'] + 0.8 - Q['mush'], tt)) * 0.75 + 0.25 * (1 - smooth(d - 0.6, d, tt)) * np.minimum(1, tt / 0.25)
mush = (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)) * env
put(lp(mush, 2500), Q['mush'], 0.09, 0.15, 0.4)
whooshes = [Q['envIn'], Q['fakeIn']] + [Q['tray'] - 2.6]
for x in whooshes: put(whoosh(0.6), x, 0.08, -0.4, 0.2)
# the title hinge: near-silence, then the title tick
put(tick(4200, 0.03), Q['title'], 0.14, 0, 0.4); put(whoosh(0.7, rev=True), Q['title'] - 0.6, 0.06, 0, 0.3)
# the split: faint fold creases, the whale's nudge, a paper tear into five, five small landings
for k in range(4): paper(Q['folds'] + 0.1 * k, 0.08, 2000, 6000, 0.05, -0.3 + 0.2 * k)
knock(Q['nudge'], 0.25)
for k in range(5): paper(Q['tear'] + 0.045 * k, 0.14, 800 + 300 * k, 5000, 0.13, -0.6 + 0.3 * k)
for k, x in enumerate(Q['land']): put(tick(2600 + 200 * k, 0.04), x, 0.1, -0.6 + 0.3 * k, 0.2)
# a pulse from the split to the belief, one soft kick every two beats
n = 0
while n * B < Q['belief']:
    tb = n * B
    if tb >= Q['tear'] and n % 2 == 0:
        tt = T(0.3); fk = 50 + 70 * np.exp(-tt * 30); put(np.sin(2 * np.pi * np.cumsum(fk) / SR) * np.exp(-tt * 9), tb, 0.26)
    n += 1
# the checks: a clear yes is that gate's ping; a clear no is a dry knock under its ping, muffled
for e in Q['check']:
    pan = -0.6 + 0.3 * e['g']
    if e['ok']: put(glass(PENTA[e['g']], 1.6), e['t'], 0.18, pan, 0.45)
    else: put(glass(PENTA[e['g']], 0.9, True), e['t'], 0.3, pan, 0.2); knock(e['t'], 0.55)
paper(Q['held'], 0.3, 300, 2000, 0.1, 0.0); put(tick(2800, 0.03), Q['reset'], 0.06, 0, 0.2)
# the card: bars land as pings. Dull for one big question, bright for five small ones, the plain rule nearly as bright
put(whoosh(0.5, rev=True), Q['card'] - 0.4, 0.05, 0.3, 0.3)
put(glass(523.25, 1.4, True), Q['bars'][0], 0.22, -0.2, 0.3)
for i, fq in enumerate(PENTA): put(glass(fq, 1.6), Q['bars'][1] - 0.2 + 0.04 * i, 0.07, -0.4 + 0.2 * i, 0.5)
put(glass(783.99, 1.8), Q['bars'][2], 0.13, 0.3, 0.5)
# payoff: the full run, then one chord as the real bill reaches the inbox
for e in Q['pay']: put(glass(PENTA[e['g']], 2.0), e['t'], 0.18, -0.6 + 0.3 * e['g'], 0.5)
for i, fq in enumerate(PENTA): put(glass(fq / 2, 2.8), Q['tick'] + 0.03 * i, 0.1, -0.4 + 0.2 * i, 0.6)
put(lp(rng.standard_normal(len(T(0.08))), 2500) * np.exp(-T(0.08) * 50), Q['tray'], 0.25, 0.4, 0.1)
put(glass(1318.5, 2.4), Q['tick'] + 0.08, 0.06, 0.3, 0.7)
pad = np.zeros(N)
for fq, g in [(130.81, 1), (196.0, 0.7), (261.63, 0.6), (329.63, 0.45), (440.0, 0.3)]: pad += g * np.sin(2 * np.pi * fq * (1 + 0.0015 * np.sin(2 * np.pi * 0.11 * t + fq)) * t)
pad *= 0.045 * smooth(Q['tick'], Q['tick'] + 2.0, t) * (1 - 0.6 * smooth(D - 1.2, D, t)); pad = lp(pad, 2400); BUS[:, 0] += pad; BUS[:, 1] += pad; SEND += pad * 0.4
put(glass(523.25, 2.4), Q['lockup'], 0.08, 0, 0.7)

# reverb send, fades, then loudness: BS.1770-style K-weighted, gated integrated level → −16 LUFS, true peak ≤ −1 dBTP
ir_t = T(1.6); ir = [lp(rng.standard_normal(len(ir_t)), 5000) * np.exp(-ir_t * 3.4) for _ in range(2)]; ir = [x / np.sqrt((x ** 2).sum()) for x in ir]
out = BUS + 0.3 * np.stack([fftconvolve(SEND, ir[0])[:N], fftconvolve(SEND, ir[1])[:N]], 1)
out *= (smooth(0, 0.05, t) * (1 - smooth(D - 0.4, D, t)))[:, None]
def kweight(x):
    # pre-filter (high shelf) + RLB high-pass, coefficients for 48 kHz from ITU-R BS.1770
    x = lfilter([1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585], x)
    return lfilter([1.0, -2.0, 1.0], [1, -1.99004745483398, 0.99007225036621], x)
def lufs(y):
    k = np.stack([kweight(y[:, 0]), kweight(y[:, 1])], 1); blk, hop = int(0.4 * SR), int(0.1 * SR)
    ms = np.array([(k[i:i + blk] ** 2).mean(0).sum() for i in range(0, len(k) - blk, hop)]); L = -0.691 + 10 * np.log10(ms + 1e-12)
    g = ms[L > -70]; rel = -0.691 + 10 * np.log10(g.mean()) - 10; g = ms[(L > -70) & (L > rel)]; return -0.691 + 10 * np.log10(g.mean())
out *= 10 ** ((-16 - lufs(out)) / 20)
tp = max(np.abs(resample_poly(out[:, c], 4, 1)).max() for c in range(2)); lim = 10 ** (-1.2 / 20)
if tp > lim:   # soft-knee limit only the peaks above −1.2 dBTP
    a = np.abs(out); over = a > lim * 0.8; out[over] = np.sign(out[over]) * (lim * 0.8 + (lim * 0.2) * np.tanh((a[over] - lim * 0.8) / (lim * 0.2)))
print(f'loudness {lufs(out):.1f} LUFS, true peak {20 * np.log10(max(np.abs(resample_poly(out[:, c], 4, 1)).max() for c in range(2))):.1f} dBTP')
wavfile.write(OUT, SR, (clamp(out, -1, 1) * 32767).astype(np.int16)); print('score ok')
