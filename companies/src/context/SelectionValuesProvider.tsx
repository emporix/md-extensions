import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from 'react'
import { Props } from '../helpers/props'

interface RefreshValuesContextType {
  setSelection: Dispatch<SetStateAction<any[]>>
  selection: any[]
}

const SelectionValuesContext = createContext<RefreshValuesContextType>({
  selection: [],
  setSelection: () => {
    // NOOP
  },
})

export const useSelection = () => useContext(SelectionValuesContext)

export const SelectionValuesProvider = (props: Props) => {
  const { children } = props
  const [selection, setSelection] = useState<any[]>([])

  return (
    <SelectionValuesContext.Provider value={{ selection, setSelection }}>
      {children}
    </SelectionValuesContext.Provider>
  )
}
