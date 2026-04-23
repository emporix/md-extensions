import logoDark from '../../assets/images/logoDark.png'

export const trimImage = (url: string, width: number, height: number) => {
  if (url !== undefined && url !== null && url.includes('cloudinary')) {
    return url.replace(
      '/upload',
      `/upload/c_pad,q_auto,f_auto,dpr_1,h_${height},${
        width ? `w_${width}` : ''
      }`
    )
  } else if (url === undefined || url === null) {
    return logoDark
  } else {
    return url
  }
}
