import { Outlet } from 'react-router'
import { RefreshValuesProvider } from './context/RefreshValuesProvider'

const ClassificationsModule = () => {
  return (
    <div className="module">
      <RefreshValuesProvider>
        <Outlet />
      </RefreshValuesProvider>
    </div>
  )
}

export default ClassificationsModule
