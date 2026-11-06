// use_figma script: READ-ONLY readiness scan of a Figma design file ("can a brand reach everything?").
// figma-readiness-code.mjs prepends `const CFG = {...}`. Every finding carries node ids so a human can
// open the element: rows are aggregated per frame and kind, with up to CFG.samples node ids each.
// CFG: pages (ids, or null = every page with content), frames ('all' | 'widest'), cursor {p, f},
//      budgetMs, brand (collection name), fixed (regex source: marks likely-intentional fixed things),
//      largeSide, largeNodes, samples.
const T0 = Date.now();
const FIXED = new RegExp(CFG.fixed, 'i');
const BRAND = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === CFG.brand);
const hex = (c) => '#' + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
const ids = CFG.pages || figma.root.children.filter((p) => p.children.length).map((p) => p.id);
// Compact output (the result must stay under the tool's size limit): names once per id, one array per finding
// [pageId, frameId|null, kind, key, count, samples, likely 1|0]; figma-readiness-report.mjs expands it.
const names = {};
const rows = [];
const R = (page, fr, o) => { names[page.id] = page.name.trim(); if (fr) names[fr.id] = fr.name.slice(0, 50); rows.push([page.id, fr ? fr.id : null, o.kind, o.key, o.count, o.samples, o.likely ? 1 : 0]); };
let { p, f } = CFG.cursor;
let nodesTotal = 0;
const chain = (n, frame) => { const out = []; let t = n; for (let i = 0; i < 4 && t && t.id !== frame.id && t.type !== 'PAGE'; i++) { out.unshift(t.name.slice(0, 24)); t = t.parent; } return out.slice(-3).join(' > '); };
const ancestors = (n, frame) => { const out = []; let t = n; for (let i = 0; i < 12 && t && t.id !== frame.id && t.type !== 'PAGE'; i++) { out.push(t.name); t = t.parent; } return out; };
const fixedMark = (n, frame) => ancestors(n, frame).find((x) => FIXED.test(x));
const widest = (page) => {
  const c = [];
  for (const top of page.children) {
    if (top.type === 'FRAME' && top.width <= 1930 && top.height > 600 && !/^Pages \//.test(top.name)) c.push(top);
    if ('children' in top && top.children.length < 60) for (const k of top.children) if (k.type === 'FRAME' && k.width >= 1900 && k.width <= 1930 && k.height > 600 && !/^Pages \//.test(k.name)) c.push(k);
  }
  c.sort((a, b) => b.width - a.width || a.height - b.height);
  return c.slice(0, 1);
};
while (p < ids.length && Date.now() - T0 < CFG.budgetMs) {
  const page = await figma.getNodeByIdAsync(ids[p]);
  await page.loadAsync();
  const frames = CFG.frames === 'widest' ? widest(page) : page.children;
  if (f === 0 && BRAND && page.explicitVariableModes[BRAND.id] === undefined) R(page, null, { kind: 'page-mode-not-set', key: CFG.brand, count: 1, samples: [page.id] });
  if (f === 0 && CFG.frames === 'widest' && !frames.length) R(page, null, { kind: 'not-scanned', key: 'no 1920 px variant', count: 1, samples: [page.id] });
  if (f >= frames.length) { p++; f = 0; continue; }
  const fr = frames[f];
  const g = {};
  const add = (kind, key, n, likely) => { const k = kind + '|' + key; const x = g[k] || (g[k] = { kind, key, count: 0, samples: [], likely }); x.count++; if (x.samples.length < CFG.samples) x.samples.push(n.id); };
  let nodes = 0, truncated = false;
  const stack = [fr];
  while (stack.length) {
    const n = stack.pop();
    nodes++;
    if (nodes % 25 === 0 && Date.now() - T0 > CFG.budgetMs + 15000) { truncated = true; break; }
    if ('children' in n) for (const c of n.children) stack.push(c);
    if (n.type === 'TEXT') {
      if (!(n.boundVariables && n.boundVariables.fontFamily)) add('text-font-unbound', chain(n.parent && n.parent.id !== fr.id ? n.parent : n, fr), n, false);
      if (/^#[0-9a-f]{6}$/i.test(n.characters.trim())) add('static-hex-label', 'text typed as a colour value', n, false);
    }
    if (n.type === 'INSTANCE') { try { const mc = await n.getMainComponentAsync(); if (mc && mc.remote) add('remote-instance', `${mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent.name + ' / ' : ''}${mc.name}`.slice(0, 60), n, !!fixedMark(n, fr)); } catch (e) {} }
    for (const key of ['fills', 'strokes']) {
      const arr = n[key];
      if (!Array.isArray(arr)) continue;
      for (const q of arr) {
        if (q.visible === false) continue;
        if (q.type === 'SOLID' && key === 'strokes' && n.type === 'COMPONENT_SET') add('paint-unbound', 'component set outline (Figma design-time stroke)', n, true);
        else if (q.type === 'SOLID' && !(q.boundVariables && q.boundVariables.color)) { const m = fixedMark(n, fr); add('paint-unbound', m ? `fixed mark "${m.slice(0, 40)}" (all its colours)` : `${hex(q.color)} ${key === 'strokes' ? 'stroke' : 'fill'} in ${chain(n, fr)}`, n, !!m); }
        else if (String(q.type).startsWith('GRADIENT') && !q.gradientStops.every((s) => s.boundVariables && s.boundVariables.color)) { const m = fixedMark(n, fr); add('gradient-unbound', m ? `fixed mark "${m.slice(0, 40)}"` : chain(n, fr), n, !!m); }
        else if (q.type === 'IMAGE') add('image-fill', chain(n.parent && n.parent.id !== fr.id ? n.parent : n, fr), n, true);
      }
    }
    if (Array.isArray(n.effects)) for (const e of n.effects) if (e.visible !== false && /SHADOW/.test(e.type) && !(e.boundVariables && e.boundVariables.color)) add('effect-unbound', e.type + ' in ' + chain(n, fr), n, false);
  }
  nodesTotal += nodes;
  const list = Object.values(g).sort((a, b) => b.count - a.count);
  for (const x of list.slice(0, 14)) R(page, fr, x);
  if (list.length > 14) R(page, fr, { kind: 'more-findings', key: `${list.length - 14} further groups not listed`, count: list.length - 14, samples: [fr.id] });
  if (fr.width > CFG.largeSide || fr.height > CFG.largeSide || nodes > CFG.largeNodes) R(page, fr, { kind: 'heavy-frame', key: `${Math.round(fr.width)}x${Math.round(fr.height)} px, ${nodes} layers${truncated ? ', scan truncated' : ''}`, count: 1, samples: [fr.id] });
  f++;
}
return { names, r: rows, cursor: { p, f }, done: p >= ids.length, nodes: nodesTotal, ms: Date.now() - T0, pages: ids.length };
