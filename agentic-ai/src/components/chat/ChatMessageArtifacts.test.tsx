import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import '../../translations/i18n'
import ChatMessageArtifacts, { PdfPreviewFrame } from './ChatMessageArtifacts'
import type { AppState } from '../../types/common'
import type { ChatArtifact } from '../../utils/chatArtifacts'

const appState: AppState = {
  tenant: 'tenant-a',
  language: 'en',
  token: 'token',
  contentLanguage: 'en',
}

const renderArtifacts = (artifacts: readonly ChatArtifact[]) =>
  renderToStaticMarkup(
    <ChatMessageArtifacts appState={appState} artifacts={artifacts} />
  )

describe('ChatMessageArtifacts', () => {
  it('shows a pending image without a download control', () => {
    const markup = renderArtifacts([
      {
        generationId: 'ig_forest',
        kind: 'image',
        filename: 'image.png',
        mimeType: 'image/png',
        size: 0,
        status: 'pending',
      },
    ])

    expect(markup).toContain('Generating image')
    expect(markup).toContain('agent-chat-activity')
    expect(markup).toContain('pi-spinner')
    expect(markup).not.toContain('agent-chat-artifact-pending')
    expect(markup).not.toContain('pi-download')
    expect(markup).not.toContain('>Download<')
  })

  it('keeps a file collapsed and uses the shared download icon', () => {
    const markup = renderArtifacts([
      {
        artifactId: 'asset-pdf',
        kind: 'file',
        filename: 'ExternalFilesHandler.pdf',
        mimeType: 'application/pdf',
        size: 24 * 1024,
        status: 'ready',
      },
    ])

    expect(markup).toContain('ExternalFilesHandler.pdf')
    expect(markup).toContain('pi-download')
    expect(markup).toContain('aria-expanded="false"')
    expect(markup).not.toContain('>Download<')
    expect(markup).not.toContain('<iframe')
    expect(markup).not.toContain('<pre')
  })

  it('renders the PDF viewer without a sandbox', () => {
    const markup = renderToStaticMarkup(
      <PdfPreviewFrame title="notes.pdf" src="blob:pdf" />
    )

    expect(markup).toContain('src="blob:pdf"')
    expect(markup).toContain('referrerPolicy="no-referrer"')
    expect(markup).not.toContain('sandbox')
  })
})
