import { Link, useNavigate, useParams } from 'react-router-dom'
import { BookForm } from '../books/BookForm.tsx'
import { useBook, useUpdateBook } from '../books/queries.ts'
import { useReturnTo } from '../books/return-to.ts'
import { ApiError } from '../lib/api-client.ts'
import { describeError } from '../lib/form-errors.ts'

export function EditBookPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const returnTo = useReturnTo()
  const { data: book, error, isPending, refetch, isRefetching } = useBook(id)
  const updateBook = useUpdateBook(id)

  if (isPending) return <p role="status">Loading the book…</p>

  if (error) {
    // The API answers 404 for missing books and for other users' books alike.
    // It answers 400 for an id that is not a UUID.
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      return (
        <>
          <h1>Book not found</h1>
          <p>
            <Link to="/">Back to your books</Link>
          </p>
        </>
      )
    }
    return (
      <div role="alert">
        <p>{describeError(error)}</p>
        <button type="button" onClick={() => refetch()} disabled={isRefetching}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <>
      <h1>Edit “{book.title}”</h1>
      <BookForm
        // Remount when another book is opened, so the form picks up its values.
        key={book.id}
        book={book}
        submitLabel="Save changes"
        cancelTo={returnTo}
        onSubmit={async (details) => {
          await updateBook.mutateAsync(details)
          navigate(returnTo)
        }}
      />
    </>
  )
}
