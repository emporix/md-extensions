import Localized from './Localized.model'

/** Lean slice of MD `models/CustomInstance` — only what the mixin reference selector reads. */
export interface CustomInstance {
  id: string
  name: Localized
}
