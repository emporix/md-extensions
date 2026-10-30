type RichBlockPendingProps = {
  readonly message: string
}

type RichBlockInvalidProps = {
  readonly source: string
  readonly message: string
}

export const RichBlockPending = ({ message }: RichBlockPendingProps) => (
  <p className="chat-block-pending">{message}</p>
)

export const RichBlockInvalid = ({
  source,
  message,
}: RichBlockInvalidProps) => (
  <div className="chat-block-invalid">
    <pre className="chat-block-source">{source}</pre>
    <p className="chat-block-error">{message}</p>
  </div>
)
