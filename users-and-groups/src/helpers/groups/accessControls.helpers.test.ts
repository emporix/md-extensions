import { describe, it, expect, vi } from 'vitest'
import { AccessControl } from '../../models/Permissions.model'
import type { Metadata } from '../../models/Metadata.model'
import type { AccessControlsTemplate } from '../../configs/accessControlsTemplates'

vi.mock('../../../../configs/accessControls', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../../configs/accessControls')>()
  return {
    ...actual,
    EMPLOYEE_DOMAINS: [
      { id: 'Products Viewer', accessControls: ['ac:products-viewer'] },
      { id: 'Products Manager', accessControls: ['ac:products-manager'] },
      { id: 'Orders Viewer', accessControls: ['ac:orders-viewer'] },
      { id: 'Orders Manager', accessControls: ['ac:orders-manager'] },
    ],
    EMPLOYEE_ADMIN_DOMAINS: [
      { id: 'Webhooks Viewer', accessControls: ['adm:webhooks-viewer'] },
      { id: 'Webhooks Manager', accessControls: ['adm:webhooks-manager'] },
      { id: 'Extensions Manager', accessControls: ['adm:extensions-manager'] },
    ],
    OE_DOMAINS: [
      { id: 'Forms Viewer', accessControls: ['oe:forms-viewer'] },
      { id: 'Forms Editor', accessControls: ['oe:forms-editor'] },
      { id: 'Forms Manager', accessControls: ['oe:forms-manager'] },
      { id: 'Forms Administrator', accessControls: ['oe:forms-admin'] },
    ],
  }
})

import {
  getDcpAdministratorAccessControls,
  getEditorAccessControls,
  getManagerAccessControls,
  getOeAdministratorAccessControls,
  getViewerAccessControls,
  mapAccessControlsToTemplates,
} from './accessControls.helpers'

const makeAc = (id: string): AccessControl => ({
  id,
  name: { en: id },
  description: {},
  scopes: [],
  domains: [],
  metadata: {} as Metadata,
  restrictionAware: false,
  predefined: true,
})

const ALL_ACS: AccessControl[] = [
  makeAc('ac:products-viewer'),
  makeAc('ac:products-manager'),
  makeAc('ac:orders-viewer'),
  makeAc('ac:orders-manager'),
  makeAc('adm:webhooks-viewer'),
  makeAc('adm:webhooks-manager'),
  makeAc('adm:extensions-manager'),
  makeAc('oe:forms-viewer'),
  makeAc('oe:forms-editor'),
  makeAc('oe:forms-manager'),
  makeAc('oe:forms-admin'),
  makeAc('ac:custom-1'),
  makeAc('ac:custom-2'),
]

const ids = (acs: AccessControl[]) => acs.map((a) => a.id).sort()

describe('getViewerAccessControls', () => {
  it('returns ACs from employee + OE domains whose id includes "Viewer"', () => {
    expect(ids(getViewerAccessControls(ALL_ACS))).toEqual([
      'ac:orders-viewer',
      'ac:products-viewer',
      'adm:webhooks-viewer',
      'oe:forms-viewer',
    ])
  })

  it('does not include unrelated admin-domain ACs', () => {
    const result = ids(getViewerAccessControls(ALL_ACS))
    expect(result).not.toContain('adm:extensions-manager')
  })

  it('returns [] for empty input', () => {
    expect(getViewerAccessControls([])).toEqual([])
  })

  it('ignores ACs not in any viewer domain', () => {
    const result = ids(getViewerAccessControls(ALL_ACS))
    expect(result).not.toContain('ac:custom-1')
    expect(result).not.toContain('ac:products-manager')
  })
})

describe('getEditorAccessControls', () => {
  it('returns ACs from domains whose id includes "Editor"', () => {
    expect(ids(getEditorAccessControls(ALL_ACS))).toEqual(['oe:forms-editor'])
  })

  it('returns [] when no editor domain matches', () => {
    expect(getEditorAccessControls([])).toEqual([])
  })
})

describe('getManagerAccessControls', () => {
  it('returns ACs from employee + OE domains whose id includes "Manager"', () => {
    expect(ids(getManagerAccessControls(ALL_ACS))).toEqual([
      'ac:orders-manager',
      'ac:products-manager',
      'adm:webhooks-manager',
      'oe:forms-manager',
    ])
  })

  it('does not include unrelated admin-domain manager ACs', () => {
    const result = ids(getManagerAccessControls(ALL_ACS))
    expect(result).not.toContain('adm:extensions-manager')
  })
})

describe('getOeAdministratorAccessControls', () => {
  it('returns ACs from OE domains whose id includes "Administrator"', () => {
    expect(ids(getOeAdministratorAccessControls(ALL_ACS))).toEqual([
      'oe:forms-admin',
    ])
  })
})

describe('getDcpAdministratorAccessControls', () => {
  it('returns manager ACs + admin-domain manager ACs', () => {
    expect(ids(getDcpAdministratorAccessControls(ALL_ACS))).toEqual([
      'ac:orders-manager',
      'ac:products-manager',
      'adm:extensions-manager',
      'adm:webhooks-manager',
      'oe:forms-manager',
    ])
  })

  it('does not include admin-domain viewer ACs', () => {
    const result = ids(getDcpAdministratorAccessControls(ALL_ACS))
    expect(result).not.toContain('adm:webhooks-viewer')
  })

  it('does not include OE administrator ACs', () => {
    const result = ids(getDcpAdministratorAccessControls(ALL_ACS))
    expect(result).not.toContain('oe:forms-admin')
  })
})

describe('mapAccessControlsToTemplates', () => {
  const templates: AccessControlsTemplate[] = [
    {
      id: 't1',
      name: { en: 'Product Manager' },
      accessControls: ['ac:products-viewer', 'ac:products-manager'],
    },
    {
      id: 't2',
      name: { en: 'Order Viewer' },
      accessControls: ['ac:orders-viewer'],
    },
    {
      id: 't3',
      name: { en: 'Empty' },
      accessControls: [],
    },
  ]

  it('returns templates whose ACs are all in the assigned set', () => {
    const result = mapAccessControlsToTemplates(
      ['ac:products-viewer', 'ac:products-manager', 'ac:orders-viewer'],
      templates
    )
    expect(result.map((t) => t.id).sort()).toEqual(['t1', 't2'])
  })

  it('does not return template with partial match', () => {
    const result = mapAccessControlsToTemplates(
      ['ac:products-viewer'], // missing products-manager from t1
      templates
    )
    expect(result.map((t) => t.id)).toEqual([])
  })

  it('skips templates with empty accessControls list', () => {
    const result = mapAccessControlsToTemplates(['anything'], templates)
    expect(result.map((t) => t.id)).not.toContain('t3')
  })

  it('returns [] when no template matches', () => {
    expect(mapAccessControlsToTemplates([], templates)).toEqual([])
  })
})
