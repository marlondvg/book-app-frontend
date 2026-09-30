import type { RouteObject } from 'react-router-dom'
import { GuestOnly } from './auth/GuestOnly.tsx'
import { RequireAuth } from './auth/RequireAuth.tsx'
import { Layout } from './components/Layout.tsx'
import { BooksPage } from './pages/BooksPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { RegisterPage } from './pages/RegisterPage.tsx'

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      {
        element: <GuestOnly />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [{ index: true, element: <BooksPage /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
