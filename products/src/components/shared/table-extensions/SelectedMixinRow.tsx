import { useMemo } from 'react'
import { DisplayMixin } from '../../../models/DisplayMixin'
import { Button } from 'primereact/button'
import { InputSwitch } from 'primereact/inputswitch'
import { BsPencilFill } from 'react-icons/bs'
import { useLocalizedValue } from '../../../hooks/useLocalizedValue'

interface SelectedMixinRowProps {
  mixin: DisplayMixin
  managerPermission?: boolean
  onRemove: () => unknown
  onEdit: () => unknown
}

export const SelectedMixinRow = (props: SelectedMixinRowProps) => {
  const { mixin, managerPermission = true, onRemove, onEdit } = props
  const { getUiLangValue } = useLocalizedValue()
  const localLabel = useMemo(() => {
    return getUiLangValue(mixin.label)
  }, [mixin.label])
  return (
    <>
      <div key={mixin.key} className="flex align-items-center mt-2 mb-2">
        <InputSwitch
          id={mixin.key}
          checked={true}
          data-test-id={`${mixin.key}-switch`}
          disabled={!managerPermission}
          onChange={(e) => {
            if (!e.value) {
              onRemove()
            }
          }}
        />
        <label
          htmlFor={mixin.key}
          className="ml-2 flex-grow-1"
          data-test-id={`${mixin.key}-label`}
        >
          {localLabel}
        </label>
        <Button
          disabled={!managerPermission}
          className="p-button-text p-button-plain p-button-icon-only mt-1"
          data-test-id={`${mixin.key}-edit-button`}
          onClick={() => onEdit()}
        >
          <BsPencilFill size={16} />
        </Button>
      </div>
      <p className="text-xs mb-2">{mixin.key}</p>
    </>
  )
}
