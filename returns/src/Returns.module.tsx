import { Outlet } from 'react-router'
import { RefreshValuesProvider } from './context/RefreshValuesProvider'

const ReturnsModule = () => (
  <div className="module">
    <RefreshValuesProvider>
      <Outlet />
    </RefreshValuesProvider>
  </div>
)

export default ReturnsModule
