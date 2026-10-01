import type { Book, ReadingStatus } from './types.ts'

// Mirrors ReadingStatus.canTransitionTo and Book.changeStatus in book-api, which stay the
// source of truth: the UI only uses these to offer valid choices and warn before data loss.

const TRANSITIONS: Record<ReadingStatus, readonly ReadingStatus[]> = {
  TO_READ: ['READING', 'READ', 'ABANDONED'],
  READING: ['TO_READ', 'READ', 'ABANDONED'],
  READ: ['READING'],
  ABANDONED: ['TO_READ', 'READING'],
}

/** Statuses a book can move to from `status`, not including `status` itself. */
export function allowedTransitions(status: ReadingStatus): readonly ReadingStatus[] {
  return TRANSITIONS[status]
}

export function allowsRating(status: ReadingStatus): boolean {
  return status === 'READ' || status === 'ABANDONED'
}

/** What the API clears when `book` moves to `target`, limited to what the book has set. */
export function lostOnStatusChange(book: Book, target: ReadingStatus): string[] {
  const lost: string[] = []
  if ((target === 'TO_READ' || target === 'READING') && book.rating !== null) lost.push('rating')
  if (target === 'TO_READ' && book.startedAt !== null) lost.push('start date')
  if ((target === 'TO_READ' || target === 'READING') && book.finishedAt !== null) {
    lost.push('finish date')
  }
  return lost
}
