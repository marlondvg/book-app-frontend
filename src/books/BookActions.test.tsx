import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startSession } from '../auth/session.ts'
import { mockBookApi, problem } from '../test/book-api.ts'
import { makeBook } from '../test/books.ts'
import { renderRoute } from '../test/render.tsx'
import { API_URL, server } from '../test/server.ts'

const toRead = makeBook({ title: 'Emma', author: 'Jane Austen' })
const reading = makeBook({ title: 'The Hobbit', status: 'READING', startedAt: '2026-09-01' })
const read = makeBook({
  title: 'Dune',
  status: 'READ',
  rating: 4,
  startedAt: '2026-08-01',
  finishedAt: '2026-08-20',
})

async function card(title: string) {
  const heading = await screen.findByRole('heading', { name: title })
  return within(heading.closest('article')!)
}

beforeEach(() => {
  server.use(
    http.get(`${API_URL}/api/users/me`, () =>
      HttpResponse.json({ id: 'u1', email: 'ann@example.com', createdAt: '2026-09-01T10:00:00Z' }),
    ),
  )
  startSession('token-1', 3600)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('changing the status', () => {
  it('offers only the statuses the API allows', async () => {
    mockBookApi([read])
    renderRoute('/')

    const select = (await card('Dune')).getByRole('combobox', { name: 'Status of Dune' })
    const options = within(select)
      .getAllByRole('option')
      .map((o) => o.textContent)
    expect(options).toEqual(['Read', 'Reading'])
  })

  it('saves the new status without asking when nothing is lost', async () => {
    const confirm = vi.spyOn(window, 'confirm')
    const { received } = mockBookApi([toRead])
    renderRoute('/')

    const emma = await card('Emma')
    await userEvent.setup().selectOptions(emma.getByRole('combobox'), 'READING')

    await waitFor(() => expect(emma.getByRole('combobox')).toHaveValue('READING'))
    expect(received).toEqual([
      {
        method: 'PUT',
        path: `/api/books/${toRead.id}/status`,
        body: { status: 'READING', timeZone: 'America/Bogota' },
      },
    ])
    expect(confirm).not.toHaveBeenCalled()
  })

  it('asks before a change that clears the rating, and does nothing when cancelled', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { received } = mockBookApi([read])
    renderRoute('/')

    const dune = await card('Dune')
    await userEvent.setup().selectOptions(dune.getByRole('combobox'), 'READING')

    expect(confirm).toHaveBeenCalledWith(
      'Moving “Dune” to Reading removes its rating and finish date. Continue?',
    )
    expect(dune.getByRole('combobox')).toHaveValue('READ')
    expect(received).toEqual([])
  })

  it('clears the rating once confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { received } = mockBookApi([read])
    renderRoute('/')

    const dune = await card('Dune')
    await userEvent.setup().selectOptions(dune.getByRole('combobox'), 'READING')

    await waitFor(() => expect(dune.getByRole('combobox')).toHaveValue('READING'))
    expect(dune.queryByRole('group', { name: 'Rating for Dune' })).not.toBeInTheDocument()
    expect(received).toHaveLength(1)
  })

  it('drops the book from a filtered list it no longer matches', async () => {
    mockBookApi([reading, toRead])
    renderRoute('/?status=READING')

    const hobbit = await card('The Hobbit')
    await userEvent.setup().selectOptions(hobbit.getByRole('combobox'), 'READ')

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'The Hobbit' })).not.toBeInTheDocument(),
    )
    expect(screen.getByText('No books marked as “Reading”.')).toBeInTheDocument()
  })

  it('shows the API error on the book', async () => {
    mockBookApi([toRead])
    server.use(
      http.put(`${API_URL}/api/books/:id/status`, () =>
        problem(409, 'Cannot change status from TO_READ to READING'),
      ),
    )
    renderRoute('/')

    const emma = await card('Emma')
    await userEvent.setup().selectOptions(emma.getByRole('combobox'), 'READING')

    expect(await emma.findByRole('alert')).toHaveTextContent(
      'Cannot change status from TO_READ to READING',
    )
    expect(emma.getByRole('combobox')).toHaveValue('TO_READ')
  })
})

describe('rating', () => {
  it('is only offered for finished or abandoned books', async () => {
    mockBookApi([toRead, read])
    renderRoute('/')

    expect((await card('Emma')).queryByRole('group')).not.toBeInTheDocument()
    expect((await card('Dune')).getByRole('group', { name: 'Rating for Dune' })).toBeInTheDocument()
  })

  it('sets and clears the rating', async () => {
    const { received } = mockBookApi([read])
    renderRoute('/')
    const u = userEvent.setup()

    const dune = await card('Dune')
    await u.click(dune.getByRole('button', { name: 'Rate 2 out of 5' }))

    await waitFor(() =>
      expect(dune.getByRole('button', { name: 'Rate 2 out of 5' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    )

    await u.click(dune.getByRole('button', { name: 'Clear' }))

    await waitFor(() =>
      expect(dune.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument(),
    )
    expect(received).toEqual([
      { method: 'PUT', path: `/api/books/${read.id}/rating`, body: { value: 2 } },
      { method: 'DELETE', path: `/api/books/${read.id}/rating`, body: null },
    ])
  })
})

describe('deleting', () => {
  it('does nothing when not confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { received } = mockBookApi([toRead])
    renderRoute('/')

    await userEvent.setup().click((await card('Emma')).getByRole('button', { name: 'Delete Emma' }))

    expect(window.confirm).toHaveBeenCalledWith('Delete “Emma”? This cannot be undone.')
    expect(screen.getByRole('heading', { name: 'Emma' })).toBeInTheDocument()
    expect(received).toEqual([])
  })

  it('removes the book once confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { received } = mockBookApi([toRead, read])
    renderRoute('/')

    await userEvent.setup().click((await card('Emma')).getByRole('button', { name: 'Delete Emma' }))

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Emma' })).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('heading', { name: 'Dune' })).toBeInTheDocument()
    expect(received).toEqual([
      { method: 'DELETE', path: `/api/books/${toRead.id}`, body: null },
    ])
  })

  it('keeps the book and shows the error when deleting fails', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockBookApi([toRead])
    server.use(
      http.delete(`${API_URL}/api/books/:id`, () => new HttpResponse(null, { status: 500 })),
    )
    renderRoute('/')

    const emma = await card('Emma')
    await userEvent.setup().click(emma.getByRole('button', { name: 'Delete Emma' }))

    expect(await emma.findByRole('alert')).toHaveTextContent('Something went wrong on our side')
    expect(screen.getByRole('heading', { name: 'Emma' })).toBeInTheDocument()
  })
})
