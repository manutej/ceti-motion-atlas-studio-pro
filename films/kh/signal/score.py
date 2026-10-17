"""Signal — score. 120 BPM. Every hit is placed from cues.json, exported by the film itself."""
import json, os, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000; D = 30.0; N = int(D * SR); t = np.arange(N) / SR
Q = json.load(open(os.path.join(os.path.dirname(__file__), 'cues.json')))
rng = np.random.default_rng(12)
B = 60 / Q['bpm']
DRUM = np.zeros((N, 2)); MUS = np.zeros((N, 2)); FX = np.zeros((N, 2)); SEND = np.zeros(N)

def clamp(x, a=0.0, b=1.0): return np.minimum(b, np.maximum(a, x))
def smooth(a, b, x): k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def put(bus, sig, start, gain=1.0, pan=0.0, send=0.0):
    i0 = int(round(start * SR));
    if i0 >= N or i0 + len(sig) <= 0: return
    s0 = max(0, -i0); i0 = max(0, i0); i1 = min(N, i0 + len(sig) - s0); s = sig[s0:s0 + i1 - i0] * gain
    bus[i0:i1, 0] += s * np.sqrt(0.5 * (1 - pan)); bus[i0:i1, 1] += s * np.sqrt(0.5 * (1 + pan))
    if send: SEND[i0:i1] += s * send
def env_t(d): return np.arange(int(d * SR)) / SR

# --- instruments ---
def kick():
    tt = env_t(0.45); f = 48 + 110 * np.exp(-tt * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-tt * 7.5) + 0.25 * lp(rng.standard_normal(len(tt)), 3000) * np.exp(-tt * 90)
def clap():
    tt = env_t(0.3); n = bp(rng.standard_normal(len(tt)), 900, 5000)
    e = sum(np.exp(-np.maximum(0, tt - d) * 60) * (tt >= d) for d in (0, 0.011, 0.023)) + 0.6 * np.exp(-tt * 14)
    return n * e * 0.55
def hat(open_=False):
    tt = env_t(0.25 if open_ else 0.06); return hp(rng.standard_normal(len(tt)), 7000) * np.exp(-tt * (12 if open_ else 70)) * 0.35
def tick():
    tt = env_t(0.05); return np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 120)
def bass(f, d):
    tt = env_t(d); ph = 2 * np.pi * f * tt
    saw = 2 * ((f * tt) % 1) - 1; s = 0.6 * saw + 0.5 * np.sin(ph)
    return lp(s, 900) * np.minimum(1, tt / 0.005) * np.exp(-tt * 5)
def pluck(f, d=1.2, bright=1.0):
    tt = env_t(d); s = np.sin(2 * np.pi * f * tt) + 0.35 * bright * np.sin(4 * np.pi * f * tt) * np.exp(-tt * 8) + 0.12 * bright * np.sin(6 * np.pi * f * tt) * np.exp(-tt * 12)
    return s * np.exp(-tt * 3.2) * np.minimum(1, tt / 0.004)
def whoosh(d=0.35, rev=False):
    tt = env_t(d); e = (tt / d) ** 2 if rev else np.exp(-tt * 9) * np.minimum(1, tt / 0.03)
    return bp(rng.standard_normal(len(tt)), 400, 6000) * e

# --- cold open: metronome ticks on the beat, a reverse swell into the title ---
for n in range(0, 8): put(FX, tick(), n * B, 0.22 if n % 4 else 0.32, 0.0, 0.2)
put(FX, whoosh(0.45, rev=True), Q['title'] - 0.45, 0.35, 0, 0.2)
tt = env_t(1.4); put(FX, (np.sin(2 * np.pi * 55 * tt * (1 - 0.15 * tt)) * np.exp(-tt * 4)), Q['title'], 0.7, 0, 0.3)

# --- the feed: four-on-the-floor, claps, hats, a nervous bass; thins out through the filter ---
for n in range(8, 36):
    tb = n * B
    if tb >= 16 and n % 2: continue
    if tb >= 20: break
    put(DRUM, kick(), tb, 0.9 if tb < 12 else 0.7)
    if 8 <= n < 28 and n % 2 == 1: put(DRUM, clap(), tb, 0.55, 0.05, 0.15)
for k in range(12 * 2, 28 * 2):
    tb = k * B / 2
    if k % 2: put(DRUM, hat(), tb, 0.5, 0.35)
    if 20 * 2 <= k < 24 * 2: put(DRUM, hat(), tb + B / 4, 0.35, -0.35)
put(DRUM, hat(True), 11.5, 0.5, 0.2, 0.3)
RIFF = [55, 55, 65.41, 55, 49, 55, 73.42, 65.41]
for k in range(8 * 2, 24 * 2):
    tb = k * B / 2; put(MUS, bass(RIFF[k % 8], B / 2), tb, 0.38)
