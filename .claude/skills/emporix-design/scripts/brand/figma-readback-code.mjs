#!/usr/bin/env node
// Print one ready-to-run use_figma script: the READ-ONLY read-back of resolved role values per brand mode.
//
//   node figma-readback-code.mjs --profile <target.json> [--out file]
//
// Run it with use_figma on the file to read (the library copy), save the returned JSON as the dump,
// then diff it with figma-readback.mjs. Nothing is written to Figma.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const a = process.argv.slice(2);
const opts = {};
for (let i = 0; i < a.length; i += 2) opts[a[i].replace(/^--/, '')] = a[i + 1];
if (!opts.profile) {
  console.error('usage: figma-readback-code.mjs --profile <target.json> [--out file]');
  process.exit(2);
}
const lib = JSON.parse(readFileSync(opts.profile, 'utf8')).figma?.library;
if (!lib?.roleMap || !lib.collections?.primitives) {
  console.error('profile has no figma.library with roleMap and collections.primitives');
  process.exit(2);
}
const CFG = { brand: lib.collections.primitives, roles: [...new Set(lib.roleMap.map((r) => r.role))] };
const here = join(dirname(fileURLToPath(import.meta.url)), 'figma');
const code = `const CFG = ${JSON.stringify(CFG)};\n${readFileSync(join(here, 'readback.js'), 'utf8')}`;
if (opts.out) writeFileSync(opts.out, code);
else console.log(code);
