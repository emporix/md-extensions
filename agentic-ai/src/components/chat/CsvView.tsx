import { useTranslation } from 'react-i18next'
import { parseCsv } from '../../utils/richContent/csvTable'
import type { VegaLiteSegment } from '../../utils/richContent/vegaLiteSegments'
import { RichBlockInvalid, RichBlockPending } from './RichBlockStatus'

type CsvViewProps = {
  readonly segment: VegaLiteSegment
}

export const CsvView = ({ segment }: CsvViewProps) => {
  const { t } = useTranslation()
  if (segment.kind === 'csv-pending') {
    return <RichBlockPending message={t('chat_csv_drawing')} />
  }
  if (segment.kind !== 'csv') {
    return null
  }

  const rows = parseCsv(segment.text)
  const header = rows[0]
  if (!header) {
    return (
      <RichBlockInvalid source={segment.text} message={t('chat_csv_invalid')} />
    )
  }

  const body = rows.slice(1)
  return (
    <div className="chat-csv">
      {segment.title ? (
        <p className="chat-block-title">{segment.title}</p>
      ) : null}
      <div className="chat-csv-scroll">
        <table>
          <thead>
            <tr>
              {header.map((cell, index) => (
                <th key={`${cell}-${index}`} scope="col">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
