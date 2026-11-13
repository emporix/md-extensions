import { Entry } from './Configuration.model'

export interface ConfigSchema {
  key: string
  value: unknown
  version?: number
}

export type PrimeTableItem = Entry & {
  code: string
}
