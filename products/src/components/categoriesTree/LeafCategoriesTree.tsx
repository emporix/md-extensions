import { CategoryTree } from '../../models/Category.model'
import CategoryTreeBase from './CategoryTreeBase'

interface Props {
  readonly selectedNodeKey?: string | null
  readonly onSelectCategory: (categoryId: string) => void
}

const isLeaf = (category: CategoryTree): boolean =>
  (category.subcategories?.length ?? 0) === 0

const LeafCategoriesTree = ({ selectedNodeKey, onSelectCategory }: Props) => (
  <CategoryTreeBase
    selectionMode="single"
    selectionKeys={selectedNodeKey ?? undefined}
    isSelectable={isLeaf}
    onSelectCategory={(category) => onSelectCategory(category.id)}
  />
)

export default LeafCategoriesTree
