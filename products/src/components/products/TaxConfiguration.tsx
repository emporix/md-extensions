import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DataTable,
  type DataTableColumnProps,
  Dropdown,
  InputText,
  PrimaryButton,
  SecondaryButton,
  SectionBox,
  SectionTitle,
  useToast,
} from '@emporix/component-library'
import { ProductTaxClasses } from '../../models/Category.model'
import { useCountries } from '../../hooks/useCountries'
import usePagination from '../../hooks/usePagination'
import { useTaxesApi } from '../../hooks/api/taxes'
import { Tax } from '../../models/Taxes.model'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import TaxConfigurationTableActions from './TaxConfigurationTableActions'
import { useTranslation } from 'react-i18next'
import { useProductsApi } from '../../hooks/api/products'
import { useParams } from 'react-router'
import { useUIBlocker } from '../../context/UIBlocker'
import useForm from '../../hooks/useForm'
import { useProductData } from '../../context/ProductDataProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import styles from './TaxConfiguration.module.scss'

type TaxConfigurationProps = {
  readonly productTaxClasses?: ProductTaxClasses
}

interface TableTax {
  countryCode: string
  taxClassCode: string
}

type ApiError = {
  response: { data: { message: string; details: string[] } }
}

const dropdownBodyTemplate = (
  value: string,
  dropdownOptions: { label: string; value: string; disabled?: boolean }[],
  rowIndex: number,
  field: string,
  handleTaxChange: (value: string, rowIndex: number, field: string) => void,
  placeholder: string,
  disabled: boolean
) => {
  return (
    <Dropdown
      disabled={disabled}
      options={dropdownOptions}
      optionDisabled="disabled"
      value={value}
      placeholder={placeholder}
      onChange={(ev) => handleTaxChange(ev.value as string, rowIndex, field)}
    />
  )
}

const actionsBodyTemplate = (
  countryCode: string,
  handleTableTaxDelete: (countryCode: string) => void,
  managerPermission: boolean
) => {
  return (
    <TaxConfigurationTableActions
      managerPermission={managerPermission}
      onDelete={() => handleTableTaxDelete(countryCode)}
    />
  )
}

