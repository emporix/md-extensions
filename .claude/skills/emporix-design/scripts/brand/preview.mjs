#!/usr/bin/env node
// Preview a generated site theme in the running target app without writing to the repo.
//
//   node preview.mjs --target <repo> --profile <target.json> --css <theme.css> --site <code> --out <dir>
//                    [--report <emit-report.json>] [--base-url <url>] [--viewports desktop,mobile]
//                    [--routes home,plp,pdp]
//
// For every route and viewport it loads the page twice: "before" as served, and "after"
// with the site's theme stylesheet request answered by --css (Playwright route
// interception). It records screenshots, computed token values, heading fonts and the
// accessibility tree, then writes <out>/index.html (side-by-side sheet) + summary.json.
// Self-hosted theme fonts are answered from <dir of --css>/fonts/<site>/ (as emitted).
//
// Playwright is loaded from the target's node_modules. If its bundled browser is not
// downloaded, the installed Google Chrome is used instead.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i += 2) o[argv[i].replace(/^--/, '')] = argv[i + 1];
  return o;
}
const opts = parseArgs(process.argv.slice(2));
for (const req of ['target', 'profile', 'css', 'site', 'out']) {
  if (!opts[req]) {
    console.error(`missing --${req}`);
    process.exit(2);
  }
}

const profile = JSON.parse(readFileSync(opts.profile, 'utf8'));
const css = readFileSync(opts.css, 'utf8');
const emitReport = opts.report ? JSON.parse(readFileSync(opts.report, 'utf8')) : null;
const out = resolve(opts.out);
mkdirSync(out, { recursive: true });

const pv = profile.preview;
const baseUrl = (opts['base-url'] ?? pv.baseUrl).replace(/\/$/, '');
// A site the running app cannot route to (e.g. a new site code) is previewed on the
// first reachable site; its theme request never happens, so the CSS gets appended.
const hostSite = opts.site in pv.sites ? opts.site : Object.keys(pv.sites)[0];
if (hostSite !== opts.site) {
  console.log(`site "${opts.site}" is not reachable; previewing on "${hostSite}" with the CSS appended`);
}
const sitePrefix = pv.sites[hostSite];
const themeHref = pv.themeHref.replace('{site}', opts.site);
const fontHref = (profile.fonts?.href ?? '/themes/fonts/{site}').replace('{site}', opts.site);
const fontDir = join(dirname(resolve(opts.css)), 'fonts', opts.site);
const wantedRoutes = opts.routes?.split(',');
const routes = pv.routes.filter((r) => !wantedRoutes || wantedRoutes.includes(r.name));
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true },
};
const viewports = (opts.viewports ?? 'desktop,mobile').split(',');
const MAX_SHOT_HEIGHT = 2600;
const probeVars = (emitReport?.emittedVars ?? []).map((e) => e.to);

const require = createRequire(join(resolve(opts.target), 'package.json'));
const { chromium } = require('playwright');

