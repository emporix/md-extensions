// Canonical brand vocabulary + direction.json -> tokens.json (W3C DTCG) build.
// The vocabulary here is the contract: brand-apply target profiles map these paths onto a target.

import { clampToGamut, parseColor, toOklchString } from './color.mjs';

export const EXT = 'com.emporix.brand';
export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
export const PALETTES = ['brand', 'accent', 'neutral'];

// Target lightness per ramp step and chroma share relative to the seed's step.
const STEP_L = { 50: 0.975, 100: 0.94, 200: 0.88, 300: 0.8, 400: 0.71, 500: 0.62, 600: 0.53, 700: 0.44, 800: 0.35, 900: 0.26 };
const STEP_C = { 50: 0.12, 100: 0.25, 200: 0.45, 300: 0.65, 400: 0.85, 500: 1, 600: 1, 700: 0.9, 800: 0.75, 900: 0.6 };

/** Light-theme defaults; a direction overrides any of them in `roles`. */
export const DEFAULT_ROLES = {
  'surface.canvas': 'white',
  'surface.raised': 'white',
  'surface.subtle': 'neutral.50',
  'surface.accent': 'accent.500',
  'surface.inverse': 'neutral.900',
  'surface.action': 'brand.600',
  'surface.action-hover': 'brand.700',
  'surface.action-subtle': 'brand.50',
  'text.heading': 'neutral.900',
  'text.body': 'neutral.800',
  'text.muted': 'neutral.600',
  'text.action': 'brand.600',
  'text.action-hover': 'brand.700',
  'text.on-action': 'white',
  'text.on-inverse': 'white',
  'border.default': 'neutral.200',
  'border.strong': 'neutral.900',
  'border.action': 'brand.600',
  'border.focus': 'brand.600',
};

/** Kinds of "closest alternative" a direction must record instead of hiding. */
export const SUBSTITUTION_KINDS = ['font', 'colour', 'contrast', 'shape', 'type', 'vocabulary', 'other'];

export const DEFAULT_RADIUS ={ control: '4px', container: '8px', feature: '16px' };
export const DEFAULT_TYPE = {
  'heading.weight': 700,
  'body.weight': 400,
  'action.weight': 700,
  'action.transform': 'none',
  'action.letterSpacing': '0',
};
const WEIGHT_KEYS = ['heading.weight', 'body.weight', 'action.weight'];
const withWeights = (weights, ...used) => [...new Set([...weights, ...used])].sort((a, b) => a - b);

/** Seed colour -> 10-step ramp; the seed lands unchanged on its nearest step. */
export function buildRamp(seedInput) {
  const seed = parseColor(seedInput);
  const seedStep = STEPS.reduce((best, s) => (Math.abs(STEP_L[s] - seed.l) < Math.abs(STEP_L[best] - seed.l) ? s : best), 500);
  const ramp = {};
  for (const step of STEPS) {
    const color =
      step === seedStep
        ? seed
        : clampToGamut({ l: STEP_L[step], c: (seed.c * STEP_C[step]) / STEP_C[seedStep], h: seed.h });
    ramp[step] = toOklchString(color);
  }
  return { ramp, seedStep };
}

const ROLE_REF = /^(white|black|(brand|accent|neutral)\.(50|[1-9]00))$/;

const refToAlias = (ref) => `{palette.${ref}}`;

