import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { useParams } from 'react-router'
import { useToast } from '@emporix/component-library'
import type { AddEntry } from '@emporix/api-calls'
import { useDashboardContext } from '../context/Dashboard.context'
import { getApiErrorMessage } from '../helpers/api'
import { useOrdersApi } from '../hooks/api/orders'
import type { Order } from '../models/Order.model'

type OrderDataContextType = {
  /** Loaded order, or `undefined` while loading / after a failed load. */
  order: Order | undefined
  /** True while the latest fetch for the current route id is in flight. */
  isLoading: boolean
  /** Set when the latest fetch for the current route id failed. */
  loadError: unknown | null
  newEntries: AddEntry[]
  refreshFlag: boolean
  refreshData: () => Promise<void>
  updateOrder: (order: Order) => void
  setNewEntries: (entries: AddEntry[]) => void
}

const OrderDataContext = createContext<OrderDataContextType>({
  order: undefined,
  isLoading: false,
  loadError: null,
  newEntries: [],
  refreshFlag: false,
  refreshData: () => Promise.resolve(),
  updateOrder: () => undefined,
  setNewEntries: () => undefined,
})

export const useOrderData = () => useContext(OrderDataContext)

export const OrderDataProvider = ({ children }: PropsWithChildren) => {
  const { syncOrder } = useOrdersApi()
  const { id } = useParams()
  const { onError } = useDashboardContext()
  const { showError } = useToast()
  const [order, setOrder] = useState<Order>()
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<unknown | null>(null)
  const [refreshFlag, setRefreshFlag] = useState(false)
  const [newEntries, setNewEntries] = useState<AddEntry[]>([])
  const requestIdRef = useRef(0)

  const refreshData = useCallback(async () => {
    setRefreshFlag((prev) => !prev)
    if (!id) {
      setOrder(undefined)
      setIsLoading(false)
      setLoadError(null)
      return
    }

    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setLoadError(null)

    try {
      const fetched = await syncOrder(id)
      if (requestId !== requestIdRef.current) return

      if (!fetched) {
        const notFound = new Error('Order not found')
        setOrder(undefined)
        setLoadError(notFound)
        showError(getApiErrorMessage(notFound))
        onError(notFound)
        return
      }

      setOrder(fetched)
    } catch (e) {
      if (requestId !== requestIdRef.current) return
      console.error(e)
      setOrder(undefined)
      setLoadError(e)
      showError(getApiErrorMessage(e))
      onError(e)
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [id, syncOrder, showError, onError])

  useEffect(() => {
    setOrder(undefined)
    setNewEntries([])
    setLoadError(null)
    void refreshData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <OrderDataContext.Provider
      value={{
        order,
        isLoading,
        loadError,
        newEntries,
        refreshFlag,
        refreshData,
        updateOrder: setOrder,
        setNewEntries,
      }}
    >
      {children}
    </OrderDataContext.Provider>
  )
}
