import { SectionBox } from '@emporix/component-library'
import EmptyContent from './EmptyContent'

type EmptyTableProps = {
  readonly text: string
  readonly buttonLabel?: string
  readonly className?: string
  readonly action?: () => void
  readonly link?: string
  readonly managerPermissions?: boolean
}

const EmptyTable = ({
  text,
  buttonLabel,
  className = '',
  action,
  link,
  managerPermissions = true,
}: EmptyTableProps) => {
  return (
    <SectionBox className={className}>
      <EmptyContent
        managerPermissions={managerPermissions}
        text={text}
        buttonLabel={buttonLabel}
        link={link}
        className="my-8"
        action={action}
      />
    </SectionBox>
  )
}

export default EmptyTable
