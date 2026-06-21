#!/usr/bin/env python3
"""Rotate banner to landscape and build a looping snow GIF (PIL only)."""
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw

SRC = Path("/tmp/banner_src.jpg")
OUT_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("assets")
OUT_DIR.mkdir(parents=True, exist_ok=True)

TARGET_W = 900
FRAMES = 20
FLAKES = 55
SEED = 42


def load_landscape(path: Path, width: int) -> Image.Image:
    im = Image.open(path).convert("RGB")
    # Portrait → landscape
    im = im.transpose(Image.Transpose.ROTATE_270)
    h = int(im.height * width / im.width)
    return im.resize((width, h), Image.Resampling.LANCZOS)


def make_flakes(w: int, h: int, rng: random.Random):
    flakes = []
    for _ in range(FLAKES):
        size = rng.uniform(1.2, 3.8)
        x = rng.uniform(0, w)
        y = rng.uniform(-h, h)
        speed = rng.uniform(2.0, 6.5)
        drift = rng.uniform(-0.8, 0.8)
        alpha = int(rng.uniform(140, 230))
        flakes.append([x, y, size, speed, drift, alpha])
    return flakes


def draw_frame(base: Image.Image, flakes, frame_idx: int) -> Image.Image:
    w, h = base.size
    canvas = base.copy().convert("RGBA")
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for f in flakes:
        x, y, size, speed, drift, alpha = f
        y = (y + speed * frame_idx) % (h + 40) - 20
        x = (x + drift * frame_idx) % w
        r = size
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, alpha))
    return Image.alpha_composite(canvas, overlay).convert("P", palette=Image.ADAPTIVE)


def main():
    rng = random.Random(SEED)
    base = load_landscape(SRC, TARGET_W)
    w, h = base.size
    flakes = make_flakes(w, h, rng)

    static_path = OUT_DIR / "banner-landscape.jpg"
    base.save(static_path, quality=92, optimize=True)

    frames = [draw_frame(base, flakes, i) for i in range(FRAMES)]
    gif_path = OUT_DIR / "banner-snow.gif"
    frames[0].save(
        gif_path,
        save_all=True,
        append_images=frames[1:],
        duration=80,
        loop=0,
        optimize=True,
        disposal=2,
    )
    print(f"static: {static_path} ({static_path.stat().st_size} bytes)")
    print(f"gif:    {gif_path} ({gif_path.stat().st_size} bytes) size={w}x{h}")


if __name__ == "__main__":
    main()
