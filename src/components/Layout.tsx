import { Link, Outlet } from 'react-router-dom'
import { endSession, useSession } from '../auth/session.ts'
import { useCurrentUser } from '../auth/use-current-user.ts'
import { ThemeToggle } from '../theme/ThemeToggle.tsx'
import './Layout.css'

export function Layout() {
  const session = useSession()

  return (
    <>
      <header className="layout-header">
        <div className="layout-container layout-header-inner">
          <Link to="/" className="layout-brand">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 5.5C3 4.7 3.7 4 4.5 4H9a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4.5A1.5 1.5 0 0 1 3 16z" />
              <path d="M21 5.5c0-.8-.7-1.5-1.5-1.5H15a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5h5a1.5 1.5 0 0 0 1.5-1.5z" />
            </svg>
            Book Tracker
          </Link>
          <div className="layout-nav">
            {session ? (
              <UserMenu />
            ) : (
              <>
                <Link to="/login">Log in</Link>
                <Link to="/register">Create account</Link>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="layout-container layout-main">
        <Outlet />
      </main>
    </>
  )
}

function UserMenu() {
  const { data: user } = useCurrentUser()
  return (
    <>
      {user && <span className="layout-email">{user.email}</span>}
      <button type="button" className="header-button" onClick={endSession}>
        Log out
      </button>
    </>
  )
}
