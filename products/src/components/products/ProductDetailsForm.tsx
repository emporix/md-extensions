import { useCallback, useEffect, useState } from 'react'
import {
  AutoComplete,
  Dropdown,
  InputSwitch,
  InputText,
  PrimaryButton,
  SecondaryButton,
  SectionBox,
  useToast,
} from '@emporix/component-library'
import InputField from '../shared/InputField'
import LocalizedInput from '../shared/LocalizedInput'
import { useTranslation } from 'react-i18next'
import { fetchBrands, fetchLabels } from '@emporix/api-calls'
import { deepClone, removeEmptyValues } from '../../helpers/utils'
import { trimCloudinaryImage } from '../../helpers/images'
import { useProductData } from '../../context/ProductDataProvider'
import { useActiveNode } from '../../context/ActiveNodeProvider'
import {
  INHERITABLE_FIELDS,
  snapshotInheritedValues,
  stripInheritedFields,
} from '../../helpers/dynamicVariants/inheritableFields.helpers'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { LocalizedEditor } from '../shared/LocalizedEditor'
import { ProductAttributes } from './ProductAttributes'
import Localized from '../../models/Localized.model'
import { useParams, useSearchParams } from 'react-router'
import { useProductsApi } from '../../hooks/api/products'
import { Product, ProductType } from '../../models/Category.model'
import { useUIBlocker } from '../../context/UIBlocker'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import AssistantBox from './AssistantBox'
import aiIcon from '../../assets/icons/ai.svg'
import aiDisabledIcon from '../../assets/icons/aiDisabled.svg'
import { useConfigurationApi } from '../../hooks/api/configuration'
import { useFeatureToggles } from '../../context/FeatureTogglesProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import { InheritedFieldAddon } from './dynamicVariants/InheritedFieldAddon'
import FormGrid from '../shared/FormGrid'
import FormGridRow from '../shared/FormGridRow'
import { useVendorsApi } from '../../hooks/api/vendors'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import { productDetailPath } from '../../constants/paths'
import styles from './ProductDetailsForm.module.scss'

const AI_ASSISTANT_FEATURE_TOGGLE_NAME = 'DCP_PRODUCT_AI_ASSISTANT'

/** Stand-in for Prime `showClear`: selecting it clears the field (null). */
const CLEAR_OPTION_VALUE = ''

/** Brand / label dropdown option (MD `Option` from LabelChip). */
type ImageOption = {
  id: string
  image: string
  name: string
}

type VendorSuggestion = {
  id: string
  name: string
}

type ImageEntity = {
  id?: string
  name?: string
  image?: string
}

/** MD `helpers/utils` mapBrandToDropdown. */
const mapBrandToDropdown = (brand: ImageEntity): ImageOption => ({
  image: brand.image ? (trimCloudinaryImage(brand.image, 50, 30) ?? '') : '',
  id: brand.id || '',
  name: brand.name || '',
})

/** MD `helpers/utils` mapLabelToDropdown. */
const mapLabelToDropdown = (label: ImageEntity): ImageOption => ({
  image: label.image ? (trimCloudinaryImage(label.image, 30, 30) ?? '') : '',
  id: label.id || '',
  name: label.name || '',
})

/** MD `SharedTemplates` optionTemplate / selectedTemplate. */
const imageOptionTemplate = (option: ImageOption | null) => {
  if (!option?.id) {
    return <span className={styles.emptyOption}>{'\u00A0'}</span>
  }
  return (
    <div className={styles.imageOption}>
      <img
        className={styles.optionImage}
        src={option.image}
        alt={option.name}
      />
      <span>{option.name}</span>
    </div>
  )
}

const getResponseStatus = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } })?.response?.status

