#!/usr/bin/env node
// How close is a direction to the website it was derived from?
//
//   node site-distance.mjs <tokens.json> <site-brand.json> [--json]
//
// use=inspiration: exit 1 when the direction keeps the site's identity (action colour
//   AND heading font both match). Each single close match is a warning.
// use=own: reports every place the direction departs from the measured brand; each
//   departure must appear in the direction's substitutions[] (exit 1 when one is missing).

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseColor } from './color.mjs';
import { EXT, getToken, resolveValue } from './tokens.mjs';

const CLOSE_DE = 0.06; // OKLab distance below which two colours read as "the same colour"
const VECTOR_DEADZONE = 0.02; // OKLCH lightness difference below which two colours count as equally light

function oklabDistance(a, b) {
  const lab = ({ l, c, h }) => [l, c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)];
  const [x, y] = [lab(parseColor(a)), lab(parseColor(b))];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

const norm = (f) => String(f ?? '').toLowerCase().replace(/["']/g, '').trim();

export function siteDistance(tokens, site) {
  const v = (p) => resolveValue(tokens, getToken(tokens, p).$value);
  const subs = tokens.$extensions?.[EXT]?.substitutions ?? [];
  const covered = (what) => subs.some((s) => s.what === what);
  const checks = [];

  // The direction may name which measured candidate is the source's real call to action.
  const c0 = site.colors ?? {};
  const chosen = tokens.$extensions?.[EXT]?.source?.action?.toLowerCase();
  let act = c0.action?.hex;
  let actLabel = c0.onAction?.hex;
  let actHover = c0.actionHover?.hex;
  let actionNote = '';
  if (chosen && chosen !== act) {
    const cand = site.candidates?.actions?.find((a) => a.hex === chosen);
    if (cand) {
      act = cand.hex;
      actLabel = cand.label;
      actHover = null; // hover was measured on the other candidate
      actionNote = `call to action chosen by the direction: candidate ${cand.hex} "${cand.from}"`;
    } else {
      actionNote = `source.action ${chosen} is not among the measured candidates; using ${act}`;
    }
  }
  const add = (what, site, direction, same, detail) => checks.push({ what, site, direction, same, detail, recorded: covered(what) });

  if (act) {
    const de = oklabDistance(v('color.surface.action'), act);
    add('color.surface.action', act, v('color.surface.action'), de < CLOSE_DE, `ΔE(OKLab) ${de.toFixed(3)}`);
  }
  if (actLabel) {
    const de = oklabDistance(v('color.text.on-action'), actLabel);
    add('color.text.on-action', actLabel, v('color.text.on-action'), de < CLOSE_DE, `ΔE(OKLab) ${de.toFixed(3)}`);
  }
  if (site.colors?.canvas?.hex) {
    const de = oklabDistance(v('color.surface.canvas'), site.colors.canvas.hex);
    add('color.surface.canvas', site.colors.canvas.hex, v('color.surface.canvas'), de < CLOSE_DE / 3, `ΔE(OKLab) ${de.toFixed(3)}`);
  }
  if (site.fonts?.heading?.family) {
    const dir = v('font.heading')[0];
    add('font.heading', site.fonts.heading.family, dir, norm(dir) === norm(site.fonts.heading.family), '');
  }
  if (site.fonts?.body?.family) {
    const dir = v('font.body')[0];
    add('font.body', site.fonts.body.family, dir, norm(dir) === norm(site.fonts.body.family), '');
  }
  if (site.radius?.button?.value) {
    const dir = v('radius.control');
    add('radius.control', site.radius.button.value, dir, parseFloat(dir) === parseFloat(site.radius.button.value), '');
  }
  if (site.button?.transform) {
    const dir = v('type.action.transform');
    add('type.action.transform', site.button.transform, dir, norm(dir) === norm(site.button.transform), '');
  }

  // Vectors are character, not identity. Each pair keeps the direction it has in the
  // source (OKLCH lightness: lighter / darker), in both modes: text vs page, label vs
  // button, hover vs normal. Hue, chroma and step size are free. Distance must come from
  // hue, type and shape. Only an explicit polarityOverride (asked for by the user) lifts it.
  const L = (c) => parseColor(c).l;
  const way = (a, b) => {
    const d = L(a) - L(b);
    return d > VECTOR_DEADZONE ? 'lighter' : d < -VECTOR_DEADZONE ? 'darker' : 'same';
  };
  const c = site.colors ?? {};
  const pageBg = site.palette?.[0]?.hex ?? c.canvas?.hex;
  const vectors = [];
  const vector = (what, siteA, siteB, dirA, dirB, tokens) => {
    if (!siteA || !siteB) return;
    const s = way(siteA, siteB);
    if (s === 'same') return; // no direction in the source to keep
    vectors.push({ what, site: s, direction: way(v(dirA), v(dirB)), from: `site ${siteA} vs ${siteB}; direction ${tokens}` });
  };
  vector('text vs page', c.body?.hex, pageBg, 'color.text.body', 'color.surface.canvas', 'color.text.body vs color.surface.canvas');
  vector('label vs button', actLabel, act, 'color.text.on-action', 'color.surface.action', 'color.text.on-action vs color.surface.action');
  vector('hover vs normal', actHover, act, 'color.surface.action-hover', 'color.surface.action', 'color.surface.action-hover vs color.surface.action');
  const override = tokens.$extensions?.[EXT]?.polarityOverride;
  const flips = vectors.filter((p) => p.site !== p.direction);

  const byWhat = Object.fromEntries(checks.map((c) => [c.what, c]));
  let verdict;
  let problems = [];
  if (site.use === 'inspiration') {
    const copied = byWhat['color.surface.action']?.same && byWhat['font.heading']?.same;
    verdict = copied ? 'FAIL' : checks.some((c) => c.same && ['color.surface.action', 'font.heading'].includes(c.what)) ? 'WARN' : 'PASS';
    if (copied) problems.push('keeps the site identity: same action colour and same heading font');
  } else {
    problems = checks.filter((c) => !c.same && !c.recorded).map((c) => `${c.what} departs from the site (${c.site} → ${c.direction}) without a recorded substitution`);
    verdict = problems.length ? 'FAIL' : 'PASS';
  }
  for (const f of flips) {
    const msg = `${f.what} reversed: in the site the first is ${f.site}, in the direction ${f.direction} (${f.from})`;
    if (override) {
      problems.push(`${msg}; allowed by polarityOverride: ${override}`);
      if (verdict === 'PASS') verdict = 'WARN';
    } else {
      problems.push(`${msg}; move along the source's vector instead (e.g. darken the button rather than flip its label; keep a light page light)`);
      verdict = 'FAIL';
    }
  }
  return { use: site.use, url: site.url, verdict, problems, checks, vectors, actionNote };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [tokFile, siteFile] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!tokFile || !siteFile) {
    console.error('usage: site-distance.mjs <tokens.json> <site-brand.json> [--json]');
    process.exit(2);
  }
  const r = siteDistance(JSON.parse(readFileSync(tokFile, 'utf8')), JSON.parse(readFileSync(siteFile, 'utf8')));
  if (process.argv.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else {
    console.log(`${r.verdict}  ${r.use} · ${r.url}`);
    if (r.actionNote) console.log(`  note: ${r.actionNote}`);
    for (const c of r.checks) {
      console.log(`  ${c.same ? 'same ' : 'diff '} ${c.what.padEnd(22)} site ${String(c.site).padEnd(12)} direction ${c.direction} ${c.detail}${!c.same && c.recorded ? ' (substitution recorded)' : ''}`);
    }
    for (const p of r.vectors) console.log(`  ${p.site === p.direction ? 'kept ' : 'FLIP '} ${p.what.padEnd(22)} site ${p.site.padEnd(12)} direction ${p.direction}`);
    for (const p of r.problems) console.log(`  problem: ${p}`);
  }
  process.exit(r.verdict === 'FAIL' ? 1 : 0);
}
