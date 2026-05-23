#!/usr/bin/env python3
"""
Generates all required iOS app icon sizes from logo-source.png.
Composites the logo (black-on-white) as white on the brand maroon background.
"""
from pathlib import Path
from PIL import Image, ImageOps

SCRIPT_DIR = Path(__file__).parent
SRC = SCRIPT_DIR / "logo-source.png"
OUT_DIR = SCRIPT_DIR / "../OffersPlus/Assets.xcassets/AppIcon.appiconset"

BACKGROUND = (134, 31, 65)   # #861F41

SIZES = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024]

def make_icon(size: int) -> Image.Image:
    src = Image.open(SRC).convert("RGBA")

    # Invert: black logo → white logo, preserve alpha
    r, g, b, a = src.split()
    rgb_inv = ImageOps.invert(Image.merge("RGB", (r, g, b)))

    # Use original darkness as alpha mask (dark pixels → opaque white)
    gray = ImageOps.grayscale(Image.merge("RGB", (r, g, b)))
    mask = ImageOps.invert(gray)

    white_logo = Image.merge("RGBA", (*rgb_inv.split(), mask))

    # Auto-crop whitespace so the logo mark fills the canvas properly
    bbox = mask.getbbox()
    white_logo = white_logo.crop(bbox)

    # Place cropped logo at 65% of canvas with equal padding
    canvas_1024 = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    logo_size = int(1024 * 0.65)
    logo_resized = white_logo.resize((logo_size, logo_size), Image.LANCZOS)
    offset = (1024 - logo_size) // 2
    canvas_1024.paste(logo_resized, (offset, offset), logo_resized)

    # Compose onto brand background
    bg = Image.new("RGB", (1024, 1024), BACKGROUND)
    bg.paste(canvas_1024, mask=canvas_1024.split()[3])

    return bg.resize((size, size), Image.LANCZOS)

OUT_DIR.mkdir(parents=True, exist_ok=True)
for size in SIZES:
    icon = make_icon(size)
    path = OUT_DIR / f"AppIcon-{size}.png"
    icon.save(path, "PNG")
    print(f"  ✓ {size}x{size}")

print(f"Done. Icons written to {OUT_DIR.resolve()}")
