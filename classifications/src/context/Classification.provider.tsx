import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { useToast } from '@emporix/component-library'
import { useCategoriesApi } from '../hooks/api/categories'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { getApiErrorDetails } from '../helpers/api'
import { Category } from '../models/Category.model'
import { classificationsListPath } from '../constants/paths'

type ClassificationDataProviderProps = {
  readonly children: ReactNode | ReactNode[]
}

interface ContextData {
  classification: Category | undefined
  syncClassification: () => Promise<void>
}

const Context = createContext<ContextData>({
  classification: undefined,
  syncClassification: async () => {
    // NOOP
  },
})

// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with its provider
export const useClassificationData = () => useContext(Context)

/** Ported from management-dashboard `modules/classifications/contexts/Classification.provider`. */
export const ClassificationDataProvider = ({
  children,
}: ClassificationDataProviderProps) => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { showError } = useToast()
  const { getCategory } = useCategoriesApi()
  const { classificationId } = useParams()

  const [classification, setClassification] = useState<Category>()
  const isMountedRef = useRef(true)
  const hasLoadedRef = useRef(false)

  const syncClassification = useCallback(async () => {
    if (!classificationId) return
    try {
      const data = await getCategory(classificationId)
      if (!isMountedRef.current) return
      hasLoadedRef.current = true
      setClassification(data)
    } catch (e) {
      if (!isMountedRef.current) return
      console.error(e)
      showError(
        t('classifications.toasts.errorFetchClassification'),
        getApiErrorDetails(e)
      )
      // A failed refresh after a save keeps the user and their edits on the page.
      if (!hasLoadedRef.current) {
        navigate(classificationsListPath(), { replace: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classificationId, getCategory])

  useEffect(() => {
    isMountedRef.current = true
    void syncClassification()
    return () => {
      isMountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classificationId])

  return (
    <Context.Provider value={{ classification, syncClassification }}>
      {children}
    </Context.Provider>
  )
}
