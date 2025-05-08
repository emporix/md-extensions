import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import SectionBox from '../shared/SectionBox'
import { Button } from 'primereact/button'
import { Controller, useForm } from 'react-hook-form'
import { useSuppliersApi } from '../../api/suppliers'
import { Supplier } from '../../models/Suppliers'
import { MultiSelect } from 'primereact/multiselect'
import InputField from '../shared/InputField'
import { useProductData } from '../../context/ProductDataProvider'
import { useUIBlocker } from '../../context/UIBlcoker'
import { useSites } from '../../context/SitesProvider'
import { InputText } from 'primereact/inputtext'
import { useDashboardContext } from '../../context/Dashboard.context.tsx'

interface ProductSuppliersProps {
  className: string
}

interface SuppliersForm {
  suppliersIds: string[]
}

const ProductSuppliers = (props: ProductSuppliersProps) => {
  const { className } = props
  const { t } = useTranslation()
  const { currentSite } = useSites()
  const { product } = useProductData()
  const {
    getSuppliers,
    editSuppliersRelatedToProduct,
    getSuppliersRelatedToProduct,
  } = useSuppliersApi()
  const { blockPanel } = useUIBlocker()
  const { reset, control, formState, handleSubmit } = useForm<SuppliersForm>({
    defaultValues: { suppliersIds: [] },
  })
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const { permissions } = useDashboardContext()
  const canBeManaged = permissions?.products?.manager
  const canViewSuppliers = permissions?.suppliers?.viewer
  const canManageSuppliers = permissions?.suppliers?.manager

  const setInitSelectedSuppliers = async () => {
    if (!product.id || !currentSite) return
    const suppliersRelatedToProduct = await getSuppliersRelatedToProduct(
      product.id,
      currentSite.code as string
    )
    const suppliersIds = suppliersRelatedToProduct.map((s: Supplier) => s.id)
    reset({ suppliersIds })
  }

  const editProductSuppliers = async (data: SuppliersForm) => {
    if (!product.id || !currentSite) return
    const mappedSuppliersIds = data.suppliersIds.map((id) => {
      return { id }
    })
    await editSuppliersRelatedToProduct(
      product.id,
      currentSite.code as string,
      mappedSuppliersIds
    )
  }

  const onSubmit = useCallback(
    async (data: SuppliersForm) => {
      blockPanel(true)
      try {
        await editProductSuppliers(data)
        await setInitSelectedSuppliers()
      } catch (e) {
        console.error(e)
      } finally {
        blockPanel(false)
      }
    },
    [formState]
  )

  useEffect(() => {
    reset()
  }, [product])

  useEffect(() => {
    ;(async () => {
      const fetchedSuppliers = await getSuppliers()
      setSuppliers(fetchedSuppliers)
      await setInitSelectedSuppliers()
    })()
  }, [])

  return (
    <div className={`${className}`}>
      <div className="flex justify-content-end align-items-center">
        <Button
          disabled={!formState.isDirty || !canBeManaged || !canManageSuppliers}
          className="p-button-secondary"
          label={t('global.discard')}
          onClick={() => reset()}
        />
        <Button
          className="ml-2"
          disabled={!formState.isDirty || !canBeManaged || !canManageSuppliers}
          label={t('global.save')}
          onClick={handleSubmit(onSubmit)}
        />
      </div>
      <SectionBox name={t('products.edit.tab.suppliers.title')}>
        <div className="grid">
          <InputField
            label={t('products.edit.tab.suppliers.suppliers')}
            name="published"
            className="col-6"
            noInheritance
          >
            {canViewSuppliers ? (
              <Controller
                name="suppliersIds"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    disabled={!canBeManaged || !canManageSuppliers}
                    options={suppliers}
                    optionLabel="name"
                    optionValue="id"
                    value={field.value}
                    filter
                    filterBy="name"
                    onChange={(e) => {
                      field.onChange(e.target.value)
                    }}
                  />
                )}
              />
            ) : (
              <InputText disabled value={t('global.noPermissions')} />
            )}
          </InputField>
        </div>
      </SectionBox>
    </div>
  )
}

ProductSuppliers.defaultProps = {
  className: '',
}

export default ProductSuppliers
