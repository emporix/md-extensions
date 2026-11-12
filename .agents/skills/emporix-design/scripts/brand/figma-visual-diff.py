#!/usr/bin/env python3
"""Compare two exports of the same Figma frame (baseline mode vs brand mode) at the same size.

    python3 figma-visual-diff.py before.png after.png --out DIR [--tiles 4] [--tile 960x640] [--threshold 24]

Needs Pillow only. Writes into DIR: diff-overview.png (changed pixels in red on the dimmed
"after" image), tile-N.png (before | after side by side for the tiles that changed most, native
resolution) and prints one JSON line: size, changed share, the grid of changed shares by area and
the chosen tiles. The two images must have the same size: export both with the same maxDimension
(at least the frame's longest side, so the export is not scaled).
"""
import argparse, json, os, sys
from PIL import Image, ImageChops

ap = argparse.ArgumentParser()
ap.add_argument('before'); ap.add_argument('after')
ap.add_argument('--out', required=True)
ap.add_argument('--tiles', type=int, default=4)
ap.add_argument('--tile', default='960x640')
ap.add_argument('--threshold', type=int, default=24)
a = ap.parse_args()

b = Image.open(a.before).convert('RGB')
f = Image.open(a.after).convert('RGB')
if b.size != f.size:
    sys.exit(f'sizes differ: {b.size} vs {f.size}; export both at the same size, unscaled')
os.makedirs(a.out, exist_ok=True)
tw, th = (int(x) for x in a.tile.split('x'))

diff = ImageChops.difference(b, f).convert('L')
mask = diff.point(lambda v: 255 if v > a.threshold else 0)
W, H = b.size
changed = mask.histogram()[255] / (W * H)

# overview: dimmed after image, changed pixels in red
dim = Image.blend(f, Image.new('RGB', f.size, 'white'), 0.65)
red = Image.new('RGB', f.size, (220, 30, 30))
over = Image.composite(red, dim, mask)
over.thumbnail((1600, 1600))
over.save(os.path.join(a.out, 'diff-overview.png'))

# changed share per tile
tiles = []
for y in range(0, H, th):
    for x in range(0, W, tw):
        box = (x, y, min(x + tw, W), min(y + th, H))
        m = mask.crop(box)
        n = m.histogram()[255] / max(1, m.size[0] * m.size[1])
        tiles.append({'x': x, 'y': y, 'w': box[2] - x, 'h': box[3] - y, 'changed': round(n, 4)})
cols = (W + tw - 1) // tw
grid = [[t['changed'] for t in tiles[i:i + cols]] for i in range(0, len(tiles), cols)]
top = sorted(tiles, key=lambda t: -t['changed'])[: a.tiles]
for i, t in enumerate(top, 1):
    box = (t['x'], t['y'], t['x'] + t['w'], t['y'] + t['h'])
    pair = Image.new('RGB', (t['w'] * 2 + 8, t['h']), 'white')
    pair.paste(b.crop(box), (0, 0)); pair.paste(f.crop(box), (t['w'] + 8, 0))
    pair.save(os.path.join(a.out, f'tile-{i}.png'))
    t['file'] = f'tile-{i}.png'
print(json.dumps({'size': [W, H], 'changedShare': round(changed, 4), 'grid': grid, 'tiles': top}))
