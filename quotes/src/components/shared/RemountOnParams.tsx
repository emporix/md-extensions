import { Fragment, type ReactNode } from 'react'
import { useParams } from 'react-router'

/**
 * Remounts its children whenever the route params change (e.g. edit → add,
 * or another company), so a page never keeps the previous record's form
 * state or applies a late response for the previous route. Query-string
 * changes (`?mixin=`, `?tab=`) keep the page mounted.
 */
const RemountOnParams = ({ children }: { readonly children: ReactNode }) => {
  const params = useParams()
  const key = Object.entries(params)
    .map(([name, value]) => `${name}=${value ?? ''}`)
    .join('&')
  return <Fragment key={key}>{children}</Fragment>
}

export default RemountOnParams
