import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@emporix/component-library'
import { useSchemaApi } from '../hooks/api/schema'
import { getApiErrorDetails } from '../helpers/api'
import { Schema, SchemaType } from '../models/Schema.model'

type ClassificationSchemasProviderProps = {
  readonly children: ReactNode | ReactNode[]
}

interface ContextData {
  schemas: Schema[] | undefined
}

const Context = createContext<ContextData>({ schemas: [] })

// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with its provider
export const useClassificationSchemasData = () => useContext(Context)

/** Ported from management-dashboard `modules/classifications/contexts/ClassificationSchemas.provider`. */
export const ClassificationSchemasProvider = ({
  children,
}: ClassificationSchemasProviderProps) => {
  const { t } = useTranslation()
  const { showError } = useToast()
  const { getSchemas } = useSchemaApi()
  const [schemas, setSchemas] = useState<Schema[]>([])

  useEffect(() => {
    let isCurrent = true
    getSchemas(SchemaType.CLASSIFICATION)
      .then((data) => {
        if (isCurrent) setSchemas(data)
      })
      .catch((e: unknown) => {
        if (!isCurrent) return
        console.error(e)
        showError(
          t('classifications.toasts.errorFetchSchemas'),
          getApiErrorDetails(e)
        )
      })
    return () => {
      isCurrent = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getSchemas])

  return <Context.Provider value={{ schemas }}>{children}</Context.Provider>
}
