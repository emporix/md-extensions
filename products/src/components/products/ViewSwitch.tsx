import { SelectButton } from '@emporix/component-library'
import { StylableProps } from '../../helpers/props'
import styles from './ViewSwitch.module.scss'

export type ListType = 'list' | 'tree'

type ViewSwitchProps = StylableProps & {
  readonly value: ListType
  readonly onChange: (key: ListType) => unknown
  readonly disabled?: boolean
}

type ViewSwitchOption = {
  label: string
  value: ListType
  iconId: string
  iconClassName: string
}

const OPTIONS: ViewSwitchOption[] = [
  {
    label: 'list',
    value: 'list',
    iconId: 'list-view',
    iconClassName: 'pi pi-list',
  },
  {
    label: 'tree',
    value: 'tree',
    iconId: 'tree-view',
    iconClassName: `pi pi-sitemap ${styles.rotated}`,
  },
]

const itemTemplate = (option: ViewSwitchOption) => (
  <i id={option.iconId} className={option.iconClassName} />
)

const ViewSwitch = ({
  className = '',
  value,
  onChange,
  disabled = false,
}: ViewSwitchProps) => {
  return (
    <SelectButton<ViewSwitchOption>
      disabled={disabled}
      className={`${styles.viewSwitch} ${className}`.trim()}
      data-testid="view-switcher"
      value={value}
      options={OPTIONS}
      // MD `unselectable={false}`: clicking the active option keeps it.
      onChange={(e) => {
        if (e.value === 'list' || e.value === 'tree') onChange(e.value)
      }}
      itemTemplate={itemTemplate}
    />
  )
}

export default ViewSwitch
