import type { VegaLiteSegment } from '../../utils/richContent/vegaLiteSegments'
import { ChatSourceBlock } from './ChatSourceBlock'

type CodeViewProps = {
  readonly segment: VegaLiteSegment
}

const visibleSource = (text: string): string =>
  text.replace(/^\r?\n/, '').replace(/\n$/, '')

export const CodeView = ({ segment }: CodeViewProps) => {
  if (segment.kind !== 'code' && segment.kind !== 'code-pending') {
    return null
  }

  const source = visibleSource(segment.text)

  return (
    <ChatSourceBlock title={segment.title} copyText={source}>
      {source}
    </ChatSourceBlock>
  )
}
