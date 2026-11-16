import { useParams } from 'react-router'
import { ClassificationDataProvider } from '../context/Classification.provider'
import ClassificationAddEditPage from './ClassificationAddEdit.page'

/**
 * The key remounts the page when moving from `add` to the created
 * classification (or between classifications), so no form state leaks from one
 * into the other.
 */
const ClassificationAddEditRoute = () => {
  const { classificationId } = useParams()
  return (
    <ClassificationDataProvider key={classificationId ?? 'add'}>
      <ClassificationAddEditPage />
    </ClassificationDataProvider>
  )
}

export default ClassificationAddEditRoute
