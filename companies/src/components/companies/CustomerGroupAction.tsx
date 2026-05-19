import React from 'react'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import TableActions from '../shared/TableActions'

export const CustomerGroupAction = (props: {
  customerGroupId: string
  legalEntityId: string
}) => {
  const { navigate } = useCustomNavigate()

  return (
    <TableActions
      onEdit={() => {
        //TODO IN EMD-184
        navigate(
          `/administration/customer-groups/groups/${props.customerGroupId}`,
          { query: { backTo: `${location.pathname}${location.search}` } }
        )
      }}
    />
  )
}
