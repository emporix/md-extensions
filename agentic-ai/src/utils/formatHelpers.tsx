import React, { ReactNode } from 'react'

/**
 * Formats a string with newlines into JSX elements with proper line breaks
 * @param message - The message string that may contain \n characters
 * @returns ReactNode with proper line breaks or the original string
 */
export const formatMessageWithLineBreaks = (message: string): ReactNode => {
  if (!message || !message.includes('\n')) {
    return message
  }

  const lines = message.split('\n')
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
