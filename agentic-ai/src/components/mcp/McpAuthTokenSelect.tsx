import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'
import { Token } from '../../types/Token'

interface McpAuthTokenSelectProps {
  value: string
  tokens: Token[]
  tokensLoading: boolean
  onChange: (tokenId: string) => void
}

export const McpAuthTokenSelect: React.FC<McpAuthTokenSelectProps> = ({
  value,
  tokens,
  tokensLoading,
  onChange,
}) => {
  const { t } = useTranslation()

  const tokenOptions = useMemo(
    () =>
      tokens
        .map((token) => ({
          label: token.name,
          value: token.id,
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [tokens]
  )

  return (
    <Dropdown
      value={value || null}
      options={tokenOptions}
      onChange={(event) => onChange(event.value ?? '')}
      className="w-full"
      placeholder={tokensLoading ? t('loading_tokens') : t('select_token')}
      disabled={tokensLoading}
      showClear
      appendTo="self"
    />
  )
}
