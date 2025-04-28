import { Option } from '../products/LabelChip'
import { DropdownProps } from 'primereact/dropdown'

export const optionTemplate = (options: Option) => {
  return (
    <div className="flex align-items-center">
      <img
        style={{ width: '50px', height: '30px' }}
        src={options.image}
        alt={options.name}
      />
      <span className="ml-2">{options.name}</span>
    </div>
  )
}

export const selectedTemplate = (options: Option, props: DropdownProps) => {
  if (!options) {
    return <span>{props.placeholder}</span>
  }
  return (
    <div className="grid">
      <div className="flex align-items-center">
        <img
          style={{ width: '50px', height: '30px' }}
          src={options.image}
          alt={options.name}
        />
        <span className="ml-2">{options.name}</span>
      </div>
    </div>
  )
}
