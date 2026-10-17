import os
import math, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "") + "/"
W, H = 1500, 600
TX = 120             # text column x
WORD_PX = 120


def lockup(p, eyebrow, word, light, accent, word_y=352, x=TX):
    p.text(x, word_y - 118, eyebrow, mono(13, bold=True), accent, track=0.2)
    p.text(x - 4, word_y, word, fraunces(WORD_PX, 300), light, track=-0.02)


# ---------------------------------------------------------------- notion
def notion():
    # WADA No. 279: Raw Sienna, Vinaceous Cinnamon, Ecru, Dark Tyrian Blue
    RS, VC, EC, TY = "#bb7125", "#eea78c", "#c2ae93", "#12354e"
    p = Plate(W, H, NAVY)
    x0, x1 = 720, 1380
    base = 430
    N = 24
    # graduated baseline
    p.line(x0, base, x1, base, EC, 0.7, 1.0)
    for k in range(97):
        x = x0 + (x1 - x0) * k / 96
        L = 12 if k % 8 == 0 else 6
        p.line(x, base, x, base + L, EC, 0.75 if k % 8 == 0 else 0.4, 1.0)
    # trajectory: eased in x, shallow arc in y
    def pos(t):
        u = GLASER(t)
        x = x0 + 20 + (x1 - x0 - 40) * u
        y = 300 - 120 * math.sin(math.pi * u) * 0.9 + 0 * t
        return x, y
    # deep tinted beds under the path (beats)
    for b in range(4):
        bx = x0 + (x1 - x0) * b / 4
        if b % 2 == 0:
            p.c.rectangle(bx, 150, (x1 - x0) / 4, base - 150); p.fill(TY, 0.32)
    # thin the onion skin where frames crowd: keep frames >= 2r+6 apart, always the last
    R0 = 9
    keep = []
    allp = [pos(i / (N - 1)) for i in range(N)]
    for i in range(N - 1, -1, -1):
        x, y = allp[i]
        if not keep or all(math.hypot(x - kx, y - ky) >= 2 * R0 + 6 for kx, ky, _ in keep):
            keep.append((x, y, i))
    def holes(c):
        for x, y, i in keep:
            c.new_sub_path(); c.arc(x, y, R0 + 5, 0, 2 * math.pi)
    p.clip_out(holes)
    c = p.c
    c.move_to(*pos(0))
    for k in range(1, 301):
        c.line_to(*pos(k / 300))
    p.stroke(EC, 0.45, 1.0, dash=[2, 5])
    for x, y, i in keep:
        t = i / (N - 1)
        p.line(x, y, x, base - 2, VC, 0.14 + 0.36 * t, 0.9)
    p.unclip()
    for x, y, i in keep:
        t = i / (N - 1)
        if i == N - 1:
            p.circle(x, y, R0); p.fill(RS, 1.0, preserve=True); p.stroke(VC, 1.0, 1.4)
        else:
            p.circle(x, y, R0); p.stroke(VC, 0.3 + 0.6 * t, 1.1)
    p.mark("whale-mark.svg", EC, TX, 400, 56)
    lockup(p, "CETI · WADA No. 279", "Motion Atlas", PAPER, EC)
    rep = p.gates("cover-notion", band=(100, 500))
    p.save(OUT + "cover-notion.png"); return rep


# ---------------------------------------------------------------- styles
def superellipse(c, cx, cy, r, n, rot=0.0, steps=240):
    for k in range(steps + 1):
        th = 2 * math.pi * k / steps
        ct, st = math.cos(th), math.sin(th)
        x = r * math.copysign(abs(ct) ** (2 / n), ct)
        y = r * math.copysign(abs(st) ** (2 / n), st)
        xr = x * math.cos(rot) - y * math.sin(rot)
        yr = x * math.sin(rot) + y * math.cos(rot)
        (c.move_to if k == 0 else c.line_to)(cx + xr, cy + yr)
    c.close_path()


