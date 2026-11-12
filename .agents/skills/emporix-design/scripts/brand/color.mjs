// Colour maths for the brand actions: OKLCH <-> sRGB, gamut clamp, WCAG 2.x contrast.
// Zero dependencies so the skill runs anywhere Node 18+ runs.

const clamp01 = (v) => Math.min(1, Math.max(0, v));

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** OKLCH {l, c, h} -> linear sRGB [r, g, b] (may be out of gamut). */
function oklchToLinear({ l, c, h }) {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

/** Linear sRGB -> OKLCH {l, c, h}. */
function linearToOklch([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h: c < 1e-4 ? 0 : h };
}

const inGamut = (lin) => lin.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** Reduce chroma until the colour fits sRGB (binary search, hue and lightness kept). */
export function clampToGamut({ l, c, h }) {
  if (inGamut(oklchToLinear({ l, c, h }))) return { l, c, h };
  let lo = 0;
  let hi = c;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToLinear({ l, c: mid, h }))) lo = mid;
    else hi = mid;
  }
  return { l, c: lo, h };
}

/** Parse '#rgb', '#rrggbb', 'oklch(L C H)' (L as 0..1 or %), 'white', 'black'. */
export function parseColor(input) {
  const s = String(input).trim().toLowerCase();
  if (s === 'white') return { l: 1, c: 0, h: 0 };
  if (s === 'black') return { l: 0, c: 0, h: 0 };
  let m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (m) {
    let hex = m[1];
    if (hex.length === 3) hex = [...hex].map((ch) => ch + ch).join('');
    const rgb = [0, 2, 4].map((i) => srgbToLinear(parseInt(hex.slice(i, i + 2), 16) / 255));
    return linearToOklch(rgb);
  }
  m = s.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*[\d.%]+\s*)?\)$/);
  if (m) {
    const l = m[2] === '%' ? Number(m[1]) / 100 : Number(m[1]);
    return { l, c: Number(m[3]), h: Number(m[4]) };
  }
  throw new Error(`Unsupported colour: ${input}`);
}

export function toOklchString({ l, c, h }) {
  const r = (v, d) => Number(v.toFixed(d));
  return `oklch(${r(l, 4)} ${r(c, 4)} ${r(h, 2)})`;
}

export function toHex(color) {
  const lin = oklchToLinear(clampToGamut(color));
  return (
    '#' +
    lin
      .map((v) => Math.round(clamp01(linearToSrgb(clamp01(v))) * 255))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

/** WCAG 2.x relative luminance of a colour (after gamut clamp). */
export function luminance(color) {
  const [r, g, b] = oklchToLinear(clampToGamut(color)).map(clamp01);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
