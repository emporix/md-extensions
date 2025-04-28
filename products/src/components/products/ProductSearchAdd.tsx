import { useCallback, useState } from 'react'
import { useProductsApi } from '../../api/products'
import { Product } from '../../models/Category'
import {
  AutoComplete,
  AutoCompleteChangeParams,
  AutoCompleteCompleteMethodParams,
} from 'primereact/autocomplete'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import './ProductSearchAdd.scss'
import { BsXCircleFill } from 'react-icons/bs'
import { useLocalizedValue } from '../../hooks/useLocalizedValue.tsx'
import logoDark from '../../../assets/images/logoDark.png'

interface ProductSearchAddProps {
  onSubmit: (ids: string[]) => void
  getBlockedIds: () => string[]
}

type SearchItem = Pick<Product, 'id' | 'name' | 'media'>

const ProductSearchAdd = (props: ProductSearchAddProps) => {
  const { t } = useTranslation()
  const [query, setQuery] = useState<string>('')
  const { getContentLangValue } = useLocalizedValue()
  const [filteredItems, setFilteredItems] = useState<SearchItem[]>([])
  const [selectedItems, setSelectedItems] = useState<SearchItem[]>([])
  const { syncProducts } = useProductsApi()

  const searchProducts = useCallback(
    async (ev: AutoCompleteCompleteMethodParams) => {
      const data = await syncProducts(`name:~(${ev.query})`)
      const filteredItems = data.filter(
        (i) => !props.getBlockedIds().includes(i.id as string)
      )
      setFilteredItems(filteredItems)
    },
    [syncProducts]
  )

  const selectProduct = useCallback(
    (ev: AutoCompleteChangeParams) => {
      const newSelectedItems = [...selectedItems]
      const selectedExist = selectedItems.find((i) => i.id === ev.value.id)
      if (!selectedExist) {
        newSelectedItems.push(ev.value)
        setSelectedItems(newSelectedItems)
      }
      setQuery('')
    },
    [selectedItems]
  )

  const removeSelectedItem = useCallback(
    (id: string) => {
      const newSelectedItems = [...selectedItems].filter((i) => i.id !== id)
      setSelectedItems(newSelectedItems)
    },
    [selectedItems]
  )

  const onSubmit = useCallback(() => {
    const ids = [...selectedItems].map((i) => i.id)
    props.onSubmit(ids as string[])
  }, [selectedItems])

  const selectedItemTemplate = useCallback(
    (item: SearchItem) => {
      return (
        <div key={item.id} className="selected-item flex align-items-center">
          <BsXCircleFill
            size={20}
            onClick={() => removeSelectedItem(item.id as string)}
            className="selected-delete mr-2"
          />
          {itemTemplate(item)}
        </div>
      )
    },
    [removeSelectedItem]
  )

  const itemTemplate = useCallback(
    (item: SearchItem) => {
      return (
        <div className="filtered-item-wrapper flex align-items-center">
          <div className="item-image-wr">
            {item.media?.length > 0 && (
              <img
                alt="Product image"
                src={item.media[0].url}
                className="item-image"
              />
            )}
            {item.media?.length === 0 && (
              <img alt="Product image" src={logoDark} className="item-image" />
            )}
          </div>
          <div className="px-3 item-name">{getContentLangValue(item.name)}</div>
          <div className="item-id">{item.id}</div>
        </div>
      )
    },
    [getContentLangValue]
  )

  return (
    <div className="products-search-wrapper">
      <AutoComplete
        value={query}
        suggestions={filteredItems}
        completeMethod={searchProducts}
        itemTemplate={itemTemplate}
        onChange={(ev) => setQuery(ev.value)}
        onSelect={selectProduct}
        placeholder={t('products.edit.productsSearch.searchPlaceholder')}
        className="w-full py-1 mb-3"
      />
      <div className="mb-3 font-bold">
        {t('products.edit.productsSearch.selected')}
      </div>
      {selectedItems.length > 0 ? (
        <div className="selected-items">
          {selectedItems.map((i) => selectedItemTemplate(i))}
        </div>
      ) : (
        <div>{t('products.edit.productsSearch.emptySelected')}</div>
      )}
      <Button
        className="ml-auto block mt-4"
        label={t('products.edit.productsSearch.submitAdd')}
        disabled={selectedItems.length == 0}
        onClick={onSubmit}
      />
    </div>
  )
}

export default ProductSearchAdd
