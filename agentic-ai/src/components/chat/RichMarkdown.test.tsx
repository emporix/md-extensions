import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { RichMarkdown } from './RichMarkdown'

const render = (text: string) =>
  renderToStaticMarkup(<RichMarkdown text={text} />)

describe('RichMarkdown', () => {
  it('renders headings, lists, and https links', () => {
    const markup = render(
      '## Title\n\n- item\n\n[docs](https://example.com/docs)'
    )

    expect(markup).toContain('chat-markdown')
    expect(markup).toContain('<h2>Title</h2>')
    expect(markup).toContain('<li>item</li>')
    expect(markup).toContain(
      '<a href="https://example.com/docs" target="_blank" rel="noopener noreferrer">docs</a>'
    )
  })

  it('does not emit live nodes for script, image handlers, or unsafe urls', () => {
    const markup = render(
      [
        '<script>alert(1)</script>',
        '<img src="x" onerror="alert(1)">',
        '[js](javascript:alert(1))',
        '[data](data:text/html,hi)',
        '![pic](https://example.com/a.png)',
      ].join('\n\n')
    )

    expect(markup).not.toContain('<script')
    expect(markup).not.toContain('<img')
    expect(markup).not.toContain('javascript:')
    expect(markup).not.toContain('onerror')
    expect(markup).not.toContain('data:')
    expect(markup).toContain(
      '<a href="https://example.com/a.png" target="_blank" rel="noopener noreferrer">pic</a>'
    )
  })

  it('renders tables, quotes, and inline code', () => {
    const markup = render(
      [
        '> note',
        '',
        'Use `orderId`.',
        '',
        '| Name | Qty |',
        '| --- | --- |',
        '| Bolt | 2 |',
      ].join('\n')
    )

    expect(markup).toContain('<blockquote>')
    expect(markup).toContain('<code>orderId</code>')
    expect(markup).toContain('chat-markdown-table')
    expect(markup).toContain('<th>Name</th>')
    expect(markup).toContain('<td>Bolt</td>')
  })
})
