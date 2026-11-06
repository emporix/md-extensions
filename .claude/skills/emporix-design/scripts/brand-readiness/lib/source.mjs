// Source scanning: list files and pull out class strings (string literals and @apply lines)
// with their file and line, the way a utility-class compiler sees candidates.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export function listFiles(root, scan) {
  const exclude = (scan.exclude ?? []).map((p) => new RegExp(p));
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules' || name.startsWith('.')) continue;
      const abs = join(dir, name);
      const rel = relative(root, abs);
      if (exclude.some((re) => re.test(rel))) continue;
      if (statSync(abs).isDirectory()) walk(abs);
      else if (scan.extensions.some((ext) => name.endsWith(ext))) out.push(rel);
    }
  };
  for (const r of scan.roots) walk(join(root, r));
  return out.sort();
}

const lineAt = (text, index) => text.slice(0, index).split('\n').length;

/** Every string literal (or @apply list) as {file, line, text}. */
export function classStrings(root, files) {
  const out = [];
  for (const file of files) {
    const text = readFileSync(join(root, file), 'utf8');
    const re = file.endsWith('.css') || file.endsWith('.scss') ? /@apply\s+([^;]+);/g : /'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g;
    for (const m of text.matchAll(re)) {
      const body = m[1] ?? m[2] ?? m[3] ?? '';
      if (!/[a-z]-[a-z0-9[]/.test(body)) continue;
      out.push({ file, line: lineAt(text, m.index), text: body });
    }
  }
  return out;
}

/** Split a class string into {variants, utility, important, modifier}. */
export function tokens(text) {
  const out = [];
  for (let raw of text.split(/\s+/)) {
    // Class strings nested in template literals keep their quotes and braces: trim them.
    raw = raw.replace(/^['"{(]+|['"})?:,;]+$/g, '');
    if (!raw || raw.includes('${') || /['"]/.test(raw)) continue;
    // Variants are separated by ':' outside brackets.
    const parts = [];
    let depth = 0;
    let cur = '';
    for (const ch of raw) {
      if (ch === '[' || ch === '(') depth++;
      if (ch === ']' || ch === ')') depth--;
      if (ch === ':' && depth === 0) {
        parts.push(cur);
        cur = '';
      } else cur += ch;
    }
    let utility = cur;
    const important = utility.startsWith('!') || utility.endsWith('!');
    utility = utility.replace(/^!|!$/g, '');
    // Opacity modifier (bg-surface-action/90); a slash inside brackets is part of the value.
    let modifier = null;
    const slash = utility.match(/^([^[]*[^/[])\/([\w.%]+|\[[^\]]+\])$/);
    if (slash) [utility, modifier] = [slash[1], slash[2]];
    out.push({ raw, variants: parts.join(':'), utility, important, modifier });
  }
  return out;
}
