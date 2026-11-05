import { describe, expect, it } from 'vitest'
import { isLatestRequest, nextRequestId } from './latestRequest'

describe('latestRequest', () => {
  it('keeps the newer response when an older request finishes later', async () => {
    let latest = 0
    const start = () => {
      latest = nextRequestId(latest)
      return latest
    }

    const siteA = start()
    const siteB = start()
    let rows: string | undefined
    let loading = false
    let error: string | undefined

    const finish = async (
      requestId: number,
      result: { readonly rows?: string; readonly error?: string }
    ) => {
      await Promise.resolve()
      const apply = (isLoading: boolean) => {
        if (isLatestRequest(latest, requestId)) {
          loading = isLoading
        }
      }
      apply(true)
      await Promise.resolve()
      apply(false)
      if (!isLatestRequest(latest, requestId)) {
        return
      }
      if (result.error) {
        error = result.error
        return
      }
      rows = result.rows
    }

    await finish(siteB, { rows: 'site-b' })
    await finish(siteA, { rows: 'site-a', error: 'stale' })

    expect(rows).toBe('site-b')
    expect(error).toBeUndefined()
    expect(loading).toBe(false)
  })

  it('ignores a stale loading update after the newer request has finished', () => {
    const siteA = 1
    const latest = nextRequestId(siteA)

    let loading = false
    const apply = (requestId: number, isLoading: boolean) => {
      if (isLatestRequest(latest, requestId)) {
        loading = isLoading
      }
    }

    apply(latest, false)
    apply(siteA, true)

    expect(loading).toBe(false)
  })
})
