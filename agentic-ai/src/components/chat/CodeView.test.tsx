import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import '../../translations/i18n'
import { CodeView } from './CodeView'

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: () => undefined,
    showError: () => undefined,
  }),
}))

describe('CodeView', () => {
  it('shows the source without a language label and with a copy button', () => {
    const markup = renderToStaticMarkup(
      <CodeView
        segment={{
          kind: 'code',
          language: 'java',
          text: '\nclass A {\n  String name = "<b>";\n}\n',
        }}
      />
    )

    expect(markup).not.toContain('chat-source-label')
    expect(markup).not.toContain('chat-source-toolbar')
    expect(markup).not.toContain('java')
    expect(markup).toContain('<pre class="chat-source-code">class A {')
    expect(markup).toContain('pi-copy')
    expect(markup).toContain('aria-label="Copy"')
    expect(markup).toContain('class A {')
    expect(markup).toContain('&lt;b&gt;')
    expect(markup).not.toContain('<b>')
  })
})
