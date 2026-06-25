import { PrimaryButton } from '@emporix/component-library'
import { Link } from 'react-router'

type EmptyContentProps = {
  readonly text: string
  readonly buttonLabel?: string
  readonly className?: string
  readonly link?: string
  readonly action?: () => void
  readonly managerPermissions?: boolean
}

const EmptyContent = ({
  className = '',
  text,
  buttonLabel,
  link,
  action,
  managerPermissions = true,
}: EmptyContentProps) => {
  return (
    <div
      className={`${className} flex flex-column justify-content-center align-items-center p-2`}
    >
      <p className="text-lg">{text}</p>
      {buttonLabel && (
        <Link to={link ?? ''} className="mt-3">
          <PrimaryButton disabled={!managerPermissions} onClick={action}>
            {buttonLabel}
          </PrimaryButton>
        </Link>
      )}
    </div>
  )
}

export default EmptyContent
