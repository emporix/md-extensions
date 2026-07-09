import { ReactNode, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import BackButton from './BackButton'
import styles from './HeaderSection.module.scss'

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
    if (typeof backTo === 'function') {
      return backTo
    }
    const paramBackTo = searchParams.get('backTo')
    if (paramBackTo) {
      return () => navigate(paramBackTo)
    }
    if (typeof backTo === 'string') {
      return () => navigate(backTo)
    }
    return undefined
  }, [backTo, location.search, navigate, searchParams])

  return (
    <div className={styles.headerSection}>
      <div className={styles.headerRow}>
        {backTo && handleBackClick && <BackButton onClick={handleBackClick} />}
        <div className={styles.titleRow}>
          <h1 className="module-title">{title}</h1>
          {subtitle && (
            <h1 className={`module-title highlight-text ${styles.subtitle}`}>
              {subtitle}
            </h1>
          )}
        </div>
        {moduleActions && <div className={styles.actions}>{moduleActions}</div>}
      </div>
      {children && <div className={styles.content}>{children}</div>}
    </div>
  )
}

export default HeaderSection
