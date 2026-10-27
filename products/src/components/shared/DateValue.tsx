import { DateValue as LibraryDateValue } from '@emporix/component-library'
import { useTranslation } from 'react-i18next'

type DateValueProps = {
  readonly className?: string
  readonly date: Date | string | undefined
  readonly showTime?: boolean
  readonly nullText?: string
  readonly timeZone?: string
  readonly hour12?: boolean
}

const DateValue = ({
  className = '',
  date,
  showTime = false,
  nullText = '--',
  timeZone,
  hour12,
}: DateValueProps) => {
  const { i18n } = useTranslation()

  return (
    <LibraryDateValue
      className={className}
      date={date}
      locale={i18n.language}
      showTime={showTime}
      nullText={nullText}
      timeZone={timeZone}
      hour12={hour12}
    />
  )
}

export default DateValue
