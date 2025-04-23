import SectionBox from './SectionBox'
import EmptyContent from './EmptyContent'

interface EmptyTableProps {
  text: string
  buttonLabel?: string
  className?: string
  action?: () => void
  link?: string
  managerPermissions?: boolean
}

const EmptyTable = (props: EmptyTableProps) => {
  return (
    <SectionBox className={`${props.className}`}>
      <EmptyContent
        managerPermissions={props.managerPermissions}
        text={props.text}
        buttonLabel={props.buttonLabel}
        link={props.link}
        className="my-8"
        action={props.action}
      />
    </SectionBox>
  )
}

EmptyTable.defaultProps = {
  className: '',
  managerPermissions: true,
}

export default EmptyTable
