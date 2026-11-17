import { Outlet } from 'react-router'
import { NavigationBlocker } from '../../context/NavigationConfirmProvider'

/** Root of the remote's routes: the unsaved-changes confirm, then the page. */
const RemoteLayout = () => (
  <>
    <NavigationBlocker />
    <Outlet />
  </>
)

export default RemoteLayout
