import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'
import { getSession, subscribeToSession } from '../auth/session.ts'

type Props = { queryClient: QueryClient; children: ReactNode }

export function AppProviders({ queryClient, children }: Props) {
  // Drop cached data when the session ends so the next user never sees it.
  useEffect(
    () =>
      subscribeToSession(() => {
        if (!getSession()) queryClient.clear()
      }),
    [queryClient],
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
