#!/usr/bin/env node
// Fidelity check for writing a brand into a target's Figma library (route A).
// Lists, per element, what the library cannot show the way the brand defines it, BEFORE any
// write, so a human sees each loss and a Figma -> CSS read-back is not trusted blindly.
//
//   node figma-fidelity.mjs <spec.json> --profile <target.json> [--out <report.md>] [--json <findings.json>]
//
// Inputs: the Figma spec (brand rows per direction) and the profile's `figma.library`
// (roleMap, chain = the library role -> primitive step it aliases, anchors = which brand role owns a
// shared ramp step, radiusCap, fixedInLibrary, notGenerated). Nothing here talks to Figma; refresh `chain` when the library changes.

import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opts = {};
const inputs = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) opts[args[i].slice(2)] = args[++i];
  else inputs.push(args[i]);
}
if (!inputs[0] || !opts.profile) {
  console.error('usage: figma-fidelity.mjs <spec.json> --profile <target.json> [--out <report.md>] [--json <findings.json>]');
  process.exit(2);
}
const spec = JSON.parse(readFileSync(inputs[0], 'utf8'));
const lib = JSON.parse(readFileSync(opts.profile, 'utf8')).figma?.library;
if (!lib?.chain || !lib?.roleMap) {
  console.error('profile has no figma.library with roleMap and chain: nothing to check against');
  process.exit(2);
}

const FAMILY = { primary: 'brand', secondary: 'accent', neutral: 'neutral' };
const parts = (target) => {
  const m = target.match(/^color\/(primary|secondary|neutral)\/(\d+|white|black)$/);
  return m ? { family: m[1], step: m[2] } : null;
};
/** "#28366a  ·  brand 800" -> { hex, family, step } */
const parseRow = (value) => {
  const [hex, label = ''] = value.split('·').map((s) => s.trim());
  const m = label.match(/^(brand|accent|neutral) (\d+)$/);
  return { hex: hex.split(' ')[0], family: m?.[1] ?? null, step: m?.[2] ?? (label || null) };
};

const findings = [];
const add = (f) => findings.push(f);
const roles = lib.roleMap.filter((r) => lib.chain[r.role]);

for (const mode of spec.modes) {
  const rows = Object.fromEntries(spec.atoms.brand.rows[mode.id].map((r) => [r.token, parseRow(r.value)]));
  const brandOf = (from) => {
    const m = from.match(/^palette\.(brand|accent|neutral)\.(\d+)$/);
    if (m) return { hex: null, family: m[1], step: m[2] };
    return rows[from] ?? null;
  };

  // 1. Library steps that a role pins: the ramp is re-ordered when the anchor role's brand step differs.
  const anchorStep = (target) => {
    const a = lib.anchors?.[target];
    return a ? brandOf(a) : null;
  };
  const seen = new Set();
  for (const r of roles) {
    const target = lib.chain[r.role];
    const t = parts(target);
    if (!t || t.family === 'neutral' || seen.has(target)) continue;
    seen.add(target);
    const b = anchorStep(target);
    if (b && FAMILY[t.family] === b.family && b.step !== t.step) {
      add({ kind: 'ramp-reordered', mode: mode.name, element: target, shows: `${b.family} ${b.step} (anchor ${lib.anchors[target]})`, brandWants: `${b.family} ${t.step} at its own step`, impact: 'the library pins this step to a role, so the brand ramp is re-ordered; read back from Figma it no longer matches the brand ramp' });
    }
  }

  // 2. Roles on the same library step as the anchor that need another value in this direction.
  for (const r of roles) {
    const target = lib.chain[r.role];
    const t = parts(target);
    const anchor = lib.anchors?.[target];
    if (!t || t.family === 'neutral' || !anchor || r.from === anchor) continue;
    const b = brandOf(r.from);
    const a = brandOf(anchor);
    if (!b || !a || `${b.family} ${b.step}` === `${a.family} ${a.step}`) continue;
    add({ kind: 'role-collapsed', mode: mode.name, element: r.role, shows: `${a.family} ${a.step} (same variable as ${anchor})`, brandWants: `${r.from} = ${b.family} ${b.step}`, impact: 'two brand roles land on one library variable; this one cannot differ in Figma and cannot be recovered from it' });
  }

  // 3. Roles the library fixes (white, or a neutral step) that the brand wants elsewhere.
  for (const r of roles) {
    const t = parts(lib.chain[r.role]);
    const b = brandOf(r.from);
    if (!t || !b || t.family !== 'neutral') continue;
    const wants = `${b.family ?? ''} ${b.step}`.trim();
    const has = /^\d+$/.test(t.step) ? `neutral ${t.step}` : t.step;
    if (has !== wants && !(t.step === 'white' && b.step === 'white') && !(t.step === 'black' && b.step === 'black')) {
      add({ kind: 'role-fixed', mode: mode.name, element: `library ${r.role}`, shows: has, brandWants: `${r.from} = ${wants}`, impact: 'stays at the library step in every direction (changing it would also change the default look)' });
    }
  }

  // 4. Approximations declared in the profile.
  for (const r of roles.filter((x) => x.approx)) {
    const b = brandOf(r.from);
    add({ kind: 'role-approximate', mode: mode.name, element: `library ${r.role}`, shows: `${r.from}${b ? ` (${b.family ?? ''} ${b.step})`.replace('( ', '(') : ''}`, brandWants: 'no exact role in the brand', impact: 'closest brand token; a read-back would write this value onto the brand token' });
  }

  // 5. Radius above the library's cap.
  for (const v of spec.variables.filter((x) => (lib.radiusCap?.roles ?? []).some((q) => `radius/${q.split('.')[1]}` === x.name))) {
    const val = v.values[mode.id];
    if (val > lib.radiusCap.max) add({ kind: 'radius-capped', mode: mode.name, element: `library ${v.name}`, shows: `${lib.radiusCap.max}px`, brandWants: `${val}px`, impact: lib.radiusCap.why });
  }

  // 6. Casing and tracking.
  if (mode.action && (mode.action.transform !== 'none' || String(mode.action.letterSpacing) !== '0')) {
    add({ kind: 'per-frame-override', mode: mode.name, element: 'button label casing and letter spacing', shows: 'applied by hand per frame', brandWants: `${mode.action.transform}, ${mode.action.letterSpacing}`, impact: 'cannot be a Figma variable; not part of any read-back' });
  }
}

