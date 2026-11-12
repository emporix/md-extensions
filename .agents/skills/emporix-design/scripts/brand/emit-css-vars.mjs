#!/usr/bin/env node
// tokens.json + target profile -> per-site CSS override file (emitter: css-vars-override).
//
//   node emit-css-vars.mjs --tokens <tokens.json> --profile <target.json> --target <repo> --site <code>
//                          [--css-out <file>] [--report <report.json>] [--write] [--register]
//                          [--fonts fontsource|bunny|google]
//
// --css-out   write the CSS to this path (preview use; nothing in the target changes);
//             self-hosted font files go to <dir of file>/fonts/<site>/
// --fonts     how web fonts are served (default: profile fonts.hosting, else fontsource)
// --write     write the CSS to the profile's output file inside the target repo
// --register  with --write: add the site to the profile's registry when it is missing
//
// Deterministic and idempotent: identical inputs give identical bytes. Every target
// variable is checked against the profile's tokenSources; a mapping to a variable the
// target no longer declares is reported as drift and not emitted.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const EXT = 'com.emporix.brand';
const FONT_HOSTS = ['fontsource', 'bunny', 'google'];
const OPEN_LICENCES = ['OFL-1.1', 'Apache-2.0', 'UFL-1.0', 'MIT'];

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '');
    if (['write', 'register'].includes(key)) opts[key] = true;
    else opts[key] = argv[++i];
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
for (const req of ['tokens', 'profile', 'target', 'site']) {
  if (!opts[req]) {
    console.error(`missing --${req}\nusage: emit-css-vars.mjs --tokens <f> --profile <f> --target <repo> --site <code> [--css-out <f>] [--report <f>] [--write] [--register] [--fonts fontsource|bunny|google]`);
    process.exit(2);
  }
}

const tokensRaw = readFileSync(opts.tokens, 'utf8');
const tokens = JSON.parse(tokensRaw);
const profile = JSON.parse(readFileSync(opts.profile, 'utf8'));
const site = opts.site;
if (!/^[a-z0-9-]+$/.test(site)) {
  console.error(`invalid site code: ${site}`);
  process.exit(2);
}

// --- target vocabulary -------------------------------------------------------
const declared = new Set();
for (const src of profile.tokenSources) {
  const file = join(opts.target, src);
  if (!existsSync(file)) {
    console.error(`token source missing in target: ${src}`);
    process.exit(1);
  }
  for (const m of readFileSync(file, 'utf8').matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) declared.add(m[1]);
}

// --- token helpers -------------------------------------------------------------
const getToken = (path) => path.split('.').reduce((n, k) => n?.[k], tokens);
function* walk(node, prefix = []) {
  for (const [k, child] of Object.entries(node)) {
    if (k.startsWith('$') || !child || typeof child !== 'object') continue;
    if ('$value' in child) yield [...prefix, k].join('.');
    else yield* walk(child, [...prefix, k]);
  }
}
const aliasOf = (value) => (typeof value === 'string' ? value.match(/^\{([^}]+)\}$/)?.[1] : undefined);
function resolve(path, seen = new Set()) {
  const t = getToken(path);
  if (!t) throw new Error(`unknown token ${path}`);
  const a = aliasOf(t.$value);
  if (!a) return t.$value;
  if (seen.has(a)) throw new Error(`alias cycle at ${a}`);
  seen.add(a);
  return resolve(a, seen);
}

// --- expand the map ------------------------------------------------------------
// Each entry -> concrete pairs { from: tokenPath, to: '--var', refOnly, fontImport }.
const pairs = [];
const drift = [];
for (const entry of profile.map) {
  const targets = Array.isArray(entry.to) ? entry.to : [entry.to];
  const froms = entry.from.endsWith('.*')
    ? Object.keys(getToken(entry.from.slice(0, -2)) ?? {})
        .filter((k) => !k.startsWith('$'))
        .map((k) => ({ path: `${entry.from.slice(0, -2)}.${k}`, key: k }))
    : [{ path: entry.from, key: null }];
  for (const { path, key } of froms) {
    if (!getToken(path)) {
      drift.push({ kind: 'unknown-token', from: path, note: 'profile maps a token the brand does not define' });
      continue;
    }
    for (const t of targets) {
      const to = key === null ? t : t.replace('*', key);
      if (!declared.has(to)) {
        // Wildcard steps the target has no slot for are expected (e.g. no --color-secondary-50).
        if (key === null) drift.push({ kind: 'missing-target-var', from: path, to, note: 'target no longer declares this variable' });
        continue;
      }
      pairs.push({ from: path, to, refOnly: !!entry.refOnly, fontImport: !!entry.fontImport, approx: entry.approx });
    }
  }
}

