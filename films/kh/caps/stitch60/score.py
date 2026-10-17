"""CETI Capabilities 01 · stitch60 — score. 128 BPM, 32 bars. Every sound sits on a cue the picture exports (cues.json `ev`).
Signature: the STITCH, a clean woody click plus a mallet pitched by the card's kind (draft C5, decided E5, rule G5).
Problem motif: the same click muffled and a half-step flat (FELT and WHY). LIMIT plays the signature once, unresolved.
PAYOFF resolves the chord. No drums until CASE (a quiet pulse bed); BELIEF is a pad tail only."""
import json, sys, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, lfilter
from scipy.io import wavfile
from scipy.ndimage import minimum_filter1d
Q = json.load(open(sys.argv[1])); OUT = sys.argv[2]
SR = 48000; D = Q['dur']; N = int(D * SR); t = np.arange(N) / SR; B = 60 / Q['bpm']; A = Q['acts']
rng = np.random.default_rng(1660); BUS = np.zeros((N, 2)); SEND = np.zeros(N)
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
def wood(d=0.07, lo=900, hi=2400):
    tt = T(d); return bp(rng.standard_normal(len(tt)), lo, hi) * np.exp(-tt * 70)
def kick(f0=48, f1=75, d=0.32):
    tt = T(d); f = f0 + f1 * np.exp(-tt * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)
def pan_x(x): return float(np.clip(x / 750, -0.8, 0.8))
PITCH = [523.25, 659.25, 783.99]          # draft · decided · rule
FLAT = 2 ** (-1 / 12)

def stitch(at, ty, x=0.0, g=1.0):          # the signature: clean click + tuned mallet
    p = pan_x(x)
    put(wood(), at, 0.32 * g, p, 0.1); put(tick(3400, 0.03), at, 0.16 * g, p, 0.1)
    put(mallet(PITCH[ty], 1.3, 1.0), at, 0.24 * g, p, 0.45); put(mallet(PITCH[ty] / 2, 0.9, 0.3), at + 0.004, 0.12 * g, p, 0.2)
def motif(at, ty=1, x=0.0, g=1.0):         # the problem motif: the same click, muffled and a half-step flat
    p = pan_x(x)
    put(lp(wood(0.09, 500, 1500), 1200), at, 0.3 * g, p, 0.1)
    put(lp(mallet(PITCH[ty] * FLAT, 1.0, 0.2), 1400), at, 0.22 * g, p, 0.35); put(lp(mallet(PITCH[ty] * FLAT / 2, 0.8, 0.1), 900), at + 0.004, 0.12 * g, p, 0.2)
def muddy(at, x=0.0):                       # paper shuffle + muddy low note
    for k in range(4): put(wood(0.05, 500, 1500), at + 0.03 * k + rng.uniform(0, 0.02), 0.08, pan_x(x) + rng.uniform(-0.15, 0.15), 0.1)
    put(lp(mallet(110.0, 1.2, 0.2), 500), at, 0.3, pan_x(x), 0.2)
def sour(at, n):                            # a bright note that goes sour (detunes and beats)
    tt = T(1.3); f = 880 * (1 - 0.055 * smooth(0.05, 0.35, tt)); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 3) * np.minimum(1, tt / 0.003)
    s2 = np.sin(2 * np.pi * 830 * 1.012 * tt) * np.exp(-tt * 3.5) * smooth(0.1, 0.3, tt)
    put(s + 0.6 * s2, at, 0.13 + 0.03 * n, 0.4, 0.4); put(lp(kick(40, 30, 0.3), 300), at, 0.25, 0.3, 0.05)

