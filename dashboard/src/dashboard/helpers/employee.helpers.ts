import type { EmployeeApiResponse } from '../api/employees.api'
import { getInitials, getAvatarColor, getDisplayName } from './person.helpers'
import { formatShortDate } from './date.helpers'

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#0ea5e9', '#94a3b8']

export const getEmployeeInitials = (employee: EmployeeApiResponse): string =>
  getInitials(employee)

export const getEmployeeAvatarColor = (employee: EmployeeApiResponse): string =>
  getAvatarColor(employee, AVATAR_COLORS)

export const getEmployeeDisplayName = (employee: EmployeeApiResponse): string =>
  getDisplayName(employee)

export const formatDate = (isoString: string | undefined): string =>
  formatShortDate(isoString)
