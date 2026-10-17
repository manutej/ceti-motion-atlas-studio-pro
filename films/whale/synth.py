import os
"""Little whale — score. Every sound is placed from score.json / cues.json, the same cue list the picture reads."""
import json, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
S = json.load(open('score.json')); C = json.load(open('cues.json'))
D = S['duration']; N = int(D * SR); t = np.arange(N) / SR
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N); SEND = np.zeros(N)

def clamp(x, a=0.0, b=1.0): return np.minimum(b, np.maximum(a, x))
def smooth(a, b, x): k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def add(sig, start, gain=1.0, pan=0.0, send=0.3):
    i0 = int(start * SR); i1 = min(N, i0 + len(sig)); s = sig[:i1 - i0] * gain
    L[i0:i1] += s * np.sqrt(0.5 * (1 - pan)); R[i0:i1] += s * np.sqrt(0.5 * (1 + pan)); SEND[i0:i1] += s * send

light = smooth(37, 45.5, t)          # same transition the picture uses

# 1. the sea: brown noise, slow swells; a brighter wash near the surface
brown = np.cumsum(rng.standard_normal(N)); brown = hp(brown, 20); brown /= np.abs(brown).max()
swell = 0.6 + 0.4 * np.sin(2 * np.pi * t / 7.3) * np.sin(2 * np.pi * t / 11.1)
sea = lp(brown, 260) * swell * (0.5 - 0.25 * smooth(52, 58, t))
wash = bp(rng.standard_normal(N), 900, 3500) * (0.5 + 0.5 * np.sin(2 * np.pi * t / 5.2 - 1)) ** 3 * 0.05 * smooth(43, 48, t) * (1 - 0.5 * smooth(55, 60, t))
add(sea * 0.3 + wash, 0, 1.0, 0, 0.1)
fadein = smooth(0, 2.5, t)

# 2. deep drone (act I-II): A1 + E2 with slow beating, gone by the voice
drone = (np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 82.41 * t + 0.4 * np.sin(2 * np.pi * 0.07 * t))
         + 0.3 * np.sin(2 * np.pi * 55.35 * t)) * 0.075 * fadein * (1 - smooth(31, 40, t))
add(lp(drone, 400), 0, 1.0, 0, 0.2)

# 3. the pad that arrives with the light: A add9, resolving on the end card
pad = np.zeros(N)
for f, g in [(220, 1.0), (277.18, 0.7), (329.63, 0.8), (493.88, 0.45), (440, 0.5)]:
    det = 1 + 0.0015 * np.sin(2 * np.pi * 0.11 * t + f)
    pad += g * (np.sin(2 * np.pi * f * det * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t))
pad *= 0.035 * smooth(31, 41, t) * (0.6 + 0.4 * light) * (1 - 0.35 * smooth(58.5, 60, t))
add(lp(pad, 2500), 0, 1.0, 0, 0.5)

# 4. the whale's song: thin and wobbly at first, richer as the voice settles
def note_env(n, tt):
    a, r = 0.12, 0.3; e = np.zeros_like(tt)
    m = (tt >= n['t']) & (tt < n['t'] + a); e[m] = (tt[m] - n['t']) / a
    m = (tt >= n['t'] + a) & (tt < n['t'] + n['d']); e[m] = 1
    m = (tt >= n['t'] + n['d']) & (tt < n['t'] + n['d'] + r); e[m] = 1 - (tt[m] - n['t'] - n['d']) / r
    return e
warm = lambda x: 1 - (1 - x) ** 2
for n in S['notes']:
    i0 = int(n['t'] * SR); i1 = min(N, int((n['t'] + n['d'] + 0.35) * SR)); tt = t[i0:i1]
    k = warm(clamp((tt - n['t']) / n['d']))
    f = (n['f0'] + (n['f1'] - n['f0']) * k) * (1 + n['wob'] * 0.035 * np.sin(2 * np.pi * 5.2 * tt + np.sin(11 * tt)))
    f *= (1 - 0.025 * n['wob'])                          # early notes sit a little flat: off-key, sung anyway
    ph = 2 * np.pi * np.cumsum(f) / SR
    h = float(smooth(30, 45, np.array([n['t']]))[0])
    voice = np.sin(ph) + h * (0.35 * np.sin(2 * ph) + 0.18 * np.sin(3 * ph) + 0.08 * np.sin(5 * ph))
    voice = voice / (1 + 0.6 * h)
    breath = bp(rng.standard_normal(len(tt)), 600, 2400) * 0.04 * (1 - h)
    sig = (voice + breath) * note_env(n, tt) * n['amp']
    add(lp(sig, 3200), n['t'], 0.3, pan=0.25 * np.tanh((n['t'] - 30) / 10), send=0.55)

