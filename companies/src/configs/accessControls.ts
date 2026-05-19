interface Domain {
  id: string;
  accessControls: string[];
}

// Access Controls and Domains for OE

export enum AccessControlsForOe {
  DIGITAL_PROCESSES_VIEWER = "5ac869fc-d548-4ec8-cccc-c01491314101",
  DIGITAL_PROCESSES_EDITOR = "5ac869fc-d548-4ec8-cccc-c01491314102",
  DIGITAL_PROCESSES_MANAGER = "5ac869fc-d548-4ec8-cccc-c01491314103",
  DIGITAL_PROCESSES_ADMIN = "5ac869fc-d548-4ec8-cccc-c01491314104",
  FORMS_VIEWER = "5ac869fc-d548-4ec8-cccc-c01491314105",
  FORMS_EDITOR = "5ac869fc-d548-4ec8-cccc-c01491314106",
  FORMS_MANAGER = "5ac869fc-d548-4ec8-cccc-c01491314107",
  FORMS_ADMIN = "5ac869fc-d548-4ec8-cccc-c01491314108",
  SCHEDULERS_VIEWER = "5ac869fc-d548-4ec8-cccc-c01491314109",
  SCHEDULERS_EDITOR = "5ac869fc-d548-4ec8-cccc-c01491314110",
  SCHEDULERS_MANAGER = "5ac869fc-d548-4ec8-cccc-c01491314111",
  SCHEDULERS_ADMIN = "5ac869fc-d548-4ec8-cccc-c01491314112",
  BUSINESS_RULES_VIEWER = "5ac869fc-d548-4ec8-cccc-c01491314113",
  BUSINESS_RULES_EDITOR = "5ac869fc-d548-4ec8-cccc-c01491314114",
  BUSINESS_RULES_MANAGER = "5ac869fc-d548-4ec8-cccc-c01491314115",
  BUSINESS_RULES_ADMIN = "5ac869fc-d548-4ec8-cccc-c01491314116",
}

export enum OeDomains {
  DIGITAL_PROCESSES_VIEWER = "Digital Processes Viewer",
  DIGITAL_PROCESSES_EDITOR = "Digital Processes Editor",
  DIGITAL_PROCESSES_MANAGER = "Digital Processes Manager",
  DIGITAL_PROCESSES_ADMINISTRATOR = "Digital Processes Administrator",
  FORMS_VIEWER = "Forms Viewer",
  FORMS_EDITOR = "Forms Editor",
  FORMS_MANAGER = "Forms Manager",
  FORMS_ADMINISTRATOR = "Forms Administrator",
  SCHEDULERS_VIEWER = "Schedules Viewer",
  SCHEDULERS_EDITOR = "Schedules Editor",
  SCHEDULERS_MANAGER = "Schedules Manager",
  SCHEDULERS_ADMINISTRATOR = "Schedules Administrator",
  BUSINESS_RULES_VIEWER = "Business Rules Viewer",
  BUSINESS_RULES_EDITOR = "Business Rules Editor",
  BUSINESS_RULES_MANAGER = "Business Rules Manager",
  BUSINESS_RULES_ADMINISTRATOR = "Business Rules Administrator",
}

export const OE_DOMAINS: Domain[] = [
  {
    id: OeDomains.DIGITAL_PROCESSES_VIEWER,
    accessControls: [AccessControlsForOe.DIGITAL_PROCESSES_VIEWER],
  },
  {
    id: OeDomains.DIGITAL_PROCESSES_EDITOR,
    accessControls: [AccessControlsForOe.DIGITAL_PROCESSES_EDITOR],
  },
  {
    id: OeDomains.DIGITAL_PROCESSES_MANAGER,
    accessControls: [AccessControlsForOe.DIGITAL_PROCESSES_MANAGER],
  },
  {
    id: OeDomains.DIGITAL_PROCESSES_ADMINISTRATOR,
    accessControls: [AccessControlsForOe.DIGITAL_PROCESSES_ADMIN],
  },
  {
    id: OeDomains.FORMS_VIEWER,
    accessControls: [AccessControlsForOe.FORMS_VIEWER],
  },
  {
    id: OeDomains.FORMS_EDITOR,
    accessControls: [AccessControlsForOe.FORMS_EDITOR],
  },
  {
    id: OeDomains.FORMS_MANAGER,
    accessControls: [AccessControlsForOe.FORMS_MANAGER],
  },
  {
    id: OeDomains.FORMS_ADMINISTRATOR,
    accessControls: [AccessControlsForOe.FORMS_ADMIN],
  },
  {
    id: OeDomains.SCHEDULERS_VIEWER,
    accessControls: [AccessControlsForOe.SCHEDULERS_VIEWER],
  },
  {
    id: OeDomains.SCHEDULERS_EDITOR,
    accessControls: [AccessControlsForOe.SCHEDULERS_EDITOR],
  },
  {
    id: OeDomains.SCHEDULERS_MANAGER,
    accessControls: [AccessControlsForOe.SCHEDULERS_MANAGER],
  },
  {
    id: OeDomains.SCHEDULERS_ADMINISTRATOR,
    accessControls: [AccessControlsForOe.SCHEDULERS_ADMIN],
  },
  {
    id: OeDomains.BUSINESS_RULES_VIEWER,
    accessControls: [AccessControlsForOe.BUSINESS_RULES_VIEWER],
  },
  {
    id: OeDomains.BUSINESS_RULES_EDITOR,
    accessControls: [AccessControlsForOe.BUSINESS_RULES_EDITOR],
  },
  {
    id: OeDomains.BUSINESS_RULES_MANAGER,
    accessControls: [AccessControlsForOe.BUSINESS_RULES_MANAGER],
  },
  {
    id: OeDomains.BUSINESS_RULES_ADMINISTRATOR,
    accessControls: [AccessControlsForOe.BUSINESS_RULES_ADMIN],
  },
];

