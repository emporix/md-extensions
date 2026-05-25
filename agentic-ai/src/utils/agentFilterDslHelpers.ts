export const COMMERCE_FILTER_ASSISTANT_I18N_KEYS = {
  emptyResponse: 'commerce_filter_assistant_empty_response',
  templateNotFound: 'commerce_filter_assistant_template_not_found',
} as const

export const COMMERCE_FILTER_ASSISTANT_I18N_MESSAGES = Object.values(
  COMMERCE_FILTER_ASSISTANT_I18N_KEYS
) as readonly string[]

export const COMMERCE_FILTER_PARSE_I18N_KEYS = {
  unsupportedOperator: 'commerce_filter_parse_unsupported_operator',
  fieldLeftRequired: 'commerce_filter_parse_field_left_required',
  valueListRequired: 'commerce_filter_parse_value_list_required',
  valueMustBeArray: 'commerce_filter_parse_value_must_be_array',
  listStringsOnly: 'commerce_filter_parse_list_strings_only',
  scalarRequired: 'commerce_filter_parse_scalar_required',
  scalarType: 'commerce_filter_parse_scalar_type',
  filterMustBeObject: 'commerce_filter_parse_filter_must_be_object',
  compoundOpInvalid: 'commerce_filter_parse_compound_op_invalid',
  conditionsNonEmpty: 'commerce_filter_parse_conditions_non_empty',
  invalidConditionAtPosition:
    'commerce_filter_parse_invalid_condition_at_position',
} as const

export const UI_OPERATORS = [
  'equals',
  'notEquals',
  'in',
  'notIn',
  'exists',
  'notExists',
  'isEmpty',
  'notEmpty',
] as const

export type UiFilterOperator = (typeof UI_OPERATORS)[number]

export const DSL_LEAF_OPERATORS = [
  '$eq',
  '$ne',
  '$in',
  '$notIn',
  '$exists',
  '$notExists',
  '$isEmpty',
  '$notEmpty',
] as const

export type DslLeafOperator = (typeof DSL_LEAF_OPERATORS)[number]

export const DSL_LOGICAL_OPERATORS = ['$and', '$or'] as const

export type DslLogicalOperator = (typeof DSL_LOGICAL_OPERATORS)[number]

/** Leaf: single predicate on payload path `left`. */
export interface AgentCommerceLeafDsl {
  left: string
  op: DslLeafOperator
  right?: unknown
}

/** Compound: combine subtrees with AND / OR */
export interface AgentCommerceCompoundDsl {
  op: DslLogicalOperator
  conditions: AgentCommerceFilterDsl[]
}

export type AgentCommerceFilterDsl =
  | AgentCommerceLeafDsl
  | AgentCommerceCompoundDsl

type CommerceFilterParseResult = {
  dsl: AgentCommerceFilterDsl | null
  error?: string
  errorOpts?: Record<string, string | number>
}

const UI_TO_DSL_LEAF: Record<UiFilterOperator, DslLeafOperator> = {
  equals: '$eq',
  notEquals: '$ne',
  in: '$in',
  notIn: '$notIn',
  exists: '$exists',
  notExists: '$notExists',
  isEmpty: '$isEmpty',
  notEmpty: '$notEmpty',
}

const DSL_LEAF_TO_UI: Record<DslLeafOperator, UiFilterOperator> = {
  $eq: 'equals',
  $ne: 'notEquals',
  $in: 'in',
  $notIn: 'notIn',
  $exists: 'exists',
  $notExists: 'notExists',
  $isEmpty: 'isEmpty',
  $notEmpty: 'notEmpty',
}

export const isDslLeafOperator = (value: string): value is DslLeafOperator =>
  (DSL_LEAF_OPERATORS as readonly string[]).includes(value)

export const isDslLogicalOperator = (
  value: string
): value is DslLogicalOperator => value === '$and' || value === '$or'

export const isCompoundFilter = (
  n: AgentCommerceFilterDsl
): n is AgentCommerceCompoundDsl =>
  'conditions' in n && Array.isArray((n as AgentCommerceCompoundDsl).conditions)

const isLeafFilter = (n: AgentCommerceFilterDsl): n is AgentCommerceLeafDsl =>
  !isCompoundFilter(n)

export const uiOperatorToDsl = (op: UiFilterOperator): DslLeafOperator =>
  UI_TO_DSL_LEAF[op]

export const dslOperatorToUi = (op: DslLeafOperator): UiFilterOperator =>
  DSL_LEAF_TO_UI[op]

export const operatorRequiresValue = (op: UiFilterOperator): boolean => {
  switch (op) {
    case 'exists':
    case 'notExists':
    case 'isEmpty':
    case 'notEmpty':
      return false
    default:
      return true
  }
}

