// CSS custom properties: read declarations, resolve var() chains, parse colours with alpha.
// Zero dependencies; good enough for token files (no nesting beyond @theme / :root blocks).

import { readFileSync } from 'node:fs';
import { parseColor, toHex } from './color.mjs';

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Top-level blocks `{selector, body}`; one level of nesting is enough for :root / @theme. */
export function blocks(css) {
  const out = [];
  const src = stripComments(css);
  let depth = 0;
  let start = 0;
  let head = 0;
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '{') {
      if (depth === 0) {
        start = i + 1;
        out.push({ selector: src.slice(head, i).trim().split(/[;}]/).pop().trim() });
      }
      depth++;
    } else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        out[out.length - 1].body = src.slice(start, i);
        head = i + 1;
      }
    } else if (depth === 0 && src[i] === ';') head = i + 1;
  }
  return out;
}

export const declarations = (body) =>
  [...body.matchAll(/(--[A-Za-z0-9_*-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]);

/** Variables declared in :root-like blocks of the given files, later files win. */
export function readVars(files) {
  const vars = new Map();
  for (const file of files) {
    for (const b of blocks(readFileSync(file, 'utf8'))) {
      if (!/(^|,)\s*(:root|html|:host)\b/.test(b.selector)) continue;
      for (const [k, v] of declarations(b.body)) vars.set(k, v);
    }
  }
  return vars;
}

/** Declarations inside `@theme` blocks by utility name (prefix "--color-" -> "text-body" => "var(--color-text-body)"). */
export function themeDecls(file, prefix) {
  const decls = new Map();
  for (const b of blocks(readFileSync(file, 'utf8'))) {
    if (!b.selector.startsWith('@theme')) continue;
    for (const [k, v] of declarations(b.body)) {
      if (k.startsWith(prefix) && !k.endsWith('*')) decls.set(k.slice(prefix.length), v);
    }
  }
  return decls;
}

export const themeNames = (file, prefix) => new Set(themeDecls(file, prefix).keys());

/** Resolve an expression such as "var(--x)" against variables. */
export function resolveExpr(vars, expr) {
  const m = expr.match(/^var\(\s*(--[A-Za-z0-9_-]+)\s*\)$/);
  return m ? resolveVar(vars, m[1]) : expr;
}

/** Resolve var() references to a literal value; null when unresolved or cyclic. */
export function resolveVar(vars, name, seen = new Set()) {
  if (seen.has(name) || !vars.has(name)) return null;
  seen.add(name);
  let value = vars.get(name);
  for (let guard = 0; guard < 20 && value.includes('var('); guard++) {
    const m = value.match(/var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*([^()]*))?\)/);
    if (!m) break;
    const inner = resolveVar(vars, m[1], new Set(seen)) ?? m[2]?.trim() ?? null;
    if (inner === null) return null;
    value = value.replace(m[0], inner);
  }
  return value;
}

/** Colour literal -> {rgb: [0..255 x3], alpha}; null when not a parsable colour. */
export function rgba(value) {
  const s = String(value).trim().toLowerCase();
  if (s === 'transparent') return { rgb: [0, 0, 0], alpha: 0 };
  let m = s.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (m) {
    let hex = m[1];
    if (hex.length <= 4) hex = [...hex].map((c) => c + c).join('');
    const n = [0, 2, 4, 6].map((i) => parseInt(hex.slice(i, i + 2) || 'ff', 16));
    return { rgb: n.slice(0, 3), alpha: n[3] / 255 };
  }
  m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.]+)(%?))?\s*\)$/);
  if (m) return { rgb: [m[1], m[2], m[3]].map(Number), alpha: m[4] === undefined ? 1 : Number(m[4]) / (m[5] ? 100 : 1) };
  m = s.match(/^oklch\(([^/)]+)(?:\/\s*([\d.]+)(%?))?\s*\)$/);
  if (m) {
    try {
      const hex = toHex(parseColor(`oklch(${m[1].trim()})`));
      return { rgb: [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)), alpha: m[2] === undefined ? 1 : Number(m[2]) / (m[3] ? 100 : 1) };
    } catch {
      return null;
    }
  }
  if (s === 'white') return { rgb: [255, 255, 255], alpha: 1 };
  if (s === 'black') return { rgb: [0, 0, 0], alpha: 1 };
  return null;
}

/** Composite a (possibly translucent) colour over an opaque one. */
export const over = (top, base) => ({
  rgb: top.rgb.map((c, i) => c * top.alpha + base.rgb[i] * (1 - top.alpha)),
  alpha: 1,
});

const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ({ rgb }) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
export function contrast(a, b) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
export const hex = ({ rgb }) => '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
