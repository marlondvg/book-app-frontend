import { apiFetch } from '../lib/api-client.ts'
import type { Book, BookDetails, ReadingStatus } from './types.ts'

/** The caller's books, newest first; all of them when `status` is null. */
export function listBooks(status: ReadingStatus | null, signal?: AbortSignal) {
  const query = status ? `?status=${status}` : ''
  return apiFetch<Book[]>(`/api/books${query}`, { signal })
}

/** 404 when the book does not exist or belongs to someone else. */
export function getBook(id: string, signal?: AbortSignal) {
  return apiFetch<Book>(`/api/books/${encodeURIComponent(id)}`, { signal })
}

export function createBook(details: BookDetails) {
  return apiFetch<Book>('/api/books', { method: 'POST', body: details })
}

/** Replaces all details: a null optional field clears it. */
export function updateBook(id: string, details: BookDetails) {
  return apiFetch<Book>(`/api/books/${encodeURIComponent(id)}`, { method: 'PUT', body: details })
}
