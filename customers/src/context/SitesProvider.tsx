import { createContext, FC, useContext, useEffect, useState } from 'react'
import { useSitesApi } from '../api/sites'
import { Props } from '../helpers/props'
import { Site } from '../models/Site'
import { useDashboardContext } from './Dashboard.context.tsx'

interface SitesContextType {
  sites: Site[] | undefined
  updateCurrentSite: (code?: Site) => void
  currentSite: Site | undefined
}

const SiteContext = createContext<SitesContextType>({
  sites: [],
  currentSite: undefined,
  updateCurrentSite: (_code?: Site) => {
    throw new Error('not implemented')
  },
})

export const useSites = () => useContext(SiteContext)

export const SiteProvider: FC<Props> = ({ children }) => {
  const { token } = useDashboardContext()
  const { getSites } = useSitesApi()
  const [sites, setSites] = useState<Site[]>([])
  const [currentSite, setCurrentSite] = useState<Site>()

  useEffect(() => {
    ;(async () => {
      const newSites: Site[] = await getSites()
      const defaultSite = newSites.find((site) => site.default)
      if (defaultSite) {
        updateCurrentSite(defaultSite)
      } else if (newSites[0]) {
        updateCurrentSite(newSites[0])
      }
      setSites(newSites)
    })()
  }, [token])

  const updateCurrentSite = (site?: Site) => {
    if (!site) {
      setCurrentSite(undefined)
      return
    }
    setCurrentSite(site)
  }

  return (
    <SiteContext.Provider value={{ sites, updateCurrentSite, currentSite }}>
      {children}
    </SiteContext.Provider>
  )
}
