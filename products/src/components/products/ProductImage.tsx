import InputField from '../shared/InputField'
import { Galleria } from 'primereact/galleria'
import { useProductData } from '../../context/ProductDataProvider'
import { Button } from 'primereact/button'
import { useTranslation } from 'react-i18next'

const itemTemplate = (item: string) => {
  return (
    <img
      src={`${item}`}
      onError={(e: any) =>
        (e.target.src =
          'https://www.primefaces.org/wp-content/uploads/2020/05/placeholder.png')
      }
      alt={item}
      style={{ height: 'auto', maxWidth: '300px' }}
    />
  )
}

const thumbnailTemplate = (item: string) => {
  return (
    <img
      src={`${item}`}
      onError={(e: any) =>
        (e.target.src =
          'https://www.primefaces.org/wp-content/uploads/2020/05/placeholder.png')
      }
      alt={item}
      style={{ height: 'auto', maxWidth: '80px' }}
    />
  )
}

export const ProductImage = () => {
  const { product } = useProductData()
  const { t } = useTranslation()
  return (
    <div className={'grid grid-nogutter'}>
      <div className="col-6 module-subtitle mb-5 mt-3">
        {t('products.edit.tab.general.information')}
      </div>
      <div className="col-6 flex justify-content-end align-items-center">
        <Button className="p-button-secondary" label={t('global.discard')} />
        <Button className="ml-2" disabled={false} label={t('global.save')} />
      </div>
      <InputField
        label={t('products.edit.tab.general.image')}
        className="col-6 pr-1"
      >
        <Galleria
          value={product?.mixins?.customImages?.images}
          numVisible={5}
          style={{ maxWidth: '100%' }}
          item={itemTemplate}
          thumbnail={thumbnailTemplate}
        />
      </InputField>
    </div>
  )
}
