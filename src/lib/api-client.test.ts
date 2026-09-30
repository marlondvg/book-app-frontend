import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_URL, server } from '../test/server.ts'
import { ApiError, apiFetch, configureAuth } from './api-client.ts'

function withToken(token: string | null, onUnauthorized = () => {}) {
  configureAuth({ getToken: () => token, onUnauthorized })
}

describe('apiFetch', () => {
  afterEach(() => withToken(null))

  it('returns the parsed JSON body', async () => {
    server.use(http.get(`${API_URL}/api/books`, () => HttpResponse.json([{ id: '1' }])))

    await expect(apiFetch('/api/books')).resolves.toEqual([{ id: '1' }])
  })

  it('sends the JSON body and the bearer token when there is one', async () => {
    withToken('abc')
    let received: { auth: string | null; type: string | null; body: unknown } | undefined
    server.use(
      http.post(`${API_URL}/api/books`, async ({ request }) => {
        received = {
          auth: request.headers.get('Authorization'),
          type: request.headers.get('Content-Type'),
          body: await request.json(),
        }
        return HttpResponse.json({ id: '1' }, { status: 201 })
      }),
    )

    await apiFetch('/api/books', { method: 'POST', body: { title: 'Dune' } })

    expect(received).toEqual({
      auth: 'Bearer abc',
      type: 'application/json',
      body: { title: 'Dune' },
    })
  })

  it('omits the Authorization header without a token', async () => {
    let auth: string | null = 'unset'
    server.use(
      http.get(`${API_URL}/api/books`, ({ request }) => {
        auth = request.headers.get('Authorization')
        return HttpResponse.json([])
      }),
    )

    await apiFetch('/api/books')

    expect(auth).toBeNull()
  })

  it('returns undefined for 204 responses', async () => {
    server.use(http.delete(`${API_URL}/api/books/1`, () => new HttpResponse(null, { status: 204 })))

    await expect(apiFetch('/api/books/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('throws an ApiError built from problem details', async () => {
    server.use(
      http.post(`${API_URL}/api/books`, () =>
        HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Bad Request',
            status: 400,
            detail: 'Validation failed',
            errors: [{ field: 'title', message: 'must not be blank' }],
          },
          { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    const error = await apiFetch('/api/books', { method: 'POST', body: {} }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 400,
      title: 'Bad Request',
      detail: 'Validation failed',
      message: 'Validation failed',
      fieldErrors: [{ field: 'title', message: 'must not be blank' }],
    })
  })

  it('throws an ApiError when the error body is not JSON', async () => {
    server.use(
      http.get(`${API_URL}/api/books`, () => new HttpResponse('upstream down', { status: 502 })),
    )

    const error = await apiFetch('/api/books').catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 502, fieldErrors: [] })
  })

  it('reports a 401 on a request sent with a token', async () => {
    const onUnauthorized = vi.fn()
    withToken('expired', onUnauthorized)
    server.use(http.get(`${API_URL}/api/books`, () => new HttpResponse(null, { status: 401 })))

    await expect(apiFetch('/api/books')).rejects.toMatchObject({ status: 401 })
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('does not report a 401 on a request sent without a token', async () => {
    const onUnauthorized = vi.fn()
    withToken(null, onUnauthorized)
    server.use(
      http.post(`${API_URL}/api/auth/login`, () => new HttpResponse(null, { status: 401 })),
    )

    await expect(apiFetch('/api/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 401,
    })
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
