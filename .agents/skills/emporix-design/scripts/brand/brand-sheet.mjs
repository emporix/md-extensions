#!/usr/bin/env node
// Render 1-3 tokens.json files as one side-by-side brand sheet (self-contained HTML).
//
//   node brand-sheet.mjs <out.html> <a.tokens.json> [b.tokens.json] [c.tokens.json]
//
// Each column shows palettes, contrast-checked role pairs, type, shape, a generic
// shop mock-up drawn only from the tokens, decisions, and design references.
// Reference images given as relative paths are embedded so the file can be shared.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { contrastRatio, parseColor, toHex } from './color.mjs';
import { evaluateContrast } from './contrast.mjs';
import { siteDistance } from './site-distance.mjs';
import { EXT, PALETTES, STEPS, getToken, resolveValue } from './tokens.mjs';

const [out, ...inputs] = process.argv.slice(2);
if (!out || !inputs.length || inputs.length > 3) {
  console.error('usage: brand-sheet.mjs <out.html> <a.tokens.json> [b.tokens.json] [c.tokens.json]');
  process.exit(2);
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };

const DEFAULT_SAMPLE = {
  shop: 'Sample Shop',
  products: [
    { name: 'Product one', price: '€1,250.00', badge: 'In stock' },
    { name: 'Product two', price: '€980.00', badge: 'New' },
    { name: 'Product three', price: '€2,400.00', badge: 'Lead time 2 wks' },
  ],
};

function loadDirection(file) {
  const tokens = JSON.parse(readFileSync(file, 'utf8'));
  const ext = tokens.$extensions?.[EXT] ?? {};
  const v = (path) => {
    const t = getToken(tokens, path);
    return t ? resolveValue(tokens, t.$value) : undefined;
  };
  const hex = (path) => toHex(parseColor(v(path)));
  const font = (path) => getToken(tokens, path).$value.map((f) => (f.includes(' ') ? `'${f}'` : f)).join(', ');

  const embed = (rel) => {
    const abs = resolve(dirname(file), rel);
    if (!existsSync(abs)) return null;
    const mime = MIME[extname(abs).toLowerCase()] ?? 'application/octet-stream';
    return `data:${mime};base64,${readFileSync(abs).toString('base64')}`;
  };
  const references = (ext.references ?? []).map((r) => {
    if (!r.image || /^https?:/.test(r.image)) return r;
    const data = embed(r.image);
    return data ? { ...r, image: data } : { ...r, missing: true };
  });

  let source = null;
  if (ext.source?.brandFile) {
    const brandPath = resolve(dirname(file), ext.source.brandFile);
    if (existsSync(brandPath)) {
      const site = JSON.parse(readFileSync(brandPath, 'utf8'));
      source = { ...ext.source, site, distance: siteDistance(tokens, site), screenshot: site.screenshot ? embed(join(dirname(ext.source.brandFile), site.screenshot)) : null };
    } else {
      source = { ...ext.source, missing: true };
    }
  }

  return { file, tokens, ext, v, hex, font, references, source, contrast: evaluateContrast(tokens) };
}

const dirs = inputs.map(loadDirection);

function cssVars(d) {
  const vars = {
    canvas: d.hex('color.surface.canvas'),
    raised: d.hex('color.surface.raised'),
    subtle: d.hex('color.surface.subtle'),
    accent: d.hex('color.surface.accent'),
    inverse: d.hex('color.surface.inverse'),
    action: d.hex('color.surface.action'),
    'action-hover': d.hex('color.surface.action-hover'),
    'action-subtle': d.hex('color.surface.action-subtle'),
    heading: d.hex('color.text.heading'),
    body: d.hex('color.text.body'),
    muted: d.hex('color.text.muted'),
    link: d.hex('color.text.action'),
    'link-hover': d.hex('color.text.action-hover'),
    'on-action': d.hex('color.text.on-action'),
    'on-inverse': d.hex('color.text.on-inverse'),
    border: d.hex('color.border.default'),
    'border-strong': d.hex('color.border.strong'),
    focus: d.hex('color.border.focus'),
    'r-control': d.v('radius.control'),
    'r-container': d.v('radius.container'),
    'r-feature': d.v('radius.feature'),
    'f-heading': d.font('font.heading'),
    'f-body': d.font('font.body'),
    'w-heading': d.v('type.heading.weight'),
    // Tokens built before body/action weights existed fall back to the vocabulary defaults.
    'w-body': d.v('type.body.weight') ?? 400,
    'w-action': d.v('type.action.weight') ?? 700,
    'action-transform': d.v('type.action.transform'),
    'action-tracking': d.v('type.action.letterSpacing'),
  };
  return Object.entries(vars)
    .map(([k, val]) => `--${k}: ${val};`)
    .join(' ');
}

