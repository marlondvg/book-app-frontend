import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '../test/render.tsx'
import { API_URL, server } from '../test/server.ts'
import { getSession, startSession } from './session.ts'

const user = { id: 'u1', email: 'ann@example.com', createdAt: '2026-09-30T10:00:00Z' }

function problem(status: number, title: string, detail: string, extra: object = {}) {
  return HttpResponse.json(
    { type: 'about:blank', title, status, detail, ...extra },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )
}

function mockCurrentUser() {
  server.use(
    http.get(`${API_URL}/api/users/me`, ({ request }) =>
      request.headers.get('Authorization') === 'Bearer token-1'
        ? HttpResponse.json(user)
        : problem(401, 'Unauthorized', 'Authentication is required'),
    ),
  )
}

function mockLogin() {
  server.use(
    http.post(`${API_URL}/api/auth/login`, () =>
      HttpResponse.json({ accessToken: 'token-1', tokenType: 'Bearer', expiresIn: 3600 }),
    ),
  )
}

async function fillLogin(email: string, password: string) {
  const u = userEvent.setup()
  await u.type(screen.getByLabelText('Email'), email)
  await u.type(screen.getByLabelText('Password'), password)
  await u.click(screen.getByRole('button', { name: 'Log in' }))
}

async function fillRegister(email: string, password: string, confirm = password) {
  const u = userEvent.setup()
  await u.type(screen.getByLabelText('Email'), email)
  await u.type(screen.getByLabelText('Password'), password)
  await u.type(screen.getByLabelText('Confirm password'), confirm)
  await u.click(screen.getByRole('button', { name: 'Create account' }))
}

describe('login', () => {
  it('sends logged-out users to the login page', () => {
    renderRoute('/')

    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
  })

  it('logs in, stores the token and shows the home page with the user email', async () => {
    mockLogin()
    mockCurrentUser()
    renderRoute('/')

    await fillLogin('ann@example.com', 'correct horse battery')

    expect(await screen.findByRole('heading', { name: 'Your books' })).toBeInTheDocument()
    expect(await screen.findByText('ann@example.com')).toBeInTheDocument()
    expect(getSession()?.accessToken).toBe('token-1')
  })

  it('shows the API message for wrong credentials', async () => {
    server.use(
      http.post(`${API_URL}/api/auth/login`, () =>
        problem(401, 'Unauthorized', 'Invalid email or password'),
      ),
    )
    renderRoute('/login')

    await fillLogin('ann@example.com', 'wrong password')

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
    expect(getSession()).toBeNull()
  })

  it('explains the rate limit', async () => {
    server.use(
      http.post(`${API_URL}/api/auth/login`, () =>
        problem(429, 'Too Many Requests', 'Too many failed login attempts'),
      ),
    )
    renderRoute('/login')

    await fillLogin('ann@example.com', 'whatever1')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many failed attempts. Wait a few minutes and try again.',
    )
  })

  it('requires both fields before calling the API', async () => {
    renderRoute('/login')

    await userEvent.setup().click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Enter your email')).toBeInTheDocument()
    expect(screen.getByText('Enter your password')).toBeInTheDocument()
  })

  it('sends logged-in users away from the login page', () => {
    mockCurrentUser()
    startSession('token-1', 3600)
    renderRoute('/login')

    expect(screen.getByRole('heading', { name: 'Your books' })).toBeInTheDocument()
  })
})

describe('register', () => {
  it('creates the account, logs in and shows the home page', async () => {
    let registered: unknown
    server.use(
      http.post(`${API_URL}/api/auth/register`, async ({ request }) => {
        registered = await request.json()
        return HttpResponse.json(user, { status: 201 })
      }),
    )
    mockLogin()
    mockCurrentUser()
    renderRoute('/register')

    await fillRegister('ann@example.com', 'correct horse battery')

    expect(await screen.findByRole('heading', { name: 'Your books' })).toBeInTheDocument()
    expect(registered).toEqual({ email: 'ann@example.com', password: 'correct horse battery' })
    expect(getSession()?.accessToken).toBe('token-1')
  })

  it('shows when the email is already used', async () => {
    server.use(
      http.post(`${API_URL}/api/auth/register`, () =>
        problem(409, 'Conflict', 'Email already in use'),
      ),
    )
    renderRoute('/register')

    await fillRegister('ann@example.com', 'correct horse battery')

    expect(
      await screen.findByText('An account with this email already exists'),
    ).toBeInTheDocument()
  })

  it('shows API validation errors on their fields', async () => {
    server.use(
      http.post(`${API_URL}/api/auth/register`, () =>
        problem(400, 'Bad Request', 'Validation failed', {
          errors: [{ field: 'email', message: 'must be a well-formed email address' }],
        }),
      ),
    )
    renderRoute('/register')

    await fillRegister('ann@example.com', 'correct horse battery')

    expect(await screen.findByText('must be a well-formed email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('validates the password before calling the API', async () => {
    renderRoute('/register')

    await fillRegister('ann@example.com', 'short', 'different')

    expect(await screen.findByText('Use at least 8 characters')).toBeInTheDocument()
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
  })

  it('rejects passwords longer than 72 bytes', async () => {
    renderRoute('/register')

    // 25 three-byte characters: 25 characters but 75 bytes.
    await fillRegister('ann@example.com', '€'.repeat(25))

    expect(await screen.findByText('Password is too long')).toBeInTheDocument()
  })
})

describe('logged-in session', () => {
  it('logs out from the header', async () => {
    mockCurrentUser()
    startSession('token-1', 3600)
    renderRoute('/')

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Log out' }))

    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    expect(getSession()).toBeNull()
  })

  it('goes back to the login page when the API rejects the stored token', async () => {
    mockCurrentUser()
    startSession('revoked-token', 3600)
    renderRoute('/')

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    await waitFor(() => expect(getSession()).toBeNull())
  })
})
