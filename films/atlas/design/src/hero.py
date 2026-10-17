import os
import math, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *

# WADA No. 296
SUL = "#f5ecc2"; SAL = "#d8a37b"; UMB = "#71502f"; SLA = "#34454c"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "") + "/"


def build():
    W, H = 1600, 2000
    p = Plate(W, H, NAVY)
    c = p.c
    MX = 128
    cx, cy, R = 800, 806, 500

    # --- bearing ring: the timeline wrapped into a compass ---
    for d in range(360):
        a = math.radians(d - 90)
        if d % 10 == 0: L, al, w = 22, 0.85, 1.1
        elif d % 5 == 0: L, al, w = 13, 0.55, 1.0
        else: L, al, w = 7, 0.32, 0.8
        x0, y0 = cx + R * math.cos(a), cy + R * math.sin(a)
        x1, y1 = cx + (R + L) * math.cos(a), cy + (R + L) * math.sin(a)
        p.line(x0, y0, x1, y1, SUL, al, w)
    p.circle(cx, cy, R); p.stroke(SUL, 0.55, 1.0)
    RI = R - 46
    p.circle(cx, cy, RI); p.stroke(SLA, 1.0, 1.0)

    # --- the ghost trail: 30 frames, uniform in time, eased in space ---
    N, SPAN, r = 30, 300, 12
    pts = []
    for i in range(N):
        t = i / (N - 1)
        ang = SPAN * GLASER(t)
        a = math.radians(ang - 90)
        pts.append((t, ang, a))
    RT = (R + RI) / 2
    drawn = None
    for i, (t, ang, a) in enumerate(pts):
        x, y = cx + RT * math.cos(a), cy + RT * math.sin(a)
        last = i == N - 1
        fx, fy = cx + RT * math.cos(pts[-1][2]), cy + RT * math.sin(pts[-1][2])
        crowd = (not last) and (math.hypot(x - fx, y - fy) < 2 * r + 2 or
                                (drawn and math.hypot(x - drawn[0], y - drawn[1]) < 5))
        # sounding tick on the inner ring (merged when frames crowd closer than 2 deg)
        if i == N - 1 or pts[i + 1][1] - ang >= 2.0:
          p.line(cx + (RI - 4) * math.cos(a), cy + (RI - 4) * math.sin(a),
               cx + (RI - 16) * math.cos(a), cy + (RI - 16) * math.sin(a), SAL, 0.35 + 0.6 * t, 1.0)
        if last:
            # deep tinted shadow fill, luminous edge
            p.circle(x, y, r); p.fill(UMB, 1.0, preserve=True); p.stroke(SAL, 1.0, 1.6)
            p.circle(x, y, r + 9); p.stroke(SAL, 0.5, 0.8)
        elif not crowd:
            p.circle(x, y, r); p.stroke(SAL, 0.24 + 0.46 * t ** 1.4, 1.0); drawn = (x, y)

    # --- inscribed chart: the same frames as f(t) ---
    s = 280
    x0, y0, x1, y1 = cx - s, cy - s, cx + s, cy + s
    for k in range(1, 10):
        gx = x0 + 2 * s * k / 10; gy = y0 + 2 * s * k / 10
        p.line(gx, y0, gx, y1, SLA, 1.0, 0.8)
        p.line(x0, gy, x1, gy, SLA, 1.0, 0.8)
    c.rectangle(x0, y0, 2 * s, 2 * s); p.stroke(SUL, 0.45, 1.0)
    # uniform time ticks (bottom), eased progress ticks (left)
    for (t, ang, a) in pts:
        v = ang / SPAN
        tx = x0 + 2 * s * t
        p.line(tx, y1 + 8, tx, y1 + 20, SUL, 0.6, 1.0)
        ty = y1 - 2 * s * v
        nxt = pts[pts.index((t, ang, a)) + 1][1] / SPAN if t < 1 else None
        if nxt is None or 2 * s * (nxt - v) >= 4:
            p.line(x0 - 8, ty, x0 - 20, ty, SAL, 0.35 + 0.6 * t, 1.0)
    # the curve
    c.move_to(x0, y1)
    for k in range(1, 401):
        t = k / 400
        c.line_to(x0 + 2 * s * t, y1 - 2 * s * GLASER(t))
    p.stroke(SAL, 1.0, 1.8)
    for i, (t, ang, a) in enumerate(pts):
        px, py = x0 + 2 * s * t, y1 - 2 * s * (ang / SPAN)
        p.circle(px, py, 2.6 if i < N - 1 else 4.5); p.fill(SUL, 1.0)

    # --- marks ---
    p.mark("whale-mark.svg", SUL, MX, 1812, 72)

    # --- type ---
    ey = mono(13, bold=True); em = mono(13)
    p.text(MX, 176, "CETI · PLATE I", ey, SUL, track=0.2)
    p.text(W - MX, 176, "WADA · No. 296", em, SAL, track=0.2, anchor="r")
    for deg, lab in [(0, "000"), (90, "090"), (180, "180"), (270, "270")]:
        a = math.radians(deg - 90)
        rr = R + 50
        lx, ly = cx + rr * math.cos(a), cy + rr * math.sin(a)
        f = mono(11)
        anc = {0: "m", 90: "l", 180: "m", 270: "r"}[deg]
        dy = {0: -2, 90: 4, 180: 14, 270: 4}[deg]
        p.text(lx + {90: -8, 270: 8}.get(deg, 0), ly + dy, lab, f, SUL, track=0.18, anchor=anc, pad=4)

    tf = fraunces(208, 300)
    p.text(MX - 6, 1640, "Motion Atlas", tf, SUL, track=-0.02)
    p.text(MX, 1716, "A GRAPH-MEMORY WIKI · FRONTIER MOTION GRAPHICS", mono(13, bold=True), SAL, track=0.2)
    p.text(W - MX, 1852, "FRAME = f(t)", mono(12), SUL, track=0.2, anchor="r")
    p.text(MX + 96, 1852, "CETIAI.CO", mono(12), SUL, track=0.2)

    rep = p.gates("plate-hero")
    p.save(OUT + "plate-hero.png")
    return rep


if __name__ == "__main__":
    print(build())
