#!/usr/bin/env python3
"""Polish a UI screenshot for Emporix GitBook pages.

Prefer a full-resolution filesystem PNG (Desktop screenshot or dropped file).
Cursor chat pastes are often ~1024px on the long edge and look soft in docs.

The docs form (from `.style-guide/visuals/images-and-icons.md` and published
shots such as `screenshot_example.png`) is:

* border color ``#DDE6EE``
* stroke 2 (PhotoScape 2/3; 2 is the default)
* PhotoScape "Roundness: 10" — **not 10px**. On published pages that is about
  4.5% of the shorter side (≈23px on a 512px-tall shot, transparent corners)

By default the script does **not** downscale (``--max-width 0``). Pass a
positive ``--max-width`` only when shrinking intentionally.

The agent must run ``--check`` on every asset it ships. Exit 0 only when the
file matches that form.
"""

from __future__ import annotations

import argparse
import math
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps

HIGHLIGHT = (232, 108, 7, 255)  # #E86C07
FRAME = (221, 230, 238, 255)  # #DDE6EE
FRAME_HEX = "#DDE6EE"
# PhotoScape roundness 10 on published GitBook shots (not 10px).
FRAME_RADIUS_RATIO = 0.045
FRAME_RADIUS_MIN = 16
DEFAULT_FRAME_STROKE = 2
HIGHLIGHT_RADIUS = 8
HIGHLIGHT_STROKE = 3
# Even pad around the control bounds (button/field fill), not freehand guess.
DEFAULT_HIGHLIGHT_PAD = 9
ARROW_WIDTH = 4
# PhotoScape lens-blur defaults from style-guide visuals/images-and-icons.md.
# Strength is a PhotoScape slider — not a Pillow Gaussian radius in px.
DEFAULT_BLUR_STRENGTH = 30
DEFAULT_BLUR_BRUSH = 15
DEFAULT_BLUR_HARDNESS = 25
MASK_SCALE = 4
COLOR_TOL = 22
CORNER_ALPHA_MAX = 40
STROKE_MIN = 2
STROKE_MAX = 5
# Cursor chat attachments commonly land at this long-edge size.
CHAT_PREVIEW_LONG_EDGE = 1024


