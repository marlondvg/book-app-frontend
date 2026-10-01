// Mirrors ReadingStatus and BookResponse in book-api.
export const READING_STATUSES = ['TO_READ', 'READING', 'READ', 'ABANDONED'] as const

export type ReadingStatus = (typeof READING_STATUSES)[number]

export const STATUS_LABELS: Record<ReadingStatus, string> = {
  TO_READ: 'To read',
  READING: 'Reading',
  READ: 'Read',
  ABANDONED: 'Abandoned',
}

export function isReadingStatus(value: unknown): value is ReadingStatus {
  return READING_STATUSES.includes(value as ReadingStatus)
}

export type Book = {
  id: string
  title: string
  author: string
  pages: number | null
  isbn: string | null
  coverUrl: string | null
  status: ReadingStatus
  rating: number | null
  /** ISO date (YYYY-MM-DD). */
  startedAt: string | null
  /** ISO date (YYYY-MM-DD). */
  finishedAt: string | null
  /** ISO instant. */
  createdAt: string
}

/** Mirrors BookDetailsRequest: the fields a user edits. Empty optional fields are null. */
export type BookDetails = {
  title: string
  author: string
  pages: number | null
  isbn: string | null
  coverUrl: string | null
}
