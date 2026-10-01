import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ReturnToState } from './return-to.ts'
import { STATUS_LABELS, type Book } from './types.ts'
import './BookCard.css'

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

/** Formats a YYYY-MM-DD date as a local calendar date (new Date(iso) would read it as UTC). */
function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return dateFormat.format(new Date(year, month - 1, day))
}

type Props = {
  book: Book
  /** The current list URL, so the edit form comes back to the same filter. */
  returnTo: string
}

export function BookCard({ book, returnTo }: Props) {
  const [coverFailed, setCoverFailed] = useState(false)
  const showCover = book.coverUrl && !coverFailed

  return (
    <article className="book-card">
      <div className="book-cover" aria-hidden="true">
        {showCover ? (
          <img src={book.coverUrl!} alt="" loading="lazy" onError={() => setCoverFailed(true)} />
        ) : (
          <span>{book.title.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="book-info">
        <h2 className="book-title">{book.title}</h2>
        <p className="book-author">{book.author}</p>
        <p className="book-meta">
          <span className={`book-status book-status-${book.status.toLowerCase()}`}>
            {STATUS_LABELS[book.status]}
          </span>
          {book.rating !== null && (
            <span className="book-rating" role="img" aria-label={`Rated ${book.rating} out of 5`}>
              {'★'.repeat(book.rating)}
              {'☆'.repeat(5 - book.rating)}
            </span>
          )}
        </p>
        <p className="book-dates">
          {[
            book.pages !== null && `${book.pages} pages`,
            book.startedAt && `Started ${formatDate(book.startedAt)}`,
            book.finishedAt && `Finished ${formatDate(book.finishedAt)}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      <Link
        className="book-edit"
        to={`/books/${book.id}/edit`}
        state={{ returnTo } satisfies ReturnToState}
        aria-label={`Edit ${book.title}`}
      >
        Edit
      </Link>
    </article>
  )
}