// Access Controls and Domains for VENDOR

export enum AccessControlsForVendor {
  VENDOR_ORDERS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314231",
  VENDOR_ORDERS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314223",
  VENDOR_PRODUCTS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314232",
  VENDOR_PRODUCTS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314224",
  VENDOR_PRICES_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314235",
  VENDOR_PRICES_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314227",
  VENDOR_AVAILABILITY_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314234",
  VENDOR_AVAILABILITY_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314226",
  VENDOR_MEDIA_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314236",
  VENDOR_MEDIA_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314228",
  VENDOR_PRODUCT_PUBLISH_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314229",
  VENDOR_PRODUCT_UNPUBLISH_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314230",
  PRODUCT_TEMPLATES_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314199",
  PRICE_MODELS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314157",
  TAXES_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314168",
}

export enum VendorDomains {
  VENDOR_ORDERS_VIEWER = "Vendor Orders Viewer",
  VENDOR_ORDERS_MANAGER = "Vendor Orders Manager",
  VENDOR_PRODUCTS_VIEWER = "Vendor Products Viewer",
  VENDOR_PRODUCTS_MANAGER = "Vendor Products Manager",
  VENDOR_PRODUCT_PUBLISH_MANAGER = "Vendor Product Publish Manager",
  VENDOR_PRODUCT_UNPUBLISH_MANAGER = "Vendor Product Unpublish Manager",
  VENDOR_PRICES_VIEWER = "Vendor Prices Viewer",
  VENDOR_PRICES_MANAGER = "Vendor Prices Manager",
  VENDOR_AVAILABILITY_VIEWER = "Vendor Availability Viewer",
  VENDOR_AVAILABILITY_MANAGER = "Vendor Availability Manager",
  VENDOR_MEDIA_VIEWER = "Vendor Media Viewer",
  VENDOR_MEDIA_MANAGER = "Vendor Media Manager",
}

export const VENDOR_DOMAINS: Domain[] = [
  {
    id: VendorDomains.VENDOR_ORDERS_VIEWER,
    accessControls: [AccessControlsForVendor.VENDOR_ORDERS_VIEWER],
  },
  {
    id: VendorDomains.VENDOR_ORDERS_MANAGER,
    accessControls: [AccessControlsForVendor.VENDOR_ORDERS_MANAGER],
  },
  {
    id: VendorDomains.VENDOR_PRODUCTS_VIEWER,
    accessControls: [
      AccessControlsForVendor.VENDOR_PRODUCTS_VIEWER,
      AccessControlsForVendor.PRODUCT_TEMPLATES_VIEWER,
    ],
  },
  {
    id: VendorDomains.VENDOR_PRODUCTS_MANAGER,
    accessControls: [AccessControlsForVendor.VENDOR_PRODUCTS_MANAGER],
  },
  {
    id: VendorDomains.VENDOR_PRODUCT_PUBLISH_MANAGER,
    accessControls: [AccessControlsForVendor.VENDOR_PRODUCT_PUBLISH_MANAGER],
  },
  {
    id: VendorDomains.VENDOR_PRODUCT_UNPUBLISH_MANAGER,
    accessControls: [AccessControlsForVendor.VENDOR_PRODUCT_UNPUBLISH_MANAGER],
  },
  {
    id: VendorDomains.VENDOR_PRICES_VIEWER,
    accessControls: [
      AccessControlsForVendor.VENDOR_PRICES_VIEWER,
      AccessControlsForVendor.PRICE_MODELS_VIEWER,
      AccessControlsForVendor.TAXES_VIEWER,
    ],
  },
  {
    id: VendorDomains.VENDOR_PRICES_MANAGER,
    accessControls: [
      AccessControlsForVendor.VENDOR_PRICES_MANAGER,
      AccessControlsForVendor.PRICE_MODELS_VIEWER,
      AccessControlsForVendor.TAXES_VIEWER,
    ],
  },
  {
    id: VendorDomains.VENDOR_AVAILABILITY_VIEWER,
    accessControls: [AccessControlsForVendor.VENDOR_AVAILABILITY_VIEWER],
  },
  {
    id: VendorDomains.VENDOR_AVAILABILITY_MANAGER,
    accessControls: [AccessControlsForVendor.VENDOR_AVAILABILITY_MANAGER],
  },
  {
    id: VendorDomains.VENDOR_MEDIA_VIEWER,
    accessControls: [AccessControlsForVendor.VENDOR_MEDIA_VIEWER],
  },
  {
    id: VendorDomains.VENDOR_MEDIA_MANAGER,
    accessControls: [AccessControlsForVendor.VENDOR_MEDIA_MANAGER],
  },
];

