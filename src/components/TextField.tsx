import { useId, type ComponentProps } from 'react'
import './TextField.css'

type Props = ComponentProps<'input'> & { label: string; error?: string }

/** Labelled input with its validation message wired up for screen readers. */
export function TextField({ label, error, id, ...inputProps }: Props) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}
