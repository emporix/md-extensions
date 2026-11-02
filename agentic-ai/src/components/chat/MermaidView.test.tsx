import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import '../../translations/i18n'
import { MermaidView } from './MermaidView'

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showError: () => undefined,
  }),
}))

describe('MermaidView', () => {
  it('renders the pending state without a diagram slot', () => {
    const markup = renderToStaticMarkup(
      <MermaidView
        segment={{ kind: 'mermaid-pending', text: 'flowchart LR\n  A-->B' }}
      />
    )

    expect(markup).toContain('Drawing the diagram')
    expect(markup).not.toContain('mermaid-view')
  })

  it('keeps a javascript source as text', () => {
    const markup = renderToStaticMarkup(
      <MermaidView
        segment={{
          kind: 'mermaid',
          text: 'flowchart LR\n  click A javascript:alert(1)',
        }}
      />
    )

    expect(markup).toContain('This diagram cannot be shown.')
    expect(markup).toContain('javascript:alert(1)')
    expect(markup).not.toContain('mermaid-view')
  })

  it('shows a diagram slot when a label mentions JavaScript', () => {
    const markup = renderToStaticMarkup(
      <MermaidView
        segment={{
          kind: 'mermaid',
          text: 'flowchart LR\n  H["JavaScript: Interpreted"]',
        }}
      />
    )

    expect(markup).toContain('mermaid-view')
    expect(markup).toContain('Download PNG')
    expect(markup).toContain('pi-download')
    expect(markup).not.toContain('This diagram cannot be shown.')
  })
})
