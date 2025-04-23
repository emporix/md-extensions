import { useCallback } from 'react'
import axios from 'axios'
import { MixinsSchema } from '../models/Mixins'

const getMixinsSchemaCall = async (url: string) => {
  const { data } = await axios.get<MixinsSchema>(url)
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
