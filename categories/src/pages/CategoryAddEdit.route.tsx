import { useParams } from 'react-router'
import { CategoryDataProvider } from '../context/Category.provider'
import CategoryAddEditPage from './CategoryAddEdit.page'

/**
 * The key remounts the page when moving from `add` to the created category, so
 * no form state from the create form leaks into the edit form (MD
 * `CategoryAddEditRoute`).
 */
const CategoryAddEditRoute = () => {
  const { categoryId } = useParams()
  return (
    <CategoryDataProvider key={categoryId ?? 'add'}>
      <CategoryAddEditPage />
    </CategoryDataProvider>
  )
}

export default CategoryAddEditRoute