export const operatorUsesMultiValue = (op: UiFilterOperator): boolean =>
  op === 'in' || op === 'notIn'

export const defaultCommerceFilterDsl = (): AgentCommerceLeafDsl => ({
  left: '',
  op: '$ne',
  right: '',
})

const normalizeLeft = (left: unknown): string | null => {
  if (typeof left !== 'string' || !left.trim()) return null
  return left.trim()
}

const parseLeafInner = (
  raw: Record<string, unknown>
): CommerceFilterParseResult => {
  const left = normalizeLeft(raw.left)
  const opUnknown = raw.op
  if (typeof opUnknown !== 'string' || !isDslLeafOperator(opUnknown)) {
    return {
      dsl: null,
      error: COMMERCE_FILTER_PARSE_I18N_KEYS.unsupportedOperator,
    }
  }
  const op = opUnknown
  if (!left) {
    return {
      dsl: null,
      error: COMMERCE_FILTER_PARSE_I18N_KEYS.fieldLeftRequired,
    }
  }

  const hasRight = 'right' in raw
  const right = hasRight ? raw.right : undefined

  if (!operatorRequiresValue(dslOperatorToUi(op))) {
    return { dsl: { left, op } }
  }

  const uiOp = dslOperatorToUi(op)
  if (operatorUsesMultiValue(uiOp)) {
    if (right === undefined || right === null) {
      return {
        dsl: null,
        error: COMMERCE_FILTER_PARSE_I18N_KEYS.valueListRequired,
      }
    }
    if (!Array.isArray(right)) {
      return {
        dsl: null,
        error: COMMERCE_FILTER_PARSE_I18N_KEYS.valueMustBeArray,
      }
    }
    if (right.length === 0) {
      return {
        dsl: null,
        error: COMMERCE_FILTER_PARSE_I18N_KEYS.valueListRequired,
      }
    }
    const strings = right.every((item) => typeof item === 'string')
    if (!strings) {
      return {
        dsl: null,
        error: COMMERCE_FILTER_PARSE_I18N_KEYS.listStringsOnly,
      }
    }
    return { dsl: { left, op, right: [...right] as string[] } }
  }

  if (right === undefined || right === null || right === '') {
    return {
      dsl: null,
      error: COMMERCE_FILTER_PARSE_I18N_KEYS.scalarRequired,
    }
  }
  if (typeof right !== 'string' && typeof right !== 'number') {
    return {
      dsl: null,
      error: COMMERCE_FILTER_PARSE_I18N_KEYS.scalarType,
    }
  }
  return { dsl: { left, op, right } }
}

const parseCompoundInner = (
  raw: Record<string, unknown>
): CommerceFilterParseResult => {
  const opUnknown = raw.op
  if (typeof opUnknown !== 'string' || !isDslLogicalOperator(opUnknown)) {
    return {
      dsl: null,
      error: COMMERCE_FILTER_PARSE_I18N_KEYS.compoundOpInvalid,
    }
  }
  const conditionsUnknown = raw.conditions
  if (!Array.isArray(conditionsUnknown) || conditionsUnknown.length === 0) {
    return {
      dsl: null,
      error: COMMERCE_FILTER_PARSE_I18N_KEYS.conditionsNonEmpty,
    }
  }

  const conditions: AgentCommerceFilterDsl[] = []
  for (let i = 0; i < conditionsUnknown.length; i++) {
    const parsed = parseAgentCommerceFilterDsl(conditionsUnknown[i])
    if (parsed.dsl === null || parsed.error) {
      if (parsed.error) {
        return {
          dsl: null,
          error: parsed.error,
          errorOpts: parsed.errorOpts,
        }
      }
      return {
        dsl: null,
        error: COMMERCE_FILTER_PARSE_I18N_KEYS.invalidConditionAtPosition,
        errorOpts: { position: String(i + 1) },
      }
    }
    conditions.push(parsed.dsl)
  }
  return { dsl: { op: opUnknown, conditions } }
}

export const parseAgentCommerceFilterDsl = (
  value: unknown
): CommerceFilterParseResult => {
  if (value === null || value === undefined) {
    return { dsl: null }
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    return {
      dsl: null,
      error: COMMERCE_FILTER_PARSE_I18N_KEYS.filterMustBeObject,
    }
  }
  const raw = value as Record<string, unknown>

  if ('conditions' in raw && Array.isArray(raw.conditions)) {
    return parseCompoundInner(raw)
  }

  return parseLeafInner(raw)
}

