#!/usr/bin/env node
// Measure the visual brand of a live website from computed styles.
//
//   node extract-site-brand.mjs <url> --out <dir> --use own|inspiration [--pages <url,url>] [--playwright-from <dir>]
//
// Writes <dir>/site-brand.json and one screenshot per page in <dir>/refs/ (first screen, desktop).
// --pages adds more pages of the same site (e.g. a category listing); their evidence is merged
// and product tiles found on them are reported under productTile.
// Every value records the element it came from, so a person can check it.
// Playwright is loaded from --playwright-from (default: current directory, i.e. the
// app repo the skill runs in). If its bundled browser is missing, Google Chrome is used.

import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const url = args.find((a) => /^https?:\/\//.test(a));
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const out = opt('out');
const use = opt('use');
if (!url || !out || !['own', 'inspiration'].includes(use)) {
  console.error('usage: extract-site-brand.mjs <url> --out <dir> --use own|inspiration [--pages <url,url>] [--playwright-from <dir>]');
  process.exit(2);
}

let chromium;
try {
  ({ chromium } = createRequire(join(resolve(opt('playwright-from') ?? '.'), 'package.json'))('playwright'));
} catch {
  console.error('Playwright not found. Pass --playwright-from <dir with node_modules/playwright> (e.g. the app repo).');
  process.exit(2);
}

async function launch() {
  try {
    return await chromium.launch();
  } catch (err) {
    if (!/Executable doesn't exist/.test(err.message)) throw err;
    return chromium.launch({ channel: 'chrome' });
  }
}

const host = new URL(url).hostname.replace(/^www\./, '');
mkdirSync(join(out, 'refs'), { recursive: true });
const extraPages = (opt('pages') ?? '').split(',').map((u) => u.trim()).filter(Boolean);
const shotName = (u) => {
  const { pathname } = new URL(u);
  const slug = pathname.replace(/^\/|\/$/g, '').replace(/[^a-z0-9-]+/gi, '_').slice(0, 40);
  return `refs/site-${host.replace(/[^a-z0-9.-]/gi, '_')}${slug ? `-${slug}` : ''}.png`;
};

const browser = await launch();

async function measure(pageUrl) {
const shot = shotName(pageUrl);
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'de-DE' });
await page.goto(pageUrl, { waitUntil: 'load', timeout: 60_000 });
await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

// Wait for splash screens / preloaders: a fixed or absolute layer covering the viewport
// centre that holds no real content. Consent layers are excluded (they never go away).
const overlayGone = await page
  .waitForFunction(
    () => {
      const isConsent = (e) => e.closest('[id*="cookie" i],[class*="cookie" i],[id*="consent" i],[class*="consent" i],[id*="usercentrics" i],[id*="onetrust" i]');
      for (let e = document.elementFromPoint(innerWidth / 2, innerHeight / 2); e && e !== document.body; e = e.parentElement) {
        const cs = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        const covers = (cs.position === 'fixed' || cs.position === 'absolute') && r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.9;
        if (covers && !isConsent(e) && !e.querySelector('h1, h2, nav, header, main, form')) return false;
      }
      return true;
    },
    null,
    { timeout: 15_000, polling: 500 },
  )
  .then(() => true)
  .catch(() => false);

// Scroll through the page so scroll-triggered reveals and lazy sections render, then back.
await page.evaluate(async () => {
  for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 150));
  }
  window.scrollTo(0, 0);
});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);

