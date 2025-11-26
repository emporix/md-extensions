import { useState, useEffect } from 'react'

interface UsePanelAnimationProps {
  visible: boolean
  onHide: () => void
  animationDuration?: number
}

export const usePanelAnimation = ({
  visible,
  onHide,
  animationDuration = 300,
}: UsePanelAnimationProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (visible) {
      setIsVisible(true)
      setIsClosing(false)
      setTimeout(() => {
        const panel = document.querySelector('.agent-config-panel')
        panel?.classList.add('panel-visible')
      }, 10)
    } else if (isVisible) {
      setIsClosing(true)
      const panel = document.querySelector('.agent-config-panel')
      panel?.classList.remove('panel-visible')

      setTimeout(() => {
        setIsVisible(false)
        setIsClosing(false)
      }, animationDuration)
    }
  }, [visible, isVisible, animationDuration])

  const handleClose = () => {
    setIsClosing(true)
    const panel = document.querySelector('.agent-config-panel')
    panel?.classList.remove('panel-visible')

    setTimeout(() => {
      onHide()
    }, animationDuration)
  }

  const handleBackdropClick = () => {
    handleClose()
  }

  return {
    isVisible,
    isClosing,
    handleClose,
    handleBackdropClick,
  }
}