async function launch() {
  try {
    return await chromium.launch();
  } catch (err) {
    if (!/Executable doesn't exist/.test(err.message)) throw err;
    return chromium.launch({ channel: 'chrome' });
  }
}

const browser = await launch();
const url = (path) => `${baseUrl}${sitePrefix}${path === '/' && sitePrefix ? '' : path}`;

async function open(context, path) {
  const page = await context.newPage();
  await page.goto(url(path), { waitUntil: 'load', timeout: 60_000 });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  return page;
}

async function discover(route) {
  const ctx = await browser.newContext({ viewport: VIEWPORTS.desktop });
  try {
    const page = await open(ctx, route.discover.from);
    const href = await page.locator(route.discover.selector).first().getAttribute('href', { timeout: 10_000 });
    if (!href) return null;
    const u = new URL(href, baseUrl);
    return u.pathname.startsWith(sitePrefix) && sitePrefix ? u.pathname.slice(sitePrefix.length) || '/' : u.pathname;
  } catch {
    return null;
  } finally {
    await ctx.close();
  }
}

async function capture(vpName, route, path, themed) {
  const ctx = await browser.newContext({ viewport: VIEWPORTS[vpName], ...(VIEWPORTS[vpName].isMobile ? { isMobile: true, hasTouch: true } : {}) });
  let intercepted = false;
  if (themed) {
    await ctx.route(`**${themeHref}*`, (r) => {
      intercepted = true;
      return r.fulfill({ status: 200, contentType: 'text/css', body: css });
    });
    await ctx.route(`**${fontHref}/*`, (r) => {
      const file = join(fontDir, basename(new URL(r.request().url()).pathname));
      return existsSync(file) ? r.fulfill({ status: 200, contentType: 'font/woff2', body: readFileSync(file) }) : r.fulfill({ status: 404 });
    });
  }
  const page = await open(ctx, path);
  let injected = false;
  if (themed && !intercepted) {
    // Site has no theme <link>: append the CSS last so it still wins the cascade.
    await page.addStyleTag({ content: css });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    injected = true;
  }
  const probe = await page.evaluate((vars) => {
    const root = getComputedStyle(document.documentElement);
    const h = document.querySelector('h1, h2');
    const btn = document.querySelector('button');
    return {
      vars: Object.fromEntries(vars.map((v) => [v, root.getPropertyValue(v).trim()])),
      headingFont: h ? getComputedStyle(h).fontFamily : null,
      bodyFont: getComputedStyle(document.body).fontFamily,
      buttonBg: btn ? getComputedStyle(btn).backgroundColor : null,
      loadedFonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')),
      height: document.documentElement.scrollHeight,
    };
  }, probeVars);
  const aria = await page.locator('body').ariaSnapshot().catch((e) => `ariaSnapshot failed: ${e.message}`);
  const contrast = await page.evaluate(scanTextContrast);
  const file = `${vpName}-${route.name}-${themed ? 'after' : 'before'}.png`;
  const vp = VIEWPORTS[vpName];
  await page.screenshot({
    path: join(out, file),
    fullPage: true,
    clip: { x: 0, y: 0, width: vp.width, height: Math.min(probe.height, MAX_SHOT_HEIGHT) },
  });
  await ctx.close();
  return { file, probe, aria, intercepted, injected, contrast };
}

/**
 * Runs in the page: WCAG contrast of every visible text element against its effective
 * background (first opaque ancestor background; elements over images are skipped).
 * Returns failing elements keyed by DOM path + text so before/after can be compared.
 */
function scanTextContrast() {
  const ctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
  const rgba = (c) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data];
  };
  const lum = ([r, g, b]) => {
    const f = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const path = (el) => {
    const parts = [];
    for (let e = el; e && e !== document.body && parts.length < 4; e = e.parentElement) parts.unshift(e.tagName.toLowerCase() + ([...(e.parentElement?.children ?? [])].indexOf(e) > 0 ? `:${[...e.parentElement.children].indexOf(e)}` : ''));
    return parts.join('>');
  };
  const failures = [];
  let checked = 0;
  for (const el of document.querySelectorAll('body *')) {
    const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    if (!text) continue;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || cs.visibility === 'hidden' || Number(cs.opacity) < 0.1) continue;
    let bg = null;
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.backgroundImage !== 'none') break;
      const c = rgba(s.backgroundColor);
      if (c[3] > 200) {
        bg = c;
        break;
      }
    }
    if (!bg) continue; // over an image, or nothing opaque behind it
    const fg = rgba(cs.color);
    const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
    const ratio = (hi + 0.05) / (lo + 0.05);
    const size = parseFloat(cs.fontSize);
    const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
    const min = large ? 3 : 4.5;
    checked++;
    if (ratio < min) failures.push({ key: `${path(el)}|${text.slice(0, 40)}`, text: text.slice(0, 40), ratio: Math.round(ratio * 100) / 100, min, color: cs.color, background: `rgb(${bg.slice(0, 3).join(' ')})` });
  }
  return { checked, failures };
}

function ariaDiff(a, b) {
  const al = a.split('\n');
  const bl = b.split('\n');
  const setB = new Set(bl);
  const setA = new Set(al);
  return { removed: al.filter((l) => !setB.has(l)), added: bl.filter((l) => !setA.has(l)) };
}

