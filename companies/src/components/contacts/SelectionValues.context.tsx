import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from 'react'
import type {
  ApprovalGroup,
  ContactAssignment,
} from '../../models/LegalEntity.model'

export type SelectionItem = ContactAssignment | ApprovalGroup

type SelectionValuesContextType = {
  selection: SelectionItem[]
  setSelection: Dispatch<SetStateAction<SelectionItem[]>>
}

const SelectionValuesContext = createContext<SelectionValuesContextType>({
  selection: [],
  setSelection: () => {
    // NOOP
  },
})

/**
 * MD `context/SelectionValuesProvider`: shares the rows picked in a contacts
 * table with the approval group dialog / table that wraps it. Outside a
 * provider the selection is a no-op.
 */
export const useSelection = () => useContext(SelectionValuesContext)

export const SelectionValuesProvider = ({ children }: PropsWithChildren) => {
  const [selection, setSelection] = useState<SelectionItem[]>([])

  return (
    <SelectionValuesContext.Provider value={{ selection, setSelection }}>
      {children}
    </SelectionValuesContext.Provider>
  )
}
