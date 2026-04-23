import { Metadata } from './Metadata'

export interface Supplier {
  metadata: Metadata
  id: string
  name: string
  supplierNo: string
  customerNo: string
  street: string
  zipCode: string
  city: string
  contactPerson1: string
  phone1: string
  email1: string
  orderEmail1: string
  orderChannel: string[]
  orderMethod: string
}
