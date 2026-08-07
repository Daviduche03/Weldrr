export type ApiResponse<T> = {
  status: 'success'
  data: T
}

export type ApiMessageResponse = {
  status: 'success'
  message: string
}

export type ApiListResponse<T> = ApiResponse<T[]>

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type PaginatedApiResponse<T> = ApiResponse<T[]> & { meta: PaginationMeta }

export type ApiErrorResponse = {
  status: 'error'
  message: string
  issues?: unknown
}