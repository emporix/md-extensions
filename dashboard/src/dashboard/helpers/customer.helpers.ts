import type { CustomerApiResponse } from '../api/customers.api'
import { getInitials, getAvatarColor, getDisplayName } from './person.helpers'
import { formatShortDate } from './date.helpers'

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#0ea5e9']

export const getCustomerInitials = (customer: CustomerApiResponse): string =>
  getInitials(customer)

export const getCustomerAvatarColor = (customer: CustomerApiResponse): string =>
  getAvatarColor(customer, AVATAR_COLORS)

export const getCustomerDisplayName = (customer: CustomerApiResponse): string =>
  getDisplayName(customer)

export const formatRegistrationDate = (isoString: string): string =>
  formatShortDate(isoString)
