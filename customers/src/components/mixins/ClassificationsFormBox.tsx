import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { MixinsFormData } from './helpers'
import { Mixins } from 'models/Mixins'
import { Button } from 'primereact/button'
import { useTranslation } from 'react-i18next'
import MixinsTechnicalDialog from './MixinsTechnicalDialog'
import ClassificationsForm, {
  ClassificationsFormHandle,
} from 'components/mixins/ClassificationsForm'
import { textToTitleCase } from 'helpers/utils'
import { useLocalizedValue } from 'hooks/useLocalizedValue'

interface Props {
  forms: MixinsFormData[]
  mixins: Mixins
  managerPermissions?: boolean
  presentSchemaUrl?: string
  newerSchemaUrl?: string
  onDirtyChange?: (isDirty: boolean) => void
}

const ClassificationsFormBox = forwardRef<ClassificationsFormHandle, Props>(
  (props, ref) => {
    const {
      forms,
      mixins,
      presentSchemaUrl,
      newerSchemaUrl,
      managerPermissions = true,
      onDirtyChange,
    } = props
    const { t } = useTranslation()
    const { getContentLangValue } = useLocalizedValue()
    const [activeFormIndex, setActiveFormIndex] = useState(forms.length - 1)
    const [showDialog, setShowDialog] = useState(false)
    const activeFormRef = useRef<ClassificationsFormHandle>(null)

    useEffect(() => {
      setActiveFormIndex(forms.length - 1)
    }, [forms])

    useImperativeHandle(
      ref,
      () => ({
        getProcessedData: () =>
          activeFormRef.current?.getProcessedData() ?? {
            mixins: {},
            metadata: forms[activeFormIndex]?.metadata,
          },
        reset: () => activeFormRef.current?.reset(),
        isDirty: () => activeFormRef.current?.isDirty() ?? false,
        isValid: () => activeFormRef.current?.isValid() ?? true,
      }),
      [activeFormIndex, forms]
    )

    const nameTemplate = useCallback((item: MixinsFormData) => {
      return (
        <div className="flex align-items-center gap-1">
          {textToTitleCase(item.name as string)}
          <div style={{ color: 'var(--grey-5)', fontSize: '14px' }}>
            ({getContentLangValue(item.sourceCategoryName)})
          </div>
        </div>
      )
    }, [])

    return (
      <>
        {forms.length > 1 && (
          <div className="flex justify-content-end mt-3">
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
            />
          </div>
        )}
        {forms.map((f, index) =>
          index === activeFormIndex ? (
            <div key={f.id}>
              <ClassificationsForm
                ref={activeFormRef}
                name={nameTemplate(f)}
                items={f.items}
                mixins={mixins}
                metadata={f.metadata}
                managerPermissions={managerPermissions}
                onDirtyChange={onDirtyChange}
                newVersion={
                  forms.length > 1 ? forms[1].metadata.version : undefined
                }
              />
            </div>
          ) : null
        )}
      </>
    )
  }
)

ClassificationsFormBox.displayName = 'ClassificationsFormBox'

export default ClassificationsFormBox
