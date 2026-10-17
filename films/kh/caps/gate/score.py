"""CETI Capabilities 02 · gate — score. 128 BPM. Every sound sits on a cue the picture exports (cues.json).
Signature: the gate is two upright ticks, so it sounds as a double tick. On a pass, a bright double tick plus a mallet
note (each gate has its own pitch, 01 low to 07 high, so a run through the row plays a rising line). On a stop, the
ticks clack together over a low, muted thud."""
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
def gate_pass(t0, g, gain=1.0, pan=0.0, detune=0.0):        # signature: double tick + the gate's note
    put(tick(3100, 0.035), t0 - 0.028, 0.22 * gain, pan - 0.15, 0.1); put(tick(3700, 0.035), t0, 0.22 * gain, pan + 0.15, 0.1)
    put(mallet(GATE_NOTE[g], 1.3, 0.9, detune), t0, 0.26 * gain, pan, 0.45)
def gate_stop(t0, g):                                        # the ticks clack shut: converging double tick + muted thud
    put(tick(2200, 0.05), t0, 0.3, -0.2, 0.1); put(tick(1500, 0.06), t0 + 0.035, 0.3, 0.2, 0.1)
    tt = T(0.45); f = 70 + 60 * np.exp(-tt * 25); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 10), t0, 0.55)
    put(lp(rng.standard_normal(len(T(0.12))), 900) * np.exp(-T(0.12) * 40), t0, 0.35, 0, 0.1)
    put(mallet(GATE_NOTE[g] / 2 * 2 ** (3 / 12) / 2 ** (4 / 12), 0.9, 0.2), t0 + 0.02, 0.18, 0, 0.3)   # a soft minor colour under it

# D major pentatonic up the row: gate 01 low … gate 07 high
GATE_NOTE = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.25]

# pulse: soft kick on the beat while the machine runs (Spec → pull-back), half-time across the row, gone for the belief
n = 0
while n * B < Q['belief'] - 0.6:
    tb = n * B
    if tb >= Q['spec'] - 0.01 and (tb < Q['pull'] or n % 2 == 0):
        tt = T(0.3); f = 50 + 70 * np.exp(-tt * 30); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9), tb, 0.45 if tb < Q['pull'] else 0.3)
        if tb < Q['pull'] and tb >= Q['scan']: tt = T(0.06); put(hp(rng.standard_normal(len(tt)), 7000) * np.exp(-tt * 60), tb + B / 2, 0.1, 0.3)
    n += 1

# title + the track drawing on
put(whoosh(0.7, rev=True), Q['title'] - 0.1, 0.12, 0, 0.2); put(whoosh(1.6), Q['draw'], 0.1, -0.2, 0.2)
# act 1: runs ship unchecked (airy swish); the wobbly one warbles past, slightly out of tune
for i, x in enumerate(Q['ship']): put(whoosh(0.5), x - 0.25, 0.16, -0.4 + 0.3 * i, 0.15)
tt = T(0.9); wob = np.sin(2 * np.pi * np.cumsum(392 * (1 + 0.03 * np.sin(2 * np.pi * 9 * tt))) / SR) * np.sin(np.pi * tt / 0.9) ** 2
put(lp(wob, 2000), Q['wobble'] - 0.45, 0.12, 0.2, 0.3)
# Spec: the whale lands and the two ticks drive in
put(mallet(146.83, 1.0, 0.3), Q['spec'], 0.32, 0, 0.2); put(tick(1800, 0.05), Q['spec'] + 0.05, 0.25, -0.2); put(tick(2400, 0.05), Q['spec'] + 0.16, 0.25, 0.2)
# Check: the scan switches on — a quiet high hum that lives under the whole machine section
hum = (np.sin(2 * np.pi * 1174.66 * t) + 0.5 * np.sin(2 * np.pi * 1760 * t)) * smooth(Q['scan'], Q['scan'] + 0.4, t) * (1 - smooth(Q['pull'], Q['pull'] + 1.5, t)) * 0.012
BUS[:, 0] += hum; BUS[:, 1] += hum; put(tick(4200, 0.03), Q['scan'], 0.2, 0, 0.3)
# every pass: story passes at full weight, the row's canon lighter; the escape's pass is a hair flat (a wrong "yes")
for e in Q['pass']:
    pan = -0.6 + 0.2 * e['g']
    if e['id'] == 'esc': gate_pass(e['t'], e['g'], 1.0, pan, detune=-35)
    elif e['id'].startswith('p'): gate_pass(e['t'], e['g'], 0.55, pan)
    else: gate_pass(e['t'], e['g'], 1.0, pan)
for e in Q['stop']: gate_stop(e['t'], e['g'])
for x in Q['reopen']: put(tick(2800, 0.03), x, 0.12, 0, 0.2)
# the rule ships: counter ticks (bell)
for i, x in enumerate(Q['rule']): put(bell([880, 987.77][i], 2.2), x, 0.12, 0.3, 0.6)
# escape: startle, take-off whoosh, the catch (a low mallet + grip tick)
put(tick(5200, 0.03), Q['falsePass'] + 0.06, 0.12, 0.2); put(whoosh(0.5), Q['takeoff'], 0.22, -0.1, 0.2)
put(mallet(220, 1.2, 0.6), Q['catch'], 0.3, 0.3, 0.3); put(tick(1200, 0.06), Q['catch'], 0.25, 0.3)
# the new gate grows (higher double tick), sparks
put(tick(2600, 0.05), Q['build7'], 0.25, 0.2); put(tick(3300, 0.05), Q['build7'] + 0.12, 0.25, 0.4)
for x in Q['spark']: put(bell(1318.5, 2.4), x, 0.1, 0.2, 0.7)
# rules accrue: pull-back breath, then RULES 6 → 7 lands as a chord
put(whoosh(1.6), Q['pull'], 0.18, 0, 0.4)
for i, f in enumerate([587.33, 739.99, 880, 1174.66]): put(mallet(f, 2.4, 0.8), Q['seven'] + i * 0.06, 0.18, -0.3 + 0.2 * i, 0.6)
# pad under the payoff and the end; end chord on the belief, a last soft note on the lockup
pad = np.zeros(N)
for f, g in [(146.83, 1), (220, 0.7), (293.66, 0.6), (369.99, 0.45), (440, 0.3)]: pad += g * np.sin(2 * np.pi * f * (1 + 0.0015 * np.sin(2 * np.pi * 0.11 * t + f)) * t)
pad *= 0.045 * smooth(Q['pull'], Q['pull'] + 3, t) * (1 - 0.6 * smooth(D - 1.2, D, t)); pad = lp(pad, 2400); BUS[:, 0] += pad; BUS[:, 1] += pad; SEND += pad * 0.4
for i, f in enumerate([293.66, 369.99, 440, 587.33]): put(mallet(f, 2.8, 0.7), Q['belief'] + i * 0.1, 0.22, -0.3 + 0.2 * i, 0.6)
put(mallet(587.33, 2.4, 0.5), Q['lockup'], 0.14, 0, 0.7)

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
