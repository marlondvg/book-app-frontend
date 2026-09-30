import type { Book } from '../books/types.ts'

/** A `Book` as the API returns it, with only the fields a test cares about set. */
export function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: crypto.randomUUID(),
    title: 'Untitled',
    author: 'Unknown',
    pages: null,
    isbn: null,
    coverUrl: null,
    status: 'TO_READ',
    rating: null,
    startedAt: null,
    finishedAt: null,
    createdAt: '2026-09-01T10:00:00Z',
    ...overrides,
  }
}
