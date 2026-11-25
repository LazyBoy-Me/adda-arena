#!/usr/bin/env python3
"""Generate Adda Arena icons (no external assets)."""
from PIL import Image, ImageDraw
import os

OUT = os.path.join(os.path.dirname(__file__), 'web', 'icons')
os.makedirs(OUT, exist_ok=True)

C1 = (124, 77, 255)
C2 = (255, 77, 157)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make(size, padding_ratio=0.0):
    S = size * 4
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    # diagonal gradient
    grad = Image.new('RGB', (S, S))
    px = grad.load()
    for y in range(S):
        for x in range(S):
            t = (x + y) / (2 * S)
            px[x, y] = lerp(C1, C2, t)
    # rounded mask
    mask = Image.new('L', (S, S), 0)
    d = ImageDraw.Draw(mask)
    r = int(S * 0.22)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=r, fill=255)
    img.paste(grad, (0, 0), mask)

    dr = ImageDraw.Draw(img)
    # soft highlight
    hl = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    dh = ImageDraw.Draw(hl)
    dh.ellipse([-S * 0.35, -S * 0.55, S * 0.85, S * 0.35], fill=(255, 255, 255, 38))
    img.alpha_composite(hl)

    # speech bubble
    b = S * 0.64
    x0, y0 = (S - b) / 2, (S - b) / 2 - S * 0.03
    dr.rounded_rectangle([x0, y0, x0 + b, y0 + b * 0.78], radius=b * 0.20, fill=(255, 255, 255, 245))
    # tail
    tw = b * 0.20
    dr.polygon([(x0 + b * 0.28, y0 + b * 0.74),
                (x0 + b * 0.28 + tw, y0 + b * 0.74),
                (x0 + b * 0.24, y0 + b * 1.02)], fill=(255, 255, 255, 245))

    # three dots
    cy = y0 + b * 0.39
    drr = b * 0.075
    for i, cx in enumerate([x0 + b * 0.29, x0 + b * 0.50, x0 + b * 0.71]):
        dr.ellipse([cx - drr, cy - drr, cx + drr, cy + drr], fill=C2 if i == 1 else (90, 40, 160))

    # sparkle
    sx, sy, sr = S * 0.80, S * 0.20, S * 0.055
    dr.polygon([(sx, sy - sr * 2.2), (sx + sr * 0.55, sy - sr * 0.55), (sx + sr * 2.2, sy),
                (sx + sr * 0.55, sy + sr * 0.55), (sx, sy + sr * 2.2),
                (sx - sr * 0.55, sy + sr * 0.55), (sx - sr * 2.2, sy),
                (sx - sr * 0.55, sy - sr * 0.55)], fill=(255, 255, 255, 235))

    return img.resize((size, size), Image.LANCZOS)


for s, name in [(512, 'icon-512.png'), (192, 'icon-192.png'), (180, 'apple-touch-icon.png'), (96, 'icon-96.png')]:
    make(s).save(os.path.join(OUT, name))
    print('wrote', name)

# Android launcher sizes
DPI = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
res = os.path.join(os.path.dirname(__file__), 'android', 'res')
for dpi, s in DPI.items():
    p = os.path.join(res, 'mipmap-' + dpi)
    os.makedirs(p, exist_ok=True)
    make(s).save(os.path.join(p, 'ic_launcher.png'))
    make(s).save(os.path.join(p, 'ic_launcher_round.png'))
print('android icons done')
