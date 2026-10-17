"""CETI Capabilities 08 · fresh — score. 124 BPM. Every sound sits on a cue the picture exports (cues.json).
Signature: a woodblock knock followed by a dry tick = a complaint that points at the problem (evidence).
Problem motif: the same knock with no tick, decaying into nothing (the customer's ✕; the vague "feels off").
A poke that bounces off a good page is a soft knock; a re-check that holds is the knock plus a warm mallet.
The fixer sets the page with a soft paper tone; the strike is a pencil scratch; the limit's three agreeing ✓ are
one slightly sour chord, left unresolved; the final held poke resolves it."""
import json, sys, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, resample_poly, lfilter
from scipy.io import wavfile
Q = json.load(open(sys.argv[1])); OUT = sys.argv[2]
SR = 48000; D = Q['dur']; N = int(D * SR); t = np.arange(N) / SR; B = 60 / Q['bpm']
rng = np.random.default_rng(166); BUS = np.zeros((N, 2)); SEND = np.zeros(N)
def clamp(x, a=0.0, b=1.0): return np.minimum(b, np.maximum(a, x))
def smooth(a, b, x): k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
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
def wood(f=740, d=0.25, decay=38):           # woodblock: two inharmonic partials, fast decay, a little click
    tt = T(d); s = (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 2.57 * tt)) * np.exp(-tt * decay)
    return s + 0.3 * bp(rng.standard_normal(len(tt)), 2000, 7000) * np.exp(-tt * 400)
def evidence(t0, pan=0.0):                   # signature: knock + dry tick
    put(wood(), t0, 0.42, pan, 0.25); put(tick(3600, 0.03), t0 + 0.09, 0.22, pan, 0.15)
def no_evidence(t0, pan=0.0, gain=1.0):      # problem motif: knock, no tick, decaying into nothing
    put(wood(620, 0.9, 6), t0, 0.32 * gain, pan, 0.5)
    tt = T(0.5); f = 85 + 30 * np.exp(-tt * 18); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9), t0, 0.35 * gain, pan)
def soft_knock(t0, pan=0.0): put(lp(wood(560, 0.2, 50), 2500), t0, 0.28, pan, 0.1)
def paper(t0, d=0.22, gain=0.14, pan=0.0):
    tt = T(d); put(bp(rng.standard_normal(len(tt)), 1200, 5000) * np.sin(np.pi * tt / d) ** 2, t0, gain, pan, 0.2)
PANX = lambda x: float(np.clip(x / 900, -0.8, 0.8))

# FELT: your two sweeps are soft paper glides; the ghost page is a faint high shimmer; your own ✓ is a small bright tick
for g in Q['gaze']: paper(g, 0.7, 0.07, -0.2)
for g in Q['ghost']: put(mallet(1568, 1.2, 0.3), g, 0.04, 0.0, 0.8)
put(tick(3000, 0.04), Q['selfTick'], 0.16, -0.4, 0.2); put(mallet(784, 0.8, 0.4), Q['selfTick'], 0.06, -0.4, 0.4)
put(whoosh(0.5), Q['custIn'], 0.08, 0.6, 0.2)
no_evidence(Q['custX'], 0.6, 1.1)
# hinge: near-silence, then the title tick
put(whoosh(0.7, rev=True), Q['title'] - 0.6, 0.05, 0, 0.3); put(tick(4200, 0.03), Q['title'], 0.14, 0, 0.4)
# a soft pulse from the fresh eyes' arrival until the limit (on the beat grid, every other beat)
n = 0
while n * B < Q['alike']:
    tb = n * B
    if tb >= Q['podsIn'][0] - 0.01 and n % 2 == 0:
        tt = T(0.3); f = 52 + 60 * np.exp(-tt * 30); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9), tb, 0.22)
    n += 1
for x in Q['podsIn']: put(tick(1900, 0.04), x, 0.1, 0.2)
# the pokes
for k in Q['pokes']:
    if k['says'] in ('missing', 'order'): evidence(k['t'], -0.1)
    elif k['holds']:
        soft_knock(k['t']); put(mallet(523.25 if not k['final'] else 392, 1.6 if not k['final'] else 2.6, 0.6), k['t'] + 0.02, 0.1 if not k['final'] else 0.16, 0.1, 0.5)
    else: soft_knock(k['t'], 0.3)
for i, x in enumerate(Q['claim']):
    if i == 1: no_evidence(x, 0.5, 0.8)                     # "feels off": a knock with nothing behind it
    else: put(tick(2400, 0.04), x, 0.12, 0, 0.2)
