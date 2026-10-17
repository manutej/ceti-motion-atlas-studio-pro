"""CETI Capabilities 01 · stitch — score. 128 BPM. Every sound sits on a cue the picture exports (cues.json).
Signature: the STITCH — a woody click plus a mallet pitched by the atom's type (claim C5, evidence E5, rule G5).
A refusal is the same gesture with no pitch: a dull thud and a detuned buzz. Receipts are a rising tick arpeggio."""
import json, sys, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile
Q = json.load(open(sys.argv[1])); OUT = sys.argv[2]
SR = 48000; D = Q['dur']; N = int(D * SR); t = np.arange(N) / SR; B = 60 / Q['bpm']
rng = np.random.default_rng(166); BUS = np.zeros((N, 2)); SEND = np.zeros(N)
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
PITCH = [523.25, 659.25, 783.99]                      # claim · evidence · rule

def stitch(at, ty, x, g=1.0):                         # the signature sound
    p = pan_x(x)
    put(wood(), at, 0.32 * g, p, 0.1); put(tick(3400, 0.03), at, 0.16 * g, p, 0.1)
    put(mallet(PITCH[ty], 1.3, 1.0), at, 0.24 * g, p, 0.45); put(mallet(PITCH[ty] / 2, 0.9, 0.3), at + 0.004, 0.12 * g, p, 0.2)

# pulse: soft kick on the beat through the move, thinner under the push-in, half-time through the seal, gone for the belief
n = 0
while n * B < Q['grab']:
    tb = n * B
    if tb >= 1.9 and (tb < Q['fold'] or n % 2 == 0):
        g = 0.26 if Q['refuse'] - 0.6 < tb < Q['refuse'] + 1.0 else 0.5
        put(kick(), tb, g)
        if Q['heap'] + 2.6 < tb < Q['fold']: tt = T(0.06); put(hp(rng.standard_normal(len(tt)), 6500) * np.exp(-tt * 60), tb + B / 2, 0.12, 0.3)
    n += 1

# open + the heap
put(whoosh(0.7, rev=True), Q['title'] - 0.1, 0.12, 0, 0.2)
for k in range(7): put(wood(0.05, 600, 1800), Q['heap'] + 0.06 * k + rng.uniform(0, 0.04), 0.07, rng.uniform(-0.5, 0.2), 0.1)
put(whoosh(0.8), Q['through'] - 0.4, 0.22, -0.2, 0.2)
for k in range(5): put(wood(0.05, 600, 1800), Q['through'] - 0.05 + 0.07 * k, 0.08, rng.uniform(-0.4, 0.2), 0.1)
# the line draws on: a soft rising sweep
tt = T(1.6); sw = bp(rng.standard_normal(len(tt)), 300, 2500) * (tt / 1.6) ** 1.5 * np.exp(-np.maximum(0, tt - 1.5) * 30)
put(sw, Q['line'], 0.06, -0.3, 0.2)
# atoms land on the line
for i, x in enumerate(Q['drops']): put(wood(0.06, 700, 2000), x, 0.24, -0.6 + 0.08 * i, 0.15); put(tick(2200 + 120 * i, 0.03), x, 0.06, -0.6 + 0.08 * i, 0.1)
# the tree appears; socket notches colour in, each with its type's pitch
for k, f in enumerate([261.63, 329.63, 392.0]): put(mallet(f, 1.6, 0.4), Q['tree'] + 0.15 * k, 0.12, -0.3 + 0.3 * k, 0.5)
for ty, x in enumerate(Q['notches']): put(mallet(PITCH[ty] * 2, 0.8, 0.2), x, 0.07, -0.4 + 0.4 * ty, 0.5)
# flicks: the whale's tail
for x in Q['flicks']: put(whoosh(0.18), x - 0.06, 0.08, 0, 0.05)
# snaps — pairs land on the same beat, one left and one right (parallel is heard as one chord)
for at, ty, x in Q['snapTypes']: stitch(at, ty, x)
# refusal at the seam: dull thud, detuned buzz, no pitch resolves
tt = T(0.5); buzz = (np.sign(np.sin(2 * np.pi * 116 * tt)) + np.sign(np.sin(2 * np.pi * 123 * tt))) * np.exp(-tt * 9)
put(lp(buzz, 1200), Q['refuse'], 0.14, 0.15, 0.2); put(kick(40, 50, 0.25), Q['refuse'], 0.45, 0.1, 0.1); put(wood(0.09, 300, 900), Q['refuse'], 0.3, 0.15, 0.1)
# pulses climbing the stalks: a quick upward glide
for x in Q['pulses']:
    tt = T(0.35); f = 500 + 500 * (tt / 0.35); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.35) ** 2, x - 0.35, 0.06, 0, 0.3)
