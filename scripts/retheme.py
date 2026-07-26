#!/usr/bin/env python3
"""
One-shot palette migration: "Royal Violet/Gold" -> "Aurora Performance".

Rewrites every hardcoded hex and rgba() literal in the source tree onto the
new colour-psychology palette. Tailwind utility class names (violet-*,
fuchsia-*, ...) are NOT touched here -- those are remapped centrally by the
`@theme` block in src/index.css, so the class names keep working.

Idempotent: running it twice is a no-op.
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

# ── hex literal remap ────────────────────────────────────────────────
HEX = {
    # surfaces: purple-black -> blue-black
    "#07040d": "#04070e",   # page background
    "#06040d": "#030610",   # footer / deepest
    "#0b0714": "#0a141f",   # card surface
    "#0f0a1e": "#0a141f",
    "#0f0a1a": "#0a141f",
    "#0f0720": "#0a141f",
    "#1a0f2e": "#0e1d2b",
    "#090511": "#04121a",   # ink (text on bright gradients)
    "#14050a": "#04121a",
    "#2a0e52": "#0b2f4a",
    "#3b0764": "#062a3a",
    "#1e1b4b": "#0b2f4a",
    "#4c1d95": "#0e4a5a",
    "#052e1f": "#05231f",

    # text
    "#f7f0df": "#e9f3f5",   # cream -> cool ice
    "#f8fafc": "#f2fbfc",

    # gold -> solar amber
    "#d8b35a": "#ffb627",
    "#b8943a": "#f0a01a",
    "#f59e0b": "#ffb627",
    "#fbbf24": "#ffc23d",
    "#d97706": "#f0a01a",
    "#eab308": "#ffc23d",
    "#f97316": "#f0a01a",
    "#fb923c": "#ffa94d",

    # violet -> aurora teal
    "#a78bfa": "#2dd4bf",
    "#c4b5fd": "#9df8e7",
    "#7c3aed": "#0e7490",
    "#8b5cf6": "#14b8a6",
    "#c084fc": "#5eead4",

    # fuchsia/magenta -> azure blue
    "#e879f9": "#3b9dff",
    "#f0abfc": "#93d0fd",
    "#a21caf": "#1a66d4",
    "#d946ef": "#3b9dff",

    # pink -> ember coral
    "#ec4899": "#ff5e5b",
    "#db2777": "#ed3f45",

    # greens -> vital
    "#34d399": "#34e08a",
    "#10b981": "#16c172",

    # reds -> ember
    "#fb7185": "#ff8a75",
    "#f87171": "#ff8a75",
    "#ef4444": "#ed3f45",
    "#fca5a5": "#ffb3a5",
}

# ── rgba() channel remap (whitespace-tolerant) ───────────────────────
RGBA = {
    (167, 139, 250): (45, 212, 191),    # violet  -> aurora
    (139, 92, 246):  (20, 184, 166),
    (124, 58, 237):  (14, 116, 144),
    (196, 181, 253): (157, 248, 231),
    (232, 121, 249): (59, 157, 255),    # fuchsia -> azure
    (217, 70, 239):  (59, 157, 255),
    (219, 39, 119):  (237, 63, 69),
    (79, 70, 229):   (26, 102, 212),
    (14, 165, 233):  (34, 128, 240),
    (125, 211, 252): (147, 208, 253),
    (56, 189, 248):  (96, 182, 250),
    (247, 240, 223): (233, 243, 245),   # cream   -> ice
    (216, 179, 90):  (255, 182, 39),    # gold    -> solar
    (245, 158, 11):  (255, 182, 39),
    (52, 211, 153):  (52, 224, 138),    # green   -> vital
    (16, 185, 129):  (22, 193, 114),
    (110, 231, 183): (126, 242, 168),
    (6, 95, 70):     (6, 95, 80),
    (251, 113, 133): (255, 138, 117),   # rose    -> ember
    (239, 68, 68):   (237, 63, 69),
    (7, 4, 13):      (4, 7, 14),        # surfaces
    (11, 7, 20):     (10, 20, 31),
    (75, 28, 143):   (11, 47, 74),
    (45, 17, 83):    (11, 47, 74),
}

TARGET_HEXES = {v.lower() for v in HEX.values()}
TARGET_RGBA = set(RGBA.values())

FILES = [
    *ROOT.joinpath("src").rglob("*.ts"),
    *ROOT.joinpath("src").rglob("*.tsx"),
    ROOT / "index.html",
    ROOT / "public" / "manifest.webmanifest",
    ROOT / "public" / "sw.js",
    ROOT / "android" / "twa-manifest.json",
    ROOT / "android" / "app" / "src" / "main" / "res" / "values" / "colors.xml",
]

# src/index.css is the hand-authored source of truth for the new palette.
SKIP = {ROOT / "src" / "index.css"}

hex_re = re.compile(r"#[0-9a-fA-F]{6}\b")
# NOTE: no leading \b — inside Tailwind arbitrary values the literal is
# preceded by "_" (e.g. shadow-[0_0_44px_rgba(...)]) and \b would not match
# there, silently leaving old colours behind.
rgba_re = re.compile(r"(rgba?)\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*")


def sub_hex(m: re.Match) -> str:
    raw = m.group(0)
    low = raw.lower()
    if low not in HEX:
        return raw
    new = HEX[low]
    # preserve the original casing convention (e.g. #07040D in android XML)
    return new.upper() if raw[1:].isupper() else new


def sub_rgba(m: re.Match) -> str:
    fn, r, g, b = m.group(1), int(m.group(2)), int(m.group(3)), int(m.group(4))
    key = (r, g, b)
    if key not in RGBA:
        return m.group(0)
    nr, ng, nb = RGBA[key]
    return f"{fn}({nr},{ng},{nb}"


def main() -> None:
    changed = 0
    for path in FILES:
        if path in SKIP or not path.is_file():
            continue
        original = path.read_text(encoding="utf-8")
        updated = rgba_re.sub(sub_rgba, hex_re.sub(sub_hex, original))
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            changed += 1
            print(f"  retinted  {path.relative_to(ROOT)}")
    print(f"\n{changed} file(s) migrated to the Aurora Performance palette.")


if __name__ == "__main__":
    main()
