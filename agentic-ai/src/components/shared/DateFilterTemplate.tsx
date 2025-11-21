import React from 'react'
import { Calendar } from 'primereact/calendar'
import { ColumnFilterElementTemplateOptions } from 'primereact/column'
import { useTranslation } from 'react-i18next'

interface DateFilterTemplateProps {
  options: ColumnFilterElementTemplateOptions
}

const DateFilterTemplate: React.FC<DateFilterTemplateProps> = ({ options }) => {
  const { t } = useTranslation()

  return (
    <Calendar
      value={options.value as Date}
      onChange={(e) =>
        options.filterApplyCallback(e.value as Date, options.index)
      }
      dateFormat={t('global.dateFormat', 'mm/dd/yy')}
      placeholder={t('select_date', 'Select date')}
    />
  )
}

export default DateFilterTemplate
