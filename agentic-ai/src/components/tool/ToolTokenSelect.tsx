import React from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'

interface ToolTokenSelectProps {
  value: string
  tokens: Array<{ id: string; name: string }>
  onChange: (tokenId: string) => void
  invalid?: boolean
}

export const ToolTokenSelect: React.FC<ToolTokenSelectProps> = ({
  value,
  tokens,
  onChange,
  invalid = false,
}) => {
  const { t } = useTranslation()

  return (
    <Dropdown
      value={value}
      options={tokens}
      onChange={(event) => onChange(event.value ?? '')}
      className={`w-full${invalid ? ' p-invalid' : ''}`}
      placeholder={t('select_token')}
      optionLabel="name"
      optionValue="id"
      appendTo="self"
    />
  )
}
