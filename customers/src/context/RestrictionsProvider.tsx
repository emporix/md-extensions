import React, {
  createContext,
  FC,
  useContext,
  useEffect,
  useState,
} from 'react'
import { Props } from '../helpers/props'
import { usePermissions } from './PermissionsProvider'

interface RestrictionsContextType {
  quoteRestrictions: string[] | null
  customerRestrictions: string[] | null
  companyRestrictions: string[] | null
  orderRestrictions: string[] | null
  cartRestrictions: string[] | null
}

const RestrictionsContext = createContext<RestrictionsContextType>({
  quoteRestrictions: null,
  customerRestrictions: null,
  companyRestrictions: null,
  orderRestrictions: null,
  cartRestrictions: null,
})

export const useRestrictions = () => useContext(RestrictionsContext)

/** Same logic as Management Dashboard; userScopes from host are empty in extension. */
export const RestrictionsProvider: FC<Props> = ({ children }) => {
  const { userScopes } = usePermissions()
  const [quoteRestrictions, setQuoteRestrictions] = useState<string[] | null>(
    null
  )
  const [customerRestrictions, setCustomerRestrictions] = useState<
    string[] | null
  >(null)
  const [companyRestrictions, setCompanyRestrictions] = useState<
    string[] | null
  >(null)
  const [orderRestrictions, setOrderRestrictions] = useState<string[] | null>(
    null
  )
  const [cartRestrictions, setCartRestrictions] = useState<string[] | null>(
    null
  )

  useEffect(() => {
    parseQuoteRestrictions()
    parseCustomerRestrictions()
    parseCompanyRestrictions()
    parseOrderRestrictions()
    parseCartRestrictions()
  }, [userScopes])

  const parseRestrictions = (scopes: string[]): string[] | null => {
    const hasUnrestricted = scopes.some((scope) =>
      userScopes.some((userScope) => userScope === scope)
    )

    if (hasUnrestricted) {
      return null
    }

    for (const scope of scopes) {
      const restrictedScope = userScopes.find((userScope) =>
        userScope.startsWith(scope + '--')
      )
      if (restrictedScope) {
        const restrictionsString = restrictedScope.split('--')[1]
        return restrictionsString.split('#')
      }
    }

    return null
  }

  const parseQuoteRestrictions = () => {
    const restrictions = parseRestrictions([
      'quote.quote_manage',
      'quote.quote_read',
    ])
    setQuoteRestrictions(restrictions)
  }

  const parseCustomerRestrictions = () => {
    const restrictions = parseRestrictions([
      'customer.customer_manage',
      'customer.customer_read',
    ])
    setCustomerRestrictions(restrictions)
  }

  const parseCompanyRestrictions = () => {
    const restrictions = parseRestrictions([
      'customermanagement.legalentity_manage',
      'customermanagement.legalentity_read',
    ])
    setCompanyRestrictions(restrictions)
  }

  const parseOrderRestrictions = () => {
    const restrictions = parseRestrictions([
      'order.order_read',
      'order.order_read',
      'order.order_create',
      'order.order_update',
      'order.order_post',
    ])
    setOrderRestrictions(restrictions)
  }

  const parseCartRestrictions = () => {
    const restrictions = parseRestrictions(['cart.cart_manage'])
    setCartRestrictions(restrictions)
  }

  return (
    <RestrictionsContext.Provider
      value={{
        quoteRestrictions,
        customerRestrictions,
        companyRestrictions,
        orderRestrictions,
        cartRestrictions,
      }}
    >
      {children}
    </RestrictionsContext.Provider>
  )
}
