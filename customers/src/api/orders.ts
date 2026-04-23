/** Shared pagination shape (customer / IAM / coupons modules). */
export interface PaginatedResponse<Type> {
  values: Type[]
  totalRecords: number
}
