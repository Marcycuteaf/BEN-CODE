#!/usr/bin/env python3
"""Rotate banner to landscape, darken, bottom red gradient, snow GIF (PIL only)."""
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance

SRC = Path("/tmp/banner_src.jpg")
OUT_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("assets")
OUT_DIR.mkdir(parents=True, exist_ok=True)

TARGET_W = 900
FRAMES = 20
FLAKES = 60
SEED = 42

# Capsule-render red palette (bottom blend target)
RED_BOTTOM = (74, 0, 0)      # #4a0000
RED_MID = (139, 0, 0)        # #8b0000
BRIGHTNESS = 0.50            # darken base image
GRADIENT_START = 0.38        # fraction from top where fade begins


def load_landscape(path: Path, width: int) -> Image.Image:
    im = Image.open(path).convert("RGB")
    # Portrait → landscape (90° fixes upside-down from previous 270°)
    im = im.transpose(Image.Transpose.ROTATE_90)
    h = int(im.height * width / im.width)
    im = im.resize((width, h), Image.Resampling.LANCZOS)
    im = ImageEnhance.Brightness(im).enhance(BRIGHTNESS)
    im = ImageEnhance.Contrast(im).enhance(1.08)
    return im


def apply_bottom_gradient(im: Image.Image) -> Image.Image:
    """Soft fade into dark red at bottom — blends with capsule header below."""
    w, h = im.size
    base = im.convert("RGBA")
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(grad)
    y0 = int(h * GRADIENT_START)
    for y in range(y0, h):
        t = (y - y0) / max(h - y0, 1)
        # ease-in: stronger fade near bottom
        t = t * t
        r = int(RED_MID[0] * t + RED_BOTTOM[0] * t * 0.5)
        g = int(RED_MID[1] * t)
        b = int(RED_MID[2] * t)
        a = int(255 * min(1.0, t * 1.35))
        draw.line([(0, y), (w, y)], fill=(r, g, b, a))
    return Image.alpha_composite(base, grad)


def make_flakes(w: int, h: int, rng: random.Random):
    flakes = []
    for _ in range(FLAKES):
        size = rng.uniform(1.4, 4.2)
        x = rng.uniform(0, w)
        y = rng.uniform(-h, h)
        speed = rng.uniform(2.0, 6.5)
        drift = rng.uniform(-0.8, 0.8)
        alpha = int(rng.uniform(190, 255))
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
        # subtle glow for larger flakes
        if size > 2.5:
            draw.ellipse(
                (x - r * 1.4, y - r * 1.4, x + r * 1.4, y + r * 1.4),
                fill=(255, 255, 255, int(alpha * 0.25)),
            )
    return Image.alpha_composite(canvas, overlay).convert("P", palette=Image.ADAPTIVE)


def main():
    if not SRC.exists():
        raise SystemExit(f"Missing source image: {SRC}")

    rng = random.Random(SEED)
    base = apply_bottom_gradient(load_landscape(SRC, TARGET_W))
    w, h = base.size
    flakes = make_flakes(w, h, rng)

    static_path = OUT_DIR / "banner-landscape.jpg"
    base.convert("RGB").save(static_path, quality=92, optimize=True)

    frames = [draw_frame(base, flakes, i) for i in range(FRAMES)]
    gif_path = OUT_DIR / "banner-snow-v2.gif"
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
