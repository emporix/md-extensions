import { useTranslation } from 'react-i18next'
import { SectionBox } from '@emporix/component-library'
import { Quote, QuoteStatus } from '../../models/Quotes.model'
import { assignHostLocation, orderDetailUrl } from '../../helpers/hostUrls'
import { StylableProps } from '../../helpers/props'
import styles from './QuotesTabGeneralStatus.module.scss'

interface QuotesTabGeneralStatusProps extends StylableProps {
  quote: Quote
}

/** Order, reason and message of a completed quote (green when accepted). */
const QuotesTabGeneralStatus = (props: QuotesTabGeneralStatusProps) => {
  const { className = '', quote } = props
  const { t } = useTranslation()

  return (
    <SectionBox
      className={[styles.status, className].filter(Boolean).join(' ')}
      sectionClassName={
        quote.status.value === QuoteStatus.ACCEPTED
          ? styles.accepted
          : styles.declined
      }
      data-testid="quote-status-box"
    >
      <div className={styles.grid}>
        <div className={styles.col}>
          <div className={styles.label}>
            {t('quotes.tabs.general.orderNumber')}
          </div>
          {quote.orderId ? (
            // Orders is a federated remote of the host (hash route); a
            // `backTo` cannot cross into it, so back returns to its list.
            <a
              href={orderDetailUrl(quote.orderId)}
              onClick={(event) => {
                event.preventDefault()
                assignHostLocation(orderDetailUrl(quote.orderId as string))
              }}
            >
              <span className={styles.value}>{quote.orderId}</span>
            </a>
          ) : (
            <span className={styles.value}>--</span>
          )}
        </div>

        <div className={styles.col}>
          <div className={styles.label}>{t('quotes.tabs.general.reason')}</div>
          <div className={styles.value}>
            {quote.status.quoteReason?.code || '--'}
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.label}>
            {t('quotes.tabs.general.additionalMessage')}
          </div>
          <div className={styles.value}>{quote.status.comment || '--'}</div>
        </div>
      </div>
    </SectionBox>
  )
}

export default QuotesTabGeneralStatus
