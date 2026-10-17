"""CETI Capabilities 09 · private — score. 120 BPM. Every sound sits on a cue the picture exports (cues.json).
Signature: a soft metal CLASP that closes in tune (stamp, and every time a stamped card lands back home). The thread goes taut
with a low plucked string. Problem motif: a bright note that bends sour when the wrong card is circled at the clinic. The clinic's
tick is a resolved two-note chime. The limit's sour bend is left unresolved; the pad only enters after the payoff lands home."""
import json, sys, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, resample_poly, lfilter
from scipy.io import wavfile
Q = json.load(open(sys.argv[1])); OUT = sys.argv[2]
SR = 48000; D = Q['dur']; N = int(D * SR); t = np.arange(N) / SR; B = 60 / Q['bpm']
rng = np.random.default_rng(339); BUS = np.zeros((N, 2)); SEND = np.zeros(N)
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
def clasp(t0, gain=1.0, pan=0.0):                 # signature: metal click + a closed interval (a fourth) ringing in tune
    tt = T(0.05); put(bp(rng.standard_normal(len(tt)), 2500, 9000) * np.exp(-tt * 90), t0, 0.25 * gain, pan, 0.1)
    put(tick(3100, 0.03), t0 + 0.012, 0.18 * gain, pan, 0.1)
    for f, g, dt in [(659.25, 1, 0.0), (880.0, 0.7, 0.06)]:
        tt = T(1.6); s = sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * k) for m, a, k in [(1, 1, 3.0), (2.76, 0.3, 7.0), (5.4, 0.12, 12)])
        put(s * np.minimum(1, tt / 0.002), t0 + dt, 0.12 * g * gain, pan, 0.45)
def pluck(t0, f=98.0, gain=1.0):                  # the thread pulled taut: a low plucked string
    tt = T(1.0); s = sum(np.sin(2 * np.pi * f * m * tt) / m * np.exp(-tt * (3 + 2 * m)) for m in range(1, 7)) * np.minimum(1, tt / 0.003)
    put(s, t0, 0.32 * gain, -0.3, 0.3)
def sour(t0, gain=1.0):                           # problem motif: a bright note that bends down 1.5 semitones (sour), plus a low knock
    tt = T(1.3); f = 783.99 * 2 ** (-1.5 * smooth(0.15, 0.7, tt) / 12)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.4) * np.minimum(1, tt / 0.004); put(s, t0, 0.2 * gain, 0.35, 0.5)
    tt = T(0.4); f2 = 85 + 40 * np.exp(-tt * 20); put(np.sin(2 * np.pi * np.cumsum(f2) / SR) * np.exp(-tt * 12), t0, 0.45 * gain, 0.3)
def chime(t0, gain=1.0):                          # the clinic's tick: a resolved two-note chime
    put(mallet(1046.5, 1.6), t0, 0.12 * gain, 0.4, 0.5); put(mallet(1318.5, 1.6), t0 + 0.07, 0.1 * gain, 0.45, 0.5)
def paper(t0, gain=1.0):                          # a page landing in a box
    tt = T(0.12); put(lp(rng.standard_normal(len(tt)), 3000) * np.exp(-tt * 40), t0, 0.16 * gain, 0.4, 0.1)

# pulse: none in the felt opening; a soft two-beat kick from the stamp to the not-this line
n = 0
while n * B < Q['notThis']:
    tb = n * B
    if tb >= Q['stamp'] - 0.05 and n % 2 == 0 and not (Q['card'] - 0.1 < tb < Q['card'] + 2.0):
        tt = T(0.3); f = 50 + 70 * np.exp(-tt * 30); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9), tb, 0.26)
    n += 1
# the email: header swap (pen scratch), send (whoosh), land in a box (paper)
for x in Q['hdrSwap']: tt = T(0.25); put(bp(rng.standard_normal(len(tt)), 1800, 5000) * np.sin(np.pi * tt / 0.25) ** 2, x, 0.08, -0.1, 0.1)
for x in Q['send']: put(whoosh(0.7), x, 0.12, 0.2, 0.15)
for x in Q['arrive']: paper(x)
# felt and limit: the wrong card rises at the clinic, the circle draws, the note sours (left unresolved both times)
for x in Q['pop']: put(tick(1500, 0.05), x, 0.12, 0.4, 0.2)
for i, x in enumerate(Q['circle']): sour(x, 1.0 if i == 0 else 0.8)
# title hinge
put(tick(4200, 0.03), Q['title'], 0.14, 0, 0.4); put(whoosh(0.7, rev=True), Q['title'] - 0.6, 0.06, 0, 0.3)
# the move: the stamp (clasp, first time), the thread drawing to the bakery's box (a rising glide), taut (pluck), home (clasp)
clasp(Q['stamp'], 1.2, 0.1)
tt = T(Q['thread'][1] - Q['thread'][0]); put(np.sin(2 * np.pi * np.cumsum(330 + 110 * tt / tt[-1]) / SR) * np.sin(np.pi * tt / tt[-1]) ** 2, Q['thread'][0], 0.05, -0.4, 0.4)
for x in Q['taut']: pluck(x)
for i, x in enumerate(Q['home']): clasp(x, 0.9 if i < 3 else 1.15, -0.4)
for x in Q['ok']: chime(x)
for x in Q['pat']: put(tick(1200, 0.05), x + 0.1, 0.12, -0.4, 0.2)
for x in Q['spark']: put(mallet(1760, 2.0), x + 0.05, 0.06, 0, 0.7)
# eyes shut while the emails go by themselves: a quiet held fifth under "no one has to remember"
tt = T(Q['wake'] - Q['sleep']); hold = (np.sin(2 * np.pi * 220 * tt) + 0.6 * np.sin(2 * np.pi * 330 * tt)) * np.sin(np.pi * tt / tt[-1]) ** 2
put(lp(hold, 1500), Q['sleep'], 0.03, 0, 0.5)
# the limit: a pencil scratch as the note is written by hand
tt = T(Q['scrawl'][1] - Q['scrawl'][0]); put(bp(rng.standard_normal(len(tt)), 2500, 7000) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * tt)), Q['scrawl'][0], 0.05, -0.2, 0.05)
# payoff: the pad enters only after the stamped card lands home again; spout; lockup bell
pad = np.zeros(N)
for f, g in [(164.81, 1), (246.94, 0.7), (329.63, 0.6), (415.30, 0.4), (493.88, 0.3)]: pad += g * np.sin(2 * np.pi * f * (1 + 0.0015 * np.sin(2 * np.pi * 0.11 * t + f)) * t)
pad *= 0.045 * smooth(Q['home'][-1], Q['home'][-1] + 1.8, t) * (1 - 0.6 * smooth(D - 1.2, D, t)); pad = lp(pad, 2400); BUS[:, 0] += pad; BUS[:, 1] += pad; SEND += pad * 0.4
tt = T(0.8); put(bp(rng.standard_normal(len(tt)), 300, 3000) * np.exp(-tt * 4) * np.minimum(1, tt / 0.02), Q['spray'], 0.12, -0.2, 0.3)
put(mallet(659.25, 2.4), Q['lockup'], 0.08, 0, 0.7)

# reverb send, fades, then loudness: BS.1770-style K-weighted, gated integrated level -> -16 LUFS, true peak <= -1 dBTP
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
