import os
"""Light set: 'light mode: the color is the fill'. Same compositions, same Wada keys, paper ground."""
import math, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *
from covers import superellipse

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "light") + "/"
TX = 120


def lockup(p, eyebrow, word, ink, accent, word_y=352, x=TX, k=1.0):
    p.text(x, word_y - 118 * k, eyebrow, mono(13 * k, bold=True), accent, track=0.2)
    p.text(x - 4 * k, word_y, word, fraunces(120 * k, 300), ink, track=-0.02)


# ================================================================ hero geometry (No. 296)
SUL, SAL, UMB, SLA = "#f5ecc2", "#d8a37b", "#71502f", "#34454c"


def hero_geometry(p, cx, cy, R, labels=True):
    k = R / 500
    c = p.c
    for d in range(360):
        a = math.radians(d - 90)
        if d % 10 == 0: L, al, w = 22, 0.80, 1.1
        elif d % 5 == 0: L, al, w = 13, 0.50, 1.0
        else: L, al, w = 7, 0.30, 0.8
        L *= k
        p.line(cx + R * math.cos(a), cy + R * math.sin(a),
               cx + (R + L) * math.cos(a), cy + (R + L) * math.sin(a), SLA, al, w)
    p.circle(cx, cy, R); p.stroke(SLA, 0.55, 1.0)
    RI = R - 46 * k
    p.circle(cx, cy, RI); p.stroke(SLA, 0.22, 1.0)

    N, SPAN, r = 30, 300, 12 * k
    pts = []
    for i in range(N):
        t = i / (N - 1); ang = SPAN * GLASER(t)
        pts.append((t, ang, math.radians(ang - 90)))
    RT = (R + RI) / 2
    fa = pts[-1][2]; fx, fy = cx + RT * math.cos(fa), cy + RT * math.sin(fa)
    drawn = None
    for i, (t, ang, a) in enumerate(pts):
        x, y = cx + RT * math.cos(a), cy + RT * math.sin(a)
        last = i == N - 1
        if last or pts[i + 1][1] - ang >= 2.0:
            p.line(cx + (RI - 4 * k) * math.cos(a), cy + (RI - 4 * k) * math.sin(a),
                   cx + (RI - 16 * k) * math.cos(a), cy + (RI - 16 * k) * math.sin(a), UMB, 0.30 + 0.6 * t, 1.0)
        crowd = (not last) and (math.hypot(x - fx, y - fy) < 2 * r + 2 or
                                (drawn and math.hypot(x - drawn[0], y - drawn[1]) < 5))
        if last:
            p.circle(x, y, r); p.fill(UMB, 1.0)
            p.circle(x, y, r + 9 * k); p.stroke(UMB, 0.55, 0.9)
        elif not crowd:
            # colour is the fill: salmon discs, density builds with time
            p.circle(x, y, r); p.fill(SAL, 0.30 + 0.45 * t ** 1.3)
            drawn = (x, y)

    s = 280 * k
    x0, y0, x1, y1 = cx - s, cy - s, cx + s, cy + s
    c.rectangle(x0, y0, 2 * s, 2 * s); p.fill(SUL, 1.0)
    for j in range(1, 10):
        gx = x0 + 2 * s * j / 10; gy = y0 + 2 * s * j / 10
        p.line(gx, y0, gx, y1, SLA, 0.13, 0.8)
        p.line(x0, gy, x1, gy, SLA, 0.13, 0.8)
    c.rectangle(x0, y0, 2 * s, 2 * s); p.stroke(SLA, 0.55, 1.0)
    for i, (t, ang, a) in enumerate(pts):
        v = ang / SPAN
        tx = x0 + 2 * s * t
        p.line(tx, y1 + 8 * k, tx, y1 + 20 * k, SLA, 0.6, 1.0)
        ty = y1 - 2 * s * v
        nxt = pts[i + 1][1] / SPAN if i < N - 1 else None
        if nxt is None or 2 * s * (nxt - v) >= 4:
            p.line(x0 - 8 * k, ty, x0 - 20 * k, ty, UMB, 0.35 + 0.6 * t, 1.0)
    c.move_to(x0, y1)
    for j in range(1, 401):
        t = j / 400
        c.line_to(x0 + 2 * s * t, y1 - 2 * s * GLASER(t))
    p.stroke(UMB, 1.0, 1.8)
    for i, (t, ang, a) in enumerate(pts):
        px, py = x0 + 2 * s * t, y1 - 2 * s * (ang / SPAN)
        p.circle(px, py, 2.6 if i < N - 1 else 4.5); p.fill(UMB if i == N - 1 else SLA, 1.0)

    def ring_labels():
        for deg, lab in [(0, "000"), (90, "090"), (180, "180"), (270, "270")]:
            a = math.radians(deg - 90)
            rr = R + 50 * k
            lx, ly = cx + rr * math.cos(a), cy + rr * math.sin(a)
            anc = {0: "m", 90: "l", 180: "m", 270: "r"}[deg]
            dy = {0: -2, 90: 4, 180: 14, 270: 4}[deg]
            p.text(lx + {90: -8, 270: 8}.get(deg, 0), ly + dy, lab, mono(11), NAVY, track=0.18, anchor=anc, pad=4)
    return ring_labels


