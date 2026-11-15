#!/usr/bin/env python3
"""Generate simple, deterministic extension icons.

The generated PNGs are intentionally flat and legible at 16px. Run:

    python3 scripts/generate-icons.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SIZES = (16, 32, 48, 128)
CANVAS = 512
RADIUS = 112
FONT_PATH = "/System/Library/Fonts/Supplemental/Arial.ttf"


def font(size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(FONT_PATH, size)
    except OSError:
        return ImageFont.load_default()


def base(color: tuple[int, int, int]) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((16, 16, CANVAS - 16, CANVAS - 16), radius=RADIUS, fill=color)
    return image, draw


def save(image: Image.Image, plugin: str) -> None:
    directory = ROOT / "extensions" / plugin / "public" / "icon"
    directory.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        image.resize((size, size), Image.Resampling.LANCZOS).save(directory / f"{size}.png")


def draw_template() -> None:
    image, draw = base((75, 85, 99, 255))
    draw.text((CANVAS / 2, CANVAS / 2), "H", font=font(300), anchor="mm", fill="white")
    save(image, "_template")


def draw_dark_mode() -> None:
    image, draw = base((17, 24, 39, 255))
    draw.ellipse((132, 124, 384, 376), fill=(249, 250, 251, 255))
    draw.ellipse((198, 92, 414, 308), fill=(17, 24, 39, 255))
    draw.ellipse((352, 112, 396, 156), fill=(148, 163, 184, 255))
    draw.ellipse((268, 324, 300, 356), fill=(148, 163, 184, 255))
    save(image, "dark-mode-lite")


def draw_tab_stash() -> None:
    image, draw = base((13, 148, 136, 255))
    draw.rounded_rectangle((112, 124, 400, 236), radius=26, fill=(209, 250, 229, 230))
    draw.rounded_rectangle((92, 184, 420, 312), radius=26, fill=(240, 253, 250, 255))
    draw.rounded_rectangle((72, 256, 440, 404), radius=30, fill=(255, 255, 255, 255))
    draw.rounded_rectangle((110, 292, 248, 336), radius=14, fill=(13, 148, 136, 255))
    draw.rounded_rectangle((272, 292, 402, 336), radius=14, fill=(153, 246, 228, 255))
    save(image, "tab-stash")


def draw_volume_booster() -> None:
    image, draw = base((234, 88, 12, 255))
    draw.polygon((104, 204, 208, 120, 208, 392, 104, 308), fill="white")
    for width, left in ((36, 252), (44, 308), (52, 364)):
        draw.arc((left, 158 - width // 2, left + 92, 354 + width // 2), start=-65, end=65, fill="white", width=width)
    draw.rounded_rectangle((396, 236, 430, 276), radius=10, fill="white")
    draw.rounded_rectangle((396, 236, 430, 276), radius=10, fill="white")
    draw.rounded_rectangle((396, 236, 430, 276), radius=10, fill="white")
    draw.rounded_rectangle((396, 236, 430, 276), radius=10, fill="white")
    save(image, "volume-booster")


def draw_quick_translate() -> None:
    image, draw = base((22, 163, 74, 255))
    draw.rounded_rectangle((84, 116, 428, 332), radius=44, fill="white")
    draw.polygon((154, 300, 222, 388, 230, 300), fill="white")
    draw.text((176, 224), "A", font=font(120), anchor="mm", fill=(22, 163, 74, 255))
    draw.text((336, 224), "文", font=font(110), anchor="mm", fill=(22, 163, 74, 255))
    save(image, "quick-translate")


def draw_focus_lock() -> None:
    image, draw = base((124, 58, 237, 255))
    draw.rounded_rectangle((156, 232, 356, 396), radius=34, fill="white")
    draw.arc((180, 132, 332, 300), start=180, end=360, fill="white", width=38)
    draw.rounded_rectangle((232, 288, 280, 336), radius=14, fill=(124, 58, 237, 255))
    save(image, "focus-lock")



def draw_newtab_dashboard() -> None:
    image, draw = base((37, 99, 235, 255))
    draw.rounded_rectangle((80, 100, 232, 220), radius=24, fill="white")
    draw.rounded_rectangle((280, 100, 432, 220), radius=24, fill=(191, 219, 254, 255))
    draw.rounded_rectangle((80, 252, 432, 412), radius=24, fill="white")
    draw.rounded_rectangle((112, 292, 200, 316), radius=10, fill=(37, 99, 235, 255))
    draw.rounded_rectangle((112, 336, 268, 356), radius=10, fill=(148, 163, 184, 255))
    draw.rounded_rectangle((112, 372, 244, 392), radius=10, fill=(148, 163, 184, 255))
    save(image, "newtab-dashboard")


def draw_privacy_cleaner() -> None:
    image, draw = base((15, 118, 110, 255))
    draw.ellipse((140, 120, 372, 352), outline="white", width=34)
    draw.arc((170, 150, 342, 322), start=100, end=260, fill=(153, 246, 228, 255), width=28)
    draw.rounded_rectangle((212, 218, 300, 246), radius=10, fill="white")
    draw.rounded_rectangle((212, 274, 336, 298), radius=10, fill=(153, 246, 228, 255))
    save(image, "privacy-cleaner")


def draw_reading_progress() -> None:
    image, draw = base((217, 119, 6, 255))
    draw.rounded_rectangle((84, 132, 428, 380), radius=32, fill="white")
    draw.rounded_rectangle((112, 176, 400, 196), radius=10, fill=(217, 119, 6, 255))
    draw.rounded_rectangle((112, 224, 352, 244), radius=10, fill=(253, 186, 116, 255))
    draw.rounded_rectangle((112, 272, 312, 292), radius=10, fill=(253, 186, 116, 255))
    draw.rounded_rectangle((112, 320, 240, 340), radius=10, fill=(253, 186, 116, 255))
    save(image, "reading-progress")


def draw_clipboard_history() -> None:
    image, draw = base((79, 70, 229, 255))
    draw.rounded_rectangle((140, 112, 372, 400), radius=34, fill="white")
    draw.rounded_rectangle((196, 76, 316, 132), radius=24, fill=(224, 231, 255, 255))
    draw.rounded_rectangle((176, 188, 336, 216), radius=10, fill=(79, 70, 229, 255))
    draw.rounded_rectangle((176, 246, 336, 274), radius=10, fill=(165, 180, 252, 255))
    draw.rounded_rectangle((176, 304, 300, 332), radius=10, fill=(165, 180, 252, 255))
    save(image, "clipboard-history-lite")


def draw_screenshot_annotator() -> None:
    image, draw = base((190, 24, 93, 255))
    draw.rounded_rectangle((80, 116, 432, 340), radius=30, fill="white")
    draw.rounded_rectangle((128, 160, 240, 236), radius=12, outline=(190, 24, 93, 255), width=14)
    draw.line((268, 276, 364, 184), fill=(190, 24, 93, 255), width=20)
    draw.polygon((376, 166, 398, 214, 344, 200), fill=(190, 24, 93, 255))
    draw.rounded_rectangle((124, 364, 388, 416), radius=16, fill=(251, 207, 232, 255))
    save(image, "screenshot-annotator")


def draw_font_switcher() -> None:
    image, draw = base((79, 70, 229, 255))
    draw.rounded_rectangle((68, 116, 244, 396), radius=38, fill=(238, 242, 255, 255))
    draw.rounded_rectangle((268, 116, 444, 396), radius=38, fill=(255, 255, 255, 255))
    draw.text((156, 208), "A", font=font(128), anchor="mm", fill=(79, 70, 229, 255))
    draw.text((156, 312), "a", font=font(84), anchor="mm", fill=(129, 140, 248, 255))
    draw.text((356, 248), "永", font=font(104), anchor="mm", fill=(79, 70, 229, 255))
    draw.text((356, 334), "字", font=font(72), anchor="mm", fill=(129, 140, 248, 255))
    save(image, "font-switcher")


def main() -> None:
    draw_template()
    draw_dark_mode()
    draw_tab_stash()
    draw_volume_booster()
    draw_quick_translate()
    draw_focus_lock()
    draw_newtab_dashboard()
    draw_privacy_cleaner()
    draw_reading_progress()
    draw_clipboard_history()
    draw_screenshot_annotator()
    draw_font_switcher()


if __name__ == "__main__":
    main()
