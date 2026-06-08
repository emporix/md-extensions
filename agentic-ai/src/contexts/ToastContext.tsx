/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
} from 'react'
import { Toast } from 'primereact/toast'
import { formatMessageWithLineBreaks } from '../utils/formatHelpers.tsx'
import '../styles/components/Toast.css'

interface ToastContextType {
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
  showWarning: (message: string) => void
}

const Context = createContext<ToastContextType | undefined>(undefined)

const useToast = () => {
  const context = useContext(Context)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export { useToast }

interface ToastProviderProps {
  children: React.ReactNode
}

const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const toast = useRef<Toast>(null)
  const [appendTo, setAppendTo] = useState<HTMLElement | undefined>(undefined)

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setAppendTo(document.body)
    }
  }, [])

  const showSuccess = (message: string): void => {
    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: formatMessageWithLineBreaks(message),
      life: 3000,
    })
  }

  const showError = (message: string): void => {
    toast.current?.show({
      severity: 'error',
      summary: 'Error',
      detail: formatMessageWithLineBreaks(message),
      life: 5000,
    })
  }

  const showInfo = (message: string): void => {
    toast.current?.show({
      severity: 'info',
      summary: 'Info',
      detail: formatMessageWithLineBreaks(message),
      life: 3000,
    })
  }

  const showWarning = (message: string): void => {
    toast.current?.show({
      severity: 'warn',
      summary: 'Warning',
      detail: formatMessageWithLineBreaks(message),
      life: 4000,
    })
  }

  return (
    <Context.Provider value={{ showSuccess, showError, showInfo, showWarning }}>
      <Toast ref={toast} appendTo={appendTo} />
      {children}
    </Context.Provider>
  )
}

export { ToastProvider }
