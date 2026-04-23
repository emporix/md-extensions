import { useCallback } from 'react'

const getMixinsSchemaCall = async (url: string) => {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `Failed to fetch mixins schema (${res.status} ${res.statusText}): ${text}`
    )
  }
  return await res.json()
}

export const useMixinsApi = () => {
  const getMixinsSchema = useCallback((url: string) => {
    return getMixinsSchemaCall(url)
  }, [])

  return {
    getMixinsSchema,
  }
}
