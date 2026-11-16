import { MixinsFormItem } from './helpers'
import styles from './Mixins.module.scss'

/** MD colors: --blue-4 (added), --red (deleted), --gold (changed). */
export const getIndicatorColor = (item?: MixinsFormItem) => {
  if (item?.toAdd) {
    return '#5f93d6'
  } else if (item?.toDelete) {
    return '#e8615a'
  } else if (item?.toChange || item?.nameChanged) {
    return '#ebb050'
  }
  return undefined
}

/** SCSS-module class carrying the same color as `getIndicatorColor`. */
export const getIndicatorClassName = (item?: MixinsFormItem) => {
  if (item?.toAdd) {
    return styles.added
  } else if (item?.toDelete) {
    return styles.deleted
  } else if (item?.toChange || item?.nameChanged) {
    return styles.changed
  }
  return ''
}
