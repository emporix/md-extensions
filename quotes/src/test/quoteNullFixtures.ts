import { Quote, QuoteStatus } from '../models/Quotes.model'

/**
 * A quote as the backend returns it while nothing is priced and addressed
 * (COP-7125; MD `src/components/quotes/__fixtures__/quoteNullFixtures.ts` of
 * emporix/management-dashboard#1707).
 */
export const unpricedQuote = (status = QuoteStatus.CREATING): Quote =>
  ({
    id: 'q1',
    approval: { approved: false },
    businessVersion: 1,
    currency: 'EUR',
    siteCode: 'main',
    businessModel: 'B2B',
    legalEntityId: 'le1',
    company: { name: 'ACME' },
    customer: { customerId: 'c1', firstName: 'Ann', lastName: 'Smith' },
    employee: {},
    status: { value: status },
    metadata: { createdAt: '2026-01-01T00:00:00Z', mixins: {} },
    validTo: '2027-01-01T00:00:00Z',
    incompletePricing: true,
    shippingAddress: null,
    billingAddress: null,
    shippingCost: { currency: 'EUR', value: 0 },
    comment: { employeeComment: '' },
    items: [
      {
        itemId: 'i1',
        quantity: { quantity: 2, unitCode: 'pcs' },
        price: null,
        priceStatus: 'MISSING',
        product: { productId: 'p1', name: { en: 'Unpriced product' } },
      },
      {
        itemId: 'i2',
        quantity: { quantity: 1, unitCode: 'pcs' },
        priceStatus: 'MISSING',
        product: { productId: 'p2', name: { en: 'Absent price product' } },
      },
    ],
    subtotalPrice: { currency: 'EUR', netValue: 0 },
    taxAggregate: { lines: [] },
    totalPrice: { currency: 'EUR', netValue: 10, taxValue: null },
  }) as unknown as Quote
