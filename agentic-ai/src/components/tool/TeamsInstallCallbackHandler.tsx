import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import {
  buildTeamsGraphConsentSearch,
  buildTeamsToolRouteFromCallback,
  parseTeamsGraphConsentFromLocation,
} from '../../utils/teamsInstallCallback'

const TeamsInstallCallbackHandler = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const callback = parseTeamsGraphConsentFromLocation(window.location.href)
    if (!callback) {
      return
    }

    const route = buildTeamsToolRouteFromCallback(callback)
    const search = buildTeamsGraphConsentSearch(callback)

    navigate(
      {
        pathname: route,
        search: `?${search}`,
      },
      { replace: true }
    )
  }, [navigate])

  return null
}

export default TeamsInstallCallbackHandler
