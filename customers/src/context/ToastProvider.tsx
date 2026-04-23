import { Toast, ToastSeverityType } from 'primereact/toast'
import { createContext, FC, useCallback, useContext, useRef } from 'react'
import { Props } from '../helpers/props'

const ToastContext = createContext({
  showSuccess: (
    _title: string,
    _message?: string | JSX.Element,
    _life?: number
  ) => {
    //NOOP
  },
  showError: (
    _title: string,
    _message?: string | JSX.Element,
    _life?: number
  ) => {
    //NOOP
  },
  showToast: (
    _title: string,
    _message: string | JSX.Element,
    _severity: ToastSeverityType
  ) => {
    //NOOP
  },
})

export const useToast = () => useContext(ToastContext)

export const ToastProvider: FC<Props> = (props) => {
  const toast = useRef<Toast>(null)
  const showSuccess = useCallback(
    (title: string, message?: string | JSX.Element, life?: number) => {
      toast.current?.show({
        severity: 'success',
        summary: title,
        detail: message || '',
        life: (() => {
          if (life) {
            return life
          } else if (typeof message === 'string' && message.length > 50) {
            return message.length * 80
          } else {
            return 4000
          }
        })(),
      })
    },
    [toast]
  )
  const showError = useCallback(
    (title: string, message?: string | JSX.Element, life?: number) => {
      const validMessage = Array.isArray(message) ? '' : message
      toast.current?.show({
        severity: 'error',
        summary: title,
        detail: validMessage || '',
        life: (() => {
          if (life) {
            return life
          } else if (
            typeof validMessage === 'string' &&
            validMessage.length > 50
          ) {
            return validMessage.length * 80
          } else {
            return 4000
          }
        })(),
      })
    },
    [toast]
  )
  const showToast = useCallback(
    (
      title: string,
      message: string | JSX.Element,
      severity: ToastSeverityType
    ) => {
      toast.current?.show({
        severity,
        summary: title,
        detail: message,
      })
    },
    [toast]
  )

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showToast }}>
      <Toast ref={toast} position="top-center" />
      {props.children}
    </ToastContext.Provider>
  )
}
