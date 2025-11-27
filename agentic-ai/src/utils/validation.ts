export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export const validateRequired = (
  value: string | undefined | null,
  fieldName: string
): void => {
  if (!value || value.trim() === '') {
    throw new ValidationError(
      `${fieldName} is required`,
      fieldName.toLowerCase()
    )
  }
}

// ID format validation: only word characters (letters, digits, underscore) and hyphens, 1-66 characters
export const ID_PATTERN = /^[\w-]{1,66}$/

export const isValidIdFormat = (id: string): boolean => {
  return ID_PATTERN.test(id)
}

export const sanitizeIdInput = (value: string): string => {
  // Remove all characters that are not word characters or hyphens
  // Also limit to 66 characters
  return value.replace(/[^\w-]/g, '').slice(0, 66)
}

export const validateId = (
  id: string | undefined | null,
  entityName: string = 'ID'
): void => {
  validateRequired(id, `${entityName} ID`)

  if (id && id.trim()) {
    if (!isValidIdFormat(id.trim())) {
      throw new ValidationError(
        `${entityName} ID must contain only letters, numbers, underscores, and hyphens (1-66 characters)`,
        `${entityName.toLowerCase()}_id`
      )
    }
  }
}

export const validateName = (
  name: string | undefined | null,
  entityName: string = 'Name'
): void => {
  validateRequired(name, `${entityName} name`)
}

export const validateUrl = (
  url: string | undefined | null,
  fieldName: string = 'URL'
): void => {
  validateRequired(url, fieldName)

  if (url && url.trim()) {
    try {
      new URL(url.trim())
    } catch {
      throw new ValidationError(
        `${fieldName} must be a valid URL`,
        fieldName.toLowerCase()
      )
    }
  }
}

export const validateEmail = (
  email: string | undefined | null,
  fieldName: string = 'Email'
): void => {
  if (email && email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      throw new ValidationError(
        `${fieldName} must be a valid email address`,
        fieldName.toLowerCase()
      )
    }
  }
}

// Validation helpers for specific entities
export const validateToken = (token: {
  id?: string
  name?: string
  value?: string
}) => {
  validateId(token.id, 'Token')
  validateName(token.name, 'Token')
}

export const validateTool = (tool: { id?: string; name?: string }) => {
  validateId(tool.id, 'Tool')
  validateName(tool.name, 'Tool')
}

export const validateMcpServer = (mcpServer: {
  id?: string
  name?: string
  config?: { url?: string }
}) => {
  validateId(mcpServer.id, 'MCP Server')
  validateName(mcpServer.name, 'MCP Server')
  validateUrl(mcpServer.config?.url, 'MCP Server URL')
}
