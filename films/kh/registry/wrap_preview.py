#!/usr/bin/env python3
"""wrap_preview.py previews/<id>.jpg [...] -> previews/<id>.svg (one-line) and <id>.w.svg (base64 wrapped at 64 cols).

Notion's API refuses binary uploads from this pipeline, so a preview JPEG is wrapped in an SVG data URI and
uploaded as text (notion-create-attachment), then downloaded back and byte-checked with check_upload.py.
The SVG wrappers are generated, not committed: their base64 trips GitHub secret scanning."""
import base64, sys, textwrap
from PIL import Image
for jpg in sys.argv[1:]:
    w, h = Image.open(jpg).size; b = base64.b64encode(open(jpg, 'rb').read()).decode()
    head = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><image width="{w}" height="{h}" href="data:image/jpeg;base64,'
    stem = jpg[:-4]
    open(stem + '.svg', 'w').write(head + b + '"/></svg>')
    open(stem + '.w.svg', 'w').write(head + '\n' + '\n'.join(textwrap.wrap(b, 64)) + '\n"/></svg>\n')
    print('wrapped', stem)
