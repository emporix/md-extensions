import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useSearchParams } from 'react-router'
import { FormProvider, useForm } from 'react-hook-form'
import {
  ProgressSpinner,
  Tabs,
  useToast,
  type TabItem,
} from '@emporix/component-library'
import HeaderSection from '../components/shared/HeaderSection'
import useMixinsForm, {
  MIXINS_LOADING_TAB_ID,
} from '../components/mixins/useMixinsForm'
import type { MixinsFormMetadata } from '../components/mixins/helpers'
import CategoryAddEditActions from '../components/categories/CategoryAddEditActions'
import CategoryDetails from '../components/categories/CategoryDetails'
import CategoryPath from '../components/categories/CategoryPath'
import CategoryValidity from '../components/categories/CategoryValidity'
import CategoryMedia from '../components/categories/CategoryMedia'
import { useTabs } from '../hooks/useTabs'
import useUpdateEffect from '../hooks/useUpdateEffect'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { useLocalizedValue } from '../hooks/useLocalizedValue'
import { useCategoriesApi } from '../hooks/api/categories'
import { useDashboardContext } from '../context/Dashboard.context'
import { useUIBlocker } from '../context/UIBlcoker'
import { usePermissions } from '../context/PermissionsProvider'
import { useCategoryData } from '../context/Category.provider'
import { getApiErrorDetails } from '../helpers/api'
import {
  CategoryFormFields,
  createCategoryForm,
  mapCategoryToForm,
} from '../helpers/categoryForm.helpers'
import { Mixins } from '../models/Mixins.model'
import { Category } from '../models/Category.model'
import { SchemaType } from '../models/Schema.model'
import { EmployeeDomains } from '../configs/accessControls'
import { categoriesListPath } from '../constants/paths'
import styles from './CategoryAddEdit.module.scss'

const TABS = ['details', 'path', 'validity', 'media']

/** Ported from management-dashboard `modules/categories/pages/CategoryAddEdit.page`. */
const CategoryAddEditPage = () => {
  const { t } = useTranslation()
  const { categoryId } = useParams()
  const [searchParams] = useSearchParams()
  const { tenant } = useDashboardContext()
  const { navigate } = useCustomNavigate()
  const { category, syncCategory } = useCategoryData()
  const { getContentLangValue } = useLocalizedValue()
  const { patchCategory } = useCategoriesApi()
  const { blockPanel } = useUIBlocker()
  const { showSuccess, showError } = useToast()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)

  const methods = useForm<CategoryFormFields>({
    defaultValues: createCategoryForm(),
  })
  const { isDirty } = methods.formState

  useEffect(() => {
    if (!category || isDirty) return
    methods.reset(mapCategoryToForm(category))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  useUpdateEffect(() => {
    navigate(categoriesListPath())
  }, [tenant])

  // Latest closure, so `useMixinsForm` keeps a stable `onEdit`.
  const saveMixinRef = useRef<
    (data: Mixins, metadata: MixinsFormMetadata) => Promise<void>
  >(async () => undefined)
  saveMixinRef.current = async (data, { key, url }) => {
    if (!category) return
    blockPanel(true)
    try {
      await patchCategory({
        id: category.id,
        mixins: { [key]: { ...data } },
        metadata: {
          version: category.metadata?.version,
          mixins: { [key]: url },
        },
      } as Partial<Category>)
      showSuccess(t('categories.edit.toast.update.success'))
      await syncCategory()
    } catch (e) {
      console.error(e)
      showError(t('categories.edit.toast.update.error'), getApiErrorDetails(e))
    } finally {
      blockPanel(false)
    }
  }

  const { loadMixins, mixinsTabs, isMixinsLoading } = useMixinsForm({
    type: SchemaType.CATEGORY,
    onEdit: (data, metadata) => saveMixinRef.current(data, metadata),
    managerPermissions: canManage,
  })

  // Reload mixin tabs only when their data changes, so saving the category
  // itself does not discard unsaved edits in a mixin tab.
  const mixinsKey = category
    ? JSON.stringify([
        category.id,
        category.mixins ?? {},
        category.metadata?.mixins ?? {},
      ])
    : undefined

  useEffect(() => {
    if (!category) return
    void loadMixins(
      (category.metadata?.mixins as Record<string, string>) ?? {},
      category.mixins ?? {}
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mixinsKey])

  // Mixins belong to a saved category, as in MD.
  const shownMixinsTabs = useMemo(
    () => (categoryId ? mixinsTabs : []),
    [categoryId, mixinsTabs]
  )
  const tabIds = useMemo(
    () => [...TABS, ...shownMixinsTabs.map((tab) => tab.id)],
    [shownMixinsTabs]
  )
  const { activeTab, onTabChange, setTabsByName } = useTabs(tabIds, true)

  // While mixins (re)load, a `?tab=<mixin>` URL has no matching tab yet:
  // keep the loading placeholder selected instead of jumping to the details.
  const urlTab = searchParams.get('tab')
  const activeTabId =
    isMixinsLoading && urlTab && !tabIds.includes(urlTab)
      ? MIXINS_LOADING_TAB_ID
      : (activeTab ?? TABS[0])

  if (categoryId && !category) {
    return <ProgressSpinner />
  }

  const tabs: TabItem[] = [
    {
      id: 'details',
      label: t('categories.edit.tab.details.title'),
      content: <CategoryDetails />,
    },
    {
      id: 'path',
      label: t('categories.edit.tab.path.title'),
      content: <CategoryPath />,
    },
    {
      id: 'validity',
      label: t('categories.edit.tab.validity.title'),
      content: <CategoryValidity />,
    },
    {
      id: 'media',
      label: t('categories.edit.tab.media.title'),
      disabled: !categoryId,
      content: categoryId ? <CategoryMedia categoryId={categoryId} /> : null,
    },
    ...shownMixinsTabs,
  ]

  return (
    <FormProvider {...methods}>
      <HeaderSection
        title={t('categories.singular')}
        subtitle={category && getContentLangValue(category.localizedName)}
        backTo={categoriesListPath()}
        moduleActions={
          <CategoryAddEditActions onInvalid={() => setTabsByName('details')} />
        }
      />
      <div className={styles.tabs}>
        <Tabs
          scrollable
          keepMounted
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={onTabChange}
          data-testid="category-tabs"
        />
      </div>
    </FormProvider>
  )
}

export default CategoryAddEditPage
