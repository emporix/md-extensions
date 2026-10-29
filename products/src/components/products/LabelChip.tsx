import styles from './LabelChip.module.scss'

export interface Option {
  id: string
  image: string
  name: string
}

type LabelChipProps = {
  readonly data: Option
  readonly onDeleteCall: (id: string) => unknown
}

const LabelChip = ({ data, onDeleteCall }: LabelChipProps) => {
  return (
    <div className={styles.chip}>
      <div className={styles.image}>
        <img src={data.image} alt={data.name} />
      </div>
      <span className={styles.name}>{data.name}</span>
      <button
        type="button"
        className={styles.removeButton}
        aria-label={data.name}
        onClick={(e) => {
          e.preventDefault()
          onDeleteCall(data.id)
        }}
      >
        <i className="pi pi-times" />
      </button>
    </div>
  )
}

export default LabelChip
