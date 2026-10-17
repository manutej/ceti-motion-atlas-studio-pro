"""Composition v2 — score generator (v1 + underline cue for the effect). Reads the cue sheet the film exports; every sound lands on a drawn event.
usage: python3 score.py cues.json out.wav"""
import json, sys, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

Q = json.load(open(sys.argv[1])); OUT = sys.argv[2]
SR = 48000; D = Q['dur']; N = int(D * SR); t = np.arange(N) / SR; B = Q['beat']
rng = np.random.default_rng(7)
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

# A major pentatonic, degree -> Hz (degree 0 = A3)
PENT = [0, 2, 4, 7, 9]
def note(deg, base=220.0): o, k = divmod(deg, 5); return base * 2 ** (o + PENT[k] / 12)
def pluck(f, d=1.0):   # soft marimba-like pluck
    tt = T(d); return (np.sin(2 * np.pi * f * tt) + 0.45 * np.sin(2 * np.pi * 4 * f * tt) * np.exp(-tt * 32) + 0.12 * np.sin(2 * np.pi * 10 * f * tt) * np.exp(-tt * 70)) * np.exp(-tt * 5) * np.minimum(1, tt / 0.002)
def click(f=2600):     # soft snap: short filtered tick + tiny tone
    tt = T(0.08); n = bp(rng.standard_normal(len(tt)), 1500, 6000) * np.exp(-tt * 140)
    return n * 0.7 + np.sin(2 * np.pi * f * tt) * np.exp(-tt * 90) * 0.5
def pop():
    tt = T(0.09); f = 700 + 1100 * np.exp(-tt * 60); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 45)
def whoosh(d, up=True):
    tt = T(d); n = bp(rng.standard_normal(len(tt)), 400, 4500); e = np.sin(np.pi * tt / d) ** 2
    return n * e * (0.6 + 0.4 * (tt / d if up else 1 - tt / d))
def pen(d=0.45): tt = T(d); return hp(rng.standard_normal(len(tt)), 3000) * (np.sin(np.pi * tt / d) ** 2) * 0.5
def no_tone():         # low soft "no": two falling triangle-ish notes, heavily low-passed
    out = np.zeros(int(0.7 * SR))
    for k, (f, d0) in enumerate([(164.81, 0.0), (130.81, 0.16)]):
        tt = T(0.5); s = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt * 6) * np.minimum(1, tt / 0.01)
        i = int(d0 * SR); out[i:i + len(s)] += lp(s, 900)[:len(out) - i]
    return out
def thud():
    tt = T(0.35); f = 45 + 80 * np.exp(-tt * 25); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 10)

# --- pulse: soft kick on the beat, shaker off-beat, from the split to the resolve ---
p0, p1 = Q['pulse']; n = 0
while p0 + n * B < p1 - 1e-6:
    tb = p0 + n * B; put(thud(), tb, 0.32 if n % 2 == 0 else 0.22)
    tt = T(0.06); put(hp(rng.standard_normal(len(tt)), 7000) * np.exp(-tt * 60), tb + B / 2, 0.09, 0.3)
    n += 1
# --- low drone bed under acts 2-5 (A, soft) ---
bed = np.zeros(N)
for f, g in [(55, 1.0), (110, 0.5), (164.81, 0.25)]: bed += g * np.sin(2 * np.pi * f * t)
bed *= 0.05 * smooth(p0 - 0.5, p0 + 1.5, t) * (1 - smooth(p1 - 0.5, p1 + 1.5, t)); BUS[:, 0] += lp(bed, 400); BUS[:, 1] += lp(bed, 400)