// Access Controls and Domains for CUSTOMER

export enum AccessControlsForCustomer {
  LEGAL_ENTITY_ORDERS_VIEWER = "2ac869fc-d548-4ec8-8e06-c01491314214",
  LEGAL_ENTITY_READ_OWN_LEGAL_ENTITIES = "2ac869fc-d548-4ec8-8e06-c01491314199",
  LEGAL_ENTITY_MANAGE_USERS = "2ac869fc-d548-4ec8-8e06-c01491314208",
  LEGAL_ENTITY_ASSIGN_USERS = "2ac869fc-d548-4ec8-8e06-c01491314211",
  LEGAL_ENTITY_USER_READ_OWN = "2ac869fc-d548-4ec8-8e06-c01491314210",
  LEGAL_ENTITY_ORDER_WITHOUT_LIMIT = "2ac869fc-d548-4ec8-8e06-c01491314215",
  LEGAL_ENTITY_ORDER_UP_TO_LIMIT = "2ac869fc-d548-4ec8-8e06-c01491314216",
}

export enum CustomerDomains {
  CUSTOMER_ORDER_VIEWER = "Customer Orders Viewer",
  CUSTOMER_USERS_MANAGER = "Customer Users Manager",
  CUSTOMERS_CHECKOUT_ADMINISTRATOR = "Customer Checkout Administrator",
  CUSTOMERS_CHECKOUT_MANAGER = "Customer Checkout Manager",
}

export const CUSTOMER_DOMAINS: Domain[] = [
  {
    id: CustomerDomains.CUSTOMER_ORDER_VIEWER,
    accessControls: [AccessControlsForCustomer.LEGAL_ENTITY_ORDERS_VIEWER],
  },
  {
    id: CustomerDomains.CUSTOMERS_CHECKOUT_MANAGER,
    accessControls: [AccessControlsForCustomer.LEGAL_ENTITY_ORDER_UP_TO_LIMIT],
  },
  {
    id: CustomerDomains.CUSTOMERS_CHECKOUT_ADMINISTRATOR,
    accessControls: [
      AccessControlsForCustomer.LEGAL_ENTITY_ORDER_WITHOUT_LIMIT,
    ],
  },
  {
    id: CustomerDomains.CUSTOMER_USERS_MANAGER,
    accessControls: [
      AccessControlsForCustomer.LEGAL_ENTITY_READ_OWN_LEGAL_ENTITIES,
      AccessControlsForCustomer.LEGAL_ENTITY_USER_READ_OWN,
      AccessControlsForCustomer.LEGAL_ENTITY_MANAGE_USERS,
      AccessControlsForCustomer.LEGAL_ENTITY_ASSIGN_USERS,
    ],
  },
];

// Access Controls and Domains for EMPLOYEE

