"""04 · conserve: score. 124 BPM, and every sound sits on a cue the picture exports.
Signature: the line is a plucked string, and the pins are its nodes. Before the laws exist, every landing plucks a detuned note.
Once the pins are in, every edit plucks the SAME A (220 Hz), whatever shape the content takes: the conserved note.
The tug pulls the string flat; the repair snaps it back in tune. The shake strums that one note hard, and it never moves.
Normalised to -16 LUFS (BS.1770 K-weighting, gated), true peak <= -1 dBTP (4x oversampled limiter)."""
import json, sys, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, lfilter, resample_poly
from scipy.ndimage import minimum_filter1d
from scipy.io import wavfile
Q = json.load(open(sys.argv[1])); OUT = sys.argv[2]
SR = 48000; D = Q['dur']; N = int(D * SR); t = np.arange(N) / SR; B = 60 / Q['bpm']
rng = np.random.default_rng(404); BUS = np.zeros((N, 2)); SEND = np.zeros(N)
A = 220.0
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
def pluck(f, d=1.6, bright=0.5, glide=None):
    """Karplus-Strong string. glide = (f_end, seconds): the string is retuned as it rings (by variable-rate playback)."""
    f0 = f if glide is None else max(f, glide[0]); L = max(2, int(round(SR / f0))); n = int(d * SR)
    buf = lp(rng.uniform(-1, 1, L), 1500 + 9000 * bright, 1); k = 0.996 - 0.004 * (1 - bright)
    out = lfilter([1.0], np.concatenate([[1.0], np.zeros(L - 1), [-0.5 * k, -0.5 * k]]), np.concatenate([buf, np.zeros(n)]))[:n]  # y[n] = x[n] + k/2 (y[n-L] + y[n-L-1])
    if glide is not None:  # retune: read the buffer at rate f(t)/f0
        tt = T(d); fr = f + (glide[0] - f) * smooth(0, glide[1], tt); pos = np.cumsum(fr / f0); pos = pos[pos < n - 1]
        out = np.interp(pos, np.arange(n), out); out = np.pad(out, (0, n - len(out)))
    env = np.minimum(1, T(d) / 0.002) * (1 - smooth(d - 0.15, d, T(d)))
    return out * env
def knock(f=900):
    tt = T(0.12); return (np.sin(2 * np.pi * f * tt) * np.exp(-tt * 45) + 0.6 * bp(rng.standard_normal(len(tt)), f * 0.8, f * 2.5) * np.exp(-tt * 90))
def kick(g):
    tt = T(0.32); f = 46 + 70 * np.exp(-tt * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9) * g
def shaker(d=0.07):
    tt = T(d); return hp(rng.standard_normal(len(tt)), 6500) * np.exp(-tt * 55)
beats = np.array(Q['beats']); dive, still, end = Q['dive'], Q['still'], Q['end']; over, rep = Q['over'], Q['repair']

# pulse: soft kick on the beat through act 2, shaker on the off-beat; half-time while the line is over budget; gone after the shake
for b in beats:
    if b < Q['stations'][0] - 0.05 or b > dive - 0.05: continue
    tense = over - 0.05 < b < rep + 0.3
    if not tense or int(round(b / B)) % 2 == 0: put(kick(0.55 if not tense else 0.4), b)
    if b > Q['taps'][0] and not tense: put(shaker(), b + B / 2, 0.15, 0.35)
# title and draw-on
put(whoosh(0.7, rev=True), Q['title'] - 0.1, 0.12, 0, 0.2); put(mallet(A / 2, 2.2, 0.4), Q['title'] + 0.35, 0.18, 0, 0.5)
tt = T(1.0); put(bp(rng.standard_normal(len(tt)), 900, 5000) * (tt / 1.0) ** 2 * np.exp(-(tt - 1.0) ** 2 * 0), Q['draw'], 0.06, -0.4, 0.2)
# change (no laws yet): every landing plucks a note that is off, and sags as the dots drift
for i, (x, f) in enumerate(zip(Q['loose'], [207.6, 233.1, 196.0])):
    put(pluck(f, 1.4, 0.55, glide=(f * 0.965, 0.9)), x, 0.5, -0.4 + 0.4 * i, 0.3); put(kick(0.25), x)