// Token path -> first emitted/reference variable, so role values can stay var() chains.
const varFor = new Map();
for (const p of pairs) if (!varFor.has(p.from)) varFor.set(p.from, p.to);

function cssValue(path, to) {
  const own = varFor.get(path);
  if (own && own !== to) return `var(${own})`;
  const t = getToken(path);
  const a = aliasOf(t.$value);
  if (a && varFor.has(a)) return `var(${varFor.get(a)})`;
  const v = resolve(path);
  if (Array.isArray(v)) return v.map((f) => (/[\s]/.test(f) ? `'${f}'` : f)).join(', ');
  return String(v);
}

// --- emit ------------------------------------------------------------------------
const lines = [];
const emitted = [];
let lastGroup = '';
for (const p of pairs) {
  if (p.refOnly) continue;
  const group = p.from.split('.').slice(0, 2).join('.');
  if (group !== lastGroup) {
    lines.push(`${lines.length ? '\n' : ''}  /* ${group} */`);
    lastGroup = group;
  }
  lines.push(`  ${p.to}: ${cssValue(p.from, p.to)};`);
  emitted.push({ from: p.from, to: p.to });
}

const ext = tokens.$extensions?.[EXT] ?? {};
// Open-licence families (source "google") are served according to --fonts:
//   fontsource  self-hosted woff2 files next to the theme (default; visitors contact no third party)
//   bunny       @import from fonts.bunny.net (EU-hosted CDN; still a third-party request)
//   google      @import from fonts.googleapis.com (third-party request; privacy notice/consent)
const families = new Map();
for (const p of pairs.filter((x) => x.fontImport)) {
  const src = ext.fontSources?.[p.from.split('.')[1]];
  if (src?.source !== 'google') continue;
  const weights = new Set([...(families.get(src.family) ?? []), ...src.weights]);
  families.set(src.family, [...weights].sort((a, b) => a - b));
}
const fontCfg = profile.fonts ?? {};
const fontHosting = opts.fonts ?? fontCfg.hosting ?? 'fontsource';
if (!FONT_HOSTS.includes(fontHosting)) {
  console.error(`invalid --fonts ${fontHosting} (use ${FONT_HOSTS.join(' | ')})`);
  process.exit(2);
}
const fontDirRel = (fontCfg.dir ?? 'public/themes/fonts/{site}').replace('{site}', site);
const fontHref = (fontCfg.href ?? '/themes/fonts/{site}').replace('{site}', site);
const fonts = { hosting: fontHosting, families: [], files: [], thirdParty: null, dir: null, href: null };
const fontHead = [];
if (families.size && fontHosting !== 'fontsource') {
  const host = fontHosting === 'bunny' ? 'https://fonts.bunny.net' : 'https://fonts.googleapis.com';
  const query = [...families].map(([f, w]) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@${w.join(';')}`);
  fontHead.push(`@import url('${host}/css2?${query.join('&')}&display=swap');`, '');
  fonts.thirdParty = new URL(host).host;
  fonts.families = [...families].map(([family, weights]) => ({ family, weights }));
} else if (families.size) {
  // Files are downloaded once, at generation time, from the Fontsource CDN at a pinned
  // package version; the theme then only references its own copies.
  const subsets = fontCfg.subsets ?? ['latin', 'latin-ext'];
  for (const [family, weights] of families) {
    const id = family.toLowerCase().replace(/\s+/g, '-');
    const res = await fetch(`https://api.fontsource.org/v1/fonts/${id}`);
    if (!res.ok) {
      console.error(`font "${family}" not found on Fontsource (${res.status}); rerun with --fonts bunny|google or pick another font`);
      process.exit(1);
    }
    const meta = await res.json();
    fonts.families.push({ family, weights, id, version: meta.npmVersion, license: meta.license });
    for (const w of weights) {
      for (const subset of subsets.filter((s) => meta.subsets.includes(s))) {
        const url = meta.variants?.[w]?.normal?.[subset]?.url?.woff2;
        if (!url) {
          console.error(`font "${family}" has no weight ${w} (${subset}) on Fontsource`);
          process.exit(1);
        }
        const name = `${id}-${subset}-${w}-normal.woff2`;
        fonts.files.push({ name, url: url.replace('@latest/', `@${meta.npmVersion}/`) });
        fontHead.push(
          `@font-face {`,
          `  font-family: '${family}';`,
          `  font-style: normal;`,
          `  font-weight: ${w};`,
          `  font-display: swap;`,
          `  src: url('${fontHref}/${name}') format('woff2');`,
          `  unicode-range: ${meta.unicodeRange[subset]};`,
          `}`,
        );
      }
    }
  }
  fontHead.push('');
  for (const f of fonts.files) {
    const r = await fetch(f.url);
    if (!r.ok) {
      console.error(`download failed (${r.status}): ${f.url}`);
      process.exit(1);
    }
    f.bytes = Buffer.from(await r.arrayBuffer());
  }
}
const fontLicences = fonts.families.filter((f) => f.license && !OPEN_LICENCES.includes(f.license));

