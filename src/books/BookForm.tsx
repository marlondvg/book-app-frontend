import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { TextField } from '../components/TextField.tsx'
import { applyApiError } from '../lib/form-errors.ts'
import type { Book, BookDetails } from './types.ts'
import './BookForm.css'

const MAX_INT = 2_147_483_647

/** Blank input becomes null, which the API stores as "not set". */
const optionalText = (max: number, tooLong: string) =>
  z
    .string()
    .trim()
    .max(max, tooLong)
    .transform((value) => (value === '' ? null : value))

// Mirrors BookDetailsRequest in book-api, plus a URL check the API does not make.
const schema = z.object({
  title: z.string().trim().min(1, 'Enter a title').max(255, 'Title is too long'),
  author: z.string().trim().min(1, 'Enter an author').max(255, 'Author is too long'),
  pages: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), 'Enter a whole number')
    .transform((value) => (value === '' ? null : Number(value)))
    .refine((value) => value === null || value > 0, 'Enter a number above 0')
    .refine((value) => value === null || value <= MAX_INT, 'That is too many pages'),
  isbn: optionalText(20, 'ISBN is too long'),
  coverUrl: optionalText(500, 'Cover URL is too long').refine(
    (value) => value === null || (/^https?:\/\//i.test(value) && URL.canParse(value)),
    'Enter a full http:// or https:// address',
  ),
})

type FormInput = z.input<typeof schema>

const FIELDS = ['title', 'author', 'pages', 'isbn', 'coverUrl'] as const

function toFormInput(book?: Book): FormInput {
  return {
    title: book?.title ?? '',
    author: book?.author ?? '',
    pages: book?.pages?.toString() ?? '',
    isbn: book?.isbn ?? '',
    coverUrl: book?.coverUrl ?? '',
  }
}

type Props = {
  /** The book being edited; omit to create one. */
  book?: Book
  submitLabel: string
  cancelTo: string
  /** Should throw the ApiError on failure, so it can be shown on the form. */
  onSubmit: (details: BookDetails) => Promise<unknown>
}

export function BookForm({ book, submitLabel, cancelTo, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, BookDetails>({
    resolver: zodResolver(schema),
    defaultValues: toFormInput(book),
  })

  const submit = async (details: BookDetails) => {
    try {
      await onSubmit(details)
    } catch (error) {
      applyApiError(error, setError, FIELDS)
    }
  }

  return (
    <form className="book-form" onSubmit={handleSubmit(submit)} noValidate>
      {errors.root?.server && (
        <p role="alert" className="form-error">
          {errors.root.server.message}
        </p>
      )}
      <TextField label="Title" error={errors.title?.message} {...register('title')} />
      <TextField label="Author" error={errors.author?.message} {...register('author')} />
      <div className="book-form-row">
        <TextField
          label="Pages (optional)"
          inputMode="numeric"
          error={errors.pages?.message}
          {...register('pages')}
        />
        <TextField label="ISBN (optional)" error={errors.isbn?.message} {...register('isbn')} />
      </div>
      <TextField
        label="Cover image URL (optional)"
        type="url"
        placeholder="https://…"
        error={errors.coverUrl?.message}
        {...register('coverUrl')}
      />
      <div className="book-form-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
        <Link to={cancelTo}>Cancel</Link>
      </div>
    </form>
  )
}
