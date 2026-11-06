// R2 token integrity: every themed utility class must resolve to a token the theme defines.
//
//   undefined  role-like class with no token (e.g. text-text-secondary): emits no CSS, so the
//              element silently inherits a colour from wherever it sits
//   palette    default palette class removed by the theme reset (e.g. bg-white)
//   literal    hard-coded colour in an arbitrary class or in code (e.g. bg-[#0F77D9]):
//              works, but no brand can change it
//   dynamic    class assembled at runtime ('bg-surface-' + type): the compiler cannot see it,
//              so it only works when the full names happen to appear elsewhere
//
// Candidates are found by name; when the target has Tailwind (@tailwindcss/node), every
// undefined/palette candidate is confirmed with the target's own compiler and dropped if
// it does generate CSS. Without it the result is heuristic and says so.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { themeNames } from '../../brand/css-vars.mjs';
import { classStrings, tokens } from '../lib/source.mjs';

const PALETTE = 'black white slate gray zinc neutral stone red orange amber yellow lime green emerald teal cyan sky blue indigo violet purple fuchsia pink rose'.split(' ');
const COLOUR_LITERAL = /^(#[0-9a-f]{3,8}|(rgba?|hsla?|oklch|oklab|lab|lch|color-mix)\(.*\))$/i;

const cssEscape = (s) => s.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);

/** The target's Tailwind compiler, or null. */
async function loadCompiler(root, config) {
  try {
    const req = createRequire(join(root, 'package.json'));
    const { compile } = await import(req.resolve('@tailwindcss/node'));
    const file = join(root, config.theme.file);
    const compiler = await compile(readFileSync(file, 'utf8'), { base: join(file, '..'), onDependency() {} });
    return (candidate) => compiler.build([candidate]).includes(`.${cssEscape(candidate)}`);
  } catch {
    return null;
  }
}

export async function r2({ root, config, files }) {
  const themeFile = join(root, config.theme.file);
  const findings = [];
  const rules = config.utilities.map((u) => {
    const defined = themeNames(themeFile, u.theme);
    return {
      ...u,
      defined,
      namespaces: new Set([...defined].map((n) => n.split('-')[0])),
      // Longest prefix first so rounded-tl-md is not read as rounded + "tl-md".
      prefixes: [...u.prefixes].sort((a, b) => b.length - a.length),
    };
  });

  for (const s of classStrings(root, files)) {
    for (const t of tokens(s.text)) {
      for (const rule of rules) {
        if (rule.prefixes.includes(t.utility)) break;
        // A token name used without its utility (surface-disabled instead of bg-surface-disabled).
        if (rule.match === 'namespace' && rule.defined.has(t.utility)) {
          findings.push({ kind: 'undefined', class: t.raw, name: t.utility, hint: 'no utility prefix', file: s.file, line: s.line, rule: rule.theme });
          break;
        }
        const prefix = rule.prefixes.find((p) => t.utility.startsWith(p + '-'));
        if (!prefix) continue;
        const name = t.utility.slice(prefix.length + 1);
        const candidate = t.utility + (t.modifier ? `/${t.modifier}` : '');
        if (name === '' || name.endsWith('-')) {
          if (rule.namespaces.has(name.split('-')[0]) || name === '') {
            findings.push({ kind: 'dynamic', class: t.raw, name: t.utility + '…', file: s.file, line: s.line, rule: rule.theme });
          }
          break;
        }
        if (name.startsWith('[')) {
          const inner = name.slice(1, -1).replace(/_/g, ' ').replace(/^color:/, '');
          if (rule.literals && COLOUR_LITERAL.test(inner)) {
            findings.push({ kind: 'literal', class: t.raw, file: s.file, line: s.line, rule: rule.theme });
          }
          break;
        }
        if (rule.defined.has(name) || rule.builtins?.includes(name)) break;
        const head = name.split('-')[0];
        // border-disabled where border-border-disabled was meant: the name is the tail of a token.
        const tails = rule.match === 'namespace' ? [...rule.defined].filter((d) => d.endsWith('-' + name)) : [];
        if (rule.literals && PALETTE.includes(head) && !rule.namespaces.has(head)) {
          findings.push({ kind: 'palette', class: t.raw, name: candidate, file: s.file, line: s.line, rule: rule.theme });
        } else if (rule.match === 'all' || rule.namespaces.has(head) || tails.length) {
          const hint = tails.length ? `did you mean ${tails.map((d) => `${prefix}-${d}`).join(' or ')}?` : undefined;
          findings.push({ kind: 'undefined', class: t.raw, name: candidate, hint, file: s.file, line: s.line, rule: rule.theme });
        }
        break;
      }
    }
  }

  // Colour literals in code outside classes (inline styles, props, constants).
  for (const file of files.filter((f) => /\.(t|j)sx?$/.test(f))) {
    const lines = readFileSync(join(root, file), 'utf8').split('\n');
    lines.forEach((text, i) => {
      if (/^\s*(\/\/|\*|import )/.test(text)) return;
      for (const m of text.matchAll(/['"`](#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?|(?:rgba?|hsla?|oklch)\([^)'"`]*\))['"`]/g)) {
        // Attribute selectors inside arbitrary variants ([stroke='#ccc']) match, not colour.
        if (/\[[\w-]+=$/.test(text.slice(0, m.index))) continue;
        findings.push({ kind: 'literal', class: m[1], file, line: i + 1, rule: 'code' });
      }
    });
  }

  const generates = await loadCompiler(root, config);
  const confirmed = new Map();
  const real = findings.filter((f) => {
    if (!generates || !['undefined', 'palette'].includes(f.kind)) return true;
    if (!confirmed.has(f.name)) confirmed.set(f.name, !generates(f.name));
    return confirmed.get(f.name);
  });

  const byName = new Map();
  for (const f of real) {
    const key = `${f.kind}:${f.name ?? f.class}`;
    if (!byName.has(key)) byName.set(key, { kind: f.kind, name: f.name ?? f.class, hint: f.hint, uses: 0, files: new Set(), where: [] });
    const e = byName.get(key);
    e.uses++;
    e.files.add(f.file);
    if (e.where.length < 5) e.where.push(`${f.file}:${f.line}`);
  }
  const summary = [...byName.values()]
    .map((e) => ({ ...e, files: e.files.size }))
    .sort((a, b) => a.kind.localeCompare(b.kind) || b.files - a.files || a.name.localeCompare(b.name));
  const errors = summary.filter((e) => e.kind !== 'literal').length;
  return {
    id: 'R2',
    errors,
    warnings: summary.length - errors,
    verifiedBy: generates ? 'target Tailwind compiler' : 'name heuristic only (no @tailwindcss/node in target)',
    summary,
    findings: real,
  };
}
