import { useCallback } from 'react'
import { getMixinsSchemaCall } from '@emporix/api-calls'

export const useMixinsApi = () => {
  const getMixinsSchema = useCallback((url: string) => {
    return getMixinsSchemaCall(url)
  }, [])

  return {
    getMixinsSchema,
  }
}
