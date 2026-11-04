import Localized from './Localized.model'

/** Lean slice of MD `models/Segment` — only what the mixin reference selector reads. */
export interface Segment {
  id: string
  name: Localized
}
