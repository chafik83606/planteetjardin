#!/usr/bin/env python3
"""
Redimensionne des images pour les captures téléphone Play Store (1080x1920).

Usage:
  python scripts/resize_screenshots.py
  python scripts/resize_screenshots.py --mode cover
  python scripts/resize_screenshots.py --mode contain
  python scripts/resize_screenshots.py --width 1290 --height 2796   # iPhone App Store

Modes:
  cover   — remplit tout le cadre (recadre le surplus)  [défaut]
  contain — garde toute l'image (bandes sur les côtés / haut-bas)
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow manquant. Installez-le avec : pip install Pillow")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
INPUT_DIR = ROOT / "store-assets" / "screenshots" / "input"
OUTPUT_DIR = ROOT / "store-assets" / "screenshots" / "output"
EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}

# Vert marque Plante & Jardin (bandes mode contain)
PAD_COLOR = (27, 67, 50)  # #1B4332


def fit_image(img: Image.Image, width: int, height: int, mode: str) -> Image.Image:
    img = img.convert("RGBA")
    src_w, src_h = img.size
    target_ratio = width / height
    src_ratio = src_w / src_h

    if mode == "cover":
        if src_ratio > target_ratio:
            new_w = int(src_h * target_ratio)
            left = (src_w - new_w) // 2
            img = img.crop((left, 0, left + new_w, src_h))
        else:
            new_h = int(src_w / target_ratio)
            top = (src_h - new_h) // 2
            img = img.crop((0, top, src_w, top + new_h))
        return img.resize((width, height), Image.Resampling.LANCZOS)

    # contain: scale to fit inside, then pad
    scale = min(width / src_w, height / src_h)
    new_w = max(1, int(src_w * scale))
    new_h = max(1, int(src_h * scale))
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (width, height), (*PAD_COLOR, 255))
    offset = ((width - new_w) // 2, (height - new_h) // 2)
    canvas.paste(resized, offset, resized)
    return canvas


def main() -> int:
    parser = argparse.ArgumentParser(description="Resize screenshots for store listing")
    parser.add_argument(
        "--mode",
        choices=("cover", "contain"),
        default="cover",
        help="cover = crop to fill; contain = pad to fit (default: cover)",
    )
    parser.add_argument("--width", type=int, default=1080, help="Target width (default: 1080)")
    parser.add_argument("--height", type=int, default=1920, help="Target height (default: 1920)")
    parser.add_argument(
        "--input",
        type=Path,
        default=INPUT_DIR,
        help=f"Input folder (default: {INPUT_DIR})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=OUTPUT_DIR,
        help=f"Output folder (default: {OUTPUT_DIR})",
    )
    args = parser.parse_args()

    input_dir: Path = args.input
    output_dir: Path = args.output
    input_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)

    files = sorted(
        p for p in input_dir.iterdir() if p.is_file() and p.suffix.lower() in EXTENSIONS
    )
    if not files:
        print(f"Aucune image dans : {input_dir}")
        print("Déposez vos captures (PNG/JPG), puis relancez.")
        return 1

    print(f"Mode : {args.mode} → {args.width}x{args.height}")
    print(f"Entrée : {input_dir}")
    print(f"Sortie : {output_dir}")
    print()

    for path in files:
        with Image.open(path) as img:
            out = fit_image(img, args.width, args.height, args.mode)
            # Play Store accepte PNG ; on force RGB opaque pour JPEG si besoin
            out_name = path.stem + ".png"
            out_path = output_dir / out_name
            out.convert("RGB").save(out_path, "PNG", optimize=True)
            print(f"OK  {path.name}  ({img.size[0]}x{img.size[1]}) → {out_name} ({args.width}x{args.height})")

    print()
    print(f"Terminé : {len(files)} fichier(s) dans {output_dir}")
    print("Uploadez ces PNG dans Play Console → Captures d'écran téléphone.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
