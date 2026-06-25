import { useTranslation } from 'react-i18next'
import {
  Dialog,
  PrimaryButton,
  SecondaryButton,
} from '@emporix/component-library'

type ConfirmBoxProps = {
  readonly visible: boolean
  readonly onAccept: () => void
  readonly onReject: () => void
  readonly loading?: boolean
  readonly buttonClassName?: string
  readonly title: string
  readonly message: string
  readonly acceptLabel?: string
  readonly rejectLabel?: string
  readonly children?: JSX.Element
}

const ConfirmBox = ({
  visible,
  onAccept,
  onReject,
  loading = false,
  title,
  message,
  acceptLabel = 'global.yes',
  rejectLabel = 'global.cancel',
  children,
}: ConfirmBoxProps) => {
  const { t } = useTranslation()

  return (
    <Dialog visible={visible} onHide={onReject} header={t(title)}>
      <div className="mb-4">{t(message)}</div>
      {children}
      <div className="flex justify-content-end gap-2">
        <SecondaryButton onClick={onReject} disabled={loading}>
          {t(rejectLabel)}
        </SecondaryButton>
        <PrimaryButton loading={loading} disabled={loading} onClick={onAccept}>
          {t(acceptLabel)}
        </PrimaryButton>
      </div>
    </Dialog>
  )
}

export default ConfirmBox
