import {
  BsInfoCircleFill,
  BsPlusCircleFill,
  BsXCircleFill,
} from 'react-icons/bs'
import { useTranslation } from 'react-i18next'
import { MixinsFormItem } from './helpers'
import { getIndicatorClassName } from './mixinsIndicator'
import styles from './Mixins.module.scss'

interface Props {
  readonly item?: MixinsFormItem
}

const MixinsFormItemChangeIndicator = ({ item }: Props) => {
  const { t } = useTranslation()

  if (
    !item?.toAdd &&
    !item?.toDelete &&
    !item?.toChange &&
    !item?.nameChanged
  ) {
    return null
  }

  return (
    <div className={`${styles.indicator} ${getIndicatorClassName(item)}`}>
      {item?.toAdd && (
        <>
          <BsPlusCircleFill size={12} />
          {t('mixins.labels.added')}
        </>
      )}
      {item?.toDelete && (
        <>
          <BsXCircleFill size={12} />
          {t('mixins.labels.deleted')}
        </>
      )}
      {item?.toChange && (
        <>
          <BsInfoCircleFill size={12} />
          {t('mixins.labels.changed')}
        </>
      )}
      {!item?.toChange && item?.nameChanged && (
        <>
          <BsInfoCircleFill size={12} />
          {t('mixins.labels.labelChanged')}
        </>
      )}
    </div>
  )
}

export default MixinsFormItemChangeIndicator
