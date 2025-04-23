import { Product } from '../../models/Category'
import { useTranslation } from 'react-i18next'
import useCustomNavigate from '../../hooks/useCustomNavigate.tsx'
import { useLocalizedValue } from '../../hooks/useLocalizedValue.tsx'
import { Button } from 'primereact/button'

export function VariantInformation(props: { parent: Partial<Product> }) {
  const { parent } = props
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { getContentLangValue } = useLocalizedValue()
  return (
    <div className="flex align-items-center text-sm">
      <div>{`${t('products.variant.variantOf')} `}</div>
      <Button
        className={'pl-2 p-button p-button-small p-button-text text-sm'}
        onClick={(event) => {
          event.preventDefault()
          navigate(`/products/${parent.id}`)
        }}
        label={getContentLangValue(parent.name)}
      ></Button>
    </div>
  )
}
