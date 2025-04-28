import { useCallback, useEffect, useState } from 'react'
import InputField from '../shared/InputField'
import { Dropdown } from 'primereact/dropdown'
import {
  Attribute,
  Product,
  ProductTemplate,
  ProductTemplateType,
  ProductType,
} from '../../models/Category'
import { useTranslation } from 'react-i18next'
import { useLocalizedValue } from '../../hooks/useLocalizedValue.tsx'
import { useProductsApi } from '../../api/products'
import { PaginationProps } from '../../hooks/usePagination'
import { Controller, useFormContext } from 'react-hook-form'
import { Checkbox } from 'primereact'
import { InputNumber } from 'primereact/inputnumber'
import { Calendar } from 'primereact/calendar'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { BsTrashFill } from 'react-icons/bs'
import { MultiSelect } from 'primereact/multiselect'
import { useParams } from 'react-router'
import { useDashboardContext } from '../../context/Dashboard.context.tsx'

interface ProductAttributesProps {
  product: Partial<Product>
}

export const ProductAttributes = ({ product }: ProductAttributesProps) => {
  const { t } = useTranslation()
  const { control, watch, setValue, getValues } = useFormContext()

  const { permissions } = useDashboardContext()
  const canBeManaged = permissions?.products?.manager

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

  const productTemplateOptionLabel = useCallback(
    (productTemplate: ProductTemplate) => {
      return `${getContentLangValue(productTemplate.name)}`
    },
    []
  )

  const [productTemplatesVersions, setProductTemplateVersions] = useState<
    { value: string; label: string }[]
  >([])

  const { getContentLangValue } = useLocalizedValue()

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
  }, [])

  const calculateProductVariantAttributes = useCallback(
    (productTemplate: ProductTemplate) => {
      const variantAttributes: any = {}
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
  }, [templateVersion, templateId, id])

  const getItemTemplate = (data: ProductTemplate) => {
    return (
      <div className="flex align-items-center">
        {data && data.name ? productTemplateOptionLabel(data) : ''}
      </div>
    )
  }

  const clearTemplate = useCallback(() => {
    setValue('template.id', null)
    setValue('template.version', null)
  }, [])

  return (
    <>
      <div className="grid">
        <InputField
          label={t('products.edit.tab.general.productTemplate')}
          name="template"
          className="col-6"
          required={isOfParentVariantType()}
        >
          <Controller
            name="template.id"
            control={control}
            rules={{ required: isOfParentVariantType() }}
            render={({ field }) => (
              <Dropdown
                disabled={
                  product.productType === ProductType.variant || !canBeManaged
                }
                itemTemplate={getItemTemplate}
                valueTemplate={getItemTemplate}
                onChange={(event) => field.onChange(event.target.value)}
                value={field.value}
                filter
                appendTo="self"
                showClear
                filterBy="filterName"
                optionValue="id"
                optionLabel="id"
                options={productTemplates}
              />
            )}
          />
        </InputField>
        {templateId && (
          <InputField
            label={t('products.edit.tab.general.productTemplateVersion')}
            name="template.version"
            className="col-3 ml-2"
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
                    !canBeManaged
                  }
                  filter
                  showClear
                  appendTo="self"
                  onChange={(event) => field.onChange(event.target.value)}
                  value={field.value}
                  options={productTemplatesVersions}
                />
              )}
            />
          </InputField>
        )}
        {templateId && templateVersion && (
          <div className="col-2 ml-2 align-self-end">
            <Button
              disabled={!canBeManaged}
              onClick={clearTemplate}
              className="p-button-text p-button-icon-only"
            >
              <BsTrashFill size={16} />
            </Button>
          </div>
        )}
      </div>
      {templateId &&
        productType !== ProductType.parentVariant &&
        selectedProductTemplate &&
        selectedProductTemplate.attributes &&
        selectedProductTemplate.attributes
          .filter((attr) => attr.metadata.variantAttribute)
          .map((attribute: Attribute) => (
            <InputField
              className="col-6"
              key={attribute.key}
              label={`${getContentLangValue(attribute.name)} (v)`}
            >
              <Controller
                render={({ field }) => {
                  return (
                    <>
                      <Dropdown
                        disabled={!canBeManaged}
                        value={field.value}
                        key={attribute.key}
                        options={
                          attribute.type === ProductTemplateType.BOOLEAN
                            ? [
                                { value: true, label: 'YES' },
                                { value: false, label: 'NO' },
                              ]
                            : attribute?.values?.map((val) => val.key)
                        }
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </>
                  )
                }}
                name={`mixins.productVariantAttributes.${attribute.key}`}
              />
            </InputField>
          ))}
      {templateId &&
        productType !== ProductType.parentVariant &&
        selectedProductTemplate &&
        selectedProductTemplate.attributes &&
        selectedProductTemplate.attributes
          .filter((attr) => !attr.metadata.variantAttribute)
          .map((attribute: Attribute) => (
            <InputField
              className="col-6"
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
                        options={attribute?.values?.map((val) => val.key)}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    )
                  } else if (attribute.type === ProductTemplateType.BOOLEAN) {
                    return (
                      <Checkbox
                        disabled={!canBeManaged}
                        checked={field.value}
                        key={attribute.key}
                        onChange={(event) =>
                          field.onChange(event.target.checked)
                        }
                      />
                    )
                  } else if (attribute.type === ProductTemplateType.NUMBER) {
                    return (
                      <InputNumber
                        disabled={!canBeManaged}
                        value={field.value}
                        key={attribute.key}
                        onChange={(event) => field.onChange(event.value)}
                      />
                    )
                  } else if (attribute.type === ProductTemplateType.DATETIME) {
                    return (
                      <Calendar
                        disabled={!canBeManaged}
                        value={new Date(field.value)}
                        key={attribute.key}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    )
                  } else {
                    return (
                      <InputText
                        disabled={!canBeManaged}
                        value={field.value}
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
        <div className="col-12 mt-2">
          <div className="my-2">
            {t('products.attributes.willProduceVariants')}
          </div>
          {selectedProductTemplate &&
            selectedProductTemplate.attributes &&
            selectedProductTemplate.attributes
              .filter((attr) => attr.metadata.variantAttribute)
              .map((variantAttribute) => {
                return (
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
                            fieldState.error && t('errors.shared.cantBeBlank')
                          }
                          label={`${getContentLangValue(
                            variantAttribute.name
                          )} (${t(
                            `productTemplates.types.${variantAttribute.type}`
                          )})`}
                          required={
                            variantAttribute.metadata.mandatory || false
                          }
                        >
                          {variantAttribute.values &&
                          !variantAttribute.metadata.mandatory ? (
                            <MultiSelect
                              style={{ width: '300px' }}
                              className="mb-2"
                              options={variantAttribute.values?.map(
                                (x: any) => ({
                                  value: x.key,
                                  label: x.key,
                                })
                              )}
                              disabled={
                                variantAttribute.metadata.mandatory ||
                                false ||
                                !canBeManaged
                              }
                              value={field.value?.map((x: any) => x.key)}
                              onChange={(event) =>
                                field.onChange(
                                  event.value.map((val: string) => ({
                                    key: val,
                                  }))
                                )
                              }
                            />
                          ) : (
                            <div className="mt-2">
                              {variantAttribute.values
                                ?.map((val) => val.key)
                                .join(', ')}
                            </div>
                          )}
                        </InputField>
                      </div>
                    )}
                  />
                )
              })}
        </div>
      )}
    </>
  )
}
