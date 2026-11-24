import { useMemo } from 'react'
import {
  createConfigurationsCall,
  deleteConfigurationCall,
  getConfigurationCall,
  type Configuration,
} from '@emporix/api-calls/next'
import { upsertConfiguration } from '@emporix/api-calls/platform'
import { useDashboardContext } from '../../context/Dashboard.context'
import type { PreferencePayload } from '../../helpers/systemPreferences.helpers'

/** Configuration Service calls bound to the host tenant (MD `useConfigurationApi`). */
export const useConfigurationApi = () => {
  const { tenant } = useDashboardContext()

  return useMemo(() => {
    const options = { tenant }
    const secured = (payload: { secured?: boolean }) =>
      payload.secured === undefined ? {} : { secured: payload.secured }

    return {
      /** Rejects with a 404 when the tenant has not set the key. */
      getConfiguration: (key: string): Promise<Configuration> =>
        getConfigurationCall(key, options),
      createConfiguration: async (
        key: string,
        value: unknown,
        flags: { secured?: boolean } = {}
      ): Promise<void> => {
        await createConfigurationsCall(
          [{ key, value, ...secured(flags) }],
          options
        )
      },
      /** Updates the key; a 404 creates it instead (as MD did). */
      updateConfiguration: async (
        key: string,
        payload: PreferencePayload
      ): Promise<void> => {
        await upsertConfiguration(
          key,
          { value: payload.value, ...secured(payload) },
          options
        )
      },
      deleteConfiguration: (key: string): Promise<void> =>
        deleteConfigurationCall(key, options),
    }
  }, [tenant])
}
