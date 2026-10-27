export const isHourValid = (time: string) => {
  const cleanedTime = time.replace(/_/g, '0')
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/
  return timeRegex.test(cleanedTime)
}
