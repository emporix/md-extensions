import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import '../../translations/i18n'
import { AssistantMessageContent } from './AssistantMessageContent'

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: () => undefined,
    showError: () => undefined,
  }),
}))

const render = (text: string) =>
  renderToStaticMarkup(<AssistantMessageContent text={text} />)

describe('AssistantMessageContent', () => {
  it('keeps prose as markdown and a closed chart fence as a chart slot', () => {
    const markup = render(
      'Before\n\n```vega-lite\n{"mark":"bar","encoding":{}}\n```\n\nAfter'
    )

    expect(markup).toContain('<p>Before</p>')
    expect(markup).toContain('vega-lite-view')
    expect(markup).toContain('<p>After</p>')
    expect(markup).not.toContain('```')
  })

  it('shows a diagram slot for a closed mermaid fence', () => {
    const markup = render(
      'Kroki\n\n```mermaid\nflowchart LR\n  A-->B\n```\n\nKoniec'
    )

    expect(markup).toContain('<p>Kroki</p>')
    expect(markup).toContain('mermaid-view')
    expect(markup).toContain('Resize diagram')
    expect(markup).toContain('<p>Koniec</p>')
    expect(markup).not.toContain('flowchart')
  })

  it('renders a csv fence as a table and a note as text', () => {
    const markup = render(
      '```csv\nname,note\nA,"<script>"\n```\n\n```note Check\nLook here\n```'
    )

    expect(markup).toContain('<table>')
    expect(markup).toContain('<th')
    expect(markup).toContain('A')
    expect(markup).toContain('&lt;script&gt;')
    expect(markup).not.toContain('<script>')
    expect(markup).toContain('Check')
    expect(markup).toContain('Look here')
    expect(markup).not.toContain('```')
  })

  it('renders json keys as text and keeps an open csv fence pending', () => {
    const json = render('```json\n{"label":"<b>x</b>"}\n```')
    const pending = render('```csv\nname,amount')

    expect(json).toContain('label')
    expect(json).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(json).not.toContain('<b>')
    expect(pending).toContain('Preparing the table')
    expect(pending).not.toContain('<table>')
  })

  it('shows an invalid vega-lite fence as a chart error', () => {
    const markup = render('```vega-lite\n{nope}\n```')

    expect(markup).toContain('This chart cannot be shown.')
    expect(markup).toContain('chat-block-invalid')
    expect(markup).toContain('{nope}')
  })

  it('shows the drawing state while a vega-lite fence is still open', () => {
    const markup = render('```vega-lite\n{"mark":"bar"')

    expect(markup).toContain('Drawing the chart')
    expect(markup).not.toContain('vega-lite-view')
  })
})
