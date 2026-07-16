import { useCallback } from 'react'
import {
  fetchSingleConfiguration,
  updateSingleConfiguration,
  createSingleConfiguration,
  deleteSingleConfiguration,
} from '@emporix/api-calls'
import { ConfigSchema } from '../../models/Settings.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import { AxiosError } from 'axios'

export const useConfigurationApi = () => {
  const { tenant } = useDashboardContext()

  const getSingleConfiguration = useCallback(
    (key: string) => {
      if (tenant) {
        return fetchSingleConfiguration(tenant, key)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )
  const updateConfiguration = useCallback(
    async (key: string, payload: ConfigSchema) => {
      if (tenant) {
        try {
          await updateSingleConfiguration(tenant, key, payload)
        } catch (error) {
          console.error(error)
          console.info(
            `Update failed trying to create new configuration under key ${key}`
          )
          if (error instanceof AxiosError && error.response?.status === 404) {
            return await createSingleConfiguration(tenant, key, payload)
          } else {
            throw error
          }
        }
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const createConfiguration = useCallback(
    (key: string, data: unknown) => {
      if (tenant) {
        return createSingleConfiguration(tenant, key, data)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const deleteConfiguration = useCallback(
    (key: string) => {
      return deleteSingleConfiguration(tenant, key)
    },
    [tenant]
  )

  const getRestrictions = useCallback(
    () => getSingleConfiguration('restrictions'),
    [tenant]
  )

  const getSyncBetweenRestrictionsAndSiteCodes = useCallback(
    () => getSingleConfiguration('enableSyncBetweenRestrictionsAndSiteCodes'),
    [tenant]
  )

  return {
    getSingleConfiguration,
    updateConfiguration,
    createConfiguration,
    deleteConfiguration,
    getRestrictions,
    getSyncBetweenRestrictionsAndSiteCodes,
  }
}
