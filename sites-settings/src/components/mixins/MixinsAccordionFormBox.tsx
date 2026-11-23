import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { MixinsFormData } from './helpers'
import { Mixins } from '../../models/Mixins.model'
import MixinsVersionButtons from './MixinsVersionButtons'
import MixinsAccordionForm, {
  MixinsAccordionFormHandle,
} from './MixinsAccordionForm'
import { textToTitleCase } from '../../helpers/utils'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import styles from './Mixins.module.scss'

interface Props {
  readonly forms: MixinsFormData[]
  readonly mixins: Mixins
  readonly managerPermissions?: boolean
  readonly presentSchemaUrl?: string
  readonly newerSchemaUrl?: string
  readonly onDirtyChange?: (isDirty: boolean) => void
}

const MixinsAccordionFormBox = forwardRef<MixinsAccordionFormHandle, Props>(
  (props, ref) => {
    const {
      forms,
      mixins,
      presentSchemaUrl,
      newerSchemaUrl,
      managerPermissions = true,
      onDirtyChange,
    } = props
    const { getContentLangValue, getUiLangValue } = useLocalizedValue()
    const [activeFormIndex, setActiveFormIndex] = useState(forms.length - 1)
    const [showDialog, setShowDialog] = useState(false)
    const activeFormRef = useRef<MixinsAccordionFormHandle>(null)

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

    const nameTemplate = useCallback(
      (item: MixinsFormData) => {
        return (
          <div className={styles.accordionName}>
            {textToTitleCase(getUiLangValue(item.name) as string)}
            {item.sourceCategoryName && (
              <div className={styles.sourceCategory}>
                ({getContentLangValue(item.sourceCategoryName)})
              </div>
            )}
          </div>
        )
      },
      [getContentLangValue, getUiLangValue]
    )

    return (
      <>
        {forms.length > 1 && (
          <MixinsVersionButtons
            placement="top"
            activeFormIndex={activeFormIndex}
            onSelect={setActiveFormIndex}
            showTechnical={showDialog}
            onShowTechnical={() => setShowDialog(true)}
            onHideTechnical={() => setShowDialog(false)}
            newerSchemaUrl={newerSchemaUrl}
            presentSchemaUrl={presentSchemaUrl}
          />
        )}
        {forms.map((f, index) =>
          index === activeFormIndex ? (
            <div key={f.id}>
              <MixinsAccordionForm
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

MixinsAccordionFormBox.displayName = 'MixinsAccordionFormBox'

export default MixinsAccordionFormBox
