import type { ComponentType } from 'react'
import type { WidgetDefinition } from '../models/DashboardContext.types'
import { CustomersWidget } from '../widgets/CustomersWidget/CustomersWidget'
import { EmployeesWidget } from '../widgets/EmployeesWidget/EmployeesWidget'
import { RevenueOverTimeWidget } from '../widgets/RevenueOverTimeWidget/RevenueOverTimeWidget'
import { OrdersOverTimeWidget } from '../widgets/OrdersOverTimeWidget/OrdersOverTimeWidget'
import { AvgBasketOverTimeWidget } from '../widgets/AvgBasketOverTimeWidget/AvgBasketOverTimeWidget'
import { GrossRevenueKpiWidget } from '../widgets/GrossRevenueKpiWidget/GrossRevenueKpiWidget'
import { TotalOrderCountKpiWidget } from '../widgets/TotalOrderCountKpiWidget/TotalOrderCountKpiWidget'
import { AverageBasketKpiWidget } from '../widgets/AverageBasketKpiWidget/AverageBasketKpiWidget'
import { TotalCustomersKpiWidget } from '../widgets/TotalCustomersKpiWidget/TotalCustomersKpiWidget'
import { OrdersInProgressWidget } from '../widgets/OrdersInProgressWidget/OrdersInProgressWidget'
import { LastOrdersTimelineWidget } from '../widgets/LastOrdersTimelineWidget/LastOrdersTimelineWidget'
import { LastOrdersTableWidget } from '../widgets/LastOrdersTableWidget/LastOrdersTableWidget'
import { LastQuotesTimelineWidget } from '../widgets/LastQuotesTimelineWidget/LastQuotesTimelineWidget'
import { LastQuotesTableWidget } from '../widgets/LastQuotesTableWidget/LastQuotesTableWidget'
import { OrdersByCountryMapWidget } from '../widgets/OrdersByCountryMapWidget/OrdersByCountryMapWidget'
import { TotalReturnsKpiWidget } from '../widgets/TotalReturnsKpiWidget/TotalReturnsKpiWidget'
import { LastReturnsTableWidget } from '../widgets/LastReturnsTableWidget/LastReturnsTableWidget'
import { TotalProductsKpiWidget } from '../widgets/TotalProductsKpiWidget/TotalProductsKpiWidget'
import { TotalVendorsKpiWidget } from '../widgets/TotalVendorsKpiWidget/TotalVendorsKpiWidget'
import { OpenCartsKpiWidget } from '../widgets/OpenCartsKpiWidget/OpenCartsKpiWidget'
import { AbandonedCartsTableWidget } from '../widgets/AbandonedCartsTableWidget/AbandonedCartsTableWidget'
import { TotalCouponsKpiWidget } from '../widgets/TotalCouponsKpiWidget/TotalCouponsKpiWidget'
import { GrossQuoteVolumeKpiWidget } from '../widgets/GrossQuoteVolumeKpiWidget/GrossQuoteVolumeKpiWidget'
import { TotalQuoteCountKpiWidget } from '../widgets/TotalQuoteCountKpiWidget/TotalQuoteCountKpiWidget'
import { AverageQuoteValueKpiWidget } from '../widgets/AverageQuoteValueKpiWidget/AverageQuoteValueKpiWidget'
import { AcceptedQuotesKpiWidget } from '../widgets/AcceptedQuotesKpiWidget/AcceptedQuotesKpiWidget'
import { CancelledQuotesKpiWidget } from '../widgets/CancelledQuotesKpiWidget/CancelledQuotesKpiWidget'
import { QuoteVolumeOverTimeWidget } from '../widgets/QuoteVolumeOverTimeWidget/QuoteVolumeOverTimeWidget'
import { QuotesOverTimeWidget } from '../widgets/QuotesOverTimeWidget/QuotesOverTimeWidget'
import { AvgQuoteValueOverTimeWidget } from '../widgets/AvgQuoteValueOverTimeWidget/AvgQuoteValueOverTimeWidget'

export type RegisteredWidget = WidgetDefinition & {
  component: ComponentType
}

