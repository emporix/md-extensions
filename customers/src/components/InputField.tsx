import React, { ReactNode, useRef } from 'react'
import './InputField.scss'
import { Tooltip } from 'primereact/tooltip'
import { t } from 'i18next'
import { useProductData } from '../context/ProductDataProvider'
import { ProductType } from '../models/Category'
import { BsInfoCircle } from 'react-icons/bs'
import { textToTitleCase } from '../helpers/utils'
import classNames from 'classnames'

type Props = {
  checkbox?: boolean
  name?: string
  className: string
  label: string | ReactNode
  children?: ReactNode
  required?: boolean
  error?: string
  noInheritance?: boolean
  tooltip?: string | ReactNode
  color?: string
}

const InputField = (props: Props) => {
  const {
    className,
    name,
    error,
    label,
    children,
    checkbox = false,
    required = false,
    noInheritance = false,
    tooltip,
    color,
  } = props
  const { product } = useProductData()
  const tooltipKey = useRef(Math.random().toString(36).slice(2)).current

  return (
    <div
      className={classNames(
        'input-field-wrapper',
        { 'checkbox-field': checkbox },
        className
      )}
    >
      <Tooltip target=".tooltip-required" position="top" showDelay={200} />
      <Tooltip
        target={`.tooltip-${tooltipKey}`}
        position="top"
        style={{ textAlign: 'center', maxWidth: '320px' }}
        showDelay={200}
      />
      <label
        className={`tooltip-target-label font-bold flex align-items-center ${
          checkbox ? '' : 'mb-2'
        }`}
        htmlFor={name}
        style={{ color: color || 'var(--grey-9)' }}
      >
        {typeof label === 'string' ? textToTitleCase(label) : label}
        {required && (
          <span
            className="tooltip-required cursor-pointer"
            data-pr-tooltip={t('global.tooltip.required')}
          >
            *
          </span>
        )}
        {tooltip && (
          <BsInfoCircle
            size={16}
            style={{ color: 'var(--grey-8)' }}
            className={`tooltip-${tooltipKey} ml-1 cursor-pointer`}
            data-pr-tooltip={tooltip}
          ></BsInfoCircle>
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
      <div className={`${error ? 'invalid-field' : ''}`}>{children}</div>
      {error && (
        <small style={{ marginTop: '2px' }} className="p-error block">
          {error}
        </small>
      )}
    </div>
  )
}

InputField.defaultProps = {
  className: '',
}

export default InputField
