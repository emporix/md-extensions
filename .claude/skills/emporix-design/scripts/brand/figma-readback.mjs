#!/usr/bin/env node
// Figma -> brand read-back diff: resolved role values per mode in Figma against the brand tokens.
//
//   node figma-readback.mjs <dump.json> --profile <target.json> --tokens-dir <dir with <id>.direction.json + <id>.tokens.json>
//        --fidelity <fidelity.json> [--baseline <dump.json>] [--out report.md] [--json diff.json]
//
// The tokens stay the source of truth. This tool never writes anything: it lists what Figma shows
// differently as PROPOSALS. Roles the library cannot express (collapsed, fixed, approximate, capped) are
// marked "not editable": a difference there is not a design change and is never proposed for the tokens.
// With --baseline (a dump taken right after the brand was written) it also tells who changed: Figma, the
// tokens, or both (conflict: the tokens win).

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseColor, toHex } from './color.mjs';
import { getToken, resolveValue } from './tokens.mjs';

const a = process.argv.slice(2);
const opts = {};
const inputs = [];
for (let i = 0; i < a.length; i++) {
  if (a[i].startsWith('--')) opts[a[i].slice(2)] = a[++i];
  else inputs.push(a[i]);
}
if (!inputs[0] || !opts.profile || !opts['tokens-dir'] || !opts.fidelity) {
  console.error('usage: figma-readback.mjs <dump.json> --profile <target.json> --tokens-dir <dir> --fidelity <fidelity.json> [--baseline dump.json] [--out report.md] [--json diff.json]');
  process.exit(2);
}
const readJson = (f) => JSON.parse(readFileSync(f, 'utf8'));
const dump = readJson(inputs[0]);
const baseline = opts.baseline ? readJson(opts.baseline) : null;
const lib = readJson(opts.profile).figma?.library;
const fidelity = readJson(opts.fidelity);
const cap = lib.radiusCap;

// directions: Figma mode name -> tokens
const directions = {};
for (const f of readdirSync(opts['tokens-dir']).filter((x) => x.endsWith('.direction.json'))) {
  const d = readJson(join(opts['tokens-dir'], f));
  const tf = join(opts['tokens-dir'], `${d.id}.tokens.json`);
  directions[d.name] = { id: d.id, tokens: readJson(tf) };
}

