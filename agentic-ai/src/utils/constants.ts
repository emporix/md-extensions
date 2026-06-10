import { TFunction } from 'i18next'
import { LlmProvider } from '../types/Agent'

export const MCP_SERVERS = {
  customer: {
    name: 'Customer MCP',
    tools: [
      'delete-contact-assignment',
      'delete-customer',
      'delete-legal-entity',
      'delete-location',
      'get-contact-assignment',
      'get-contact-assignments',
      'get-customer',
      'get-customers',
      'get-legal-entity',
      'get-legal-entities',
      'get-location',
      'get-locations',
      'partial-update-customer',
      'send-email-to-customer',
      'upsert-contact-assignment',
      'upsert-customer',
      'upsert-legal-entity',
      'upsert-location',
    ],
  },
  extensibility: {
    name: 'Extensibility MCP',
    tools: [
      'get-custom-type-instance',
      'get-custom-type-instances',
      'get-custom-type-schema',
      'get-custom-types',
      'partial-update-custom-type-instance',
      'upsert-custom-type-instance',
    ],
  },
  order: {
    name: 'Order MCP',
    tools: [
      'change-return-status',
      'create-return',
      'delete-return',
      'get-customer-orders',
      'get-order',
      'get-orders',
      'get-return',
      'get-returns',
      'partial-update-return',
      'send-invoice',
      'update-order-billing-data',
      'update-order-delivery-date',
      'update-return',
    ],
  },
  product: {
    name: 'Product MCP',
    tools: [
      'create-brand',
      'create-label',
      'delete-availability',
      'delete-brand',
      'delete-catalog',
      'delete-category',
      'delete-category-assignment-by-id',
      'delete-category-assignment-by-product',
      'delete-category-assignments',
      'delete-category-assignments-by-product',
      'delete-label',
      'delete-price',
      'delete-product',
      'get-availabilities-by-product-ids',
      'get-availabilities-by-site',
      'get-brand',
      'get-brands',
      'get-catalog',
      'get-catalogs',
      'get-category',
      'get-categories',
      'get-categories-by-product-assignment',
      'get-category-assignments',
      'get-category-catalogs',
      'get-label',
      'get-labels',
      'get-price',
      'get-price-model',
      'get-prices',
      'get-product',
      'get-products',
      'match-prices',
      'partial-update-brand',
      'partial-update-catalog',
      'partial-update-category',
      'partial-update-label',
      'partial-update-product',
      'update-label',
      'upsert-availability',
      'upsert-catalog',
      'upsert-category',
      'upsert-category-assignment',
      'upsert-price',
      'upsert-product',
    ],
  },
  frontend: {
    name: 'Frontend MCP',
    tools: [
      'get-customer-info',
      'update-customer-profile',
      'get-companies-addresses',
      'get-products',
      'upsert-customer-address',
      'get-cart',
      'modify-cart-items',
      'checkout',
      'get-customer-orders',
      'get-payment-methods',
      'get-returns',
      'create-return',
      'get-quotes',
      'get-quote-reasons',
      'create-quote',
      'update-quote',
    ],
  },
} as const

export type McpKey = keyof typeof MCP_SERVERS

export const MCP_DOMAIN_TAGS: Record<McpKey, readonly string[]> = {
  order: ['Order', 'Return', 'Invoice'],
  product: [
    'Product',
    'Catalog',
    'Brand',
    'Label',
    'Category',
    'Price',
    'Availability',
  ],
  frontend: ['Cart', 'Checkout', 'Quote', 'Return', 'Customer'],
  extensibility: ['Custom Type', 'Custom Instance'],
  customer: ['Customer', 'Legal Entity', 'Location', 'Email'],
}

export const getTriggerTypes = (t: TFunction) => [
  { label: t('trigger_type_api'), value: 'endpoint', disabled: false },
  {
    label: t('trigger_type_commerce'),
    value: 'commerce_events',
    disabled: false,
  },
  { label: t('trigger_type_slack'), value: 'slack', disabled: false },
]

export const getLlmProviders = (t: TFunction) => [
  { label: t('llm_provider_anthropic'), value: LlmProvider.ANTHROPIC },
  {
    label: t('llm_provider_emporix_openai'),
    value: LlmProvider.EMPORIX_OPENAI,
  },
  { label: t('llm_provider_google'), value: LlmProvider.GOOGLE },
  { label: t('llm_provider_openai'), value: LlmProvider.OPENAI },
  {
    label: t('llm_provider_self_hosted_ollama'),
    value: LlmProvider.SELF_HOSTED_OLLAMA,
  },
  {
    label: t('llm_provider_self_hosted_vllm'),
    value: LlmProvider.SELF_HOSTED_VLLM,
  },
]

export const AVAILABLE_TAGS = [
  'Productivity',
  'Security',
  'Finance',
  'Personal Assistance',
  'Customer Service',
  "Support"
] as const

export const CACHE_TTL = 5 * 60 * 1000
