import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { useSitesApi } from '../api/sites'
import { Site } from '../models/Site.model'
import { useDashboardContext } from './Dashboard.context'

type SitesContextType = {
  sites: Site[] | undefined
  updateCurrentSite: (site?: Site) => void
  currentSite: Site | undefined
}

const SiteContext = createContext<SitesContextType>({
  sites: [],
  currentSite: undefined,
  updateCurrentSite: () => {
    throw new Error('not implemented')
  },
})

export const useSites = () => useContext(SiteContext)

type HostSites = {
  sites: Site[]
  currentSite?: Site
}

const NO_HOST_SITES: HostSites = { sites: [] }

/**
 * MD's `SitesProvider` starts from the sites and the site it persisted
 * (`persistentStore`: `tenant`, `sites`, `currentSite` in localStorage), so a
 * page requests with the user's site from its first render (the quotes list
 * loads with `siteCode` at once, as in MD). The remote runs in the host page
 * and shares that storage: it reads the values only when they belong to the
 * host tenant it was given, and never writes them.
 */
const readHostSites = (tenant: string): HostSites => {
  try {
    if (!tenant || localStorage.getItem('tenant') !== tenant) {
      return NO_HOST_SITES
    }
    const sites: unknown = JSON.parse(localStorage.getItem('sites') ?? 'null')
    if (!Array.isArray(sites)) {
      return NO_HOST_SITES
    }
    const current = JSON.parse(
      localStorage.getItem('currentSite') ?? 'null'
    ) as Partial<Site> | null
    return {
      sites: sites as Site[],
      currentSite: (sites as Site[]).find(
        (site) => site.code === current?.code
      ),
    }
  } catch {
    return NO_HOST_SITES
  }
}

export const SitesProvider = ({ children }: PropsWithChildren) => {
  const { token, tenant } = useDashboardContext()
  const { getSites } = useSitesApi()
  const [hostSites] = useState(() => readHostSites(tenant))
  const [sites, setSites] = useState<Site[]>(hostSites.sites)
  const [currentSite, setCurrentSite] = useState<Site | undefined>(
    hostSites.currentSite
  )
  const [sitesTenant, setSitesTenant] = useState(tenant)

  // A host tenant switch drops the previous tenant's sites in the render that
  // switches, so no page requests the new tenant with the old site.
  if (tenant !== sitesTenant) {
    setSitesTenant(tenant)
    setSites([])
    setCurrentSite(undefined)
  }

  // The site picked while the sites load (a list's restriction switch, an
  // opened quote) stays when it is valid, as in MD.
  const currentSiteRef = useRef(currentSite)
  currentSiteRef.current = tenant === sitesTenant ? currentSite : undefined

  useEffect(() => {
    if (!token || !tenant) return
    // A late response for the previous tenant is ignored.
    let cancelled = false
    ;(async () => {
      try {
        const newSites: Site[] = await getSites()
        if (cancelled) return
        const latest = currentSiteRef.current
        if (!latest || !newSites.some((site) => site.code === latest.code)) {
          const defaultSite = newSites.find((site) => site.default)
          setCurrentSite(defaultSite ?? newSites[0])
        }
        setSites(newSites)
      } catch (error) {
        if (cancelled) return
        console.error('Error fetching sites:', error)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, tenant, getSites])

  const updateCurrentSite = (site?: Site) => {
    currentSiteRef.current = site
    setCurrentSite(site)
  }

  return (
    <SiteContext.Provider value={{ sites, updateCurrentSite, currentSite }}>
      {children}
    </SiteContext.Provider>
  )
}
