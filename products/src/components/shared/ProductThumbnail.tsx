import { useEffect, useState } from 'react'
import { trimCloudinaryImage } from '../../helpers/images'
import styles from './ProductThumbnail.module.scss'

interface ProductThumbnailProps {
  url?: string | null
  size?: number
}

/**
 * 32px product image for table rows. Renders an empty-image placeholder when
 * the product has no image or its URL fails to load (instead of the browser's
 * broken-image icon and alt text).
 */
export const ProductThumbnail = ({ url, size = 32 }: ProductThumbnailProps) => {
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [url])

  if (!url || failed) {
    return (
      <div
        className={styles.placeholder}
        style={{ width: size, height: size }}
        data-testid="product-thumbnail-placeholder"
        aria-hidden
      >
        <svg
          width={size / 2}
          height={size / 2}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
    )
  }

  return (
    <img
      className={styles.thumb}
      style={{ width: size, height: size }}
      src={trimCloudinaryImage(url, size, size)}
      alt=""
      onError={() => setFailed(true)}
    />
  )
}

export default ProductThumbnail
