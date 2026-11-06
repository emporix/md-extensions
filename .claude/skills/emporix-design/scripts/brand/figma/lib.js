// Shared prelude for components.js and review.js (prepended by figma-code.mjs after SPEC/IDS).
// Every visual property is bound to the brand collection; nothing is hard-coded except sizes.
const COLLECTION = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === SPEC.collection);
if (!COLLECTION) throw new Error(`collection "${SPEC.collection}" missing: run variables.js first`);
const VARS = Object.fromEntries(
  (await Promise.all(COLLECTION.variableIds.map((id) => figma.variables.getVariableByIdAsync(id)))).filter(Boolean).map((x) => [x.name, x]),
);
const MODE = Object.fromEntries(SPEC.modes.map((m) => [m.id, COLLECTION.modes.find((x) => x.name === m.name).modeId]));
const v = (name) => {
  if (!VARS[name]) throw new Error(`variable ${name} missing`);
  return VARS[name];
};
const paint = (name) => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v(name));
const fillWith = (node, name) => (node.fills = [paint(name)]);
const strokeWith = (node, name, weight = 1) => {
  node.strokes = [paint(name)];
  node.strokeWeight = weight;
};
const radiusWith = (node, name) => {
  for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) node.setBoundVariable(k, v(name));
};

// Fonts of every mode must be loaded before any text is created, bound or overridden.
const FAMILY_VAR = { heading: 'font/heading', body: 'font/body', action: 'font/body' };
const FONT = {};
const toLoad = new Map();
for (const m of SPEC.modes) {
  FONT[m.id] = {};
  for (const role of ['heading', 'body', 'action']) {
    const fontName = {
      family: v(FAMILY_VAR[role]).valuesByMode[MODE[m.id]],
      style: v(`font/${role}-style`).valuesByMode[MODE[m.id]],
    };
    FONT[m.id][role] = fontName;
    toLoad.set(`${fontName.family}/${fontName.style}`, fontName);
  }
}
await Promise.all([...toLoad.values()].map((f) => figma.loadFontAsync(f)));
const BASE = SPEC.modes[0].id;
const WARNINGS = [];

/** Text bound to the brand's font family, style and colour. */
function text(chars, { role = 'body', color = 'color/text/body', size = 16, width, lh, ls, upper = false, underline = false } = {}) {
  const t = figma.createText();
  t.fontName = FONT[BASE][role];
  t.characters = chars;
  t.fontSize = size;
  if (lh) t.lineHeight = { unit: 'PIXELS', value: lh };
  if (ls) t.letterSpacing = { unit: 'PIXELS', value: ls };
  if (upper) t.textCase = 'UPPER';
  if (underline) t.textDecoration = 'UNDERLINE';
  t.fills = [paint(color)];
  try {
    t.setBoundVariable('fontFamily', v(FAMILY_VAR[role]));
    t.setBoundVariable('fontStyle', v(`font/${role}-style`));
  } catch (e) {
    WARNINGS.push(`font binding: ${e.message}`);
  }
  if (width) {
    t.textAutoResize = 'HEIGHT';
    t.resize(width, t.height);
  }
  return t;
}

async function usePage(name) {
  let page = figma.root.children.find((p) => p.name === name);
  if (!page) {
    // A new file starts with one empty "Page 1": reuse it for the first generated page.
    const blank = figma.root.children.find((p) => p.name === 'Page 1' && p.children.length === 0);
    page = blank ?? figma.createPage();
    page.name = name;
  }
  await figma.setCurrentPageAsync(page);
  return page;
}

// --- page scaffolding shared by the atom pages -------------------------------------------
const attach = (parent, child) => {
  parent.appendChild(child);
  return child;
};
/** Transparent auto-layout container. */
function box(name, dir = 'VERTICAL', gap = 16) {
  const f = figma.createAutoLayout(dir, { name, itemSpacing: gap });
  f.fills = [];
  return f;
}
/** One frame per direction, side by side, switched to that direction's mode. */
function directionFrame(page, m, title, width, index) {
  const f = figma.createAutoLayout('VERTICAL', { name: `${title} — ${m.name}`, itemSpacing: 56 });
  page.appendChild(f);
  f.paddingTop = f.paddingBottom = f.paddingLeft = f.paddingRight = 64;
  f.counterAxisSizingMode = 'FIXED';
  f.resize(width, f.height);
  f.x = index * (width + 120);
  f.y = 0;
  fillWith(f, 'color/surface/canvas');
  f.setExplicitVariableModeForCollection(COLLECTION, MODE[m.id]);
  return f;
}
/** Eyebrow, title and intro, in the prior-art page headline layout. */
function headline(frame, eyebrow, title, intro, width = 960) {
  const head = attach(frame, box('Page Headline/ Intro', 'VERTICAL', 24));
  const hl = attach(head, box('Page Headline', 'VERTICAL', 8));
  attach(hl, text(eyebrow, { role: 'heading', color: 'color/text/action', size: 16, upper: true, ls: 2 }));
  attach(hl, text(title, { role: 'heading', color: 'color/text/heading', size: 48 }));
  attach(head, text(intro, { color: 'color/text/body', size: 16, width }));
}
/** Section title with an explanation under it. */
function subhead(parent, title, body, width = 475) {
  const b = attach(parent, box('Explanation', 'VERTICAL', 8));
  attach(b, text(title, { role: 'heading', color: 'color/text/heading', size: 28 }));
  if (body) attach(b, text(body, { color: 'color/text/body', size: 16, width }));
  return b;
}
function noteList(frame, lines, title = 'Notes') {
  if (!lines || !lines.length) return;
  const n = attach(frame, box('Notes', 'VERTICAL', 6));
  attach(n, text(title, { role: 'action', color: 'color/text/muted', size: 12, upper: true, ls: 2 }));
  for (const l of lines) attach(n, text(l, { color: 'color/text/muted', size: 14, width: 960 }));
}
/** Remove only the frames this step generated on the page, by exact name. */
function clearFrames(page, names) {
  for (const n of page.children.filter((c) => names.includes(c.name))) n.remove();
}
const lsPx = (value, size) => (String(value).endsWith('em') ? parseFloat(value) * size : parseFloat(value) || 0);