for t0 in Q['whips']: put(FX, whoosh(0.32), t0 - 0.04, 0.45, 0.6 if t0 > 5 else -0.6, 0.2)
for t0 in Q['lanes']: put(FX, whoosh(0.18), t0, 0.18, 0.7, 0.05)
for p in Q['pills']:
    if p['t'] < 12: tt = env_t(0.07); put(FX, np.sin(2 * np.pi * (1800 + 400 * (p['keep'] >= 0)) * tt) * np.exp(-tt * 60), p['t'], 0.12, rng.uniform(-0.6, 0.6), 0.1)

# the filter: the drum bus is progressively low-passed from 12 s to 17 s ("everything goes underwater")
k = smooth(12.0, 17.0, t)[:, None]
DRUM = DRUM * (1 - k) + np.stack([lp(DRUM[:, 0], 380, 4), lp(DRUM[:, 1], 380, 4)], 1) * k
# sweep: a soft sonar tone once per revolution
for t0 in (13.0, 15.0): tt = env_t(1.6); put(FX, np.sin(2 * np.pi * 880 * tt) * np.exp(-tt * 2.5) * np.minimum(1, tt / 0.01), t0, 0.12, 0, 0.8)
# every dropped item: a short falling tick; every kept item: a clear glaucous bell
for td in Q['drops']: tt = env_t(0.09); f = 1400 * np.exp(-tt * 9); put(FX, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 40), td, 0.05, rng.uniform(-0.7, 0.7), 0.15)
KEEPF = [659.25, 739.99, 880.0, 987.77, 1108.73]
for i, td in enumerate(sorted(Q['keeps'])): put(MUS, pluck(KEEPF[i], 1.8, 1.2), td, 0.22, 0.25 * (i - 2) / 2, 0.6)
# the line: each kept point lands on a rising pentatonic note
LANDF = [440.0, 493.88, 554.37, 659.25, 739.99]
for i, tl in enumerate(Q['lands']): put(MUS, pluck(LANDF[i], 2.2, 0.8), tl + 0.1, 0.26, -0.3 + 0.15 * i, 0.5)

# --- signal: drums gone, pad and one sine tone; the strike is a soft paper scratch ---
pad = np.zeros(N)
for f, g in [(220, 1.0), (277.18, 0.6), (329.63, 0.8), (493.88, 0.4), (440, 0.45)]:
    pad += g * np.sin(2 * np.pi * f * (1 + 0.0015 * np.sin(2 * np.pi * 0.13 * t + f)) * t)
pad *= 0.05 * smooth(19.5, 25, t) * (1 - 0.4 * smooth(29.2, 30, t))
MUS[:, 0] += lp(pad, 2400); MUS[:, 1] += lp(pad, 2400); SEND += pad * 0.4
sig = np.sin(2 * np.pi * 440 * t + 0.6 * np.sin(2 * np.pi * 0.3 * t)) * 0.06 * smooth(24.0, 25.5, t) * (1 - smooth(29.0, 30, t))
MUS[:, 0] += sig; MUS[:, 1] += sig
for i, tw in enumerate(Q['words']): put(MUS, pluck([329.63, 440][i], 2.4, 0.5), tw, 0.2, 0, 0.6)
tt = env_t(3.5); bell = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a, d in [(880, 1, 1.3), (880 * 2.76, 0.3, 3), (440, 0.4, 1)])
put(MUS, bell * np.minimum(1, tt / 0.003), Q['end'], 0.12, 0, 0.6)
tt = env_t(0.45); put(FX, bp(rng.standard_normal(len(tt)), 2000, 8000) * np.sin(np.pi * tt / 0.45) ** 2, Q['strike'], 0.12, 0.1, 0.1)

# --- mix + room ---
ir_t = env_t(1.8); ir = [lp(rng.standard_normal(len(ir_t)), 4000) * np.exp(-ir_t * 3.2) for _ in range(2)]; ir = [x / np.sqrt((x ** 2).sum()) for x in ir]
wet = np.stack([fftconvolve(SEND, ir[0])[:N], fftconvolve(SEND, ir[1])[:N]], 1)
out = DRUM + MUS + FX + 0.3 * wet
out *= (smooth(0, 0.05, t) * (1 - smooth(29.6, 30, t)))[:, None]
out /= np.abs(out).max() / 0.8
wavfile.write(os.environ.get('OUT', os.path.join(os.path.dirname(__file__), 'score.wav')), SR, (out * 32767).astype(np.int16))
print('score ok', out.shape)