export enum AccessControlsForEmployee {
  AGENT_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314233",
  AGENT_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314225",
  LEGAL_ENTITIES_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314195",
  LEGAL_ENTITIES_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314195",
  CONTACT_ASSIGNMENTS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314198",
  CONTACT_ASSIGNMENTS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314198",
  LOCATIONS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314196",
  LOCATIONS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314196",
  CUSTOMERS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314122",
  CUSTOMERS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314122",
  SEGMENTS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314228",
  SEGMENTS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314219",
  COUPONS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314205",
  COUPONS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314120",
  QUOTES_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314203",
  QUOTES_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314202",
  ORDERS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314143",
  ORDERS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314143",
  SHIPPING_NOTE_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314153",
  SHIPPING_EMAIL_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314133",
  INVOICE_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314140",
  HISTORY_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314144",
  HTML2PDF_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314136",
  PAYMENT_TRANSACTIONS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314223",
  PAYMENT_TRANSACTIONS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314211",
  PAYMENT_REFUNDS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314209",
  SEPA_JOBS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314172",
  SEPA_JOBS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314172",
  SEPA_MEDIA_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314161",
  RETURNS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314200",
  RETURNS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314200",
  CATALOGS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314113",
  CATALOGS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314113",
  CATEGORIES_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314114",
  CATEGORIES_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314114",
  PRODUCTS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314158",
  PRODUCTS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314158",
  AVAILABILITY_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314102",
  AVAILABILITY_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314102",
  MEDIA_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314202",
  MEDIA_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314201",
  PRICES_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314226",
  PRICES_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314155",
  PRODUCT_TEMPLATES_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314199",
  PRODUCT_TEMPLATES_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314199",
  LABELS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314208",
  LABELS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314141",
  SUPPLIERS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314207",
  SUPPLIERS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314173",
  BRANDS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314206",
  BRANDS_MANAGER = "4ac869fc-d548-4ec8-8e06-c0149131411",
  PRICE_MODELS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314157",
  PRICE_MODELS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314157",
  PRICE_LISTS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314170",
  PRICE_LISTS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314192",
  SITES_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314167",
  SITES_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314167",
  PAYMENT_MODE_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314224",
  PAYMENT_MODE_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314206",
  AREAS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314211",
  AREAS_MANAGE = "4ac869fc-d548-4ec8-8e06-c01491314125",
  TIME_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314212",
  TIME_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314126",
  SHIPPING_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314225",
  SHIPPING_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314165",
  UNITS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314169",
  UNITS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314169",
  TAXES_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314168",
  TAXES_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314168",
  COUNTRIES_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314213",
  COUNTRIES_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314175",
  CURRENCIES_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314214",
  CURRENCIES_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314121",
  LANGUAGES_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314210",
  LANGUAGES_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314215",
  EXTENSIONS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314209",
  EXTENSIONS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314214",
  SYSTEM_PREFERENCES_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314215",
  SYSTEM_PREFERENCES_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314218",
  CONFIGURATION_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314117",
  CONFIGURATION_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314117",
  SCHEMA_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314227",
  SCHEMA_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314212",
  IAM_GROUPS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314219",
  IAM_GROUPS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314188",
  IAM_TEMPLATES_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314222",
  IAM_TEMPLATES_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314190",
  IAM_USERS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314218",
  IAM_USERS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314185",
  IAM_ASSIGNMENTS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314191",
  WEBHOOKS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314193",
  WEBHOOKS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314193",
  FEATURE_TOGGLES_VIEWER = "5ac869fc-d548-4ec8-0000-c01491314171",
  FEATURE_TOGGLES_MANAGER = "5ac869fc-d548-4ec8-0000-c01491314172",
  CUSTOM_INSTANCES_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314229",
  CUSTOM_INSTANCES_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314220",
  CARTS_VIEWER = "4ac869fc-d548-4ec8-8e06-c01491314112",
  CARTS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314221",
  VENDORS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314230",
  VENDORS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314222",
  SCOPES_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314237",
  SCOPES_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314186",
  ACCESS_CONTROLS_VIEWER = "1ac869fc-d548-4ec8-8e06-c01491314220",
  ACCESS_CONTROLS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314189",
  ADMIN_STATISTICS_MANAGER = "4ac869fc-d548-4ec8-8e06-c01491314203",
}

