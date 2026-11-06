#!/usr/bin/env node
// Print one ready-to-run use_figma script: the data it needs (a slice of the spec, and IDs from
// an earlier step) embedded, plus the shared prelude for steps that draw.
//
//   node figma-code.mjs <step> --spec <spec.json> [--ids <ids.json>] [--out <file>]
//
// Steps, in order (one use_figma call each; a script switches page at most once):
//   variables   collection, modes, palette, roles, radius, font family and style variables
//   pages       page skeleton in prior-art order (no drawing)
//   typography | colors | radius | brand    the atom pages and the roles-and-gaps page
//   buttons | fields | tags | cards    molecule and organism pages: main components plus one
//               frame per direction with instances. `cards` holds instances of the Button and
//               Badge, so run it after buttons and tags (--ids {"components": {"Button": id, "Badge": id}})

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MOLECULES = ['buttons', 'fields', 'tags', 'cards'];
const STEPS = ['variables', 'pages', 'typography', 'colors', 'radius', 'brand', ...MOLECULES];
const [step, ...rest] = process.argv.slice(2);
const opts = {};
for (let i = 0; i < rest.length; i += 2) opts[rest[i].replace(/^--/, '')] = rest[i + 1];
if (!STEPS.includes(step) || (step !== 'pages' && !opts.spec) || (step === 'cards' && !opts.ids)) {
  console.error(`usage: figma-code.mjs <${STEPS.join('|')}> --spec <spec.json> [--ids <ids.json> (cards)] [--out <file>]`);
  process.exit(2);
}

/** Rows and gates repeat per direction with only the values differing: send the shared
 *  structure once and the per-direction values as short arrays (keeps the script small). */
function brandSlice(full, base, slim) {
  const first = full.modes[0].id;
  const same = (a, b, key) => a.length === b.length && a.every((x, i) => x[key] === b[i][key]);
  const rowsOf = (id) => full.atoms.brand.rows[id];
  const gatesOf = (id) => full.atoms.colors[id].gates;
  for (const m of full.modes) {
    if (!same(rowsOf(first), rowsOf(m.id), 'token') || !same(gatesOf(first), gatesOf(m.id), 'fg')) throw new Error(`direction ${m.id} has a different token or pair list`);
  }
  return {
    ...base,
    modes: full.modes.map((m) => ({ ...slim(m), substitutionList: m.substitutionList })),
    atoms: {
      rows: rowsOf(first).map(({ group, token, swatch, status, target }) => ({ group, token, swatch, status, target })),
      values: Object.fromEntries(full.modes.map((m) => [m.id, rowsOf(m.id).map((r) => r.value)])),
      gates: gatesOf(first).map(({ fg, bg, min, wcag, advisory }) => ({ fg, bg, min, wcag, advisory })),
      ratios: Object.fromEntries(full.modes.map((m) => [m.id, gatesOf(m.id).map((g) => g.ratio)])),
      gaps: full.atoms.brand.gaps,
      notGenerated: full.atoms.brand.notGenerated,
    },
  };
}

const here = join(dirname(fileURLToPath(import.meta.url)), 'figma');
const body = readFileSync(join(here, `${MOLECULES.includes(step) ? 'molecules' : step}.js`), 'utf8');
let code;
if (step === 'pages') {
  code = body;
} else {
  const full = JSON.parse(readFileSync(opts.spec, 'utf8'));
  const slim = (m) => ({ id: m.id, name: m.name, summary: m.summary, archetype: m.archetype, fonts: m.fonts, action: m.action, substitutions: m.substitutions });
  const base = { collection: full.collection, labels: full.labels, modes: full.modes.map(slim) };
  const slices = {
    variables: { collection: full.collection, modes: base.modes, variables: full.variables },
    typography: { ...base, atoms: { typography: full.atoms.typography, notes: full.atoms.notes } },
    colors: { ...base, atoms: { colors: Object.fromEntries(Object.entries(full.atoms.colors).map(([k, c]) => [k, { seeds: c.seeds, families: c.families, extras: c.extras }])), notes: full.atoms.notes } },
    radius: { ...base, atoms: { radius: full.atoms.radius, notes: full.atoms.notes } },
    brand: brandSlice(full, base, slim),
  };
  // Molecule pages need the sample products of each direction.
  for (const s of MOLECULES) slices[s] = { collection: full.collection, modes: full.modes, which: s };
  const spec = JSON.stringify(slices[step]);
  const ids = opts.ids ? JSON.stringify(JSON.parse(readFileSync(opts.ids, 'utf8'))) : 'null';
  code =
    step === 'variables'
      ? body.replace('__SPEC__', () => spec)
      : [`const SPEC = ${spec};`, `const IDS = ${ids};`, readFileSync(join(here, 'lib.js'), 'utf8'), body].join('\n');
}

if (code.length > 50000) {
  console.error(`script is ${code.length} characters; use_figma accepts 50000`);
  process.exit(1);
}
if (opts.out) writeFileSync(opts.out, code);
else process.stdout.write(code);
