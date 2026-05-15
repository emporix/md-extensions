import React, { useEffect, useState } from 'react'
import { MixinsFormData, MixinsFormMetadata } from './helpers'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { Mixins } from '../../models/Mixins'
import MixinsForm from './MixinsForm'
import { Button } from 'primereact/button'
import { useTranslation } from 'react-i18next'
import MixinsTechnicalDialog from './MixinsTechnicalDialog'

interface Props {
  forms: MixinsFormData[]
  mixins: Mixins
  onSave: (data: Mixins, metadata: MixinsFormMetadata) => Promise<void> | void
  managerPermissions?: boolean
  presentSchemaUrl?: string
  newerSchemaUrl?: string
  onDirtyChange?: (dirty: boolean) => void
  /** Present schema id — enables shared customer Save when bulk registry wraps the page */
  bulkRegistrationBaseId?: string
}

const MixinsFormBox = (props: Props) => {
  const {
    forms,
    mixins,
    onSave,
    presentSchemaUrl,
    newerSchemaUrl,
    managerPermissions = true,
    onDirtyChange,
    bulkRegistrationBaseId,
  } = props
  const { t } = useTranslation()
  const { getUiLangValue } = useLocalizedValue()
  const [activeFormIndex, setActiveFormIndex] = useState(forms.length - 1)
  const [showDialog, setShowDialog] = useState(false)
  const [versionDirty, setVersionDirty] = useState<boolean[]>(() =>
    forms.map(() => false)
  )

  useEffect(() => {
    setActiveFormIndex(forms.length - 1)
  }, [forms])

  useEffect(() => {
    setVersionDirty((prev) => forms.map((_, i) => prev[i] ?? false))
  }, [forms])

  useEffect(() => {
    onDirtyChange?.(versionDirty.some(Boolean))
  }, [versionDirty, onDirtyChange])

  const setVersionDirtyAt = (index: number, dirty: boolean) => {
    setVersionDirty((prev) => {
      if (prev[index] === dirty) return prev
      const next = [...prev]
      next[index] = dirty
      return next
    })
  }

  return (
    <>
      {forms.length > 1 && (
        <div className="flex justify-content-end mb-3">
          <Button
            className={activeFormIndex === 1 ? 'p-button-secondary' : ''}
            label={t('mixins.buttons.keepOld')}
            onClick={() => setActiveFormIndex(0)}
          />
          <Button
            className={
              activeFormIndex === 0 ? 'p-button-secondary ml-2' : 'ml-2'
            }
            label={t('mixins.buttons.newVersion')}
            onClick={() => setActiveFormIndex(1)}
          />
          <Button
            className="p-button-secondary ml-2"
            label={t('mixins.buttons.technical')}
            onClick={() => setShowDialog(true)}
          />
          <MixinsTechnicalDialog
            show={showDialog}
            onHide={() => setShowDialog(false)}
            newerSchemaUrl={newerSchemaUrl}
            presentSchemaUrl={presentSchemaUrl}
          ></MixinsTechnicalDialog>
        </div>
      )}
      {forms.map((f, index) => (
        <div
          key={f.id + index}
          style={{ display: index === activeFormIndex ? 'block' : 'none' }}
          aria-hidden={index !== activeFormIndex}
        >
          <MixinsForm
            name={getUiLangValue(f.name)}
            items={f.items}
            mixins={mixins}
            metadata={f.metadata}
            newerMetadata={f.newerMetadata}
            onSave={onSave}
            managerPermissions={managerPermissions}
            onDirtyChange={(dirty) => setVersionDirtyAt(index, dirty)}
            bulkRegistrationId={
              bulkRegistrationBaseId != null
                ? `${bulkRegistrationBaseId}-slot-${index}`
                : undefined
            }
            participateInBulkSave={index === activeFormIndex}
          ></MixinsForm>
        </div>
      ))}
    </>
  )
}

export default MixinsFormBox
