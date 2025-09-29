export const MCP_SERVERS = {
  customer: {
    name: 'Customer MCP',
    tools: [
      'delete-contact-assignment', 'delete-customer', 'delete-legal-entity', 'delete-location',
      'get-contact-assignment', 'get-contact-assignments', 'get-customer', 'get-customers',
      'get-legal-entity', 'get-legal-entities', 'get-location', 'get-locations',
      'partial-update-customer', 'upsert-contact-assignment', 'upsert-customer', 'upsert-legal-entity', 'upsert-location'
    ]
  },
  extensibility: {
    name: 'Extensibility MCP',
    tools: [
      'get-custom-type-instance', 'get-custom-type-instances', 'get-custom-type-schema', 'get-custom-types',
      'partial-update-custom-type-instance', 'upsert-custom-type-instance'
    ]
  },
  order: {
    name: 'Order MCP',
    tools: [
      'change-return-status', 'create-return', 'delete-return', 'get-customer-orders',
      'get-order', 'get-orders', 'get-return', 'get-returns',
      'partial-update-return', 'send-invoice', 'update-order-billing-data', 'update-return'
    ]
  },
  product: {
    name: 'Product MCP',
    tools: [
      'create-brand', 'create-label', 'delete-availability', 'delete-brand', 'delete-catalog',
      'delete-category', 'delete-category-assignment-by-id', 'delete-category-assignment-by-product',
      'delete-category-assignments', 'delete-category-assignments-by-product', 'delete-label', 'delete-price', 'delete-product',
      'get-availabilities-by-product-ids', 'get-availabilities-by-site', 'get-brand', 'get-brands',
      'get-catalog', 'get-catalogs', 'get-category', 'get-categories', 'get-categories-by-product-assignment',
      'get-category-assignments', 'get-category-catalogs', 'get-label', 'get-labels', 'get-price',
      'get-price-model', 'get-prices', 'get-product', 'get-products', 'match-prices',
      'partial-update-brand', 'partial-update-catalog', 'partial-update-category', 'partial-update-label',
      'partial-update-product', 'update-label', 'upsert-availability', 'upsert-catalog',
      'upsert-category', 'upsert-category-assignment', 'upsert-price', 'upsert-product'
    ]
  }
} as const;

export type McpKey = keyof typeof MCP_SERVERS;

export const TRIGGER_TYPES = [
  { label: 'API', value: 'endpoint', disabled: false },
  { label: 'Commerce Event', value: 'commerce_events', disabled: false },
  { label: 'Slack', value: 'slack', disabled: false },
  { label: 'Time trigger', value: 'time', disabled: true },
];

export const LLM_PROVIDERS = [
  { label: 'Emporix OpenAI', value: 'emporix_openai' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Gemini', value: 'google' },
  { label: 'Claude', value: 'anthropic' },
  { label: 'Self-hosted Ollama', value: 'self_hosted_ollama' }
];

// API Constants
export const API_ENDPOINTS = {
  TEMPLATES: '/ai-service/{tenant}/agentic/templates',
  AGENTS: '/ai-service/{tenant}/agentic/agents',
  AGENT_BY_ID: '/ai-service/{tenant}/agentic/agents/{id}',
  COPY_TEMPLATE: '/ai-service/{tenant}/agentic/templates/{templateId}/agents'
} as const;

// HTTP Headers
export const API_HEADERS = {
  CONTENT_TYPE: 'application/json',
  AUTHORIZATION: 'Authorization',
  EMPORIX_TENANT: 'Emporix-tenant'
} as const;

// Default Values
export const DEFAULT_VALUES = {
  RECURSION_LIMIT: 20,
  ENABLE_MEMORY: true,
  TEMPERATURE: 0,
  MAX_TOKENS: 0,
  PROVIDER: 'emporix_openai'
} as const;

// Available Tags
export const AVAILABLE_TAGS = [
  'Productivity',
  'Security', 
  'Finance',
  'Personal Assistance',
  'Customer Service'
] as const;

// Validation Constants
export const VALIDATION = {
  MIN_NAME_LENGTH: 1,
  MIN_DESCRIPTION_LENGTH: 1,
  MIN_PROMPT_LENGTH: 1,
  MIN_MODEL_LENGTH: 1
} as const; 