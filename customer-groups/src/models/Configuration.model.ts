export interface Entry {
  id: string
  label: string
  default: boolean
  required: boolean
}

export type Currency = Entry

export type Language = Entry

export interface Configuration {
  currencies: Currency[]
  languages: Language[]
}
