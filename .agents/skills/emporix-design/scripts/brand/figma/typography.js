// use_figma script: "Typography" atom page, prior-art layout (font family and weight, then sizes).
// Brand values: families, weights, button casing and tracking. Sizes and line heights are the
// target's (read from its CSS by figma-spec); without a target one illustrative row set is shown.
// One frame per direction, each in its own mode. Only "Atoms / Typography — {direction}" frames
// are replaced.
const page = await usePage('Typography');
clearFrames(page, SPEC.modes.map((m) => `Atoms / Typography — ${m.name}`));

const T = SPEC.atoms.typography;
const ILLUSTRATIVE = { H1: { size: 48, lh: 52 }, 'Body M': { size: 16, lh: 24 }, Button: { size: 16, lh: 24 } };
const columns = T.scale
  ? [['Desktop sizes', T.scale.desktop], ['Mobile sizes', T.scale.mobile]]
  : [['Specimens (illustrative sizes)', ILLUSTRATIVE]];
const LOREM = 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.';
const COL = 800;

const label = (parent, chars) => attach(parent, text(chars, { role: 'heading', color: 'color/text/action', size: 16, upper: true, ls: 2 }));

const frames = {};
SPEC.modes.forEach((m, index) => {
  const F = FONT[m.id];
  const f = directionFrame(page, m, 'Atoms / Typography', COL * 2 + 24 + 128, index);
  headline(f, `Atoms / Typography · ${m.name}`, 'Typography', `${m.summary} The brand sets font families, weights, and button casing and tracking.`);

  const top = attach(f, box('family - weight', 'HORIZONTAL', 24));
  const fam = attach(top, box('font family', 'VERTICAL', 16));
  fam.resize(COL, 100);
  fam.counterAxisSizingMode = 'FIXED'; // a vertical box: the counter axis is its width
  fam.primaryAxisSizingMode = 'AUTO';
  label(fam, 'Font family');
  attach(fam, text(F.heading.family, { role: 'heading', color: 'color/text/heading', size: 48 }));
  attach(fam, text('Headings', { color: 'color/text/muted', size: 14 }));
  attach(fam, text(F.body.family, { role: 'body', color: 'color/text/heading', size: 48 }));
  attach(fam, text('Body text and button labels', { color: 'color/text/muted', size: 14 }));
  const wt = attach(top, box('font weight', 'VERTICAL', 16));
  label(wt, 'Font weight');
  attach(wt, text(`${F.heading.family} – ${F.heading.style}  ·  headings`, { role: 'heading', color: 'color/text/heading', size: 20 }));
  attach(wt, text(`${F.body.family} – ${F.body.style}  ·  body text`, { role: 'body', color: 'color/text/heading', size: 20 }));
  attach(wt, text(`${F.action.family} – ${F.action.style}  ·  buttons and labels`, { role: 'action', color: 'color/text/heading', size: 20 }));

  const sizes = attach(f, box('Sizes', 'HORIZONTAL', 24));
  for (const [title, scale] of columns) {
    const col = attach(sizes, box(title, 'VERTICAL', 28));
    label(col, title);
    for (const [name, r] of Object.entries(scale)) {
      if (/^H\d$/.test(name)) {
        attach(col, text(`${name} - The quick brown fox jumps over...`, { role: 'heading', color: 'color/text/heading', size: r.size, lh: r.lh, width: COL }));
      } else if (name === 'Overline') {
        attach(col, text('Overline', { role: 'heading', color: 'color/text/action', size: r.size, lh: r.lh, upper: true, ls: r.ls || 2 }));
      } else if (name.startsWith('Body')) {
        const b = attach(col, box(name, 'VERTICAL', 8));
        attach(b, text(`${name} · ${r.size}/${r.lh}`, { color: 'color/text/muted', size: 12 }));
        attach(b, text(LOREM, { role: 'body', color: 'color/text/body', size: r.size, lh: r.lh, width: COL }));
        attach(b, text(`${name} - Textlink`, { role: 'body', color: 'color/text/action', size: r.size, lh: r.lh, underline: true }));
      } else if (name === 'Button') {
        attach(col, text('Button', { role: 'action', color: 'color/text/heading', size: r.size, lh: r.lh, upper: m.action.transform === 'uppercase', ls: lsPx(m.action.letterSpacing, r.size) }));
      }
    }
  }
  noteList(f, SPEC.atoms.notes.typography);
  frames[m.id] = f.id;
});
return { pageId: page.id, frames, warnings: WARNINGS };
