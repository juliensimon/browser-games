#!/usr/bin/env python3
"""Generate a composite image of all game screenshots.

Creates a 2-column grid of gameplay screenshots from every game directory,
sorted chronologically by year (derived from the root README table).
Output: screenshots/games-composite.png
"""

import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
README = ROOT / 'README.md'
OUTPUT = ROOT / 'screenshots' / 'games-composite.png'

CELL_W, CELL_H = 600, 460
LABEL_H = 40
COLS = 2
BG_COLOR = (0, 0, 0)
LABEL_COLOR = (255, 255, 255)


def parse_games():
    """Extract (name, year, dir) tuples from README table, sorted by year."""
    text = README.read_text()
    games = []
    for m in re.finditer(
        r'\|\s*\[([^\]]+)\]\(([^)]+)/?\)\s*\|\s*(\d{4})\s*\|', text
    ):
        name, dirpath, year = m.group(1), m.group(2), int(m.group(3))
        screenshot = ROOT / dirpath / 'screenshots' / 'gameplay.png'
        if screenshot.exists():
            games.append((name, year, screenshot))
    games.sort(key=lambda g: g[1])
    return games


def build_composite(games):
    """Arrange screenshots in a 2-column grid with labels."""
    rows = (len(games) + COLS - 1) // COLS
    width = COLS * CELL_W
    height = rows * (CELL_H + LABEL_H)
    composite = Image.new('RGB', (width, height), BG_COLOR)
    draw = ImageDraw.Draw(composite)

    # Try to use a monospace font, fall back to default
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 20)
    except (OSError, IOError):
        try:
            font = ImageFont.truetype(
                '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 20
            )
        except (OSError, IOError):
            font = ImageFont.load_default()

    for i, (name, year, path) in enumerate(games):
        col = i % COLS
        row = i // COLS
        x = col * CELL_W
        y = row * (CELL_H + LABEL_H)

        # Load and resize screenshot to fit cell
        img = Image.open(path)
        img.thumbnail((CELL_W, CELL_H), Image.LANCZOS)

        # Center in cell
        offset_x = x + (CELL_W - img.width) // 2
        offset_y = y + (CELL_H - img.height) // 2
        composite.paste(img, (offset_x, offset_y))

        # Draw label centered below image
        label = f'{name.upper()} ({year})'
        bbox = draw.textbbox((0, 0), label, font=font)
        tw = bbox[2] - bbox[0]
        label_x = x + (CELL_W - tw) // 2
        label_y = y + CELL_H + 8
        draw.text((label_x, label_y), label, fill=LABEL_COLOR, font=font)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    composite.save(OUTPUT, 'PNG')
    print(f'Saved {OUTPUT} ({width}x{height}, {len(games)} games)')


if __name__ == '__main__':
    games = parse_games()
    if not games:
        print('No games found in README.md')
    else:
        build_composite(games)
