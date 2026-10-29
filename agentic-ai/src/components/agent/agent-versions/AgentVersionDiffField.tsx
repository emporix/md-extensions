import { Fragment, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type AgentVersionField,
  type AgentVersionFieldDiff,
  type DiffCell,
  type DiffCellTone,
  type TextDiffPart,
  collapseUnchangedLines,
  groupDiffRows,
} from '../../../utils/agentVersionHelpers'

type DiffSide = 'left' | 'right'

type DiffTextProps = {
  readonly parts: readonly TextDiffPart[]
  readonly tone: DiffCellTone
}

type DiffPaneProps = {
  readonly cell: DiffCell
  readonly side: DiffSide
}

type UnchangedLinesProps = {
  readonly lines: readonly string[]
}

type AgentVersionDiffFieldProps = {
  readonly diff: AgentVersionFieldDiff
}

const fieldLabelKey = (field: AgentVersionField): string =>
  `agent_version_field_${field}`

const DiffText = ({ parts, tone }: DiffTextProps) => (
  <>
    {parts.map((part, index) =>
      part.changed ? (
        <mark key={index} className={`agent-version-diff-mark-${tone}`}>
          {part.text}
        </mark>
      ) : (
        <span key={index}>{part.text}</span>
      )
    )}
  </>
)

const DiffPane = ({ cell, side }: DiffPaneProps) => (
  <div
    className={`agent-version-diff-pane agent-version-diff-pane-${side} agent-version-diff-pane-${cell?.tone ?? 'empty'}`}
    aria-hidden={cell ? undefined : true}
  >
    {cell && <DiffText parts={cell.parts} tone={cell.tone} />}
  </div>
)

const UnchangedLines = ({ lines }: UnchangedLinesProps) => {
  if (lines.length === 0) {
    return null
  }

  const text = lines.join('\n')
  return (
    <>
      <div className="agent-version-diff-pane agent-version-diff-pane-left agent-version-diff-pane-same">
        {text}
      </div>
      <div className="agent-version-diff-pane agent-version-diff-pane-right agent-version-diff-pane-same">
        {text}
      </div>
    </>
  )
}

const AgentVersionDiffField = ({ diff }: AgentVersionDiffFieldProps) => {
  const { t } = useTranslation()
  const [expandedBlocks, setExpandedBlocks] = useState<ReadonlySet<number>>(
    () => new Set()
  )
  const blocks = useMemo(() => groupDiffRows(diff.rows), [diff.rows])
  const changeCount = blocks.filter((block) => block.kind === 'change').length

  const expandBlock = (index: number) => {
    setExpandedBlocks((previous) => new Set(previous).add(index))
  }

  return (
    <section className="agent-version-diff-field">
      <h3 className="agent-version-diff-field-title">
        {t(fieldLabelKey(diff.field))}
      </h3>
      <div className="agent-version-diff-split">
        {blocks.map((block, index) => {
          if (block.kind === 'change') {
            return (
              <Fragment key={index}>
                {changeCount > 1 && (
                  <p className="agent-version-diff-change-label">
                    {t('agent_version_diff_change', {
                      index: block.number,
                      total: changeCount,
                    })}
                  </p>
                )}
                {block.rows.map((row, rowIndex) => (
                  <Fragment key={rowIndex}>
                    <DiffPane cell={row.left} side="left" />
                    <DiffPane cell={row.right} side="right" />
                  </Fragment>
                ))}
              </Fragment>
            )
          }

          const { head, hiddenCount, tail } = expandedBlocks.has(index)
            ? { head: block.lines, hiddenCount: 0, tail: [] }
            : collapseUnchangedLines(
                block.lines,
                index === 0,
                index === blocks.length - 1
              )

          return (
            <Fragment key={index}>
              <UnchangedLines lines={head} />
              {hiddenCount > 0 && (
                <button
                  type="button"
                  className="agent-version-diff-expand"
                  onClick={() => expandBlock(index)}
                >
                  {t('agent_version_diff_show_unchanged', {
                    count: hiddenCount,
                  })}
                </button>
              )}
              <UnchangedLines lines={tail} />
            </Fragment>
          )
        })}
      </div>
    </section>
  )
}

export { AgentVersionDiffField }