def hero():
    W, H = 1600, 2000
    p = Plate(W, H, PAPER)
    MX = 128
    labels = hero_geometry(p, 800, 806, 500)
    p.mark("whale-mark.svg", NAVY, MX, 1812, 72)
    p.text(MX, 176, "CETI · PLATE I", mono(13, bold=True), NAVY, track=0.2)
    p.text(W - MX, 176, "WADA · No. 296", mono(13), UMB, track=0.2, anchor="r")
    labels()
    p.text(MX - 6, 1640, "Motion Atlas", fraunces(208, 300), NAVY, track=-0.02)
    p.text(MX, 1716, "A GRAPH-MEMORY WIKI · FRONTIER MOTION GRAPHICS", mono(13, bold=True), UMB, track=0.2)
    p.text(W - MX, 1852, "FRAME = f(t)", mono(12), NAVY, track=0.2, anchor="r")
    p.text(MX + 96, 1852, "CETIAI.CO", mono(12), NAVY, track=0.2)
    rep = p.gates("light/plate-hero")
    p.save(OUT + "plate-hero.png"); return rep


def hero_video():
    W, H = 1920, 1080
    p = Plate(W, H, PAPER)
    MX = 160
    labels = hero_geometry(p, 1350, 540, 368)
    p.mark("whale-mark.svg", NAVY, MX, 880, 64)
    p.text(MX, 214, "CETI · PLATE I", mono(14, bold=True), NAVY, track=0.2)
    labels()
    p.text(MX - 5, 592, "Motion", fraunces(150, 300), NAVY, track=-0.02)
    p.text(MX - 5, 738, "Atlas", fraunces(150, 300), NAVY, track=-0.02)
    p.text(MX, 806, "FRONTIER MOTION GRAPHICS", mono(13, bold=True), UMB, track=0.2)
    p.text(MX + 88, 914, "CETIAI.CO", mono(12), NAVY, track=0.2)
    p.text(W - MX, 214, "WADA · No. 296", mono(14), UMB, track=0.2, anchor="r")
    rep = p.gates("light/hero-1920x1080", margin=0.05)
    p.save(OUT + "hero-1920x1080.png"); return rep


# ================================================================ notion / title (No. 279)
RS9, VC, EC, TY = "#bb7125", "#eea78c", "#c2ae93", "#12354e"


def notion_geometry(p):
    x0, x1, base, N, R0 = 720, 1380, 430, 24, 9
    for b in range(4):
        if b % 2 == 0:
            bx = x0 + (x1 - x0) * b / 4
            p.c.rectangle(bx, 150, (x1 - x0) / 4, base - 150); p.fill(EC, 0.24)
    p.line(x0, base, x1, base, TY, 0.75, 1.0)
    for j in range(97):
        x = x0 + (x1 - x0) * j / 96
        p.line(x, base, x, base + (12 if j % 8 == 0 else 6), TY, 0.7 if j % 8 == 0 else 0.35, 1.0)

    def pos(t):
        u = GLASER(t)
        return x0 + 20 + (x1 - x0 - 40) * u, 300 - 108 * math.sin(math.pi * u)
    keep, allp = [], [pos(i / (N - 1)) for i in range(N)]
    for i in range(N - 1, -1, -1):
        x, y = allp[i]
        if not keep or all(math.hypot(x - kx, y - ky) >= 2 * R0 + 6 for kx, ky, _ in keep):
            keep.append((x, y, i))

    def holes(c):
        for x, y, i in keep:
            c.new_sub_path(); c.arc(x, y, R0 + 5, 0, 2 * math.pi)
    p.clip_out(holes)
    c = p.c; c.move_to(*pos(0))
    for j in range(1, 301): c.line_to(*pos(j / 300))
    p.stroke(TY, 0.45, 1.0, dash=[2, 5])
    for x, y, i in keep:
        p.line(x, y, x, base - 2, TY, 0.12 + 0.30 * i / (N - 1), 0.9)
    p.unclip()
    for x, y, i in keep:
        t = i / (N - 1)
        p.circle(x, y, R0)
        if i == N - 1: p.fill(RS9, 1.0)
        else: p.fill(VC, 0.55 + 0.45 * t)


def notion():
    p = Plate(1500, 600, PAPER)
    notion_geometry(p)
    p.mark("whale-mark.svg", TY, TX, 400, 56)
    lockup(p, "CETI · WADA No. 279", "Motion Atlas", NAVY, TY)
    rep = p.gates("light/cover-notion", band=(100, 500))
    p.save(OUT + "cover-notion.png"); return rep