export const WIDGET_REGISTRY: Record<string, RegisteredWidget> = {
  customers: {
    id: 'customers',
    label: 'Customers',
    defaultColSpan: 12,
    defaultRowSpan: 4,
    component: CustomersWidget,
  },
  employees: {
    id: 'employees',
    label: 'Employees',
    defaultColSpan: 12,
    defaultRowSpan: 4,
    component: EmployeesWidget,
  },
  revenueOverTime: {
    id: 'revenueOverTime',
    label: 'Revenue over time',
    defaultColSpan: 8,
    defaultRowSpan: 3,
    component: RevenueOverTimeWidget,
  },
  ordersOverTime: {
    id: 'ordersOverTime',
    label: 'Orders over time',
    defaultColSpan: 8,
    defaultRowSpan: 3,
    component: OrdersOverTimeWidget,
  },
  avgBasketOverTime: {
    id: 'avgBasketOverTime',
    label: 'Avg. basket over time',
    defaultColSpan: 8,
    defaultRowSpan: 3,
    component: AvgBasketOverTimeWidget,
  },
  grossRevenueKpi: {
    id: 'grossRevenueKpi',
    label: 'Gross Revenue',
    defaultColSpan: 6,
    defaultRowSpan: 2,
    component: GrossRevenueKpiWidget,
  },
  totalOrderCountKpi: {
    id: 'totalOrderCountKpi',
    label: 'Total Order Count',
    defaultColSpan: 6,
    defaultRowSpan: 2,
    component: TotalOrderCountKpiWidget,
  },
  averageBasketKpi: {
    id: 'averageBasketKpi',
    label: 'Average Basket Size',
    defaultColSpan: 6,
    defaultRowSpan: 2,
    component: AverageBasketKpiWidget,
  },
  totalCustomersKpi: {
    id: 'totalCustomersKpi',
    label: 'Total Customers',
    defaultColSpan: 6,
    defaultRowSpan: 2,
    component: TotalCustomersKpiWidget,
  },
  ordersInProgress: {
    id: 'ordersInProgress',
    label: 'Orders in progress',
    defaultColSpan: 8,
    defaultRowSpan: 3,
    component: OrdersInProgressWidget,
  },
  lastOrdersTimeline: {
    id: 'lastOrdersTimeline',
    label: 'Last orders (timeline)',
    defaultColSpan: 8,
    defaultRowSpan: 3,
    component: LastOrdersTimelineWidget,
  },
  lastOrdersTable: {
    id: 'lastOrdersTable',
    label: 'Last orders (table)',
    defaultColSpan: 8,
    defaultRowSpan: 3,
    component: LastOrdersTableWidget,
  },
  lastQuotesTimeline: {
    id: 'lastQuotesTimeline',
    label: 'Last quotes (timeline)',
    defaultColSpan: 8,
    defaultRowSpan: 3,
    component: LastQuotesTimelineWidget,
  },
  lastQuotesTable: {
    id: 'lastQuotesTable',
    label: 'Last quotes (table)',
    defaultColSpan: 8,
    defaultRowSpan: 3,
    component: LastQuotesTableWidget,
  },
  ordersByCountryMap: {
    id: 'ordersByCountryMap',
    label: 'Orders by country',
    defaultColSpan: 12,
    defaultRowSpan: 4,
    component: OrdersByCountryMapWidget,
  },
  totalReturnsKpi: {
    id: 'totalReturnsKpi',
    label: 'Total Returns',
    defaultColSpan: 6,
    defaultRowSpan: 2,
    component: TotalReturnsKpiWidget,
  },
  lastReturnsTable: {
    id: 'lastReturnsTable',
    label: 'Last returns (table)',
    defaultColSpan: 8,
    defaultRowSpan: 3,
    component: LastReturnsTableWidget,
  },
  totalProductsKpi: {
    id: 'totalProductsKpi',
    label: 'Total Products',
    defaultColSpan: 6,
    defaultRowSpan: 2,
    component: TotalProductsKpiWidget,
  },
  totalVendorsKpi: {
    id: 'totalVendorsKpi',
    label: 'Total Vendors',
    defaultColSpan: 6,
    defaultRowSpan: 2,
    component: TotalVendorsKpiWidget,
  },
  openCartsKpi: {
    id: 'openCartsKpi',
    label: 'Open Carts',
    defaultColSpan: 6,
    defaultRowSpan: 2,
    component: OpenCartsKpiWidget,
  },
  abandonedCartsTable: {
    id: 'abandonedCartsTable',
    label: 'Abandoned Carts',
    defaultColSpan: 8,
    defaultRowSpan: 6,
    component: AbandonedCartsTableWidget,
  },
  totalCouponsKpi: {
    id: 'totalCouponsKpi',
    label: 'Total Coupons',
    defaultColSpan: 6,
    defaultRowSpan: 2,
    component: TotalCouponsKpiWidget,
  },
  grossQuoteVolumeKpi: {
    id: 'grossQuoteVolumeKpi',
    label: 'Gross Quote Volume',
    defaultColSpan: 6,
    defaultRowSpan: 2,
    component: GrossQuoteVolumeKpiWidget,
  },
  totalQuoteCountKpi: {
    id: 'totalQuoteCountKpi',
    label: 'Total Quote Count',
    defaultColSpan: 6,
    defaultRowSpan: 2,
    component: TotalQuoteCountKpiWidget,
  },
  averageQuoteValueKpi: {
    id: 'averageQuoteValueKpi',
    label: 'Average Quote Value',
    defaultColSpan: 6,
    defaultRowSpan: 2,
    component: AverageQuoteValueKpiWidget,
  },
  acceptedQuotesKpi: {
    id: 'acceptedQuotesKpi',
    label: 'Accepted Quotes',
    defaultColSpan: 6,
    defaultRowSpan: 2,
    component: AcceptedQuotesKpiWidget,
  },
  cancelledQuotesKpi: {
    id: 'cancelledQuotesKpi',
    label: 'Cancelled Quotes',
    defaultColSpan: 6,
    defaultRowSpan: 2,
    component: CancelledQuotesKpiWidget,
  },
  quoteVolumeOverTime: {
    id: 'quoteVolumeOverTime',
    label: 'Quote volume over time',
    defaultColSpan: 8,
    defaultRowSpan: 3,
    component: QuoteVolumeOverTimeWidget,
  },
  quotesOverTime: {
    id: 'quotesOverTime',
    label: 'Quotes over time',
    defaultColSpan: 8,
    defaultRowSpan: 3,
    component: QuotesOverTimeWidget,
  },
  avgQuoteValueOverTime: {
    id: 'avgQuoteValueOverTime',
    label: 'Avg. quote value over time',
    defaultColSpan: 8,
    defaultRowSpan: 3,
    component: AvgQuoteValueOverTimeWidget,
  },
}

export const getAvailableWidgetIds = (): string[] =>
  Object.keys(WIDGET_REGISTRY)

export const getWidgetDefinition = (id: string): RegisteredWidget | undefined =>
  WIDGET_REGISTRY[id]

export const getDefaultLayout = (
  id: string
): { colSpan: number; rowSpan: number } => {
  const def = WIDGET_REGISTRY[id]
  return {
    colSpan: def?.defaultColSpan ?? 1,
    rowSpan: def?.defaultRowSpan ?? 1,
  }
}
