import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { DEFAULT_PAGINATION_PROPS } from './usePagination'

export const useTabs = (tabs: string[], withQuery = true) => {
  const [activeTab, setActiveTab] = useState<string>()
  const [activeIndex, setActiveIndex] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const setSearchParamsRef = useRef(setSearchParams)
  setSearchParamsRef.current = setSearchParams

  const setTabsByIndex = useCallback(
    (index: number, updateQuery = false) => {
      if (index < 0 || index >= tabs.length) {
        return
      }
      const nextTab = tabs[index]
      setActiveTab(nextTab)
      setActiveIndex(index)

      if (withQuery && updateQuery) {
        setSearchParamsRef.current(
          () => {
            // Merge onto the live URL, not the (potentially stale, if another
            // setSearchParams call lands in the same tick) `currentSearchParams`
            // argument — see the equivalent comment in usePagination.tsx.
            const currentSearchParams = new URLSearchParams(
              window.location.hash.split('?')[1] ?? ''
            )
            const nextSearchParams = new URLSearchParams(currentSearchParams)
            const tabChanged = currentSearchParams.get('tab') !== nextTab
            nextSearchParams.set('tab', nextTab)
            if (tabChanged) {
              nextSearchParams.set(
                'page',
                DEFAULT_PAGINATION_PROPS.currentPage?.toString() ?? '1'
              )
              nextSearchParams.set(
                'rows',
                DEFAULT_PAGINATION_PROPS.rows?.toString() ?? '10'
              )
            }

            return nextSearchParams
          },
          { replace: true }
        )
      }
    },
    [tabs, withQuery]
  )

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (!withQuery) {
      return
    }
    if (!tabFromUrl) {
      setTabsByIndex(0)
    } else {
      const tabFromUrlIndex = tabs.indexOf(tabFromUrl)
      const tabExist = tabFromUrlIndex !== -1
      setTabsByIndex(tabExist ? tabFromUrlIndex : 0)
    }
  }, [searchParams, tabs, withQuery, setTabsByIndex])

  const onTabChange = useCallback(
    (tabIdOrIndex: string | number) => {
      if (typeof tabIdOrIndex === 'number') {
        setTabsByIndex(tabIdOrIndex, true)
        return
      }

      const index = tabs.indexOf(tabIdOrIndex)
      if (index >= 0) {
        setTabsByIndex(index, true)
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
