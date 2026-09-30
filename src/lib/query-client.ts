import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api-client.ts'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 4xx responses will not change on retry; only retry network and server errors.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status < 500) && failureCount < 2,
      },
    },
  })
}
