import axios from 'axios'

export const ID_SORTING_ASCENDING = 'id:ASC'

export interface FieldError {
  field: string
  message: string
}

export interface ErrorResponse {
  type: string
  message: string
  details: FieldError[]
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export { api }
