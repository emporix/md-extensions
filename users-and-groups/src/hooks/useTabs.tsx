import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

export const useTabs = (tabs: string[], withQuery = true) => {
  const [activeTab, setActiveTab] = useState<string>()
  const [activeIndex, setActiveIndex] = useState(0)
  const [searchParams] = useSearchParams()

  const setTabsByIndex = useCallback(
    (index: number) => {
      setActiveTab(tabs[index])
      setActiveIndex(index)
    },
    [tabs]
  )

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (!tabFromUrl || !withQuery) {
      setTabsByIndex(0)
    } else {
      const tabFromUrlIndex = tabs.indexOf(tabFromUrl)
      const tabExist = tabFromUrlIndex !== -1
      setTabsByIndex(tabExist ? tabFromUrlIndex : 0)
    }
  }, [searchParams, tabs, withQuery, setTabsByIndex])

  const onTabChange = useCallback(
    (tabId: string) => {
      const index = tabs.indexOf(tabId)
      if (index >= 0) {
        setTabsByIndex(index)
      }
    },
    [tabs, setTabsByIndex]
  )

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
