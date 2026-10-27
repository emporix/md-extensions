import { DataTable } from '@emporix/component-library'
import useVariantAttributeColumns, {
  AttributeRow,
} from '../../../hooks/dynamicVariants/useVariantAttributeColumns'
import { StylableProps } from '../../../helpers/props'
import { useTranslation } from 'react-i18next'

interface Props extends StylableProps {
  readonly rows: AttributeRow[]
  readonly type: 'local' | 'inherited'
  readonly onEdit?: (row: AttributeRow) => void
  readonly onDelete?: (row: AttributeRow) => void
}

const VariantAttributesTable = (props: Props) => {
  const { className = '', rows, type, onEdit, onDelete } = props
  const { t } = useTranslation()
  const { columns, rowActions } = useVariantAttributeColumns({
    type,
    onEdit,
    onDelete,
  })

  return (
    <DataTable
      className={className}
      dataKey="key"
      emptyMessage={t('products.dynamicVariant.tables.attributes.emptyText')}
      columns={columns}
      rowActions={rowActions}
      value={rows}
      paginator={false}
      showFilter={false}
      showEmptyIcon={false}
    />
  )
}

export type { AttributeRow }
export default VariantAttributesTable
