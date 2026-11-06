// use_figma script: create the page skeleton in the prior-art order (separators like
// "I. ATOMS ↓" first, then the atom pages) without drawing. Pages are found by exact name and
// only moved, never deleted; other pages in the file are left where they are after these.
const ORDER = ['BRAND ↓', 'Roles and gaps', 'I. ATOMS ↓', 'Typography', 'Colors', 'Border radius', 'II. MOLECULES ↓', 'Buttons', 'Form Fields', 'Tags', 'III. ORGANISMS ↓', 'Product Cards'];
const created = [];
ORDER.forEach((name, i) => {
  let page = figma.root.children.find((p) => p.name === name);
  if (!page) {
    page = figma.createPage();
    page.name = name;
    created.push(name);
  }
  figma.root.insertChild(i, page);
});
return { order: figma.root.children.map((p) => `${p.id} ${p.name}`), created };
