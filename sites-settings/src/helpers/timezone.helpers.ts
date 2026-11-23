export type SiteTimezoneOption = {
  label: string
  value: string
}

type IntlWithTimeZones = typeof Intl & {
  supportedValuesOf(key: 'timeZone'): string[]
}

const supportedTimeZones = (): string[] =>
  (Intl as IntlWithTimeZones).supportedValuesOf('timeZone')

const toUtcOffset = (
  timezoneId: string,
  at: Date = new Date()
): string | null => {
  try {
    const options = {
      timeZone: timezoneId,
      timeZoneName: 'shortOffset',
    } as Intl.DateTimeFormatOptions
    const offset = new Intl.DateTimeFormat('en-US', options)
      .formatToParts(at)
      .find((part) => part.type === 'timeZoneName')?.value

    if (!offset) {
      return null
    }

    if (offset === 'GMT' || offset === 'UTC') {
      return 'UTC+0'
    }

    return offset.replace(/^GMT/, 'UTC')
  } catch {
    return null
  }
}

const toTimezoneLabel = (timezoneId: string): string => {
  const offset = toUtcOffset(timezoneId)
  return offset ? `${timezoneId} (${offset})` : timezoneId
}

export const getSiteTimezoneOptions = (
  selectedTimezone?: string
): SiteTimezoneOption[] => {
  const options = supportedTimeZones().map((id) => ({
    label: toTimezoneLabel(id),
    value: id,
  }))

  if (!selectedTimezone) {
    return options
  }

  const alreadyListed = options.some(
    (option) => option.value === selectedTimezone
  )
  if (alreadyListed) {
    return options
  }

  return [
    { label: toTimezoneLabel(selectedTimezone), value: selectedTimezone },
    ...options,
  ]
}
