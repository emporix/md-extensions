import type { fetchCatalog } from '@emporix/api-calls'
import type Localized from './Localized.model'

/**
 * A catalog of the Catalog Service. The type comes from the api-calls
 * signature, which exports the call but not its model.
 */
export type Catalog = Awaited<ReturnType<typeof fetchCatalog>>

export type CatalogFormFields = {
  id: string
  name: Localized
  description: Localized
  categoryIds: string[]
  publishedSites: string[]
  visibleFrom: string | null
  visibleTo: string | null
  visible: boolean
}

/**
 * Form values for a loaded catalog, or MD's defaults for a new one
 * (`visibility.visible = false`, everything else empty).
 */
export const createCatalogForm = (catalog?: Catalog): CatalogFormFields => ({
  id: catalog?.id ?? '',
  name: catalog?.name ?? {},
  description: catalog?.description ?? {},
  categoryIds: catalog?.categoryIds ?? [],
  publishedSites: catalog?.publishedSites ?? [],
  visibleFrom: catalog?.visibility?.from || null,
  visibleTo: catalog?.visibility?.to || null,
  visible: catalog?.visibility?.visible ?? false,
})

/**
 * A name in at least one language. MD marked the name required but did not
 * enforce it.
 */
export const hasName = (name: Localized | undefined): boolean =>
  !!name && Object.values(name).some((value) => !!value?.trim())

/**
 * Body for create and update: the loaded catalog with the form values on
 * top, so fields the form does not edit (`code`, `metadata`) are sent back as
 * loaded, as MD did. An empty visibility date is left out instead of being
 * replaced by "now".
 */
export const toCatalogPayload = (
  form: CatalogFormFields,
  loaded?: Catalog
): Catalog => {
  const visibility: Catalog['visibility'] = {
    visible: form.visible,
  } as Catalog['visibility']
  if (form.visibleFrom) visibility.from = form.visibleFrom
  if (form.visibleTo) visibility.to = form.visibleTo

  const payload = {
    ...(loaded ?? {}),
    name: form.name,
    description: form.description,
    categoryIds: form.categoryIds,
    publishedSites: form.publishedSites,
    visibility,
  } as Catalog
  const id = loaded?.id ?? form.id.trim()
  if (id) payload.id = id
  else delete (payload as Partial<Catalog>).id
  return payload
}

/** MD "Published to": one site code, a count for several, `-` for none. */
export const publishedToLabel = (
  publishedSites: string[] | undefined,
  formatCount: (size: number) => string
): string => {
  if (!publishedSites?.length) return '-'
  if (publishedSites.length === 1) return publishedSites[0]
  return formatCount(publishedSites.length)
}
