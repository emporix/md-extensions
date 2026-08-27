import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import { useSitesApi } from '../api/sites'
import { Site } from '../models/Site.model'
import { useDashboardContext } from './Dashboard.context'

type SitesContextType = {
  sites: Site[] | undefined
  updateCurrentSite: (code?: Site) => void
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

export const SitesProvider = ({ children }: PropsWithChildren) => {
  const { token, tenant } = useDashboardContext()
  const { getSites } = useSitesApi()
  const [sites, setSites] = useState<Site[]>([])
  const [currentSite, setCurrentSite] = useState<Site>()

  useEffect(() => {
    if (!token || !tenant) return
    ;(async () => {
      try {
        const newSites: Site[] = await getSites()
        const defaultSite = newSites.find((site) => site.default)
        if (defaultSite) {
          setCurrentSite(defaultSite)
        } else if (newSites[0]) {
          setCurrentSite(newSites[0])
        }
        setSites(newSites)
      } catch (error) {
        console.error('Error fetching sites:', error)
      }
    })()
  }, [token, tenant, getSites])

  const updateCurrentSite = (site?: Site) => {
    setCurrentSite(site)
  }

  return (
    <SiteContext.Provider value={{ sites, updateCurrentSite, currentSite }}>
      {children}
    </SiteContext.Provider>
  )
}
