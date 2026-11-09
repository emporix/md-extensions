import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FilterMatchMode,
  MoneyValue,
  type DataTableColumnFilterElementOptions,
  type DataTableColumnProps,
} from '@emporix/component-library'
import type { Coupon } from '@emporix/api-calls'
import DotIndicator from '../components/shared/DotIndicator'
import DropdownFilterTemplate from '../components/shared/DropdownFilter'
import NumberFilterTemplate from '../components/shared/NumberFilterTemplate'
import {
  COUPON_DISCOUNT_TYPE_LABEL_KEYS,
  getCouponDiscountTypeLabelKey,
} from '../helpers/couponsTable.helpers'
import styles from '../components/coupons/CouponsTable.module.scss'

export const TABLE_COLUMNS_PATH = 'coupons.table.columns'

/** MD `components/NumericColumn` — right aligned with a 12px end padding. */
const numericColumn = {
  align: 'right' as const,
  dataType: 'numeric',
  bodyClassName: styles.numericCell,
  headerClassName: styles.numericCell,
}

const numberFilterElement = (decimalPlaces = 0) => {
  const NumberFilterElement = (
    options: DataTableColumnFilterElementOptions
  ) => (
    <NumberFilterTemplate
      filterOptions={options}
      decimalPlaces={decimalPlaces}
    />
  )
  return NumberFilterElement
}

const useCouponsColumns = () => {
  const { t, i18n } = useTranslation()

  const columns: DataTableColumnProps[] = useMemo(() => {
    const booleanOptions = [
      { label: t('global.true'), value: true as unknown as string },
      { label: t('global.false'), value: false as unknown as string },
    ]
    const discountTypeOptions = Object.entries(
      COUPON_DISCOUNT_TYPE_LABEL_KEYS
    ).map(([value, labelKey]) => ({ label: t(labelKey), value }))

    return [
      {
        columnKey: 'code',
        header: t(`${TABLE_COLUMNS_PATH}.code`),
        field: 'code',
        filter: true,
        showFilterMenu: false,
        showClearButton: true,
        sortable: true,
        align: 'left' as const,
        bodyClassName: styles.codeCell,
        headerClassName: styles.codeCell,
        dataType: 'text',
      },
      {
        columnKey: 'name',
        header: t(`${TABLE_COLUMNS_PATH}.name`),
        field: 'name',
        bodyClassName: styles.nameCell,
        headerClassName: styles.nameCell,
        filter: true,
        showFilterMenu: false,
        showClearButton: true,
        sortable: true,
      },
      {
        columnKey: 'discountType',
        header: t(`${TABLE_COLUMNS_PATH}.discountType`),
        field: 'discountType',
        filter: true,
        showFilterMenu: false,
        // The dropdown's own × (`showClear`) clears this filter.
        showClearButton: false,
        sortable: true,
        filterMatchMode: FilterMatchMode.EQUALS,
        filterElement: (options: DataTableColumnFilterElementOptions) =>
          DropdownFilterTemplate(options, discountTypeOptions),
        body: (coupon: Coupon) => {
          const labelKey = getCouponDiscountTypeLabelKey(coupon.discountType)
          return labelKey ? t(labelKey) : (coupon.discountType ?? '-')
        },
      },
      {
        columnKey: 'discountPercentage',
        header: t(`${TABLE_COLUMNS_PATH}.discountPercentage`),
        field: 'discountPercentage',
        sortable: true,
        // The coupon service does not filter on discountPercentage (checked on dev:
        // `discountPercentage:10` and `discountPercentage:>5` return no rows).
        filter: false,
        body: (coupon: Coupon) =>
          coupon.discountPercentage !== undefined &&
          coupon.discountPercentage !== null ? (
            <span>{`${coupon.discountPercentage}%`}</span>
          ) : (
            '-'
          ),
        ...numericColumn,
      },
      {
        columnKey: 'discountAbsolute',
        header: t(`${TABLE_COLUMNS_PATH}.discountAbsolute`),
        field: 'discountAbsolute',
        sortable: true,
        // Not filterable: the coupon service returns no rows for
        // `discountAbsolute.amount` conditions (checked on dev).
        filter: false,
        body: (coupon: Coupon) => (
          <MoneyValue
            currency={coupon?.discountAbsolute?.currency}
            value={coupon?.discountAbsolute?.amount}
            locale={i18n.language}
          />
        ),
        ...numericColumn,
      },
      {
        columnKey: 'redemptionCount',
        header: t(`${TABLE_COLUMNS_PATH}.redemptionCount`),
        field: 'redemptionCount',
        sortable: true,
        filter: true,
        showFilterMenu: false,
        showClearButton: true,
        filterElement: numberFilterElement(),
        body: (coupon: Coupon) =>
          coupon.redemptionCount !== undefined &&
          coupon.redemptionCount !== null ? (
            <span>{`${coupon.redemptionCount}`}</span>
          ) : (
            '-'
          ),
        ...numericColumn,
        bodyClassName: `${styles.numericCell} ${styles.redemptionCountCell}`,
        headerClassName: `${styles.numericCell} ${styles.redemptionCountCell}`,
      },
      {
        columnKey: 'categoriesCoupon',
        header: t(`${TABLE_COLUMNS_PATH}.categoriesCoupon`),
        field: 'categoryRestricted',
        headerClassName: styles.categoryCouponCell,
        bodyClassName: styles.categoryCouponCell,
        sortable: true,
        filter: true,
        showFilterMenu: false,
        // The dropdown's own × (`showClear`) clears this filter.
        showClearButton: false,
        filterMatchMode: FilterMatchMode.EQUALS,
        dataType: 'boolean',
        filterElement: (options: DataTableColumnFilterElementOptions) =>
          DropdownFilterTemplate(options, booleanOptions, styles.booleanFilter),
        body: (coupon: Coupon) => (
          <DotIndicator value={!!coupon.categoryRestricted} />
        ),
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity: rebuild per UI language
  }, [i18n.language])

  return { columns }
}

export default useCouponsColumns