const isHex = (v) => typeof v === 'string' && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v);
const toRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function tokenValue(tokens, path) {
  const t = getToken(tokens, path);
  if (!t) return undefined;
  const v = resolveValue(tokens, t.$value);
  if (typeof v === 'string' && /^-?[\d.]+px$/.test(v)) return parseFloat(v);
  if (typeof v === 'string' && /^(#|oklch|white|black)/i.test(v)) return toHex(parseColor(v));
  return v;
}
// Figma keeps font weights as style names ("semibold"); tokens hold numbers.
const WEIGHT = { 100: 'thin', 200: 'extralight', 300: 'light', 400: 'regular', 500: 'medium', 600: 'semibold', 700: 'bold', 800: 'extrabold', 900: 'black' };
const weightName = (v) => (typeof v === 'number' ? WEIGHT[v] : String(v).toLowerCase().replace(/[\s-]/g, ''));
const same = (x, y) => {
  if ((typeof x === 'string' && typeof y === 'number' && WEIGHT[y]) || (typeof y === 'string' && typeof x === 'number' && WEIGHT[x])) return weightName(x) === weightName(y);
  if (isHex(x) && isHex(y)) return toRgb(x).every((c, i) => Math.abs(c - toRgb(y)[i]) <= 2);
  return x === y;
};

// roles to compare: the profile's roleMap plus the true ramps
const items = lib.roleMap.map((r) => ({ name: r.role, from: r.from, approx: !!r.approx }));
const rampFamilies = new Set();
for (const m of Object.values(dump.modes)) for (const k of Object.keys(m)) { const g = k.match(/^ramp\/(brand|accent|neutral)\/(\d+)$/); if (g) { rampFamilies.add(k); } }
for (const k of rampFamilies) { const [, fam, step] = k.match(/^ramp\/(\w+)\/(\d+)$/); items.push({ name: k, from: `palette.${fam}.${step}`, ramp: true }); }

/** why a role is not editable in this mode, or null */
function notEditable(item, modeName, expected) {
  if (item.approx) return 'approximate: no exact role in the brand';
  if (cap?.roles?.includes(item.from) && typeof expected === 'number' && expected > cap.max) return `capped at ${cap.max}`;
  const hit = fidelity.find((f) => ['role-collapsed', 'role-fixed'].includes(f.kind)
    && (f.element === item.name || f.element === `library ${item.name}`)
    && (f.modes ?? []).some((m) => m === modeName || m === 'all'));
  if (hit) return hit.kind === 'role-collapsed' ? 'collapsed: shares a variable with another role' : 'fixed by the library';
  return null;
}

const rows = [];
const warnings = [];
for (const [modeName, values] of Object.entries(dump.modes)) {
  const dir = directions[modeName];
  if (!dir) { warnings.push(`Figma mode "${modeName}" has no direction in ${opts['tokens-dir']}: not compared (library mode)`); continue; }
  for (const item of items) {
    if (!(item.name in values)) continue;
    const figma = values[item.name];
    const token = tokenValue(dir.tokens, item.from);
    if (token === undefined) { warnings.push(`${item.from}: no token in ${dir.id}`); continue; }
    const base = baseline?.modes?.[modeName]?.[item.name];
    const locked = notEditable(item, modeName, token);
    const expected = locked?.startsWith('capped') ? cap.max : token;
    const matches = same(figma, expected);
    let status;
    if (locked) status = 'not-editable';
    else if (baseline && base !== undefined) {
      const figmaChanged = !same(figma, base);
      const tokenChanged = !same(base, token);
      status = figmaChanged && tokenChanged ? (same(figma, token) ? 'match' : 'conflict') : figmaChanged ? 'figma-changed' : tokenChanged ? 'token-changed' : 'match';
    } else status = matches ? 'match' : 'differs';
    rows.push({ mode: modeName, direction: dir.id, role: item.name, from: item.from, token, figma, status, reason: locked, shiftedFromExpected: locked ? (locked.startsWith('capped') ? !matches : base !== undefined ? !same(figma, base) : undefined) : undefined });
  }
}

const by = (s) => rows.filter((r) => r.status === s);
const out = ['# Figma read-back diff', '', `Dump: ${dump.collection}, ${Object.keys(dump.modes).length} modes${baseline ? ', with baseline' : ', no baseline (cannot tell who changed)'}. Rule: the tokens win; every row below is a proposal, nothing was written.`, ''];
out.push('| Status | Rows | Meaning |', '|---|---|---|');
const MEANING = { match: 'Figma equals the token', 'not-editable': 'the library cannot express it; never proposed', differs: 'Figma differs from the token (no baseline, so unknown who changed)', 'figma-changed': 'changed in Figma since the baseline: a proposal for the tokens', 'token-changed': 'tokens changed since the baseline; Figma is stale', conflict: 'both changed and disagree: the tokens win' };
for (const s of Object.keys(MEANING)) out.push(`| ${s} | ${by(s).length} | ${MEANING[s]} |`);
out.push('');
const table = (title, list, cols) => {
  if (!list.length) return;
  out.push(`## ${title}`, '', `| Direction | Role | Token | ${cols} |`, '|---|---|---|---|');
  for (const r of list) out.push(`| ${r.direction} | \`${r.role}\` | \`${r.from}\` = ${r.token} | ${r.figma} |`);
  out.push('');
};
table('Proposals: changed in Figma', by('figma-changed'), 'Figma now');
table('Conflicts: tokens win', by('conflict'), 'Figma now');
table('Differs from the tokens (no baseline)', by('differs'), 'Figma shows');
table('Tokens changed since the baseline', by('token-changed'), 'Figma still shows');
const ne = by('not-editable');
if (ne.length) {
  out.push('## Not editable roles', '', 'Values here are not design changes. "Moved" means Figma no longer shows what it showed at the baseline (for a capped role: the cap), which is worth a look but is never written onto a token; without a baseline only capped roles can be judged.', '', '| Direction | Role | Why | Token | Figma | Moved |', '|---|---|---|---|---|---|');
  for (const r of ne) out.push(`| ${r.direction} | \`${r.role}\` | ${r.reason} | ${r.token} | ${r.figma} | ${r.shiftedFromExpected ? 'yes' : ''} |`);
  out.push('');
}
if (dump.missing?.length) out.push(`**Roles not found in the file:** ${dump.missing.join(', ')} (renamed or deleted in Figma: the mapping chain breaks silently, see T-08).`, '');
for (const w of warnings) out.push(`- ${w}`);
const md = out.join('\n');
if (opts.out) writeFileSync(opts.out, md); else console.log(md);
if (opts.json) writeFileSync(opts.json, JSON.stringify(rows, null, 1));
console.error(JSON.stringify(Object.fromEntries(Object.keys(MEANING).map((s) => [s, by(s).length]))));
