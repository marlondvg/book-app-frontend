# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend for a personal book reading tracker. The backend is `book-api`, a Spring Boot app in the sibling directory `../book-api`. Its `AGENTS.md` and `docs/specs/*.md` are the source of truth for endpoints, request/response shapes, status rules and error responses. Read the relevant spec before building a feature against the API.

Deployment target is Vercel. The live API is `https://book-api-oasv.onrender.com`, which runs on Render's free plan and can take about a minute to wake up.

## Commands

```bash
npm run dev                            # Vite dev server on http://localhost:5173
npm run build                          # tsc -b (type-check) then vite build
npm run lint                           # ESLint
npm test                               # Vitest in watch mode
npm test -- --run                      # all tests once (what CI runs)
npm test -- --run src/lib/api-client.test.ts   # a single file
npm test -- --run -t "problem details"         # tests whose name matches
```

CI (`.github/workflows/ci.yml`) runs lint, tests and build on every PR and on pushes to `main`.

To run against a local backend: `JWT_SECRET=$(openssl rand -base64 48) ./gradlew bootRun` in `../book-api`. The API's default CORS setting allows `http://localhost:5173`, so keep the Vite dev port. `VITE_API_URL` sets the API base URL (default `http://localhost:8080`). See `.env.example`, and put overrides in `.env.local`.

## Architecture

- `src/main.tsx` calls `initSession()`, then renders `AppProviders` (the React Query provider) and the browser router. `src/routes.tsx` holds the route tree as a plain `RouteObject[]`, so tests render the same tree with a memory router.
- `src/lib/api-client.ts`: every API call goes through `apiFetch<T>(path, { method, body })`.
  - It sends JSON and adds `Authorization: Bearer <token>` using the handlers registered with `configureAuth`. A 401 on a request that carried a token calls `onUnauthorized`. The client never imports auth code.
  - Any non-2xx response throws `ApiError`, built from the backend's RFC 9457 problem details: `status`, `title`, `detail`, and `fieldErrors` from the `errors` list returned on validation failures.
  - A 204 response resolves to `undefined`.
- `src/lib/query-client.ts`: queries don't retry on `ApiError` 4xx responses, only on network and 5xx errors.
- **Auth** (`src/auth/`):
  - `session.ts` is a small external store: the JWT and its expiry, saved in `localStorage` under `book-tracker.session`. Read it with `useSession()`; change it with `startSession` / `endSession`.
  - `initSession()` wires the store into `configureAuth`, so a 401 ends the session. It also ends the session when the token expires (1 hour, no refresh tokens) and syncs across tabs.
  - When the session ends, `AppProviders` clears the query cache.
  - Guards: `RequireAuth` wraps protected routes and redirects to `/login` with `state.from`. `GuestOnly` wraps `/login` and `/register` and sends logged-in users to `from` or `/`. The login and register pages never call `navigate()`: starting the session is enough to trigger the redirect.
  - Registering doesn't log in on the API side, so `RegisterPage` calls login right after.
  - The login rate limit returns 429. The API doesn't expose `Retry-After` through CORS, so the UI shows a generic "wait a few minutes" message.
- `src/lib/form-errors.ts`: `applyApiError(error, setError, fields)` puts API validation errors on matching form fields and everything else on `root.server`. `describeError` gives the message for network and 5xx errors.
- **Books** (`src/books/`): `types.ts` mirrors the API's `BookResponse` and `ReadingStatus` (`READING_STATUSES`, `STATUS_LABELS`). `books-api.ts` holds the API calls and `queries.ts` the React Query hooks. Query keys come from `bookKeys`; after any change to a book, invalidate `bookKeys.all`.
  - The status filter on the books page (`/`) is the `?status=` URL parameter, sent to the API as `GET /api/books?status=`. Unknown values show all books.
  - `BookForm` is shared by `/books/new` and `/books/:id/edit`. Its zod schema mirrors `BookDetailsRequest`: text is trimmed, blank optional fields become `null` (on `PUT`, `null` clears the field), pages is a positive int32, and cover URLs must be http(s). The form's input type (strings) differs from its output type (`BookDetails`), so it uses `useForm<z.input<…>, unknown, BookDetails>`.
  - Links into the form pass `{ returnTo }` router state (`ReturnToState`). `useReturnTo()` reads it, accepting only same-app paths and falling back to `/`, so saving or cancelling returns to the same list filter.
  - Saving a book puts it in the detail cache and marks lists stale without awaiting the refetch, so navigation isn't delayed.
  - `GET /api/books/{id}` answers 404 for missing or other users' books and 400 for an id that isn't a UUID. Treat both as "not found".
  - Dates from the API are `YYYY-MM-DD` strings. Format them as local calendar dates, not through `new Date(iso)`, which reads them as UTC and can shift the day.
- Pages go in `src/pages/`, shared components in `src/components/`. Styling is plain CSS files next to components, using the variables in `src/index.css`. `index.css` also has shared styles for `button` (and `a.button`, `button.secondary`) and `.form-error`.
- Forms: react-hook-form with zod v4 schemas through `@hookform/resolvers`. Keep schemas in line with the backend's Bean Validation rules.

## Testing

- Vitest with jsdom. `src/test/setup.ts` loads jest-dom matchers and starts a shared MSW server (`src/test/server.ts`) with `onUnhandledRequest: 'error'`, so any request a test doesn't mock fails the test.
- Mock the API with `server.use(http.get(`${API_URL}/api/...`, ...))`. `API_URL` is `http://api.test`, forced through `test.env` in `vite.config.ts`, so tests ignore local `.env` files. Handlers reset after each test.
- `renderRoute(path)` in `src/test/render.tsx` renders the real route tree with a fresh query client that doesn't retry. To render a page as a logged-in user, call `startSession('token', 3600)` first and mock `GET /api/users/me` (the header fetches it). The setup ends the session and clears `localStorage` after each test. `makeBook(overrides)` in `src/test/books.ts` builds API-shaped books.
- Import `describe`/`it`/`expect` from `vitest` (globals are off).

## TypeScript / lint constraints

`tsconfig.app.json` (it covers `src/`) enables:
- `verbatimModuleSyntax`: type-only imports must use `import type`.
- `erasableSyntaxOnly`: no `enum`, `namespace`, or constructor parameter properties. Use union types or `as const` objects.
- `noUnusedLocals` / `noUnusedParameters`: unused code fails `npm run build`, not just lint.
- Relative imports use explicit `.ts`/`.tsx` extensions.

ESLint enforces `react-hooks` rules and `react-refresh` (component files should export only components). Lint is not type-aware.

## Workflow

Same conventions as the backend: Conventional Commits (`feat:`, `fix:`, `chore:`, ...), one feature per `feat/<name>` or `chore/<name>` branch and PR, never commit directly to `main`.
