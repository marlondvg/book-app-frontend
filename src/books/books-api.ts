import { apiFetch } from '../lib/api-client.ts'
import type { Book, ReadingStatus } from './types.ts'

/** The caller's books, newest first; all of them when `status` is null. */
export function listBooks(status: ReadingStatus | null, signal?: AbortSignal) {
  const query = status ? `?status=${status}` : ''
  return apiFetch<Book[]>(`/api/books${query}`, { signal })
}
