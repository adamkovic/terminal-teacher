#!/usr/bin/env python3
"""Regenerate app mascot art from the masters in mascot/.

Pipeline per image:
  1. 2x median(3) on RGB, remap to a palette shared across ALL poses
     (no dithering) -> clean flat color fields, consistent colors between poses
  2. binarize alpha (kills the dithered semi-transparent fringe)
  3. pad the canvas so the outline can wrap around silhouettes that touch
     the image edge (rounded everywhere, never sliced off flat)
  4. dilate the silhouette (gaussian blur + threshold -> rounded edge)
     and fill the ring with white -> die-cut sticker look

Masters in mascot/ are never modified; output goes to assets/mascot/.
Add new poses to NAME_MAP, then run:  python3 tools/make_mascot_assets.py
"""
from PIL import Image, ImageFilter
import numpy as np
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "mascot")
DST_DIR = os.path.join(ROOT, "assets", "mascot")

NAME_MAP = {
    "mascot_0000_thinking.png": "thinking.png",
    "mascot_0001_great-job.png": "great-job.png",
    "mascot_0002_good-job.png": "good-job.png",
    "mascot_0003_explaining_1.png": "explaining.png",
    "mascot_0004_greeting.png": "greeting.png",
    "mascot_0005_inspecting.png": "inspecting.png",
    "mascot_0006_nuetral.png": "neutral.png",
    "mascot_0007_idle.png": "idle.png",
    "mascot_0008_worried.png": "worried.png",
    "mascot_0009_shocked.png": "shocked.png",
    "mascot_0010_laugh it off.png": "laughing.png",
    "mascot_0010_its ok.png": "its-ok.png",
    "mascot_0012_proud.png": "proud.png",
    "mascot_0013_hey cool.png": "hey-cool.png",
}

MEDIAN_PASSES = 2
COLORS = 64
WHITE = (255, 255, 255)

# ---- pass 1: median filter + collect opaque pixels for the shared palette ----
filtered = {}
samples = []
for src_name in NAME_MAP:
    img = Image.open(os.path.join(SRC_DIR, src_name)).convert("RGBA")
    rgb = img.convert("RGB")
    for _ in range(MEDIAN_PASSES):
        rgb = rgb.filter(ImageFilter.MedianFilter(3))
    alpha = img.getchannel("A").filter(ImageFilter.MedianFilter(3))
    filtered[src_name] = (rgb, alpha)
    arr, a = np.asarray(rgb), np.asarray(alpha)
    samples.append(arr[a > 128])

pixels = np.concatenate(samples)
pixels = pixels[::max(1, len(pixels) // 400_000)]
pal_img = Image.fromarray(pixels.reshape(1, -1, 3)).quantize(
    colors=COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)

# ---- pass 2: quantize + padded sticker outline ----
for src_name, dst_name in NAME_MAP.items():
    rgb, alpha = filtered[src_name]
    rgb = rgb.quantize(palette=pal_img, dither=Image.Dither.NONE).convert("RGB")

    a = np.asarray(alpha)
    char_mask = a > 128                                   # hard silhouette, no fringe

    r = max(10, rgb.height // 55)                         # ~3.5px at display size

    # pad so the outline can wrap (rounded) around edge-touching silhouettes
    pad = r + 6
    char_mask = np.pad(char_mask, pad)
    rgb_arr = np.pad(np.asarray(rgb), ((pad, pad), (pad, pad), (0, 0)))

    # rounded dilation: blur the hard mask, then re-threshold outward
    hard = Image.fromarray((char_mask * 255).astype(np.uint8))
    grown = hard.filter(ImageFilter.GaussianBlur(r))
    sticker_mask = np.asarray(grown) > 40                 # low threshold -> expands

    h, w = char_mask.shape
    out_arr = np.zeros((h, w, 4), dtype=np.uint8)
    out_arr[sticker_mask] = (*WHITE, 255)                 # white border ring
    out_arr[char_mask, :3] = rgb_arr[char_mask]           # character on top
    out_arr[char_mask, 3] = 255

    # trim excess transparent margin down to a tight 4px frame
    ys, xs = np.nonzero(sticker_mask)
    y0, y1 = max(0, ys.min() - 4), min(h, ys.max() + 5)
    x0, x1 = max(0, xs.min() - 4), min(w, xs.max() + 5)
    out = Image.fromarray(out_arr[y0:y1, x0:x1])

    dst = os.path.join(DST_DIR, dst_name)
    out.save(dst, optimize=True)
    print(f"{dst_name:16} r={r:2}  {out.size[0]}x{out.size[1]}  {os.path.getsize(dst)//1024:4} KB")
