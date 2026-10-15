"""Derive browser/shortcut icons from the approved logo; never redraw the mark.

Build-only dependency: Pillow==12.3.0. No runtime library or image service.
"""
from pathlib import Path
from PIL import Image, __version__

assert __version__ == '12.3.0', 'Use Pillow==12.3.0 for reproducible assets'
root = Path(__file__).resolve().parents[1]
target = root / 'assets/nomad360-icons'
target.mkdir(parents=True, exist_ok=True)
logo = Image.open(root / 'nomad360_wolf_open_circle.png').convert('RGBA')


def icon(size):
    # Retain the original proportions and transparent edges. The resulting
    # RGB canvas is opaque white, including under all source transparency.
    canvas = Image.new('RGBA', (size, size), 'white')
    image = logo.copy()
    edge = max(1, round(size * .02))
    image.thumbnail((size - 2*edge, size - 2*edge), Image.Resampling.LANCZOS)
    canvas.alpha_composite(image, ((size-image.width)//2, (size-image.height)//2))
    return canvas.convert('RGB')


for size in (180, 192, 512):
    icon(size).save(target / f'icon-{size}.png', optimize=True)
# Real multi-resolution Windows ICO. PNG entries are supported by Windows 10/11.
icon(256).save(target / 'nomad360.ico', format='ICO',
               sizes=[(n, n) for n in (16, 24, 32, 48, 64, 128, 256)])
