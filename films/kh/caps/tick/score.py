"""CETI Capabilities 06 · tick — score. 128 BPM. Every sound sits on a cue the picture exports (cues.json).
Signature: a dry pen tick (two clicks, like a pencil mark) for each finished step, then ONE bright coin chime when the refund lands.
Problem motif: the coin chime doubled and slightly out of time (the retry pays again). A crash is a dry snap and a low thud.
The skip is a soft whoosh with the ticks read back quietly. The limit's chime hangs unresolved; the payoff resolves to one chord."""
import json, sys, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, resample_poly, lfilter
from scipy.io import wavfile
Q = json.load(open(sys.argv[1])); OUT = sys.argv[2]
SR = 48000; D = Q['dur']; N = int(D * SR); t = np.arange(N) / SR; B = 60 / Q['bpm']
rng = np.random.default_rng(279); BUS = np.zeros((N, 2)); SEND = np.zeros(N)
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
def glass(f, d=2.2, muffle=False):
    tt = T(d); s = sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * k) for m, a, k in [(1, 1, 2.2), (2.76, 0.42, 5.0), (5.4, 0.18, 9.0)]) * np.minimum(1, tt / 0.002)
    return lp(s * np.exp(-tt * 6), 700) * 2.2 if muffle else s
def pentick(t0, s, gain=1.0):                     # signature: a pencil tick, two dry clicks (down-stroke, up-stroke), pitched per step
    f = [1900, 2250, 2700][s]; put(bp(rng.standard_normal(len(T(0.03))), f * 0.7, f * 1.4) * np.exp(-T(0.03) * 120), t0, 0.32 * gain, -0.4 + 0.4 * s, 0.1)
    put(bp(rng.standard_normal(len(T(0.05))), f, f * 2.2) * np.exp(-T(0.05) * 90), t0 + 0.09, 0.26 * gain, -0.4 + 0.4 * s, 0.15)
    put(tick(f * 1.5, 0.03), t0 + 0.09, 0.07 * gain, -0.4 + 0.4 * s, 0.2)
def chime(t0, gain=1.0, detune=0.0, pan=0.35):     # the coin: a bright bell, two partials of a struck coin
    put(bell(1318.5 * 2 ** (detune / 1200), 1.6), t0, 0.11 * gain, pan, 0.45); put(mallet(2637 * 2 ** (detune / 1200), 0.5, 0.6), t0, 0.05 * gain, pan, 0.3)
def snap(t0):                                     # crash: a dry snap, a low thud, a short scrape back
    put(hp(rng.standard_normal(len(T(0.06))), 1500) * np.exp(-T(0.06) * 70), t0, 0.5, 0.1, 0.15)
    tt = T(0.45); f = 70 + 60 * np.exp(-tt * 18); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9), t0 + 0.01, 0.6, 0)
    put(whoosh(0.9) * np.linspace(1, 0.2, len(T(0.9))), t0 + 0.08, 0.09, -0.4, 0.2)
def thunk(t0):                                     # the jar says ✕
    tt = T(0.4); f = 95 + 40 * np.exp(-tt * 20); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 12), t0, 0.45, 0.4)

# a soft pulse under the move and the payoff only (the felt act has none)
n = 0
while n * B < Q['dur'] - 2.0:
    tb = n * B
    if (Q['strip'] <= tb < Q['notThis']) or tb >= Q['crash'][2] + 1.2:
        if n % 2 == 0: tt = T(0.3); f = 50 + 70 * np.exp(-tt * 30); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9), tb, 0.22)
    n += 1
for w in Q['work']: put(tick(900 + 200 * w['s'], 0.05), w['t'], 0.12, -0.4 + 0.4 * w['s'], 0.1)        # the helper taps the card
for k in Q['tick']: pentick(k['t'], k['s'])
for k in Q['coinOut']: put(whoosh(0.5), k['t'], 0.06, 0.2, 0.15)
for k in Q['coinIn']:
    if k['wrong']: put(mallet(330, 0.8, 0.3), k['t'], 0.12, 0.3, 0.3)          # hits the floor, not the jar: a dull wooden note
    elif k['second']: chime(k['t'] + 0.04, 0.9, -45); chime(k['t'] + 0.11, 0.6, 30)   # problem motif: doubled, out of time
    else: chime(k['t'])
for x in Q['crash']: snap(x)
for x in Q['heal']: put(tick(3000, 0.03), x, 0.06, 0, 0.3)
for i, x in enumerate(Q['read']): pentick(x, i % 2, 0.35)                    # the ticks read back softly
for x in Q['skip']: put(whoosh(0.9), x, 0.1, -0.2, 0.3)
for a in Q['answer']:
    if not a['ok']: thunk(a['t'])
    else:
        for i, f in enumerate([659.25, 987.77, 1318.5]): put(glass(f, 2.6), a['t'] + i * 0.05, 0.1, -0.3 + 0.3 * i, 0.6)
put(tick(4200, 0.03), Q['title'], 0.14, 0, 0.4); put(whoosh(0.7, rev=True), Q['title'] - 0.6, 0.06, 0, 0.3)
put(glass(987.77, 1.2), Q['card'], 0.05, -0.3, 0.5)
pad = np.zeros(N)
for f, g in [(146.83, 1), (220, 0.7), (329.63, 0.55), (440, 0.35), (493.88, 0.25)]: pad += g * np.sin(2 * np.pi * f * (1 + 0.0015 * np.sin(2 * np.pi * 0.11 * t + f)) * t)
pad *= 0.04 * smooth(Q['answer'][3]['t'] - 0.5, Q['answer'][3]['t'] + 1.5, t) * (1 - 0.6 * smooth(D - 1.2, D, t)); pad = lp(pad, 2400); BUS[:, 0] += pad; BUS[:, 1] += pad; SEND += pad * 0.4
put(glass(659.25, 2.4), Q['lockup'], 0.08, 0, 0.7)

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
