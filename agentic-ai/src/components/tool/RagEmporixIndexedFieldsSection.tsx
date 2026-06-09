import React from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import { RagEmporixFieldConfig, ToolConfig } from '../../types/Tool'
import {
  MIXINS_PREFIX,
  isValidCustomFieldKey,
} from '../../utils/toolConfigHelpers'
import { getAvailableIndexedFieldsForIndex } from '../../utils/ragEmporixToolHelpers'
import RagFieldRowLayout from './RagFieldRowLayout'
import { ToolRequiredMark } from './ToolRequiredMark'

interface RagEmporixIndexedFieldsSectionProps {
  config: ToolConfig
  availableFields: string[]
  onAddIndexedField: () => void
  onAddCustomIndexedField: () => void
  onRemoveIndexedField: (index: number) => void
  onUpdateIndexedField: (
    index: number,
    field: keyof RagEmporixFieldConfig,
    value: string
  ) => void
}

export const RagEmporixIndexedFieldsSection: React.FC<
  RagEmporixIndexedFieldsSectionProps
> = ({
  config,
  availableFields,
  onAddIndexedField,
  onAddCustomIndexedField,
  onRemoveIndexedField,
  onUpdateIndexedField,
}) => {
  const { t } = useTranslation()
  const indexedFields = config.indexedFields || []
  const hasEmptyIndexedFields = indexedFields.length === 0

  return (
    <div
      className={`tool-detail-field-subsection${hasEmptyIndexedFields ? ' tool-detail-indexed-fields-empty' : ''}`}
    >
      <p className="tool-detail-section-description">
        {t('indexed_fields_description')}
      </p>

      <div className="tool-detail-field-list">
        {indexedFields.map((field, index) => (
          <RagFieldRowLayout
            key={index}
            onRemove={() => onRemoveIndexedField(index)}
            removeAriaLabel={t('remove_field')}
            primaryField={
              <>
                <label className="field-label">{t('field_name')}</label>
                <InputText
                  value={field.name ?? ''}
                  onChange={(event) =>
                    onUpdateIndexedField(index, 'name', event.target.value)
                  }
                  className="w-full"
                  placeholder={t('enter_field_name')}
                />
              </>
            }
            secondaryField={
              <>
                <label className="field-label">
                  {t('field_key')}
                  <ToolRequiredMark />
                </label>
                {field.custom ||
                (field.key?.startsWith(MIXINS_PREFIX) &&
                  !availableFields.includes(field.key ?? '')) ? (
                  <InputText
                    value={field.key ?? ''}
                    onChange={(event) => {
                      const newValue = event.target.value
                      onUpdateIndexedField(
                        index,
                        'key',
                        newValue.startsWith(MIXINS_PREFIX)
                          ? newValue
                          : MIXINS_PREFIX
                      )
                    }}
                    className={`w-full${!isValidCustomFieldKey(field.key) ? ' p-invalid' : ''}`}
                    placeholder={t('enter_custom_field_key')}
                  />
                ) : (
                  <Dropdown
                    value={field.key ?? ''}
                    options={getAvailableIndexedFieldsForIndex(
                      availableFields,
                      indexedFields,
                      index
                    ).map((item) => ({
                      label: item,
                      value: item,
                    }))}
                    onChange={(event) =>
                      onUpdateIndexedField(index, 'key', event.value)
                    }
                    className={`w-full${!field.key?.trim() ? ' p-invalid' : ''}`}
                    placeholder={t('select_field_key')}
                    tooltip={field.key?.trim() || undefined}
                    tooltipOptions={{ position: 'top' }}
                    filter
                    showClear
                    appendTo="self"
                  />
                )}
              </>
            }
          />
        ))}
      </div>

      <div className="tool-detail-field-list-actions">
        <Button
          type="button"
          icon="pi pi-plus"
          label={t('add_indexed_field')}
          onClick={onAddIndexedField}
          className="p-button-secondary"
        />
        <Button
          type="button"
          icon="pi pi-plus"
          label={t('add_custom_field')}
          onClick={onAddCustomIndexedField}
          className="p-button-secondary"
        />
      </div>
    </div>
  )
}
