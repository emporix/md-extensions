import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import '../../translations/i18n'
import { JsonView } from './JsonView'

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: () => undefined,
    showError: () => undefined,
  }),
}))

describe('JsonView', () => {
  it('shows invalid json as text', () => {
    const markup = renderToStaticMarkup(
      <JsonView segment={{ kind: 'json', text: '{nope}' }} />
    )

    expect(markup).toContain('{nope}')
    expect(markup).toContain('This data cannot be shown.')
    expect(markup).not.toContain('chat-source-code')
  })

  it('shows the full json in a labeled code block', () => {
    const markup = renderToStaticMarkup(
      <JsonView
        segment={{
          kind: 'json',
          text: '{"status":"paid","tags":["a","b"]}',
          title: 'Order',
        }}
      />
    )

    expect(markup).toContain('chat-source-label')
    expect(markup).toContain('Order')
    expect(markup).toContain('pi-copy')
    expect(markup).not.toContain('>json<')
    expect(markup).toContain('chat-json-key')
    expect(markup).toContain('&quot;status&quot;')
    expect(markup).toContain('&quot;paid&quot;')
    expect(markup).toContain('&quot;b&quot;')
    expect(markup).not.toContain('<th')
  })
})
