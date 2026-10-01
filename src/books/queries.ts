import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  changeStatus,
  clearRating,
  createBook,
  deleteBook,
  getBook,
  listBooks,
  rateBook,
  updateBook,
} from './books-api.ts'
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

const listsKey = [...bookKeys.all, 'list'] as const

/**
 * Puts the saved book in the detail cache and in every cached list that holds it, so the
 * change shows at once, then marks lists stale: a new status can move it between filters.
 * Not awaited, so callers can navigate without waiting for the refetch.
 */
function useOnBookSaved() {
  const queryClient = useQueryClient()
  return (book: Book) => {
    queryClient.setQueryData(bookKeys.detail(book.id), book)
    queryClient.setQueriesData<Book[]>({ queryKey: listsKey }, (list) =>
      list?.map((cached) => (cached.id === book.id ? book : cached)),
    )
    void queryClient.invalidateQueries({ queryKey: listsKey })
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

export function useChangeStatus(id: string) {
  const onSaved = useOnBookSaved()
  return useMutation({
    mutationFn: (status: ReadingStatus) => changeStatus(id, status),
    onSuccess: onSaved,
  })
}

/** Sets the rating, or clears it when called with null. */
export function useRateBook(id: string) {
  const onSaved = useOnBookSaved()
  return useMutation({
    mutationFn: (value: number | null) => (value === null ? clearRating(id) : rateBook(id, value)),
    onSuccess: onSaved,
  })
}

export function useDeleteBook(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteBook(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: bookKeys.detail(id) })
      queryClient.setQueriesData<Book[]>({ queryKey: listsKey }, (list) =>
        list?.filter((cached) => cached.id !== id),
      )
      void queryClient.invalidateQueries({ queryKey: listsKey })
    },
  })
}
