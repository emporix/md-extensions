import { useCallback, useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { BsPlusSquareFill } from 'react-icons/bs'
import { useTranslation } from 'react-i18next'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { Dialog } from 'primereact/dialog'
import InputField from '../shared/InputField'
import { makeCall } from '../../helpers/api'
import { ProductPrice } from '../../models/Price'
import { usePriceApi } from '../../api/prices'
import ConfirmBox from '../shared/ConfirmBox'
import { useToast } from '../../context/ToastProvider'
import useForm from '../../hooks/useForm.tsx'
import PriceInput from '../shared/PriceInput'
import TableActions from '../shared/TableActions'

/**
 *
 * DEMO PURPOSES ONLY
 */

interface ProductActionProps {
  price: ProductPrice
  existingPrice?: ProductPrice
  siteCode: string
  productId: string
}

interface AddUpdateDialogProps {
  price?: ProductPrice
  existingPrice?: ProductPrice
  productId: string
  siteCode?: string
  title: string
  label: string
  visible: boolean
  onHide: () => void
  onUpdate: () => void
  add: boolean
}

const PriceAddEditDialog = (props: AddUpdateDialogProps) => {
  const { i18n } = useTranslation()
  const [loading, setLoading] = useState(false)
  const { updatePrice, createPrice } = usePriceApi()
  const { formData, setFormData, setFormField } = useForm<ProductPrice>()
  const { setRefreshValue } = useRefresh()

  const onSubmit = useCallback(async () => {
    if (props.add === true) {
      const newPrice: Partial<ProductPrice> = {
        ...props.existingPrice,
        productId: props.productId,
        siteCode: props.siteCode,
        effectiveAmount: formData.effectiveAmount,
      }
      delete newPrice.priceId
      setLoading(true)
      try {
        await createPrice(newPrice, 'v1')
      } catch (error) {
        //NOOP
      } finally {
        setLoading(false)
      }
    } else {
      const partialPrice = {
        effectiveAmount: formData.effectiveAmount,
        priceId: formData.priceId,
      } as Partial<ProductPrice>
      await makeCall<boolean>(() => updatePrice(partialPrice, 'v1'), setLoading)
    }

    setRefreshValue()
    props.onUpdate()
  }, [formData, setRefreshValue, props.onUpdate])

  useEffect(() => {
    if (props.price) {
      setFormData({ ...props.price })
    }
  }, [])

  return (
    <Dialog
      style={{ minWidth: '30vw', maxWidth: '700px' }}
      className="brands-dialog-wrapper"
      header={props.title}
      onHide={props.onHide}
      visible={props.visible}
    >
      <form onSubmit={onSubmit}>
        <InputField label={'Price'}>
          <PriceInput
            value={formData.effectiveAmount}
            onChange={(event: any) =>
              setFormField('effectiveAmount', event.value)
            }
            mode="currency"
            currency={formData.currency || 'EUR'}
            locale={i18n.language}
          />
        </InputField>

        <Button
          className="mt-2"
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

export function PriceActions(props: ProductActionProps) {
  const { productId, existingPrice } = props
  const { t } = useTranslation()
  const [isEditDialogOpened, setIsEditDialogOpened] = useState(false)
  const [isAddDialogOpened, setIsAddDialogOpened] = useState(false)
  const [isDeleteDialogOpened, setIsDeleteDialogOpened] = useState(false)
  const { deletePrice } = usePriceApi()
  const { setRefreshValue } = useRefresh()

  const toast = useToast()

  const deletePriceAction = async () => {
    await deletePrice(props.price.priceId, 'v1')
    toast.showToast(
      'Price deleted',
      'Price was successfully deleted',
      'success'
    )
    setRefreshValue()
  }
  return (
    <div className="flex justify-content-end">
      {props.price.effectiveAmount ? (
        <TableActions
          onEdit={() => setIsEditDialogOpened(true)}
          onDelete={() => setIsDeleteDialogOpened(true)}
        />
      ) : (
        <TableActions
          actions={[
            {
              icon: <BsPlusSquareFill size={16} />,
              onClick: () => setIsAddDialogOpened(true),
            },
          ]}
        />
      )}

      <PriceAddEditDialog
        productId={productId}
        price={props.price}
        visible={isEditDialogOpened}
        title={t('products.edit.tab.prices.dialog.titleAdd')}
        label={t('products.edit.tab.prices.dialog.submitEdit')}
        onHide={() => setIsEditDialogOpened(false)}
        onUpdate={() => {
          setIsEditDialogOpened(false)
        }}
        add={false}
      />

      <PriceAddEditDialog
        productId={productId}
        price={props.price}
        siteCode={props.siteCode}
        existingPrice={existingPrice}
        visible={isAddDialogOpened}
        title={t('products.edit.tab.prices.dialog.titleEdit')}
        label={t('products.edit.tab.prices.dialog.submitEdit')}
        onHide={() => setIsAddDialogOpened(false)}
        onUpdate={() => {
          setIsAddDialogOpened(false)
        }}
        add={true}
      />
      <ConfirmBox
        onReject={() => setIsDeleteDialogOpened(false)}
        visible={isDeleteDialogOpened}
        onAccept={deletePriceAction}
      />
    </div>
  )
}
