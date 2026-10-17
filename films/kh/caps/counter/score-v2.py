"""CETI Capabilities 07 · counter — score. 128 BPM. Every sound sits on a cue the picture exports (cues.json).
Signature: a three-note figure that loses one note per round (3 → 2 → 1) until a single held tone when the counter reads 0.
Problem motif (FELT): the same figure, detuned, looping on every pop-up and never landing. A red-pen mark is a quick paper
scritch plus a small chime that climbs with the count; a fix is a soft smoothing swipe. The limit's tone is left unresolved;
the new reader's clean second look lands the figure on the held tone."""
import json, sys, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, resample_poly, lfilter
from scipy.io import wavfile
Q = json.load(open(sys.argv[1])); OUT = sys.argv[2]
SR = 48000; D = Q['dur']; N = int(D * SR); t = np.arange(N) / SR; B = 60 / Q['bpm']
rng = np.random.default_rng(84); BUS = np.zeros((N, 2)); SEND = np.zeros(N)
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

FIG = [523.25, 659.25, 783.99]                     # C5 E5 G5: the round figure; it loses its top note each round
def glass(f, d=2.2):
    tt = T(d); return sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * k) for m, a, k in [(1, 1, 2.2), (2.76, 0.42, 5.0), (5.4, 0.18, 9.0)]) * np.minimum(1, tt / 0.002)
def figure(t0, n, detune=0.0, gain=1.0):
    for i in range(n): put(mallet(FIG[i] * 2 ** (detune * (i - 1) / 1200), 1.1, 0.8), t0 + i * B / 2, 0.16 * gain, -0.3 + 0.3 * i, 0.4)
def scritch(t0):                                   # red pen circling: a short band of paper noise with a rising sweep
    tt = T(0.26); n = bp(rng.standard_normal(len(tt)), 2200, 7000) * np.sin(np.pi * tt / 0.26) ** 1.5 * (0.6 + 0.4 * np.sin(2 * np.pi * 26 * tt)); put(n, t0, 0.07, 0.25, 0.1)
def swipe(t0, gain=1.0):                           # smoothing a rough bit: a soft falling whoosh + a low pluck
    put(whoosh(0.32), t0 - 0.08, 0.07 * gain, -0.1, 0.2)
    tt = T(0.35); f = 160 + 60 * np.exp(-tt * 18); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 10), t0, 0.22 * gain)
def tone(t0, d, f=392.0, gain=1.0, resolve=True):  # the single held tone (G4); unresolved = a fourth above, no landing
    tt = T(d); e = np.minimum(1, tt / 0.25) * np.minimum(1, (d - tt) / 0.6)
    s = sum(a * np.sin(2 * np.pi * f * m * tt) for m, a in [(1, 1), (2, 0.25), (3, 0.08)]) * e; put(lp(s, 3000), t0, 0.09 * gain, 0, 0.5)

# FELT: no pulse. Every pop-up plays the sour, detuned figure; every fix is a swipe
for x in Q['pop']: figure(x, 3, detune=35, gain=0.9)
for x in Q['fixFelt']: swipe(x)
put(tick(4200, 0.03), Q['title'], 0.14, 0, 0.4); put(whoosh(0.7, rev=True), Q['title'] - 0.6, 0.06, 0, 0.3)
put(glass(783.99, 1.6), Q['counterIn'], 0.06, 0.4, 0.5)
# a soft pulse under the rounds (beats from round 1 to the card)
n = 0
while n * B < Q['card']:
    tb = n * B
    if tb >= Q['lap'][0] - 0.01 and n % 2 == 0:
        tt = T(0.3); f = 50 + 70 * np.exp(-tt * 30); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9), tb, 0.24)
    n += 1
# each round opens with the figure, one note shorter each time (3, 2, 1)
for r, L in enumerate(Q['lap']): figure(L - 0.05, 3 - r)
for m in Q['mark']: scritch(m['t']); put(glass(FIG[0] * 2 ** ((m['n'] - 1) * 2 / 12) * 2, 1.4), m['t'] + 0.12, 0.08, 0.35, 0.45); put(tick(2600, 0.04), m['t'] + 0.14, 0.1, 0.5)
for x in Q['fix']: swipe(x, 0.9)
for x in Q['popNew']: figure(x, 1, detune=35, gain=0.6)
# zero: the single held tone, resolved; the whale's spark is a high glass ping
tone(Q['zero'], 2.6); put(glass(1567.98, 2.4), Q['zero'] + 0.05, 0.06, 0.2, 0.7)
for j, x in enumerate(Q['cardNums']): put(mallet(FIG[0] * (1, 1, 0.89, 0.75)[j], 0.9, 0.6), x, 0.1, -0.2 + 0.15 * j, 0.3)
# limit: the same readers sweep again and pass the last line by; the tone a fourth up, left hanging
for j in range(3): put(whoosh(0.5), Q['limitLap'] + 0.35 + j * 0.2, 0.05, -0.3 + 0.3 * j, 0.2)
tone(Q['blind'], 1.8, f=523.25, gain=0.8)
# the new kind of reader: a lower voice (an octave down), its mark, your fix, its second look finds nothing: the figure lands
put(whoosh(0.7), Q['newReader'] + 0.2, 0.08, -0.4, 0.2)
scritch(Q['newMark']); put(glass(FIG[0], 1.6), Q['newMark'] + 0.12, 0.1, 0.2, 0.5)
put(tick(2400, 0.04), Q['newTurn'], 0.08, 0.3, 0.2)
figure(Q['clear'], 1); tone(Q['clear'] + 0.15, 3.4); put(glass(1567.98, 2.4), Q['clear'] + 0.05, 0.06, 0.2, 0.7)
put(whoosh(0.5), Q['spout'], 0.06, 0.2, 0.3)
pad = np.zeros(N)
for f, g in [(130.81, 1), (196, 0.7), (261.63, 0.6), (329.63, 0.45), (392, 0.3)]: pad += g * np.sin(2 * np.pi * f * (1 + 0.0015 * np.sin(2 * np.pi * 0.11 * t + f)) * t)
pad *= 0.04 * smooth(Q['clear'], Q['clear'] + 2.0, t) * (1 - 0.6 * smooth(D - 1.2, D, t)); pad = lp(pad, 2400); BUS[:, 0] += pad; BUS[:, 1] += pad; SEND += pad * 0.4
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
