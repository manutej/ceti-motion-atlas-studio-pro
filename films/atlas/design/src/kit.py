"""Kinetic Hydrography render kit: cairo geometry at 2x, Pillow type, machine gates."""
import io, math
import cairo, cairosvg
import numpy as np
from PIL import Image, ImageDraw, ImageFont

S = 2  # supersample
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(_HERE, "..", "fonts") + "/"
BRAND = os.path.join(_HERE, "..", "..", "brand") + "/"

# CETI tokens
NAVY = "#1A1F2E"; PAPER = "#F5EFE3"; FOG = "#B8B0A1"; RULE = "#2A3142"
INK = "#1A1F2E"; SLATE_TK = "#324555"; DRIFT = "#5C5447"
COPPER = "#A67756"; SAGE = "#7A9171"; PEACH = "#D88B5C"; RUST = "#8C4A2E"
PAPER_SOFT = "#E8DFCB"; NIGHT = "#262721"; MIST = "#95A8B0"; BATHY = "#0F1320"


def rgb(h, a=1.0):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (a,)


def rgb255(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def lum(h):
    c = [v / 255 for v in rgb255(h)]
    c = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contrast(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)


# ---------- easing ----------
def bezier(p1x, p1y, p2x, p2y):
    def bx(u): return 3 * (1 - u) ** 2 * u * p1x + 3 * (1 - u) * u * u * p2x + u ** 3
    def by(u): return 3 * (1 - u) ** 2 * u * p1y + 3 * (1 - u) * u * u * p2y + u ** 3
    def f(x):
        lo, hi = 0.0, 1.0
        for _ in range(60):
            m = (lo + hi) / 2
            if bx(m) < x: lo = m
            else: hi = m
        return by((lo + hi) / 2)
    return f


GLASER = bezier(0.22, 1, 0.36, 1)   # --ease-glaser, the house ease
DEFER = bezier(0.25, 0.46, 0.45, 0.94)
REST = bezier(0.4, 0, 0.6, 1)


# ---------- fonts ----------
def fraunces(px, wght=300):
    f = ImageFont.truetype(FONTS + "Fraunces-Italic[SOFT,WONK,opsz,wght].ttf", int(round(px * S)))
    f.set_variation_by_axes([max(9, min(144, px)), wght, 0, 1])
    return f


def dmsans(px, wght=400):
    f = ImageFont.truetype(FONTS + "DMSans[opsz,wght].ttf", int(round(px * S)))
    f.set_variation_by_axes([max(9, min(40, px)), wght])
    return f


def mono(px, bold=False):
    return ImageFont.truetype(FONTS + ("SpaceMono-Bold.ttf" if bold else "SpaceMono-Regular.ttf"), int(round(px * S)))


# ---------- canvas ----------
class Plate:
    def __init__(self, w, h, ground):
        self.w, self.h, self.ground = w, h, ground
        self.surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, w * S, h * S)
        self.c = cairo.Context(self.surf)
        self.c.scale(S, S)
        self.c.set_source_rgba(*rgb(ground)); self.c.paint()
        self.c.set_line_cap(cairo.LINE_CAP_ROUND)
        self.c.set_line_join(cairo.LINE_JOIN_ROUND)
        self.texts = []   # (bbox2x, color, label)
        self.marks = []   # svg marks to paste: (svgpath, color, x, y, width)
        self.img = None

    # geometry helpers (1x coords)
    def stroke(self, color, a=1.0, w=1.0, dash=None):
        c = self.c
        c.set_source_rgba(*rgb(color, a)); c.set_line_width(w)
        c.set_dash(dash or [])
        c.stroke(); c.set_dash([])

    def fill(self, color, a=1.0, preserve=False):
        self.c.set_source_rgba(*rgb(color, a))
        (self.c.fill_preserve if preserve else self.c.fill)()

    def line(self, x0, y0, x1, y1, color, a=1.0, w=1.0, dash=None):
        self.c.move_to(x0, y0); self.c.line_to(x1, y1); self.stroke(color, a, w, dash)

    def circle(self, x, y, r):
        self.c.new_sub_path(); self.c.arc(x, y, r, 0, 2 * math.pi)

    def clip_out(self, holes):
        """Begin drawing outside the given holes: holes is a callable that adds paths."""
        c = self.c
        c.save(); c.new_path()
        c.rectangle(0, 0, self.w, self.h); holes(c)
        c.set_fill_rule(cairo.FILL_RULE_EVEN_ODD); c.clip(); c.set_fill_rule(cairo.FILL_RULE_WINDING)

    def unclip(self):
        self.c.restore()

    def mark(self, svg, color, x, y, width):
        self.marks.append((svg, color, x, y, width))

    def _raster(self):
        self.surf.flush()
        im = Image.frombuffer("RGBA", (self.w * S, self.h * S), bytes(self.surf.get_data()), "raw", "BGRA", 0, 1).convert("RGB")
        for svg, color, x, y, width in self.marks:
            s = open(BRAND + svg).read().replace("<svg ", f'<svg color="{color}" ', 1)
            png = cairosvg.svg2png(bytestring=s.encode(), output_width=int(width * S))
            m = Image.open(io.BytesIO(png)).convert("RGBA")
            im.paste(m, (int(x * S), int(y * S)), m)
        self.base = im.copy()
        self.img = im
        self.draw = ImageDraw.Draw(self.img)

    def text(self, x, y, s, font, color, track=0.0, anchor="l", label=None, pad=None):
        """x,y in 1x; y is baseline; anchor l/m/r; track in em."""
        if self.img is None: self._raster()
        tr = track * font.size
        n = len(s)
        width = font.getlength(s) + tr * (n - 1)
        X = x * S - {"l": 0, "m": width / 2, "r": width}[anchor]
        Y = y * S
        box = None
        if tr == 0:
            self.draw.text((X, Y), s, font=font, fill=rgb255(color), anchor="ls")
            box = self.draw.textbbox((X, Y), s, font=font, anchor="ls")
        for i, ch in enumerate(s if tr else ""):
            cx = X + font.getlength(s[:i]) + tr * i
            if ch != " ":
                self.draw.text((cx, Y), ch, font=font, fill=rgb255(color), anchor="ls")
                b = self.draw.textbbox((cx, Y), ch, font=font, anchor="ls")
                box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
        self.texts.append((box, color, label or s, pad))
        return width / S

    @staticmethod
    def measure(s, font, track=0.0):
        return (font.getlength(s) + track * font.size * (len(s) - 1)) / S

    # ---------- gates ----------
    def gates(self, name, pad=10, band=None, margin=0.06):
        if self.img is None: self._raster()
        g = np.array(rgb255(self.ground))
        base = np.asarray(self.base).astype(int)
        report = {"name": name, "texts": [], "ok": True}
        for box, color, label, tpad in self.texts:
            x0, y0, x1, y1 = [int(round(v)) for v in box]
            P = int((pad if tpad is None else tpad) * S)
            reg = base[max(0, y0 - P):y1 + P, max(0, x0 - P):x1 + P]
            dirty = int((np.abs(reg - g).sum(axis=2) > 6).sum())
            cr = contrast(color, self.ground)
            ok = dirty == 0 and cr >= 4.5
            report["texts"].append((label[:34], round(cr, 2), dirty))
            if not ok: report["ok"] = False
        bxs = [t[0] for t in self.texts]
        for i in range(len(bxs)):
            for j in range(i + 1, len(bxs)):
                a, b = bxs[i], bxs[j]
                gap = 4 * S
                if a[0] < b[2] + gap and b[0] < a[2] + gap and a[1] < b[3] + gap and b[1] < a[3] + gap:
                    report["ok"] = False; report.setdefault("text_overlap_fail", []).append((self.texts[i][2], self.texts[j][2]))
        final = np.asarray(self.img).astype(int)
        mask = np.abs(final - g).sum(axis=2) > 6
        ys, xs = np.where(mask)
        bx = (xs.min() / S, ys.min() / S, (self.w * S - xs.max()) / S, (self.h * S - ys.max()) / S)
        mx, my = margin * self.w, margin * self.h
        report["margins"] = tuple(round(v, 1) for v in bx)
        if bx[0] < mx or bx[2] < mx or bx[1] < my or bx[3] < my: report["ok"] = False; report["margin_fail"] = True
        if band:
            if bx[1] < band[0] or (self.h - bx[3]) > band[1]: report["ok"] = False; report["band_fail"] = True
        return report

    def save(self, path, path2x=None):
        if self.img is None: self._raster()
        if path2x: self.img.save(path2x)
        self.img.resize((self.w, self.h), Image.LANCZOS).save(path, optimize=True)
