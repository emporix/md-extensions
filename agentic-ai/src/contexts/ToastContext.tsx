import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

  const showSuccess = useCallback((message: string): void => {
    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: formatMessageWithLineBreaks(message),
      life: 3000,
    })
  }, [])

  const showError = useCallback((message: string): void => {
    toast.current?.show({
      severity: 'error',
      summary: 'Error',
      detail: formatMessageWithLineBreaks(message),
      life: 5000,
    })
  }, [])

  const showInfo = useCallback((message: string): void => {
    toast.current?.show({
      severity: 'info',
      summary: 'Info',
      detail: formatMessageWithLineBreaks(message),
      life: 3000,
    })
  }, [])

  const showWarning = useCallback((message: string): void => {
    toast.current?.show({
      severity: 'warn',
      summary: 'Warning',
      detail: formatMessageWithLineBreaks(message),
      life: 4000,
    })
  }, [])

  const value = useMemo(
    () => ({ showSuccess, showError, showInfo, showWarning }),
    [showSuccess, showError, showInfo, showWarning]
  )

  return (
    <Context.Provider value={value}>
      <Toast ref={toast} appendTo={appendTo} />
      {children}
    </Context.Provider>
  )
}

export { ToastProvider }