# receipts: a rising tick arpeggio up the tree, then the root bell
for k, x in enumerate(Q['ticks']): put(mallet([1046.5, 1174.66, 1318.51][k], 0.7, 1.2), x, 0.14, -0.3 + 0.3 * k, 0.4); put(tick(4000, 0.03), x, 0.1)
put(mallet(1567.98, 0.9, 1.2), Q['innerTick'], 0.15, 0, 0.4)
tt = T(2.4); bell = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a, d in [(2093.0, 1, 1.8), (2093.0 * 2.76, 0.25, 3.5), (1046.5, 0.45, 1.3)])
put(bell * np.minimum(1, tt / 0.003), Q['rootTick'], 0.16, 0, 0.6)
# seal and send: fold (collect), the card opens, the stamp, the pod
put(whoosh(Q['card'] - Q['fold'], rev=True), Q['fold'], 0.2, 0, 0.3)
tt = T(0.25); put(lp(rng.standard_normal(len(tt)), 1800) * np.exp(-tt * 18), Q['card'], 0.25, 0, 0.2)
put(kick(42, 60, 0.4), Q['seal'], 0.6, 0, 0.1); put(wood(0.08, 400, 1400), Q['seal'], 0.35, 0, 0.2)
for k, f in enumerate([523.25, 659.25, 783.99, 1046.5]): put(mallet(f, 2.2, 0.8), Q['seal'] + 0.05 + k * 0.06, 0.16, -0.3 + 0.2 * k, 0.55)
put(whoosh(0.6), Q['seal'] - 0.1, 0.12, 0.6, 0.2); put(tick(1900, 0.06), Q['podArrive'], 0.16, 0.2, 0.2)
put(tick(2400, 0.05), Q['grab'], 0.18, 0.1, 0.2); put(tick(2900, 0.05), Q['grab'] + B / 2, 0.16, 0.1, 0.2)
put(whoosh(1.0), Q['leave'], 0.26, 0.5, 0.3)
# resolve: pad under the belief, end chord, a last soft note for the lockup
pad = np.zeros(N)
for f, g in [(130.81, 1), (196.0, 0.7), (261.63, 0.6), (329.63, 0.45), (392.0, 0.3)]: pad += g * np.sin(2 * np.pi * f * (1 + 0.0015 * np.sin(2 * np.pi * 0.12 * t + f)) * t)
pad *= 0.05 * smooth(Q['notThis'], Q['end'] + 0.8, t) * (1 - 0.6 * smooth(D - 1.2, D, t)); BUS[:, 0] += lp(pad, 2200); BUS[:, 1] += lp(pad, 2200); SEND += pad * 0.4
for i, f in enumerate([261.63, 392.0, 523.25, 659.25]): put(mallet(f, 2.8, 0.7), Q['end'] + i * 0.1, 0.2, -0.3 + 0.2 * i, 0.6)
put(mallet(783.99, 2.4, 0.5), Q['lockup'] + 0.3, 0.12, 0, 0.7)

ir_t = T(1.6); ir = [lp(rng.standard_normal(len(ir_t)), 5000) * np.exp(-ir_t * 3.4) for _ in range(2)]; ir = [x / np.sqrt((x ** 2).sum()) for x in ir]
wet = np.stack([fftconvolve(SEND, ir[0])[:N], fftconvolve(SEND, ir[1])[:N]], 1)
out = BUS + 0.3 * wet; out *= (smooth(0, 0.05, t) * (1 - smooth(D - 0.4, D, t)))[:, None]
# loudness: gated, K-weight-ish measure (BS.1770 blocks: 400 ms, 75% overlap, -70 abs / -10 rel gates), gain to -16 LUFS,
# then a smoothed peak limiter so the true peak stays under about -1 dBTP
def kweight(x):
    from scipy.signal import lfilter
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    return lfilter(b2, a2, lfilter(b1, a1, x))
def lufs(x):
    k = np.stack([kweight(x[:, c]) for c in range(2)], 1); n, h = int(0.4 * SR), int(0.1 * SR)
    z = np.array([np.mean(k[i:i + n] ** 2, 0).sum() for i in range(0, len(k) - n, h)]); l = -0.691 + 10 * np.log10(z + 1e-12)
    z = z[l > -70]; rel = -0.691 + 10 * np.log10(z.mean()) - 10; z = z[-0.691 + 10 * np.log10(z) > rel]; return -0.691 + 10 * np.log10(z.mean())
out *= 10 ** ((-16 - lufs(out)) / 20)
lim = 10 ** (-1.5 / 20); env = np.abs(out).max(1); need = np.minimum(1, lim / np.maximum(env, 1e-9))
from scipy.ndimage import minimum_filter1d
g = minimum_filter1d(need, int(0.006 * SR)); rel = np.exp(-1 / (0.08 * SR)); gs = np.empty_like(g); acc = 1.0
for i in range(len(g)): acc = g[i] if g[i] < acc else g[i] + (acc - g[i]) * rel; gs[i] = acc
gs = minimum_filter1d(gs, int(0.004 * SR)); out *= np.convolve(gs, np.ones(96) / 96, 'same')[:, None]; out = np.clip(out, -lim, lim)
wavfile.write(OUT, SR, (np.clip(out, -1, 1) * 32767).astype(np.int16)); print('score ok', f'{lufs(out):.1f} LUFS, peak {20*np.log10(np.abs(out).max()):.1f} dBFS')