def title_video():
    W, H = 1920, 1080
    p = Plate(W, H, PAPER)
    k, oy = 1.28, 156
    p.c.save(); p.c.translate(0, oy); p.c.scale(k, k)
    notion_geometry(p)
    p.c.restore()
    p.mark("whale-mark.svg", TY, TX * k, 400 * k + oy, 56 * k)
    lockup(p, "CETI · WADA No. 279", "Motion Atlas", NAVY, TY, word_y=352 * k + oy, x=TX * k, k=k)
    rep = p.gates("light/title-1920x1080", margin=0.05)
    p.save(OUT + "title-1920x1080.png"); return rep


# ================================================================ styles (No. 166)
def styles():
    GP, NY, DS = "#f48067", "#fbe6a0", "#112f2c"
    p = Plate(1500, 600, PAPER)
    states, cy, r = 7, 300, 92
    xs = [680 + j * 100 for j in range(states)]
    p.clip_out(lambda c: superellipse(c, xs[-1], cy, r + 7, 8.0, 0.0))
    for j, x in enumerate(xs[:-1]):
        t = j / (states - 1)
        superellipse(p.c, x, cy, r, 2 + 6 * REST(t), math.radians(45) * (1 - REST(t)))
        p.stroke(DS, 0.18 + 0.42 * t, 1.0)
    p.unclip()
    superellipse(p.c, xs[-1], cy, r, 8.0, 0.0)
    p.fill(GP, 1.0)
    for j, x in enumerate(xs):
        p.line(x, 430, x, 444, DS, 0.6, 1.0)
        p.circle(x, 462, 3); p.fill(GP if j == states - 1 else DS, 1.0 if j == states - 1 else 0.5)
    p.line(xs[0], 430, xs[-1], 430, DS, 0.35, 1.0)
    lockup(p, "LENS 01 · WADA No. 166", "Styles", NAVY, DS)
    rep = p.gates("light/cover-styles")
    p.save(OUT + "cover-styles.png"); return rep


