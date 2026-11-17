import { useTranslation } from 'react-i18next'
import { SelectButton } from '@emporix/component-library'
import { StylableProps } from '../../helpers/props'
import styles from './ViewSwitch.module.scss'

export type ListType = 'list' | 'tree'

type ViewSwitchProps = StylableProps & {
  readonly value: ListType
  readonly onChange: (key: ListType) => unknown
}

type ViewOption = {
  value: ListType
  /** The button's accessible name; the icon is what shows. */
  label: string
  icon: JSX.Element
}

/** Ported from management-dashboard `components/products/ViewSwitch`. */
const ViewSwitch = ({ className = '', value, onChange }: ViewSwitchProps) => {
  const { t } = useTranslation()
  // MD's primeicons glyphs; the tree icon is the rotated sitemap.
  const options: ViewOption[] = [
    {
      value: 'list',
      label: t('categories.displayType.list'),
      icon: <i id="list-view" className="pi pi-list" />,
    },
    {
      value: 'tree',
      label: t('categories.displayType.tree'),
      icon: <i id="tree-view" className={`pi pi-sitemap ${styles.treeIcon}`} />,
    },
  ]

  return (
    <SelectButton
      className={`${styles.switch} ${className}`.trim()}
      value={value}
      options={options}
      onChange={(e) => {
        // MD's switch is `unselectable={false}`: clicking the active view keeps it.
        if (e.value === 'list' || e.value === 'tree') onChange(e.value)
      }}
      itemTemplate={(option) => option.icon}
      data-testid="view-switcher"
    />
  )
}

export default ViewSwitch
