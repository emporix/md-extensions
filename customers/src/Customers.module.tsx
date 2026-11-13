import { Outlet } from 'react-router'
import { RefreshValuesProvider } from './context/RefreshValuesProvider'

const CustomersModule = () => {
  return (
    <div className="module">
      <RefreshValuesProvider>
        <Outlet />
      </RefreshValuesProvider>
    </div>
  )
}

export default CustomersModule
