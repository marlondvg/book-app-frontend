import { Link, Outlet } from 'react-router-dom'
import { endSession, useSession } from '../auth/session.ts'
import { useCurrentUser } from '../auth/use-current-user.ts'
import './Layout.css'

export function Layout() {
  const session = useSession()

  return (
    <div className="layout">
      <header className="layout-header">
        <Link to="/" className="layout-brand">
          Book Tracker
        </Link>
        {session ? (
          <UserMenu />
        ) : (
          <nav className="layout-nav">
            <Link to="/login">Log in</Link>
            <Link to="/register">Create account</Link>
          </nav>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

function UserMenu() {
  const { data: user } = useCurrentUser()
  return (
    <div className="layout-nav">
      {user && <span className="layout-email">{user.email}</span>}
      <button type="button" className="secondary" onClick={endSession}>
        Log out
      </button>
    </div>
  )
}
