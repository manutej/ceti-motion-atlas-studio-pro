import sys, glob
from PIL import Image, ImageDraw
files = sorted(glob.glob(sys.argv[1]))
cols = 3; w, h = 640, 360
rows = (len(files) + cols - 1) // cols
S = Image.new('RGB', (w * cols, h * rows), 'white')
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS)
    S.paste(im, ((i % cols) * w, (i // cols) * h))
    ImageDraw.Draw(S).text(((i % cols) * w + 6, (i // cols) * h + 4), f.split('/')[-1], fill=(255, 80, 80))
S.save(sys.argv[2])
