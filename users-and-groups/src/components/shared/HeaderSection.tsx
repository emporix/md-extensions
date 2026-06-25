import { ReactNode, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import BackButton from './BackButton'

type HeaderProps = {
  readonly title: string | ReactNode
  readonly subtitle?: string | ReactNode
  readonly backTo?: string | (() => void)
  readonly moduleActions?: ReactNode | boolean
  readonly children?: ReactNode | ReactNode[]
}

const HeaderSection = ({
  title,
  subtitle,
  backTo,
  moduleActions,
  children,
}: HeaderProps) => {
  const { navigate } = useCustomNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const handleBackClick = useMemo(() => {
    const paramBackTo = searchParams.get('backTo')
    if (paramBackTo) {
      return () => navigate(paramBackTo)
    }
    if (typeof backTo === 'string') {
      return () => navigate(backTo)
    }
    if (typeof backTo === 'function') {
      return backTo
    }
    return undefined
  }, [backTo, location.search, navigate, searchParams])

  return (
    <div className="w-full mb-3">
      <div className="flex flex-wrap-reverse align-items-center gap-3">
        {backTo && handleBackClick && (
          <BackButton onClick={handleBackClick} />
        )}
        <div className="flex align-items-center">
          <h1 className="module-title">{title}</h1>
          {subtitle && (
            <h1 className="module-title highlight-text ml-2">{subtitle}</h1>
          )}
        </div>
        {moduleActions && <div className="ml-auto">{moduleActions}</div>}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}

export default HeaderSection
