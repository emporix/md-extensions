// use_figma script: READ-ONLY read-back of resolved role values per brand mode.
// figma-readback-code.mjs prepends `const CFG = {...}`: brand (collection with one mode per direction),
// roles (variable names to read, from the profile's roleMap). Ramp variables (`ramp/...`) are read too.
// Each variable is resolved through its alias chain with the brand collection set to each mode in turn;
// other collections use their first mode. Writes nothing.
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const BRAND = collections.find((c) => c.name === CFG.brand);
if (!BRAND) throw new Error(`collection "${CFG.brand}" not found`);
const byId = Object.fromEntries(collections.map((c) => [c.id, c]));
const wanted = new Set(CFG.roles);
const all = await figma.variables.getLocalVariablesAsync();
const vars = all.filter((v) => wanted.has(v.name) || /^ramp\//.test(v.name));
const cache = {};
const get = async (id) => cache[id] || (cache[id] = await figma.variables.getVariableByIdAsync(id));
const hex = (c) => '#' + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('') + (c.a !== undefined && c.a < 1 ? Math.round(c.a * 255).toString(16).padStart(2, '0') : '');
async function resolve(v, modeId, depth = 0) {
  const col = byId[v.variableCollectionId];
  const own = col.id === BRAND.id ? modeId : col.modes[0].modeId;
  const val = v.valuesByMode[own] ?? v.valuesByMode[col.modes[0].modeId];
  if (val && val.type === 'VARIABLE_ALIAS' && depth < 12) return resolve(await get(val.id), modeId, depth + 1);
  return val;
}
const modes = {};
const missing = CFG.roles.filter((r) => !vars.some((v) => v.name === r));
for (const m of BRAND.modes) {
  const out = {};
  for (const v of vars) {
    const val = await resolve(v, m.modeId);
    out[v.name] = val && typeof val === 'object' && 'r' in val ? hex(val) : val;
  }
  modes[m.name] = out;
}
return { collection: BRAND.name, modes, missing, count: vars.length };