for e in Q['ev']:
    k, at, x = e['kind'], e['t'], e.get('x', 0.0)
    if k == 'flick': put(whoosh(0.18), at - 0.06, 0.08, pan_x(x), 0.05)
    elif k == 'paste': muddy(at, x)
    elif k == 'podIn': put(whoosh(0.6), at - 0.6, 0.1, 0.6, 0.2); put(tick(1900, 0.06), at, 0.14, 0.5, 0.2)
    elif k == 'answer': put(lp(rng.standard_normal(int(0.18 * SR)), 1800) * np.exp(-T(0.18) * 22), at, 0.16, 0.5, 0.2)
    elif k == 'sour': sour(at, e.get('n', 1))
    elif k == 'drift': put(whoosh(0.8), at - 0.6, 0.06, -0.4, 0.2)
    elif k == 'title': put(tick(3000, 0.05), at, 0.18, 0, 0.4); put(mallet(1046.5, 1.6, 0.4), at, 0.08, 0, 0.6)
    elif k == 'spill':
        put(whoosh(1.0), at, 0.16, 0, 0.2)
        for j in range(8): put(wood(0.05, 600, 1800), at + 0.85 + 0.07 * j, 0.09, -0.7 + 0.2 * j, 0.1)
    elif k == 'motif': motif(at, 1, x, 0.8 + 0.1 * e.get('k', 0)); put(tick(2200, 0.03), at + 0.08, 0.05, 0.5, 0.2)
    elif k == 'podOut': put(whoosh(0.9), at, 0.12, 0.6, 0.3)
    elif k == 'chime': put(mallet(PITCH[1], 2.4, 0.6), at, 0.2, 0, 0.6); put(tick(3400, 0.03), at, 0.08, 0, 0.3)
    elif k == 'tab': stitch(at, e['ty'], -300 + 300 * e['ty'], 0.9)
    elif k == 'tree': put(mallet(392.0, 1.2, 0.5), at, 0.14, -0.2, 0.5); put(mallet(523.25, 1.8, 0.5), at + B / 2, 0.15, 0.2, 0.5)
    elif k == 'notch': put(mallet(PITCH[e['ty']] * 2, 0.8, 0.2), at, 0.06, pan_x(x), 0.5)
    elif k == 'snap': stitch(at, e['ty'], x)
    elif k == 'tick':
        for j in range(3): put(tick(3000 + 300 * j + 200 * e.get('k', 0), 0.03), at + 0.06 * j, 0.08, -0.3 + 0.3 * j, 0.3)
    elif k == 'swim': put(whoosh(1.2), at - 0.2, 0.1, 0.2, 0.2)
    elif k == 'refuse':
        motif(at, 1, x, 1.1); put(kick(40, 50, 0.25), at, 0.4, 0.2, 0.1)
    elif k == 'rootTick':
        tt = T(2.4); bell = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a, d in [(2093.0, 1, 1.8), (2093.0 * 2.76, 0.25, 3.5), (1046.5, 0.45, 1.3)])
        put(bell * np.minimum(1, tt / 0.003), at, 0.14, 0, 0.6)
    elif k == 'held': put(wood(), at, 0.3, 0, 0.1); put(mallet(PITCH[1], 3.2, 0.6), at, 0.22, 0, 0.7); put(mallet(PITCH[0], 3.2, 0.3), at, 0.1, -0.2, 0.7)
    elif k == 'block': put(mallet(261.63, 1.4, 0.3), at, 0.1, pan_x(x), 0.5)
    elif k == 'pulse':
        put(kick(), at, 0.3); tt = T(0.05); put(hp(rng.standard_normal(len(tt)), 6500) * np.exp(-tt * 70), at + B / 2, 0.06, 0.3)
        put(tick(4200, 0.02), at + 0.01, 0.03, rng.uniform(-0.6, 0.6), 0.2)
    elif k == 'card': put(whoosh(0.5, rev=True), at - 0.45, 0.1, 0, 0.3)
    elif k == 'spine':
        for j, f in enumerate([523.25, 659.25, 783.99]): put(mallet(f, 1.2, 0.5), at + 0.08 * j, 0.09, -0.6 + 0.6 * j, 0.5)
    elif k == 'two': put(mallet(587.33, 1.2, 0.5), at, 0.14, -0.2, 0.5); put(mallet(783.99, 1.6, 0.5), at + B, 0.14, 0.2, 0.5)
    elif k == 'limitSnap':   # the signature, once, left unresolved: a suspended fourth that never lands
        stitch(at, 1, 0, 1.0)
        for f in [392.0, 523.25, 698.46]: put(mallet(f, 3.0, 0.3), at + 0.05, 0.08, 0, 0.7)
    elif k == 'push': tt = T(1.5); put(lp(rng.standard_normal(len(tt)), 400) * smooth(0, 1.4, tt) * (1 - smooth(1.3, 1.5, tt)), at, 0.08, 0, 0.3)
    elif k == 'callback': put(whoosh(0.7, rev=True), at - 0.6, 0.1, 0, 0.3)
    elif k == 'bump': put(lp(wood(0.08, 400, 1200), 1000), at, 0.22, -0.3, 0.1)
    elif k == 'resolve':
        for j, f in enumerate([523.25, 659.25, 783.99, 1046.5]): put(mallet(f, 2.6, 0.7), at + 0.05 * j, 0.15, -0.3 + 0.2 * j, 0.6)
        put(kick(44, 50, 0.4), at, 0.35)
    elif k == 'spark':
        for j in range(5): put(tick(3500 + 400 * j, 0.04), at + 0.04 * j, 0.06, -0.5 + 0.25 * j, 0.5)
    elif k == 'leave': put(whoosh(1.0), at, 0.2, 0.6, 0.3)
    elif k == 'spout': tt = T(0.9); put(bp(rng.standard_normal(len(tt)), 400, 3500) * np.exp(-tt * 4) * np.minimum(1, tt / 0.03), at, 0.14, -0.3, 0.3)
    elif k == 'belief':
        for j, f in enumerate([261.63, 392.0, 523.25, 659.25]): put(mallet(f, 2.8, 0.6), at + 0.1 * j, 0.14, -0.3 + 0.2 * j, 0.6)
    elif k == 'lockup': put(mallet(783.99, 2.4, 0.5), at + 0.3, 0.1, 0, 0.7)
    # 'stare', 'room', 'card' focus beats and the hinge are silence by design (room tone only)

