import React, { useCallback, useMemo, useRef, useState } from 'react'
import { MixinsFormData, MixinsFormTemplate } from './helpers'
import { Mixins } from 'models/Mixins'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import { ClassificationsFormHandle } from './ClassificationsForm'
import { sortById } from 'helpers/utils'
import ClassificationsFormBox from 'components/mixins/ClassificationsFormBox'
import { Metadata } from 'models/Metadata'

interface Props {
  classificationForms: Map<string, MixinsFormData[]>
  mixins: Mixins
  onSave: (mixins: Mixins, metadata: Metadata) => Promise<void> | void
  managerPermissions?: boolean
}

const ClassificationsForms = (props: Props) => {
  const {
    classificationForms,
    mixins,
    managerPermissions = true,
    onSave,
  } = props
  const { t, i18n } = useTranslation()
  const [dirtyStates, setDirtyStates] = useState<Map<string, boolean>>(
    new Map()
  )

  const formRefs = useRef<Map<string, ClassificationsFormHandle>>(new Map())

  const setFormRef = useCallback(
    (key: string, ref: ClassificationsFormHandle | null) => {
      if (ref) {
        formRefs.current.set(key, ref)
      } else {
        formRefs.current.delete(key)
      }
    },
    []
  )

  const handleDirtyChange = useCallback((key: string, isDirty: boolean) => {
    setDirtyStates((prev) => {
      const next = new Map(prev)
      next.set(key, isDirty)
      return next
    })
  }, [])

  const isAnyDirty = (): boolean => {
    for (const isDirty of dirtyStates.values()) {
      if (isDirty) return true
    }
    return false
  }

  const areAllValid = (): boolean => {
    for (const ref of formRefs.current.values()) {
      if (!ref.isValid()) return false
    }
    return true
  }

  const handleDiscard = useCallback(() => {
    formRefs.current.forEach((ref) => {
      ref.reset()
    })
    setDirtyStates(new Map())
  }, [])

  const handleSave = useCallback(async () => {
    const mergedMixins: Mixins = {}
    const mergedMetadata: Metadata = {}

    for (const [key, formRef] of formRefs.current) {
      const processedData = formRef.getProcessedData()
      mergedMixins[key] = processedData.mixins
      mergedMetadata[key] = processedData.metadata.url
    }
    await onSave(mergedMixins, mergedMetadata)
    setDirtyStates(new Map())
  }, [onSave])

  const mixinsClassificationForms: MixinsFormTemplate[] = useMemo(() => {
    if (!classificationForms) return []
    const schemas = []
    for (const [_, f] of classificationForms) {
      const present = f.at(0)
      const newer = f.at(1)
      if (!present?.id) continue
      const item = {
        id: present?.id,
        newerVersion: newer?.metadata?.version,
        template: (
          <ClassificationsFormBox
            key={present.id}
            forms={f}
            mixins={mixins}
            managerPermissions={managerPermissions}
            presentSchemaUrl={present?.metadata?.url}
            newerSchemaUrl={newer?.metadata?.url}
            ref={(ref) => setFormRef(present.metadata.key, ref)}
            onDirtyChange={(isDirty) =>
              handleDirtyChange(present.metadata.key, isDirty)
            }
          />
        ),
      }
      schemas.push(item)
    }
    return schemas.sort(sortById)
  }, [
    classificationForms,
    i18n.language,
    mixins,
    managerPermissions,
    setFormRef,
    handleDirtyChange,
  ])

  return (
    <div>
      <div className="flex justify-content-end mb-3">
        <Button
          className="p-button-secondary"
          label={t('global.discard')}
          onClick={handleDiscard}
          disabled={!isAnyDirty() || !managerPermissions}
        />
        <Button
          className="ml-2"
          disabled={!areAllValid() || !managerPermissions}
          label={t('global.save')}
          onClick={handleSave}
        />
      </div>
      <div className="flex flex-column gap-3">
        {mixinsClassificationForms.map((f) => f.template)}
      </div>
    </div>
  )
}

export default ClassificationsForms
