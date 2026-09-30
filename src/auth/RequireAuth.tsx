import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from './session.ts'

/** Route guard: sends logged-out users to /login, remembering where they were going. */
export function RequireAuth() {
  const session = useSession()
  const location = useLocation()
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
