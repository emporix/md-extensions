type ImageMedia = {
  url?: string
  contentType?: string
}

/** URL of the first image medium (no content type, or `image/*`). */
export const getFirstImageMediaUrl = (
  media?: readonly ImageMedia[] | null
): string | undefined =>
  media?.find((m) => !m.contentType || m.contentType.startsWith('image/'))?.url

/** Requests a padded thumbnail from Cloudinary; other URLs pass through. */
export const trimCloudinaryImage = (
  url: string | undefined,
  width: number,
  height: number
): string | undefined => {
  if (!url) return undefined
  if (url.includes('cloudinary')) {
    return url.replace(
      '/upload',
      `/upload/c_pad,q_auto,f_auto,dpr_1,h_${height},${width ? `w_${width}` : ''}`
    )
  }
  return url
}
