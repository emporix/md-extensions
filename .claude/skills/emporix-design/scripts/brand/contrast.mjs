#!/usr/bin/env node
// WCAG 2.1 AA contrast gate over the canonical role pairs of a tokens.json.
//
//   node contrast.mjs <tokens.json> [--json]
//
// Exit 1 when any pair fails. Text pairs need 4.5:1 (1.4.3), UI boundaries 3:1 (1.4.11).

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { contrastRatio, parseColor } from './color.mjs';
import { getToken, resolveValue } from './tokens.mjs';

export const PAIRS = [
  { fg: 'color.text.body', bg: 'color.surface.canvas', min: 4.5, wcag: '1.4.3' },
  { fg: 'color.text.heading', bg: 'color.surface.canvas', min: 4.5, wcag: '1.4.3' },
  { fg: 'color.text.muted', bg: 'color.surface.canvas', min: 4.5, wcag: '1.4.3' },
  { fg: 'color.text.body', bg: 'color.surface.subtle', min: 4.5, wcag: '1.4.3' },
  { fg: 'color.text.action', bg: 'color.surface.canvas', min: 4.5, wcag: '1.4.3' },
  { fg: 'color.text.action-hover', bg: 'color.surface.canvas', min: 4.5, wcag: '1.4.3' },
  { fg: 'color.text.action', bg: 'color.surface.action-subtle', min: 4.5, wcag: '1.4.3' },
  { fg: 'color.text.on-action', bg: 'color.surface.action', min: 4.5, wcag: '1.4.3' },
  { fg: 'color.text.on-action', bg: 'color.surface.action-hover', min: 4.5, wcag: '1.4.3' },
  { fg: 'color.text.on-inverse', bg: 'color.surface.inverse', min: 4.5, wcag: '1.4.3' },
  // Advisory: WCAG 1.4.11 does not require a labelled button's fill to contrast with the
  // page (the label identifies it). Reported, never a failure.
  { fg: 'color.surface.action', bg: 'color.surface.canvas', min: 3, wcag: '1.4.11', advisory: true },
  { fg: 'color.border.focus', bg: 'color.surface.canvas', min: 3, wcag: '1.4.11' },
  { fg: 'color.border.strong', bg: 'color.surface.canvas', min: 3, wcag: '1.4.11' },
];

export function evaluateContrast(tokens) {
  return PAIRS.map((p) => {
    const fg = resolveValue(tokens, getToken(tokens, p.fg).$value);
    const bg = resolveValue(tokens, getToken(tokens, p.bg).$value);
    const ratio = contrastRatio(parseColor(fg), parseColor(bg));
    return { ...p, ratio: Math.round(ratio * 100) / 100, pass: ratio >= p.min || !!p.advisory, below: ratio < p.min };
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: contrast.mjs <tokens.json> [--json]');
    process.exit(2);
  }
  const results = evaluateContrast(JSON.parse(readFileSync(file, 'utf8')));
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    for (const r of results) {
      const mark = !r.pass ? 'FAIL' : r.below ? 'WARN' : 'PASS';
      console.log(`${mark}  ${r.ratio.toFixed(2).padStart(5)} >= ${r.min}  ${r.fg} on ${r.bg}  (WCAG ${r.wcag}${r.advisory ? ', advisory' : ''})`);
    }
  }
  process.exit(results.every((r) => r.pass) ? 0 : 1);
}
