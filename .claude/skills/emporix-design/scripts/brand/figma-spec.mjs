#!/usr/bin/env node
// Brand directions -> Figma spec: variables (one collection, one mode per direction) and the
// data behind the pages (colours, typography, radius, roles and gaps).
//
//   node figma-spec.mjs <brand folder | a.tokens.json b.tokens.json ...> --out <spec.json>
//                       [--profile <target.json> --target <app repo>] [--name <collection name>]
//
// The spec is the only input of the Figma scripts in figma/ (embedded by figma-code.mjs).
// Brand values come only from the tokens. With --profile and --target, the values the TARGET
// owns (type scale, radius mapping, shadow geometry) are read from the target's own CSS, so
// they are never invented here and follow the app when it changes. Without them those parts
// are left out and the page says so. Showcase-only atoms the brand has no tokens for (shadows,
// spacing, icon colours) are not generated; the roles-and-gaps page lists them. Palette steps become hidden primitives; roles alias them
// per mode, so a frame switched to a mode shows that direction. Font style names are resolved
// inside Figma, from the weights here.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parseColor, toHex, contrastRatio } from './color.mjs';
import { evaluateContrast } from './contrast.mjs';
import { readVars, resolveVar } from './css-vars.mjs';
import { DEFAULT_TYPE, EXT, PALETTES, STEPS, getToken } from './tokens.mjs';

const args = process.argv.slice(2);
const opts = {};
const inputs = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) opts[args[i].slice(2)] = args[++i];
  else inputs.push(args[i]);
}
if (!inputs.length || !opts.out) {
  console.error('usage: figma-spec.mjs <brand folder | tokens.json ...> --out <spec.json> [--profile <target.json> --target <repo>] [--name <collection>]');
  process.exit(2);
}

// A brand folder means every {id}.tokens.json in it, chosen direction first.
let files = inputs;
let brand = null;
if (inputs.length === 1 && !inputs[0].endsWith('.json')) {
  brand = basename(inputs[0]);
  files = readdirSync(inputs[0]).filter((f) => f.endsWith('.tokens.json')).sort().map((f) => join(inputs[0], f));
  try {
    const chosen = JSON.parse(readFileSync(join(inputs[0], 'chosen.json'), 'utf8')).direction;
    files.sort((a, b) => (basename(b).startsWith(chosen + '.') ? 1 : 0) - (basename(a).startsWith(chosen + '.') ? 1 : 0));
  } catch {}
}
if (files.length > 4) {
  console.error(`${files.length} directions: Figma Professional allows 4 modes per collection; pass at most 4 token files`);
  process.exit(2);
}

const hexOf = (css) => toHex(parseColor(css));
const rgba = (css, a = 1) => {
  const hex = hexOf(css);
  return { r: parseInt(hex.slice(1, 3), 16) / 255, g: parseInt(hex.slice(3, 5), 16) / 255, b: parseInt(hex.slice(5, 7), 16) / 255, a };
};
const round = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v * 10000) / 10000]));
const aliasOf = (v) => (typeof v === 'string' ? v.match(/^\{([^}]+)\}$/)?.[1] : undefined);
const px = (v) => (v === '0' ? 0 : parseFloat(v));
const weight = (t, role) => Number(getToken(t, `type.${role}.weight`)?.$value ?? DEFAULT_TYPE[`${role}.weight`]);
const labelOn = (hex) => (contrastRatio(parseColor(hex), parseColor('white')) >= contrastRatio(parseColor(hex), parseColor('black')) ? 'white' : 'black');

const SCOPES = {
  surface: ['FRAME_FILL', 'SHAPE_FILL'],
  text: ['TEXT_FILL'],
  border: ['STROKE_COLOR'],
};