/** Validate a direction; returns a list of human-readable problems (empty = valid). */
export function validateDirection(d) {
  const problems = [];
  for (const key of ['id', 'name', 'brief', 'archetype']) {
    if (!d[key] || typeof d[key] !== 'string') problems.push(`missing string "${key}"`);
  }
  if (d.id && !/^[a-z0-9-]+$/.test(d.id)) problems.push(`"id" must be kebab-case: ${d.id}`);
  for (const p of PALETTES) {
    try {
      parseColor(d.seeds?.[p]);
    } catch {
      problems.push(`seeds.${p} is not a colour (#hex or oklch()): ${d.seeds?.[p]}`);
    }
  }
  for (const [role, ref] of Object.entries(d.roles ?? {})) {
    if (!(role in DEFAULT_ROLES)) problems.push(`unknown role "${role}" (see references/brand/canonical-tokens.md)`);
    if (!ROLE_REF.test(ref)) problems.push(`role ${role} must reference a palette step or white/black, got "${ref}"`);
  }
  for (const [k, v] of Object.entries(d.radius ?? {})) {
    if (!(k in DEFAULT_RADIUS)) problems.push(`unknown radius "${k}"`);
    if (!/^\d+(\.\d+)?(px|rem)$/.test(v)) problems.push(`radius.${k} must be px or rem, got "${v}"`);
  }
  for (const k of ['heading', 'body']) {
    const f = d.font?.[k];
    if (!f?.family || !Array.isArray(f.weights) || !f.weights.length) problems.push(`font.${k} needs family and weights[]`);
  }
  for (const k of Object.keys(d.type ?? {})) {
    if (!(k in DEFAULT_TYPE)) problems.push(`unknown type setting "${k}"`);
    else if (WEIGHT_KEYS.includes(k) && !(Number.isInteger(d.type[k]) && d.type[k] >= 100 && d.type[k] <= 900 && d.type[k] % 100 === 0)) {
      problems.push(`type.${k} must be a weight 100-900 in steps of 100`);
    }
  }
  for (const [i, dec] of (d.decisions ?? []).entries()) {
    if (!dec.id || !dec.choice || !dec.why) problems.push(`decisions[${i}] needs id, choice, why`);
  }
  for (const [i, r] of (d.references ?? []).entries()) {
    if (!r.source || !(r.url || r.image)) problems.push(`references[${i}] needs source and url or image`);
  }
  for (const [i, s] of (d.substitutions ?? []).entries()) {
    for (const key of ['kind', 'what', 'wanted', 'used', 'why']) {
      if (!s[key]) problems.push(`substitutions[${i}] needs "${key}"`);
    }
    if (s.kind && !SUBSTITUTION_KINDS.includes(s.kind)) problems.push(`substitutions[${i}].kind must be one of ${SUBSTITUTION_KINDS.join(', ')}`);
  }
  if (d.polarityOverride !== undefined && (typeof d.polarityOverride !== 'string' || d.polarityOverride.length < 10)) {
    problems.push('polarityOverride must be a sentence saying who asked for the reversal and why');
  }
  if (d.source) {
    if (!/^https?:\/\//.test(d.source.url ?? '')) problems.push('source.url must be an http(s) URL');
    if (!['own', 'inspiration'].includes(d.source.use)) problems.push('source.use must be "own" or "inspiration"');
  }
  return problems;
}

/** direction.json -> DTCG tokens object. Call validateDirection first. */
export function buildTokens(d) {
  const palette = { white: { $type: 'color', $value: 'oklch(1 0 0)' }, black: { $type: 'color', $value: 'oklch(0 0 0)' } };
  const seedSteps = {};
  for (const p of PALETTES) {
    const { ramp, seedStep } = buildRamp(d.seeds[p]);
    seedSteps[p] = seedStep;
    palette[p] = Object.fromEntries(STEPS.map((s) => [s, { $type: 'color', $value: ramp[s] }]));
  }

  const color = {};
  for (const [role, ref] of Object.entries({ ...DEFAULT_ROLES, ...d.roles })) {
    const [group, name] = role.split('.');
    color[group] ??= {};
    color[group][name] = { $type: 'color', $value: refToAlias(ref) };
  }

  const radius = Object.fromEntries(
    Object.entries({ ...DEFAULT_RADIUS, ...d.radius }).map(([k, v]) => [k, { $type: 'dimension', $value: v }]),
  );

  const fontToken = (f) => ({ $type: 'fontFamily', $value: [f.family, f.fallback ?? 'sans-serif'] });
  const type = { ...DEFAULT_TYPE, ...d.type };

  return {
    $description: d.brief,
    $extensions: {
      [EXT]: {
        direction: { id: d.id, name: d.name, archetype: d.archetype, summary: d.summary ?? '' },
        seeds: Object.fromEntries(PALETTES.map((p) => [p, { value: d.seeds[p], step: seedSteps[p] }])),
        // Every weight a type token uses is loaded, so no consumer falls back to faux bold.
        fontSources: {
          heading: { family: d.font.heading.family, weights: withWeights(d.font.heading.weights, type['heading.weight']), source: d.font.heading.source ?? 'google' },
          body: { family: d.font.body.family, weights: withWeights(d.font.body.weights, type['body.weight'], type['action.weight']), source: d.font.body.source ?? 'google' },
        },
        sample: d.sample ?? null,
        source: d.source ?? null,
        polarityOverride: d.polarityOverride ?? null,
        references: d.references ?? [],
        decisions: d.decisions ?? [],
        substitutions: d.substitutions ?? [],
      },
    },
    palette,
    color,
    radius,
    font: { heading: fontToken(d.font.heading), body: fontToken(d.font.body) },
    type: {
      heading: { weight: { $type: 'fontWeight', $value: type['heading.weight'] } },
      body: { weight: { $type: 'fontWeight', $value: type['body.weight'] } },
      action: {
        weight: { $type: 'fontWeight', $value: type['action.weight'] },
        transform: { $value: type['action.transform'] },
        letterSpacing: { $type: 'dimension', $value: type['action.letterSpacing'] },
      },
    },
  };
}

/** Walk a DTCG object; yields { path: 'a.b.c', token } for every leaf with a $value. */
export function* walkTokens(node, prefix = []) {
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$') || child === null || typeof child !== 'object') continue;
    if ('$value' in child) yield { path: [...prefix, key].join('.'), token: child };
    else yield* walkTokens(child, [...prefix, key]);
  }
}

export function getToken(tokens, path) {
  return path.split('.').reduce((node, key) => node?.[key], tokens);
}

/** Resolve '{a.b}' aliases to the final $value. */
export function resolveValue(tokens, value, seen = new Set()) {
  const m = typeof value === 'string' && value.match(/^\{([^}]+)\}$/);
  if (!m) return value;
  if (seen.has(m[1])) throw new Error(`alias cycle at ${m[1]}`);
  seen.add(m[1]);
  const target = getToken(tokens, m[1]);
  if (!target) throw new Error(`unresolved alias {${m[1]}}`);
  return resolveValue(tokens, target.$value, seen);
}
