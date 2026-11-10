import { describe, expect, it, vi } from 'vitest'
import {
  createRequestTracker,
  getApiErrorDetails,
  getApiErrorDetailsField,
  getApiErrorDetailsList,
  getApiErrorMessage,
  getApiErrorResourceId,
  getApiErrorStatus,
  getConflictErrorToast,
  loadLatest,
} from './api'

const axiosLikeError = (status: number | string, data: unknown) => ({
  response: { status, data },
})

/** Real IAM groups 409 payload (ErrorResponse). */
const iamGroupConflictBody = {
  resourceId: '6d0e312b-75b4-4036-ab4e-9004b80599ee',
  code: 409,
  status: 'Conflict',
  message: 'Duplicated key',
  details: [
    "Group with id '6d0e312b-75b4-4036-ab4e-9004b80599ee' already exists",
  ],
}

describe('getApiErrorStatus', () => {
  it('returns HTTP status from axios-like errors', () => {
    expect(getApiErrorStatus(axiosLikeError(409, iamGroupConflictBody))).toBe(
      409
    )
  })

  it('coerces string HTTP status codes', () => {
    expect(getApiErrorStatus(axiosLikeError('409', {}))).toBe(409)
  })

  it('falls back to IAM body code when HTTP status is missing', () => {
    expect(
      getApiErrorStatus({
        response: { data: { code: 409, status: 'Conflict', message: 'x' } },
      })
    ).toBe(409)
  })

  it('does not treat IAM string status as a numeric code', () => {
    expect(
      getApiErrorStatus({
        response: {
          data: { code: 'not-a-number', status: 'Conflict', message: 'x' },
        },
      })
    ).toBeUndefined()
  })
})

describe('IAM ErrorResponse parsing', () => {
  const error = axiosLikeError(409, iamGroupConflictBody)

  it('reads message', () => {
    expect(getApiErrorMessage(error)).toBe('Duplicated key')
  })

  it('reads details as a joined string', () => {
    expect(getApiErrorDetailsField(error)).toBe(
      "Group with id '6d0e312b-75b4-4036-ab4e-9004b80599ee' already exists"
    )
  })

  it('reads details as a list', () => {
    expect(getApiErrorDetailsList(error)).toEqual([
      "Group with id '6d0e312b-75b4-4036-ab4e-9004b80599ee' already exists",
    ])
  })

  it('reads resourceId', () => {
    expect(getApiErrorResourceId(error)).toBe(
      '6d0e312b-75b4-4036-ab4e-9004b80599ee'
    )
  })

  it('prefers details over message in getApiErrorDetails', () => {
    expect(getApiErrorDetails(error)).toBe(
      "Group with id '6d0e312b-75b4-4036-ab4e-9004b80599ee' already exists"
    )
  })

  it('joins multiple string details', () => {
    expect(
      getApiErrorDetailsList(
        axiosLikeError(409, {
          ...iamGroupConflictBody,
          details: ['first problem', 'second problem'],
        })
      )
    ).toEqual(['first problem', 'second problem'])
  })

  it('ignores empty detail strings', () => {
    expect(
      getApiErrorDetailsList(
        axiosLikeError(409, {
          ...iamGroupConflictBody,
          details: ['', '  ', 'kept'],
        })
      )
    ).toEqual(['kept'])
  })

  it('handles missing optional details', () => {
    expect(
      getApiErrorDetailsList(
        axiosLikeError(409, {
          code: 409,
          status: 'Conflict',
          message: 'Duplicated key',
        })
      )
    ).toEqual([])
  })

  it('handles null resourceId', () => {
    expect(
      getApiErrorResourceId(
        axiosLikeError(409, { ...iamGroupConflictBody, resourceId: null })
      )
    ).toBeUndefined()
  })
})

describe('platform validation-style error parsing', () => {
  const validationError = axiosLikeError(400, {
    status: 400,
    type: 'validation_violation',
    message: 'Request validation failed',
    details: [
      { field: 'id', type: 'missing_value', message: 'id is required' },
      { type: 'invalid_value', message: 'name is invalid' },
    ],
  })

  it('extracts messages from detail objects', () => {
    expect(getApiErrorDetailsList(validationError)).toEqual([
      'id is required',
      'name is invalid',
    ])
  })

  it('joins detail object messages for getApiErrorDetails', () => {
    expect(getApiErrorDetails(validationError)).toBe(
      'id is required, name is invalid'
    )
  })
})

