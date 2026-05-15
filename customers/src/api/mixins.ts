import { useCallback } from 'react'
import { api } from './index'
import { MixinsSchema } from '../models/Mixins'

/** Same logical URL → one HTTP GET per load (parallel duplicate schema walks share the promise). */
const mixinSchemaCache = new Map<string, MixinsSchema>()
const mixinSchemaInflight = new Map<string, Promise<MixinsSchema>>()

function normalizeMixinSchemaUrl(url: string): string {
  const trimmed = url.trim()
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : trimmed.replace(/^\/+/, '')
}

const getMixinsSchemaCall = async (url: string): Promise<MixinsSchema> => {
  const path = normalizeMixinSchemaUrl(url)
  const cached = mixinSchemaCache.get(path)
  if (cached) {
    return cached
  }

  let inflight = mixinSchemaInflight.get(path)
  if (!inflight) {
    inflight = api.get<MixinsSchema>(path).then(({ data }) => {
      mixinSchemaCache.set(path, data)
      return data
    })
    mixinSchemaInflight.set(path, inflight)
    inflight.finally(() => {
      mixinSchemaInflight.delete(path)
    })
  }
  return inflight
}

export const useMixinsApi = () => {
  const getMixinsSchema = useCallback((url: string) => {
    return getMixinsSchemaCall(url)
  }, [])

  return {
    getMixinsSchema,
  }
}
