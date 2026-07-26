#!/usr/bin/env node
/**
 * Guard against silent 3D flattening.
 *
 * Per CSS Transforms Level 2 ("grouping property values"), these force the
 * used value of `transform-style` to `flat`, collapsing every translateZ()
 * *below* them:
 *
 *   filter / backdrop-filter, opacity < 1, overflow != visible,
 *   isolation: isolate, contain: paint, mask, clip-path, mix-blend-mode
 *
 * The failure is invisible — the page still renders, it just silently goes
 * flat. So we assert it statically.
 *
 * An element is only a problem if it is a genuine ANCESTOR of a `.layer-z-*`
 * node. A grouping utility on a leaf (e.g. a progress-bar track that clips
 * its own fill) is fine. We therefore parse the JSX element tree and test
 * each element's real subtree.
 *
 * Run: node scripts/check-3d.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const OFFENDERS = [
  { re: /\bbackdrop-blur(-[\w[\]./]+)?\b/, why: "backdrop-filter forces transform-style:flat" },
  { re: /\boverflow-(hidden|clip|auto|scroll)\b/, why: "overflow != visible forces flat" },
  { re: /\bisolate\b/, why: "isolation:isolate forces flat" },
  { re: /\bmix-blend-[\w-]+\b/, why: "mix-blend-mode forces flat" },
  { re: /\bglass-card\b/, why: "glass-card carries backdrop-filter — use glass-3d inside a tilt" },
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith(".tsx")) out.push(full);
  }
  return out;
}

/**
 * Walk JSX tags and return every element as { name, attrs, start, end }
 * where [start,end) spans the element including its children.
 */
function parseElements(src) {
  const tagRe = /<(\/)?([A-Za-z][\w.]*)((?:[^<>'"{}]|"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\})*?)(\/)?>/g;
  const stack = [];
  const elements = [];
  let m;
  while ((m = tagRe.exec(src))) {
    const [full, closing, name, attrs, selfClose] = m;
    if (closing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].name === name) {
          const el = stack.splice(i)[0];
          elements.push({ ...el, end: m.index + full.length });
          break;
        }
      }
    } else if (selfClose) {
      elements.push({ name, attrs, start: m.index, end: m.index + full.length });
    } else {
      stack.push({ name, attrs, start: m.index });
    }
  }
  // Unclosed (shouldn't happen in valid TSX) — treat as spanning to EOF.
  for (const el of stack) elements.push({ ...el, end: src.length });
  return elements;
}

let failures = 0;
let tiltCount = 0;
let ancestorChecks = 0;

for (const file of walk("src")) {
  const src = readFileSync(file, "utf8");
  if (!src.includes("Tilt3DCard")) continue;

  const elements = parseElements(src);
  const tilts = elements.filter((e) => e.name === "Tilt3DCard");

  for (const tilt of tilts) {
    const body = src.slice(tilt.start, tilt.end);
    if (!body.includes("layer-z-")) continue;
    tiltCount++;

    // Every element strictly inside this tilt.
    const inside = elements.filter(
      (e) => e.start > tilt.start && e.end <= tilt.end
    );

    for (const el of inside) {
      const subtree = src.slice(el.start, el.end);
      // Only ancestors of a Z-layer can do damage.
      const wrapsLayer = /layer-z-/.test(subtree.slice(el.attrs.length));
      if (!wrapsLayer) continue;
      // .clip-3d is the sanctioned escape hatch: it clips as an absolutely
      // positioned sibling and never wraps real content.
      if (el.attrs.includes("clip-3d")) continue;

      ancestorChecks++;
      for (const { re, why } of OFFENDERS) {
        if (re.test(el.attrs)) {
          const line = src.slice(0, el.start).split("\n").length;
          console.error(`✗ ${file}:${line}  <${el.name}>`);
          console.error(`    ${why}`);
          console.error(`    ${el.attrs.trim().slice(0, 140)}\n`);
          failures++;
        }
      }
    }
  }
}

if (failures) {
  console.error(`${failures} 3D-flattening issue(s) across ${tiltCount} tilt subtree(s).`);
  process.exit(1);
}
console.log(
  `✓ 3D depth intact — ${tiltCount} tilt subtree(s), ${ancestorChecks} Z-layer ancestor(s) verified clean.`
);
