import { AiTextRequest } from '../../models/Ai.model'
import { generateTextRequest } from '@emporix/api-calls'
import { useCallback } from 'react'
import { useDashboardContext } from '../../context/Dashboard.context'

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
