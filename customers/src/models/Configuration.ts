import { DisplayMixin } from './DisplayMixin.ts'
import { ColumnVisibility } from '../components/shared/TableExtensions'

export interface Entry {
  id: string
  label: string
  default: boolean
  required: boolean
}

export type Currency = Entry

export type Language = Entry

export interface ExtendedOrderStatus {
  displayText: string
  key: string
  possibleTransitions?: string[]
  id: string
}

export interface TableConfiguration {
  key: string
  columns: ColumnVisibility[]
  mixins: DisplayMixin[]
}

export interface Configuration {
  currencies: Currency[]
  languages: Language[]
  tableConfigurations: TableConfiguration[]
}
