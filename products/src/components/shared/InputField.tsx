import { ReactNode } from 'react'
import './InputField.scss'
import { Tooltip } from 'primereact/tooltip'
import { t } from 'i18next'
import { useProductData } from '../../context/ProductDataProvider'
import { ProductType } from '../../models/Category'
import { BsInfoCircleFill } from 'react-icons/bs'
import { textToTitleCase } from '../../helpers/utils'

type Props = {
  checkbox?: boolean
  name?: string
  className: string
  label: string
  children: ReactNode
  required?: boolean
  error?: string
  noInheritance?: boolean
  tooltip?: string
}

const InputField = ({
  className,
  name,
  error,
  label,
  children,
  checkbox = false,
  required = false,
  noInheritance = false,
  tooltip,
}: Props) => {
  const { product } = useProductData()

  return (
    <div
      className={`${className} input-field-wrapper ${
        checkbox ? 'input-field-wrapper--checkbox-field' : ''
      }`}
    >
      <Tooltip target=".tooltip-required" position="top" showDelay={200} />
      <Tooltip
        target=".tooltip-info"
        position="top"
        style={{ textAlign: 'center' }}
        showDelay={200}
      />
      <label
        className={`tooltip-target-label font-bold flex align-items-center ${
          checkbox ? '' : 'mb-2'
        }`}
        htmlFor={name}
      >
        {textToTitleCase(label)}
        {required && (
          <span
            className="tooltip-required cursor-pointer"
            data-pr-tooltip={t('global.tooltip.required')}
          >
            *
          </span>
        )}
        {tooltip && (
          <BsInfoCircleFill
            size={16}
            style={{ color: '#596168' }}
            className="tooltip-info ml-1 cursor-pointer"
            data-pr-tooltip={tooltip}
          ></BsInfoCircleFill>
        )}
        {product &&
          !noInheritance &&
          name &&
          product.productType === ProductType.variant &&
          !product.metadata?.overridden?.includes(name) && (
            <span className="ml-1 text-sm font-italic font-normal">
              Inherited from parent
            </span>
          )}
      </label>
      {children}
      {error && <small className="p-error">{error}</small>}
    </div>
  )
}

InputField.defaultProps = {
  className: '',
}

export default InputField
