import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  deepClone,
  removeObjectEmptyValues,
  updateObjectField,
} from '../helpers/utils'

interface UseFormArgs {
  constraints?: object
  onSubmit?: (...args: any) => unknown
}

export interface FormParameters<T> {
  formData: Partial<T>
  initData: Partial<T>
  formDirty: boolean
  setInitFormData: (data: Partial<T>) => void
  setFormData: Dispatch<SetStateAction<Partial<T>>>
  setFormField: (fieldName: string, value: any) => void
  resetForm: () => void
  errors: any
  isFormValid: boolean
  isTouched: boolean
  submit: (ev: FormEvent<HTMLFormElement>) => void
  canSubmit: boolean
}

const useForm = <T extends object>(args?: UseFormArgs): FormParameters<T> => {
  const { onSubmit }: UseFormArgs = args || {}
  const [errors] = useState<any | undefined>()
  const [isTouched, setIsTouched] = useState(false)
  const [initData, setInitData] = useState<Partial<T>>({})
  const [formData, setFormData] = useState<Partial<T>>({})
  const [isFormValid] = useState(false)
  const [touchedFields, setTouchedFields] = useState<string[]>([])
  const [navigationBlocked, setNavigationBlocked] = useState(false)

  useEffect(() => {
    setDirty()
  }, [formData, initData])

  const addToTouchedFields = useCallback(
    (touchedField: string) => {
      setTouchedFields([...touchedFields, touchedField])
    },
    [touchedFields]
  )

  const setInitFormData = (data: Partial<T>) => {
    setNavigationBlocked(false)
    setInitData(deepClone(data))
    setFormData(data)
  }

  const setFormField = (fieldName: string, value: any) => {
    setFormData((prev) => {
      const dataCopy = deepClone(prev)
      updateObjectField(dataCopy, fieldName, value)
      removeObjectEmptyValues(dataCopy)
      addToTouchedFields(fieldName)
      return dataCopy
    })
  }

  const setDirty = () => {
    if (JSON.stringify(initData) === JSON.stringify(formData)) {
      setNavigationBlocked(false)
    } else {
      setNavigationBlocked(true)
    }
  }

  const resetForm = useCallback(() => {
    setFormData(initData)
    setTouchedFields([])
  }, [initData])

  const submit = useCallback(
    (ev: FormEvent<HTMLFormElement>) => {
      ev.preventDefault()
      if (!isTouched) {
        setIsTouched(true)
        return
      }
      if (!isFormValid) {
        return
      }
      onSubmit?.()
    },
    [isTouched, onSubmit, isFormValid]
  )

  const canSubmit = useMemo(() => {
    if (!isTouched) {
      return true
    }
    return isFormValid
  }, [isTouched, isFormValid])

  return {
    formData,
    initData,
    formDirty: navigationBlocked,
    setInitFormData,
    setFormData,
    setFormField,
    resetForm,
    errors,
    isFormValid,
    isTouched,
    submit,
    canSubmit,
  }
}

export default useForm
