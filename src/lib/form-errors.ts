import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from './api-client.ts'

/** Message for errors that are not tied to a form field. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status >= 500) return 'Something went wrong on our side. Please try again.'
    return error.detail ?? error.title
  }
  // fetch rejects with a TypeError when the server cannot be reached.
  return 'Could not reach the server. It may be starting up; try again in a minute.'
}

/**
 * Shows an API error on the form: validation errors on their fields when the field
 * exists in `fields`, everything else as a form-level `root.server` error.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
) {
  const fieldErrors = error instanceof ApiError ? error.fieldErrors : []
  const known = fieldErrors.filter((e) => (fields as readonly string[]).includes(e.field))
  known.forEach((e) => setError(e.field as Path<T>, { type: 'server', message: e.message }))
  if (known.length === 0 || known.length < fieldErrors.length) {
    setError('root.server', { type: 'server', message: describeError(error) })
  }
}