def styles():
    # WADA No. 166: Grenadine Pink, Naples Yellow, Deep Slate Green
    GP, NY, DS = "#f48067", "#fbe6a0", "#112f2c"
    p = Plate(W, H, NAVY)
    states = 7
    cy, r = 300, 92
    xs = [680 + k * 100 for k in range(states)]
    p.clip_out(lambda c: superellipse(c, xs[-1], cy, r + 7, 8.0, 0.0))
    for k, x in enumerate(xs[:-1]):
        t = k / (states - 1)
        n = 2 + 6 * REST(t)          # circle -> squircle -> square
        rot = math.radians(45) * (1 - REST(t))
        superellipse(p.c, x, cy, r, n, rot)
        p.stroke(NY, 0.22 + 0.5 * t, 1.0)
    p.unclip()
    superellipse(p.c, xs[-1], cy, r, 8.0, 0.0)
    p.fill(DS, 1.0, preserve=True); p.stroke(GP, 1.0, 1.6)
    # state register beneath
    for k, x in enumerate(xs):
        p.line(x, 430, x, 444, NY, 0.7, 1.0)
        p.circle(x, 462, 3); p.fill(GP if k == states - 1 else NY, 1.0 if k == states - 1 else 0.6)
    p.line(xs[0], 430, xs[-1], 430, NY, 0.35, 1.0)
    lockup(p, "LENS 01 · WADA No. 166", "Styles", PAPER, NY)
    rep = p.gates("cover-styles")
    p.save(OUT + "cover-styles.png"); return rep


# ---------------------------------------------------------------- elements
def elements():
    # WADA No. 243: Raw Sienna, Ivory Buff, Olive Green, Slate Color
    RS, IB, OG, SL = "#bb7125", "#ebd3a2", "#6b7140", "#34454c"
    p = Plate(W, H, NAVY)
    cols, rows = 8, 3
    cw, ch, gap = 76, 76, 12
    gx0 = 1380 - cols * cw - (cols - 1) * gap
    gy0 = 300 - (rows * ch + (rows - 1) * gap) / 2
    total = cols * rows
    for i in range(total):
        cI, rI = i % cols, i // cols
        x = gx0 + cI * (cw + gap); y = gy0 + rI * (ch + gap)
        t = i / (total - 1)
        p.c.rectangle(x, y, cw, ch)
        if i == total - 1:
            p.fill(SL, 1.0, preserve=True); p.stroke(IB, 0.9, 1.0)
        else:
            p.fill(SL, 0.35 + 0.35 * t, preserve=True); p.stroke(IB, 0.22, 1.0)
        # a single element crossing its cell: eased x, scale breathes
        u = REST(t)
        ex = x + 18 + (cw - 36) * u
        ey = y + ch / 2
        rr = 6 + 6 * math.sin(math.pi * u)
        p.circle(ex, ey, rr)
        if i == total - 1:
            p.fill(RS, 1.0, preserve=True); p.stroke(IB, 1.0, 1.2)
        else:
            p.fill(OG, 0.9, preserve=True); p.stroke(IB, 0.45 + 0.5 * t, 1.0)
    lockup(p, "LENS 02 · WADA No. 243", "Elements", PAPER, IB)
    rep = p.gates("cover-elements")
    p.save(OUT + "cover-elements.png"); return rep


# ---------------------------------------------------------------- execution
def execution():
    # WADA No. 339: Ochraceous Salmon, English Red, Light Glaucous Blue, Violet Blue
    OS, ER, LG, VB = "#d8a37b", "#d96629", "#a5c8d1", "#40456a"
    p = Plate(W, H, NAVY)
    x0, x1 = 700, 1380
    tracks = 5
    th, tg = 30, 18
    y0 = 300 - (tracks * th + (tracks - 1) * tg) / 2
    beats = 16
    bw = (x1 - x0) / beats
    # beat grid
    for b in range(beats + 1):
        x = x0 + b * bw
        p.line(x, y0 - 30, x, y0 + tracks * th + (tracks - 1) * tg + 18, LG, 0.30 if b % 4 == 0 else 0.10, 1.0)
    for b in range(beats + 1):
        x = x0 + b * bw
        p.line(x, y0 - 44, x, y0 - 36 if b % 4 else y0 - 50, LG, 0.7, 1.0)
    keys = [
        [0, 4, 6, 7, 8],
        [2, 6, 10],
        [4, 5, 8, 12, 13],
        [1, 9, 11, 14],
        [3, 7, 12, 15, 16],
    ]
    for tr in range(tracks):
        y = y0 + tr * (th + tg)
        p.c.rectangle(x0, y, x1 - x0, th); p.fill(VB, 0.55)
        ks = keys[tr]
        for a, b in zip(ks, ks[1:]):
            p.line(x0 + a * bw, y + th / 2, x0 + b * bw, y + th / 2, LG, 0.45, 1.0)
        for k in ks:
            kx, ky, d = x0 + k * bw, y + th / 2, 7
            c = p.c
            c.move_to(kx, ky - d); c.line_to(kx + d, ky); c.line_to(kx, ky + d); c.line_to(kx - d, ky); c.close_path()
            p.fill(NAVY, 1.0, preserve=True); p.stroke(LG, 0.95, 1.2)
    # playhead
    ph = x0 + 10.5 * bw
    ytop = y0 - 58; ybot = y0 + tracks * th + (tracks - 1) * tg + 30
    p.line(ph, ytop + 10, ph, ybot, ER, 1.0, 1.4)
    c = p.c
    c.move_to(ph - 7, ytop); c.line_to(ph + 7, ytop); c.line_to(ph, ytop + 10); c.close_path(); p.fill(ER, 1.0)
    lockup(p, "LENS 03 · WADA No. 339", "Execution", PAPER, OS)
    rep = p.gates("cover-execution")
    p.save(OUT + "cover-execution.png"); return rep


