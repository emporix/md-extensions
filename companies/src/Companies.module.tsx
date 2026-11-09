import { Outlet } from 'react-router'
import { RefreshValuesProvider } from './context/RefreshValuesProvider'

const CompaniesModule = () => {
  return (
    <div className="module">
      <RefreshValuesProvider>
        <Outlet />
      </RefreshValuesProvider>
    </div>
  )
}

export default CompaniesModule
