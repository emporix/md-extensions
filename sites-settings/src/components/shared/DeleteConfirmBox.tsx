import { ConfirmBox } from '@emporix/component-library'
import {
  useDeleteConfirmTexts,
  type DeleteConfirmTextsOptions,
} from './useDeleteConfirmTexts'

type DeleteConfirmBoxProps = DeleteConfirmTextsOptions & {
  readonly visible: boolean
  readonly onAccept: () => void | Promise<void>
  readonly onReject: () => void
  readonly loading?: boolean
}

const DeleteConfirmBox = ({
  visible,
  onAccept,
  onReject,
  loading = false,
  ...textOptions
}: DeleteConfirmBoxProps) => {
  const texts = useDeleteConfirmTexts(textOptions)

  return (
    <ConfirmBox
      visible={visible}
      onAccept={onAccept}
      onReject={onReject}
      loading={loading}
      {...texts}
    />
  )
}

export default DeleteConfirmBox