const results = [];
for (const route of routes) {
  const path = route.path ?? (await discover(route));
  if (!path) {
    results.push({ route: route.name, skipped: `could not discover a URL via ${route.discover?.selector}` });
    continue;
  }
  for (const vp of viewports) {
    process.stdout.write(`${vp} ${route.name} ${path} … `);
    const before = await capture(vp, route, path, false);
    const after = await capture(vp, route, path, true);
    let diff = ariaDiff(before.aria, after.aria);
    let ariaStatus = !diff.removed.length && !diff.added.length ? 'identical' : 'different';
    if (ariaStatus === 'different') {
      // Rule out live data (prices, currency, recommendations): load "before" once more.
      const again = await capture(vp, route, path, false);
      const baseline = ariaDiff(before.aria, again.aria);
      const vsAfter = ariaDiff(again.aria, after.aria);
      if (!vsAfter.removed.length && !vsAfter.added.length) ariaStatus = 'identical (after reload)';
      else if (baseline.removed.length || baseline.added.length) ariaStatus = 'unstable content (differs between two unthemed loads)';
      diff = ariaStatus === 'different' ? vsAfter : diff;
    }
    const changedVars = probeVars.filter((v) => before.probe.vars[v] !== after.probe.vars[v]);
    const unchangedVars = probeVars.filter((v) => before.probe.vars[v] === after.probe.vars[v]);
    const failedBefore = new Set(before.contrast.failures.map((f) => f.key));
    const regressions = after.contrast.failures.filter((f) => !failedBefore.has(f.key));
    const failedAfter = new Set(after.contrast.failures.map((f) => f.key));
    const fixed = before.contrast.failures.filter((f) => !failedAfter.has(f.key)).length;
    results.push({
      route: route.name,
      path,
      viewport: vp,
      before: { file: before.file, ...before.probe, vars: undefined },
      after: { file: after.file, ...after.probe, vars: undefined },
      themeApplied: after.intercepted ? 'intercepted' : after.injected ? 'injected' : 'none',
      changedVars: changedVars.length,
      unchangedVars,
      ariaEqual: ariaStatus.startsWith('identical'),
      ariaStatus,
      ariaDiff: diff,
      contrast: { checked: after.contrast.checked, failingBefore: before.contrast.failures.length, failingAfter: after.contrast.failures.length, fixed, regressions },
    });
    console.log(
      `theme ${results.at(-1).themeApplied}, ${changedVars.length}/${probeVars.length} vars changed, a11y tree ${results.at(-1).ariaStatus === 'identical' ? 'equal' : results.at(-1).ariaStatus === 'different' ? 'DIFFERENT' : results.at(-1).ariaStatus}, contrast regressions ${regressions.length}`,
    );
    for (const f of regressions.slice(0, 5)) console.log(`  contrast regression: "${f.text}" ${f.ratio}:1 < ${f.min} (${f.color} on ${f.background})`);
  }
}
await browser.close();