# ---------------------------------------------------------------- quality (light mode)
def quality():
    # WADA No. 84: Seashell Pink, Deep Slate Green  — paper ground; colour is the fill
    SP, DS = "#fdd4bd", "#112f2c"
    p = Plate(W, H, PAPER)
    x0, x1 = 720, 1380
    wl = 168
    N = 48
    bw = (x1 - x0) / N
    budget = 16.7
    scale = 15.0  # px per ms
    import random
    random.seed(296)
    p.line(x0, wl, x1, wl, DS, 1.0, 1.0)
    for i in range(N):
        ms = 11.2 + 2.6 * math.sin(i * 0.55) + random.uniform(-1.2, 1.2)
        if i == 31: ms = 15.9
        x = x0 + i * bw + 2
        h = ms * scale
        p.c.rectangle(x, wl + 1, bw - 4, h * 0.0 + (h - 1)); p.fill(SP, 1.0, preserve=True); p.stroke(DS, 0.55, 0.8)
    by = wl + budget * scale
    p.line(x0, by, x1, by, DS, 0.9, 1.0, dash=[4, 4])
    p.line(x0 - 14, by, x0 - 4, by, DS, 1.0, 1.0)
    lockup(p, "LENS 04 · WADA No. 84", "Quality", DS, DS)
    rep = p.gates("cover-quality")
    p.save(OUT + "cover-quality.png"); return rep


# ---------------------------------------------------------------- engines
def engines():
    # WADA No. 207: Sudan Brown, Glaucous Green, Black
    SB, GG, BK = "#a36752", "#b4cdc2", "#111314"
    p = Plate(W, H, NAVY)
    cx, cy, R = 800, 300, 120
    p.circle(cx, cy, R); p.fill(BK, 1.0, preserve=True); p.stroke(GG, 0.8, 1.2)
    p.circle(cx, cy, R + 14); p.stroke(GG, 0.25, 1.0)
    # onion-skin arm
    phases = 12
    for k in range(phases):
        a = -2 * math.pi * k / phases
        al = 0.15 + 0.6 * k / (phases - 1)
        p.line(cx, cy, cx + R * math.cos(a), cy + R * math.sin(a), GG, al, 1.0)
        p.circle(cx + R * math.cos(a), cy + R * math.sin(a), 3); p.fill(GG, al)
    p.circle(cx, cy, 3); p.fill(GG, 1.0)
    # trace: y = sin(theta) sampled as frames
    tx0, tx1 = 980, 1380
    p.line(tx0, cy, tx1, cy, GG, 0.3, 1.0)
    c = p.c
    c.move_to(tx0, cy)
    for k in range(1, 401):
        u = k / 400
        c.line_to(tx0 + (tx1 - tx0) * u, cy - R * math.sin(2 * math.pi * u))
    p.stroke(GG, 0.5, 1.0)
    for k in range(25):
        u = k / 24
        x = tx0 + (tx1 - tx0) * u; y = cy - R * math.sin(2 * math.pi * u)
        p.line(x, cy, x, y, GG, 0.18, 1.0)
        p.circle(x, y, 2.6); p.fill(GG, 0.9)
    # projector from arm tip at phase 0 to trace start
    p.line(cx + R, cy, tx0, cy, SB, 1.0, 1.2, dash=[3, 4])
    p.circle(cx + R, cy, 5); p.fill(SB, 1.0)
    p.circle(tx0, cy, 5); p.fill(SB, 1.0)
    lockup(p, "LENS 05 · WADA No. 207", "Engines", PAPER, GG)
    rep = p.gates("cover-engines")
    p.save(OUT + "cover-engines.png"); return rep


if __name__ == "__main__":
    fns = {f.__name__: f for f in [notion, styles, elements, execution, quality, engines]}
    sel = sys.argv[1:] or list(fns)
    for n in sel:
        r = fns[n]()
        print(r["name"], "OK" if r["ok"] else "FAIL", r["margins"], [t for t in r["texts"]], {k: v for k, v in r.items() if k.endswith("fail")})
