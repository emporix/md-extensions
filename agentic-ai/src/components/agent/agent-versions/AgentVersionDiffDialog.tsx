import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import {
  type AgentVersionField,
  type AgentVersionFieldDiff,
  type AgentVersionRow,
  type DiffCell,
  type DiffCellTone,
  type DiffRow,
  type TextDiffPart,
  diffAgentVersionConfigs,
} from '../../../utils/agentVersionHelpers'

type AgentVersionDiffDialogProps = {
  readonly selected: AgentVersionRow | null
  readonly current: AgentVersionRow | null
  readonly onHide: () => void
}

type DiffTextProps = {
  readonly parts: readonly TextDiffPart[]
  readonly tone: DiffCellTone
}

const fieldLabelKey = (field: AgentVersionField): string =>
  `agent_version_field_${field}`

const markClassForTone = (tone: DiffCellTone): string => {
  if (tone === 'remove') {
    return 'agent-version-diff-mark-remove'
  }
  if (tone === 'add') {
    return 'agent-version-diff-mark-add'
  }
  return ''
}

const DiffText = ({ parts, tone }: DiffTextProps) => (
  <>
    {parts.map((part, index) =>
      part.changed ? (
        <mark key={index} className={markClassForTone(tone)}>
          {part.text}
        </mark>
      ) : (
        <span key={index}>{part.text}</span>
      )
    )}
  </>
)

type DiffCellViewProps = {
  readonly cell: DiffCell
}

type DiffBlock =
  | { readonly kind: 'same'; readonly lines: readonly string[] }
  | { readonly kind: 'change'; readonly row: DiffRow }

const cellText = (cell: DiffCell): string =>
  cell?.parts.map((part) => part.text).join('') ?? ''

const isSameRow = (row: DiffRow): boolean =>
  row.left?.tone === 'same' && row.right?.tone === 'same'

const groupDiffRows = (rows: readonly DiffRow[]): DiffBlock[] => {
  const blocks: DiffBlock[] = []
  let sameLines: string[] | null = null

  const flushSame = () => {
    if (!sameLines) {
      return
    }
    blocks.push({ kind: 'same', lines: sameLines })
    sameLines = null
  }

  for (const row of rows) {
    if (!isSameRow(row)) {
      flushSame()
      blocks.push({ kind: 'change', row })
      continue
    }

    const line = cellText(row.left)
    if (sameLines) {
      sameLines.push(line)
      continue
    }
    sameLines = [line]
  }

  flushSame()
  return blocks
}

const DiffCellView = ({ cell }: DiffCellViewProps) => {
  if (!cell) {
    return (
      <div
        className="agent-version-diff-row-cell agent-version-diff-row-empty"
        aria-hidden
      />
    )
  }

  return (
    <pre
      className={`agent-version-diff-row-cell agent-version-diff-row-${cell.tone}`}
    >
      <DiffText parts={cell.parts} tone={cell.tone} />
    </pre>
  )
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
              <section key={diff.field} className="agent-version-diff-field">
                <h3 className="agent-version-diff-field-title">
                  {t(fieldLabelKey(diff.field))}
                </h3>
                <div className="agent-version-diff-split">
                  {groupDiffRows(diff.rows).map((block, index) =>
                    block.kind === 'same' ? (
                      <div key={index} className="agent-version-diff-row">
                        <pre className="agent-version-diff-row-cell agent-version-diff-row-same">
                          {block.lines.join('\n')}
                        </pre>
                        <pre className="agent-version-diff-row-cell agent-version-diff-row-same">
                          {block.lines.join('\n')}
                        </pre>
                      </div>
                    ) : (
                      <div key={index} className="agent-version-diff-row">
                        <DiffCellView cell={block.row.left} />
                        <DiffCellView cell={block.row.right} />
                      </div>
                    )
                  )}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </Dialog>
  )
}

export { AgentVersionDiffDialog }
