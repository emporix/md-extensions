import { ApiClient } from './apiClient'
import { AppState } from '../types/common'
import {
  buildQueryParams,
  getApiHeaders,
  parseTotalCount,
} from '../utils/apiHelpers'
import {
  Conversation,
  GetConversationsOptions,
  GetConversationsResult,
} from '../types/Conversation'

export const getConversations = async (
  appState: AppState,
  options: GetConversationsOptions = {}
): Promise<GetConversationsResult> => {
  const api = new ApiClient(appState)
  const queryString = buildQueryParams(
    {
      sortBy: options.sortBy ?? 'lastMessageAt',
      sortOrder: options.sortOrder ?? 'DESC',
      pageSize: options.pageSize,
      pageNumber: options.pageNumber,
      agentId: options.agentId?.trim() || undefined,
      toolId: options.toolId?.trim() || undefined,
      filters: options.filters,
    },
    { agentIdField: 'agentId', toolIdField: 'toolId' }
  )

  const url = `/ai-service/${appState.tenant}/agentic/conversations${queryString}`
  const { data, headers } = await api.getWithHeaders<Conversation[]>(url, {
    headers: getApiHeaders(true),
  })

  return {
    conversations: data ?? [],
    totalCount: parseTotalCount(headers),
  }
}

export const hasConversations = async (
  appState: AppState,
  options: Pick<GetConversationsOptions, 'toolId' | 'agentId'>
): Promise<boolean> => {
  const result = await getConversations(appState, {
    ...options,
    pageNumber: 1,
    pageSize: 1,
  })

  if (result.totalCount != null) {
    return result.totalCount > 0
  }

  return (result.conversations?.length ?? 0) > 0
}