# the strike: a pencil scratch
tt = T(0.28); put(bp(rng.standard_normal(len(tt)), 2500, 8000) * np.sin(np.pi * tt / 0.28) ** 1.5, Q['strike'], 0.16, 0.5, 0.1)
# someone else sets the missing page: a soft paper tone, rising
put(whoosh(0.5), Q['fixIn'], 0.08, 0, 0.2); paper(Q['set'] - 0.05, 0.18, 0.16)
tt = T(1.6); put(np.sin(2 * np.pi * 659.25 * tt) * np.exp(-tt * 2.2) * np.minimum(1, tt / 0.01), Q['set'], 0.1, 0, 0.6)
put(mallet(987.77, 1.4, 0.4), Q['set'] + 0.12, 0.06, 0.1, 0.6)
put(tick(3300, 0.03), Q['card'], 0.1, 0.3, 0.3)
# the limit: the helpers turn alike (a low falling glide); three ✓ in one slightly sour chord, unresolved
tt = T(0.6); put(np.sin(2 * np.pi * np.cumsum(330 - 90 * tt / 0.6) / SR) * np.sin(np.pi * tt / 0.6) ** 2, Q['alike'], 0.07, 0, 0.5)
for i, f in enumerate([523.25, 659.25 * 2 ** (-35 / 1200), 783.99]): put(mallet(f, 2.2, 0.5), Q['agree'] + 0.02 * i, 0.07, -0.3 + 0.3 * i, 0.6)
# the payoff: the pages swap (two paper slides); the final held poke resolves to a warm chord + pad
for i, x in enumerate(Q['swap']): paper(x, 0.25, 0.12, -0.3 + 0.6 * i)
for i, f in enumerate([196, 293.66, 392, 493.88]): put(mallet(f, 3.0, 0.3), Q['final'] + 0.06 + 0.04 * i, 0.07, -0.3 + 0.2 * i, 0.7)
pad = np.zeros(N)
for f, g in [(98, 1), (146.83, 0.7), (196, 0.6), (246.94, 0.45), (293.66, 0.3)]: pad += g * np.sin(2 * np.pi * f * (1 + 0.0015 * np.sin(2 * np.pi * 0.11 * t + f)) * t)
pad *= 0.04 * smooth(Q['final'], Q['final'] + 1.5, t) * (1 - 0.6 * smooth(D - 1.2, D, t)); pad = lp(pad, 2400); BUS[:, 0] += pad; BUS[:, 1] += pad; SEND += pad * 0.4
put(mallet(587.33, 2.4, 0.3), Q['lockup'], 0.06, 0, 0.7)

# reverb send, fades, loudness: BS.1770-style K-weighted, gated integrated level → −16 LUFS, true peak ≤ −1 dBTP
ir_t = T(1.6); ir = [lp(rng.standard_normal(len(ir_t)), 5000) * np.exp(-ir_t * 3.4) for _ in range(2)]; ir = [x / np.sqrt((x ** 2).sum()) for x in ir]
out = BUS + 0.3 * np.stack([fftconvolve(SEND, ir[0])[:N], fftconvolve(SEND, ir[1])[:N]], 1)
out *= (smooth(0, 0.05, t) * (1 - smooth(D - 0.4, D, t)))[:, None]
def kweight(x):
    x = lfilter([1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585], x)
    return lfilter([1.0, -2.0, 1.0], [1, -1.99004745483398, 0.99007225036621], x)
def lufs(y):
    k = np.stack([kweight(y[:, 0]), kweight(y[:, 1])], 1); blk, hop = int(0.4 * SR), int(0.1 * SR)
    ms = np.array([(k[i:i + blk] ** 2).mean(0).sum() for i in range(0, len(k) - blk, hop)]); L = -0.691 + 10 * np.log10(ms + 1e-12)
    g = ms[L > -70]; rel = -0.691 + 10 * np.log10(g.mean()) - 10; g = ms[(L > -70) & (L > rel)]; return -0.691 + 10 * np.log10(g.mean())
out *= 10 ** ((-16 - lufs(out)) / 20)
tp = max(np.abs(resample_poly(out[:, c], 4, 1)).max() for c in range(2)); lim = 10 ** (-1.2 / 20)
if tp > lim:
    a = np.abs(out); over = a > lim * 0.8; out[over] = np.sign(out[over]) * (lim * 0.8 + (lim * 0.2) * np.tanh((a[over] - lim * 0.8) / (lim * 0.2)))
print(f'loudness {lufs(out):.1f} LUFS, true peak {20 * np.log10(max(np.abs(resample_poly(out[:, c], 4, 1)).max() for c in range(2))):.1f} dBTP')
wavfile.write(OUT, SR, (clamp(out, -1, 1) * 32767).astype(np.int16)); print('score ok')