function swatchText(color) {
  const c = parseColor(color);
  return contrastRatio(c, parseColor('white')) >= contrastRatio(c, parseColor('black')) ? '#fff' : '#000';
}

function palettes(d) {
  return PALETTES.map((p) => {
    const seedStep = d.ext.seeds?.[p]?.step;
    const cells = STEPS.map((s) => {
      const val = getToken(d.tokens, `palette.${p}.${s}`).$value;
      const hex = toHex(parseColor(val));
      return `<div class="sw" style="background:${hex};color:${swatchText(val)}" title="palette.${p}.${s} ${hex} ${val}">
        <b>${s}${s === seedStep ? ' ◆' : ''}</b></div>`;
    }).join('');
    return `<div class="ramp"><div class="ramp-name">${p}</div><div class="ramp-cells">${cells}</div></div>`;
  }).join('');
}

function roles(d) {
  return d.contrast
    .map((r) => {
      const fg = d.hex(r.fg);
      const bg = d.hex(r.bg);
      const short = (p) => p.replace(/^color\./, '');
      const sample = r.min === 3 ? `<span class="ui-sample" style="background:${fg}"></span>` : 'Aa';
      return `<div class="pair ${!r.pass ? 'bad' : r.below ? 'adv' : 'ok'}">
        <div class="pair-sample" style="background:${bg};color:${fg}">${sample}</div>
        <div class="pair-meta"><b>${esc(short(r.fg))}</b> on ${esc(short(r.bg))}<br>
        ${r.ratio.toFixed(2)}:1 · ${r.advisory ? 'advisory' : 'needs'} ${r.min} · ${!r.pass ? 'AA ✗' : r.below ? 'advisory, below' : 'AA ✓'} <small>(${r.wcag})</small></div></div>`;
    })
    .join('');
}

function mock(d) {
  const sample = d.ext.sample ?? DEFAULT_SAMPLE;
  const tiles = sample.products
    .slice(0, 3)
    .map(
      (p, i) => `<div class="tile">
        <div class="tile-img" style="--i:${i}"></div>
        <span class="badge">${esc(p.badge ?? '')}</span>
        <div class="tile-name">${esc(p.name)}</div>
        <div class="tile-price">${esc(p.price)}</div>
        <a class="link" href="#" onclick="return false">View details</a>
      </div>`,
    )
    .join('');
  const first = sample.products[0] ?? DEFAULT_SAMPLE.products[0];
  return `<div class="shop">
    <div class="shop-bar"><span class="shop-name">${esc(sample.shop)}</span>
      <span class="search">Search products…</span><span class="cart">Cart (2)</span></div>
    <div class="shop-body">
      <h1 class="h1">${esc(sample.headline ?? sample.products?.[0]?.name ?? 'Our product range')}</h1>
      <p class="lead">Body text sits on the canvas colour. <a class="link" href="#" onclick="return false">Text links</a> use the action colour.</p>
      <div class="tiles">${tiles}</div>
      <div class="buybox">
        <h2 class="h2">${esc(first.name)}</h2>
        <div class="price">${esc(first.price)} <small>net, excl. VAT</small></div>
        <label class="field-label">Quantity<input class="input" value="1" aria-label="Quantity"></label>
        <div class="actions"><button class="btn primary">Add to cart</button><button class="btn secondary">Request quote</button></div>
        <div class="buttons-states"><button class="btn primary hover">Hover</button><button class="btn primary focus">Focus</button></div>
      </div>
      <div class="inverse">Footer / inverse surface · <span class="muted-inv">Imprint · Terms</span></div>
    </div>
  </div>`;
}

