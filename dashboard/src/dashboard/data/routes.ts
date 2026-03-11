const BASE = '/apps/management'

export const ROUTES = {
  customers: `${BASE}/customers`,
  customer: (id: string) => `${BASE}/customers/${id}`,
  orders: `${BASE}/orders`,
  order: (id: string) => `${BASE}/orders/${id}`,
  quotes: `${BASE}/quotes`,
  quote: (id: string) => `${BASE}/quotes/${id}`,
  returns: `${BASE}/returns`,
  return: (id: string) => `${BASE}/returns/${id}`,
  carts: `${BASE}/carts`,
  cart: (id: string) => `${BASE}/carts/${id}`,
} as const
