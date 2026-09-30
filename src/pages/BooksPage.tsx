import { useSearchParams } from 'react-router-dom'
import { BookCard } from '../books/BookCard.tsx'
import { useBooks } from '../books/queries.ts'
import { StatusFilter } from '../books/StatusFilter.tsx'
import { STATUS_LABELS, isReadingStatus } from '../books/types.ts'
import { describeError } from '../lib/form-errors.ts'
import './BooksPage.css'

export function BooksPage() {
  const [searchParams] = useSearchParams()
  const statusParam = searchParams.get('status')
  // An unknown ?status= value shows all books instead of an API error.
  const status = isReadingStatus(statusParam) ? statusParam : null
  const { data: books, error, isPending, refetch, isRefetching } = useBooks(status)

  return (
    <>
      <h1>Your books</h1>
      <StatusFilter selected={status} />
      {isPending ? (
        <p role="status">Loading your books…</p>
      ) : error ? (
        <div role="alert">
          <p>{describeError(error)}</p>
          <button type="button" onClick={() => refetch()} disabled={isRefetching}>
            Try again
          </button>
        </div>
      ) : books.length === 0 ? (
        <p>
          {status
            ? `No books marked as “${STATUS_LABELS[status]}”.`
            : 'You have not added any books yet.'}
        </p>
      ) : (
        <ul className="book-list" aria-label="Books">
          {books.map((book) => (
            <li key={book.id}>
              <BookCard book={book} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
