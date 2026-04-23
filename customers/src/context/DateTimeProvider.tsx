import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react'
import { Props } from '../helpers/props'
import { last7Days } from '../helpers/date'

export type DateRange = Date | Date[] | undefined

interface DateTimeContextType {
  dates: DateRange
  setRange: (dates: DateRange) => void
}

const DateTimeContext = createContext<DateTimeContextType>({
  dates: [],
  setRange: (_d: DateRange) => {
    throw new Error('not implemented yet')
  },
})

export const useDateTime = () => useContext(DateTimeContext)
const now = new Date()
export const DateTimeProvider = ({ children }: Props) => {
  const [dates, setDates] = useState<Date | Date[] | undefined>([
    last7Days(now, true),
    now,
  ])

  const setRange = useCallback(
    (r: DateRange) => {
      setDates(r)
    },
    [dates]
  )

  const value = useMemo(() => {
    return {
      dates,
      setRange,
    }
  }, [dates, setRange])

  return (
    <DateTimeContext.Provider value={value}>
      {children}
    </DateTimeContext.Provider>
  )
}
