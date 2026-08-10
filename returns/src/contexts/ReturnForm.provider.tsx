import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import { Control, FieldErrorsImpl, useForm } from 'react-hook-form'
import { array, object, string } from 'yup'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useToast } from '@emporix/component-library'

import { useCustomerApi } from '../hooks/api/customers'
import { useOrdersApi } from '../hooks/api/orders'
import { useReturnsApi } from '../hooks/api/returns'
import useCustomNavigate from '../hooks/useCustomNavigate'
import type { PaginationProps } from '../hooks/usePagination'
import { useUIBlocker } from '../context/UIBlcoker'
import { useDashboardContext } from '../context/Dashboard.context'
import { getApiErrorDetails } from '../helpers/api'
import type { Customer } from '../models/Customer.model'
import type { Order } from '../models/Order.model'
import {
  ReturnEntry,
  ReturnForm,
  ReturnOrder,
  ReturnOrderItem,
} from '../models/Returns.model'
import { returnDetailPath } from '../constants/paths'

interface ReturnFormContextType {
  isLoading: boolean
  customers: Customer[]
  selectedEntriesMap: Map<string, ReturnEntry[]>
  selectedCustomer: Customer | null
  totalCustomers: number
  totalOrdersCount: number
  totalPrice: number
  orders: Order[]
  selectedOrders: Order[]
  isValid: boolean
  control: Control<ReturnForm> | null
  errors: Partial<FieldErrorsImpl<ReturnForm>>
  form: ReturnForm | null
  anonymousEmail: string | null
  chooseAnonymousEmail: (anonymousEmail: string) => unknown
  fetchCustomers: (paginParams: Partial<PaginationProps>) => unknown
  selectCustomer: (customer: Customer | null) => unknown
  fetchCustomerOrders: (
    paginParams: Partial<PaginationProps>
  ) => Promise<unknown>
  toggleOrder: (orders: Order[]) => unknown
  selectProduct: (orderId: string, entries: ReturnEntry[]) => unknown
  onSubmit: () => Promise<unknown>
}

const notImplemented = () => {
  throw new Error('not implemented')
}

const ReturnFormContext = createContext<ReturnFormContextType>({
  isLoading: false,
  customers: [],
  selectedEntriesMap: new Map(),
  selectedCustomer: null,
  totalCustomers: 0,
  totalOrdersCount: 0,
  totalPrice: 0,
  orders: [],
  selectedOrders: [],
  control: null,
  errors: {},
  form: null,
  isValid: false,
  anonymousEmail: null,
  chooseAnonymousEmail: notImplemented,
  fetchCustomers: notImplemented,
  selectCustomer: notImplemented,
  fetchCustomerOrders: async () => notImplemented(),
  toggleOrder: notImplemented,
  selectProduct: notImplemented,
  onSubmit: async () => notImplemented(),
})

export const useReturnForm = () => useContext(ReturnFormContext)

const parseReturnOrders = (orderToEntries: Map<string, ReturnEntry[]>) => {
  const returnOrders: ReturnOrder[] = []
  orderToEntries.forEach((entries, orderId) => {
    returnOrders.push({
      id: orderId,
      items: entries.map(
        (entry) =>
          ({
            id: entry.id,
            quantity: entry.quantity,
            reason: entry.reason,
          }) as ReturnOrderItem
      ),
    })
  })
  return returnOrders
}

