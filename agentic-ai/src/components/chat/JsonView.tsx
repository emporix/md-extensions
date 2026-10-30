import { useTranslation } from 'react-i18next'
import {
  formatJsonBlock,
  highlightJson,
} from '../../utils/richContent/jsonHighlight'
import type { VegaLiteSegment } from '../../utils/richContent/vegaLiteSegments'
import { ChatSourceBlock } from './ChatSourceBlock'
import { RichBlockInvalid, RichBlockPending } from './RichBlockStatus'

type JsonViewProps = {
  readonly segment: VegaLiteSegment
}

export const JsonView = ({ segment }: JsonViewProps) => {
  const { t } = useTranslation()
  if (segment.kind === 'json-pending') {
    return <RichBlockPending message={t('chat_json_drawing')} />
  }
  if (segment.kind !== 'json') {
    return null
  }

  let source = ''
  try {
    source = formatJsonBlock(JSON.parse(segment.text))
  } catch {
    return (
      <RichBlockInvalid
        source={segment.text}
        message={t('chat_json_invalid')}
      />
    )
  }

  const tokens = highlightJson(source)
  return (
    <ChatSourceBlock title={segment.title} copyText={source}>
      {tokens.map((token, index) => (
        <span
          key={`${token.kind}-${index}`}
          className={
            token.kind === 'text' ? undefined : `chat-json-${token.kind}`
          }
        >
          {token.text}
        </span>
      ))}
    </ChatSourceBlock>
  )
}
