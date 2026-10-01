import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { startSession } from '../auth/session.ts'
import type { Book } from '../books/types.ts'
import { makeBook as book } from '../test/books.ts'
import { renderRoute } from '../test/render.tsx'
import { API_URL, server } from '../test/server.ts'

const dune = book({
  title: 'Dune',
  author: 'Frank Herbert',
  pages: 412,
  status: 'READ',
  rating: 4,
  startedAt: '2026-08-01',
  finishedAt: '2026-08-20',
})
const hobbit = book({ title: 'The Hobbit', author: 'J. R. R. Tolkien', status: 'READING' })

/** Serves `books`, filtered by ?status= like the API, and records the status of each request. */
function mockBooks(books: Book[]) {
  const requested: (string | null)[] = []
  server.use(
    http.get(`${API_URL}/api/books`, ({ request }) => {
      const status = new URL(request.url).searchParams.get('status')
      requested.push(status)
      return HttpResponse.json(status ? books.filter((b) => b.status === status) : books)
    }),
  )
  return requested
}

beforeEach(() => {
  server.use(
    http.get(`${API_URL}/api/users/me`, () =>
      HttpResponse.json({ id: 'u1', email: 'ann@example.com', createdAt: '2026-09-01T10:00:00Z' }),
    ),
  )
  startSession('token-1', 3600)
})

describe('books page', () => {
  it('lists the books with their details', async () => {
    mockBooks([dune, hobbit])
    renderRoute('/')

    const items = within(await screen.findByRole('list', { name: 'Books' })).getAllByRole(
      'listitem',
    )
    expect(items).toHaveLength(2)

    const first = within(items[0])
    expect(first.getByRole('heading', { name: 'Dune' })).toBeInTheDocument()
    expect(first.getByText('Frank Herbert')).toBeInTheDocument()
    expect(first.getByRole('combobox', { name: 'Status of Dune' })).toHaveValue('READ')
    expect(first.getByRole('button', { name: 'Rate 4 out of 5' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(first.getByText(/412 pages · Started .*2026 · Finished .*2026/)).toBeInTheDocument()

    const second = within(items[1])
    expect(second.getByRole('heading', { name: 'The Hobbit' })).toBeInTheDocument()
    expect(second.getByRole('combobox', { name: 'Status of The Hobbit' })).toHaveValue('READING')
    expect(second.queryByRole('group', { name: /Rating/ })).not.toBeInTheDocument()
  })

  it('shows API dates as the same calendar day west of UTC', async () => {
    // Guards the test itself: in this zone, reading the date as UTC lands on Sept 29.
    expect(new Date('2026-09-30').getDate()).toBe(29)
    mockBooks([
      book({ title: 'Emma', status: 'READ', startedAt: '2026-09-30', finishedAt: '2026-10-01' }),
    ])
    renderRoute('/')

    expect(
      await screen.findByText('Started Sep 30, 2026 · Finished Oct 1, 2026'),
    ).toBeInTheDocument()
  })

  it('shows a loading message while the books load', async () => {
    mockBooks([dune])
    renderRoute('/')

    expect(screen.getByRole('status')).toHaveTextContent('Loading your books…')
    expect(await screen.findByRole('heading', { name: 'Dune' })).toBeInTheDocument()
  })

  it('filters by status through the URL', async () => {
    const requested = mockBooks([dune, hobbit])
    renderRoute('/')
    await screen.findByRole('heading', { name: 'Dune' })

    await userEvent.setup().click(screen.getByRole('link', { name: 'Reading' }))

    expect(await screen.findByRole('link', { name: 'Reading' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await screen.findByRole('heading', { name: 'The Hobbit' })
    expect(screen.queryByRole('heading', { name: 'Dune' })).not.toBeInTheDocument()
    expect(requested).toEqual([null, 'READING'])
  })

  it('opens directly on a filter from the URL', async () => {
    const requested = mockBooks([dune, hobbit])
    renderRoute('/?status=READ')

    expect(await screen.findByRole('heading', { name: 'Dune' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Read' })).toHaveAttribute('aria-current', 'page')
    expect(requested).toEqual(['READ'])
  })

  it('ignores an unknown status in the URL', async () => {
    const requested = mockBooks([dune])
    renderRoute('/?status=BOGUS')

    await screen.findByRole('heading', { name: 'Dune' })
    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('aria-current', 'page')
    expect(requested).toEqual([null])
  })

  it('says when there are no books yet', async () => {
    mockBooks([])
    renderRoute('/')

    expect(await screen.findByText('You have not added any books yet.')).toBeInTheDocument()
  })

  it('says when no books match the filter', async () => {
    mockBooks([dune])
    renderRoute('/?status=ABANDONED')

    expect(await screen.findByText('No books marked as “Abandoned”.')).toBeInTheDocument()
  })

  it('shows an error and retries on request', async () => {
    let fail = true
    server.use(
      http.get(`${API_URL}/api/books`, () =>
        fail ? new HttpResponse(null, { status: 500 }) : HttpResponse.json([dune]),
      ),
    )
    renderRoute('/')

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on our side')

    fail = false
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { name: 'Dune' })).toBeInTheDocument()
  })

  it('shows the cover image, or the first letter when there is none or it fails to load', async () => {
    mockBooks([book({ title: 'Emma', coverUrl: 'https://covers.test/emma.jpg' }), hobbit])
    const { container } = renderRoute('/')
    await screen.findByRole('heading', { name: 'Emma' })

    const img = container.querySelector('img')!
    expect(img).toHaveAttribute('src', 'https://covers.test/emma.jpg')
    expect(container.querySelectorAll('.book-cover span')).toHaveLength(1)

    img.dispatchEvent(new Event('error'))

    expect(await screen.findByText('E')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })
})
