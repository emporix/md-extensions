import { Dispatch, SetStateAction } from 'react'

export const makeCall = async <T>(
  fn: () => Promise<T>,
  setIsLoading: Dispatch<SetStateAction<boolean>> | ((val: boolean) => void)
): Promise<T> => {
  try {
    setIsLoading(true)
    return await fn()
  } finally {
    setIsLoading(false)
  }
}