const summary = { site: opts.site, baseUrl, direction: emitReport?.direction ?? null, results, gaps: emitReport?.gaps ?? [], substitutions: emitReport?.substitutions ?? [], approximations: emitReport?.approximations ?? [], unmapped: emitReport?.unmapped ?? [], drift: emitReport?.drift ?? [] };
writeFileSync(join(out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');

// --- side-by-side sheet ---------------------------------------------------------
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const firstFont = (f) => (f ?? '').split(',')[0].replace(/['"]/g, '').trim();
const rows = results
  .map((r) =>
    r.skipped
      ? `<section class="row"><h2>${esc(r.route)}</h2><p class="warn">Skipped: ${esc(r.skipped)}</p></section>`
      : `<section class="row">
    <h2>${esc(r.route)} · ${esc(r.viewport)} <small>${esc(r.path)}</small></h2>
    <ul class="facts">
      <li>theme ${esc(r.themeApplied)}</li>
      <li>${r.changedVars} variables changed${r.unchangedVars.length ? ` · ${r.unchangedVars.length} unchanged` : ''}</li>
      <li>heading font: ${esc(firstFont(r.before.headingFont))} → <b>${esc(firstFont(r.after.headingFont))}</b></li>
      <li>body font: ${esc(firstFont(r.before.bodyFont))} → <b>${esc(firstFont(r.after.bodyFont))}</b></li>
      <li class="${r.ariaEqual ? 'ok' : r.ariaStatus === 'different' ? 'bad' : ''}">accessibility tree ${r.ariaEqual ? esc(r.ariaStatus) : r.ariaStatus === 'different' ? `differs because of the theme (+${r.ariaDiff.added.length} / −${r.ariaDiff.removed.length} lines)` : esc(r.ariaStatus)}</li>
    </ul>
    <ul class="facts"><li class="${r.contrast.regressions.length ? 'bad' : 'ok'}">text contrast: ${r.contrast.regressions.length} new failure(s) caused by the brand</li>
      <li>${r.contrast.failingBefore} failing before → ${r.contrast.failingAfter} after (${r.contrast.fixed} fixed) · ${r.contrast.checked} text elements checked</li></ul>
    ${r.contrast.regressions.length ? `<table class="regr"><tr><th>Text</th><th>Ratio</th><th>Needs</th><th>Colour on background</th></tr>${r.contrast.regressions
      .map((f) => `<tr><td>${esc(f.text)}</td><td>${f.ratio}:1</td><td>${f.min}:1</td><td>${esc(f.color)} on ${esc(f.background)}</td></tr>`)
      .join('')}</table>` : ''}
    ${r.ariaEqual ? '' : `<details><summary>accessibility tree differences</summary><pre>${esc([...r.ariaDiff.removed.map((l) => '- ' + l), ...r.ariaDiff.added.map((l) => '+ ' + l)].slice(0, 80).join('\n'))}</pre></details>`}
    <div class="pair ${r.viewport}"><figure><figcaption>Before</figcaption><img src="${r.before.file}" loading="lazy"></figure>
    <figure><figcaption>After</figcaption><img src="${r.after.file}" loading="lazy"></figure></div>
  </section>`,
  )
  .join('');

const list = (items, render) => (items.length ? `<ul>${items.map(render).join('')}</ul>` : '<p class="muted">none</p>');
const dir = summary.direction ?? {};
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Brand Preview</title><style>
  :root { color-scheme: light; } * { box-sizing: border-box; }
  body { margin: 0; background: #eceef1; color: #1d2025; font: 14px/1.45 system-ui, -apple-system, Segoe UI, sans-serif; }
  header, .row, .meta { max-width: 1800px; margin: 0 auto; padding: 12px 16px; }
  h1 { font-size: 20px; margin: 8px 0 2px; } h2 { font-size: 16px; margin: 0 0 6px; } h2 small { color: #6b7280; font-weight: 400; }
  .row { background: #fff; border-radius: 10px; margin-top: 16px; }
  .facts { display: flex; flex-wrap: wrap; gap: 4px 16px; padding: 0; margin: 0 0 10px; list-style: none; font-size: 13px; color: #374151; }
  .ok { color: #14632d; } .bad, .warn { color: #a01818; } .muted { color: #6b7280; margin: 0; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
  .pair.mobile { grid-template-columns: repeat(2, minmax(0, 390px)); }
  figure { margin: 0; } figcaption { font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 4px; }
  img { width: 100%; display: block; border: 1px solid #d6d9de; border-radius: 4px; }
  pre { font-size: 11px; background: #f6f7f9; padding: 8px; overflow: auto; max-height: 300px; }
  .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
  .meta section { background: #fff; border-radius: 10px; padding: 12px; } .meta h3 { margin: 0 0 6px; font-size: 13px; }
  .meta ul { margin: 0; padding-left: 18px; font-size: 13px; }
  .meta section.flag { background: #fff8e1; border: 1px solid #f3d27a; }
  table.regr { border-collapse: collapse; font-size: 12px; margin: 0 0 10px; background: #fde1e1; }
  .regr th, .regr td { text-align: left; padding: 3px 8px; border-bottom: 1px solid #0000001a; }
  @media (max-width: 800px) { .pair, .pair.mobile { grid-template-columns: 1fr; } }
</style></head><body>
<header><h1>Brand preview — ${esc(dir.name ?? '')} on site “${esc(opts.site)}”</h1>
<p class="muted">${esc(baseUrl)} · nothing written to the repository; the theme stylesheet was swapped in the browser only.</p></header>
<div class="meta">
  <section class="${summary.substitutions.length ? 'flag' : ''}"><h3>Closest alternatives in the brand (${summary.substitutions.length})</h3>${list(summary.substitutions, (x) => `<li><b>${esc(x.what)}</b>: wanted ${esc(x.wanted)} → used <b>${esc(x.used)}</b> <i>(${esc(x.kind)}: ${esc(x.why)})</i></li>`)}</section>
  <section class="${summary.approximations.length ? 'flag' : ''}"><h3>Approximate mappings in this app (${summary.approximations.length})</h3>${list(summary.approximations, (a) => `<li><b>${esc(a.from)}</b> → ${esc(a.to.join(', '))} <i>(${esc(a.why)})</i></li>`)}</section>
  <section><h3>Not expressible in this app (gaps)</h3>${list(summary.gaps, (g) => `<li><b>${esc(g.token)}</b> = ${esc(JSON.stringify(g.value))} — ${esc(g.why)} <i>${esc(g.where)}</i></li>`)}</section>
  <section><h3>Brand tokens with no mapping</h3>${list(summary.unmapped, (u) => `<li>${esc(u)}</li>`)}</section>
  <section><h3>Profile drift</h3>${list(summary.drift, (d) => `<li>${esc(d.kind)}: ${esc(d.from)} ${d.to ? '→ ' + esc(d.to) : ''}</li>`)}</section>
</div>
${rows}
</body></html>
`;
writeFileSync(join(out, 'index.html'), html);
console.log(`wrote ${join(out, 'index.html')}`);
