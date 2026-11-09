import type { getUnitByCodeCall } from '@emporix/api-calls'
import type Localized from './Localized.model'

/**
 * A unit of the Unit Handling Service. The type comes from the api-calls
 * signature, which exports the call but not its model.
 */
export type Unit = Awaited<ReturnType<typeof getUnitByCodeCall>>

export type UnitFormFields = {
  code: string
  name: Localized
  type: string
  symbol: string
  baseUnit: boolean
  factor: number | null
}

// MD defaults of a new unit.
export const createUnitForm = (unit?: Unit): UnitFormFields => ({
  code: unit?.code ?? '',
  name: unit?.name ?? {},
  type: unit?.type ?? '',
  symbol: unit?.symbol ?? '',
  baseUnit: unit?.baseUnit ?? false,
  factor: unit?.factor ?? 1,
})

/**
 * A name in at least one language. MD looked only at the last language of
 * the map, so a unit with an empty second language could not be saved.
 */
export const hasName = (name: Localized | undefined): boolean =>
  !!name && Object.values(name).some((value) => !!value?.trim())

/**
 * Body for create and update. An update carries the loaded
 * `metadata.version` so the service can reject a stale write.
 */
export const toUnitPayload = (form: UnitFormFields, loaded?: Unit): Unit => ({
  code: form.code,
  name: form.name,
  type: form.type,
  ...(form.symbol ? { symbol: form.symbol } : {}),
  baseUnit: form.baseUnit,
  factor: form.factor ?? 0,
  ...(loaded?.metadata
    ? { metadata: { version: loaded.metadata.version } }
    : {}),
})
