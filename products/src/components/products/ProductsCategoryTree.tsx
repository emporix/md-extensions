import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Tree,
  TreeEventNodeParams,
  TreeNodeTemplateOptions,
} from 'primereact/tree'
import { Category } from '../../models/Category'
import TreeNode from 'primereact/treenode'
import { useCategoriesApi } from '../../api/categories'
import {
  TreeTable,
  TreeTableSelectionKeys,
  TreeTableSelectionKeysType,
  TreeTableSelectionParams,
} from 'primereact/treetable'
import { Column, ColumnBodyOptions, ColumnProps } from 'primereact/column'
import { useTranslation } from 'react-i18next'
import { CategoryActions } from './CategoryActions'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { DotIndicator } from '../shared/DotIndicator'
import classNames from 'classnames'
import { useLocalizedValue } from '../../hooks/useLocalizedValue.tsx'
import DateValue from '../shared/DateValue'
import { useUIBlocker } from '../../context/UIBlcoker'
import { deepClone } from '../../helpers/utils'
import { BsArrowDown, BsArrowUp } from 'react-icons/bs'
import { useToast } from '../../context/ToastProvider'
import EmptyTable from '../shared/EmptyTable'
import './ProductsCategoryTree.scss'
import { useDashboardContext } from '../../context/Dashboard.context.tsx'

export const replaceInTree = (
  nodes: TreeNode[] | undefined,
  lazyNode: TreeNode
): boolean => {
  return (
    Array.isArray(nodes) &&
    nodes.some((node: TreeNode, idx: number, arr: TreeNode[]) => {
      if (node.key === lazyNode.key) {
        arr[idx] = lazyNode
        return true
      }
      return replaceInTree(node.children, lazyNode)
    })
  )
}

export const findFirstCategory = (node: TreeNode): string | null => {
  if (node.leaf !== false) {
    return node.key ? node.key.toString() : null
  } else {
    return (
      node?.children
        ?.map((node: TreeNode) => {
          const key = findFirstCategory(node)
          if (key) {
            return key
          } else {
            return null
          }
        })
        .filter((key: string | null) => !!key)?.[0] || null
    )
  }
}

interface Props {
  selectedNodeKeys: string | TreeTableSelectionKeys | null
  selectHandler?: (nodeId: string) => void
  multipleSelectionHandler?: (nodeIds: TreeTableSelectionKeysType) => void
  table?: boolean
  allowsReorder?: boolean
  treeNodeTemplate?: (
    node: TreeNode,
    options: TreeNodeTemplateOptions
  ) => ReactNode
}

