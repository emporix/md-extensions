#!/usr/bin/env node
// Print one ready-to-run use_figma script: the READ-ONLY Figma readiness scan with its settings embedded.
//
//   node figma-readiness-code.mjs [--pages id,id,...] [--frames all|widest] [--cursor p,f]
//        [--budget 30000] [--brand brand] [--fixed <regex>] [--out file]
//
// Run it with use_figma, save the returned JSON to a chunk file, and call it again with the returned
// cursor until `done` is true. Then merge the chunks with figma-readiness-report.mjs.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const opts = {};
const a = process.argv.slice(2);
for (let i = 0; i < a.length; i += 2) opts[a[i].replace(/^--/, '')] = a[i + 1];
const [p, f] = (opts.cursor ?? '0,0').split(',').map(Number);
const CFG = {
  pages: opts.pages ? opts.pages.split(',') : null,
  frames: opts.frames ?? 'all',
  cursor: { p, f },
  budgetMs: Number(opts.budget ?? 30000),
  brand: opts.brand ?? 'brand',
  fixed: opts.fixed ?? 'logo|social|trust|pci|gdpr|paypal|visa|mastercard|payment|flag|illustration|photo|image|weather|svg|3rd',
  largeSide: 8000,
  largeNodes: 5000,
  samples: 3,
};
const here = join(dirname(fileURLToPath(import.meta.url)), 'figma');
const code = `const CFG = ${JSON.stringify(CFG)};\n${readFileSync(join(here, 'readiness.js'), 'utf8')}`;
if (opts.out) writeFileSync(opts.out, code);
else process.stdout.write(code);
