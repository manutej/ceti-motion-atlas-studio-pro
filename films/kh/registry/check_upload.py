# check_upload.py <downloaded.svg> <source.jpg> — decodes the JPEG inside a downloaded SVG and compares it byte-for-byte with the source
import base64, hashlib, re, sys
svg = open(sys.argv[1], encoding='utf-8', errors='replace').read()
m = re.search(r'base64,([A-Za-z0-9+/=\s]+)"', svg)
data = base64.b64decode(re.sub(r'\s+', '', m.group(1))) if m else b''
src = open(sys.argv[2], 'rb').read()
ok = hashlib.sha256(data).hexdigest() == hashlib.sha256(src).hexdigest()
print(('MATCH' if ok else 'MISMATCH'), len(data), 'vs', len(src), 'bytes')
sys.exit(0 if ok else 1)
