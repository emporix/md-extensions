#!/usr/bin/env node
// Assemble the gap catalogue of a generated brand: what stops it going from brand to Figma to the app.
//
//   node gap-catalogue.mjs --profile <target.json> --gap-table <ticket-table.md>
//        [--readiness report.json ...] [--fidelity fidelity.json] [--scan findings.json]
//        [--figma-url <file url>] [--brand <name>] [--ticket COP-7095] [--out gap-catalogue.md]
//
// Sources, each optional except the profile; a missing one is listed in section 6, never guessed:
//   --gap-table  the ticket's G table (markdown, rows `| G-01 | ... |`, `BR-n (also in <ticket>): ...` lines)
//   --readiness  readiness `report.json` per channel (error/warning counts per check, `tracked` ids)
//   --fidelity   `figma-fidelity.mjs --json` output (what the library cannot show the way the brand defines it)
//   --scan       `figma-readiness-report.mjs --json` output (read-only scan rows with page and frame ids)
// The profile's `gaps[].ticket` joins its brand-vocabulary gaps to ticket rows. Ratings of Figma findings
// come from the table below, not from a human review: change them there when a team agrees otherwise.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const a = process.argv.slice(2);
const opts = { readiness: [] };
for (let i = 0; i < a.length; i++) {
  if (!a[i].startsWith('--')) continue;
  const k = a[i].slice(2);
  if (k === 'readiness') opts.readiness.push(a[++i]);
  else opts[k] = a[++i];
}
if (!opts.profile) {
  console.error('usage: gap-catalogue.mjs --profile <target.json> --gap-table <table.md> [--readiness report.json ...] [--fidelity fidelity.json] [--scan findings.json] [--figma-url URL] [--brand NAME] [--ticket ID] [--out file.md]');
  process.exit(2);
}
const readJson = (f) => JSON.parse(readFileSync(f, 'utf8'));
const profile = readJson(opts.profile);
const fidelity = opts.fidelity ? readJson(opts.fidelity) : null;
const scanRaw = opts.scan ? readJson(opts.scan) : null;
const scan = scanRaw ? (Array.isArray(scanRaw) ? scanRaw : (scanRaw.rows ?? [])) : null;
const reports = opts.readiness.map(readJson);
const ticket = opts.ticket ?? 'the gap ticket';
const base = opts['figma-url']?.split('?')[0];
const link = (id, text) =>
  base ? `[${text ?? id}](${base}?node-id=${encodeURIComponent(id.replace(/:/g, '-')).replace(/%2D/g, '-')})` : (text ?? id);
const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

