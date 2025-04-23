import SitesSelect from './SitesSelect'

interface HeaderProps {
  title: string | JSX.Element
  moduleActions?: JSX.Element | boolean
  siteSelect?: boolean
  siteSelectDisabled?: boolean
  activeSite?: boolean
  setActiveSite?: (active: boolean) => unknown
  children?: JSX.Element | JSX.Element[]
}

const HeaderSection = ({
  title,
  moduleActions,
  siteSelect,
  siteSelectDisabled,
  activeSite = true,
  setActiveSite = undefined,
  children,
}: HeaderProps) => {
  return (
    <div className="w-full mb-6">
      <div className="flex justify-content-between align-items-center">
        <h1 className="module-title">{title}</h1>
        {moduleActions && <div>{moduleActions}</div>}
      </div>
      {siteSelect && (
        <div className="mt-4">
          <SitesSelect
            disabled={siteSelectDisabled}
            defaultEmpty={!activeSite}
            setActiveSite={setActiveSite}
          />
        </div>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

export default HeaderSection
