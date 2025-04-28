import { useTranslation } from 'react-i18next'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'

interface ConfirmBoxProps {
  visible: boolean
  onAccept: () => void
  onReject: () => void
  loading: boolean
  buttonClassName?: string
  title: string
  message: string
  acceptLabel: string
  rejectLabel: string
  children?: JSX.Element
}

const ConfirmBox = (props: ConfirmBoxProps) => {
  const { t } = useTranslation()

  return (
    <Dialog
      visible={props.visible}
      onHide={props.onReject}
      header={t(props.title)}
    >
      <div className="mb-4">{t(props.message)}</div>
      {props.children && props.children}
      <div className="flex justify-content-end">
        <Button
          className="mr-2 p-button-secondary"
          onClick={props.onReject}
          label={t(props.rejectLabel)}
          disabled={props.loading}
        />
        <Button
          className={props.buttonClassName}
          loading={props.loading}
          disabled={props.loading}
          onClick={props.onAccept}
          label={t(props.acceptLabel)}
        />
      </div>
    </Dialog>
  )
}

ConfirmBox.defaultProps = {
  acceptLabel: 'global.yes',
  rejectLabel: 'global.cancel',
  message: 'confirmBox.message',
  title: 'confirmBox.title',
  loading: false,
}

export default ConfirmBox
