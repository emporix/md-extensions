import { SelectButton } from 'primereact/selectbutton'

export type ListType = 'list' | 'tree'
interface Props {
  value: ListType
  onChange: (key: ListType) => unknown
  disabled?: boolean
}
const ViewSwitch = ({ onChange, value, disabled }: Props) => {
  const options = [
    { icon: <i id="list-view" className="pi pi-list" />, value: 'list' },
    {
      icon: <i id="tree-view" className="pi pi-sitemap -rotate-90" />,
      value: 'tree',
    },
  ]

  const template = (options: { icon: JSX.Element }) => {
    return options.icon
  }

  return (
    <SelectButton
      disabled={disabled}
      id="view-switcher"
      value={value}
      options={options}
      onChange={(e) => {
        onChange(e.value)
      }}
      itemTemplate={template}
      unselectable={false}
    />
  )
}

ViewSwitch.defaultProps = {
  disabled: false,
}

export default ViewSwitch
