import { useQuery } from '@tanstack/react-query'
import { listBooks } from './books-api.ts'
import type { ReadingStatus } from './types.ts'

export const bookKeys = {
  /** Prefix of every book query; invalidate it after any book change. */
  all: ['books'] as const,
  list: (status: ReadingStatus | null) => ['books', 'list', { status }] as const,
}

export function useBooks(status: ReadingStatus | null) {
  return useQuery({
    queryKey: bookKeys.list(status),
    queryFn: ({ signal }) => listBooks(status, signal),
  })
}
