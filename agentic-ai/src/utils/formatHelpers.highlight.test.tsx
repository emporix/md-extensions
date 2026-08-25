import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { highlightTextMatches } from './formatHelpers.tsx'

describe('highlightTextMatches', () => {
  it('returns original text when query is empty', () => {
    expect(highlightTextMatches('hello world', '')).toBe('hello world')
    expect(highlightTextMatches('hello world', '   ')).toBe('hello world')
    expect(highlightTextMatches('hello world', null)).toBe('hello world')
  })

  it('highlights case-insensitive matches', () => {
    const markup = renderToStaticMarkup(
      <>{highlightTextMatches('Error: timeout ERROR again', 'error')}</>
    )
    expect(markup).toBe(
      '<mark class="log-message-highlight">Error</mark>: timeout <mark class="log-message-highlight">ERROR</mark> again'
    )
  })

  it('escapes regex metacharacters in query', () => {
    const markup = renderToStaticMarkup(
      <>{highlightTextMatches('value error. occurred', 'error.')}</>
    )
    expect(markup).toBe(
      'value <mark class="log-message-highlight">error.</mark> occurred'
    )
  })

  it('returns plain text when query does not match', () => {
    expect(highlightTextMatches('hello world', 'missing')).toBe('hello world')
  })
})
