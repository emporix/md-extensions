type RichBlockPendingProps = {
  readonly message: string
  readonly source?: string
}

type RichBlockInvalidProps = {
  readonly source: string
  readonly message: string
}

export const RichBlockPending = ({
  message,
  source,
}: RichBlockPendingProps) => {
  if (!source) {
    return <p className="chat-block-pending">{message}</p>
  }

  return (
    <div className="chat-block-invalid">
      <pre className="chat-block-source">{source}</pre>
      <p className="chat-block-pending">{message}</p>
    </div>
  )
}

export const RichBlockInvalid = ({
  source,
  message,
}: RichBlockInvalidProps) => (
  <div className="chat-block-invalid">
    <pre className="chat-block-source">{source}</pre>
    <p className="chat-block-error">{message}</p>
  </div>
)
