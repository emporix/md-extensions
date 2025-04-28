import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate, formatDateWithTime } from '../../helpers/date'

interface DateValueProps {
  className: string
  date: Date | string | undefined
  showTime: boolean
  nullText: string
}

const DateValue = (props: DateValueProps) => {
  const { className, date, showTime, nullText } = props
  const { i18n } = useTranslation()
  const [showNullText, setShowNullText] = useState<boolean>(false)
  const [textDate, setTextDate] = useState<string>('')
  const [textTime, setTextTime] = useState<string>()

  useEffect(() => {
    if (!date) {
      setShowNullText(true)
    } else {
      if (!showTime) {
        const formattedDate = formatDate(date, i18n.language)
        if (formattedDate === '--') {
          setShowNullText(true)
        } else {
          setTextDate(formattedDate)
          setShowNullText(false)
        }
      } else {
        const formattedDate = formatDateWithTime(date, i18n.language)
        if (formattedDate === '--') {
          setShowNullText(true)
        } else {
          const timeIndex = formattedDate.indexOf(' ')
          setTextDate(formattedDate.slice(0, timeIndex - 1))
          setTextTime(formattedDate.slice(timeIndex + 1))
          setShowNullText(false)
        }
      }
    }
  }, [i18n.language, date])

  return (
    <div className={`${className} flex align-items-end gap-2`}>
      {showNullText ? (
        nullText
      ) : (
        <>
          <div>{textDate}</div>
          {textTime && (
            <div
              className="text-xs white-space-nowrap"
              style={{ color: '#596168' }}
            >
              {textTime}
            </div>
          )}
        </>
      )}
    </div>
  )
}

DateValue.defaultProps = {
  className: '',
  showTime: false,
  nullText: '--',
}

export default DateValue
