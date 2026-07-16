import Localized from '../../models/Localized.model'
import { Group } from '../../models/Groups.model'
import { mapAccessControlsToTemplates } from './accessControls.helpers'
import {
  AccessControlsTemplate,
  DCP_TEMPLATES,
  OE_TEMPLATES,
} from '../../configs/accessControlsTemplates'

export enum ServiceType {
  DCP = 'dcp',
  OE = 'oe',
}

export enum RoleType {
  STANDARD = 'standard',
  TEMPLATES = 'templates',
  VENDOR = 'vendor',
}

export interface GroupFormFields {
  id?: string | undefined
  name: Localized
  b2b?: B2B
  description: Localized
  dcpTemplates: AccessControlsTemplate[]
  oeTemplates: AccessControlsTemplate[]
  vendorId?: string
  restrictions?: string[] | null
  accessControls?: string[]
}

export interface B2B {
  legalEntityId: string | null
}

export const createGroupForm = (): GroupFormFields => {
  return {
    id: '',
    b2b: {
      legalEntityId: '',
    },
    name: {},
    description: {},
    dcpTemplates: [],
    oeTemplates: [],
    vendorId: '',
    restrictions: [],
    accessControls: [],
  }
}

export const mapGroupToGroupForm = (group: Group): GroupFormFields => {
  return {
    id: group.id || '',
    name: group.name || {},
    b2b: {
      legalEntityId: group.b2b?.legalEntityId || '',
    },
    description: group.description || {},
    dcpTemplates: mapAccessControlsToTemplates(
      group.accessControls || [],
      DCP_TEMPLATES
    ),
    oeTemplates: mapAccessControlsToTemplates(
      group.accessControls || [],
      OE_TEMPLATES
    ),
    vendorId: group.vendorId || '',
    restrictions: group.restrictions || [],
    accessControls: group.accessControls || [],
  }
}

export const mapGroupFormToPayload = (
  form: GroupFormFields,
  templateId: string,
  group?: Group
): Partial<Group> => {
  return {
    ...(group ? group : {}),
    id: form.id,
    name: form.name,
    description: form.description,
    b2b: {
      legalEntityId: form.b2b?.legalEntityId || '',
    },
    accessControls: form.accessControls ?? [],
    templates:
      form.oeTemplates.length > 0 || form.dcpTemplates.length > 0
        ? [templateId]
        : [],
    vendorId: form.vendorId,
    restrictions:
      form.restrictions && form.restrictions.length > 0
        ? form.restrictions
        : null,
  }
}
