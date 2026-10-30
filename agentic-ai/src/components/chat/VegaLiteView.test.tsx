import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import '../../translations/i18n'
import { VegaLiteView } from './VegaLiteView'

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showError: () => undefined,
  }),
}))

describe('VegaLiteView', () => {
  it('renders the pending state without embedding', () => {
    const markup = renderToStaticMarkup(
      <VegaLiteView
        segment={{ kind: 'vega-lite-pending', text: '{"mark":"bar"' }}
      />
    )

    expect(markup).toContain('Drawing the chart')
    expect(markup).toContain('chat-block-pending')
    expect(markup).toContain('{&quot;mark&quot;:&quot;bar&quot;')
    expect(markup).toContain('chat-block-source')
    expect(markup).not.toContain('<svg')
  })

  it('renders a schema-bearing spec as a chart', () => {
    const markup = renderToStaticMarkup(
      <VegaLiteView
        segment={{
          kind: 'vega-lite',
          text: '{"$schema":"https://vega.github.io/schema/vega-lite/v5.json","mark":"bar"}',
          spec: {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            mark: 'bar',
            encoding: { x: { field: 'a', type: 'ordinal' } },
            data: { values: [{ a: 'A' }] },
          },
        }}
      />
    )

    expect(markup).toContain('vega-lite-frame')
    expect(markup).not.toContain('This chart cannot be shown.')
  })

  it('renders invalid fence text with the error string', () => {
    const markup = renderToStaticMarkup(
      <VegaLiteView
        segment={{ kind: 'text', text: '{nope}', error: 'invalid-json' }}
      />
    )

    expect(markup).toContain('{nope}')
    expect(markup).toContain('This chart cannot be shown.')
    expect(markup).toContain('chat-block-source')
    expect(markup).not.toContain('<svg')
  })

  it('renders a url-bearing spec as text', () => {
    const markup = renderToStaticMarkup(
      <VegaLiteView
        segment={{
          kind: 'vega-lite',
          text: '{"data":{"url":"https://example.com/rows.json"}}',
          spec: {
            mark: 'bar',
            encoding: {},
            data: { url: 'https://example.com/rows.json' },
          },
        }}
      />
    )

    expect(markup).toContain('https://example.com/rows.json')
    expect(markup).toContain('This chart cannot be shown.')
    expect(markup).not.toContain('<svg')
  })

  it('renders a resize handle for a chart', () => {
    const markup = renderToStaticMarkup(
      <VegaLiteView
        segment={{
          kind: 'vega-lite',
          text: '{"mark":"bar"}',
          spec: {
            mark: 'bar',
            encoding: { x: { field: 'a', type: 'ordinal' } },
            data: { values: [{ a: 'A' }] },
          },
        }}
      />
    )

    expect(markup).toContain('rich-frame-resize')
    expect(markup).toContain('Resize chart')
    expect(markup).toContain('vega-lite-frame')
    expect(markup).toContain('Download PNG')
    expect(markup).toContain('pi-download')
  })
})
