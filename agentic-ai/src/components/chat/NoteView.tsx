import { useTranslation } from 'react-i18next'
import type { VegaLiteSegment } from '../../utils/richContent/vegaLiteSegments'
import { RichBlockPending } from './RichBlockStatus'

type NoteViewProps = {
  readonly segment: VegaLiteSegment
}

export const NoteView = ({ segment }: NoteViewProps) => {
  const { t } = useTranslation()
  if (segment.kind === 'note-pending') {
    return <RichBlockPending message={t('chat_note_drawing')} />
  }
  if (segment.kind !== 'note') {
    return null
  }

  return (
    <aside className="chat-note">
      {segment.title ? (
        <p className="chat-note-title">{segment.title}</p>
      ) : null}
      <p className="chat-note-body">{segment.text.replace(/^\n+|\n+$/g, '')}</p>
    </aside>
  )
}