put(thud(), Q['box'], 0.45)
for ta in Q['arrows']: put(pen(), ta, 0.18, 0.3, 0.2)
for tp in Q['pops']: put(pop(), tp, 0.22, 0.1, 0.15)
put(thud(), Q['absorb'], 0.3); put(pluck(note(0), 0.8), Q['absorb'], 0.12)
for tc in Q['cracks']: put(click(1800), tc, 0.35, 0.1, 0.2)
put(whoosh(0.5), Q['split'] - 0.05, 0.25, 0, 0.2); put(pluck(note(3), 1.2), Q['split'], 0.3, 0, 0.4)
for i, tl in enumerate(Q['labels']): put(pluck(note(5 + i), 0.8), tl, 0.16, -0.3 + 0.3 * i, 0.4)
put(pluck(note(12), 1.6), Q['spark'], 0.22, -0.3, 0.6); put(pluck(note(14), 1.6), Q['spark'] + B / 2, 0.12, -0.2, 0.6)
for i, tj in enumerate(Q['joints']): put(click(3200), tj, 0.16, -0.3 + 0.3 * i, 0.1)
put(no_tone(), Q['reject'], 0.55, -0.2, 0.25)
put(whoosh(0.6, False), Q['fall'], 0.2, -0.3, 0.2)
put(pen(0.45), Q['line'], 0.2, 0, 0.2)
for i, ts in enumerate(Q['snaps']): put(click(), ts, 0.45, 0.0, 0.25); put(pluck(note(7 + i), 0.9), ts, 0.16, 0.1, 0.35)
put(pop(), Q['pod'], 0.18, -0.3, 0.2)
for s in Q['steps']: put(pluck(note(s['deg'] + 5)), s['t'], 0.38, 0.1, 0.4); put(pluck(note(s['deg'] + 10), 0.6), s['t'], 0.08, 0.2, 0.4)
for o in Q['outs']: put(pluck(note(o['deg'] + 5), 1.4), o['t'], 0.26, 0.3, 0.5); put(pluck(note(o['deg'] + 3), 1.4), o['t'] + B / 2, 0.16, 0.3, 0.5)
put(whoosh(0.7, True), Q['swap'] - 0.1, 0.32, 0.1, 0.25); put(whoosh(0.5, True), Q['podBack'], 0.12, 0.3, 0.2)
for tw in Q['whale']: put(whoosh(1.0, True), tw, 0.12, -0.2, 0.25)
if Q.get('under'): put(pen(0.4), Q['under'], 0.16, 0.3, 0.2); put(pluck(note(6), 1.2), Q['under'] + 0.05, 0.2, 0.3, 0.5)
for i, tk in enumerate(Q['checks']): put(pluck(note(10 + i * 2), 0.8), tk, 0.22, -0.2 + 0.2 * i, 0.5)
# --- end: pad from the resolve, A major chord on the title, a soft tick on the mark ---
pad = np.zeros(N)
for f, g in [(220, 1), (277.18, 0.6), (329.63, 0.8), (440, 0.4), (554.37, 0.25)]: pad += g * np.sin(2 * np.pi * f * (1 + 0.0015 * np.sin(2 * np.pi * 0.12 * t + f)) * t)
pad *= 0.045 * smooth(Q['pad'], Q['pad'] + 2, t); BUS[:, 0] += lp(pad, 2200); BUS[:, 1] += lp(pad, 2200); SEND += pad * 0.4
for i, f in enumerate([220, 277.18, 329.63, 440, 554.37]): put(pluck(f, 3.0), Q['chord'] + i * 0.06, 0.24, -0.4 + 0.2 * i, 0.6)
put(pluck(note(15), 1.5), Q['mark'], 0.1, 0.2, 0.6)

ir_t = T(1.6); ir = [lp(rng.standard_normal(len(ir_t)), 5000) * np.exp(-ir_t * 3.5) for _ in range(2)]; ir = [x / np.sqrt((x ** 2).sum()) for x in ir]
wet = np.stack([fftconvolve(SEND, ir[0])[:N], fftconvolve(SEND, ir[1])[:N]], 1)
out = BUS + 0.25 * wet; out *= (smooth(0, 0.03, t) * (1 - smooth(D - 1.2, D, t)))[:, None]; out /= np.abs(out).max() / 0.8
wavfile.write(OUT, SR, (out * 32767).astype(np.int16)); print('score ok')
