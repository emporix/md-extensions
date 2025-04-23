import { useCallback, useState } from 'react'
import { Button } from 'primereact/button'
import { BsPlusSquare } from 'react-icons/bs'
import { useTranslation } from 'react-i18next'
import ConfirmBox from '../shared/ConfirmBox'
import { Product } from '../../models/Category'
import { useUIBlocker } from '../../context/UIBlcoker'
import { useProductsApi } from '../../api/products'
import { usePriceApi } from '../../api/prices'

export interface VariantsActionsProps {
  existingVariants: any[]
  attributes: any[]
  product: Product
  rowData: any
}

/**
 *
 * DEMO PURPOSES ONLY
 */
export const VariantsActions = ({
  attributes,
  existingVariants,
  product,
  rowData,
}: VariantsActionsProps) => {
  const { blockPanel } = useUIBlocker()
  const { t } = useTranslation()
  const { createProduct, patchProduct, addImage } = useProductsApi()
  const { createPrice } = usePriceApi()
  const [createDialogVisible, setCreateDialogVisible] = useState(false)
  const createMissingVariant = useCallback(
    async (rowData: any) => {
      blockPanel(true)

      const variantParent = existingVariants
        .filter((v: any) => v.product)
        .filter((v: any) => v.product.mixins.variant.isParent === true)[0]

      let newId =
        product.id?.split('_')[0] +
        Object.values(rowData.value)
          // @ts-ignore
          .map((v: string) => v.replaceAll('/', '_'))
          .map((v: string) => v.replaceAll(' ', '_'))
          .join('_')
      newId = newId.trim()
      const newProduct = {
        ...product,
        id: newId,
        code: newId.replaceAll('_', ''),
        mixins: {
          ...product.mixins,
          variant: {
            isVariant: true,
            isParent: false,
            variantParent: variantParent.product.id,
            variants: [
              // eslint-disable-next-line no-unsafe-optional-chaining
              ...product?.mixins?.variant.variants.map((v: any) => {
                return {
                  variants: [
                    ...v.variants,
                    {
                      // @ts-ignore
                      imageUrl: product.media[0].url as string,
                      productId: newId,
                      value: rowData.value[v.name],
                    },
                  ],
                  value: rowData.value[v.name],
                  name: v.name,
                  values: v.values,
                }
              }),
            ],
          },
        },
      }

      const variantProduct: Product = variantParent.product
      await createProduct(newProduct)
      await addImage(
        variantProduct.media[0].url,
        variantProduct.media[0].id,
        newId
      )
      await createPrice({ ...variantParent.price, productId: newId }, 'v1')

      const mappedProducts: Product[] = existingVariants
        .filter((v: any) => v.product !== undefined)
        .map((v: any) => v.product)

      for (const mappedProduct of mappedProducts) {
        await patchProduct({
          id: mappedProduct.id,
          mixins: {
            ...mappedProduct.mixins,
            variant: {
              ...mappedProduct.mixins.variant,
              variants: [
                // eslint-disable-next-line no-unsafe-optional-chaining
                ...mappedProduct?.mixins?.variant.variants.map((v: any) => {
                  return {
                    ...v,
                    variants: [
                      ...v.variants,
                      {
                        // @ts-ignore
                        imageUrl: newProduct.media[0].url as string,
                        productId: newId,
                        value: rowData.value[v.name],
                      },
                    ],
                  }
                }),
              ],
            },
          },
          metadata: {
            ...mappedProduct.metadata,
          },
        })
      }
      blockPanel(false)
    },
    [attributes, product, existingVariants]
  )
  return (
    <>
      <Button
        className="p-button-text"
        icon="pi"
        tooltip={t('products.edit.tab.attributes.variants.actions.create')}
        onClick={(event) => {
          event.preventDefault()
          setCreateDialogVisible(true)
        }}
      >
        <BsPlusSquare size={20} />
      </Button>
      <ConfirmBox
        key="delete-confirm-box"
        message={t(
          'products.edit.tab.attributes.variants.actions.createDialog.title'
        )}
        title={t(
          'products.edit.tab.attributes.variants.actions.createDialog.message'
        )}
        onReject={() => setCreateDialogVisible(false)}
        visible={createDialogVisible}
        onAccept={() => createMissingVariant(rowData)}
      >
        <div className="flex flex-column">
          <div className="flex">
            {Object.keys(rowData.value).map((key) => (
              <div className="ml-2" key={key}>
                {key}:{rowData.value[key]}
              </div>
            ))}
          </div>
        </div>
      </ConfirmBox>
    </>
  )
}