# conserve: each tap drives a pin in. A knock, then the law's note; the three pins build an open A chord (A2, E3, A3)
for i, (x, f) in enumerate(zip(Q['taps'], [110.0, 164.81, 220.0])):
    put(knock(900 + 150 * i), x, 0.35, -0.5 + 0.5 * i, 0.2); put(mallet(f, 2.4, 0.5), x + 0.02, 0.32, -0.5 + 0.5 * i, 0.5)
# pinned edits: the conserved note. Same pitch every time, different brightness (pluck position) for a different shape
for i, x in enumerate(Q['edits']):
    put(pluck(A, 1.8, [0.3, 0.75, 0.5][i % 3]), x, 0.55, [-0.3, 0.3, 0.0][i % 3], 0.35); put(kick(0.3), x)
# sounding: a soft sonar ping per check, a high tick as each pin is reached (lower and drier when it fails)
for x in Q['checks']:
    tt = T(0.9); put(np.sin(2 * np.pi * 1760 * tt) * np.exp(-tt * 7) * np.minimum(1, tt / 0.004), x, 0.06, 0, 0.6)
for x, i, bad in Q['hits']:
    put(tick(1300 if bad else 2400 + 300 * i, 0.05), x, 0.12 if bad else 0.08, -0.5 + 0.5 * i, 0.25)
# ledger: a dry type-tick per entry; the fire is a copper bell
for x, fire in Q['ledger']:
    if fire:
        tt = T(2.0); bell = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a, d in [(659.25, 1, 1.8), (659.25 * 2.76, 0.3, 4), (329.63, 0.5, 1.4)])
        put(bell * np.minimum(1, tt / 0.003), x, 0.2, 0.5, 0.6)
    else: put(tick(1800, 0.03), x, 0.14, 0.6, 0.05)
# the tug: a heavy landing, the string pulled flat while it rings; a beating drone while over budget
put(kick(0.7), Q['tugLand']); put(pluck(A, 2.2, 0.5, glide=(A * 0.89, 0.75)), Q['tugLand'], 0.6, 0, 0.3)
seg = (t > over) & (t < rep + 0.4); dr = np.zeros(N)
dr[seg] = (np.sin(2 * np.pi * A * 0.89 * t[seg]) + np.sin(2 * np.pi * (A * 0.89 + 5.5) * t[seg])) * smooth(over, over + 0.3, t[seg]) * (1 - smooth(rep, rep + 0.35, t[seg]))
dr = lp(dr, 1200) * 0.05; BUS[:, 0] += dr; BUS[:, 1] += dr; SEND += dr * 0.3
# repair: the string snaps back up into tune, a dry click on the pin
put(pluck(A * 0.89, 1.8, 0.7, glide=(A, 0.12)), rep, 0.55, 0, 0.35); put(knock(1100), rep, 0.3, 0, 0.1)
# example appears: two soft notes
put(mallet(440, 1.6, 0.6), Q['example'], 0.12, 0.3, 0.5); put(mallet(659.25, 1.6, 0.6), Q['example'] + B / 2, 0.1, 0.4, 0.5)
# the shake: whoosh into the dive, three pin knocks (the laws hold), then the one note strummed hard on every 8th
put(whoosh(0.5, rev=True), dive - 0.5, 0.2, -0.3, 0.2); put(kick(0.8), dive)
for i in range(3): put(knock(800 + 200 * i), dive + 0.03 * i, 0.3, -0.5 + 0.5 * i, 0.2)
x = dive; k = 0
while x < still - 0.2:
    e = min(1, (x - dive) / 0.2) * (1 - smooth(Q['shakeEnd'], still, x))
    put(pluck(A, 0.6, 0.85 if k % 2 == 0 else 0.55), x, 0.42 * e, -0.35 if k % 2 else 0.35, 0.25)
    put(shaker(0.09), x + B / 4, 0.22 * e, 0.0, 0.1)
    if k % 2 == 0: put(kick(0.6 * e), x)
    x += B / 2; k += 1
