import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from 'primereact/button'
import { ProductTaxClasses } from '../../models/Category'
import { useCountries } from '../../hooks/useCountries.tsx'
import usePagination from '../../hooks/usePagination'
import { useTaxesApi } from '../../api/taxes'
import SectionBox from '../shared/SectionBox'
import { Tax } from '../../models/Taxes'
import { useLocalizedValue } from '../../hooks/useLocalizedValue.tsx'
import { Column, ColumnProps } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dropdown } from 'primereact/dropdown'
import TaxConfigurationTableActions from './TaxConfigurationTableActions'
import { useTranslation } from 'react-i18next'
import { useProductsApi } from '../../api/products'
import { useToast } from '../../context/ToastProvider'
import { useParams } from 'react-router'
import { useUIBlocker } from '../../context/UIBlcoker'
import useForm from '../../hooks/useForm.tsx'
import { useProductData } from '../../context/ProductDataProvider'
import { InputText } from 'primereact/inputtext'
import { useDashboardContext } from '../../context/Dashboard.context.tsx'

interface TaxConfigurationProps {
  productTaxClasses?: ProductTaxClasses
}

interface TableTax {
  countryCode: string
  taxClassCode: string
}

const dropdownBodyTemplate = (
  value: string,
  dropdownOptions: { label: string; value: string }[],
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
      value={value}
      placeholder={placeholder}
      onChange={(ev) => handleTaxChange(ev.value, rowIndex, field)}
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

  const { permissions } = useDashboardContext()
  const canBeManaged = permissions?.products?.manager
  const canViewTaxes = permissions?.taxes?.viewer

  useEffect(() => {
    if (canViewTaxes) {
      ;(async () => {
        const { values } = await getAllTaxesPaginated(paginationParams)
        setTaxes(values)
      })()
    }
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
    } catch (e: any) {
      const errorTitle = e.response.data.message
      const errorDetails = e.response.data.details.join(', ')
      showError(errorTitle, errorDetails)
    } finally {
      blockPanel(false)
    }
  }, [formData])

  const taxCountriesDropdownOptions = useMemo(() => {
    const taxCountryCodes = taxes.map((tax) => tax.location.countryCode)
    const tableTaxesCountryCodes = tableTaxes.map((tax) => tax.countryCode)
    const allTaxesDropdownOptions =
      countriesDropdownOptions?.filter((countryItem) =>
        taxCountryCodes?.includes(countryItem.value)
      ) || []

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
        })) || []
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

  const handleProductTaxClassesForm = useCallback(() => {
    const productTaxClasses: ProductTaxClasses = {}
    tableTaxes.forEach((tax) => {
      productTaxClasses[tax.countryCode] = tax.taxClassCode
    })
    setFormField(`taxClasses`, productTaxClasses)
  }, [tableTaxes])

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

  const columns = useMemo<ColumnProps[]>(
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
            !canBeManaged
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
            !canBeManaged
          ),
      },
      {
        columnKey: 'actions',
        body: (tax: TableTax) =>
          actionsBodyTemplate(
            tax.countryCode,
            handleTableTaxDelete,
            canBeManaged as boolean
          ),
      },
    ],
    [
      i18n.language,
      tableTaxes,
      taxCountriesDropdownOptions,
      taxClassesDropdownOptions,
    ]
  )

  return (
    <>
      <div className="grid grid-nogutter">
        <div className="col-6 module-subtitle mb-5 mt-3">
          {t('products.edit.tab.prices.taxTitle')}
        </div>
        <div className="col-6 flex justify-content-end align-items-center">
          <Button
            disabled={!canBeManaged || !canViewTaxes}
            className={canBeManaged && canViewTaxes ? '' : 'p-button-secondary'}
            type="button"
            onClick={addTax}
          >
            {t('global.addTaxClass')}
          </Button>
          <Button
            disabled={!canBeManaged || !canViewTaxes}
            className={
              canBeManaged && canViewTaxes ? 'ml-2' : 'p-button-secondary ml-2'
            }
            type="button"
            onClick={saveTaxClasses}
          >
            {t('products.edit.tab.prices.form.saveTaxClasses')}
          </Button>
        </div>
      </div>
      <>
        {canViewTaxes ? (
          <DataTable value={tableTaxes} size="small">
            {columns.map((column: ColumnProps) => {
              return <Column key={column.columnKey} {...column} />
            })}
          </DataTable>
        ) : (
          <SectionBox className="mt-6">
            <InputText disabled value={t('global.noPermissions')} />
          </SectionBox>
        )}
      </>
    </>
  )
}

export default TaxConfiguration
