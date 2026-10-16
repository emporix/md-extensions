import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import { useParams } from 'react-router'
import type { AddEntry } from '@emporix/api-calls'
import { useOrdersApi } from '../hooks/api/orders'
import type { Order } from '../models/Order.model'

type OrderDataContextType = {
  /** Loaded order, or `undefined` while the first fetch is in flight. */
  order: Order | undefined
  newEntries: AddEntry[]
  refreshFlag: boolean
  refreshData: () => Promise<void>
  updateOrder: (order: Order) => void
  setNewEntries: (entries: AddEntry[]) => void
}

const OrderDataContext = createContext<OrderDataContextType>({
  order: undefined,
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
  const [order, setOrder] = useState<Order>()
  const [refreshFlag, setRefreshFlag] = useState(false)
  const [newEntries, setNewEntries] = useState<AddEntry[]>([])

  const refreshData = useCallback(async () => {
    setRefreshFlag((prev) => !prev)
    if (!id) return
    try {
      const fetched = await syncOrder(id)
      if (fetched) setOrder(fetched)
    } catch (e) {
      console.error(e)
    }
  }, [id, syncOrder])

  useEffect(() => {
    setOrder(undefined)
    setNewEntries([])
    void refreshData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <OrderDataContext.Provider
      value={{
        order,
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