// ---------- ticket table ----------
const tableRows = [];
const extraRows = [];
if (opts['gap-table']) {
  for (const line of readFileSync(opts['gap-table'], 'utf8').split('\n')) {
    const m = line.match(/^\|\s*((?:G|BR)-\d+)([^|]*)\|(.*)\|\s*$/);
    if (m) {
      const cells = m[3].split('|').map((c) => c.trim());
      if (cells.length < 5) continue;
      const [gap, evidence, where, , sev] = cells;
      const sevM = sev.replace(/\*/g, '').match(/^([HML])\b\s*(.*)$/);
      tableRows.push({
        id: m[1],
        status: /✎/.test(m[2]) ? 'updated' : /➕/.test(m[2]) ? 'proposed' : '',
        gap: clip(gap.match(/^\*\*(.+?)\*\*/)?.[1] ?? gap.split(/[.:]/)[0], 150),
        evidence,
        where: clip(where.replace(/`/g, ''), 160),
        sev: sevM?.[1] ?? '?',
        appliesTo: (sevM?.[2] ?? '').replace(/^\((.*)\)$/, '$1'),
      });
      continue;
    }
    const br = line.match(/^(BR-\d+) \(also in [^)]*\): (.+)$/);
    if (br) extraRows.push({ id: br[1], status: '', gap: clip(br[2].replace(/`/g, ''), 150), where: '', sev: 'L', appliesTo: '' });
  }
}
const ticketRows = [...tableRows, ...extraRows.filter((r) => !tableRows.some((t) => t.id === r.id))];
const ticketIds = new Set(ticketRows.map((r) => r.id));
const profileGaps = profile.gaps ?? [];
const tokenByTicket = new Map();
for (const g of profileGaps) if (g.ticket) tokenByTicket.set(g.ticket, [...(tokenByTicket.get(g.ticket) ?? []), g.token]);

// ---------- readiness ----------
const checks = reports.flatMap((r) => (r.results ?? []).map((c) => ({ channel: r.channel, ...c })));
const trackedIds = (c) => (c.tracked ?? '').match(/(?:G|BR)-\d+/g) ?? [];
// A check can run once per theme (R4); it counts as tracked when any run of that check id names a ticket row.
const trackedBy = new Map();
for (const c of checks) if (c.tracked) trackedBy.set(c.id, c.tracked);
const where = (c) => (c.themes?.length ? c.themes.map((t) => t.split('/').pop()).join(', ') : (c.theme ?? '').split('/').pop());

// ---------- figma findings ----------
const SEV = { H: 'H', M: 'M', L: 'L', none: 'none' };
// kind -> row. `scan` kinds come from figma-readiness-report, the others from figma-fidelity.
const F = [
  { id: 'F-01', sev: 'M', fid: ['ramp-reordered'], text: 'Library roles pinned to ramp steps, so the brand ramp is re-ordered inside the library ramps' },
  { id: 'F-02', sev: 'M', fid: ['role-collapsed'], text: 'Roles collapse: two brand roles land on one library variable, so one of them cannot differ in Figma' },
  { id: 'F-03', sev: 'M', fid: ['role-fixed', 'fixed-in-library'], text: 'Roles the library fixes: they keep the library value in every direction' },
  { id: 'F-04', sev: 'L', fid: ['radius-capped'], text: 'A radius role drives fields and tall panels; the brand value is capped so menus do not turn into bubbles' },
  { id: 'F-05', sev: 'L', scan: ['static-hex-label'], text: 'Static text where a value must follow a mode (colour values typed as text)' },
  { id: 'F-06', sev: 'M', fid: ['no-brand-token'], text: 'Elements with no brand token (the vocabulary lacks the role): they stay on the library value' },
  { id: 'F-07', sev: 'L', scan: ['effect-unbound'], text: 'Shadows and effects with a fixed colour' },
  { id: 'F-08', sev: 'H', scan: ['remote-instance'], text: 'Remote components cannot follow this file\'s mode' },
  { id: 'F-09', sev: 'M', scan: ['text-font-unbound'], text: 'Text not bound to the font variable keeps its typeface' },
  { id: 'F-10', sev: 'L', scan: ['paint-unbound', 'gradient-unbound'], text: 'Paints and gradients not bound to a variable', excludeLikely: true },
  { id: 'F-11', sev: 'none', scan: ['paint-unbound', 'gradient-unbound', 'image-fill'], text: 'Marks that stay fixed by nature (logos, payment and social icons, photos, artwork) and Figma\'s own component-set outlines: not gaps to fix', onlyLikely: true },
  { id: 'F-12', sev: 'M', scan: ['heavy-frame'], text: 'Page weight: mode switches, exports and scripts are slow or fail on very large frames' },
  { id: 'F-15', sev: 'L', scan: ['not-scanned', 'page-mode-not-set'], text: 'Not covered by the scan, or pages that do not show the brand mode yet' },
  { id: 'F-16', sev: 'L', fid: ['role-approximate'], text: 'Roles mapped to the closest brand token (no exact role): a read-back would write the library value onto that token' },
];
const STATIC_F = [
  { id: 'F-13', sev: 'L', text: 'No global mode switch in Figma: the mode is set per page, section or frame, and a file using the library chooses its own' },
  { id: 'F-14', sev: 'M', text: 'Library structure decisions the designer owns (one switch or three, whether the default look may change, separate radius roles, the remote library)' },
];
const figmaRows = [];
for (const f of F) {
  let n = 0;
  const ev = [];
  if (f.fid && fidelity) {
    const items = fidelity.filter((x) => f.fid.includes(x.kind));
    n += items.length;
    const els = [...new Set(items.map((x) => x.element))];
    if (els.length) ev.push(`${plural(els.length, 'element')}: ${els.slice(0, 5).map((e) => `\`${esc(e)}\``).join(', ')}${els.length > 5 ? ', …' : ''}`);
  }
  if (f.scan && scan) {
    const items = scan.filter((r) => f.scan.includes(r.kind) && (f.onlyLikely ? r.likely : f.excludeLikely ? !r.likely : true));
    n += items.reduce((s, r) => s + (r.count ?? 1), 0);
    const top = [...items].sort((x, y) => y.count - x.count).slice(0, 4);
    for (const r of top) ev.push(`${link(r.frameId ?? r.pageId, `${r.page}${r.frame ? ` / ${r.frame}` : ''}`)} (${r.count})`);
  }
  if (n) figmaRows.push({ ...f, n, ev });
}

// ---------- transfer ----------
const has = (kinds) => (fidelity ?? []).some((x) => kinds.includes(x.kind));
const hasScan = (kinds) => (scan ?? []).some((r) => kinds.includes(r.kind));
const readbackBuilt = existsSync(new URL('./figma-readback.mjs', import.meta.url));
const T = [
  [has(['role-collapsed', 'role-fixed', 'role-approximate']), 'T-01', 'H', 'Edits to collapsed, fixed or approximate roles cannot be written back', 'Several roles share one variable, or the library fixes the value; an edit lands on the wrong brand token or none'],
  [has(['ramp-reordered']), 'T-02', 'M', 'The re-ordered ramps are not the brand\'s ramps', 'The read-back must use the true ramps kept in the ramp variables, not the library ramps'],
  [true, 'T-03', 'M', 'Edits that are not tokens (layout, new components, spacing, copy) cannot be transferred by this process', 'Only tokens map to the target\'s theme'],
  [hasScan(['remote-instance', 'text-font-unbound', 'paint-unbound']), 'T-04', 'M', 'Hard-coded paints, unbound text and remote instances are invisible to a read-back', 'A designer can recolour them by hand and nothing reaches the code'],
  [profileGaps.some((g) => g.token.startsWith('type.action')), 'T-05', 'L', 'Per-frame overrides (button casing, letter spacing) are not Figma variables', 'They cannot be read back at all'],
  [has(['radius-capped']), 'T-06', 'M', 'Values changed by the library\'s limits (radius cap) must not overwrite the brand token', 'Without a guard a read-back writes the cap over the brand value'],
  [true, 'T-07', 'M', 'Both sides changed since the brand was generated (tokens edited, Figma edited)', 'No conflict detection yet; the rule is that the tokens win and Figma changes are proposals'],
  [true, 'T-08', 'L', 'Role names in Figma and CSS variable names differ and go through the profile\'s mapping chain', 'A role renamed in Figma breaks the mapping silently'],
  [true, 'T-09', 'L', 'Fonts: Figma needs the font installed, the app serves it; a font change in Figma needs a hosting decision', ''],
  [!readbackBuilt, 'T-10', 'M', 'The read-back tool itself is not built', 'Diff of resolved role values per mode against the tokens, with collapsed, fixed and approximate roles marked "not editable"'],
].filter((t) => t[0]);

// ---------- render ----------
const o = [];
const today = new Date().toISOString().slice(0, 10);
o.push(`# Gap catalogue: ${opts.brand ?? 'a generated brand'}, from brand to Figma to the app`, '');
o.push(`Generated ${today} by \`gap-catalogue.mjs\`. Target: ${profile.target}.${base ? ` Figma file: ${base}.` : ''} Do not edit by hand: re-run with the same inputs.`, '');
o.push('## 1. How to use this catalogue', '');
o.push('| Workflow | Path | Read |', '|---|---|---|', '| **1** | brand, then Figma, then review, then Figma changes go into the app | sections 2, 3, 4 and 5 |', '| **2** | brand goes to Figma **and** the app in parallel; no review step | sections 2, 3, 5 (section 4 does not apply) |', '');
o.push('**Areas:** **a** implement in the app, **b** review in Figma, **c** transfer Figma changes back. **Severity:** H breaks accessibility, legal or identity; M the brand only partly applies; L cosmetic or process.', '');

o.push('## 2. The app: can the brand be implemented? (area a, both workflows)', '');
if (checks.length) {
  o.push('Readiness checks on the app:', '', '| Channel | Check | Theme | Errors | Warnings | Verified by | Tracked in |', '|---|---|---|---|---|---|---|');
  for (const c of checks) o.push(`| ${c.channel} | ${c.id} | ${esc(where(c))} | ${c.errors} | ${c.warnings} | ${esc(c.verifiedBy ?? '')} | ${trackedBy.has(c.id) ? esc(trackedBy.get(c.id)) : '**not tracked**'} |`);
  o.push('');
}
if (ticketRows.length) {
  o.push(`Rows of ${ticket}; "updated" and "proposed" rows are drafted but not confirmed in the ticket. "Profile" is the brand-vocabulary token that hits the gap.`, '');
  o.push('| ID | Gap | Sev | Where | Profile | Status |', '|---|---|---|---|---|---|');
  for (const r of ticketRows) {
    o.push(`| ${r.id} | ${esc(r.gap)} | ${r.sev}${r.appliesTo ? ` ${esc(r.appliesTo)}` : ''} | ${esc(r.where)} | ${(tokenByTicket.get(r.id) ?? []).map((t) => `\`${t}\``).join(', ')} | ${r.status} |`);
  }
  o.push('');
} else o.push('_No ticket table given._', '');
const orphanGaps = profileGaps.filter((g) => !g.ticket || (ticketRows.length && !ticketIds.has(g.ticket)));
if (orphanGaps.length) {
  o.push('**Profile gaps with no ticket row** (propose a row, or set `ticket` on the gap):', '');
  for (const g of orphanGaps) o.push(`- \`${g.token}\`: ${g.why} (${g.where})`);
  o.push('');
}
const untracked = checks.filter((c) => (c.errors || c.warnings) && (!trackedBy.has(c.id) || trackedIds({ tracked: trackedBy.get(c.id) }).some((id) => ticketRows.length && !ticketIds.has(id))));
if (untracked.length) o.push(`**Readiness results not covered by a ticket row:** ${untracked.map((c) => `${c.channel} ${c.id}${where(c) ? ` on ${where(c)}` : ''} (${c.errors} errors, ${c.warnings} warnings)`).join('; ')}.`, '');
const mapping = [...new Map((profile.map ?? []).filter((m) => m.approx).map((m) => [m.from, m])).values()];
if (mapping.length) o.push(`**Mapping limits of the brand vocabulary:** ${plural(mapping.length, 'token')} map only approximately (${mapping.map((m) => `\`${m.from}\``).join(', ')}); ${plural(profileGaps.length, 'token')} cannot be expressed (gaps above).`, '');

o.push('## 3. Figma: can the brand be reviewed in the library? (area b, both workflows)', '');
if (figmaRows.length || fidelity || scan) {
  o.push(`Counts come from ${[fidelity && 'the fidelity check', scan && 'the readiness scan'].filter(Boolean).join(' and ') || 'no input'}${scan ? '; scan rows link to the affected frame' : ''}. Severity is the table in this script's source.`, '');
  o.push('| ID | Gap | Sev | Count | Evidence |', '|---|---|---|---|---|');
  for (const r of [...figmaRows, ...STATIC_F.map((f) => ({ ...f, n: '', ev: [] }))].sort((x, y) => x.id.localeCompare(y.id))) {
    o.push(`| ${r.id} | ${esc(r.text)} | ${SEV[r.sev]} | ${r.n} | ${r.ev.join('; ')} |`);
  }
  o.push('');
} else o.push('_Neither the fidelity check nor the readiness scan was given._', '');

