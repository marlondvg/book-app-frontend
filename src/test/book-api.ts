import { HttpResponse, http } from 'msw'
import type { Book, ReadingStatus } from '../books/types.ts'
import { makeBook } from './books.ts'
import { API_URL, server } from './server.ts'

export function problem(status: number, detail: string, extra: object = {}) {
  return HttpResponse.json(
    { title: 'Error', status, detail, ...extra },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )
}

export type ReceivedRequest = { method: string; path: string; body: unknown }

/**
 * In-memory stand-in for the /api/books endpoints. It applies the status side effects that
 * matter to the UI (clearing the rating), but not the transition rules: tests that need a
 * 409 override the handler. Returns the books array (live) and every write request received.
 */
export function mockBookApi(initial: Book[] = []) {
  const books = [...initial]
  const received: ReceivedRequest[] = []
  const find = (id: unknown) => books.findIndex((b) => b.id === id)
  const record = async (request: Request, body?: unknown) => {
    received.push({
      method: request.method,
      path: new URL(request.url).pathname,
      body: body === undefined ? await request.json().catch(() => undefined) : body,
    })
  }
  const notFound = () => problem(404, 'Book not found')

  server.use(
    http.get(`${API_URL}/api/books`, ({ request }) => {
      const status = new URL(request.url).searchParams.get('status')
      return HttpResponse.json(status ? books.filter((b) => b.status === status) : books)
    }),
    http.get(`${API_URL}/api/books/:id`, ({ params }) => {
      const i = find(params.id)
      return i === -1 ? notFound() : HttpResponse.json(books[i])
    }),
    http.post(`${API_URL}/api/books`, async ({ request }) => {
      const body = (await request.json()) as Partial<Book>
      await record(request, body)
      const book = makeBook(body)
      books.unshift(book)
      return HttpResponse.json(book, { status: 201 })
    }),
    http.put(`${API_URL}/api/books/:id`, async ({ params, request }) => {
      const body = (await request.json()) as Partial<Book>
      await record(request, body)
      const i = find(params.id)
      if (i === -1) return notFound()
      books[i] = { ...books[i], ...body }
      return HttpResponse.json(books[i])
    }),
    http.put(`${API_URL}/api/books/:id/status`, async ({ params, request }) => {
      const body = (await request.json()) as { status: ReadingStatus }
      await record(request, body)
      const i = find(params.id)
      if (i === -1) return notFound()
      const clearsRating = body.status === 'TO_READ' || body.status === 'READING'
      books[i] = { ...books[i], status: body.status, rating: clearsRating ? null : books[i].rating }
      return HttpResponse.json(books[i])
    }),
    http.put(`${API_URL}/api/books/:id/rating`, async ({ params, request }) => {
      const body = (await request.json()) as { value: number }
      await record(request, body)
      const i = find(params.id)
      if (i === -1) return notFound()
      books[i] = { ...books[i], rating: body.value }
      return HttpResponse.json(books[i])
    }),
    http.delete(`${API_URL}/api/books/:id/rating`, async ({ params, request }) => {
      await record(request, null)
      const i = find(params.id)
      if (i === -1) return notFound()
      books[i] = { ...books[i], rating: null }
      return HttpResponse.json(books[i])
    }),
    http.delete(`${API_URL}/api/books/:id`, async ({ params, request }) => {
      await record(request, null)
      const i = find(params.id)
      if (i === -1) return notFound()
      books.splice(i, 1)
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return { books, received }
}
