import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import './index.css'
import { initSession } from './auth/session.ts'
import { AppProviders } from './components/AppProviders.tsx'
import { createQueryClient } from './lib/query-client.ts'
import { routes } from './routes.tsx'

initSession()
const queryClient = createQueryClient()
const router = createBrowserRouter(routes)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