const TaxConfiguration = ({ productTaxClasses }: TaxConfigurationProps) => {
  const { i18n, t } = useTranslation()
  const { id } = useParams()
  const { showToast, showError } = useToast()
  const { getContentLangValue } = useLocalizedValue()
  const { countriesDropdownOptions } = useCountries()
  const { getAllTaxesPaginated } = useTaxesApi()
  const { patchProduct } = useProductsApi()
  const { paginationParams } = usePagination({ rows: 1000, first: 0 })
  const { refreshData } = useProductData()
  const { blockPanel } = useUIBlocker()
  const { formData, setFormData, setFormField } = useForm<{
    taxClasses: ProductTaxClasses
    id: string
  }>()
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [tableTaxes, setTableTaxes] = useState<TableTax[]>([])

  const { hasPermission } = usePermissions()
  const canManage =
    hasPermission(EmployeeDomains.PRODUCTS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_PRODUCTS_MANAGER)
  const canViewTaxes = hasPermission(EmployeeDomains.TAXES_VIEWER)
  const canEdit = Boolean(canManage && canViewTaxes)
  const ActionButton = canEdit ? PrimaryButton : SecondaryButton

  useEffect(() => {
    if (canViewTaxes) {
      ;(async () => {
        const { values } = await getAllTaxesPaginated(paginationParams)
        setTaxes(values)
      })()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity (load once)
  }, [])

  useEffect(() => {
    if (productTaxClasses) {
      const tableValues = Object.entries(productTaxClasses).map(
        ([countryCode, taxClassCode]) => ({
          countryCode,
          taxClassCode,
        })
      )
      setTableTaxes(tableValues)
    }
    setFormData({ taxClasses: productTaxClasses, id })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [productTaxClasses])

  const saveTaxClasses = useCallback(async () => {
    try {
      if (formData.id) {
        blockPanel(true)
        if (!formData.taxClasses) {
          await patchProduct({ ...formData, taxClasses: {} })
        } else {
          await patchProduct(formData)
        }

        await refreshData()
        showToast(
          t('products.edit.tab.prices.toast.taxClassEditSuccess'),
          '',
          'success'
        )
      }
    } catch (e) {
      const { response } = e as ApiError
      const errorTitle = response.data.message
      const errorDetails = response.data.details.join(', ')
      showError(errorTitle, errorDetails)
    } finally {
      blockPanel(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [formData])

  const taxCountriesDropdownOptions = useMemo(() => {
    const taxCountryCodes = taxes.map((tax) => tax.location.countryCode)
    const tableTaxesCountryCodes = tableTaxes.map((tax) => tax.countryCode)
    const allTaxesDropdownOptions =
      countriesDropdownOptions?.filter((countryItem) =>
        taxCountryCodes?.includes(countryItem.value)
      ) ?? []

    if (tableTaxesCountryCodes.length) {
      return allTaxesDropdownOptions.map((countryItem) => {
        return {
          ...countryItem,
          disabled: tableTaxesCountryCodes.includes(countryItem.value),
        }
      })
    }

    return allTaxesDropdownOptions
  }, [taxes, countriesDropdownOptions, tableTaxes])

  const taxClassesDropdownOptions = useCallback(
    (locationCode: string) => {
      const tax = taxes.find((tax) => tax.location.countryCode === locationCode)
      return (
        tax?.taxClasses.map((taxClass) => ({
          label: `${tax.location.countryCode} - ${getContentLangValue(
            taxClass.name
          )}`,
          value: taxClass.code,
        })) ?? []
      )
    },
    [taxes, getContentLangValue]
  )

  const addTax = () => {
    setTableTaxes((prevState) => {
      prevState.push({ countryCode: '', taxClassCode: '' })
      return [...prevState]
    })
  }

  const handleProductTaxClassesForm = useCallback(() => {
    const productTaxClasses: ProductTaxClasses = {}
    tableTaxes.forEach((tax) => {
      productTaxClasses[tax.countryCode] = tax.taxClassCode
    })
    setFormField(`taxClasses`, productTaxClasses)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [tableTaxes])

  const handleTaxChange = (value: string, rowIndex: number, field: string) => {
    if (field === 'countryCode') {
      const rowNewData = { countryCode: value, taxClassCode: '' }
      setTableTaxes((prevState) => {
        prevState[rowIndex] = rowNewData
        return [...prevState]
      })
    } else if (field === 'taxClassCode') {
      setTableTaxes((prevState) => {
        prevState[rowIndex].taxClassCode = value
        return [...prevState]
      })
    }
    handleProductTaxClassesForm()
  }

  const handleTableTaxDelete = (countryCode: string) => {
    const filteredTableTaxes = tableTaxes.filter(
      (tax) => tax.countryCode !== countryCode
    )
    setTableTaxes(filteredTableTaxes)

    const filteredProductTaxClasses: ProductTaxClasses = {}
    filteredTableTaxes.forEach((tax) => {
      filteredProductTaxClasses[tax.countryCode] = tax.taxClassCode
    })
    setFormField('taxClasses', filteredProductTaxClasses)
  }

  const columns = useMemo<DataTableColumnProps[]>(
    () => [
      {
        columnKey: 'countryCode',
        field: 'countryCode',
        header: t('products.edit.tab.prices.columns.country'),
        body: (tax: TableTax, options) =>
          dropdownBodyTemplate(
            tax.countryCode,
            taxCountriesDropdownOptions,
            options.rowIndex,
            options.field,
            handleTaxChange,
            t('products.edit.tab.prices.form.selectTaxCountry'),
            !canManage
          ),
      },
      {
        columnKey: 'taxClassCode',
        field: 'taxClassCode',
        header: t('products.edit.tab.prices.columns.taxClass'),
        body: (tax: TableTax, options) =>
          dropdownBodyTemplate(
            tax.taxClassCode,
            taxClassesDropdownOptions(tax.countryCode),
            options.rowIndex,
            options.field,
            handleTaxChange,
            t('products.edit.tab.prices.form.selectTaxClass'),
            !canManage
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [
      i18n.language,
      tableTaxes,
      taxCountriesDropdownOptions,
      taxClassesDropdownOptions,
    ]
  )

  const rowActions = useCallback(
    (tax: TableTax) =>
      actionsBodyTemplate(tax.countryCode, handleTableTaxDelete, canManage),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [i18n.language, tableTaxes, canManage]
  )

  return (
    <>
      <SectionTitle
        className={styles.title}
        name={t('products.edit.tab.prices.taxTitle')}
        actions={
          <>
            <ActionButton disabled={!canEdit} onClick={addTax}>
              {t('global.addTaxClass')}
            </ActionButton>
            <ActionButton
              disabled={!canEdit}
              className={styles.saveButton}
              onClick={saveTaxClasses}
            >
              {t('products.edit.tab.prices.form.saveTaxClasses')}
            </ActionButton>
          </>
        }
      />
      {canViewTaxes ? (
        <DataTable
          value={tableTaxes}
          columns={columns}
          rowActions={rowActions}
          paginator={false}
          showFilter={false}
        />
      ) : (
        <SectionBox className={styles.noPermissions}>
          <InputText readOnly value={t('global.noPermissions')} />
        </SectionBox>
      )}
    </>
  )
}

export default TaxConfiguration
