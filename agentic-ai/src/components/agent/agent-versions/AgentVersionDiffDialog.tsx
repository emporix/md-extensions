import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { AgentVersionDiffField } from './AgentVersionDiffField'
import {
  type AgentVersionFieldDiff,
  type AgentVersionRow,
  diffAgentVersionConfigs,
} from '../../../utils/agentVersionHelpers'

type AgentVersionDiffDialogProps = {
  readonly selected: AgentVersionRow | null
  readonly current: AgentVersionRow | null
  readonly onHide: () => void
}

const AgentVersionDiffDialog = ({
  selected,
  current,
  onHide,
}: AgentVersionDiffDialogProps) => {
  const { t } = useTranslation()

  const diffs = useMemo<AgentVersionFieldDiff[]>(() => {
    if (!selected || !current) {
      return []
    }
    return diffAgentVersionConfigs(selected.config, current.config)
  }, [selected, current])

  const footer = (
    <div className="dialog-actions">
      <Button
        type="button"
        label={t('close')}
        onClick={onHide}
        className="p-button-secondary"
      />
    </div>
  )

  return (
    <Dialog
      visible={selected !== null && current !== null}
      onHide={onHide}
      header={t('agent_version_diff_title', {
        version: selected?.version ?? '',
        current: current?.version ?? '',
      })}
      footer={footer}
      className="agent-version-diff-dialog"
      modal
      closeOnEscape
      closable
    >
      {diffs.length === 0 ? (
        <p className="agent-version-diff-empty">
          {t('agent_version_diff_none')}
        </p>
      ) : (
        <>
          <div className="agent-version-diff-columns agent-version-diff-legend">
            <p className="agent-version-diff-column-label">
              {t('agent_version_diff_selected', {
                version: selected?.version ?? '',
              })}
            </p>
            <p className="agent-version-diff-column-label">
              {t('agent_version_diff_current', {
                version: current?.version ?? '',
              })}
            </p>
          </div>
          <div className="agent-version-diff-list">
            {diffs.map((diff) => (
              <AgentVersionDiffField
                key={`${selected?.version ?? ''}-${diff.field}`}
                diff={diff}
              />
            ))}
          </div>
        </>
      )}
    </Dialog>
  )
}

export { AgentVersionDiffDialog }