export const ProductDetailsForm = () => {
  const { t } = useTranslation()
  const { product, parentProduct, refreshData } = useProductData()
  const {
    setActiveNodeState,
    overriddenFields,
    markOverridden,
    clearOverridden,
    setInheritedValues,
    isAddFlow,
  } = useActiveNode()
  const { createProduct, updateProduct } = useProductsApi()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const siblingIdParam = searchParams.get('siblingId')
  const toast = useToast()
  const methods = useForm<Product>()
  const {
    reset,
    control,
    formState,
    handleSubmit,
    watch,
    setValue,
    resetField: formResetField,
  } = methods
  const { blockPanel } = useUIBlocker()
  const { navigate } = useCustomNavigate()
  const { getSingleConfiguration } = useConfigurationApi()
  const toggles = useFeatureToggles()
  const { getVendors } = useVendorsApi()
  const { hasPermission } = usePermissions()

  const [isAssistantBoxOpened, setIsAssistantBoxOpened] = useState(false)
  const [isAssistantEnabled, setIsAssistantEnabled] = useState(false)
  const [vendors, setVendors] = useState<VendorSuggestion[]>([])
  const [vendorQuery, setVendorQuery] = useState('')
  const [brands, setBrands] = useState<ImageOption[]>([])
  const [labels, setLabels] = useState<ImageOption[]>([])
  const canManage =
    hasPermission(EmployeeDomains.PRODUCTS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_PRODUCTS_MANAGER)
  const canViewVendors = hasPermission(EmployeeDomains.VENDORS_VIEWER)
  const canManagePublishedFlag =
    hasPermission(EmployeeDomains.PRODUCTS_MANAGER) ||
    (hasPermission(VendorDomains.VENDOR_PRODUCT_PUBLISH_MANAGER) &&
      !product?.published) ||
    (hasPermission(VendorDomains.VENDOR_PRODUCT_UNPUBLISH_MANAGER) &&
      product?.published)
  const canManageAssignedVendor = hasPermission(
    EmployeeDomains.PRODUCTS_MANAGER
  )
  const vendor = watch('vendor')
  const name = watch('name')
  const code = watch('code')
  const published = watch('published')
  const dynamicVariantType = watch('dynamicVariantType')
  const sellable = watch('sellable')
  const brandId = watch('brandId')
  const labelIds = watch('labelIds')
  const description = watch('description')

  const initializeForm = useCallback(() => {
    reset(product)
    clearOverridden()
    if (product?.productType !== ProductType.dynamicVariant) {
      return
    } else if (isAddFlow) {
      if (parentProduct) {
        setInheritedValues(snapshotInheritedValues(parentProduct))
      }
      if (siblingIdParam) {
        // Add sibling: mark overridden fields from the sibling's metadata
        const siblingOverridden = product.metadata?.overridden ?? []
        for (const field of INHERITABLE_FIELDS) {
          if (siblingOverridden.includes(field)) {
            markOverridden(field)
          }
        }
      }
      // Add child: no markOverridden — all inheritable fields will be
      // stripped on save unless the user modifies them
    } else {
      if (parentProduct) {
        setInheritedValues(snapshotInheritedValues(parentProduct))
      }
      const metadataOverridden = product.metadata?.overridden ?? []
      for (const field of INHERITABLE_FIELDS) {
        if (metadataOverridden.includes(field)) {
          markOverridden(field)
        }
      }
    }
  }, [
    product,
    parentProduct,
    isAddFlow,
    siblingIdParam,
    reset,
    clearOverridden,
    setInheritedValues,
    markOverridden,
  ])

  useEffect(() => {
    initializeForm()
  }, [initializeForm])

  // Track changes to inheritable fields → mark as overridden
  useEffect(() => {
    if (product?.productType !== ProductType.dynamicVariant) return
    const dirtyFields = formState.dirtyFields
    for (const field of INHERITABLE_FIELDS) {
      if (dirtyFields[field]) {
        markOverridden(field)
      }
    }
  }, [
    name,
    published,
    sellable,
    brandId,
    labelIds,
    description,
    formState.dirtyFields,
    product?.productType,
    markOverridden,
  ])

  // Sync form fields → activeNodeState for live tree preview
  useEffect(() => {
    setActiveNodeState((prev) => ({
      ...prev,
      name: name,
      code: typeof code === 'string' ? code : undefined,
      published: !!published,
      sellable: !!sellable,
      dynamicVariantType:
        typeof dynamicVariantType === 'string'
          ? dynamicVariantType.trim() || undefined
          : undefined,
    }))
  }, [name, code, published, sellable, dynamicVariantType, setActiveNodeState])

  useEffect(() => () => setActiveNodeState({}), [setActiveNodeState])

  useEffect(() => {
    if (!vendor) {
      setVendorQuery('')
    } else {
      setVendorQuery(vendor.name ?? '')
    }
  }, [vendor])

  useEffect(() => {
    ;(async () => {
      try {
        const openAiToken = await getSingleConfiguration('openAiApiToken')
        setIsAssistantEnabled(Boolean(openAiToken?.value))
      } catch {
        return null
      }
    })()
  }, [getSingleConfiguration])

  useEffect(() => {
    ;(async () => {
      loadVendors()
      const { values: brands } = await fetchBrands()
      setBrands(brands.map((brand) => mapBrandToDropdown(brand)))
      const { values: labels } = await fetchLabels()
      setLabels(labels.map((label) => mapLabelToDropdown(label)))
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity: load vendors, brands and labels once on mount
  }, [])

  const loadVendors = async (searchQuery?: string) => {
    try {
      const pagination = { currentPage: 1, rows: 100 }
      const params = searchQuery ? { name: `(~${searchQuery})` } : undefined
      const data = await getVendors(pagination, params)
      setVendors(
        data.values.map((vendor) => ({ id: vendor.id, name: vendor.name }))
      )
    } catch (e: unknown) {
      console.error(e)
    }
  }

  const createProductCall = useCallback(
    async (data: Partial<Product>) => {
      blockPanel(true)
      try {
        let payload = deepClone(data)
        if (data.productType === ProductType.dynamicVariant) {
          delete payload.variants
          delete payload.template
          delete payload.inheritedVariantAttributes
          delete payload.metadata?.overridden
          if (data.parentVariantId) {
            const isChildFlow = !siblingIdParam
            payload = stripInheritedFields(data, overriddenFields, isChildFlow)
          }
        }
        const { id } = await createProduct(payload)
        navigate(productDetailPath(id))
      } catch (error: unknown) {
        console.error(error)
        const status = getResponseStatus(error)
        if (status === 400) {
          toast.showError(t('products.toast.errorCreateValidation'), '')
          return
        }
        if (status === 409) {
          toast.showError(t('products.toast.errorCreateConflict'), '')
          return
        }
        toast.showError(t('products.toast.errorCreateInternal'), '')
      } finally {
        blockPanel(false)
      }
    },
    [
      overriddenFields,
      siblingIdParam,
      blockPanel,
      createProduct,
      navigate,
      t,
      toast,
    ]
  )

  const productType = watch('productType')
  const productName = watch('name')
  const productDescription = watch('description')

  const updateProductCall = useCallback(
    async (originalData: Partial<Product>) => {
      let data = deepClone(originalData)
      blockPanel(true)
      try {
        if (data.productType === ProductType.variant && data.metadata) {
          const dirtyFields = formState.dirtyFields
          const newOverridden = [...Object.keys(dirtyFields)]
          if (data.metadata.overridden) {
            newOverridden.push(...data.metadata.overridden)
          }
          data.metadata.overridden = [...newOverridden]
          delete data.template
        }
        if (product.productType === ProductType.dynamicVariant) {
          delete data.template
          delete data.inheritedVariantAttributes
          delete data.variants
          delete data.metadata?.overridden
          if (data.parentVariantId) {
            data = stripInheritedFields(data, overriddenFields)
          }
        }
        delete data?.metadata?.createdAt
        delete data?.metadata?.modifiedAt
        const payload = removeEmptyValues(data)
        await updateProduct(payload)
        toast.showToast(t('products.edit.toast.update.success'), '', 'success')
        refreshData()
      } catch (error: unknown) {
        console.error(error)
        const status = getResponseStatus(error)
        if (status === 400) {
          toast.showError(t('products.toast.errorUpdateValidation'), '')
          return
        }
        if (status === 409) {
          toast.showError(t('products.toast.errorUpdateConflict'), '')
          return
        }
        toast.showError(t('products.toast.errorUpdateInternal'), '')
      } finally {
        blockPanel(false)
      }
    },
    [
      formState,
      overriddenFields,
      product?.productType,
      refreshData,
      blockPanel,
      t,
      toast,
      updateProduct,
    ]
  )

  const brandOptions: ImageOption[] = [
    { id: CLEAR_OPTION_VALUE, image: '', name: '' },
    ...brands,
  ]

  return (
    <FormProvider {...methods}>
      <SectionBox
        className={styles.generalSection}
        name={t('products.edit.tab.general.information')}
        actions={
          <div className={styles.actions}>
            <SecondaryButton disabled={!canManage} onClick={initializeForm}>
              {t('global.discard')}
            </SecondaryButton>
            {isAssistantEnabled &&
              toggles.isToggleValid(AI_ASSISTANT_FEATURE_TOGGLE_NAME) && (
                <PrimaryButton
                  disabled={!canManage}
                  onClick={() => setIsAssistantBoxOpened(true)}
                  loading={false}
                  className={styles.assistantButton}
                >
                  <img
                    src={canManage ? aiIcon : aiDisabledIcon}
                    alt="Assistant"
                    height={27}
                    className={styles.assistantIcon}
                  />
                  <span>{t('products.actions.assistant.title')}</span>
                </PrimaryButton>
              )}
            {id ? (
              <PrimaryButton
                disabled={
                  !formState.isValid || !formState.isDirty || !canManage
                }
                onClick={handleSubmit(updateProductCall)}
              >
                {t('global.save')}
              </PrimaryButton>
            ) : (
              <PrimaryButton
                disabled={
                  !formState.isValid || !formState.isDirty || !canManage
                }
                onClick={handleSubmit(createProductCall)}
              >
                {t('global.create')}
              </PrimaryButton>
            )}
          </div>
        }
      >
        <FormGrid>
          <FormGridRow>
            {product.media?.[0] && (
              <InputField
                label={t('products.edit.tab.general.image')}
                className={styles.col12}
              >
                <img
                  className={styles.productImage}
                  src={product.media[0].url ?? ''}
                  alt={product.media[0].url ?? ''}
                />
              </InputField>
            )}
          </FormGridRow>

          <FormGridRow>
            <InputField
              label={t('products.edit.tab.general.published')}
              name="published"
              className={styles.col12}
              addon={
                <InheritedFieldAddon
                  fieldName="published"
                  resetField={formResetField}
                />
              }
            >
              <Controller
                name="published"
                control={control}
                render={({ field }) => (
                  <InputSwitch
                    disabled={!canManagePublishedFlag}
                    checked={field.value || false}
                    onChange={(e) => field.onChange(e.value)}
                  />
                )}
              />
            </InputField>
          </FormGridRow>

          <FormGridRow>
            <InputField
              label={t('products.edit.tab.general.id')}
              tooltip={t('products.edit.tab.general.tooltip.id')}
              name="id"
              className={styles.col6}
            >
              <Controller
                name="id"
                control={control}
                render={({ field }) => (
                  <InputText
                    inputId="id"
                    readOnly={!canManage || id !== undefined}
                    data-test-id="product-id"
                    onChange={(val) => field.onChange(val)}
                    value={field.value || ''}
                  />
                )}
              />
            </InputField>
            <InputField
              label={t('products.edit.tab.general.code')}
              name="code"
              className={styles.col6}
              noInheritance={true}
              required={true}
            >
              <Controller
                name="code"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <InputText
                    inputId="code"
                    readOnly={productType === ProductType.variant || !canManage}
                    data-test-id="product-code"
                    onChange={(val) => field.onChange(val)}
                    value={field.value || ''}
                  />
                )}
              />
            </InputField>
          </FormGridRow>

          <FormGridRow>
            <InputField
              label={t('products.edit.tab.general.name')}
              name="name"
              required={true}
              className={styles.col6}
              addon={
                <InheritedFieldAddon
                  fieldName="name"
                  resetField={formResetField}
                />
              }
            >
              <Controller
                name="name"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <LocalizedInput
                    inputId="name"
                    displayOnly={!canManage}
                    onChange={(val) => field.onChange(val)}
                    value={(field.value as Localized) || {}}
                  />
                )}
              />
            </InputField>
            <InputField
              label={t('products.edit.tab.general.weightDependent')}
              name="weightDependent"
              className={styles.col6}
              tooltip={t('products.edit.tab.general.tooltip.weightDependent')}
            >
              <Controller
                name="weightDependent"
                control={control}
                render={({ field }) => (
                  <InputSwitch
                    disabled={productType === ProductType.variant || !canManage}
                    checked={field.value || false}
                    onChange={(e) => field.onChange(e.value)}
                  />
                )}
              />
            </InputField>
          </FormGridRow>

          <FormGridRow>
            <InputField
              label={t('products.edit.tab.general.description')}
              name="description"
              className={styles.col12}
              addon={
                <InheritedFieldAddon
                  fieldName="description"
                  resetField={formResetField}
                />
              }
            >
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <LocalizedEditor
                    disabled={!canManage}
                    dataTestId="product-description"
                    onChange={(val) => field.onChange(val)}
                    value={(field.value as Localized) || {}}
                  />
                )}
              />
            </InputField>
          </FormGridRow>

          <FormGridRow>
            <InputField
              label={t('products.edit.tab.general.brand')}
              name="brandId"
              className={styles.col6}
              addon={
                <InheritedFieldAddon
                  fieldName="brandId"
                  resetField={formResetField}
                />
              }
            >
              <Controller
                name="brandId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    inputId="brandId"
                    disabled={!canManage}
                    value={field.value || undefined}
                    options={brandOptions}
                    onChange={(e) => {
                      field.onChange(
                        e.value === CLEAR_OPTION_VALUE ? null : e.value
                      )
                    }}
                    optionValue="id"
                    optionLabel="name"
                    placeholder=""
                    filter
                    valueTemplate={imageOptionTemplate}
                    itemTemplate={imageOptionTemplate}
                  />
                )}
              />
            </InputField>
            <InputField
              label={t('products.edit.tab.general.label')}
              name="labelIds"
              className={styles.col6}
              addon={
                <InheritedFieldAddon
                  fieldName="labelIds"
                  resetField={formResetField}
                />
              }
            >
              <Controller
                name="labelIds"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    inputId="labelIds"
                    multiple
                    display="chip"
                    disabled={!canManage}
                    value={field.value ?? []}
                    options={labels}
                    onChange={(e) => {
                      field.onChange(e.value)
                    }}
                    optionLabel="name"
                    optionValue="id"
                    placeholder=""
                    filter
                    itemTemplate={imageOptionTemplate}
                  />
                )}
              />
            </InputField>
          </FormGridRow>

          <FormGridRow>
            <InputField
              label={t('products.edit.tab.general.vendor')}
              name="vendor"
              className={styles.col12}
            >
              <Controller
                name="vendor"
                control={control}
                render={({ field }) => (
                  <AutoComplete
                    inputId="vendor"
                    value={vendorQuery}
                    suggestions={vendors}
                    completeMethod={(e) => loadVendors(e.query)}
                    field="name"
                    dropdown
                    onChange={(e) => {
                      setVendorQuery(e.value)
                      // MD Prime `onClear` fired when the input was emptied
                      if (e.value === '') {
                        field.onChange('')
                      }
                    }}
                    onSelect={(e) => {
                      setVendorQuery(e.value.name)
                      const payload = { id: e.value.id, name: e.value.name }
                      field.onChange(payload)
                    }}
                    disabled={!canManageAssignedVendor}
                    placeholder={
                      !canViewVendors ? t('global.noPermissions') : ''
                    }
                  />
                )}
              />
            </InputField>
          </FormGridRow>
        </FormGrid>

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
