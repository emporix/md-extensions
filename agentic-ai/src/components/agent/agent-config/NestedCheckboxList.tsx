import { Checkbox } from 'primereact/checkbox'

interface NestedCheckboxItem {
  readonly id: string
  readonly label: string
  readonly checked: boolean
}

interface NestedCheckboxListProps {
  readonly title: string
  readonly items: readonly NestedCheckboxItem[]
  readonly inputIdPrefix: string
  readonly onToggle: (itemId: string, checked: boolean) => void
}

export const NestedCheckboxList = ({
  title,
  items,
  inputIdPrefix,
  onToggle,
}: NestedCheckboxListProps) => (
  <div className="agent-detail-tools-nested-actions">
    <span className="agent-detail-tools-nested-actions-title">{title}</span>
    {items.map((item) => (
      <label
        key={item.id}
        className="agent-detail-tools-nested-action-row"
        htmlFor={`${inputIdPrefix}-${item.id}`}
      >
        <Checkbox
          inputId={`${inputIdPrefix}-${item.id}`}
          checked={item.checked}
          onChange={(event) => onToggle(item.id, event.checked ?? false)}
        />
        <span>{item.label}</span>
      </label>
    ))}
  </div>
)