// --- target (profile + the app's own CSS) -----------------------------------------------
const profile = opts.profile ? JSON.parse(readFileSync(opts.profile, 'utf8')) : null;
const codeSyntax = {};
for (const m of profile?.map ?? []) {
  if (m.refOnly || m.from.includes('*')) continue;
  const to = Array.isArray(m.to) ? m.to[0] : m.to;
  codeSyntax[m.from] ??= `var(${to})`;
}

/** Split at depth 0 on a separator character (',' or whitespace), keeping var(...) intact. */
function splitTop(s, sep) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    const isSep = depth === 0 && (sep === ',' ? ch === ',' : /\s/.test(ch));
    if (isSep) {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const TYPE_ROWS = [
  ['heading-h1', 'H1'], ['heading-h2', 'H2'], ['heading-h3', 'H3'], ['heading-h4', 'H4'], ['heading-h5', 'H5'], ['heading-h6', 'H6'],
  ['heading-overline', 'Overline'], ['body-lg', 'Body L'], ['body-md', 'Body M'], ['body-sm', 'Body S'], ['action-button', 'Button'],
];
const RADIUS_STEPS = ['none', 'sm', 'md', 'lg', 'xl', '2xl'];

function readTarget(profile, root) {
  const vars = readVars(profile.tokenSources.map((f) => join(root, f)));
  const toPx = (v) => {
    const m = String(v ?? '').trim().match(/^(-?[\d.]+)(rem|px)?$/);
    return m ? Math.round(parseFloat(m[1]) * (m[2] === 'rem' ? 16 : 1) * 100) / 100 : null;
  };
  const val = (name) => toPx(resolveVar(vars, name));
  const lengthOf = (token) => {
    const name = token.match(/var\(\s*(--[\w-]+)/)?.[1];
    return name ? val(name) : toPx(token);
  };

  const typeScale = {};
  for (const dev of ['desktop', 'mobile']) {
    typeScale[dev] = {};
    for (const [key, label] of TYPE_ROWS) {
      const size = val(`--${dev}-font-size-${key}`);
      if (size == null) continue;
      typeScale[dev][label] = { size, lh: val(`--${dev}-line-height-${key}`) ?? Math.round(size * 1.3) };
    }
    typeScale[dev].Overline && (typeScale[dev].Overline.ls = val(`--${dev}-spacing-heading-overline`) ?? 0);
  }

  const radiusScale = RADIUS_STEPS.map((k) => ({ step: k, px: val(`--border-radius-${k}`) })).filter((r) => r.px != null);

  // Which target roles each brand radius drives, from the profile's own mapping.
  const radius = {};
  for (const m of profile.map ?? []) {
    if (!m.from.startsWith('radius.')) continue;
    const key = m.from.slice('radius.'.length);
    radius[key] = {
      drives: [].concat(m.to).map((v) => v.replace(/^--border-radius-/, '').replace(/-/g, ' ')),
      approx: m.approx ?? null,
    };
  }
  return { name: profile.target, typeScale, radiusScale, radius };
}
const target = profile && opts.target ? readTarget(profile, opts.target) : null;
const labels = { brand: 'Brand color', accent: 'Accent color', neutral: 'Neutral colors', ...(profile?.figma?.labels ?? {}) };

// --- brand (the tokens) -------------------------------------------------------------------
const modes = [];
const vars = new Map();
const put = (name, type, scopes, modeId, value, from, web) => {
  if (!vars.has(name)) vars.set(name, { name, type, scopes, values: {}, ...((web ?? codeSyntax[from]) ? { web: web ?? codeSyntax[from] } : {}) });
  vars.get(name).values[modeId] = value;
};
const atoms = { colors: {}, typography: { scale: target?.typeScale ?? null, target: target?.name ?? null }, radius: null, brand: { rows: {}, gaps: [], notGenerated: [] }, notes: {} };

/** What the target does with one vocabulary token: from the profile's map and gaps. */
function targetRow(path) {
  if (!profile) return { status: 'no target', target: '' };
  const m = (profile.map ?? []).find((x) => x.from === path);
  const gap = (profile.gaps ?? []).find((g) => g.token === path);
  const to = m ? [].concat(m.to) : [];
  const shown = to.length ? to[0] + (to.length > 1 ? ` +${to.length - 1}` : '') : '';
  if (gap && !m) return { status: 'no counterpart', target: '' };
  if (gap) return { status: 'mapped, not effective', target: shown };
  if (m?.approx) return { status: 'approximate', target: shown };
  if (m) return { status: 'maps', target: shown };
  return { status: 'not mapped', target: '' };
}
const radiusValues = {};

for (const file of files) {
  const t = JSON.parse(readFileSync(file, 'utf8'));
  const ext = t.$extensions?.[EXT] ?? {};
  const id = ext.direction?.id ?? basename(file, '.tokens.json');
  modes.push({
    id,
    name: ext.direction?.name ?? id,
    summary: ext.direction?.summary ?? '',
    archetype: ext.direction?.archetype ?? '',
    sample: ext.sample ?? {},
    // Weights come from the tokens; tokens built before body/action weights existed use the
    // vocabulary defaults (the same values brand-create writes today).
    fonts: {
      heading: { family: t.font.heading.$value[0], weight: weight(t, 'heading') },
      body: { family: t.font.body.$value[0], weight: weight(t, 'body') },
      action: { family: t.font.body.$value[0], weight: weight(t, 'action') },
    },
    action: {
      transform: getToken(t, 'type.action.transform')?.$value ?? 'none',
      letterSpacing: getToken(t, 'type.action.letterSpacing')?.$value ?? '0',
    },
    substitutions: (ext.substitutions ?? []).length,
    substitutionList: (ext.substitutions ?? []).map((x) => ({ kind: x.kind, what: x.what, wanted: x.wanted, used: x.used, why: x.why })),
  });

  for (const key of ['white', 'black']) put(`palette/${key}`, 'COLOR', [], id, round(rgba(t.palette[key].$value)));
  for (const p of PALETTES) for (const s of STEPS) put(`palette/${p}/${s}`, 'COLOR', [], id, round(rgba(t.palette[p][s].$value)));

  const roles = [];
  for (const [group, groupRoles] of Object.entries(t.color)) {
    for (const [role, tok] of Object.entries(groupRoles)) {
      const path = `color.${group}.${role}`;
      const a = aliasOf(tok.$value);
      const value = a?.startsWith('palette.') ? { alias: a.replaceAll('.', '/') } : round(rgba(tok.$value));
      put(`color/${group}/${role}`, 'COLOR', SCOPES[group] ?? ['ALL_FILLS'], id, value, path);
      const resolved = a ? getToken(t, a)?.$value ?? tok.$value : tok.$value;
      roles.push({ group, name: `color/${group}/${role}`, step: a ? a.replace('palette.', '').replaceAll('.', ' ') : 'literal', hex: hexOf(resolved) });
    }
  }
  for (const [k, tok] of Object.entries(t.radius)) {
    put(`radius/${k}`, 'FLOAT', ['CORNER_RADIUS'], id, px(tok.$value), `radius.${k}`);
    (radiusValues[k] ??= {})[id] = px(tok.$value);
  }
  for (const k of ['heading', 'body']) put(`font/${k}`, 'STRING', ['FONT_FAMILY'], id, t.font[k].$value[0], `font.${k}`);

  // Roles and gaps page: every vocabulary token with its value in this direction and what the
  // target does with it (from the profile's own mapping and gap list).
  const rows = [];
  for (const r of roles) rows.push({ group: 'Colour', token: r.name.replaceAll('/', '.'), swatch: r.name, value: `${r.hex}  ·  ${r.step}`, ...targetRow(r.name.replaceAll('/', '.')) });
  for (const [k, tok] of Object.entries(t.radius)) rows.push({ group: 'Shape', token: `radius.${k}`, value: tok.$value, ...targetRow(`radius.${k}`) });
  for (const k of ['heading', 'body']) rows.push({ group: 'Type', token: `font.${k}`, value: t.font[k].$value[0], ...targetRow(`font.${k}`) });
  for (const k of ['heading.weight', 'body.weight', 'action.weight', 'action.transform', 'action.letterSpacing']) {
    const tok = getToken(t, `type.${k}`);
    rows.push({ group: 'Type', token: `type.${k}`, value: String(tok?.$value ?? DEFAULT_TYPE[k]), ...targetRow(`type.${k}`) });
  }
  atoms.brand.rows[id] = rows;

  atoms.colors[id] = {
    seeds: ext.seeds ?? {},
    families: Object.fromEntries(
      PALETTES.map((p) => [p, STEPS.map((s) => { const hex = hexOf(t.palette[p][s].$value); return { step: s, hex, label: labelOn(hex) }; })]),
    ),
    extras: [{ name: 'White', hex: '#ffffff', label: 'black' }, { name: 'Black', hex: '#000000', label: 'white' }],
    gates: evaluateContrast(t).map((r) => ({ fg: r.fg.replaceAll('.', '/'), bg: r.bg.replaceAll('.', '/'), ratio: r.ratio, min: r.min, wcag: r.wcag, advisory: !!r.advisory, below: r.below })),
  };
}

if (target) {
  atoms.radius = {
    roles: ['control', 'container', 'feature'].map((key) => ({ key, values: radiusValues[key] ?? {}, ...(target.radius[key] ?? { drives: [], approx: null }) })),
    targetScale: target.radiusScale,
  };
}
atoms.brand.gaps = (profile?.gaps ?? []).map((g) => ({ token: g.token, where: g.where, why: g.why, fix: g.fix }));
atoms.brand.notGenerated = [
  'Semantic colours (success, warning, error, information) and gradients: not brand tokens; the target keeps its own.',
  'Drop shadows: need a shadow colour in the brand vocabulary (backlog: color.shadow); geometry stays with the target.',
  'Icon colours, spacing scale, border widths: showcase-only atoms, not brand inputs yet.',
  'Italic and bold body styles: not in the brand vocabulary.',
];
atoms.notes = {
  colors: ['Semantic colours and gradients are not brand tokens: the target keeps its own. Roles and contrast results are on the roles-and-gaps page.'],
  typography: [
    target
      ? `Sizes and line heights come from ${target.name}'s type scale, read from its CSS. The brand sets families, weights, button casing and tracking.`
      : 'No target given: sizes are illustrative. The brand sets families, weights, button casing and tracking.',
    'Not in the brand vocabulary: italic and bold body styles. Body text uses the single body weight.',
  ],
  radius: [
    target ? `The target's own scale is ${target.radiusScale.map((r) => `${r.step} ${r.px}px`).join(', ')}; the brand's three radii map onto it as listed.` : 'No target given: only the brand radii are shown.',
    ...Object.entries(target?.radius ?? {}).filter(([, v]) => v.approx).map(([k, v]) => `radius.${k}: ${v.approx}`),
  ],
};

const spec = {
  generatedBy: 'emporix-design brand-figma',
  brand,
  collection: opts.name ?? 'Brand',
  target: target?.name ?? null,
  labels,
  modes,
  // Style names per mode are filled in by figma/variables.js from the weights above.
  styleVariables: ['font/heading-style', 'font/body-style', 'font/action-style'],
  variables: [...vars.values()],
  atoms,
};
writeFileSync(opts.out, JSON.stringify(spec, null, 2) + '\n');
console.log(
  `spec: ${modes.length} modes (${modes.map((m) => m.name).join(', ')}), ${spec.variables.length} variables` +
    `${target ? `, target ${target.name}: type scale, ${target.radiusScale.length} radii` : ', no target (type scale and radius mapping left out)'}, ${atoms.brand.gaps.length} target gaps -> ${opts.out}`,
);
