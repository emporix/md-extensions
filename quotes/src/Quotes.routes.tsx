import { Navigate, type RouteObject } from 'react-router'
import RemoteLayout from './components/shared/RemoteLayout'
import QuotesModule from './Quotes.module'
import QuotesListPage from './pages/QuotesList.page'
import QuoteAddEditRoute from './pages/QuoteAddEdit.route'
import { quotesListPath } from './constants/paths'

/**
 * MD's quote routes (`router/Quotes.routes.tsx`) as hash routes: the list,
 * and `add` / `:quoteId` on one page in the quote provider. An unknown path
 * shows the list (MD showed its not-found page).
 */
export const quotesRoutes: RouteObject[] = [
  {
    element: <RemoteLayout />,
    children: [
      {
        element: <QuotesModule />,
        children: [
          { index: true, element: <QuotesListPage /> },
          { path: 'add', element: <QuoteAddEditRoute /> },
          { path: ':quoteId', element: <QuoteAddEditRoute /> },
          { path: '*', element: <Navigate to={quotesListPath()} replace /> },
        ],
      },
    ],
  },
]
