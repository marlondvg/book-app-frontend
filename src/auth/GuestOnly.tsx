import { Navigate, Outlet, useLocation, type Location } from 'react-router-dom'
import { useSession } from './session.ts'

/**
 * Route guard for the login and register pages: logged-in users go back to the page
 * RequireAuth sent them away from, or home. This is also how those pages redirect
 * after a successful login.
 */
export function GuestOnly() {
  const session = useSession()
  const location = useLocation()
  if (session) {
    const from = (location.state as { from?: Location } | null)?.from
    return <Navigate to={from ?? '/'} replace />
  }
  return <Outlet />
}
