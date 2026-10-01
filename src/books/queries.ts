import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createBook, getBook, listBooks, updateBook } from './books-api.ts'
import type { Book, BookDetails, ReadingStatus } from './types.ts'

export const bookKeys = {
  /** Prefix of every book query; invalidate it after any book change. */
  all: ['books'] as const,
  list: (status: ReadingStatus | null) => ['books', 'list', { status }] as const,
  detail: (id: string) => ['books', 'detail', id] as const,
}

export function useBooks(status: ReadingStatus | null) {
  return useQuery({
    queryKey: bookKeys.list(status),
    queryFn: ({ signal }) => listBooks(status, signal),
  })
}

export function useBook(id: string) {
  return useQuery({
    queryKey: bookKeys.detail(id),
    queryFn: ({ signal }) => getBook(id, signal),
  })
}

/**
 * Stores the saved book and marks every list stale, since any of them may include it.
 * Not awaited: the list refetches when the page showing it mounts.
 */
function useOnBookSaved() {
  const queryClient = useQueryClient()
  return (book: Book) => {
    queryClient.setQueryData(bookKeys.detail(book.id), book)
    void queryClient.invalidateQueries({ queryKey: [...bookKeys.all, 'list'] })
  }
}

export function useCreateBook() {
  const onSaved = useOnBookSaved()
  return useMutation({ mutationFn: createBook, onSuccess: onSaved })
}

export function useUpdateBook(id: string) {
  const onSaved = useOnBookSaved()
  return useMutation({
    mutationFn: (details: BookDetails) => updateBook(id, details),
    onSuccess: onSaved,
  })
}