export const buildAgentCommerceFilterDsl = (
  left: string,
  uiOp: UiFilterOperator,
  value: string | string[] | undefined
): AgentCommerceLeafDsl => {
  const op = uiOperatorToDsl(uiOp)
  if (!operatorRequiresValue(uiOp)) {
    return { left, op }
  }
  if (operatorUsesMultiValue(uiOp)) {
    const arr = Array.isArray(value) ? value : []
    return { left, op, right: [...arr] }
  }
  const scalar =
    typeof value === 'string' ? value : Array.isArray(value) ? value[0] : ''
  return { left, op, right: scalar }
}

export const composeConditions = (
  logic: DslLogicalOperator,
  leaves: AgentCommerceLeafDsl[]
): AgentCommerceFilterDsl | null => {
  if (!leaves.length) return null
  if (leaves.length === 1) return { ...leaves[0] }
  return {
    op: logic,
    conditions: leaves.map((c) => ({ ...c })),
  }
}

export const filterSupportsFormEditing = (
  dsl: AgentCommerceFilterDsl | null
): boolean => {
  if (!dsl) return true
  if (isLeafFilter(dsl)) return true
  return dsl.conditions.every((c) => isLeafFilter(c))
}

export const flattenLeavesForForm = (
  dsl: AgentCommerceFilterDsl
): { logic: DslLogicalOperator; leaves: AgentCommerceLeafDsl[] } | null => {
  if (isLeafFilter(dsl)) {
    return { logic: '$and', leaves: [{ ...dsl }] }
  }
  const leaves = dsl.conditions.filter(isLeafFilter) as AgentCommerceLeafDsl[]
  if (leaves.length !== dsl.conditions.length) return null
  return { logic: dsl.op, leaves }
}

export const commerceTriggerExtractEvents = (
  config: Record<string, unknown> | null | undefined
): string[] => {
  if (!config) return []
  const raw = config.events
  if (!Array.isArray(raw)) return []
  return raw.filter((e): e is string => typeof e === 'string')
}

export const commerceTriggerExtractFilter = (
  config: Record<string, unknown> | null | undefined
): AgentCommerceFilterDsl | null => {
  const fv = config?.filter
  if (fv === undefined || fv === null) return null
  const parsed = parseAgentCommerceFilterDsl(fv)
  return parsed.dsl
}

const serializeFilterForPersist = (
  dsl: AgentCommerceFilterDsl
): Record<string, unknown> => {
  if (isLeafFilter(dsl)) {
    const { left, op, right } = dsl
    return right === undefined ? { left, op } : { left, op, right }
  }
  return {
    op: dsl.op,
    conditions: dsl.conditions.map((c) => serializeFilterForPersist(c)),
  }
}

export const mergeCommerceTriggerPersistedConfig = (
  commerceEvents: string[],
  filterDsl: AgentCommerceFilterDsl | null
): Record<string, unknown> => {
  const cfg: Record<string, unknown> = {
    events: [...commerceEvents],
  }
  if (filterDsl !== null) {
    cfg.filter = serializeFilterForPersist(filterDsl)
  }
  return cfg
}

const isLeafSemanticsValid = (leaf: AgentCommerceLeafDsl): boolean => {
  const parsed = parseAgentCommerceFilterDsl(leaf)
  if (!parsed.dsl || parsed.error || !isLeafFilter(parsed.dsl)) return false

  const uiOp = dslOperatorToUi(parsed.dsl.op)
  if (operatorUsesMultiValue(uiOp)) {
    const r = parsed.dsl.right
    return Array.isArray(r) && r.length > 0
  }
  if (operatorRequiresValue(uiOp) && !operatorUsesMultiValue(uiOp)) {
    const r = parsed.dsl.right
    return r !== undefined && r !== null && r !== ''
  }
  return true
}

export const isCommerceFilterValid = (
  dsl: AgentCommerceFilterDsl | null
): boolean => {
  if (!dsl) return false
  if (isLeafFilter(dsl)) return isLeafSemanticsValid(dsl)
  if (dsl.conditions.length === 0) return false
  return dsl.conditions.every((c) => isCommerceFilterValid(c))
}

export const stringifyFilterDsl = (
  dsl: AgentCommerceFilterDsl | null
): string => {
  if (!dsl) return ''
  return JSON.stringify(serializeFilterForPersist(dsl), null, 2)
}

const tryParseTopLevelJsonObject = (
  text: string
): Record<string, unknown> | null => {
  try {
    const parsed: unknown = JSON.parse(text)
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>
    }
  } catch {
  // Ignore exception
  }
  return null
}

export const extractFilterDslJsonFromAgentMessage = (
  message: string
): { parsed: Record<string, unknown>; rawSnippet: string } | null => {
  const trimmed = message.trim()
  const obj = tryParseTopLevelJsonObject(trimmed)
  if (!obj) return null
  return { parsed: obj, rawSnippet: trimmed }
}
