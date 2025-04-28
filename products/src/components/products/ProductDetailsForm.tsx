import { useCallback, useEffect, useState } from 'react'
import SectionBox from '../shared/SectionBox'
import InputField from '../shared/InputField'
import { InputSwitch } from 'primereact/inputswitch'
import { LocalizedInput } from '../shared/LocalizedInput'
import { Option } from './LabelChip'
import { useTranslation } from 'react-i18next'
import { fetchBrands } from '../../api/brands'
import { fetchLabels } from '../../api/labels'
import { mapBrandToDropdown, mapLabelToDropdown } from '../../helpers/utils'
import { useProductData } from '../../context/ProductDataProvider'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { InputText } from 'primereact/inputtext'
import { LocalizedEditor } from '../shared/LocalizedEditor'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact'
import { optionTemplate, selectedTemplate } from '../shared/SharedTemplates'
import { MultiSelect } from 'primereact/multiselect'
import { ProductAttributes } from './ProductAttributes'
import Localized from '../../models/Localized'
import { useParams } from 'react-router'
import { useProductsApi } from '../../api/products'
import { Product, ProductType } from '../../models/Category'
import { useUIBlocker } from '../../context/UIBlcoker'
import useCustomNavigate from '../../hooks/useCustomNavigate.tsx'
import AssistantBox from './AssistantBox'
import aiIcon from '../../../assets/icons/ai.svg'
import aiDisabledIcon from '../../../assets/icons/aiDisabled.svg'
import { useConfigurationApi } from '../../api/configuration'
import { useToast } from '../../context/ToastProvider'
import { useDashboardContext } from '../../context/Dashboard.context.tsx'

