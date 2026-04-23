import { SplitButton } from 'primereact/splitbutton'
import { useSites } from '../../context/SitesProvider'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Site } from '../../models/Site'
import { useCustomerApi } from '../../api/customers'
import { useFeatureToggles } from '../featureToggles/FeatureTogglesProvider'
import { usePermissions } from '../../context/PermissionsProvider'

interface AssistedBuyingProps {
  customerNumber: string
}

const AssistedBuying = ({ customerNumber }: AssistedBuyingProps) => {
  const { t } = useTranslation()
  const { sites } = useSites()
  const { getAssistedBuyingLogin } = useCustomerApi()
  const { userScopes } = usePermissions()
  const [configuredSites, setConfiguredSites] = useState<Site[]>([])
  const toggles = useFeatureToggles()
  const { permissions } = usePermissions()
  const canBeManaged = permissions?.customers?.manager

  const ASSISTED_BUYING_FEATURE_TOGGLE = 'DCP_ASSISTED_BUYING'

  useEffect(() => {
    if (!sites) return

    setConfiguredSites(
      sites.filter(
        (site) =>
          site?.assistedBuying?.storefrontUrl &&
          site?.assistedBuying?.storefrontUrl.length > 0
      )
    )
  }, [sites])

  useEffect(() => {
    toggles.validateFeature(ASSISTED_BUYING_FEATURE_TOGGLE)
  }, [toggles.featureToggles])

  const splitButtonModel = useMemo(() => {
    return configuredSites.map((site) => ({
      label: site.name,
      code: site.code,
      assistedBuying: site.assistedBuying,
      command: async (e: any) => {
        const loginResponse = await getAssistedBuyingLogin(customerNumber)
        const configuredUrl = new URL(e.item.assistedBuying.storefrontUrl)
        configuredUrl.searchParams.append(
          'customerToken',
          loginResponse.accessToken
        )
        configuredUrl.searchParams.append(
          'customerTokenExpiresIn',
          loginResponse.expiresIn
        )
        configuredUrl.searchParams.append(
          'refreshToken',
          loginResponse.refreshToken
        )
        configuredUrl.searchParams.append(
          'refreshTokenExpiresIn',
          loginResponse.refreshTokenExpiresIn
        )
        configuredUrl.searchParams.append('saasToken', loginResponse.saasToken)
        window.open(configuredUrl.toString(), '_blank', 'noreferrer')
      },
    }))
  }, [configuredSites])

  return (
    <>
      {(!userScopes?.length ||
        userScopes.includes('customer.assistedBuying_manage')) &&
        toggles.featureToggles[ASSISTED_BUYING_FEATURE_TOGGLE] &&
        configuredSites &&
        configuredSites.length > 0 && (
          <SplitButton
            disabled={!canBeManaged}
            style={{ width: 'fit-content' }}
            className="mr-2"
            label={t('customers.assistedBuying.button')}
            model={splitButtonModel}
          />
        )}
    </>
  )
}

export default AssistedBuying
