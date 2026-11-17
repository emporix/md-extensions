import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useSearchParams } from 'react-router'
import { FormProvider, useForm } from 'react-hook-form'
import { ProgressSpinner, Tabs, type TabItem } from '@emporix/component-library'
import HeaderSection from '../components/shared/HeaderSection'
import ClassificationAddEditActions from '../components/classifications/ClassificationAddEditActions'
import ClassificationDetails from '../components/classifications/ClassificationDetails'
import ClassificationMixins from '../components/classifications/ClassificationMixins'
import ClassificationPath from '../components/classifications/ClassificationPath'
import ClassificationValidity from '../components/classifications/ClassificationValidity'
import { useClassificationTabHeader } from '../components/classifications/ClassificationTabHeader'
import { useTabs } from '../hooks/useTabs'
import useUpdateEffect from '../hooks/useUpdateEffect'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { useLocalizedValue } from '../hooks/useLocalizedValue'
import { useDashboardContext } from '../context/Dashboard.context'
import { useClassificationData } from '../context/Classification.provider'
import { ClassificationVersionProvider } from '../context/ClassificationVersion.provider'
import {
  ClassificationFormFields,
  createClassificationForm,
  mapClassificationToForm,
} from '../helpers/classificationForm.helpers'
import { classificationsListPath } from '../constants/paths'
import styles from './ClassificationAddEdit.module.scss'

const TABS = ['details', 'classification', 'path', 'validity']

/** The four tabs; inside the version provider so the tab label can show the alert. */
const ClassificationTabs = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const { activeTab, onTabChange } = useTabs(TABS, true)
  const classificationTabLabel = useClassificationTabHeader()

  // MD wrote the tab index (`?tab=1`); links saved there open the same tab.
  const urlTab = searchParams.get('tab')
  useEffect(() => {
    if (!urlTab || !/^\d+$/.test(urlTab)) return
    if (TABS[Number(urlTab)]) onTabChange(Number(urlTab))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTab])

  const tabs: TabItem[] = [
    {
      id: 'details',
      label: t('classifications.tabs.details'),
      content: <ClassificationDetails />,
    },
    {
      id: 'classification',
      label: classificationTabLabel,
      content: <ClassificationMixins />,
    },
    {
      id: 'path',
      label: t('classifications.tabs.path'),
      content: <ClassificationPath />,
    },
    {
      id: 'validity',
      label: t('classifications.tabs.validity'),
      content: <ClassificationValidity />,
    },
  ]

  return (
    <div className={styles.tabs}>
      <Tabs
        scrollable
        keepMounted
        tabs={tabs}
        activeTabId={activeTab ?? TABS[0]}
        onTabChange={onTabChange}
        data-testid="classification-tabs"
      />
    </div>
  )
}

/** Ported from management-dashboard `modules/classifications/pages/ClassificationAddEdit.page`. */
const ClassificationAddEditPage = () => {
  const { t } = useTranslation()
  const { classificationId } = useParams()
  const { tenant } = useDashboardContext()
  const { navigate } = useCustomNavigate()
  const { classification } = useClassificationData()
  const { getContentLangValue } = useLocalizedValue()

  const methods = useForm<ClassificationFormFields>({
    defaultValues: createClassificationForm(),
    // Field errors of the schema tiles show while typing; MD only disabled Save.
    mode: 'onChange',
  })

  useEffect(() => {
    if (!classification) return
    methods.reset(mapClassificationToForm(classification))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classification])

  useUpdateEffect(() => {
    navigate(classificationsListPath())
  }, [tenant])

  if (classificationId && !classification) {
    return <ProgressSpinner />
  }

  return (
    <FormProvider {...methods}>
      <HeaderSection
        title={t('classifications.plurals.singular')}
        subtitle={
          classification && getContentLangValue(classification.localizedName)
        }
        backTo={classificationsListPath()}
        moduleActions={<ClassificationAddEditActions />}
      />
      <ClassificationVersionProvider>
        <ClassificationTabs />
      </ClassificationVersionProvider>
    </FormProvider>
  )
}

export default ClassificationAddEditPage
