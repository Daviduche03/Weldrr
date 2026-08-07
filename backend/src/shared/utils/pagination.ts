export type PaginationParams = {
  page: number
  limit: number
}

export function offsetForPage(page: number, limit: number): number {
  return (page - 1) * limit
}

export function totalPages(total: number, limit: number): number {
  return Math.max(1, Math.ceil(total / limit))
}