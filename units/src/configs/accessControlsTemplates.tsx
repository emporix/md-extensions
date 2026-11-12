import { AccessControlsForEmployee } from './accessControls'
import Localized from '../models/Localized.model'

export interface AccessControlsTemplate {
  id: string
  name: Localized
  accessControls: string[]
}

export const DCP_TEMPLATES: AccessControlsTemplate[] = [
  {
    id: 'orderFulfillmentManager',
    name: {
      de: 'Auftragserfüllungsmanager',
      en: 'Order Fulfillment Manager',
    },
    accessControls: [
      AccessControlsForEmployee.ORDERS_MANAGER,
      AccessControlsForEmployee.PAYMENT_TRANSACTIONS_MANAGER,
      AccessControlsForEmployee.PAYMENT_REFUNDS_MANAGER,
      AccessControlsForEmployee.ADMIN_STATISTICS_MANAGER,
      AccessControlsForEmployee.SHIPPING_NOTE_MANAGER,
      AccessControlsForEmployee.SHIPPING_EMAIL_MANAGER,
      AccessControlsForEmployee.CONFIGURATION_MANAGER,
      AccessControlsForEmployee.INVOICE_MANAGER,
      AccessControlsForEmployee.HTML2PDF_VIEWER,
      AccessControlsForEmployee.SEPA_JOBS_MANAGER,
      AccessControlsForEmployee.CUSTOMERS_VIEWER,
      AccessControlsForEmployee.IAM_GROUPS_VIEWER,
      AccessControlsForEmployee.SITES_VIEWER,
      AccessControlsForEmployee.PAYMENT_MODE_VIEWER,
    ],
  },
  {
    id: 'catalogManager',
    name: {
      en: 'Catalog Manager',
      de: 'Katalogmanager',
    },
    accessControls: [
      AccessControlsForEmployee.CATALOGS_MANAGER,
      AccessControlsForEmployee.CONFIGURATION_MANAGER,
      AccessControlsForEmployee.PRODUCTS_MANAGER,
      AccessControlsForEmployee.AVAILABILITY_MANAGER,
      AccessControlsForEmployee.MEDIA_MANAGER,
      AccessControlsForEmployee.PRICES_MANAGER,
      AccessControlsForEmployee.ADMIN_STATISTICS_MANAGER,
      AccessControlsForEmployee.PRODUCT_TEMPLATES_VIEWER,
      AccessControlsForEmployee.LABELS_MANAGER,
      AccessControlsForEmployee.BRANDS_MANAGER,
      AccessControlsForEmployee.SUPPLIERS_MANAGER,
      AccessControlsForEmployee.PRODUCT_TEMPLATES_MANAGER,
      AccessControlsForEmployee.WEBHOOKS_MANAGER,
    ],
  },
  {
    id: 'pricingManager',
    name: {
      en: 'Pricing Manager',
      de: 'Preismanager',
    },
    accessControls: [
      AccessControlsForEmployee.PRICE_LISTS_MANAGER,
      AccessControlsForEmployee.PRICES_VIEWER,
      AccessControlsForEmployee.PRICE_MODELS_MANAGER,
      AccessControlsForEmployee.UNITS_MANAGER,
      AccessControlsForEmployee.TAXES_MANAGER,
      AccessControlsForEmployee.PRODUCTS_MANAGER,
      AccessControlsForEmployee.AVAILABILITY_MANAGER,
      AccessControlsForEmployee.MEDIA_MANAGER,
      AccessControlsForEmployee.PRICES_MANAGER,
      AccessControlsForEmployee.ADMIN_STATISTICS_MANAGER,
      AccessControlsForEmployee.PRODUCT_TEMPLATES_VIEWER,
      AccessControlsForEmployee.CONFIGURATION_MANAGER,
      AccessControlsForEmployee.CURRENCIES_MANAGER,
      AccessControlsForEmployee.COUNTRIES_MANAGER,
      AccessControlsForEmployee.CONFIGURATION_MANAGER,
      AccessControlsForEmployee.CATALOGS_VIEWER,
      AccessControlsForEmployee.CATEGORIES_VIEWER,
      AccessControlsForEmployee.MEDIA_VIEWER,
      AccessControlsForEmployee.PRODUCT_TEMPLATES_VIEWER,
      AccessControlsForEmployee.IAM_GROUPS_VIEWER,
      AccessControlsForEmployee.IAM_TEMPLATES_VIEWER,
      AccessControlsForEmployee.IAM_USERS_VIEWER,
      AccessControlsForEmployee.ACCESS_CONTROLS_VIEWER,
    ],
  },
]

export const OE_TEMPLATES: AccessControlsTemplate[] = []
