import { useEffect, useState } from 'react'

// Hack to wait until DOM is ready
// Solves similar problem as https://stackoverflow.com/questions/54660685/react-and-using-reactdom-createportal-target-container-is-not-a-dom-element/66447347
export const useDomObserver = () => {
  const [isDomReady, setIsDomReady] = useState(false)

  useEffect(() => {
    setIsDomReady(true)
  }, [])

  return isDomReady
}
