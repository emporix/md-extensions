import { useCallback, useEffect, useState } from 'react'
import { TabViewTabChangeParams } from 'primereact/tabview'
import { useSearchParams } from 'react-router'

export const useTabs = (tabs: string[], withQuery = true) => {
  const [activeTab, setActiveTab] = useState<string>()
  const [activeIndex, setActiveIndex] = useState(0)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (!tabFromUrl || !withQuery) {
      setTabsByIndex(0)
    } else {
      const tabFromUrlIndex = tabs.indexOf(tabFromUrl)
      const tabExist = tabFromUrlIndex !== -1
      setTabsByIndex(tabExist ? tabFromUrlIndex : 0)
    }
  }, [])

  const onTabChange = useCallback(
    (event: TabViewTabChangeParams) => {
      setTabsByIndex(event.index)
    },
    [tabs]
  )

  const setTabsByIndex = (index: number) => {
    setActiveTab(tabs[index])
    setActiveIndex(index)
  }

  const setTabsByName = (name: string) => {
    const index = tabs.indexOf(name)
    setTabsByIndex(index)
  }

  return {
    activeIndex,
    activeTab,
    onTabChange,
    setTabsByName,
  }
}
