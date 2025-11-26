import { LogMessage } from '../types/Log'

export const extractInitialMessageFromLog = (
  messages: LogMessage[] | undefined
): string | undefined => {
  if (!messages) {
    return undefined
  }

  const messageRegex =
    /(?:Agent receive request:|Processing Slack message for user:[^,]*,\s*message:)\s*(.*)/s

  const message = messages.find(
    (msg) =>
      msg.message.includes('Agent receive request:') ||
      msg.message.includes('Processing Slack message for user:')
  )

  return message?.message.match(messageRegex)?.[1]?.trim()
}

export const extractResponseFromLog = (
  messages: LogMessage[] | undefined
): string | undefined => {
  if (!messages) {
    return undefined
  }

  const response = messages.find(
    (msg) =>
      msg.message.includes('Agent final response:') ||
      msg.message.includes('Slack message sent successfully:')
  )

  if (!response) {
    return undefined
  }

  return response.message
    .replace('Agent final response:', '')
    .replace('Slack message sent successfully:', '')
    .trim()
}