const brand = await page.evaluate(() => {
  // Any CSS colour -> #rrggbb via a 1px canvas (handles rgb, lab, oklch, color()).
  const ctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
  const toHex = (c) => {
    if (!c || c === 'transparent') return null;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (a < 200) return null;
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  };
  const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const lum = (hex) => {
    const f = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const [r, g, b] = rgbOf(hex);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const chroma = (hex) => Math.max(...rgbOf(hex)) - Math.min(...rgbOf(hex));
  const isLight = (hex) => lum(hex) > 0.7;
  const isDark = (hex) => lum(hex) < 0.05;

  // Consent layers: known ids/classes, or a fixed layer whose text talks about cookies.
  for (const el of document.querySelectorAll('body *')) {
    if (getComputedStyle(el).position !== 'fixed') continue;
    const t = (el.innerText || '').slice(0, 600);
    if (t && t.length < 2000 && /cookie|consent|datenschutz|privacy|einwilligung/i.test(t)) el.setAttribute('data-brand-consent', '1');
  }
  // Interstitial dialogs (country chooser, newsletter) and their full-screen backdrops.
  for (const el of document.querySelectorAll('[role="dialog"],[aria-modal="true"],dialog[open]')) el.setAttribute('data-brand-consent', '1');
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (cs.position === 'fixed' && r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.9 && (el.querySelector('[data-brand-consent]') || !el.querySelector('h1, nav, header, main'))) el.setAttribute('data-brand-consent', '1');
  }
  const consent = (el) => !!el.closest('[data-brand-consent],[id*="cookie" i],[class*="cookie" i],[id*="consent" i],[class*="consent" i],[id*="usercentrics" i],[id*="onetrust" i],[aria-modal="true"]');
  // Really visible: rendered, not hidden by an ancestor's opacity/visibility, on the page.
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 4 || r.height <= 4) return false;
    if (r.right <= 0 || r.left >= innerWidth || r.bottom + scrollY <= 0) return false;
    return el.checkVisibility ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : getComputedStyle(el).visibility !== 'hidden';
  };
  const label = (el) => {
    const text = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('alt') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    const cls = typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return `${el.tagName.toLowerCase()}${cls}${text ? ` "${text}"` : ''}`;
  };
  const inFixed = (el) => {
    for (let e = el; e && e !== document.body; e = e.parentElement) if (getComputedStyle(e).position === 'fixed') return true;
    return false;
  };
  // Colour behind an element: first opaque ancestor background; 'image' when a picture is behind it.
  const behind = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== 'none' && !cs.backgroundImage.startsWith('linear-gradient')) return 'image';
      const hex = toHex(cs.backgroundColor);
      if (hex) return hex;
    }
    return toHex(getComputedStyle(document.documentElement).backgroundColor) ?? '#ffffff';
  };
  const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
  const tally = () => new Map();
  const add = (map, key, weight, sample) => {
    if (!key) return;
    const e = map.get(key) ?? { value: key, weight: 0, count: 0, sample };
    e.weight += weight;
    e.count += 1;
    map.set(key, e);
  };
  const top = (map, n = 1) => [...map.values()].sort((a, b) => b.weight - a.weight).slice(0, n);

  const all = [...document.querySelectorAll('body *')].filter((el) => !consent(el) && visible(el));

  // Area-weighted background palette.
  const bgs = tally();
  for (const el of all) {
    const r = el.getBoundingClientRect();
    add(bgs, toHex(getComputedStyle(el).backgroundColor), r.width * r.height, label(el));
  }

  // Text colours by characters, only for text on a solid light background (what a
  // reader sees as "the text colour"; text on photos or dark bands is excluded).
  const texts = tally();
  const headings = tally();
  const links = tally();
  const actions = tally();
  const actionLabels = new Map();
  const labelOf = (el) => [...el.querySelectorAll('*')].reverse().find((e) => ownText(e)) ?? el;
  const actionEls = [];
  for (const el of all) {
    const cs = getComputedStyle(el);
    const short = (el.innerText || el.value || '').trim().length <= 40;
    const own = toHex(cs.backgroundColor);
    // Action candidates: clickable elements with their own saturated fill and a short label.
    const r = el.getBoundingClientRect();
    const buttonSized = r.height >= 28 && r.height <= 72;
    const caption = (el.innerText || el.value || '').trim();
    const pager = /^[\d\s<>‹›«»…]{1,3}$/.test(caption) || r.width < 48; // pagination, steppers
    if (el.matches('a, button, input[type=submit], input[type=button], [role=button]') && own && short && buttonSized && caption && !pager) {
      // Usage decides; a saturated fill counts double, an element in a fixed layer counts less.
      add(actions, own, (inFixed(el) ? 1 : 3) * (chroma(own) > 40 ? 2 : 1), label(el));
      if (!actionLabels.has(own)) actionLabels.set(own, toHex(getComputedStyle(labelOf(el)).color));
      actionEls.push(el);
      continue;
    }
    const text = ownText(el);
    if (!text) continue;
    const bg = behind(el);
    if (bg === 'image' || !isLight(bg)) continue;
    const color = toHex(cs.color);
    if (el.closest('h1, h2, h3') || parseFloat(cs.fontSize) >= 24) add(headings, color, 1, label(el));
    else if (el.closest('a')) add(links, color, 1, label(el));
    else add(texts, color, text.length, label(el));
  }
  const action = top(actions)[0] ?? null;
  const actionEl = action ? actionEls.find((el) => toHex(getComputedStyle(el).backgroundColor) === action.value && !inFixed(el)) ?? actionEls.find((el) => toHex(getComputedStyle(el).backgroundColor) === action.value) : null;

  const headingEl = all.find((el) => el.matches('h1, h2, h3') && behind(el) !== 'image' && isLight(behind(el))) ?? all.find((el) => el.matches('h1, h2, h3'));
  const textEl = all.find((el) => el.matches('p') && ownText(el).length > 40) ?? document.body;
  const pick = (sel) => all.find((el) => el.matches(sel));
  const header = pick('header') ?? pick('[class*="header" i]');
  const footer = [...all].reverse().find((el) => el.matches('footer, [class*="footer" i]'));
  const input = pick('input[type=text], input[type=search], input[type=email], input:not([type])');
  const card = all.find((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return r.width > 150 && r.width < 500 && r.height > 150 && (cs.boxShadow !== 'none' || parseFloat(cs.borderTopWidth) > 0) && el.querySelector('img');
  });
  const logoEl =
    document.querySelector('img[alt*="logo" i], img[src*="logo" i], img[class*="logo" i], [class*="logo" i] img, [class*="logo" i] svg') ??
    document.querySelector('a[href="/"] img, a[href="/"] svg') ??
    header?.querySelector('img, svg');

  const cs = (el) => (el ? getComputedStyle(el) : null);
  const first = (f) => f?.split(',')[0].replace(/["']/g, '').trim() ?? null;
  const radiusOf = (el) => {
    if (!el) return null;
    const r = parseFloat(cs(el).borderTopLeftRadius);
    const h = el.getBoundingClientRect().height;
    return { value: cs(el).borderTopLeftRadius, shape: r >= h / 2 - 1 ? 'pill' : r > 0 ? 'rounded' : 'square', from: label(el) };
  };
  const palette = top(bgs, 8);
  const lightSurface = palette.find((p) => isLight(p.value));
  const darkBand = palette.find((p) => isDark(p.value) || lum(p.value) < 0.1);
  const fromTally = (t, extra = {}) => (t ? { hex: t.value, from: t.sample, uses: t.count, ...extra } : null);

  actionEl?.setAttribute('data-brand-action', '1');
  // Site builders colour an inner span, not the link: read the label where the text is.
  const labelEl = actionEl ? [...actionEl.querySelectorAll('*')].reverse().find((e) => ownText(e)) ?? actionEl : null;

  // Product tile (listing pages): a box with an image and a price.
  const priceRe = /(€|\$|£|CHF)\s?\d|\d[\d.,]*\s?(€|\$|£)/;
  // Walk up from every price to the nearest ancestor holding an image; the most common
  // such structure (same tag + class) is the product tile.
  const sig = (e) => `${e.tagName}.${typeof e.className === 'string' ? e.className.trim().split(/\s+/).slice(0, 3).join('.') : ''}`;
  const tiles = new Map();
  for (const el of all) {
    if (!priceRe.test(ownText(el))) continue;
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
      if (!e.querySelector('img')) continue;
      const r = e.getBoundingClientRect();
      if (r.width >= 140 && r.width <= 560) {
        const k = sig(e);
        const t = tiles.get(k) ?? { el: e, price: el, count: 0 };
        t.count++;
        tiles.set(k, t);
      }
      break;
    }
  }
  const bestTile = [...tiles.values()].sort((a, b) => b.count - a.count)[0];
  const tileEl = bestTile && bestTile.count >= 2 ? bestTile.el : null;
  const tileImg = tileEl?.querySelector('img');
  const priceEl = tileEl ? bestTile.price : null;
  // Image well: first element between image and tile that is rounded or has its own fill.
  let wellEl = null;
  for (let e = tileImg; e && e !== tileEl; e = e.parentElement) {
    const s = getComputedStyle(e);
    if (parseFloat(s.borderTopLeftRadius) > 0 || toHex(s.backgroundColor)) {
      wellEl = e;
      break;
    }
  }

  return {
    title: document.title,
    colors: {
      action: action && { hex: action.value, from: action.sample, uses: action.count, inFixedLayer: actionEl ? inFixed(actionEl) : null },
      onAction: labelEl && { hex: toHex(cs(labelEl).color), from: label(labelEl) },
      link: fromTally(top(links)[0]),
      heading: fromTally(top(headings)[0]),
      body: fromTally(top(texts)[0]),
      canvas: { hex: toHex(cs(document.body).backgroundColor) ?? toHex(cs(document.documentElement).backgroundColor) ?? '#ffffff', from: 'body' },
      lightSurface: lightSurface && { hex: lightSurface.value, from: lightSurface.sample },
      darkBand: darkBand && { hex: darkBand.value, from: darkBand.sample },
      header: header && { hex: toHex(cs(header).backgroundColor), from: label(header) },
      footer: footer && { hex: toHex(cs(footer).backgroundColor), from: label(footer) },
    },
    candidates: { actions: top(actions, 5).map((a) => ({ hex: a.value, label: actionLabels.get(a.value) ?? null, uses: a.count, weight: a.weight, from: a.sample })) },
    productTile: tileEl && {
      from: label(tileEl),
      radius: radiusOf(tileEl),
      background: toHex(cs(tileEl).backgroundColor) ?? behind(tileEl),
      border: parseFloat(cs(tileEl).borderTopWidth) > 0 ? `${cs(tileEl).borderTopWidth} ${toHex(cs(tileEl).borderTopColor)}` : 'none',
      shadow: cs(tileEl).boxShadow,
      tilesFound: bestTile.count,
      imageWell: wellEl ? { radius: cs(wellEl).borderTopLeftRadius, background: toHex(cs(wellEl).backgroundColor) ?? behind(wellEl), from: label(wellEl) } : null,
      price: priceEl && { hex: toHex(cs(priceEl).color), weight: cs(priceEl).fontWeight, size: cs(priceEl).fontSize },
    },
    palette: palette.map((e) => ({ hex: e.value, share: e.weight, from: e.sample })),
    textColors: top(texts, 5).map((e) => ({ hex: e.value, chars: e.weight, from: e.sample })),
    fonts: {
      heading: headingEl && { family: first(cs(headingEl).fontFamily), stack: cs(headingEl).fontFamily, weight: cs(headingEl).fontWeight, transform: cs(headingEl).textTransform, from: label(headingEl) },
      body: { family: first(cs(textEl).fontFamily), stack: cs(textEl).fontFamily, from: textEl === document.body ? 'body' : label(textEl) },
      loaded: [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/["']/g, '')))],
    },
    radius: {
      button: radiusOf(actionEl ?? all.find((el) => el.matches('a, button') && parseFloat(getComputedStyle(el).borderTopWidth) > 0 && (el.innerText || '').trim().length <= 40 && el.getBoundingClientRect().height >= 28)),
      input: radiusOf(input),
      card: radiusOf(card),
    },
    button: actionEl && {
      transform: cs(labelEl).textTransform,
      letterSpacing: cs(labelEl).letterSpacing,
      weight: cs(labelEl).fontWeight,
      font: first(cs(labelEl).fontFamily),
      from: label(actionEl),
    },
    logo: logoEl && { kind: logoEl.tagName.toLowerCase(), src: logoEl.getAttribute('src'), alt: logoEl.getAttribute('alt') },
  };
});
brand.overlayCleared = overlayGone;

// Hover state of the measured call to action: which way does it move (lighter/darker)?
if (brand.colors.action) {
  try {
    const target = page.locator('[data-brand-action]').first();
    // Covered by a widget or sticky layer? Force the pointer onto the element's centre.
    await target.hover({ timeout: 5_000 }).catch(() => target.hover({ timeout: 5_000, force: true }));
    await page.waitForTimeout(500); // let transitions finish
    brand.colors.actionHover = await target.evaluate((el) => {
      const ctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
      const hex = (c) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = '#000';
        ctx.fillStyle = c;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return a < 200 ? null : '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
      };
      const own = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      const lab = [...el.querySelectorAll('*')].reverse().find(own) ?? el;
      return { hex: hex(getComputedStyle(el).backgroundColor), label: hex(getComputedStyle(lab).color) };
    });
  } catch {
    brand.colors.actionHover = null; // not hoverable (covered, off-screen): hover vector unknown
  }
  await page.mouse.move(0, 0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

// Hide consent layers for the screenshot only (no consent is given; measurements above
// already ignored them).
await page.addStyleTag({
  content: '*{filter:none!important;backdrop-filter:none!important}[data-brand-consent],#usercentrics-root,#usercentrics-cmp-ui,#onetrust-consent-sdk,#CybotCookiebotDialog,[id*="cookie-banner" i],[class*="cookie-banner" i]{display:none!important}',
});
await page.screenshot({ path: join(out, shot) });
await page.close();
return { ...brand, url: pageUrl, screenshot: shot };
}

const measured = [];
for (const u of [url, ...extraPages]) {
  measured.push(await measure(u));
  console.log(`measured ${u}`);
}
await browser.close();

// Merge: the call to action with the most evidence across pages wins; its page supplies the
// action-related details. Product tiles come from the first page that has them (listings).
const home = measured[0];
const pooled = new Map();
for (const m of measured) {
  for (const a of m.candidates.actions) {
    const e = pooled.get(a.hex) ?? { hex: a.hex, label: a.label, uses: 0, weight: 0, from: a.from, page: m.url };
    e.uses += a.uses;
    e.weight += a.weight;
    pooled.set(a.hex, e);
  }
}
const ranked = [...pooled.values()].sort((a, b) => b.weight - a.weight);
const actionPage = measured.find((m) => m.colors.action?.hex === ranked[0]?.hex) ?? home;
const brand = {
  ...home,
  colors: { ...home.colors, action: actionPage.colors.action, onAction: actionPage.colors.onAction, actionHover: actionPage.colors.actionHover },
  button: actionPage.button,
  radius: { ...home.radius, button: actionPage.radius.button ?? home.radius.button, card: measured.find((m) => m.productTile)?.productTile?.radius ?? home.radius.card, imageWell: measured.find((m) => m.productTile)?.productTile?.imageWell?.radius ?? null },
  candidates: { actions: ranked.slice(0, 5).map(({ hex, label, uses, from, page }) => ({ hex, label, uses, from, page })) },
  productTile: measured.find((m) => m.productTile)?.productTile ?? null,
  pages: measured.map((m) => ({ url: m.url, screenshot: m.screenshot, action: m.colors.action?.hex ?? null, overlayCleared: m.overlayCleared, productTile: !!m.productTile })),
  overlayCleared: measured.every((m) => m.overlayCleared),
};
const shot = home.screenshot;

// Is each font family served by Google Fonts? If not, a direction must substitute it
// and record that substitution explicitly.
async function onGoogleFonts(family) {
  if (!family) return null;
  try {
    const res = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}`, {
      headers: { 'user-agent': 'Mozilla/5.0' },
    });
    return res.ok;
  } catch {
    return null; // unknown (offline): treat as needing confirmation
  }
}
for (const key of ['heading', 'body']) {
  const f = brand.fonts[key];
  if (f) f.googleFonts = await onGoogleFonts(f.family);
}
if (brand.button) brand.button.googleFonts = await onGoogleFonts(brand.button.font);

// Normalise the page-level total area to shares that sum to ~1 over the top entries.
const total = brand.palette.reduce((s, p) => s + p.share, 0) || 1;
brand.palette = brand.palette.map((p) => ({ ...p, share: Math.round((p.share / total) * 1000) / 1000 }));

const result = {
  url,
  host,
  use,
  extractedAt: new Date().toISOString().slice(0, 10),
  screenshot: shot,
  ...brand,
  notes: [
    use === 'inspiration'
      ? 'Inspiration only: borrow patterns (shape, contrast, type voice, colour temperature); never the logo, imagery, or the action colour together with the heading font.'
      : 'Own brand: action colour and fonts are fixed seeds unless the user says otherwise.',
    'Values are computed styles of the whole page at 1440x900 after scrolling through it; only really visible elements count; text colours only from text on solid light backgrounds; cookie/consent layers are ignored and hidden in the screenshot (no consent given).',
    ...(brand.overlayCleared ? [] : ['A full-screen overlay (preloader or modal) did not go away within 15 s: measurements may come from hidden content. Check the screenshot.']),
    ...(brand.colors.action?.inFixedLayer ? ['The action colour comes from a fixed layer (sticky bar or widget): confirm it is the site\'s real call to action.'] : []),
  ],
};
writeFileSync(join(out, 'site-brand.json'), JSON.stringify(result, null, 2) + '\n');

const c = result.colors;
console.log(`site: ${result.title} (${host}) · use: ${use}`);
console.log(`action ${c.action?.hex ?? '-'} on-action ${c.onAction?.hex ?? '-'} link ${c.link?.hex ?? '-'} heading ${c.heading?.hex ?? '-'} body ${c.body?.hex ?? '-'} canvas ${c.canvas.hex} light-surface ${c.lightSurface?.hex ?? '-'} dark-band ${c.darkBand?.hex ?? '-'}`);
console.log(`action hover ${c.actionHover?.hex ?? '-'} (label ${c.actionHover?.label ?? '-'})`);
console.log(`action candidates ${result.candidates.actions.map((a) => `${a.hex}/${a.label ?? '-'}×${a.uses} ${a.from}`).join(' | ') || '-'}`);
if (result.productTile) console.log(`product tile ×${result.productTile.tilesFound} radius ${result.productTile.radius?.value} (${result.productTile.radius?.shape}) bg ${result.productTile.background} border ${result.productTile.border} · image well radius ${result.productTile.imageWell?.radius ?? '-'} bg ${result.productTile.imageWell?.background ?? '-'} · price ${result.productTile.price?.hex ?? '-'} ${result.productTile.price?.weight ?? ''}`);
for (const n of result.notes.slice(2)) console.log(`note: ${n}`);
console.log(`fonts heading ${result.fonts.heading?.family ?? '-'} (${result.fonts.heading?.weight ?? '-'}) body ${result.fonts.body.family} · loaded: ${result.fonts.loaded.join(', ') || '-'}`);
console.log(`radius button ${result.radius.button?.value ?? '-'} (${result.radius.button?.shape ?? '-'}) input ${result.radius.input?.value ?? '-'} card ${result.radius.card?.value ?? '-'} · button ${result.button?.transform ?? '-'} ${result.button?.letterSpacing ?? ''}`);
console.log(`palette ${result.palette.map((p) => `${p.hex}:${p.share}`).join(' ')}`);
console.log(`wrote ${join(out, 'site-brand.json')} and ${join(out, shot)}`);
