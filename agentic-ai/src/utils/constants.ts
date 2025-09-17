export const MCP_SERVERS = {
  order: {
    name: 'Order MCP',
    tools: [
      'get-returns', 'get-return', 'create-return', 'update-return', 'partial-update-return',
      'delete-return', 'change-returns-status', 'get-orders', 'get-order', 'get-customer-orders',
      'update-order-billing-data', 'send-invoice'
    ]
  },
  customer: {
    name: 'Customer MCP',
    tools: [
      'get-customers', 'get-customer', 'upsert-customer', 'partial-update-customer', 'delete-customer',
      'get-legal-entities', 'get-legal-entity', 'upsert-legal-entity', 'delete-legal-entity',
      'get-locations', 'get-location', 'upsert-location', 'delete-location',
      'get-contact-assignments', 'get-contact-assignment', 'upsert-contact-assignment', 'delete-contact-assignment'
    ]
  },
  product: {
    name: 'Product MCP',
    tools: [
      'get-products', 'get-product', 'upsert-product', 'partial-update-product', 'delete-product',
      'upsert-price', 'get-price', 'delete-price', 'get-prices', 'get-price-model', 'match-prices',
      'get-availabilities-by-site', 'get-availabilities-by-product-ids', 'upsert-availability', 'delete-availability',
      'upsert-catalog', 'partial-update-catalog', 'get-catalog', 'delete-catalog', 'get-catalogs',
      'get-category-catalogs', 'upsert-category', 'get-category', 'get-categories', 'delete-category',
      'partial-update-category', 'upsert-category-assignment', 'get-category-assignments',
      'delete-category-assignments', 'delete-category-assignment-by-id', 'delete-category-assignment-by-product',
      'get-categories-by-product-assignment', 'delete-category-assignments-by-product', 'create-brand',
      'partial-update-brand', 'get-brand', 'delete-brand', 'get-brands', 'get-labels', 'get-label',
      'create-label', 'partial-update-label', 'update-label', 'delete-label'
    ]
  },
  extensibility: {
    name: 'Extensibility MCP',
    tools: [
      'get-custom-types', 'get-custom-type-schema', 'get-custom-type-instance', 'get-custom-type-instances',
      'upsert-custom-type-instance', 'partial-update-custom-type-instance'
    ]
  }
} as const;

export type McpKey = keyof typeof MCP_SERVERS;

export const TRIGGER_TYPES = [
  { label: 'API', value: 'endpoint', disabled: false },
  { label: 'Commerce Event', value: 'commerce_events', disabled: false },
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