import React from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { RagEmporixFilterFieldConfig } from '../../types/Tool'
import { RagFilterMetadataField } from '../../services/aiRagIndexerService'
import {
  getAvailableFilterFieldsForIndex,
  getRagFilterFieldDisplayLabel,
  getRagFilterFieldLabel,
} from '../../utils/ragEmporixToolHelpers'
import RagFieldRowLayout from './RagFieldRowLayout'
import { ToolRequiredMark } from './ToolRequiredMark'

type RagFilterFieldsSectionProps = {
  filterFields: RagEmporixFilterFieldConfig[]
  availableFilterFields: RagFilterMetadataField[]
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdateField: (
    index: number,
    field: keyof Pick<RagEmporixFilterFieldConfig, 'name' | 'description'>,
    value: string
  ) => void
  onSelectKey: (index: number, key?: string | null) => void
}

export const RagFilterFieldsSection: React.FC<RagFilterFieldsSectionProps> = ({
  filterFields,
  availableFilterFields,
  onAdd,
  onRemove,
  onUpdateField,
  onSelectKey,
}) => {
  const { t } = useTranslation()

  return (
    <div className="tool-detail-field-subsection">
      <p className="tool-detail-section-description">
        {t('filter_fields_description')}
      </p>

      <div className="tool-detail-field-list">
        {filterFields.map((field, index) => (
          <RagFieldRowLayout
            key={index}
            onRemove={() => onRemove(index)}
            removeAriaLabel={t('remove_filter_field')}
            primaryField={
              <>
                <label className="field-label">{t('field_name')}</label>
                <InputText
                  value={field.name || ''}
                  onChange={(e) => onUpdateField(index, 'name', e.target.value)}
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
                <Dropdown
                  value={field.key || ''}
                  options={getAvailableFilterFieldsForIndex(
                    availableFilterFields,
                    filterFields,
                    index
                  ).map((metadataField) => ({
                    label: getRagFilterFieldLabel(metadataField),
                    value: metadataField.key,
                  }))}
                  onChange={(e) => onSelectKey(index, e.value)}
                  className={`w-full${!field.key?.trim() ? ' p-invalid' : ''}`}
                  placeholder={t('select_filter_field_key')}
                  tooltip={getRagFilterFieldDisplayLabel(
                    field,
                    availableFilterFields
                  )}
                  tooltipOptions={{ position: 'top' }}
                  filter
                  showClear
                  appendTo="self"
                />
              </>
            }
            footer={
              <>
                <label className="field-label">{t('field_description')}</label>
                <InputTextarea
                  value={field.description || ''}
                  onChange={(e) =>
                    onUpdateField(index, 'description', e.target.value)
                  }
                  className="w-full"
                  placeholder={t('enter_field_description')}
                  rows={3}
                />
              </>
            }
          />
        ))}
      </div>

      <div className="tool-detail-field-list-actions">
        <Button
          type="button"
          icon="pi pi-plus"
          label={t('add_filter_field')}
          onClick={onAdd}
          className="p-button-secondary"
        />
      </div>
    </div>
  )
}