// Hash what is emitted, not the whole tokens file: editing sample text or decisions must not
// change the generated file (re-running with the same visual result gives a 0-line diff).
const hash = createHash('sha256').update(JSON.stringify([fontHead, lines])).digest('hex').slice(0, 12);
const dir = ext.direction ?? {};
const fontNote =
  fontHosting === 'fontsource' && fonts.files.length
    ? ` * Fonts self-hosted in ${fontHref}/ (${fonts.families.map((f) => `${f.id}@${f.version} ${f.license}`).join(', ')}).`
    : fonts.thirdParty
      ? ` * Fonts loaded from ${fonts.thirdParty} (third-party request).`
      : null;
const css = [
  '/*',
  ` * Per-site theme — \`${site}\`. Generated by emporix-design (brand-apply); do not edit by hand.`,
  ` * Brand direction: ${dir.name ?? '?'} (${dir.id ?? '?'}, ${dir.archetype ?? '?'}) · values sha256:${hash}`,
  ...(fontNote ? [fontNote] : []),
  ` * Regenerate from the brand tokens instead of editing; see .ai/designs/brand/.`,
  ' */',
  '',
  ...fontHead,
  ':root {',
  ...lines,
  '}',
  '',
].join('\n');

// --- coverage ----------------------------------------------------------------------
const mappedPaths = new Set(pairs.map((p) => p.from));
const gapPaths = new Set((profile.gaps ?? []).map((g) => g.token));
const unmapped = [...walk(tokens)].filter(
  (p) => !p.startsWith('palette.') && !mappedPaths.has(p) && !gapPaths.has(p),
);

// --- write ---------------------------------------------------------------------------
// The site's font folder is generated: it holds exactly the files the theme references.
function syncFonts(dirAbs) {
  const keep = new Set(fonts.files.map((f) => f.name));
  const changed = [];
  if (existsSync(dirAbs)) {
    for (const name of readdirSync(dirAbs)) {
      if (!keep.has(name)) {
        rmSync(join(dirAbs, name));
        changed.push(name);
      }
    }
  }
  if (keep.size) mkdirSync(dirAbs, { recursive: true });
  for (const f of fonts.files) {
    const file = join(dirAbs, f.name);
    if (existsSync(file) && readFileSync(file).equals(f.bytes)) continue;
    writeFileSync(file, f.bytes);
    changed.push(f.name);
  }
  if (existsSync(dirAbs) && !readdirSync(dirAbs).length) rmSync(dirAbs, { recursive: true });
  return changed;
}

