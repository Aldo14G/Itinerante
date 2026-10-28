"""Encode approved photo derivatives. Never enlarge or overwrite source photographs."""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
sources = root / '_archive/reference-inputs/2026-10-27-official-interiors'
output = root / 'images/gallery'
names = ['estantes', 'rincon', 'encuentro', 'sala', 'mesa', 'mesa-compartida']
receipt = []
for number, name in enumerate(names, 1):
  source = sources / f'photo-{number:02}.jpg'
  with Image.open(source) as original:
    image = ImageOps.exif_transpose(original).convert('RGB')
    for width in ([480, 800, 1200, 1600] if image.width >= 1600 else [image.width]):
      resized = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
      suffix = f'-{width}' if image.width >= 1600 else ''
      target = output / f'oficial-{name}{suffix}.webp'
      resized.save(target, 'WEBP', quality=82, method=6)
      receipt.append({'source': source.relative_to(root).as_posix(), 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'output': target.relative_to(root).as_posix(), 'width': width, 'height': resized.height, 'bytes': target.stat().st_size})
(root / 'docs/official-photo-derivatives.json').write_text(json.dumps(receipt, indent=2), encoding='utf-8')
print(f'{len(receipt)} derivatives; sources unchanged; no enlargement')
