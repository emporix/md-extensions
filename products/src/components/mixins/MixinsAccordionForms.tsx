import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MixinsFormData, MixinsFormTemplate } from './helpers'
import { Mixins } from '../../models/Mixins.model'
import { useTranslation } from 'react-i18next'
import { PrimaryButton, SecondaryButton } from '@emporix/component-library'
import { MixinsAccordionFormHandle } from './MixinsAccordionForm'
import { sortById } from '../../helpers/utils'
import MixinsAccordionFormBox from './MixinsAccordionFormBox'
import { Metadata } from '../../models/Metadata.model'
import styles from './Mixins.module.scss'

interface Props {
  readonly forms: Map<string, MixinsFormData[]>
  readonly mixins: Mixins
  readonly onSave: (mixins: Mixins, metadata: Metadata) => Promise<void> | void
  readonly managerPermissions?: boolean
  readonly onDirtyChange?: (isDirty: boolean) => void
}

const MixinsAccordionForms = (props: Props) => {
  const {
    forms,
    mixins,
    managerPermissions = true,
    onSave,
    onDirtyChange,
  } = props
  const { t, i18n } = useTranslation()
  const [dirtyStates, setDirtyStates] = useState<Map<string, boolean>>(
    new Map()
  )

  const formRefs = useRef<Map<string, MixinsAccordionFormHandle>>(new Map())

  const setFormRef = useCallback(
    (key: string, ref: MixinsAccordionFormHandle | null) => {
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

  useEffect(() => {
    onDirtyChange?.(isAnyDirty())
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [dirtyStates, onDirtyChange])

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

  const mixinsAccordionForms: MixinsFormTemplate[] = useMemo(() => {
    if (!forms) return []
    const schemas = []
    for (const f of forms.values()) {
      const present = f[0]
      const newer = f[1]
      if (!present?.id) continue
      const item = {
        id: present?.id,
        newerVersion: newer?.metadata?.version,
        template: (
          <MixinsAccordionFormBox
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [
    forms,
    i18n.language,
    mixins,
    managerPermissions,
    setFormRef,
    handleDirtyChange,
  ])

  return (
    <div>
      <div className={styles.toolbar}>
        <SecondaryButton
          onClick={handleDiscard}
          disabled={!isAnyDirty() || !managerPermissions}
        >
          {t('global.discard')}
        </SecondaryButton>
        <PrimaryButton
          disabled={!areAllValid() || !managerPermissions}
          onClick={handleSave}
        >
          {t('global.save')}
        </PrimaryButton>
      </div>
      <div className={styles.accordionList}>
        {mixinsAccordionForms.map((f) => f.template)}
      </div>
    </div>
  )
}

export default MixinsAccordionForms
