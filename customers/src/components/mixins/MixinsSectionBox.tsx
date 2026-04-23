import React, { ReactNode } from 'react'
import './Mixins.scss'
import { Button } from 'primereact/button'
import { textToTitleCase } from '../../helpers/utils'
import { BsPlusLg } from 'react-icons/bs'
import { HiMinus } from 'react-icons/hi'
import { useTranslation } from 'react-i18next'
import { MixinsFormItem } from './helpers'
import MixinsFormItemChangeIndicator, {
  getIndicatorColor,
} from './MixinsFormItemChangeIndicator'

interface MixinsSectionBoxProps {
  item?: MixinsFormItem
  children: ReactNode
  className?: string
  name: string
  append?: () => void
  remove?: () => void
}

const MixinsSectionBox = (props: MixinsSectionBoxProps) => {
  const { t } = useTranslation()
  const { item, children, className = '', name, append, remove } = props

  return (
    <div className={`${className} mixins-section-box-wrapper`}>
      <div className="flex justify-content-between align-items-start w-full mb-3">
        <div
          style={{ color: getIndicatorColor(item) }}
          className="mixins-section-box-title"
        >
          <MixinsFormItemChangeIndicator item={item} />
          {textToTitleCase(name)}
        </div>
        <div>
          {remove && (
            <Button
              className="p-button-secondary-small ml-2"
              onClick={remove}
              icon={<HiMinus size={16} />}
            />
          )}
          {append && (
            <Button
              className="p-button-secondary-small ml-2"
              icon={<BsPlusLg size={16} />}
              label={t('mixins.buttons.addNew')}
              onClick={append}
            />
          )}
        </div>
      </div>
      <div data-test-id="section-box" className="mixins-section-box">
        {children}
      </div>
    </div>
  )
}

export default MixinsSectionBox
