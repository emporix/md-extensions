// use_figma script: "Colors" atom page, prior-art layout (headline, one section per ramp with
// labelled swatches and a Base marker). One frame per direction, each in its own mode.
// Regenerated as a whole: only frames named "Atoms / Colors — {direction}" are replaced.
const page = await usePage('Colors');
clearFrames(page, SPEC.modes.map((m) => `Atoms / Colors — ${m.name}`));

const WHAT = {
  brand: (s) => `The action colour: primary buttons, links and focus. The seed ${s.value} sits on step ${s.step}.`,
  accent: (s) => `Supporting colour for highlights and secondary surfaces. The seed ${s.value} sits on step ${s.step}.`,
  neutral: (s) => `Text, surfaces and borders. The seed ${s.value} sits on step ${s.step}.`,
};

function swatch(name, fillVar, step, hex, ink, isBase) {
  const sw = figma.createAutoLayout('HORIZONTAL', { name, itemSpacing: 12 });
  sw.counterAxisAlignItems = 'CENTER';
  sw.paddingLeft = sw.paddingRight = 16;
  sw.resize(300, 64);
  sw.primaryAxisSizingMode = 'FIXED';
  sw.counterAxisSizingMode = 'FIXED';
  fillWith(sw, fillVar);
  strokeWith(sw, 'color/border/default', 1);
  if (step !== null) attach(sw, text(String(step), { role: 'action', color: ink, size: 14 }));
  attach(sw, text(hex.toUpperCase(), { color: ink, size: 14 }));
  if (isBase) {
    const spacer = attach(sw, figma.createFrame());
    spacer.name = 'spacer';
    spacer.fills = [];
    spacer.resize(1, 1);
    spacer.layoutGrow = 1;
    const pill = attach(sw, figma.createAutoLayout('HORIZONTAL', { name: 'Base' }));
    pill.paddingLeft = pill.paddingRight = 10;
    pill.paddingTop = pill.paddingBottom = 2;
    pill.cornerRadius = 999;
    fillWith(pill, 'palette/white');
    attach(pill, text('Base', { role: 'action', color: 'palette/black', size: 12 }));
  }
  return sw;
}

const frames = {};
SPEC.modes.forEach((m, index) => {
  const C = SPEC.atoms.colors[m.id];
  const f = directionFrame(page, m, 'Atoms / Colors', 1160, index);
  headline(f, `Atoms / Colors · ${m.name}`, 'Colors', `${m.summary} Three ramps of ten steps built from seed colours, plus white and black.`);

  const row = attach(f, box('Ramps', 'HORIZONTAL', 48));
  for (const family of ['brand', 'accent', 'neutral']) {
    const col = attach(row, box(`${family} section`, 'VERTICAL', 24));
    const seed = C.seeds[family] || {};
    const sub = subhead(col, SPEC.labels[family], WHAT[family](seed), 300);
    // Same explanation height in every column so the ramps start on one line.
    const body = sub.children[1];
    body.textAutoResize = 'NONE';
    body.resize(300, 72);
    const ramp = attach(col, box('Colors', 'VERTICAL', 0));
    for (const c of [...C.families[family]].reverse()) {
      attach(ramp, swatch(`${family}/${c.step}`, `palette/${family}/${c.step}`, c.step, c.hex, `palette/${c.label}`, seed.step === c.step));
    }
    if (family === 'neutral') {
      const extras = attach(col, box('White and black', 'VERTICAL', 8));
      for (const e of C.extras) attach(extras, swatch(e.name, `palette/${e.name.toLowerCase()}`, null, `${e.name} ${e.hex}`, `palette/${e.label}`, false));
    }
  }
  noteList(f, SPEC.atoms.notes.colors);
  frames[m.id] = f.id;
});
return { pageId: page.id, frames, warnings: WARNINGS };
