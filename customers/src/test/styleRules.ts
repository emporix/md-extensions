import { compileString } from 'sass'

export type StyleRule = {
  readonly selector: string
  /** Condition of the enclosing `@media` block, `null` outside one. */
  readonly media: string | null
  /** Declared properties; `!important` stays in the value. */
  readonly declarations: Readonly<Record<string, string>>
}

const isStyleRule = (rule: CSSRule): rule is CSSStyleRule =>
  'selectorText' in rule

const isMediaRule = (rule: CSSRule): rule is CSSMediaRule =>
  'media' in rule && 'cssRules' in rule

const toStyleRule = (rule: CSSStyleRule, media: string | null): StyleRule => {
  const declarations: Record<string, string> = {}
  for (const property of Array.from(rule.style)) {
    const value = rule.style.getPropertyValue(property)
    const priority = rule.style.getPropertyPriority(property)
    declarations[property] = priority ? `${value} !${priority}` : value
  }
  return { selector: rule.selectorText, media, declarations }
}

const flatten = (rules: CSSRule[], media: string | null): StyleRule[] =>
  rules.flatMap((rule) => {
    if (isMediaRule(rule)) {
      return flatten(Array.from(rule.cssRules), rule.media.mediaText)
    }
    return isStyleRule(rule) ? [toStyleRule(rule, media)] : []
  })

/**
 * Compiles the source of a SCSS module and returns its rules in source order,
 * with the class names as written (no CSS-modules hashing). jsdom does not lay
 * out a grid, so layout tests assert on the rules instead of on rendered boxes.
 */
export const compileStyleRules = (scss: string): StyleRule[] => {
  const style = document.createElement('style')
  style.textContent = compileString(scss).css
  document.head.append(style)
  const rules = flatten(Array.from(style.sheet?.cssRules ?? []), null)
  style.remove()
  return rules
}

const spanOf = (line: string) => Number(/^span (\d+)$/.exec(line)?.[1] ?? 0)

/**
 * Where an element carrying `classNames` lands in a grid row, outside any
 * `@media` block: later rules win, and the `grid-column` shorthand sets both
 * lines, as in the cascade.
 */
export const gridColumnPlacement = (
  rules: StyleRule[],
  classNames: string[]
) => {
  const selectors = classNames.map((className) => `.${className}`)
  let start = 'auto'
  let end = 'auto'
  for (const { selector, media, declarations } of rules) {
    if (media !== null || !selectors.includes(selector)) continue
    const shorthand = declarations['grid-column']
    if (shorthand !== undefined) {
      const [startLine, endLine = 'auto'] = shorthand
        .split('/')
        .map((line) => line.trim())
      start = startLine
      end = endLine
    }
    start = declarations['grid-column-start'] ?? start
    end = declarations['grid-column-end'] ?? end
  }
  return {
    startsAtFirstColumn: start === '1',
    columns: spanOf(end) || spanOf(start) || 1,
  }
}

/** Number of class selectors, the part of specificity these modules use. */
export const classCount = (selector: string) =>
  selector.match(/\.[\w-]+/g)?.length ?? 0
