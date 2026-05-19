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

const RagFilterFieldsSection: React.FC<RagFilterFieldsSectionProps> = ({
  filterFields,
  availableFilterFields,
  onAdd,
  onRemove,
  onUpdateField,
  onSelectKey,
}) => {
  const { t } = useTranslation()

  return (
    <div className="form-field">
      <label className="field-label">
        {t('filter_fields')}
        <span className="field-required-mark"> *</span>
      </label>
      <small className="text-muted field-hint">
        {t('filter_fields_description')}
      </small>

      {filterFields.map((field, index) => (
        <RagFieldRowLayout
          key={index}
          primaryClassName="tool-field-row__name"
          secondaryClassName="tool-field-row__key-wide"
          onRemove={() => onRemove(index)}
          removeAriaLabel={t('remove_filter_field')}
          removeTooltip={t('remove_filter_field')}
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
                <span className="field-required-mark"> *</span>
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
                className={`w-full rag-field-key-dropdown ${!field.key?.trim() ? 'p-invalid' : ''}`}
                placeholder={t('select_filter_field_key')}
                tooltip={getRagFilterFieldDisplayLabel(
                  field,
                  availableFilterFields
                )}
                tooltipOptions={{ position: 'top' }}
                filter
                showClear
              />
              {!field.key?.trim() && (
                <small className="p-error">{t('field_key_required')}</small>
              )}
            </>
          }
          footer={
            <div className="form-field rag-field-description">
              <label className="field-label">{t('field_description')}</label>
              <InputTextarea
                value={field.description || ''}
                onChange={(e) =>
                  onUpdateField(index, 'description', e.target.value)
                }
                className="w-full rag-field-description-input"
                placeholder={t('enter_field_description')}
                rows={1}
              />
            </div>
          }
        />
      ))}

      <Button
        icon="pi pi-plus"
        label={t('add_filter_field')}
        onClick={onAdd}
        className={`p-button-secondary ${filterFields.length > 0 ? 'field-actions-spaced' : ''}`}
      />

      {filterFields.length === 0 && (
        <small className="p-error field-validation-message">
          {t('filter_fields_required')}
        </small>
      )}
    </div>
  )
}

export default RagFilterFieldsSection