o.push('## 4. Transfer: can changes made in Figma come back? (area c, workflow 1 only)', '');
o.push('The brand tokens stay the source of truth. Figma changes come back only as a diff of resolved role values per mode against the tokens; the tokens win on conflict.', '');
o.push('| ID | Gap | Sev | Why |', '|---|---|---|---|');
for (const [, id, sev, gap, why] of T) o.push(`| ${id} | ${gap} | ${sev} | ${why} |`);
o.push('');

o.push('## 5. Divergence: Figma and the generated CSS show different things (areas a and b, matters most in workflow 2)', '');
o.push('In workflow 2 nobody reviews the difference, so it is listed. It goes both ways.', '');
if (profileGaps.length) {
  o.push('**Brand tokens the app cannot express yet** (Figma can show them where the library has a matching role; they diverge until the app gap is closed):', '', '| Token | App today | Gap |', '|---|---|---|');
  for (const g of profileGaps) o.push(`| \`${g.token}\` | ${esc(clip(g.why, 140))} | ${g.ticket ?? ''} |`);
  o.push('');
}
if (fidelity) {
  const seen = new Set();
  const rows = fidelity.filter((x) => ['role-collapsed', 'role-fixed', 'role-approximate', 'radius-capped', 'ramp-reordered'].includes(x.kind)).filter((x) => {
    const k = `${x.kind}|${x.brandWants}`;
    return seen.has(k) ? false : (seen.add(k), true);
  });
  o.push('**The app shows the brand, Figma cannot** (closed only by changing the library):', '', '| Brand wants | Figma shows | Why | Finding |', '|---|---|---|---|');
  const id = (k) => F.find((f) => f.fid?.includes(k))?.id ?? '';
  for (const x of rows) o.push(`| ${esc(x.brandWants)} | ${esc(x.shows)} | ${esc(clip(x.impact, 120))} | ${id(x.kind)} |`);
  o.push('');
}

o.push('## 6. Inputs and what is automated', '');
const given = (v) => (v ? 'given' : '**not given**');
o.push('| Input | State |', '|---|---|', `| Profile (\`${profile.target}\`) | given, ${plural(profileGaps.length, 'gap')} |`, `| Ticket table | ${tableRows.length ? `given, ${plural(ticketRows.length, 'row')}` : '**not given**'} |`, `| Readiness reports | ${reports.length ? `${reports.length} given` : '**not given**'} |`, `| Fidelity check | ${given(fidelity)} |`, `| Readiness scan | ${given(scan)} |`, '');
o.push(`Not automated: severity of Figma findings (fixed table in the script), the "for this brand" judgement of which gaps weaken the chosen directions, and the ticket's own text. Read-back tool (T-10): ${readbackBuilt ? 'built' : 'not built'}.`, '');

const md = o.join('\n');
if (opts.out) writeFileSync(opts.out, md);
else console.log(md);
console.error(JSON.stringify({ ticketRows: ticketRows.length, orphanGaps: orphanGaps.length, figmaRows: figmaRows.length, readiness: checks.length }));
