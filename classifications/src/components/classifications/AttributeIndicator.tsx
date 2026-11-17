import {
  BsInfoCircleFill,
  BsPlusCircleFill,
  BsXCircleFill,
} from 'react-icons/bs'
import { useTranslation } from 'react-i18next'
import styles from './AttributeIndicator.module.scss'

export type AttributeChangeType = 'added' | 'deleted' | 'changed'

type AttributeIndicatorProps = {
  readonly changeType?: AttributeChangeType
}

/** Ported from management-dashboard `modules/classifications/components/AttributeIndicator`. */
const AttributeIndicator = ({ changeType }: AttributeIndicatorProps) => {
  const { t } = useTranslation()

  if (!changeType) {
    return null
  }

  return (
    <div className={`${styles.indicator} ${styles[changeType]}`}>
      {changeType === 'added' && (
        <>
          <BsPlusCircleFill size={12} />
          {t('classifications.labels.added')}
        </>
      )}
      {changeType === 'deleted' && (
        <>
          <BsXCircleFill size={12} />
          {t('classifications.labels.deleted')}
        </>
      )}
      {changeType === 'changed' && (
        <>
          <BsInfoCircleFill size={12} />
          {t('classifications.labels.changed')}
        </>
      )}
    </div>
  )
}

export default AttributeIndicator
