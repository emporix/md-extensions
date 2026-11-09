import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FieldErrors, useFormContext } from 'react-hook-form'
import {
  PrimaryButton,
  SecondaryButton,
  useToast,
} from '@emporix/component-library'
import { ValidationError, type Coupon } from '@emporix/api-calls'
import { useUIBlocker } from '../../context/UIBlcoker'
import { useDashboardContext } from '../../context/Dashboard.context'
import { useCurrencyContext } from '../../context/Currency.provider'
import { useCouponData } from '../../context/Coupon.provider'
import { useCouponsApi } from '../../hooks/api/coupons'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import useCouponPermissions from '../../hooks/useCouponPermissions'
import { makeCall } from '../../helpers/api'
import {
  CouponFormFields,
  mapCouponFormToPayload,
} from '../../helpers/couponForm.helpers'
import {
  CouponTab,
  getCouponErrorMessage,
  getCouponSaveErrors,
  getCouponTabForField,
  getFirstInvalidCouponTab,
} from '../../helpers/couponErrors.helpers'
import { couponDetailPath } from '../../constants/paths'
import styles from './Coupons.module.scss'

interface Props {
  readonly onShowTab: (tab: CouponTab) => void
}

const CouponAddEditActions = ({ onShowTab }: Props) => {
  const { t } = useTranslation()
  const { handleSubmit, formState, reset, clearErrors, setError } =
    useFormContext<CouponFormFields>()
  const { coupon, syncCoupon } = useCouponData()
  const { createCoupon, updateCoupon } = useCouponsApi()
  const { selectedCurrency } = useCurrencyContext()
  const { canManage } = useCouponPermissions()
  const { blockPanel } = useUIBlocker()
  const { showSuccess, showError } = useToast()
  const { navigate } = useCustomNavigate()
  const { tenant } = useDashboardContext()
  const [isSaving, setIsSaving] = useState(false)
  const isSavingRef = useRef(false)
  // A new coupon takes the selected currency for its money fields; saved
  // without it, the API would store USD.
  const isWaitingForCurrency = !coupon && !selectedCurrency?.code

  const showSaveError = (details?: string) =>
    showError(
      t(
        coupon
          ? 'coupons.edit.toast.update.error'
          : 'coupons.edit.toast.create.error.default'
      ),
      details
    )

  const handleSaveError = (error: unknown, data: CouponFormFields) => {
    console.error(error)
    const { fieldErrors, unmapped } = getCouponSaveErrors(error)
    if (fieldErrors.length > 0) {
      fieldErrors.forEach(({ name, message }) =>
        setError(name, { type: 'server', message })
      )
      onShowTab(getCouponTabForField(fieldErrors[0].name))
    }
    if (unmapped.length > 0) {
      showSaveError(unmapped.join('\n'))
      return
    }
    if (fieldErrors.length > 0 || error instanceof ValidationError) {
      return
    }
    const status = (error as { response?: { status?: number } })?.response
      ?.status
    if (!coupon && status === 409) {
      const message = t('coupons.edit.toast.create.error.duplicate', {
        code: data.code,
        tenant,
      })
      setError('code', { type: 'server', message })
      onShowTab('general')
      showError(t('coupons.edit.toast.create.error.default'), message, 6000)
      return
    }
    showSaveError(getCouponErrorMessage(error))
  }

  const handleSave = async (data: CouponFormFields) => {
    if (isSavingRef.current) return
    isSavingRef.current = true
    setIsSaving(true)
    try {
      const payload = mapCouponFormToPayload(
        data,
        coupon,
        selectedCurrency?.code
      ) as Coupon
      if (coupon) {
        await makeCall(() => updateCoupon(payload, coupon.code), blockPanel)
        showSuccess(t('coupons.edit.toast.update.success'))
        reset(data)
        await syncCoupon()
      } else {
        const code = await makeCall(() => createCoupon(payload), blockPanel)
        showSuccess(t('coupons.edit.toast.create.success'))
        navigate(couponDetailPath(code), { replace: true })
      }
    } catch (error: unknown) {
      handleSaveError(error, data)
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }

  const handleInvalid = (errors: FieldErrors<CouponFormFields>) => {
    const tab = getFirstInvalidCouponTab(Object.keys(errors))
    if (tab) onShowTab(tab)
    showError(t('coupons.edit.toast.invalidForm'))
  }

  const onSaveClick = () => {
    clearErrors()
    void handleSubmit(handleSave, handleInvalid)()
  }

  return (
    <div className={styles.actions}>
      <SecondaryButton
        disabled={!formState.isDirty || !canManage || isSaving}
        onClick={() => reset()}
      >
        {t('global.discard')}
      </SecondaryButton>
      <PrimaryButton
        disabled={
          !formState.isDirty || !canManage || isSaving || isWaitingForCurrency
        }
        loading={isSaving}
        onClick={onSaveClick}
      >
        {t('global.save')}
      </PrimaryButton>
    </div>
  )
}

export default CouponAddEditActions
