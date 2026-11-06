#!/usr/bin/env node
// Print one ready-to-run use_figma script that shows a direction on whole sections of the library (page-level
// mode on the brand collection). Without --mode it only lists the pages and their current mode (read-only).
//
//   node figma-apply-mode-code.mjs --profile <target.json> [--sections I,II] [--mode "Soft ink"] [--budget 40000] [--out file]
//
// Sections are the library's divider numerals: I atoms, II molecules (the automatic first step),
// III and later the organisms, screens and flows (the second step, on request).

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const a = process.argv.slice(2);
const opts = {};
for (let i = 0; i < a.length; i += 2) opts[a[i].replace(/^--/, '')] = a[i + 1];
if (!opts.profile) {
  console.error('usage: figma-apply-mode-code.mjs --profile <target.json> [--sections I,II] [--mode "Soft ink"] [--budget ms] [--out file]');
  process.exit(2);
}
const lib = JSON.parse(readFileSync(opts.profile, 'utf8')).figma?.library;
if (!lib?.collections?.primitives) {
  console.error('profile has no figma.library.collections.primitives');
  process.exit(2);
}
const CFG = {
  brand: lib.collections.primitives,
  sections: (opts.sections ?? 'I,II').split(',').map((s) => s.trim()),
  mode: opts.mode ?? null,
  budgetMs: Number(opts.budget ?? 40000),
};
const here = join(dirname(fileURLToPath(import.meta.url)), 'figma');
const code = `const CFG = ${JSON.stringify(CFG)};\n${readFileSync(join(here, 'apply-mode.js'), 'utf8')}`;
if (opts.out) writeFileSync(opts.out, code);
else console.log(code);
