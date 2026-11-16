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
import { categoriesListPath } from '../constants/paths'

type CategoryDataProviderProps = {
  readonly children: ReactNode | ReactNode[]
}

interface ContextData {
  category: Category | undefined
  syncCategory: () => Promise<void>
}

const Context = createContext<ContextData>({
  category: undefined,
  syncCategory: async () => {
    // NOOP
  },
})

// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with its provider
export const useCategoryData = () => useContext(Context)

/** Ported from management-dashboard `modules/categories/contexts/Category.provider`. */
export const CategoryDataProvider = ({
  children,
}: CategoryDataProviderProps) => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { showError } = useToast()
  const { getCategory } = useCategoriesApi()
  const { categoryId } = useParams()

  const [category, setCategory] = useState<Category>()
  const isMountedRef = useRef(true)
  const hasLoadedRef = useRef(false)

  const syncCategory = useCallback(async () => {
    if (!categoryId) return
    try {
      const data = await getCategory(categoryId)
      if (!isMountedRef.current) return
      hasLoadedRef.current = true
      setCategory(data)
    } catch (e) {
      if (!isMountedRef.current) return
      console.error(e)
      showError(t('categories.edit.toast.fetch.error'), getApiErrorDetails(e))
      // A failed refresh after a save keeps the user and their edits on the page.
      if (!hasLoadedRef.current) {
        navigate(categoriesListPath(), { replace: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, getCategory])

  useEffect(() => {
    isMountedRef.current = true
    void syncCategory()
    return () => {
      isMountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId])

  return (
    <Context.Provider value={{ category, syncCategory }}>
      {children}
    </Context.Provider>
  )
}