drn = np.sin(2 * np.pi * 55 * t) * smooth(dive, dive + 0.4, t) * (1 - smooth(Q['shakeEnd'], still, t)) * 0.12
BUS[:, 0] += drn; BUS[:, 1] += drn
# stillness: the same A, pure and long; the spark
tt = T(4.0); put(sum(a * np.sin(2 * np.pi * A * h * tt) * np.exp(-tt * d) for h, a, d in [(1, 1, 0.9), (2, 0.45, 1.4), (3, 0.2, 2.2)]) * np.minimum(1, tt / 0.004), still, 0.22, 0, 0.6)
put(mallet(1318.5, 1.4, 1.0), still + 0.05, 0.08, 0.4, 0.7)
# not-this and the end: a quiet pad on the open A chord, the end chord on the belief, one low A under the lockup
pad = np.zeros(N)
for f, g in [(110, 1), (164.81, 0.7), (220, 0.6), (277.18, 0.35), (329.63, 0.4)]: pad += g * np.sin(2 * np.pi * f * (1 + 0.0015 * np.sin(2 * np.pi * 0.11 * t + f)) * t)
pad *= 0.035 * smooth(Q['notThis'], Q['notThis'] + 1.5, t) * (1 - smooth(D - 1.2, D, t)); pad = lp(pad, 2200); BUS[:, 0] += pad; BUS[:, 1] += pad; SEND += pad * 0.4
for i, f in enumerate([220, 277.18, 329.63, 440]): put(mallet(f, 2.6, 0.7), end + i * 0.11, 0.24, -0.3 + 0.2 * i, 0.6)
put(mallet(110, 3.0, 0.3), Q['lockup'], 0.28, 0, 0.5)

ir_t = T(1.7); ir = [lp(rng.standard_normal(len(ir_t)), 5000) * np.exp(-ir_t * 3.3) for _ in range(2)]; ir = [x / np.sqrt((x ** 2).sum()) for x in ir]
wet = np.stack([fftconvolve(SEND, ir[0])[:N], fftconvolve(SEND, ir[1])[:N]], 1)
out = BUS + 0.3 * wet; out *= (smooth(0, 0.05, t) * (1 - smooth(D - 0.4, D, t)))[:, None]

# ---------- loudness: BS.1770-4 integrated (K-weighted, gated) and a 4x true-peak limiter ----------
def lufs(x):
    kw = lfilter([1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585], x, axis=0)
    kw = lfilter([1.0, -2.0, 1.0], [1, -1.99004745483398, 0.99007225036621], kw, axis=0)
    blk, hop = int(0.4 * SR), int(0.1 * SR); z = np.array([(kw[i:i + blk] ** 2).mean(0).sum() for i in range(0, len(kw) - blk, hop)])
    l = -0.691 + 10 * np.log10(z + 1e-12); z = z[l > -70]; rel = -0.691 + 10 * np.log10(z.mean()) - 10
    z = z[-0.691 + 10 * np.log10(z) > rel]; return -0.691 + 10 * np.log10(z.mean())
def tpeak(x): return np.abs(resample_poly(x, 4, 1, axis=0)).max()
thr = 10 ** (-1.3 / 20)
for _ in range(4):
    out *= 10 ** ((-16 - lufs(out)) / 20)
    up = np.abs(resample_poly(out, 4, 1, axis=0)).max(1).reshape(-1, 4).max(1)[:N]
    g = np.minimum(1, thr / np.maximum(up, 1e-9)); w = int(0.003 * SR)
    g = minimum_filter1d(g, 2 * w + 1); g = np.convolve(g, np.ones(w + 1) / (w + 1), 'same'); out *= g[:, None]
out *= 10 ** ((-16 - lufs(out)) / 20); tp = 20 * np.log10(tpeak(out))
if tp > -1.0: out *= 10 ** ((-1.05 - tp) / 20); tp = 20 * np.log10(tpeak(out))
wavfile.write(OUT, SR, (clamp(out, -1, 1) * 32767).astype(np.int16)); print(f'score ok  {lufs(out):.1f} LUFS  TP {tp:.2f} dBTP')
