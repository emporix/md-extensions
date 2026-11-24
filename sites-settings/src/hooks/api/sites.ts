import { useMemo } from 'react'
import {
  createSiteCall,
  deleteSiteCall,
  fetchAll,
  getSiteCall,
  listSitesCall,
  patchSiteCall,
  updateSiteCall,
} from '@emporix/api-calls/next'
import { useDashboardContext } from '../../context/Dashboard.context'
import type {
  Site,
  SiteCreate,
  SitePatch,
  SiteUpdate,
} from '../../models/Site.model'

/** Site Service calls bound to the host tenant (MD `hooks/api/sites.ts`). */
export const useSiteSettingsApi = () => {
  const { tenant } = useDashboardContext()

  return useMemo(() => {
    const options = { tenant }

    return {
      /** Every site; inactive ones only with `includeInactive` (Sites Manager). */
      getAllSites: (includeInactive: boolean): Promise<Site[]> =>
        fetchAll(listSitesCall, { includeInactive }, options),
      /** One site with its mixins, as MD loaded it. */
      getSite: (siteCode: string): Promise<Site> =>
        getSiteCall(siteCode, { expand: 'mixin:*' }, options),
      /** Resolves to the code of the new site. */
      createSite: async (site: SiteCreate): Promise<string> =>
        (await createSiteCall(site, options)).id,
      editSite: (siteCode: string, site: SiteUpdate): Promise<void> =>
        updateSiteCall(siteCode, site, undefined, options),
      patchSite: (siteCode: string, patch: SitePatch): Promise<void> =>
        patchSiteCall(siteCode, patch, options),
      deleteSite: (siteCode: string): Promise<void> =>
        deleteSiteCall(siteCode, options),
    }
  }, [tenant])
}
