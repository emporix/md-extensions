#!/usr/bin/env node
// direction.json -> tokens.json (W3C DTCG, canonical brand vocabulary).
//
//   node build-tokens.mjs <direction.json> [--out <tokens.json>]
//
// Deterministic: the same direction always yields the same bytes.
// Exit 1 with a list of problems when the direction is invalid.

import { readFileSync, writeFileSync } from 'node:fs';
import { buildTokens, validateDirection } from './tokens.mjs';

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith('--'));
const outIdx = args.indexOf('--out');
const out = outIdx >= 0 ? args[outIdx + 1] : null;

if (!input) {
  console.error('usage: build-tokens.mjs <direction.json> [--out <tokens.json>]');
  process.exit(2);
}

const direction = JSON.parse(readFileSync(input, 'utf8'));
const problems = validateDirection(direction);
if (problems.length) {
  console.error(`Invalid direction ${input}:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}

const json = JSON.stringify(buildTokens(direction), null, 2) + '\n';
if (out) {
  writeFileSync(out, json);
  console.log(`wrote ${out}`);
} else {
  process.stdout.write(json);
}
