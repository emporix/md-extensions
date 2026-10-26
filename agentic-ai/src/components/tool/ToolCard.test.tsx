import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import '../../translations/i18n'
import ToolCard from './ToolCard'
import { Tool } from '../../types/Tool'

const tool = (type: string): Tool => ({
  id: 'tool-1',
  name: 'Customers',
  type,
  config: { entityType: 'customer' },
  enabled: true,
})

const renderCard = (type: string) =>
  renderToStaticMarkup(
    <ToolCard
      tool={tool(type)}
      onToggleActive={() => undefined}
      onConfigure={() => undefined}
      onRemove={() => undefined}
      onReindex={vi.fn()}
    />
  )

describe('ToolCard', () => {
  it('shows reindex on search and rag emporix cards', () => {
    expect(renderCard('search')).toContain('Reindex')
    expect(renderCard('rag_emporix')).toContain('Reindex')
    expect(renderCard('slack')).not.toContain('Reindex')
  })
})
