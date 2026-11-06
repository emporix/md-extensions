// use_figma script: "Roles and gaps" page. Per direction: closest alternatives (always first),
// every vocabulary token with its value and what the target does with it (maps / approximate /
// mapped, not effective / no counterpart), WCAG contrast of the role pairs, and what is not
// generated. Once, for the target: its gaps. Only the frames this step generated (exact names)
// are replaced.
const page = await usePage('Roles and gaps');
const frameName = (m) => `Brand / Roles and gaps — ${m.name}`;
const GAPS = 'Brand / Target gaps';
clearFrames(page, [...SPEC.modes.map(frameName), GAPS]);

const B = SPEC.atoms;
const W = { chip: 24, token: 240, value: 210, target: 320, status: 150 };

function tableRow(cells, header = false) {
  const r = box(header ? 'Header' : 'Row', 'HORIZONTAL', 12);
  r.counterAxisAlignItems = 'MIN';
  const opts = header ? { role: 'action', color: 'color/text/muted', size: 12, upper: true, ls: 1 } : { color: 'color/text/body', size: 14 };
  for (const [key, value] of cells) {
    if (key === 'chip') {
      if (header || !value) {
        const gap = attach(r, figma.createFrame());
        gap.name = 'chip';
        gap.fills = [];
        gap.resize(W.chip, 4);
      } else {
        const chip = attach(r, figma.createRectangle());
        chip.name = 'chip';
        chip.resize(W.chip, W.chip);
        fillWith(chip, value);
        strokeWith(chip, 'color/border/default', 1);
        chip.cornerRadius = 4;
      }
    } else {
      attach(r, text(value || '—', { ...opts, width: W[key], ...(key === 'target' && !header ? { color: 'color/text/muted', size: 12 } : {}) }));
    }
  }
  return r;
}

const frames = {};
SPEC.modes.forEach((m, index) => {
  const f = directionFrame(page, m, 'Brand / Roles and gaps', 1160, index);
  headline(f, `Brand / Roles and gaps · ${m.name}`, 'Roles and gaps', 'What the brand sets, what the target does with each token, and what is missing or substituted.');

  // 1. Closest alternatives first.
  const subs = attach(f, box('Closest alternatives', 'VERTICAL', 12));
  subhead(subs, 'Closest alternatives', m.substitutionList.length ? 'Where the direction uses something other than what was wanted.' : 'None recorded: every value is what was wanted.', 960);
  for (const s of m.substitutionList) {
    attach(subs, text(`${s.kind} · ${s.what}: wanted ${s.wanted}; used ${s.used}. ${s.why}`, { color: 'color/text/body', size: 14, width: 960 }));
  }

  // 2. Tokens and what the target does with them.
  const roles = attach(f, box('Roles', 'VERTICAL', 10));
  subhead(roles, 'Tokens and the target', 'maps: the target has a variable for it · approximate: nearest variable · mapped, not effective: the target overrides it in code · no counterpart: the target has nothing for it.', 960);
  attach(roles, tableRow([['chip', ''], ['token', 'Token'], ['value', 'Value'], ['target', 'Target variable'], ['status', 'Status']], true));
  B.rows.forEach((r, i) => {
    attach(roles, tableRow([['chip', r.swatch || ''], ['token', r.token], ['value', B.values[m.id][i]], ['target', r.target], ['status', r.status]]));
  });

  // 3. WCAG contrast of the role pairs.
  const wcag = attach(f, box('Contrast', 'VERTICAL', 10));
  subhead(wcag, 'Contrast (WCAG 2.1 AA)', 'Text needs 4.5:1, UI boundaries 3:1. A button fill against the page is advisory: the label identifies the button.', 960);
  B.gates.forEach((pair, i) => {
    const g = { ...pair, ratio: B.ratios[m.id][i], below: B.ratios[m.id][i] < pair.min };
    const r = box('Pair', 'HORIZONTAL', 12);
    r.counterAxisAlignItems = 'CENTER';
    const chip = attach(r, figma.createAutoLayout('HORIZONTAL', { name: 'sample' }));
    chip.resize(56, 32);
    chip.primaryAxisSizingMode = 'FIXED';
    chip.counterAxisSizingMode = 'FIXED';
    chip.primaryAxisAlignItems = 'CENTER';
    chip.counterAxisAlignItems = 'CENTER';
    fillWith(chip, g.bg);
    strokeWith(chip, 'color/border/default', 1);
    if (g.fg.startsWith('color/text')) attach(chip, text('Aa', { role: 'action', color: g.fg, size: 14 }));
    else {
      const dot = attach(chip, figma.createRectangle());
      dot.resize(24, 14);
      fillWith(dot, g.fg);
    }
    attach(r, text(`${g.fg.replace('color/', '')} on ${g.bg.replace('color/', '')}`, { color: 'color/text/body', size: 14, width: 340 }));
    attach(r, text(`${g.ratio.toFixed(2)}:1`, { role: 'action', color: 'color/text/body', size: 14, width: 80 }));
    attach(r, text(`needs ${g.min}:1 (WCAG ${g.wcag})`, { color: 'color/text/muted', size: 14, width: 200 }));
    attach(r, text(g.advisory ? (g.below ? 'advisory, below' : 'advisory, ok') : g.below ? 'below' : 'pass', { role: 'action', color: 'color/text/body', size: 14, width: 140 }));
    attach(wcag, r);
  });

  noteList(f, B.notGenerated, 'Not generated');
  frames[m.id] = f.id;
});

// 4. The target's own gaps, once (they do not depend on the direction).
if (B.gaps.length) {
  const g = directionFrame(page, SPEC.modes[0], GAPS, 1160, SPEC.modes.length);
  g.name = GAPS;
  headline(g, 'Brand / Target gaps', 'Target gaps', 'Tokens the brand can set but the target cannot express, or overrides in code. Same for every direction.');
  for (const gap of B.gaps) {
    const b = attach(g, box(gap.token, 'VERTICAL', 4));
    attach(b, text(`${gap.token} — ${gap.where}`, { role: 'action', color: 'color/text/heading', size: 14, width: 1000 }));
    attach(b, text(gap.why, { color: 'color/text/body', size: 14, width: 1000 }));
    attach(b, text(`Fix: ${gap.fix}`, { color: 'color/text/muted', size: 14, width: 1000 }));
  }
  frames.gaps = g.id;
}
return { pageId: page.id, frames, warnings: WARNINGS };
