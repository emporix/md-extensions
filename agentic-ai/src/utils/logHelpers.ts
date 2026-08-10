import { LogMessage } from '../types/Log'

const INBOUND_MESSAGE_MARKERS = [
  'Agent receive request:',
  'Processing Slack message for user:',
  'Processing routed Slack message',
  'Processing Teams message for conversation',
] as const

const INBOUND_MESSAGE_PATTERNS = [
  /Agent receive request:\s*(.*)/s,
  /Processing Slack message for user:[^,]*,\s*message:\s*(.*)/s,
  /Processing routed Slack message\s+user=\S+\s+channel=\S+\s+message=(.*)/s,
  /Processing Teams message for conversation\s+'[^']*'\s+from user:\s*[^,]*,\s*message:\s*(.*)/s,
] as const

const RESPONSE_MARKERS = [
  'Agent final response:',
  'Slack routed message sent successfully',
  'Slack message sent successfully:',
  'Teams message sent successfully',
] as const

const RESPONSE_PATTERNS = [
  /Agent final response:\s*(.*)/s,
  /Slack message sent successfully:\s*(.*)/s,
  /Slack routed message sent successfully \(channel=[^,]+,\s*message=(.*)\)/s,
  /Teams message sent successfully \(conversation='[^']*',\s*message=(.*)\)/s,
] as const

const extractWithPatterns = (
  messages: LogMessage[],
  markers: readonly string[],
  patterns: readonly RegExp[],
  preferLast = false
): string | undefined => {
  const matchingEntries = messages.filter((msg) =>
    markers.some((marker) => msg.message.includes(marker))
  )

  if (matchingEntries.length === 0) {
    return undefined
  }

  const entry = preferLast
    ? matchingEntries[matchingEntries.length - 1]
    : matchingEntries[0]

  for (const pattern of patterns) {
    const match = entry.message.match(pattern)
    const captured = match?.[1]?.trim()
    if (captured) {
      return captured
    }
  }

  return undefined
}

export const extractInitialMessageFromLog = (
  messages: LogMessage[] | undefined
): string | undefined => {
  if (!messages) {
    return undefined
  }

  return extractWithPatterns(
    messages,
    INBOUND_MESSAGE_MARKERS,
    INBOUND_MESSAGE_PATTERNS
  )
}

export const extractResponseFromLog = (
  messages: LogMessage[] | undefined
): string | undefined => {
  if (!messages) {
    return undefined
  }

  return extractWithPatterns(
    messages,
    RESPONSE_MARKERS,
    RESPONSE_PATTERNS,
    true
  )
}
