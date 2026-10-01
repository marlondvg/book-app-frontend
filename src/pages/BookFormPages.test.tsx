import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { startSession } from '../auth/session.ts'
import { mockBookApi, problem } from '../test/book-api.ts'
import { makeBook } from '../test/books.ts'
import { renderRoute } from '../test/render.tsx'
import { API_URL, server } from '../test/server.ts'

beforeEach(() => {
  server.use(
    http.get(`${API_URL}/api/users/me`, () =>
      HttpResponse.json({ id: 'u1', email: 'ann@example.com', createdAt: '2026-09-01T10:00:00Z' }),
    ),
  )
  startSession('token-1', 3600)
})

describe('add a book', () => {
  it('creates the book from the list and goes back to the same filter', async () => {
    const { received } = mockBookApi()
    const { router } = renderRoute('/?status=TO_READ')
    const u = userEvent.setup()

    await u.click(await screen.findByRole('link', { name: 'Add a book' }))
    await u.type(screen.getByLabelText('Title'), '  Dune ')
    await u.type(screen.getByLabelText('Author'), 'Frank Herbert')
    await u.type(screen.getByLabelText('Pages (optional)'), '412')
    await u.click(screen.getByRole('button', { name: 'Add book' }))

    expect(await screen.findByRole('heading', { name: 'Dune' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?status=TO_READ')
    expect(received).toEqual([
      {
        method: 'POST',
        path: '/api/books',
        body: { title: 'Dune', author: 'Frank Herbert', pages: 412, isbn: null, coverUrl: null },
      },
    ])
  })

  it('validates the fields before calling the API', async () => {
    const { received } = mockBookApi()
    renderRoute('/books/new')
    const u = userEvent.setup()

    await u.type(screen.getByLabelText('Title'), '   ')
    await u.type(screen.getByLabelText('Pages (optional)'), '12.5')
    await u.type(screen.getByLabelText('Cover image URL (optional)'), 'javascript:alert(1)')
    await u.click(screen.getByRole('button', { name: 'Add book' }))

    expect(await screen.findByText('Enter a title')).toBeInTheDocument()
    expect(screen.getByText('Enter an author')).toBeInTheDocument()
    expect(screen.getByText('Enter a whole number')).toBeInTheDocument()
    expect(screen.getByText('Enter a full http:// or https:// address')).toBeInTheDocument()
    expect(received).toEqual([])
  })

  it('rejects zero pages and values too long for the API', async () => {
    mockBookApi()
    renderRoute('/books/new')
    const u = userEvent.setup()

    await u.type(screen.getByLabelText('Title'), 'x'.repeat(256))
    await u.type(screen.getByLabelText('Author'), 'Someone')
    await u.type(screen.getByLabelText('Pages (optional)'), '0')
    await u.type(screen.getByLabelText('ISBN (optional)'), '1'.repeat(21))
    await u.click(screen.getByRole('button', { name: 'Add book' }))

    expect(await screen.findByText('Title is too long')).toBeInTheDocument()
    expect(screen.getByText('Enter a number above 0')).toBeInTheDocument()
    expect(screen.getByText('ISBN is too long')).toBeInTheDocument()
  })

  it('shows API validation errors on their fields', async () => {
    server.use(
      http.post(`${API_URL}/api/books`, () =>
        problem(400, 'Request validation failed', {
          errors: [{ field: 'isbn', message: 'size must be between 0 and 20' }],
        }),
      ),
    )
    renderRoute('/books/new')
    const u = userEvent.setup()

    await u.type(screen.getByLabelText('Title'), 'Dune')
    await u.type(screen.getByLabelText('Author'), 'Frank Herbert')
    await u.click(screen.getByRole('button', { name: 'Add book' }))

    expect(await screen.findByText('size must be between 0 and 20')).toBeInTheDocument()
    expect(screen.getByLabelText('ISBN (optional)')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows a form error when the API fails', async () => {
    server.use(http.post(`${API_URL}/api/books`, () => new HttpResponse(null, { status: 500 })))
    renderRoute('/books/new')
    const u = userEvent.setup()

    await u.type(screen.getByLabelText('Title'), 'Dune')
    await u.type(screen.getByLabelText('Author'), 'Frank Herbert')
    await u.click(screen.getByRole('button', { name: 'Add book' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on our side')
    expect(screen.getByRole('heading', { name: 'Add a book' })).toBeInTheDocument()
  })

  it('cancels back to the book list', async () => {
    mockBookApi()
    renderRoute('/books/new')

    await userEvent.setup().click(screen.getByRole('link', { name: 'Cancel' }))

    expect(await screen.findByRole('heading', { name: 'Your books' })).toBeInTheDocument()
  })
})

describe('edit a book', () => {
  const dune = makeBook({
    title: 'Dune',
    author: 'Frank Herbert',
    pages: 412,
    isbn: '9780441013593',
    coverUrl: 'https://covers.test/dune.jpg',
  })

  it('opens from the list with the current values and saves the changes', async () => {
    const { received } = mockBookApi([dune])
    renderRoute('/')
    const u = userEvent.setup()

    const card = within((await screen.findByRole('heading', { name: 'Dune' })).closest('article')!)
    await u.click(card.getByRole('link', { name: 'Edit Dune' }))

    expect(await screen.findByLabelText('Title')).toHaveValue('Dune')
    expect(screen.getByLabelText('Author')).toHaveValue('Frank Herbert')
    expect(screen.getByLabelText('Pages (optional)')).toHaveValue('412')
    expect(screen.getByLabelText('ISBN (optional)')).toHaveValue('9780441013593')
    expect(screen.getByLabelText('Cover image URL (optional)')).toHaveValue(
      'https://covers.test/dune.jpg',
    )

    await u.clear(screen.getByLabelText('Title'))
    await u.type(screen.getByLabelText('Title'), 'Dune Messiah')
    await u.clear(screen.getByLabelText('ISBN (optional)'))
    await u.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('heading', { name: 'Dune Messiah' })).toBeInTheDocument()
    expect(received).toEqual([
      {
        method: 'PUT',
        path: `/api/books/${dune.id}`,
        body: {
          title: 'Dune Messiah',
          author: 'Frank Herbert',
          pages: 412,
          isbn: null,
          coverUrl: 'https://covers.test/dune.jpg',
        },
      },
    ])
  })

  it('goes to the book list after saving when opened directly', async () => {
    mockBookApi([dune])
    const { router } = renderRoute(`/books/${dune.id}/edit`)

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('says when the book does not exist', async () => {
    mockBookApi([])
    renderRoute(`/books/${crypto.randomUUID()}/edit`)

    expect(await screen.findByRole('heading', { name: 'Book not found' })).toBeInTheDocument()
  })
})
