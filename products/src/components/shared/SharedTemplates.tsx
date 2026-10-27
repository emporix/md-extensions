import { Option } from '../products/LabelChip'
import styles from './SharedTemplates.module.scss'

export const optionTemplate = (options: Option) => {
  return (
    <div className={styles.option}>
      <img className={styles.image} src={options.image} alt={options.name} />
      <span className={styles.name}>{options.name}</span>
    </div>
  )
}

/** Dropdown `valueTemplate`; `props` mirrors MD's Prime `DropdownProps` use. */
export const selectedTemplate = (
  options: Option | null,
  props?: { readonly placeholder?: string }
) => {
  if (!options) {
    return <span>{props?.placeholder}</span>
  }
  return (
    <div className={styles.option}>
      <img className={styles.image} src={options.image} alt={options.name} />
      <span className={styles.name}>{options.name}</span>
    </div>
  )
}