const ProductsCategoryTree: FC<Props> = ({
  selectedNodeKeys,
  selectHandler,
  multipleSelectionHandler,
  table,
  allowsReorder,
  treeNodeTemplate,
}) => {
  const { i18n, t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<TreeNode[]>([])
  const { tenant } = useDashboardContext()
  const { refresh } = useRefresh()
  const { syncCategories, syncSubCategories, patchCategory } =
    useCategoriesApi()
  const { getContentLangValue } = useLocalizedValue()
  const { blockPanel } = useUIBlocker()
  const TABLE_NAME = 'categories.table'
  const { showError } = useToast()
  const { permissions } = useDashboardContext()
  const canReadCategories = permissions?.categories?.viewer

  const mapSubcategoryToPrime = useCallback(
    (category: Category): TreeNode => {
      return {
        key: category.id,
        label: getContentLangValue(category.localizedName),
        data: { ...category },
        children: category.children
          ? category.children.map((category) => mapSubcategoryToPrime(category))
          : undefined,
      }
    },
    [getContentLangValue]
  )

  const mapRootCategoryToPrime = useCallback(
    (category: Category): TreeNode => {
      return {
        key: category.id,
        label: getContentLangValue(category.localizedName),
        data: category,
        children:
          category.children &&
          category.children.map((category) => mapSubcategoryToPrime(category)),
      }
    },
    [getContentLangValue]
  )

  useEffect(() => {
    ;(async () => {
      if (!canReadCategories) return
      try {
        setIsLoading(true)
        const categories = await syncCategories()
        const categoriesTree: TreeNode[] = []
        await Promise.all(
          categories
            .sort((a, b) => a.position - b.position)
            .map(async (category: Category) => {
              try {
                const e = await syncSubCategories(category.id)
                category.children = e.sort((a, b) => a.position - b.position)
                category.leaf = e.length > 0
                categoriesTree.push(mapRootCategoryToPrime(category))
              } catch (err) {
                category.children = undefined
                categoriesTree.push(mapRootCategoryToPrime(category))
              }
            })
        )
        setCategories(categoriesTree)
        const firstCategoryId = findFirstCategory(categoriesTree[0])
        if (firstCategoryId && selectHandler) {
          selectHandler(firstCategoryId)
        }
      } finally {
        setIsLoading(false)
      }
    })()
  }, [tenant, refresh, canReadCategories])

  const propagateSubCategories = async (node: TreeNode, goDeeper = true) => {
    try {
      const subcategories = await syncSubCategories(node.key as string)
      const lazyNode: TreeNode = { ...node }
      lazyNode.children = subcategories
        .sort((a, b) => a.position - b.position)
        .map((sub) => mapSubcategoryToPrime(sub))
      if (goDeeper) {
        lazyNode.children.forEach((node) => {
          propagateSubCategories(node, false)
        })
      }
      const nodes = [...categories]
      replaceInTree(nodes, lazyNode)
      setCategories(nodes)
    } catch (err) {
      console.error(err)
    }
  }

  const expandHandler = async (params: TreeEventNodeParams) => {
    const { node } = params
    propagateSubCategories(node)
  }

  const selectionChange = useCallback(
    (event: TreeTableSelectionParams) => {
      if (multipleSelectionHandler) {
        multipleSelectionHandler(event.value)
      }
    },
    [multipleSelectionHandler, categories]
  )

  const defaultNodeTemplate = (
    node: TreeNode,
    options: TreeNodeTemplateOptions
  ) => {
    return (
      <div
        className={classNames(
          options.className,
          'flex align-items-center justify-content-center'
        )}
      >
        <DotIndicator value={node.data.published}></DotIndicator>
        <div className="ml-1">{node.label}</div>
      </div>
    )
  }

  const getNodeParent = (index: string, nodes: TreeNode[]): TreeNode => {
    const indexArray = index.split('_').map(Number)
    let parent = nodes[indexArray[0]]
    indexArray.pop()
    indexArray.shift()
    for (const i of indexArray) {
      if (parent.children) {
        parent = parent.children[i]
      }
    }
    return parent
  }

  const updateCategory = async (nodeA: TreeNode, nodeB: TreeNode) => {
    try {
      blockPanel(true)
      await patchCategory({
        id: nodeA.data.id,
        position: nodeB.data.position,
        metadata: { version: nodeA.data.metadata.version },
      })
      await patchCategory({
        id: nodeB.data.id,
        position: nodeA.data.position,
        metadata: { version: nodeB.data.metadata.version },
      })
      const newNodeA = deepClone(nodeA)
      const newNodeB = deepClone(nodeB)
      newNodeA.data.metadata.version++
      newNodeB.data.metadata.version++
      newNodeA.data.position = nodeB.data.position
      newNodeB.data.position = nodeA.data.position
      return { newNodeA, newNodeB }
    } catch (e) {
      console.error(e)
      try {
        await patchCategory({
          id: nodeA.data.id,
          position: nodeA.data.position,
          metadata: { version: ++nodeA.data.metadata.version },
        })
        await patchCategory({
          id: nodeB.data.id,
          position: nodeB.data.position,
          metadata: { version: ++nodeB.data.metadata.version },
        })
      } catch (e) {
        console.error(e)
      }
      showError(t(`categories.actions.move.error`), '')
      throw e
    } finally {
      blockPanel(false)
    }
  }

  const moveRootCategory = async (
    treeNodeIndex: number,
    direction: 'up' | 'down'
  ) => {
    const newCategories = [...categories]
    const indexA = treeNodeIndex
    const indexB = direction === 'up' ? indexA - 1 : indexA + 1
    const nodeA = categories[indexA]
    const nodeB = categories[indexB]
    try {
      const { newNodeA, newNodeB } = await updateCategory(nodeA, nodeB)
      newCategories[indexA] = newNodeB
      newCategories[indexB] = newNodeA
      setCategories(newCategories)
    } catch (e) {
      console.error(e)
    }
  }

  const moveCategory = async (
    treeNodeIndex: string,
    direction: 'up' | 'down'
  ) => {
    const newCategories = deepClone(categories)
    const parent = getNodeParent(treeNodeIndex, newCategories)
    const siblings = parent.children as TreeNode[]
    const indexA = treeNodeIndex.split('_').map(Number).at(-1) as number
    const indexB = direction === 'up' ? indexA - 1 : indexA + 1
    const nodeA = siblings[indexA]
    const nodeB = siblings[indexB]
    try {
      const { newNodeA, newNodeB } = await updateCategory(nodeA, nodeB)
      siblings[indexA] = newNodeB
      siblings[indexB] = newNodeA
      setCategories(newCategories)
    } catch (e) {
      console.error(e)
    }
  }

  const orderChangeTemplate = useCallback(
    (_rowData: TreeNode, options: ColumnBodyOptions) => {
      const index = options.rowIndex as number | string
      const isRoot = typeof index === 'number'
      const isFirst = () => {
        const numIndex = isRoot ? index : index.split('_').map(Number).at(-1)
        return numIndex === 0
      }
      const isLast = () => {
        if (isRoot) {
          return index === categories.length - 1
        } else {
          const siblings = getNodeParent(index, categories).children || []
          const numIndex = index.split('_').map(Number).at(-1)
          return numIndex === siblings.length - 1
        }
      }
      return (
        <div className="flex flex-column gap-2">
          {!isFirst() && (
            <BsArrowUp
              className="cursor-pointer"
              onClick={() =>
                isRoot
                  ? moveRootCategory(index, 'up')
                  : moveCategory(index, 'up')
              }
            />
          )}
          {!isLast() && (
            <BsArrowDown
              className="cursor-pointer"
              onClick={() =>
                isRoot
                  ? moveRootCategory(index, 'down')
                  : moveCategory(index, 'down')
              }
            />
          )}
        </div>
      )
    },
    [categories]
  )

  const columns = useMemo<ColumnProps[]>(() => {
    return [
      {
        columnKey: `${TABLE_NAME}.position`,
        header: t(`${TABLE_NAME}.position`),
        field: 'position',
        body: (rowData: TreeNode) => {
          const category: Category = rowData.data
          return category.position
        },
      },
      {
        columnKey: `${TABLE_NAME}.name`,
        header: t(`${TABLE_NAME}.name`),
        field: 'name',
        body: (rowData: TreeNode) => rowData.label,
      },
      {
        columnKey: `${TABLE_NAME}.code`,
        header: t(`${TABLE_NAME}.code`),
        field: 'code',
        body: (rowData: TreeNode) => {
          const category: Category = rowData.data
          return getContentLangValue(category.localizedSlug)
        },
      },
      {
        columnKey: `${TABLE_NAME}.published`,
        header: t(`${TABLE_NAME}.published`),
        field: 'published',
        body: (rowData: TreeNode) => {
          const category: Category = rowData.data
          return <DotIndicator value={category.published}></DotIndicator>
        },
      },
      {
        columnKey: `${TABLE_NAME}.validity.from`,
        header: t(`${TABLE_NAME}.validity.from`),
        field: 'validity.from',
        body: (rowData: TreeNode) => {
          const category: Category = rowData.data
          return <DateValue date={category.validity.from} />
        },
      },
      {
        columnKey: `${TABLE_NAME}.validity.to`,
        header: t(`${TABLE_NAME}.validity.to`),
        field: 'validity.to',
        body: (rowData: TreeNode) => {
          const category: Category = rowData.data
          return <DateValue date={category.validity.to} />
        },
      },
      {
        columnKey: `${TABLE_NAME}.order`,
        style: { width: allowsReorder ? '3.5rem' : '0' },
        header: t(`${TABLE_NAME}.actions`),
        body: (rowData: TreeNode, options) =>
          allowsReorder && orderChangeTemplate(rowData, options),
      },
      {
        columnKey: `${TABLE_NAME}.actions`,
        body: (rowData: TreeNode) => (
          <CategoryActions category={rowData.data}></CategoryActions>
        ),
      },
    ]
  }, [i18n.language, categories])

  return !canReadCategories ? (
    <EmptyTable
      text={t('global.noPermissions')}
      className="no-permission-table"
    />
  ) : table ? (
    <TreeTable
      autoLayout
      selectionMode="checkbox"
      value={categories.sort((a, b) => a.data.position - b.data.position)}
      onExpand={expandHandler}
      onSelectionChange={selectionChange}
      selectionKeys={selectedNodeKeys}
      scrollable={true}
      loading={isLoading}
    >
      <Column expander key="expander"></Column>
      {columns.map((column) => {
        return <Column key={column.columnKey} {...column} />
      })}
    </TreeTable>
  ) : (
    <Tree
      value={categories}
      selectionMode="single"
      onExpand={expandHandler}
      onSelect={(treeNodeParams) => {
        if (selectHandler) {
          selectHandler(treeNodeParams.node.data.id)
        }
      }}
      selectionKeys={selectedNodeKeys as string}
      loading={isLoading}
      nodeTemplate={treeNodeTemplate || defaultNodeTemplate}
    />
  )
}

ProductsCategoryTree.defaultProps = {
  table: false,
}

export default ProductsCategoryTree
