// use_figma script: one molecule/organism page in the prior-art layout. SPEC.which selects it:
//   buttons -> "Buttons"       Button set (Style x State)
//   fields  -> "Form Fields"   Input
//   tags    -> "Tags"          Badge
//   cards   -> "Product Cards" Product card, built from Button and Badge instances (needs IDS)
// The page gets a "Main components" frame (shown in the first direction's mode) and one frame
// per direction with instances, each in its own mode. Regenerated as a whole: only these frames
// are replaced, so re-run `cards` after re-running `buttons` or `tags` (it holds instances of both).
const CONF = {
  buttons: { page: 'Buttons', title: 'Buttons', group: 'Molecules', intro: 'Style and state variants. Colours, corner radius and font come from the brand; hover uses the brand hover colours.' },
  fields: { page: 'Form Fields', title: 'Form Fields', group: 'Molecules', intro: 'Text field with label and placeholder. The field radius is the control radius, like buttons.' },
  tags: { page: 'Tags', title: 'Tags', group: 'Molecules', intro: "Badges on the subtle action surface, shown with the brand's sample badge texts." },
  cards: { page: 'Product Cards', title: 'Product Cards', group: 'Organisms', intro: "Product tile with image well, badge, name, price and primary button, using the brand's sample products." },
}[SPEC.which];
const NOTES = {
  buttons: ["Hover is the brand's hover colours. Disabled, focus and loading states are not generated: the brand has no tokens for them.", 'Button casing and letter spacing are applied per frame from the brand tokens; they cannot be Figma variables.'],
  fields: ['Focus, error and disabled states are not generated: the brand has no tokens for them.'],
  tags: ["Tags are shown on a raised surface: the subtle action surface is close to the page canvas and would not read on it.", "Only the subtle action tag is generated. Semantic tags (success, warning, error) use the target's own colours."],
  cards: ["Names, prices and badges are the brand's sample content, not product data."],
}[SPEC.which];

const page = await usePage(CONF.page);
const MAIN = 'Main components';
const frameName = (m) => `${CONF.group} / ${CONF.title} — ${m.name}`;
clearFrames(page, [MAIN, ...SPEC.modes.map(frameName)]);

const propKey = (inst, name) => Object.keys(inst.componentProperties).find((k) => k.split('#')[0] === name);
function actionCase(inst, m) {
  const label = inst.findOne((n) => n.type === 'TEXT');
  if (!label) return;
  if (m.action.transform === 'uppercase') label.textCase = 'UPPER';
  const em = parseFloat(m.action.letterSpacing);
  if (em) label.letterSpacing = { unit: 'PERCENT', value: em * 100 };
}

// Main components frame, to the right of the direction frames.
const main = attach(page, box(MAIN, 'VERTICAL', 24));
main.x = SPEC.modes.length * (1160 + 120);
main.y = 0;
attach(main, text('Main components', { role: 'heading', color: 'color/text/muted', size: 16 }));
attach(main, text(`Shown in the first direction's mode (${SPEC.modes[0].name}). Instances in the direction frames follow their own mode.`, { color: 'color/text/muted', size: 12, width: 420 }));

const made = {};
let button = null;
let input = null;
let badge = null;
let card = null;

if (SPEC.which === 'buttons') {
  const BUTTON = {
    Primary: {
      Default: { fill: 'color/surface/action', label: 'color/text/on-action' },
      Hover: { fill: 'color/surface/action-hover', label: 'color/text/on-action' },
    },
    Secondary: {
      Default: { fill: 'color/surface/raised', stroke: 'color/border/action', label: 'color/text/action' },
      Hover: { fill: 'color/surface/action-subtle', stroke: 'color/border/action', label: 'color/text/action-hover' },
    },
  };
  const variants = [];
  for (const [style, states] of Object.entries(BUTTON)) {
    for (const [state, s] of Object.entries(states)) {
      const c = figma.createComponent();
      c.name = `Style=${style}, State=${state}`;
      c.layoutMode = 'HORIZONTAL';
      c.primaryAxisSizingMode = 'AUTO';
      c.counterAxisSizingMode = 'AUTO';
      c.primaryAxisAlignItems = 'CENTER';
      c.counterAxisAlignItems = 'CENTER';
      c.paddingTop = c.paddingBottom = 12;
      c.paddingLeft = c.paddingRight = 24;
      fillWith(c, s.fill);
      if (s.stroke) strokeWith(c, s.stroke, 1.5);
      radiusWith(c, 'radius/control');
      c.appendChild(text('Add to cart', { role: 'action', color: s.label, size: 16 }));
      variants.push(c);
    }
  }
  button = figma.combineAsVariants(variants, main);
  button.name = 'Button';
  button.layoutMode = 'HORIZONTAL';
  button.layoutWrap = 'WRAP';
  button.itemSpacing = 16;
  button.counterAxisSpacing = 16;
  button.paddingTop = button.paddingBottom = button.paddingLeft = button.paddingRight = 24;
  button.primaryAxisSizingMode = 'AUTO';
  button.counterAxisSizingMode = 'AUTO';
  const labelKey = button.addComponentProperty('Label', 'TEXT', 'Add to cart');
  for (const c of button.children) c.findOne((n) => n.type === 'TEXT').componentPropertyReferences = { characters: labelKey };
  button.description = 'Brand action button. Colours, radius and font come from the Brand collection; switch the frame mode to see each direction.';
  made.Button = button.id;
}

