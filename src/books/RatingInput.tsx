import './RatingInput.css'

type Props = {
  title: string
  rating: number | null
  disabled: boolean
  /** Called with 1 to 5, or null to clear the rating. */
  onChange: (value: number | null) => void
}

const VALUES = [1, 2, 3, 4, 5]

export function RatingInput({ title, rating, disabled, onChange }: Props) {
  return (
    <div className="rating-input" role="group" aria-label={`Rating for ${title}`}>
      {VALUES.map((value) => (
        <button
          key={value}
          type="button"
          className={rating !== null && value <= rating ? 'star filled' : 'star'}
          aria-label={`Rate ${value} out of 5`}
          aria-pressed={value === rating}
          disabled={disabled}
          onClick={() => onChange(value)}
        >
          {rating !== null && value <= rating ? '★' : '☆'}
        </button>
      ))}
      {rating !== null && (
        <button
          type="button"
          className="rating-clear"
          disabled={disabled}
          onClick={() => onChange(null)}
        >
          Clear
        </button>
      )}
    </div>
  )
}
