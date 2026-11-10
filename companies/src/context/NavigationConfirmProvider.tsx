import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { useBlocker } from 'react-router'
import { ConfirmBox } from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import { Props } from '../helpers/props'

interface NavigationConfirmContextType {
  /** A form on the page has unsaved changes. */
  navigationBlocked: boolean
  setNavigationBlocked: (isBlocked: boolean) => void
  /**
   * Lets the next navigation through without the confirm: call it right
   * before navigating after a save or a tenant switch.
   */
  releaseNavigation: () => void
  /** The current value, readable inside a navigation (no stale render). */
  isNavigationBlocked: () => boolean
}

const NavigationConfirmContext = createContext<NavigationConfirmContextType>({
  navigationBlocked: false,
  setNavigationBlocked: () => undefined,
  releaseNavigation: () => undefined,
  isNavigationBlocked: () => false,
})

// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with its provider
export const useNavigationConfirm = () => useContext(NavigationConfirmContext)

export const NavigationConfirmProvider = ({ children }: Props) => {
  const [navigationBlocked, setBlockedState] = useState<boolean>(false)
  // Read by the router blocker during a navigation started in the same tick
  // as a state change (e.g. release, then navigate after a save).
  const blockedRef = useRef(false)

  const setNavigationBlocked = useCallback((isBlocked: boolean) => {
    blockedRef.current = isBlocked
    setBlockedState(isBlocked)
  }, [])

  const releaseNavigation = useCallback(
    () => setNavigationBlocked(false),
    [setNavigationBlocked]
  )

  const isNavigationBlocked = useCallback(() => blockedRef.current, [])

  return (
    <NavigationConfirmContext.Provider
      value={{
        navigationBlocked,
        setNavigationBlocked,
        releaseNavigation,
        isNavigationBlocked,
      }}
    >
      {children}
    </NavigationConfirmContext.Provider>
  )
}

/**
 * Asks before leaving a page with unsaved changes. Render it once inside the
 * data router (`useBlocker` needs one). Only a path change counts: switching
 * tabs (`?tab=`) stays on the page and keeps the edits.
 */
export const NavigationBlocker = () => {
  const { t } = useTranslation()
  const { isNavigationBlocked, releaseNavigation } = useNavigationConfirm()
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isNavigationBlocked() &&
      currentLocation.pathname !== nextLocation.pathname
  )

  return (
    <ConfirmBox
      visible={blocker.state === 'blocked'}
      onAccept={() => {
        releaseNavigation()
        blocker.proceed?.()
      }}
      onReject={() => blocker.reset?.()}
      message={t('navigation.blockedAlert')}
      title={t('navigation.blockedTitle')}
      acceptLabel={t('global.yes')}
      rejectLabel={t('global.cancel')}
    />
  )
}