export enum EmployeeDomains {
  AGENT_VIEWER = "Agent Viewer",
  AGENT_MANAGER = "Agent Manager",
  COMPANIES_VIEWER = "Companies Viewer",
  COMPANIES_MANAGER = "Companies Manager",
  CUSTOMERS_VIEWER = "Customers Viewer",
  CUSTOMERS_MANAGER = "Customers Manager",
  VENDORS_VIEWER = "Vendors Viewer",
  VENDORS_MANAGER = "Vendors Manager",
  SEGMENTS_VIEWER = "Segments Viewer",
  SEGMENTS_MANAGER = "Segments Manager",
  CARTS_VIEWER = "Carts Viewer",
  CARTS_MANAGER = "Carts Manager",
  COUPONS_VIEWER = "Coupons Viewer",
  COUPONS_MANAGER = "Coupons Manager",
  QUOTES_VIEWER = "Quotes Viewer",
  QUOTES_MANAGER = "Quotes Manager",
  STATUS_CODES_VIEWER = "Status Codes Viewer",
  STATUS_CODES_MANAGER = "Status Codes Manager",
  ORDERS_VIEWER = "Orders Viewer",
  ORDERS_MANAGER = "Orders Manager",
  SEPA_VIEWER = "SEPA Viewer",
  SEPA_MANAGER = "SEPA Manager",
  RETURNS_VIEWER = "Returns Viewer",
  RETURNS_MANAGER = "Returns Manager",
  CATALOGS_VIEWER = "Catalogs Viewer",
  CATALOGS_MANAGER = "Catalogs Manager",
  CATEGORIES_VIEWER = "Categories Viewer",
  CATEGORIES_MANAGER = "Categories Manager",
  PRODUCTS_VIEWER = "Products Viewer",
  PRODUCTS_MANAGER = "Products Manager",
  PRODUCT_TEMPLATES_VIEWER = "Product Templates Viewer",
  PRODUCT_TEMPLATES_MANAGER = "Product Templates Manager",
  LABELS_VIEWER = "Labels Viewer",
  LABELS_MANAGER = "Labels Manager",
  SUPPLIERS_VIEWER = "Suppliers Viewer",
  SUPPLIERS_MANAGER = "Suppliers Manager",
  BRANDS_VIEWER = "Brands Viewer",
  BRANDS_MANAGER = "Brands Manager",
  PRICE_MODELS_VIEWER = "Price Models Viewer",
  PRICE_MODELS_MANAGER = "Price Models Manager",
  PRICE_LISTS_VIEWER = "Price Lists Viewer",
  PRICE_LISTS_MANAGER = "Price Lists Manager",
  SITES_VIEWER = "Sites Viewer",
  SITES_MANAGER = "Sites Manager",
  DELIVERY_METHODS_VIEWER = "Delivery Methods Viewer",
  DELIVERY_METHODS_MANAGER = "Delivery Methods Manager",
  DELIVERY_TIMES_VIEWER = "Delivery Times Viewer",
  DELIVERY_TIMES_MANAGER = "Delivery Times Manager",
  UNITS_VIEWER = "Units Viewer",
  UNITS_MANAGER = "Units Manager",
  TAXES_VIEWER = "Taxes Viewer",
  TAXES_MANAGER = "Taxes Manager",
  COUNTRIES_VIEWER = "Countries Viewer",
  COUNTRIES_MANAGER = "Countries Manager",
  CURRENCIES_VIEWER = "Currencies Viewer",
  CURRENCIES_MANAGER = "Currencies Manager",
  LANGUAGES_VIEWER = "Languages Viewer",
  LANGUAGES_MANAGER = "Languages Manager",
  SYSTEM_PREFERENCES_VIEWER = "System Preferences Viewer",
  SYSTEM_PREFERENCES_MANAGER = "System Preferences Manager",
  MIXIN_SCHEMAS_VIEWER = "Mixin Schemas Viewer",
  MIXIN_SCHEMAS_MANAGER = "Mixin Schemas Manager",
  USERS_AND_GROUPS_VIEWER = "Users And Groups Viewer",
  USERS_AND_GROUPS_MANAGER = "Users And Groups Manager",
  WEBHOOKS_VIEWER = "Webhooks Viewer",
  WEBHOOKS_MANAGER = "Webhooks Manager",
  EXTENSIONS_VIEWER = "Extensions Viewer",
  EXTENSIONS_MANAGER = "Extensions Manager",
  MODULES_MANAGER = "Modules Manager",
  PERSPECTIVES_MANAGER = "Perspective Manager",
  HOSTING_MANAGER = "Hosting Manager",
  FEATURE_TOGGLES_VIEWER = "Feature Toggles Viewer",
  FEATURE_TOGGLES_MANAGER = "Feature Toggles Manager",
  ADMIN_STATISTICS_MANAGER = "Statistics Manager",
  CUSTOM_INSTANCES_VIEWER = "Custom Instances Viewer",
  CUSTOM_INSTANCES_MANAGER = "Custom Instances Manager",
  SCOPES_VIEWER = "Scopes Viewer",
  SCOPES_MANAGER = "Scopes Manager",
  ACCESS_CONTROLS_VIEWER = "Access Controls Viewer",
  ACCESS_CONTROLS_MANAGER = "Access Controls Manager",
}