if (SPEC.which === 'fields') {
  input = figma.createComponent();
  input.name = 'Input';
  input.layoutMode = 'VERTICAL';
  input.primaryAxisSizingMode = 'AUTO';
  input.counterAxisSizingMode = 'AUTO';
  input.itemSpacing = 6;
  input.fills = [];
  const inputLabel = text('Company email', { color: 'color/text/body', size: 14 });
  input.appendChild(inputLabel);
  const field = figma.createAutoLayout('HORIZONTAL', { name: 'Field' });
  field.paddingTop = field.paddingBottom = 12;
  field.paddingLeft = field.paddingRight = 16;
  fillWith(field, 'color/surface/raised');
  strokeWith(field, 'color/border/default');
  radiusWith(field, 'radius/control');
  input.appendChild(field);
  field.counterAxisSizingMode = 'AUTO';
  field.primaryAxisSizingMode = 'FIXED';
  field.resize(300, field.height);
  const placeholder = text('name@company.com', { color: 'color/text/muted', size: 16 });
  field.appendChild(placeholder);
  input.addComponentProperty('Label', 'TEXT', 'Company email');
  input.addComponentProperty('Placeholder', 'TEXT', 'name@company.com');
  const props = Object.keys(input.componentPropertyDefinitions);
  inputLabel.componentPropertyReferences = { characters: props.find((k) => k.startsWith('Label')) };
  placeholder.componentPropertyReferences = { characters: props.find((k) => k.startsWith('Placeholder')) };
  input.description = 'Brand text field. Field radius uses radius/control, like buttons.';
  main.appendChild(input);
  made.Input = input.id;
}

if (SPEC.which === 'tags') {
  badge = figma.createComponent();
  badge.name = 'Badge';
  badge.layoutMode = 'HORIZONTAL';
  badge.primaryAxisSizingMode = 'AUTO';
  badge.counterAxisSizingMode = 'AUTO';
  badge.paddingTop = badge.paddingBottom = 4;
  badge.paddingLeft = badge.paddingRight = 10;
  fillWith(badge, 'color/surface/action-subtle');
  radiusWith(badge, 'radius/control');
  const badgeText = text('Bestseller', { role: 'action', color: 'color/text/action', size: 12 });
  badge.appendChild(badgeText);
  const key = badge.addComponentProperty('Text', 'TEXT', 'Bestseller');
  badgeText.componentPropertyReferences = { characters: key };
  badge.description = 'Brand badge on the subtle action surface.';
  main.appendChild(badge);
  made.Badge = badge.id;
}