export const ReturnFormProvider = ({
  children,
}: {
  readonly children: ReactNode
}) => {
  const { user } = useDashboardContext()
  const { showSuccess, showError } = useToast()
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { blockPanel } = useUIBlocker()
  const [searchParams, setSearchParams] = useSearchParams()

  const { syncCustomers, syncCustomer } = useCustomerApi()
  const { syncOrdersNotSiteSpecific } = useOrdersApi()
  const { createReturn } = useReturnsApi()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [orders, setOrders] = useState<Order[]>([])
  const [totalOrdersCount, setTotalOrdersCount] = useState(0)
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([])
  const [anonymousEmail, setAnonymousEmail] = useState<string | null>(null)
  const [selectedEntriesMap, setSelectedEntriesMap] = useState<
    Map<string, ReturnEntry[]>
  >(new Map<string, ReturnEntry[]>())

  const schema = useMemo(
    () =>
      object({
        orders: array()
          .of(
            object({
              id: string().required(t('errors.shared.cantBeBlank')),
              items: array().min(1, t('returns.errors.minProducts')),
            })
          )
          .min(1, t('returns.errors.minOrders')),
        reason: object().shape(
          {
            code: string().when('details', {
              is: (val: string) => !val || val.length < 1,
              then: (schema) => schema.required(t('errors.shared.cantBeBlank')),
            }),
            details: string().when('code', {
              is: (val: string) => !val || val.length < 1,
              then: (schema) => schema.required(t('errors.shared.cantBeBlank')),
            }),
          },
          [['details', 'code']]
        ),
      }),
    [t]
  )

  const defaultValues = useMemo(
    () => ({
      submitter: {
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
      },
      requestor: {
        customerId: '',
        email: '',
      },
      reason: {
        code: '',
        details: '',
      },
      orders: [],
    }),
    [user]
  )

  const {
    control,
    formState: { errors, isValid },
    handleSubmit,
    setValue,
    watch,
  } = useForm<ReturnForm>({
    mode: 'onChange',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(schema as any),
    defaultValues,
  })

  /** Anonymous orders carry no customer id, only the email captured at checkout. */
  const decorateRequestForAnonymousOrders = useCallback(
    (data: ReturnForm): ReturnForm => {
      if (!anonymousEmail) {
        return data
      }
      return {
        ...data,
        requestor: {
          customerId: '',
          anonymous: true,
          email: anonymousEmail,
        },
      }
    },
    [anonymousEmail]
  )

  const onSubmit = handleSubmit(async (data: ReturnForm) => {
    try {
      blockPanel(true)
      const res = await createReturn(decorateRequestForAnonymousOrders(data))
      showSuccess(t('returns.create.createSuccess'))
      navigate(returnDetailPath(res.id))
    } catch (e: unknown) {
      showError(t('returns.toasts.errorCreate'), getApiErrorDetails(e))
    } finally {
      blockPanel(false)
    }
  })

  useEffect(() => {
    void (async () => {
      const customerId = searchParams.get('customerId')
      if (!customerId) {
        return
      }
      try {
        const customer = await syncCustomer(customerId)
        if (customer) {
          setSelectedCustomer(customer)
        }
      } catch (error) {
        console.error(error)
      }
    })()
    // Runs once: seeds the wizard from a ?customerId deep link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchCustomers = async (paginParams: Partial<PaginationProps>) => {
    try {
      setIsLoading(true)
      const { values, totalRecords } = await syncCustomers(paginParams)
      setCustomers(values)
      setTotalCustomers(totalRecords)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedCustomer?.id) {
      return
    }
    searchParams.set('customerId', selectedCustomer.id)
    setValue('requestor.customerId', selectedCustomer.id, {
      shouldValidate: true,
    })
    setSearchParams(searchParams)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomer?.id])

  const selectCustomer = (customer: Customer | null) => {
    setSelectedCustomer(customer)
    setSelectedEntriesMap(new Map<string, ReturnEntry[]>())
    setSelectedOrders([])
  }

  const chooseAnonymousEmail = (email: string) => setAnonymousEmail(email)

  const fetchCustomerOrders = useCallback(
    async (paginParams: Partial<PaginationProps>) => {
      const data = await syncOrdersNotSiteSpecific(paginParams)
      setOrders(data.values)
      setTotalOrdersCount(data.totalRecords)
    },
    [syncOrdersNotSiteSpecific]
  )

  const toggleOrder = useCallback(
    (next: Order[]) => setSelectedOrders(next),
    []
  )

  const totalPrice = useMemo(
    () =>
      Array.from(selectedEntriesMap.values()).reduce(
        (acc, entries) =>
          acc +
          entries.reduce((prev, curr) => {
            const price = curr.calculatedUnitPrice?.grossValue ?? curr.unitPrice
            return prev + curr.quantity * price
          }, 0),
        0
      ),
    [selectedEntriesMap]
  )

  const selectProduct = (orderId: string, entries: ReturnEntry[]) => {
    setSelectedEntriesMap((prev) => {
      const next = new Map<string, ReturnEntry[]>(prev)
      next.set(orderId, entries)
      setValue('orders', parseReturnOrders(next), { shouldValidate: true })
      return next
    })
  }

  const form = watch()

  return (
    <ReturnFormContext.Provider
      value={{
        errors,
        selectedCustomer,
        isLoading,
        customers,
        orders,
        totalCustomers,
        totalOrdersCount,
        selectedOrders,
        fetchCustomers,
        selectCustomer,
        fetchCustomerOrders,
        toggleOrder,
        selectProduct,
        selectedEntriesMap,
        totalPrice,
        control,
        form,
        isValid,
        anonymousEmail,
        chooseAnonymousEmail,
        onSubmit,
      }}
    >
      {children}
    </ReturnFormContext.Provider>
  )
}
