import type { Brand } from '../../models/Brand.model'
import styles from './BrandsTableImage.module.scss'

type BrandsTableImageProps = {
  readonly brand: Brand
  /** Rendered when the brand has no image. */
  readonly nullText?: string
}

const BrandsTableImage = ({
  brand,
  nullText = '--',
}: BrandsTableImageProps) => {
  if (!brand.image) {
    return <>{nullText}</>
  }

  return (
    <img className={styles.image} alt={brand.name ?? ''} src={brand.image} />
  )
}

export default BrandsTableImage
