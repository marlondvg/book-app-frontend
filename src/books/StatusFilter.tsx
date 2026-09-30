import { Link } from 'react-router-dom'
import { READING_STATUSES, STATUS_LABELS, type ReadingStatus } from './types.ts'
import './StatusFilter.css'

type Props = { selected: ReadingStatus | null }

const options: { status: ReadingStatus | null; label: string }[] = [
  { status: null, label: 'All' },
  ...READING_STATUSES.map((status) => ({ status, label: STATUS_LABELS[status] })),
]

/** Links rather than buttons, so each filter has its own URL and works with Back. */
export function StatusFilter({ selected }: Props) {
  return (
    <nav aria-label="Filter by status" className="status-filter">
      {options.map(({ status, label }) => (
        <Link
          key={label}
          to={status ? `/?status=${status}` : '/'}
          aria-current={status === selected ? 'page' : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
