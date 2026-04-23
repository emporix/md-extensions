import React, { ReactNode, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import SitesSelect from './SitesSelect'
import { Button } from 'primereact/button'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { BsArrowLeft } from 'react-icons/bs'

interface HeaderProps {
  title: string | ReactNode
  subtitle?: string | ReactNode
  backTo?: string | (() => void)
  moduleActions?: ReactNode | boolean
  siteSelect?: boolean
  siteSelectDisabled?: boolean
  activeSite?: boolean
  setActiveSite?: (active: boolean) => unknown
  children?: ReactNode | ReactNode[]
}

const HeaderSection = (props: HeaderProps) => {
  const {
    title,
    subtitle,
    backTo,
    moduleActions,
    siteSelect,
    siteSelectDisabled,
    activeSite = true,
    setActiveSite,
    children,
  } = props
  const { navigate } = useCustomNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const handleBackClick = useMemo(() => {
    const paramBackTo = searchParams.get('backTo')
    if (paramBackTo) {
      return () => navigate(paramBackTo)
    } else if (typeof backTo === 'string') {
      return () => navigate(backTo)
    } else if (typeof backTo === 'function') {
      return backTo
    }
    return undefined
  }, [backTo, location.search, navigate, searchParams])

  return (
    <div className="w-full mb-4">
      <div className="flex flex-wrap-reverse align-items-center gap-3">
        {backTo && (
          <Button
            onClick={handleBackClick}
            className="p-button-secondary-small"
            icon={<BsArrowLeft size="16" />}
          />
        )}
        <div className="flex align-items-center">
          <h1 className="module-title">{title}</h1>
          {subtitle && (
            <h1 className="module-title highlight-text ml-2">{subtitle}</h1>
          )}
        </div>
        {moduleActions && <div className="ml-auto">{moduleActions}</div>}
      </div>
      {siteSelect && (
        <div className="mt-2 mb-1">
          <SitesSelect
            disabled={siteSelectDisabled}
            defaultEmpty={!activeSite}
            setActiveSite={setActiveSite}
          />
        </div>
      )}
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}

export default HeaderSection
