import { useTranslation } from 'react-i18next'
import { ImportDetails } from '../../types/Job'
import { formatImportDetails } from '../../utils/importDetails'

interface ImportEntityDetailsProps {
  details?: ImportDetails[]
}

export const ImportEntityDetails = ({ details }: ImportEntityDetailsProps) => {
  const { t } = useTranslation()

  if (!details?.length) {
    return null
  }

  return (
    <ul className="import-entity-details">
      {details.map((detail, index) => (
        <li key={`${detail.code}-${detail.objectId ?? index}`}>
          {formatImportDetails(t, detail)}
        </li>
      ))}
    </ul>
  )
}
