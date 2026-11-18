/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  classCount,
  compileStyleRules,
  gridColumnPlacement,
} from '../../test/styleRules'

// Under jsdom `import.meta.url` is not a file URL; the directory is.
const rules = compileStyleRules(
  readFileSync(`${import.meta.dirname}/Address.module.scss`, 'utf8')
)

describe('customer address card layout', () => {
  it.each([2, 4, 8])('gives a %i-column field its width', (columns) => {
    expect(gridColumnPlacement(rules, [`span${columns}`])).toEqual({
      startsAtFirstColumn: false,
      columns,
    })
  })

  it('lets a cell shrink below the minimum width of a library input, whatever the stylesheet order', () => {
    const reset = rules.find(
      ({ selector, media, declarations }) =>
        media === null &&
        selector.startsWith('.grid') &&
        selector.endsWith('> *') &&
        // jsdom reads `0` back as `0px`.
        Number.parseFloat(declarations['min-width'] ?? '') === 0
    )

    // A library input root is one class with `min-width: 200px`.
    expect(classCount(reset?.selector ?? '')).toBeGreaterThan(1)
  })

  it('stacks every field in one column on a narrow screen', () => {
    const narrow = rules.filter(({ media }) =>
      media?.includes('max-width: 768px')
    )

    expect(
      narrow.find(({ selector }) => selector === '.grid')?.declarations[
        'grid-template-columns'
      ]
    ).toBe('minmax(0, 1fr)')
    expect(
      narrow.find(({ selector }) => selector === '.grid > *')?.declarations[
        'grid-column'
      ]
    ).toBe('auto !important')
  })

  it('gives the default-address toggle a box of its own, so it sits under its label', () => {
    expect(
      rules.find(({ selector }) => selector === '.control')?.declarations
        .display
    ).toBe('flex')
  })
})
