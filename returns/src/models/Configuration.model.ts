import type { DisplayMixin } from './DisplayMixin'

export interface Entry {
  id: string
  label: string
  default: boolean
  required: boolean
}

export type Currency = Entry

export type Language = Entry

/** One column's persisted visibility, as stored by management-dashboard. */
export interface ColumnVisibility {
  key: string
  label: string
  visible: boolean
}

/**
 * Per-table configuration persisted under a configuration key
 * (Brands uses `ext_brands`). Shape must stay compatible with
 * management-dashboard so preferences saved there keep working.
 */
export interface TableConfiguration {
  key: string
  columns: ColumnVisibility[]
  /** Mixins surfaced as extra table columns. */
  mixins?: DisplayMixin[]
}

export interface TableConfig {
  table: {
    columns: ColumnVisibility[]
    mixins?: DisplayMixin[]
  }
}

export interface Configuration {
  currencies: Currency[]
  languages: Language[]
  tableConfigurations?: TableConfiguration[]
}
