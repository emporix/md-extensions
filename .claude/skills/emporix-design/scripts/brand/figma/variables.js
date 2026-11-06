// use_figma script: create or update the brand variable collection from the spec.
// Embedded by figma-code.mjs (SPEC is replaced with the spec JSON). Idempotent: collection,
// modes and variables are found by name and updated in place; nothing else is touched.
const SPEC = __SPEC__;

// Font style names differ per family ("SemiBold" vs "Semi Bold"): resolve from Figma's list.
const STYLE_NAMES = {
  100: ['Thin'], 200: ['ExtraLight', 'Extra Light'], 300: ['Light'],
  400: ['Regular', 'Book', 'Normal'], 500: ['Medium'], 600: ['SemiBold', 'Semi Bold', 'Demibold', 'DemiBold'],
  700: ['Bold'], 800: ['ExtraBold', 'Extra Bold'], 900: ['Black', 'Heavy'],
};
const available = await figma.listAvailableFontsAsync();
const stylesOf = (family) => available.filter((f) => f.fontName.family === family).map((f) => f.fontName.style);
const missingFonts = [];
function styleFor(family, weight) {
  const styles = stylesOf(family);
  if (!styles.length) {
    missingFonts.push(family);
    return null;
  }
  // Exact weight first, then the nearest weight that exists in this family.
  const order = Object.keys(STYLE_NAMES).map(Number).sort((a, b) => Math.abs(a - weight) - Math.abs(b - weight));
  for (const w of order) {
    const hit = STYLE_NAMES[w].find((s) => styles.includes(s));
    if (hit) return hit;
  }
  return styles[0];
}

let collection = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === SPEC.collection);
const createdCollection = !collection;
if (!collection) collection = figma.variables.createVariableCollection(SPEC.collection);

const modeIds = {};
SPEC.modes.forEach((m, i) => {
  let mode = collection.modes.find((x) => x.name === m.name);
  if (!mode && i === 0 && createdCollection) {
    collection.renameMode(collection.modes[0].modeId, m.name);
    mode = collection.modes.find((x) => x.name === m.name);
  }
  modeIds[m.id] = mode ? mode.modeId : collection.addMode(m.name);
});

// Style variables: one value per mode from the spec's weights.
const variables = SPEC.variables.slice();
const resolvedStyles = {};
for (const role of ['heading', 'body', 'action']) {
  const values = {};
  for (const m of SPEC.modes) {
    const f = m.fonts[role];
    values[m.id] = styleFor(f.family, f.weight);
    resolvedStyles[`${m.id}/${role}`] = `${f.family} ${values[m.id]}`;
  }
  variables.push({ name: `font/${role}-style`, type: 'STRING', scopes: ['FONT_STYLE'], values });
}
if (missingFonts.length) throw new Error(`fonts not available in Figma: ${[...new Set(missingFonts)].join(', ')}`);

const existing = await Promise.all(collection.variableIds.map((id) => figma.variables.getVariableByIdAsync(id)));
const byName = Object.fromEntries(existing.filter(Boolean).map((v) => [v.name, v]));
let created = 0;
for (const spec of variables) {
  let v = byName[spec.name];
  if (v && v.resolvedType !== spec.type) throw new Error(`${spec.name} exists as ${v.resolvedType}, spec wants ${spec.type}`);
  if (!v) {
    v = figma.variables.createVariable(spec.name, collection, spec.type);
    byName[spec.name] = v;
    created++;
  }
  v.scopes = spec.scopes;
  if (spec.web) v.setVariableCodeSyntax('WEB', spec.web);
}
for (const spec of variables) {
  const v = byName[spec.name];
  for (const [modeKey, value] of Object.entries(spec.values)) {
    const target = value && value.alias ? byName[value.alias] : null;
    if (value && value.alias && !target) throw new Error(`${spec.name}: alias ${value.alias} not found`);
    v.setValueForMode(modeIds[modeKey], target ? { type: 'VARIABLE_ALIAS', id: target.id } : value);
  }
}

return {
  collectionId: collection.id,
  modeIds,
  variables: variables.length,
  created,
  updated: variables.length - created,
  fonts: resolvedStyles,
};
