export const formatTimestamp = (timestamp: string): string => {
  try {
    const date = timestamp.includes('T')
      ? new Date(timestamp)
      : new Date(parseInt(timestamp))
    return date.toLocaleString()
  } catch {
    return String(timestamp)
  }
}

export const formatDateObject = (dateObj: string): string => {
  try {
    return new Date(dateObj).toISOString()
  } catch {
    return dateObj
  }
}
