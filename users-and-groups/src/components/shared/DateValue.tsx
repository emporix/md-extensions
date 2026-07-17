import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './DateValue.module.scss'

type DateValueProps = {
  readonly className?: string
  readonly date: Date | string | undefined
  readonly showTime?: boolean
  readonly nullText?: string
  readonly timeZone?: string
  readonly hour12?: boolean
}

const INVALID_DATE_SENTINEL = '--'

const DateValue = ({
  className = '',
  date,
  showTime = false,
  nullText = INVALID_DATE_SENTINEL,
  timeZone,
  hour12,
}: DateValueProps) => {
  const { i18n } = useTranslation()
  const [textDate, setTextDate] = useState(nullText)
  const [textTime, setTextTime] = useState<string>()
  const [showNullText, setShowNullText] = useState(false)

  useEffect(() => {
    if (!date) {
      setShowNullText(true)
      setTextTime(undefined)
      return
    }

    const parsedDate = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(parsedDate.getTime())) {
      setShowNullText(true)
      setTextTime(undefined)
      return
    }

    const resolvedHour12 =
      hour12 ?? new Intl.DateTimeFormat(i18n.language).resolvedOptions().hour12

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...(timeZone ? { timeZone } : {}),
    }

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: resolvedHour12,
      ...(timeZone ? { timeZone } : {}),
    }

    try {
      const formattedDate = new Intl.DateTimeFormat(
        i18n.language,
        dateOptions
      ).format(parsedDate)

      if (!showTime) {
        setTextDate(formattedDate)
        setTextTime(undefined)
        setShowNullText(false)
        return
      }

      const formattedTime = new Intl.DateTimeFormat(
        i18n.language,
        timeOptions
      ).format(parsedDate)
      setTextDate(formattedDate)
      setTextTime(formattedTime)
      setShowNullText(false)
    } catch (error) {
      console.error(error)
      setShowNullText(true)
      setTextTime(undefined)
    }
  }, [date, hour12, i18n.language, nullText, showTime, timeZone])

  return (
    <div className={`${styles.dateValue} ${className}`.trim()}>
      {showNullText ? (
        nullText
      ) : (
        <>
          <span>{textDate}</span>
          {showTime && textTime ? (
            <span className={styles.time}>{textTime}</span>
          ) : null}
        </>
      )}
    </div>
  )
}

export default DateValue
