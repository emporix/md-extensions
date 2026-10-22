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
