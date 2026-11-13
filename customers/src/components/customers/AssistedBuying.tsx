import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SplitButton, type MenuItem } from '@emporix/component-library'
import { useSites } from '../../context/SitesProvider'
import { useCustomerApi } from '../../hooks/api/customers'
import { useFeatureToggles } from '../../context/FeatureTogglesProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import {
  buildAssistedBuyingUrl,
  getAssistedBuyingSites,
} from '../../helpers/customerForm.helpers'

export const ASSISTED_BUYING_FEATURE_TOGGLE = 'DCP_ASSISTED_BUYING'
export const ASSISTED_BUYING_SCOPE = 'customer.assistedBuying_manage'

type AssistedBuyingProps = {
  readonly customerNumber: string
}

/**
 * Port of MD `components/customers/AssistedBuying`: one entry per site with
 * an assisted-buying storefront; picking one logs in as the customer and
 * opens that storefront in a new tab.
 */
const AssistedBuying = ({ customerNumber }: AssistedBuyingProps) => {
  const { t } = useTranslation()
  const { sites } = useSites()
  const { getAssistedBuyingLogin } = useCustomerApi()
  const { isToggleValid } = useFeatureToggles()
  const { hasPermission, userScopes } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CUSTOMERS_MANAGER)

  const configuredSites = useMemo(
    () => getAssistedBuyingSites(sites ?? []),
    [sites]
  )

  const model: MenuItem[] = useMemo(
    () =>
      configuredSites.map((site) => ({
        label: site.name,
        command: async () => {
          const login = await getAssistedBuyingLogin(customerNumber)
          window.open(
            buildAssistedBuyingUrl(site.assistedBuying.storefrontUrl, login),
            '_blank',
            'noreferrer'
          )
        },
      })),
    [configuredSites, customerNumber, getAssistedBuyingLogin]
  )

  if (
    !userScopes?.includes(ASSISTED_BUYING_SCOPE) ||
    !isToggleValid(ASSISTED_BUYING_FEATURE_TOGGLE) ||
    configuredSites.length === 0
  ) {
    return null
  }

  return (
    <SplitButton
      data-testid="assisted-buying"
      disabled={!canManage}
      label={t('customers.assistedBuying.button')}
      menuButtonAriaLabel={t('customers.assistedBuying.button')}
      model={model}
    />
  )
}

export default AssistedBuying
