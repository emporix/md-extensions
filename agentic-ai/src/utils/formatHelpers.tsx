import React, { ReactNode } from 'react'

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Wrap case-insensitive filter matches in <mark> for log message cells. */
export const highlightTextMatches = (
  text: string,
  query: string | null | undefined
): ReactNode => {
  const trimmedQuery = query?.trim()
  if (!trimmedQuery) {
    return text
  }

  const pattern = new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'gi')
  const parts = text.split(pattern)

  if (parts.length === 1) {
    return text
  }

  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <mark key={index} className="log-message-highlight">
          {part}
        </mark>
      )
    }
    return part
  })
}

export const formatMessageWithLineBreaks = (message: string): ReactNode => {
  if (!message) {
    return message
  }

  const normalizedMessage = message.replace(/\\n/g, '\n')

  if (!normalizedMessage.includes('\n')) {
    return message
  }

  const lines = normalizedMessage.split('\n')
  return (
    <div style={{ whiteSpace: 'pre-line' }}>
      {lines.map((line, index) => (
        <React.Fragment key={index}>
          {line}
          {index < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  )
}
