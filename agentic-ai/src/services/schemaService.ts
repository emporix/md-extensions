import { AppState } from '../types/common'
import { CustomSchemaType } from '../types/Schema'
import { buildQueryParams, getApiHeaders } from '../utils/apiHelpers'
import { getLocalizedValue } from '../utils/agentHelpers'
import { PRODUCT_ENTITY_TYPE } from '../types/Tool'
import { EntityTypeOption } from '../types/Schema'
import { ApiClient } from './apiClient'

const getApiClient = (appState: AppState): ApiClient => new ApiClient(appState)

export const getCustomSchemaTypes = async (
  appState: AppState
): Promise<CustomSchemaType[]> => {
  try {
    const api = getApiClient(appState)
    const query = buildQueryParams({ pageNumber: 1, pageSize: 2000 })
    const { data } = await api.getWithHeaders<CustomSchemaType[]>(
      `/schema/${appState.tenant}/custom-entities${query}`,
      { headers: getApiHeaders(true) }
    )

    return (data ?? []).filter((type) => !!type.id?.trim())
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to fetch custom schema types'
    throw new Error(errorMessage)
  }
}

export const buildRagEmporixEntityTypeOptions = (
  customSchemaTypes: CustomSchemaType[],
  productLabel: string,
  language: string
): EntityTypeOption[] => {
  const productOption: EntityTypeOption = {
    label: productLabel,
    value: PRODUCT_ENTITY_TYPE,
  }

  const customOptions = customSchemaTypes.map((type) => ({
    label: getLocalizedValue(type.name, language) || type.id,
    value: type.id,
  }))

  return [productOption, ...customOptions]
}