# ================================================================ elements (No. 243)
def elements():
    RS, IB, OG, SL = "#bb7125", "#ebd3a2", "#6b7140", "#34454c"
    p = Plate(1500, 600, PAPER)
    cols, rows, cw, ch, gap = 8, 3, 76, 76, 12
    gx0 = 1380 - cols * cw - (cols - 1) * gap
    gy0 = 300 - (rows * ch + (rows - 1) * gap) / 2
    total = cols * rows
    for i in range(total):
        x = gx0 + (i % cols) * (cw + gap); y = gy0 + (i // cols) * (ch + gap)
        t = i / (total - 1)
        p.c.rectangle(x, y, cw, ch)
        if i == total - 1: p.fill(SL, 1.0)
        else: p.fill(IB, 0.35 + 0.55 * t, preserve=True); p.stroke(SL, 0.18, 1.0)
        u = REST(t)
        ex, ey, rr = x + 18 + (cw - 36) * u, y + ch / 2, 6 + 6 * math.sin(math.pi * u)
        p.circle(ex, ey, rr)
        p.fill(RS if i == total - 1 else OG, 1.0 if i == total - 1 else 0.85)
    lockup(p, "LENS 02 · WADA No. 243", "Elements", NAVY, SL)
    rep = p.gates("light/cover-elements")
    p.save(OUT + "cover-elements.png"); return rep


# ================================================================ execution (No. 339)
def execution():
    OS, ER, LG, VB = "#d8a37b", "#d96629", "#a5c8d1", "#40456a"
    p = Plate(1500, 600, PAPER)
    x0, x1, tracks, th, tg, beats = 700, 1380, 5, 30, 18, 16
    y0 = 300 - (tracks * th + (tracks - 1) * tg) / 2
    bw = (x1 - x0) / beats
    yb = y0 + tracks * th + (tracks - 1) * tg
    for tr in range(tracks):
        p.c.rectangle(x0, y0 + tr * (th + tg), x1 - x0, th); p.fill(LG, 0.42)
    for b in range(beats + 1):
        x = x0 + b * bw
        p.line(x, y0 - 30, x, yb + 18, VB, 0.30 if b % 4 == 0 else 0.10, 1.0)
        p.line(x, y0 - 44, x, y0 - 36 if b % 4 else y0 - 50, VB, 0.7, 1.0)
    keys = [[0, 4, 6, 7, 8], [2, 6, 10], [4, 5, 8, 12, 13], [1, 9, 11, 14], [3, 7, 12, 15, 16]]
    for tr in range(tracks):
        y = y0 + tr * (th + tg); ks = keys[tr]
        for a, b in zip(ks, ks[1:]):
            p.line(x0 + a * bw, y + th / 2, x0 + b * bw, y + th / 2, VB, 0.5, 1.0)
        for kk in ks:
            kx, ky, d = x0 + kk * bw, y + th / 2, 7
            c = p.c
            c.move_to(kx, ky - d); c.line_to(kx + d, ky); c.line_to(kx, ky + d); c.line_to(kx - d, ky); c.close_path()
            p.fill(OS, 1.0, preserve=True); p.stroke(VB, 0.9, 1.0)
    ph = x0 + 10.5 * bw; ytop = y0 - 58
    p.line(ph, ytop + 10, ph, yb + 30, ER, 1.0, 1.4)
    c = p.c
    c.move_to(ph - 7, ytop); c.line_to(ph + 7, ytop); c.line_to(ph, ytop + 10); c.close_path(); p.fill(ER, 1.0)
    lockup(p, "LENS 03 · WADA No. 339", "Execution", NAVY, VB)
    rep = p.gates("light/cover-execution")
    p.save(OUT + "cover-execution.png"); return rep


# ================================================================ quality (No. 84) — paper-soft ground, bars filled
def quality():
    SP, DS = "#fdd4bd", "#112f2c"
    p = Plate(1500, 600, PAPER_SOFT)
    x0, x1, wl, N, budget, scale = 720, 1380, 168, 48, 16.7, 15.0
    bw = (x1 - x0) / N
    random.seed(296)
    for i in range(N):
        ms = 11.2 + 2.6 * math.sin(i * 0.55) + random.uniform(-1.2, 1.2)
        if i == 31: ms = 15.9
        p.c.rectangle(x0 + i * bw + 2, wl + 1, bw - 4, ms * scale - 1)
        p.fill(SP, 1.0, preserve=True); p.stroke(DS, 0.5, 0.8)
    p.line(x0, wl, x1, wl, DS, 1.0, 1.0)
    by = wl + budget * scale
    p.line(x0, by, x1, by, DS, 0.9, 1.0, dash=[4, 4])
    p.line(x0 - 14, by, x0 - 4, by, DS, 1.0, 1.0)
    lockup(p, "LENS 04 · WADA No. 84", "Quality", DS, DS)
    rep = p.gates("light/cover-quality")
    p.save(OUT + "cover-quality.png"); return rep


# ================================================================ engines (No. 207)
def engines():
    SB, GG, BK = "#a36752", "#b4cdc2", "#111314"
    p = Plate(1500, 600, PAPER)
    cx, cy, R = 800, 300, 120
    p.circle(cx, cy, R); p.fill(GG, 0.85)
    p.circle(cx, cy, R + 14); p.stroke(BK, 0.22, 1.0)
    for j in range(12):
        a = -2 * math.pi * j / 12
        al = 0.15 + 0.65 * j / 11
        p.line(cx, cy, cx + R * math.cos(a), cy + R * math.sin(a), BK, al, 1.0)
        p.circle(cx + R * math.cos(a), cy + R * math.sin(a), 3); p.fill(BK, al)
    p.circle(cx, cy, 3); p.fill(BK, 1.0)
    tx0, tx1 = 980, 1380
    p.line(tx0, cy, tx1, cy, BK, 0.3, 1.0)
    c = p.c; c.move_to(tx0, cy)
    for j in range(1, 401):
        u = j / 400; c.line_to(tx0 + (tx1 - tx0) * u, cy - R * math.sin(2 * math.pi * u))
    p.stroke(BK, 0.5, 1.0)
    for j in range(25):
        u = j / 24
        x, y = tx0 + (tx1 - tx0) * u, cy - R * math.sin(2 * math.pi * u)
        p.line(x, cy, x, y, GG, 1.0, 1.4)
        p.circle(x, y, 2.6); p.fill(BK, 0.85)
    p.line(cx + R, cy, tx0, cy, SB, 1.0, 1.2, dash=[3, 4])
    p.circle(cx + R, cy, 5); p.fill(SB, 1.0)
    p.circle(tx0, cy, 5); p.fill(SB, 1.0)
    lockup(p, "LENS 05 · WADA No. 207", "Engines", NAVY, BK)
    rep = p.gates("light/cover-engines")
    p.save(OUT + "cover-engines.png"); return rep


if __name__ == "__main__":
    import os; os.makedirs(OUT, exist_ok=True)
    fns = {f.__name__: f for f in [hero, hero_video, notion, title_video, styles, elements, execution, quality, engines]}
    for n in sys.argv[1:] or list(fns):
        r = fns[n]()
        bad = [t for t in r["texts"] if t[2] or t[1] < 4.5]
        print(r["name"], "OK" if r["ok"] else "FAIL", r["margins"], "min contrast", min(t[1] for t in r["texts"]), bad,
              {k: v for k, v in r.items() if k.endswith("fail")})
