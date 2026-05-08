import { useCallback } from 'react'
import { api } from './index'
import { MixinsSchema } from '../models/Mixins'

const getMixinsSchemaCall = async (url: string) => {
  const trimmed = url.trim()
  const path =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : trimmed.replace(/^\/+/, '')
  const { data } = await api.get<MixinsSchema>(path)
  return data
}

export const useMixinsApi = () => {
  const getMixinsSchema = useCallback((url: string) => {
    return getMixinsSchemaCall(url)
  }, [])

  return {
    getMixinsSchema,
  }
}
