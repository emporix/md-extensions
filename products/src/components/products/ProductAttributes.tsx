import { useCallback, useEffect, useMemo, useState } from 'react'
import InputField from '../shared/InputField'
import {
  Calendar,
  Checkbox,
  Dropdown,
  InputNumber,
  InputText,
  SecondaryButton,
} from '@emporix/component-library'
import {
  Attribute,
  AttributeValue,
  Product,
  ProductTemplate,
  ProductTemplateType,
  ProductType,
} from '../../models/Category.model'
import { useTranslation } from 'react-i18next'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useProductsApi } from '../../hooks/api/products'
import { PaginationProps } from '../../hooks/usePagination'
import { Controller, useFormContext } from 'react-hook-form'
import { BsTrashFill } from 'react-icons/bs'
import { usePermissions } from '../../context/PermissionsProvider'
import { useParams } from 'react-router'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import DynamicVariantAttributes from './dynamicVariants/DynamicVariantAttributes'
import styles from './ProductAttributes.module.scss'

/** Stand-in for Prime `showClear`: selecting it clears the field (null). */
const CLEAR_OPTION_VALUE = ''

type AttributeOption = { value: string | boolean; label: string }

const BOOLEAN_OPTIONS: AttributeOption[] = [
  { value: true, label: 'YES' },
  { value: false, label: 'NO' },
]

const renderOptionLabel = (option: { label?: string }) =>
  option.label || '\u00A0'

interface ProductAttributesProps {
  product: Partial<Product>
}

