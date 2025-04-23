import { api } from './index'
import { Label } from '../models/Labels'

export const fetchLabels = async (): Promise<Label[]> => {
  const { data } = await api.get<Label[]>(`label/labels`)
  return data
}
