import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { userTimeZone } from '../lib/time-zone.ts'
import { makeBook } from '../test/books.ts'
import { API_URL, server } from '../test/server.ts'
import { changeStatus } from './books-api.ts'

vi.mock('../lib/time-zone.ts', () => ({ userTimeZone: vi.fn() }))

/** Captures the body of the next status change. */
function captureStatusBody() {
  const captured: { body?: unknown } = {}
  server.use(
    http.put(`${API_URL}/api/books/:id/status`, async ({ request }) => {
      captured.body = await request.json()
      return HttpResponse.json(makeBook({ status: 'READING' }))
    }),
  )
  return captured
}

describe('changeStatus', () => {
  afterEach(() => {
    vi.mocked(userTimeZone).mockReset()
  })

  it("sends the user's time zone so dates are stamped in the user's day", async () => {
    vi.mocked(userTimeZone).mockReturnValue('America/Bogota')
    const captured = captureStatusBody()

    await changeStatus('b1', 'READING')

    expect(captured.body).toEqual({ status: 'READING', timeZone: 'America/Bogota' })
  })

  it('leaves the time zone out when the browser does not report one', async () => {
    vi.mocked(userTimeZone).mockReturnValue(undefined)
    const captured = captureStatusBody()

    await changeStatus('b1', 'READING')

    expect(captured.body).toEqual({ status: 'READING' })
  })

  it('reads the zone on every request, so a user who travels gets the current one', async () => {
    const captured = captureStatusBody()

    vi.mocked(userTimeZone).mockReturnValue('America/Bogota')
    await changeStatus('b1', 'READING')
    expect(captured.body).toMatchObject({ timeZone: 'America/Bogota' })

    vi.mocked(userTimeZone).mockReturnValue('Asia/Tokyo')
    await changeStatus('b1', 'READ')
    expect(captured.body).toEqual({ status: 'READ', timeZone: 'Asia/Tokyo' })
  })
})
