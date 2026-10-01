import { useState } from 'react'
import { Link } from 'react-router-dom'
import { describeError } from '../lib/form-errors.ts'
import { useChangeStatus, useDeleteBook, useRateBook } from './queries.ts'
import { RatingInput } from './RatingInput.tsx'
import type { ReturnToState } from './return-to.ts'
import { allowedTransitions, allowsRating, lostOnStatusChange } from './status-rules.ts'
import { STATUS_LABELS, type Book, type ReadingStatus } from './types.ts'
import './BookCard.css'

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })
// English, like the rest of the UI text: "rating and finish date".
const listFormat = new Intl.ListFormat('en', { type: 'conjunction' })

/** Formats a YYYY-MM-DD date as a local calendar date (new Date(iso) would read it as UTC). */
function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return dateFormat.format(new Date(year, month - 1, day))
}

// Bookcloth colours for books without a cover; the gold initial is legible on each.
const CLOTH_COLORS = ['#2f4f3f', '#6e2a2a', '#1f3550', '#4a3a5c', '#5a4632']

/** Same book, same cloth: picked from the id so it never changes between renders. */
function clothColor(id: string) {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return CLOTH_COLORS[Math.abs(hash) % CLOTH_COLORS.length]
}

type Props = {
  book: Book
  /** The current list URL, so the edit form comes back to the same filter. */
  returnTo: string
}

export function BookCard({ book, returnTo }: Props) {
  const [coverFailed, setCoverFailed] = useState(false)
  const showCover = book.coverUrl && !coverFailed

  const [actionError, setActionError] = useState<string | null>(null)
  const changeStatus = useChangeStatus(book.id)
  const rateBook = useRateBook(book.id)
  const deleteBook = useDeleteBook(book.id)
  const busy = changeStatus.isPending || rateBook.isPending || deleteBook.isPending
  const callbacks = {
    onMutate: () => setActionError(null),
    onError: (error: unknown) => setActionError(describeError(error)),
  }

  const onStatusChange = (target: ReadingStatus) => {
    const lost = lostOnStatusChange(book, target)
    if (
      lost.length > 0 &&
      !window.confirm(
        `Moving “${book.title}” to ${STATUS_LABELS[target]} removes its ${listFormat.format(lost)}. Continue?`,
      )
    ) {
      return
    }
    changeStatus.mutate(target, callbacks)
  }

  const onDelete = () => {
    if (window.confirm(`Delete “${book.title}”? This cannot be undone.`)) {
      deleteBook.mutate(undefined, callbacks)
    }
  }

  return (
    <article className="book-card" aria-busy={busy}>
      <div
        className={showCover ? 'book-cover' : 'book-cover cloth'}
        style={showCover ? undefined : { backgroundColor: clothColor(book.id) }}
        aria-hidden="true"
      >
        {showCover ? (
          <img src={book.coverUrl!} alt="" loading="lazy" onError={() => setCoverFailed(true)} />
        ) : (
          <span className="cloth-initial">{book.title.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="book-info">
        <h2 className="book-title">{book.title}</h2>
        <p className="book-author">{book.author}</p>
        <p className="book-dates">
          {[
            book.pages !== null && `${book.pages} pages`,
            book.startedAt && `Started ${formatDate(book.startedAt)}`,
            book.finishedAt && `Finished ${formatDate(book.finishedAt)}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <div className="book-actions">
          <select
            className={`book-status book-status-${book.status.toLowerCase()}`}
            aria-label={`Status of ${book.title}`}
            value={book.status}
            disabled={busy}
            onChange={(event) => onStatusChange(event.target.value as ReadingStatus)}
          >
            {[book.status, ...allowedTransitions(book.status)].map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          {allowsRating(book.status) && (
            <RatingInput
              title={book.title}
              rating={book.rating}
              disabled={busy}
              onChange={(value) => rateBook.mutate(value, callbacks)}
            />
          )}
          <Link
            to={`/books/${book.id}/edit`}
            state={{ returnTo } satisfies ReturnToState}
            aria-label={`Edit ${book.title}`}
          >
            Edit
          </Link>
          <button
            type="button"
            className="text-button danger"
            aria-label={`Delete ${book.title}`}
            disabled={busy}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
        {actionError && (
          <p role="alert" className="book-action-error">
            {actionError}
          </p>
        )}
      </div>
    </article>
  )
}
