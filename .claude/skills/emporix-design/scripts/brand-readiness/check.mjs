#!/usr/bin/env node
// Brand-readiness checks for one channel of one target app. Read-only.
//
//   node check.mjs --target <repo> --config <channel.json> [--checks R2,R4]
//                  [--theme <site.css>] [--site-themes] [--out <dir>]
//
// --theme        also run R4 with this site theme layered over the defaults
// --site-themes  also run R4 for every theme file in config.theme.siteThemes
// --out          write report.json + report.md there
//
// Exit code 1 when any check has errors, so the same run can serve as a CI gate.
// Each check reports a state: open (violations), fixed (none, no guard in the target yet),
// graduated (none, and the target enforces it itself: config.checks.<id>.guard exists).

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { r2 } from './checks/r2-token-integrity.mjs';
import { r4 } from './checks/r4-contrast.mjs';
import { listFiles } from './lib/source.mjs';

const CHECKS = { R2: r2, R4: r4 };

const opts = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const key = argv[i].replace(/^--/, '');
  if (key === 'site-themes') opts[key] = true;
  else opts[key] = argv[++i];
}
if (!opts.target || !opts.config) {
  console.error('usage: check.mjs --target <repo> --config <channel.json> [--checks R2,R4] [--theme <css>] [--site-themes] [--out <dir>]');
  process.exit(2);
}

const root = resolve(opts.target);
const config = JSON.parse(readFileSync(opts.config, 'utf8'));
const files = listFiles(root, config.scan);
const wanted = (opts.checks ?? Object.keys(CHECKS).join(',')).split(',');

/** A guard is a package.json script name or a repo file path. */
function guardPresent(guard) {
  if (!guard) return false;
  const pkg = join(root, 'package.json');
  const scripts = existsSync(pkg) ? JSON.parse(readFileSync(pkg, 'utf8')).scripts ?? {} : {};
  return guard in scripts || existsSync(join(root, guard));
}

const runs = [];
for (const id of wanted) {
  if (!CHECKS[id]) {
    console.error(`unknown check ${id} (have ${Object.keys(CHECKS).join(', ')})`);
    process.exit(2);
  }
  runs.push(await CHECKS[id]({ root, config, files }));
  if (id === 'R4') {
    const themes = [];
    if (opts.theme) themes.push(resolve(opts.theme));
    if (opts['site-themes'] && config.theme.siteThemes) {
      const dir = join(root, config.theme.siteThemes);
      for (const f of readdirSync(dir).filter((n) => n.endsWith('.css')).sort()) themes.push(join(dir, f));
    }
    // Site themes are brand-range evidence (R5): reported, never part of the R4 state.
    for (const t of themes) runs.push({ ...r4({ root, config, files, themes: [t] }), id: 'R4', theme: t.replace(root + '/', '') });
  }
}

const results = runs.map((r) => {
  if (r.theme) return { ...r, state: 'evidence', guard: null, tracked: null };
  const guard = config.checks?.[r.id]?.guard ?? null;
  const state = r.errors ? 'open' : guardPresent(guard) ? 'graduated' : 'fixed';
  return { ...r, state, guard, tracked: config.checks?.[r.id]?.tracked ?? null };
});

// --- console -------------------------------------------------------------------------
for (const r of results) {
  const label = r.theme ? `${r.id} under ${r.theme}` : r.id;
  console.log(`${label}: ${r.state} — ${r.errors} errors, ${r.warnings} warnings${r.pairs !== undefined ? ` (${r.pairs} pairs)` : ''}`);
  if (r.id === 'R2') {
    console.log(`  verified by: ${r.verifiedBy}`);
    for (const e of r.summary) console.log(`  ${e.kind.padEnd(9)} ${e.name.padEnd(34)} ${String(e.uses).padStart(3)} uses ${String(e.files).padStart(2)} files  ${e.where[0]}${e.hint ? `  (${e.hint})` : ''}`);
  } else {
    for (const f of r.fails) {
      const pair = `${f.variants ? f.variants + ': ' : ''}text-${f.text} on ${f.bg ? 'bg-' + f.bg + (f.inferred ? ' (inferred)' : '') : 'page (assumed)'}`;
      console.log(`  ${f.ratio.toFixed(2)}:1 < ${f.needs}  ${pair.padEnd(62)} ${f.fg} on ${f.bgHex}  ${f.uses}× ${f.where[0]}`);
    }
    if (r.exempt.length) console.log(`  exempt (disabled states, WCAG 1.4.3): ${r.exempt.length} pairs below threshold`);
    if (r.unresolved.length) console.log(`  unresolved colours: ${r.unresolved.join(', ')}`);
  }
}

// --- files ---------------------------------------------------------------------------
if (opts.out) {
  const out = resolve(opts.out);
  mkdirSync(out, { recursive: true });
  const json = results.map(({ findings, ...r }) => r);
  writeFileSync(join(out, 'report.json'), JSON.stringify({ target: config.target, channel: config.channel, files: files.length, results: json }, null, 2) + '\n');
  const md = [`# Brand readiness — ${config.target} (${config.channel})`, '', `Scanned ${files.length} files. Read-only.`, '', '| Check | Theme | State | Errors | Warnings | Guard | Tracked |', '|---|---|---|---|---|---|---|'];
  for (const r of results) md.push(`| ${r.id} | ${r.theme ?? 'default'} | ${r.state} | ${r.errors} | ${r.warnings} | ${r.guard ?? '—'} | ${r.tracked ?? '—'} |`);
  for (const r of results) {
    md.push('', `## ${r.id}${r.theme ? ` under \`${r.theme}\`` : ''}`, '');
    if (r.id === 'R2') {
      md.push(`Verified by: ${r.verifiedBy}.`, '');
      md.push('| Kind | Class / value | Uses | Files | First seen |', '|---|---|---|---|---|');
      for (const e of r.summary) md.push(`| ${e.kind} | \`${e.name}\`${e.hint ? ` — ${e.hint}` : ''} | ${e.uses} | ${e.files} | \`${e.where[0]}\` |`);
    } else {
      md.push('| Ratio | Needs | State | Text | Background | Colours | Uses | First seen |', '|---|---|---|---|---|---|---|---|');
      for (const f of r.fails) md.push(`| ${f.ratio.toFixed(2)} | ${f.needs} | ${f.variants || 'base'} | \`text-${f.text}\` | ${f.bg ? `\`bg-${f.bg}\`${f.inferred ? ' (inferred)' : ''}` : 'page (assumed)'} | ${f.fg} on ${f.bgHex} | ${f.uses} | \`${f.where[0]}\` |`);
      if (r.exempt.length) md.push('', `Exempt (disabled states, WCAG 1.4.3): ${r.exempt.length} pairs below threshold.`);
      if (r.unresolved.length) md.push('', `Unresolved colours: ${r.unresolved.map((u) => `\`${u}\``).join(', ')}`);
    }
  }
  writeFileSync(join(out, 'report.md'), md.join('\n') + '\n');
  console.log(`wrote ${join(out, 'report.md')}`);
}

process.exit(results.some((r) => !r.theme && r.errors) ? 1 : 0);
