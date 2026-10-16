export interface PaymentMethod {
  id: string
  active: boolean
  code: string
  provider: string
}

export interface PaymentTransactionEntryAmount {
  amount: number
  currency: string
}

export interface PaymentTransactionEntry {
  id?: string
  createdDate?: string
  type: string
  successful: boolean
  summary?: string
  remoteResponse: string
  amount?: PaymentTransactionEntryAmount
}

export interface PaymentTransaction {
  id?: string
  entries?: PaymentTransactionEntry[]
}
