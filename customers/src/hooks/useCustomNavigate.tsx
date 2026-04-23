import {
  NavigateOptions,
  To,
  useLocation,
  useNavigate,
} from 'react-router-dom'

type CustomNavigateOptions = NavigateOptions & {
  query?: Record<string, string | string[]>
  preserveQuery?: string[]
  preserveAllQuery?: boolean
}

const useCustomNavigate = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const customNavigate = (to: To, options?: CustomNavigateOptions) => {
    const {
      query = {},
      preserveQuery = [],
      preserveAllQuery = false,
      replace,
      state,
    } = options ?? {}

    const currentParams = new URLSearchParams(location.search)
    let finalPathname: string
    let newParams: URLSearchParams
    let hash: string | undefined

    if (typeof to === 'string') {
      const [pathname, rawSearch = ''] = to.split('?')
      finalPathname = pathname
      newParams = new URLSearchParams(rawSearch)
    } else {
      finalPathname = to.pathname || location.pathname
      newParams = new URLSearchParams(to.search || '')
      hash = to.hash
    }

    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        value.forEach((v) => newParams.append(key, v))
      } else {
        newParams.set(key, value)
      }
    }

    if (preserveAllQuery) {
      for (const [key, value] of currentParams.entries()) {
        if (!newParams.has(key)) {
          newParams.set(key, value)
        }
      }
    } else {
      preserveQuery.forEach((key) => {
        const value = currentParams.get(key)
        if (value !== null && !newParams.has(key)) {
          newParams.set(key, value)
        }
      })
    }

    const finalTo: To = {
      pathname: finalPathname,
      search: newParams.toString() ? `?${newParams.toString()}` : undefined,
      hash,
    }

    navigate(finalTo, { replace, state })
  }

  const simpleNavigate = (to: To, options?: NavigateOptions) => {
    navigate(to, options)
  }

  return {
    navigate: customNavigate,
    simpleNavigate,
  }
}

export default useCustomNavigate
