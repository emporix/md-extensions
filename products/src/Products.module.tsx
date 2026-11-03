import { Outlet } from 'react-router'
import { RefreshValuesProvider } from './context/RefreshValuesProvider'

/** Host MD defines global `.module` padding (`1rem 2rem 1.5rem`) — same as U&G/returns. */
const ProductsModule = () => (
  <div className="module">
    <RefreshValuesProvider>
      <Outlet />
    </RefreshValuesProvider>
  </div>
)

export default ProductsModule
