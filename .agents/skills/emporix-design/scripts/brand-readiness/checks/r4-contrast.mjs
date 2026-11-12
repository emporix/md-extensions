// R4 contrast of the text-on-surface pairs the code actually uses, under the default theme
// (or under a site theme with --theme). Pairs come from class strings that set both a
// background and a text colour in the same variant state (e.g. "bg-surface-error text-text-error",
// "hover:bg-x hover:text-y"). Thresholds: WCAG 1.4.3 text 4.5:1, large text 3:1; icon colours
// use 1.4.11 non-text 3:1. Text with no background in the same string is checked against the
// page surface and reported separately as "assumed" (the real background may differ), except
// "<ns>-on-<role>" colours, which are designed for "surface-<role>" and are checked on it.
// Disabled states are exempt (WCAG 1.4.3 excludes inactive components): listed, not counted.
// That covers disabled variants and pairs where text and surface are both disabled tokens;
// on-<role> inference skips config.contrast.exemptRoles (those tokens are often reused as
// plain secondary text, so they are checked on the page instead).

import { join } from 'node:path';
import { contrast, hex, over, readVars, resolveExpr, rgba, themeDecls } from '../../brand/css-vars.mjs';
import { classStrings, tokens } from '../lib/source.mjs';

export function r4({ root, config, files, themes = [] }) {
  const c = config.contrast;
  const vars = readVars([...config.theme.tokenFiles, ...themes].map((f) => (f.startsWith('/') ? f : join(root, f))));
  const decls = themeDecls(join(root, config.theme.file), '--color-');
  const colour = (name) => {
    const expr = decls.get(name);
    const v = expr && resolveExpr(vars, expr);
    return v ? rgba(v) : null;
  };
  const page = rgba(resolveExpr(vars, `var(${c.page})`));

  const pairs = new Map();
  const unresolved = new Set();
  for (const s of classStrings(root, files)) {
    const ts = tokens(s.text);
    const byState = new Map();
    for (const t of ts) {
      const m = t.utility.match(/^(bg|text)-([a-z][a-z0-9-]*)$/);
      if (!m || !decls.has(m[2])) continue;
      const state = byState.get(t.variants) ?? {};
      state[m[1]] = { name: m[2], modifier: t.modifier };
      byState.set(t.variants, state);
    }
    const large = ts.some((t) => c.largeClasses.includes(t.utility));
    for (const [variants, st] of byState) {
      if (!st.text) continue;
      // A variant state without its own background sits on the base state's background;
      // an on-<role> colour without any sits on its own surface.
      const onRole = st.text.name.match(/^[a-z]+-on-(.+)$/)?.[1];
      const infer = onRole && !c.exemptRoles?.includes(onRole) && decls.has(`surface-${onRole}`);
      const bg = st.bg ?? byState.get('')?.bg ?? (infer ? { name: `surface-${onRole}`, inferred: true } : null);
      const exemptRole = (n) => c.exemptRoles?.some((r) => n?.split('-').includes(r));
      const key = `${variants}|${bg?.name ?? '(page)'}|${st.text.name}`;
      if (!pairs.has(key)) {
        pairs.set(key, { variants, exempt: /disabled/.test(variants) || (exemptRole(st.text.name) && exemptRole(bg?.name)), inferred: !!bg?.inferred, bg: bg?.name ?? null, bgModifier: bg?.modifier ?? null, text: st.text.name, textModifier: st.text.modifier, large: true, uses: 0, where: [] });
      }
      const p = pairs.get(key);
      p.large &&= large;
      p.uses++;
      if (p.where.length < 5) p.where.push(`${s.file}:${s.line}`);
    }
  }

  const results = [];
  for (const p of pairs.values()) {
    let fg = colour(p.text);
    let bg = p.bg ? colour(p.bg) : page;
    if (!fg || !bg) {
      unresolved.add(!fg ? p.text : p.bg);
      continue;
    }
    const alpha = (m) => (m && /^\d+$/.test(m) ? Number(m) / 100 : 1);
    bg = over({ ...bg, alpha: bg.alpha * alpha(p.bgModifier) }, page);
    fg = over({ ...fg, alpha: fg.alpha * alpha(p.textModifier) }, bg);
    const nonText = c.nonTextNamespaces.includes(p.text.split('-')[0]);
    const needs = nonText ? c.nonText : p.large ? c.large : c.text;
    const ratio = Math.round(contrast(fg, bg) * 100) / 100;
    results.push({ ...p, assumed: !p.bg, fg: hex(fg), bgHex: hex(bg), ratio, needs, pass: ratio >= needs });
  }
  results.sort((a, b) => a.pass - b.pass || a.ratio - b.ratio);
  const fails = results.filter((r) => !r.pass && !r.exempt);
  return {
    id: 'R4',
    themes,
    errors: fails.filter((r) => !r.assumed).length,
    warnings: fails.filter((r) => r.assumed).length,
    pairs: results.length,
    fails,
    exempt: results.filter((r) => !r.pass && r.exempt),
    unresolved: [...unresolved],
  };
}