# 5. sounding pings (Wada 279 rings on screen)
for s in [x for x in S['sfx'] if x['kind'] == 'ping']:
    tt = np.arange(int(2.4 * SR)) / SR
    ping = np.sin(2 * np.pi * 1318 * (1 - 0.01 * tt) * tt) * np.exp(-tt * 3.2) * clamp(tt / 0.004)
    ping += 0.35 * np.sin(2 * np.pi * 2636 * tt) * np.exp(-tt * 7)
    add(ping, s['t'], 0.34 * s['gain'], pan=0.7, send=0.8)
    add(ping, s['t'] + 0.38, 0.12 * s['gain'], pan=0.9, send=0.9)   # echo off the far wall

# 6. copies: identical dull clicks as the stamps appear (one per column, all the same)
for st in sorted({round(x['pass'], 2) for x in C['stamps']}):
    tt = np.arange(int(0.25 * SR)) / SR
    clk = lp(rng.standard_normal(len(tt)), 900) * np.exp(-tt * 40) + 0.6 * np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 30)
    add(clk, st + 0.08, 0.10, pan=-0.3, send=0.2)

# 7. blooms: each shape gets its own note (pentatonic plucks)
PENT = [440, 493.88, 554.37, 659.25, 739.99, 880, 987.77, 1108.73]
for i, st in enumerate(sorted(C['stamps'], key=lambda x: x['bloom'])):
    f = PENT[(i * 3 + st['k']) % len(PENT)]; tt = np.arange(int(1.6 * SR)) / SR
    pl = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-tt * 6)) * np.exp(-tt * 2.8) * clamp(tt / 0.006)
    add(pl, st['bloom'] + 0.15, 0.045, pan=-0.55 + (i % 4) * 0.1, send=0.6)

# 8. breach: rising whoosh, splash, re-entry
tb = [x for x in S['sfx'] if x['kind'] == 'breach'][0]['t']
tt = np.arange(int(0.6 * SR)) / SR
wh = bp(rng.standard_normal(len(tt)), 300, 2500) * (tt / 0.6) ** 2
add(wh, tb - 0.6, 0.18, pan=0.5, send=0.3)
for t0, g in [(tb, 1.0), (51.05, 0.6)]:
    tt = np.arange(int(1.4 * SR)) / SR
    sp = bp(rng.standard_normal(len(tt)), 700, 7000) * np.exp(-tt * 4.5) * clamp(tt / 0.01)
    thump = np.sin(2 * np.pi * 70 * tt * (1 - 0.3 * tt)) * np.exp(-tt * 9)
    add(sp * 0.22 + thump * 0.25, t0, g, pan=0.6, send=0.4)

# 9. end-card bell
tb = [x for x in S['sfx'] if x['kind'] == 'bell'][0]['t']
tt = np.arange(int(3.5 * SR)) / SR
bell = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a, d in [(880, 1, 1.4), (880 * 2.76, 0.35, 3.0), (880 * 5.4, 0.12, 5.0), (440, 0.4, 1.0)])
add(bell * clamp(tt / 0.003), tb, 0.1, pan=-0.2, send=0.6)


# 10. bubbles (v2): a soft rising "bloop" at each bubble's emission time, pitch set by its size
import os
if os.path.exists('bubbles.json'):
    for b in json.load(open('bubbles.json')):
        tt = np.arange(int(0.18 * SR)) / SR
        f0 = 900 + (6 - b['r']) * 160
        blip = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 2.2 * tt / 0.18)) / SR) * np.exp(-tt * 22) * clamp(tt / 0.004)
        add(blip, b['t'], 0.035, pan=0.3, send=0.5)

# reverb: exponentially decaying stereo noise, darker in the deep
ir_t = np.arange(int(2.2 * SR)) / SR
irL = lp(rng.standard_normal(len(ir_t)), 3000) * np.exp(-ir_t * 2.6); irR = lp(rng.standard_normal(len(ir_t)), 3000) * np.exp(-ir_t * 2.6)
irL /= np.sqrt((irL ** 2).sum()); irR /= np.sqrt((irR ** 2).sum())
wetL = fftconvolve(SEND, irL)[:N]; wetR = fftconvolve(SEND, irR)[:N]
outL = L + 0.35 * wetL; outR = R + 0.35 * wetR
fade = smooth(0, 0.7, t) * (1 - smooth(59.3, 60, t))
mixd = np.stack([outL * fade, outR * fade], 1)
mixd /= np.abs(mixd).max() / 0.7
wavfile.write(os.environ.get('OUT', 'score.wav'), SR, (mixd * 32767).astype(np.int16))
print('score.wav', mixd.shape, 'peak', float(np.abs(mixd).max()))
