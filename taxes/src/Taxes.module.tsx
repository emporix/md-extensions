import { Outlet } from 'react-router'
import { RefreshValuesProvider } from './context/RefreshValuesProvider'

const TaxesModule = () => {
  return (
    <div className="module">
      <RefreshValuesProvider>
        <Outlet />
      </RefreshValuesProvider>
    </div>
  )
}

export default TaxesModule
