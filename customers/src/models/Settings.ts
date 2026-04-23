import { Entry } from './Configuration'

export interface CardItem {
  icon: string
  name: string
  description: string
  to: string
}

export interface PrimeTableItem extends Entry {
  code: string
}

export interface SettingForm {
  code: string
  label: string
}

export interface ConfigSchema {
  key: string
  value: any
}
