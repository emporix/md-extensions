import { api } from './index'
import { Brand } from '../models/Brand'

export const fetchBrands = async (): Promise<Brand[]> => {
  const { data } = await api.get<Brand[]>(`brand/brands`)
  return data
}
