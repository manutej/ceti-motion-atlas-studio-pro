"""flash.py yavg.txt — general-flash count on encoded video: a flash = a pair of opposing YAVG swings each >= 10% of full scale (25.5),
counted in every 1 s (60-frame) window. Limit: <= 3."""
import re, sys, numpy as np
y = np.array([float(v) for v in re.findall(r'YAVG=([\d.]+)', open(sys.argv[1]).read())]); TH = 25.5
ext = [(0, y[0])]; d = 0   # turning points of significant swings
for i, v in enumerate(y):
    lv = ext[-1][1]
    if d >= 0 and v > lv: ext[-1] = (i, v) if d == 1 else ext[-1]
    if d <= 0 and v < lv: ext[-1] = (i, v) if d == -1 else ext[-1]
    if d != 1 and v - lv >= TH: ext.append((i, v)); d = 1
    elif d != -1 and lv - v >= TH: ext.append((i, v)); d = -1
tr = [ext[k][0] for k in range(1, len(ext))]   # frame index of each significant transition
flashes = [tr[k] for k in range(1, len(tr))]    # each opposing pair completes a flash
mx = max([sum(1 for f in flashes if s <= f < s + 60) for s in range(len(y))] or [0])
print(f'frames {len(y)}  YAVG {y.min():.1f}..{y.max():.1f}  max per-frame delta {np.abs(np.diff(y)).max():.2f}  significant transitions {len(tr)}  max flashes in 1 s: {mx}  {"PASS" if mx <= 3 else "FAIL"}')