export const EMPLOYEE_DOMAINS: Domain[] = [
  {
    id: EmployeeDomains.AGENT_VIEWER,
    accessControls: [AccessControlsForEmployee.AGENT_VIEWER],
  },
  {
    id: EmployeeDomains.AGENT_MANAGER,
    accessControls: [AccessControlsForEmployee.AGENT_MANAGER],
  },
  {
    id: EmployeeDomains.COMPANIES_VIEWER,
    accessControls: [
      AccessControlsForEmployee.LEGAL_ENTITIES_VIEWER,
      AccessControlsForEmployee.CONTACT_ASSIGNMENTS_VIEWER,
      AccessControlsForEmployee.LOCATIONS_VIEWER,
      AccessControlsForEmployee.IAM_USERS_VIEWER,
      AccessControlsForEmployee.IAM_GROUPS_VIEWER,
    ],
  },
  {
    id: EmployeeDomains.COMPANIES_MANAGER,
    accessControls: [
      AccessControlsForEmployee.LEGAL_ENTITIES_MANAGER,
      AccessControlsForEmployee.CONTACT_ASSIGNMENTS_MANAGER,
      AccessControlsForEmployee.LOCATIONS_MANAGER,
      AccessControlsForEmployee.IAM_USERS_VIEWER,
      AccessControlsForEmployee.IAM_GROUPS_VIEWER,
      AccessControlsForEmployee.IAM_ASSIGNMENTS_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.CUSTOMERS_VIEWER,
    accessControls: [
      AccessControlsForEmployee.CUSTOMERS_VIEWER,
      AccessControlsForEmployee.IAM_GROUPS_VIEWER,
    ],
  },
  {
    id: EmployeeDomains.CUSTOMERS_MANAGER,
    accessControls: [
      AccessControlsForEmployee.CUSTOMERS_MANAGER,
      AccessControlsForEmployee.IAM_GROUPS_VIEWER,
      AccessControlsForEmployee.IAM_ASSIGNMENTS_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.SEGMENTS_VIEWER,
    accessControls: [AccessControlsForEmployee.SEGMENTS_VIEWER],
  },
  {
    id: EmployeeDomains.SEGMENTS_MANAGER,
    accessControls: [
      AccessControlsForEmployee.SEGMENTS_MANAGER,
      AccessControlsForEmployee.PRICES_VIEWER,
    ],
  },
  {
    id: EmployeeDomains.CARTS_VIEWER,
    accessControls: [AccessControlsForEmployee.CARTS_VIEWER],
  },
  {
    id: EmployeeDomains.CARTS_MANAGER,
    accessControls: [AccessControlsForEmployee.CARTS_MANAGER],
  },
  {
    id: EmployeeDomains.VENDORS_VIEWER,
    accessControls: [
      AccessControlsForEmployee.VENDORS_VIEWER,
      AccessControlsForEmployee.IAM_GROUPS_VIEWER,
    ],
  },
  {
    id: EmployeeDomains.VENDORS_MANAGER,
    accessControls: [
      AccessControlsForEmployee.VENDORS_MANAGER,
      AccessControlsForEmployee.IAM_GROUPS_VIEWER,
      AccessControlsForEmployee.IAM_ASSIGNMENTS_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.COUPONS_VIEWER,
    accessControls: [AccessControlsForEmployee.COUPONS_VIEWER],
  },
  {
    id: EmployeeDomains.COUPONS_MANAGER,
    accessControls: [
      AccessControlsForEmployee.COUPONS_MANAGER,
      AccessControlsForEmployee.CONFIGURATION_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.QUOTES_VIEWER,
    accessControls: [AccessControlsForEmployee.QUOTES_VIEWER],
  },
  {
    id: EmployeeDomains.QUOTES_MANAGER,
    accessControls: [
      AccessControlsForEmployee.QUOTES_MANAGER,
      AccessControlsForEmployee.PRICES_VIEWER,
    ],
  },
  {
    id: EmployeeDomains.STATUS_CODES_VIEWER,
    accessControls: [AccessControlsForEmployee.QUOTES_VIEWER],
  },
  {
    id: EmployeeDomains.STATUS_CODES_MANAGER,
    accessControls: [AccessControlsForEmployee.QUOTES_MANAGER],
  },
  {
    id: EmployeeDomains.ORDERS_VIEWER,
    accessControls: [
      AccessControlsForEmployee.ORDERS_VIEWER,
      AccessControlsForEmployee.HISTORY_VIEWER,
      AccessControlsForEmployee.PAYMENT_TRANSACTIONS_VIEWER,
      AccessControlsForEmployee.HTML2PDF_VIEWER,
    ],
  },
  {
    id: EmployeeDomains.ORDERS_MANAGER,
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
    ],
  },
  {
    id: EmployeeDomains.SEPA_VIEWER,
    accessControls: [
      AccessControlsForEmployee.SEPA_JOBS_VIEWER,
      AccessControlsForEmployee.SEPA_MEDIA_VIEWER,
    ],
  },
  {
    id: EmployeeDomains.SEPA_MANAGER,
    accessControls: [AccessControlsForEmployee.SEPA_JOBS_MANAGER],
  },
  {
    id: EmployeeDomains.RETURNS_VIEWER,
    accessControls: [AccessControlsForEmployee.RETURNS_VIEWER],
  },
  {
    id: EmployeeDomains.RETURNS_MANAGER,
    accessControls: [
      AccessControlsForEmployee.RETURNS_MANAGER,
      AccessControlsForEmployee.CONFIGURATION_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.CATALOGS_VIEWER,
    accessControls: [AccessControlsForEmployee.CATALOGS_VIEWER],
  },
  {
    id: EmployeeDomains.CATALOGS_MANAGER,
    accessControls: [
      AccessControlsForEmployee.CATALOGS_MANAGER,
      AccessControlsForEmployee.CONFIGURATION_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.CATEGORIES_VIEWER,
    accessControls: [
      AccessControlsForEmployee.CATEGORIES_VIEWER,
      AccessControlsForEmployee.MEDIA_VIEWER,
    ],
  },
  {
    id: EmployeeDomains.CATEGORIES_MANAGER,
    accessControls: [
      AccessControlsForEmployee.CATEGORIES_MANAGER,
      AccessControlsForEmployee.MEDIA_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.PRODUCTS_VIEWER,
    accessControls: [
      AccessControlsForEmployee.PRODUCTS_VIEWER,
      AccessControlsForEmployee.AVAILABILITY_VIEWER,
      AccessControlsForEmployee.MEDIA_VIEWER,
      AccessControlsForEmployee.PRICES_VIEWER,
      AccessControlsForEmployee.PRODUCT_TEMPLATES_VIEWER,
    ],
  },
  {
    id: EmployeeDomains.PRODUCTS_MANAGER,
    accessControls: [
      AccessControlsForEmployee.PRODUCTS_MANAGER,
      AccessControlsForEmployee.AVAILABILITY_MANAGER,
      AccessControlsForEmployee.MEDIA_MANAGER,
      AccessControlsForEmployee.PRICES_MANAGER,
      AccessControlsForEmployee.ADMIN_STATISTICS_MANAGER,
      AccessControlsForEmployee.PRODUCT_TEMPLATES_VIEWER,
      AccessControlsForEmployee.CONFIGURATION_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.PRODUCT_TEMPLATES_VIEWER,
    accessControls: [AccessControlsForEmployee.PRODUCT_TEMPLATES_VIEWER],
  },
  {
    id: EmployeeDomains.PRODUCT_TEMPLATES_MANAGER,
    accessControls: [AccessControlsForEmployee.PRODUCT_TEMPLATES_MANAGER],
  },
  {
    id: EmployeeDomains.LABELS_VIEWER,
    accessControls: [AccessControlsForEmployee.LABELS_VIEWER],
  },
  {
    id: EmployeeDomains.LABELS_MANAGER,
    accessControls: [
      AccessControlsForEmployee.LABELS_MANAGER,
      AccessControlsForEmployee.CONFIGURATION_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.SUPPLIERS_VIEWER,
    accessControls: [AccessControlsForEmployee.SUPPLIERS_VIEWER],
  },
  {
    id: EmployeeDomains.SUPPLIERS_MANAGER,
    accessControls: [AccessControlsForEmployee.SUPPLIERS_MANAGER],
  },
  {
    id: EmployeeDomains.BRANDS_VIEWER,
    accessControls: [AccessControlsForEmployee.BRANDS_VIEWER],
  },
  {
    id: EmployeeDomains.BRANDS_MANAGER,
    accessControls: [
      AccessControlsForEmployee.BRANDS_MANAGER,
      AccessControlsForEmployee.CONFIGURATION_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.PRICE_MODELS_VIEWER,
    accessControls: [AccessControlsForEmployee.PRICE_MODELS_VIEWER],
  },
  {
    id: EmployeeDomains.PRICE_MODELS_MANAGER,
    accessControls: [AccessControlsForEmployee.PRICE_MODELS_MANAGER],
  },
  {
    id: EmployeeDomains.PRICE_LISTS_VIEWER,
    accessControls: [
      AccessControlsForEmployee.PRICE_LISTS_VIEWER,
      AccessControlsForEmployee.PRICES_VIEWER,
    ],
  },
  {
    id: EmployeeDomains.PRICE_LISTS_MANAGER,
    accessControls: [
      AccessControlsForEmployee.PRICE_LISTS_MANAGER,
      AccessControlsForEmployee.PRICES_VIEWER,
    ],
  },
  {
    id: EmployeeDomains.SITES_VIEWER,
    accessControls: [
      AccessControlsForEmployee.SITES_VIEWER,
      AccessControlsForEmployee.PAYMENT_MODE_VIEWER,
    ],
  },
  {
    id: EmployeeDomains.SITES_MANAGER,
    accessControls: [
      AccessControlsForEmployee.SITES_MANAGER,
      AccessControlsForEmployee.PAYMENT_MODE_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.DELIVERY_METHODS_VIEWER,
    accessControls: [
      AccessControlsForEmployee.AREAS_VIEWER,
      AccessControlsForEmployee.SHIPPING_VIEWER,
    ],
  },
  {
    id: EmployeeDomains.DELIVERY_METHODS_MANAGER,
    accessControls: [
      AccessControlsForEmployee.AREAS_MANAGE,
      AccessControlsForEmployee.SHIPPING_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.DELIVERY_TIMES_VIEWER,
    accessControls: [
      AccessControlsForEmployee.TIME_VIEWER,
      AccessControlsForEmployee.SHIPPING_VIEWER,
    ],
  },
  {
    id: EmployeeDomains.DELIVERY_TIMES_MANAGER,
    accessControls: [
      AccessControlsForEmployee.TIME_MANAGER,
      AccessControlsForEmployee.SHIPPING_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.UNITS_VIEWER,
    accessControls: [AccessControlsForEmployee.UNITS_VIEWER],
  },
  {
    id: EmployeeDomains.UNITS_MANAGER,
    accessControls: [AccessControlsForEmployee.UNITS_MANAGER],
  },
  {
    id: EmployeeDomains.TAXES_VIEWER,
    accessControls: [AccessControlsForEmployee.TAXES_VIEWER],
  },
  {
    id: EmployeeDomains.TAXES_MANAGER,
    accessControls: [AccessControlsForEmployee.TAXES_MANAGER],
  },
  {
    id: EmployeeDomains.COUNTRIES_VIEWER,
    accessControls: [AccessControlsForEmployee.COUNTRIES_VIEWER],
  },
  {
    id: EmployeeDomains.COUNTRIES_MANAGER,
    accessControls: [
      AccessControlsForEmployee.COUNTRIES_MANAGER,
      AccessControlsForEmployee.CONFIGURATION_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.CURRENCIES_VIEWER,
    accessControls: [AccessControlsForEmployee.CURRENCIES_VIEWER],
  },
  {
    id: EmployeeDomains.CURRENCIES_MANAGER,
    accessControls: [AccessControlsForEmployee.CURRENCIES_MANAGER],
  },
  {
    id: EmployeeDomains.LANGUAGES_VIEWER,
    accessControls: [AccessControlsForEmployee.LANGUAGES_VIEWER],
  },
  {
    id: EmployeeDomains.LANGUAGES_MANAGER,
    accessControls: [
      AccessControlsForEmployee.LANGUAGES_MANAGER,
      AccessControlsForEmployee.CONFIGURATION_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.SYSTEM_PREFERENCES_VIEWER,
    accessControls: [
      AccessControlsForEmployee.SYSTEM_PREFERENCES_VIEWER,
      AccessControlsForEmployee.CONFIGURATION_VIEWER,
    ],
  },
  {
    id: EmployeeDomains.SYSTEM_PREFERENCES_MANAGER,
    accessControls: [
      AccessControlsForEmployee.SYSTEM_PREFERENCES_MANAGER,
      AccessControlsForEmployee.CONFIGURATION_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.CUSTOM_INSTANCES_VIEWER,
    accessControls: [AccessControlsForEmployee.CUSTOM_INSTANCES_VIEWER],
  },
  {
    id: EmployeeDomains.CUSTOM_INSTANCES_MANAGER,
    accessControls: [
      AccessControlsForEmployee.CUSTOM_INSTANCES_MANAGER,
      AccessControlsForEmployee.CONFIGURATION_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.MIXIN_SCHEMAS_VIEWER,
    accessControls: [AccessControlsForEmployee.SCHEMA_VIEWER],
  },
  {
    id: EmployeeDomains.MIXIN_SCHEMAS_MANAGER,
    accessControls: [AccessControlsForEmployee.SCHEMA_MANAGER],
  },
];

export const EMPLOYEE_ADMIN_DOMAINS: Domain[] = [
  {
    id: EmployeeDomains.USERS_AND_GROUPS_VIEWER,
    accessControls: [
      AccessControlsForEmployee.IAM_GROUPS_VIEWER,
      AccessControlsForEmployee.IAM_TEMPLATES_VIEWER,
      AccessControlsForEmployee.IAM_USERS_VIEWER,
    ],
  },
  {
    id: EmployeeDomains.USERS_AND_GROUPS_MANAGER,
    accessControls: [
      AccessControlsForEmployee.IAM_GROUPS_MANAGER,
      AccessControlsForEmployee.IAM_TEMPLATES_MANAGER,
      AccessControlsForEmployee.IAM_ASSIGNMENTS_MANAGER,
      AccessControlsForEmployee.IAM_USERS_MANAGER,
      AccessControlsForEmployee.ACCESS_CONTROLS_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.SCOPES_VIEWER,
    accessControls: [AccessControlsForEmployee.SCOPES_VIEWER],
  },
  {
    id: EmployeeDomains.SCOPES_MANAGER,
    accessControls: [AccessControlsForEmployee.SCOPES_MANAGER],
  },
  {
    id: EmployeeDomains.ACCESS_CONTROLS_VIEWER,
    accessControls: [AccessControlsForEmployee.ACCESS_CONTROLS_VIEWER],
  },
  {
    id: EmployeeDomains.ACCESS_CONTROLS_MANAGER,
    accessControls: [AccessControlsForEmployee.ACCESS_CONTROLS_MANAGER],
  },
  {
    id: EmployeeDomains.WEBHOOKS_VIEWER,
    accessControls: [AccessControlsForEmployee.WEBHOOKS_VIEWER],
  },
  {
    id: EmployeeDomains.WEBHOOKS_MANAGER,
    accessControls: [AccessControlsForEmployee.WEBHOOKS_MANAGER],
  },
  {
    id: EmployeeDomains.EXTENSIONS_VIEWER,
    accessControls: [AccessControlsForEmployee.EXTENSIONS_VIEWER],
  },
  {
    id: EmployeeDomains.EXTENSIONS_MANAGER,
    accessControls: [
      AccessControlsForEmployee.EXTENSIONS_MANAGER,
      AccessControlsForEmployee.CONFIGURATION_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.MODULES_MANAGER,
    accessControls: [
      AccessControlsForEmployee.IAM_GROUPS_MANAGER,
      AccessControlsForEmployee.CONFIGURATION_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.PERSPECTIVES_MANAGER,
    accessControls: [
      AccessControlsForEmployee.IAM_GROUPS_MANAGER,
      AccessControlsForEmployee.CONFIGURATION_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.HOSTING_MANAGER,
    accessControls: [
      AccessControlsForEmployee.IAM_GROUPS_MANAGER,
      AccessControlsForEmployee.CONFIGURATION_MANAGER,
    ],
  },
  {
    id: EmployeeDomains.FEATURE_TOGGLES_VIEWER,
    accessControls: [AccessControlsForEmployee.FEATURE_TOGGLES_VIEWER],
  },
  {
    id: EmployeeDomains.FEATURE_TOGGLES_MANAGER,
    accessControls: [AccessControlsForEmployee.FEATURE_TOGGLES_MANAGER],
  },
  {
    id: EmployeeDomains.ADMIN_STATISTICS_MANAGER,
    accessControls: [AccessControlsForEmployee.ADMIN_STATISTICS_MANAGER],
  },
];