function decisions(d) {
  const list = d.ext.decisions ?? [];
  if (!list.length) return '<p class="empty">No decisions recorded.</p>';
  return `<ol class="decisions">${list
    .map(
      (x) => `<li><b>${esc(x.id)}${x.topic ? ` · ${esc(x.topic)}` : ''}</b> — ${esc(x.choice)}<br><span class="why">${esc(x.why)}</span>${
        x.references?.length ? `<br><small>refs: ${x.references.map((n) => `#${n + 1}`).join(', ')}</small>` : ''
      }</li>`,
    )
    .join('')}</ol>`;
}

function substitutions(d) {
  const list = d.ext.substitutions ?? [];
  if (!list.length) return '<p class="empty">None: every value is used as intended.</p>';
  return `<table class="subs"><thead><tr><th>Kind</th><th>What</th><th>Wanted</th><th>Used instead</th><th>Why</th></tr></thead><tbody>${list
    .map((s) => `<tr><td>${esc(s.kind)}</td><td>${esc(s.what)}</td><td>${esc(s.wanted)}</td><td><b>${esc(s.used)}</b></td><td>${esc(s.why)}</td></tr>`)
    .join('')}</tbody></table>`;
}

function sourceSite(d) {
  const s = d.source;
  if (!s) return '';
  if (s.missing) return `<h3>Source site</h3><p class="warn-box">${esc(s.url)} (${esc(s.use)}): site-brand.json not found at ${esc(s.brandFile)}</p>`;
  const dist = s.distance;
  const rows = dist.checks
    .map(
      (c) => `<tr class="${c.same ? 'same' : ''}"><td>${esc(c.what)}</td><td>${esc(c.site)}</td><td>${esc(c.direction)}</td><td>${c.same ? 'same' : 'different'}${
        c.detail ? ` · ${esc(c.detail)}` : ''
      }${!c.same && c.recorded ? ' · substitution recorded' : ''}</td></tr>`,
    )
    .join('') +
    dist.vectors
      .map((p) => `<tr class="${p.site === p.direction ? 'same' : 'flip'}"><td>${esc(p.what)}</td><td>first is ${esc(p.site)}</td><td>first is ${esc(p.direction)}</td><td>${p.site === p.direction ? 'vector kept (required)' : 'VECTOR REVERSED'}</td></tr>`)
      .join('');
  const label = s.use === 'inspiration' ? 'Inspiration (foreign brand: borrow patterns, not identity)' : 'Own brand (departures must be substitutions)';
  return `<h3>Source site</h3>
    <div class="source"><div><b><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.site.host)}</a></b> · ${esc(label)}<br>
    <span class="gate ${dist.verdict === 'PASS' ? 'ok' : dist.verdict === 'WARN' ? 'warn' : 'bad'}">Distance check: ${dist.verdict}</span>
    ${dist.problems.map((p) => `<div class="bad-text">${esc(p)}</div>`).join('')}</div>
    ${s.screenshot ? `<img class="source-shot" src="${s.screenshot}" alt="${esc(s.site.host)} first screen">` : ''}
    <table class="dist"><thead><tr><th>Token</th><th>Site</th><th>Direction</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function references(d) {
  if (!d.references.length) return '<p class="empty">No references. Add Mobbin or other screenshots to the direction to show them here.</p>';
  return `<div class="refs">${d.references
    .map(
      (r, i) => `<figure class="ref">${
        r.image && !r.missing ? `<img src="${esc(r.image)}" alt="${esc(r.note ?? r.source)}">` : `<div class="ref-missing">${r.missing ? 'image missing' : 'link only'}</div>`
      }<figcaption><b>#${i + 1} ${esc(r.source)}</b>${r.app ? ` · ${esc(r.app)}` : ''}<br>${esc(r.note ?? '')}${
        r.url ? `<br><a href="${esc(r.url)}" target="_blank" rel="noopener">open source</a>` : ''
      }</figcaption></figure>`,
    )
    .join('')}</div>`;
}

const fontFamilies = [
  ...new Set(
    dirs.flatMap((d) =>
      ['heading', 'body']
        .map((k) => d.ext.fontSources?.[k])
        .filter((f) => f && f.source === 'google')
        .map((f) => `family=${encodeURIComponent(f.family).replace(/%20/g, '+')}:wght@${[...f.weights].sort((a, b) => a - b).join(';')}`),
    ),
  ),
];
const fontLink = fontFamilies.length
  ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fontFamilies.join('&')}&display=swap">`
  : '';

const columns = dirs
  .map((d) => {
    const meta = d.ext.direction ?? {};
    const fails = d.contrast.filter((r) => !r.pass).length;
    const subs = (d.ext.substitutions ?? []).length;
    return `<section class="col" style="${cssVars(d)}">
      <header class="col-head">
        <div class="kicker">${esc(meta.archetype)} · ${esc(meta.id)}</div>
        <h2>${esc(meta.name)}</h2>
        <p>${esc(meta.summary)}</p>
        <div class="gate ${fails ? 'bad' : 'ok'}">${fails ? `${fails} contrast pair(s) fail WCAG AA` : 'All contrast pairs pass WCAG AA'}</div>
        <div class="gate ${subs ? 'warn' : 'ok'}">${subs ? `${subs} closest alternative(s) used — see below` : 'No substitutions'}</div>
      </header>
      <h3>Closest alternatives used (substitutions)</h3><div class="${subs ? 'warn-box' : ''}">${substitutions(d)}</div>
      <h3>In use</h3>${mock(d)}
      <h3>Palettes</h3>${palettes(d)}
      <h3>Roles &amp; contrast</h3><div class="pairs">${roles(d)}</div>
      <h3>Type</h3>
      <div class="type">
        <div class="t-h1">${esc(d.ext.sample?.headline ?? d.ext.sample?.products?.[0]?.name ?? 'Headline H1')}</div>
        <div class="t-h3">Section heading H3</div>
        <div class="t-meta">${esc(d.ext.fontSources?.heading?.family)} ${esc(d.v('type.heading.weight'))} · ${esc(d.ext.fontSources?.body?.family)}</div>
        <p class="t-body">Body copy for product descriptions and specification tables. Tabular figures: <span class="tnum">1,234.56 · 98,760.00 · 4,500.10</span></p>
      </div>
      <h3>Shape</h3>
      <div class="shapes">
        <div class="shape" style="border-radius:var(--r-control)">control<br>${esc(d.v('radius.control'))}</div>
        <div class="shape" style="border-radius:var(--r-container)">container<br>${esc(d.v('radius.container'))}</div>
        <div class="shape" style="border-radius:var(--r-feature)">feature<br>${esc(d.v('radius.feature'))}</div>
      </div>
      ${sourceSite(d)}
      <h3>Decisions</h3>${decisions(d)}
      <h3>References</h3>${references(d)}
      <footer class="src">source: ${esc(d.file)}</footer>
    </section>`;
  })
  .join('');

const brief = dirs[0].tokens.$description ?? '';
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Brand Sheet</title>
${fontLink}
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #eceef1; color: #1d2025; font: 14px/1.45 system-ui, -apple-system, Segoe UI, sans-serif; }
  .page-head { padding: 20px 16px 8px; max-width: 1800px; margin: 0 auto; }
  .page-head h1 { margin: 0 0 4px; font-size: 20px; }
  .page-head p { margin: 0; color: #4b5260; }
  .cols { display: grid; grid-template-columns: repeat(${dirs.length}, minmax(0, 1fr)); gap: 16px; padding: 16px; max-width: 1800px; margin: 0 auto; }
  @media (max-width: 900px) { .cols { grid-template-columns: 1fr; } }
  .col { background: #fff; border-radius: 10px; padding: 16px; min-width: 0; box-shadow: 0 1px 2px rgba(0,0,0,.06); }
  .col h3 { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; margin: 22px 0 8px; }
  .col-head h2 { margin: 2px 0 4px; font-size: 22px; }
  .col-head p { margin: 0 0 8px; color: #4b5260; }
  .kicker { font-size: 12px; color: #6b7280; }
  .gate { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
  .gate.ok, .pair.ok .pair-meta { color: #14632d; } .gate.ok { background: #dcf3e2; }
  .gate.bad, .pair.bad .pair-meta, .bad-text { color: #a01818; } .gate.bad { background: #fde1e1; }
  .gate.warn { color: #7a4b00; background: #fff1cc; }
  .col-head .gate { margin: 0 4px 4px 0; }
  .warn-box { background: #fff8e1; border: 1px solid #f3d27a; border-radius: 6px; padding: 8px; }
  table.subs, table.dist { width: 100%; border-collapse: collapse; font-size: 12px; }
  .subs th, .subs td, .dist th, .dist td { text-align: left; padding: 4px 6px; border-bottom: 1px solid #0000001a; vertical-align: top; }
  .dist tr.same td { background: #fff1cc; }
  .dist tr.flip td { background: #fde1e1; color: #a01818; font-weight: 600; }
  .source { display: grid; gap: 8px; font-size: 13px; }
  .source-shot { width: 100%; border: 1px solid #d6d9de; border-radius: 4px; }

  .ramp { display: grid; grid-template-columns: 64px 1fr; align-items: center; gap: 8px; margin-bottom: 6px; }
  .ramp-name { font-size: 12px; font-weight: 600; }
  .ramp-cells { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); border-radius: 6px; overflow: hidden; }
  .sw { padding: 6px 2px; font-size: 10px; text-align: center; min-height: 34px; display: flex; flex-direction: column; justify-content: center; }

  .pairs { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 6px; }
  .pair { display: flex; gap: 8px; align-items: center; border: 1px solid #e5e7eb; border-radius: 6px; padding: 4px; }
  .pair.bad { border-color: #f3a3a3; }
  .pair.adv { border-color: #f3d27a; } .pair.adv .pair-meta { color: #7a4b00; }
  .pair-sample { width: 44px; height: 36px; border-radius: 4px; display: grid; place-items: center; font-weight: 700; font-size: 16px; flex: none; border: 1px solid #0001; }
  .ui-sample { width: 22px; height: 14px; border-radius: 2px; display: block; }
  .pair-meta { font-size: 11px; line-height: 1.35; }

  .type { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; color: var(--body); background: var(--canvas); }
  .type .t-meta { color: var(--muted); }
  .t-h1 { font-family: var(--f-heading); font-weight: var(--w-heading); font-size: 34px; line-height: 1.1; color: var(--heading); }
  .t-h3 { font-family: var(--f-heading); font-weight: var(--w-heading); font-size: 22px; margin-top: 6px; color: var(--heading); }
  .t-meta { font-size: 11px; color: #6b7280; margin: 4px 0; }
  .t-body { font-family: var(--f-body); font-weight: var(--w-body); margin: 6px 0 0; }
  .tnum { font-variant-numeric: tabular-nums; }

  .shapes { display: flex; gap: 8px; }
  .shape { flex: 1; height: 64px; display: grid; place-items: center; text-align: center; font-size: 11px; background: var(--action-subtle); border: 1px solid var(--border-strong); color: var(--heading); }

  .shop { border: 1px solid #d6d9de; border-radius: 6px; overflow: hidden; background: var(--canvas); color: var(--body); font-family: var(--f-body); font-weight: var(--w-body); }
  .shop-bar { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--raised); border-bottom: 1px solid var(--border); }
  .shop-name { font-family: var(--f-heading); font-weight: var(--w-heading); color: var(--heading); font-size: 18px; flex: none; }
  .search { flex: 1; min-width: 0; padding: 6px 10px; border: 1px solid var(--border); border-radius: var(--r-control); color: var(--muted); background: var(--subtle); white-space: nowrap; overflow: hidden; }
  .cart { color: var(--link); font-weight: 600; flex: none; }
  .shop-body { padding: 14px; }
  .h1 { font-family: var(--f-heading); font-weight: var(--w-heading); color: var(--heading); font-size: 26px; line-height: 1.15; margin: 0 0 6px; }
  .h2 { font-family: var(--f-heading); font-weight: var(--w-heading); color: var(--heading); font-size: 20px; margin: 0 0 4px; }
  .lead { margin: 0 0 12px; }
  .link { color: var(--link); text-decoration: underline; text-underline-offset: 2px; }
  .link:hover { color: var(--link-hover); }
  .tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .tile { background: var(--raised); border: 1px solid var(--border); border-radius: var(--r-container); padding: 8px; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .tile-img { aspect-ratio: 4/3; border-radius: calc(var(--r-container) / 2); background: linear-gradient(135deg, var(--subtle), var(--border) calc(40% + var(--i) * 15%), var(--subtle)); }
  .tile-name { font-weight: 600; color: var(--heading); font-size: 13px; }
  .tile-price { font-variant-numeric: tabular-nums; color: var(--heading); }
  .badge { align-self: flex-start; font-size: 11px; padding: 1px 6px; border-radius: var(--r-control); background: var(--action-subtle); color: var(--link); }
  .buybox { margin-top: 14px; padding: 12px; background: var(--subtle); border-radius: var(--r-container); }
  .price { font-size: 20px; font-weight: 700; color: var(--heading); font-variant-numeric: tabular-nums; }
  .price small { font-size: 12px; font-weight: 400; color: var(--muted); }
  .field-label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--muted); margin: 8px 0; max-width: 140px; }
  .input { font: inherit; padding: 6px 8px; border: 1px solid var(--border-strong); border-radius: var(--r-control); background: var(--raised); color: var(--body); }
  .input:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
  .actions, .buttons-states { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
  .btn { font: inherit; font-weight: var(--w-action); padding: 9px 16px; border-radius: var(--r-control); cursor: pointer; text-transform: var(--action-transform); letter-spacing: var(--action-tracking); }
  .btn.primary { background: var(--action); color: var(--on-action); border: 1px solid transparent; }
  .btn.primary:hover, .btn.primary.hover { background: var(--action-hover); }
  .btn.primary.focus { outline: 2px solid var(--focus); outline-offset: 2px; }
  .btn.secondary { background: transparent; color: var(--link); border: 1px solid var(--link); }
  .btn.secondary:hover { background: var(--action-subtle); }
  .inverse { margin-top: 14px; padding: 10px 12px; background: var(--inverse); color: var(--on-inverse); border-radius: var(--r-control); font-size: 12px; }
  .muted-inv { opacity: .85; }

  .decisions { margin: 0; padding-left: 18px; }
  .decisions li { margin-bottom: 6px; }
  .why { color: #4b5260; }
  .refs { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
  .ref { margin: 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; font-size: 11px; }
  .ref img { width: 100%; display: block; }
  .ref figcaption { padding: 6px; }
  .ref-missing { padding: 24px 6px; text-align: center; color: #6b7280; background: #f3f4f6; }
  .empty { color: #6b7280; margin: 0; }
  .src { margin-top: 16px; font-size: 11px; color: #9ca3af; word-break: break-all; }
</style></head>
<body>
  <div class="page-head"><h1>Brand sheet</h1><p>${esc(brief)} · ${dirs.length} direction${dirs.length > 1 ? 's' : ''}</p></div>
  <main class="cols">${columns}</main>
</body></html>
`;

writeFileSync(out, html);
console.log(`wrote ${out}`);
