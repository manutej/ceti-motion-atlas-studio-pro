"""Whale Line — score generator. Reads the cue sheet the film exports; every sound lands on a drawn event.
usage: python3 score.py cues.json out.wav"""
import json, sys, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

Q = json.load(open(sys.argv[1])); OUT = sys.argv[2]
SR = 48000; D = Q['dur']; N = int(D * SR); t = np.arange(N) / SR; B = 60 / Q['bpm']
rng = np.random.default_rng(5)
BUS = np.zeros((N, 2)); SEND = np.zeros(N)
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

def marimba(f, d=1.2):
    tt = T(d); return (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * 4 * f * tt) * np.exp(-tt * 30) + 0.15 * np.sin(2 * np.pi * 10 * f * tt) * np.exp(-tt * 60)) * np.exp(-tt * 4.5) * np.minimum(1, tt / 0.002)
def pop():
    tt = T(0.09); f = 900 + 1400 * np.exp(-tt * 60); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 45)
def whoosh(d, up=True):
    tt = T(d); n = bp(rng.standard_normal(len(tt)), 500, 5000); e = np.sin(np.pi * tt / d) ** 2
    return n * e * (0.6 + 0.4 * (tt / d if up else 1 - tt / d))
def splash(size=1.0):
    tt = T(0.7); n = bp(rng.standard_normal(len(tt)), 800, 9000) * np.exp(-tt * 9) * np.minimum(1, tt / 0.004)
    drops = np.zeros(len(tt))
    for k in range(int(6 * size)):
        d0 = rng.uniform(0.05, 0.45); f = rng.uniform(900, 2200); i0 = int(d0 * SR); s = T(0.06)
        drops[i0:i0 + len(s)] += np.sin(2 * np.pi * np.cumsum(f * (1 + 2 * s / 0.06)) / SR)[:len(drops) - i0] * np.exp(-s * 70)[:len(drops) - i0]
    return n * 0.6 * size + drops * 0.25
def pen(d=0.7):
    tt = T(d); return hp(rng.standard_normal(len(tt)), 3000) * (np.sin(np.pi * tt / d) ** 2) * 0.5

# --- pulse: soft kick on every beat, shaker on the off-beats, from the first landing until the zoom ---
s0, s1 = Q['lands'][0] - 2 * B, Q['zoom']
n = 0
while s0 + n * B < s1:
    tb = s0 + n * B; tt = T(0.3); f = 50 + 70 * np.exp(-tt * 30)
    put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9), tb, 0.55)
    tt = T(0.08); put(hp(rng.standard_normal(len(tt)), 6000) * np.exp(-tt * 50), tb + B / 2, 0.16, 0.3)
    n += 1
# --- bass walk under the stations (A major pentatonic roots) ---
ROOT = [110, 123.47, 138.59, 164.81, 146.83, 110]
for i, L in enumerate(Q['lands']):
    for k in range(6):
        tt = T(B * 0.9); f = ROOT[i % len(ROOT)] / 2
        put(lp(np.sign(np.sin(2 * np.pi * f * tt)) * 0.5 + np.sin(2 * np.pi * f * tt), 500) * np.exp(-tt * 3) * np.minimum(1, tt / 0.005), L + k * B, 0.16)
# --- the line drawing, the hops, the landings ---
for td in Q['draws']: put(pen(0.65), td, 0.18, 0.4, 0.2)
MEL = [440.0, 493.88, 554.37, 659.25, 739.99, 880.0]
for i, L in enumerate(Q['lands']):
    put(marimba(MEL[i]), L, 0.42, -0.2 + 0.08 * i, 0.4); put(marimba(MEL[i] * 1.5), L + B / 2, 0.16, 0.2, 0.4)
    put(pop(), L + 0.02, 0.2, 0, 0.1)
for te in Q['exits']: put(whoosh(0.55, True), te, 0.3, -0.2, 0.15); put(splash(0.6), te, 0.35, -0.1, 0.2)
for te in Q['entries']: put(splash(1.0), te, 0.45, 0.2, 0.25)
# --- breach, the pull-out, the spout ---
b0, b1 = Q['breach']; put(whoosh(0.9, True), b0 - 0.1, 0.4, 0, 0.2); put(splash(1.6), b0, 0.5, 0, 0.3); put(splash(2.0), b1, 0.6, 0.1, 0.4)
pad = np.zeros(N)
for f, g in [(220, 1), (277.18, 0.6), (329.63, 0.8), (440, 0.5), (554.37, 0.3)]: pad += g * np.sin(2 * np.pi * f * (1 + 0.0015 * np.sin(2 * np.pi * 0.12 * t + f)) * t)
pad *= 0.05 * smooth(Q['zoom'] - 1, Q['zoom'] + 2, t) * (1 - 0.5 * smooth(D - 1, D, t)); BUS[:, 0] += lp(pad, 2500); BUS[:, 1] += lp(pad, 2500); SEND += pad * 0.4
for i, f in enumerate([440, 554.37, 659.25, 880]): put(marimba(f, 2.4), Q['outro'] + i * 0.12, 0.3, -0.3 + 0.2 * i, 0.6)
if Q.get('spout'): tt = T(1.0); put(bp(rng.standard_normal(len(tt)), 300, 3000) * np.exp(-tt * 3) * np.minimum(1, tt / 0.03), Q['spout'], 0.25, 0.3, 0.3)
tt = T(0.6); put(lp(rng.standard_normal(len(tt)), 900) * np.sin(np.pi * tt / 0.6) ** 2, Q['title'], 0.2, 0, 0.2)

ir_t = T(1.6); ir = [lp(rng.standard_normal(len(ir_t)), 5000) * np.exp(-ir_t * 3.5) for _ in range(2)]; ir = [x / np.sqrt((x ** 2).sum()) for x in ir]
wet = np.stack([fftconvolve(SEND, ir[0])[:N], fftconvolve(SEND, ir[1])[:N]], 1)
out = BUS + 0.28 * wet; out *= (smooth(0, 0.05, t) * (1 - smooth(D - 0.4, D, t)))[:, None]; out /= np.abs(out).max() / 0.8
wavfile.write(OUT, SR, (out * 32767).astype(np.int16)); print('score ok')
