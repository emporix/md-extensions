import TableActions from '../shared/TableActions'
import { HOST_CUSTOMER_GROUP_PATH } from '../../constants/paths'
import { assignHostLocation } from '../../helpers/hostUrls'

/**
 * Customer groups is another federated remote: the edit action leaves this
 * remote for the host route (MD `customerGroupDetailUrl`).
 */
export const CustomerGroupAction = (props: {
  readonly customerGroupId: string
}) => {
  return (
    <TableActions
      onEdit={() => {
        assignHostLocation(HOST_CUSTOMER_GROUP_PATH(props.customerGroupId))
      }}
    />
  )
}
