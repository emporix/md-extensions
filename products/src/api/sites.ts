import { api } from '.'
import { Site } from '../models/Site'
import { useCallback } from 'react'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

const getSitesCall = async (tenant: string) => {
  const { data } = await api.get<Site[]>(`site/${tenant}/sites`, {
    headers: { 'X-Version': 'v2' },
    params: { pageSize: '1000' },
  })
  return data
}

const getAllSitesCall = async (tenant: string, includeInactive: boolean) => {
  const { data } = await api.get<Site[]>(`site/${tenant}/sites`, {
    headers: { 'X-Version': 'v2' },
    params: { pageSize: '1000', includeInactive: includeInactive },
  })
  return data
}

const getSiteCall = async (tenant: string, siteCode: string) => {
  const { data } = await api.get<Site>(`site/${tenant}/sites/${siteCode}`, {
    headers: { 'X-Version': 'v2' },
  })
  return data
}

const createSiteCall = async (tenant: string, site: Partial<Site>) => {
  const { data } = await api.post<{ id: string }>(
    `/site/${tenant}/sites`,
    site,
    {
      headers: { 'X-Version': 'v2' },
    }
  )
  return data.id
}

const editSiteCall = async (
  tenant: string,
  siteCode: string,
  site: Partial<Site>
) => {
  await api.put(`/site/${tenant}/sites/${siteCode}`, site, {
    headers: { 'X-Version': 'v2' },
  })
}

const deleteSiteCall = async (tenant: string, code: string) => {
  return await api.delete(`/site/${tenant}/sites/${code}`)
}

export const useSitesApi = () => {
  const { tenant } = useDashboardContext()

  const getSites = useCallback(() => {
    if (tenant) {
      return getSitesCall(tenant)
    } else {
      return Promise.reject('no tenant')
    }
  }, [tenant])

  const getAllSites = useCallback(
    (includeInactive: boolean) => {
      if (tenant) {
        return getAllSitesCall(tenant, includeInactive)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getSite = useCallback(
    (siteCode: string) => {
      if (tenant) {
        return getSiteCall(tenant, siteCode)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const createSite = useCallback(
    (site: Partial<Site>) => {
      if (tenant) {
        return createSiteCall(tenant, site)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const editSite = useCallback(
    (siteCode: string, site: Partial<Site>) => {
      if (tenant) {
        return editSiteCall(tenant, siteCode, site)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const deleteSite = useCallback(
    (code: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return deleteSiteCall(tenant, code)
    },
    [tenant]
  )

  return {
    getSites,
    getAllSites,
    getSite,
    createSite,
    editSite,
    deleteSite,
  }
}
