declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.css' {
  const content: string
  export default content
}

declare module '*.scss' {
  const content: string
  export default content
}

interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_URL?: string
  readonly VITE_API_TIMEOUT?: string

  // Application
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_VERSION?: string

  // Feature Flags
  readonly VITE_FEATURE_AI?: string
  readonly VITE_FEATURE_ANALYTICS?: string
  readonly VITE_FEATURE_ADVANCED_SEARCH?: string
  readonly VITE_FEATURE_QUICK_ORDER?: string
  readonly VITE_FEATURE_QUOTES?: string
  readonly VITE_FEATURE_RETURNS?: string

  // Performance & Polling
  readonly VITE_CART_POLL_INTERVAL?: string
  readonly VITE_DEFAULT_PAGE_SIZE?: string
  readonly VITE_MAX_PAGE_SIZE?: string

  // Internationalization
  readonly VITE_DEFAULT_LANGUAGE?: string
  readonly VITE_DEFAULT_CURRENCY?: string
  readonly VITE_SUPPORTED_LANGUAGES?: string

  // Module Federation
  readonly VITE_REMOTE_ENTRY_URL?: string

  // Monitoring & Logging
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_DATADOG_APP_ID?: string
  readonly VITE_DATADOG_CLIENT_TOKEN?: string
  readonly VITE_DEBUG_MODE?: string

  // Security
  readonly VITE_TOKEN_EXPIRATION?: string
  readonly HTTPS?: string

  // Vite Built-in
  readonly MODE: string
  readonly PROD: boolean
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
