import { useMemo } from 'react'
import { formatChatResponseText } from '../../utils/formatHelpers'
import { splitVegaLiteSegments } from '../../utils/richContent/vegaLiteSegments'
import { CodeView } from './CodeView'
import { CsvView } from './CsvView'
import { JsonView } from './JsonView'
import { MermaidView } from './MermaidView'
import { NoteView } from './NoteView'
import { RichMarkdown } from './RichMarkdown'
import { VegaLiteView } from './VegaLiteView'

type AssistantMessageContentProps = {
  readonly text: string
}

export const AssistantMessageContent = ({
  text,
}: AssistantMessageContentProps) => {
  const segments = useMemo(() => splitVegaLiteSegments(text), [text])
  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === 'text' && segment.error) {
          return <VegaLiteView key={`chart-error-${index}`} segment={segment} />
        }
        if (segment.kind === 'text') {
          return (
            <RichMarkdown
              key={`text-${index}`}
              text={formatChatResponseText(segment.text)}
            />
          )
        }
        if (segment.kind === 'mermaid' || segment.kind === 'mermaid-pending') {
          return (
            <MermaidView key={`${segment.kind}-${index}`} segment={segment} />
          )
        }
        if (segment.kind === 'csv' || segment.kind === 'csv-pending') {
          return <CsvView key={`${segment.kind}-${index}`} segment={segment} />
        }
        if (segment.kind === 'code' || segment.kind === 'code-pending') {
          return <CodeView key={`${segment.kind}-${index}`} segment={segment} />
        }
        if (segment.kind === 'json' || segment.kind === 'json-pending') {
          return <JsonView key={`${segment.kind}-${index}`} segment={segment} />
        }
        if (segment.kind === 'note' || segment.kind === 'note-pending') {
          return <NoteView key={`${segment.kind}-${index}`} segment={segment} />
        }
        return (
          <VegaLiteView key={`${segment.kind}-${index}`} segment={segment} />
        )
      })}
    </>
  )
}
