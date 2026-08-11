import { LogMessage } from '../types/Log'

const STREAMING_INBOUND_MARKER = 'Agent receive streaming request:'

const INBOUND_MESSAGE_MARKERS = [
  STREAMING_INBOUND_MARKER,
  'Agent receive request:',
  'Processing Slack message for user:',
  'Processing routed Slack message',
  'Processing Teams message for conversation',
] as const

const INBOUND_MESSAGE_PATTERNS = [
  /Agent receive streaming request:\s*(.*)/s,
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

const LLM_ENDED_RESPONSE_PATTERN =
  /^LLM ended \(run #\d+\) for agent: '[^']+' with response:\s*(.*)/s

export type ExtractedLogMessage = {
  readonly entry: LogMessage
  readonly text: string
}

const messageMatchesMarker = (message: string, marker: string): boolean =>
  message.startsWith(marker)

const isStreamingLog = (messages: LogMessage[]): boolean =>
  messages.some((msg) =>
    messageMatchesMarker(msg.message, STREAMING_INBOUND_MARKER)
  )

const extractWithPatterns = (
  messages: LogMessage[],
  markers: readonly string[],
  patterns: readonly RegExp[],
  preferLast = false
): ExtractedLogMessage | undefined => {
  const matchingEntries = messages.filter((msg) =>
    markers.some((marker) => messageMatchesMarker(msg.message, marker))
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
      return { entry, text: captured }
    }
  }

  return undefined
}

const extractStreamingResponseFromLog = (
  messages: LogMessage[]
): ExtractedLogMessage | undefined => {
  const llmEndedEntries = messages.filter((msg) =>
    msg.message.startsWith('LLM ended')
  )

  for (let index = llmEndedEntries.length - 1; index >= 0; index -= 1) {
    const entry = llmEndedEntries[index]
    const match = entry.message.match(LLM_ENDED_RESPONSE_PATTERN)
    const captured = match?.[1]?.trim()
    if (captured) {
      return { entry, text: captured }
    }
  }

  return undefined
}

export const findInitialMessageFromLog = (
  messages: LogMessage[] | undefined
): ExtractedLogMessage | undefined => {
  if (!messages) {
    return undefined
  }

  return extractWithPatterns(
    messages,
    INBOUND_MESSAGE_MARKERS,
    INBOUND_MESSAGE_PATTERNS
  )
}

export const findResponseFromLog = (
  messages: LogMessage[] | undefined
): ExtractedLogMessage | undefined => {
  if (!messages) {
    return undefined
  }

  if (isStreamingLog(messages)) {
    return extractStreamingResponseFromLog(messages)
  }

  return extractWithPatterns(
    messages,
    RESPONSE_MARKERS,
    RESPONSE_PATTERNS,
    true
  )
}

export const extractInitialMessageFromLog = (
  messages: LogMessage[] | undefined
): string | undefined => findInitialMessageFromLog(messages)?.text

export const extractResponseFromLog = (
  messages: LogMessage[] | undefined
): string | undefined => findResponseFromLog(messages)?.text

export const isSameLogMessage = (left: LogMessage, right: LogMessage): boolean =>
  left.timestamp === right.timestamp &&
  left.message === right.message &&
  left.agentId === right.agentId
