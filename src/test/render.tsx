import { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { AppProviders } from '../components/AppProviders.tsx'
import { routes } from '../routes.tsx'

/** Renders the real route tree at `path` with a fresh, non-retrying query client. */
export function renderRoute(path = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const result = render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return { ...result, router }
}