if (SPEC.which === 'cards') {
  const buttonSet = await figma.getNodeByIdAsync(IDS.components.Button);
  badge = await figma.getNodeByIdAsync(IDS.components.Badge);
  if (!buttonSet || !badge) throw new Error('Button or Badge missing: run the buttons and tags steps first');
  card = figma.createComponent();
  card.name = 'Product card';
  card.layoutMode = 'VERTICAL';
  card.primaryAxisSizingMode = 'AUTO';
  card.counterAxisSizingMode = 'FIXED';
  card.resize(272, card.height);
  card.itemSpacing = 10;
  card.paddingTop = card.paddingBottom = card.paddingLeft = card.paddingRight = 12;
  card.clipsContent = true;
  fillWith(card, 'color/surface/raised');
  strokeWith(card, 'color/border/default');
  radiusWith(card, 'radius/container');
  const well = figma.createRectangle();
  well.name = 'Image well';
  well.resize(248, 200);
  fillWith(well, 'color/surface/subtle');
  radiusWith(well, 'radius/container');
  card.appendChild(well);
  card.appendChild(badge.createInstance());
  const nameText = text('Product name', { color: 'color/text/heading', size: 15, width: 248 });
  card.appendChild(nameText);
  const priceText = text('€0.00', { role: 'heading', color: 'color/text/heading', size: 18 });
  card.appendChild(priceText);
  const cardButton = buttonSet.defaultVariant.createInstance();
  card.appendChild(cardButton);
  cardButton.layoutSizingHorizontal = 'FILL';
  card.addComponentProperty('Name', 'TEXT', 'Product name');
  card.addComponentProperty('Price', 'TEXT', '€0.00');
  const props = Object.keys(card.componentPropertyDefinitions);
  nameText.componentPropertyReferences = { characters: props.find((k) => k.startsWith('Name')) };
  priceText.componentPropertyReferences = { characters: props.find((k) => k.startsWith('Price')) };
  card.description = 'Brand product tile. Image well and card share radius/container.';
  main.appendChild(card);
  made['Product card'] = card.id;
  button = buttonSet;
}

const frames = {};
SPEC.modes.forEach((m, index) => {
  const f = directionFrame(page, m, `${CONF.group} / ${CONF.title}`, 1160, index);
  headline(f, `${CONF.group} / ${CONF.title} · ${m.name}`, CONF.title, `${m.summary} ${CONF.intro}`);

  if (SPEC.which === 'buttons') {
    for (const style of ['Primary', 'Secondary']) {
      const sec = attach(f, box(style, 'VERTICAL', 16));
      attach(sec, text(style, { role: 'heading', color: 'color/text/heading', size: 28 }));
      const row = attach(sec, box(`${style} states`, 'HORIZONTAL', 32));
      for (const state of ['Default', 'Hover']) {
        const variant = button.children.find((c) => c.name === `Style=${style}, State=${state}`);
        const col = attach(row, box(state, 'VERTICAL', 8));
        attach(col, text(state, { color: 'color/text/muted', size: 12 }));
        const inst = attach(col, variant.createInstance());
        actionCase(inst, m);
      }
    }
  }
  if (SPEC.which === 'fields') {
    const row = attach(f, box('Fields', 'HORIZONTAL', 32));
    for (const [label, ph] of [['Company email', 'name@company.com'], ['Order reference', 'PO-2026-0001']]) {
      const inst = attach(row, input.createInstance());
      inst.setProperties({ [propKey(inst, 'Label')]: label, [propKey(inst, 'Placeholder')]: ph });
    }
  }
  if (SPEC.which === 'tags') {
    // The subtle action surface is close to the canvas, so show tags where they are used: on a raised surface.
    const panel = attach(f, box('Tags on raised surface', 'HORIZONTAL', 16));
    panel.paddingTop = panel.paddingBottom = panel.paddingLeft = panel.paddingRight = 24;
    fillWith(panel, 'color/surface/raised');
    strokeWith(panel, 'color/border/default');
    radiusWith(panel, 'radius/container');
    const row = panel;
    const texts = [...new Set((m.sample.products || []).map((p) => p.badge).filter(Boolean))];
    for (const t of texts.length ? texts : ['Bestseller']) {
      const inst = attach(row, badge.createInstance());
      inst.setProperties({ [propKey(inst, 'Text')]: t });
    }
  }
  if (SPEC.which === 'cards') {
    const row = attach(f, box('Products', 'HORIZONTAL', 24));
    for (const p of (m.sample.products || []).slice(0, 3)) {
      const inst = attach(row, card.createInstance());
      inst.layoutSizingVertical = 'FILL';
      inst.setProperties({ [propKey(inst, 'Name')]: p.name, [propKey(inst, 'Price')]: p.price });
      const b = inst.findOne((n) => n.type === 'INSTANCE' && n.name === 'Badge');
      if (b && p.badge) b.setProperties({ [propKey(b, 'Text')]: p.badge });
      else if (b) b.visible = false;
      const btn = inst.findOne((n) => n.type === 'INSTANCE' && n.name.startsWith('Style='));
      if (btn) actionCase(btn, m);
    }
  }
  noteList(f, NOTES);
  frames[m.id] = f.id;
});
return { pageId: page.id, components: made, frames, warnings: WARNINGS };
