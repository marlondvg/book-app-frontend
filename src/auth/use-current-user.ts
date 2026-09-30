import { useQuery } from '@tanstack/react-query'
import { getCurrentUser } from './auth-api.ts'
import { useSession } from './session.ts'

export function useCurrentUser() {
  const session = useSession()
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: ({ signal }) => getCurrentUser(signal),
    enabled: session !== null,
    staleTime: Infinity,
  })
}
