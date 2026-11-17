import { Outlet, useLocation } from 'react-router'
import { RefreshValuesProvider } from './context/RefreshValuesProvider'

const QuotesModule = () => {
  const { pathname } = useLocation()

  return (
    <div className="module">
      {/*
        One provider per page, as MD had one per route: a refresh requested on
        a quote page must not re-fetch the list when it mounts again. `?tab=`
        changes keep the pathname, so they do not remount the page.
      */}
      <RefreshValuesProvider key={pathname}>
        <Outlet />
      </RefreshValuesProvider>
    </div>
  )
}

export default QuotesModule
