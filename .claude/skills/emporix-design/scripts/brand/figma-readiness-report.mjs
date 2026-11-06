#!/usr/bin/env node
// Merge readiness-scan chunks into a report where every finding links to the affected element.
//
//   node figma-readiness-report.mjs chunk1.json chunk2.json ... --url <figma file URL> [--out report.md] [--json findings.json]
//
// --url is the design URL without query (https://www.figma.com/design/KEY/NAME). A node id becomes
// ?node-id=ID with ':' replaced by '-', and ';' encoded for instance-internal ids.

import { readFileSync, writeFileSync } from 'node:fs';

const files = [];
const opts = {};
const a = process.argv.slice(2);
for (let i = 0; i < a.length; i++) {
  if (a[i].startsWith('--')) opts[a[i].slice(2)] = a[++i];
  else files.push(a[i]);
}
if (!files.length || !opts.url) {
  console.error('usage: figma-readiness-report.mjs chunk.json ... --url <figma file URL> [--out report.md] [--json findings.json]');
  process.exit(2);
}
const base = opts.url.split('?')[0];
const link = (id, text) => `[${text ?? id}](${base}?node-id=${encodeURIComponent(id.replace(/:/g, '-')).replace(/%2D/g, '-')})`;
// A chunk is {rows: [...]} (objects) or the compact {names, r: [[pageId, frameId, kind, key, count, samples, likely]]}.
const expand = (c) => c.rows ?? (c.r ?? []).map(([pageId, frameId, kind, key, count, samples, likely]) => ({
  pageId, page: c.names[pageId], ...(frameId ? { frameId, frame: c.names[frameId] } : {}), kind, key, count, samples, likely: !!likely,
}));
const rows = files.flatMap((f) => expand(JSON.parse(readFileSync(f, 'utf8'))));

const TITLE = {
  'remote-instance': ['Remote instances', 'Components from another library file; they cannot follow this file\'s brand mode.'],
  'text-font-unbound': ['Text not bound to the font variable', 'Keeps its fixed typeface in every direction.'],
  'paint-unbound': ['Paints not bound to a variable', 'Fixed colours. Rows marked "likely intentional" match a known fixed mark (logo, payment, social, artwork); verify through the links.'],
  'gradient-unbound': ['Gradients not bound to variables', ''],
  'effect-unbound': ['Shadows and effects with a fixed colour', ''],
  'image-fill': ['Raster images', 'Cannot follow a brand.'],
  'static-hex-label': ['Colour values typed as text', 'Static labels cannot follow a mode.'],
  'page-mode-not-set': ['Pages without the brand mode', 'The page shows the collection\'s default mode.'],
  'heavy-frame': ['Heavy frames and pages', 'Large frames make mode switches, exports and scripts slow or failure-prone.'],
  'not-scanned': ['Not scanned', ''],
  'more-findings': ['Further findings not listed', 'Re-run on that frame for the full list.'],
};
const out = ['# Figma readiness report', '', `File: ${base}`, ''];
const totals = Object.fromEntries(Object.keys(TITLE).map((k) => [k, rows.filter((r) => r.kind === k).reduce((n, r) => n + r.count, 0)]).filter(([, n]) => n));
out.push('| Finding | Occurrences |', '|---|---|', ...Object.entries(totals).map(([k, n]) => `| ${TITLE[k][0]} | ${n} |`), '');
for (const [kind, [title, note]] of Object.entries(TITLE)) {
  const list = rows.filter((r) => r.kind === kind).sort((x, y) => y.count - x.count);
  if (!list.length) continue;
  out.push(`## ${title}`, '', note, '', '| Page | Frame | What | Count | Examples |', '|---|---|---|---|---|');
  for (const r of list) {
    const ex = r.samples.map((s, i) => link(s, `#${i + 1}`)).join(' ');
    out.push(`| ${link(r.pageId, r.page)} | ${r.frameId ? link(r.frameId, r.frame) : ''} | ${r.key}${r.likely ? ' (likely intentional)' : ''} | ${r.count} | ${ex} |`);
  }
  out.push('');
}
const md = out.join('\n');
if (opts.out) writeFileSync(opts.out, md);
else console.log(md);
if (opts.json) writeFileSync(opts.json, JSON.stringify(rows, null, 1));
console.error(JSON.stringify(totals));
