import React from 'react'
import './Mixins.scss'
import {
  BsInfoCircleFill,
  BsPlusCircleFill,
  BsXCircleFill,
} from 'react-icons/bs'
import { useTranslation } from 'react-i18next'
import { MixinsFormItem } from './helpers'

interface Props {
  item?: MixinsFormItem
}

export const getIndicatorColor = (item?: MixinsFormItem) => {
  if (item?.toAdd) {
    return 'var(--blue-4)'
  } else if (item?.toDelete) {
    return 'var(--red)'
  } else if (item?.toChange) {
    return 'var(--gold)'
  }
  return undefined
}

const MixinsFormItemChangeIndicator = (props: Props) => {
  const { item } = props
  const { t } = useTranslation()

  if (!item?.toAdd && !item?.toDelete && !item?.toChange) {
    return null
  }

  return (
    <div
      style={{
        color: getIndicatorColor(item),
        fontSize: '12px',
      }}
      className="flex align-items-center gap-1"
    >
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
    </div>
  )
}

export default MixinsFormItemChangeIndicator
