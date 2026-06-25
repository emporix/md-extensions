import { User } from '../../models/User.model'

export interface UserFormFields {
  firstName: string
  lastName: string
  contactEmail: string
  department: string
  preferredSite: string
  preferredLanguage: string
  preferredCurrency: string
  status: string
  groupIds: string[]
  validFrom: string
}

export const createUserForm = (): UserFormFields => {
  return {
    firstName: '',
    lastName: '',
    contactEmail: '',
    department: '',
    preferredSite: '',
    preferredLanguage: '',
    preferredCurrency: '',
    status: '',
    groupIds: [],
    validFrom: '',
  }
}

export const mapUserToUserForm = (user: User): UserFormFields => {
  return {
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    contactEmail: user.contactEmail || '',
    department: user.department || '',
    preferredSite: user.preferredSite || '',
    preferredLanguage: user.preferredLanguage || '',
    preferredCurrency: user.preferredCurrency || '',
    status: user.status || '',
    groupIds: user.groupIds || [],
    validFrom: user.validFrom || '',
  }
}

export const mapUserFormToPayload = (
  form: UserFormFields,
  user: User
): Partial<User> => {
  return {
    ...user,
    firstName: form.firstName,
    lastName: form.lastName,
    contactEmail: form.contactEmail,
    department: form.department,
    preferredSite: form.preferredSite,
    preferredLanguage: form.preferredLanguage,
    preferredCurrency: form.preferredCurrency,
    groupIds: form.groupIds,
  }
}
