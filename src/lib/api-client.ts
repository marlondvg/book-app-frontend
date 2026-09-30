const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export type FieldError = { field: string; message: string }

/** Error thrown for any non-2xx response, built from the API's RFC 9457 problem details. */
export class ApiError extends Error {
  readonly status: number
  readonly title: string
  readonly detail: string | undefined
  readonly fieldErrors: FieldError[]

  constructor(status: number, title: string, detail?: string, fieldErrors: FieldError[] = []) {
    super(detail ?? title)
    this.name = 'ApiError'
    this.status = status
    this.title = title
    this.detail = detail
    this.fieldErrors = fieldErrors
  }
}

type TokenProvider = () => string | null

let getToken: TokenProvider = () => null

/** Lets the auth layer supply the current access token without the client depending on it. */
export function setTokenProvider(provider: TokenProvider) {
  getToken = provider
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' })
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  })

  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function toApiError(response: Response): Promise<ApiError> {
  const problem = await response.json().catch(() => null)
  if (problem === null || typeof problem !== 'object') {
    return new ApiError(response.status, response.statusText || 'Request failed')
  }
  return new ApiError(
    response.status,
    typeof problem.title === 'string' ? problem.title : response.statusText,
    typeof problem.detail === 'string' ? problem.detail : undefined,
    Array.isArray(problem.errors) ? problem.errors : [],
  )
}
