import type { Label } from '../../models/Label.model'
import styles from './LabelsTableImage.module.scss'

type LabelsTableImageProps = {
  readonly label: Label
  /** Rendered when the label has no image. */
  readonly nullText?: string
}

const LabelsTableImage = ({
  label,
  nullText = '--',
}: LabelsTableImageProps) => {
  if (!label.image) {
    return <>{nullText}</>
  }

  return (
    <img className={styles.image} alt={label.name ?? ''} src={label.image} />
  )
}

export default LabelsTableImage
