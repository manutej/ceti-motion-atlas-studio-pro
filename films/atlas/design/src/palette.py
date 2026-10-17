import os, sys, json, itertools
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *
from skimage.color import rgb2lab, deltaE_ciede2000

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "") + "/"
TOK = {"deep-sea": NAVY, "night-tide": NIGHT, "bathysphere": BATHY, "paper": PAPER, "paper-soft": PAPER_SOFT,
       "fog": FOG, "copper": COPPER, "sage": SAGE, "peach": PEACH, "slate": SLATE_TK, "rust": RUST,
       "mist": MIST, "driftwood": DRIFT}
D = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "colors.json")))
ROWS = [(296, "PLATE I · HERO"), (279, "COVER · NOTION"), (166, "LENS 01 · STYLES"), (243, "LENS 02 · ELEMENTS"),
        (339, "LENS 03 · EXECUTION"), (84, "LENS 04 · QUALITY"), (207, "LENS 05 · ENGINES")]


def lab(h):
    return rgb2lab(np.array([[list(v / 255 for v in rgb255(h))]]))[0, 0]


TL = {k: lab(v) for k, v in TOK.items()}


def match(cols):
    """Unique nearest-token assignment (min total CIEDE2000)."""
    dm = {(c["hex"], k): float(deltaE_ciede2000(lab(c["hex"]), TL[k])) for c in cols for k in TOK}
    best = None
    for perm in itertools.permutations(TOK, len(cols)):
        s = sum(dm[(c["hex"], k)] for c, k in zip(cols, perm))
        if best is None or s < best[0]: best = (s, perm)
    return [(k, dm[(c["hex"], k)]) for c, k in zip(cols, best[1])]


def build(light=False):
    W, H = 1600, 1000
    GND, TXT, MUT, OUTD = (PAPER, NAVY, DRIFT, OUT + "light/") if light else (NAVY, PAPER, FOG, OUT)
    p = Plate(W, H, GND)
    MX = 112
    colw, gut = 660, 56
    lab_w, cell = 124, 136
    sw = 56
    top = 268
    pitch = 168
    data = []
    for n, (combo, plate) in enumerate(ROWS):
        cols = [c for c in D if combo in c["combinations"]]
        data.append((combo, plate, cols, match(cols)))

    # geometry first (cairo), type after
    slots = []
    for n, (combo, plate, cols, m) in enumerate(data):
        col, row = n // 4, n % 4
        x0 = MX + col * (colw + gut)
        y0 = top + row * pitch
        slots.append((x0, y0))
        for i, (c, (tk, de)) in enumerate(zip(cols, m)):
            x = x0 + lab_w + i * cell
            p.c.rectangle(x, y0, sw, sw); p.fill(c["hex"], 1.0, preserve=True); p.stroke(MUT, 0.35, 1.0)
            p.c.rectangle(x, y0 + sw + 4, sw, 6); p.fill(TOK[tk], 1.0, preserve=True); p.stroke(MUT, 0.35, 1.0)
    # 8th slot: the CETI ground itself
    gx0, gy0 = MX + (colw + gut), top + 3 * pitch
    for i, tk in enumerate(["deep-sea", "paper", "copper", "slate"]):
        x = gx0 + lab_w + i * cell
        p.c.rectangle(x, gy0, sw, sw); p.fill(TOK[tk], 1.0, preserve=True); p.stroke(MUT, 0.35, 1.0)
    # header hairline + column rule
    p.line(MX, 214, W - MX, 214, MUT, 0.35, 1.0)
    p.line(MX + colw + gut / 2, top, MX + colw + gut / 2, top + 3 * pitch + 104, MUT, 0.18, 1.0)

    # ---- type ----
    p.text(MX, 112, "CETI · PLATE II · CHROMATIC KEY", mono(13, bold=True), TXT, track=0.2)
    p.text(W - MX, 112, "WADA · Nos. 84–339", mono(13), MUT, track=0.2, anchor="r")
    p.text(MX - 3, 182, "Seven combinations, one sea", fraunces(54, 300), TXT, track=-0.02)
    p.text(W - MX, 182, "SQUARE = WADA   ·   BAR = NEAREST CETI TOKEN, ΔE₀₀".replace("ΔE₀₀", "dE2000"), mono(10), MUT, track=0.14, anchor="r")
    nm, hx = mono(9.5), mono(9.5)
    for n, ((combo, plate, cols, m), (x0, y0)) in enumerate(zip(data, slots)):
        p.text(x0 - 1, y0 + 30, f"No. {combo}", fraunces(28, 300), TXT, track=-0.01)
        p.text(x0, y0 + 54, plate.split(" · ")[0], mono(9.5, bold=True), MUT, track=0.18)
        if " · " in plate:
            p.text(x0, y0 + 70, plate.split(" · ")[1], mono(9.5, bold=True), MUT, track=0.18)
        for i, (c, (tk, de)) in enumerate(zip(cols, m)):
            x = x0 + lab_w + i * cell
            yb = y0 + sw + 32
            p.text(x, yb, c["name"].upper().replace("SULPHER", "SULPHER"), nm, TXT, track=0.04, pad=3)
            p.text(x, yb + 15, c["hex"].upper(), hx, MUT, track=0.06, pad=3)
            p.text(x, yb + 30, f"{tk} {de:.1f}", hx, MUT, track=0.06, pad=3)
    p.text(gx0 - 1, gy0 + 30, "CETI", fraunces(28, 300), TXT, track=-0.01)
    p.text(gx0, gy0 + 54, "GROUND", mono(9.5, bold=True), MUT, track=0.18)
    p.text(gx0, gy0 + 70, "+ ACCENTS", mono(9.5, bold=True), MUT, track=0.18)
    for i, tk in enumerate(["deep-sea", "paper", "copper", "slate"]):
        x = gx0 + lab_w + i * cell
        yb = gy0 + sw + 32
        p.text(x, yb, tk.upper(), nm, TXT, track=0.04, pad=3)
        p.text(x, yb + 15, TOK[tk].upper(), hx, MUT, track=0.06, pad=3)
    rep = p.gates("plate-palette", pad=3)
    p.save(OUTD + "plate-palette.png")
    return rep, data


if __name__ == "__main__":
    rep, data = build(light="light" in sys.argv)
    print(rep["ok"], rep["margins"], [t for t in rep["texts"] if t[2] or t[1] < 4.5], {k: v for k, v in rep.items() if k.endswith("fail")})
    for combo, plate, cols, m in data:
        print(combo, [(c["name"], k, round(d, 1)) for c, (k, d) in zip(cols, m)])
