import React, { ReactNode } from 'react'

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
