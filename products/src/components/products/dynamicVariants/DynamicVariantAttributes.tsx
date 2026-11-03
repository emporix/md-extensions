import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Controller, useFormContext } from 'react-hook-form'
import {
  InputSwitch,
  InputText,
  Message,
  PrimaryButton,
} from '@emporix/component-library'
import { OwnVariantAttributes, Product } from '../../../models/Category.model'
import { useActiveNode } from '../../../context/ActiveNodeProvider'
import InputField from '../../shared/InputField'
import { DynamicVariantAttributeDialog } from './DynamicVariantAttributeDialog'
import {
  AttributeFormValues,
  attributeToFormValues,
  formValuesToAttribute,
} from '../../../helpers/dynamicVariants/attribute.helpers'
import VariantAttributesTable, { AttributeRow } from './VariantAttributesTable'
import { BsPlusLg } from 'react-icons/bs'
import FormGrid from '../../shared/FormGrid'
import { InheritedFieldAddon } from './InheritedFieldAddon'
import FormGridRow from '../../shared/FormGridRow'
import { usePermissions } from '../../../context/PermissionsProvider'
import { EmployeeDomains, VendorDomains } from '../../../configs/accessControls'
import styles from './DynamicVariant.module.scss'

interface Props {
  readonly product: Partial<Product>
}

const DynamicVariantAttributes = (props: Props) => {
  const { product } = props
  const { t } = useTranslation()
  const {
    control,
    watch,
    setValue,
    getValues,
    resetField: formResetField,
  } = useFormContext<Product>()
  const { setActiveNodeState } = useActiveNode()
  const { hasPermission } = usePermissions()

  const inherited = useMemo(
    () => product.inheritedVariantAttributes || {},
    [product.inheritedVariantAttributes]
  )
  const dynInfo = product.metadata?.dynamicVariantInfo
  const watchedOwnAttributes = watch('ownVariantAttributes')
  const ownVariantAttributes = useMemo(
    () => watchedOwnAttributes || {},
    [watchedOwnAttributes]
  )
  const watchedSellable = watch('sellable')
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>()
  const [dialogInitial, setDialogInitial] = useState<AttributeFormValues>()
  const canManage =
    hasPermission(EmployeeDomains.PRODUCTS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_PRODUCTS_MANAGER)

  useEffect(() => {
    setActiveNodeState((prev) => ({ ...prev, sellable: !!watchedSellable }))
  }, [watchedSellable, setActiveNodeState])

  const ownRows: AttributeRow[] = useMemo(
    () =>
      Object.entries(ownVariantAttributes).map(([key, attr]) => ({
        key,
        attr,
      })),

    [ownVariantAttributes]
  )

  const inheritedRows: AttributeRow[] = useMemo(
    () =>
      Object.entries(inherited).map(([key, attr]) => ({
        key,
        attr,
      })),

    [inherited]
  )

  const setOwnMap = useCallback(
    (next: OwnVariantAttributes) => {
      setValue('ownVariantAttributes', next, {
        shouldDirty: true,
        shouldTouch: true,
      })
    },
    [setValue]
  )

  const openAddAttribute = () => {
    setDialogMode('add')
    setDialogInitial(undefined)
  }

  const openEditAttribute = (row: AttributeRow) => {
    setDialogMode('edit')
    setDialogInitial(attributeToFormValues(row.key, row.attr))
  }

  const saveAttribute = (values: AttributeFormValues) => {
    const { key, attr } = formValuesToAttribute(values)
    const current = {
      ...(getValues('ownVariantAttributes') as OwnVariantAttributes),
    }
    if (dialogMode === 'add' && current[key]) {
      return
    }
    if (dialogMode === 'edit') {
      const oldKey = dialogInitial?.attributeKey
      if (oldKey && oldKey !== key) {
        delete current[oldKey]
      }
    }
    current[key] = attr
    setOwnMap(current)
  }

  const removeRow = (row: AttributeRow) => {
    const current = {
      ...(getValues('ownVariantAttributes') as OwnVariantAttributes),
    }
    delete current[row.key]
    setOwnMap(current)
  }

  return (
    <div className={styles.attributesWrapper}>
      <FormGrid>
        {dynInfo && (dynInfo.missingAncestorId || dynInfo.cycleDetected) && (
          <Message
            severity="warn"
            className={styles.fullWidth}
            text={
              dynInfo.cycleDetected
                ? t('products.dynamicVariant.warnings.warningCycle')
                : t('products.dynamicVariant.warnings.warningMissingAncestor', {
                    id: dynInfo.missingAncestorId,
                  })
            }
          />
        )}
        <FormGridRow>
          <InputField
            label={t('products.dynamicVariant.labels.sellable')}
            className={styles.halfField}
            addon={
              <InheritedFieldAddon
                fieldName="sellable"
                resetField={formResetField}
              />
            }
          >
            <Controller
              name="sellable"
              control={control}
              render={({ field }) => (
                <InputSwitch
                  disabled={!canManage}
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.value)}
                />
              )}
            />
          </InputField>
          <InputField
            label={t('products.dynamicVariant.forms.attribute.dynamicType')}
            className={styles.halfField}
          >
            <Controller
              name="dynamicVariantType"
              control={control}
              render={({ field }) => (
                <InputText
                  readOnly={!canManage}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
          </InputField>
        </FormGridRow>

        <div className={styles.fullWidth}>
          <div className={styles.addAttributeRow}>
            <PrimaryButton
              className={styles.iconButton}
              disabled={!canManage}
              onClick={openAddAttribute}
            >
              <BsPlusLg size={16} />
              {t('products.dynamicVariant.buttons.add')}
            </PrimaryButton>
          </div>
          <VariantAttributesTable
            className={styles.localAttributes}
            rows={ownRows}
            type="local"
            onEdit={openEditAttribute}
            onDelete={removeRow}
          />
        </div>

        {inheritedRows.length > 0 && (
          <VariantAttributesTable
            className={styles.fullWidth}
            rows={inheritedRows}
            type="inherited"
          />
        )}
      </FormGrid>

      <DynamicVariantAttributeDialog
        visible={!!dialogMode}
        mode={dialogMode}
        initial={dialogInitial}
        onHide={() => setDialogMode(undefined)}
        onSave={saveAttribute}
        canSave={canManage}
      />
    </div>
  )
}

export default DynamicVariantAttributes
