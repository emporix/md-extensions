import { useEffect, useState } from 'react'
import { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { api, ErrorResponse } from '../api/index'
import { Props } from '../helpers/props'
import { useDashboardContext } from './Dashboard.context.tsx'

const ApiProvider = ({ children }: Props) => {
  const { token, tenant, onError } = useDashboardContext()
  const [apiIsReady, setApiIsReady] = useState(false)

  useEffect(() => {
    api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const { headers } = config
      if (headers) {
        headers['Authorization'] = `Bearer ${token}`
        headers['Accept-Language'] = headers['Accept-Language'] || '*'
        headers['Content-Language'] = '*'
        headers['Emporix-Tenant'] = tenant
      }
      return config
    })

    api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ErrorResponse>) => {
        if (error?.response?.status === 401) {
          onError(error)
        }
        return Promise.reject(error)
      }
    )

    if (token && tenant) {
      setApiIsReady(true)
    }
  }, [token, tenant, onError])

  return <>{apiIsReady ? children : null}</>
}

export default ApiProvider
