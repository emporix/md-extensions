/**
 * Format a timestamp string to a localized date string
 * @param timestamp - ISO string, number string, or Date object
 * @returns Formatted date string
 */
export const formatTimestamp = (timestamp: string): string => {
  try {
    let date: Date

    date = timestamp.includes('T')
      ? new Date(timestamp)
      : new Date(parseInt(timestamp))

    return date.toLocaleString()
  } catch {
    return String(timestamp)
  }
}

/**
 * Format date object (handles MongoDB date format)
 * @param dateObj - Date object or MongoDB date format
 * @returns ISO string
 */
export const formatDateObject = (dateObj: any): string => {
  try {
    // Handle MongoDB date format with $date.$numberLong
    if (dateObj && dateObj.$date && dateObj.$date.$numberLong) {
      return new Date(parseInt(dateObj.$date.$numberLong)).toISOString()
    }

    // Handle direct timestamp string
    if (typeof dateObj === 'string') {
      return new Date(dateObj).toISOString()
    }

    // Handle direct Date object
    if (dateObj instanceof Date) {
      return dateObj.toISOString()
    }

    // Fallback to current date if format is unknown
    console.warn('Unknown date format:', dateObj)
    return new Date().toISOString()
  } catch (error) {
    console.error('Error formatting date:', error, dateObj)
    return new Date().toISOString()
  }
}
