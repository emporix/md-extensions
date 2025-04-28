import { ReactNode } from 'react'
import '../mixins/MixinsSectionBox.scss'
import { Button } from 'primereact/button'
import { textToTitleCase } from '../../../helpers/utils'
import { BsPlusLg } from 'react-icons/bs'
import { HiMinus } from 'react-icons/hi'
import { useTranslation } from 'react-i18next'

interface MixinsSectionBoxProps {
  children: ReactNode
  className?: string
  name: string
  append?: () => void
  remove?: () => void
}

const MixinsSectionBox = (props: MixinsSectionBoxProps) => {
  const { t } = useTranslation()
  const { children, className, name, append, remove } = props

  return (
    <div
      className={`${className} mixins-section-box-wrapper`}
      style={{ paddingBottom: '2em' }}
    >
      <div className="flex justify-content-between align-items-center w-full">
        {remove ? (
          <div className="mixins-section-box-title w-full">
            {textToTitleCase(name)}
            <Button
              className="btn icon p-button-icon-only p-button-secondary ml-2"
              onClick={remove}
              style={{ float: 'right' }}
            >
              <HiMinus size={16} />
            </Button>
          </div>
        ) : (
          <div className="mixins-section-box-title">
            {textToTitleCase(name)}
          </div>
        )}
        {append && (
          <div>
            <Button className="p-button-secondary" onClick={append}>
              <BsPlusLg size={16}></BsPlusLg>
              <label style={{ marginLeft: '1.5em' }}>
                {t('products.mixins.addNew')}
              </label>
            </Button>
          </div>
        )}
      </div>
      <div data-test-id="section-box" className="mixins-section-box">
        {children}
      </div>
    </div>
  )
}

MixinsSectionBox.defaultProps = {
  className: '',
}

export default MixinsSectionBox
