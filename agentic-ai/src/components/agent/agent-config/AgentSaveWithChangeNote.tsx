import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'

type AgentSaveWithChangeNoteProps = {
  readonly saving: boolean
  readonly disabled: boolean
  readonly changeNote: string
  readonly onChangeNote: (value: string) => void
  readonly onSave: () => void
}

const collapsedNote = (value: string): string =>
  value
    .replace(/[\r\n]+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim()

const AgentSaveWithChangeNote = ({
  saving,
  disabled,
  changeNote,
  onChangeNote,
  onSave,
}: AgentSaveWithChangeNoteProps) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const isDisabled = disabled || saving
  const preview = collapsedNote(changeNote)
  const fullNote = changeNote.trim()

  return (
    <div className="agent-save-with-note">
      <div className="agent-save-note-slot">
        {expanded ? (
          <InputTextarea
            className="agent-save-note-field agent-save-note-field-expanded"
            value={changeNote}
            onChange={(event) => onChangeNote(event.target.value)}
            onBlur={() => setExpanded(false)}
            placeholder={t('agent_change_note_placeholder')}
            aria-label={t('agent_change_note_label')}
            rows={3}
            autoFocus
            disabled={isDisabled}
          />
        ) : (
          <InputText
            className="agent-save-note-preview"
            value={preview}
            readOnly={!isDisabled}
            title={fullNote || undefined}
            aria-label={t('agent_change_note_label')}
            placeholder={t('agent_change_note_placeholder')}
            disabled={isDisabled}
            onFocus={() => {
              if (!isDisabled) {
                setExpanded(true)
              }
            }}
          />
        )}
      </div>
      <Button
        type="button"
        label={t('save')}
        className="agent-detail-save-btn"
        onClick={onSave}
        disabled={isDisabled}
        loading={saving}
      />
    </div>
  )
}

export { AgentSaveWithChangeNote }
