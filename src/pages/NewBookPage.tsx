import { useNavigate } from 'react-router-dom'
import { BookForm } from '../books/BookForm.tsx'
import { useCreateBook } from '../books/queries.ts'
import { useReturnTo } from '../books/return-to.ts'

export function NewBookPage() {
  const navigate = useNavigate()
  const returnTo = useReturnTo()
  const createBook = useCreateBook()

  return (
    <>
      <h1>Add a book</h1>
      <BookForm
        submitLabel="Add book"
        cancelTo={returnTo}
        onSubmit={async (details) => {
          await createBook.mutateAsync(details)
          navigate(returnTo)
        }}
      />
    </>
  )
}
