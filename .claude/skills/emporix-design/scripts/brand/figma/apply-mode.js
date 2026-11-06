// use_figma script: show the brand on whole sections of the library by setting the brand collection's mode
// on each PAGE (no global switch exists). figma-apply-mode-code.mjs prepends `const CFG = {...}`:
//   brand    collection with one mode per direction
//   sections divider numerals to cover, e.g. ["I","II"] (atoms, molecules); the divider is the empty page
//            named like "I. ATOMS ↓", the section runs to the next divider
//   mode     mode name to set; null = list only (read-only)
//   budgetMs stop starting new pages after this long; the result says where to continue
// Only the page-level mode is written; nothing else. Re-running is a no-op for pages already set.
const T0 = Date.now();
const BRAND = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === CFG.brand);
if (!BRAND) throw new Error(`collection "${CFG.brand}" not found`);
const target = CFG.mode ? BRAND.modes.find((m) => m.name === CFG.mode) : null;
if (CFG.mode && !target) throw new Error(`mode "${CFG.mode}" not in ${CFG.brand}: ${BRAND.modes.map((m) => m.name).join(', ')}`);
const modeName = (id) => BRAND.modes.find((m) => m.modeId === id)?.name ?? null;
let section = null;
const rows = [];
for (const p of figma.root.children) {
  const d = p.name.trim().match(/^([IVX]+)\.\s/);
  if (d) { section = d[1]; continue; }
  if (/^-+$/.test(p.name.trim())) { if (p.children.length === 0 && /^-{3}$/.test(p.name.trim())) section = null; continue; }
  if (!section || !CFG.sections.includes(section)) continue;
  rows.push({ id: p.id, name: p.name.trim(), section, nodes: p.children.length, before: modeName(p.explicitVariableModes[BRAND.id]) });
}
const changed = [];
let next = null;
if (target) {
  for (let i = 0; i < rows.length; i++) {
    if (Date.now() - T0 > CFG.budgetMs) { next = rows[i].id; break; }
    const page = await figma.getNodeByIdAsync(rows[i].id);
    if (rows[i].before !== target.name) { page.setExplicitVariableModeForCollection(BRAND, target.modeId); changed.push(rows[i].id); }
  }
}
return { mode: target?.name ?? null, pages: rows.length, changed: changed.length, alreadySet: target ? rows.filter((r) => r.before === target.name).length : null, continueAt: next, rows: rows.map((r) => [r.id, r.name, r.section, r.nodes, r.before]) };
