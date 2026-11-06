import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { useToast } from '@emporix/component-library'
import type { Coupon } from '@emporix/api-calls'
import { useCouponsApi } from '../hooks/api/coupons'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { couponsListPath } from '../constants/paths'
import { getCouponErrorMessage } from '../helpers/couponErrors.helpers'

interface Props {
  readonly children: ReactNode | ReactNode[]
}

interface ContextData {
  coupon: Coupon | undefined
  isLoadingData: boolean
  syncCoupon: () => Promise<void>
}

const Context = createContext<ContextData>({
  coupon: undefined,
  isLoadingData: false,
  syncCoupon: async () => {
    // NOOP
  },
})

// eslint-disable-next-line react-refresh/only-export-components
export const useCouponData = () => useContext(Context)

export const CouponDataProvider = ({ children }: Props) => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { showError } = useToast()
  const { getCoupon } = useCouponsApi()
  const { code } = useParams()

  const [coupon, setCoupon] = useState<Coupon>()
  const [isLoadingData, setIsLoadingData] = useState(!!code)
  const isMountedRef = useRef(true)
  const hasLoadedRef = useRef(false)

  const syncCoupon = useCallback(async () => {
    if (!code) return
    try {
      setIsLoadingData(true)
      const data = await getCoupon(code)
      if (!isMountedRef.current) return
      hasLoadedRef.current = true
      setCoupon(data)
    } catch (e: unknown) {
      if (!isMountedRef.current) return
      console.error(e)
      showError(
        t('coupons.edit.errors.fetching.title'),
        getCouponErrorMessage(e)
      )
      // A failed refresh after a save keeps the user and their edits on the page.
      if (!hasLoadedRef.current) {
        navigate(couponsListPath(), { replace: true })
      }
    } finally {
      if (isMountedRef.current) setIsLoadingData(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [code, getCoupon])

  useEffect(() => {
    isMountedRef.current = true
    syncCoupon()
    return () => {
      isMountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload per code (and tenant via getCoupon)
  }, [code, getCoupon])

  return (
    <Context.Provider value={{ coupon, isLoadingData, syncCoupon }}>
      {children}
    </Context.Provider>
  )
}
