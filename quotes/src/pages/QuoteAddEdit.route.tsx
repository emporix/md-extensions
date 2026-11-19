import { useRef } from 'react'
import { Navigate } from 'react-router'
import { useDashboardContext } from '../context/Dashboard.context'
import { QuoteDataProvider } from '../context/Quote.provider'
import RemountOnParams from '../components/shared/RemountOnParams'
import QuotesAddEditPage from './QuotesAddEdit.page'
import { quotesListPath } from '../constants/paths'

/**
 * MD `QuoteAddEditRoute`: the quote provider remounts per id, so saving a
 * draft (`add` → its id) starts a fresh form, and without an id it loads
 * nothing. A host tenant switch leaves for the list: the quote belongs to the
 * previous tenant, and the unmounted provider drops its late response.
 */
const QuoteAddEditRoute = () => {
  const { tenant } = useDashboardContext()
  const openedForTenant = useRef(tenant)

  if (tenant !== openedForTenant.current) {
    return <Navigate to={quotesListPath()} replace />
  }

  return (
    <RemountOnParams>
      <QuoteDataProvider>
        <QuotesAddEditPage />
      </QuoteDataProvider>
    </RemountOnParams>
  )
}

export default QuoteAddEditRoute
