import { useCallback, useEffect, useMemo, useState } from 'react'
import { Availability, useAvailabilityApi } from '../../api/availability'
import { Button } from 'primereact/button'
import { BsPlusSquareFill } from 'react-icons/bs'
import { useTranslation } from 'react-i18next'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { Dialog } from 'primereact/dialog'
import InputField from '../shared/InputField'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { makeCall } from '../../helpers/api'
import useForm from '../../hooks/useForm.tsx'
import TableActions from '../shared/TableActions'
import { useDashboardContext } from '../../context/Dashboard.context.tsx'

interface AvailabilityActionProps {
  availability: Availability
  productId: string
}

interface AddUpdateDialogProps {
  availability?: Availability
  productId: string
  title: string
  label: string
  visible: boolean
  onHide: () => void
  onUpdate: () => void
  add: boolean
}

function AvailabilityAddEditDialog(props: AddUpdateDialogProps) {
  const [loading, setLoading] = useState(false)
  const { createProductAvailability, updateProductAvailability } =
    useAvailabilityApi()
  const { formData, setInitFormData, setFormField } = useForm<Availability>()
  const { setRefreshValue } = useRefresh()
  const { t } = useTranslation()

  const { permissions } = useDashboardContext()
  const canBeManaged = permissions?.products?.manager

  const onSubmit = useCallback(async () => {
    if (props.add) {
      await makeCall(
        () =>
          createProductAvailability(
            props.productId,
            props.availability?.site as string,
            formData as Availability
          ),
        setLoading
      )
    } else {
      await makeCall(
        () =>
          updateProductAvailability(
            props.productId,
            props.availability?.site as string,
            formData as Availability
          ),
        setLoading
      )
    }
    setRefreshValue()
    props.onUpdate()
  }, [formData, setRefreshValue, props.onUpdate])

  useEffect(() => {
    if (props.availability) {
      setInitFormData({ ...props.availability })
    }
  }, [props.availability])

  const distributionChannelOptions = useMemo(
    () => [
      {
        label: 'Assortment',
        value: 'ASSORTMENT',
      },
      {
        label: 'Home Delivery',
        value: 'HOME_DELIVERY',
      },
      {
        label: 'Pickup',
        value: 'PICKUP',
      },
    ],
    []
  )
  return (
    <Dialog
      style={{ minWidth: '30vw', maxWidth: '600px' }}
      className="brands-dialog-wrapper"
      header={props.title}
      onHide={props.onHide}
      visible={props.visible}
    >
      <form onSubmit={onSubmit}>
        <InputField
          label={t('products.edit.tab.availability.dialog.stockLevel')}
          className="w-full mb-3"
        >
          <InputText
            disabled={!canBeManaged}
            value={formData.stockLevel}
            onChange={(event) => setFormField('stockLevel', event.target.value)}
            type="number"
          />
        </InputField>
        <InputField label={'Distribution Channel'} className="w-full mb-3">
          <Dropdown
            disabled={!canBeManaged}
            value={formData.distributionChannel}
            options={distributionChannelOptions}
            onChange={(event) =>
              setFormField('distributionChannel', event.target.value)
            }
          />
        </InputField>
        <Button
          disabled={!canBeManaged}
          className={canBeManaged ? 'mt-2' : 'p-button p-button-secondary mt-2'}
          label={props.label}
          onClick={(event) => {
            event.preventDefault()
            onSubmit()
          }}
          loading={loading}
        />
      </form>
    </Dialog>
  )
}

export function AvailabilityActions(props: AvailabilityActionProps) {
  const { availability, productId } = props
  const { t } = useTranslation()
  const [isEditDialogOpened, setIsEditDialogOpened] = useState(false)
  const [isAddDialogOpened, setIsAddDialogOpened] = useState(false)

  const { setRefreshValue } = useRefresh()

  const { permissions } = useDashboardContext()
  const canBeManaged = permissions?.products?.manager

  return (
    <div className="flex justify-content-end">
      {props.availability.id ? (
        <TableActions onEdit={() => setIsEditDialogOpened(true)} />
      ) : (
        <TableActions
          actions={[
            {
              disabled: !canBeManaged,
              icon: <BsPlusSquareFill size={16} />,
              onClick: () => setIsAddDialogOpened(true),
            },
          ]}
        />
      )}

      <AvailabilityAddEditDialog
        productId={productId}
        availability={availability}
        visible={isEditDialogOpened}
        title={t('products.edit.tab.availability.dialog.titleEdit')}
        label={t('products.edit.tab.availability.dialog.submitEdit')}
        onHide={() => setIsEditDialogOpened(false)}
        onUpdate={() => {
          setIsEditDialogOpened(false)
        }}
        add={false}
      />

      <AvailabilityAddEditDialog
        productId={productId}
        availability={availability}
        visible={isAddDialogOpened}
        title={t('products.edit.tab.availability.dialog.titleAdd')}
        label={t('products.edit.tab.availability.dialog.submitEdit')}
        onHide={() => setIsAddDialogOpened(false)}
        onUpdate={() => {
          setRefreshValue()
          setIsAddDialogOpened(false)
        }}
        add={true}
      />
    </div>
  )
}
