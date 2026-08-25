import { useTranslation } from 'react-i18next'
import { formatReadableCommunicationContent } from '../../utils/formatHelpers'

type CommunicationSectionProps = {
  readonly message?: string
  readonly response?: string
}

type CommunicationColumnProps = {
  readonly title: string
  readonly content: string
  readonly emptyLabel: string
}

const CommunicationColumn = ({
  title,
  content,
  emptyLabel,
}: CommunicationColumnProps) => {
  const formattedContent = content.trim()
    ? formatReadableCommunicationContent(content)
    : null

  return (
    <div className="communication-panel-column">
      <h4 className="communication-panel-column-title">{title}</h4>
      <div className="communication-panel-body">
        {formattedContent ? (
          <pre className="communication-panel-text">{formattedContent}</pre>
        ) : (
          <span className="communication-panel-empty">{emptyLabel}</span>
        )}
      </div>
    </div>
  )
}

export const CommunicationSection = ({
  message,
  response,
}: CommunicationSectionProps) => {
  const { t } = useTranslation()

  const hasMessage = Boolean(message)
  const hasResponse = Boolean(response)

  if (!hasMessage && !hasResponse) {
    return null
  }

  return (
    <section className="communication-section">
      <h3 className="panel-section-title">{t('communication')}</h3>
      <div className="communication-panel panel-surface">
        <div className="communication-panel-columns">
          {hasMessage && (
            <CommunicationColumn
              title={t('message')}
              content={message ?? ''}
              emptyLabel={t('no_content')}
            />
          )}
          {hasMessage && hasResponse && (
            <div className="communication-panel-divider" aria-hidden="true" />
          )}
          {hasResponse && (
            <CommunicationColumn
              title={t('response')}
              content={response ?? ''}
              emptyLabel={t('no_content')}
            />
          )}
        </div>
      </div>
    </section>
  )
}

export default CommunicationSection