const touched = [];
if (opts['css-out']) {
  writeFileSync(opts['css-out'], css);
  syncFonts(join(dirname(opts['css-out']), 'fonts', site));
}
let registry = null;
if (opts.write) {
  const outRel = profile.output.file.replace('{site}', site);
  const outAbs = join(opts.target, outRel);
  const before = existsSync(outAbs) ? readFileSync(outAbs, 'utf8') : null;
  if (before !== css) {
    writeFileSync(outAbs, css);
    touched.push(outRel);
  }
  for (const name of syncFonts(join(opts.target, fontDirRel))) touched.push(`${fontDirRel}/${name}`);
  const reg = profile.output.registry;
  if (reg) {
    const regAbs = join(opts.target, reg.file);
    const src = readFileSync(regAbs, 'utf8');
    const present = new RegExp(`['"]?${site}['"]?\\s*:`).test(src.slice(src.indexOf(reg.anchor)));
    registry = { file: reg.file, present };
    if (!present && opts.register) {
      const anchorLine = src.indexOf('\n', src.indexOf(reg.anchor)) + 1;
      const siteKey = /^[a-z_$][a-z0-9_$]*$/i.test(site) ? site : `'${site}'`;
      const entry = reg.entry.replaceAll('{siteKey}', siteKey).replaceAll('{site}', site);
      writeFileSync(regAbs, src.slice(0, anchorLine) + entry + '\n' + src.slice(anchorLine));
      registry.added = true;
      touched.push(reg.file);
    }
  }
}

const report = {
  site,
  direction: dir,
  tokensHash: hash,
  output: opts.write ? profile.output.file.replace('{site}', site) : opts['css-out'] ? relative(process.cwd(), opts['css-out']) : null,
  touched,
  emitted: emitted.length,
  emittedVars: emitted,
  fonts: {
    hosting: fontHosting,
    thirdParty: fonts.thirdParty,
    families: fonts.families,
    files: fonts.files.map((f) => ({ name: f.name, from: f.url, bytes: f.bytes.length })),
    dir: fonts.files.length ? fontDirRel : null,
    href: fonts.files.length ? fontHref : null,
    licenceWarnings: fontLicences.map((f) => `${f.family}: ${f.license}`),
  },
  gaps: (profile.gaps ?? []).map((g) => ({ ...g, value: getToken(g.token) ? resolve(g.token) : undefined })),
  unmapped,
  drift,
  registry,
  // Closest alternatives, reported explicitly: chosen in the brand, and forced by this app.
  substitutions: ext.substitutions ?? [],
  approximations: [
    ...new Map(
      pairs
        .filter((p) => p.approx && !p.refOnly)
        .map((p) => [p.from, { from: p.from, to: pairs.filter((q) => q.from === p.from && q.approx === p.approx).map((q) => q.to), why: p.approx }]),
    ).values(),
  ],
};
if (opts.report) writeFileSync(opts.report, JSON.stringify(report, null, 2) + '\n');

console.log(`emitted ${emitted.length} variables for site "${site}" (${dir.id ?? '?'})`);
if (opts.write) console.log(touched.length ? `changed: ${touched.join(', ')}` : 'no change (already up to date)');
if (registry && !registry.present && !registry.added) console.log(`registry: "${site}" missing in ${registry.file} — rerun with --register`);
if (families.size) {
  console.log(
    fonts.thirdParty
      ? `fonts: ${fontHosting} — visitors' browsers request ${fonts.thirdParty} (list it in the privacy notice)`
      : `fonts: self-hosted, ${fonts.files.length} files, ${Math.round(fonts.files.reduce((n, f) => n + f.bytes.length, 0) / 1024)} KB (${fonts.families.map((f) => `${f.id}@${f.version} ${f.license}`).join(', ')})`,
  );
}
for (const l of report.fonts.licenceWarnings) console.log(`font licence: ${l} is not a known open licence — check before shipping`);
for (const g of report.gaps) console.log(`gap: ${g.token}${g.value !== undefined ? ` = ${JSON.stringify(g.value)}` : ''} — ${g.why}`);
for (const u of unmapped) console.log(`unmapped: ${u}`);
for (const s of report.substitutions) console.log(`substitution (brand): ${s.what} wanted ${s.wanted} -> used ${s.used} (${s.kind}: ${s.why})`);
for (const a of report.approximations) console.log(`approximation (app): ${a.from} -> ${a.to.join(', ')} (${a.why})`);
for (const d of drift) console.log(`drift: ${d.kind} ${d.from}${d.to ? ` -> ${d.to}` : ''}`);
if (!opts.write && !opts['css-out'] && !opts.report) process.stdout.write('\n' + css);
