"""CETI Capabilities 02 · gate v3 — score. 128 BPM. Every sound sits on a cue the picture exports (cues.json).
Signature: a struck glass bell per KIND of check (wobble, gap, colour, direction — four pitches). Problem motif: the same
bell muffled to a dull thunk when the pod answers ✕. The fold is a tuned paper crease; the new gate lands with a clean stamp
and rings its new bell for the first time. The limit's thunk is left unresolved; the pod's ✓ is the bells as one chord."""
import json, sys, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, resample_poly, lfilter
from scipy.io import wavfile
Q = json.load(open(sys.argv[1])); OUT = sys.argv[2]
SR = 48000; D = Q['dur']; N = int(D * SR); t = np.arange(N) / SR; B = 60 / Q['bpm']
rng = np.random.default_rng(243); BUS = np.zeros((N, 2)); SEND = np.zeros(N)
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
# one struck glass bell per KIND of check (wobble, gap, colour, direction): the ear hears "a different check", not "the same check again"
KIND_NOTE = [587.33, 659.25, 880.0, 987.77]
def glass(f, d=2.2, muffle=False):
    tt = T(d); s = sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * k) for m, a, k in [(1, 1, 2.2), (2.76, 0.42, 5.0), (5.4, 0.18, 9.0)]) * np.minimum(1, tt / 0.002)
    return lp(s * np.exp(-tt * 6), 700) * 2.2 if muffle else s
def thunk(t0, gain=1.0):                         # problem motif: the bell, muffled to a dull thunk, plus a low knock
    put(glass(440, 0.8, True), t0, 0.32 * gain, 0.3, 0.15)
    tt = T(0.4); f = 90 + 40 * np.exp(-tt * 20); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 12), t0, 0.5 * gain, 0.3)
def knock(t0):                                    # a gate stops a run: soft stop knock + converging double tick
    tt = T(0.35); f = 75 + 55 * np.exp(-tt * 25); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 11), t0, 0.5)
    put(tick(2200, 0.05), t0, 0.22, -0.2, 0.1); put(tick(1500, 0.06), t0 + 0.035, 0.22, 0.2, 0.1)
def fold(t0):                                     # paper fold, tuned: two filtered noise creases rising to the colour bell's pitch
    for i, (lo, hi) in enumerate([(900, 3000), (1500, 5000)]):
        tt = T(0.18); put(bp(rng.standard_normal(len(tt)), lo, hi) * np.sin(np.pi * tt / 0.18) ** 2, t0 + i * 0.2, 0.14, -0.2 + 0.4 * i, 0.2)
    tt = T(0.5); put(np.sin(2 * np.pi * np.cumsum(440 + 440 * clamp(tt / 0.35)) / SR) * np.sin(np.pi * tt / 0.5) ** 2, t0 + 0.05, 0.05, 0, 0.4)
def stamp(t0):                                    # clean stamp as the icon lands
    put(lp(rng.standard_normal(len(T(0.08))), 2500) * np.exp(-T(0.08) * 50), t0, 0.3, 0, 0.1)
    tt = T(0.3); f = 110 + 50 * np.exp(-tt * 30); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 14), t0, 0.4)

# FELT: no pulse; the passes chime small, the pod answers with the thunk. A soft pulse starts with the move (the fold).
n = 0
while n * B < Q['notThis'] - 0.3:
    tb = n * B
    if tb >= Q['fold'][0] - 0.01 and n % 2 == 0:
        tt = T(0.3); f = 50 + 70 * np.exp(-tt * 30); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9), tb, 0.28)
    n += 1
# gate passes: the bell of that kind; story passes full, escapes slightly flat (a fair yes on the wrong question)
for e in Q['pass']:
    esc = e['id'] in ('e1', 'e2', 'e3', 'back')
    put(glass(KIND_NOTE[e['g']] * 2 ** ((-30 if esc else 0) / 1200), 1.8), e['t'], 0.16, -0.5 + 0.3 * e['g'], 0.45)
    put(tick(3400, 0.03), e['t'], 0.1, -0.5 + 0.3 * e['g'], 0.1)
for e in Q['stop']: put(glass(KIND_NOTE[e['g']], 1.2), e['t'] - 0.02, 0.18, -0.5 + 0.3 * e['g'], 0.4); knock(e['t'])
for x in Q['reopen']: put(tick(2800, 0.03), x, 0.08, 0, 0.2)
# the pod's answers: ✕ = the problem motif; ✓ = the four kind-bells as one resolved chord
for a in Q['answer']:
    if not a['ok']: thunk(a['t'], 1.0 if a['id'] != 'back' else 0.85)
    else:
        for i, f in enumerate(sorted(KIND_NOTE[:3] if a['t'] < Q['notThis'] else KIND_NOTE)): put(glass(f / 2, 2.6), a['t'] + i * 0.05, 0.12, -0.3 + 0.2 * i, 0.6)
for x in Q['flag']: put(tick(1200, 0.05), x + 0.36, 0.16, 0.35, 0.1)
# the title hinge: near-silence, then the title tick
put(tick(4200, 0.03), Q['title'], 0.14, 0, 0.4); put(whoosh(0.7, rev=True), Q['title'] - 0.6, 0.06, 0, 0.3)
# the move: lift, fold, posts rise, stamp + the NEW bell rings for the first time (a glass ping)
for x in Q['lift']: put(whoosh(0.6), x, 0.14, -0.1, 0.2)
for x in Q['pick']: put(tick(1800, 0.04), x, 0.16, 0.3)
for x in Q['fold']: fold(x)
for x in Q['grow']: put(tick(2600, 0.05), x, 0.14, 0.1); put(tick(3300, 0.05), x + 0.12, 0.14, 0.3)
for i, x in enumerate(Q['set']): stamp(x); put(glass(KIND_NOTE[2 + i] * 2, 2.4), x + 0.03, 0.12, 0.2, 0.7)
for x in Q['spark']: put(glass(1318.5, 2.4), x + 0.05, 0.07, 0.2, 0.7)
# limit: the escape's thunk is left unresolved (no chord after it) — the pad enters only after the fourth gate stands
pad = np.zeros(N)
for f, g in [(146.83, 1), (220, 0.7), (293.66, 0.6), (369.99, 0.45), (440, 0.3)]: pad += g * np.sin(2 * np.pi * f * (1 + 0.0015 * np.sin(2 * np.pi * 0.11 * t + f)) * t)
pad *= 0.04 * smooth(Q['set'][1], Q['set'][1] + 2.5, t) * (1 - 0.6 * smooth(D - 1.2, D, t)); pad = lp(pad, 2400); BUS[:, 0] += pad; BUS[:, 1] += pad; SEND += pad * 0.4
put(glass(587.33, 2.4), Q['lockup'], 0.08, 0, 0.7)

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