describe('getConflictErrorToast', () => {
  it('uses IAM message as title and details as body', () => {
    expect(
      getConflictErrorToast(
        axiosLikeError(409, iamGroupConflictBody),
        'Group with id already exists.'
      )
    ).toEqual({
      title: 'Duplicated key',
      detail:
        "Group with id '6d0e312b-75b4-4036-ab4e-9004b80599ee' already exists",
    })
  })

  it('passes multiple details as a string array for the toast body', () => {
    expect(
      getConflictErrorToast(
        axiosLikeError(409, {
          ...iamGroupConflictBody,
          details: ['first problem', 'second problem'],
        }),
        'fallback'
      )
    ).toEqual({
      title: 'Duplicated key',
      detail: ['first problem', 'second problem'],
    })
  })

  it('uses message alone when details are absent', () => {
    expect(
      getConflictErrorToast(
        axiosLikeError(409, {
          code: 409,
          status: 'Conflict',
          message: 'Duplicated key',
        }),
        'fallback'
      )
    ).toEqual({ title: 'Duplicated key' })
  })

  it('uses details alone when message is absent', () => {
    expect(
      getConflictErrorToast(
        axiosLikeError(409, {
          code: 409,
          status: 'Conflict',
          details: ["Group with id 'abc' already exists"],
        }),
        'fallback'
      )
    ).toEqual({ title: "Group with id 'abc' already exists" })
  })

  it('falls back to local title when server fields are missing', () => {
    expect(
      getConflictErrorToast(axiosLikeError(409, {}), 'Local conflict')
    ).toEqual({ title: 'Local conflict' })
  })
})

describe('createRequestTracker', () => {
  it('reports the newest request as latest', () => {
    const trackRequest = createRequestTracker()
    const isLatest = trackRequest()

    expect(isLatest()).toBe(true)
  })

  it('marks an older request as superseded once a newer one starts', () => {
    const trackRequest = createRequestTracker()
    const isFirstLatest = trackRequest()
    const isSecondLatest = trackRequest()

    expect(isFirstLatest()).toBe(false)
    expect(isSecondLatest()).toBe(true)
  })

  it('keeps separate trackers independent', () => {
    const isLatestA = createRequestTracker()()
    createRequestTracker()()

    expect(isLatestA()).toBe(true)
  })
})

describe('loadLatest', () => {
  const deferred = <T>() => {
    let resolve: (value: T) => void = () => undefined
    let reject: (error: unknown) => void = () => undefined
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }

  it('passes the result on when the request is still the latest', async () => {
    const onSuccess = vi.fn()
    const onError = vi.fn()

    await loadLatest(
      createRequestTracker(),
      () => Promise.resolve('label-1'),
      onSuccess,
      onError
    )

    expect(onSuccess).toHaveBeenCalledWith('label-1')
    expect(onError).not.toHaveBeenCalled()
  })

  it('drops a slower earlier response once a newer request started', async () => {
    const trackRequest = createRequestTracker()
    const first = deferred<string>()
    const onSuccess = vi.fn()

    const firstLoad = loadLatest(
      trackRequest,
      () => first.promise,
      onSuccess,
      vi.fn()
    )
    await loadLatest(
      trackRequest,
      () => Promise.resolve('label-2'),
      onSuccess,
      vi.fn()
    )
    first.resolve('label-1')
    await firstLoad

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('label-2')
  })

  it('drops the error of a superseded request', async () => {
    const trackRequest = createRequestTracker()
    const first = deferred<string>()
    const onError = vi.fn()

    const firstLoad = loadLatest(
      trackRequest,
      () => first.promise,
      vi.fn(),
      onError
    )
    await loadLatest(
      trackRequest,
      () => Promise.resolve('label-2'),
      vi.fn(),
      onError
    )
    first.reject(new Error('404'))
    await firstLoad

    expect(onError).not.toHaveBeenCalled()
  })

  it('reports the error of the latest request', async () => {
    const error = new Error('404')
    const onError = vi.fn()

    await loadLatest(
      createRequestTracker(),
      () => Promise.reject(error),
      vi.fn(),
      onError
    )

    expect(onError).toHaveBeenCalledWith(error)
  })
})
