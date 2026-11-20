/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ChangelogEntry } from '@emporix/api-calls/next'
import type { EntityChangelogLinks } from '../EntityChangelog'
import {
  changelogItem,
  TEST_LABELS,
  TEST_LINKS,
} from '../test/changelogTestKit'
import ChangelogCard from './ChangelogCard'

const RELATED_GROUP = [
  { entity: 'company', entityId: 'c1' },
  { entity: 'group', entityId: 'g1' },
]

const mount = (
  item: ChangelogEntry,
  entityLinks: EntityChangelogLinks | undefined
) =>
  render(
    <ChangelogCard
      item={item}
      currentEntity="company"
      currentEntityId="c1"
      labels={TEST_LABELS}
      locale="en"
      entityLinks={entityLinks}
    />
  )

const groupAssignment = (fields: Partial<ChangelogEntry> = {}) =>
  changelogItem('c1', {
    entity: 'group-assignment',
    related: RELATED_GROUP,
    ...fields,
  })

const CHANGED_NAME = { name: { before: 'Old', after: 'New' } }

describe('ChangelogCard', () => {
  afterEach(cleanup)

  it('shows a plain badge when the related entity has no path', () => {
    const render = vi.fn(TEST_LINKS.render)
    const { container } = mount(groupAssignment(), {
      pathOf: () => undefined,
      render,
    })

    expect(screen.getByText('GROUP ASSIGNMENT - GROUP')).toBeTruthy()
    expect(render).not.toHaveBeenCalled()
    expect(container.querySelector('a')).toBeNull()
  })

  it('shows a plain badge when no links are given', () => {
    const { container } = mount(groupAssignment(), undefined)

    expect(screen.getByText('GROUP ASSIGNMENT - GROUP')).toBeTruthy()
    expect(container.querySelector('a')).toBeNull()
  })

  it('renders the badge through the link renderer when the related entity has a path', () => {
    const pathOf = vi.fn(TEST_LINKS.pathOf)
    const render = vi.fn(TEST_LINKS.render)
    const { container } = mount(groupAssignment(), { pathOf, render })

    expect(pathOf).toHaveBeenCalledWith('group', 'g1')
    expect(render).toHaveBeenCalledTimes(1)
    expect(render).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/groups/g1',
        className: expect.any(String),
        title: 'Group assignment - Group',
      })
    )
    const link = container.querySelector('a')
    expect(link?.getAttribute('href')).toBe('/groups/g1')
    expect(link?.textContent).toBe('GROUP ASSIGNMENT - GROUP')
  })

  it('links nothing when the only related item is the entity itself', () => {
    const render = vi.fn(TEST_LINKS.render)
    mount(changelogItem('c1', { related: [RELATED_GROUP[0]] }), {
      pathOf: () => '/x',
      render,
    })

    expect(render).not.toHaveBeenCalled()
  })

  it.each(['create', 'update'] as const)(
    'shows the changed fields of a %s',
    (type) => {
      mount(changelogItem('c1', { type, paths: CHANGED_NAME }), TEST_LINKS)

      expect(screen.getByText('Field')).toBeTruthy()
      expect(screen.getByText('Previous Value')).toBeTruthy()
      expect(screen.getByText('Updated Value')).toBeTruthy()
      expect(screen.getByText('Old')).toBeTruthy()
      expect(screen.getByText('New')).toBeTruthy()
    }
  )

  it('shows no table for a delete, or when no field holds a value', () => {
    mount(
      changelogItem('c1', { type: 'delete', paths: CHANGED_NAME }),
      TEST_LINKS
    )
    expect(screen.queryByText('Field')).toBeNull()
    cleanup()

    mount(
      changelogItem('c1', { paths: { empty: { before: '', after: [] } } }),
      TEST_LINKS
    )
    expect(screen.queryByText('Field')).toBeNull()
  })

  it('labels the change type, and shows a type it does not know as it came', () => {
    mount(changelogItem('c1', { type: 'delete' }), TEST_LINKS)
    expect(screen.getByText('DELETED')).toBeTruthy()
    cleanup()

    // The API can send a type this version does not know
    const unknown: ChangelogEntry = JSON.parse(
      '{"at":"2026-11-18T10:00:00.000Z","type":"archive","entity":"company","entityId":"c1"}'
    )
    mount(unknown, TEST_LINKS)
    expect(screen.getByText('ARCHIVE')).toBeTruthy()
    cleanup()

    // A type named like an Object.prototype member is still unknown
    const inherited: ChangelogEntry = JSON.parse(
      '{"at":"2026-11-18T10:00:00.000Z","type":"constructor","entity":"company","entityId":"c1"}'
    )
    mount(inherited, TEST_LINKS)
    expect(screen.getByText('CONSTRUCTOR')).toBeTruthy()
  })
})
