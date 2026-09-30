import { Link, Outlet } from 'react-router-dom'
import './Layout.css'

export function Layout() {
  return (
    <div className="layout">
      <header className="layout-header">
        <Link to="/" className="layout-brand">
          Book Tracker
        </Link>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
