export type PersonLike = {
  id: string
  firstName?: string
  lastName?: string
  contactEmail?: string
}

const hashString = (s: string): number => {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export const getInitials = (person: PersonLike): string => {
  const first = (person.firstName?.trim()[0] ?? '').toUpperCase()
  const last = (person.lastName?.trim()[0] ?? '').toUpperCase()
  if (first || last) return `${first}${last}`
  return (person.contactEmail?.[0] ?? '?').toUpperCase()
}

export const getAvatarColor = (
  person: PersonLike,
  colors: string[]
): string => {
  const key = `${person.firstName ?? ''}-${person.lastName ?? ''}-${person.id}`
  const index = hashString(key) % colors.length
  return colors[index] ?? colors[0]
}

export const getDisplayName = (person: PersonLike): string => {
  const first = person.firstName?.trim() ?? ''
  const last = person.lastName?.trim() ?? ''
  if (first || last) return `${first} ${last}`.trim()
  return person.contactEmail ?? '—'
}