# room tone through FELT/WHY (very low), pad from BELIEF to the end
room = lp(rng.standard_normal(N), 600) * 0.004; BUS[:, 0] += room; BUS[:, 1] += room
pad = np.zeros(N)
for f, g in [(130.81, 1), (196.0, 0.7), (261.63, 0.6), (329.63, 0.45), (392.0, 0.3)]: pad += g * np.sin(2 * np.pi * f * (1 + 0.0015 * np.sin(2 * np.pi * 0.12 * t + f)) * t)
pad *= 0.05 * smooth(A['payoff']['out'] - 1.0, A['belief']['in'] + 1.0, t) * (1 - 0.6 * smooth(D - 1.2, D, t)); BUS[:, 0] += lp(pad, 2200); BUS[:, 1] += lp(pad, 2200); SEND += pad * 0.4

ir_t = T(1.6); ir = [lp(rng.standard_normal(len(ir_t)), 5000) * np.exp(-ir_t * 3.4) for _ in range(2)]; ir = [x / np.sqrt((x ** 2).sum()) for x in ir]
wet = np.stack([fftconvolve(SEND, ir[0])[:N], fftconvolve(SEND, ir[1])[:N]], 1)
out = BUS + 0.3 * wet; out *= (smooth(0, 0.05, t) * (1 - smooth(D - 0.4, D, t)))[:, None]
def kweight(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    return lfilter(b2, a2, lfilter(b1, a1, x))
def lufs(x):
    k = np.stack([kweight(x[:, c]) for c in range(2)], 1); n, h = int(0.4 * SR), int(0.1 * SR)
    z = np.array([np.mean(k[i:i + n] ** 2, 0).sum() for i in range(0, len(k) - n, h)]); l = -0.691 + 10 * np.log10(z + 1e-12)
    z = z[l > -70]; rel = -0.691 + 10 * np.log10(z.mean()) - 10; z = z[-0.691 + 10 * np.log10(z) > rel]; return -0.691 + 10 * np.log10(z.mean())
out *= 10 ** ((-16 - lufs(out)) / 20)
lim = 10 ** (-1.5 / 20); env = np.abs(out).max(1); need = np.minimum(1, lim / np.maximum(env, 1e-9))
g = minimum_filter1d(need, int(0.006 * SR)); rel = np.exp(-1 / (0.08 * SR)); gs = np.empty_like(g); acc = 1.0
for i in range(len(g)): acc = g[i] if g[i] < acc else g[i] + (acc - g[i]) * rel; gs[i] = acc
gs = minimum_filter1d(gs, int(0.004 * SR)); out *= np.convolve(gs, np.ones(96) / 96, 'same')[:, None]; out = np.clip(out, -lim, lim)
wavfile.write(OUT, SR, (np.clip(out, -1, 1) * 32767).astype(np.int16)); print('score ok', f'{lufs(out):.1f} LUFS, peak {20*np.log10(np.abs(out).max()):.1f} dBFS')
