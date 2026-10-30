const DROPPED_TAGS = new Set([
  'script',
  'foreignobject',
  'iframe',
  'object',
  'embed',
  'image',
])

const NODE_LABEL =
  /[A-Za-z0-9_-]+\s*(?:\[[\s\S]*?\]|\([\s\S]*?\)|\{[\s\S]*?\})/g

const sourceOutsideNodeLabels = (source: string): string =>
  source.replace(NODE_LABEL, ' ')

export const isBlockedMermaidSource = (source: string): boolean => {
  const normalized = source.toLowerCase()
  if (normalized.includes('<script')) {
    return true
  }
  const outsideLabels = sourceOutsideNodeLabels(normalized)
  return (
    outsideLabels.includes('javascript:') || outsideLabels.includes('vbscript:')
  )
}

const PLAIN_RECT_LABEL = /([A-Za-z0-9_-]+)\[([^\]["\n]+)\]/g
const SAFE_RECT_TEXT = /^[A-Za-z0-9 _.-]*$/

const isDecoratedShape = (label: string): boolean =>
  (label.startsWith('/') && label.endsWith('/')) ||
  (label.startsWith('\\') && label.endsWith('\\')) ||
  (label.startsWith('(') && label.endsWith(')')) ||
  label.startsWith('>')

export const prepareMermaidSource = (source: string): string =>
  source.replace(PLAIN_RECT_LABEL, (match, id: string, label: string) => {
    if (SAFE_RECT_TEXT.test(label) || isDecoratedShape(label)) {
      return match
    }
    return `${id}["${label.replace(/"/g, '#quot;')}"]`
  })

export const isDroppedSvgTag = (tagName: string): boolean =>
  DROPPED_TAGS.has(tagName.toLowerCase())

const isInternalSvgRef = (value: string): boolean => {
  const normalized = value.trim().toLowerCase()
  return normalized.startsWith('#') && !normalized.includes('javascript:')
}

export const isUnsafeSvgAttribute = (name: string, value: string): boolean => {
  const normalized = name.toLowerCase()
  if (normalized.startsWith('on')) {
    return true
  }
  if (
    normalized === 'href' ||
    normalized === 'xlink:href' ||
    normalized.endsWith(':href')
  ) {
    return !isInternalSvgRef(value)
  }
  if (normalized === 'style' && isUnsafeSvgStyle(value)) {
    return true
  }
  return false
}

const CSS_COMMENT = /\/\*[\s\S]*?(?:\*\/|$)/g
const CSS_ESCAPE =
  /\\(?:\r\n|[\n\r\f]|[0-9a-fA-F]{1,6}[ \t\n\r\f]?|[^\n\r\f0-9a-fA-F])/g
const UNSAFE_CSS =
  /@import\b|expression\s*\(|javascript\s*:|vbscript\s*:|-moz-binding\b|behavior\s*:/i
const CSS_URL = /(?:^|[^a-z])url\s*\(/gi

const decodeCssEscape = (token: string): string => {
  if (
    token === '\\\r\n' ||
    token === '\\\n' ||
    token === '\\\r' ||
    token === '\\\f'
  ) {
    return ''
  }
  const payload = token.slice(1)
  if (!/^[0-9a-fA-F]/i.test(payload)) {
    return payload
  }
  const codePoint = Number.parseInt(payload.trim(), 16)
  if (!Number.isFinite(codePoint) || codePoint > 0x10ffff) {
    return ''
  }
  return String.fromCodePoint(codePoint)
}

const normalizeCss = (css: string): string =>
  css
    .replace(CSS_COMMENT, '')
    .replace(CSS_ESCAPE, decodeCssEscape)
    .toLowerCase()

const readCssUrlValue = (css: string, openParen: number): string => {
  let cursor = openParen + 1
  while (cursor < css.length && /\s/.test(css[cursor] ?? '')) {
    cursor += 1
  }
  const quote = css[cursor]
  if (quote === '"' || quote === "'") {
    const end = css.indexOf(quote, cursor + 1)
    return css.slice(cursor + 1, end === -1 ? css.length : end)
  }
  const end = css.indexOf(')', cursor)
  return css.slice(cursor, end === -1 ? css.length : end)
}

const isInternalCssUrl = (value: string): boolean =>
  /^#[^\s"'()\\/:]+$/.test(value.trim())

const hasExternalCssUrl = (css: string): boolean => {
  CSS_URL.lastIndex = 0
  let match = CSS_URL.exec(css)
  while (match) {
    const openParen = match.index + match[0].length - 1
    if (!isInternalCssUrl(readCssUrlValue(css, openParen))) {
      return true
    }
    match = CSS_URL.exec(css)
  }
  return false
}

export const isUnsafeSvgStyle = (css: string): boolean => {
  const normalized = normalizeCss(css)
  return UNSAFE_CSS.test(normalized) || hasExternalCssUrl(normalized)
}

const stripAttributes = (node: Element): void => {
  ;[...node.attributes].forEach((attribute) => {
    if (isUnsafeSvgAttribute(attribute.name, attribute.value)) {
      node.removeAttribute(attribute.name)
    }
  })
}

export const sanitizeMermaidSvg = (markup: string): Element | undefined => {
  if (typeof DOMParser === 'undefined') {
    return undefined
  }
  const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml')
  const svg = parsed.documentElement
  if (
    svg.tagName.toLowerCase() !== 'svg' ||
    parsed.querySelector('parsererror')
  ) {
    return undefined
  }
  stripAttributes(svg)
  ;[...svg.querySelectorAll('*')].forEach((node) => {
    if (isDroppedSvgTag(node.tagName)) {
      node.remove()
      return
    }
    if (
      node.tagName.toLowerCase() === 'style' &&
      isUnsafeSvgStyle(node.textContent ?? '')
    ) {
      node.remove()
      return
    }
    stripAttributes(node)
  })
  return svg
}
