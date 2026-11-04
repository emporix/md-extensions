import { createContext, FC, useContext, useState } from 'react'
import { Props } from '../helpers/props'

interface RefreshValuesContextType {
  setRefreshValue: () => void
  refresh: number
}

const RefreshValuesContext = createContext<RefreshValuesContextType>({
  refresh: 0,
  setRefreshValue: () => {
    // NOOP
  },
})

export const useRefresh = () => useContext(RefreshValuesContext)

export const RefreshValuesProvider: FC<Props> = ({ children }) => {
  const [refresh, setRefresh] = useState(0)
  const setRefreshValue = () => {
    setRefresh(Date.now())
  }
  return (
    <RefreshValuesContext.Provider value={{ refresh, setRefreshValue }}>
      {children}
    </RefreshValuesContext.Provider>
  )
}