export const ProductAttributes = ({ product }: ProductAttributesProps) => {
  const { t } = useTranslation()
  const { control, watch, setValue, getValues } = useFormContext()

  const { hasPermission } = usePermissions()
  const canManage =
    hasPermission(EmployeeDomains.PRODUCTS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_PRODUCTS_MANAGER)

  const [willProduceVariants, setWillProduceVariants] = useState(false)

  const templateId = watch('template.id')
  const templateVersion = watch('template.version')
  const productType = watch('productType')
  const id = watch('id')

  const [selectedProductTemplate, setSelectedProductTemplate] =
    useState<ProductTemplate>()

  const { fetchProductTemplates, fetchProductTemplate } = useProductsApi()
  const [productTemplates, setProductTemplates] = useState<ProductTemplate[]>(
    []
  )

  const { type } = useParams()

  const isOfParentVariantType = (): boolean => {
    return (
      type === ProductType.parentVariant ||
      productType === ProductType.parentVariant
    )
  }

  const { getContentLangValue } = useLocalizedValue()

  const productTemplateOptionLabel = useCallback(
    (productTemplate: ProductTemplate) => {
      return `${getContentLangValue(productTemplate.name)}`
    },
    [getContentLangValue]
  )

  const [productTemplatesVersions, setProductTemplateVersions] = useState<
    { value: string; label: string }[]
  >([])

  useEffect(() => {
    ;(async () => {
      if (templateId) {
        const productTemplateWithNewestVersion =
          await fetchProductTemplate(templateId)
        setSelectedProductTemplate(productTemplateWithNewestVersion)
        const availableVersions = Array.from(
          Array(
            productTemplateWithNewestVersion.metadata?.version
              ? productTemplateWithNewestVersion.metadata.version
              : 1
          ),
          (_, x) => x + 1
        )
        const versionDropdownItems = availableVersions.map((version) => ({
          label: `${getContentLangValue(
            productTemplateWithNewestVersion.name
          )} (ver.${version})`,
          value: version.toString(),
        }))
        setProductTemplateVersions(versionDropdownItems)
        if (availableVersions.length === 1) {
          setValue('template.version', 1, {
            shouldTouch: true,
          })
        }
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity: re-run only when the template changes
  }, [templateId])

  useEffect(() => {
    ;(async () => {
      const { values } = await fetchProductTemplates({
        rows: 1000,
        currentPage: 0,
      } as Partial<PaginationProps>)
      setValue('template.id', getValues('template.id'))
      setProductTemplates(values)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity: load templates once on mount
  }, [])

  const calculateProductVariantAttributes = useCallback(
    (productTemplate: ProductTemplate) => {
      const variantAttributes: Record<string, AttributeValue[]> = {}
      productTemplate?.attributes?.forEach((attribute: Attribute) => {
        variantAttributes[attribute.key] = attribute.values
      })
      return variantAttributes
    },
    []
  )

  useEffect(() => {
    ;(async () => {
      if (templateVersion) {
        const productTemplateToSelect = await fetchProductTemplate(
          templateId,
          templateVersion
        )
        if (productTemplateToSelect) {
          if (product.productType === ProductType.parentVariant && !id) {
            setValue(
              'variantAttributes',
              calculateProductVariantAttributes(productTemplateToSelect),
              {
                shouldDirty: true,
                shouldTouch: true,
              }
            )
          } else if (product.productType === ProductType.parentVariant && id) {
            const currentVariantAttributes =
              getValues('variantAttributes') || {}
            const newVariantAttributes: Record<string, AttributeValue[]> = {}
            productTemplateToSelect.attributes?.forEach((attr: Attribute) => {
              if (attr.metadata.variantAttribute) {
                const validKeys = new Set(
                  attr.values?.map((v: AttributeValue) => v.key) || []
                )
                const currentValues = currentVariantAttributes[attr.key]
                if (Array.isArray(currentValues)) {
                  newVariantAttributes[attr.key] = currentValues.filter(
                    (v: AttributeValue) => v && validKeys.has(v.key)
                  )
                } else {
                  newVariantAttributes[attr.key] = attr.values
                }
              }
            })
            setValue('variantAttributes', newVariantAttributes, {
              shouldDirty: true,
              shouldTouch: true,
            })
          }
          setSelectedProductTemplate(productTemplateToSelect)
          const willProduceVariants = productTemplateToSelect.attributes?.find(
            (attr) => attr.metadata.variantAttribute
          )
          if (
            willProduceVariants &&
            (getValues('productType') as ProductType) !== ProductType.variant
          ) {
            setWillProduceVariants(true)
            setValue('productType', ProductType.parentVariant)
            setValue('mixins.productVariantAttributes', undefined)
            setValue('mixins.productTemplateAttributes', undefined)
            productTemplateToSelect.attributes?.forEach((attr) => {
              if (attr.metadata.mandatory) {
                setValue(`variantAttributes.${attr.key}`, attr.values)
              }
            })
          } else {
            setWillProduceVariants(false)
          }
        } else {
          setWillProduceVariants(false)
        }
      } else {
        setWillProduceVariants(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity: re-run only on template/version/id change
  }, [templateVersion, templateId, id])

  // MD Dropdown used optionLabel="id" + itemTemplate/valueTemplate showing the
  // content-language name and filterBy="filterName"; CL filters by optionLabel.
  const productTemplateOptions = useMemo(
    () => [
      { id: CLEAR_OPTION_VALUE, label: '' },
      ...productTemplates.map((productTemplate) => ({
        id: productTemplate.id ?? '',
        label: productTemplate.name
          ? productTemplateOptionLabel(productTemplate)
          : '',
      })),
    ],
    [productTemplates, productTemplateOptionLabel]
  )

  const productTemplateVersionOptions = useMemo(
    () => [
      { value: CLEAR_OPTION_VALUE, label: '' },
      ...productTemplatesVersions,
    ],
    [productTemplatesVersions]
  )

  const clearTemplate = useCallback(() => {
    setValue('template.id', null)
    setValue('template.version', null)
  }, [setValue])

  if (
    productType === ProductType.dynamicVariant ||
    product.productType === ProductType.dynamicVariant
  ) {
    return <DynamicVariantAttributes product={product} />
  }

  return (
    <>
      <div className={styles.grid}>
        <InputField
          label={t('products.edit.tab.general.productTemplate')}
          name="template"
          className={styles.col6}
          required={isOfParentVariantType()}
        >
          <Controller
            name="template.id"
            control={control}
            rules={{ required: isOfParentVariantType() }}
            render={({ field }) => (
              <Dropdown
                disabled={
                  product.productType === ProductType.variant || !canManage
                }
                itemTemplate={renderOptionLabel}
                onChange={(event) =>
                  field.onChange(
                    event.value === CLEAR_OPTION_VALUE ? null : event.value
                  )
                }
                value={field.value ?? undefined}
                filter
                optionValue="id"
                optionLabel="label"
                options={productTemplateOptions}
              />
            )}
          />
        </InputField>
        {templateId && (
          <InputField
            label={t('products.edit.tab.general.productTemplateVersion')}
            name="template.version"
            className={styles.versionField}
            required={true}
          >
            <Controller
              name="template.version"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Dropdown
                  disabled={
                    !templateId ||
                    product.productType === ProductType.variant ||
                    !canManage
                  }
                  filter
                  itemTemplate={renderOptionLabel}
                  onChange={(event) =>
                    field.onChange(
                      event.value === CLEAR_OPTION_VALUE ? null : event.value
                    )
                  }
                  value={
                    field.value === null || field.value === undefined
                      ? undefined
                      : String(field.value)
                  }
                  options={productTemplateVersionOptions}
                />
              )}
            />
          </InputField>
        )}
        {templateId && templateVersion && (
          <div className={styles.clearTemplate}>
            <SecondaryButton
              size="small"
              iconOnly
              aria-label={t('global.delete')}
              disabled={!canManage}
              onClick={clearTemplate}
            >
              <BsTrashFill size={16} />
            </SecondaryButton>
          </div>
        )}
      </div>
      {templateId &&
        productType !== ProductType.parentVariant &&
        selectedProductTemplate?.attributes
          ?.filter((attr) => attr.metadata.variantAttribute)
          .map((attribute: Attribute) => (
            <InputField
              className={styles.col6}
              key={attribute.key}
              label={`${getContentLangValue(attribute.name)} (v)`}
            >
              <Controller
                render={({ field }) => (
                  <Dropdown
                    disabled={!canManage}
                    value={field.value}
                    key={attribute.key}
                    options={
                      attribute.type === ProductTemplateType.BOOLEAN
                        ? BOOLEAN_OPTIONS
                        : (attribute.values ?? []).map<AttributeOption>(
                            (val) => ({
                              value: val.key,
                              label: val.key,
                            })
                          )
                    }
                    onChange={(event) => field.onChange(event.value)}
                  />
                )}
                name={`mixins.productVariantAttributes.${attribute.key}`}
              />
            </InputField>
          ))}
      {templateId &&
        productType !== ProductType.parentVariant &&
        selectedProductTemplate?.attributes
          ?.filter((attr) => !attr.metadata.variantAttribute)
          .map((attribute: Attribute) => (
            <InputField
              className={styles.col6}
              key={attribute.key}
              label={getContentLangValue(attribute.name)}
            >
              <Controller
                render={({ field }) => {
                  if (attribute.values && attribute.values.length > 0) {
                    return (
                      <Dropdown
                        value={field.value}
                        key={attribute.key}
                        options={attribute.values.map((val) => ({
                          value: val.key,
                          label: val.key,
                        }))}
                        onChange={(event) => field.onChange(event.value)}
                      />
                    )
                  } else if (attribute.type === ProductTemplateType.BOOLEAN) {
                    return (
                      <Checkbox
                        disabled={!canManage}
                        checked={!!field.value}
                        key={attribute.key}
                        onChange={(event) => field.onChange(event.checked)}
                      />
                    )
                  } else if (attribute.type === ProductTemplateType.NUMBER) {
                    return (
                      <InputNumber
                        readOnly={!canManage}
                        value={field.value}
                        key={attribute.key}
                        onChange={(event) => field.onChange(event.value)}
                      />
                    )
                  } else if (attribute.type === ProductTemplateType.DATETIME) {
                    return (
                      <Calendar
                        disabled={!canManage}
                        value={field.value ? new Date(field.value) : null}
                        key={attribute.key}
                        onChange={(event) => field.onChange(event.value)}
                      />
                    )
                  } else {
                    return (
                      <InputText
                        readOnly={!canManage}
                        value={field.value ?? ''}
                        key={attribute.key}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    )
                  }
                }}
                name={`mixins.productTemplateAttributes.${attribute.key}`}
              />
            </InputField>
          ))}
      {willProduceVariants && selectedProductTemplate && (
        <div className={styles.variantsSection}>
          <div className={styles.variantsTitle}>
            {t('products.attributes.willProduceVariants')}
          </div>
          {selectedProductTemplate.attributes
            ?.filter((attr) => attr.metadata.variantAttribute)
            .map((variantAttribute) => (
              <Controller
                key={variantAttribute.key}
                name={`variantAttributes.${variantAttribute.key}`}
                control={control}
                rules={{
                  required: variantAttribute.metadata.mandatory || false,
                }}
                render={({ field, fieldState }) => (
                  <div>
                    <InputField
                      error={
                        fieldState.error
                          ? t('errors.shared.cantBeBlank')
                          : undefined
                      }
                      label={`${getContentLangValue(
                        variantAttribute.name
                      )} (${t(`productTemplates.types.${variantAttribute.type}`)})`}
                      required={variantAttribute.metadata.mandatory || false}
                    >
                      {variantAttribute.values &&
                      !variantAttribute.metadata.mandatory ? (
                        <Dropdown
                          multiple
                          display="chip"
                          className={styles.variantValues}
                          options={variantAttribute.values.map((x) => ({
                            value: x.key,
                            label: x.key,
                          }))}
                          disabled={
                            variantAttribute.metadata.mandatory ||
                            false ||
                            !canManage
                          }
                          value={(
                            field.value as AttributeValue[] | undefined
                          )?.map((x) => x.key)}
                          onChange={(event) =>
                            field.onChange(
                              (Array.isArray(event.value)
                                ? event.value
                                : []
                              ).map((val) => ({ key: val }))
                            )
                          }
                        />
                      ) : (
                        <div className={styles.mandatoryValues}>
                          {variantAttribute.values
                            ?.map((val) => val.key)
                            .join(', ')}
                        </div>
                      )}
                    </InputField>
                  </div>
                )}
              />
            ))}
        </div>
      )}
    </>
  )
}
