import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, PrimaryButton } from '@emporix/component-library'
import {
  BsArrowRepeat,
  BsCamera,
  BsCamera2,
  BsCheck2Circle,
  BsDiagram2,
  BsLightbulb,
} from 'react-icons/bs'
import { ProductType } from '../../models/Category.model'
import styles from './CreateProductDialog.module.scss'

type ProductCard = {
  type: ProductType
  subscription?: boolean
  titleKey: string
  descKeys: string[]
  icons: ReactNode
}

type CreateProductDialogProps = {
  readonly visible: boolean
  readonly onHide: () => void
  readonly onSelectType: (type: ProductType, subscription?: boolean) => void
  readonly showSubscription: boolean
}

const CARDS: ProductCard[] = [
  {
    type: ProductType.basic,
    titleKey: 'products.createModal.basic.title',
    descKeys: ['products.createModal.basic.desc1'],
    icons: <BsCamera size={24} />,
  },
  {
    type: ProductType.bundle,
    titleKey: 'products.createModal.bundle.title',
    descKeys: ['products.createModal.bundle.desc1'],
    icons: (
      <div className={styles.iconGroup}>
        <BsCamera size={24} />
        <BsLightbulb size={24} />
      </div>
    ),
  },
  {
    type: ProductType.parentVariant,
    titleKey: 'products.createModal.parentVariant.title',
    descKeys: ['products.createModal.parentVariant.desc1'],
    icons: (
      <div className={styles.iconGroup}>
        <BsCamera size={24} />
        <BsCamera2 size={24} />
      </div>
    ),
  },
  {
    type: ProductType.dynamicVariant,
    titleKey: 'products.createModal.dynamicVariant.title',
    descKeys: ['products.createModal.dynamicVariant.desc1'],
    icons: (
      <div className={styles.iconGroup}>
        <BsCamera size={24} />
        <BsDiagram2 size={24} />
      </div>
    ),
  },
]

const SUBSCRIPTION_CARD: ProductCard = {
  type: ProductType.parentVariant,
  subscription: true,
  titleKey: 'products.createModal.subscription.title',
  descKeys: ['products.createModal.subscription.desc1'],
  icons: <BsArrowRepeat size={24} />,
}

const CreateProductDialog = ({
  visible,
  onHide,
  onSelectType,
  showSubscription,
}: CreateProductDialogProps) => {
  const { t } = useTranslation()

  const allCards = showSubscription ? [...CARDS, SUBSCRIPTION_CARD] : CARDS

  const cardTemplate = (card: ProductCard) => (
    <div key={`${card.type}-${card.subscription ?? ''}`} className={styles.col}>
      <div className={styles.card}>
        <div className={styles.cardTitle}>{t(card.titleKey)}</div>

        <div className={styles.cardBody}>
          <div className={styles.icons}>{card.icons}</div>

          <PrimaryButton
            className={styles.submit}
            onClick={() => {
              onSelectType(card.type, card.subscription)
              onHide()
            }}
          >
            {t('products.createModal.submit', { name: t(card.titleKey) })}
          </PrimaryButton>

          <ul className={styles.descList}>
            {card.descKeys.map((key) => (
              <li key={key} className={styles.descItem}>
                <BsCheck2Circle className={styles.descIcon} size={14} />
                <span className={styles.descText}>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={t('products.createModal.title')}
      className={styles.dialog}
      draggable={false}
      modal
    >
      <div className={styles.grid}>{allCards.map(cardTemplate)}</div>
    </Dialog>
  )
}

export default CreateProductDialog
