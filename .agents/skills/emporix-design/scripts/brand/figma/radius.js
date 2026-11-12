// use_figma script: "Border radius" atom page, prior-art layout (sizes row, then a nesting
// example). Shows the brand's three radii and which target roles each one drives (from the
// profile's mapping). One frame per direction, each in its own mode. Only
// "Atoms / Border radius — {direction}" frames are replaced.
const page = await usePage('Border radius');
clearFrames(page, SPEC.modes.map((m) => `Atoms / Border radius — ${m.name}`));

const R = SPEC.atoms.radius;
const NAMES = { control: 'Control', container: 'Container', feature: 'Feature' };
const frames = {};
SPEC.modes.forEach((m, index) => {
  const f = directionFrame(page, m, 'Atoms / Border radius', 1160, index);
  headline(
    f,
    `Atoms / Border radius · ${m.name}`,
    'Border radius',
    `${m.summary} The brand sets three radii: controls (buttons, fields, pills), containers (cards, panels) and feature blocks. ${R ? 'Under each one: the roles of the target it drives.' : ''}`,
  );

  const sizes = attach(f, box('sizes', 'HORIZONTAL', 24));
  const roles = R ? R.roles : ['control', 'container', 'feature'].map((key) => ({ key, drives: [], approx: null }));
  for (const role of roles) {
    const px = R ? role.values[m.id] : null;
    const col = attach(sizes, box(role.key, 'VERTICAL', 8));
    attach(col, text(`${NAMES[role.key]} ${px !== null && px !== undefined ? `${px}px` : ''}`, { role: 'heading', color: 'color/text/body', size: 16 }));
    const rect = attach(col, figma.createRectangle());
    rect.name = `${role.key} radius`;
    rect.resize(222, 222);
    fillWith(rect, 'color/surface/action');
    radiusWith(rect, `radius/${role.key}`);
    if (role.drives.length) attach(col, text(`Drives: ${role.drives.join(', ')}`, { color: 'color/text/muted', size: 14, width: 222 }));
    if (px >= 222 / 2) attach(col, text('Fully rounded (pill).', { color: 'color/text/muted', size: 14, width: 222 }));
  }

  const ex = attach(f, box('Examples', 'VERTICAL', 16));
  attach(ex, text('Examples: panels use the feature radius, cards the container radius, buttons the control radius.', { color: 'color/text/body', size: 16, width: 960 }));
  const panel = attach(ex, figma.createAutoLayout('HORIZONTAL', { name: 'Examples', itemSpacing: 12 }));
  panel.paddingTop = panel.paddingBottom = panel.paddingLeft = panel.paddingRight = 12;
  fillWith(panel, 'color/surface/action');
  radiusWith(panel, 'radius/feature');
  for (const i of [1, 2]) {
    const card = attach(panel, figma.createAutoLayout('VERTICAL', { name: `0${i}`, itemSpacing: 12 }));
    card.paddingTop = card.paddingBottom = card.paddingLeft = card.paddingRight = 12;
    card.resize(198, 300);
    card.primaryAxisSizingMode = 'FIXED';
    card.counterAxisSizingMode = 'FIXED';
    fillWith(card, 'color/surface/raised');
    radiusWith(card, 'radius/container');
    const well = attach(card, figma.createRectangle());
    well.name = 'Image well';
    well.resize(174, 190);
    fillWith(well, 'color/surface/subtle');
    radiusWith(well, 'radius/container');
    const spacer = attach(card, figma.createFrame());
    spacer.name = 'spacer';
    spacer.fills = [];
    spacer.resize(1, 1);
    spacer.layoutGrow = 1;
    const btn = attach(card, figma.createAutoLayout('HORIZONTAL', { name: 'Button' }));
    btn.paddingTop = btn.paddingBottom = 10;
    fillWith(btn, 'color/surface/action');
    radiusWith(btn, 'radius/control');
    btn.layoutSizingHorizontal = 'FILL';
    btn.primaryAxisAlignItems = 'CENTER';
    attach(btn, text('Button', { role: 'action', color: 'color/text/on-action', size: 14 }));
  }
  noteList(f, SPEC.atoms.notes.radius);
  frames[m.id] = f.id;
});
return { pageId: page.id, frames, warnings: WARNINGS };
