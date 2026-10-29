import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import '../../translations/i18n'
import { SearchToolSection } from './SearchToolSection'

describe('SearchToolSection', () => {
  it('associates labels with the shared entity and max-results controls', () => {
    const markup = renderToStaticMarkup(
      <SearchToolSection
        config={{ entityType: 'customer', maxResults: 5 }}
        onConfigChange={() => undefined}
      />
    )

    expect(markup).toContain('for="search-entity-type"')
    expect(markup).toContain('id="search-entity-type"')
    expect(markup).toContain('for="search-max-results"')
    expect(markup).toContain('id="search-max-results"')
    expect(markup).toContain('type="number"')
    expect(markup).toContain('min="1"')
    expect(markup).toContain('max="10"')
    expect(markup).toContain('Entity Type')
    expect(markup).toContain('Max Results')
    expect(markup).not.toContain('p-inputnumber')
    expect(markup).not.toContain('p-dropdown')
  })
})
