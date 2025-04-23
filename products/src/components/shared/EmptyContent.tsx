import customize from '../../../assets/images/customize.svg'
import { Button } from 'primereact/button'
import { Link } from 'react-router'

interface EmptyTableProps {
  text: string
  buttonLabel?: string
  className?: string
  link?: string
  action?: () => void
  managerPermissions?: boolean
}

const EmptyContent = (props: EmptyTableProps) => {
  const { className, text, buttonLabel, link, action, managerPermissions } =
    props

  return (
    <div
      className={`${className} flex flex-column justify-content-center align-items-center p-2`}
    >
      <img
        style={{ height: '90px' }}
        className="mb-2"
        alt="Background image"
        src={customize}
      />
      <p className="text-lg">{text}</p>
      {buttonLabel && (
        <Link to={link || ''} className="mt-3">
          <Button
            disabled={!managerPermissions}
            className={managerPermissions ? '' : 'p-button p-button-secondary'}
            label={buttonLabel}
            onClick={action}
          />
        </Link>
      )}
    </div>
  )
}

EmptyContent.defaultProps = {
  className: '',
  managerPermissions: true,
}

export default EmptyContent
