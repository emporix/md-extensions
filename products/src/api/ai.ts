import { AiTextRequest, AiTextResponse } from '../models/Ai'
import { api } from './index'
import { useCallback } from 'react'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

export const generateTextRequest = async (
  tenant: string,
  aiTextRequest: AiTextRequest
): Promise<AiTextResponse> => {
  const { data } = await api.post<AiTextResponse>(
    `ai-service/${tenant}/texts`,
    aiTextRequest
  )
  return data
}

export const useAiApi = () => {
  const { tenant } = useDashboardContext()

  const generateText = useCallback(
    (aiTextRequest: AiTextRequest) => {
      if (tenant) {
        return generateTextRequest(tenant, aiTextRequest)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  return {
    generateText,
  }
}