def photoscope_optical_radius(strength: int, brush: int) -> int:
    """Map PhotoScape Strength/Brush to a Pillow radius that keeps mid-gray letter ghosts.

    Raw ``strength`` as Gaussian radius washes thin dark UI text on white into a
    milky haze. Keep the optical radius near half the brush size.
    """
    return max(5, min(10, brush // 2 + max(0, strength) // 20))


def parse_box(raw: str, width: int, height: int) -> tuple[int, int, int, int]:
    parts = [p.strip() for p in raw.split(",")]
    if len(parts) != 4:
        raise ValueError(f"Expected x,y,w,h got {raw!r}")

    def num(token: str, size: int) -> int:
        if token.endswith("%"):
            return int(round(float(token[:-1]) * size / 100.0))
        return int(round(float(token)))

    x = num(parts[0], width)
    y = num(parts[1], height)
    w = num(parts[2], width)
    h = num(parts[3], height)
    x = max(0, min(x, width - 1))
    y = max(0, min(y, height - 1))
    w = max(1, min(w, width - x))
    h = max(1, min(h, height - y))
    return x, y, w, h


def parse_point_pair(raw: str, width: int, height: int) -> tuple[int, int, int, int]:
    parts = [p.strip() for p in raw.split(",")]
    if len(parts) != 4:
        raise ValueError(f"Expected x1,y1,x2,y2 got {raw!r}")

    def num(token: str, size: int) -> int:
        if token.endswith("%"):
            return int(round(float(token[:-1]) * size / 100.0))
        return int(round(float(token)))

    return num(parts[0], width), num(parts[1], height), num(parts[2], width), num(parts[3], height)


def apply_crop(im: Image.Image, box: str) -> Image.Image:
    x, y, w, h = parse_box(box, im.width, im.height)
    return im.crop((x, y, x + w, y + h))


def _soft_brush_mask(
    size: tuple[int, int],
    core: tuple[int, int, int, int],
    brush: int,
    hardness: int,
) -> Image.Image:
    """Opaque core over ``core`` (x0,y0,x1,y1) with PhotoScape-like soft edge."""
    lw, lh = size
    x0, y0, x1, y1 = core
    feather = max(2, int(brush * (100 - max(0, min(100, hardness))) / 100))
    pad = max(2, brush // 3)
    mask = Image.new("L", (lw, lh), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (x0 - pad, y0, x1 + pad, y1),
        radius=4,
        fill=255,
    )
    soft = mask.filter(ImageFilter.GaussianBlur(radius=feather))
    soft = ImageOps.autocontrast(soft)
    # Keep the painted core fully opaque; feather only the edge.
    return soft.point(lambda p: 255 if p >= 180 else int(p * 255 / 180))


def apply_blur(
    im: Image.Image,
    box: str,
    *,
    strength: int = DEFAULT_BLUR_STRENGTH,
    brush: int = DEFAULT_BLUR_BRUSH,
    hardness: int = DEFAULT_BLUR_HARDNESS,
) -> None:
    """PhotoScape-equivalent soft-brush lens blur over ``box`` (text/value bounds).

    Target look: mid-gray letter-shaped density — content clearly present, not
    readable. Avoid milky-white wash and solid charcoal pills.
    """
    x, y, w, h = parse_box(box, im.width, im.height)
    ex0, ey0, ex1, ey1 = x, y, x + w, y + h
    radius = photoscope_optical_radius(strength, brush)
    feather = max(2, int(brush * (100 - max(0, min(100, hardness))) / 100))
    bleed = radius * 3 + feather
    crop_box = (
        max(0, ex0 - bleed),
        max(0, ey0 - bleed),
        min(im.width, ex1 + bleed),
        min(im.height, ey1 + bleed),
    )
    local = im.crop(crop_box)
    rgb = local.convert("RGB")
    gray = rgb.convert("L")
    # Slight ink thicken so blur keeps mid-gray body instead of washing to white.
    dark = rgb
    for _ in range(2):
        dark = dark.filter(ImageFilter.MinFilter(5))
    mask_ink = gray.point(lambda p: 255 if p < 220 else 0).filter(ImageFilter.MaxFilter(5))
    pre = Image.composite(dark, rgb, mask_ink)
    pre = ImageEnhance.Contrast(pre).enhance(1.35)
    pre = ImageEnhance.Brightness(pre).enhance(1.05)
    blurred = pre.filter(ImageFilter.GaussianBlur(radius=radius))
    blurred = blurred.filter(ImageFilter.GaussianBlur(radius=max(2, radius // 2)))
    blurred = blurred.convert("RGBA")

    def lift(p: int) -> int:
        if p > 245:
            return p
        return min(255, int(p * 1.12 + 18))

    r, g, b, a = blurred.split()
    blurred = Image.merge("RGBA", (r.point(lift), g.point(lift), b.point(lift), a))

    lx0, ly0 = ex0 - crop_box[0], ey0 - crop_box[1]
    lx1, ly1 = ex1 - crop_box[0], ey1 - crop_box[1]
    soft = _soft_brush_mask(local.size, (lx0, ly0, lx1, ly1), brush, hardness)
    local_out = Image.composite(blurred, local, soft)
    im.paste(local_out, (crop_box[0], crop_box[1]))


def apply_highlight(
    im: Image.Image,
    box: str,
    *,
    pad: int = DEFAULT_HIGHLIGHT_PAD,
) -> None:
    """Draw #E86C07 rounded rect around control bounds with even padding.

    ``box`` is the control fill (button/field), not the final orange frame.
    """
    x, y, w, h = parse_box(box, im.width, im.height)
    pad = max(0, pad)
    x0 = max(0, x - pad)
    y0 = max(0, y - pad)
    x1 = min(im.width - 1, x + w - 1 + pad)
    y1 = min(im.height - 1, y + h - 1 + pad)
    draw = ImageDraw.Draw(im, "RGBA")
    draw.rounded_rectangle(
        (x0, y0, x1, y1),
        radius=HIGHLIGHT_RADIUS,
        outline=HIGHLIGHT,
        width=HIGHLIGHT_STROKE,
    )


def apply_arrow(im: Image.Image, pair: str) -> None:
    x1, y1, x2, y2 = parse_point_pair(pair, im.width, im.height)
    draw = ImageDraw.Draw(im, "RGBA")
    draw.line((x1, y1, x2, y2), fill=HIGHLIGHT, width=ARROW_WIDTH)
    angle = math.atan2(y2 - y1, x2 - x1)
    head = 16
    left = (
        x2 - head * math.cos(angle - 0.4),
        y2 - head * math.sin(angle - 0.4),
    )
    right = (
        x2 - head * math.cos(angle + 0.4),
        y2 - head * math.sin(angle + 0.4),
    )
    draw.polygon([(x2, y2), left, right], fill=HIGHLIGHT)


def expected_outer_radius(width: int, height: int) -> int:
    return max(FRAME_RADIUS_MIN, int(round(min(width, height) * FRAME_RADIUS_RATIO)))


def inner_radius_for(width: int, height: int, stroke: int) -> int:
    return max(12, expected_outer_radius(width, height) - stroke)


def _rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    """Anti-aliased rounded-rect mask, drawn at MASK_SCALE then downsampled."""
    w, h = size
    sw, sh = w * MASK_SCALE, h * MASK_SCALE
    mask = Image.new("L", (sw, sh), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, sw - 1, sh - 1),
        radius=max(1, radius * MASK_SCALE),
        fill=255,
    )
    return mask.resize((w, h), Image.Resampling.LANCZOS)


def apply_frame(
    im: Image.Image,
    stroke: int = DEFAULT_FRAME_STROKE,
    radius: int | None = None,
) -> Image.Image:
    w, h = im.size
    if radius is None:
        radius = inner_radius_for(w, h, stroke)
    ow, oh = w + stroke * 2, h + stroke * 2

    src = im.convert("RGBA")
    inner_mask = _rounded_mask((w, h), radius)
    rounded = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    rounded.paste(src, (0, 0))
    rounded.putalpha(ImageChops.multiply(rounded.split()[3], inner_mask))

    outer_mask = _rounded_mask((ow, oh), radius + stroke)
    frame = Image.new("RGBA", (ow, oh), FRAME)
    frame.putalpha(outer_mask)

    canvas = Image.new("RGBA", (ow, oh), (0, 0, 0, 0))
    canvas.paste(frame, (0, 0), frame)
    canvas.paste(rounded, (stroke, stroke), rounded)
    return canvas


def downscale(im: Image.Image, max_width: int) -> Image.Image:
    if im.width <= max_width:
        return im
    ratio = max_width / im.width
    size = (max_width, max(1, int(round(im.height * ratio))))
    return im.resize(size, Image.Resampling.LANCZOS)


def load_rgba(path: Path) -> Image.Image:
    im = Image.open(path)
    if im.mode != "RGBA":
        im = im.convert("RGBA")
    return im


def _color_dist(rgb: tuple[int, int, int], target: tuple[int, int, int] = FRAME[:3]) -> float:
    return math.sqrt(sum((rgb[i] - target[i]) ** 2 for i in range(3)))


def _first_opaque(im: Image.Image, axis: str, reverse: bool, alpha_min: int = 8):
    px = im.load()
    w, h = im.size
    if axis == "x":
        y = h // 2
        xs = range(w - 1, -1, -1) if reverse else range(w)
        for x in xs:
            r, g, b, a = px[x, y]
            if a >= alpha_min:
                return x, (r, g, b, a)
        return None, None
    x = w // 2
    ys = range(h - 1, -1, -1) if reverse else range(h)
    for y in ys:
        r, g, b, a = px[x, y]
        if a >= alpha_min:
            return y, (r, g, b, a)
    return None, None


def _edge_stroke(im: Image.Image) -> int:
    px = im.load()
    w, h = im.size
    midy = h // 2
    n = 0
    for x in range(min(16, w)):
        r, g, b, a = px[x, midy]
        if a < 180:
            if n:
                break
            continue
        if _color_dist((r, g, b)) <= COLOR_TOL:
            n += 1
        else:
            break
    return n


def _outer_radius_px(im: Image.Image) -> int | None:
    """Y of the first left-edge pixel that is the docs border color.

    Works for transparent corners and for shots flattened onto a dark
    background (the corner pixels stay opaque but are not #DDE6EE).
    """
    px = im.load()
    w, h = im.size
    limit = min(h, max(48, int(round(min(w, h) * 0.2))))
    for y in range(limit):
        r, g, b, a = px[0, y]
        if a >= 160 and _color_dist((r, g, b)) <= COLOR_TOL:
            return y
    return None


@dataclass
class FrameReport:
    width: int
    height: int
    corner_alpha: tuple[int, int, int, int]
    corners_transparent: bool
    edge_hex: str | None
    color_ok: bool
    stroke: int
    stroke_ok: bool
    radius: int | None
    radius_expected: int
    radius_ok: bool
    ok: bool
    already_framed: bool
    issues: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def lines(self) -> list[str]:
        status = "pass" if self.ok else "fail"
        out = [
            f"check: {status}",
            f"size: {self.width}x{self.height}",
            f"border: {self.edge_hex or 'none'} (want {FRAME_HEX})",
            f"stroke: {self.stroke} (want {STROKE_MIN}-{STROKE_MAX})",
            f"radius: {self.radius if self.radius is not None else 'n/a'} "
            f"(want ~{self.radius_expected}, PhotoScape roundness 10)",
            f"corners: {'transparent' if self.corners_transparent else 'opaque'}",
        ]
        for item in self.issues:
            out.append(f"- {item}")
        for item in self.warnings:
            out.append(f"warning: {item}")
        return out


def analyze_frame(im: Image.Image) -> FrameReport:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    corners = (
        px[0, 0][3],
        px[w - 1, 0][3],
        px[0, h - 1][3],
        px[w - 1, h - 1][3],
    )
    corners_transparent = all(a <= CORNER_ALPHA_MAX for a in corners)
    expected = expected_outer_radius(w, h)
    xl, cl = _first_opaque(im, "x", False)
    edge_rgb = cl[:3] if cl else None
    edge_hex = None
    color_ok = False
    if edge_rgb:
        edge_hex = f"#{edge_rgb[0]:02X}{edge_rgb[1]:02X}{edge_rgb[2]:02X}"
        color_ok = _color_dist(edge_rgb) <= COLOR_TOL
    stroke = _edge_stroke(im)
    stroke_ok = STROKE_MIN <= stroke <= STROKE_MAX
    radius = _outer_radius_px(im)
    if radius is None:
        radius_ok = False
    else:
        lo = max(14, int(round(expected * 0.55)))
        hi = max(lo + 4, int(round(expected * 1.55)))
        radius_ok = lo <= radius <= hi

    issues: list[str] = []
    warnings: list[str] = []
    if not color_ok:
        issues.append(f"border color {edge_hex or 'missing'} is not {FRAME_HEX}")
    if not stroke_ok:
        issues.append(f"stroke {stroke}px is not {STROKE_MIN}-{STROKE_MAX}px")
    if not radius_ok:
        issues.append(
            f"rounding {radius}px is not PhotoScape roundness 10 "
            f"(expected ~{expected}px, not 10px)"
        )
    if not corners_transparent:
        if color_ok and radius_ok:
            warnings.append(
                "corners are opaque (screenshot of a framed PNG). "
                "Prefer the original transparent PNG; do not wrap again"
            )
        else:
            issues.append("corners are opaque (not rounded / not framed)")

    already_framed = color_ok and radius_ok
    ok = color_ok and stroke_ok and radius_ok and (
        corners_transparent or already_framed
    )
    if already_framed and not corners_transparent:
        # Flattened-on-dark paste: form is visually the docs frame.
        ok = True
    return FrameReport(
        width=w,
        height=h,
        corner_alpha=corners,
        corners_transparent=corners_transparent,
        edge_hex=edge_hex,
        color_ok=color_ok,
        stroke=stroke,
        stroke_ok=stroke_ok,
        radius=radius,
        radius_expected=expected,
        radius_ok=radius_ok,
        ok=ok,
        already_framed=already_framed,
        issues=issues,
        warnings=warnings,
    )


def print_report(report: FrameReport) -> None:
    print("\n".join(report.lines()))


def run_self_test() -> int:
    raw = Image.new("RGBA", (800, 400), (255, 255, 255, 255))
    bare = analyze_frame(raw)
    if bare.ok:
        print("self-test fail: unframed white rectangle passed --check", file=sys.stderr)
        print_report(bare)
        return 1
    framed = apply_frame(raw)
    report = analyze_frame(framed)
    print_report(report)
    if not report.ok:
        print("self-test fail: framed rectangle did not pass --check", file=sys.stderr)
        return 1
    if report.edge_hex and report.edge_hex.upper() != FRAME_HEX:
        print(f"self-test fail: border {report.edge_hex} != {FRAME_HEX}", file=sys.stderr)
        return 1
    if not report.corners_transparent:
        print("self-test fail: corners must be transparent", file=sys.stderr)
        return 1
    with tempfile.TemporaryDirectory() as tmp:
        dest = Path(tmp) / "framed.png"
        framed.save(dest, format="PNG")
        reloaded = analyze_frame(load_rgba(dest))
        if not reloaded.ok:
            print("self-test fail: saved PNG did not pass --check", file=sys.stderr)
            print_report(reloaded)
            return 1
    print("self-test: pass")
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("input", type=Path, nargs="?", help="Raw screenshot path")
    p.add_argument("output", type=Path, nargs="?", help="Destination PNG")
    p.add_argument("--info", action="store_true", help="Print width x height and exit")
    p.add_argument("--check", action="store_true", help="Verify docs frame form and exit")
    p.add_argument("--self-test", action="store_true", help="Frame a dummy shot and --check it")
    p.add_argument("--crop", help="x,y,w,h pixels or percents (e.g. 8%%,6%%,84%%,70%%)")
    p.add_argument(
        "--highlight",
        action="append",
        default=[],
        help="control fill x,y,w,h (repeatable); expanded by --highlight-pad",
    )
    p.add_argument(
        "--highlight-pad",
        type=int,
        default=DEFAULT_HIGHLIGHT_PAD,
        help=f"even pad around each --highlight box (default {DEFAULT_HIGHLIGHT_PAD})",
    )
    p.add_argument(
        "--blur",
        action="append",
        default=[],
        help="sensitive text/value x,y,w,h (repeatable); PhotoScape-equivalent lens blur",
    )
    p.add_argument(
        "--blur-strength",
        type=int,
        default=DEFAULT_BLUR_STRENGTH,
        help=f"PhotoScape Strength slider (default {DEFAULT_BLUR_STRENGTH}; not px radius)",
    )
    p.add_argument(
        "--blur-brush",
        type=int,
        default=DEFAULT_BLUR_BRUSH,
        help=f"PhotoScape Brush size (default {DEFAULT_BLUR_BRUSH})",
    )
    p.add_argument(
        "--blur-hardness",
        type=int,
        default=DEFAULT_BLUR_HARDNESS,
        help=f"PhotoScape Hardness 0-100 (default {DEFAULT_BLUR_HARDNESS})",
    )
    p.add_argument(
        "--blur-preview",
        type=Path,
        help="write a tight crop around the first --blur box for visual review",
    )
    p.add_argument("--arrow", action="append", default=[], help="x1,y1,x2,y2 (repeatable)")
    p.add_argument("--frame", dest="frame", action="store_true", default=True)
    p.add_argument("--no-frame", dest="frame", action="store_false")
    p.add_argument("--force-frame", action="store_true", help="Wrap even if --check already passes")
    p.add_argument("--frame-stroke", type=int, default=DEFAULT_FRAME_STROKE)
    p.add_argument("--frame-radius", type=int, help="Override inner corner radius (px)")
    p.add_argument(
        "--max-width",
        type=int,
        default=0,
        help="Downscale so width <= N before framing (0 = keep full resolution, default)",
    )
    return p


def main() -> int:
    args = build_parser().parse_args()
    if args.self_test:
        return run_self_test()

    if args.input is None:
        print("error: input path required unless --self-test", file=sys.stderr)
        return 2
    src = args.input.expanduser()
    if not src.is_file():
        print(f"error: input not found: {src}", file=sys.stderr)
        return 2

    im = load_rgba(src)
    if args.info:
        print(f"{im.width}x{im.height}")
        return 0

    if args.check:
        report = analyze_frame(im)
        print_report(report)
        return 0 if report.ok else 1

    if args.output is None:
        print("error: output path required unless --info, --check, or --self-test", file=sys.stderr)
        return 2

    raw_w, raw_h = im.size
    long_edge = max(raw_w, raw_h)
    if long_edge <= CHAT_PREVIEW_LONG_EDGE:
        print(
            f"warning: input {raw_w}x{raw_h} looks like a chat preview "
            f"(long edge <= {CHAT_PREVIEW_LONG_EDGE}). Prefer the original "
            "Desktop / filesystem PNG before framing.",
            file=sys.stderr,
        )

    if args.crop:
        im = apply_crop(im, args.crop)
    if args.max_width:
        im = downscale(im, args.max_width)
    first_blur_box = None
    for box in args.blur:
        if first_blur_box is None:
            first_blur_box = parse_box(box, im.width, im.height)
        apply_blur(
            im,
            box,
            strength=args.blur_strength,
            brush=args.blur_brush,
            hardness=args.blur_hardness,
        )
    for box in args.highlight:
        apply_highlight(im, box, pad=args.highlight_pad)
    for pair in args.arrow:
        apply_arrow(im, pair)
    if args.frame:
        existing = analyze_frame(im)
        if existing.already_framed and not args.force_frame:
            print("already has docs frame; not wrapping again", file=sys.stderr)
        else:
            im = apply_frame(
                im,
                stroke=args.frame_stroke,
                radius=args.frame_radius,
            )

    dest = args.output.expanduser()
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        print(f"warning: overwriting {dest}", file=sys.stderr)
    im.save(dest, format="PNG")
    if args.blur_preview and first_blur_box is not None:
        bx, by, bw, bh = first_blur_box
        # Preview is in post-frame coords when --frame added a stroke.
        stroke = args.frame_stroke if args.frame else 0
        pad = 24
        preview = im.crop(
            (
                max(0, bx + stroke - pad),
                max(0, by + stroke - pad),
                min(im.width, bx + stroke + bw + pad),
                min(im.height, by + stroke + bh + pad),
            )
        )
        preview_path = args.blur_preview.expanduser()
        preview_path.parent.mkdir(parents=True, exist_ok=True)
        preview.save(preview_path, format="PNG")
        print(f"blur preview: {preview_path} ({preview.width}x{preview.height})")
    report = analyze_frame(im)
    print(f"raw {raw_w}x{raw_h} -> wrote {dest} ({im.width}x{im.height})")
    print(
        f"blur: strength={args.blur_strength} brush={args.blur_brush} "
        f"hardness={args.blur_hardness} "
        f"optical_radius={photoscope_optical_radius(args.blur_strength, args.blur_brush)}"
        if args.blur
        else "blur: off"
    )
    print(f"highlight-pad: {args.highlight_pad}" if args.highlight else "highlight: off")
    print_report(report)
    if not report.ok:
        print("error: framed output failed --check", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