// Once, not per direction.
for (const e of lib.fixedInLibrary ?? []) add({ kind: 'fixed-in-library', mode: 'all', element: e, shows: 'unchanged in every direction', brandWants: 'no brand token', impact: 'does not follow the brand' });
for (const e of lib.notGenerated ?? []) add({ kind: 'no-brand-token', mode: 'all', element: e, shows: 'unchanged', brandWants: 'no brand token', impact: 'not brand-driven until the vocabulary has the token' });
if (spec.atoms?.brand?.notGenerated) for (const e of [].concat(spec.atoms.brand.notGenerated)) add({ kind: 'no-brand-token', mode: 'all', element: typeof e === 'string' ? e : (e.name ?? JSON.stringify(e)), shows: 'not generated', brandWants: 'no brand token', impact: 'not brand-driven' });

const merged = new Map();
for (const f of findings) {
  const k = [f.kind, f.element, f.shows, f.brandWants, f.impact].join('|');
  const m = merged.get(k);
  if (m) m.modes.push(f.mode);
  else merged.set(k, { ...f, modes: [f.mode] });
}
const rows = [...merged.values()].map((f) => ({ ...f, mode: f.modes.length === spec.modes.length || f.modes[0] === 'all' ? 'all directions' : f.modes.join(', ') }));
const title = { 'ramp-reordered': 'Ramp re-ordered', 'role-collapsed': 'Roles collapsed', 'role-fixed': 'Role fixed by the library', 'role-approximate': 'Approximate role', 'radius-capped': 'Radius capped', 'per-frame-override': 'Per-frame override', 'fixed-in-library': 'Fixed in the library', 'no-brand-token': 'No brand token' };
const lines = [`# Fidelity check: ${spec.brand ?? 'brand'} -> library`, '', `${rows.length} elements will not round-trip exactly. Each is listed; acknowledge them before any write.`, ''];
for (const kind of Object.keys(title)) {
  const list = rows.filter((f) => f.kind === kind);
  if (!list.length) continue;
  lines.push(`## ${title[kind]} (${list.length})`, '', '| Element | Direction | Figma shows | Brand wants | Why it matters |', '|---|---|---|---|---|');
  for (const f of list) lines.push(`| ${f.element} | ${f.mode} | ${f.shows} | ${f.brandWants} | ${f.impact} |`);
  lines.push('');
}
const md = lines.join('\n');
if (opts.out) writeFileSync(opts.out, md);
if (opts.json) writeFileSync(opts.json, JSON.stringify(rows, null, 1));
const counts = Object.fromEntries(Object.keys(title).map((k) => [k, rows.filter((f) => f.kind === k).length]).filter(([, n]) => n));
console.log(JSON.stringify({ total: rows.length, counts }));
if (!opts.out) console.log(md);
