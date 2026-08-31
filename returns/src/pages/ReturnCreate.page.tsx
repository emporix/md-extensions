import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton, Tabs, type TabItem } from '@emporix/component-library'

import HeaderSection from '../components/shared/HeaderSection'
import ReturnAddCustomers from '../components/returns/ReturnAddCustomers'
import ReturnAddOrders from '../components/returns/ReturnAddOrders'
import ReturnAddProducts from '../components/returns/ReturnAddProducts'
import { useReturnForm } from '../contexts/ReturnForm.provider'
import { useTabs } from '../hooks/useTabs'
import { returnsListPath } from '../constants/paths'

const TABS = ['customers', 'orders', 'products', 'review']

const ReturnCreatePage = () => {
  const { t } = useTranslation()
  const { activeIndex, activeTab, onTabChange } = useTabs(TABS, false)
  const { selectedOrders, onSubmit, isValid } = useReturnForm()

  const tabs: TabItem[] = useMemo(
    () => [
      {
        id: 'customers',
        label: t('returns.create.tabs.first'),
        content: <ReturnAddCustomers />,
      },
      {
        id: 'orders',
        label: t('returns.create.tabs.second'),
        content: <ReturnAddOrders isActive={activeIndex === 1} />,
      },
      {
        id: 'products',
        label: t('returns.create.tabs.third'),
        content: <ReturnAddProducts />,
        disabled: selectedOrders.length === 0,
      },
      {
        id: 'review',
        label: t('returns.create.tabs.fourth'),
        content: <ReturnAddProducts review />,
        disabled: !isValid,
      },
    ],
    [t, activeIndex, selectedOrders.length, isValid]
  )

  return (
    <>
      <HeaderSection
        title={t('returns.singular')}
        backTo={returnsListPath()}
        moduleActions={
          <PrimaryButton disabled={!isValid} onClick={onSubmit}>
            {t('global.save')}
          </PrimaryButton>
        }
      />
      {/* keepMounted mirrors MD's renderActiveOnly={false}: the wizard steps
          keep their table selections and inputs when you switch tabs. */}
      <Tabs
        tabs={tabs}
        activeTabId={activeTab ?? TABS[0]}
        onTabChange={onTabChange}
        keepMounted
      />
    </>
  )
}

export default ReturnCreatePage