export const ProductDetailsForm = () => {
  const { t } = useTranslation()
  const { product, refreshData } = useProductData()
  const { createProduct, updateProduct } = useProductsApi()
  const { id } = useParams()
  const toast = useToast()
  const methods = useForm<Product>()
  const { blockPanel } = useUIBlocker()
  const { navigate } = useCustomNavigate()
  const [isAssistantBoxOpened, setIsAssistantBoxOpened] = useState(false)
  const { getSingleConfiguration } = useConfigurationApi()
  const [isAssistantEnabled, setIsAssistantEnabled] = useState(false)
  const { permissions } = useDashboardContext()
  const canBeManaged = permissions?.products?.manager

  useEffect(() => {
    reset(product)
  }, [product])

  useEffect(() => {
    ;(async () => {
      try {
        const openAiToken = await getSingleConfiguration('openAiApiToken')
        setIsAssistantEnabled(openAiToken && openAiToken.value)
      } catch (ex) {
        return null
      }
    })()
  }, [])

  const { reset, control, formState, handleSubmit, watch, setValue } = methods
  const [brands, setBrands] = useState<Option[]>([])
  const [labels, setLabels] = useState<Option[]>([])

  useEffect(() => {
    ;(async () => {
      const brands = await fetchBrands()
      setBrands(brands.map((brand) => mapBrandToDropdown(brand)))
      const labels = await fetchLabels()
      setLabels(labels.map((label) => mapLabelToDropdown(label)))
    })()
  }, [])

  const createProductCall = useCallback(async (data: Partial<Product>) => {
    blockPanel(true)
    try {
      const { id } = await createProduct(data)
      navigate(` products/${id}`)
    } catch (error: any) {
      console.error(error)
      if (error.response.status === 400) {
        toast.showError(t('products.toast.errorCreateValidation'), '')
        return
      }
      if (error.response.status == 409) {
        toast.showError(t('products.toast.errorCreateConflict'), '')
        return
      }
      toast.showError(t('products.toast.errorCreateInternal'), '')
    } finally {
      blockPanel(false)
    }
  }, [])

  const productType = watch('productType')
  const productName = watch('name')
  const productDescription = watch('description')

  const updateProductCall = useCallback(
    async (data: Partial<Product>) => {
      blockPanel(true)
      try {
        if (data.productType === ProductType.variant && data.metadata) {
          const dirtyFields = formState.dirtyFields
          const newOverridden = [...Object.keys(dirtyFields)]
          if (data.metadata.overridden) {
            newOverridden.push(...data.metadata.overridden)
          }
          data.metadata.overridden = [...newOverridden]
          await updateProduct(data)
        } else {
          await updateProduct(data)
        }
        refreshData()
      } catch (error: any) {
        console.error(error)
        if (error.response.status === 400) {
          toast.showError(t('products.toast.errorUpdateValidation'), '')
          return
        }
        if (error.response.status == 409) {
          toast.showError(t('products.toast.errorUpdateConflict'), '')
          return
        }
        toast.showError(t('products.toast.errorUpdateInternal'), '')
      } finally {
        blockPanel(false)
      }
    },
    [formState]
  )

  return (
    <FormProvider {...methods}>
      <div className="flex justify-content-end align-items-center">
        <Button
          disabled={!canBeManaged}
          className="p-button-secondary"
          label={t('global.discard')}
          onClick={() => reset()}
        />
        {isAssistantEnabled && (
          <Button
            disabled={!canBeManaged}
            onClick={() => setIsAssistantBoxOpened(true)}
            loading={false}
            className={
              canBeManaged
                ? 'p-button-primary ml-2'
                : 'p-button p-button-secondary ml-2'
            }
            style={{ paddingTop: '2px', paddingBottom: '2px' }}
          >
            <img
              src={canBeManaged ? aiIcon : aiDisabledIcon}
              alt="Assistant"
              height={27}
              className="mr-2"
            />
            <span>{t('products.actions.assistant.title')}</span>
          </Button>
        )}
        {id ? (
          <Button
            disabled={!formState.isValid || !formState.isDirty || !canBeManaged}
            className={
              canBeManaged ? 'ml-2' : 'p-button p-button-secondary ml-2'
            }
            label={t('global.save')}
            onClick={handleSubmit(updateProductCall)}
          />
        ) : (
          <Button
            className={
              canBeManaged ? 'ml-2' : 'p-button p-button-secondary mr-2'
            }
            disabled={!formState.isValid || !formState.isDirty || !canBeManaged}
            label={t('global.create')}
            onClick={handleSubmit(createProductCall)}
          />
        )}
      </div>

      <SectionBox
        className="mb-6"
        name={t('products.edit.tab.general.information')}
      >
        <div className={'grid'}>
          {product.media && product.media[0] && (
            <InputField
              label={t('products.edit.tab.general.image')}
              className={'mb-3 col-12'}
            >
              <img
                style={{ maxWidth: '100px', height: 'auto' }}
                src={
                  product.media && product.media[0] ? product.media[0].url : ''
                }
                alt={
                  product.media && product.media[0] ? product.media[0].url : ''
                }
              />
            </InputField>
          )}

          <InputField
            label={t('products.edit.tab.general.published')}
            name="published"
            className={'mb-3 col-6'}
          >
            <Controller
              name="published"
              control={control}
              render={({ field }) => (
                <InputSwitch
                  disabled={!canBeManaged}
                  checked={field.value || false}
                  onChange={(e) => field.onChange(e.value)}
                />
              )}
            />
          </InputField>
          <InputField
            label={t('products.edit.tab.general.id')}
            tooltip={t('products.edit.tab.general.tooltip.id')}
            name="id"
            className={'mb-3 col-6'}
          >
            <Controller
              name="id"
              control={control}
              render={({ field }) => (
                <InputText
                  disabled={!canBeManaged || id !== undefined}
                  data-test-id="product-id"
                  onChange={(val) => field.onChange(val)}
                  value={field.value || undefined}
                />
              )}
            />
          </InputField>
          <InputField
            label={t('products.edit.tab.general.name')}
            name="name"
            required={true}
            className={'mb-3 col-6'}
          >
            <Controller
              name="name"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <LocalizedInput
                  dataTestId="product-name"
                  displayOnly={!canBeManaged}
                  onChange={(val) => field.onChange(val)}
                  value={(field.value as Localized) || {}}
                />
              )}
            />
          </InputField>

          <InputField
            label={t('products.edit.tab.general.code')}
            name="code"
            className={'mb-3 col-6'}
            noInheritance={true}
            required={true}
          >
            <Controller
              name="code"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <InputText
                  disabled={
                    productType === ProductType.variant || !canBeManaged
                  }
                  data-test-id="product-code"
                  onChange={(val) => field.onChange(val)}
                  value={field.value || ''}
                />
              )}
            />
          </InputField>
          <InputField
            label={t('products.edit.tab.general.description')}
            name="description"
            className={'mb-3 col-6'}
          >
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <LocalizedEditor
                  disabled={!canBeManaged}
                  dataTestId="product-description"
                  data-test-id="product-description"
                  onChange={(val) => field.onChange(val)}
                  value={(field.value as Localized) || {}}
                />
              )}
            />
          </InputField>
          <InputField
            label={t('products.edit.tab.general.brand')}
            name="brandId"
            className={'mb-3 col-6'}
          >
            <Controller
              name="brandId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  disabled={!canBeManaged}
                  value={field.value || ''}
                  options={brands}
                  onChange={(e) => {
                    field.onChange(e.value)
                  }}
                  optionValue="id"
                  optionLabel="name"
                  filter
                  showClear
                  appendTo="self"
                  filterBy="name"
                  placeholder={t('products.edit.tab.general.brandPlaceholder')}
                  valueTemplate={selectedTemplate}
                  itemTemplate={optionTemplate}
                />
              )}
            />
          </InputField>
          <InputField
            label={t('products.edit.tab.general.label')}
            name="labelIds"
            className={'mb-3 col-6'}
          >
            <Controller
              name="labelIds"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  disabled={!canBeManaged}
                  value={field.value || ''}
                  options={labels}
                  onChange={(e) => {
                    field.onChange(e.value)
                  }}
                  optionLabel="name"
                  optionValue="id"
                  filter
                  showClear
                  appendTo="self"
                  filterBy="name"
                  placeholder={t('products.edit.tab.general.labelPlaceholder')}
                  itemTemplate={optionTemplate}
                />
              )}
            />
          </InputField>
          <InputField
            label={t('products.edit.tab.general.weightDependent')}
            name="weightDependent"
            className={'mb-3 col-6'}
            tooltip={t('products.edit.tab.general.tooltip.weightDependent')}
          >
            <Controller
              name="weightDependent"
              control={control}
              render={({ field }) => (
                <InputSwitch
                  disabled={
                    productType === ProductType.variant || !canBeManaged
                  }
                  checked={field.value || false}
                  onChange={(e) => field.onChange(e.value)}
                />
              )}
            />
          </InputField>
        </div>
        <AssistantBox
          productName={productName}
          productDescription={productDescription}
          visible={isAssistantBoxOpened}
          onReject={() => {
            setIsAssistantBoxOpened(false)
          }}
          onAccept={(description: Localized | undefined) => {
            setValue('description', description, { shouldDirty: true })
            setIsAssistantBoxOpened(false)
          }}
        />
      </SectionBox>

      <SectionBox name={t('products.edit.tab.general.attributes')}>
        <ProductAttributes product={product} />
      </SectionBox>
    </FormProvider>
  )
}
