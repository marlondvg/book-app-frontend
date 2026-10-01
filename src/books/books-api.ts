import { apiFetch } from '../lib/api-client.ts'
import { userTimeZone } from '../lib/time-zone.ts'
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

/**
 * 409 when the transition is not allowed (see status-rules.ts). Sends the user's time zone
 * so the API stamps startedAt/finishedAt with the user's date instead of the UTC date;
 * without one (the field is then omitted) the API falls back to UTC.
 * See docs/specs/status-timezone.md.
 */
export function changeStatus(id: string, status: ReadingStatus) {
  return apiFetch<Book>(`/api/books/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    body: { status, timeZone: userTimeZone() },
  })
}

/** `value` is 1 to 5; 409 unless the book is READ or ABANDONED. */
export function rateBook(id: string, value: number) {
  return apiFetch<Book>(`/api/books/${encodeURIComponent(id)}/rating`, {
    method: 'PUT',
    body: { value },
  })
}

export function clearRating(id: string) {
  return apiFetch<Book>(`/api/books/${encodeURIComponent(id)}/rating`, { method: 'DELETE' })
}

export function deleteBook(id: string) {
  return apiFetch<void>(`/api/books/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
