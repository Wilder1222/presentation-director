#!/usr/bin/env python3

import argparse
import math
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

sys.dont_write_bytecode = True

from reference_cache import resolve_cache_dir


def natural_key(path: Path):
    return [int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", path.name)]


def build_sheet(images, output_path: Path, columns: int, thumb_width: int):
    label_height = 32
    gap = 16
    thumb_height = round(thumb_width * 9 / 16)
    rows = math.ceil(len(images) / columns)
    sheet_width = gap + columns * (thumb_width + gap)
    sheet_height = gap + rows * (thumb_height + label_height + gap)
    sheet = Image.new("RGB", (sheet_width, sheet_height), "#171717")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=18)

    for index, image_path in enumerate(images):
        row, column = divmod(index, columns)
        x = gap + column * (thumb_width + gap)
        y = gap + row * (thumb_height + label_height + gap)
        with Image.open(image_path) as source:
            rendered = ImageOps.contain(source.convert("RGB"), (thumb_width, thumb_height), Image.Resampling.LANCZOS)
        canvas = Image.new("RGB", (thumb_width, thumb_height), "#2A2A2A")
        canvas.paste(rendered, ((thumb_width - rendered.width) // 2, (thumb_height - rendered.height) // 2))
        sheet.paste(canvas, (x, y))
        draw.text((x, y + thumb_height + 6), image_path.stem, fill="#F5F5F5", font=font)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output_path, optimize=True)


def main():
    parser = argparse.ArgumentParser(description="Build paginated contact sheets for reference images.")
    parser.add_argument("--cache-dir")
    parser.add_argument("--input-root")
    parser.add_argument("--output-root")
    parser.add_argument("--columns", type=int, default=4)
    parser.add_argument("--pages-per-sheet", type=int, default=20)
    parser.add_argument("--thumb-width", type=int, default=320)
    args = parser.parse_args()

    cache = resolve_cache_dir(args.cache_dir)
    input_root = Path(args.input_root).resolve() if args.input_root else cache / "review"
    output_root = Path(args.output_root).resolve() if args.output_root else cache / "contact-sheets"
    total = 0
    for source_dir in sorted((path for path in input_root.iterdir() if path.is_dir()), key=lambda path: path.name):
        pages = sorted(
            (path for path in source_dir.iterdir() if path.is_file() and path.suffix.lower() in {".png", ".jpg", ".jpeg"}),
            key=natural_key,
        )
        for start in range(0, len(pages), args.pages_per_sheet):
            group = pages[start : start + args.pages_per_sheet]
            sheet_number = start // args.pages_per_sheet + 1
            output = output_root / f"{source_dir.name}-{sheet_number:02d}.png"
            build_sheet(group, output, args.columns, args.thumb_width)
            print(f"Created {output} with {len(group)} pages")
            total += 1
    print(f"Created {total} contact sheets")


if __name__ == "__main__":
    main()
